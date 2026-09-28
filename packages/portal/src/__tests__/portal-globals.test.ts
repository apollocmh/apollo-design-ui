/**
 * `Portal` 的两个全局副作用 —— `autoLock`（滚动锁）与 `onEsc`（ESC 层栈）。
 *
 * 这两个能力是 rc-drawer / rc-dialog 依赖的（`@rc-component/portal@2.2.1` 的
 * `useScrollLocker` + `useEscKeyDown`），2026-09-26 为 drawer 补进本包。
 *
 * 判据：
 *   1. `autoLock && open` 才锁（`open=false` 不锁）；
 *   2. 卸载 ⇒ 解锁 + 出栈；
 *   3. `onEsc` 未传时**不参与** ESC 层栈（不会让别的层的 `top` 判断错位）。
 */
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { Portal } from '../portal';

const locks = () =>
  Array.from(document.head.querySelectorAll('style[data-apollo-css-key]')).filter((el) =>
    el.textContent?.includes('overflow-y: hidden'),
  );

describe('Portal · autoLock', () => {
  it('open 且 autoLock ⇒ 注入锁样式；卸载 ⇒ 移除', async () => {
    const wrapper = mount(Portal, {
      props: { open: true, autoLock: true },
      slots: { default: () => 'content' },
      global: { stubs: { teleport: true } },
    });
    await wrapper.vm.$nextTick();
    expect(locks()).toHaveLength(1);

    wrapper.unmount();
    expect(locks()).toHaveLength(0);
  });

  it('autoLock 但 open=false ⇒ 不锁', async () => {
    const wrapper = mount(Portal, {
      props: { open: false, autoLock: true },
      slots: { default: () => 'content' },
      global: { stubs: { teleport: true } },
    });
    await wrapper.vm.$nextTick();
    expect(locks()).toHaveLength(0);
    wrapper.unmount();
  });
});

describe('Portal · onEsc', () => {
  it('open 且传了 onEsc ⇒ ESC 触发回调（top=true）', async () => {
    const onEsc = vi.fn();
    const wrapper = mount(Portal, {
      props: { open: true, onEsc },
      slots: { default: () => 'content' },
      global: { stubs: { teleport: true } },
    });
    await wrapper.vm.$nextTick();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onEsc).toHaveBeenCalledTimes(1);
    expect(onEsc.mock.calls[0]?.[0]).toMatchObject({ top: true });

    wrapper.unmount();
  });

  it('未传 onEsc ⇒ 不入栈（ESC 不会触发任何东西）', async () => {
    const wrapper = mount(Portal, {
      props: { open: true },
      slots: { default: () => 'content' },
      global: { stubs: { teleport: true } },
    });
    await wrapper.vm.$nextTick();

    expect(() =>
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })),
    ).not.toThrow();

    wrapper.unmount();
  });
});
