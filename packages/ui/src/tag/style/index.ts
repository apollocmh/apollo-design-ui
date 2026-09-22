/**
 * Tag 的样式生成（base + preset + status 三个子样式单，antd 的
 * `tag/style/{index,presetCmp,statusCmp}.js` 产物逐条对齐 —— 提取自 extractStyle
 * 真实产物，cssVar 模式，全 var() 化）。
 *
 * ── 与 antd 产物的有意差异 ────────────────────────────────────────────────────
 *
 * 1. 无 hash/css-var 包裹类（D5）；3 个 Component Token 变量声明在根类（badge 范式）。
 * 2. `defaultBg` / `solidTextColor` 以 **seed 实色**落地（antd cssVar 产物同样是
 *    实色 #f5f5f5 / #fff —— 它们在 prepareComponentToken 里就是算好的）；
 *    `defaultColor` 走 var(--apollo-color-text)。
 * 3. `.anticon` 选择器用我们的 `.apollo-icon`（iconPrefixCls 对齐，result 范式）。
 * 4. resetComponent 全套（checklist #14：margin/padding/color/line-height/list-style）。
 */

import { token2CSSVar } from '@apollo-design/theme';
import { PRESET_COLORS } from '../../_internal/preset-color';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/** 状态色 → alias token 命名（antd 的 statusCmp：processing 用 Info 系）。 */
const STATUS_COLOR_MAP: Record<string, string> = {
  success: 'Success',
  processing: 'Info',
  error: 'Error',
  warning: 'Warning',
};

/**
 * 生成 Tag 的静态 CSS。
 *
 * @param rootPrefixCls 根前缀（`apollo` 或 `ant`）
 */
