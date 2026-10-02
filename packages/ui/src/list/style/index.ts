/**
 * List 的样式生成（G4 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/list/style/index.js`（460 行）。选择器结构
 * **从真实产物提取**，不是推演 —— 可复现命令：
 *
 * ```sh
 * node tests/visual/debug/extract-list-css.mjs > /tmp/list-antd.css
 * node -e "…按 } 切规则…"      # 见 docs/analysis/list.md §3
 * ```
 *
 * 产物共 **62 条**含 `ant-list` 的规则；本文件产出 **57 条**，差掉的 5 条是：
 * - `resetComponent` 的 **4 条** `box-sizing` 块（`BASE_CSS` 已覆盖，badge/card/avatar 范式）
 * - 1 条 `.data-ant-cssinjs-cache-path`（cssinjs 的缓存标记，**不是 CSS**）
 *
 * ── 从产物里抄下来的五处**非显然**结构 ────────────────────────────────────────
 *
 * 1. 🚨 **css-var 声明块覆盖两个根**：`.{p}-list` **与** `.{p}-list-container`
 *    （上游 `genStyleHooks` 的 `extraCssVarPrefixCls`）⇒ D95 家族判据
 *    （image 两根 / input 三根）。`.{p}-list-container` 同时是 grid 的 `Row` 与非 grid 的 `<ul>`。
 * 2. 🚨 **`-action` 是死选择器**（产物第 57 条）：源码写的是 `${componentCls}-action`，
 *    而 `Item` 渲染出的真实类名是 `-item-action` ⇒ 这条规则**永不命中**。
 *    **逐字保留**（radio 的 U7/U8 同类）—— 改成 `-item-action` 会凭空多出上游没有的窄屏左边距。
 * 3. 🚨 **两条 media 的冒号后空格不同**：`(max-width:768px)`（screenMD，无空格）与
 *    `(max-width: 576px)`（screenSM，有空格）—— 源码 `genResponsiveStyle` 就是这样写的，
 *    写统一了会与产物分叉。
 * 4. **`-grid` / `-pagination-options` / `-spin-container` 用的是 `antCls`**（`.apollo-col` /
 *    `.apollo-pagination-options` / `.apollo-spin-container`），不是 componentCls。
 * 5. **两个 `calc()` 必须保留为表达式**：`innerCornerBorderRadius` 与
 *    `-item-action-split` 的 `height` —— 上游的 cssinjs `token.calc` 产出的就是 calc。
 *
 * ── 这个函数证明什么 / 不证明什么 ────────────────────────────────────────────
 *
 * 证明：57 条规则的**选择器结构与声明顺序**与产物逐条对应；11 个 Component Token 的
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

function listTokenValues(): ComponentToken {
  if (!tokenCache) {
    tokenCache = prepareComponentToken(getDesignToken()) as ComponentToken;
  }
  return tokenCache;
}

/** 数字带 `px`、字符串原样 —— 与 cssinjs 的 `unit()` 同义。 */
const unit = (value: number | string): string =>
  typeof value === 'number' ? `${value}px` : String(value);

/**
 * Component Token 的声明块（**11** 个字段，构建期解析值）。
 *
 * ⚠️ 顺序与产物的 css-var 块一致（`content-width` → `item-padding` → `item-padding-sm` →
 * `item-padding-lg` → `header-bg` → `footer-bg` → `empty-text-padding` →
 * `meta-margin-bottom` → `avatar-margin-right` → `title-margin-bottom` →
 * `description-font-size`）。
 */
export function genTokenDecls(rootPrefixCls: string): string[] {
  const p = rootPrefixCls;
  const t = listTokenValues();
  return [
    `  --${p}-list-content-width:${unit(t.contentWidth)};`,
    `  --${p}-list-item-padding:${t.itemPadding};`,
    `  --${p}-list-item-padding-sm:${t.itemPaddingSM};`,
    `  --${p}-list-item-padding-lg:${t.itemPaddingLG};`,
    `  --${p}-list-header-bg:${t.headerBg};`,
    `  --${p}-list-footer-bg:${t.footerBg};`,
    `  --${p}-list-empty-text-padding:${unit(t.emptyTextPadding)};`,
    `  --${p}-list-meta-margin-bottom:${unit(t.metaMarginBottom)};`,
    `  --${p}-list-avatar-margin-right:${unit(t.avatarMarginRight)};`,
    `  --${p}-list-title-margin-bottom:${unit(t.titleMarginBottom)};`,
    `  --${p}-list-description-font-size:${unit(t.descriptionFontSize)};`,
  ];
}

