/** Rail —— 步骤连线（rc-steps `Rail.js` 16 行的 Vue 自建，逐字同构）。 */

import { defineComponent, h, type PropType } from 'vue';
import type { StepsStatus } from './interface';

const Rail = defineComponent({
  name: 'AStepsRail',
  props: {
    prefixCls: { type: String, required: true },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<Record<string, string | number>>, default: undefined },
    status: { type: String as PropType<StepsStatus>, required: true },
  },
  setup(props) {
    return () => {
      const railCls = `${props.prefixCls}-rail`;
      return h('div', {
        class: [railCls, `${railCls}-${props.status}`, props.className].filter(Boolean).join(' '),
        style: props.style as never,
      });
    };
  },
});

export default Rail;