export function genTagStyle(rootPrefixCls: string): string {
  const cls = `.${rootPrefixCls}-tag`;
  const iconCls = `.${rootPrefixCls}-icon`;

  const rules: string[] = [
    // ---- Component Token（antd 的 .css-var-root 块；prepareComponentToken 产物）----
    `${cls}{`,
    `  --${rootPrefixCls}-tag-default-bg:#f5f5f5;`,
    `  --${rootPrefixCls}-tag-default-color:${v('colorText')};`,
    `  --${rootPrefixCls}-tag-solid-text-color:#fff;`,
    // resetComponent 全套（checklist #14）
    `  margin:0;`,
    `  padding:0;`,
    `  color:${v('colorText')};`,
    `  font-size:${v('fontSizeSM')};`,
    `  line-height:calc(${v('lineHeightSM')} * ${v('fontSizeSM')});`,
    `  list-style:none;`,
    `  font-family:${v('fontFamily')};`,
    // genBaseStyle
    `  display:inline-block;`,
    `  height:auto;`,
    `  padding-inline:calc(8px - ${v('lineWidth')});`,
    `  white-space:nowrap;`,
    `  background-color:var(--${rootPrefixCls}-tag-default-bg);`,
    `  border:${v('lineWidth')} ${v('lineType')} ${v('colorBorder')};`,
    `  border-radius:${v('borderRadiusSM')};`,
    `  opacity:1;`,
    `  transition:all ${v('motionDurationMid')};`,
    `  text-align:start;`,
    `  position:relative;`,
    `}`,

    // ---- RTL ----
    `${cls}${cls}-rtl{`,
    `  direction:rtl;`,
    `}`,

    // ---- 链接色 ----
    `${cls},${cls} a,${cls} a:hover{`,
    `  color:var(--${rootPrefixCls}-tag-default-color);`,
    `}`,

    // ---- close-icon ----
    `${cls} ${cls}-close-icon{`,
    `  margin-inline-start:calc(${v('paddingXXS')} - ${v('lineWidth')});`,
    `  font-size:calc(${v('fontSizeIcon')} - ${v('lineWidth')} * 2);`,
    `  color:${v('colorIcon')};`,
    `  cursor:pointer;`,
    `  transition:all ${v('motionDurationMid')};`,
    `}`,
    `${cls} ${cls}-close-icon:hover{`,
    `  color:${v('colorTextHeading')};`,
    `}`,

    // ---- checkable ----
    `${cls}-checkable{`,
    `  background-color:transparent;`,
    `  border-color:transparent;`,
    `  cursor:pointer;`,
    `}`,
    `${cls}-checkable:not(${cls}-checkable-checked):hover{`,
    `  color:${v('colorPrimary')};`,
    `  background-color:${v('colorFillSecondary')};`,
    `}`,
    `${cls}-checkable:active,${cls}-checkable-checked{`,
    `  color:${v('colorTextLightSolid')};`,
    `}`,
    `${cls}-checkable-checked{`,
    `  background-color:${v('colorPrimary')};`,
    `}`,
    `${cls}-checkable-checked:hover{`,
    `  background-color:${v('colorPrimaryHover')};`,
    `}`,
    `${cls}-checkable:active{`,
    `  background-color:${v('colorPrimaryActive')};`,
    `}`,
    `${cls}-checkable-disabled{`,
    `  cursor:not-allowed;`,
    `}`,
    `${cls}-checkable-disabled:not(${cls}-checkable-checked){`,
    `  color:${v('colorTextDisabled')};`,
    `}`,
    `${cls}-checkable-disabled:not(${cls}-checkable-checked):hover{`,
    `  background-color:transparent;`,
    `}`,
    `${cls}-checkable-disabled${cls}-checkable-checked{`,
    `  color:${v('colorTextDisabled')};`,
    `  background-color:${v('colorBgContainerDisabled')};`,
    `}`,
    `${cls}-checkable-disabled:hover,${cls}-checkable-disabled:active{`,
    `  background-color:${v('colorBgContainerDisabled')};`,
    `  color:${v('colorTextDisabled')};`,
    `}`,
    `${cls}-checkable-disabled:not(${cls}-checkable-checked):hover{`,
    `  color:${v('colorTextDisabled')};`,
    `}`,

    // ---- group ----
    `${cls}-checkable-group{`,
    `  display:flex;`,
    `  flex-wrap:wrap;`,
    `  gap:${v('paddingXS')};`,
    `}`,

    // ---- hidden ----
    `${cls}-hidden{`,
    `  display:none;`,
    `}`,

    // ---- 裸 svg 居中修正（antd 的注释：第三方图标无 .anticon 规则可达）----
    `${cls}>svg{`,
    `  display:inline-block;`,
    `  vertical-align:middle;`,
    `  margin-block-end:0.2em;`,
    `}`,

    // ---- 图标与文字间距 ----
    `${cls}>${iconCls}+span,${cls}>span+${iconCls},${cls}>svg+span,${cls}>span+svg{`,
    `  margin-inline-start:calc(8px - ${v('lineWidth')});`,
    `}`,

    // ---- variant: solid / filled ----
    `${cls}-solid{`,
    `  border-color:transparent;`,
    `  color:${v('colorTextLightSolid')};`,
    `  background-color:${v('colorBgSolid')};`,
    `}`,
    `${cls}-solid${cls}-default{`,
    `  color:var(--${rootPrefixCls}-tag-solid-text-color);`,
    `}`,
    `${cls}-filled{`,
    `  border-color:transparent;`,
    `  background-color:var(--${rootPrefixCls}-tag-default-bg);`,
    `}`,

    // ---- disabled 全套 ----
    `${cls}-disabled{`,
    `  color:${v('colorTextDisabled')};`,
    `  cursor:not-allowed;`,
    `  background-color:${v('colorBgContainerDisabled')};`,
    `}`,
    `${cls}-disabled a{`,
    `  cursor:not-allowed;`,
    `  pointer-events:none;`,
    `  color:${v('colorTextDisabled')};`,
    `}`,
    `${cls}-disabled a:hover{`,
    `  color:${v('colorTextDisabled')};`,
    `}`,
    `a${cls}-disabled:hover,a${cls}-disabled:active{`,
    `  color:${v('colorTextDisabled')};`,
    `}`,
    `${cls}-disabled${cls}-outlined{`,
    `  border-color:${v('colorBorderDisabled')};`,
    `}`,
    `${cls}-disabled${cls}-solid,${cls}-disabled${cls}-filled{`,
    `  color:${v('colorTextDisabled')};`,
    `}`,
    `${cls}-disabled${cls}-solid ${cls}-close-icon,${cls}-disabled${cls}-filled ${cls}-close-icon{`,
    `  color:${v('colorTextDisabled')};`,
    `}`,
    `${cls}-disabled ${cls}-close-icon{`,
    `  cursor:not-allowed;`,
    `  color:${v('colorTextDisabled')};`,
    `}`,
    `${cls}-disabled ${cls}-close-icon:hover{`,
    `  color:${v('colorTextDisabled')};`,
    `}`,
  ];

  // ---- 状态四色 × 三 variant（statusCmp：processing 用 Info 系）----
  for (const [status, cap] of Object.entries(STATUS_COLOR_MAP)) {
    const sel = `${cls}${cls}-${status}:not(${cls}-disabled)`;
    rules.push(
      `${sel}${cls}-outlined{`,
      `  background-color:${v(`color${cap}Bg`)};`,
      `  border-color:${v(`color${cap}Border`)};`,
      `  color:${v(`color${cap}`)};`,
      `}`,
      `${sel}${cls}-solid{`,
      `  background-color:${v(`color${cap}`)};`,
      `  border-color:${v(`color${cap}`)};`,
      `}`,
      `${sel}${cls}-filled{`,
      `  background-color:${v(`color${cap}Bg`)};`,
      `  color:${v(`color${cap}`)};`,
      `}`,
    );
  }

  // ---- 预设 13 色 × 三 variant（presetCmp 的 genPresetColor 产物）----
  for (const key of PRESET_COLORS) {
    const sel = `${cls}${cls}-${key}:not(${cls}-disabled)`;
    rules.push(
      `${sel}${cls}-outlined{`,
      `  background-color:${v(`${key}-1`)};`,
      `  border-color:${v(`${key}-3`)};`,
      `  color:${v(`${key}-7`)};`,
      `}`,
      `${sel}${cls}-solid{`,
      `  background-color:${v(`${key}-6`)};`,
      `  border-color:${v(`${key}-6`)};`,
      `  color:${v('colorTextLightSolid')};`,
      `}`,
      `${sel}${cls}-filled{`,
      `  background-color:${v(`${key}-1`)};`,
      `  color:${v(`${key}-7`)};`,
      `}`,
    );
  }

  return rules.join('\n');
}
