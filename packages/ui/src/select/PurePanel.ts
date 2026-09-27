/**
 * `Select._InternalPanelDoNotUseOrYouWillBeFired` 的 Vue 对应物 —— 静态下拉面板。
 *
 * antd 用 `genPurePanel(Select, 'popupAlign')`：强制展开 + 把浮层渲染在原地。
 * 本仓的等价做法：强制 `open` + `getPopupContainer` 指向自身容器（Portal 会
 * Teleport 到该 div 里，DOM 上仍在原地）。
 */

import { defineComponent, h, ref } from 'vue';
import Select from './Select';

export const PurePanel = defineComponent({
  name: 'ASelectPurePanel',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    options: { type: Array as never, default: undefined },
    notFoundContent: { type: null as unknown as undefined, default: undefined },
    classNames: { type: Object as never, default: undefined },
    styles: { type: Object as never, default: undefined },
    listHeight: { type: Number, default: undefined },
    listItemHeight: { type: Number, default: undefined },
    virtual: { type: Boolean, default: undefined },
    optionRender: { type: Function as never, default: undefined },
    menuItemSelectedIcon: { type: null as unknown as undefined, default: undefined },
  },
  setup(props, { slots, attrs }) {
    const hostRef = ref<HTMLElement | null>(null);
    return () =>
      h('div', { ref: hostRef, class: `${props.prefixCls ?? 'apollo-select'}-dropdown-wrapper` }, [
        h(
          Select,
          {
            ...props,
            ...attrs,
            open: true,
            getPopupContainer: () => hostRef.value as HTMLElement,
          },
          slots,
        ),
      ]);
  },
});

export default PurePanel;
