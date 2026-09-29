/**
 * MotionThumb —— Segmented 的滑块（thumb）动画。
 *
 * 契约来源：`@rc-component/segmented@1.4.0` 的 `es/MotionThumb.js`（产物实测）。
 *
 * ── 机制（最容易做错的部分）──────────────────────────────────────────────────
 *
 * rc 的 thumb 是「每次动画 = 一次完整卸载/挂载/appear」：
 *   1. value 变化 → layout effect 里找前后两个 item 元素（按 index），测
 *      offsetLeft/offsetWidth（垂直时 offsetTop/offsetHeight）。
 *   2. 前后元素都找到 → onMotionStart（父组件置 thumbShow=true，撤 `-item-selected`
 *      的实底，只剩 `-item-selected-text` 的文字色）；任一找不到（如首帧、
 *      元素隐藏 offsetParent 为 null）→ onMotionEnd。
 *   3. prevStyle && nextStyle 都存在才渲染 thumb（否则 return null —— 卸载）。
 *   4. thumb 挂载触发 CSSMotion 的 appear：start 帧贴 prev 位置（CSS 变量），
 *      active 帧过渡到 next 位置（transform + width/height）。
 *   5. 动画结束 onVisibleChanged → 清 prev/nextStyle → 卸载 → onMotionEnd。
 *
 * RTL：水平方向用 `translateX(−right)`（右侧锚定）。
 *
 * 与 antd 的等价差异（PLATFORM）：React 的 useLayoutEffect 在浏览器绘制前同步
 * 执行；Vue 用 `watch + nextTick`（flush 后 DOM 已更新），测量时机等价。
 */

import {
  CSSMotion,
  type CSSMotionSlotProps,
  type MotionHooks,
  type MotionStyle,
} from '@apollo-design/motion';
import {
  computed,
  defineComponent,
  h,
  nextTick,
  type PropType,
  type Ref,
  shallowRef,
  watch,
} from 'vue';

/** 单边测量值（px）。 */
interface ThumbMeasure {
  left: number;
  right: number;
  width: number;
  top: number;
  bottom: number;
  height: number;
}

/** 与 rc 的 calcThumbStyle 对齐：垂直时只用 top/height，水平时只用 left/width。 */
function calcThumbStyle(el: HTMLElement | null, vertical: boolean): ThumbMeasure | null {
  if (!el) return null;
  const parent = el.parentElement;
  if (!parent) return null;
  if (vertical) {
    return {
      left: 0,
      right: 0,
      width: 0,
      top: el.offsetTop,
      bottom: parent.clientHeight - el.clientHeight - el.offsetTop,
      height: el.clientHeight,
    };
  }
  return {
    left: el.offsetLeft,
    right: parent.clientWidth - el.clientWidth - el.offsetLeft,
    width: el.clientWidth,
    top: 0,
    bottom: 0,
    height: 0,
  };
}

const toPX = (value: number | undefined): string | undefined =>
  value !== undefined ? `${value}px` : undefined;

