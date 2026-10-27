import { compactAlgorithm } from '@apollo-design/theme';
import { ConfigProvider, List, Mentions, Select, Table, Transfer } from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, ref } from 'vue';
import { en_US, zh_CN } from '../../../packages/locale/dist/index.mjs';

export default defineComponent({
  setup() {
    const kind = ref('list'),
      current = ref(false),
      compact = ref(false);
    onMounted(() => {
      window.emptyConsumers = {
        async select(value) {
          kind.value = value;
          current.value = false;
          compact.value = false;
          await nextTick();
        },
        async current(value) {
          current.value = value;
          await nextTick();
        },
        async compact(value) {
          compact.value = value;
          await nextTick();
        },
      };
    });
    const content = () => {
      switch (kind.value) {
        case 'list':
          return h(List, { dataSource: [] });
        case 'table':
          return h(Table, {
            columns: [{ key: 'name', dataIndex: 'name', title: 'Name' }],
            dataSource: [],
            pagination: false,
          });
        case 'filter':
          return h(Table, {
            columns: [
              {
                key: 'name',
                dataIndex: 'name',
                title: 'Name',
                filters: [],
                filterDropdownProps: { open: true },
              },
            ],
            dataSource: [],
            pagination: false,
          });
        case 'select':
          return h(Select, {
            open: true,
            options: [],
            virtual: false,
            'aria-label': 'Empty select',
          });
        case 'transfer':
          return h(Transfer, { dataSource: [], targetKeys: [] });
        default:
          return h(Mentions, { options: [], 'aria-label': 'Empty mention users' });
      }
    };
    return () =>
      h(
        ConfigProvider,
        {
          locale: current.value ? zh_CN : en_US,
          direction: current.value ? 'rtl' : 'ltr',
          components: {
            empty: { className: current.value ? 'consumer-current' : 'consumer-initial' },
          },
          theme: compact.value ? { algorithm: compactAlgorithm } : undefined,
        },
        () =>
          h(
            'main',
            {
              style: {
                padding: '24px',
                minHeight: '320px',
                background: 'var(--apollo-color-bg-container)',
                color: 'var(--apollo-color-text)',
              },
            },
            [
              h('h1', 'Real empty-state consumers'),
              h('div', { key: kind.value, 'data-consumer': kind.value }, [content()]),
            ],
          ),
      );
  },
});
