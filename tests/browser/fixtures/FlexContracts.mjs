import { compactAlgorithm, darkAlgorithm, ThemeProvider } from '@apollo-design/theme';
import { ConfigProvider, Flex } from '@apollo-design/ui';
import { computed, defineComponent, Fragment, h, nextTick, onMounted, reactive, ref } from 'vue';

const NativeHost = defineComponent({
  name: 'FlexNativeHost',
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h('section', attrs, slots.default?.());
  },
});
const boxes = () => [
  h(
    'span',
    {
      'data-flex-box': 'a',
      style: {
        display: 'block',
        width: '40px',
        minHeight: '20px',
        background: 'var(--apollo-color-fill)',
      },
    },
    'A',
  ),
  h(
    'span',
    {
      'data-flex-box': 'b',
      style: {
        display: 'block',
        width: '40px',
        minHeight: '60px',
        background: 'var(--apollo-color-fill)',
      },
    },
    'B',
  ),
];
export default defineComponent({
  setup() {
    const state = reactive({
      props: {},
      native: {
        id: 'flex-main',
        class: 'native-before',
        style: { width: '360px', height: '140px' },
        'aria-label': 'Business layout',
      },
      config: {},
      rtl: false,
      content: true,
      mounted: true,
      component: 'div',
      listener: 'first',
      theme: 'light',
      custom: false,
      weight: 1,
      probeWidth: 300,
    });
    const mainRef = ref(null),
      saved = ref(null),
      calls = reactive({ first: 0, second: 0, keydowns: 0, nativeEvents: true });
    const theme = computed(() => ({
      algorithm:
        state.theme === 'dark'
          ? darkAlgorithm
          : state.theme === 'compact'
            ? compactAlgorithm
            : state.theme === 'both'
              ? [darkAlgorithm, compactAlgorithm]
              : undefined,
      token: state.custom ? { paddingXS: 19, padding: 23, paddingLG: 29 } : {},
    }));
    const click = (name) => (event) => {
      calls[name]++;
      calls.nativeEvents = calls.nativeEvents && event instanceof MouseEvent;
    };
    const first = click('first'),
      second = click('second');
    onMounted(() => {
      window.flexAudit = {
        async set(patch) {
          Object.assign(state, patch);
          await nextTick();
        },
        snapshot() {
          return {
            ref: mainRef.value?.nativeElement === document.querySelector('[data-flex-main]'),
            previousCleared: saved.value?.nativeElement === null,
            calls: { ...calls },
            state: { rtl: state.rtl, content: state.content },
          };
        },
        async unmount() {
          saved.value = mainRef.value;
          state.mounted = false;
          await nextTick();
        },
      };
    });
    return () =>
      h(
        ConfigProvider,
        { direction: state.rtl ? 'rtl' : 'ltr', components: { flex: state.config } },
        () =>
          h(ThemeProvider, { theme: theme.value }, () =>
            h(
              'main',
              {
                style: {
                  padding: '24px',
                  color: 'var(--apollo-color-text)',
                  background: 'var(--apollo-color-bg-container)',
                  fontFamily: 'var(--apollo-font-family)',
                },
              },
              [
                h('h1', 'Flex native contracts'),
                state.mounted
                  ? h(
                      Flex,
                      {
                        ...state.props,
                        ...state.native,
                        component: state.component === 'custom' ? NativeHost : state.component,
                        ref: mainRef,
                        'data-flex-main': '',
                        onClick:
                          state.listener === 'first'
                            ? first
                            : state.listener === 'second'
                              ? second
                              : undefined,
                        onKeydown: () => calls.keydowns++,
                      },
                      state.content
                        ? {
                            default: () => [
                              h('strong', 'Complete'),
                              ' text ',
                              0,
                              h(Fragment, [
                                h('input', { key: 'draft', 'aria-label': 'Persistent Flex draft' }),
                                h('span', ' tail'),
                              ]),
                            ],
                          }
                        : {},
                    )
                  : null,
                h(
                  Flex,
                  {
                    ...state.props,
                    'data-flex-geometry': '',
                    style: { width: `${state.probeWidth}px`, height: '140px', marginBlock: '16px' },
                  },
                  boxes,
                ),
                h(Flex, { 'data-flex-allocation': '', style: { width: '300px' } }, () => [
                  h(Flex, { flex: state.weight, 'data-flex-weight': '' }, () => h('span', 'One')),
                  h(Flex, { flex: 2 }, () => h('span', 'Two')),
                ]),
                ...['small', 'medium', 'middle', 'large'].map((gap) =>
                  h(Flex, { gap, 'data-flex-gap': gap, style: { marginBlockEnd: '12px' } }, () => [
                    h('span', { style: { display: 'block', width: '20px', height: '20px' } }, 'A'),
                    h('span', { style: { display: 'block', width: '20px', height: '20px' } }, 'B'),
                  ]),
                ),
                h(ThemeProvider, { theme: { token: { paddingXS: 19 } } }, () =>
                  h(Flex, { gap: 'small', 'data-flex-theme-outer': '' }, () =>
                    h(ThemeProvider, { theme: {} }, () =>
                      h(Flex, { gap: 'small', 'data-flex-theme-inner': '' }, () => 'Inner reset'),
                    ),
                  ),
                ),
                h(Flex, { id: 'flex-independent', vertical: true, gap: 5 }, () => 'Independent'),
              ],
            ),
          ),
      );
  },
});
