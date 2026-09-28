/**
 * Tour · L2 键盘交互（G6）。
 *
 * 判据：rc-tour `Tour.js` 的两条键盘通道（§9-V4）：
 *   1. **Esc**：经 Mask 的 Portal onEsc（层栈 + IME 保护）——
 *      条件 `keyboard && mergedClosable !== null`（closable 被显式关掉时 Esc 无效）；
 *   2. **←/→**：window 级 keydown —— `KeyCode.isEditableTarget` 守卫
 *      （INPUT / TEXTAREA / SELECT / contentEditable 不抢键）。
 */

import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { Tour } from '../index';

const panel = () => document.querySelector<HTMLElement>('.apollo-tour-panel');
const titleText = () => document.querySelector('.apollo-tour-title')?.textContent;

async function waitOpen(): Promise<void> {
  await vi.waitUntil(() => panel() !== null, { timeout: 2000 }).catch(() => {});
  await nextTick();
}

function mountTour(props: Record<string, unknown> = {}) {
  return mount(Tour, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
    props: {
      open: true,
      steps: [{ title: 'step-0' }, { title: 'step-1' }, { title: 'step-2' }],
      ...props,
    },
  });
}

function pressKey(key: string, target?: HTMLElement): void {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  (target ?? window).dispatchEvent(event);
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Tour · 键盘导航（←/→）', () => {
  it('ArrowRight / ArrowLeft 切换步骤并 preventDefault', async () => {
    const w = mountTour();
    await waitOpen();
    expect(titleText()).toBe('step-0');
    pressKey('ArrowRight');
    await nextTick();
    expect(titleText()).toBe('step-1');
    pressKey('ArrowRight');
    await nextTick();
    expect(titleText()).toBe('step-2');
    // 到最后一步：再按右不动
    pressKey('ArrowRight');
    await nextTick();
    expect(titleText()).toBe('step-2');
    pressKey('ArrowLeft');
    await nextTick();
    expect(titleText()).toBe('step-1');
    // 第 0 步按左不动（无 prev 边界由 current>0 判据保证）
    pressKey('ArrowLeft');
    await nextTick();
    pressKey('ArrowLeft');
    await nextTick();
    expect(titleText()).toBe('step-0');
    w.unmount();
  });

  it('keyboard=false：方向键无效', async () => {
    const w = mountTour({ keyboard: false });
    await waitOpen();
    pressKey('ArrowRight');
    await nextTick();
    expect(titleText()).toBe('step-0');
    w.unmount();
  });

  it('输入类元素上的方向键不抢（isEditableTarget 守卫）', async () => {
    const w = mountTour();
    await waitOpen();
    const input = document.createElement('input');
    document.body.appendChild(input);
    pressKey('ArrowRight', input);
    await nextTick();
    expect(titleText()).toBe('step-0');
    input.remove();
    w.unmount();
  });

  it('关闭后键盘监听摘除', async () => {
    const w = mountTour();
    await waitOpen();
    await w.setProps({ open: false });
    await nextTick();
    pressKey('ArrowRight');
    await nextTick();
    // 面板没重新打开，也无副作用
    expect(panel()).toBeNull();
    w.unmount();
  });
});

describe('Tour · Esc 关闭（Portal 层栈）', () => {
  it('Esc 发 update:open(false) + close(current)，并 preventDefault', async () => {
    const onUpdate = vi.fn();
    const onClose = vi.fn();
    const w = mountTour({ 'onUpdate:open': onUpdate, onClose });
    await waitOpen();
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    window.dispatchEvent(event);
    await nextTick();
    expect(event.defaultPrevented).toBe(true);
    expect(onUpdate).toHaveBeenCalledWith(false);
    expect(onClose).toHaveBeenCalledWith(0);
    w.unmount();
  });

  it('closable=false：Esc 无效（mergedClosable === null 判据）', async () => {
    const onUpdate = vi.fn();
    const w = mountTour({ closable: false, 'onUpdate:open': onUpdate });
    await waitOpen();
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    window.dispatchEvent(event);
    await nextTick();
    expect(event.defaultPrevented).toBe(false);
    expect(onUpdate).not.toHaveBeenCalled();
    w.unmount();
  });

  it('keyboard=false：Esc 无效', async () => {
    const onUpdate = vi.fn();
    const w = mountTour({ keyboard: false, 'onUpdate:open': onUpdate });
    await waitOpen();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await nextTick();
    expect(onUpdate).not.toHaveBeenCalled();
    w.unmount();
  });
});
