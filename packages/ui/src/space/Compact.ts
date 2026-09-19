/**
 * `Space.Compact` 的**跨组件上下文协议**。
 *
 * 契约来源：antd 6.6.4 的 `es/space/Compact.js` 里除默认导出之外的全部内容
 * （`SpaceCompactItemContext` / `useCompactItemContext` / `NoCompactStyle` / `CompactItem`）。
 *
 * ── 这个模块为什么比 Compact 组件本身更重要 ────────────────────────────────────
 *
 * `useCompactItemContext` 被 **10 个组件**消费（Button / Input / TextArea /
 * Input.Search / InputNumber / Select / TreeSelect / Cascader / DatePicker /
 * Dropdown.Button / ColorPicker）。Compact 只负责**算**出
 * `compactSize` / `compactDirection` / `isFirstItem` / `isLastItem` 并广播，
 * 真正把 `-compact-item` / `-compact-first-item` / `-compact-last-item` 类名
 * 拼到元素上的是**下游组件自己**（用它们自己的 `prefixCls`）。
 *
 * 所以：
 *   - 拼出来的类名是 `apollo-btn-compact-item`（下游前缀），
 *     **不是** `apollo-space-compact-item`。
 *   - 路径必须是 `space/Compact`（与 antd 同路径），下游才能照抄 import。
 *
 * ── `NoCompactStyle` 存在的理由 ────────────────────────────────────────────────
 *
 * 浮层（Modal / Drawer / Tooltip / Dropdown）里的内容虽然在 React 组件树上
 * 是 Compact 的后代，但在**视觉上**不属于紧凑组。所以 `ContextIsolator`
 * 用 `NoCompactStyle` 把上下文重置为 `null`。
 * `space-compact.test.tsx` 有 4 条用例专门测这个（Modal / Dropdown / Drawer / Tooltip）。
 *
 * ── 与 antd 的差异（PLATFORM / D27）─────────────────────────────────────────────
 *
 * antd 返回**裸值**（每次渲染重算）。Vue 的 `inject` 是 setup 期快照，
 * 裸值不会随 Compact 的 props 变化而更新 —— 所以这里返回 `ComputedRef`。
 * 下游在 `computed` / render 里读 `.value` 即可（与 `size-context.ts` 同形）。
 */

import {
  type ComputedRef,
  computed,
  defineComponent,
  type InjectionKey,
  inject,
  type MaybeRefOrGetter,
  type PropType,
  provide,
  toValue,
  type VNodeChild,
} from 'vue';
import type { DirectionType } from '../config-provider/context';
import type { SizeType } from '../config-provider/size-context';
import type { SpaceCompactItemContextType } from './interface';
import { normalizeNode } from './node';

export type { SpaceCompactItemContextType };

/**
 * 注入键。值是 `ComputedRef<... | null>`：
 *   - `null` 表示「不在 Compact 里」（也是 `NoCompactStyle` 主动设置的值）
 *   - `ComputedRef` 而不是裸值 —— 见文件头
 */
export const spaceCompactItemContextKey: InjectionKey<
  ComputedRef<SpaceCompactItemContextType | null>
> = Symbol('apolloSpaceCompactItemContext');

/** `useCompactItemContext` 的返回值。 */
export interface CompactItemContext {
  /** 子组件应当采用的尺寸（来自 `Compact` 的 `size` 或 ConfigProvider）。 */
  compactSize: ComputedRef<SizeType | undefined>;
  /** 紧凑方向。`vertical` 时下游类名的分隔符是 `-vertical-`。 */
  compactDirection: ComputedRef<'horizontal' | 'vertical' | undefined>;
  /** 已经拼好的类名串（空串表示不在 Compact 里）。 */
  compactItemClassnames: ComputedRef<string>;
}

/**
 * 下游组件读取紧凑上下文。
 *
 * 类名的**顺序**逐字对齐 antd 的 `clsx` 调用：
 * `item` → `first-item`? → `last-item`? → `item-rtl`?。
 * （顺序不影响 CSS，但影响 SSR 产物的字节 —— 而 L4 的投影会排序，所以它只对
 * 「肉眼比对 SSR 字符串」有意义。保留原顺序的成本是零。）
 *
 * @param prefixCls **下游组件自己的**前缀（如 `apollo-btn`），可以是 ref / getter
 * @param direction 文字方向（`'rtl'` 时多一个 `-item-rtl`），可以是 ref / getter
 */
