/**
 * modal 内核的行为测试（rc-dialog 的 Vue 自建）。
 *
 * 判据全部来自 `@rc-component/dialog@1.10.0` 的
 * `DialogWrap.js` / `Dialog/index.js` / `Dialog/Content/index.js` / `Dialog/Content/Panel.js`：
 *   1. 根类 = `{p}-root`，里面**包着** mask 与 `{p}-wrap`（mask 不是兄弟节点）；
 *   2. mask 的可见性门是 `mask && visible`（比 content 多一个 `mask`）；
 *   3. 面板：`role=dialog` + `aria-modal=true` + `tabindex=-1` + `aria-labelledby`（仅有 title 时）；
 *   4. 关闭按钮：`aria-label="Close"`、`disabled` 来自 `closable.disabled`；
 *   5. 宽高走 `contentStyle` 且**必须是 px 字符串**（Vue 不给数字补 px，PITFALLS 170）；
 *   6. `mousePosition` ⇒ `transformOrigin`；
 *   7. 点遮罩关闭的三个条件：`maskClosable` + `target === wrap` + **mousedown 也在 wrap 上**；
 *   8. ESC：`top && keyboard` 才关；
 *   9. 关闭后 wrap `display: none` 但**节点仍在**（`autoDestroy: false`）；
 *      `destroyOnHidden` ⇒ 整个卸载；`afterClose` 在动效结束时调一次；
 *  10. 焦点陷阱的门是 `visible && isFixedPos && focusTrap !== false`。
 *
 * ⚠️ **必须多等几个 tick**：Portal 的 `mergedRender` 是 watch；CSSMotion 的首帧
 *    还可能要等驱动接管。同步断言会看到空 DOM。
 * ⚠️ 用 `getContainer: false`（内联模式）⇒ 内容就在 wrapper 里，`wrapper.find` 可用。
 */
import { resetFocusLock } from '@apollo-design/utils';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import DialogWrap from '../engine/DialogWrap';

const BP = { prefixCls: 'apollo-modal' };

/** 等若干 tick（Portal 的 watch + CSSMotion 的驱动都要时间）。 */
async function ticks(count = 3): Promise<void> {
  for (let i = 0; i < count; i += 1) await nextTick();
}

/** 轮询等待（动效走真实 rAF + 500ms 兜底 deadline）。 */
async function waitFor(predicate: () => boolean, timeout = 2500): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (predicate()) return;
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 16);
    });
    await nextTick();
  }
}

async function mountDialog(props: Record<string, unknown> = {}) {
  const wrapper = mount(DialogWrap, {
    props: {
      ...BP,
      visible: true,
      getContainer: false,
      transitionName: 'apollo-zoom',
      maskTransitionName: 'apollo-fade',
      ...props,
    } as never,
    slots: { default: () => 'dialog-body' },
    // ⚠️ `attachTo` 是**焦点陷阱用例的前提**：VTU 默认挂在游离容器里，
    //    此时 `element.isConnected === false` ⇒ `isVisible()` 为假 ⇒
    //    `getFocusNodeList()` 恒空 ⇒ 陷阱拉不动焦点（见「焦点陷阱」一节的说明）。
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });
  await ticks();
  return wrapper;
}

