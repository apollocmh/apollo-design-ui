/**
 * 渲染任意 `VNodeChild` 前的归一化。
 *
 * ── 为什么必须克隆 ─────────────────────────────────────────────────────────────
 *
 * Vue 的 VNode 是**可变对象**（patch 时会写入 `el` / `component` / `shapeFlag`），
 * 与 React 元素（不可变描述符）不同。同一个 VNode 对象被渲染两次时，第二次会看到
 * 上一次留下的 `el`，行为未定义。
 *
 * `Space` 的 `childNodes` 来自 `toArray(slots.default())`，每次渲染都是新的；
 * 但 `separator` 可能是调用方持有的**模块级常量 vnode**（antd 的
 * `PRESENTED_IMAGE_*` 就是同一类问题），所以统一克隆。
 *
 * 依据：`empty/components/NodeRenderer.ts` 的实测结论（那里踩过这个坑）。
 *
 * ── 为什么单独一个文件 ─────────────────────────────────────────────────────────
 *
 * `Item` 与 `CompactItem` 都要用它。放在任一个里都会让另一个反向依赖 ——
 * 而这两个文件在语义上没有依赖关系（一个是 Space 的项包裹，一个是 Compact 的
 * 上下文提供者）。三行代码换来一条干净的依赖边，值。
 */

import { isVNode } from '@apollo-design/utils';
import { cloneVNode, type VNodeChild } from 'vue';

/** VNode 走克隆，其余（字符串 / 数字 / 数组 / null）原样交给 Vue。 */
export function normalizeNode(node: VNodeChild): VNodeChild {
  return isVNode(node) ? cloneVNode(node) : node;
}

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
