/**
 * 时间面板的时间列（`<ul>` + `<li>` 列表）。
 *
 * 上游：`es/PickerPanel/TimePanel/TimePanelBody/TimeColumn.js`（135 行）与
 * `es/PickerPanel/TimePanel/TimePanelBody/useScrollTo.js`（69 行）。
 *
 * ── 这个组件做了两件与其它面板都不同的事 ──────────────────────────────────────
 *
 * 1. **自己滚到当前值**（`syncScroll`）：用 `requestAnimationFrame` 逐帧逼近，
 *    每帧走剩余距离的 `1/3`（`SPEED_PTG`），且**屏幕上出现「距离反而变大」就立刻停**
 *    —— 那是用户在手动滚。判据是 `scrollDistRef`，不能省。
 * 2. **`changeOnScroll`**：滚动停下 `300ms` 后，把「离滚动位置最近的那一格」选上
 *    （禁用格被排除，见 `time-tmpl.ts` 的 `getNearestUnitIndex`）。
 *
 * ⚠️ 两条**只在真浏览器里成立**的东西，jsdom 下必须能优雅退化：
 *  - `ul.scrollTop` 在 jsdom 里是 0 且不可写（赋值被忽略）⇒ `startScroll` 会一直
 *    「距离变小」但永远不到 1 ⇒ 必须在**目标格不存在**时直接返回（上游有这条：
 *    `if (targetLi && firstLi) doScroll()`），否则 rAF 永不停止；
 *  - `ul.querySelector('li').offsetTop` 恒为 0 ⇒ `changeOnScroll` 选出的永远是第 0 格。
 *    这是 jsdom 的固有局限，L2 用例因此只断言「回调被调用」而不断言选中的是哪一格。
 */

import { cancelRaf, raf } from '@apollo-design/utils';
import { defineComponent, h, nextTick, onBeforeUnmount, type PropType, ref, watch } from 'vue';
import { type PanelDateType, usePanelInfo } from './panel-context';
import { getNearestUnitIndex, type MeridiemUnit } from './time-tmpl';
import type { TimeColumnUnit } from './time-units';

/**
 * 一列里的档位 —— 数字档位（时 / 分 / 秒 / 毫秒）与上下午档位（`'am'` / `'pm'`）的联合。
 *
 * ⚠️ 上游用一个泛型 `Unit<DateType>` 同时表达两者；本仓在组件层用**显式联合**，
 * 因为 `defineComponent` 的 props 无法参数化（见 `panel-context.ts` 文件头）。
 */
export type ColumnUnit = TimeColumnUnit | MeridiemUnit;

/** 滚动停止多久后才提交选中（上游 `SCROLL_DELAY`）。 */
const SCROLL_DELAY = 300;
/** 每帧前进剩余距离的比例（上游 `SPEED_PTG`）。 */
const SPEED_PTG = 1 / 3;
/** 目标格还没上屏时最多重试多少帧（上游注释：5 frames is enough）。 */
const MAX_SCROLL_RETRY = 5;

/**
 * 把档位表压成一个「变化指纹」。
 *
 * ⚠️ 上游明确写了 *"Not use JSON.stringify to avoid dead loop"* —— `units` 每次渲染
 * 都是新数组，用引用比较会死循环；用 `JSON.stringify` 又会因为对象属性顺序之外的
 * 原因（比如 `undefined`）产生不稳定字符串。它选的指纹是 `value,label,disabled` 三项
 * 用 `,` 与 `;` 连接。
 */
export function flattenUnits(units: readonly ColumnUnit[]): string {
  return units.map(({ value, label, disabled }) => [value, label, disabled].join(',')).join(';');
}

export type TimeColumnType = 'hour' | 'minute' | 'second' | 'millisecond' | 'meridiem';

