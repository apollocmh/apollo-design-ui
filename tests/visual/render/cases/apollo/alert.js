/** Native Apollo Alert states; no upstream fixture is promoted into these cases. */
import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { Alert, AlertErrorBoundary, ConfigProvider } from '@apollo-design/ui';
import { defineComponent, h, nextTick, onMounted, ref } from 'vue';

const frame = (name, content) =>
  h(
    'main',
    {
      'data-alert-visual-case': name,
      style: {
        boxSizing: 'border-box',
        width: '100%',
        minHeight: '260px',
        padding: '16px',
        color: 'var(--apollo-color-text)',
        background: 'var(--apollo-color-bg-container)',
        fontFamily: 'var(--apollo-font-family)',
        fontSize: 'var(--apollo-font-size)',
      },
    },
    [
      h('h1', { style: { margin: '0 0 12px', fontSize: '20px' } }, 'Workspace notifications'),
      h('p', { style: { margin: '0 0 16px' } }, name),
      ...content,
    ],
  );
const row = (props = {}, slots = {}) =>
  h(Alert, { id: 'alert-main', title: 'Task updated', ...props }, slots);
const stack = (children) =>
  h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } }, children);
const rich = () =>
  row(
    { showIcon: true, description: 'Fallback description' },
    {
      title: () => [
        h('strong', 'Current task '),
        0,
        h('input', {
          id: 'alert-draft',
          'aria-label': 'Business draft',
          defaultValue: 'Current draft',
          style: { width: '140px', maxWidth: 'calc(100% - 12px)', marginInline: '6px' },
        }),
      ],
      description: () => [h('span', 'Review the saved task.'), 0],
      action: () => [
        h('button', { type: 'button' }, 'Save'),
        h('button', { type: 'button' }, 'More'),
      ],
    },
  );
const themed = (name, algorithm) =>
  h(ConfigProvider, { theme: { algorithm } }, () => frame(name, [rich()]));
const Provider = defineComponent({
  setup() {
    const current = ref(false);
    onMounted(() => {
      window.alertVisual = {
        async update() {
          current.value = true;
          await nextTick();
        },
      };
    });
    return () =>
      h(
        ConfigProvider,
        {
          components: {
            alert: {
              variant: current.value ? 'filled' : 'outlined',
              className: current.value ? 'current-provider' : 'first-provider',
              styles: { title: { fontWeight: current.value ? 700 : 400 } },
            },
          },
        },
        () => frame('provider-current', [rich()]),
      );
  },
});
const Closed = defineComponent({
  setup() {
    const count = ref(0);
    onMounted(() => {
      window.alertVisual = {
        async dismiss() {
          document.querySelector('#alert-main button').click();
          await nextTick();
        },
      };
    });
    return () =>
      h(ConfigProvider, { theme: { token: { motion: false } } }, () =>
        frame('closed', [
          row({
            closable: true,
            onAfterClose: () => {
              count.value += 1;
            },
          }),
          h(Alert, {
            id: 'alert-sibling',
            title: 'Separate notification remains',
            type: 'success',
          }),
          h('p', { id: 'alert-completed' }, `Completed ${count.value}`),
        ]),
      );
  },
});
const Throws = defineComponent({
  setup() {
    throw new Error('Task panel could not render');
  },
});
export default {
  basic: () => frame('basic', [row()]),
  types: () =>
    frame('types', [
      stack(
        ['success', 'info', 'warning', 'error'].map((type) =>
          h(Alert, { type, title: `${type} task` }),
        ),
      ),
    ]),
  description: () =>
    frame('description', [
      row({
        description:
          'Review the current task before continuing. A longer description wraps naturally within this viewport.',
      }),
    ]),
  icons: () =>
    frame('icons', [
      stack(
        ['success', 'info', 'warning', 'error'].map((type) =>
          h(Alert, { type, title: `${type} task`, showIcon: true }),
        ),
      ),
    ]),
  'custom-icon': () =>
    frame('custom-icon', [
      row(
        { showIcon: true },
        {
          icon: () => [
            h('span', { 'aria-hidden': true }, '◆'),
            h('span', { 'aria-hidden': true }, '·'),
          ],
        },
      ),
    ]),
  actions: () => frame('actions', [rich()]),
  banner: () => frame('banner', [row({ banner: true, closable: true })]),
  filled: () => frame('filled', [row({ variant: 'filled', showIcon: true })]),
  semantic: () =>
    frame('semantic', [
      row(
        {
          description: 'Complete semantic regions',
          showIcon: true,
          closable: true,
          classNames: { root: 'owned-alert', title: 'owned-title' },
          styles: {
            root: { borderStyle: 'dashed' },
            section: { paddingInline: '4px' },
            title: { fontWeight: 700 },
          },
        },
        { action: () => h('button', { type: 'button' }, 'Review') },
      ),
    ]),
  'empty-slots': () =>
    frame('empty-slots', [
      row(
        { description: 'Must not return', showIcon: true },
        { title: () => [], description: () => [], icon: () => [], action: () => [] },
      ),
      h('p', 'Present empty slots suppress fallback content.'),
    ]),
  'close-content': () =>
    frame('close-content', [
      stack(
        [0, false, null, ''].map((closeIcon, index) =>
          h(Alert, { title: `Close content ${index + 1}`, closable: { closeIcon } }),
        ),
      ),
    ]),
  'provider-current': () => h(Provider),
  tokens: () =>
    h(
      ConfigProvider,
      {
        theme: {
          components: {
            Alert: {
              borderRadius: 18,
              defaultPadding: '9px 17px',
              withDescriptionPadding: '15px 21px',
              withDescriptionIconSize: 31,
            },
          },
        },
      },
      () => frame('tokens', [row({ showIcon: true, description: 'Current component tokens' })]),
    ),
  rtl: () =>
    h(ConfigProvider, { direction: 'rtl' }, () =>
      frame('rtl', [
        row(
          { showIcon: true, closable: true, description: 'Review this notification.' },
          { action: () => h('button', { type: 'button' }, 'Review') },
        ),
      ]),
    ),
  'theme-dark': () => themed('theme-dark', darkAlgorithm),
  'theme-compact': () => themed('theme-compact', compactAlgorithm),
  'theme-dark-compact': () => themed('theme-dark-compact', [darkAlgorithm, compactAlgorithm]),
  'native-focus': () =>
    frame('native-focus', [
      h('button', { type: 'button', id: 'alert-before' }, 'Before close'),
      row({ closable: true }),
    ]),
  'error-boundary': () =>
    frame('error-boundary', [h(AlertErrorBoundary, { id: 'alert-main' }, () => h(Throws))]),
  closed: () => h(Closed),
};
