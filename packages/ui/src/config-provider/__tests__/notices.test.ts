import { en_US, zh_CN } from '@apollo-design/locale';
import { mount } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, onMounted, ref, shallowRef } from 'vue';
import { getMessageIcon } from '../../message/icon';
import useMessage from '../../message/useMessage';
import type { NotificationInstance } from '../../notification/interface';
import useNotification from '../../notification/useNotification';
import { ConfigProvider } from '../ConfigProvider';

const wrappers: Array<{ unmount(): void }> = [];
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => {
    wrapper.unmount();
  });
  document.body.replaceChildren();
});
async function settle() {
  await nextTick();
  await nextTick();
}

it.each(['message', 'notification'])(
  'existing %s notices update Provider defaults and retain user content',
  async (kind) => {
    const prefix = ref('first');
    const locale = shallowRef(en_US);
    const closed = vi.fn();
    let mounted = 0;
    let duration = 0;
    let open = () => {};
    let close = () => {};
    const Editor = defineComponent({
      setup() {
        onMounted(() => {
          mounted += 1;
        });
        return () => h('input', { 'aria-label': 'Notice draft' });
      },
    });
    const Reader = defineComponent({
      setup() {
        if (kind === 'message') {
          const [api, holder] = useMessage();
          open = () => {
            api.success({
              key: 'kept',
              content: h(Editor),
              duration,
              onClose: closed,
              className: 'user-notice',
              classNames: { icon: 'user-icon' },
              style: { color: 'rgb(1, 2, 3)' },
            });
          };
          close = () => api.destroy('kept');
          return holder;
        }
        const [api, holder] = useNotification();
        open = () =>
          api.success({
            key: 'kept',
            title: h(Editor),
            description: 'Kept body',
            duration,
            onClose: closed,
            className: 'user-notice',
            classNames: { icon: 'user-icon' },
            style: { color: 'rgb(1, 2, 3)' },
          });
        close = () => api.destroy('kept');
        return holder;
      },
    });
    wrappers.push(
      mount(
        defineComponent({
          setup: () => () =>
            h(ConfigProvider, { prefixCls: prefix.value, locale: locale.value }, () => h(Reader)),
        }),
        { attachTo: document.body, global: { stubs: { teleport: false } } },
      ),
    );
    await settle();
    open();
    await settle();
    const editor = document.querySelector<HTMLInputElement>('[aria-label="Notice draft"]');
    if (!editor) throw new Error('Expected the notice editor');
    editor.value = 'Kept draft';
    editor.focus();
    editor.setSelectionRange(2, 6);
    prefix.value = 'second';
    locale.value = zh_CN;
    await settle();
    expect(document.querySelector('[aria-label="Notice draft"]')).toBe(editor);
    expect(document.activeElement).toBe(editor);
    expect([editor.value, editor.selectionStart, editor.selectionEnd]).toEqual([
      'Kept draft',
      2,
      6,
    ]);
    expect(mounted).toBe(1);
    expect(document.querySelector(`[class*="first-${kind}"]`)).toBeNull();
    expect(document.querySelector(`.second-${kind}-notice-success.user-notice`)).not.toBeNull();
    expect(document.querySelector<HTMLElement>('.user-notice')?.style.color).toBe('rgb(1, 2, 3)');
    expect(document.querySelector('.user-icon')).not.toBeNull();
    if (kind === 'notification') {
      expect(
        document.querySelector('.second-notification-notice-close')?.getAttribute('aria-label'),
      ).toBe(zh_CN.global?.close);
      expect(document.querySelector('.second-notification-notice-close-icon')).not.toBeNull();
    }
    open();
    await settle();
    expect(document.querySelector('[aria-label="Notice draft"]')).toBe(editor);
    expect(mounted).toBe(1);
    close();
    await settle();
    await vi.waitFor(() =>
      expect(document.querySelector('[aria-label="Notice draft"]')).toBeNull(),
    );
    expect(closed).not.toHaveBeenCalled();
    duration = 0.02;
    open();
    await settle();
    if (kind === 'notification') {
      document.querySelector<HTMLButtonElement>('.second-notification-notice-close')?.click();
    }
    await vi.waitFor(() => expect(closed).toHaveBeenCalledTimes(1));
    close();
    await settle();
    expect(closed).toHaveBeenCalledTimes(1);
  },
);

