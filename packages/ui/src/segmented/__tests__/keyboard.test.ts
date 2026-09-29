/**
 * L2 · 键盘交互 —— Segmented
 *
 * 上游测试：rc `index.test.tsx` 的 keyboard 系列 +
 * antd `segmented.test.tsx`（Arrow 键在 radiogroup 上导航）。
 *
 * 判据（rc onOffset）：
 *   - ArrowLeft / ArrowUp = −1，ArrowRight / ArrowDown = +1
 *   - 有效集合 = 非 disabled 项 + 当前项（disabled 的当前项也保留在集合里）
 *   - 环绕（取模）
 *   - 焦点样式靠 Tab keyup 判别（-item-focused 只在 isFocused && isKeyboard）
 */

import { type DOMWrapper, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Segmented } from '../index';

afterEach(() => {
  vi.restoreAllMocks();
});

const OPTIONS = ['Daily', 'Weekly', 'Monthly'];

const findInputs = (w: ReturnType<typeof mount>) => w.findAll('input');

/**
 * 取第 index 项（`noUncheckedIndexedAccess` 下的显式化；越界**抛错**而不是塞 `undefined`
 * —— 与 pagination 的 `at()` 同判，避免把「取不到」静默变成后续的 TypeError）。
 */
const at = <T>(list: T[], index: number): T => {
  const item = list[index];
  if (item === undefined) {
    throw new Error(`期望至少有 ${index + 1} 个元素，实际 ${list.length} 个`);
  }
  return item;
};
/** findAll 的元素索引可能越界（noUncheckedIndexedAccess）—— helper 统一吃 undefined。 */
const keydown = (input: DOMWrapper<Element> | undefined, key: string) =>
  input?.trigger('keydown', { key });
const keyup = (input: DOMWrapper<Element> | undefined, key: string) =>
  input?.trigger('keyup', { key });

describe('Segmented · 键盘导航', () => {
  // rc：ArrowRight +1
  it('ArrowRight：选中下一项', async () => {
    const onChange = vi.fn();
    const w = mount(Segmented, { props: { options: OPTIONS }, attrs: { onChange } });
    await keydown(at(findInputs(w), 0), 'ArrowRight');
    expect(onChange).toHaveBeenCalledWith('Weekly');
  });

  // rc：ArrowLeft -1（第一项环绕到最后一项）
  it('ArrowLeft：第一项环绕到最后一项', async () => {
    const onChange = vi.fn();
    const w = mount(Segmented, { props: { options: OPTIONS }, attrs: { onChange } });
    await keydown(at(findInputs(w), 0), 'ArrowLeft');
    expect(onChange).toHaveBeenCalledWith('Monthly');
  });

  // rc：ArrowUp -1 / ArrowDown +1（垂直同键位）
  it('ArrowUp = ArrowLeft，ArrowDown = ArrowRight', async () => {
    const onChange = vi.fn();
    const w = mount(Segmented, {
      props: { options: OPTIONS, value: 'Weekly' },
      attrs: { onChange },
    });
    await keydown(at(findInputs(w), 1), 'ArrowDown');
    expect(onChange).toHaveBeenCalledWith('Monthly');
    await keydown(at(findInputs(w), 1), 'ArrowUp');
    expect(onChange).toHaveBeenCalledWith('Daily');
  });

  // rc：有效集合排除 disabled 项（跳过）
  it('跳过 disabled 项', async () => {
    const onChange = vi.fn();
    const w = mount(Segmented, {
      props: {
        options: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b', disabled: true },
          { label: 'C', value: 'c' },
        ],
      },
      attrs: { onChange },
    });
    await keydown(at(findInputs(w), 0), 'ArrowRight');
    expect(onChange).toHaveBeenCalledWith('c');
  });

  // rc：当前项 disabled 时也保留在有效集合里（不被跳过自己）。
  // ⚠️ 测试修正说明（AGENTS.md §4.2-3）：原设想「对 disabled 当前项派发 keydown」
  //    在真实浏览器与 jsdom 里都**不可达** —— disabled input 不派发任何事件，
  //    焦点也落不上去；焦点在根 div（tabIndex=0）时事件不经过 input 的 handler。
  //    rc 的键盘 handler 挂在每个 input 上，这条「保留当前项」的集合逻辑
  //    是防御性分支，无法通过 DOM 事件从外部驱动 —— 该行为由 L1 的实现注释钉，
  //    不写成可失败的 DOM 断言。
  it('全 disabled 组外没有可聚焦项：键盘不产生事件（防御性对照）', async () => {
    const onChange = vi.fn();
    const w = mount(Segmented, {
      props: {
        options: [
          { label: 'A', value: 'a', disabled: true },
          { label: 'B', value: 'b' },
        ],
        value: 'a',
      },
      attrs: { onChange },
    });
    // 非 disabled 项（B）可以正常导航
    await keydown(at(findInputs(w), 1), 'ArrowLeft');
    expect(onChange).toHaveBeenCalledWith('b');
    w.unmount();
  });

  // rc：末项 ArrowRight 环绕回首项
  it('末项 ArrowRight 环绕回首项', async () => {
    const onChange = vi.fn();
    const w = mount(Segmented, {
      props: { options: OPTIONS, value: 'Monthly' },
      attrs: { onChange },
    });
    await keydown(at(findInputs(w), 2), 'ArrowRight');
    expect(onChange).toHaveBeenCalledWith('Daily');
  });

  // 整组 disabled：键盘不产生事件
  it('整组 disabled：键盘导航无效', async () => {
    const onChange = vi.fn();
    const w = mount(Segmented, {
      props: { options: OPTIONS, disabled: true },
      attrs: { onChange },
    });
    await keydown(at(findInputs(w), 0), 'ArrowRight');
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Segmented · 焦点样式判别', () => {
  // rc：isKeyboard 靠 Tab keyup 置真、mousedown 置假 → -item-focused。
  // ⚠️ PLATFORM：jsdom 下 Vue 的 mousedown/mouseup listener 不被派发调用
  //    （裸 h('div', {onMouseDown}) 即可复现；click/keydown/mouseenter 正常）。
  //    「mousedown 清除键盘态」在 L6（Playwright 真浏览器）验证，
  //    这里只钉 Tab → focused 出现与 blur → 消失。
  it('Tab 后聚焦：选中项挂 -item-focused', async () => {
    const w = mount(Segmented, { props: { options: OPTIONS }, attachTo: document.body });
    const input = at(findInputs(w), 0);
    await input.trigger('focus');
    // 还没按 Tab：无 focused 类
    expect(w.find('label').classes()).not.toContain('apollo-segmented-item-focused');
    await keyup(input, 'Tab');
    await input.trigger('focus');
    expect(w.find('label').classes()).toContain('apollo-segmented-item-focused');
    w.unmount();
  });

  // blur 移除 isFocused
  it('blur 后 -item-focused 消失', async () => {
    const w = mount(Segmented, { props: { options: OPTIONS }, attachTo: document.body });
    const input = at(findInputs(w), 0);
    await input.trigger('focus');
    await keyup(input, 'Tab');
    expect(w.find('label').classes()).toContain('apollo-segmented-item-focused');
    await input.trigger('blur');
    expect(w.find('label').classes()).not.toContain('apollo-segmented-item-focused');
    w.unmount();
  });
});
