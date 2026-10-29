import {
  compactAlgorithm,
  darkAlgorithm,
  getDesignToken,
  ThemeContextKey,
  ThemeProvider,
  useTheme,
} from '@apollo-design/theme';
import { ConfigProvider } from '@apollo-design/ui';
import { Divider } from '@apollo-design/ui/divider';
import {
  computed,
  defineComponent,
  Fragment,
  h,
  nextTick,
  onMounted,
  provide,
  reactive,
  ref,
  shallowRef,
} from 'vue';
import demos from './demos.mjs';

const cssScope = {
  '--apollo-font-size': '23px',
  '--apollo-font-size-lg': '25px',
  '--apollo-margin-xs': '37px',
  '--apollo-margin': '29px',
  '--apollo-margin-lg': '43px',
  '--apollo-line-width': '3px',
};
const section = (name, content, style) =>
  h(
    'section',
    {
      'data-divider-scene': name,
      style: {
        marginBlockEnd: '24px',
        padding: '8px',
        background: 'var(--apollo-color-bg-container)',
        color: 'var(--apollo-color-text)',
        ...style,
      },
    },
    content,
  );
const specimens = (name) =>
  section(name, [
    h(Divider, { 'data-kind': 'rail' }),
    h(Divider, { 'data-kind': 'title', titlePlacement: 'start' }, () => 'Section heading'),
    h(Divider, { 'data-kind': 'plain', plain: true }, () => 'Body heading'),
    h(Divider, { 'data-kind': 'vertical', orientation: 'vertical' }),
  ]);
const empty = (content) => h(ThemeProvider, { theme: {}, injectCssVar: false }, () => content);
const custom = defineComponent({
  setup(_, { slots }) {
    const config = shallowRef({});
    provide(ThemeContextKey, { config, token: computed(() => getDesignToken(config.value)) });
    return () => slots.default?.();
  },
});

const FallbackControl = defineComponent({
  setup() {
    const theme = useTheme();
    onMounted(() => {
      window.dividerAudit.fallback = async (config) => {
        theme.config.value = config;
        await nextTick();
      };
    });
    return () => null;
  },
});

const Live = defineComponent({
  setup() {
    const state = reactive({
      config: {
        className: 'provider-first',
        style: { padding: '3px' },
        classNames: { content: 'first-content' },
        styles: { rail: { opacity: 0.8 } },
      },
      direction: 'ltr',
      size: 'small',
      props: { titlePlacement: 'left' },
      attrs: { id: 'live-divider', class: 'native-first', style: 'padding:7px' },
      theme: {
        components: {
          Divider: { textPaddingInline: 12, orientationMargin: 0.2, verticalMarginInline: 16 },
        },
      },
      slot: true,
      listener: 0,
    });
    const owner = ref(null),
      calls = [];
    const listeners = [() => calls.push('first'), () => calls.push('second')];
    onMounted(() => {
      window.dividerAudit.set = async (patch) => {
        Object.assign(state, patch);
        await nextTick();
      };
      window.dividerAudit.snapshot = () => ({
        calls: [...calls],
        ref: owner.value?.nativeElement === document.querySelector('[data-divider-live]'),
      });
    });
    const content = () => [
      h('strong', 'Complete'),
      ' text ',
      0,
      h(Fragment, [h('em', 'fragment'), h('span', ' tail')]),
      h('input', {
        'aria-label': 'Divider live draft',
        style: { width: '90px', maxWidth: '100%' },
      }),
    ];
    return () =>
      h(
        ConfigProvider,
        {
          direction: state.direction,
          componentSize: state.size,
          components: { divider: state.config },
          theme: state.theme,
        },
        () =>
          h(
            Divider,
            {
              ...state.props,
              ...state.attrs,
              ref: owner,
              'data-divider-live': '',
              styles: { root: { padding: '5px' }, content: { minWidth: 0, whiteSpace: 'normal' } },
              onClick: listeners[state.listener],
            },
            state.slot ? { default: content } : {},
          ),
      );
  },
});

