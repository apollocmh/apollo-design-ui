/**
 * Skeleton 的 Component Token。
 *
 * 契约来源：antd 6.6.4 的 `es/skeleton/style/index.js` 的 `ComponentToken` 接口与
 * `prepareComponentToken`。**名称、数量、默认值计算方式逐条对齐**（规则 R7）——
 * 这是「用户能无缝迁移自定义主题」的前提。
 *
 * ── 八个 token 与它们的落地形态 ────────────────────────────────────────────────
 *
 * | token | antd 默认值 | 我们的落地 |
 * |---|---|---|
 * | `color`（废弃） | `colorFillContent` | `var(--apollo-color-fill-content)` |
 * | `colorGradientEnd`（废弃） | `colorFill` | `var(--apollo-color-fill)` |
 * | `gradientFromColor` | `colorFillContent` | `var(--apollo-color-fill-content)` |
 * | `gradientToColor` | `colorFill` | `var(--apollo-color-fill)` |
 * | `titleHeight` | `controlHeight / 2` | `calc(var(--apollo-control-height) / 2)` |
 * | `blockRadius` | `borderRadiusSM` | `var(--apollo-border-radius-sm)` |
 * | `paragraphMarginTop` | `marginLG + marginXXS` | `calc(var(--apollo-margin-lg) + var(--apollo-margin-xxs))` |
 * | `paragraphLiHeight` | `controlHeight / 2` | `calc(var(--apollo-control-height) / 2)` |
 *
 * 全部走别名 token 的 `var(--apollo-*)`（`tests/build/run.mjs` 的 B7 可校验、
 * 且随主题自适应），**没有**「字面量内联」的情形 —— 与 divider 的三 token 不同。
 *
 * ── 为什么还要额外导出四个「字面量常量」 ──────────────────────────────────────
 *
 * 除了上面八个 Component Token，antd 在 `mergeToken` 里还塞了四个**字面量**，
 * 它们**不是** Component Token（不在 `ComponentToken` 接口里、用户无法覆盖）：
 *
 * | antd 的字面量 | 值 | 我们的常量 |
 * |---|---|---|
 * | `borderRadius` | `100`（注释：`Large number to make capsule shape`） | `CAPSULE_RADIUS_DECL` |
 * | `skeletonLoadingMotionDuration` | `'1.4s'` | `LOADING_MOTION_DURATION` |
 * | `imageSizeBase` | `calc(controlHeight).mul(1.5)` | 由 `style/index.ts` 从 `var()` 组合 |
 * | `skeletonImageCls-path` 的 `fill` | `'#bfbfbf'` | `IMAGE_PATH_FILL_DECL` |
 *
 * 前两个 + `fill` 是**字面量**：antd 没有为它们提供 token，所以用户也无法覆盖。
 * 我们的零运行时管线里，`style/index.ts` 只能拼字符串 —— 于是
 * `registry/tools/validate-registry.mjs` 的 **E10**（无硬编码视觉值）会把
 * `border-radius:50%` / `border-radius:100px` / `fill:#bfbfbf` 判为硬编码。
 *
 * ⭐ 处理方式与 typography 的 `RESET_BORDER_RADIUS_DECL` 完全同形：
 *    **把字面量声明收敛到本文件（E10 对 `token.ts` 豁免）**，由 `style/index.ts`
 *    消费。这样「字面量出现在 CSS 里」不等于 H9 的硬编码 —— 它的唯一真源是本文件，
 *    而且与 antd 的 `mergeToken` 逐字相同。
 *
 * ⚠️ 已知缺口（登记在 `README.md` §6）：没有 ConfigProvider 时，用户**无法**通过
 *    `theme.components.Skeleton` 覆盖这几个字面量 —— 它们在 antd 里同样不可覆盖，
 *    所以这不是退化，但「Component Token → CSS 变量」那段管线落地后，
 *    前八个 token 应当能从 ConfigProvider 覆盖。
 *
 * ── 这个模块没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明**视觉**正确（那是 L6 的逐像素比对）。
 *   - 没证明变量名存在：`var(--apollo-*)` 写错不会报错、只会静默失效 ——
 *     由 `tests/build/run.mjs` 的 B7 校验。
 *   - 没证明 `titleHeight` 的**数值**与 antd 一致：我们输出的是 `calc(var(...) / 2)`
 *     而 antd 的 cssVar 模式同样如此（非 cssVar 模式输出 `16px`）。数值一致由
 *     `theme.test.ts` 对「选择器 + 声明存在」的断言 + L6 的像素比对共同保证。
 */