export function genListStyle(rootPrefixCls: string): string {
  const p = rootPrefixCls;
  const cls = `.${p}-list`;
  const item = `${cls}-item`;
  const meta = `${item}-meta`;
  const action = `${item}-action`;
  const ant = `.${p}`;
  /** Component Token 的变量引用（`--{p}-list-*`）。 */
  const tv = (name: string): string => `var(--${p}-list-${name})`;

  return [
    // ---- 根：cssinjs 包裹层 + resetComponent 展开（box-sizing 块不产出）+ genBaseStyle ----
    `${cls}{`,
    // 🚨 **Component Token 的声明块必须内联在根规则里**（anchor / breadcrumb / card / avatar 同一写法）。
    //    漏了它 = 11 个 `--apollo-list-*` **全部未声明** ⇒ `padding:var(...)` 静默失效
    //    （未定义 var 不是回退默认值，而是 invalid at computed-value time）。
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
    // ⚠️ 自定义属性名**不是** `--apollo-*`（供 virtual-list 复用），B7 不管它，但**必须逐字保留**。
    `  --rc-virtual-list-scrollbar-bg:${v('colorSplit')};`,
    `}`,
    // 🚨 **声明块必须覆盖**两个根形态****（D95 家族，image 两根 / input 三根同判）：
    //    上游的 `extraCssVarPrefixCls` 让 css-var 块同时挂 `.ant-list` 与 `.ant-list-container`。
    //    本仓无 `-css-var` 类 ⇒ 等价做法是让声明块同时挂在这两个选择器上。
    //    ⚠️ 今天 `.{p}-list-container` **总是** `.{p}-list` 的后代（grid 的 Row / 非 grid 的 ul），
    //    所以变量靠继承已可达 —— 这条规则是**逐字对齐产物** + 防未来形态变化（如浮层化）。
    `${cls}-container{`,
    ...genTokenDecls(p),
    `}`,
    `${cls} *{`,
    `  outline:none;`,
    `}`,

    // ---- header / footer ----
    `${cls} ${cls}-header{`,
    `  background:${tv('header-bg')};`,
    `}`,
    `${cls} ${cls}-footer{`,
    `  background:${tv('footer-bg')};`,
    `}`,
    `${cls} ${cls}-header,${cls} ${cls}-footer{`,
    `  padding-block:${v('paddingSM')};`,
    `}`,

    // ---- pagination ----
    `${cls} ${cls}-pagination{`,
    `  margin-block-start:${v('marginLG')};`,
    `}`,
    // ⚠️ 用的是 **antCls**（`.apollo-pagination-options`），不是 componentCls
    `${cls} ${cls}-pagination ${ant}-pagination-options{`,
    `  text-align:start;`,
    `}`,

    // ---- spin / items ----
    `${cls} ${cls}-spin{`,
    `  min-height:${v('controlHeightLG')};`,
    `  text-align:center;`,
    `}`,
    `${cls} ${cls}-items{`,
    `  margin:0;`,
    `  padding:0;`,
    `  list-style:none;`,
    `}`,

    // ---- item ----
    `${item}{`,
    `  display:flex;`,
    `  align-items:center;`,
    `  justify-content:space-between;`,
    `  padding:${tv('item-padding')};`,
    `  color:${v('colorText')};`,
    `}`,

    // ---- item-meta ----
    `${item} ${meta}{`,
    `  display:flex;`,
    `  flex:1;`,
    `  align-items:flex-start;`,
    `  max-width:100%;`,
    `}`,
    `${item} ${meta} ${meta}-avatar{`,
    `  margin-inline-end:${tv('avatar-margin-right')};`,
    `}`,
    `${item} ${meta} ${meta}-content{`,
    `  flex:1 0;`,
    `  width:0;`,
    `  color:${v('colorText')};`,
    `}`,
    `${item} ${meta} ${meta}-title{`,
    `  margin:0 0 ${v('marginXXS')} 0;`,
    `  color:${v('colorText')};`,
    `  font-size:${v('fontSize')};`,
    `  line-height:${v('lineHeight')};`,
    `}`,
    `${item} ${meta} ${meta}-title >a{`,
    `  color:${v('colorText')};`,
    `  transition:all ${v('motionDurationSlow')};`,
    `}`,
    `${item} ${meta} ${meta}-title >a:hover{`,
    `  color:${v('colorPrimary')};`,
    `}`,
    `${item} ${meta} ${meta}-description{`,
    `  color:${v('colorTextDescription')};`,
    `  font-size:${tv('description-font-size')};`,
    `  line-height:${v('lineHeight')};`,
    `}`,

    // ---- item-action ----
    `${item} ${action}{`,
    `  flex:0 0 auto;`,
    `  margin-inline-start:${v('marginXXL')};`,
    `  padding:0;`,
    `  font-size:0;`,
    `  list-style:none;`,
    `}`,
    `${item} ${action}>li{`,
    `  position:relative;`,
    `  display:inline-block;`,
    `  padding:0 ${v('paddingXS')};`,
    `  color:${v('colorTextDescription')};`,
    `  font-size:${v('fontSize')};`,
    `  line-height:${v('lineHeight')};`,
    `  text-align:center;`,
    `}`,
    `${item} ${action}>li:first-child{`,
    `  padding-inline-start:0;`,
    `}`,
    `${item} ${action} ${action}-split{`,
    `  position:absolute;`,
    `  inset-block-start:50%;`,
    `  inset-inline-end:0;`,
    `  width:${v('lineWidth')};`,
    // ⚠️ 必须保留 `calc()` —— 上游 cssinjs 的 `token.calc` 产出的就是表达式（预计算成字面量会分叉）
    `  height:calc(${v('fontHeight')} - ${v('marginXXS')} * 2);`,
    `  transform:translateY(-50%);`,
    `  background-color:${v('colorSplit')};`,
    `}`,

    // ---- empty / no-flex ----
    `${cls} ${cls}-empty{`,
    `  padding:${v('padding')} 0;`,
    `  color:${v('colorTextDescription')};`,
    `  font-size:${v('fontSizeSM')};`,
    `  text-align:center;`,
    `}`,
    `${cls} ${cls}-empty-text{`,
    `  padding:${tv('empty-text-padding')};`,
    `  color:${v('colorTextDisabled')};`,
    `  font-size:${v('fontSize')};`,
    `  text-align:center;`,
    `}`,
    `${cls} ${cls}-item-no-flex{`,
    `  display:block;`,
    `}`,

    // ---- grid（用的是 antCls 的 -col）----
    `${cls}-grid ${ant}-col>${item}{`,
    `  display:block;`,
    `  max-width:100%;`,
    `  margin-block-end:${v('margin')};`,
    `  padding-block:0;`,
    `  border-block-end:none;`,
    `}`,

    // ---- vertical ----
    `${cls}-vertical ${item}{`,
    `  align-items:initial;`,
    `}`,
    `${cls}-vertical ${item} ${item}-main{`,
    `  display:block;`,
    `  flex:1;`,
    `}`,
    `${cls}-vertical ${item} ${item}-extra{`,
    `  margin-inline-start:${v('marginLG')};`,
    `}`,
    `${cls}-vertical ${item} ${meta}{`,
    `  margin-block-end:${tv('meta-margin-bottom')};`,
    `}`,
    `${cls}-vertical ${item} ${meta} ${meta}-title{`,
    `  margin-block-start:0;`,
    `  margin-block-end:${tv('title-margin-bottom')};`,
    `  color:${v('colorText')};`,
    `  font-size:${v('fontSizeLG')};`,
    `  line-height:${v('lineHeightLG')};`,
    `}`,
    `${cls}-vertical ${item} ${action}{`,
    `  margin-block-start:${v('padding')};`,
    `  margin-inline-start:auto;`,
    `}`,
    `${cls}-vertical ${item} ${action} >li{`,
    `  padding:0 ${v('padding')};`,
    `}`,
    `${cls}-vertical ${item} ${action} >li:first-child{`,
    `  padding-inline-start:0;`,
    `}`,

    // ---- split ----
    `${cls}-split ${item}{`,
    `  border-block-end:${v('lineWidth')} ${v('lineType')} ${v('colorSplit')};`,
    `}`,
    `${cls}-split ${item}:last-child{`,
    `  border-block-end:none;`,
    `}`,
    `${cls}-split ${cls}-header{`,
    `  border-block-end:${v('lineWidth')} ${v('lineType')} ${v('colorSplit')};`,
    `}`,
    `${cls}-split${cls}-empty ${cls}-footer{`,
    `  border-top:${v('lineWidth')} ${v('lineType')} ${v('colorSplit')};`,
    `}`,

    // ---- loading / something-after-last-item（跨组件：spin 的类名）----
    `${cls}-loading ${cls}-spin-nested-loading{`,
    `  min-height:${v('controlHeight')};`,
    `}`,
    // ⚠️ 用的是 **antCls**（`.apollo-spin-container`）
    `${cls}-split${cls}-something-after-last-item ${ant}-spin-container>${cls}-items>${item}:last-child{`,
    `  border-block-end:${v('lineWidth')} ${v('lineType')} ${v('colorSplit')};`,
    `}`,

    // ---- size ----
    `${cls}-lg ${item}{`,
    `  padding:${tv('item-padding-lg')};`,
    `}`,
    `${cls}-sm ${item}{`,
    `  padding:${tv('item-padding-sm')};`,
    `}`,

    // ---- 非 vertical 时 no-flex 的 action 浮动 ----
    `${cls}:not(${cls}-vertical) ${cls}-item-no-flex ${action}{`,
    `  float:right;`,
    `}`,

    // ---- bordered ----
    `${cls}-bordered{`,
    `  border:${v('lineWidth')} ${v('lineType')} ${v('colorBorder')};`,
    `  border-radius:${v('borderRadiusLG')};`,
    `}`,
    // ⚠️ 必须保留 `calc()` —— `borderRadiusLG - lineWidth`，上游产物就是 calc 表达式
    `${cls}-bordered ${cls}-header{`,
    `  border-radius:calc(${v('borderRadiusLG')} - ${v('lineWidth')}) calc(${v('borderRadiusLG')} - ${v('lineWidth')}) 0 0;`,
    `}`,
    `${cls}-bordered ${cls}-footer{`,
    `  border-radius:0 0 calc(${v('borderRadiusLG')} - ${v('lineWidth')}) calc(${v('borderRadiusLG')} - ${v('lineWidth')});`,
    `}`,
    `${cls}-bordered ${cls}-header,${cls}-bordered ${cls}-footer,${cls}-bordered ${item}{`,
    `  padding-inline:${v('paddingLG')};`,
    `}`,
    `${cls}-bordered ${cls}-pagination{`,
    `  margin:${v('margin')} ${v('marginLG')};`,
    `}`,
    `${cls}-bordered${cls}-sm ${item},${cls}-bordered${cls}-sm ${cls}-header,${cls}-bordered${cls}-sm ${cls}-footer{`,
    `  padding:${tv('item-padding-sm')};`,
    `}`,
    `${cls}-bordered${cls}-lg ${item},${cls}-bordered${cls}-lg ${cls}-header,${cls}-bordered${cls}-lg ${cls}-footer{`,
    `  padding:${tv('item-padding-lg')};`,
    `}`,

    // ---- 响应式（🚨 两条 media 的冒号后空格不同，逐字保留）----
    // ⚠️ 断点必须用**字面量**（768 = screenMD / 576 = screenSM 的默认值）：
    //    CSS 变量在 `@media` 的 media feature 里**非法**（浏览器整条忽略）——
    //    与 back-top / badge 同判（主题覆盖 alias token 不改变断点，已知边界）。
    `@media screen and (max-width:768px){`,
    `${cls} ${item} ${action}{`,
    `  margin-inline-start:${v('marginLG')};`,
    `}`,
    `${cls}-vertical ${item} ${item}-extra{`,
    `  margin-inline-start:${v('marginLG')};`,
    `}`,
    `}`,
    `@media screen and (max-width: 576px){`,
    `${cls} ${item}{`,
    `  flex-wrap:wrap;`,
    `}`,
    // 🚨 上游的**死选择器**：写的是 `-action`，真实类名是 `-item-action` ⇒ 永不命中。逐字保留。
    `${cls} ${item} ${cls}-action{`,
    `  margin-inline-start:${v('marginSM')};`,
    `}`,
    `${cls}-vertical ${item}{`,
    `  flex-wrap:wrap-reverse;`,
    `}`,
    `${cls}-vertical ${item} ${item}-main{`,
    `  min-width:${tv('content-width')};`,
    `}`,
    `${cls}-vertical ${item} ${item}-extra{`,
    `  margin:auto auto ${v('margin')};`,
    `}`,
    `}`,
  ].join('\n');
}
