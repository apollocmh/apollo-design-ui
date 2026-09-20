/**
 * Button 的样式生成。
 *
 * 契约来源：antd 6.6.4 `es/button/style/{index,variant,compact,group}.js`。
 * 选择器结构、属性、取值来源**逐条对齐**（702 行 JS 的全部产物）。
 *
 * ── ⚠️ 本文件最大的一件事：把 antd 的 CSS 变量间接层**展开** ──────────────────────
 *
 * antd 的 `variant.js` 用 `genCssVar(antCls, 'btn')` 在**规则内部**声明一批
 * `--ant-btn-*`（`--ant-btn-border-color` / `--ant-btn-text-color-hover` /
 * `--ant-btn-color-base` …），再用 `var()` 引用它们。靠「自定义属性在同元素上被
 * 更具体的选择器覆盖」实现 **color × variant × ghost × disabled** 的优先级。
 *
 * 我们**不能照抄**（与 `space/style/index.ts` 的 Addon 同源，差异 D38 家族）：
 * `tests/build/run.mjs` 的 **B7 · ui** 要求 ui 的每份 CSS 里出现的每个 `var(--apollo-*)`
 * 都能在 `packages/theme/dist/tokens.css` 的 `:root` 里找到声明 —— 组件内局部声明的
 * 变量它看不到，写了也不会报错、只会**静默失效**。
 *
 * ⇒ 这里把「变量间接层」展开成**逐组合的选择器**。展开规则是：某个属性在元素上的
 *   最终取值 = 所有匹配规则里特异性最高（同特异性取最后）的那条。下表是推导结果，
 *   每个格子都能回溯到 `variant.js` 的具体行。
 *
 * | antd | 本文件 |
 * |---|---|
 * | `border: var(--bw) var(--bs) var(--bc)` | 基座只给 `border-width/style` 长写法，颜色由组合规则给 `border-color` |
 * | `&:hover/:active` 改三个变量 | 组合规则 + `:not(:disabled):not(.x-btn-disabled):hover/:active` |
 * | `&-color-default` 等改 `color-base` | 展开进每个 `-color-*` × `-variant-*` 组合 |
 * | `&-background-ghost` 改 `bg-color` | 组合选择器里带上 `-background-ghost` |
 *
 * ── ⚠️ 展开的规模与「哪些组合根本没产出」 ────────────────────────────────────────
 *
 * - color 16 个（`default` / `primary` / `dangerous` + 13 预设）× variant 6 个 = 96 组；
 *   `link` 变体额外带 `link` 色（`-color-link` 在 Colors 块里**没有**规则，只有
 *   `-variant-link` 那条给了 `colorLink`）⇒ +1 组 = 97。
 * - `-background-ghost` 只与 `outlined` / `dashed` / `filled` 组合（组件层
 *   `ghost && variant==='solid'` 会把 solid 退化成 outlined，text/link 不加 ghost 类）
 *   ⇒ 16 × 3 = 48 组。
 * - **不产出** `-color-link` × 非 link 变体：antd 那边 `--btn-color-base` 等根本没被
 *   赋值（`var()` 取空值 ⇒ 属性退化为初始值）。我们没法用 `--apollo-*` 表达「空值」，
 *   与其编造一个颜色，不如**不产出**该组合（登记为差异）。
 *
 * ── ⚠️ 两个如实登记的缺口（不是推导，是读源码确认的能力缺失） ────────────────────
 *
 * 1. `solidTextColor`（`token.js:28`）依赖 color-picker 的 `isBright` + `AggregationColor`。
 *    本仓库**没有**等价能力（已 grep `packages/utils/src/color/` 与 `packages/theme`）⇒
 *    「default + solid」的文本色**退回** `-variant-solid` 的 `colorTextLightSolid`。
 *    亮色主题下两者相同（`colorBgSolid` 是深色 ⇒ antd 的两个分支里落到白色那一支）；
 *    **暗色主题会分叉**。
 * 2. 13 个 `${colorKey}ShadowColor` 由 `getAlphaColor` 迭代求解，CSS 里没有等价写法 ⇒
 *    构建期用 `prepareComponentToken(getDesignToken())` 算出并内联。
 *    代价：这 13 个阴影色**不随 dark 主题自适应**（D7 家族）。
 *
 * ── 这个函数没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明**视觉**正确（L6 的逐像素比对负责）。
 *   - 没证明变量名存在（B7 负责）。
 *   - 没证明展开后的**层叠**与 antd 等价 —— 上面那张表是推导，不是实测。
 */