it('notification preserves explicit icons, close accessibility and disabled close behavior', async () => {
  const closed = vi.fn();
  let api: NotificationInstance | undefined;
  const Reader = defineComponent({
    setup() {
      const result = useNotification();
      api = result[0];
      return result[1];
    },
  });
  wrappers.push(
    mount(ConfigProvider, {
      props: { locale: zh_CN },
      slots: { default: () => h(Reader) },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    }),
  );
  await settle();
  if (!api) throw new Error('Expected the notification API');
  api.success({
    key: 'custom',
    title: 'Explicit options',
    icon: 0,
    duration: 0,
    closable: { disabled: true, 'aria-label': 'Custom close', onClose: closed },
  });
  await settle();
  expect(document.querySelector('.apollo-notification-notice-icon-success')).toBeNull();
  const button = document.querySelector<HTMLButtonElement>('.apollo-notification-notice-close');
  if (!button) throw new Error('Expected the close button');
  expect(button.disabled).toBe(true);
  expect(button.getAttribute('aria-label')).toBe('Custom close');
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  expect(closed).not.toHaveBeenCalled();
  api.destroy('custom');
  await settle();
});

it.each([0, false, null, ''])('message respects an explicitly supplied empty icon: %s', (icon) => {
  expect(getMessageIcon('success', icon)).toBe(icon);
});

it.each<{
  options: Parameters<NotificationInstance['open']>[0];
  button: boolean;
  icon: boolean;
}>([
  { options: { title: 'False', closable: false }, button: false, icon: false },
  { options: { title: 'Null', closable: null }, button: false, icon: false },
  { options: { title: 'No close icon', closeIcon: null }, button: false, icon: false },
  {
    options: { title: 'Button without icon', closable: { closeIcon: null } },
    button: true,
    icon: false,
  },
])(
  'notification close configuration retains its declared meaning: $options.title',
  async ({ options, button, icon }) => {
    let api: NotificationInstance | undefined;
    const Reader = defineComponent({
      setup() {
        const result = useNotification();
        api = result[0];
        return result[1];
      },
    });
    const Editor = defineComponent({
      setup: () => () => h('input', { 'aria-label': 'Close config draft' }),
    });
    wrappers.push(
      mount(ConfigProvider, {
        slots: { default: () => h(Reader) },
        attachTo: document.body,
        global: { stubs: { teleport: false } },
      }),
    );
    await settle();
    if (!api) throw new Error('Expected the notification API');
    api.open({ ...options, title: h(Editor), key: 'close-config', duration: 0 });
    await settle();
    const editor = document.querySelector<HTMLInputElement>('[aria-label="Close config draft"]');
    if (!editor) throw new Error('Expected the notice editor');
    editor.value = 'Kept';
    expect(Boolean(document.querySelector('.apollo-notification-notice-close'))).toBe(button);
    expect(Boolean(document.querySelector('.apollo-notification-notice-close-icon'))).toBe(icon);
    api.open({ ...options, title: h(Editor), key: 'close-config', duration: 0 });
    await settle();
    expect(document.querySelector('[aria-label="Close config draft"]')).toBe(editor);
    expect(editor.value).toBe('Kept');
  },
);

it.each(['message', 'notification'])(
  '%s follows the current global popup target and preserves the editor',
  async (kind) => {
    const first = document.createElement('section');
    const second = document.createElement('section');
    document.body.append(first, second);
    const target = shallowRef<HTMLElement | ShadowRoot>(first);
    let open = () => {};
    const Editor = defineComponent({
      setup: () => () => h('input', { 'aria-label': 'Moving notice' }),
    });
    const Reader = defineComponent({
      setup() {
        if (kind === 'message') {
          const [api, holder] = useMessage();
          open = () => {
            api.open({ content: h(Editor), duration: 0 });
          };
          return holder;
        }
        const [api, holder] = useNotification();
        open = () => api.open({ title: h(Editor), duration: 0 });
        return holder;
      },
    });
    wrappers.push(
      mount(ConfigProvider, {
        props: { getPopupContainer: () => target.value },
        slots: { default: () => h(Reader) },
        attachTo: document.body,
        global: { stubs: { teleport: false } },
      }),
    );
    await settle();
    open();
    await settle();
    const editor = first.querySelector<HTMLInputElement>('[aria-label="Moving notice"]');
    if (!editor) throw new Error('Expected the first notice editor');
    editor.value = 'Kept moving draft';
    editor.focus();
    editor.setSelectionRange(1, 5);
    target.value = second;
    await settle();
    await settle();
    expect(second.querySelector('[aria-label="Moving notice"]')).toBe(editor);
    expect(document.activeElement).toBe(editor);
    expect([editor.value, editor.selectionStart, editor.selectionEnd]).toEqual([
      'Kept moving draft',
      1,
      5,
    ]);
    expect(first.querySelector('[role="alert"]')).toBeNull();
    const host = document.createElement('div');
    document.body.append(host);
    const shadow = host.attachShadow({ mode: 'open' });
    target.value = shadow;
    await settle();
    await settle();
    expect(shadow.querySelector('[aria-label="Moving notice"]')).toBe(editor);
    expect(second.querySelector('[role="alert"]')).toBeNull();
    expect(editor.value).toBe('Kept moving draft');
  },
);
