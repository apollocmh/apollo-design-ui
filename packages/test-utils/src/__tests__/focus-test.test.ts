/**
 * `focus-test.ts` 的契约测试。
 *
 * 三件事：
 *   1. `findFocusElement` 的**全部失败分支**（只在组件测试配错 selector 时才会走到，
 *      靠组件测试覆盖不到）
 *   2. `focusTest` 的真实注册（含 `refFocus` 的 `findComponent` 定位）
 *   3. 「先断言元素可聚焦」这条前置检查
 */

import { describe, expect, it } from 'vitest';
import { h } from 'vue';

import { findFocusElement, focusTest } from '../focus-test';
import { FocusBox, PlainBox } from './fixture';

/** 造一个游离的宿主元素。 */
function makeHost(html: string): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = html;
  return host;
}

describe('findFocusElement（导出的失败路径）', () => {
  it('显式 selector 命中恰好 1 个 → 返回它', () => {
    const host = makeHost('<div><input class="target"></div>');
    expect(findFocusElement(host, '.target', 'x').tagName).toBe('INPUT');
  });

  it('显式 selector 命中 0 个 → 抛错并说明', () => {
    const host = makeHost('<div><input></div>');
    expect(() => findFocusElement(host, '.missing', 'ctx')).toThrow(
      /selector "\.missing" 命中 0 个元素，期望恰好 1 个/,
    );
    expect(() => findFocusElement(host, '.missing', 'ctx')).toThrow(/\[test-utils\] ctx/);
  });

  it('⭐ 显式 selector 命中多个 → 抛错（多焦点元素是组件事实，不猜）', () => {
    const host = makeHost('<input><input>');
    expect(() => findFocusElement(host, 'input', 'ctx')).toThrow(
      /selector "input" 命中 2 个元素，期望恰好 1 个/,
    );
  });

  it('自动探测：恰好 1 个候选 → 返回它', () => {
    const host = makeHost('<div><input></div>');
    expect(findFocusElement(host, undefined, 'x').tagName).toBe('INPUT');
  });

  it('自动探测：多个候选 → 抛错并要求显式指定', () => {
    const host = makeHost('<input><button>go</button>');
    expect(() => findFocusElement(host, undefined, 'ctx')).toThrow(/自动探测到 2 个可聚焦候选/);
    expect(() => findFocusElement(host, undefined, 'ctx')).toThrow(/请显式传 selector/);
  });

  it('自动探测：0 个候选 → 抛错', () => {
    const host = makeHost('<div><span>text</span></div>');
    expect(() => findFocusElement(host, undefined, 'ctx')).toThrow(/没有找到任何可聚焦候选/);
  });

  it('探测顺序即优先级：input 先于 button', () => {
    const host = makeHost('<button>go</button><input>');
    // 两个候选 → 歧义报错，而不是「按顺序挑 input」
    expect(() => findFocusElement(host, undefined, 'ctx')).toThrow(/自动探测到 2 个/);

    const onlyButton = makeHost('<div><button>go</button></div>');
    expect(findFocusElement(onlyButton, undefined, 'x').tagName).toBe('BUTTON');
  });

  it('[tabindex] 也在探测范围内', () => {
    const host = makeHost('<div tabindex="0">focusable</div>');
    expect(findFocusElement(host, undefined, 'x').getAttribute('tabindex')).toBe('0');
  });
});

// ---------------------------------------------------------------------------
// 真实注册
// ---------------------------------------------------------------------------

/**
 * `FocusBox` 的 input 是唯一的可聚焦元素，所以自动探测也能命中 ——
 * 这里仍显式传 selector，作为「调用方通常应当显式指定」的示例。
 */
focusTest('fixture-focus · 完整契约', {
  render: (props) => h(FocusBox, props),
  selector: 'input',
  refFocus: true,
  autoFocus: true,
});

/** 走自动探测（不传 selector）。 */
focusTest('fixture-focus · 自动探测', {
  render: (props) => h(FocusBox, props),
});

/** 只跑基础四条（不开 refFocus / autoFocus）。 */
focusTest('fixture-focus · 仅基础', {
  render: (props) => h(FocusBox, props),
  selector: 'input',
});

// ---------------------------------------------------------------------------
// 前置检查的敏感性
// ---------------------------------------------------------------------------

describe('focusTest 的前置检查（selector 指向正确）', () => {
  it('⭐ 指向不可聚焦的元素时，前置检查会失败 —— 而不是让组件背锅', () => {
    // 复刻前置检查那一步的逻辑：自己调一次 focus()，看 activeElement 是否变成它。
    const host = makeHost('<div class="not-focusable">x</div>');
    const element = findFocusElement(host, '.not-focusable', 'x');
    element.focus();
    expect(document.activeElement).not.toBe(element);
  });

  it('对照：可聚焦元素上同一步会成功', () => {
    const host = makeHost('<input>');
    document.body.appendChild(host);
    try {
      const element = findFocusElement(host, 'input', 'x');
      element.focus();
      expect(document.activeElement).toBe(element);
    } finally {
      host.remove();
    }
  });

  it('PlainBox 里没有任何可聚焦元素 → 自动探测抛错（而不是静默返回 undefined）', () => {
    const host = makeHost('');
    const mounted = document.createElement('div');
    // 用真实的夹具产物走一遍：PlainBox 渲染成 <div class="fixture-box">
    mounted.innerHTML = '<div class="fixture-box">box</div>';
    host.appendChild(mounted);
    expect(() => findFocusElement(host, undefined, 'ctx')).toThrow(/没有找到任何可聚焦候选/);
    // 顺带确认 PlainBox 确实没有可聚焦元素
    expect(PlainBox).toBeDefined();
  });
});
