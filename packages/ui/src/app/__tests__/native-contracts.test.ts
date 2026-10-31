import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, mergeProps, nextTick, ref, shallowRef } from 'vue';
import type { UseAppProps } from '../../_internal/app-context';
import { injectAppConfig } from '../../_internal/app-context';
import ConfigProvider from '../../config-provider/ConfigProvider';
import type { ConfigProviderProps } from '../../config-provider/interface';
import type { ConfigOptions } from '../../message/interface';
import type { NotificationConfig } from '../../notification/interface';
import App, { useApp } from '../index';
import type { AppComponentType } from '../interface';

const owners: Array<{ unmount: () => void }> = [];
const flush = async () => {
  await nextTick();
  await nextTick();
  await nextTick();
};

afterEach(() => {
  for (const owner of owners.splice(0)) owner.unmount();
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('App native composition contracts', () => {
  it('merges current Provider root styles with native attrs and forwards each native listener once', async () => {
    const components = shallowRef<ConfigProviderProps['components']>({
      app: { className: 'provided', style: { padding: '12px', color: 'red' } },
    });
    const prefix = ref('apollo');
    const rtl = ref(false);
    const click = vi.fn();
    const once = vi.fn();
    const Root = defineComponent({
      setup: () => () =>
        h(
          ConfigProvider,
          {
            components: components.value,
            prefixCls: prefix.value,
            direction: rtl.value ? 'rtl' : 'ltr',
          },
          () =>
            h(
              App,
              mergeProps(
                {
                  id: 'app-host',
                  class: 'local',
                  style: [{ padding: '4px' }, { '--local': 'yes' }],
                  onClick: click,
                },
                { onClickOnce: once },
              ),
              () => [0, h('span', 'Current content')],
            ),
        ),
    });
    const wrapper = mount(Root, { attachTo: document.body });
    owners.push(wrapper);
    const host = wrapper.get('#app-host');
    expect(host.classes()).toEqual(expect.arrayContaining(['apollo-app', 'provided', 'local']));
    expect(host.attributes('style')).toContain('padding: 4px');
    expect(host.attributes('style')).toContain('color: red');
    expect(host.attributes('style')).toContain('--local: yes');
    expect(host.text()).toBe('0Current content');
    await host.trigger('click');
    await host.trigger('click');
    expect(click).toHaveBeenCalledTimes(2);
    expect(once).toHaveBeenCalledTimes(1);

    components.value = { app: { className: 'replacement', style: { color: 'blue' } } };
    prefix.value = 'current';
    rtl.value = true;
    await nextTick();
    expect(wrapper.get('#app-host').element).toBe(host.element);
    expect(host.classes()).toEqual(
      expect.arrayContaining(['current-app', 'current-app-rtl', 'replacement', 'local']),
    );
    expect(host.classes()).not.toContain('provided');
    expect(host.classes()).not.toContain('apollo-app');
    expect(host.attributes('style')).toContain('color: blue');
    components.value = undefined;
    rtl.value = false;
    await nextTick();
    expect(host.classes()).not.toContain('replacement');
    expect(host.classes()).not.toContain('current-app-rtl');
    expect(host.attributes('style')).not.toContain('color:');
    expect(host.attributes('style')).toContain('padding: 4px');
  });

  it('diagnoses attributes without a host using current component/attrs instead of a setup snapshot', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = mount(App, {
      props: { component: 'section' },
      attrs: { id: 'host', class: 'local' },
      slots: { default: () => 0 },
      attachTo: document.body,
    });
    owners.push(wrapper);
    expect(wrapper.get('#host').element.tagName).toBe('SECTION');
    expect(error).not.toHaveBeenCalled();
    await wrapper.setProps({ component: false });
    expect(document.querySelector('#host')).toBeNull();
    expect(document.body.textContent).toBe('0');
    expect(error.mock.calls.some(([message]) => String(message).includes('component=false'))).toBe(
      true,
    );
    expect(error.mock.calls.some(([message]) => /React|antd/.test(String(message)))).toBe(false);
    await wrapper.setProps({ component: 'main' });
    expect(wrapper.get('#host').element.tagName).toBe('MAIN');
  });

  it('keeps nested config reactive through replacements and withdrawal with precise child precedence', async () => {
    const parentMessage = shallowRef<ConfigOptions | undefined>({
      maxCount: 2,
      duration: 0,
      top: 16,
    });
    const parentNotification = shallowRef<NotificationConfig | undefined>({
      placement: 'topLeft',
      duration: 0,
    });
    const childMessage = shallowRef<ConfigOptions | undefined>({ maxCount: 1 });
    const childNotification = shallowRef<NotificationConfig | undefined>({
      placement: 'bottomRight',
    });
    const configs: Array<ReturnType<typeof injectAppConfig>> = [];
    const Child = defineComponent({
      setup() {
        const config = injectAppConfig();
        configs.push(config);
        return () => h('span', { id: 'config', 'data-value': JSON.stringify(config) });
      },
    });
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(App, { message: parentMessage.value, notification: parentNotification.value }, () =>
            h(App, { message: childMessage.value, notification: childNotification.value }, () =>
              h(Child),
            ),
          ),
      }),
    );
    owners.push(wrapper);
    expect(configs[0]?.message).toEqual({ maxCount: 1, duration: 0, top: 16 });
    expect(configs[0]?.notification).toEqual({ placement: 'bottomRight', duration: 0 });
    parentMessage.value = { maxCount: 5, duration: 8 };
    parentNotification.value = { placement: 'bottomLeft', maxCount: 3 };
    await nextTick();
    expect(configs[0]?.message).toEqual({ maxCount: 1, duration: 8 });
    expect(configs[0]?.notification).toEqual({ placement: 'bottomRight', maxCount: 3 });
    childMessage.value = undefined;
    childNotification.value = undefined;
    await nextTick();
    expect(configs[0]?.message).toEqual(parentMessage.value);
    expect(configs[0]?.notification).toEqual(parentNotification.value);
    parentMessage.value = undefined;
    parentNotification.value = undefined;
    await nextTick();
    expect(configs[0]?.message).toEqual({});
    expect(configs[0]?.notification).toEqual({});
    expect(configs).toHaveLength(1);
  });

  it('keeps holders and public services alive when the native host changes or disappears', async () => {
    const component = ref<AppComponentType>('div');
    const visible = ref(true);
    const captures: UseAppProps[] = [];
    const Probe = defineComponent({
      setup() {
        const api = useApp();
        captures.push(api);
        return () => h('span', 'Page');
      },
    });
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(App, { component: component.value }, () => (visible.value ? [h(Probe)] : [])),
      }),
      { attachTo: document.body, global: { stubs: { teleport: false } } },
    );
    owners.push(wrapper);
    const api = captures[0];
    if (!api) throw new Error('Probe did not receive App services');
    api.notification.open({
      key: 'draft',
      title: 'Draft',
      duration: 0,
      description: h('input', { defaultValue: 'seed', id: 'draft' }),
    });
    await flush();
    const input = document.querySelector<HTMLInputElement>('#draft');
    if (!input) throw new Error('Notification input did not mount');
    input.value = 'Kept draft';
    input.focus();
    input.setSelectionRange(2, 6);
    for (const next of ['section', false, 'main'] satisfies AppComponentType[]) {
      component.value = next;
      await flush();
      expect(document.querySelector('#draft')).toBe(input);
      expect(document.activeElement).toBe(input);
      expect(input.value).toBe('Kept draft');
      expect(input.selectionStart).toBe(2);
      expect(input.selectionEnd).toBe(6);
      expect(captures.every((current) => current === api)).toBe(true);
    }
    visible.value = false;
    await flush();
    expect(document.querySelector('#draft')).toBe(input);
    api.notification.destroy();
    await vi.waitFor(() => expect(document.querySelector('#draft')).toBeNull());
  });

  it('accepts setup-time services and terminates queued/live work on App unmount', async () => {
    vi.useFakeTimers();
    const closed: boolean[] = [];
    const decisions: boolean[] = [];
    const callbacks = vi.fn();
    const Child = defineComponent({
      setup() {
        const { message, notification, modal } = useApp();
        message
          .info({ content: 'Early message', duration: 10, onClose: callbacks })
          .then((value) => closed.push(value));
        notification.open({ title: 'Early notification', duration: 10, onClose: callbacks });
        modal
          .confirm({ title: 'Early modal', content: 'Confirm content' })
          .then((value) => decisions.push(value));
        return () => h('span');
      },
    });
    const baseline = vi.getTimerCount();
    const wrapper = mount(App, {
      slots: { default: () => h(Child) },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await flush();
    expect(document.body.textContent).toContain('Early message');
    expect(document.body.textContent).toContain('Early notification');
    expect(document.body.textContent).toContain('Early modal');
    wrapper.unmount();
    await flush();
    await Promise.resolve();
    expect(closed).toEqual([true]);
    expect(decisions).toEqual([false]);
    expect(callbacks).not.toHaveBeenCalled();
    expect(document.querySelector('[role="alert"],[role="dialog"]')).toBeNull();
    expect(vi.getTimerCount()).toBe(baseline);
  });
});
