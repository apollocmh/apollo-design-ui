import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { Button, ConfigProvider } from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, ref, shallowRef } from 'vue';
export const buttonNames = ['main', 'adjacent', 'link'];
export default defineComponent({
  props: { mode: { type: String, default: 'default' } },
  setup(props) {
    const stage = ref(0),
      shown = ref(true),
      loading = ref(true),
      extra = ref(false),
      native = ref(false),
      mounts = ref(0);
    const instance = shallowRef(null);
    const Probe = defineComponent({
      setup() {
        onMounted(() => mounts.value++);
        return () => h('strong', { 'data-hydrated-label': 'yes' }, '保存');
      },
    });
    const change = (fn) => async (value) => {
      fn(value);
      await nextTick();
    };
    onMounted(() => {
      window.buttonHydration = {
        cycleTheme: change(() => {
          stage.value = (stage.value + 1) % 3;
        }),
        show: change((value) => {
          shown.value = value;
        }),
        loading: change((value) => {
          loading.value = value;
        }),
        native: change((value) => {
          native.value = value;
        }),
        extra: change((value) => {
          extra.value = value;
        }),
        snapshot: () => ({
          nativeId: instance.value?.nativeElement?.id ?? null,
          mounts: mounts.value,
        }),
      };
    });
    return () =>
      h(
        ConfigProvider,
        {
          direction: 'rtl',
          theme:
            stage.value === 1
              ? undefined
              : {
                  ...(props.mode === 'dark'
                    ? { algorithm: darkAlgorithm }
                    : props.mode === 'compact'
                      ? { algorithm: compactAlgorithm }
                      : props.mode === 'both'
                        ? { algorithm: [darkAlgorithm, compactAlgorithm] }
                        : {}),
                  components: {
                    Button: {
                      contentFontSize: stage.value === 0 ? 18 : 21,
                      paddingInline: 23,
                      iconGap: 12,
                    },
                  },
                },
        },
        () =>
          h('main', [
            h('h1', 'Button hydration'),
            ...['first', 'second'].flatMap((name) => [
              h('label', { for: `hydrated-${name}-draft` }, `${name} draft`),
              h('input', { id: `hydrated-${name}-draft` }),
            ]),
            ...(shown.value
              ? [
                  h(
                    Button,
                    {
                      id: 'hydrated-main',
                      ref: instance,
                      loading: loading.value ? { delay: 1000 } : false,
                      style: native.value
                        ? { '--apollo-btn-content-font-size': '28px' }
                        : undefined,
                    },
                    {
                      default: () => [
                        h(Probe),
                        h('em', 'Tail'),
                        extra.value ? h('span', 'Extra') : null,
                      ],
                      icon: () => [h('i', 'Icon'), h('span', 'Tail')],
                    },
                  ),
                  h(Button, { id: 'hydrated-adjacent', loading: true }, () => [
                    h('span', 'Adjacent'),
                    h('b', 'Tail'),
                  ]),
                  h(
                    Button,
                    {
                      id: 'hydrated-link',
                      href: '#target',
                      loading: loading.value ? { delay: 1000 } : false,
                    },
                    () => 'Navigate',
                  ),
                ]
              : []),
          ]),
      );
  },
});
