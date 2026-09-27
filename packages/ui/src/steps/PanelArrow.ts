/** PanelArrow —— panel 类型步与步之间的箭头分隔（antd `PanelArrow.tsx` 的 Vue 自建）。 */

import { defineComponent, h } from 'vue';

const PanelArrow = defineComponent({
  name: 'AStepsPanelArrow',
  props: {
    prefixCls: { type: String, required: true },
  },
  setup(props) {
    return () =>
      // 装饰性分隔符，对读屏隐藏（antd 同款 aria-hidden）
      h(
        'svg',
        {
          'aria-hidden': true,
          class: `${props.prefixCls}-panel-arrow`,
          viewBox: '0 0 100 100',
          xmlns: 'http://www.w3.org/2000/svg',
          preserveAspectRatio: 'none',
        },
        [h('path', { d: 'M 0 0 L 100 50 L 0 100' })],
      );
  },
});

export default PanelArrow;
