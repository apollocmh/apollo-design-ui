/**
 * Popconfirm · Issue #26 回归（4 项，先复现后修）。
 *
 * ⚠️ 与 index.test.ts 同款约束：必须禁 VTU 的 teleport-stub。
 */
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import Tooltip from '../../tooltip/Tooltip';
import { PopconfirmPurePanel } from '../index';
import Popconfirm from '../Popconfirm';

const popup = () => document.querySelector<HTMLElement>('.apollo-popconfirm');
const inner = () => document.querySelector<HTMLElement>('.apollo-popconfirm-inner-content');
const messageIcon = () => document.querySelector<HTMLElement>('.apollo-popconfirm-message-icon');
const buttons = () =>
  Array.from(document.querySelectorAll<HTMLElement>('.apollo-popconfirm-buttons button'));

function mountPopconfirm(
  props: Record<string, unknown> = {},
  slots?: Record<string, () => unknown>,
) {
  return mount(Popconfirm, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
    props: {
      title: 'Title',
      mouseEnterDelay: 0,
      mouseLeaveDelay: 0,
      ...props,
    } as never,
    slots: slots ?? { default: () => h('button', { class: 'popconfirm-target' }, 'target') },
  });
}

/** 打开浮层（受控 open=true）。 */
async function opened(props: Record<string, unknown> = {}, slots?: Record<string, () => unknown>) {
  const w = mountPopconfirm({ open: true, ...props }, slots);
  await nextTick();
  await nextTick();
  return w;
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('#26.1 公开类型承诺的公共浮层配置要真的生效', () => {
  it('[A] getPopupContainer：浮层挂到指定容器', async () => {
    const box = document.createElement('div');
    box.className = 'my-container';
    document.body.appendChild(box);
    const w = await opened({ getPopupContainer: () => box });
    expect(popup()).not.toBeNull();
    expect(popup()?.parentElement?.className).toBe('my-container');
    w.unmount();
    box.remove();
  });

  it('[B] zIndex 落到浮层根', async () => {
    const w = await opened({ zIndex: 1234 });
    expect(popup()?.style.zIndex).toBe('1234');
    w.unmount();
  });

  it('[C] id 落到浮层容器', async () => {
    const w = await opened({ id: 'pc-1' });
    const container = document.querySelector<HTMLElement>('[role="tooltip"]');
    expect(container?.getAttribute('id')).toBe('pc-1');
    w.unmount();
  });

  it('[D] afterOpenChange 经 Tooltip 和 Popover 单次发送 Vue 事件', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const once = vi.fn();
    const w = await opened({
      onAfterOpenChange: [first, second],
      onAfterOpenChangeOnce: once,
    });
    const tooltip = w.getComponent(Tooltip);
    // 此处验证拥有者之间的通知链；动效完成的产生时机由 Tooltip 回归负责。
    tooltip.vm.$emit('afterOpenChange', true);
    tooltip.vm.$emit('afterOpenChange', false);
    expect(first.mock.calls).toEqual([[true], [false]]);
    expect(second.mock.calls).toEqual([[true], [false]]);
    expect(once.mock.calls).toEqual([[true]]);
    expect(w.emitted('afterOpenChange')).toEqual([[true], [false]]);
    w.unmount();
  });

  it('[E] onPopupClick 走通', async () => {
    const onPopupClick = vi.fn();
    const w = await opened({ onPopupClick });
    inner()?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(onPopupClick).toHaveBeenCalledTimes(1);
    w.unmount();
  });
});

describe('#26.2 PurePanel 要接住回调与语义槽', () => {
  it('[A] onConfirm：点 OK 触发', async () => {
    const onConfirm = vi.fn();
    // ⚠️ PurePanel 没有 portal ⇒ 必须 attachTo body，否则 `document` 上查不到
    const w = mount(PopconfirmPurePanel as never, {
      attachTo: document.body,
      props: { onConfirm } as never,
    });
    await nextTick();
    const btns = buttons();
    expect(btns.length).toBeGreaterThan(0);
    btns[btns.length - 1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(onConfirm).toHaveBeenCalled();
    w.unmount();
  });

  it('[B] onCancel：点取消触发', async () => {
    const onCancel = vi.fn();
    const w = mount(PopconfirmPurePanel as never, {
      attachTo: document.body,
      props: { onCancel } as never,
    });
    await nextTick();
    const btns = buttons();
    expect(btns.length).toBe(2);
    btns[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(onCancel).toHaveBeenCalled();
    w.unmount();
  });

  it('[C] classNames.icon 落到图标', async () => {
    const w = mount(PopconfirmPurePanel as never, {
      attachTo: document.body,
      props: { title: 'T', classNames: { icon: 'icon-x' } } as never,
    });
    await nextTick();
    expect(messageIcon()?.classList.contains('icon-x')).toBe(true);
    w.unmount();
  });
});

describe('#26.3 函数式 classNames/styles 要看到当前 Props', () => {
  it('[A] props.open 变化后函数式结果跟着变', async () => {
    const w = mountPopconfirm({
      open: false,
      classNames: ({ props }: { props: { open?: boolean } }) => ({
        icon: props.open ? 'is-open' : 'is-closed',
      }),
    });
    await nextTick();
    await w.setProps({ open: true });
    await nextTick();
    await nextTick();
    expect(messageIcon()?.classList.contains('is-open')).toBe(true);
    expect(messageIcon()?.classList.contains('is-closed')).toBe(false);
    w.unmount();
  });
});

describe('#26.4 okText / cancelText 的富内容通道', () => {
  it('[A] #okText 插槽（icon + text）优先于字符串 prop', async () => {
    const w = await opened({ okText: 'plain' }, {
      default: () => h('button', { class: 'popconfirm-target' }, 'target'),
      okText: () => h('span', { class: 'rich-ok' }, 'Rich OK'),
    } as never);
    const btns = buttons();
    expect(btns.length).toBeGreaterThan(0);
    expect(btns[btns.length - 1]?.querySelector('.rich-ok')).not.toBeNull();
    w.unmount();
  });

  it('[B] #cancelText 同理', async () => {
    const w = await opened({ cancelText: 'plain' }, {
      default: () => h('button', { class: 'popconfirm-target' }, 'target'),
      cancelText: () => h('span', { class: 'rich-cancel' }, 'Rich Cancel'),
    } as never);
    const btns = buttons();
    expect(btns[0]?.querySelector('.rich-cancel')).not.toBeNull();
    w.unmount();
  });

  it('[C] 守卫：不给插槽时字符串 prop + locale 回退不变', async () => {
    const w = await opened({ okText: '', cancelText: '' });
    const btns = buttons();
    expect(btns.length).toBe(2);
    expect(btns[0]?.textContent).toBeTruthy();
    expect(btns[1]?.textContent).toBeTruthy();
    w.unmount();
  });
});