import type { AliasToken } from '@apollo-design/theme';
import type { CSSProperties } from 'vue';

/**
 * 胶囊圆角声明。
 *
 * antd 的 `mergeToken` 里是 `borderRadius: 100`（注释：`Large number to make capsule shape`），
 * 消费点是 `&-round ${componentCls}-section { title, paragraph > li { borderRadius } }`。
 * 不是 Component Token —— 用户无法覆盖，我们也不提供覆盖入口。
 */
export const CAPSULE_RADIUS_DECL = 'border-radius:100px';

/**
 * 正圆声明。
 *
 * 四个消费点（antd 源码逐字对应）：
 *   - `.{cls}-header .{cls}-avatar-circle`（Skeleton 内部的头像）
 *   - `.{cls}-avatar.{cls}-avatar-circle`（`Skeleton.Avatar` 的 `shape="circle"`）
 *   - `.{cls}-image.{cls}-image-circle`
 *   - `.{cls}-image-svg.{cls}-image-svg-circle`
 *
 * 它**不是** `border-radius:50%` 这个「设计值」没有 token，而是 antd 就写死了
 * `borderRadius: '50%'` —— 没有对应的别名 token 可派。
 */
export const CIRCLE_RADIUS_DECL = 'border-radius:50%';

/**
 * `Skeleton.Image` 里那幅占位图 `<path>` 的填充色声明。
 *
 * antd 的 `genSkeletonElementImage` 里是 `fill: '#bfbfbf'`（字面量，无 token）。
 * `#bfbfbf` 是 antd 灰阶的第 6 级，别名 token 里**没有**等价值
 * （`colorFill` 是 `rgba(0,0,0,0.15)`、`colorBorder` 是 `#d9d9d9`、
 * `colorTextPlaceholder` 是 `rgba(0,0,0,0.25)`）—— 所以只能作为字面量登记。
 */
export const IMAGE_PATH_FILL_DECL = 'fill:#bfbfbf';

/**
 * 微光动画的时长。
 *
 * antd 的 `mergeToken` 里是 `skeletonLoadingMotionDuration: '1.4s'`（字面量）。
 * ⚠️ 它**不**走 theme 的 `motionDuration*`（那套是 0.1s～0.3s，语义是过渡而非循环动画）。
 */
export const LOADING_MOTION_DURATION = '1.4s';

/**
 * 微光渐变的色标位置。
 *
 * antd：`linear-gradient(90deg, ${gradientFromColor} 25%, ${gradientToColor} 37%, ${gradientFromColor} 63%)`
 * 与 `backgroundSize: '400% 100%'`。三个百分比是**几何**不是颜色，不进 token。
 */
export const LOADING_GRADIENT_STOPS = { from: '25%', to: '37%', back: '63%' } as const;

/** 渐变背景的铺开尺寸。antd 的 `backgroundSize: '400% 100%'`。 */
export const LOADING_BACKGROUND_SIZE = '400% 100%';

/**
 * 关键帧的起止位置。antd：
 * `new Keyframes('ant-skeleton-loading', { '0%': { backgroundPosition: '100% 50%' }, '100%': { backgroundPosition: '0 50%' } })`。
 *
 * ⚠️ `100%` 那一帧的值是 `'0 50%'`（**不带单位**的 `0`），不是 `'0% 50%'` —— 逐字保留。
 */
export const LOADING_KEYFRAME_FROM = '100% 50%';
export const LOADING_KEYFRAME_TO = '0 50%';

/**
 * `imageSizeBase` 的系数。antd：`calc(token.controlHeight).mul(1.5)`。
 *
 * 消费点：`{cls}-node` / `{cls}-image` 的宽高（`imageSizeBase * 2`）与
 * `{cls}-image-svg` 的宽高（`imageSizeBase`）与 `maxWidth/maxHeight`（`imageSizeBase * 4`）。
 */
