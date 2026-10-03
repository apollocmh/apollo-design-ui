/**
 * 引擎的两条 context（`@rc-component/mentions@1.12.0` 的 `MentionsContext.js` + `context.js`）。
 *
 * ── MentionsContext（候选列表 → 引擎）─────────────────────────────────────────
 * rc 用 React Context 把「引擎的回调 + 当前高亮」交给 `DropdownMenu`。
 * 之所以不直接传 props：`DropdownMenu` 渲染在 **Portal 里**（`KeywordTrigger` → rc-trigger），
 * 中间隔了若干层，props 传下去要一路穿透。
 *
 * ⚠️ 本仓用 `provide` / `inject` —— 但**必须在 render 函数里 `h(DropdownMenu)` 的同一棵树上
 *    provide**。`KeywordTrigger` 的浮层走 `Portal`（Teleport），Vue 的 Teleport **保留**
 *    组件树上的 provide/inject 链（它只改 DOM 位置）⇒ 语义与 React Context 一致。
 *
 * ── UnstableContext（强制展开）───────────────────────────────────────────────
 * 上游只有 antd 文档站的语义预览 demo 用它（`{ open: true }`）：跳过键盘交互直接把
 * 候选面板渲染出来，好让 `SemanticPreview` 能截到 `popup` 那一块。
 *
 * 上游把它叫 `Unstable` 并且**不**从 antd 导出（demo 直接 import rc 包）。
 * 本仓没有「从 rc 包 import」这条路 ⇒ 导出注入键 + 一个最小的 provider 组件，
 * 让 demo 能表达同一件事（见 `mentions/demo/_semantic.vue`）。
 */

import {
  type ComputedRef,
  defineComponent,
  type InjectionKey,
  type PropType,
  provide,
  type VNodeChild,
} from 'vue';
import type { MentionsOptionProps } from '../interface';

/** 候选列表需要从引擎拿到的全部东西。 */
export interface MentionsContextValue {
  notFoundContent: VNodeChild;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  selectOption: (option: MentionsOptionProps | undefined) => void;
  onFocus: () => void;
  onBlur: () => void;
  onScroll: (event: Event) => void;
}

/**
 * 候选列表的注入键。
 *
 * ⚠️ 值是 **`ComputedRef`** 而不是裸对象 —— Vue 的 `provide` 只能在 `setup` 里调用，
 *    而这份上下文依赖渲染期状态（`activeIndex` / `mergedMeasuring`）。
 *    React 的 `value={{...}}` 每次渲染新建对象，等价物就是「一个 computed」：
 *    消费方读 `.value` 会建立依赖，状态一变就重渲染（语义与 Context 一致）。
 */
export const mentionsContextKey: InjectionKey<ComputedRef<MentionsContextValue>> =
  Symbol('apolloMentionsContext');

/** `UnstableContext` 的值。 */
export interface UnstableContextProps {
  /** 为真时**强制展开**候选面板（语义预览用）。 */
  open?: boolean;
}

export const unstableContextKey: InjectionKey<UnstableContextProps> =
  Symbol('apolloMentionsUnstable');

/**
 * `UnstableContext.Provider` 的等价物。
 *
 * 用法（与上游 demo 同形）：
 * ```vue
 * <MentionsUnstableProvider :value="{ open: true }">
 *   <Mentions v-model:value="'Hi, @'" :options="options" />
 * </MentionsUnstableProvider>
 * ```
 */
export const MentionsUnstableProvider = defineComponent({
  name: 'AMentionsUnstableProvider',
  props: {
    value: { type: Object as PropType<UnstableContextProps>, default: () => ({}) },
  },
  setup(props, { slots }) {
    provide(unstableContextKey, props.value);
    return () => slots.default?.() ?? null;
  },
});
