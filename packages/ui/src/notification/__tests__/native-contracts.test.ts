import { ZINDEX_KEY } from '@apollo-design/portal';
import type { ThemeConfig } from '@apollo-design/theme';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, inject, mergeProps, nextTick, ref, shallowRef, type VNode } from 'vue';
import type { ConfigProviderProps } from '../../config-provider';
import ConfigProvider from '../../config-provider';
import message, { actDestroy as resetMessage } from '../../message';
import type { ConfigOptions, MessageInstance, MessageType } from '../../message/interface';
import MessagePanel from '../../message/PurePanel';
import useMessage from '../../message/useMessage';
import Notice from '../engine/Notice';
import { actDestroy as resetNotification } from '../index';
import type { NotificationConfig, NotificationInstance } from '../interface';
import NotificationPanel from '../PurePanel';
import useNotification from '../useNotification';

const wrappers: Array<{ unmount(): void }> = [];
const host = (render: () => () => VNode) => {
  const wrapper = mount(defineComponent({ setup: render }), {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });
  wrappers.push(wrapper);
  return wrapper;
};
async function flush() {
  for (let i = 0; i < 6; i++) {
    await nextTick();
    await Promise.resolve();
  }
}
async function settle(ms = 700) {
  await flush();
  await vi.advanceTimersByTimeAsync(ms);
  await flush();
}
afterEach(() => {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount();
  resetMessage();
  resetNotification();
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe('Message/Notification native contracts', () => {
  it('retains setup-time commands until the real holders mount', async () => {
    vi.useFakeTimers();
    const result = vi.fn();
    host(() => {
      const [messages, messageHolder] = useMessage();
      const [notifications, notificationHolder] = useNotification();
      messages.open({ key: 0, content: 'Early message', duration: 0 }).then(result);
      notifications.open({ key: 0, title: 'Early notification', duration: 0 });
      return () => h('div', [messageHolder(), notificationHolder()]);
    });
    await settle();
    expect(document.querySelector('.apollo-message-notice-title')?.textContent).toBe(
      'Early message',
    );
    expect(document.querySelector('.apollo-notification-notice-title')?.textContent).toBe(
      'Early notification',
    );
    expect(result).not.toHaveBeenCalled();
  });

  it('settles an early cancelled static message without mounting it', async () => {
    vi.useFakeTimers();
    const result = vi.fn();
    const close = message.loading('Never mounted', 0);
    close.then(result);
    close();
    close();
    await settle();
    expect(document.querySelector('.apollo-message-notice')).toBeNull();
    expect(result).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('settles every same-key message handle on direct close and keeps the latest subscription', async () => {
    vi.useFakeTimers();
    let api: MessageInstance | undefined;
    host(() => {
      const [current, holder] = useMessage();
      api = current;
      return () => holder();
    });
    await flush();
    const first = vi.fn(),
      second = vi.fn(),
      oldClose = vi.fn(),
      latestClose = vi.fn();
    api?.open({ key: 'shared', content: 'First', duration: 0, onClose: oldClose }).then(first);
    await flush();
    const close = api?.open({
      key: 'shared',
      content: 'Second',
      duration: 0,
      onClose: latestClose,
    });
    close?.then(second);
    await flush();
    close?.();
    close?.();
    await settle();
    expect(first).toHaveBeenCalledExactlyOnceWith(true);
    expect(second).toHaveBeenCalledExactlyOnceWith(true);
    expect(oldClose).not.toHaveBeenCalled();
    expect(latestClose).not.toHaveBeenCalled();
  });

  it('restarts an unchanged duration when the same key is reopened', async () => {
    vi.useFakeTimers();
    let api: NotificationInstance | undefined;
    host(() => {
      const [current, holder] = useNotification();
      api = current;
      return () => holder();
    });
    await flush();
    api?.open({ key: 'timer', title: 'First', duration: 2 });
    await settle(1400);
    const closed = vi.fn();
    api?.open({ key: 'timer', title: 'Updated', duration: 2, onClose: closed });
    await settle(1000);
    expect(closed).not.toHaveBeenCalled();
    expect(document.querySelector('.apollo-notification-notice-title')?.textContent).toBe(
      'Updated',
    );
    await settle(1700);
    expect(document.querySelector('.apollo-notification-notice')).toBeNull();
  });

  it('preserves distinct numeric and string keys through rendering, measurement and close', async () => {
    vi.useFakeTimers();
    let api: MessageInstance | undefined;
    host(() => {
      const [current, holder] = useMessage();
      api = current;
      return () => holder();
    });
    await flush();
    const numeric = vi.fn(),
      string = vi.fn();
    api?.open({ key: 0, content: 'Numeric zero', duration: 0 }).then(numeric);
    api?.open({ key: '0', content: 'String zero', duration: 0 }).then(string);
    await settle();
    expect(document.querySelectorAll('.apollo-message-notice')).toHaveLength(2);
    expect(
      [...document.querySelectorAll('.apollo-message-notice')].map((node) =>
        node.getAttribute('data-notification-index'),
      ),
    ).toEqual(['1', '0']);
    api?.destroy(0);
    await settle();
    expect(numeric).toHaveBeenCalledExactlyOnceWith(true);
    expect(string).not.toHaveBeenCalled();
    expect(document.querySelector('.apollo-message-notice-title')?.textContent).toBe('String zero');
    api?.destroy('0');
    await settle();
    expect(string).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('settles evicted and unmounted handles without inventing public close callbacks', async () => {
    vi.useFakeTimers();
    let api: MessageInstance | undefined;
    const wrapper = host(() => {
      const [current, holder] = useMessage({ maxCount: 1 });
      api = current;
      return () => holder();
    });
    await flush();
    const evicted = vi.fn(),
      disposed = vi.fn(),
      closed = vi.fn();
    api?.open({ key: 'old', content: 'Old', duration: 0, onClose: closed }).then(evicted);
    await flush();
    api?.open({ key: 'current', content: 'Current', duration: 0, onClose: closed }).then(disposed);
    await settle();
    expect(evicted).toHaveBeenCalledExactlyOnceWith(true);
    expect(disposed).not.toHaveBeenCalled();
    wrapper.unmount();
    wrappers.splice(wrappers.indexOf(wrapper), 1);
    await settle();
    expect(disposed).toHaveBeenCalledExactlyOnceWith(true);
    expect(closed).not.toHaveBeenCalled();
  });

  it('terminates queued commands when their owner unmounts before mounting a holder', async () => {
    vi.useFakeTimers();
    const result = vi.fn();
    let handle: MessageType | undefined;
    const wrapper = host(() => {
      const [api] = useMessage();
      handle = api.loading('Queued', 0);
      handle.then(result);
      return () => h('div');
    });
    await flush();
    expect(result).not.toHaveBeenCalled();
    wrapper.unmount();
    wrappers.splice(wrappers.indexOf(wrapper), 1);
    await settle();
    handle?.();
    expect(result).toHaveBeenCalledExactlyOnceWith(true);
    expect(document.querySelector('.apollo-message-notice')).toBeNull();
  });

  it('keeps current Provider/holder objects, tokens and numeric layer context without remounting keyed content', async () => {
    vi.useFakeTimers();
    const theme = shallowRef<ThemeConfig | undefined>({
      components: {
        Message: { contentBg: 'red', contentPadding: '3px 9px', zIndexPopup: 4000 },
        Notification: { width: 310, progressBg: 'green', colorInfoBg: 'gold', zIndexPopup: 4100 },
      },
    });
    const components = shallowRef<ConfigProviderProps['components']>({
      message: { className: 'provider-message', classNames: { root: 'provider-root' } },
      notification: { className: 'provider-notification' },
    });
    const messageConfig = shallowRef<ConfigOptions>({
      classNames: { root: 'before-root' },
      styles: { list: { zIndex: '0' } },
    });
    const notificationConfig = shallowRef<NotificationConfig>({
      styles: { list: { zIndex: 4200 } },
    });
    const Layer = defineComponent({
      setup() {
        const layer = inject(ZINDEX_KEY);
        return () => h('output', { class: 'layer-value' }, String(layer?.value));
      },
    });
    host(() => {
      const [messages, messageHolder] = useMessage(() => messageConfig.value);
      const [notifications, notificationHolder] = useNotification(() => notificationConfig.value);
      messages.open({ key: 'live', content: h(Layer), duration: 0 });
      notifications.info({ key: 'live', title: h(Layer), duration: 0 });
      return () =>
        h(ConfigProvider, { theme: theme.value, components: components.value }, () => [
          messageHolder(),
          notificationHolder(),
        ]);
    });
    await settle();
    const messageNode = document.querySelector<HTMLElement>('.apollo-message-notice');
    const messageContent = messageNode?.querySelector('.layer-value');
    const notificationNode = document.querySelector<HTMLElement>('.apollo-notification-notice');
    expect(messageNode?.classList.contains('provider-root')).toBe(true);
    expect(messageNode?.classList.contains('before-root')).toBe(true);
    expect(messageContent?.textContent).toBe('0');
    expect(notificationNode?.querySelector('.layer-value')?.textContent).toBe('4200');
    expect(
      document
        .querySelector<HTMLElement>('.apollo-message')
        ?.style.getPropertyValue('--apollo-message-content-bg'),
    ).toBe('red');
    expect(
      document
        .querySelector<HTMLElement>('.apollo-notification')
        ?.style.getPropertyValue('--apollo-notification-width'),
    ).toBe('310px');
    messageConfig.value = {
      classNames: { root: 'after-root' },
      styles: { root: { color: 'purple' } },
    };
    notificationConfig.value = { styles: { list: { zIndex: '0' } } };
    theme.value = {
      components: {
        Message: { contentBg: 'blue', contentPadding: '0px', zIndexPopup: 0 },
        Notification: { width: '22rem', progressBg: 'pink', colorInfoBg: 'cyan', zIndexPopup: 0 },
      },
    };
    await flush();
    expect(document.querySelector('.apollo-message-notice')).toBe(messageNode);
    expect(messageNode?.querySelector('.layer-value')).toBe(messageContent);
    expect(messageNode?.classList.contains('before-root')).toBe(false);
    expect(messageNode?.classList.contains('after-root')).toBe(true);
    expect(messageNode?.style.color).toBe('purple');
    expect(notificationNode?.querySelector('.layer-value')?.textContent).toBe('0');
    expect(
      document
        .querySelector<HTMLElement>('.apollo-notification')
        ?.style.getPropertyValue('--apollo-notification-width'),
    ).toBe('22rem');
    components.value = undefined;
    theme.value = undefined;
    await flush();
    expect(messageNode?.classList.contains('provider-root')).toBe(false);
    expect(document.querySelector('.provider-message')).toBeNull();
    expect(
      document
        .querySelector<HTMLElement>('.apollo-message')
        ?.style.getPropertyValue('--apollo-message-content-bg'),
    ).toBe('');
  });

  it('uses typed owned Notice events once while preserving native attrs and zero actions', async () => {
    vi.useFakeTimers();
    const first = vi.fn(),
      second = vi.fn(),
      once = vi.fn(),
      close = vi.fn();
    const wrapper = host(
      () => () =>
        h(Notice, {
          ...mergeProps({ onClick: first, onClose: close }, { onClick: second, onClickOnce: once }),
          prefixCls: 'apollo-notification',
          duration: 0,
          closable: true,
          title: 0,
          description: 0,
          actions: 0,
          id: 'native-notice',
          class: ['native', { active: true }],
          style: { color: 'red' },
        }),
    );
    await flush();
    const node = document.querySelector<HTMLElement>('#native-notice');
    node?.click();
    node?.click();
    expect(first).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenCalledTimes(2);
    expect(once).toHaveBeenCalledTimes(1);
    expect(wrapper.findComponent(Notice).emitted('click')).toHaveLength(2);
    expect(node?.classList.contains('active')).toBe(true);
    expect(node?.style.color).toBe('red');
    expect(node?.querySelector('.apollo-notification-notice-actions')?.textContent).toBe('0');
    node?.querySelector<HTMLButtonElement>('button')?.click();
    node?.querySelector<HTMLButtonElement>('button')?.click();
    expect(close).toHaveBeenCalledTimes(1);
    expect(wrapper.findComponent(Notice).emitted('close')).toHaveLength(1);
  });

  it('keeps PurePanel native roots and live named slots, including empty and zero', async () => {
    vi.useFakeTimers();
    const present = ref(true);
    host(
      () => () =>
        h('div', [
          h(
            MessagePanel,
            {
              content: 'Fallback',
              id: 'pure-message',
              class: ['native', { active: true }],
              style: [{ padding: '3px' }],
            },
            present.value ? { content: () => 0, icon: () => null } : {},
          ),
          h(
            NotificationPanel,
            { title: 'Fallback', id: 'pure-notification' },
            present.value ? { title: () => 0, description: () => 0, actions: () => 0 } : {},
          ),
        ]),
    );
    await flush();
    const messageRoot = document.querySelector<HTMLElement>('#pure-message');
    expect(messageRoot?.classList.contains('apollo-message-notice-pure-panel')).toBe(true);
    expect(messageRoot?.classList.contains('active')).toBe(true);
    expect(messageRoot?.style.padding).toBe('3px');
    expect(messageRoot?.querySelector('.apollo-message-notice-title')?.textContent).toBe('0');
    expect(
      document.querySelector('#pure-notification .apollo-notification-notice-actions')?.textContent,
    ).toBe('0');
    present.value = false;
    await flush();
    expect(messageRoot?.querySelector('.apollo-message-notice-title')?.textContent).toBe(
      'Fallback',
    );
    expect(
      document.querySelector('#pure-notification .apollo-notification-notice-title')?.textContent,
    ).toBe('Fallback');
  });

  it('resumes a hovered progress timer when pauseOnHover is withdrawn', async () => {
    vi.useFakeTimers();
    const config = shallowRef<NotificationConfig>({ pauseOnHover: true });
    const closed = vi.fn();
    let api: NotificationInstance | undefined;
    host(() => {
      const [current, holder] = useNotification(() => config.value);
      api = current;
      return () => holder();
    });
    await flush();
    api?.open({
      key: 'hover',
      title: 'Paused timer',
      duration: 1,
      showProgress: true,
      onClose: closed,
    });
    await flush();
    const notice = document.querySelector<HTMLElement>('.apollo-notification-notice');
    notice?.dispatchEvent(new MouseEvent('mouseenter'));
    await settle(2000);
    expect(closed).not.toHaveBeenCalled();
    expect(notice?.querySelector('progress')).not.toBeNull();
    config.value = { pauseOnHover: false };
    await settle(1700);
    expect(closed).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.apollo-notification-notice')).toBeNull();
  });

  it('cannot let a disposed static holder capture a new global message session', async () => {
    vi.useFakeTimers();
    const disposed = vi.fn(),
      current = vi.fn();
    message.config({ prefixCls: 'old-message' });
    message.loading('Old owner', 0).then(disposed);
    resetMessage();
    message.config({ prefixCls: 'current-message' });
    const close = message.loading('Current owner', 0);
    close.then(current);
    await settle();
    expect(document.querySelector('.old-message-notice')).toBeNull();
    expect(document.querySelector('.current-message-notice-title')?.textContent).toBe(
      'Current owner',
    );
    expect(disposed).toHaveBeenCalledExactlyOnceWith(true);
    expect(current).not.toHaveBeenCalled();
    close();
    await settle();
    expect(current).toHaveBeenCalledExactlyOnceWith(true);
  });
});
