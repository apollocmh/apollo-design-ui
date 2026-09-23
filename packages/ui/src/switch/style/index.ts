/**
 * Switch 的样式生成（genSwitchStyle）。
 *
 * 契约来源：antd 6.6.4 `components/switch/style/index.ts`（445 行，五个 style 函数：
 * `genSwitchStyle` / `genSwitchInnerStyle` / `genSwitchHandleStyle` /
 * `genSwitchLoadingStyle` / `genSwitchSmallStyle`）+ `@ant-design/cssinjs` 2.1.2 的
 * `extractStyle(cache, { types: ['style','cssVar'] })` **实测产物**
 * （cssVar 模式，hash 已去掉，见 `docs/analysis/switch.md` §8）。
 *
 * ── 与 antd 产物的有意差异 ────────────────────────────────────────────────────
 *
 * 1. 无 hash / `-css-var` 包裹类（D5），也不复制 `box-sizing` 守卫规则
 *    （`.{cls}::before,.{cls}::after{box-sizing:border-box}` 那 4 条）。
 *    13 个 Component Token 声明从 `.css-var-_R_0_.apollo-switch` 落到 `.apollo-switch`。
 * 2. **13 个 token 是构建期算好的解析值**（`prepareComponentToken(getDesignToken())`）
 *    —— 与 antd 的 cssVar 产物逐字相同（`22px` / `44px` / …），代价是**不随主题缩放**
 *    （见 `style/token.ts` 文件头）。两个别名派生的**内部**量仍走 `var()`：
 *    `--apollo-opacity-loading` / `--apollo-color-primary` 等。
 * 3. `.anticon` → `.${rootPrefixCls}-icon`（iconPrefixCls 对齐，D14/D15；result/tag 范式）。
 * 4. 两个 antd 字面量（`border-radius:100px`、loading 图标色）按
 *    `CAPSULE_RADIUS_DECL` / `LOADING_ICON_COLOR_DECL` 消费（唯一真源在 `token.ts`）。
 * 5. **5 处 `@media (prefers-reduced-motion: reduce)`** 逐条保留（`genNoMotionStyle` /
 *    `genNoMotionRawStyle`）—— 与 radio（0 处）相反。⚠️ 同样**没有** `@media (hover: hover)`
 *    包裹（hover 是裸规则，与 radio 一致、与 checkbox 相反）。
 */

import { getDesignToken, token2CSSVar } from '@apollo-design/theme';
import {
  CAPSULE_RADIUS_DECL,
  type ComponentToken,
  LOADING_ICON_COLOR_DECL,
  prepareComponentToken,
  SWITCH_HANDLE_ACTIVE_INSET,
  SWITCH_LOADING_ICON_SIZE_SCALE,
} from './token';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/** Component Token 的 CSS 变量名（组件内消费用）。 */
const sv = (rootPrefixCls: string, name: string): string =>
  `var(--${rootPrefixCls}-switch-${name})`;

/** 构建期算出的 13 个 token 值（惰性：只有构建期调用 `gen()`）。 */
let tokenCache: ComponentToken | null = null;

function switchTokenValues(): ComponentToken {
  if (!tokenCache) {
    tokenCache = prepareComponentToken(getDesignToken());
  }
  return tokenCache;
}

/** 数字补 `px`（antd 的 `unit()` 语义）。 */
const px = (value: number | string): string => (typeof value === 'number' ? `${value}px` : value);

/**
 * Component Token 声明块（`prepareComponentToken` 的 **13** 个字段）。
 *
 * ⚠️ 值是**构建期算好的解析值**（与 antd 的 cssVar 产物逐字相同），不是 `calc()` 组合
 *    —— 理由见 `style/token.ts` 文件头（浮点会让 L6 亚像素漂移）。
 */