describe('modal 内核 · 结构', () => {
  it('root > (mask, wrap > panel > container > header/title/body/footer)', async () => {
    const wrapper = await mountDialog({
      title: 'hello',
      footer: 'footer-node',
      closable: { closeIcon: 'X' },
    });

    const root = wrapper.find('.apollo-modal-root');
    expect(root.exists()).toBe(true);
    // ⚠️ mask 在 root **里面**，与 wrap 同级
    expect(root.find('.apollo-modal-mask').exists()).toBe(true);
    expect(root.find('.apollo-modal-wrap').exists()).toBe(true);

    const panel = wrapper.find('.apollo-modal');
    expect(panel.exists()).toBe(true);
    expect(panel.attributes('role')).toBe('dialog');
    expect(panel.attributes('aria-modal')).toBe('true');
    expect(panel.attributes('tabindex')).toBe('-1');

    expect(wrapper.find('.apollo-modal-container').exists()).toBe(true);
    expect(wrapper.find('.apollo-modal-header').exists()).toBe(true);
    expect(wrapper.find('.apollo-modal-title').text()).toBe('hello');
    expect(wrapper.find('.apollo-modal-body').text()).toContain('dialog-body');
    expect(wrapper.find('.apollo-modal-footer').text()).toBe('footer-node');

    wrapper.unmount();
  });

  it('aria-labelledby 只在有 title 时挂，且等于 title 的 id', async () => {
    const withTitle = await mountDialog({ title: 'T' });
    const panel1 = withTitle.find('.apollo-modal');
    const labelledBy = panel1.attributes('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    expect(withTitle.find('.apollo-modal-title').attributes('id')).toBe(labelledBy);
    withTitle.unmount();

    const without = await mountDialog();
    expect(without.find('.apollo-modal').attributes('aria-labelledby')).toBeUndefined();
    without.unmount();
  });

  it('mask 的门是 mask && visible', async () => {
    const shown = await mountDialog();
    expect(shown.find('.apollo-modal-mask').exists()).toBe(true);
    shown.unmount();

    const noMask = await mountDialog({ mask: false });
    // mask=false ⇒ CSSMotion 的 visible 为假 ⇒ 只留 `-mask-hidden` 残骸，不带 `-mask` 类
    expect(noMask.find('.apollo-modal-mask:not(.apollo-modal-mask-hidden)').exists()).toBe(false);
    noMask.unmount();
  });
});

describe('modal 内核 · 关闭按钮与尺寸', () => {
  it('关闭按钮 aria-label=Close，点它触发 onClose', async () => {
    const onClose = vi.fn();
    const wrapper = await mountDialog({ closable: { closeIcon: 'X' }, onClose });
    const close = wrapper.find('.apollo-modal-close');
    expect(close.exists()).toBe(true);
    expect(close.attributes('aria-label')).toBe('Close');
    await close.trigger('click');
    expect(onClose).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('closable.disabled ⇒ 按钮 disabled', async () => {
    const wrapper = await mountDialog({ closable: { disabled: true, closeIcon: 'X' } });
    expect(wrapper.find('.apollo-modal-close').attributes('disabled')).toBeDefined();
    wrapper.unmount();
  });

  it('closable=false ⇒ 不渲染关闭按钮', async () => {
    const wrapper = await mountDialog({ closable: false });
    expect(wrapper.find('.apollo-modal-close').exists()).toBe(false);
    wrapper.unmount();
  });

  it('width 必须是 px 字符串（裸数字会被 Vue 丢弃）', async () => {
    const wrapper = await mountDialog({ width: 520 });
    expect(wrapper.find('.apollo-modal').attributes('style')).toContain('width: 520px');
    wrapper.unmount();
  });
});

describe('modal 内核 · mousePosition', () => {
  it('有 mousePosition ⇒ 面板带 transformOrigin', async () => {
    const wrapper = await mountDialog({ mousePosition: { x: 100, y: 50 } });
    await waitFor(() =>
      (wrapper.find('.apollo-modal').attributes('style') ?? '').includes('transform-origin'),
    );
    expect(wrapper.find('.apollo-modal').attributes('style')).toContain('transform-origin');
    wrapper.unmount();
  });
});

describe('modal 内核 · 点遮罩关闭', () => {
  it('mousedown 与 click 都落在 wrap 上 ⇒ onClose', async () => {
    const onClose = vi.fn();
    const wrapper = await mountDialog({ onClose });
    const wrap = wrapper.find('.apollo-modal-wrap');
    await wrap.trigger('mousedown');
    await wrap.trigger('click');
    expect(onClose).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('mousedown 落在面板上（拖选文字）⇒ click 到 wrap 也不关', async () => {
    const onClose = vi.fn();
    const wrapper = await mountDialog({ onClose });
    await wrapper.find('.apollo-modal').trigger('mousedown');
    await wrapper.find('.apollo-modal-wrap').trigger('click');
    expect(onClose).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('maskClosable=false ⇒ 不关', async () => {
    const onClose = vi.fn();
    const wrapper = await mountDialog({ onClose, maskClosable: false });
    const wrap = wrapper.find('.apollo-modal-wrap');
    await wrap.trigger('mousedown');
    await wrap.trigger('click');
    expect(onClose).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});

describe('modal 内核 · ESC', () => {
  it('keyboard=true（默认）⇒ ESC 触发 onClose', async () => {
    const onClose = vi.fn();
    const wrapper = await mountDialog({ onClose });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('keyboard=false ⇒ ESC 不触发', async () => {
    const onClose = vi.fn();
    const wrapper = await mountDialog({ onClose, keyboard: false });
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onClose).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});

describe('modal 内核 · 关闭与销毁', () => {
  it('关闭后 wrap display:none 且节点仍在；afterClose 触发一次', async () => {
    const afterClose = vi.fn();
    const wrapper = await mountDialog({ afterClose });

    await wrapper.setProps({ visible: false } as never);
    await waitFor(() => afterClose.mock.calls.length > 0);

    expect(afterClose).toHaveBeenCalledTimes(1);
    const root = wrapper.find('.apollo-modal-root');
    expect(root.exists()).toBe(true);
    expect(wrapper.find('.apollo-modal-wrap').attributes('style')).toContain('display: none');
    wrapper.unmount();
  });

  it('destroyOnHidden=true ⇒ 关闭后整个卸载', async () => {
    const wrapper = await mountDialog({ destroyOnHidden: true });
    await wrapper.setProps({ visible: false } as never);
    await waitFor(() => !wrapper.find('.apollo-modal-root').exists());
    expect(wrapper.find('.apollo-modal-root').exists()).toBe(false);
    wrapper.unmount();
  });

  it('afterOpenChange 收到 true 与 false', async () => {
    const afterOpenChange = vi.fn();
    const wrapper = await mountDialog({ afterOpenChange });
    await waitFor(() => afterOpenChange.mock.calls.some((c) => c[0] === true));
    expect(afterOpenChange).toHaveBeenCalledWith(true);

    await wrapper.setProps({ visible: false } as never);
    await waitFor(() => afterOpenChange.mock.calls.some((c) => c[0] === false));
    expect(afterOpenChange).toHaveBeenCalledWith(false);
    wrapper.unmount();
  });
});

describe('modal 内核 · 焦点陷阱', () => {
  /**
   * ⚠️ jsdom 不实现布局 ⇒ `offsetParent` 恒 `null`、`getBoundingClientRect()` 全 0
   *    ⇒ `isVisible()` 对所有元素返回 false ⇒ `getFocusNodeList()` 恒为空
   *    ⇒ 焦点陷阱**拉不动焦点**（`matchElement` 是 undefined）。
   *    所以这一组必须先造出「元素可见」这个前提，打法与
   *    `packages/utils/src/__tests__/focus.test.ts` 的 `stubLayout()` 相同。
   */
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
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).offsetParent;
    resetFocusLock();
  });

  it('isFixedPos 且 visible ⇒ 焦点逃出面板会被拉回', async () => {
    stubLayout();
    // jsdom 没有样式表 ⇒ 只能靠**内联样式**让 `getComputedStyle(wrap).position` 读到 fixed
    const wrapper = await mountDialog({ styles: { wrapper: { position: 'fixed' } } });
    // 等 Dialog 的 nextTick(syncIsFixedPos) 生效 ⇒ Panel 的 useLockFocus 才锁
    await ticks(4);

    const outside = document.createElement('button');
    outside.textContent = 'outside';
    document.body.appendChild(outside);
    outside.focus();
    window.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    const panel = wrapper.find('.apollo-modal').element;
    expect(panel.contains(document.activeElement)).toBe(true);

    outside.remove();
    wrapper.unmount();
  });

  it('focusTrap=false ⇒ 不锁焦点', async () => {
    stubLayout();
    const wrapper = await mountDialog({
      styles: { wrapper: { position: 'fixed' } },
      focusTrap: false,
    });
    await ticks(4);

    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();
    window.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    expect(document.activeElement).toBe(outside);

    outside.remove();
    wrapper.unmount();
  });

  it('不是 fixed 定位（isFixedPos=false）⇒ 不锁焦点', async () => {
    stubLayout();
    const wrapper = await mountDialog();
    await ticks(4);

    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();
    window.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    expect(document.activeElement).toBe(outside);

    outside.remove();
    wrapper.unmount();
  });
});
