import { darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider, Empty, PRESENTED_IMAGE_SIMPLE } from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, ref, shallowRef } from 'vue';
import { en_US, zh_CN } from '../../../packages/locale/dist/index.mjs';

export const emptyNames = ['main', 'adjacent', 'illustration'];
export default defineComponent({
  setup() {
    const stage = ref(0),
      shown = ref(true),
      extra = ref(false);
    const instance = shallowRef(null);
    onMounted(() => {
      window.emptyHydration = {
        async stage(value) {
          stage.value = value;
          await nextTick();
        },
        async extra(value) {
          extra.value = value;
          await nextTick();
        },
        async show(value) {
          shown.value = value;
          await nextTick();
        },
        snapshot: () => ({ nativeId: instance.value?.nativeElement?.id ?? null }),
      };
    });
    return () =>
      h(
        ConfigProvider,
        {
          locale: stage.value === 1 ? zh_CN : en_US,
          direction: stage.value === 1 ? 'rtl' : 'ltr',
          theme: stage.value === 1 ? { algorithm: darkAlgorithm } : undefined,
          components:
            stage.value === 2
              ? undefined
              : {
                  empty: {
                    className: stage.value === 0 ? 'provider-initial' : 'provider-next',
                    image: stage.value === 1 ? PRESENTED_IMAGE_SIMPLE : undefined,
                  },
                },
        },
        () =>
          h('main', [
            h('h1', 'Empty hydration'),
            ...(shown.value
              ? [
                  h(
                    Empty,
                    { id: 'hydrated-main', ref: instance, description: 'Fallback' },
                    {
                      image: () => [
                        h('label', { for: 'hydrated-image-draft' }, 'Image draft'),
                        h('input', { id: 'hydrated-image-draft' }),
                        h('strong', 'Image tail'),
                        extra.value ? h('b', 'Conditional image content') : null,
                      ],
                      description: () => [
                        h('span', 'Description'),
                        h('strong', 'Description tail'),
                      ],
                      default: () => [
                        h('label', { for: 'hydrated-footer-draft' }, 'Footer draft'),
                        h('input', { id: 'hydrated-footer-draft' }),
                        h('button', { type: 'button' }, 'Create'),
                        h('strong', 'Footer tail'),
                      ],
                    },
                  ),
                  h(
                    ConfigProvider,
                    { components: { empty: { className: 'nearest-config' } }, direction: 'ltr' },
                    () => h(Empty, { id: 'hydrated-adjacent', image: PRESENTED_IMAGE_SIMPLE }),
                  ),
                  h(Empty, { id: 'hydrated-illustration' }),
                ]
              : []),
          ]),
      );
  },
});
