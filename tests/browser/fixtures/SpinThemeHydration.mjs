import { computed, createCommentVNode, defineComponent, h, ref } from 'vue';
import { ConfigProvider, Spin } from '../../../packages/ui/dist/index.mjs';

export default defineComponent({
  setup() {
    const phase = ref(0);
    const fullscreen = ref(false);
    const spinning = ref(true);
    const percent = ref(0);
    const theme = computed(() =>
      phase.value === 1
        ? undefined
        : {
            token: { colorPrimary: phase.value === 2 ? '#246b45' : '#38598b' },
            components: {
              Spin: {
                dotSize: phase.value === 2 ? 27 : 31,
                dotSizeSM: 13,
                dotSizeLG: 47,
                contentHeight: 96,
              },
            },
          },
    );
    const button = (label, action) =>
      h(
        'button',
        { type: 'button', onMousedown: (event) => event.preventDefault(), onClick: action },
        label,
      );
    return () =>
      h('main', [
        h('h1', 'Hydrated loading workspace'),
        button('Cycle theme', () => {
          phase.value = (phase.value + 1) % 3;
        }),
        button('Toggle fullscreen', () => {
          fullscreen.value = !fullscreen.value;
        }),
        button('Toggle loading', () => {
          spinning.value = !spinning.value;
        }),
        button('Update progress', () => {
          percent.value = 37;
        }),
        h(ConfigProvider, { theme: theme.value }, () => [
          h(
            Spin,
            {
              id: 'hydrated-spin',
              percent: percent.value,
              fullscreen: fullscreen.value,
              spinning: spinning.value,
              description: 'Hydrated progress',
            },
            {
              default: () =>
                h('input', { id: 'hydrated-spin-draft', 'aria-label': 'Hydrated body draft' }),
            },
          ),
          h(
            Spin,
            { id: 'hydrated-custom', percent: percent.value, fullscreen: fullscreen.value },
            {
              indicator: ({ percent }) => [
                createCommentVNode('conditional first child'),
                h('input', {
                  id: 'hydrated-indicator-draft',
                  'aria-label': 'Hydrated indicator draft',
                }),
                h('output', { 'aria-label': 'Hydrated custom progress' }, String(percent)),
              ],
            },
          ),
          h(Spin, { id: 'hydrated-indeterminate' }),
          h(Spin, { id: 'hydrated-idle', fullscreen: true, spinning: false }),
        ]),
      ]);
  },
});