export function genTokenDecls(rootPrefixCls: string): string[] {
  const p = rootPrefixCls;
  const t = switchTokenValues();
  return [
    `  --${p}-switch-track-height:${px(t.trackHeight)};`,
    `  --${p}-switch-track-height-sm:${px(t.trackHeightSM)};`,
    `  --${p}-switch-track-min-width:${px(t.trackMinWidth)};`,
    `  --${p}-switch-track-min-width-sm:${px(t.trackMinWidthSM)};`,
    `  --${p}-switch-track-padding:${px(t.trackPadding)};`,
    `  --${p}-switch-handle-bg:${t.handleBg};`,
    `  --${p}-switch-handle-size:${px(t.handleSize)};`,
    `  --${p}-switch-handle-size-sm:${px(t.handleSizeSM)};`,
    `  --${p}-switch-handle-shadow:${t.handleShadow};`,
    `  --${p}-switch-inner-min-margin:${px(t.innerMinMargin)};`,
    `  --${p}-switch-inner-max-margin:${px(t.innerMaxMargin)};`,
    `  --${p}-switch-inner-min-margin-sm:${px(t.innerMinMarginSM)};`,
    `  --${p}-switch-inner-max-margin-sm:${px(t.innerMaxMarginSM)};`,
  ];
}

/**
 * `genNoMotionStyle()`：关闭过渡/动画。
 *
 * ⚠️ **伪元素要逐个展开**（PITFALLS 141 的 `a,b:hover` 陷阱）：cssinjs 的 `&` 指代
 *    **整个父选择器列表**，所以 `a,b` 的 `&::before` 展开成 `a::before,b::before`
 *    —— 若只拼在列表末尾（`a,b::before`），伪元素只作用于最后一项。
 *    实测产物顺序是「全部基选择器 → 全部 `::before` → 全部 `::after`」。
 */
function noMotion(selector: string): string[] {
  const items = selector.split(',').map((s) => s.trim());
  const list = [
    ...items,
    ...items.map((s) => `${s}::before`),
    ...items.map((s) => `${s}::after`),
  ].join(',');
  return [
    `@media (prefers-reduced-motion: reduce){`,
    `${list}{`,
    `  transition:none;`,
    `  animation:none;`,
    `}`,
    `}`,
  ];
}

/**
 * `genNoMotionRawStyle()`：只作用于选择器**本身**（不展开伪元素）。
 *
 * antd 对 `handle::before` 用的是这个变体 —— 再展开会得到 `::before::before` 这种
 * 非法选择器（实测产物确认：那一处只有 1 个选择器）。
 */
function noMotionRaw(selector: string): string[] {
  return [
    `@media (prefers-reduced-motion: reduce){`,
    `${selector}{`,
    `  transition:none;`,
    `  animation:none;`,
    `}`,
    `}`,
  ];
}

/**
 * 根段 —— antd 的 `genSwitchStyle`。
 *
 * ⚠️ `resetComponent` 全套（checklist #14）——antd 的 `genStyleHooks` 自动带这一段。
 */
