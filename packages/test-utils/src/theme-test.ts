/**
 * `themeTest` —— light / dark / compact / token-override 四态渲染。
 *
 * 本模块是**本项目新增**（上游没有对应物）。上游把主题放在视觉层（`imageTest` 的
 * `themes` 三态截图）与各组件自己的测试里，没有「四态渲染」这一层共享契约。
 *
 * ── 为什么值得单列一层 ────────────────────────────────────────────────────────
 * 主题是**横切**的：任何一个组件忘了消费 token，都只在特定主题下出错。
 * 而 L6 视觉回归跑在真实浏览器里、成本高、覆盖的状态有限。
 * 在 jsdom 里先把「四态都能渲染出来、都不报错、都不告警」拦一遍，
 * 可以把一整类「dark 下炸了」的问题挡在视觉层之前。
 *
 * ── Provider 的嵌套顺序 ───────────────────────────────────────────────────────
 * `ThemeProvider`（`@apollo-design/theme`，L0）在最外层，调用方的 `wrap`
 * （通常是 `ConfigProvider`，ui 层）在**内层** —— 因为 ui 层需要**读** token
 * （算派生 token、按主题切样式），依赖方向是 ui → theme。
 *
 * ── 这个测试没有证明什么（重要，别高估它）──────────────────────────────────────
 *   - **没证明视觉正确**。jsdom 不计算样式；「dark 下颜色对不对」是 L6 与
 *     `packages/theme` 的 L1（与 antd 的 `getDesignToken()` 逐字段比对）的职责。
 *   - **没证明组件真的消费了 token**。一个把颜色写死的组件，在四态下渲染结果
 *     完全一样 —— 本模块抓不到它（`COMPONENT-RULES.md` §5.1 的 H9 由
 *     `styleStatus` / E10 扫描负责）。
 *   - **没证明 CSS 变量被写入**。`ThemeProvider` 的 `injectCssVar` 默认关闭
 *     （写 `document.documentElement` 会跨测试泄漏），所以本模块覆盖的是
 *     「静态 CSS + token 派生」这条路径，不是运行时注入路径。
 */

import {
  compactAlgorithm,
  darkAlgorithm,
  defaultAlgorithm,
  getDesignToken,
  type ThemeConfig,
  ThemeProvider,
} from '@apollo-design/theme';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { assertAllowances } from './allowance';
import { collectCountFailures, collectRenderCases, mountCase } from './render';
import type { RenderSource, WarningAllowance } from './types';
import { assertNoUnexpectedWarnings, captureWarnings } from './warnings';

/** 四个主题态。 */
export type ThemeVariant = 'light' | 'dark' | 'compact' | 'token-override';

/**
 * `token-override` 态覆盖的 Seed Token 形状。
 *
 * 直接取 `ThemeConfig['token']`，**不自己写 `Record<string, unknown>`** ——
 * 后者会让 `configFor` 的返回值不再是合法的 `ThemeConfig`，
 * 而类型错误会出现在调用处而不是定义处（实测踩过）。
 */
export type ThemeTokenOverride = NonNullable<ThemeConfig['token']>;

/** 默认跑全部四态，顺序固定（报告可读）。 */
const ALL_VARIANTS: readonly ThemeVariant[] = ['light', 'dark', 'compact', 'token-override'];

/**
 * `token-override` 态覆盖的 Seed Token。
 *
 * 选这三个的理由：它们**分别**影响颜色、圆角、尺寸三条派生链 ——
 * 只覆盖一个颜色 token 无法证明「覆盖链路是通的」。
 * 具体取值不重要（本模块不断言视觉），重要的是「与默认值不同」。
 */
const DEFAULT_TOKEN_OVERRIDE: ThemeTokenOverride = {
  colorPrimary: '#eb2f96',
  borderRadius: 2,
  controlHeight: 40,
};

