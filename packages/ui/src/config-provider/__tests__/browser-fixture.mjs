import { draft, Opaque, serverRoot } from './ssr-fixture.mjs';

export { serverRoot } from './ssr-fixture.mjs';

import { Portal } from '@apollo-design/portal';
import { ThemeProvider } from '@apollo-design/theme';
import { ConfigProvider } from '@apollo-design/ui/config-provider';
import { createApp, createSSRApp, defineComponent, h, nextTick, ref, shallowRef } from 'vue';

const demos = import.meta.glob('../demo/*.vue', { eager: true });

let dispose;
export async function clear() {
  dispose?.();
  dispose = undefined;
  document.body.querySelectorAll('[data-cp-remote],iframe').forEach((node) => {
    node.remove();
  });
  document.getElementById('app').replaceChildren();
  await nextTick();
}

export async function mountDemos(algorithm) {
  const { compactAlgorithm, darkAlgorithm, getDesignToken, applyCSSVar } = await import(
    '@apollo-design/theme'
  );
  await clear();
  const theme =
    algorithm === 'dark'
      ? { algorithm: darkAlgorithm }
      : algorithm === 'compact'
        ? { algorithm: compactAlgorithm }
        : algorithm === 'both'
          ? { algorithm: [darkAlgorithm, compactAlgorithm] }
          : {};
  applyCSSVar(document.documentElement, getDesignToken(theme));
  const app = createApp({
    render: () =>
      h(ThemeProvider, { theme }, () =>
        h(
          'div',
          Object.entries(demos).map(([name, module]) =>
            h(
              'section',
              {
                'data-demo': name.split('/').at(-1).replace('.vue', ''),
                style: {
                  padding: '24px',
                  borderBottom: '1px solid var(--apollo-color-border)',
                  maxWidth: '900px',
                },
              },
              [h('h2', name.split('/').at(-1)), h(module.default)],
            ),
          ),
        ),
      ),
  });
  app.mount(document.getElementById('app'));
  dispose = () => app.unmount();
  await tick();
  return { count: document.querySelectorAll('[data-demo]').length, names: Object.keys(demos) };
}
const tick = async () => {
  await nextTick();
  await nextTick();
};
export async function hydrate(kind, markup) {
  await clear();
  const target = document.getElementById('app');
  target.innerHTML = markup;
  const original = target.querySelector('input,option,text');
  if (original instanceof HTMLInputElement) {
    original.value = 'Kept hydration draft';
    original.focus();
    original.setSelectionRange(2, 5);
  }
  const warnings = [];
  const app = createSSRApp({ render: () => serverRoot(kind) });
  app.config.warnHandler = (value) => warnings.push(value);
  app.mount(target);
  dispose = () => app.unmount();
  await tick();
  const current = target.querySelector('input,option,text');
  return {
    same: current === original,
    warnings,
    draft: current instanceof HTMLInputElement ? current.value : null,
    focus: current instanceof HTMLInputElement ? document.activeElement === current : true,
    html: target.innerHTML,
    variable: target
      .querySelector('tr,li,option,g,section')
      ?.style.getPropertyValue('--apollo-font-size'),
  };
}

