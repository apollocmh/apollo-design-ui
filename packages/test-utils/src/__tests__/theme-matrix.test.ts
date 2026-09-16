/**
 * `theme-test.ts` 的契约测试。
 *
 * ⚠️ 文件名**刻意不叫** `theme.test.ts` —— `vitest.config.ts` 按文件名分 project，
 *    `theme.test.ts` 属于 `theme` project，本包的测试属于 `unit`。
 *
 * 覆盖：
 *   1. `configFor` 的四态映射 + `never` 穷举保护
 *   2. `themeFingerprints` 的**反空转**性质：四态 token 必须互不相同
 *   3. 真实注册：四态渲染不报错、不告警；`variants` / `token` 定制
 */

import {
  compactAlgorithm,
  darkAlgorithm,
  defaultAlgorithm,
  getDesignToken,
} from '@apollo-design/theme';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';

import { AllowanceError } from '../allowance';
import { configFor, type ThemeVariant, themeFingerprints, themeTest } from '../theme-test';
import { ThemeProbeBox } from './fixture';

const TOKEN = { colorPrimary: '#eb2f96', borderRadius: 2, controlHeight: 40 } as const;

const ALL: readonly ThemeVariant[] = ['light', 'dark', 'compact', 'token-override'];

describe('configFor（纯函数）', () => {
  it('light / dark / compact 各自映射到对应的算法', () => {
    expect(configFor('light', TOKEN).algorithm).toBe(defaultAlgorithm);
    expect(configFor('dark', TOKEN).algorithm).toBe(darkAlgorithm);
    expect(configFor('compact', TOKEN).algorithm).toBe(compactAlgorithm);
  });

  it('token-override 用默认算法 + 覆盖 token', () => {
    const config = configFor('token-override', TOKEN);
    expect(config.algorithm).toBe(defaultAlgorithm);
    expect(config.token).toBe(TOKEN);
  });

  it('light / dark / compact 不携带 token 覆盖（避免「态」与「覆盖」混淆）', () => {
    expect(configFor('light', TOKEN).token).toBeUndefined();
    expect(configFor('dark', TOKEN).token).toBeUndefined();
    expect(configFor('compact', TOKEN).token).toBeUndefined();
  });

  it('⭐ 未知态走 never 穷举保护 —— 明确失败而不是静默跑一个空配置', () => {
    expect(() => configFor('nope' as unknown as ThemeVariant, TOKEN)).toThrow(/未知的主题态 nope/);
  });
});

describe('themeFingerprints（反空转）', () => {
  it('⭐ 四态产出的 token 指纹互不相同', () => {
    // 如果四态其实产出同一份 token，那「四态都渲染通过」只证明「同一件事做了四遍」。
    const fingerprints = themeFingerprints(ALL, TOKEN);
    expect(fingerprints).toHaveLength(4);
    expect(new Set(fingerprints).size).toBe(4);
  });

  it('指纹是完整 token 的 JSON（不是挑几个字段）', () => {
    const [fingerprint] = themeFingerprints(['light'], TOKEN);
    const parsed = JSON.parse(fingerprint as string) as Record<string, unknown>;
    const token = getDesignToken(configFor('light', TOKEN));
    expect(Object.keys(parsed).sort()).toEqual(Object.keys(token).sort());
  });

  it('同一态两次调用得到同一指纹（确定性）', () => {
    expect(themeFingerprints(['dark'], TOKEN)).toEqual(themeFingerprints(['dark'], TOKEN));
  });

  it('token-override 换一个 token 值 → 指纹随之变化（覆盖链路真的通）', () => {
    const a = themeFingerprints(['token-override'], { colorPrimary: '#eb2f96' });
    const b = themeFingerprints(['token-override'], { colorPrimary: '#000000' });
    expect(a).not.toEqual(b);
  });

  it('单态时 Set 大小恒为 1（不误报）', () => {
    expect(new Set(themeFingerprints(['light'], TOKEN)).size).toBe(1);
  });
});

describe('themeTest · 结构校验（收集阶段抛出）', () => {
  it('allow 缺 reason → AllowanceError', () => {
    expect(() =>
      themeTest('x', { render: () => h(ThemeProbeBox), allow: [{ match: 'x', reason: '' }] }),
    ).toThrow(AllowanceError);
  });

  it('既没 demos 也没 render → 抛错', () => {
    expect(() => themeTest('x', {})).toThrow(/必须提供 demos 或 render/);
  });
});

// ---------------------------------------------------------------------------
// 真实注册
// ---------------------------------------------------------------------------

/** 四态全跑（默认）。 */
themeTest('fixture-theme · 四态', {
  render: () => h(ThemeProbeBox),
});

/** 只跑两态。 */
themeTest('fixture-theme · 只跑 light/dark', {
  render: () => h(ThemeProbeBox),
  variants: ['light', 'dark'],
});

/** 自定义 token-override。 */
themeTest('fixture-theme · 自定义 token', {
  render: () => h(ThemeProbeBox),
  variants: ['token-override'],
  token: { colorPrimary: '#000000', borderRadius: 8 },
});

/**
 * 带上调用方的 `wrap`（真实项目里是 `ConfigProvider`）——
 * 断言「ThemeProvider 在外、wrap 在内」的嵌套顺序能正常工作。
 */
themeTest('fixture-theme · 带 wrap', {
  render: () => h(ThemeProbeBox),
  variants: ['light'],
  wrap: (slot) => h('section', { class: 'theme-inner-wrap' }, [slot() as never]),
});