function genSwitchRootStyle(p: string): string[] {
  const cls = `.${p}-switch`;
  const iconCls = `.${p}-icon`;

  return [
    `${cls}{`,
    ...genTokenDecls(p),
    // resetComponent 全套
    `  box-sizing:border-box;`,
    `  margin:0;`,
    `  padding:0;`,
    `  color:${v('colorText')};`,
    `  font-size:${v('fontSize')};`,
    `  line-height:${sv(p, 'track-height')};`,
    `  list-style:none;`,
    `  font-family:${v('fontFamily')};`,
    // genSwitchStyle
    `  position:relative;`,
    `  display:inline-block;`,
    `  min-width:${sv(p, 'track-min-width')};`,
    `  height:${sv(p, 'track-height')};`,
    `  vertical-align:middle;`,
    `  background:${v('colorTextQuaternary')};`,
    `  border:0;`,
    `  ${CAPSULE_RADIUS_DECL};`,
    `  cursor:pointer;`,
    `  transition:all ${v('motionDurationMid')};`,
    `  user-select:none;`,
    `}`,
    ...noMotion(cls),
    `${cls}:hover:not(${cls}-disabled){`,
    `  background:${v('colorTextTertiary')};`,
    `}`,
    // genFocusStyle
    `${cls}:focus-visible{`,
    `  outline:${v('lineWidthFocus')} solid ${v('colorPrimaryBorder')};`,
    `  outline-offset:1px;`,
    `  transition:outline-offset 0s,outline 0s;`,
    `}`,
    `${cls}${cls}-checked{`,
    `  background:${v('colorPrimary')};`,
    `}`,
    `${cls}${cls}-checked:hover:not(${cls}-disabled){`,
    `  background:${v('colorPrimaryHover')};`,
    `}`,
    `${cls}${cls}-loading,${cls}${cls}-disabled{`,
    `  cursor:not-allowed;`,
    `  opacity:${v('opacityLoading')};`,
    `}`,
    `${cls}${cls}-loading *,${cls}${cls}-disabled *{`,
    `  box-shadow:none;`,
    `  cursor:not-allowed;`,
    `}`,
    `${cls}${cls}-rtl{`,
    `  direction:rtl;`,
    `}`,
    // ---- loading 图标（genSwitchLoadingStyle）----
    `${cls} ${cls}-loading-icon${iconCls}{`,
    `  position:relative;`,
    `  top:calc((${sv(p, 'handle-size')} - ${v('fontSize')}) / 2);`,
    `  ${LOADING_ICON_COLOR_DECL};`,
    `  vertical-align:top;`,
    `}`,
    `${cls}${cls}-checked ${cls}-loading-icon{`,
    `  color:${v('colorPrimary')};`,
    `}`,
  ];
}

/** inner 段 —— antd 的 `genSwitchInnerStyle`。 */
function genSwitchInnerStyle(p: string): string[] {
  const cls = `.${p}-switch`;
  const innerCls = `${cls}-inner`;
  const handle = sv(p, 'handle-size');
  const padding = sv(p, 'track-padding');

  /** antd 的 `trackPaddingCalc` = `handleSize + trackPadding * 2`。 */
  const trackPaddingCalc = `calc(${handle} + ${padding} * 2)`;
  /** antd 的 `innerMaxMarginCalc` = `innerMaxMargin * 2`。 */
  const innerMaxMarginCalc = `calc(${sv(p, 'inner-max-margin')} * 2)`;

  return [
    `${cls} ${innerCls}{`,
    `  display:block;`,
    `  overflow:hidden;`,
    `  ${CAPSULE_RADIUS_DECL};`,
    `  height:100%;`,
    `  padding-inline-start:${sv(p, 'inner-max-margin')};`,
    `  padding-inline-end:${sv(p, 'inner-min-margin')};`,
    `  transition:padding-inline-start ${v('motionDurationMid')} ease-in-out,padding-inline-end ${v('motionDurationMid')} ease-in-out;`,
    `}`,
    ...noMotion(`${cls} ${innerCls}`),
    `${cls} ${innerCls} ${innerCls}-checked,${cls} ${innerCls} ${innerCls}-unchecked{`,
    `  display:flex;`,
    `  align-items:center;`,
    `  justify-content:center;`,
    `  color:${v('colorTextLightSolid')};`,
    `  font-size:${v('fontSizeSM')};`,
    `  pointer-events:none;`,
    `  min-height:${sv(p, 'track-height')};`,
    `  transition:margin-inline-start ${v('motionDurationMid')} ease-in-out,margin-inline-end ${v('motionDurationMid')} ease-in-out;`,
    `}`,
    ...noMotion(`${cls} ${innerCls} ${innerCls}-checked,${cls} ${innerCls} ${innerCls}-unchecked`),
    `${cls} ${innerCls} ${innerCls}-checked{`,
    `  margin-inline-start:calc(-100% + ${trackPaddingCalc} - ${innerMaxMarginCalc});`,
    `  margin-inline-end:calc(100% - ${trackPaddingCalc} + ${innerMaxMarginCalc});`,
    `}`,
    `${cls} ${innerCls} ${innerCls}-unchecked{`,
    `  margin-top:calc(${sv(p, 'track-height')} * -1);`,
    `  margin-inline-start:0;`,
    `  margin-inline-end:0;`,
    `}`,
    `${cls}${cls}-checked ${innerCls}{`,
    `  padding-inline-start:${sv(p, 'inner-min-margin')};`,
    `  padding-inline-end:${sv(p, 'inner-max-margin')};`,
    `}`,
    `${cls}${cls}-checked ${innerCls} ${innerCls}-checked{`,
    `  margin-inline-start:0;`,
    `  margin-inline-end:0;`,
    `}`,
    `${cls}${cls}-checked ${innerCls} ${innerCls}-unchecked{`,
    `  margin-inline-start:calc(100% - ${trackPaddingCalc} + ${innerMaxMarginCalc});`,
    `  margin-inline-end:calc(-100% + ${trackPaddingCalc} - ${innerMaxMarginCalc});`,
    `}`,
    // 按压反馈
    `${cls}:not(${cls}-disabled):active:not(${cls}-checked) ${innerCls} ${innerCls}-unchecked{`,
    `  margin-inline-start:calc(${padding} * 2);`,
    `  margin-inline-end:calc(${padding} * -1 * 2);`,
    `}`,
    `${cls}:not(${cls}-disabled):active${cls}-checked ${innerCls} ${innerCls}-checked{`,
    `  margin-inline-start:calc(${padding} * -1 * 2);`,
    `  margin-inline-end:calc(${padding} * 2);`,
    `}`,
  ];
}

