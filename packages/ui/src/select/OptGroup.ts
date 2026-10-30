/**
 * `Select.OptGroup` —— rc-select `OptGroup.js` 的 Vue 版。
 *
 * 同 `Option.ts`：渲染 null，只作为**数据载体**；`isSelectOptGroup` 标记让
 * `convertChildrenToData` 把它的子项收成 `options`。
 */

import { defineComponent, type PropType, type SlotsType, type VNodeChild } from 'vue';
import { OPTGROUP_MARK } from './engine/valueUtil';

export const OptGroup = defineComponent({
  name: 'ASelectOptGroup',
  props: {
    label: {
      type: [String, Number, Boolean, Object, Array] as PropType<VNodeChild>,
      default: undefined,
    },
    disabled: { type: Boolean, default: undefined },
    className: { type: String, default: undefined },
  },
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup() {
    return () => null;
  },
});

Object.assign(OptGroup, { [OPTGROUP_MARK]: true });

export default OptGroup;
