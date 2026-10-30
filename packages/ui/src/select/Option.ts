/**
 * `Select.Option` —— rc-select `Option.js` 的 Vue 版。
 *
 * ⚠️ **它渲染 null**（与上游一致：rc 的 Option 是 `() => null` + `isSelectOption` 标记）。
 * 真正的数据来自 Select 对默认插槽 vnode 的解析（`engine/valueUtil.ts` 的
 * `convertChildrenToData`）—— 组件只是**数据载体**。
 *
 * antd 已把 `Select.Option` 标为 deprecated（推荐 `options`），但仍导出。
 */

import { defineComponent, type PropType, type SlotsType, type VNodeChild } from 'vue';
import { OPTION_MARK } from './engine/valueUtil';
import type { RawValueType } from './interface';

export const Option = defineComponent({
  name: 'ASelectOption',
  props: {
    value: { type: [String, Number, null] as PropType<RawValueType | null>, default: undefined },
    disabled: { type: Boolean, default: undefined },
    title: { type: String, default: undefined },
    className: { type: String, default: undefined },
  },
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup() {
    return () => null;
  },
});

Object.assign(Option, { [OPTION_MARK]: true });

export default Option;