/** handle 段 —— antd 的 `genSwitchHandleStyle`。 */
function genSwitchHandleStyle(p: string): string[] {
  const cls = `.${p}-switch`;
  const handleCls = `${cls}-handle`;

  return [
    `${cls} ${handleCls}{`,
    `  position:absolute;`,
    `  top:${sv(p, 'track-padding')};`,
    `  inset-inline-start:${sv(p, 'track-padding')};`,
    `  width:${sv(p, 'handle-size')};`,
    `  height:${sv(p, 'handle-size')};`,
    `  transition:all ${v('motionDurationMid')} ease-in-out;`,
    `}`,
    ...noMotion(`${cls} ${handleCls}`),
    `${cls} ${handleCls}::before{`,
    `  position:absolute;`,
    `  top:0;`,
    `  inset-inline-end:0;`,
    `  bottom:0;`,
    `  inset-inline-start:0;`,
    `  background-color:${sv(p, 'handle-bg')};`,
    `  border-radius:calc(${sv(p, 'handle-size')} / 2);`,
    `  box-shadow:${sv(p, 'handle-shadow')};`,
    `  transition:all ${v('motionDurationMid')} ease-in-out;`,
    `  content:"";`,
    `}`,
    ...noMotionRaw(`${cls} ${handleCls}::before`),
    `${cls}${cls}-checked ${handleCls}{`,
    `  inset-inline-start:calc(100% - calc(${sv(p, 'handle-size')} + ${sv(p, 'track-padding')}));`,
    `}`,
    `${cls}:not(${cls}-disabled):active ${handleCls}::before{`,
    `  inset-inline-end:${SWITCH_HANDLE_ACTIVE_INSET};`,
    `  inset-inline-start:0;`,
    `}`,
    `${cls}:not(${cls}-disabled):active${cls}-checked ${handleCls}::before{`,
    `  inset-inline-end:0;`,
    `  inset-inline-start:${SWITCH_HANDLE_ACTIVE_INSET};`,
    `}`,
  ];
}

