/**
 * `Empty` 专有的插画渲染器（`image`）。
 *
 * ⚠️ **通用原语已迁走**（2026-10-07，registry `VNA-RENDERER-01`）：
 * `normalizeNode` / `NodeRenderer` / `RenderableNode` 现在住在
 * `packages/ui/src/_internal/node-renderer.ts` —— 因为此前它们住在**组件目录**里，
 * 被 7 个其它组件目录跨目录 import，违反 `ARCHITECTURE.md` §8.4
 * （「组件间不得互相 import 组件目录；共享工具必须放 `_internal/`」），
 * 并导致 `spin` / `space` 各维护了一份副本。
 *
 * 本文件只保留 **empty 专有**的那一半：字符串 → `<img>` 的判据。
 */

import { isVNode } from '@apollo-design/utils';
import { type Component, cloneVNode, defineComponent, h, type PropType } from 'vue';
import type { EmptyImage } from '../interface';

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
