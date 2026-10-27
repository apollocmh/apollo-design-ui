import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider, Empty, PRESENTED_IMAGE_SIMPLE } from '@apollo-design/ui';
import { createCommentVNode, defineComponent, h, nextTick, onMounted, ref } from 'vue';

const captions = {
  default: 'Default localized illustration',
  simple: 'Simple reusable illustration',
  'no-description': 'Named illustration without visible description',
  'custom-description': 'Complete native description',
  'custom-image': 'Wide URL constrained to its region',
  'with-footer': 'Complete business footer',
  semantic: 'Four independent semantic regions',
  'complete-content': 'Natural layout for complete business content',
  'empty-slots': 'Intentional empty slots',
  'config-current': 'Current Provider settings preserve business drafts',
  rtl: 'Right to left business content',
  'theme-dark': 'Dark empty state',
  'theme-compact': 'Compact empty state',
  'theme-dark-compact': 'Dark compact empty state',
  'native-focus': 'Native keyboard focus',
};
const frame = (name, children) =>
  h(
    'main',
    {
      'data-empty-visual-case': name,
      style: {
        boxSizing: 'border-box',
        width: '100%',
        minHeight: '300px',
        padding: '16px',
        color: 'var(--apollo-color-text)',
        background: 'var(--apollo-color-bg-container)',
        fontFamily: 'var(--apollo-font-family)',
        fontSize: 'var(--apollo-font-size)',
      },
    },
    [
      h('h1', { style: { margin: '0 0 12px', fontSize: '20px' } }, 'Empty workspace'),
      h('h2', { style: { margin: '0 0 16px', fontSize: '14px' } }, captions[name]),
      ...children,
    ],
  );
const empty = (props = {}, slots = {}) =>
  h(
    Empty,
    {
      id: 'empty-main',
      'data-native-empty': 'yes',
      ...props,
    },
    slots,
  );
const draft = (part) =>
  h('label', { style: { display: 'block' } }, [
    `${part} draft`,
    h('input', {
      id: `empty-${part}-draft`,
      'aria-label': `${part} draft`,
      style: { display: 'block', width: '140px', maxWidth: '100%', marginInline: 'auto' },
    }),
  ]);
const complete = (props = {}) =>
  empty(props, {
    image: () => [
      createCommentVNode('lead'),
      h('svg', { width: 64, height: 41, role: 'img', 'aria-label': 'Business diagram' }, [
        h('rect', {
          x: 4,
          y: 6,
          width: 56,
          height: 28,
          rx: 5,
          fill: 'var(--apollo-color-fill-secondary)',
        }),
        h('path', { d: 'M16 20h32', stroke: 'currentColor' }),
      ]),
      draft('image'),
      h('strong', { style: { display: 'block' } }, 'Complete image tail'),
      h('span', 'Natural content after the editor'),
    ],
    description: () => [h('span', 'Current description. '), h('strong', 'Description tail'), 0],
    default: () => [
      draft('footer'),
      h('button', { type: 'button' }, 'Create first item'),
      h('span', ' Footer tail'),
      0,
    ],
  });
const themed = (name, algorithm) =>
  h(ConfigProvider, { theme: { algorithm } }, () => frame(name, [empty()]));
const CurrentProvider = defineComponent({
  setup() {
    const updated = ref(false);
    onMounted(() => {
      window.emptyVisual = {
        async updateProvider() {
          updated.value = true;
          await nextTick();
        },
      };
    });
    return () =>
      h(
        ConfigProvider,
        {
          components: {
            empty: {
              image: updated.value ? PRESENTED_IMAGE_SIMPLE : undefined,
              className: updated.value ? 'provider-current' : 'provider-initial',
              styles: { description: { fontWeight: updated.value ? 600 : 400 } },
            },
          },
        },
        () => frame('config-current', [complete()]),
      );
  },
});
const wideUrl = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="120" viewBox="0 0 2400 120"><rect width="2400" height="120" rx="20" fill="#8ba6bf"/><path d="M40 60h2320" stroke="#18344d" stroke-width="8"/></svg>')}`;
export default {
  default: () => frame('default', [empty()]),
  simple: () => frame('simple', [empty({ image: PRESENTED_IMAGE_SIMPLE })]),
  'no-description': () => frame('no-description', [empty({ description: false })]),
  'custom-description': () =>
    frame('custom-description', [
      empty(
        {},
        {
          description: () => [
            h('span', 'No items yet. '),
            h(
              'a',
              { href: '#create', style: { color: 'inherit', textDecoration: 'underline' } },
              'Create one',
            ),
            h('strong', ' Description tail'),
            0,
          ],
        },
      ),
    ]),
  'custom-image': () =>
    frame('custom-image', [
      empty({
        image: wideUrl,
        description: 'A wide original illustration fits this narrow region.',
      }),
    ]),
  'with-footer': () =>
    frame('with-footer', [
      empty(
        {},
        {
          default: () => [
            h('button', { type: 'button' }, 'Create first item'),
            h('strong', ' Complete footer tail'),
            0,
          ],
        },
      ),
    ]),
  semantic: () =>
    frame('semantic', [
      empty(
        {
          image: PRESENTED_IMAGE_SIMPLE,
          classNames: {
            root: 'owned-empty-root',
            image: 'owned-empty-image',
            description: 'owned-empty-description',
            footer: 'owned-empty-footer',
          },
          styles: {
            root: {
              padding: 'var(--apollo-padding)',
              border: '1px dashed var(--apollo-color-border)',
            },
            image: { opacity: 0.7 },
            description: { fontWeight: 600 },
            footer: { paddingBlock: 'var(--apollo-padding-xs)' },
          },
        },
        { default: () => h('button', { type: 'button' }, 'Create') },
      ),
    ]),
  'complete-content': () => frame('complete-content', [complete()]),
  'empty-slots': () =>
    frame('empty-slots', [
      empty({}, { image: () => [], description: () => [], default: () => [] }),
    ]),
  'config-current': () => h(CurrentProvider),
  rtl: () => h(ConfigProvider, { direction: 'rtl' }, () => frame('rtl', [complete()])),
  'theme-dark': () => themed('theme-dark', darkAlgorithm),
  'theme-compact': () => themed('theme-compact', compactAlgorithm),
  'theme-dark-compact': () => themed('theme-dark-compact', [darkAlgorithm, compactAlgorithm]),
  'native-focus': () =>
    frame('native-focus', [
      h('button', { type: 'button', id: 'empty-before' }, 'Before editor'),
      complete(),
    ]),
};
