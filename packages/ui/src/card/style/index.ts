/**
 * Card 的样式生成（G4 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/card/style/index.js`（502 行）。选择器结构
 * **从真实产物提取**，不是推演 —— 可复现命令：
 *
 * ```sh
 * node tests/visual/debug/extract-card-css.mjs > /tmp/card-antd.css
 * ```
 *
 * 产物共 **60 条** `ant-card` 规则；本文件产出 **55 条**，差掉的 5 条是：
 * `resetComponent` 的 4 条 `box-sizing` 重复块（`BASE_CSS` 已覆盖，`badge` / `spin` 范式）
 * 与 1 个 `.css-var-*` 声明块（其 13 条声明由 `genTokenDecls` 内联进根规则）。
 *
 * ── 从产物里抄下来的四处**非显然**结构 ────────────────────────────────────────
 *
 * 1. **根规则是「cssinjs 包裹层 + `resetComponent` + `genCardStyle` 根」三者合并**：
 *    `font-family` / `font-size` / `box-sizing` / `margin:0` / `padding:0` /
 *    `color` / `line-height` / `list-style` / `position` / `background` / `border-radius`。
 * 2. **`.{p}-head` 里的 tabs 选择器用的是 `antCls`**（`.apollo-tabs-top`），
 *    不是 `componentCls` —— 即**全局 Tabs 的类名**，不是 `apollo-card-tabs`。
 * 3. **两条「死选择器」照抄**（UPSTREAM quirk，见 README §2）：
 *    `.apollo-card-head-title >.apollo-card-typography`（上游拼错前缀，应为
 *    `.apollo-typography`）与 `a:not(.apollo-card-btn)`（Card 里没有 `-btn`）。
 *    上游产物如此，改掉会让「与产物逐条对拍」出现无法解释的差异。
 * 4. **`-contain-tabs` 用子选择器 `>div.{p}-head`**，而 `-contain-grid` 的
 *    `:has(> .{p}-head)` 是**子选择器包在 `:has()` 里** —— 少一个 `>` 语义就变了。
 *
 * ── 4 个 `mergeToken` 派生的落点 ───────────────────────────────────────────────
 *
 * `cardShadow` / `cardHeadPadding` / `cardPaddingBase` / `cardActionsIconSize`
 * 在上游是 `mergeToken` 派生（用户不可覆盖），产物里直接展开成**全局** token 引用
 * ⇒ 本文件写 `var(--apollo-box-shadow-card)` / `var(--apollo-padding)` /
 * `var(--apollo-padding-lg)` / `var(--apollo-font-size)`（详见 `style/token.ts`）。
 *
 * ── 这个函数证明什么 / 不证明什么 ────────────────────────────────────────────
 *
 * 证明：55 条规则的**选择器结构与声明顺序**与产物逐条对应；13 个 Component Token 的
 * 变量名与**构建期解析值**一致（`genTokenDecls`）。
 *
 * 不证明：视觉正确（L6 逐像素负责）；变量名存在于 `tokens.css`
 * （`test:build` 的 B7 校验）；`--apollo-*` 全局 token 的取值（theme 包负责）。
 */

import { getDesignToken, token2CSSVar } from '@apollo-design/theme';
import { type ComponentToken, prepareComponentToken } from './token';

/** token 名 → `var(--apollo-*)`。变量名由 theme 包的命名函数给出，不手写字面量。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

let tokenCache: ComponentToken | null = null;

function cardTokenValues(): ComponentToken {
  if (!tokenCache) {
    tokenCache = prepareComponentToken(getDesignToken()) as ComponentToken;
  }
  return tokenCache;
}

/** 数字带 `px`、字符串原样 —— 与 cssinjs 的 `unit()` 同义。 */
const unit = (value: number | string): string =>
  typeof value === 'number' ? `${value}px` : String(value);

