/**
 * Popconfirm · L1/L2 单元与交互测试（G5）。
 *
 * 判据：antd `components/popconfirm/__tests__/index.test.tsx` 的主行为 +
 * `PurePanel.tsx` 的 Overlay 契约。
 *
 * ⚠️ 测试必须禁 VTU teleport-stub（`global.stubs.teleport = false`）——
 *    否则浮层渲染在原地，与真实 Teleport 的 DOM 位置不同（popover 期教训）。
 */

import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import { PopconfirmPurePanel } from '../index';
import Popconfirm from '../Popconfirm';

const popup = () => document.querySelector<HTMLElement>('.apollo-popconfirm');
const inner = () => document.querySelector<HTMLElement>('.apollo-popconfirm-inner-content');
const messageIcon = () => document.querySelector<HTMLElement>('.apollo-popconfirm-message-icon');
const titleEl = () => document.querySelector<HTMLElement>('.apollo-popconfirm-title');
const descriptionEl = () => document.querySelector<HTMLElement>('.apollo-popconfirm-description');
const buttons = () =>
  Array.from(document.querySelectorAll<HTMLElement>('.apollo-popconfirm-buttons button'));
const triggerEl = () => document.querySelector<HTMLElement>('.popconfirm-target');

function mountPopconfirm(props: Record<string, unknown> = {}) {
  return mount(Popconfirm, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
    props: {
      title: 'Title',
      mouseEnterDelay: 0,
      mouseLeaveDelay: 0,
      ...props,
    },
    slots: { default: () => h('button', { class: 'popconfirm-target' }, 'target') },
  });
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('Popconfirm · 开合', () => {
  // 上游：should show overlay when trigger is clicked
  it('默认 trigger=click：点击触发元素 ⇒ 浮层出现', async () => {
    const onOpenChange = vi.fn();
    mountPopconfirm({ onOpenChange });
    expect(popup()).toBeNull();
    triggerEl()?.click();
    await vi.waitUntil(() => popup() !== null, { timeout: 2000 }).catch(() => {});
    await nextTick();
    expect(inner()).not.toBeNull();
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  // 上游：should not open in disabled
  it('disabled：不打开，且连 onOpenChange 都不发', async () => {
    const onOpenChange = vi.fn();
    mountPopconfirm({ disabled: true, onOpenChange });
    triggerEl()?.click();
    await nextTick();
    expect(popup()).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  // 上游：should be controlled by open
  it('受控 open：外部驱动', async () => {
    const w = mountPopconfirm({ open: true });
    await nextTick();
    await vi.waitUntil(() => popup() !== null, { timeout: 2000 }).catch(() => {});
    expect(inner()).not.toBeNull();
    await w.setProps({ open: false });
    await nextTick();
  });

  it('defaultOpen：初始即展开', async () => {
    mountPopconfirm({ defaultOpen: true });
    await vi.waitUntil(() => popup() !== null, { timeout: 2000 }).catch(() => {});
    expect(inner()).not.toBeNull();
  });
});

describe('Popconfirm · Overlay 结构', () => {
  it('title + description 双通道；默认 icon 存在', async () => {
    mountPopconfirm({ open: true, title: 'Delete', description: 'Sure?' });
    await vi.waitUntil(() => popup() !== null, { timeout: 2000 }).catch(() => {});
    expect(titleEl()?.textContent).toBe('Delete');
    expect(descriptionEl()?.textContent).toBe('Sure?');
    expect(messageIcon()).not.toBeNull();
  });

  // 上游：should render title when it is the number 0
  it('title 为 0 时渲染（isRenderable 判据）', async () => {
    mountPopconfirm({ open: true, title: 0 });
    await vi.waitUntil(() => popup() !== null, { timeout: 2000 }).catch(() => {});
    expect(titleEl()?.textContent).toContain('0');
  });

  // 上游：should support customize icon / icon={false} 无图标
  it('icon=false：不渲染图标', async () => {
    mountPopconfirm({ open: true, icon: false });
    await vi.waitUntil(() => popup() !== null, { timeout: 2000 }).catch(() => {});
    expect(messageIcon()).toBeNull();
  });

  it('showCancel=false：只有 OK 按钮', async () => {
    mountPopconfirm({ open: true, showCancel: false });
    await vi.waitUntil(() => popup() !== null, { timeout: 2000 }).catch(() => {});
    expect(buttons()).toHaveLength(1);
  });

  // 上游：okText & cancelText could be empty
  it('okText / cancelText 为空串 ⇒ 回退 locale 的 OK / Cancel', async () => {
    mountPopconfirm({ open: true, okText: '', cancelText: '' });
    await vi.waitUntil(() => popup() !== null, { timeout: 2000 }).catch(() => {});
    const btns = buttons();
    expect(btns[0]?.textContent).toContain('Cancel');
    expect(btns[1]?.textContent).toContain('OK');
  });

  it('惰性函数 title / description（getRenderPropValue）', async () => {
    mountPopconfirm({
      open: true,
      title: () => 'lazy-title',
      description: () => 'lazy-description',
    });
    await vi.waitUntil(() => popup() !== null, { timeout: 2000 }).catch(() => {});
    expect(titleEl()?.textContent).toBe('lazy-title');
    expect(descriptionEl()?.textContent).toBe('lazy-description');
  });
});

describe('Popconfirm · 确认与取消', () => {
  // 上游：should trigger onConfirm and onCancel
  it('点 OK ⇒ onConfirm + onOpenChange(false)；点 Cancel ⇒ onCancel + 关闭', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const onOpenChange = vi.fn();
    mountPopconfirm({ open: true, onConfirm, onCancel, onOpenChange });
    await vi.waitUntil(() => popup() !== null, { timeout: 2000 }).catch(() => {});

    const okBtn = buttons().find((b) => b.classList.contains('apollo-btn-primary'));
    okBtn?.click();
    await nextTick();
    expect(onConfirm).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);

    // 重新打开后点取消
    document.body.innerHTML = '';
    mountPopconfirm({ open: true, onConfirm, onCancel, onOpenChange });
    await vi.waitUntil(() => popup() !== null, { timeout: 2000 }).catch(() => {});
    buttons()[0]?.click();
    await nextTick();
    expect(onCancel).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  // 上游：should support onConfirm to return Promise
  it('onConfirm 返回 Promise：按钮进 loading，resolve 后才关闭', async () => {
    vi.useFakeTimers();
    let resolveFn: ((v: unknown) => void) | undefined;
    const onConfirm = () =>
      new Promise((resolve) => {
        resolveFn = resolve;
      });
    const onOpenChange = vi.fn();
    mountPopconfirm({ open: true, onConfirm, onOpenChange });
    await vi.runAllTimersAsync();
    await nextTick();

    const okBtn = buttons().find((b) => b.classList.contains('apollo-btn-primary'));
    okBtn?.click();
    await nextTick();
    // 未 resolve ⇒ 还没关
    expect(onOpenChange).not.toHaveBeenLastCalledWith(false);

    resolveFn?.(null);
    await vi.runAllTimersAsync();
    await nextTick();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('onPopupClick：点浮层内容触发', async () => {
    const onPopupClick = vi.fn();
    mountPopconfirm({ open: true, onPopupClick });
    await vi.waitUntil(() => popup() !== null, { timeout: 2000 }).catch(() => {});
    inner()?.click();
    expect(onPopupClick).toHaveBeenCalled();
  });
});

describe('Popconfirm · 语义化', () => {
  it('classNames / styles 落到 Overlay 的 icon / title / content 槽', async () => {
    mountPopconfirm({
      open: true,
      title: 'T',
      description: 'D',
      icon: '★',
      classNames: { icon: 'custom-icon', title: 'custom-title', content: 'custom-content' },
      styles: { icon: { color: 'red' } },
    });
    await vi.waitUntil(() => popup() !== null, { timeout: 2000 }).catch(() => {});
    expect(messageIcon()?.classList.contains('custom-icon')).toBe(true);
    expect(titleEl()?.classList.contains('custom-title')).toBe(true);
    // ⚠️ description 的语义槽是 `content`（上游逐字）
    expect(descriptionEl()?.classList.contains('custom-content')).toBe(true);
    expect(messageIcon()?.style.color).toBe('red');
  });
});

describe('Popconfirm · PurePanel', () => {
  it('只渲染浮层内容本身（含四层结构）', () => {
    const w = mount(PopconfirmPurePanel, {
      props: { title: 'Title', description: 'Description' },
    });
    const html = w.html();
    expect(html).toContain('apollo-popconfirm-inner-content');
    expect(html).toContain('apollo-popconfirm-message');
    expect(html).toContain('apollo-popconfirm-buttons');
  });

  it('嵌套按钮配置用 Vue 原生 class/style attrs', () => {
    const w = mount(PopconfirmPurePanel, {
      props: {
        title: 'Title',
        showCancel: true,
        cancelButtonProps: { class: 'cancel-native', style: { color: 'blue' } },
        okButtonProps: { class: ['ok-native', { active: true }], style: { color: 'green' } },
      },
    });
    const cancel = w.find('button.cancel-native');
    const ok = w.find('button.ok-native');
    expect(cancel.exists()).toBe(true);
    expect(cancel.attributes('style')).toContain('color: blue');
    expect(ok.classes()).toContain('active');
    expect(ok.attributes('style')).toContain('color: green');
  });
});