export const MotionThumb = defineComponent({
  name: 'AMotionThumb',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    containerRef: { type: Object as PropType<Ref<HTMLElement | null>>, required: true },
    value: {
      type: [String, Number] as PropType<string | number | undefined>,
      default: undefined,
    },
    /** 取 value → 选项 index。 */
    getValueIndex: {
      type: Function as PropType<(val: string | number | undefined) => number>,
      required: true,
    },
    motionName: { type: String, required: true },
    vertical: { type: Boolean, default: false },
    direction: { type: String as PropType<'ltr' | 'rtl' | undefined>, default: undefined },
    supportMotion: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    onMotionStart: { type: Function as PropType<() => void>, default: undefined },
    onMotionEnd: { type: Function as PropType<() => void>, default: undefined },
  },
  setup(props) {
    const prevStyle = shallowRef<ThumbMeasure | null>(null);
    const nextStyle = shallowRef<ThumbMeasure | null>(null);
    /** 上一次渲染使用的 value（rc 的 prevValue 判据：仅跨值才动画）。 */
    let prevValue = props.value;

    /** 与 rc 的 findValueElement 对齐：按 index 找 item 元素；offsetParent 为空视为不可动画。 */
    const findValueElement = (val: string | number | undefined): HTMLElement | null => {
      const index = props.getValueIndex(val);
      const items = props.containerRef.value?.querySelectorAll<HTMLElement>(
        `.${props.prefixCls}-item`,
      );
      const ele = items?.[index];
      return ele?.offsetParent ? ele : null;
    };

    watch(
      () => props.value,
      (value) => {
        if (prevValue === value) return;
        nextTick(() => {
          const prev = findValueElement(prevValue);
          const next = findValueElement(value);
          const calcPrev = calcThumbStyle(prev, props.vertical);
          const calcNext = calcThumbStyle(next, props.vertical);
          prevValue = value;
          if (calcPrev && calcNext) {
            prevStyle.value = calcPrev;
            nextStyle.value = calcNext;
            props.onMotionStart?.();
          } else {
            props.onMotionEnd?.();
          }
        });
      },
    );

    // ---- CSS 变量值（rc 的 thumbStart / thumbActive）----
    const cssVars = computed<Record<string, string | undefined>>(() => {
      const prev = prevStyle.value;
      const next = nextStyle.value;
      if (!prev || !next) return {};
      if (props.vertical) {
        return {
          '--thumb-start-top': toPX(prev.top) ?? '0px',
          '--thumb-start-height': toPX(prev.height),
          '--thumb-active-top': toPX(next.top) ?? '0px',
          '--thumb-active-height': toPX(next.height),
        };
      }
      if (props.direction === 'rtl') {
        return {
          '--thumb-start-left': toPX(-(prev.right ?? 0)) ?? '0px',
          '--thumb-start-width': toPX(prev.width),
          '--thumb-active-left': toPX(-(next.right ?? 0)) ?? '0px',
          '--thumb-active-width': toPX(next.width),
        };
      }
      return {
        '--thumb-start-left': toPX(prev.left),
        '--thumb-start-width': toPX(prev.width),
        '--thumb-active-left': toPX(next.left),
        '--thumb-active-width': toPX(next.width),
      };
    });

    const hooks: MotionHooks = {
      onAppearStart: (): MotionStyle =>
        props.vertical
          ? {
              transform: 'translateY(var(--thumb-start-top))',
              height: 'var(--thumb-start-height)',
            }
          : {
              transform: 'translateX(var(--thumb-start-left))',
              width: 'var(--thumb-start-width)',
            },
      onAppearActive: (): MotionStyle =>
        props.vertical
          ? {
              transform: 'translateY(var(--thumb-active-top))',
              height: 'var(--thumb-active-height)',
            }
          : {
              transform: 'translateX(var(--thumb-active-left))',
              width: 'var(--thumb-active-width)',
            },
      onVisibleChanged: () => {
        prevStyle.value = null;
        nextStyle.value = null;
        props.onMotionEnd?.();
      },
    };

    return () => {
      // rc 判据：prevStyle / nextStyle 缺一就不渲染（无动画队列时不挂 thumb）
      const prev = prevStyle.value;
      const next = nextStyle.value;
      if (!prev || !next) return null;

      return h(
        CSSMotion,
        {
          visible: true,
          motionName: props.motionName,
          motionAppear: true,
          hooks,
          supportMotion: props.supportMotion,
        },
        {
          default: (slotProps: CSSMotionSlotProps) =>
            h('div', {
              class: [`${props.prefixCls}-thumb`, slotProps.className],
              style: { ...slotProps.style, ...cssVars.value },
              // 测试观测点（rc 的 data-test-style 同判）
              'data-test-style': JSON.stringify(cssVars.value),
            }),
        },
      );
    };
  },
});

export default MotionThumb;
