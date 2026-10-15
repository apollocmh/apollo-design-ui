/**
 * BorderBeam —— 宿主边缘的流光描边。
 *
 * 契约来源：antd 6.6.4 的 `es/border-beam/BorderBeam.js` + `BorderBeamEffect.js` +
 * `hooks/`（判据逐条对齐，见 docs/analysis/border-beam.md §2）。
 *
 * ── 为什么是 render 函数 ──────────────────────────────────────────────────────
 *
 * 渲染结构是 `Fragment = clone(child, ref) + count × <Teleport to=hostDom>`，
 * cloneVNode 注入 ref 与 Teleport 都要拿到 vnode/DOM 对象本身，SFC 模板表达不了
 * （spin/Indicator、badge/ScrollNumber 同范式）。
 *
 * ── 五条最容易写错的判据 ─────────────────────────────────────────────────────
 *
 *   1. **CSS 变量挂在 Effect 的 style 上**（不是宿主）—— 变量名
 *      `--{root}-border-beam-*` 与 style/index.ts 的 varRef 配对。
 *   2. **delay 错相**：index>0 时 `-{duration * index / count}s`（负延迟均分相位）。
 *   3. **inset-offset**：outset 非空 → 四边统一；否则按宿主 computed border 四边
 *      各自取负（数字 `-${n}px`，字符串 `calc(-1 * ${s})`）。
 *   4. **宿主不可用（纯文本等）→ 只渲染 child 本身，无 Effect**。
 *   5. **count 归一**：有限且 ≥1 取整，否则 1。
 */

import { isNonNullable, isNumber, isString } from '@apollo-design/utils';
import {
  computed,
  createVNode,
  defineComponent,
  h,
  isRef,
  isVNode,
  mergeProps,
  onMounted,
  onScopeDispose,
  type PropType,
  shallowRef,
  type VNode,
  type VNodeChild,
} from 'vue';
import { useComponentConfig } from '../config-provider/context';
import { subscribeBorderSample } from './border-sampler';
import type { BorderBeamColor, BorderBeamProps } from './interface';
import { DEFAULT_BORDER_BEAM_DURATION, getBorderBeamGradient, isSameBorderWidth } from './util';

/** 数字 → `-${n}px`；字符串 → `calc(-1 * ${s})`（antd 的 getInset 逐字）。 */
const getInset = (width: number | string): string =>
  isString(width) ? `calc(-1 * ${width})` : `-${width}px`;

/**
 * 合并宿主的原始 children 与要注入的 Effect（Issue #56）。
 *
 * ⚠️ 三种形态**不能一把打包成数组**：
 *   1. 数组 / 单个 vnode / 字符串 —— DOM 宿主的常规形态 ⇒ 追加在末尾；
 *   2. **slots 对象**（组件子节点的内容经插槽传入）⇒ 打包成数组会让
 *      `createVNode(Comp, props, [slotsObj])` 走 `ARRAY_CHILDREN` 而不是 `SLOTS_CHILDREN`
 *      ⇒ 组件拿不到任何插槽，**内容整块丢失**（实测抓到，语义用例 `.inner` 找不到）。
 *      改为把 Effect 并进 `default` 插槽的输出末尾 —— 组件的默认插槽通常渲染在它的宿主
 *      元素内，DOM 结果与上游 `createPortal(effect, hostDom)` 一致；
 *   3. `null` / `''` ⇒ 只渲染 Effect。
 *
 * ⚠️ 边界（写在 README 差异表）：组件**没有** `default` 插槽时无处注入 ⇒ 保持原 children
 *    （Effect 不渲染）；上游的 portal 不受此限。
 */
function mergeHostChildren(
  original: VNodeChild | VNodeChild[] | null,
  injected: VNodeChild[],
): VNodeChild {
  // 空内容（`null` / `undefined` / 空串 / `false`）⇒ 只渲染 Effect
  if (original === null || original === undefined || original === '' || original === false) {
    return injected;
  }
  if (Array.isArray(original)) {
    return [...original, ...injected];
  }
  if (isVNode(original) || typeof original === 'string' || typeof original === 'number') {
    return [original, ...injected];
  }
  // 剩下的只可能是 slots 对象（`{ default: fn, ... }`）
  const slotsObj = original as unknown as Record<string, unknown>;
  if (injected.length === 0) {
    return original;
  }
  const originalDefault = slotsObj.default as ((...args: unknown[]) => unknown) | undefined;
  if (typeof originalDefault !== 'function') {
    return original;
  }
  return {
    ...slotsObj,
    default: (...args: unknown[]) => {
      const out = originalDefault(...args);
      const list = Array.isArray(out) ? out : out === null || out === undefined ? [] : [out];
      return [...list, ...injected];
    },
  } as unknown as VNodeChild;
}