export async function mount(kind) {
  await clear();
  const theme = shallowRef({ token: { fontSize: 21 } });
  const parent = shallowRef({ token: { fontSize: 18 } });
  const child = shallowRef({ token: { fontSize: 24 } });
  const native = ref();
  const show = ref(false);
  const alternate = ref(false);
  const prefix = ref('apollo');
  const remote = document.createElement('aside');
  remote.dataset.cpRemote = '';
  document.body.append(remote);
  const switched = document.createElement('aside');
  switched.dataset.cpRemote = '';
  document.body.append(switched);
  const destination = shallowRef(remote);
  const scopeTarget = shallowRef();
  const share = ref(false);
  const Conditional = defineComponent({
    inheritAttrs: false,
    setup() {
      return () =>
        show.value
          ? h(alternate.value ? 'article' : 'section', { 'data-dynamic': '' }, [draft()])
          : null;
    },
  });
  const Native = defineComponent({
    inheritAttrs: false,
    setup() {
      return () => h('section', { 'data-native': '', style: native.value }, [draft()]);
    },
  });
  const Root = {
    render() {
      if (kind === 'dynamic')
        return h(ConfigProvider, { theme: theme.value }, () => h(Conditional));
      if (kind === 'nested')
        return h(ConfigProvider, { theme: parent.value }, () =>
          h(ConfigProvider, { theme: child.value }, () => h(Native)),
        );
      if (kind === 'native') return h(ConfigProvider, { theme: theme.value }, () => h(Native));
      if (kind === 'teleport')
        return h(ConfigProvider, { theme: theme.value }, () =>
          h('div', [
            h(Portal, { open: true, getContainer: () => destination.value }, () =>
              h('section', { 'data-teleported': '' }, [draft()]),
            ),
          ]),
        );
      if (kind === 'svg')
        return h('svg', [
          h(ConfigProvider, { theme: theme.value }, () =>
            h('g', { 'data-native': '' }, [h('text', { y: 24 }, 'SVG text')]),
          ),
        ]);
      if (kind === 'prefix')
        return h(
          ConfigProvider,
          { theme: { cssVarPrefix: prefix.value, token: { fontSize: 21 } } },
          () => h(Native),
        );
      if (kind === 'shared')
        return h(
          ThemeProvider,
          { theme: parent.value, target: scopeTarget.value, injectCssVar: share.value },
          () => h(ConfigProvider, { theme: theme.value }, () => h(Native)),
        );
      return h(
        ConfigProvider,
        { scopeTag: 'section', theme: theme.value, id: 'explicit-scope', style: native.value },
        () => h(Opaque),
      );
    },
  };
  const app = createApp(Root);
  app.mount(document.getElementById('app'));
  dispose = () => app.unmount();
  await tick();
  const initial = document.querySelector(
    '[data-native],[data-dynamic],[data-teleported],#explicit-scope',
  );
  const initialEditor = document.querySelector('input');
  if (initialEditor) {
    initialEditor.value = 'Kept browser draft';
    initialEditor.focus();
    initialEditor.setSelectionRange(2, 5);
  }
  return {
    async theme(value) {
      theme.value = value;
      await tick();
    },
    async parent(value) {
      parent.value = value;
      await tick();
    },
    async child(value) {
      child.value = value;
      await tick();
    },
    async native(value) {
      native.value = value;
      await tick();
    },
    async show(value) {
      show.value = value;
      await tick();
    },
    async alternate(value) {
      alternate.value = value;
      await tick();
    },
    async prefix(value) {
      prefix.value = value;
      await tick();
    },
    async move() {
      destination.value = switched;
      await tick();
    },
    async share(value) {
      scopeTarget.value = document.querySelector('[data-native]');
      share.value = value;
      await tick();
    },
    async unmount() {
      const target = document.querySelector(
        '[data-native],[data-dynamic],[data-teleported],#explicit-scope',
      );
      dispose?.();
      dispose = undefined;
      return target?.style.cssText;
    },
    inspect() {
      const target = document.querySelector(
        '[data-native],[data-dynamic],[data-teleported],#explicit-scope',
      );
      const editor = document.querySelector('input');
      return {
        tag: target?.tagName,
        font: target?.style.getPropertyValue('--apollo-font-size'),
        first: target?.style.getPropertyValue('--first-font-size'),
        second: target?.style.getPropertyValue('--second-font-size'),
        priority: target?.style.getPropertyPriority('--apollo-font-size'),
        same: !initial || target === initial,
        editorSame: !initialEditor || editor === initialEditor,
        draft: editor?.value,
        focus: !editor || document.activeElement === editor,
        selection: editor ? [editor.selectionStart, editor.selectionEnd] : null,
        remote: target?.parentElement === switched,
        count: document.querySelectorAll(
          '[data-native],[data-dynamic],[data-teleported],#explicit-scope',
        ).length,
      };
    },
  };
}

