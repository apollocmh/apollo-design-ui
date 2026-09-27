/**
 * L1/L2 —— notification 的行为测试（命令式 API + hooks 形态）。
 *
 * ⚠️ 与 message 的两处关键差异（测试要钉住）：
 *   1. `open()` 返回 **void**（没有 thenable / 可调用句柄）；
 *   2. **默认就堆叠**（`DEFAULT_STACK_CONFIG = { offset: 8 }`）⇒ 列表根恒带 `-stack` 类；
 *      且 notice 默认**有关闭按钮**（`closable: true`）。
 */
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';

import notification, { actDestroy } from '..';
import PureList from '../PureList';
import PurePanel from '../PurePanel';
import useNotification from '../useNotification';

/** holder 挂载 + 队列回放 + Teleport 提交：一次 nextTick 不够。 */
async function flush(times = 6): Promise<void> {
  for (let i = 0; i < times; i += 1) {
    await Promise.resolve();
    await nextTick();
  }
}

const notices = () => Array.from(document.querySelectorAll('.apollo-notification-notice'));

beforeEach(() => {
  actDestroy();
  document.body.innerHTML = '';
});

afterEach(() => {
  actDestroy();
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('notification · 命令式 API', () => {
  it('success 渲染一条通知（notice + 类型类 + 类型图标 + 标题）', async () => {
    notification.success({ title: 'Hello' });
    await flush();

    expect(notices()).toHaveLength(1);
    const notice = notices()[0]!;
    expect(notice.className).toContain('apollo-notification-notice');
    expect(notice.className).toContain('apollo-notification-notice-success');
    expect(notice.getAttribute('role')).toBe('alert');
    expect(notice.querySelector('.apollo-notification-notice-icon-success')).not.toBeNull();
    expect(notice.querySelector('.apollo-notification-notice-title')?.textContent).toBe('Hello');
  });

  it('title + description ⇒ 包 -notice-section；只有 description ⇒ 直接渲染', async () => {
    notification.open({ title: 'T', description: 'D' });
    await flush();
    const section = notices()[0]?.querySelector('.apollo-notification-notice-section');
    expect(section).not.toBeNull();
    expect(section?.querySelector('.apollo-notification-notice-title')).not.toBeNull();
    expect(section?.querySelector('.apollo-notification-notice-description')).not.toBeNull();

    notification.destroy();
    await flush();
    notification.open({ description: 'only-desc' });
    await flush();
    expect(notices()[0]?.querySelector('.apollo-notification-notice-section')).toBeNull();
    expect(
      notices()[0]?.querySelector('.apollo-notification-notice-description')?.textContent,
    ).toBe('only-desc');
  });

  it('deprecated 的 message / btn 等价于 title / actions', async () => {
    notification.open({ message: 'legacy-title', btn: 'legacy-action' });
    await flush();

    expect(document.querySelector('.apollo-notification-notice-title')?.textContent).toBe(
      'legacy-title',
    );
    expect(document.querySelector('.apollo-notification-notice-actions')?.textContent).toBe(
      'legacy-action',
    );
  });

  it('默认有关闭按钮（closable=true），aria-label 取 locale 的 close', async () => {
    notification.info({ title: 'closable' });
    await flush();

    const close = notices()[0]?.querySelector('.apollo-notification-notice-close');
    expect(close).not.toBeNull();
    expect(close?.getAttribute('aria-label')).toBe('Close');
    // ⚠️ 命令式路径的图标类用 **notice 前缀**（`{p}-notification-notice-close-icon`），
    //    与 PurePanel 路径的 `{p}-notification-close-icon` 不同 —— 上游两处就是这么写的。
    expect(close?.querySelector('.apollo-notification-notice-close-icon')).not.toBeNull();
  });

  it('closable: false / closeIcon: null ⇒ 都没有关闭按钮；closable 对象里给 null ⇒ 有按钮无图标', async () => {
    notification.open({ title: 'a', closable: false });
    await flush();
    expect(notices()[0]?.querySelector('.apollo-notification-notice-close')).toBeNull();

    notification.destroy();
    await flush();
    // ⚠️ 上游语义：`closeIcon: null` 也走「强制关闭」分支（`computeClosableConfig` 的第一条）
    notification.open({ title: 'b', closeIcon: null });
    await flush();
    expect(notices()[0]?.querySelector('.apollo-notification-notice-close')).toBeNull();

    notification.destroy();
    await flush();
    notification.open({ title: 'c', closable: { closeIcon: null } });
    await flush();
    const close = notices()[0]?.querySelector('.apollo-notification-notice-close');
    expect(close).not.toBeNull();
    expect(close?.querySelector('.apollo-notification-notice-close-icon')).toBeNull();
  });

  it('destroy(key) 只关那一条；destroy() 清空', async () => {
    notification.open({ key: 'a', title: 'A' });
    notification.open({ key: 'b', title: 'B' });
    await flush();
    expect(notices()).toHaveLength(2);

    notification.destroy('a');
    await flush();
    expect(notices()).toHaveLength(1);

    notification.destroy();
    await flush();
    expect(notices()).toHaveLength(0);
  });

  it('open() 返回 void（没有 thenable 句柄 —— 与 message 的差异）', async () => {
    const result = notification.success({ title: 'x' });
    await flush();
    expect(result).toBeUndefined();
    expect(notices()).toHaveLength(1);
  });

  it('duration 到点自动关闭；duration: 0 ⇒ 不自动关', async () => {
    vi.useFakeTimers();
    notification.open({ title: 'timed', duration: 1 });
    notification.open({ title: 'sticky', duration: 0 });
    await flush();
    expect(notices()).toHaveLength(2);

    await vi.advanceTimersByTimeAsync(1500);
    await flush();
    expect(notices()).toHaveLength(1);
    expect(document.body.textContent).toContain('sticky');
  });

  it('自定义 icon ⇒ 不叠加 -notice-icon-{type} 类（与 message 的差异）', async () => {
    notification.open({ title: 'custom', type: 'success', icon: h('i', { class: 'my-icon' }) });
    await flush();

    expect(document.querySelector('.my-icon')).not.toBeNull();
    expect(document.querySelector('.apollo-notification-notice-icon')?.className).not.toContain(
      'apollo-notification-notice-icon-success',
    );
  });

  it('role 可切到 status', async () => {
    notification.open({ title: 'x', role: 'status' });
    await flush();
    expect(notices()[0]?.getAttribute('role')).toBe('status');
  });

  it('onClick 落在 notice 根上', async () => {
    const onClick = vi.fn();
    notification.open({ title: 'clickable', onClick });
    await flush();

    notices()[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('notification · placement 与默认堆叠', () => {
  it('默认 placement=topRight（列表根带 -topRight 类）', async () => {
    notification.success({ title: 'x' });
    await flush();

    const list = document.querySelector('.apollo-notification-list');
    expect(list).not.toBeNull();
    expect(list?.className).toContain('apollo-notification-topRight');
  });

  it('单条 placement 覆盖全局', async () => {
    notification.config({ placement: 'topLeft' });
    notification.open({ title: 'x', placement: 'bottomRight' });
    await flush();

    const list = document.querySelector('.apollo-notification-list');
    expect(list?.className).toContain('apollo-notification-bottomRight');
  });

  it('默认就堆叠（-stack 类存在 —— 与 message 默认 false 的差异）', async () => {
    notification.success({ title: 'x' });
    await flush();
    expect(document.querySelector('.apollo-notification-stack')).not.toBeNull();
  });
});

describe('notification · config()', () => {
  it('top / bottom 写成 CSS 变量（number ⇒ px）', async () => {
    notification.config({ top: 24, bottom: 48 });
    notification.success({ title: 'x' });
    await flush();

    const style = document.querySelector('.apollo-notification-list')?.getAttribute('style');
    expect(style).toContain('--notification-top: 24px');
    expect(style).toContain('--notification-bottom: 48px');
  });

  it('maxCount 只保留最后 N 条', async () => {
    notification.config({ maxCount: 2 });
    notification.open({ key: '1', title: 'one' });
    notification.open({ key: '2', title: 'two' });
    notification.open({ key: '3', title: 'three' });
    await flush();

    expect(notices()).toHaveLength(2);
    expect(document.body.textContent).not.toContain('one');
  });

  it('rtl / prefixCls / getContainer 生效', async () => {
    notification.config({ rtl: true });
    notification.success({ title: 'rtl' });
    await flush();
    expect(document.querySelector('.apollo-notification-rtl')).not.toBeNull();

    actDestroy();
    document.body.innerHTML = '';
    const container = document.createElement('div');
    document.body.appendChild(container);
    notification.config({ prefixCls: 'my-notify', getContainer: () => container });
    notification.success({ title: 'custom' });
    await flush();
    expect(container.querySelector('.my-notify-notice')).not.toBeNull();
  });
});

describe('notification · useNotification()', () => {
  function mountHook(config: Parameters<typeof useNotification>[0] = { duration: false }) {
    const apiRef: { current?: ReturnType<typeof useNotification>[0] } = {};
    const Host = defineComponent({
      name: 'NotificationHost',
      setup() {
        const [api, holder] = useNotification(config);
        apiRef.current = api;
        return () => h('div', [holder()]);
      },
    });
    const wrapper = mount(Host, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    return { wrapper, api: () => apiRef.current! };
  }

  it('hook 形态能打开/关闭通知（走组件树，不是全局单例）', async () => {
    const { wrapper, api } = mountHook();
    await flush();

    api().success({ title: 'from hook' });
    await flush();
    expect(notices()).toHaveLength(1);

    api().destroy();
    await flush();
    expect(notices()).toHaveLength(0);
    wrapper.unmount();
  });

  it('useNotification 的 classNames 生效（语义槽）', async () => {
    const { wrapper, api } = mountHook({
      duration: false,
      classNames: { root: 'my-root', title: 'my-title' },
    });
    await flush();
    api().success({ title: 'semantic' });
    await flush();

    expect(notices()).toHaveLength(1);
    expect(document.querySelector('.apollo-notification-notice')?.className).toContain('my-root');
    expect(document.querySelector('.apollo-notification-notice-title')?.className).toContain(
      'my-title',
    );
    wrapper.unmount();
  });
});

describe('notification · 静态面板（_Internal*）', () => {
  it('PurePanel 渲染单条（根类 -notice-pure-panel，带关闭按钮，不 portal）', () => {
    const wrapper = mount(PurePanel, { props: { type: 'success', title: 'panel' } });
    expect(wrapper.find('.apollo-notification-notice-pure-panel').exists()).toBe(true);
    expect(wrapper.find('.apollo-notification-notice').exists()).toBe(true);
    expect(wrapper.find('.apollo-notification-notice-close').exists()).toBe(true);
    expect(wrapper.find('.apollo-notification-notice-icon-success').exists()).toBe(true);
    expect(wrapper.text()).toContain('panel');
    wrapper.unmount();
  });

  it('PureList 渲染多条（placement 可传，stack 恒 false）', () => {
    const wrapper = mount(PureList, {
      props: {
        placement: 'bottomLeft',
        items: [
          { key: 'a', title: 'one', type: 'info' },
          { key: 'b', title: 'two', type: 'error' },
        ],
      },
    });
    expect(wrapper.find('.apollo-notification-bottomLeft').exists()).toBe(true);
    expect(wrapper.findAll('.apollo-notification-notice')).toHaveLength(2);
    expect(wrapper.find('.apollo-notification-notice-icon-error').exists()).toBe(true);
    expect(wrapper.find('.apollo-notification-stack').exists()).toBe(false);
    wrapper.unmount();
  });
});
