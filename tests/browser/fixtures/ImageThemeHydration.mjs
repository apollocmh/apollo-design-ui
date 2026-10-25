import { computed, defineComponent, h, ref } from 'vue';
import { ConfigProvider, Image, ImagePreviewGroup } from '../../../packages/ui/dist/index.mjs';

const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="140"><rect width="240" height="140" fill="#38598b"/></svg>')}`;
export default defineComponent({
  setup() {
    const phase = ref(0);
    const theme = computed(() =>
      phase.value === 1
        ? undefined
        : {
            token: { colorBgSpotlight: phase.value === 2 ? '#234567' : '#123456' },
            components: {
              Image: {
                previewOperationSize: phase.value === 2 ? 27 : 31,
                imagePreviewSwitchSize: 57,
              },
            },
          },
    );
    const previewSlots = {
      previewImage: (info) =>
        h('figure', { class: 'theme-hydration-editor' }, [
          info.originNode,
          h('input', { 'aria-label': 'Hydrated preview note' }),
        ]),
    };
    return () =>
      h('section', [
        h('nav', { style: { position: 'fixed', top: '0', left: '0', zIndex: 3000 } }, [
          h(
            'button',
            {
              type: 'button',
              onMousedown: (event) => event.preventDefault(),
              onClick: () => {
                phase.value = (phase.value + 1) % 3;
              },
            },
            'Cycle hydrated theme',
          ),
        ]),
        h(
          ConfigProvider,
          { theme: theme.value },
          {
            default: () =>
              h('section', { 'data-theme-hydration-content': '' }, [
                h('input', {
                  'data-theme-hydration-draft': '',
                  'aria-label': 'Hydrated theme draft',
                }),
                h(
                  Image,
                  {
                    src: source,
                    alt: 'Hydrated themed image',
                    width: 160,
                    'data-hydrated-image': '',
                  },
                  previewSlots,
                ),
                h(ImagePreviewGroup, null, {
                  ...previewSlots,
                  default: () => [
                    h(Image, {
                      src: source,
                      alt: 'Hydrated themed group',
                      width: 120,
                      'data-hydrated-group': '',
                    }),
                    h(Image, { src: source, alt: 'Hydrated group second', width: 120 }),
                  ],
                }),
              ]),
          },
        ),
        h('output', { 'data-theme-hydration-phase': '', hidden: true }, String(phase.value)),
      ]);
  },
});
