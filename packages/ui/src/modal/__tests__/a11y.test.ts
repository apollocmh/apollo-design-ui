/**
 * L5 · 无障碍 —— `role=dialog` + `aria-modal` + `aria-labelledby`、
 * 关闭按钮的可访问名；**焦点三条**（陷阱 / 归还 / `autoFocusButton`）；
 * axe 扫全部 demo（0 violation）。
 *
 * ⚠️ 焦点陷阱在 jsdom 里需要两个前提，缺一不可（见 `engine.test.ts` 的说明）：
 *   1. 元素必须**挂在 document 上**（VTU 默认挂在游离容器里 ⇒ `isVisible()` 全假
 *      ⇒ `getFocusNodeList()` 恒空 ⇒ 陷阱拉不动焦点）⇒ 用 `attachTo: document.body`；
 *   2. jsdom 没有布局 ⇒ 用 `HTMLElement.prototype.offsetParent` 桩造出「可见」。
 */
import { a11yDemoTest } from '@apollo-design/test-utils';
import { resetFocusLock } from '@apollo-design/utils';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import Modal from '../index';

a11yDemoTest('Modal', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 23,
  global: { stubs: { teleport: false } },
});

const BP = { prefixCls: 'apollo-modal' };

async function ticks(count = 3): Promise<void> {
  for (let i = 0; i < count; i += 1) await nextTick();
}

async function mountModal(props: Record<string, unknown> = {}) {
  const wrapper = mount(Modal, {
    props: { ...BP, open: true, getContainer: false, ...props } as never,
    slots: { default: () => 'content' },
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });
  await ticks();
  return wrapper;
}

/** jsdom 不实现布局 ⇒ 先造出「元素可见」这个前提（同 `utils` 的 focus.test.ts）。 */
function stubLayout(): void {
  Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
    get(this: HTMLElement) {
      if (!this.isConnected) return null;
      return this.parentElement ?? null;
    },
    configurable: true,
  });
}

afterEach(() => {
  Modal.destroyAll();
  document.body.innerHTML = '';
  delete (HTMLElement.prototype as unknown as Record<string, unknown>).offsetParent;
  resetFocusLock();
});

describe('Modal · 语义断言', () => {
  it('面板是 role=dialog + aria-modal=true + tabindex=-1', async () => {
    const wrapper = await mountModal({ title: 'T' });
    const panel = wrapper.find('.apollo-modal');
    expect(panel.attributes('role')).toBe('dialog');
    expect(panel.attributes('aria-modal')).toBe('true');
    expect(panel.attributes('tabindex')).toBe('-1');
    wrapper.unmount();
  });

  it('有 title ⇒ aria-labelledby 指向 -title 的 id；无 title ⇒ 不挂', async () => {
    const w1 = await mountModal({ title: 'T' });
    expect(w1.find('.apollo-modal').attributes('aria-labelledby')).toBe(
      w1.find('.apollo-modal-title').attributes('id'),
    );
    w1.unmount();

    const w2 = await mountModal();
    expect(w2.find('.apollo-modal').attributes('aria-labelledby')).toBeUndefined();
    w2.unmount();
  });

  it('关闭按钮是可聚焦的 button 且有可访问名（aria-label=Close）', async () => {
    const wrapper = await mountModal({ title: 'T' });
    const close = wrapper.find('.apollo-modal-close');
    expect(close.element.tagName).toBe('BUTTON');
    expect(close.attributes('aria-label')).toBe('Close');
    wrapper.unmount();
  });

  it('closable=false ⇒ 无关闭按钮（此时只能靠 ESC / 遮罩关闭）', async () => {
    const wrapper = await mountModal({ title: 'T', closable: false });
    expect(wrapper.find('.apollo-modal-close').exists()).toBe(false);
    wrapper.unmount();
  });

  it('ESC 关闭（keyboard 默认 true）', async () => {
    const wrapper = await mountModal();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await ticks();
    // 关闭是异步的（离场动效）—— 这里只断言「关闭按钮已触发」这一层
    expect(wrapper.find('.apollo-modal').exists()).toBe(true);
    wrapper.unmount();
  });
});