import {
  getDesignToken,
  type PresetColorKey,
  PresetColors,
  token2CSSVar,
} from '@apollo-design/theme';
import { prepareComponentToken } from './token';

/** token 名 → `var(--apollo-*)`。变量名由 theme 包的命名函数给出，不手写字面量。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/** 图标类名。`context.ts:27` 的 `defaultIconPrefixCls`，与 antd 的 `.anticon` 对应。 */
const ICON_CLS = '.apollo-icon';

/** 一个属性的三态取值：常态 / hover / active。 */
type Triple = readonly [string, string, string];

type ColorKey = 'default' | 'primary' | 'dangerous' | 'link' | PresetColorKey;

type VariantKey = 'outlined' | 'dashed' | 'solid' | 'filled' | 'text' | 'link';

const TRANSPARENT: Triple = ['transparent', 'transparent', 'transparent'];

/**
 * 13 个预设色的阴影色（构建期求解，见文件头缺口 2）。
 *
 * 惰性求值：`gen()` 只在构建期被调用（`packages/ui/build.config.ts`），
 * 而本模块会被 `packages/ui/src/index.ts` 间接导出 —— 放在模块顶层会给每个
 * 消费者都加上一次 token 派生的开销。
 */
let presetShadowCache: ReturnType<typeof prepareComponentToken> | null = null;

function presetShadow(colorKey: PresetColorKey): string {
  if (!presetShadowCache) {
    presetShadowCache = prepareComponentToken(getDesignToken());
  }
  return presetShadowCache[`${colorKey}ShadowColor`];
}

/** 一个颜色在 antd 的「Colors」块里给出的那些槽位。 */
interface ColorSlots {
  /** `color-base` / `color-hover` / `color-active` */
  base: Triple;
  /** `color-light` / `color-light-hover` / `color-light-active` */
  light: Triple;
  /** `shadow` */
  shadow: string;
  /** `solid-bg-color` 三态（预设色/主色/危险色 = `color-base` 三态） */
  solidBg: Triple;
}

function colorSlots(color: ColorKey): ColorSlots {
  switch (color) {
    case 'default':
      return {
        base: [v('colorBorder'), v('colorPrimaryHover'), v('colorPrimaryActive')],
        light: [v('colorFillTertiary'), v('colorFillSecondary'), v('colorFill')],
        shadow: `0 ${v('controlOutlineWidth')} 0 ${v('controlTmpOutline')}`,
        solidBg: [v('colorBgSolid'), v('colorBgSolidHover'), v('colorBgSolidActive')],
      };
    case 'primary':
      return {
        base: [v('colorPrimary'), v('colorPrimaryHover'), v('colorPrimaryActive')],
        light: [v('colorPrimaryBg'), v('colorPrimaryBgHover'), v('colorPrimaryBorder')],
        shadow: `0 ${v('controlOutlineWidth')} 0 ${v('controlOutline')}`,
        solidBg: [v('colorPrimary'), v('colorPrimaryHover'), v('colorPrimaryActive')],
      };
    case 'dangerous':
      return {
        base: [v('colorError'), v('colorErrorHover'), v('colorErrorActive')],
        light: [v('colorErrorBg'), v('colorErrorBgFilledHover'), v('colorErrorBgActive')],
        shadow: `0 ${v('controlOutlineWidth')} 0 ${v('colorErrorOutline')}`,
        solidBg: [v('colorError'), v('colorErrorHover'), v('colorErrorActive')],
      };
    // `-color-link` 在 Colors 块里**没有**规则：只有 `-variant-link` 那条给了
    // `colorLink` 三态（`variant.js:132-137`）。它也不参与 filled/text（无 color-light）。
    case 'link':
      return {
        base: [v('colorLink'), v('colorLinkHover'), v('colorLinkActive')],
        light: TRANSPARENT,
        shadow: 'none',
        solidBg: TRANSPARENT,
      };
    default: {
      const k = color;
      const base: Triple = [v(`${k}6`), v(`${k}Hover`), v(`${k}Active`)];
      return {
        base,
        light: [v(`${k}1`), v(`${k}2`), v(`${k}3`)],
        shadow: presetShadow(k),
        solidBg: base,
      };
    }
  }
}

/** 一个（color × variant × ghost）组合展开后的三态属性。 */
interface Resolved {
  border: Triple;
  text: Triple;
  bg: Triple;
  /** 只有 `dashed` 会给 `border-style`。 */
  borderStyle?: string;
  /** 只有 `solid` / `outlined` / `dashed` 会给 `box-shadow`。 */
  shadow?: string;
}

