/**
 * The actual dialog; root/native events are owned by DrawerPopup.
 * Historical reference: @rc-component/drawer 1.4.2 es/DrawerPanel.js.
 */
import { defineComponent, h } from 'vue';

export default defineComponent({
  name: 'ADrawerSection',
  inheritAttrs: false,
  props: { prefixCls: { type: String, required: true } },
  setup(props, { attrs, slots }) {
    return () =>
      h(
        'div',
        {
          role: 'dialog',
          'aria-modal': 'true',
          ...attrs,
          class: [`${props.prefixCls}-section`, attrs.class],
        },
        slots.default?.(),
      );
  },
});
