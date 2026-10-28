import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider, Flex } from '@apollo-design/ui';
import { defineComponent, Fragment, h, nextTick, onMounted, ref } from 'vue';
import original from '../vue/flex.js';

const frame = (name, children) =>
  h(
    'main',
    {
      'data-flex-visual': name,
      style: {
        padding: '24px',
        minHeight: '180px',
        color: 'var(--apollo-color-text)',
        background: 'var(--apollo-color-bg-container)',
        fontFamily: 'var(--apollo-font-family)',
        fontSize: 'var(--apollo-font-size)',
      },
    },
    [h('h1', { style: { fontSize: '22px' } }, `Flex: ${name}`), ...children],
  );
const tile = (text, style = {}) =>
  h(
    'div',
    {
      style: {
        padding: '8px',
        minWidth: 0,
        boxSizing: 'border-box',
        background: 'var(--apollo-color-fill-alter)',
        ...style,
      },
    },
    text,
  );
const NativeHost = defineComponent({
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h('article', attrs, slots.default?.());
  },
});
const CurrentProvider = defineComponent({
  setup() {
    const current = ref(false),
      owner = ref(null);
    onMounted(() => {
      window.flexVisual = {
        async next() {
          current.value = true;
          await nextTick();
        },
        snapshot() {
          return owner.value?.nativeElement === document.querySelector('#flex-provider-owner');
        },
      };
    });
    return () =>
      h(
        ConfigProvider,
        {
          direction: current.value ? 'rtl' : 'ltr',
          components: {
            flex: {
              className: current.value ? 'flex-after' : 'flex-before',
              vertical: current.value,
              style: { padding: current.value ? '12px' : '4px' },
            },
          },
        },
        () =>
          frame('current-provider', [
            h(
              Flex,
              {
                ref: owner,
                id: 'flex-provider-owner',
                gap: 'middle',
                style: { border: '1px solid var(--apollo-color-border)' },
              },
              () => [
                h('input', {
                  id: 'flex-provider-draft',
                  'aria-label': 'Flex provider draft',
                  style: { maxWidth: '100%', boxSizing: 'border-box' },
                }),
                tile('Stable business content'),
              ],
            ),
          ]),
      );
  },
});
const EmptyHost = defineComponent({
  setup() {
    const count = ref(0);
    onMounted(() => {
      window.flexEmptySnapshot = () => count.value;
    });
    return () =>
      frame('empty-host', [
        h('p', 'The named empty button remains a native host.'),
        h(Flex, {
          component: 'button',
          type: 'button',
          'aria-label': 'Add item',
          id: 'flex-empty-button',
          style: { width: '48px', height: '32px' },
          onClick: () => count.value++,
        }),
        h('output', String(count.value)),
      ]);
  },
});
const themed = (name, algorithm) =>
  h(
    ConfigProvider,
    { theme: { algorithm, token: { paddingXS: 12, padding: 20, paddingLG: 28 } } },
    () =>
      frame(
        name,
        ['small', 'middle', 'large'].map((gap) =>
          h(Flex, { gap, wrap: true, style: { marginBlockEnd: '12px' } }, () => [
            tile(gap),
            tile('Current scoped gap'),
          ]),
        ),
      ),
  );
export default {
  ...Object.fromEntries(
    Object.entries(original).map(([name, render]) => [name, () => frame(name, [render()])]),
  ),
  'default-and-stretch': () =>
    frame(
      'default-and-stretch',
      [undefined, 'stretch'].map((align) =>
        h(
          Flex,
          {
            align,
            style: {
              height: '100px',
              marginBlockEnd: '12px',
              border: '1px solid var(--apollo-color-border)',
            },
          },
          () => [
            tile(align ?? 'Default start', { minHeight: '32px' }),
            tile('Tall', { minHeight: '60px' }),
          ],
        ),
      ),
    ),
  'complete-content': () =>
    frame('complete-content', [
      h(Flex, { gap: 10.5, wrap: true }, () => [
        h('strong', 'Complete'),
        ' text ',
        0,
        h(Fragment, [h('em', 'fragment'), h('span', ' tail')]),
      ]),
    ]),
  'empty-host': () => h(EmptyHost),
  'current-provider': () => h(CurrentProvider),
  'custom-component': () =>
    frame('custom-component', [
      h(Flex, { component: NativeHost, gap: 'middle', wrap: true }, () => [
        tile('Vue article root'),
        tile('Complete content'),
      ]),
    ]),
  'native-focus': () =>
    frame('native-focus', [
      h('button', { id: 'flex-focus-before', type: 'button' }, 'Before layout'),
      h(Flex, { gap: 0, style: { marginBlockStart: '16px' } }, () =>
        h('input', {
          id: 'flex-focus-input',
          'aria-label': 'Flex focus draft',
          style: { maxWidth: '100%', boxSizing: 'border-box' },
        }),
      ),
    ]),
  'theme-dark': () => themed('theme-dark', darkAlgorithm),
  'theme-compact': () => themed('theme-compact', compactAlgorithm),
  'theme-dark-compact': () => themed('theme-dark-compact', [darkAlgorithm, compactAlgorithm]),
};
