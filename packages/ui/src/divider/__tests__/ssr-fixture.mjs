import {
  compactAlgorithm,
  createThemeContext,
  ThemeContextKey,
  ThemeProvider,
  useTheme,
} from '@apollo-design/theme';
import { ConfigProvider } from '@apollo-design/ui';
import { Divider } from '@apollo-design/ui/divider';
import { computed, createSSRApp, defineComponent, Fragment, h, provide } from 'vue';
import { renderToString } from 'vue/server-renderer';

export async function verify() {
  if (typeof window !== 'undefined' || typeof document !== 'undefined')
    throw Error('Expected actual Node SSR');
  const results = [],
    warnings = [];
  const render = async (component) => {
    const app = createSSRApp(component);
    app.config.warnHandler = (m) => warnings.push(m);
    return renderToString(app);
  };
  const custom = {
    token: { fontSize: 18 },
    components: {
      Divider: { textPaddingInline: 12, orientationMargin: 0.25, verticalMarginInline: 23 },
    },
  };
  const source = (kind) => {
    const context = createThemeContext(kind === 'custom' ? custom : {});
    if (kind === 'inactive') return { ...context, sourceActive: computed(() => false) };
    if (kind === 'flagless') return { config: context.config, token: context.token };
    return context;
  };
  const rich = () => [
    h('strong', 'Complete'),
    ' text ',
    0,
    h(Fragment, [
      h('em', 'fragment'),
      h('input', { 'aria-label': 'Server divider draft', value: 'Draft' }),
    ]),
  ];
  for (const kind of ['inactive', 'default', 'custom', 'flagless'])
    for (const shape of ['rail', 'title', 'vertical', 'zero']) {
      const context = source(kind),
        content = shape === 'title' ? rich : shape === 'zero' ? () => 0 : undefined;
      const html = await render(
        defineComponent({
          setup() {
            provide(ThemeContextKey, context);
            return () =>
              h(
                Divider,
                {
                  orientation: shape === 'vertical' ? 'vertical' : 'horizontal',
                  id: 'server-divider',
                  style: ['padding:7px', { '--apollo-divider-text-padding-inline': '13px' }],
                },
                content ? { default: content } : {},
              );
          },
        }),
      );
      const active = kind !== 'inactive',
        title = shape === 'title' || shape === 'zero';
      results.push({
        name: `${kind}/${shape}`,
        passed:
          html.includes('id="server-divider"') &&
          html.includes('padding:7px') &&
          html.includes('--apollo-divider-text-padding-inline:13px') &&
          html.includes('--apollo-font-size:') === active &&
          html.includes('role="group"') === title &&
          html.includes('aria-orientation="vertical"') === (shape === 'vertical') &&
          (!title ||
            shape === 'zero' ||
            (html.includes('<strong>Complete</strong> text 0') &&
              html.includes('value="Draft"'))) &&
          !html.includes('style=""') &&
          !html.includes('[object Object]'),
      });
    }
  const configured = await render(
    defineComponent({
      setup: () => () =>
        h(
          ConfigProvider,
          {
            direction: 'rtl',
            componentSize: 'small',
            divider: { className: 'server-config', style: { padding: '3px' } },
            theme: custom,
          },
          () => h(Divider, { style: 'padding:7px', titlePlacement: 'left' }, rich),
        ),
    }),
  );
  results.push({
    name: 'ConfigProvider actual configuration/source/native priority',
    passed:
      configured.includes('server-config') &&
      configured.includes('divider-sm') &&
      configured.includes('with-text-end') &&
      configured.includes('dir="rtl"') &&
      configured.includes('padding:7px') &&
      configured.includes('--apollo-divider-vertical-margin-inline:23px'),
  });
  const theme = await render(
    defineComponent({
      setup: () => () => h(ThemeProvider, { theme: custom, injectCssVar: false }, () => h(Divider)),
    }),
  );
  results.push({
    name: 'ThemeProvider without CSS injection',
    passed:
      theme.includes('--apollo-font-size:18px') &&
      theme.includes('--apollo-divider-orientation-margin:0.25'),
  });
  const reset = await render(
    defineComponent({
      setup: () => () =>
        h(ConfigProvider, { theme: { algorithm: compactAlgorithm } }, () =>
          h(ThemeProvider, { theme: {}, injectCssVar: false }, () =>
            h(Divider, { orientation: 'vertical' }),
          ),
        ),
    }),
  );
  results.push({
    name: 'nested explicit default source resets compact values',
    passed:
      reset.includes('--apollo-font-size:14px') &&
      reset.includes('--apollo-divider-vertical-margin-inline:8px'),
  });
  let fallback, previous;
  try {
    const html = await render(
      defineComponent({
        setup() {
          fallback = useTheme();
          previous = fallback.config.value;
          fallback.config.value = { token: { marginXS: 31 } };
          return () => h(Divider, { orientation: 'vertical' });
        },
      }),
    );
    results.push({
      name: 'bare fallback source is consumed within its app',
      passed: html.includes('--apollo-divider-vertical-margin-inline:31px'),
    });
  } finally {
    if (fallback) fallback.config.value = previous;
  }
  for (const padding of [11, 29]) {
    const context = createThemeContext({ components: { Divider: { textPaddingInline: padding } } });
    const html = await render(
      defineComponent({
        setup() {
          provide(ThemeContextKey, context);
          return () => h(Divider, { prefixCls: 'scoped-divider' }, () => 'Scoped title');
        },
      }),
    );
    results.push({
      name: `isolated source/namespace ${padding}`,
      passed:
        html.includes(`--scoped-divider-text-padding-inline:${padding}px`) &&
        !html.includes('--apollo-divider-text-padding-inline:'),
    });
  }
  return { results, warnings, browserGlobals: false };
}
