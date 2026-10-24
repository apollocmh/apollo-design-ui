import { Masonry } from '@apollo-design/ui';
import { computed, defineComponent, h, ref } from 'vue';

export default defineComponent({
  setup() {
    const label = ref('Alpha');
    const layouts = ref(0);
    const items = computed(() => [
      { key: 'a', data: { title: label.value, height: 40 } },
      { key: 'b', data: { title: 'Beta', height: 80 } },
      { key: 'c', data: { title: 'Gamma', height: 20 } },
    ]);
    return () =>
      h('main', [
        h(
          'button',
          {
            onClick: () => {
              label.value = 'Updated';
            },
          },
          'Update hydrated data',
        ),
        h(
          Masonry,
          {
            'data-ssr-masonry': '',
            items: items.value,
            columns: 2,
            gutter: 12,
            style: { width: '320px' },
            onLayoutChange: () => {
              layouts.value++;
            },
          },
          {
            item: ({ key, data }) =>
              h('article', { style: { height: `${data.height}px` } }, [
                h('b', data.title),
                ...(key === 'a'
                  ? [
                      h('input', {
                        'aria-label': 'Hydrated masonry input',
                        'data-hydrated-masonry-input': '',
                      }),
                    ]
                  : []),
              ]),
          },
        ),
        h('output', { id: 'ssr-masonry-state' }, String(layouts.value)),
      ]);
  },
});