/** useBorderSize：读宿主 computed border 宽度 4 元组（antd 逐字，NaN→0）。 */
function useBorderSize(getDom: () => HTMLElement | null) {
  const DEFAULT_BORDER_WIDTH = [0, 0, 0, 0] as const;
  const borderWidth = shallowRef<readonly number[]>(DEFAULT_BORDER_WIDTH);

  const normalizeValue = (val: string | null): number => {
    const size = Number.parseFloat(val ?? '');
    return isNumber(size) ? size : 0;
  };

  let unsubscribe: (() => void) | undefined;
  onMounted(() => {
    unsubscribe = watchHost();
  });
  onScopeDispose(() => unsubscribe?.());

  function watchHost(): () => void {
    // host 是 ref 赋值（挂载后）才有 —— 与 antd 的 useEffect [domNode] 对齐
    const read = () => {
      const domNode = getDom();
      if (!domNode) {
        if (!isSameBorderWidth(borderWidth.value, DEFAULT_BORDER_WIDTH)) {
          borderWidth.value = DEFAULT_BORDER_WIDTH;
        }
        return;
      }
      const style = getComputedStyle(domNode);
      const next = [
        normalizeValue(style.borderTopWidth),
        normalizeValue(style.borderRightWidth),
        normalizeValue(style.borderBottomWidth),
        normalizeValue(style.borderLeftWidth),
      ] as const;
      if (!isSameBorderWidth(borderWidth.value, next)) {
        borderWidth.value = next;
      }
    };
    read();
    // border 宽度变化（响应式布局）跟随 —— 上游没有监听场景，本仓用轻量轮询；
    // ⚠️ 多实例**共享**同一个 500ms 定时器 + 隐藏页整轮跳过（Issue #50，见 border-sampler.ts）
    return subscribeBorderSample(read);
  }

  return borderWidth;
}

