/**
 * 把「任意可渲染值」渲染出来 —— Spin 的 `description` / `tip` 用的渲染器。
 *
 * ── ⚠️ 为什么这里有一份，而不是复用 `empty/components/NodeRenderer.ts` ────────────
 *
 * 本仓库有一条**硬架构规则**（`ARCHITECTURE.md` §8.4、`packages/ui/README.md`）：
 *
 * > 组件间不得互相 import 组件目录；共享 context 与工具必须放在 `src/_internal/`。
 *
 * 而 `empty/components/NodeRenderer.ts` 住在 **empty 的组件目录**里 —— spin 去 import 它
 * 就形成 `spin → empty` 这条边（虽然无环，但正是规则要禁止的形态）。
 * 把它迁到 `packages/ui/src/_internal/` 才是正解，但那要改 empty 的目录，
 * **不在本轮（spin）的文件域**里。
 *
 * ⇒ 所以这里**就地**有一份（约 20 行），并在 `README.md` §7 登记为待合并项：
 *    等 `NodeRenderer` 迁到 `_internal/` 之后，删掉本文件、改 import 即可。
 *    两条实现刻意保持同形，让将来的合并是「换 import」而不是「对行为」。
 *
 * ── 为什么需要它 ────────────────────────────────────────────────────────────
 *
 * `description` / `tip` 的类型是 `VNodeChild`（对应 antd 的 `React.ReactNode`），
 * 也就是「可以是字符串、可以是元素、可以是数组」。Vue 的 `.vue` 模板里没有
 * 直接渲染「一个 VNodeChild 变量」的语法：
 *
 *   - `{{ value }}` 走 `toDisplayString`，对象会被 JSON 化（VNode 会变成 `{}`）；
 *   - `<component :is="value">` 只接受组件或字符串标签名，传 VNode 会被当成
 *     「一个没有 render 函数的组件」，静默渲染成空。
 *
 * ── VNode 必须克隆 ──────────────────────────────────────────────────────────
 *
 * Vue 的 VNode 是**可变对象**（patch 时会写入 `el` / `component`），与 React 元素
 * （不可变描述符）不同。同一个 VNode 对象被渲染两次时，第二次会看到上一次留下的
 * `el`，行为未定义。`cloneVNode` 是官方的解法。
 */

import { isVNode } from '@apollo-design/utils';
import { type PropType, type VNodeChild, cloneVNode, defineComponent } from 'vue';

/**
 * 渲染后**不产生任何包裹元素**（render 函数直接返回内容）。
 *
 * VNode 走克隆；字符串 / 数字 / 数组 / `null` 原样交给 Vue
 * （`renderComponentRoot` 会用 `normalizeVNode` 把它们包成文本节点 / Fragment）。
 */
export const NodeRenderer = defineComponent({
  name: 'ASpinNodeRenderer',
  props: {
    node: { type: null as unknown as PropType<VNodeChild>, default: null },
  },
  setup(props) {
    return () => (isVNode(props.node) ? cloneVNode(props.node) : props.node);
  },
});