/**
 * Component Token 的声明块（**13** 个字段，构建期解析值）。
 *
 * ⚠️ 顺序与产物的 css-var 块一致（`header-bg` → `header-font-size` →
 * `header-font-size-sm` → `header-height` → `header-height-sm` → `actions-bg`
 * → `actions-li-margin` → `tabs-margin-bottom` → `extra-color` → `body-padding-sm`
 * → `header-padding-sm` → `body-padding` → `header-padding`）。
 */
export function genTokenDecls(rootPrefixCls: string): string[] {
  const p = rootPrefixCls;
  const t = cardTokenValues();
  return [
    `  --${p}-card-header-bg:${unit(t.headerBg)};`,
    `  --${p}-card-header-font-size:${unit(t.headerFontSize)};`,
    `  --${p}-card-header-font-size-sm:${unit(t.headerFontSizeSM)};`,
    `  --${p}-card-header-height:${unit(t.headerHeight)};`,
    `  --${p}-card-header-height-sm:${unit(t.headerHeightSM)};`,
    `  --${p}-card-actions-bg:${unit(t.actionsBg)};`,
    `  --${p}-card-actions-li-margin:${unit(t.actionsLiMargin)};`,
    `  --${p}-card-tabs-margin-bottom:${unit(t.tabsMarginBottom)};`,
    `  --${p}-card-extra-color:${unit(t.extraColor)};`,
    `  --${p}-card-body-padding-sm:${unit(t.bodyPaddingSM)};`,
    `  --${p}-card-header-padding-sm:${unit(t.headerPaddingSM)};`,
    `  --${p}-card-body-padding:${unit(t.bodyPadding)};`,
    `  --${p}-card-header-padding:${unit(t.headerPadding)};`,
  ];
}

