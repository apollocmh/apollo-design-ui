/**
 * `toArray` —— 把任意形态的 children 展平成一个 vnode 数组。
 *
 * 契约来源：`@rc-component/util/Children/toArray`（antd 侧 17 个组件使用）。
 *
 * ---------------------------------------------------------------------------
 * React → Vue 的语义映射（这是本文件最需要小心的地方）
 * ---------------------------------------------------------------------------
 *
 * React 侧：`Children.forEach` 展平嵌套数组；`Fragment` 会被拆包（读 `props.children`）；
 *           `null` / `undefined` 默认跳过（`keepEmpty` 时保留）。
 *
 * Vue 侧有三个结构性差异：
 *
 *   1. **"空子节点"在 Vue 里有两种形态，必须都覆盖。**
 *      以下是 `vue/compiler-sfc` 的真实编译产物（不是推测）：
 *
 *        · `<span v-if="false" />`  → `createCommentVNode("v-if", true)` —— **Comment vnode**
 *        · `{{ maybeNull }}`        → `toDisplayString(...)` 返回 `''` —— **空 Text vnode**
 *
 *      手写 render function 里的裸 `null` / `undefined` / `false` 则**保持原样**：
 *      归一化发生在渲染器的 `patchChildren` 里，**不在** `h()` 里。
 *      （`h('div', [null]).children` 就是 `[null]`。）
 *
 *      所以"跳过空子节点"必须同时处理：Comment vnode、裸 falsy、以及数组嵌套。
 *
 *      ⚠️ 空 Text vnode（`''`）**不跳过** —— 这与 React 一致
 *         （`React.Children.toArray([''])` 同样保留空字符串），因为 `''` 属于"有内容"。
 *         这一条是刻意的：如果把 `''` 也当空值跳过，`toArray` 的长度会与 React 基线不符。
 *
 *   2. **数组会被包成 Fragment vnode。**
 *      Vue 的 `normalizeVNode` 遇到数组会 `createVNode(Fragment, null, child.slice())`。
 *      所以不拆 Fragment 就展不平 —— 这与 React 拆 Fragment 是同一个动作，
 *      只是 Vue 侧拆得更频繁（每次嵌套数组都拆）。
 *
 *   3. **原始值会被包成 Text vnode**（`String(child)`，所以 `0` → `'0'`）。
 *      我们接受原始值入参并就地归一化，让函数对"未归一化的手写数组"也是全函数。
 *
 * `keepEmpty` 的语义对应：保留空占位（Comment vnode / 补出来的占位）。
 */

import { Comment, createTextVNode, createVNode, Fragment, isVNode, type VNode } from 'vue';

export interface ToArrayOptions {
  /** 为 `true` 时保留空占位（Comment vnode）。 */
  keepEmpty?: boolean;
}

/**
 * 可被展平的输入形态。
 *
 * ⚠️ 函数分支写成 `() => ChildrenInput` 而**不是** Vue 的 `Slot`（`() => VNode[]`）。
 *    原因：运行时的 `collect` 对函数是「调用它然后**递归**处理返回值」，
 *    所以返回单个 vnode、返回嵌套数组、返回 `null` 全都能正确处理。
 *    用 `Slot` 声明会把这些合法用法挡在类型层之外 —— 声明比运行时窄是纯粹的损失。
 *    `Slot` 是它的子集（`VNode[]` 可赋给 `readonly ChildrenInput[]`），所以仍然接受插槽。
 */
export type ChildrenInput =
  | VNode
  | (() => ChildrenInput)
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly ChildrenInput[];

function createEmptyPlaceholder(): VNode {
  // 与 Vue 对 `null` / `undefined` / `false` 的归一化结果一致：一个 Comment vnode
  return createVNode(Comment);
}

export default function toArray(children: ChildrenInput, option: ToArrayOptions = {}): VNode[] {
  const result: VNode[] = [];
  collect(children, option, result);
  return result;
}

function collect(input: ChildrenInput, option: ToArrayOptions, out: VNode[]): void {
  if (input === null || input === undefined) {
    // `keepEmpty` 时补一个占位 Comment，保证"空位"在数组里有对应项
    if (option.keepEmpty) out.push(createEmptyPlaceholder());
    return;
  }

  if (typeof input === 'function') {
    // 函数分支：插槽（`() => VNode[]`）或任意 getter —— 返回值递归处理
    collect((input as () => ChildrenInput)(), option, out);
    return;
  }

  if (Array.isArray(input)) {
    for (const child of input) {
      collect(child as ChildrenInput, option, out);
    }
    return;
  }

  if (isVNode(input)) {
    if (input.type === Fragment) {
      // 拆包：Fragment 本身不是一个"子节点"
      collect(input.children as ChildrenInput, option, out);
      return;
    }
    if (input.type === Comment) {
      if (option.keepEmpty) out.push(input);
      return;
    }
    out.push(input);
    return;
  }

  if (typeof input === 'boolean') {
    // `true` 在 Vue 里不产生节点；`false` 产生 Comment。两者都不算"有内容"。
    if (option.keepEmpty) out.push(createEmptyPlaceholder());
    return;
  }

  // 原始值：字符串 / 数字 → Text vnode（`String()` 与 Vue 的归一化一致）
  out.push(createTextVNode(String(input)));
}