const DataSource = defineComponent({
  setup() {
    const config = shallowRef({
      components: {
        Divider: { textPaddingInline: 31, orientationMargin: 0.25, verticalMarginInline: 37 },
      },
    });
    const active = ref(true);
    provide(ThemeContextKey, {
      config,
      token: computed(() => getDesignToken(config.value)),
      sourceActive: computed(() => active.value),
    });
    onMounted(() => {
      window.dividerAudit.source = async (patch) => {
        if ('config' in patch) config.value = patch.config;
        if ('active' in patch) active.value = patch.active;
        await nextTick();
      };
    });
    return () =>
      section('data-source', [
        h(Divider, { id: 'data-title', titlePlacement: 'start' }, () => 'Token title'),
        h(Divider, { id: 'data-vertical', orientation: 'vertical' }),
      ]);
  },
});

export default defineComponent({
  setup() {
    window.dividerAudit = { ready: false };
    const demo = new URLSearchParams(location.search).get('demo');
    onMounted(() => {
      window.dividerAudit.ready = true;
    });
    return () =>
      h(
        'main',
        {
          id: 'stage',
          style: {
            width: '100%',
            maxWidth: '720px',
            padding: '16px',
            boxSizing: 'border-box',
            color: 'var(--apollo-color-text)',
            background: 'var(--apollo-color-bg-container)',
          },
        },
        demo
          ? [h('h1', `Divider ${demo}`), h(demos[demo])]
          : [
              h('h1', 'Divider current contracts'),
              h(FallbackControl),
              h(Live),
              h(DataSource),
              specimens('bare'),
              empty(specimens('explicit-default')),
              section('css-wrapper', specimens('css-only'), cssScope),
              section(
                'css-cp-wrapper',
                h(ConfigProvider, {}, () => specimens('css-no-theme-cp')),
                cssScope,
              ),
              section('css-empty-wrapper', empty(specimens('css-empty-tp')), cssScope),
              h(
                ThemeProvider,
                {
                  theme: { token: { fontSize: 22, marginXS: 31, lineWidth: 3 } },
                  injectCssVar: false,
                },
                () => specimens('theme-no-injection'),
              ),
              h(ConfigProvider, { theme: { algorithm: darkAlgorithm } }, () => specimens('dark')),
              h(ConfigProvider, { theme: { algorithm: [darkAlgorithm, compactAlgorithm] } }, () =>
                specimens('dark-compact'),
              ),
              h(ConfigProvider, { theme: { algorithm: compactAlgorithm } }, () =>
                specimens('compact'),
              ),
              h(ConfigProvider, { theme: { algorithm: compactAlgorithm } }, () =>
                empty(specimens('compact-empty-tp')),
              ),
              h(ConfigProvider, { theme: { algorithm: compactAlgorithm } }, () =>
                empty(h(ConfigProvider, {}, () => specimens('compact-empty-tp-cp'))),
              ),
              h(ConfigProvider, { theme: { algorithm: compactAlgorithm } }, () =>
                h(ConfigProvider, { theme: {} }, () => specimens('compact-empty-cp')),
              ),
              h(ConfigProvider, { theme: { algorithm: compactAlgorithm } }, () =>
                h(ConfigProvider, { theme: { inherit: false } }, () => specimens('inherit-false')),
              ),
              section(
                'custom-wrapper',
                h(custom, {}, () => specimens('custom-no-metadata')),
                cssScope,
              ),
              h(ConfigProvider, { direction: 'rtl' }, () =>
                section(
                  'rtl',
                  h(Divider, { titlePlacement: 'left' }, () => 'RTL title'),
                ),
              ),
              section('mixed', [
                h(Divider, { dashed: true, variant: 'dotted' }),
                h(Divider, { dashed: true, variant: 'dotted' }, () => 'Mixed title'),
              ]),
            ],
      );
  },
});
