/**
 * 把「任意可渲染值」渲染出来。
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
 * 1. **VNode 必须克隆**。Vue 的 VNode 是**可变对象**（patch 时会写入 `el` / `component`），
 *    与 React 元素（不可变描述符）不同。同一个 VNode 对象被渲染两次时，第二次会看到
 *    上一次留下的 `el`，行为未定义。`cloneVNode` 是官方的解法。
 *
 *    ⚠️ 这条同时解释了为什么 `PRESENTED_IMAGE_DEFAULT` / `PRESENTED_IMAGE_SIMPLE`
 *    **不是** VNode 而是**组件对象** —— antd 那边它们是 `React.createElement(...)` 的结果
 *    （模块级常量 VNode），Vue 侧照搬会让「同一个常量 VNode 被两个 Empty 实例渲染」
 *    直接踩到这个坑。组件对象既保持了 `===` 的身份语义（`-normal` 类名靠它判定），
 *    又天然是「可重复渲染」的。
 *
 * 2. **`string` 要优先判**。`image` 是字符串时渲染成 `<img>`，而不是文本节点 ——
 *    这是 antd 的判据（`typeof mergedImage === 'string'`），也是「传 URL 就能用」的原因。
 */

import { isVNode } from '@apollo-design/utils';
import {
  type Component,
  cloneVNode,
  defineComponent,
  h,
  type PropType,
  type VNodeChild,
} from 'vue';
import type { EmptyImage } from '../interface';

/** VNode 走克隆，其余（字符串 / 数字 / 数组 / null）原样交给 Vue。 */
function normalizeNode(node: VNodeChild): VNodeChild {
  return isVNode(node) ? cloneVNode(node) : node;
}

/**
 * 通用节点渲染器。渲染后**不产生任何包裹元素**（render 函数直接返回内容）。
 */
export const NodeRenderer = defineComponent({
  name: 'ANodeRenderer',
  props: {
    // 内部：由 empty 预设程序化传递，无模板上下文，VNode prop 合法（C8-R2 §4）。
    node: { type: null as unknown as PropType<VNodeChild>, default: null },
  },
  setup(props) {
    return () => normalizeNode(props.node);
  },
});

/**
 * `image` 的渲染器。三条判据与 antd 逐字对应：
 *
 *   - `string`  → `<img draggable={false} alt={alt} src={image}>`
 *   - VNode     → 原样（克隆后）渲染
 *   - 组件      → `h(component)`
 *
 * `draggable={false}` 必须显式写：antd 写的就是布尔 `false`，
 * 渲染成属性是 `draggable="false"`（HTML 的 `draggable` 是枚举属性，
 * 设 IDL 属性为 `false` 会反映成字符串 `"false"`）。漏了它用户就能把插画拖出去。
 */
export const ImageNode = defineComponent({
  name: 'AImageNode',
  props: {
    node: { type: null as unknown as PropType<EmptyImage>, default: null },
    alt: { type: String, default: '' },
  },
  setup(props) {
    return () => {
      const node = props.node;
      if (typeof node === 'string') {
        return h('img', { draggable: false, alt: props.alt, src: node });
      }
      // VNode → 克隆后原样渲染；组件对象（含 PRESENTED_IMAGE_*）→ `h()` 包一层。
      // 少了 `h()` 这一步，render 会返回一个组件对象 —— Vue 只认 vnode，
      // 结果是**静默渲染成空**（image 容器里一个子节点都没有）。
      if (isVNode(node)) return cloneVNode(node);
      return h(node as Component);
    };
  },
});