export function genCardStyle(rootPrefixCls: string): string {
  const p = rootPrefixCls;
  const cls = `.${p}-card`;
  const head = `${cls}-head`;
  const headTitle = `${head}-title`;
  const headWrapper = `${head}-wrapper`;
  const extra = `${cls}-extra`;
  const body = `${cls}-body`;
  const cover = `${cls}-cover`;
  const actions = `${cls}-actions`;
  const meta = `${cls}-meta`;
  const grid = `${cls}-grid`;
  const icon = `.${p}-icon`;
  const tabsTop = `.${p}-tabs-top`;

  /** Component Token 的变量引用（`--{p}-card-*`）。 */
  const tv = (name: string): string => `var(--${p}-card-${name})`;

  return [
    // ---- 根：cssinjs 包裹层 + resetComponent 展开（box-sizing 块不产出）+ genCardStyle ----
    `${cls}{`,
    // 🚨 **Component Token 的声明块必须内联在根规则里**（anchor / breadcrumb / rate /
    //    date-picker 同一写法）。漏了它 = 13 个 `--apollo-card-*` **全部未声明**
    //    ⇒ `padding:var(...)` / `background:var(...)` 静默失效（未定义 var 不是回退
    //    默认值，而是 invalid at computed-value time）⇒ 视觉全错，而
    //    `lint:types` / L1 / L3 / L5 全绿。两道防线：L6 像素差 + `theme.test.ts`
    //    的「声明 ↔ 引用」双向检查。
    ...genTokenDecls(p),
    `  box-sizing:border-box;`,
    `  margin:0;`,
    `  padding:0;`,
    `  color:${v('colorText')};`,
    `  font-size:${v('fontSize')};`,
    `  line-height:${v('lineHeight')};`,
    `  list-style:none;`,
    `  font-family:${v('fontFamily')};`,
    `  position:relative;`,
    `  background:${v('colorBgContainer')};`,
    `  border-radius:${v('borderRadiusLG')};`,
    `}`,

    // ---- 无边框形态靠三级阴影替代 border ----
    `${cls}:not(${cls}-bordered){`,
    `  box-shadow:${v('boxShadowTertiary')};`,
    `}`,

    // ---- head ----
    `${cls} ${head}{`,
    `  display:flex;`,
    `  justify-content:center;`,
    `  flex-direction:column;`,
    `  min-height:${tv('header-height')};`,
    `  margin-bottom:-1px;`,
    `  padding:0 ${tv('header-padding')};`,
    `  color:${v('colorTextHeading')};`,
    `  font-weight:${v('fontWeightStrong')};`,
    `  font-size:${tv('header-font-size')};`,
    `  background:${tv('header-bg')};`,
    `  border-bottom:${v('lineWidth')} ${v('lineType')} ${v('colorBorderSecondary')};`,
    `  border-radius:${v('borderRadiusLG')} ${v('borderRadiusLG')} 0 0;`,
    `}`,
    // clearFix
    `${cls} ${head}::before{`,
    `  display:table;`,
    `  content:"";`,
    `}`,
    `${cls} ${head}::after{`,
    `  display:table;`,
    `  clear:both;`,
    `  content:"";`,
    `}`,
    `${cls} ${headWrapper}{`,
    `  width:100%;`,
    `  display:flex;`,
    `  align-items:center;`,
    `}`,
    // textEllipsis
    `${cls} ${headTitle}{`,
    `  display:inline-block;`,
    `  flex:1;`,
    `  overflow:hidden;`,
    `  white-space:nowrap;`,
    `  text-overflow:ellipsis;`,
    `}`,
    // ⚠️ 死选择器：上游写的是 `${componentCls}-typography`（= `.apollo-card-typography`），
    //    而 Typography 的真实类名是 `.apollo-typography` ⇒ 这条永远匹配不到。
    //    照抄（UPSTREAM quirk）。
    `${cls} ${headTitle} >${cls}-typography,${cls} ${headTitle} >${cls}-typography-edit-content{`,
    `  inset-inline-start:0;`,
    `  margin-top:0;`,
    `  margin-bottom:0;`,
    `}`,
    // ⚠️ 这里用的是**全局** Tabs 的类名（antCls），不是 componentCls
    `${cls} ${head} ${tabsTop}{`,
    `  clear:both;`,
    `  margin-bottom:${tv('tabs-margin-bottom')};`,
    `  color:${v('colorText')};`,
    `  font-weight:normal;`,
    `  font-size:${v('fontSize')};`,
    `}`,
    `${cls} ${head} ${tabsTop}-bar{`,
    `  border-bottom:${v('lineWidth')} ${v('lineType')} ${v('colorBorderSecondary')};`,
    `}`,
    `${cls} ${extra}{`,
    `  margin-inline-start:auto;`,
    `  color:${tv('extra-color')};`,
    `  font-weight:normal;`,
    `  font-size:${v('fontSize')};`,
    `}`,

    // ---- body ----
    `${cls} ${body}{`,
    `  padding:${tv('body-padding')};`,
    `  border-radius:0 0 ${v('borderRadiusLG')} ${v('borderRadiusLG')};`,
    `}`,
    `${cls} ${body}:first-child{`,
    `  border-start-start-radius:${v('borderRadiusLG')};`,
    `  border-start-end-radius:${v('borderRadiusLG')};`,
    `}`,
    `${cls} ${body}:not(:last-child){`,
    `  border-end-start-radius:0;`,
    `  border-end-end-radius:0;`,
    `}`,

    // ---- grid ----
    `${cls} ${grid}{`,
    `  width:33.33%;`,
    `  padding:${v('paddingLG')};`,
    `  border:0;`,
    `  border-radius:0;`,
    `  box-shadow:${v('lineWidth')} 0 0 0 ${v('colorBorderSecondary')},0 ${v('lineWidth')} 0 0 ${v('colorBorderSecondary')},${v('lineWidth')} ${v('lineWidth')} 0 0 ${v('colorBorderSecondary')},${v('lineWidth')} 0 0 0 ${v('colorBorderSecondary')} inset,0 ${v('lineWidth')} 0 0 ${v('colorBorderSecondary')} inset;`,
    `  transition:all ${v('motionDurationMid')};`,
    `}`,
    `${cls} ${grid}-hoverable:hover{`,
    `  position:relative;`,
    `  z-index:1;`,
    `  box-shadow:${v('boxShadowCard')};`,
    `}`,

    // ---- cover ----
    `${cls} ${cover} >*{`,
    `  display:block;`,
    `  width:100%;`,
    `  border-radius:${v('borderRadiusLG')} ${v('borderRadiusLG')} 0 0;`,
    `}`,

    // ---- actions ----
    `${cls} ${actions}{`,
    `  margin:0;`,
    `  padding:0;`,
    `  list-style:none;`,
    `  background:${tv('actions-bg')};`,
    `  border-top:${v('lineWidth')} ${v('lineType')} ${v('colorBorderSecondary')};`,
    `  display:flex;`,
    `  border-radius:0 0 ${v('borderRadiusLG')} ${v('borderRadiusLG')};`,
    `}`,
    `${cls} ${actions}::before{`,
    `  display:table;`,
    `  content:"";`,
    `}`,
    `${cls} ${actions}::after{`,
    `  display:table;`,
    `  clear:both;`,
    `  content:"";`,
    `}`,
    `${cls} ${actions}>li{`,
    `  margin:${tv('actions-li-margin')};`,
    `  color:${v('colorTextDescription')};`,
    `  text-align:center;`,
    `}`,
    `${cls} ${actions}>li >span{`,
    `  position:relative;`,
    `  display:block;`,
    `  min-width:calc(${v('fontSize')} * 2);`,
    `  font-size:${v('fontSize')};`,
    `  line-height:${v('lineHeight')};`,
    `  cursor:pointer;`,
    `}`,
    `${cls} ${actions}>li >span:hover{`,
    `  color:${v('colorPrimary')};`,
    `  transition:color ${v('motionDurationMid')};`,
    `}`,
    // ⚠️ `a:not(.apollo-card-btn)` 也是死选择器（Card 里没有 `-btn`）。照抄（UPSTREAM quirk）。
    `${cls} ${actions}>li >span a:not(${cls}-btn),${cls} ${actions}>li >span >${icon}{`,
    `  display:inline-block;`,
    `  width:100%;`,
    `  color:${v('colorIcon')};`,
    `  line-height:${v('fontHeight')};`,
    `  transition:color ${v('motionDurationMid')};`,
    `}`,
    `${cls} ${actions}>li >span a:not(${cls}-btn):hover,${cls} ${actions}>li >span >${icon}:hover{`,
    `  color:${v('colorPrimary')};`,
    `}`,
    `${cls} ${actions}>li >span >${icon}{`,
    `  font-size:${v('fontSize')};`,
    `  line-height:calc(${v('fontSize')} * ${v('lineHeight')});`,
    `}`,
    `${cls} ${actions}>li:not(:last-child){`,
    `  border-inline-end:${v('lineWidth')} ${v('lineType')} ${v('colorBorderSecondary')};`,
    `}`,

    // ---- meta ----
    `${cls} ${meta}{`,
    `  margin:calc(${v('marginXXS')} * -1) 0;`,
    `  display:flex;`,
    `}`,
    `${cls} ${meta}::before{`,
    `  display:table;`,
    `  content:"";`,
    `}`,
    `${cls} ${meta}::after{`,
    `  display:table;`,
    `  clear:both;`,
    `  content:"";`,
    `}`,
    `${cls} ${meta}-avatar{`,
    `  padding-inline-end:${v('padding')};`,
    `}`,
    `${cls} ${meta}-section{`,
    `  overflow:hidden;`,
    `  flex:1;`,
    `}`,
    `${cls} ${meta}-section >div:not(:last-child){`,
    `  margin-bottom:${v('marginXS')};`,
    `}`,
    `${cls} ${meta}-title{`,
    `  color:${v('colorTextHeading')};`,
    `  font-weight:${v('fontWeightStrong')};`,
    `  font-size:${v('fontSizeLG')};`,
    `  overflow:hidden;`,
    `  white-space:nowrap;`,
    `  text-overflow:ellipsis;`,
    `}`,
    `${cls} ${meta}-description{`,
    `  color:${v('colorTextDescription')};`,
    `}`,

    // ---- 有边框（`variant !== 'borderless'`）----
    `${cls}-bordered{`,
    `  border:${v('lineWidth')} ${v('lineType')} ${v('colorBorderSecondary')};`,
    `}`,
    `${cls}-bordered ${cover}{`,
    `  margin-top:-1px;`,
    `  margin-inline-start:-1px;`,
    `  margin-inline-end:-1px;`,
    `}`,

    // ---- 悬浮 ----
    `${cls}-hoverable{`,
    `  cursor:pointer;`,
    `  transition:box-shadow ${v('motionDurationMid')},border-color ${v('motionDurationMid')};`,
    `}`,
    `${cls}-hoverable:hover{`,
    `  border-color:transparent;`,
    `  box-shadow:${v('boxShadowCard')};`,
    `}`,

    // ---- 含网格子元素 ----
    `${cls}-contain-grid{`,
    `  border-radius:${v('borderRadiusLG')} ${v('borderRadiusLG')} 0 0;`,
    `}`,
    `${cls}-contain-grid:not(:has(> ${head})){`,
    `  border-radius:0;`,
    `}`,
    `${cls}-contain-grid ${body}{`,
    `  display:flex;`,
    `  flex-wrap:wrap;`,
    `}`,
    `${cls}-contain-grid:not(${cls}-loading) ${body}{`,
    `  margin-block-start:calc(${v('lineWidth')} * -1);`,
    `  margin-inline-start:calc(${v('lineWidth')} * -1);`,
    `  padding:0;`,
    `}`,

    // ---- 含页签 ----
    `${cls}-contain-tabs >div${head}{`,
    `  min-height:0;`,
    `}`,
    `${cls}-contain-tabs >div${head} ${headTitle},${cls}-contain-tabs >div${head} ${extra}{`,
    `  padding-top:${v('padding')};`,
    `}`,

    // ---- type=inner ----
    `${cls}-type-inner ${head}{`,
    `  padding:0 ${tv('header-padding')};`,
    `  background:${v('colorFillAlter')};`,
    `}`,
    `${cls}-type-inner ${headTitle}{`,
    `  font-size:${v('fontSize')};`,
    `}`,
    `${cls}-type-inner ${body}{`,
    `  padding:${v('padding')} ${tv('body-padding')};`,
    `}`,

    // ---- loading ----
    `${cls}-loading{`,
    `  overflow:hidden;`,
    `}`,
    `${cls}-loading ${body}{`,
    `  user-select:none;`,
    `}`,

    // ---- RTL ----
    `${cls}-rtl{`,
    `  direction:rtl;`,
    `}`,

    // ---- size=small ----
    `${cls}-small >${head}{`,
    `  min-height:${tv('header-height-sm')};`,
    `  padding:0 ${tv('header-padding-sm')};`,
    `  font-size:${tv('header-font-size-sm')};`,
    `}`,
    `${cls}-small >${head} >${headWrapper} >${extra}{`,
    `  font-size:${v('fontSize')};`,
    `}`,
    `${cls}-small >${body}{`,
    `  padding:${tv('body-padding-sm')};`,
    `}`,
    `${cls}-small${cls}-contain-tabs >${head} ${headTitle},${cls}-small${cls}-contain-tabs >${head} ${extra}{`,
    `  padding-top:0;`,
    `  display:flex;`,
    `  align-items:center;`,
    `}`,
  ].join('\n');
}
