/**
 * Search —— Transfer 列表面板的搜索框。
 *
 * 契约来源：antd 6.6.4 `es/transfer/search.js`（**机械移植**）。
 *
 * Input's clear event owns the clear action; change forwards its real native Event.
 */

import { SearchOutlined } from '@apollo-design/icons';
import { defineComponent, h } from 'vue';
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
  },
  emits: {
    'update:value': (_value: string) => true,
    change: (_event: Event) => true,
    clear: (_event: MouseEvent) => true,
  },
  setup(props, { attrs, emit }) {
    let clearing = false;
    let clearVersion = 0;
    const handleClear = (event: MouseEvent) => {
      clearing = true;
      const version = ++clearVersion;
      queueMicrotask(() => {
        if (version === clearVersion) clearing = false;
      });
      emit('update:value', '');
      emit('clear', event);
    };
    const handleChange = (event: Event) => {
      if (clearing) {
        clearing = false;
        return;
      }
      const value = searchEventValue(event);
      if (value !== undefined) emit('update:value', value);
      emit('change', event);
    };
    return () =>
      h(Input, {
        ...attrs,
        placeholder: props.placeholder,
        // Input 已迁移到「根 class 走原生 attrs」⇒ 这里用 `class`
        class: [props.prefixCls, attrs.class],
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
