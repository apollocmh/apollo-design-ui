/** Breadcrumb static CSS. Original selector reference: antd 6.6.4 (MIT).
 * Apollo owns current content/button semantics, accessible colours and theme variables.
 */

import { getDesignToken, token2CSSVar } from '@apollo-design/theme';
import { type ComponentToken, prepareComponentToken } from './token';

/** token 名 → `var(--apollo-*)`。变量名由 theme 包的命名函数给出，不手写字面量。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

let tokenCache: ComponentToken | null = null;

function breadcrumbTokenValues(): ComponentToken {
  if (!tokenCache) {
    tokenCache = prepareComponentToken(getDesignToken());
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
  const action = `${item} button${link}`;
  const icon = `.${p}-icon`;

  /** Component Token 的变量引用（`--{p}-breadcrumb-*`）。 */
  const tv = (name: string): string => `var(--${p}-breadcrumb-${name})`;

  return [
    // ---- resetComponent 展开（box-sizing 块不产出：BASE_CSS 已覆盖）----
    `${cls}{`,
    // 🚨 **Component Token 的声明块必须内联在根规则里**（anchor / cascader /
    //    input-number / segmented / date-picker 同一写法）。漏了它 = 7 个
    //    `--apollo-breadcrumb-*` **全部未声明** ⇒ `margin-inline: var(...)` 静默失效
    //    （实测：L6 的 24 个变体**全部** block-diff，分隔符两侧没有 8px 间距）。
    ...genTokenDecls(p),
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
    `${item} a,${action}{`,
    `  color:${tv('link-color')};`,
    `  transition:color ${v('motionDurationMid')};`,
    `  padding:0 ${v('paddingXXS')};`,
    `  border-radius:${v('borderRadiusSM')};`,
    `  height:${v('fontHeight')};`,
    `  display:inline-block;`,
    `  margin-inline:calc(${v('marginXXS')} * -1);`,
    `}`,
    `${item} a:hover,${action}:hover{`,
    `  color:${tv('link-hover-color')};`,
    `  background-color:${v('colorBgTextHover')};`,
    `}`,
    // antd 的 `genFocusStyle`
    `${item} a:focus-visible,${action}:focus-visible{`,
    `  outline:${v('lineWidthFocus')} solid ${v('colorPrimaryBorder')};`,
    `  outline-offset:1px;`,
    `  transition:outline-offset 0s,outline 0s;`,
    `}`,

    `${action}{border:0;background:transparent;font:inherit;line-height:inherit;cursor:pointer;}`,

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

    // A menu button owns its focus and events separately from the navigation link.
    `${cls}-menu-trigger{`,
    `  display:inline-flex;`,
    `  align-items:center;`,
    `  justify-content:center;`,
    `  min-width:24px;`,
    `  min-height:24px;`,
    `  vertical-align:middle;`,
    `  appearance:none;`,
    `  border:0;`,
    `  background:transparent;`,
    `  color:inherit;`,
    `  font:inherit;`,
    `  padding:0;`,
    `  margin-inline-start:${v('marginXXS')};`,
    `  cursor:pointer;`,
    `  line-height:inherit;`,
    `  border-radius:${v('borderRadiusSM')};`,
    `}`,
    `${cls}-menu-trigger .${p}-icon{font-size:${v('fontSizeIcon')};}`,
    `${cls}-menu-trigger:focus-visible{`,
    `  outline:${v('lineWidthFocus')} solid ${v('colorPrimaryBorder')};`,
    `  outline-offset:1px;`,
    `}`,
    `${cls}-menu-trigger:disabled{cursor:default;}`,

    // ---- RTL ----
    `${cls}.${p}-breadcrumb-rtl{`,
    `  direction:rtl;`,
    `}`,
  ].join('\n');
}
