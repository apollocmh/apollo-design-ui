/** Space content hosts and a DOM-free latestIndex provider. VNode data stays owned by its semantic region. */
import { isEmptyVNode } from '@apollo-design/utils';
import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  type PropType,
  provide,
  type VNodeChild,
} from 'vue';
import { normalizeNode, type RenderableNode } from '../_internal/node-renderer';
import type { SpaceChild } from './children';
import { spaceContextKey, useSpaceContext } from './context';
import type { SpaceSemanticClassNames, SpaceSemanticStyles } from './interface';

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
      if (props.index < context.value.latestIndex && !isEmptyVNode(separator)) {
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

/** A DOM-free provider receives rendered slots, so context never caches slot presence. */
export const SpaceItems = defineComponent({
  name: 'ASpaceItems',
  props: {
    items: { type: Array as PropType<SpaceChild[]>, required: true },
    prefix: { type: String, required: true },
    separator: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    classNames: { type: Object as PropType<SpaceSemanticClassNames>, required: true },
    styles: { type: Object as PropType<SpaceSemanticStyles>, required: true },
  },
  setup(props) {
    provide(
      spaceContextKey,
      computed(() => ({
        latestIndex: props.items.reduce(
          (latest, child, index) => (isEmptyVNode(child.node) ? latest : index),
          0,
        ),
      })),
    );
    return () =>
      props.items.map(({ node, key }, index) =>
        h(Item, {
          key,
          prefix: props.prefix,
          className: [`${props.prefix}-item`, props.classNames.item].filter(Boolean).join(' '),
          index,
          node,
          separator: props.separator,
          style: props.styles.item,
          classNames: props.classNames,
          styles: props.styles,
        }),
      );
  },
});
