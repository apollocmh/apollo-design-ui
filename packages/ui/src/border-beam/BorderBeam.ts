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
  onMounted,
  onScopeDispose,
  type PropType,
  shallowRef,
  type VNode,
  type VNodeChild,
} from 'vue';
import { useComponentConfig } from '../config-provider/context';
import type { BorderBeamColor } from './interface';
import { DEFAULT_BORDER_BEAM_DURATION, getBorderBeamGradient, isSameBorderWidth } from './util';

/** 数字 → `-${n}px`；字符串 → `calc(-1 * ${s})`（antd 的 getInset 逐字）。 */
const getInset = (width: number | string): string =>
  isString(width) ? `calc(-1 * ${width})` : `-${width}px`;

/** useBorderSize：读宿主 computed border 宽度 4 元组（antd 逐字，NaN→0）。 */
function useBorderSize(getDom: () => HTMLElement | null) {
  const DEFAULT_BORDER_WIDTH = [0, 0, 0, 0] as const;
  const borderWidth = shallowRef<readonly number[]>(DEFAULT_BORDER_WIDTH);

  const normalizeValue = (val: string | null): number => {
    const size = Number.parseFloat(val ?? '');
    return isNumber(size) ? size : 0;
  };

  let unwatch: (() => void) | undefined;
  onMounted(() => {
    unwatch = watchHost();
  });
  onScopeDispose(() => unwatch?.());

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
    // border 宽度变化（响应式布局）跟随 —— rAF 轮询是 antd 无监听场景的等价物；
    // ResizeObserver 更精确，但 border-width 变化不触发 size 变化，故用轻量轮询。
    const timer = setInterval(read, 500);
    return () => clearInterval(timer);
  }

  return borderWidth;
}

export default defineComponent({
  name: 'ABorderBeam',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    className: { type: String, default: undefined },
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
  setup(props, { slots }) {
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
      // eslint-disable-next-line no-console
      console.log(
        '[BB-DEBUG] raw type:',
        typeof raw,
        'isArray:',
        Array.isArray(raw),
        'firstType:',
        typeof first === 'object' && first ? String(first.type) : String(first),
      );
      // 纯文本等不可挂 ref 的 children：原样透传，无 Effect（antd 的 supportRef 判据）
      if (!first || typeof first.type === 'symbol') {
        return first ?? null;
      }

      const cls = [prefixCls.value, contextClassName, props.className];
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
      const newChildren: VNodeChild[] | VNodeChild = Array.isArray(originalChildren)
        ? [...originalChildren, ...injectedChildren]
        : originalChildren !== null && originalChildren !== undefined && originalChildren !== ''
          ? [originalChildren, ...injectedChildren]
          : injectedChildren;
      return createVNode(
        first.type,
        {
          ...(first.props ?? {}),
          key: first.key ?? undefined,
          ref: (el: unknown) => {
            hostDom.value =
              el instanceof HTMLElement ? el : ((el as { $el?: HTMLElement } | null)?.$el ?? null);
            const userRef = (first as { ref?: unknown }).ref;
            if (typeof userRef === 'function') userRef(el);
          },
        },
        newChildren,
      );
    };
  },
});
