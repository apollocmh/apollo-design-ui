import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import {
  ConfigProvider,
  DatePicker,
  Dropdown,
  Menu,
  Popconfirm,
  Popover,
  RangePicker,
  Tooltip,
  Tour,
} from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, ref } from 'vue';

export default defineComponent({
  setup() {
    const kind = ref('tooltip'),
      stage = ref(0),
      open = ref(true);
    onMounted(() => {
      window.triggerThemes = {
        async select(value) {
          kind.value = value;
          stage.value = 0;
          open.value = true;
          await nextTick();
        },
        async stage(value) {
          stage.value = value;
          await nextTick();
        },
        async open(value) {
          open.value = value;
          await nextTick();
        },
      };
    });
    const button = () => h('button', { type: 'button' }, 'Open current popup');
    const widget = () => {
      switch (kind.value) {
        case 'tooltip':
          return h(Tooltip, { open: open.value, title: 'Current tooltip' }, { default: button });
        case 'popover':
          return h(
            Popover,
            { open: open.value, title: 'Current popover', content: 'Current popup content' },
            { default: button },
          );
        case 'popconfirm':
          return h(
            Popconfirm,
            {
              open: open.value,
              title: 'Current confirmation',
              description: 'Current popup content',
            },
            { default: button },
          );
        case 'dropdown':
          return h(
            Dropdown,
            { open: open.value, menu: { items: [{ key: 'a', label: 'Current item' }] } },
            { default: button },
          );
        case 'menu':
          return h(Menu, {
            mode: 'horizontal',
            openKeys: open.value ? ['group'] : [],
            items: [
              { key: 'group', label: 'Group', children: [{ key: 'item', label: 'Current item' }] },
            ],
          });
        case 'date-picker':
          return h(DatePicker, { open: open.value });
        case 'range-picker':
          return h(RangePicker, { open: open.value });
        default:
          return h(Tour, {
            open: open.value,
            current: 0,
            steps: [{ title: 'Current tour', description: 'Current popup content', target: null }],
          });
      }
    };
    return () =>
      h(
        ConfigProvider,
        {
          theme:
            stage.value === 2
              ? undefined
              : stage.value === 0
                ? { token: { controlHeightLG: 52 } }
                : { algorithm: [darkAlgorithm, compactAlgorithm], token: { controlHeightLG: 63 } },
        },
        () =>
          h(
            'main',
            {
              style: {
                padding: '48px',
                minHeight: '700px',
                background: 'var(--apollo-color-bg-container)',
                color: 'var(--apollo-color-text)',
              },
            },
            [h('h1', 'Actual shared popup themes'), h('div', { key: kind.value }, [widget()])],
          ),
      );
  },
});