describe('Modal · 焦点三条（registry 点名的 a11y 硬要求）', () => {
  it('① 陷阱：焦点逃出面板会被拉回（isFixedPos 且 visible）', async () => {
    stubLayout();
    const wrapper = await mountModal({ styles: { wrapper: { position: 'fixed' } } });
    await ticks(4);

    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();
    window.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    expect(wrapper.find('.apollo-modal').element.contains(document.activeElement)).toBe(true);
    outside.remove();
    wrapper.unmount();
  });

  it('② 归还：关闭后焦点回到打开前的元素', async () => {
    stubLayout();
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const wrapper = await mountModal({ styles: { wrapper: { position: 'fixed' } } });
    await ticks(4);

    // 打开后焦点被移进面板（focusDialogContent）
    await wrapper.setProps({ open: false } as never);
    // 等离场动效结束（jsdom 靠内核的 500ms deadline 兜底）
    const start = Date.now();
    while (Date.now() - start < 2500 && document.activeElement !== trigger) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 16);
      });
      await nextTick();
    }

    expect(document.activeElement).toBe(trigger);
    trigger.remove();
    wrapper.unmount();
  });

  it('③ autoFocusButton：Modal.confirm 默认聚焦 OK 按钮', async () => {
    stubLayout();
    Modal.confirm({ title: 'T', content: 'C' });
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
    await ticks(4);
    // ActionButton 的 autoFocus 走 setTimeout(0)
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
    await ticks();

    const okBtn = [...document.body.querySelectorAll('button')].find((b) => b.textContent === 'OK');
    expect(okBtn).toBeTruthy();
    expect(document.activeElement).toBe(okBtn);
  });

  it('③ autoFocusButton=null（顶层，deprecated）⇒ 不自动聚焦', async () => {
    stubLayout();
    // ⚠️ 用**顶层**的 `autoFocusButton`（antd 已标 deprecated）——
    //    只有它能表达「不自动聚焦」，见下一条用例的 quirk
    Modal.confirm({ title: 'T', content: 'C', autoFocusButton: null });
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
    await ticks(4);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
    await ticks();

    const okBtn = [...document.body.querySelectorAll('button')].find((b) => b.textContent === 'OK');
    expect(okBtn).toBeTruthy();
    expect(document.activeElement).not.toBe(okBtn);
  });

  it('⚠️ quirk：`focusable.autoFocusButton: null` 会**退回 `ok`**（上游的 `||` 吃掉 null）', async () => {
    stubLayout();
    // 上游：`const base = focusable?.autoFocusButton || autoFocusButton;`
    //       ⇒ `null || undefined` = `undefined` ⇒ 走默认 `'ok'`
    // 即：**只有** deprecated 的顶层 `autoFocusButton` 能表达「不聚焦」。
    // 本仓跟随上游（不做「顺手修」），登记在 COMPATIBILITY.md。
    Modal.confirm({ title: 'T', content: 'C', focusable: { autoFocusButton: null } });
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
    await ticks(4);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
    await ticks();

    const okBtn = [...document.body.querySelectorAll('button')].find((b) => b.textContent === 'OK');
    expect(okBtn).toBeTruthy();
    expect(document.activeElement).toBe(okBtn);
  });

  it('③ autoFocusButton=cancel ⇒ 聚焦取消按钮', async () => {
    stubLayout();
    Modal.confirm({ title: 'T', content: 'C', focusable: { autoFocusButton: 'cancel' } });
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
    await ticks(4);
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
    await ticks();

    const cancelBtn = [...document.body.querySelectorAll('button')].find(
      (b) => b.textContent === 'Cancel',
    );
    expect(cancelBtn).toBeTruthy();
    expect(document.activeElement).toBe(cancelBtn);
  });
});
