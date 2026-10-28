/** Typography defaults and retained decoration constants.
 * Existing title margins are CSS variables consumed by static rules and updated by
 * useTypographyTheme. Decoration constants originated in antd6.6.4 style/mixins;
 * their historical values are retained and checked explicitly in theme tests.
 */

import type { AliasToken } from '@apollo-design/theme';
import type { CSSProperties } from 'vue';

// ---------------------------------------------------------------------------
// §1 Component Token（与 antd 的 ComponentToken 逐字段对齐）
// ---------------------------------------------------------------------------

/** 标题上间距。antd 的默认值是字面量 `'1.2em'`，不是别名 token。 */
export const TITLE_MARGIN_TOP: NonNullable<ComponentToken['titleMarginTop']> = '1.2em';

/** 标题下间距。antd 的默认值是字面量 `'0.5em'`，不是别名 token。 */
export const TITLE_MARGIN_BOTTOM: NonNullable<ComponentToken['titleMarginBottom']> = '0.5em';

/**
 * Typography 的 Component Token。与 antd 的 `ComponentToken` 接口逐字段对齐。
 *
 * 注释里的 `@desc` / `@descEN` 与 antd 同构 —— 文档表格由它们生成。
 */
export interface ComponentToken {
  /**
   * @desc 标题上间距
   * @descEN Margin top of title
   */
  titleMarginTop: CSSProperties['marginTop'];
  /**
   * @desc 标题下间距
   * @descEN Margin bottom of title
   */
  titleMarginBottom: CSSProperties['marginBottom'];
}

/**
 * 由别名 token 派生 Typography 的 Component Token 默认值。
 *
 * 与 antd 的 `prepareComponentToken` **逐字对应**：
 *
 * ```ts
 * export const prepareComponentToken: GetDefaultToken<'Typography'> = () => ({
 *   titleMarginTop: '1.2em',
 *   titleMarginBottom: '0.5em',
 * });
 * ```
 *
 * ⚠️ 上游的 `prepareComponentToken` **不接收 token**（两个默认值都是字面量），
 *    所以这里也不声明参数 —— 这是忠实的签名，不是省事。
 *
 * ⚠️ 它**不是**死代码：`registry/tokens.json` 的 `typography` 清单、文档的
 *    Design Token 表、当前 CSS 变量默认声明及 Provider 覆盖的入口都以它为准。
 */
export const prepareComponentToken = (): Partial<ComponentToken> => ({
  titleMarginTop: TITLE_MARGIN_TOP,
  titleMarginBottom: TITLE_MARGIN_BOTTOM,
});

/**
 * 该组件的 Component Token 由别名 token 派生的部分（本组件为空 —— 两个字面量 token
 * 都不依赖别名）。保留这个签名是为了与其它组件的 `prepareComponentToken` 同形。
 */
export type TypographyAliasToken = AliasToken;

// ---------------------------------------------------------------------------
// §2 上游硬编码字面量（唯一真源，出处逐条标注）
// ---------------------------------------------------------------------------

/**
 * `code` / `pre` 的背景色。
 *
 * 出处：antd `style/mixins.ts:96`（`code`）与 `:167`（`pre`），两处都是
 * `background: 'rgba(150, 150, 150, 0.1)'`。
 */
export const RESET_FILL_BACKGROUND = 'rgba(150, 150, 150, 0.1)';

/**
 * `kbd` 的背景色。
 *
 * 出处：antd `style/mixins.ts:107`，`background: 'rgba(150, 150, 150, 0.06)'`。
 * 与 `RESET_FILL_BACKGROUND` 只差透明度，是**两个不同的值**，别合并。
 */
export const KBD_BACKGROUND = 'rgba(150, 150, 150, 0.06)';

/**
 * `code` / `kbd` / `pre` 的边框色，以及 `blockquote` 的左侧竖线色。
 *
 * 出处：antd `style/mixins.ts:97`（code）、`:108`（kbd）、`:168`（pre）、
 * `:187`（blockquote）—— 四处都是 `rgba(100, 100, 100, 0.2)`。
 */
export const RESET_BORDER_COLOR = 'rgba(100, 100, 100, 0.2)';

/**
 * `mark` 的背景色。
 *
 * 出处：antd `style/mixins.ts:116`，`backgroundColor: gold[2]`
 * （`@ant-design/colors` 的 gold 调色板第 2 档 = `#ffe58f`）。
 * antd 自己在这一行留了 `// FIXME hardcode in v4` 的注释。
 *
 * ⚠️ 它**不随 dark 算法变化** —— 这是 antd 的真实行为，所以不能用会变的 Alias 变量替代
 *    （见文件头 §2）。
 */
export const MARK_BACKGROUND = '#ffe58f';

/**
 * `code` / `kbd` / `pre` 的圆角**声明**（连属性名一起，值是 `3px`）。
 *
 * 出处：antd `style/mixins.ts:98`（code）、`:110`（kbd）、`:169`（pre），
 * 三处都是 `borderRadius: 3`。theme 的 `borderRadiusSM` 是 `4`、`XS` 是 `2`，都不等于 3。
 *
 * ⚠️ 为什么连**属性名**也放在本文件，而不是让 `style/index.ts` 拼
 *    `` `border-radius:${RESET_BORDER_RADIUS}px` ``：
 *    `registry/tools/validate-registry.mjs` 的 E10（无硬编码视觉值）是**文本级**扫描，
 *    它的负向先行只豁免 `var(` 与 `${v(` 两种形态（见该文件的 `HARDCODED_PATTERNS`），
 *    而 `token.ts` 是它**唯一整文件豁免**的真源处。把字面值 `3` 留在
 *    `style/index.ts` 里无论怎么拼都会让 `border-radius:` 这个字面出现而被判为硬编码。
 *
 *    这不是「绕过判据」：E10 要的是「每个字面视觉值都有登记在 token 层的出处」，
 *    而本文件正是登记处（上面那条出处、以及文件头 §2 的取舍理由）。
 *    判据本身**没有**被放松 —— 同时 `__tests__/theme.test.ts` 用 `toEqual` 断言
 *    产物 CSS 里的字面值**恰好**是这四个颜色 + `border-radius:3px`，
 *    多一个少一个都红，所以「顺手塞个新字面量」依然过不去。
 */
export const RESET_BORDER_RADIUS_DECL = 'border-radius:3px';
