/**
 * L1/L2 —— Modal 的行为测试。
 *
 * 判据来自 antd 6.6.4 的 `components/modal/Modal.tsx` / `confirm.tsx` /
 * `ConfirmDialog.tsx` / `shared.tsx` / `useModal/*`：
 *   1. 受控 `open` 的渲染结构（root > mask + wrap > panel > container > header/body/footer）；
 *   2. `width` 默认 520；`footer: null` 不渲染；`loading` 时 footer 强制不渲染 + Skeleton；
 *   3. `centered` ⇒ wrap 上的 `{p}-centered`；`mask: false` ⇒ 不渲染遮罩；
 *   4. 文案走 locale（okText/cancelText）；`okType` 默认 `primary`；
 *   5. **`confirmLoading` 时点取消不关**（`handleCancel` 的早退）；
 *   6. `closable: false` / `closable.disabled`；
 *   7. 命令式：`Modal.confirm` 的关闭链（`destroy` → 从 destroyFns 摘除 → 卸载）；
 *      ⚠️ **`destroyAll` 之后新开的实例必须重新入队**（本轮预登记的风险点）；
 *   8. `useModal()` 的 holder；
 *   9. `ModalPurePanel`（L4/L6 的取证入口）。
 *
 * ⚠️ 命令式路径整体走 portal（默认 `document.body`）⇒ 断言要在 `document.body` 上找。
 * ⚠️ `confirm()` 的首次渲染走 `setTimeout(0)`（上游 #23623）⇒ 必须等一次宏任务。
 */
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';

import { resetGlobalConfig } from '../../config-provider/global-config';
import Modal from '../index';

const BP = { prefixCls: 'apollo-modal' };

async function ticks(count = 3): Promise<void> {
  for (let i = 0; i < count; i += 1) await nextTick();
}

