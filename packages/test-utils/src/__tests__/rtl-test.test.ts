/**
 * `rtl-test.ts` 的契约测试。
 *
 * 重点：**默认断言必须真的有分辨力**。
 * 夹具 `RtlBox` 的静态类名刻意不以 `-rtl` 结尾 —— 否则「存在任一以 `-rtl`
 * 结尾的类名」这条断言在 ltr 下也恒真，整个模块就退化成「永远绿」。
 */

import { describe, expect, it } from 'vitest';
import { h } from 'vue';

import { AllowanceError } from '../allowance';
import { mountCase } from '../render';
import { collectRtlClassFailures, hasRtlClass, rtlTest } from '../rtl-test';
import { demoKey, demoModules, FixtureDirectionProvider, RtlBox, RtlBoxNoMark } from './fixture';

/** 真实的 RTL 上下文由调用方注入（`ConfigProvider` 尚未实现，见 F5）。 */
const rtlWrap = (slot: () => unknown) =>
  h(FixtureDirectionProvider, { direction: 'rtl' }, { default: () => slot() as never });

/** 收集一棵子树里的全部类名 token（与 rtl-test.ts 内部实现同语义，测试里重写一遍以便断言）。 */
function collectClasses(root: HTMLElement): string[] {
  const tokens = new Set<string>();
  for (const element of Array.from(root.querySelectorAll('*'))) {
    for (const token of Array.from(element.classList)) tokens.add(token);
  }
  return [...tokens].sort();
}

describe('hasRtlClass（纯函数）', () => {
  it('未指定期望类名时：存在任一以 `-rtl` 结尾的 token 即可', () => {
    expect(hasRtlClass(['btn', 'btn-rtl'], undefined)).toBe(true);
    // 后缀形态不统一（实测 7 种），所以只认后缀
    expect(hasRtlClass(['btn-wrapper-rtl'], undefined)).toBe(true);
    expect(hasRtlClass(['btn-compact-item-rtl'], undefined)).toBe(true);
  });

  it('未指定期望类名时：没有 `-rtl` 后缀 → false', () => {
    expect(hasRtlClass(['btn', 'btn-lg'], undefined)).toBe(false);
    expect(hasRtlClass([], undefined)).toBe(false);
  });

  it('指定了期望类名时：精确匹配（不做后缀猜测）', () => {
    expect(hasRtlClass(['btn-rtl'], 'btn-rtl')).toBe(true);
    expect(hasRtlClass(['btn-wrapper-rtl'], 'btn-rtl')).toBe(false);
  });

  it('⚠️ `-rtl` 必须出现在**结尾**（`btn-rtl-x` 不算）', () => {
    expect(hasRtlClass(['btn-rtl-x'], undefined)).toBe(false);
  });
});

describe('collectRtlClassFailures（纯函数）', () => {
  it('通过时为空数组', () => {
    expect(collectRtlClassFailures(['btn-rtl'], undefined)).toEqual([]);
    expect(collectRtlClassFailures(['btn-rtl'], 'btn-rtl')).toEqual([]);
  });

  it('默认档失败：给出「怎么显式声明跳过」的指引', () => {
    expect(collectRtlClassFailures(['btn'], undefined)).toEqual([
      '渲染树里没有任何以 `-rtl` 结尾的类名。' +
        '若组件确实不产出 RTL 标记类，请传 allowMissingRtlClass: { reason } 显式声明。',
      '实际类名：btn',
    ]);
  });

  it('精确档失败：指出缺的是哪个类名', () => {
    expect(collectRtlClassFailures(['btn', 'btn-wrapper-rtl'], 'btn-rtl')).toEqual([
      '渲染树里没有类名 "btn-rtl"。',
      '实际类名：btn btn-wrapper-rtl',
    ]);
  });
});

describe('rtlTest · 结构校验（收集阶段抛出）', () => {
  it('allowMissingRtlClass 缺 reason → AllowanceError（不允许沉默的跳过）', () => {
    expect(() =>
      rtlTest('x', {
        render: () => h(RtlBox),
        allowMissingRtlClass: { reason: '' },
      }),
    ).toThrow(AllowanceError);
  });

  it('既没 demos 也没 render → 抛错', () => {
    expect(() => rtlTest('x', {})).toThrow(/必须提供 demos 或 render/);
  });
});

// ---------------------------------------------------------------------------
// 真实注册
// ---------------------------------------------------------------------------

/** 正确实现：RTL 上下文 + 组件打标记类 → 通过。 */
rtlTest('fixture-rtl · 正确实现', {
  render: () => h(RtlBox),
  wrap: rtlWrap,
});

/** 精确锁定类名。 */
rtlTest('fixture-rtl · 精确锁定', {
  render: () => h(RtlBox),
  wrap: rtlWrap,
  rtlClass: 'fixture-dir-rtl',
});

/** 有意不产出标记类 → 显式声明后跳过该类断言。 */
rtlTest('fixture-rtl · 显式声明不产出', {
  render: () => h(RtlBoxNoMark),
  wrap: rtlWrap,
  allowMissingRtlClass: {
    reason: '夹具 FixtureRtlBoxNoMark 的存在意义就是「不产出 RTL 标记类」，用于验证这个跳过入口',
  },
});

/** 多 demo 遍历 + expectCount。 */
rtlTest('fixture-rtl · demos', {
  demos: demoModules({ [demoKey('a')]: RtlBox, [demoKey('b')]: RtlBox }),
  wrap: rtlWrap,
  expectCount: 2,
});

// ---------------------------------------------------------------------------
// 敏感性：证明默认断言不是「永远绿」
// ---------------------------------------------------------------------------

describe('rtlTest 的敏感性（证明默认断言有分辨力）', () => {
  it('⭐ 不给 RTL 上下文时，夹具不产出 `-rtl` 类 —— 默认断言会失败', async () => {
    // 这是「夹具静态类名不以 -rtl 结尾」这个设计的直接验证。
    const mounted = mountCase(() => h(RtlBox));
    try {
      const classes = collectClasses(mounted.content);
      expect(classes).toContain('fixture-dir');
      expect(collectRtlClassFailures(classes, undefined).length).toBeGreaterThan(0);
    } finally {
      mounted.destroy();
    }
  });

  it('给了 RTL 上下文后同一份断言通过', async () => {
    const mounted = mountCase(() => h(RtlBox), { wrap: rtlWrap as never });
    try {
      const classes = collectClasses(mounted.content);
      expect(classes).toContain('fixture-dir-rtl');
      expect(collectRtlClassFailures(classes, undefined)).toEqual([]);
    } finally {
      mounted.destroy();
    }
  });
});
