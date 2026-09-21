/**
 * Badge 的样式生成（Badge + ScrollNumber + Ribbon）。
 *
 * 契约来源：antd 6.6.4 的 `es/badge/style/index.js` + `style/ribbon.js`。
 * 选择器结构、属性、取值**逐条对齐真实产物**（用 `@ant-design/cssinjs`
 * 的 `extractStyle` 渲染 badge 十个形态提取，非推演）。
 *
 * ── 与 antd 产物的有意差异 ────────────────────────────────────────────────────
 *
 * 1. 无 CSS-in-JS 的 `:where(.css-dev-only-...)` hash 包裹（差异 D5）；
 *    keyframes 名不带 hash —— 前缀派生（spin 的范式）。
 * 2. `resetComponent` 的 box-sizing 重复块不产出（`BASE_CSS` 已覆盖，spin 范式）。
 * 3. Component Token 的 9 个 CSS 变量声明在 `.apollo-badge` / `.apollo-ribbon-wrapper`
 *    上（antd 声明在 `.css-var-root.*` 上；语义等价，见 token.ts 说明）。
 * 4. 上游事实：`.apollo-scroll-number-only >p.apollo-scroll-number-only-unit` 的
 *    `p` 标签与 SingleNumber 实际渲染的 `<span>` 不匹配 —— antd 自身如此，逐字保留。
 *
 * ── 这个函数没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明**视觉**正确（L6 的逐像素比对负责）。
 *   - 没证明动画观感一致（keyframes 定义逐字相同，但 L6 截图时动画不在比对面）。
 */

import { token2CSSVar } from '@apollo-design/theme';
import { PRESET_COLORS } from '../../_internal/preset-color';
import {
  DOT_SIZE,
  INDICATOR_HEIGHT,
  INDICATOR_HEIGHT_SM,
  PADDING_INLINE,
  STATUS_SIZE,
  TEXT_FONT_SIZE,
  TEXT_FONT_SIZE_SM,
  TEXT_FONT_WEIGHT,
} from './token';

/** token 名 → `var(--apollo-*)`。变量名由 theme 包的命名函数给出，不手写字面量。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/**
 * 生成 Badge 的全部静态 CSS（badge + scroll-number + ribbon）。
 *
 * @param rootPrefixCls 根前缀（`apollo` 或 `ant`）—— badge/scroll-number/ribbon 类名的根
 */