export interface ThemeTestOptions extends RenderSource {
  /** 期望的 demo 条数。语义同 `demoTest` 的 `expectCount`。 */
  expectCount?: number;
  /** 只跑这些态。默认四态全跑。 */
  variants?: readonly ThemeVariant[];
  /** `token-override` 态覆盖的 Seed Token。 */
  token?: ThemeTokenOverride;
  /** 允许的告警。必须带 `reason`。 */
  allow?: readonly WarningAllowance[];
}

/** 把态名翻译成 `ThemeConfig`。**纯函数**，便于单测。 */
export function configFor(variant: ThemeVariant, token: ThemeTokenOverride): ThemeConfig {
  switch (variant) {
    case 'light':
      return { algorithm: defaultAlgorithm };
    case 'dark':
      return { algorithm: darkAlgorithm };
    case 'compact':
      return { algorithm: compactAlgorithm };
    case 'token-override':
      return { algorithm: defaultAlgorithm, token };
    default: {
      // 穷举保护：新增态而忘记在这里接线时，TypeScript 会在上一行报错；
      // 若有人用字符串绕过类型，这里会明确失败而不是静默跑一个空配置。
      const unreachable: never = variant;
      throw new Error(`[test-utils] themeTest：未知的主题态 ${String(unreachable)}`);
    }
  }
}

/**
 * 计算各态的 token 指纹（完整派生结果的 JSON）。
 *
 * 用途是**反空转**：如果四个态其实产出了同一份 token，那么「四态都渲染通过」
 * 只证明了「同一件事做了四遍」。把指纹集合的大小与态数比对，这件事变成可证伪的。
 *
 * 用完整 token 而不是挑几个字段：挑字段等于把「哪些字段算不同」写死，
 * 而 `@apollo-design/theme` 的派生链改动后，写死的字段可能恰好没变。
 */
export function themeFingerprints(
  variants: readonly ThemeVariant[],
  token: ThemeTokenOverride,
): string[] {
  return variants.map((variant) => JSON.stringify(getDesignToken(configFor(variant, token))));
}

export function themeTest(name: string, options: ThemeTestOptions): void {
  const context = `themeTest('${name}')`;
  const cases = collectRenderCases(options, context);
  const variants = options.variants ?? ALL_VARIANTS;
  const tokenOverride = options.token ?? DEFAULT_TOKEN_OVERRIDE;
  // ⚠️ 与 demoTest / a11yDemoTest / rtlTest 一致：结构错误在**收集阶段**抛出（快速失败）。
  assertAllowances(options.allow ?? [], context);

  describe(`${name} · theme`, () => {
    it('四态的 ThemeConfig 互不相同（防「测了四遍同一个态」）', () => {
      expect(new Set(themeFingerprints(variants, tokenOverride)).size).toBe(variants.length);
    });

    if (options.expectCount !== undefined) {
      const expected = options.expectCount;
      it(`demo 条数等于 expectCount（${expected}）`, () => {
        expect(collectCountFailures(cases.length, expected, 'demo 条数')).toEqual([]);
      });
    }

    for (const variant of variants) {
      it(`${variant} 态下渲染`, async () => {
        const config = configFor(variant, tokenOverride);
        const capture = captureWarnings();

        try {
          for (const testCase of cases) {
            const mounted = mountCase(testCase.render, {
              ...(options.global ? { global: options.global } : {}),
              // ThemeProvider 在**外**，调用方的 wrap 在**内**（见文件头）。
              wrap: (slot) =>
                h(
                  ThemeProvider,
                  { theme: config },
                  {
                    default: () => (options.wrap === undefined ? slot() : options.wrap(slot)),
                  },
                ),
            });
            try {
              await mounted.update();
            } finally {
              mounted.destroy();
            }
          }
        } finally {
          capture.restore();
        }

        assertNoUnexpectedWarnings(capture.records, options.allow, `${context} → ${variant}`);
      });
    }
  });
}

/**
 * 同时提供默认导出 —— 上游 antd 的 `tests/shared/*` 用的是默认导出，
 * 保留它可以让「从 antd 迁移」时按原样 `import themeTest from "…"` 继续工作。
 */
export default themeTest;