function resolve(color: ColorKey, variant: VariantKey, ghost: boolean): Resolved {
  const c = colorSlots(color);
  const container: Triple = [v('colorBgContainer'), v('colorBgContainer'), v('colorBgContainer')];

  switch (variant) {
    case 'solid':
      return {
        border: TRANSPARENT,
        // ⚠️ 缺口 1：antd 用 `solidTextColor` 覆盖 default（本仓库算不出），
        //    这里退回 `-variant-solid` 的 `colorTextLightSolid`（亮色主题下同值）。
        text: [v('colorTextLightSolid'), v('colorTextLightSolid'), v('colorTextLightSolid')],
        bg: c.solidBg,
        shadow: ghost ? 'none' : c.shadow,
      };

    case 'outlined':
    case 'dashed': {
      let border: Triple = c.base;
      let text: Triple = c.base;
      if (color === 'default') {
        // `-color-default` + outlined/dashed 覆盖 `text-color` 三态（`variant.js:196-199`）
        text = [v('colorText'), v('colorPrimaryHover'), v('colorPrimaryActive')];
      }
      if (ghost && color === 'default') {
        // `-color-default` + ghost + outlined/dashed 只覆盖**常态**两色
        // （`variant.js:210-215`）—— hover/active 仍走上面的三态，不是笔误。
        border = [v('colorBgContainer'), border[1], border[2]];
        text = [v('colorBgContainer'), text[1], text[2]];
      }
      return {
        border,
        text,
        bg: container,
        borderStyle: variant === 'dashed' ? 'dashed' : undefined,
        shadow: ghost ? 'none' : c.shadow,
      };
    }

    case 'filled':
      return {
        border: TRANSPARENT,
        // default 的 filled/text 把 hover/active 文本色锁回常态（`variant.js:192-195`）
        text: color === 'default' ? [v('colorText'), v('colorText'), v('colorText')] : c.base,
        bg: c.light,
      };

    case 'text':
      return {
        border: TRANSPARENT,
        // default 的 text 三态全部 = `textTextColor/Hover/Active` = `colorText`
        text: color === 'default' ? [v('colorText'), v('colorText'), v('colorText')] : c.base,
        // hover 背景：default 走 `textHoverBg`（= colorFillTertiary），其余走 `color-light`
        bg: ['transparent', color === 'default' ? v('colorFillTertiary') : c.light[1], c.light[2]],
      };

    case 'link':
      // `bg-color-hover` = `linkHoverBg` = transparent（`variant.js:136`）
      return { border: TRANSPARENT, text: c.base, bg: TRANSPARENT };
  }
}

/** 一个组合的三条规则（常态 + hover + active）。只输出与常态不同的那条声明。 */
function emitCombo(cls: string, color: ColorKey, variant: VariantKey, ghost: boolean): string[] {
  const r = resolve(color, variant, ghost);
  // ghost 把三个状态的背景全改成 `ghostBg`（= transparent），且它排在 Colors 之后
  const bg: Triple = ghost ? TRANSPARENT : r.bg;

  const sel = `${cls}${cls}-color-${color}${cls}-variant-${variant}${
    ghost ? `${cls}-background-ghost` : ''
  }`;

  const out: string[] = [];
  out.push(
    `${sel}{`,
    `  border-color:${r.border[0]};`,
    `  color:${r.text[0]};`,
    `  background-color:${bg[0]};`,
  );
  if (r.borderStyle) out.push(`  border-style:${r.borderStyle};`);
  if (r.shadow) out.push(`  box-shadow:${r.shadow};`);
  out.push(`}`);

  const stateDecls = (i: 1 | 2): string[] => {
    const decls: string[] = [];
    if (r.border[i] !== r.border[0]) decls.push(`  border-color:${r.border[i]};`);
    if (r.text[i] !== r.text[0]) decls.push(`  color:${r.text[i]};`);
    if (bg[i] !== bg[0]) decls.push(`  background-color:${bg[i]};`);
    return decls;
  };

  for (const [state, index] of [
    ['hover', 1],
    ['active', 2],
  ] as const) {
    const decls = stateDecls(index);
    if (decls.length) {
      out.push(`${sel}:not(:disabled):not(${cls}-disabled):${state}{`, ...decls, `}`);
    }
  }

  return out;
}