export function useCompactItemContext(
  prefixCls: MaybeRefOrGetter<string>,
  direction: MaybeRefOrGetter<DirectionType | undefined>,
): CompactItemContext {
  // ⚠️ `undefined` 默认值而不是 `null`：`inject` 的第二参数是「没有 Provider 时」的
  //    兜底值，而 `null` 是「有 Provider、但值被显式设为 null」的合法取值 ——
  //    两者在这里都要走「不在 Compact 里」这一条分支，但用 `undefined` 兜底
  //    可以避免 `inject` 的类型参数被 `null` 污染。
  const injected = inject(spaceCompactItemContextKey, undefined);

  const compactItemClassnames = computed<string>(() => {
    const context = injected?.value;
    if (!context) {
      return '';
    }

    const { compactDirection, isFirstItem, isLastItem } = context;
    // `vertical` 时类名里多一对连字符：`-compact-vertical-item`（不是 `-compact-item`）。
    const separator = compactDirection === 'vertical' ? '-vertical-' : '-';
    const cls = toValue(prefixCls);

    const tokens: string[] = [`${cls}-compact${separator}item`];
    if (isFirstItem) tokens.push(`${cls}-compact${separator}first-item`);
    if (isLastItem) tokens.push(`${cls}-compact${separator}last-item`);
    if (toValue(direction) === 'rtl') tokens.push(`${cls}-compact${separator}item-rtl`);

    return tokens.join(' ');
  });

  return {
    compactSize: computed(() => injected?.value?.compactSize),
    compactDirection: computed(() => injected?.value?.compactDirection),
    compactItemClassnames,
  };
}

/**
 * 把一个子节点包进「紧凑项」上下文。
 *
 * ⚠️ 它**不产生任何 DOM 元素**（纯 provider + 原样渲染 `node`），所以
 *    `Space.Compact` 的 DOM 里看不到它 —— 这与 antd 的 `<CompactItem>` 完全一致。
 *
 * ── 为什么 `node` 是 prop 而不是默认插槽 ──────────────────────────────────────
 *
 * 与 `Item` 同因（见 `Item.ts` 的文件头）：插槽只能拿到数组，而模板里没有
 * 「渲染一个 VNodeChild 变量」的语法（`<component :is="vnode">` 会静默渲染成空，
 * 见 `empty/components/NodeRenderer.ts` 的实测结论）。用 prop 传节点是这一层
 * 唯一不需要额外包裹组件的做法。
 */
export const CompactItem = defineComponent({
  name: 'ASpaceCompactItem',
  props: {
    // ⚠️ `default: undefined` 不是冗余：`Boolean` 在运行时类型里会让未传的 prop
    //    被 Vue 转成 `false`，而 `isFirstItem` / `isLastItem` 的 `false` 与
    //    `undefined` 在这里语义相同（都走「不加类名」分支），但 `compactSize`
    //    若被转成 `false` 会产出 `-false` 这样的类名。统一给默认值最省心。
    compactSize: { type: String as PropType<SizeType | undefined>, default: undefined },
    compactDirection: {
      type: String as PropType<'horizontal' | 'vertical' | undefined>,
      default: undefined,
    },
    isFirstItem: { type: Boolean, default: undefined },
    isLastItem: { type: Boolean, default: undefined },
    /** 子节点。`VNodeChild` 的运行时类型必须是 `null`（见 `empty` 的同形写法）。 */
    node: { type: null as unknown as PropType<VNodeChild>, default: undefined },
  },
  setup(props) {
    provide(
      spaceCompactItemContextKey,
      computed<SpaceCompactItemContextType | null>(() => ({
        compactSize: props.compactSize,
        compactDirection: props.compactDirection,
        isFirstItem: props.isFirstItem,
        isLastItem: props.isLastItem,
      })),
    );
    return () => normalizeNode(props.node);
  },
});

/**
 * 把子树从紧凑上下文里**隔离**出去。
 *
 * 契约来源：antd 的 `NoCompactStyle`（`Compact.tsx:49-54`）。
 * 与 antd 一致地「提供 `null`」而不是「不提供」—— 这样嵌套在多层 Provider
 * 里时，内层的 `null` 会**覆盖**外层的真实值（`inject` 取最近的一层）。
 *
 * 消费方：`_util/ContextIsolator`（Modal / Drawer / Tooltip / Dropdown 用它）。
 */
export const NoCompactStyle = defineComponent({
  name: 'ANoCompactStyle',
  setup(_props, { slots }) {
    provide(
      spaceCompactItemContextKey,
      computed<SpaceCompactItemContextType | null>(() => null),
    );
    return () => slots.default?.() ?? null;
  },
});
