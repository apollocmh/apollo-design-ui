/**
 * Search —— Transfer 列表面板的搜索框。
 *
 * 契约来源：antd 6.6.4 `es/transfer/search.js`（**机械移植**）。
 *
 * Input's clear event owns the clear action; change forwards its real native Event.
 */

import { SearchOutlined } from '@apollo-design/icons';
import { defineComponent, h, type PropType } from 'vue';
import Input from '../input';

export function searchEventValue(event: Event): string | undefined {
  const target = event.target;
  return target && 'value' in target && typeof target.value === 'string' ? target.value : undefined;
}

const Search = defineComponent({
  name: 'ATransferSearch',
  inheritAttrs: false,
  props: {
    placeholder: { type: String, default: '' },
    value: { type: String, default: undefined },
    prefixCls: { type: String, required: true },
    disabled: { type: Boolean, default: undefined },
    onChange: {
      type: Function as PropType<(event: Event) => void>,
      default: undefined,
    },
    handleClear: { type: Function as PropType<() => void>, default: undefined },
  },
  setup(props) {
    let clearing = false;
    let clearVersion = 0;
    const handleClear = () => {
      clearing = true;
      const version = ++clearVersion;
      queueMicrotask(() => {
        if (version === clearVersion) clearing = false;
      });
      props.handleClear?.();
    };
    const handleChange = (event: Event) => {
      if (clearing) {
        clearing = false;
        return;
      }
      props.onChange?.(event);
    };
    return () =>
      h(Input, {
        placeholder: props.placeholder,
        // Input 已迁移到「根 class 走原生 attrs」⇒ 这里用 `class`
        class: props.prefixCls,
        value: props.value,
        onChange: handleChange,
        onClear: handleClear,
        disabled: props.disabled,
        allowClear: true,
        prefix: h(SearchOutlined),
      });
  },
});

export default Search;