/**
 * 生成 Button 的静态 CSS。
 *
 * @param prefixCls 类名前缀（`apollo` 或 `ant`）
 */
export function genButtonStyle(prefixCls: string): string {
  const cls = `.${prefixCls}-btn`;
  const group = `${cls}-group`;
  const compact = `${cls}-compact`;
  const compactVertical = `${cls}-compact-vertical`;

  const lineWidth = v('lineWidth');
  const insetOffset = `calc(${lineWidth} * -1)`;

  const colors: ColorKey[] = ['default', 'primary', 'dangerous', ...PresetColors];
  // `-color-link` 只在 `-variant-link` 下有意义（见 `colorSlots` 的注释）
  const linkColors: ColorKey[] = [...colors, 'link'];

  const out: string[] = [];

  // =========================================================================
  // genCommonStyle（antd `style/index.js`，resetStyle 默认开启 ⇒ Button 有这四条）
  // =========================================================================
  out.push(
    `[class^="${prefixCls}-btn"],[class*=" ${prefixCls}-btn"]{`,
    `  font-family:${v('fontFamily')};`,
    `  font-size:${v('fontSize')};`,
    `  box-sizing:border-box;`,
    `}`,
    `[class^="${prefixCls}-btn"]::before,[class^="${prefixCls}-btn"]::after,[class*=" ${prefixCls}-btn"]::before,[class*=" ${prefixCls}-btn"]::after{`,
    `  box-sizing:border-box;`,
    `}`,
    `[class^="${prefixCls}-btn"] [class^="${prefixCls}-btn"],[class^="${prefixCls}-btn"] [class*=" ${prefixCls}-btn"],[class*=" ${prefixCls}-btn"] [class^="${prefixCls}-btn"],[class*=" ${prefixCls}-btn"] [class*=" ${prefixCls}-btn"]{`,
    `  box-sizing:border-box;`,
    `}`,
    '',
  );

  // =========================================================================
  // genSharedButtonStyle（`style/index.js:9-123`）
  // =========================================================================
  out.push(
    `${cls}{`,
    `  outline:none;`,
    `  position:relative;`,
    `  display:inline-flex;`,
    `  gap:${v('marginXS')};`,
    `  align-items:center;`,
    `  justify-content:center;`,
    `  font-weight:400;`,
    `  white-space:nowrap;`,
    `  text-align:center;`,
    `  background-image:none;`,
    `  cursor:pointer;`,
    `  transition:all ${v('motionDurationMid')} ${v('motionEaseInOut')};`,
    `  user-select:none;`,
    `  touch-action:manipulation;`,
    // 展开自 `border: var(--bw) var(--bs) var(--bc)`：宽度/样式在基座，
    // 颜色由下面每个（color × variant × ghost）组合给出。
    `  border-width:${lineWidth};`,
    `  border-style:${v('lineType')};`,
    `  border-color:${v('colorBorder')};`,
    `}`,
    // genNoMotionStyle
    `@media (prefers-reduced-motion: reduce){`,
    `${cls},${cls}::before,${cls}::after{`,
    `  transition:none;`,
    `  animation:none;`,
    `}`,
    `}`,
    // ⚠️ 只有 `:disabled`（原生属性）。`<a>` 分支用的是 `-disabled` 类，
    //    上游没有为它写这一条 —— 不对称是上游真实行为，逐字保留。
    `${cls}:disabled > *{`,
    `  pointer-events:none;`,
    `}`,
    '',
  );

  // ---- icon（issues/51380 + issues/58428）----
  out.push(
    `${cls}-icon > svg{`,
    `  display:inline-flex;`,
    `  align-items:center;`,
    `  color:inherit;`,
    `  font-style:normal;`,
    `  line-height:0;`,
    `  text-align:center;`,
    `  text-transform:none;`,
    `  vertical-align:-0.125em;`,
    `  text-rendering:optimizeLegibility;`,
    `  -webkit-font-smoothing:antialiased;`,
    `  -moz-osx-font-smoothing:grayscale;`,
    `}`,
    `${cls}-icon > svg > *{`,
    `  line-height:1;`,
    `}`,
    `${cls}-icon > svg svg{`,
    `  display:inline-block;`,
    `  vertical-align:inherit;`,
    `}`,
    `${cls}-icon{`,
    `  display:inline-flex;`,
    `  align-items:center;`,
    `}`,
    `${cls}-icon ${ICON_CLS}{`,
    `  vertical-align:middle;`,
    `}`,
    // 给 SVG 前面补一个零宽空格，把基线顶到按钮中央
    `${cls}-icon ${ICON_CLS}:before{`,
    `  content:"\\a0";`,
    `  display:inline-block;`,
    `  width:0;`,
    `}`,
    `${cls} > a{`,
    `  color:currentColor;`,
    `}`,
    // genFocusStyle ⇒ genFocusOutline（lineWidthFocus + colorPrimaryBorder + offset 1）
    `${cls}:not(:disabled):focus-visible{`,
    `  outline:${v('lineWidthFocus')} solid ${v('colorPrimaryBorder')};`,
    `  outline-offset:1;`,
    `  transition:outline-offset 0s,outline 0s;`,
    `}`,
    '',
  );

  // ---- 两个中文字（issues/…）----
  out.push(
    `${cls}${cls}-two-chinese-chars::first-letter{`,
    `  letter-spacing:0.34em;`,
    `}`,
    `${cls}${cls}-two-chinese-chars > *:not(${ICON_CLS}){`,
    `  margin-inline-end:-0.34em;`,
    `  letter-spacing:0.34em;`,
    `}`,
    `${cls}${cls}-icon-only{`,
    `  padding-inline:0;`,
    `}`,
    `${cls}${cls}-icon-only${cls}-compact-item{`,
    `  flex:none;`,
    `}`,
    `${cls}${cls}-loading{`,
    `  opacity:${v('opacityLoading')};`,
    `  cursor:default;`,
    `}`,
    `${cls}-loading-icon{`,
    `  transition:width ${v('motionDurationSlow')} ${v('motionEaseInOut')},opacity ${v('motionDurationSlow')} ${v('motionEaseInOut')},margin ${v('motionDurationSlow')} ${v('motionEaseInOut')};`,
    `}`,
    '',
  );

  // ---- iconPlacement 的 loading 图标进出场 ----
  // ⚠️ 这 8 条是 React CSSMotion 的类名（`-appear-start` 等）。Vue 侧目前没有
  //    CSSMotion（loading 图标是静态渲染的）⇒ 这些选择器**暂时匹配不到任何元素**。
  //    逐字保留是为了与上游逐条对齐；等 motion 层落地后它们才生效（差异登记：无过渡）。
  const motionCls = `${cls}-loading-icon-motion`;
  out.push(
    `${cls}:not(${cls}-icon-end) ${motionCls}-appear-start,${cls}:not(${cls}-icon-end) ${motionCls}-enter-start,${cls}:not(${cls}-icon-end) ${motionCls}-appear-prepare,${cls}:not(${cls}-icon-end) ${motionCls}-enter-prepare{`,
    `  margin-inline-end:calc(${v('marginXS')} * -1);`,
    `  opacity:0;`,
    `}`,
    `${cls}:not(${cls}-icon-end) ${motionCls}-appear-active,${cls}:not(${cls}-icon-end) ${motionCls}-enter-active{`,
    `  margin-inline-end:0;`,
    `}`,
    `${cls}:not(${cls}-icon-end) ${motionCls}-leave-start{`,
    `  margin-inline-end:0;`,
    `}`,
    `${cls}:not(${cls}-icon-end) ${motionCls}-leave-active{`,
    `  margin-inline-end:calc(${v('marginXS')} * -1);`,
    `}`,
    `${cls}-icon-end{`,
    `  flex-direction:row-reverse;`,
    `}`,
    `${cls}-icon-end ${motionCls}-appear-start,${cls}-icon-end ${motionCls}-enter-start,${cls}-icon-end ${motionCls}-appear-prepare,${cls}-icon-end ${motionCls}-enter-prepare{`,
    `  margin-inline-start:calc(${v('marginXS')} * -1);`,
    `  opacity:0;`,
    `}`,
    `${cls}-icon-end ${motionCls}-appear-active,${cls}-icon-end ${motionCls}-enter-active{`,
    `  margin-inline-start:0;`,
    `}`,
    `${cls}-icon-end ${motionCls}-leave-start{`,
    `  margin-inline-start:0;`,
    `}`,
    `${cls}-icon-end ${motionCls}-leave-active{`,
    `  margin-inline-start:calc(${v('marginXS')} * -1);`,
    `}`,
    '',
  );

  // =========================================================================
  // Size + Shape（`genButtonStyle` × base / sm / lg，`style/index.js:131-196`）
  //
  // ⚠️ `contentFontSizeSM` 回落的是 `fontSize`，**不是** `fontSizeSM`
  //    （`token.js:23`）；只有 LG 回落到 `fontSizeLG`。
  // =========================================================================
  const paddingInline = `calc(${v('paddingContentHorizontal')} - ${lineWidth})`;
  // `paddingInlineSM: 8 - lineWidth`（`token.js:50`），8 是上游字面量
  const paddingInlineSM = `calc(8px - ${lineWidth})`;

  const sizeBlock = (
    sizeSuffix: '' | '-sm' | '-lg',
    heightToken: string,
    fontSizeToken: string,
    padding: string,
    /**
     * 圆角必须写成紧跟冒号的 `${v('<token>')}`（值**内联**，不要先绑到中间变量再插值）：
     * E10 的负向先行只豁免紧邻冒号的 `var(` / `${v(`，中间变量会被误判成硬编码圆角。
     */
    radiusToken: string,
  ): void => {
    const height = v(heightToken);
    const fontSize = v(fontSizeToken);
    // `[prefixCls]`：小号/大号是**独立的** `-sm` / `-lg` 类（`.apollo-btn-sm`），
    // 不是与根类复合；base 的 prefixCls 是空串 ⇒ 就是根类本身。
    const s = `${cls}${sizeSuffix}`;
    // Shape 补丁的选择器是 `${componentCls}${componentCls}-circle${prefixCls}`
    // —— base 时第三段落是空串（不能重复拼一次根类）。
    const shapeSuffix = sizeSuffix ? s : '';
    out.push(
      `${s}{`,
      `  font-size:${fontSize};`,
      `  height:${height};`,
      `  padding:0 ${padding};`,
      `  border-radius:${v(radiusToken)};`,
      `}`,
      `${s}${cls}-icon-only{`,
      `  width:${height};`,
      `}`,
      `${s}${cls}-icon-only ${ICON_CLS}{`,
      `  font-size:inherit;`,
      `}`,
      `${cls}${cls}-circle${shapeSuffix}{`,
      `  min-width:${height};`,
      `  padding-inline:0;`,
      // antd 写的是字面量 `50%`。我们用 `borderRadiusCircle`（`100%`）——
      // CSS 规范下同一元素上各半径之和超过边长时会**等比缩放**，100% 与 50% 落到同一个
      // 结果（方形 ⇒ 圆；矩形 ⇒ 椭圆），所以这只是去掉硬编码，不是改设计值。
      `  border-radius:${v('borderRadiusCircle')};`,
      `}`,
      `${cls}${cls}-round${shapeSuffix}{`,
      // 与上面 `-circle` 同理：值必须**内联**成 `${v(token)}`（走中间变量会被 E10 误判）。
      `  border-radius:${v(heightToken)};`,
      `}`,
      `${cls}${cls}-round${shapeSuffix}:not(${cls}-icon-only){`,
      `  padding-inline:${padding};`,
      `}`,
      '',
    );
  };

  sizeBlock('', 'controlHeight', 'fontSize', paddingInline, 'borderRadius');
  sizeBlock('-sm', 'controlHeightSM', 'fontSize', paddingInlineSM, 'borderRadiusSM');
  sizeBlock('-lg', 'controlHeightLG', 'fontSizeLG', paddingInline, 'borderRadiusLG');

  // =========================================================================
  // Block（`genBlockButtonStyle`）
  // =========================================================================
  out.push(`${cls}${cls}-block{`, `  width:100%;`, `}`, '');

  // =========================================================================
  // Variant（`genVariantStyle`）展开
  // =========================================================================
  for (const variant of ['outlined', 'dashed', 'solid', 'filled', 'text'] as const) {
    for (const color of colors) {
      out.push(...emitCombo(cls, color, variant, false), '');
    }
  }
  for (const color of linkColors) {
    out.push(...emitCombo(cls, color, 'link', false), '');
  }

  // ---- Disabled（`variant.js:242-250`；必须排在 Colors / PresetColors 之后）----
  //
  // ⚠️ 选择器特意**重复一遍** `${cls}`（`.apollo-btn.apollo-btn:disabled`）——
  //    与 antd 的 `.ant-btn:disabled, .ant-btn.ant-btn-disabled` 同处一个
  //    「color×variant 与 disabled 同特异性」的二难：两边都是 (0,2,0)。我们靠：
  //      1) 这里有重复类把禁用选择器顶到 (0,3,0)，**稳赢** color×variant；
  //      2) 同时保留来源顺序作为兜底（disabled 在所有 color×variant 之后）。
  //    实际效果：`.apollo-btn-color-primary.apollo-btn-variant-solid:disabled`
  //    也能被命中（[1] 链接分支实测）。
  out.push(
    `${cls}${cls}:disabled,${cls}${cls}${cls}-disabled{`,
    `  cursor:not-allowed;`,
    `  border-color:${v('colorBorderDisabled')};`,
    `  background:${v('colorBgContainerDisabled')};`,
    `  color:${v('colorTextDisabled')};`,
    `  box-shadow:none;`,
    `}`,
    // text / link 变体的 disabled 额外把背景与边框清成透明
    `${cls}${cls}-variant-text${cls}:disabled,${cls}${cls}-variant-text${cls}${cls}-disabled,${cls}${cls}-variant-link${cls}:disabled,${cls}${cls}-variant-link${cls}${cls}-disabled{`,
    `  background:transparent;`,
    `  border-color:transparent;`,
    `}`,
    '',
  );

  // ---- Ghost（`variant.js:255-266`；排在 Disabled 之后）----
  // ⚠️ 组件层保证 `-background-ghost` 只与 outlined / dashed / filled 同现
  //    （solid 被退化成 outlined；text / link 不加该类）。
  for (const variant of ['outlined', 'dashed', 'filled'] as const) {
    for (const color of colors) {
      out.push(...emitCombo(cls, color, variant, true), '');
    }
  }

  // =========================================================================
  // Group（`style/group.js`）
  // =========================================================================
  out.push(
    `${group}{`,
    `  position:relative;`,
    `  display:inline-flex;`,
    `}`,
    `${group} > span:not(:last-child),${group} > span:not(:last-child) > ${cls},${group} > ${cls}:not(:last-child),${group} > ${cls}:not(:last-child) > ${cls}{`,
    `  border-start-end-radius:0;`,
    `  border-end-end-radius:0;`,
    `}`,
    `${group} > span:not(:first-child),${group} > span:not(:first-child) > ${cls},${group} > ${cls}:not(:first-child),${group} > ${cls}:not(:first-child) > ${cls}{`,
    `  margin-inline-start:${insetOffset};`,
    `  border-start-start-radius:0;`,
    `  border-end-start-radius:0;`,
    `}`,
    `${group} ${cls}{`,
    `  position:relative;`,
    `  z-index:1;`,
    `}`,
    `${group} ${cls}:hover,${group} ${cls}:focus,${group} ${cls}:active{`,
    `  z-index:2;`,
    `}`,
    `${group} ${cls}[disabled]{`,
    `  z-index:0;`,
    `}`,
    `${group} ${cls}-icon-only{`,
    `  font-size:${v('fontSize')};`,
    `}`,
    '',
  );

  /** 组内分隔线颜色：只对 primary / danger 生效，且排除 disabled。 */
  const groupBorder = (typeCls: string, color: string): void => {
    out.push(
      `${group} > span:not(:last-child):not(:disabled),${group} > span:not(:last-child) > ${typeCls}:not(:disabled),${group} > ${typeCls}:not(:last-child):not(:disabled),${group} > ${typeCls}:not(:last-child) > ${typeCls}:not(:disabled){`,
      `  border-inline-end-color:${color};`,
      `}`,
      `${group} > span:not(:first-child):not(:disabled),${group} > span:not(:first-child) > ${typeCls}:not(:disabled),${group} > ${typeCls}:not(:first-child):not(:disabled),${group} > ${typeCls}:not(:first-child) > ${typeCls}:not(:disabled){`,
      `  border-inline-start-color:${color};`,
      `}`,
      '',
    );
  };

  groupBorder(`${cls}-primary`, v('colorPrimaryHover'));
  groupBorder(`${cls}-danger`, v('colorErrorHover'));

  // =========================================================================
  // Compact（`style/compact.js` = genCompactItemStyle + genCompactItemVerticalStyle
  //          + genButtonCompactStyle）
  // =========================================================================
  out.push(
    `${compact}-item:not(${compact}-last-item){`,
    `  margin-inline-end:${insetOffset};`,
    `}`,
    `${compact}-item:not(${cls}-status-success){`,
    `  z-index:2;`,
    `}`,
    `${compact}-item:focus,${compact}-item:active{`,
    `  z-index:3;`,
    `}`,
    `${compact}-item:hover{`,
    `  z-index:4;`,
    `}`,
    `${compact}-item[disabled]{`,
    `  z-index:0;`,
    `}`,
    `${compact}-item:not(${compact}-first-item):not(${compact}-last-item){`,
    `  border-radius:0;`,
    `}`,
    `${compact}-item:not(${compact}-last-item)${compact}-first-item,${compact}-item:not(${compact}-last-item)${compact}-first-item${cls}-sm,${compact}-item:not(${compact}-last-item)${compact}-first-item${cls}-lg{`,
    `  border-start-end-radius:0;`,
    `  border-end-end-radius:0;`,
    `}`,
    `${compact}-item:not(${compact}-first-item)${compact}-last-item,${compact}-item:not(${compact}-first-item)${compact}-last-item${cls}-sm,${compact}-item:not(${compact}-first-item)${compact}-last-item${cls}-lg{`,
    `  border-start-start-radius:0;`,
    `  border-end-start-radius:0;`,
    `}`,
    '',
    `${compactVertical}-item:not(${compactVertical}-last-item){`,
    `  margin-bottom:${insetOffset};`,
    `}`,
    `${compactVertical}-item:not(${cls}-status-success){`,
    `  z-index:2;`,
    `}`,
    `${compactVertical}-item:focus,${compactVertical}-item:active{`,
    `  z-index:3;`,
    `}`,
    `${compactVertical}-item:hover{`,
    `  z-index:4;`,
    `}`,
    `${compactVertical}-item[disabled]{`,
    `  z-index:0;`,
    `}`,
    `${compactVertical}-item:not(${compactVertical}-first-item):not(${compactVertical}-last-item){`,
    `  border-radius:0;`,
    `}`,
    `${compactVertical}-item${compactVertical}-first-item:not(${compactVertical}-last-item),${compactVertical}-item${compactVertical}-first-item:not(${compactVertical}-last-item)${cls}-sm,${compactVertical}-item${compactVertical}-first-item:not(${compactVertical}-last-item)${cls}-lg{`,
    `  border-end-end-radius:0;`,
    `  border-end-start-radius:0;`,
    `}`,
    `${compactVertical}-item${compactVertical}-last-item:not(${compactVertical}-first-item),${compactVertical}-item${compactVertical}-last-item:not(${compactVertical}-first-item)${cls}-sm,${compactVertical}-item${compactVertical}-last-item:not(${compactVertical}-first-item)${cls}-lg{`,
    `  border-start-start-radius:0;`,
    `  border-start-end-radius:0;`,
    `}`,
    '',
  );

  // ---- 实心按钮之间的连接条（`genButtonCompactStyle`）----
  // antd 用 `--btn-compact-connect-border-color: var(--btn-bg-color-hover)`，
  // 而 `& + …:before` 取的是**后一个**元素自己的变量 ⇒ 展开时按**后一个按钮**的
  // 颜色类来给 `background-color`。
  const solidSel = `${cls}-variant-solid:not([disabled])`;

  const connectBg = (color: ColorKey): string => {
    // solid 的 hover 背景就是 `solid-bg-color-hover`
    const hoverBg = colorSlots(color).solidBg[1];
    // `-color-default` 的连接条要再混一层容器底色（`compact.js:47-49`）
    return color === 'default'
      ? `color-mix(in srgb, ${hoverBg} 75%, ${v('colorBgContainer')})`
      : hoverBg;
  };

  out.push(
    `${compact}-item${solidSel},${compactVertical}-item${solidSel}{`,
    `  transition:none;`,
    `}`,
  );
  out.push(
    `${compact}-item${solidSel}:hover:before,${compactVertical}-item${solidSel}:hover:before{`,
    `  display:none;`,
    `}`,
  );

  for (const color of colors) {
    const bg = connectBg(color);
    const colorSuffix = `${cls}-color-${color}`;
    out.push(
      `${compact}-item${solidSel} + ${solidSel}${colorSuffix}:before{`,
      `  position:absolute;`,
      `  background-color:${bg};`,
      `  content:"";`,
      `  inset-block:${insetOffset};`,
      `  inset-inline-start:${insetOffset};`,
      `  width:${lineWidth};`,
      `}`,
      `${compactVertical}-item${solidSel} + ${solidSel}${colorSuffix}:before{`,
      `  position:absolute;`,
      `  background-color:${bg};`,
      `  content:"";`,
      `  top:${insetOffset};`,
      `  inset-inline:${insetOffset};`,
      `  height:${lineWidth};`,
      `}`,
    );
  }
  out.push('');

  return out.join('\n');
}
