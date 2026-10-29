import {
  applyCSSVar,
  createCSSVarScope,
  getDesignToken,
  ThemeProvider,
  token2CSSVar,
  useTheme,
} from '@apollo-design/theme';
import {
  createSSRApp,
  defineComponent,
  h,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
} from 'vue';

/** The same app is rendered on the server and hydrated in the browser. */
export function createThemeFoundationFixture(targets = {}) {
  const config = ref({ cssVarPrefix: 'first', token: { colorPrimary: '#0055aa', fontSize: 14 } });
  const enabled = ref(true);
  const shown = ref(true);
  const extra = ref(false);
  const target = shallowRef(targets.first);
  const contexts = [];
  const stats = { setups: 0, mounts: 0, unmounts: 0 };
  const Child = defineComponent({
    setup() {
      stats.setups += 1;
      onMounted(() => {
        stats.mounts += 1;
      });
      onUnmounted(() => {
        stats.unmounts += 1;
      });
      const theme = useTheme();
      contexts.push(theme);
      const draft = ref('server draft');
      return () =>
        h('section', { id: 'business-child' }, [
          h('input', {
            id: 'draft',
            value: draft.value,
            onInput: (event) => {
              draft.value = event.target.value;
            },
          }),
          h(
            'span',
            {
              id: 'theme-observer',
              style: {
                color: `var(${token2CSSVar('colorPrimary', theme.config.value.cssVarPrefix)})`,
                fontSize: `var(${token2CSSVar('fontSize', theme.config.value.cssVarPrefix)})`,
              },
            },
            `${theme.token.value.fontSize}|${theme.token.value.colorPrimary}`,
          ),
        ]);
    },
  });
  const app = createSSRApp({
    render: () =>
      shown.value
        ? h(
            ThemeProvider,
            { theme: config.value, injectCssVar: enabled.value, target: target.value },
            {
              default: () => [
                h(Child),
                ...(extra.value ? [h('em', { id: 'conditional-slot' }, 'extra')] : []),
              ],
            },
          )
        : h('aside', { id: 'provider-unmounted' }, 'unmounted'),
  });
  const settled = async () => {
    await nextTick();
    await nextTick();
  };
  return {
    app,
    stats,
    async set(patch) {
      if ('enabled' in patch) enabled.value = patch.enabled;
      if ('target' in patch) target.value = patch.target === null ? null : targets[patch.target];
      if ('config' in patch) config.value = patch.config;
      if ('shown' in patch) shown.value = patch.shown;
      if ('extra' in patch) extra.value = patch.extra;
      await settled();
    },
    async setTargetElement(element) {
      target.value = element;
      await settled();
    },
    async writeConfig(patch) {
      const context = contexts.at(-1);
      if (!context) throw new Error('no mounted theme reader');
      if ('prefix' in patch) context.config.value.cssVarPrefix = patch.prefix;
      if ('fontSize' in patch) context.config.value.token.fontSize = patch.fontSize;
      await settled();
    },
    async writePropFont(fontSize) {
      config.value.token.fontSize = fontSize;
      await settled();
    },
    currentPropFont: () => config.value.token.fontSize,
    checkScopes() {
      const el = document.createElement('div');
      const rows = [];
      const token = (colorPrimary) => getDesignToken({ token: { colorPrimary } });
      const key = '--apollo-color-primary';
      const expect = (name, value, expected) =>
        rows.push({ name, value, expected, passed: value === expected });
      el.style.setProperty(key, '#663399', 'important');
      const a = createCSSVarScope(el),
        b = createCSSVarScope(el);
      a.apply(token('#0055aa'));
      b.apply(token('#aa3300'));
      a.remove();
      expect('older owner removal preserves newer', el.style.getPropertyValue(key), '#aa3300');
      b.remove();
      expect('last owner restores original inline', el.style.getPropertyValue(key), '#663399');
      expect('last owner restores important', el.style.getPropertyPriority(key), 'important');
      a.apply(token('#0055aa'));
      b.apply(token('#aa3300'));
      b.remove();
      expect('newer owner removal restores older', el.style.getPropertyValue(key), '#0055aa');
      el.style.setProperty(key, '#228844', 'important');
      a.remove();
      expect('cleanup retains a later external write', el.style.getPropertyValue(key), '#228844');
      a.apply(token('#0055aa'));
      applyCSSVar(el, token('#0055aa'));
      a.remove();
      expect(
        'equal one-shot value survives owner cleanup',
        el.style.getPropertyValue(key),
        '#0055aa',
      );
      for (let i = 0; i < 8; i += 1) applyCSSVar(el, token('#aa3300'));
      a.apply(token('#0055aa'));
      a.remove();
      expect(
        'repeated one-shot writes remain a baseline',
        el.style.getPropertyValue(key),
        '#aa3300',
      );
      return rows;
    },
  };
}
