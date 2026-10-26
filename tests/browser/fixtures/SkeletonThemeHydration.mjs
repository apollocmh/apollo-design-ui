import { computed, createCommentVNode, defineComponent, h, onMounted, ref } from 'vue';
import {
  ConfigProvider,
  Skeleton,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonImage,
  SkeletonInput,
  SkeletonNode,
} from '../../../packages/ui/dist/index.mjs';

export const skeletonNames = ['main', 'avatar', 'button', 'input', 'image', 'node'];
export default defineComponent({
  setup() {
    const phase = ref(0),
      extra = ref(false),
      loading = ref(true),
      present = ref(true),
      root = ref(null);
    const theme = computed(() =>
      phase.value === 1
        ? undefined
        : {
            components: {
              Skeleton: {
                titleHeight: phase.value === 2 ? 31 : 27,
                paragraphLiHeight: 19,
                gradientFromColor: '#dce8ff',
                gradientToColor: '#8cafff',
                blockRadius: 8,
              },
            },
          },
    );
    const components = computed(() =>
      phase.value === 1 ? undefined : { skeleton: { className: `phase-${phase.value}` } },
    );
    const content = (name) => [
      createCommentVNode('leading'),
      h('input', {
        id: `hydrated-${name}-draft`,
        'aria-label': `Hydrated ${name} draft`,
      }),
      ...(extra.value ? [h('b', `Extra ${name}`)] : []),
    ];
    onMounted(() => {
      window.skeletonHydration = {
        cycleTheme: () => {
          phase.value = (phase.value + 1) % 3;
        },
        toggleExtra: () => {
          extra.value = !extra.value;
        },
        loading: (value) => {
          loading.value = value;
        },
        show: (value) => {
          present.value = value;
        },
        snapshot: () => ({ nativeId: root.value?.nativeElement?.id ?? null }),
      };
    });
    return () =>
      h('main', [
        h('h1', 'Hydrated Skeleton workspace'),
        h(
          ConfigProvider,
          {
            theme: theme.value,
            components: components.value,
          },
          () =>
            present.value
              ? [
                  h(
                    Skeleton,
                    { id: 'hydrated-main', ref: root, loading: loading.value, avatar: true },
                    {
                      default: () =>
                        h('input', {
                          id: 'hydrated-loaded-draft',
                          'aria-label': 'Hydrated loaded draft',
                        }),
                    },
                  ),
                  h(SkeletonAvatar, { id: 'hydrated-avatar' }),
                  h(SkeletonButton, { id: 'hydrated-button' }),
                  h(SkeletonInput, { id: 'hydrated-input' }),
                  h(SkeletonImage, { id: 'hydrated-image' }, { default: () => content('image') }),
                  h(SkeletonNode, { id: 'hydrated-node' }, { default: () => content('node') }),
                ]
              : [],
        ),
      ]);
  },
});
