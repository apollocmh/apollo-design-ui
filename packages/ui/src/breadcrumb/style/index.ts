/**
 * Breadcrumb 的样式生成（G4 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/breadcrumb/style/index.js`（177 行）。
 * 选择器结构**从真实产物提取**，不是推演 —— 可复现命令：
 *
 * ```sh
 * # React SSR + cssinjs extractStyle（与 tests/visual/debug/extract-*-css.mjs 同一套路）
 * node /tmp/bc-extract/extract.mjs | grep -o '[^{}]*ant-breadcrumb[^{}]*{[^{}]*}'
 * ```
 *
 * 产物共 **21 条** `ant-breadcrumb` 规则；本文件产出 **18 条**，差掉的 4 条是
 * `resetComponent` 的 `box-sizing` 重复块（`BASE_CSS` 已覆盖，`badge` / `spin` 范式）。
 *
 * ── 从产物里抄下来的三处**非显然**结构 ────────────────────────────────────────
 *
 * 1. **`iconCls` 是后代选择器**：`.{p} .apollo-icon { font-size: iconFontSize }`
 *    —— 不是 `.{p}-icon`。`.anticon` → `.apollo-icon`（D15）。
 * 2. **`.{p}-link > svg` 是「裸 svg」专用规则**（第三方图标库直接渲染 `<svg>`，
 *    `.apollo-icon` 的 reset 够不到它）⇒ `display:inline-block` + `vertical-align:middle`
 *    + `margin-block-end:0.2em`。兄弟选择器那一组有 **4 个**分支
 *    （`.apollo-icon + span` / `.apollo-icon + a` / `svg + span` / `svg + a`）。
 * 3. **`-overlay-link` 的 hover 有两条**：`.{p}-overlay-link:hover a { color: … }`
 *    与 `.{p}-overlay-link a:hover { background-color: transparent }` ——
 *    少了第二条，内层链接会多出一层 hover 底色。
 *
 * ── 这个函数证明什么 / 不证明什么 ────────────────────────────────────────────
 *
 * 证明：18 条规则的**选择器结构与声明顺序**与产物逐条对应；7 个 Component Token 的
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

function breadcrumbTokenValues(): ComponentToken {
  if (!tokenCache) {
    tokenCache = prepareComponentToken(getDesignToken()) as ComponentToken;
  }
  return tokenCache;
}

/**
 * Component Token 的声明块（**7** 个字段，构建期解析值）。
 *
 * ⚠️ 顺序与产物一致（`item-color` → `last-item-color` → `icon-font-size` → `link-color`
 * → `link-hover-color` → `separator-color` → `separator-margin`）。
 * ⚠️ 颜色是**解析后的字面量**（如 `rgba(0,0,0,0.45)`），不是 `var(--apollo-color-*)` ——
 * 零运行时下 `tokens.css` 是构建期产物，与 antd 的产物逐字一致（D7 家族）。
 */
export function genTokenDecls(rootPrefixCls: string): string[] {
  const p = rootPrefixCls;
  const t = breadcrumbTokenValues();
  return [
    `  --${p}-breadcrumb-item-color:${t.itemColor};`,
    `  --${p}-breadcrumb-last-item-color:${t.lastItemColor};`,
    `  --${p}-breadcrumb-icon-font-size:${t.iconFontSize}px;`,
    `  --${p}-breadcrumb-link-color:${t.linkColor};`,
    `  --${p}-breadcrumb-link-hover-color:${t.linkHoverColor};`,
    `  --${p}-breadcrumb-separator-color:${t.separatorColor};`,
    `  --${p}-breadcrumb-separator-margin:${t.separatorMargin}px;`,
  ];
}