/** small 段 —— antd 的 `genSwitchSmallStyle`。 */
function genSwitchSmallStyle(p: string): string[] {
  const cls = `.${p}-switch`;
  const smallCls = `${cls}-small`;
  const innerCls = `${cls}-inner`;
  const handleCls = `${cls}-handle`;

  const handleSM = sv(p, 'handle-size-sm');
  const padding = sv(p, 'track-padding');
  const trackPaddingCalc = `calc(${handleSM} + ${padding} * 2)`;
  const innerMaxMarginCalc = `calc(${sv(p, 'inner-max-margin-sm')} * 2)`;

  return [
    `${cls}${smallCls}{`,
    `  min-width:${sv(p, 'track-min-width-sm')};`,
    `  height:${sv(p, 'track-height-sm')};`,
    `  line-height:${sv(p, 'track-height-sm')};`,
    `}`,
    `${cls}${smallCls} ${innerCls}{`,
    `  padding-inline-start:${sv(p, 'inner-max-margin-sm')};`,
    `  padding-inline-end:${sv(p, 'inner-min-margin-sm')};`,
    `}`,
    `${cls}${smallCls} ${innerCls} ${innerCls}-checked,${cls}${smallCls} ${innerCls} ${innerCls}-unchecked{`,
    `  min-height:${sv(p, 'track-height-sm')};`,
    `}`,
    `${cls}${smallCls} ${innerCls} ${innerCls}-checked{`,
    `  margin-inline-start:calc(-100% + ${trackPaddingCalc} - ${innerMaxMarginCalc});`,
    `  margin-inline-end:calc(100% - ${trackPaddingCalc} + ${innerMaxMarginCalc});`,
    `}`,
    `${cls}${smallCls} ${innerCls} ${innerCls}-unchecked{`,
    `  margin-top:calc(${sv(p, 'track-height-sm')} * -1);`,
    `  margin-inline-start:0;`,
    `  margin-inline-end:0;`,
    `}`,
    `${cls}${smallCls} ${handleCls}{`,
    `  width:${handleSM};`,
    `  height:${handleSM};`,
    `}`,
    // ⚠️ small 的 loading 图标尺寸用的是 switchLoadingIconSize（内部 token）
    `${cls}${smallCls} ${cls}-loading-icon{`,
    `  top:calc((${handleSM} - calc(${v('fontSizeIcon')} * ${SWITCH_LOADING_ICON_SIZE_SCALE})) / 2);`,
    `  font-size:calc(${v('fontSizeIcon')} * ${SWITCH_LOADING_ICON_SIZE_SCALE});`,
    `}`,
    `${cls}${smallCls}${cls}-checked ${innerCls}{`,
    `  padding-inline-start:${sv(p, 'inner-min-margin-sm')};`,
    `  padding-inline-end:${sv(p, 'inner-max-margin-sm')};`,
    `}`,
    `${cls}${smallCls}${cls}-checked ${innerCls} ${innerCls}-checked{`,
    `  margin-inline-start:0;`,
    `  margin-inline-end:0;`,
    `}`,
    `${cls}${smallCls}${cls}-checked ${innerCls} ${innerCls}-unchecked{`,
    `  margin-inline-start:calc(100% - ${trackPaddingCalc} + ${innerMaxMarginCalc});`,
    `  margin-inline-end:calc(-100% + ${trackPaddingCalc} - ${innerMaxMarginCalc});`,
    `}`,
    `${cls}${smallCls}${cls}-checked ${handleCls}{`,
    `  inset-inline-start:calc(100% - calc(${handleSM} + ${sv(p, 'track-padding')}));`,
    `}`,
    `${cls}${smallCls}:not(${cls}-disabled):active:not(${cls}-checked) ${innerCls} ${innerCls}-unchecked{`,
    `  margin-inline-start:calc(${v('marginXXS')} / 2);`,
    `  margin-inline-end:calc(${v('marginXXS')} * -1 / 2);`,
    `}`,
    `${cls}${smallCls}:not(${cls}-disabled):active${cls}-checked ${innerCls} ${innerCls}-checked{`,
    `  margin-inline-start:calc(${v('marginXXS')} * -1 / 2);`,
    `  margin-inline-end:calc(${v('marginXXS')} / 2);`,
    `}`,
  ];
}

/**
 * 生成 Switch 的静态 CSS。
 *
 * @param rootPrefixCls 根前缀（`apollo` 或 `ant`）
 */
export function genSwitchStyle(rootPrefixCls: string): string {
  const p = rootPrefixCls;
  return [
    ...genSwitchRootStyle(p),
    ...genSwitchInnerStyle(p),
    ...genSwitchHandleStyle(p),
    ...genSwitchSmallStyle(p),
  ].join('\n');
}
