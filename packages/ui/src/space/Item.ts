/**
 * `Item` —— `Space` 的每个子节点外面那一层包裹。
 *
 * 契约来源：antd 6.6.4 的 `es/space/Item.js`（47 行，逐条对齐）。
 *
 * ── 它渲染成**两个根节点**（Fragment）─────────────────────────────────────────
 *
 * ```html
 * <div class="{prefix}-space-item">…子节点…</div>
 * <span class="{prefix}-space-item-separator">…分隔符…</span>   <!-- 条件渲染 -->
 * ```
 *
 * Vue 3 支持多根组件，所以直接返回数组即可 —— 不需要额外的包裹元素
 * （加了会让 DOM 契约与 antd 不一致）。
 *
 * ── 三条判据，全在 antd 的 4 行代码里 ─────────────────────────────────────────
 *
 *   1. **`!isReactRenderable(children)` ⇒ 整个 Item 返回 `null`**（连 `-item` div
 *      都不渲染）。Vue 侧的对应物是 `isEmptyVNode`（Comment vnode / 空文本 vnode
 *      / 递归为空的 Fragment）。
 *      ⚠️ 注意与「渲染出空的 `-item`」区分：`<Null/>`（组件本身渲染 null）**是**
 *      可渲染的 —— 它的 vnode 是组件型，`isEmptyVNode` 为假 ⇒ 渲染出空的 `-item`，
 *      由 CSS `:empty{display:none}` 隐藏。上游用例：
 *      `index.test.tsx` 的 `should render the hidden empty item wrapper`。
 *
 *   2. **分隔符的判据是 `index < latestIndex && separator`**。前一半让「最后一个
 *      有内容的 item」之后没有分隔符；后一半是**真值**判断（不是 `isRenderable`）
 *      —— 所以 `separator={0}` / `separator=""` 都**不渲染** span。
 *
 *   3. **VNode 必须 `cloneVNode`**。Vue 的 VNode 是**可变对象**（patch 时会写入
 *      `el` / `component`），同一个 VNode 对象被渲染两次时第二次会看到上一次的
 *      `el`，行为未定义。`toArray` 产出的 vnode 与 `separator` 都可能是调用方
 *      持有的同一个对象（例如模块级常量分隔符），所以这里统一克隆。
 *      （依据：`empty/components/NodeRenderer.ts` 的实测结论。）
 *
 * ── 为什么用 `node` prop 而不是默认插槽 ────────────────────────────────────────
 *
 * antd 的 `Item` 接的是 `children`（单个节点）。Vue 的插槽只能拿到**数组**，
 * 而 `isEmptyVNode([])` 为真（`[].every(...)` 恒真）—— 于是「插槽没内容」与
 * 「子节点是空占位」会被混成同一条分支。虽然 `Space` 保证每个 Item 恰好一个子节点，
 * 但把这条隐含前提写成代码（prop 而不是插槽）更不容易被后来的改动破坏。
 */

import { isEmptyVNode } from '@apollo-design/utils';
import { type CSSProperties, defineComponent, h, type PropType, type VNodeChild } from 'vue';
import { useSpaceContext } from './context';
import type { SpaceSemanticClassNames, SpaceSemanticStyles } from './interface';
import { normalizeNode, type RenderableNode } from './node';

export const Item = defineComponent({
  name: 'ASpaceItem',
  props: {
    /** 根类名前缀（**不含** `-space` 后缀，与 antd 的 `prefix` 一致）。 */
    prefix: { type: String, required: true },
    /** `-item` 的完整类名（已含语义化 `classNames.item`）。 */
    className: { type: String, required: true },
    /** 在 `childNodes` 里的下标。 */
    index: { type: Number, required: true },
    /** 子节点。`VNodeChild` 的运行时类型必须是 `null`（见 `empty` 的同形写法）。
     *  内部：由 Space 把默认插槽克隆后传入，无模板上下文，VNode prop 合法（C8-R2 §4）。 */
    node: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    /** 分隔符。`null` / `''` / `0` 等假值 ⇒ 不渲染。
     *  内部：由 Space 把 `#separator` 插槽 / 文本 prop 归一后传入（C8-R2 §4）。 */
    separator: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    /** `-item` 的内联样式（= `mergedStyles.item`）。 */
    style: { type: Object as PropType<CSSProperties | undefined>, default: undefined },
    /** 语义化类名（`separator` 槽位用）。 */
    classNames: {
      type: Object as PropType<SpaceSemanticClassNames | undefined>,
      default: undefined,
    },
    /** 语义化样式（`separator` 槽位用）。 */
    styles: { type: Object as PropType<SpaceSemanticStyles | undefined>, default: undefined },
  },
  setup(props) {
    const context = useSpaceContext();

    return () => {
      const { node, separator } = props;

      // 判据 1：不可渲染的子节点 ⇒ 整个 Item 不产生任何节点。
      if (isEmptyVNode(node)) {
        return null;
      }

      const nodes: VNodeChild[] = [
        h(
          'div',
          { class: props.className, style: props.style },
          // ⚠️ 断言的理由：`isEmptyVNode(node)` 为假 ⇒ `node` 不可能是
          //    `null` / `undefined` / `void`（这三者都被它排除了），而这三个正是
          //    `h()` 的 children 参数不接受的那部分 `VNodeChild`。
          //    TS 无法把「上一个 if 的谓词」与「联合类型的收窄」连起来
          //    （`isEmptyVNode` 返回 `boolean` 而不是类型谓词），所以这里断言一次
          //    —— 断言目标是**已经证明过**的更窄类型 `RenderableNode`。
          normalizeNode(node) as RenderableNode,
        ),
      ];

      // 判据 2：`index < latestIndex` 且 `separator` 为真值。
      if (props.index < context.value.latestIndex && separator) {
        nodes.push(
          h(
            'span',
            {
              class: [`${props.prefix}-item-separator`, props.classNames?.separator],
              style: props.styles?.separator,
            },
            normalizeNode(separator) as RenderableNode,
          ),
        );
      }

      return nodes;
    };
  },
});
