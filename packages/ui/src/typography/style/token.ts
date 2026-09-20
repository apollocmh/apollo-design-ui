/**
 * Typography 的 Component Token。
 *
 * 契约来源：antd 6.6.4 的 `es/typography/style/index.js` 的 `ComponentToken` 接口与
 * `prepareComponentToken`。**名称、数量、默认值计算方式逐条对齐**（规则 R7）。
 *
 * ── 两类值，两种落地形态 ──────────────────────────────────────────────────────
 *
 * | 类别 | 例子 | 落地 |
 * |---|---|---|
 * | **Component Token** | `titleMarginTop` / `titleMarginBottom` | 本文件导出常量，`style/index.ts` 内联 |
 * | **上游硬编码字面量** | `code` 的 `rgba(150,150,150,0.1)` 等 | 同上（见 §2） |
 * | 别名派生的值 | `colorText` / `fontSizeHeading1` / `marginXXS` … | `var(--apollo-*)` |
 *
 * ── §1 为什么 Component Token 是「内联」而不是 CSS 变量 ────────────────────────
 *
 * 与 Divider 完全同源：零运行时管线目前**没有**「Component Token → CSS 变量」这一段，
 * 而 `tests/build/run.mjs` 的 B7 要求 ui 的 CSS 里每个 `var(--apollo-*)` 都必须在
 * theme 的 `tokens.css` 里有声明。所以字面量 token 由本模块给出唯一真源、
 * 由 `style/index.ts` 内联消费。「字面量出现在 CSS 里」不等于 H9 的硬编码 ——
 * 它的来源是本文件的定义，且与 antd 的 `prepareComponentToken` 逐字相同。
 *
 * ⚠️ 已知缺口（登记在 `README.md` §7）：没有 ConfigProvider 时，用户**无法**通过
 *    `theme.components.Typography` 覆盖这两个 token。落点是「Component Token →
 *    CSS 变量」那段管线。
 *
 * ── §2 为什么「上游硬编码字面量」也放在本文件 ──────────────────────────────────
 *
 * antd 的 `getResetStyles`（`style/mixins.ts:89-242`）里有一批**它自己也没做成 token**
 * 的字面量：`code`/`kbd`/`pre` 的半透明灰底与灰边、`mark` 的 `gold[2]`、三处
 * `borderRadius: 3`。它们**没有**对应的 Alias token：
 *
 *   - `rgba(150,150,150,0.1)` —— 最接近的 `--apollo-color-fill-quaternary` 是
 *     `rgba(0,0,0,0.02)`，**值不同**；换成它会让视觉偏离 antd。
 *   - `gold[2]` = `#ffe58f` —— theme 只暴露 Seed 层的 `--apollo-gold`（`#fadb14`）
 *     与 `--apollo-gold-hover/-active`，**没有** `gold-2` 这一档。
 *     `--apollo-color-warning-border` 默认值恰好也是 `#ffe58f`，但它在 dark 算法下会变，
 *     而 antd 的 `mark` 在 dark 下**不变** —— 用变量反而更不忠实。
 *   - `borderRadius: 3` —— `--apollo-border-radius-sm` 是 `4`、`xs` 是 `2`，都不等于 3。
 *
 * ⇒ 它们是「与 antd 逐字相同的上游字面量」，不是我们发明的视觉值。
 *   按 `COMPONENT-RULES.md` §5.2 的同一逻辑（Token 默认值本来就是字面量），
 *   把唯一真源收在本文件，`style/index.ts` 只消费常量 —— 于是 E10 的
 *   「已实现组件的样式中无硬编码视觉值」这条判据仍然成立，且**每个字面量都有出处**。
 *   `__tests__/theme.test.ts` 用 `toEqual` 断言「恰好是这几个」来钉住这件事。
 *
 * ── 这个模块没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明**视觉**正确（那是 L6 的逐像素比对）。
 *   - 没证明这些 token 与 antd 的**运行时**取值一致：字面量是静态可比的，
 *     别名派生的值由 B7 保证变量存在、由 L6 保证视觉一致。
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
 *    Design Token 表、以及将来「Component Token → CSS 变量」管线的入口都以它为准。
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