export const TimeColumn = defineComponent({
  name: 'ApolloPickerTimeColumn',
  props: {
    units: { type: Array as PropType<ColumnUnit[]>, required: true as const },
    /** 当前值（`null` = 未选） */
    value: { type: [Number, String] as PropType<number | string | null>, default: null },
    /** 面板浏览值（`value` 为空时的对齐目标） */
    optionalValue: {
      type: [Number, String] as PropType<number | string | null>,
      default: null,
    },
    type: { type: String as PropType<TimeColumnType>, required: true },
    onChange: {
      type: Function as PropType<(value: never) => void>,
      required: true,
    },
    onHover: {
      type: Function as PropType<(value: never | null) => void>,
      required: true,
    },
    /** 双击（RangePicker 的「选完两段就关」） */
    onDblClick: {
      type: Function as PropType<(() => void) | undefined>,
      default: undefined,
    },
    changeOnScroll: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  },
  setup(props) {
    const ulRef = ref<HTMLUListElement | null>(null);
    let scrollRafId: number | null = null;
    let delayTimer: ReturnType<typeof setTimeout> | undefined;
    let scrolling = false;
    let lastDist: number | null = null;
    let retryTimes = 0;

    const stopScroll = (): void => {
      if (scrollRafId !== null) {
        cancelRaf(scrollRafId);
        scrollRafId = null;
      }
      scrolling = false;
    };

    const clearDelayCheck = (): void => {
      if (delayTimer !== undefined) {
        clearTimeout(delayTimer);
        delayTimer = undefined;
      }
    };

    /** 逐帧逼近目标格（上游 `startScroll`）。 */
    const startScroll = (): void => {
      const ul = ulRef.value;
      lastDist = null;

      /**
       * 🚨 **`ulRef` 为空时必须重排一帧**（PITFALLS 318，2026-10-02 真浏览器实测）。
       *
       * 上面那个 `watch` 的 `immediate` 回调**跑在本组件自己的渲染之前** ——
       * 实测日志顺序是「setup 入口 → startScroll(hasUl=false) → watch 已注册」。
       * 也就是说它调 `startScroll()` 时 `ulRef.value` 还是 `null`；
       * 而 `value` / `optionalValue` / `units` 此后都不再变化 ⇒ **watch 永不重跑**
       * ⇒ 时间列**永远停在 `scrollTop = 0`**。
       *
       * 实测（`tests/visual/debug/probe-timepicker-scroll.mjs`）：
       * react 的 `scrollTop` 是 336/840/1260，vue 是 **0/0/0**，且 +2.6s 后仍是 0
       * ⇒ 不是「截图早于动画收敛」，是**从未滚动**。
       *
       * ⚠️ 为什么这个 bug 潜伏了很久：`date-picker` 的 `datetime` 变体时间值是 `00`
       * ⇒ `targetLi === firstLi` ⇒ 在下一个守卫处就 return（**根本不需要滚**）⇒ 恒不触发。
       * 任何「时间值非零」的消费者都会撞上它。
       *
       * ⚠️ 用 **`nextTick`** 而不是 `raf`：这里的语义是「等这次渲染 flush 结束」
       * （`nextTick` 恰好是这个含义），**不是**「等一帧动画」。
       * 用 `raf` 还会污染测试里被 mock 的帧队列
       * （`panel-edge.test.ts` 用 `captureRaf()` 数帧，多出来的这一帧会打乱计数）。
       * ⚠️ 重试有上限 —— 隐藏的列不该空转。
       */
      if (!ul) {
        if (retryTimes < MAX_SCROLL_RETRY) {
          retryTimes += 1;
          void nextTick(startScroll);
        }
        return;
      }
      retryTimes = 0;

      const targetValue = props.value ?? props.optionalValue;
      const targetLi = ul.querySelector<HTMLElement>(`[data-value="${String(targetValue)}"]`);
      const firstLi = ul.querySelector<HTMLElement>('li');

      // ⚠️ 上游的守卫：目标格不存在就**什么都不做**。
      //    没有这条，jsdom（`scrollTop` 写不进去）会让 rAF 永久自转。
      if (!targetLi || !firstLi || targetLi === firstLi) {
        return;
      }

      const doScroll = (): void => {
        stopScroll();
        scrolling = true;
        retryTimes += 1;

        const currentTop = ul.scrollTop;
        const firstLiTop = firstLi.offsetTop;
        const targetLiTop = targetLi.offsetTop;
        const targetTop = targetLiTop - firstLiTop;

        // 等目标格上屏（最多 5 帧）
        if (targetLiTop === 0 && targetLi !== firstLi) {
          if (retryTimes <= MAX_SCROLL_RETRY) {
            scrollRafId = raf(doScroll);
          }
          return;
        }

        // ⚠️ 这里少一条上游的判断：`|| !isVisible(ul)`。
        //    `isVisible` 属 `ui` 层（需要真实布局），本包不引入；效果差异只在
        //    「列被隐藏时是否空转 rAF」，而隐藏列本来就不该出现在时间面板里。
        const nextTop = currentTop + (targetTop - currentTop) * SPEED_PTG;
        const dist = Math.abs(targetTop - nextTop);

        // 距离变大 ⇒ 用户在手动滚 ⇒ 让位
        if (lastDist !== null && lastDist < dist) {
          stopScroll();
          return;
        }
        lastDist = dist;

        if (dist <= 1) {
          ul.scrollTop = targetTop;
          stopScroll();
          return;
        }

        ul.scrollTop = nextTop;
        scrollRafId = raf(doScroll);
      };

      doScroll();
    };

    /** 滚动停下 300ms 后提交最近的一格（上游 `onInternalScroll` 的回调体）。 */
    const onInternalScroll = (event: Event): void => {
      clearDelayCheck();
      const target = event.target as HTMLUListElement;

      if (scrolling || !props.changeOnScroll) {
        return;
      }

      delayTimer = setTimeout(() => {
        const ul = ulRef.value;
        if (!ul) {
          return;
        }
        const firstLi = ul.querySelector<HTMLElement>('li');
        if (!firstLi) {
          return;
        }
        const firstLiTop = firstLi.offsetTop;
        const liList = [...ul.querySelectorAll<HTMLElement>('li')];
        const liTopList = liList.map((li) => li.offsetTop - firstLiTop);

        const index = getNearestUnitIndex(props.units, liTopList, target.scrollTop);
        const targetUnit = props.units[index];
        if (targetUnit && !targetUnit.disabled) {
          props.onChange(targetUnit.value as never);
        }
      }, SCROLL_DELAY);
    };

    // 值与档位表变了就重新对齐（上游 `useLayoutEffect` 的依赖数组）
    watch(
      [() => props.value, () => props.optionalValue, () => flattenUnits(props.units)],
      () => {
        startScroll();
        clearDelayCheck();
      },
      { immediate: true, flush: 'post' },
    );

    onBeforeUnmount(() => {
      stopScroll();
      clearDelayCheck();
    });

    return () => {
      const ctx = usePanelInfo().value;
      const { prefixCls, classNames, styles, cellRender, now, locale } = ctx;

      const panelPrefixCls = `${prefixCls}-time-panel`;
      const cellPrefixCls = `${panelPrefixCls}-cell`;
      const columnPrefixCls = `${panelPrefixCls}-column`;

      return h(
        'ul',
        {
          class: columnPrefixCls,
          ref: ulRef,
          'data-type': props.type,
          onScroll: onInternalScroll,
        },
        props.units.map(({ label, value: unitValue, disabled }) => {
          const inner = h('div', { class: `${cellPrefixCls}-inner` }, [label]);
          return h(
            'li',
            {
              key: unitValue,
              style: styles.item,
              class: [
                cellPrefixCls,
                classNames.item,
                {
                  [`${cellPrefixCls}-selected`]: props.value === unitValue,
                  [`${cellPrefixCls}-disabled`]: disabled,
                },
              ],
              onClick: () => {
                if (!disabled) {
                  props.onChange(unitValue as never);
                }
              },
              onDblclick: () => {
                if (!disabled && props.onDblClick) {
                  props.onDblClick();
                }
              },
              onMouseenter: () => {
                props.onHover(unitValue as never);
              },
              onMouseleave: () => {
                props.onHover(null as never);
              },
              'data-value': unitValue,
            },
            [
              cellRender
                ? cellRender(unitValue as unknown as PanelDateType, {
                    prefixCls,
                    originNode: inner,
                    today: now,
                    type: 'time',
                    subType: props.type,
                    locale,
                  })
                : inner,
            ],
          );
        }),
      );
    };
  },
});
