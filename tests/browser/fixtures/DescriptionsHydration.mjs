import { ConfigProvider, Descriptions, DescriptionsItem } from '@apollo-design/ui';
import { defineComponent, h, ref } from 'vue';

export function createDescriptionsHydration() {
  // The field owns its input; the parent must not remount it when geometry changes.
  // A repeatedly rendered h('input', { value }) would instead be a controlled value write.
  const NativeEditor = defineComponent({
    setup: () => () => h('input', { value: 'Server draft', 'aria-label': 'Hydrated field draft' }),
  });
  const column = ref(3),
    bordered = ref(false),
    layout = ref('horizontal');
  const component = defineComponent({
    setup: () => () =>
      h(
        ConfigProvider,
        {
          theme: { components: { Descriptions: { titleMarginBottom: 29, itemPaddingBottom: 11 } } },
        },
        () =>
          h(
            Descriptions,
            {
              id: 'hydrated-descriptions',
              column: column.value,
              bordered: bordered.value,
              layout: layout.value,
            },
            {
              title: () => [h('b', 'Server'), ' title'],
              extra: () => h('button', { type: 'button' }, 'Server action'),
              default: () => [
                h(DescriptionsItem, { key: 'a', label: 'A' }, () => 'Alpha'),
                h(
                  DescriptionsItem,
                  { key: 'b', label: 'B' },
                  {
                    label: () => [h('b', 'Server'), ' label'],
                    default: () => h(NativeEditor),
                  },
                ),
                h(DescriptionsItem, { key: 'c', label: 'C', span: 'filled' }, () => [
                  h('strong', 'Gamma'),
                  0,
                ]),
                h(DescriptionsItem, { key: 'd', label: 'D' }, () => 'Delta'),
              ],
            },
          ),
      ),
  });
  return {
    component,
    update() {
      column.value = 1;
      bordered.value = true;
      layout.value = 'vertical';
    },
  };
}
