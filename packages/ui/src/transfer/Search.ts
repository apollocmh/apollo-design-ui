/**
 * Search —— Transfer 列表面板的搜索框。
 *
 * 契约来源：antd 6.6.4 `es/transfer/search.js`（**机械移植**）。
 *
 * 就是一层壳：`Input` + `allowClear` + 搜索图标前缀。清除按钮的点击在本仓
 * Input 的 `resolveOnChange` 里同样以 `e.type === 'click'` 的 change 事件冒泡
 * （与上游 useAllowClear 的事件契约逐字一致），据此触发 `handleClear`。
 */

import { SearchOutlined } from '@apollo-design/icons';
import { defineComponent, h, type PropType } from 'vue';
import Input from '../input';

const Search = defineComponent({
  name: 'ATransferSearch',
  inheritAttrs: false,
  props: {
    placeholder: { type: String, default: '' },
    value: { type: String, default: undefined },
    prefixCls: { type: String, required: true },
    disabled: { type: Boolean, default: undefined },
    onChange: {
      type: Function as PropType<(e: { type: string; target: { value?: string } }) => void>,
      default: undefined,
    },
    handleClear: { type: Function as PropType<() => void>, default: undefined },
  },
  setup(props) {
    const handleChange = (e: { type?: string; target?: { value?: string } }) => {
      if (e.type === 'click') {
        props.handleClear?.();
        return;
      }
      props.onChange?.(e as { type: string; target: { value?: string } });
    };
    return () =>
      h(Input, {
        placeholder: props.placeholder,
        className: props.prefixCls,
        value: props.value,
        onChange: handleChange,
        disabled: props.disabled,
        allowClear: true,
        prefix: h(SearchOutlined),
      });
  },
});

export default Search;