/** 等一次宏任务（`scheduleRender` 的 `setTimeout(0)`）。 */
function macro(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/**
 * 轮询等待。
 *
 * ⚠️ **关闭是异步的**：`close()` 只把 `open` 置假，真正的卸载发生在**离场动效结束**的
 *    `afterClose` 里。jsdom 没有样式表 ⇒ 动效靠内核的 `motionDeadline = 500ms` 兜底
 *    ⇒ 必须轮询到卸载为止，不能用固定次数的 tick。
 */
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

/** 已渲染的 confirm 实例数。 */
function confirmCount(): number {
  return document.body.querySelectorAll('.apollo-modal-confirm').length;
}

async function mountModal(props: Record<string, unknown> = {}) {
  const wrapper = mount(Modal, {
    props: { ...BP, open: true, getContainer: false, ...props } as never,
    slots: { default: () => 'body-content' },
    global: { stubs: { teleport: false } },
  });
  await ticks();
  return wrapper;
}

afterEach(() => {
  Modal.destroyAll();
  document.body.innerHTML = '';
  resetGlobalConfig();
  vi.restoreAllMocks();
});

describe('Modal · 结构与默认值', () => {
  it('root > (mask, wrap > panel > container > header/title/body/footer)', async () => {
    const wrapper = await mountModal({ title: 'hello', footer: 'F', closable: true });
    await macro();

    expect(wrapper.find('.apollo-modal-root').exists()).toBe(true);
    expect(wrapper.find('.apollo-modal-mask').exists()).toBe(true);
    expect(wrapper.find('.apollo-modal-wrap').exists()).toBe(true);

    const panel = wrapper.find('.apollo-modal');
    expect(panel.attributes('role')).toBe('dialog');
    expect(panel.attributes('aria-modal')).toBe('true');

    expect(wrapper.find('.apollo-modal-container').exists()).toBe(true);
    expect(wrapper.find('.apollo-modal-title').text()).toBe('hello');
    expect(wrapper.find('.apollo-modal-body').text()).toContain('body-content');
    expect(wrapper.find('.apollo-modal-footer').exists()).toBe(true);

    wrapper.unmount();
  });

  it('width 默认 520，可覆盖', async () => {
    const w1 = await mountModal();
    expect(w1.find('.apollo-modal').attributes('style')).toContain('width: 520px');
    w1.unmount();

    const w2 = await mountModal({ width: 800 });
    expect(w2.find('.apollo-modal').attributes('style')).toContain('width: 800px');
    w2.unmount();
  });

  it('footer=null ⇒ 不渲染 footer；footer 函数 ⇒ 收到 (originNode, {OkBtn, CancelBtn})', async () => {
    const w1 = await mountModal({ footer: null });
    expect(w1.find('.apollo-modal-footer').exists()).toBe(false);
    w1.unmount();

    const received: unknown[] = [];
    const w2 = await mountModal({
      footer: (origin: unknown, extra: unknown) => {
        received.push(origin, extra);
        return h('span', { class: 'custom-footer' }, 'custom');
      },
    });
    expect(w2.find('.custom-footer').exists()).toBe(true);
    expect(received).toHaveLength(2);
    expect(Object.keys(received[1] as object)).toEqual(['OkBtn', 'CancelBtn']);
    w2.unmount();
  });

  it('loading ⇒ footer 强制不渲染 + body 里是 Skeleton', async () => {
    const wrapper = await mountModal({ loading: true, footer: 'F' });
    expect(wrapper.find('.apollo-modal-footer').exists()).toBe(false);
    expect(wrapper.find('.apollo-modal-body-skeleton').exists()).toBe(true);
    wrapper.unmount();
  });

  it('centered ⇒ wrap 带 -centered；mask=false ⇒ 不渲染遮罩', async () => {
    const w1 = await mountModal({ centered: true });
    expect(w1.find('.apollo-modal-wrap').classes()).toContain('apollo-modal-centered');
    w1.unmount();

    const w2 = await mountModal({ mask: false });
    expect(w2.find('.apollo-modal-mask:not(.apollo-modal-mask-hidden)').exists()).toBe(false);
    w2.unmount();
  });

  it('宽高是对象 ⇒ 写内联断点变量、不写 numWidth', async () => {
    const wrapper = await mountModal({ width: { xs: 100, md: '50%' } });
    const style = wrapper.find('.apollo-modal').attributes('style') ?? '';
    expect(style).toContain('--apollo-modal-xs-width: 100px');
    expect(style).toContain('--apollo-modal-md-width: 50%');
    wrapper.unmount();
  });
});

describe('Modal · footer 文案与交互', () => {
  it('默认文案走 locale（OK / Cancel）', async () => {
    const wrapper = await mountModal();
    const buttons = wrapper.findAll('.apollo-modal-footer button');
    expect(buttons.map((b) => b.text())).toEqual(['Cancel', 'OK']);
    wrapper.unmount();
  });

  it('okText / cancelText 覆盖 locale；okType 默认 primary', async () => {
    const wrapper = await mountModal({ okText: '好', cancelText: '不好' });
    const ok = wrapper.findAll('.apollo-modal-footer button')[1];
    expect(ok?.text()).toBe('好');
    expect(ok?.classes()).toContain('apollo-btn-primary');
    wrapper.unmount();
  });

  it('点 OK 触发 onOk；点取消触发 onCancel', async () => {
    const onOk = vi.fn();
    const onCancel = vi.fn();
    const wrapper = await mountModal({ onOk, onCancel });
    const buttons = wrapper.findAll('.apollo-modal-footer button');
    await buttons[0]?.trigger('click');
    expect(onCancel).toHaveBeenCalledTimes(1);
    await buttons[1]?.trigger('click');
    expect(onOk).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('confirmLoading ⇒ 点取消不回调也不关（handleCancel 早退）', async () => {
    const onCancel = vi.fn();
    const wrapper = await mountModal({ confirmLoading: true, onCancel });
    await wrapper.find('.apollo-modal-footer button').trigger('click');
    expect(onCancel).not.toHaveBeenCalled();
    // 关闭按钮也走 handleCancel ⇒ 同样被拦住
    await wrapper.find('.apollo-modal-close').trigger('click');
    expect(onCancel).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});

describe('Modal · closable', () => {
  it('closable 默认 true ⇒ 有按钮；false ⇒ 无按钮', async () => {
    const w1 = await mountModal();
    expect(w1.find('.apollo-modal-close').exists()).toBe(true);
    w1.unmount();

    const w2 = await mountModal({ closable: false });
    expect(w2.find('.apollo-modal-close').exists()).toBe(false);
    w2.unmount();
  });

  it('closable.disabled ⇒ 按钮 disabled', async () => {
    const wrapper = await mountModal({ closable: { disabled: true } });
    expect(wrapper.find('.apollo-modal-close').attributes('disabled')).toBeDefined();
    wrapper.unmount();
  });

  it('closable.onClose 随关闭触发（点关闭按钮 / 点遮罩都算）', async () => {
    const onClose = vi.fn();
    const wrapper = await mountModal({ closable: { onClose } });
    await wrapper.find('.apollo-modal-close').trigger('click');
    expect(onClose).toHaveBeenCalledTimes(1);

    // 点遮罩同样走 handleCancel ⇒ 再触发一次
    const wrap = wrapper.find('.apollo-modal-wrap');
    await wrap.trigger('mousedown');
    await wrap.trigger('click');
    expect(onClose).toHaveBeenCalledTimes(2);
    wrapper.unmount();
  });

  it('关闭图标包在 {p}-close-x 里（renderCloseIcon）', async () => {
    const wrapper = await mountModal();
    expect(wrapper.find('.apollo-modal-close-x').exists()).toBe(true);
    wrapper.unmount();
  });
});

describe('Modal · 命令式（Modal.confirm）', () => {
  it('confirm 打开并渲染 confirm 形态的 DOM', async () => {
    Modal.confirm({ title: 'T', content: 'C' });
    await macro();
    await ticks();

    expect(document.body.querySelector('.apollo-modal-confirm')).not.toBeNull();
    expect(document.body.querySelector('.apollo-modal-confirm-body')).not.toBeNull();
    expect(document.body.querySelector('.apollo-modal-confirm-title')?.textContent).toBe('T');
    // ⚠️ 静态方法的确认框**没有**右上角关闭按钮（closable 默认 false）
    expect(document.body.querySelector('.apollo-modal-close')).toBeNull();
  });

  it('type=info/success/error/warning ⇒ 各自的 confirm 类', async () => {
    for (const [method, type] of [
      ['info', 'info'],
      ['success', 'success'],
      ['error', 'error'],
      ['warning', 'warning'],
    ] as const) {
      Modal[method]({ title: 'T', content: 'C' });
      await macro();
      await ticks();
      expect(document.body.querySelector(`.apollo-modal-confirm-${type}`)).not.toBeNull();
      Modal.destroyAll();
      await waitFor(() => confirmCount() === 0);
    }
  });

  it('点 OK ⇒ onOk 调用；destroy ⇒ 卸载', async () => {
    const onOk = vi.fn();
    const instance = Modal.confirm({ title: 'T', content: 'C', onOk });
    await macro();
    await ticks();

    const okBtn = [...document.body.querySelectorAll('button')].find((b) => b.textContent === 'OK');
    okBtn?.click();
    await ticks();
    expect(onOk).toHaveBeenCalledTimes(1);

    instance.destroy();
    await waitFor(() => confirmCount() === 0);
    expect(document.body.querySelector('.apollo-modal-confirm')).toBeNull();
  });

  it('update 改文案', async () => {
    const instance = Modal.confirm({ title: 'T', content: 'C' });
    await macro();
    await ticks();

    instance.update({ content: 'UPDATED' });
    await macro();
    await ticks();
    expect(document.body.querySelector('.apollo-modal-confirm-content')?.textContent).toBe(
      'UPDATED',
    );

    instance.destroy();
    await waitFor(() => confirmCount() === 0);
  });

  it('destroyAll 关掉全部', async () => {
    Modal.confirm({ title: 'A', content: 'A' });
    Modal.confirm({ title: 'B', content: 'B' });
    await macro();
    await ticks();
    expect(confirmCount()).toBe(2);

    Modal.destroyAll();
    await waitFor(() => confirmCount() === 0);
    expect(confirmCount()).toBe(0);
  });

  it('⭐ destroyAll 之后新开的实例必须重新入队（再 destroyAll 也能关掉）', async () => {
    Modal.confirm({ title: 'A', content: 'A' });
    await macro();
    await ticks();
    Modal.destroyAll();
    await waitFor(() => confirmCount() === 0);
    expect(confirmCount()).toBe(0);

    // 再开一个
    Modal.confirm({ title: 'C', content: 'C' });
    await macro();
    await ticks();
    expect(confirmCount()).toBe(1);

    Modal.destroyAll();
    await waitFor(() => confirmCount() === 0);
    expect(confirmCount()).toBe(0);
  });

  it('okCancel=false 的 info 只有一个按钮；justOkText 生效', async () => {
    Modal.info({ title: 'T', content: 'C' });
    await macro();
    await ticks();
    const btns = document.body.querySelectorAll('.apollo-modal-confirm-btns button');
    expect(btns.length).toBe(1);
    expect(btns[0]?.textContent).toBe('OK');
  });
});

describe('Modal · useModal', () => {
  const Host = defineComponent({
    name: 'UseModalHost',
    setup() {
      const [modal, contextHolder] = Modal.useModal();
      (globalThis as Record<string, unknown>).__modalApi = modal;
      return () => h('div', { class: 'host' }, [contextHolder]);
    },
  });

  it('useModal 的 confirm 能打开并关掉', async () => {
    const wrapper = mount(Host, { global: { stubs: { teleport: false } } });
    await ticks();

    const api = (globalThis as Record<string, unknown>).__modalApi as {
      confirm: (c: Record<string, unknown>) => { destroy: () => void };
    };
    api.confirm({ title: 'H', content: 'H' });
    await ticks();
    await ticks();

    expect(document.body.querySelector('.apollo-modal-confirm')).not.toBeNull();

    Modal.destroyAll();
    await waitFor(() => confirmCount() === 0);
    wrapper.unmount();
  });
});

describe('Modal · PurePanel', () => {
  it('结构：{p} {p}-pure-panel（不 portal、不 mask）', async () => {
    const PurePanel = Modal._InternalPanelDoNotUseOrYouWillBeFired;
    const wrapper = mount(PurePanel, {
      props: { prefixCls: 'apollo-modal', title: 'PT' } as never,
      slots: { default: () => 'pure-body' },
    });
    await ticks();

    expect(wrapper.find('.apollo-modal-pure-panel').exists()).toBe(true);
    expect(wrapper.find('.apollo-modal-mask').exists()).toBe(false);
    expect(wrapper.find('.apollo-modal-wrap').exists()).toBe(false);
    expect(wrapper.find('.apollo-modal-title').text()).toBe('PT');
    expect(wrapper.text()).toContain('pure-body');
    wrapper.unmount();
  });

  it('type=confirm ⇒ 渲染 ConfirmContent + confirm 类', async () => {
    const PurePanel = Modal._InternalPanelDoNotUseOrYouWillBeFired;
    const wrapper = mount(PurePanel, {
      props: { prefixCls: 'apollo-modal', type: 'confirm', title: 'PT', content: 'PC' } as never,
    });
    await ticks();

    expect(wrapper.find('.apollo-modal-confirm').exists()).toBe(true);
    expect(wrapper.find('.apollo-modal-confirm-body').exists()).toBe(true);
    expect(wrapper.find('.apollo-modal-confirm-content').text()).toBe('PC');
    wrapper.unmount();
  });
});
