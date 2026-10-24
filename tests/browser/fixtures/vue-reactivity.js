import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/style.css';
import { Button, Descriptions, DescriptionsItem } from '@apollo-design/ui';
import { createApp, defineComponent, h, ref } from 'vue';
import ContentSlots from '../../../packages/ui/src/alert/demo/content-slots.vue';
import BadgeSlots from '../../../packages/ui/src/badge/demo/content-slots.vue';
import PrefixSuffix from '../../../packages/ui/src/input-number/demo/presuffix.vue';
import ConditionalSelect from '../../../packages/ui/src/select/demo/conditional-options.vue';
import TableReorder from '../../../packages/ui/src/table/demo/drag-reorder.vue';
import EventEmits from './EventEmits.vue';
import NativeAttrs from './NativeAttrs.vue';

const Rows = defineComponent({
  setup() {
    const count = ref(1);
    const vertical = ref(false);
    return () =>
      h('div', [
        h(
          Button,
          {
            onClick: () => {
              count.value = count.value === 1 ? 4 : 1;
            },
          },
          () => 'Toggle rows',
        ),
        h(
          Button,
          {
            onClick: () => {
              vertical.value = !vertical.value;
            },
          },
          () => 'Toggle layout',
        ),
        h(
          Descriptions,
          { column: 3, layout: vertical.value ? 'vertical' : 'horizontal' },
          {
            default: () =>
              Array.from({ length: count.value }, (_, i) =>
                h(DescriptionsItem, { key: i, label: `Label ${i}` }, () => `Content ${i}`),
              ),
          },
        ),
      ]);
  },
});
const name = new URLSearchParams(location.search).get('demo') ?? 'select';
const Demo = {
  select: ConditionalSelect,
  'input-number': PrefixSuffix,
  descriptions: Rows,
  'content-slots': ContentSlots,
  events: EventEmits,
  attrs: NativeAttrs,
  'table-reorder': TableReorder,
  badge: BadgeSlots,
}[name];
createApp({ render: () => h('main', { style: 'padding: 32px' }, [h(Demo)]) }).mount('#app');
