/** Space CSS consumers whose children are native controls or Space.Addon only. */
import { ConfigProvider, Space, SpaceAddon, SpaceCompact } from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, ref } from 'vue';

const frame = (name, children) =>
  h(
    'main',
    {
      'data-space-visual-case': name,
      style: {
        width: '100%',
        minHeight: '340px',
        boxSizing: 'border-box',
        padding: '16px',
        color: 'var(--apollo-color-text)',
        background: 'var(--apollo-color-bg-container)',
        fontFamily: 'var(--apollo-font-family)',
        fontSize: 'var(--apollo-font-size)',
      },
    },
    [h('h1', { style: { fontSize: '20px', margin: '0 0 20px' } }, `Space ${name}`), ...children],
  );

const NativeSpacing = defineComponent({
  setup() {
    const changed = ref(false);
    onMounted(() => {
      window.componentStyleEntriesSpace = {
        async update() {
          changed.value = true;
          await nextTick();
        },
      };
    });
    return () =>
      frame('native-spacing', [
        h(
          Space,
          {
            id: 'space-entry-native',
            orientation: changed.value ? 'vertical' : 'horizontal',
            align: 'start',
            size: changed.value ? 24 : [12, 8],
            separator: changed.value ? '›' : '|',
            wrap: true,
          },
          () => [
            h('button', { key: 'action', type: 'button' }, 'Native action'),
            h('input', {
              key: 'draft',
              id: 'space-entry-draft',
              'aria-label': 'Native spacing draft',
              style: { width: '120px', maxWidth: '100%' },
            }),
            h('strong', { key: 'summary' }, 'Native summary'),
          ],
        ),
      ]);
  },
});
const AddonCompact = defineComponent({
  setup() {
    const changed = ref(false);
    onMounted(() => {
      window.componentStyleEntriesSpace = {
        async update() {
          changed.value = true;
          await nextTick();
        },
      };
    });
    return () =>
      h(ConfigProvider, { direction: changed.value ? 'rtl' : 'ltr' }, () =>
        frame('addon-compact', [
          h(
            SpaceCompact,
            {
              id: 'space-entry-compact',
              block: true,
              size: changed.value ? 'large' : 'middle',
              orientation: changed.value ? 'vertical' : 'horizontal',
            },
            () => [
              h(SpaceAddon, { key: 'prefix' }, () => 'Prefix'),
              h(SpaceAddon, { key: 'draft', status: changed.value ? 'warning' : undefined }, () =>
                h('input', {
                  id: 'space-entry-draft',
                  'aria-label': 'Native Addon draft',
                  style: { width: '120px', maxWidth: '100%' },
                }),
              ),
              h(SpaceAddon, { key: 'suffix', disabled: changed.value }, () => 'Suffix'),
            ],
          ),
        ]),
      );
  },
});

export default {
  'native-spacing': () => h(NativeSpacing),
  'addon-compact': () => h(AddonCompact),
};
