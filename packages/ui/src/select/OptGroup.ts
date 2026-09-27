/**
 * `Select.OptGroup` —— rc-select `OptGroup.js` 的 Vue 版。
 *
 * 同 `Option.ts`：渲染 null，只作为**数据载体**；`isSelectOptGroup` 标记让
 * `convertChildrenToData` 把它的子项收成 `options`。
 */

import { defineComponent } from 'vue';
import { OPTGROUP_MARK } from './engine/valueUtil';

export const OptGroup = defineComponent({
  name: 'ASelectOptGroup',
  props: {
    label: { type: [String, Number] as never, default: undefined },
    disabled: { type: Boolean, default: undefined },
    className: { type: String, default: undefined },
  },
  setup() {
    return () => null;
  },
});

Object.assign(OptGroup, { [OPTGROUP_MARK]: true });

export default OptGroup;