export async function mountNotices(kind) {
  const { en_US, zh_CN } = await import('@apollo-design/locale');
  const { default: useMessage } = await import('../../message/useMessage');
  const { default: useNotification } = await import('../../notification/useNotification');
  await clear();
  const first = document.createElement('section');
  const second = document.createElement('section');
  const shadowHost = document.createElement('section');
  for (const node of [first, second, shadowHost]) node.dataset.cpRemote = '';
  document.body.append(first, second, shadowHost);
  const shadow = shadowHost.attachShadow({ mode: 'open' });
  const target = shallowRef(first);
  const query = (selector) => target.value.querySelector(selector);
  const prefix = ref('first');
  const locale = shallowRef(en_US);
  let mounted = 0;
  let closed = 0;
  let open;
  let destroy;
  const Editor = defineComponent({
    setup() {
      mounted += 1;
      return () =>
        h('input', { 'aria-label': 'Notice draft', style: { '--apollo-font-size': '31px' } });
    },
  });
  const Reader = defineComponent({
    setup() {
      const [api, holder] = kind === 'message' ? useMessage() : useNotification();
      open = () =>
        api.success({
          key: 'kept',
          duration: 0,
          content: h(Editor),
          title: h(Editor),
          onClose: () => {
            closed += 1;
          },
          className: 'user-notice',
          style: { color: 'rgb(1, 2, 3)' },
        });
      destroy = () => api.destroy('kept');
      return holder;
    },
  });
  const app = createApp({
    render: () =>
      h(
        ConfigProvider,
        {
          prefixCls: prefix.value,
          getPopupContainer: () => target.value,
          locale: locale.value,
          theme: { token: { fontSize: 21 } },
        },
        () => h(Reader),
      ),
  });
  app.mount(document.getElementById('app'));
  dispose = () => app.unmount();
  await tick();
  open();
  await tick();
  await tick();
  const editor = query('[aria-label="Notice draft"]');
  if (!editor) throw new Error('Expected a real notice editor');
  editor.value = 'Kept notice draft';
  editor.focus();
  editor.setSelectionRange(2, 6);
  return {
    change: async () => {
      prefix.value = 'second';
      locale.value = zh_CN;
      await tick();
    },
    update: async () => {
      open();
      await tick();
      await tick();
    },
    move: async (destination) => {
      target.value = destination === 'shadow' ? shadow : second;
      await tick();
      await tick();
    },
    close: async () => {
      if (kind === 'notification') query('.second-notification-notice-close')?.click();
      else destroy();
      await tick();
      await tick();
    },
    inspect: () => ({
      same: query('[aria-label="Notice draft"]') === editor,
      focus: editor.getRootNode().activeElement === editor,
      value: editor.value,
      selection: [editor.selectionStart, editor.selectionEnd],
      mounted,
      closed,
      font: editor.style.getPropertyValue('--apollo-font-size'),
      oldClasses: [...target.value.querySelectorAll('[class]')].flatMap((node) =>
        [...node.classList].filter((value) => value.startsWith(`first-${kind}`)),
      ),
      closeLabel: query('.second-notification-notice-close')?.getAttribute('aria-label'),
      userColor: query('.user-notice')?.style.color,
    }),
  };
}

export async function mountContrastControls() {
  const { applyCSSVar, getDesignToken } = await import('@apollo-design/theme');
  const { default: Button } = await import('../../button');
  await clear();
  applyCSSVar(document.documentElement, getDesignToken({}));
  const button = (id) =>
    h('section', { 'data-contrast-control': id }, [
      h(Button, { type: 'primary' }, () => `Primary ${id}`),
    ]);
  const app = createApp({
    render: () =>
      h('div', [
        button('committed-button'),
        h(ThemeProvider, { theme: {} }, () => button('theme-provider')),
        h(ThemeProvider, { theme: {} }, () =>
          h(ConfigProvider, { componentSize: 'large' }, () => button('inherited-config')),
        ),
        h(ThemeProvider, { theme: {} }, () =>
          h(ConfigProvider, { theme: {} }, () => button('explicit-config')),
        ),
      ]),
  });
  app.mount(document.getElementById('app'));
  dispose = () => app.unmount();
  await tick();
}