export function genBreadcrumbStyle(rootPrefixCls: string): string {
  const p = rootPrefixCls;
  const cls = `.${p}-breadcrumb`;
  const item = `${cls}-item`;
  const separator = `${cls}-separator`;
  const link = `${cls}-link`;
  const overlayLink = `${cls}-overlay-link`;
  const icon = `.${p}-icon`;

  /** Component Token 的变量引用（`--{p}-breadcrumb-*`）。 */
  const tv = (name: string): string => `var(--${p}-breadcrumb-${name})`;

  return [
    // ---- resetComponent 展开（box-sizing 块不产出：BASE_CSS 已覆盖）----
    `${cls}{`,
    `  margin:0;`,
    `  padding:0;`,
    `  color:${tv('item-color')};`,
    `  font-size:${v('fontSize')};`,
    `  line-height:${v('lineHeight')};`,
    `  list-style:none;`,
    `  font-family:${v('fontFamily')};`,
    `}`,

    // ---- 图标大小（**后代**选择器，不是 `-icon` 后缀）----
    `${cls} ${icon}{`,
    `  font-size:${tv('icon-font-size')};`,
    `}`,

    // ---- 列表 ----
    `${cls} ol{`,
    `  display:flex;`,
    `  flex-wrap:wrap;`,
    `  margin:0;`,
    `  padding:0;`,
    `  list-style:none;`,
    `}`,

    // ---- 链接（只作用于 `a`；非链接项是 `<span>`，没有这层内边距与 hover）----
    `${item} a{`,
    `  color:${tv('link-color')};`,
    `  transition:color ${v('motionDurationMid')};`,
    `  padding:0 ${v('paddingXXS')};`,
    `  border-radius:${v('borderRadiusSM')};`,
    `  height:${v('fontHeight')};`,
    `  display:inline-block;`,
    `  margin-inline:calc(${v('marginXXS')} * -1);`,
    `}`,
    `${item} a:hover{`,
    `  color:${tv('link-hover-color')};`,
    `  background-color:${v('colorBgTextHover')};`,
    `}`,
    // antd 的 `genFocusStyle`
    `${item} a:focus-visible{`,
    `  outline:${v('lineWidthFocus')} solid ${v('colorPrimaryBorder')};`,
    `  outline-offset:1px;`,
    `  transition:outline-offset 0s,outline 0s;`,
    `}`,

    // ---- 最后一项 ----
    `${item}:last-child{`,
    `  color:${tv('last-item-color')};`,
    `}`,

    // ---- 分隔符 ----
    `${separator}{`,
    `  margin-inline:${tv('separator-margin')};`,
    `  color:${tv('separator-color')};`,
    `}`,

    // ---- 链接里的图标（裸 svg 与 `.apollo-icon` 两条路径）----
    `${link} >svg{`,
    `  display:inline-block;`,
    `  vertical-align:middle;`,
    `  margin-block-end:0.2em;`,
    `}`,
    `${[`${link} >${icon} +span`, `${link} >${icon} +a`, `${link} >svg +span`, `${link} >svg +a`].join(`,`)}{`,
    `  margin-inline-start:${v('marginXXS')};`,
    `}`,

    // ---- 带下拉的那一项（`menu`）----
    `${overlayLink}{`,
    `  border-radius:${v('borderRadiusSM')};`,
    `  height:${v('fontHeight')};`,
    `  display:inline-block;`,
    `  padding:0 ${v('paddingXXS')};`,
    `  margin-inline:calc(${v('marginXXS')} * -1);`,
    `}`,
    `${overlayLink} >${icon}{`,
    `  margin-inline-start:${v('marginXXS')};`,
    `  font-size:${v('fontSizeIcon')};`,
    `}`,
    `${overlayLink}:hover{`,
    `  color:${tv('link-hover-color')};`,
    `  background-color:${v('colorBgTextHover')};`,
    `}`,
    `${overlayLink}:hover a{`,
    `  color:${tv('link-hover-color')};`,
    `}`,
    // ⚠️ 少这一条，内层链接会多出一层 hover 底色
    `${overlayLink} a:hover{`,
    `  background-color:transparent;`,
    `}`,

    // ---- RTL ----
    `${cls}.${p}-breadcrumb-rtl{`,
    `  direction:rtl;`,
    `}`,
  ].join('\n');
}