export default defineComponent({
  name: 'ABorderBeam',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    // 语义化槽位（本仓自有 API，替代下面两个 deprecated 的 React 名）
    classNames: {
      type: Object as PropType<BorderBeamProps['classNames']>,
      default: undefined,
    },
    styles: { type: Object as PropType<BorderBeamProps['styles']>, default: undefined },
    /** @deprecated 用 `classNames.effect`。 */
    className: { type: String, default: undefined },
    /** @deprecated 用 `styles.effect`。 */
    style: { type: Object as PropType<Record<string, string | number>>, default: undefined },
    color: {
      type: [String, Array] as PropType<BorderBeamColor>,
      default: undefined,
    },
    count: { type: Number, default: undefined },
    duration: { type: Number, default: undefined },
    lineWidth: { type: [Number, String] as PropType<number | string>, default: undefined },
    outset: { type: [Number, String] as PropType<number | string>, default: undefined },
    size: { type: [Number, String] as PropType<number | string>, default: undefined },
  },
  setup(props, { attrs, slots }) {
    const {
      getPrefixCls,
      className: contextClassName,
      style: contextStyle,
    } = useComponentConfig<Record<string, never>>('borderBeam');

    const prefixCls = computed(() => getPrefixCls('border-beam', props.prefixCls));
    const rootPrefix = computed(() => getPrefixCls());

    const hostDom = shallowRef<HTMLElement | null>(null);
    const borderWidth = useBorderSize(() => hostDom.value);

    const beamGradient = computed(() => getBorderBeamGradient(props.color));
    const mergedCount = computed(() =>
      isNumber(props.count) && Number.isFinite(props.count) && props.count >= 1
        ? Math.floor(props.count)
        : 1,
    );
    const mergedDuration = computed(() =>
      isNumber(props.duration) && props.duration > 0
        ? props.duration
        : DEFAULT_BORDER_BEAM_DURATION,
    );

    const insetOffset = computed(() => {
      if (isNonNullable(props.outset)) {
        return getInset(props.outset);
      }
      return borderWidth.value.map(getInset).join(' ');
    });

    /** 数字补 px（Vue patchStyle 不转换）；字符串原样。 */
    const unit = (value: number | string): string => (isNumber(value) ? `${value}px` : value);

    /** 每条 Effect 的样式：运行时 CSS 变量 + 上下文/用户样式（合并顺序同 antd）。 */
    const effectStyle = (index: number): Record<string, string | number> => {
      // 变量名与 style/index.ts 的 cssVar() 配对：`--{root}-border-beam-{name}`
      const v = (name: string): string => `--${rootPrefix.value}-border-beam-${name}`;
      return {
        ...(contextStyle ?? {}),
        // 语义槽在前、deprecated 的 React 名在后（后者覆盖前者，旧代码行为不变）
        ...((props.styles?.effect as Record<string, string | number> | undefined) ?? {}),
        ...(props.style ?? {}),
        ...(beamGradient.value ? { [v('beam-gradient')]: beamGradient.value } : {}),
        ...(isNumber(props.duration) && props.duration > 0
          ? { [v('duration')]: `${props.duration}s` }
          : {}),
        ...(isNonNullable(props.lineWidth) ? { [v('line-width')]: unit(props.lineWidth) } : {}),
        ...(isNonNullable(props.size) ? { [v('size')]: unit(props.size) } : {}),
        ...(index > 0
          ? { [v('delay')]: `${(-mergedDuration.value * index) / mergedCount.value}s` }
          : {}),
        [v('inset-offset')]: insetOffset.value,
      };
    };

    return () => {
      // ⚠️ 函数插槽返回单 vnode 时不是数组 —— 必须归一化（同 Base.ts 的 toNodeList）
      const raw = slots.default?.() as VNode[] | VNode | undefined;
      const childNodes = Array.isArray(raw) ? raw : raw !== undefined ? [raw] : [];
      const first = childNodes[0];
      // 纯文本等不可挂 ref 的 children：原样透传，无 Effect（antd 的 supportRef 判据）
      if (!first || typeof first.type === 'symbol') {
        return first ?? null;
      }

      const cls = [prefixCls.value, contextClassName, props.classNames?.effect, props.className];
      const effects = Array.from({ length: mergedCount.value }, (_, index) =>
        h('div', {
          key: index,
          'aria-hidden': 'true',
          class: cls,
          style: effectStyle(index),
        }),
      );

      // antd 用 createPortal(el, hostDom) 把 Effect 挂进宿主 DOM **内部** ——
      // `position:absolute` 才以宿主为包含块（border-radius:inherit 同理）。
      // Vue 侧等价做法：重建宿主 vnode（createVNode 同型拷贝），children 追加
      // Effect —— DOM 结果与 portal 一致，且不依赖 Teleport 的目标时机。
      // ⚠️ 首帧（含 SSR）hostDom 未挂载 → 不渲染 Effect（与 antd 的 portal 时机一致）。
      const originalChildren = first.children as VNodeChild | VNodeChild[] | null;
      const injectedChildren: VNodeChild[] = hostDom.value ? effects : [];
      const newChildren = mergeHostChildren(originalChildren, injectedChildren);
      // 🚨 调用方的 attrs（`data-*` / `aria-*` / `class` / `style` / 原生事件）**落到宿主**上。
      //
      // 本组件是 **renderless**（没有自己的 DOM 根，装饰的是子节点那个元素）⇒ attrs 唯一的
      // 合理落点就是宿主。此前是 `inheritAttrs: false` 且**从不读 attrs** ⇒ 用户传的
      // `data-*` / `aria-*` 全部静默丢弃（registry `VNA-ATTRS-01`）。
      //
      // ⚠️ 用 `mergeProps`（不是对象展开）：`class` / `style` 需要**叠加**而不是后者覆盖前者；
      //    顺序 = 调用方 attrs 在前、宿主自己的 props 在后 ⇒ 宿主原有的 class/style 不被顶掉。
      const hostProps = mergeProps(attrs, first.props ?? {});
      // 🚨 `first.ref` 是 Vue **归一化后**的对象（`{ i, r, k, f }`），**不是**用户传的那个函数
      //    ⇒ 直接 `typeof first.ref === 'function'` 永远为假、用户的 ref 被静默丢弃
      //    （Issue #56 实测抓到）。原始值在 `first.props.ref` 上。
      const rawRef = (first.props as Record<string, unknown> | null | undefined)?.ref;

      return createVNode(
        first.type,
        {
          ...hostProps,
          key: first.key ?? undefined,
          ref: (el: unknown) => {
            hostDom.value =
              el instanceof HTMLElement ? el : ((el as { $el?: HTMLElement } | null)?.$el ?? null);
            if (typeof rawRef === 'function') {
              (rawRef as (v: unknown) => void)(el);
            } else if (isRef(rawRef)) {
              rawRef.value = el;
            }
          },
        },
        newChildren,
      );
    };
  },
});
