/**
 * 把「任意可渲染值」渲染出来 —— **全库唯一的平台原语**（`KNOWN-ISSUES`/registry
 * `VNA-RENDERER-01` 的落地）。
 *
 * ── 为什么需要它 ────────────────────────────────────────────────────────────
 *
 * antd 的 `image` / `description` / `children` 都是 `React.ReactNode`，
 * 也就是「可以是字符串、可以是元素、可以是数组」。Vue 的 `.vue` 模板里没有
 * 直接渲染「一个 VNodeChild 变量」的语法：
 *
 *   - `{{ value }}` 走 `toDisplayString`，对象会被 JSON 化（VNode 会变成 `{}`）；
 *   - `<component :is="value">` 只接受组件或字符串标签名，传 VNode 会被当成
 *     「一个没有 render 函数的组件」，静默渲染成空。
 *
 * 所以这一层是**平台差异的落点**（PLATFORM），必须显式存在，而不是靠模板「恰好能用」。
 *
 * ── 两个必须处理的坑 ────────────────────────────────────────────────────────
 *
 * 1. **VNode 必须克隆**。Vue 的 VNode 是**可变对象**（patch 时会写入 `el` / `component` /
 *    `shapeFlag`），与 React 元素（不可变描述符）不同。同一个 VNode 对象被渲染两次时，
 *    第二次会看到上一次留下的 `el`，行为未定义。`cloneVNode` 是官方的解法。
 *
 *    ⚠️ 这条同时解释了为什么 `PRESENTED_IMAGE_DEFAULT` / `PRESENTED_IMAGE_SIMPLE`
 *    **不是** VNode 而是**组件对象** —— antd 那边它们是 `React.createElement(...)` 的结果
 *    （模块级常量 VNode），Vue 侧照搬会让「同一个常量 VNode 被两个 Empty 实例渲染」
 *    直接踩到这个坑。组件对象既保持了 `===` 的身份语义（`-normal` 类名靠它判定），
 *    又天然是「可重复渲染」的。
 *
 * 2. **`string` 要优先判**（只在 `empty` 的 `ImageNode` 里）—— `image` 是字符串时渲染成
 *    `<img>`，而不是文本节点。那是 antd 的判据（`typeof mergedImage === 'string'`），
 *    属于 empty 专有逻辑，**留在 `empty/components/NodeRenderer.ts`**。
 *
 * ── 为什么在这里（`_internal/`）而不是某个组件目录 ──────────────────────────────
 *
 * `ARCHITECTURE.md` §8.4 / `packages/ui/README.md` 的硬规则：
 * **组件间不得互相 import 组件目录；共享 context 与工具必须放在 `src/_internal/`。**
 *
 * 本文件此前有三份副本，且都在**组件目录**里，导致跨组件 import：
 *   - `empty/components/NodeRenderer.ts`（被 7 个其它组件目录直接引用）；
 *   - `spin/components/NodeRenderer.ts`（**近乎重复**的实现，其文件头自己写明
 *     「等 `NodeRenderer` 迁到 `_internal/` 之后，删掉本文件、改 import 即可」）；
 *   - `space/node.ts`（`normalizeNode` + `RenderableNode`，被 `input-number` 跨目录引用）。
 *
 * 2026-10-07 合并到此处：**行为逐字保留**（无包裹 DOM、VNode 克隆、字符串/数字/数组/null
 * 原样交给 Vue），三处副本删除，全部消费者改为引用本文件。
 */

import { isVNode } from '@apollo-design/utils';
import { cloneVNode, defineComponent, type PropType, type VNodeChild } from 'vue';

/** VNode 走克隆，其余（字符串 / 数字 / 数组 / null）原样交给 Vue。 */
export function normalizeNode(node: VNodeChild): VNodeChild {
  return isVNode(node) ? cloneVNode(node) : node;
}

/**
 * 通用节点渲染器。渲染后**不产生任何包裹元素**（render 函数直接返回内容）。
 */
export const NodeRenderer = defineComponent({
  name: 'ANodeRenderer',
  props: {
    // 内部：由各组件程序化传递，无模板上下文，VNode prop 合法（C8-R2 §4）。
    node: { type: null as unknown as PropType<VNodeChild>, default: null },
  },
  setup(props) {
    return () => normalizeNode(props.node);
  },
});

/**
 * `VNodeChild` 去掉 `null` / `undefined` / `void` 之后剩下的部分。
 *
 * 它就是 Vue 的 `h()` **children 参数**所接受的类型（`RawChildren` 的子集）——
 * 所以在「已经用 `isEmptyVNode` 判过非空」的位置，断言到这个类型是**精确**的，
 * 不是把类型系统绕过去。
 *
 * ⚠️ **不能**写成 `NonNullable<VNodeChild>`：`NonNullable<T> = T & {}` 对联合类型
 *    逐支分配，而 `void & {}` 不是 `never`（`void` 不是 `null` / `undefined`）
 *    ⇒ 结果里仍留着 `void`，`h()` 照样报 TS2769。实测见 PITFALLS 114。
 */
// biome-ignore lint/suspicious/noConfusingVoidType: `void` 在这里**必须**出现 —— 它是 `VNodeChild` 联合里一个独立分支（`h()` 不接受它），而 biome 的 unsafe fix 会把它换成 `undefined`（`Exclude<…, null | undefined | undefined>`），那样 `void` 仍留在结果里、TS2769 照旧。这不是「令人困惑的 void」，而是「精确地去掉它」。
export type RenderableNode = Exclude<VNodeChild, null | undefined | void>;