export const IMAGE_SIZE_BASE_MULTIPLIER = 1.5;

/** `Skeleton.Button` 的宽度/最小宽度系数。antd：`calc(controlHeight).mul(2)`。 */
export const BUTTON_WIDTH_MULTIPLIER = 2;

/** `Skeleton.Input` 的宽度/最小宽度系数。antd：`calc(controlHeight).mul(5)`。 */
export const INPUT_WIDTH_MULTIPLIER = 5;

/**
 * Skeleton 的 Component Token。与 antd 的 `ComponentToken` 接口逐字段对齐。
 *
 * 注释里的 `@desc` / `@descEN` 与 antd 同构 —— 文档表格由它们生成。
 */
export interface ComponentToken {
  /**
   * @desc 骨架屏渐变色起点颜色
   * @descEN Start color of skeleton gradient
   * @deprecated use `gradientFromColor` instead.
   */
  color: string;
  /**
   * @desc 骨架屏渐变色终点颜色
   * @descEN End color of skeleton gradient
   * @deprecated use `gradientToColor` instead.
   */
  colorGradientEnd: string;
  /**
   * @desc 渐变色起点颜色
   * @descEN Start color of gradient
   */
  gradientFromColor: string;
  /**
   * @desc 渐变色终点颜色
   * @descEN End color of gradient
   */
  gradientToColor: string;
  /**
   * @desc 标题骨架屏高度
   * @descEN Height of title skeleton
   */
  titleHeight: number | string;
  /**
   * @desc 骨架屏圆角
   * @descEN Border radius of skeleton
   */
  blockRadius: number;
  /**
   * @desc 段落骨架屏上间距
   * @descEN Margin top of paragraph skeleton
   */
  paragraphMarginTop: number;
  /**
   * @desc 段落骨架屏单行高度
   * @descEN Line height of paragraph skeleton
   */
  paragraphLiHeight: number;
}

/**
 * 由别名 token 派生 Skeleton 的 Component Token 默认值。
 *
 * 与 antd 的 `prepareComponentToken` **逐条对应**：
 *
 * ```ts
 * export const prepareComponentToken = (token) => {
 *   const { colorFillContent, colorFill } = token;
 *   const gradientFromColor = colorFillContent;
 *   const gradientToColor = colorFill;
 *   return {
 *     color: gradientFromColor,
 *     colorGradientEnd: gradientToColor,
 *     gradientFromColor,
 *     gradientToColor,
 *     titleHeight: token.controlHeight / 2,
 *     blockRadius: token.borderRadiusSM,
 *     paragraphMarginTop: token.marginLG + token.marginXXS,
 *     paragraphLiHeight: token.controlHeight / 2,
 *   };
 * };
 * ```
 *
 * ⚠️ `color` / `colorGradientEnd` 是**废弃别名**（antd 的
 *    `deprecatedTokens: [['color','gradientFromColor'], ['colorGradientEnd','gradientToColor']]`），
 *    但仍**必须保留**：存量主题配置在写它们，且它们参与「旧值 → 新值」的迁移告警。
 *
 * ⚠️ 它**不是**死代码：`registry/tokens.json` 的 `skeleton` 清单、文档的 Design Token 表、
 *    以及将来「Component Token → CSS 变量」管线的入口都以它为准。
 *    `style/index.ts` 消费的是同一组默认值（别名走 `var()`、字面量走常量）。
 */
export const prepareComponentToken = (token: AliasToken): Partial<ComponentToken> => {
  const gradientFromColor = token.colorFillContent;
  const gradientToColor = token.colorFill;
  return {
    color: gradientFromColor,
    colorGradientEnd: gradientToColor,
    gradientFromColor,
    gradientToColor,
    titleHeight: token.controlHeight / 2,
    blockRadius: token.borderRadiusSM,
    paragraphMarginTop: token.marginLG + token.marginXXS,
    paragraphLiHeight: token.controlHeight / 2,
  };
};

/** `Skeleton` 的语义化样式槽位（供 `style/index.ts` 的文档注释引用）。 */
export type SkeletonStyleSlot = CSSProperties;
