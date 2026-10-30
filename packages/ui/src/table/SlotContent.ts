import { defineComponent, type PropType, type VNodeChild } from 'vue';

/** Keep native slot evaluation inside a render effect, including empty and array results. */
export default defineComponent({
  name: 'TableSlotContent',
  props: { renderContent: { type: Function as PropType<() => VNodeChild>, required: true } },
  setup: (props) => () => props.renderContent(),
});
