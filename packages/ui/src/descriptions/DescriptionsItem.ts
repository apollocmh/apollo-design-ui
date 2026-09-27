/**
 * DescriptionsItem —— JSX 语法糖（`es/descriptions/Item.js`：`props => props.children`，
 * 永远不会真正渲染）。Vue 侧同样不做渲染工作：默认插槽原样透传；
 * 真正的条目化由 Descriptions 的 `transChildren2Items` 读 vnode.props 完成。
 */

import { defineComponent, type PropType } from 'vue';
import type { DescriptionsItemType } from './interface';

/**
 * ⚠️ props 类型用具体类型，**不要** `PropType<unknown>`（PITFALLS 137：vue-tsc
 *    会把消费侧推断成 undefined，demo/测试全线 TS2322）。
 */
export const DescriptionsItemComponent = defineComponent({
  name: 'ADescriptionsItem',
  // ⚠️ C8-R2：`label` 收窄为 String（富 label 走 `items` 程序化 API，其 `label` 仍接受 VNodeChild）。
  props: {
    label: { type: String, default: undefined },
    span: {
      type: [Number, String, Object] as PropType<DescriptionsItemType['span']>,
      default: undefined,
    },
    prefixCls: { type: String, default: undefined },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<Record<string, string | number>>, default: undefined },
    labelStyle: {
      type: Object as PropType<Record<string, string | number>>,
      default: undefined,
    },
    contentStyle: {
      type: Object as PropType<Record<string, string | number>>,
      default: undefined,
    },
    styles: {
      type: Object as PropType<DescriptionsItemType['styles']>,
      default: undefined,
    },
    classNames: {
      type: Object as PropType<DescriptionsItemType['classNames']>,
      default: undefined,
    },
  },
  setup(_props, { slots }) {
    return () => slots.default?.() ?? null;
  },
});

export const DescriptionsItem = DescriptionsItemComponent;
export default DescriptionsItem;
