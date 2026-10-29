/**
 * BorderBeam —— 宿主边缘的流光描边。
 *
 * 契约来源：antd 6.6.4 的 `es/border-beam/BorderBeam.js` + `BorderBeamEffect.js` +
 * `hooks/`（判据逐条对齐，见 docs/analysis/border-beam.md §2）。
 *
 * ── 为什么是 render 函数 ──────────────────────────────────────────────────────
 *
 * 渲染结构是 `Fragment = 重建的宿主 vnode + <Teleport to=hostDom>`，注入 ref 与
 * Teleport 都要拿到 vnode/DOM 对象本身，SFC 模板表达不了（spin/Indicator、
 * badge/ScrollNumber 同范式）。
 *
 * ── 六条最容易写错的判据 ─────────────────────────────────────────────────────
 *
 *   1. **CSS 变量挂在 Effect 的 style 上**（不是宿主）—— 变量名
 *      `--{root}-border-beam-*` 与 style/index.ts 的 varRef 配对。
 *   2. **delay 错相**：index>0 时 `-{duration * index / count}s`（负延迟均分相位）。
 *   3. **inset-offset**：outset 非空 → 四边统一；否则按宿主 computed border 四边
 *      各自取负（数字 `-${n}px`，字符串 `calc(-1 * ${s})`）。
 *   4. **宿主不可用（纯文本等）→ 只渲染 child 本身，无 Effect**。
 *   5. **count 归一**：有限且 ≥1 取整，否则 1。
 *   6. **Effect 只能走 Teleport 到宿主 DOM，不能并进宿主的 children**（Issue #56）：
 *      children 可能是 slots 对象（打包成数组会退化成 ARRAY_CHILDREN ⇒ 内容整块
 *      丢失），且组件**没有 default 插槽**时根本无处注入。
 */

import { isNonNullable, isNumber, isString } from '@apollo-design/utils';
import {
  computed,
  createVNode,
  defineComponent,
  h,
  isRef,
  mergeProps,
  onMounted,
  onScopeDispose,
  type PropType,
  shallowRef,
  Teleport,
  type VNode,
} from 'vue';
import { type ComponentStyleConfig, useComponentConfig } from '../config-provider/context';
import { subscribeBorderSample } from './border-sampler';
import type { BorderBeamColor, BorderBeamProps } from './interface';
import { DEFAULT_BORDER_BEAM_DURATION, getBorderBeamGradient, isSameBorderWidth } from './util';

/** 数字 → `-${n}px`；字符串 → `calc(-1 * ${s})`（antd 的 getInset 逐字）。 */
const getInset = (width: number | string): string =>
  isString(width) ? `calc(-1 * ${width})` : `-${width}px`;

/**
 * 从 ref 回调拿到宿主的 **真实 DOM 元素**（Issue #56）。
 *
 * - 元素 vnode ⇒ ref 直接给 `HTMLElement`；
 * - 组件 vnode ⇒ ref 给组件公开实例（`$el` 才是它的根 DOM）；
 * - 组件是**多根**（Fragment）⇒ `$el` 是锚点文本节点 ⇒ 无单一宿主 ⇒ `null`
 *   （与上游 antd `supportRef` 的判据一致：拿不到单一 DOM 就不画流光）。
 */
function resolveHostDom(el: unknown): HTMLElement | null {
  if (el instanceof HTMLElement) {
    return el;
  }
  const maybe = (el as { $el?: unknown } | null | undefined)?.$el;
  return maybe instanceof HTMLElement ? maybe : null;
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
    const config = useComponentConfig<ComponentStyleConfig>('borderBeam');
    const { getPrefixCls } = config;

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
        ...(config.style ?? {}),
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

      const cls = [prefixCls.value, config.className, props.classNames?.effect, props.className];
      const effects = Array.from({ length: mergedCount.value }, (_, index) =>
        h('div', {
          key: index,
          'aria-hidden': 'true',
          class: cls,
          style: effectStyle(index),
        }),
      );

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

      const hostVNode = createVNode(
        first.type,
        {
          ...hostProps,
          key: first.key ?? undefined,
          ref: (el: unknown) => {
            hostDom.value = resolveHostDom(el);
            if (typeof rawRef === 'function') {
              (rawRef as (v: unknown) => void)(el);
            } else if (isRef(rawRef)) {
              rawRef.value = el;
            }
          },
        },
        // ⚠️ children **原样回填**（绝不注入 Effect）—— 曾尝试把 Effect 并进 children，
        //    但组件子节点的 children 是 **slots 对象**，打包进数组会退化成 ARRAY_CHILDREN
        //    ⇒ 组件拿不到插槽、内容整块丢失；且「组件没有 default 插槽」时根本无处注入。
        //    改走下面的 Teleport：宿主 vnode 完全不被改动。
        first.children ?? null,
      );

      // Effect 用 **真实 portal**（Teleport 到宿主 DOM 内部）—— 与 antd 的
      // `createPortal(effect, hostDom)` 逐字等价：`position:absolute` 才以宿主为
      // 包含块（`border-radius:inherit` 同理），且**与宿主是否声明插槽无关**。
      // ⚠️ 首帧（含 SSR）hostDom 未挂载 → 不渲染 Teleport（与 antd portal 时机一致）。
      //
      // 🚨 根**恒为 Fragment**（哪怕只有一个 child）：根形态在「无 Effect → 有 Effect」
      //    之间翻转会让 Vue 判定为不同类型的根 ⇒ 整棵**重挂**（宿主组件状态与 DOM 全丢）。
      return hostDom.value
        ? [
            hostVNode,
            createVNode(Teleport, { key: `${prefixCls.value}-portal`, to: hostDom.value }, effects),
          ]
        : [hostVNode];
    };
  },
});