export function genBadgeStyle(rootPrefixCls: string): string {
  const b = `.${rootPrefixCls}-badge`;
  const s = `.${rootPrefixCls}-scroll-number`;
  const r = `.${rootPrefixCls}-ribbon`;

  // ---- keyframes（antd 的 antStatusProcessing / antZoomBadgeIn|Out / antNoWrapperZoomBadgeIn|Out / antBadgeLoadingCircle）----
  // 名字前缀派生（spin 范式）；定义体与 antd 逐字相同。
  const kfStatusProcessing = `${rootPrefixCls}-badge-status-processing`;
  const kfZoomIn = `${rootPrefixCls}-badge-zoom-in`;
  const kfZoomOut = `${rootPrefixCls}-badge-zoom-out`;
  const kfNoWrapperIn = `${rootPrefixCls}-badge-no-wrapper-zoom-in`;
  const kfNoWrapperOut = `${rootPrefixCls}-badge-no-wrapper-zoom-out`;
  const kfLoadingCircle = `${rootPrefixCls}-badge-loading-circle`;

  const rules: string[] = [
    // ---- Component Token 声明（antd 的 .css-var-root.{prefix} 块）----
    `${b}{`,
    `  --${rootPrefixCls}-badge-indicator-z-index:auto;`,
    `  --${rootPrefixCls}-badge-indicator-height:${INDICATOR_HEIGHT}px;`,
    `  --${rootPrefixCls}-badge-indicator-height-sm:${INDICATOR_HEIGHT_SM}px;`,
    `  --${rootPrefixCls}-badge-dot-size:${DOT_SIZE}px;`,
    `  --${rootPrefixCls}-badge-text-font-size:${TEXT_FONT_SIZE}px;`,
    `  --${rootPrefixCls}-badge-text-font-size-sm:${TEXT_FONT_SIZE_SM}px;`,
    `  --${rootPrefixCls}-badge-text-font-weight:${TEXT_FONT_WEIGHT};`,
    `  --${rootPrefixCls}-badge-status-size:${STATUS_SIZE}px;`,
    `  --${rootPrefixCls}-badge-padding-inline:${PADDING_INLINE}px;`,
    `}`,
    `${r}-wrapper{`,
    `  --${rootPrefixCls}-badge-indicator-z-index:auto;`,
    `  --${rootPrefixCls}-badge-indicator-height:${INDICATOR_HEIGHT}px;`,
    `  --${rootPrefixCls}-badge-indicator-height-sm:${INDICATOR_HEIGHT_SM}px;`,
    `  --${rootPrefixCls}-badge-dot-size:${DOT_SIZE}px;`,
    `  --${rootPrefixCls}-badge-text-font-size:${TEXT_FONT_SIZE}px;`,
    `  --${rootPrefixCls}-badge-text-font-size-sm:${TEXT_FONT_SIZE_SM}px;`,
    `  --${rootPrefixCls}-badge-text-font-weight:${TEXT_FONT_WEIGHT};`,
    `  --${rootPrefixCls}-badge-status-size:${STATUS_SIZE}px;`,
    `  --${rootPrefixCls}-badge-padding-inline:${PADDING_INLINE}px;`,
    `}`,

    // ---- keyframes ----
    `@keyframes ${kfStatusProcessing}{0%{transform:scale(0.8);opacity:0.5;}100%{transform:scale(2.4);opacity:0;}}`,
    `@keyframes ${kfZoomIn}{0%{transform:scale(0) translate(50%, -50%);opacity:0;}100%{transform:scale(1) translate(50%, -50%);}}`,
    `@keyframes ${kfZoomOut}{0%{transform:scale(1) translate(50%, -50%);}100%{transform:scale(0) translate(50%, -50%);opacity:0;}}`,
    `@keyframes ${kfNoWrapperIn}{0%{transform:scale(0);opacity:0;}100%{transform:scale(1);}}`,
    `@keyframes ${kfNoWrapperOut}{0%{transform:scale(1);}100%{transform:scale(0);opacity:0;}}`,
    `@keyframes ${kfLoadingCircle}{0%{transform-origin:50%;}100%{transform:translate(50%, -50%) rotate(360deg);transform-origin:50%;}}`,

    // ---- resetComponent 展开（badge 根）----
    `${b}{`,
    `  margin:0;`,
    `  padding:0;`,
    `  color:${v('colorText')};`,
    `  font-size:${v('fontSize')};`,
    `  line-height:1;`,
    `  list-style:none;`,
    `  font-family:${v('fontFamily')};`,
    `  position:relative;`,
    `  display:inline-block;`,
    `  width:fit-content;`,
    `}`,

    // ---- count（数字指示器）----
    `${b} ${b}-count{`,
    `  display:inline-flex;`,
    `  justify-content:center;`,
    `  z-index:var(--${rootPrefixCls}-badge-indicator-z-index);`,
    `  min-width:var(--${rootPrefixCls}-badge-indicator-height);`,
    `  height:var(--${rootPrefixCls}-badge-indicator-height);`,
    `  color:${v('colorTextLightSolid')};`,
    `  font-weight:var(--${rootPrefixCls}-badge-text-font-weight);`,
    `  font-size:var(--${rootPrefixCls}-badge-text-font-size);`,
    `  line-height:var(--${rootPrefixCls}-badge-indicator-height);`,
    `  white-space:nowrap;`,
    `  text-align:center;`,
    `  background:${v('colorError')};`,
    `  border-radius:calc(var(--${rootPrefixCls}-badge-indicator-height) / 2);`,
    `  box-shadow:0 0 0 ${v('lineWidth')} ${v('colorBorderBg')};`,
    `  transition:background-color ${v('motionDurationMid')};`,
    `}`,
    `${b} ${b}-count a{`,
    `  color:${v('colorTextLightSolid')};`,
    `}`,
    `${b} ${b}-count a:hover{`,
    `  color:${v('colorTextLightSolid')};`,
    `}`,
    `a:hover ${b} ${b}-count{`,
    `  background:${v('colorErrorHover')};`,
    `}`,
    `${b} ${b}-count-sm{`,
    `  min-width:var(--${rootPrefixCls}-badge-indicator-height-sm);`,
    `  height:var(--${rootPrefixCls}-badge-indicator-height-sm);`,
    `  font-size:var(--${rootPrefixCls}-badge-text-font-size-sm);`,
    `  line-height:var(--${rootPrefixCls}-badge-indicator-height-sm);`,
    `  border-radius:calc(var(--${rootPrefixCls}-badge-indicator-height-sm) / 2);`,
    `}`,
    `${b} ${b}-multiple-words{`,
    `  padding-inline:var(--${rootPrefixCls}-badge-padding-inline);`,
    `}`,
    `${b} ${b}-multiple-words bdi{`,
    `  unicode-bidi:plaintext;`,
    `}`,

    // ---- dot（小红点）----
    `${b} ${b}-dot{`,
    `  z-index:var(--${rootPrefixCls}-badge-indicator-z-index);`,
    `  width:var(--${rootPrefixCls}-badge-dot-size);`,
    `  min-width:var(--${rootPrefixCls}-badge-dot-size);`,
    `  height:var(--${rootPrefixCls}-badge-dot-size);`,
    `  background:${v('colorError')};`,
    `  border-radius:100%;`,
    `  box-shadow:0 0 0 ${v('lineWidth')} ${v('colorBorderBg')};`,
    `}`,
    `${b} ${b}-count,${b} ${b}-dot,${b} ${s}-custom-component{`,
    `  position:absolute;`,
    `  top:0;`,
    `  inset-inline-end:0;`,
    `  transform:translate(50%, -50%);`,
    `  transform-origin:100% 0%;`,
    `}`,
    `${b} ${b}-count.anticon-spin,${b} ${b}-dot.anticon-spin,${b} ${s}-custom-component.anticon-spin{`,
    `  animation-name:${kfLoadingCircle};`,
    `  animation-duration:1s;`,
    `  animation-iteration-count:infinite;`,
    `  animation-timing-function:linear;`,
    `}`,

    // ---- status（状态点）----
    `${b}.${b.slice(1)}-status{`,
    `  line-height:inherit;`,
    `  vertical-align:baseline;`,
    `}`,
    `${b}.${b.slice(1)}-status ${b}-status-dot{`,
    `  position:relative;`,
    `  top:-1px;`,
    `  display:inline-block;`,
    `  width:var(--${rootPrefixCls}-badge-status-size);`,
    `  height:var(--${rootPrefixCls}-badge-status-size);`,
    `  vertical-align:middle;`,
    `  border-radius:50%;`,
    `}`,
    `${b}.${b.slice(1)}-status ${b}-status-success{`,
    `  background-color:${v('colorSuccess')};`,
    `}`,
    `${b}.${b.slice(1)}-status ${b}-status-processing{`,
    `  overflow:visible;`,
    `  color:${v('colorInfoTextHover')};`,
    `  background-color:${v('colorInfo')};`,
    `  border-color:currentcolor;`,
    `}`,
    `${b}.${b.slice(1)}-status ${b}-status-processing::after{`,
    `  position:absolute;`,
    `  top:0;`,
    `  inset-inline-start:0;`,
    `  width:100%;`,
    `  height:100%;`,
    `  border-width:${v('lineWidth')};`,
    `  border-style:solid;`,
    `  border-color:inherit;`,
    `  border-radius:50%;`,
    `  animation-name:${kfStatusProcessing};`,
    `  animation-duration:1.2s;`,
    `  animation-iteration-count:infinite;`,
    `  animation-timing-function:ease-in-out;`,
    `  content:"";`,
    `}`,
    `${b}.${b.slice(1)}-status ${b}-status-default{`,
    `  background-color:${v('colorTextPlaceholder')};`,
    `}`,
    `${b}.${b.slice(1)}-status ${b}-status-error{`,
    `  background-color:${v('colorError')};`,
    `}`,
    `${b}.${b.slice(1)}-status ${b}-status-warning{`,
    `  background-color:${v('colorWarning')};`,
    `}`,
    `${b}.${b.slice(1)}-status ${b}-status-text{`,
    `  margin-inline-start:${v('marginXS')};`,
    `  color:${v('colorText')};`,
    `  font-size:${v('fontSize')};`,
    `}`,
  ];

  // ---- 预设色（antd 的 genPresetColor：&{componentCls} {componentCls}-color-{key} 的复合选择器逐字保留）----
  for (const key of PRESET_COLORS) {
    rules.push(
      `${b}.${b.slice(1)} ${b}-color-${key}{`,
      `  background:${v(`${key}-6`)};`,
      `}`,
      `${b}.${b.slice(1)} ${b}-color-${key}:not(${b}-count){`,
      `  color:${v(`${key}-6`)};`,
      `}`,
      `a:hover ${b}.${b.slice(1)} ${b}-color-${key}{`,
      `  background:${v(`${key}-6`)};`,
      `}`,
    );
  }

  rules.push(
    // ---- zoom 动画类（CSSMotion 的 motionName: {prefix}-zoom 驱动）----
    `${b} ${b}-zoom-appear,${b} ${b}-zoom-enter{`,
    `  animation-name:${kfZoomIn};`,
    `  animation-duration:${v('motionDurationSlow')};`,
    `  animation-timing-function:${v('motionEaseOutBack')};`,
    `  animation-fill-mode:both;`,
    `}`,
    `${b} ${b}-zoom-leave{`,
    `  animation-name:${kfZoomOut};`,
    `  animation-duration:${v('motionDurationSlow')};`,
    `  animation-timing-function:${v('motionEaseOutBack')};`,
    `  animation-fill-mode:both;`,
    `}`,
    `${b}.${b.slice(1)}-not-a-wrapper ${b}-zoom-appear,${b}.${b.slice(1)}-not-a-wrapper ${b}-zoom-enter{`,
    `  animation-name:${kfNoWrapperIn};`,
    `  animation-duration:${v('motionDurationSlow')};`,
    `  animation-timing-function:${v('motionEaseOutBack')};`,
    `}`,
    `${b}.${b.slice(1)}-not-a-wrapper ${b}-zoom-leave{`,
    `  animation-name:${kfNoWrapperOut};`,
    `  animation-duration:${v('motionDurationSlow')};`,
    `  animation-timing-function:${v('motionEaseOutBack')};`,
    `}`,
    `${b}.${b.slice(1)}-not-a-wrapper:not(${b}-status){`,
    `  vertical-align:middle;`,
    `}`,
    `${b}.${b.slice(1)}-not-a-wrapper ${s}-custom-component,${b}.${b.slice(1)}-not-a-wrapper ${b}-count{`,
    `  transform:none;`,
    `}`,
    `${b}.${b.slice(1)}-not-a-wrapper ${s}-custom-component,${b}.${b.slice(1)}-not-a-wrapper ${s}{`,
    `  position:relative;`,
    `  top:auto;`,
    `  display:block;`,
    `  transform-origin:50% 50%;`,
    `}`,

    // ---- scroll-number（数字滚动）----
    `${b} ${s}{`,
    `  overflow:hidden;`,
    `  transition:all ${v('motionDurationMid')} ${v('motionEaseOutBack')};`,
    `}`,
    `${b} ${s} ${s}-only{`,
    `  position:relative;`,
    `  display:inline-block;`,
    `  height:var(--${rootPrefixCls}-badge-indicator-height);`,
    `  transition:all ${v('motionDurationSlow')} ${v('motionEaseOutBack')};`,
    `  -webkit-transform-style:preserve-3d;`,
    `  -webkit-backface-visibility:hidden;`,
    `}`,
    `${b} ${s} ${s}-only >p.${rootPrefixCls}-scroll-number-only-unit{`,
    `  height:var(--${rootPrefixCls}-badge-indicator-height);`,
    `  margin:0;`,
    `  -webkit-transform-style:preserve-3d;`,
    `  -webkit-backface-visibility:hidden;`,
    `}`,
    `${b} ${s} ${s}-symbol{`,
    `  vertical-align:top;`,
    `}`,

    // ---- RTL ----
    `${b}-rtl{`,
    `  direction:rtl;`,
    `}`,
    `${b}-rtl ${b}-count,${b}-rtl ${b}-dot,${b}-rtl ${s}-custom-component{`,
    `  transform:translate(-50%, -50%);`,
    `}`,

    // ---- Ribbon（antd 的 genRibbonStyle）----
    `${r}-wrapper{`,
    `  font-family:${v('fontFamily')};`,
    `  font-size:${v('fontSize')};`,
    `  position:relative;`,
    `}`,
    `${r}{`,
    `  margin:0;`,
    `  padding:0 ${v('paddingXS')};`,
    `  color:${v('colorPrimary')};`,
    `  font-size:${v('fontSize')};`,
    `  line-height:${v('fontHeight')};`,
    `  list-style:none;`,
    `  font-family:${v('fontFamily')};`,
    `  position:absolute;`,
    `  top:${v('marginXS')};`,
    `  white-space:nowrap;`,
    `  background-color:${v('colorPrimary')};`,
    `  border-radius:${v('borderRadiusSM')};`,
    `}`,
    `${r} ${r}-content{`,
    `  color:${v('colorTextLightSolid')};`,
    `}`,
    `${r} ${r}-corner{`,
    `  position:absolute;`,
    `  top:100%;`,
    `  width:${v('marginXS')};`,
    `  height:${v('marginXS')};`,
    `  color:currentcolor;`,
    `  border:calc(${v('marginXS')} / 2) solid;`,
    `  transform:scaleY(0.75);`,
    `  transform-origin:top;`,
    `  filter:brightness(75%);`,
    `}`,
  );

  // Ribbon 预设色（ribbon 的 genPresetColor：单前缀复合，无双写）
  for (const key of PRESET_COLORS) {
    rules.push(
      `${r}.${r.slice(1)}-color-${key}{`,
      `  background:${v(`${key}-6`)};`,
      `  color:${v(`${key}-6`)};`,
      `}`,
    );
  }

  rules.push(
    `${r}.${r.slice(1)}-placement-end{`,
    `  inset-inline-end:calc(${v('marginXS')} * -1);`,
    `  border-end-end-radius:0;`,
    `}`,
    `${r}.${r.slice(1)}-placement-end ${r}-corner{`,
    `  inset-inline-end:0;`,
    `  border-inline-end-color:transparent;`,
    `  border-block-end-color:transparent;`,
    `}`,
    `${r}.${r.slice(1)}-placement-start{`,
    `  inset-inline-start:calc(${v('marginXS')} * -1);`,
    `  border-end-start-radius:0;`,
    `}`,
    `${r}.${r.slice(1)}-placement-start ${r}-corner{`,
    `  inset-inline-start:0;`,
    `  border-block-end-color:transparent;`,
    `  border-inline-start-color:transparent;`,
    `}`,
    `${r}-rtl{`,
    `  direction:rtl;`,
    `}`,
  );

  return rules.join('\n');
}
