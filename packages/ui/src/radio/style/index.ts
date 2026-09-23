/**
 * Radio 的样式生成（genRadioStyle）。
 *
 * 契约来源：antd 6.6.4 `components/radio/style/index.ts`（716 行，三段：
 * `getGroupRadioStyle` / `getRadioBasicStyle` / `getRadioButtonStyle`）+
 * `@ant-design/cssinjs` 2.1.2 的 `extractStyle(cache, { types: ['style','cssVar'] })`
 * **实测产物**（cssVar 模式，hash 已去掉，见 `docs/analysis/radio.md` §8 附录）。
 *
 * ── 与 antd 产物的有意差异 ────────────────────────────────────────────────────
 *
 * 1. 无 hash / `-css-var` 包裹类（D5）。antd 的 16 个 Component Token 声明在
 *    `.css-var-_R_0_.apollo-radio-css-var` 上（该类被同时挂在 Group 的根 div 与
 *    Radio 的 wrapper label 上）—— 本仓等价落到
 *    `.apollo-radio-group,.apollo-radio-wrapper,.apollo-radio-button-wrapper` 三处。
 * 2. Token 落 **var() 别名派生**（本仓约定；antd cssVar 产物是实值）—— 随主题自适应。
 *    **例外两个 unitless 量**：`radioSize` / `dotSize` 在 antd 产物里是**无单位数字**
 *    （`16` / `6`），消费侧写 `calc(var(--apollo-radio-radio-size) * 1px)`。
 *    若改成 `var(--apollo-font-size-lg)`（= `16px`）会得到 `calc(16px * 1px)` —— 非法，
 *    width/height 整条失效。CSS 无法把一个长度「去单位」成数字，所以这两个按默认主题
 *    算成常量（badge 的 `indicatorHeight=20` 同判，登记「不随主题缩放」的边界）。
 * 3. `radioFocusShadow` / `radioButtonFocusShadow`（RadioToken 的 mergeToken 产物）
 *    在实测产物里**从未被 var() 消费** —— 焦点环走的是 `genFocusOutline`
 *    （`outline:var(--apollo-line-width-focus) solid var(--apollo-color-primary-border)`）。
 *    与 spin 的「声明但未消费」同判，不落成变量。
 * 4. antd 的 `.anticon` / `antCls` 引用：本组件无图标，产物里唯一一处 `${antCls}`
 *    拼出的是 `.apollo-button-wrapper`（**上游笔误**，见 §8 差异登记）—— 逐字保留。
 * 5. hover 规则**不包** `@media (hover: hover) and (pointer: fine)`
 *    （checkbox 有、radio 没有 —— 两边的 style 源码差异，实测产物确认）。
 *    同样地 radio **没有** `prefers-reduced-motion` 段。
 */

import { token2CSSVar } from '@apollo-design/theme';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/** Component Token 的 CSS 变量名（组件内消费用）。 */
const cv = (rootPrefixCls: string, name: string): string => `var(--${rootPrefixCls}-radio-${name})`;

/**
 * Component Token 声明块（`prepareComponentToken` 的 **16** 个字段）。
 *
 * ⚠️ `radio-size` / `dot-size` 是 **unitless 常量**（见文件头 §2），其余全部 var() 派生。
 */
export function genTokenDecls(rootPrefixCls: string): string[] {
  const p = rootPrefixCls;
  return [
    // ---- Radio（3）----
    // ⚠️ unitless：antd 产物为 `16`（= fontSizeLG），消费侧 `calc(… * 1px)`
    `  --${p}-radio-radio-size:16;`,
    // ⚠️ unitless：antd 产物为 `6`（= radioSize - (dotPadding 4 + lineWidth 1) * 2）
    `  --${p}-radio-dot-size:6;`,
    `  --${p}-radio-dot-color-disabled:${v('colorTextDisabled')};`,
    // ---- Radio buttons（11）----
    `  --${p}-radio-button-solid-checked-color:${v('colorTextLightSolid')};`,
    `  --${p}-radio-button-solid-checked-bg:${v('colorPrimary')};`,
    `  --${p}-radio-button-solid-checked-hover-bg:${v('colorPrimaryHover')};`,
    `  --${p}-radio-button-solid-checked-active-bg:${v('colorPrimaryActive')};`,
    `  --${p}-radio-button-bg:${v('colorBgContainer')};`,
    `  --${p}-radio-button-checked-bg:${v('colorBgContainer')};`,
    `  --${p}-radio-button-color:${v('colorText')};`,
    `  --${p}-radio-button-checked-bg-disabled:${v('controlItemBgActiveDisabled')};`,
    `  --${p}-radio-button-checked-color-disabled:${v('colorTextDisabled')};`,
    `  --${p}-radio-button-padding-inline:calc(${v('padding')} - ${v('lineWidth')});`,
    `  --${p}-radio-wrapper-margin-inline-end:${v('marginXS')};`,
    // ---- internal（2，wireframe=false 分支）----
    `  --${p}-radio-radio-color:${v('colorWhite')};`,
    `  --${p}-radio-radio-bg-color:${v('colorPrimary')};`,
  ];
}

/**
 * resetComponent —— antd 的 `genStyleHooks` 会自动带上这一段，手写样式最容易漏。
 *
 * ⚠️ checklist #14：是**完整 reset**（margin/padding/color/line-height/list-style/
 * font-family/box-sizing），不是只补 font-family + font-size。
 */
function resetComponent(token: string, lineHeight: string, extra: string[] = []): string[] {
  return [
    `  box-sizing:border-box;`,
    `  margin:0;`,
    `  padding:0;`,
    `  color:${token};`,
    `  line-height:${lineHeight};`,
    `  list-style:none;`,
    `  font-family:${v('fontFamily')};`,
    ...extra,
  ];
}

/**
 * Group 段 —— antd 的 `getGroupRadioStyle`。
 *
 * 含 badge 伴随选择器（Badge 已收口，逐条保留）与 vertical × first/last 全组合。
 */
function genGroupRadioStyle(p: string): string[] {
  const groupCls = `.${p}-radio-group`;
  const buttonWrapperCls = `.${p}-radio-button-wrapper`;
  const badgeCls = `.${p}-badge`;
  const badgeCountCls = `.${p}-badge-count`;

  /**
   * antd 的 `genVerticalBadgeButtonStyle(radius)` —— vertical 形态下 badge 包裹的
   * 按钮边框合并（base / large / small 三档只差 radius）。
   *
   * ⚠️ 参数是 **token 名**而不是已求值的 `var(...)` 串：E10 的硬编码圆角启发式按
   *    **源码文本**判断（只放行 `var(` / `calc(` / `inherit` / `${v(` / `N%` / `0`），
   *    写成 `border-radius:${radius}` 会被判成硬编码 —— 这是**真问题**的启发式，
   *    不绕过（改写法而不是加豁免）。
   */
  const genVerticalBadge = (radiusToken: string, prefix: string): string[] => [
    `${prefix} >${badgeCls}{`,
    `  width:auto;`,
    `}`,
    `${prefix} >${badgeCls}>${buttonWrapperCls}{`,
    `  width:100%;`,
    `}`,
    `${prefix} >${badgeCls}:not(:last-child){`,
    `  margin-block-end:calc(${v('lineWidth')} * -1);`,
    `}`,
    `${prefix} >${badgeCls}>${buttonWrapperCls}:not(:last-child){`,
    `  margin-block-end:0;`,
    `}`,
    `${prefix} >${badgeCls}:first-child>${buttonWrapperCls}{`,
    `  border-start-start-radius:${v(radiusToken)};`,
    `  border-start-end-radius:${v(radiusToken)};`,
    `  border-end-start-radius:0;`,
    `  border-end-end-radius:0;`,
    `}`,
    `${prefix} >${badgeCls}:last-child>${buttonWrapperCls}{`,
    `  border-start-start-radius:0;`,
    `  border-start-end-radius:0;`,
    `  border-end-start-radius:${v(radiusToken)};`,
    `  border-end-end-radius:${v(radiusToken)};`,
    `}`,
    `${prefix} >${badgeCls}:not(:first-child):not(:last-child)>${buttonWrapperCls}{`,
    `  border-radius:0;`,
    `}`,
    `${prefix} >${badgeCls}:first-child:last-child>${buttonWrapperCls}{`,
    `  border-radius:${v(radiusToken)};`,
    `}`,
  ];

  const verticalCls = `${groupCls}-vertical`;

  return [
    // ---- Component Token 声明（antd 的 `.css-var-root.apollo-radio-css-var` 块）----
    `${groupCls}{`,
    ...genTokenDecls(p),
    ...resetComponent(v('colorText'), v('lineHeight'), [
      `  font-size:0;`,
      `  display:inline-block;`,
    ]),
    `}`,
    `${groupCls}${groupCls}-rtl{`,
    `  direction:rtl;`,
    `}`,
    `${groupCls}${groupCls}-block{`,
    `  display:flex;`,
    `}`,
    `${groupCls} ${badgeCls} ${badgeCountCls}{`,
    `  z-index:1;`,
    `}`,
    // ⚠️ 上游笔误：`${antCls}-button-wrapper` 在 prefixCls=apollo 下拼成
    //    `.apollo-button-wrapper`（radio 的按钮 wrapper 实际叫 `.apollo-radio-button-wrapper`）
    //    ⇒ 这条规则恒不命中。逐字保留（§8 差异登记 UPSTREAM）。
    `${groupCls} >${badgeCls}:not(:first-child)>.${p}-button-wrapper{`,
    `  border-inline-start:none;`,
    `}`,
    // ---- vertical ----
    `${verticalCls}{`,
    `  display:flex;`,
    `  flex-direction:column;`,
    `  row-gap:${v('marginXS')};`,
    `}`,
    `${verticalCls}:has(> ${buttonWrapperCls}, > ${badgeCls} > ${buttonWrapperCls}){`,
    `  row-gap:0;`,
    `}`,
    `${verticalCls} .${p}-radio-wrapper{`,
    `  margin-inline-end:0;`,
    `}`,
    ...genVerticalBadge('borderRadius', verticalCls),
    ...genVerticalBadge('borderRadiusLG', `${verticalCls}${groupCls}-large`),
    ...genVerticalBadge('borderRadiusSM', `${verticalCls}${groupCls}-small`),
  ];
}

/** Basic 段 —— antd 的 `getRadioBasicStyle`。 */
function genRadioBasicStyle(p: string): string[] {
  const wrapperCls = `.${p}-radio-wrapper`;
  const radioCls = `.${p}-radio`;
  const inputCls = `${radioCls}-input`;

  return [
    // ---- Component Token 声明（Radio 的 wrapper label 上也挂 `-css-var`）----
    `${wrapperCls}{`,
    ...genTokenDecls(p),
    ...resetComponent(v('colorText'), v('lineHeight'), [
      `  font-size:${v('fontSize')};`,
      `  display:inline-flex;`,
      `  align-items:baseline;`,
      `  margin-inline-start:0;`,
      `  margin-inline-end:${cv(p, 'wrapper-margin-inline-end')};`,
      `  cursor:pointer;`,
    ]),
    `}`,
    `${wrapperCls}:last-child{`,
    `  margin-inline-end:0;`,
    `}`,
    `${wrapperCls}${wrapperCls}-rtl{`,
    `  direction:rtl;`,
    `}`,
    `${wrapperCls}-disabled{`,
    `  cursor:not-allowed;`,
    `  color:${v('colorTextDisabled')};`,
    `}`,
    // 基线占位（antd 的 `::after { content: '\a0' }`）
    `${wrapperCls}::after{`,
    `  display:inline-block;`,
    `  width:0;`,
    `  overflow:hidden;`,
    `  content:"\\a0";`,
    `}`,
    `${wrapperCls}-block{`,
    `  flex:1;`,
    `  justify-content:center;`,
    `}`,
    // ---- 圆点本体 ----
    `${wrapperCls} ${radioCls}{`,
    ...resetComponent(v('colorText'), '1', [
      `  font-size:${v('fontSize')};`,
      `  position:relative;`,
      `  white-space:nowrap;`,
      `  cursor:pointer;`,
      `  align-self:center;`,
      `  display:block;`,
      `  width:calc(${cv(p, 'radio-size')} * 1px);`,
      `  height:calc(${cv(p, 'radio-size')} * 1px);`,
      `  background-color:${v('colorBgContainer')};`,
      `  border:${v('lineWidth')} ${v('lineType')} ${v('colorBorder')};`,
      `  border-radius:50%;`,
      `  transition:all ${v('motionDurationMid')};`,
      `  flex:none;`,
    ]),
    `}`,
    `${wrapperCls} ${radioCls}:after{`,
    `  content:"";`,
    `  position:absolute;`,
    `  top:50%;`,
    `  left:50%;`,
    `  transform:translate(-50%, -50%) scale(0);`,
    `  width:calc(${cv(p, 'dot-size')} * 1px);`,
    `  height:calc(${cv(p, 'dot-size')} * 1px);`,
    `  background-color:${cv(p, 'radio-color')};`,
    `  border-radius:50%;`,
    `  transform-origin:50% 50%;`,
    `  opacity:0;`,
    `  transition:all ${v('motionDurationSlow')} ${v('motionEaseInOutCirc')};`,
    `}`,
    `${wrapperCls} ${radioCls} ${inputCls}{`,
    `  position:absolute;`,
    `  inset:0;`,
    `  z-index:1;`,
    `  cursor:pointer;`,
    `  opacity:0;`,
    `  margin:0;`,
    `}`,
    // 焦点环（genFocusOutline）
    `${wrapperCls} ${radioCls}:has(${inputCls}:focus-visible){`,
    `  outline:${v('lineWidthFocus')} solid ${v('colorPrimaryBorder')};`,
    `  outline-offset:1px;`,
    `  transition:outline-offset 0s,outline 0s;`,
    `}`,
    // hover（⚠️ radio 无 `@media (hover: hover)` 包裹，见文件头 §5）
    `${wrapperCls}:hover:not(${wrapperCls}-disabled) ${radioCls}{`,
    `  border-color:${v('colorPrimary')};`,
    `}`,
    `${wrapperCls}:hover ${radioCls}-checked:not(${radioCls}-disabled){`,
    `  background-color:${v('colorPrimaryHover')};`,
    `  border-color:transparent;`,
    `}`,
    // checked
    `${wrapperCls} ${radioCls}-checked{`,
    `  background-color:${cv(p, 'radio-bg-color')};`,
    `  border-color:${v('colorPrimary')};`,
    `}`,
    `${wrapperCls} ${radioCls}-checked::after{`,
    `  transform:translate(-50%, -50%);`,
    `  opacity:1;`,
    `}`,
    // disabled
    `${wrapperCls} ${radioCls}-disabled{`,
    `  background:${v('colorBgContainerDisabled')};`,
    `  border-color:${v('colorBorder')};`,
    `}`,
    `${wrapperCls} ${radioCls}-disabled,${wrapperCls} ${radioCls}-disabled ${inputCls}{`,
    `  cursor:not-allowed;`,
    `  pointer-events:none;`,
    `}`,
    `${wrapperCls} ${radioCls}-disabled::after{`,
    `  background-color:${cv(p, 'dot-color-disabled')};`,
    `}`,
    `${wrapperCls} ${radioCls}-disabled+span{`,
    `  color:${v('colorTextDisabled')};`,
    `  cursor:not-allowed;`,
    `}`,
    // label 的左右内边距
    `${wrapperCls} span${radioCls}+*{`,
    `  padding-inline-start:${v('paddingXS')};`,
    `  padding-inline-end:${v('paddingXS')};`,
    `}`,
  ];
}

/** Button 段 —— antd 的 `getRadioButtonStyle`。 */
function genRadioButtonStyle(p: string): string[] {
  const groupCls = `.${p}-radio-group`;
  const wrapperCls = `.${p}-radio-button-wrapper`;
  const radioCls = `.${p}-radio-button`;
  const checkedCls = `${wrapperCls}-checked`;
  const disabledCls = `${wrapperCls}-disabled`;

  /** 圆角三档 × (base/large/small) 的 first/last 组合（参数是 token 名，理由同 `genVerticalBadge`）。 */
  const genButtonRadius = (radiusToken: string, prefix: string, vertical: boolean): string[] => {
    if (vertical) {
      return [
        `${prefix}>${wrapperCls}:first-child{`,
        `  border-start-start-radius:${v(radiusToken)};`,
        `  border-start-end-radius:${v(radiusToken)};`,
        `}`,
        `${prefix}>${wrapperCls}:last-child{`,
        `  border-end-start-radius:${v(radiusToken)};`,
        `  border-end-end-radius:${v(radiusToken)};`,
        `}`,
        `${prefix}>${wrapperCls}:first-child:last-child{`,
        `  border-radius:${v(radiusToken)};`,
        `}`,
      ];
    }
    return [
      `${prefix} ${wrapperCls}:first-child{`,
      `  border-start-start-radius:${v(radiusToken)};`,
      `  border-end-start-radius:${v(radiusToken)};`,
      `}`,
      `${prefix} ${wrapperCls}:last-child{`,
      `  border-start-end-radius:${v(radiusToken)};`,
      `  border-end-end-radius:${v(radiusToken)};`,
      `}`,
    ];
  };

  return [
    `${wrapperCls}{`,
    ...genTokenDecls(p),
    `  position:relative;`,
    `  display:inline-block;`,
    `  height:${v('controlHeight')};`,
    `  margin:0;`,
    `  padding-inline:${cv(p, 'button-padding-inline')};`,
    `  padding-block:0;`,
    `  color:${cv(p, 'button-color')};`,
    `  font-size:${v('fontSize')};`,
    `  line-height:calc(${v('controlHeight')} - ${v('lineWidth')} * 2);`,
    `  background:${cv(p, 'button-bg')};`,
    `  border:${v('lineWidth')} ${v('lineType')} ${v('colorBorder')};`,
    // ⚠️ antd 的 chrome 对齐 hack（`+ 0.02`）—— 逐字保留
    `  border-block-start-width:calc(${v('lineWidth')} + 0.02px);`,
    `  border-inline-end-width:${v('lineWidth')};`,
    `  cursor:pointer;`,
    `  transition:color ${v('motionDurationMid')},background-color ${v('motionDurationMid')},box-shadow ${v('motionDurationMid')};`,
    `}`,
    `${wrapperCls} a{`,
    `  color:${cv(p, 'button-color')};`,
    `}`,
    // 内层圆点铺满（button 形态的视觉由 wrapper 承载）
    `${wrapperCls} >${radioCls}{`,
    `  position:absolute;`,
    `  inset-block-start:0;`,
    `  inset-inline-start:0;`,
    `  z-index:-1;`,
    `  width:100%;`,
    `  height:100%;`,
    `}`,
    // 相邻边框合并
    `${wrapperCls}:not(:last-child){`,
    `  margin-inline-end:calc(${v('lineWidth')} * -1);`,
    `}`,
    `${wrapperCls}:first-child{`,
    `  border-inline-start:${v('lineWidth')} ${v('lineType')} ${v('colorBorder')};`,
    `  border-start-start-radius:${v('borderRadius')};`,
    `  border-end-start-radius:${v('borderRadius')};`,
    `}`,
    `${wrapperCls}:last-child{`,
    `  border-start-end-radius:${v('borderRadius')};`,
    `  border-end-end-radius:${v('borderRadius')};`,
    `}`,
    `${wrapperCls}:first-child:last-child{`,
    `  border-radius:${v('borderRadius')};`,
    `}`,
    // ---- size ----
    `${groupCls}-large ${wrapperCls}{`,
    `  height:${v('controlHeightLG')};`,
    `  font-size:${v('fontSizeLG')};`,
    `  line-height:calc(${v('controlHeightLG')} - ${v('lineWidth')} * 2);`,
    `}`,
    ...genButtonRadius('borderRadiusLG', `${groupCls}-large`, false),
    `${groupCls}-small ${wrapperCls}{`,
    `  height:${v('controlHeightSM')};`,
    `  padding-inline:calc(${v('paddingXS')} - ${v('lineWidth')});`,
    `  padding-block:0;`,
    `  line-height:calc(${v('controlHeightSM')} - ${v('lineWidth')} * 2);`,
    `}`,
    ...genButtonRadius('borderRadiusSM', `${groupCls}-small`, false),
    // ---- vertical ----
    `${groupCls}-vertical>${wrapperCls}{`,
    `  margin-inline-end:0;`,
    `  border-radius:0;`,
    `}`,
    `${groupCls}-vertical>${wrapperCls}:not(:last-child){`,
    `  margin-block-end:calc(${v('lineWidth')} * -1);`,
    `}`,
    `${groupCls}-vertical>${wrapperCls}:first-child{`,
    `  border-start-start-radius:${v('borderRadius')};`,
    `  border-start-end-radius:${v('borderRadius')};`,
    `  border-end-start-radius:0;`,
    `  border-end-end-radius:0;`,
    `}`,
    `${groupCls}-vertical>${wrapperCls}:last-child{`,
    `  border-start-start-radius:0;`,
    `  border-start-end-radius:0;`,
    `  border-end-start-radius:${v('borderRadius')};`,
    `  border-end-end-radius:${v('borderRadius')};`,
    `}`,
    `${groupCls}-vertical>${wrapperCls}:first-child:last-child{`,
    `  border-radius:${v('borderRadius')};`,
    `}`,
    ...genButtonRadius('borderRadiusLG', `${groupCls}-vertical${groupCls}-large`, true),
    ...genButtonRadius('borderRadiusSM', `${groupCls}-vertical${groupCls}-small`, true),
    // ---- hover / focus ----
    `${wrapperCls}:hover{`,
    `  position:relative;`,
    `  color:${v('colorPrimary')};`,
    `}`,
    `${wrapperCls}:has(:focus-visible){`,
    `  outline:${v('lineWidthFocus')} solid ${v('colorPrimaryBorder')};`,
    `  outline-offset:1px;`,
    `  transition:outline-offset 0s,outline 0s;`,
    `}`,
    // 内层 input 完全隐藏
    // ⚠️ 第一段 `${componentCls}`（= `.apollo-radio`）在 button 形态下**恒不命中** ——
    //    button 形态的内层 span 类名是 `.apollo-radio-button`（prefixCls 换了前缀）。
    //    上游就是这么写的（死选择器），**逐字保留**：改成 `.apollo-radio-button` 会
    //    让内层 span 变成 0×0，与 antd 的渲染分叉（§8 差异登记 UPSTREAM）。
    //    真正隐藏 input 的是后两段。
    `${wrapperCls} .${p}-radio,${wrapperCls} input[type='checkbox'],${wrapperCls} input[type='radio']{`,
    `  width:0;`,
    `  height:0;`,
    `  opacity:0;`,
    `  pointer-events:none;`,
    `}`,
    // ---- checked ----
    `${checkedCls}:not(${disabledCls}){`,
    `  z-index:1;`,
    `  color:${v('colorPrimary')};`,
    `  background:${cv(p, 'button-checked-bg')};`,
    `  border-color:${v('colorPrimary')};`,
    `}`,
    `${checkedCls}:not(${disabledCls})::before{`,
    `  background-color:${v('colorPrimary')};`,
    `}`,
    `${checkedCls}:not(${disabledCls}):first-child{`,
    `  border-color:${v('colorPrimary')};`,
    `}`,
    `${checkedCls}:not(${disabledCls}):hover{`,
    `  color:${v('colorPrimaryHover')};`,
    `  border-color:${v('colorPrimaryHover')};`,
    `}`,
    `${checkedCls}:not(${disabledCls}):hover::before{`,
    `  background-color:${v('colorPrimaryHover')};`,
    `}`,
    `${checkedCls}:not(${disabledCls}):active{`,
    `  color:${v('colorPrimaryActive')};`,
    `  border-color:${v('colorPrimaryActive')};`,
    `}`,
    `${checkedCls}:not(${disabledCls}):active::before{`,
    `  background-color:${v('colorPrimaryActive')};`,
    `}`,
    // ---- solid ----
    `${groupCls}-solid ${checkedCls}:not(${disabledCls}){`,
    `  color:${cv(p, 'button-solid-checked-color')};`,
    `  background:${cv(p, 'button-solid-checked-bg')};`,
    `  border-color:${cv(p, 'button-solid-checked-bg')};`,
    `}`,
    `${groupCls}-solid ${checkedCls}:not(${disabledCls}):hover{`,
    `  color:${cv(p, 'button-solid-checked-color')};`,
    `  background:${cv(p, 'button-solid-checked-hover-bg')};`,
    `  border-color:${cv(p, 'button-solid-checked-hover-bg')};`,
    `}`,
    `${groupCls}-solid ${checkedCls}:not(${disabledCls}):active{`,
    `  color:${cv(p, 'button-solid-checked-color')};`,
    `  background:${cv(p, 'button-solid-checked-active-bg')};`,
    `  border-color:${cv(p, 'button-solid-checked-active-bg')};`,
    `}`,
    // ---- disabled ----
    `${disabledCls}{`,
    `  color:${v('colorTextDisabled')};`,
    `  background-color:${v('colorBgContainerDisabled')};`,
    `  border-color:${v('colorBorder')};`,
    `  cursor:not-allowed;`,
    `}`,
    `${disabledCls}:first-child,${disabledCls}:hover{`,
    `  color:${v('colorTextDisabled')};`,
    `  background-color:${v('colorBgContainerDisabled')};`,
    `  border-color:${v('colorBorder')};`,
    `}`,
    `${disabledCls}${checkedCls}{`,
    `  color:${cv(p, 'button-checked-color-disabled')};`,
    `  background-color:${cv(p, 'button-checked-bg-disabled')};`,
    `  border-color:${v('colorBorder')};`,
    `  box-shadow:none;`,
    `}`,
    // ---- block ----
    `${wrapperCls}-block{`,
    `  flex:1;`,
    `  text-align:center;`,
    `}`,
  ];
}

/**
 * 生成 Radio 的静态 CSS。
 *
 * @param rootPrefixCls 根前缀（`apollo` 或 `ant`）
 */
export function genRadioStyle(rootPrefixCls: string): string {
  const p = rootPrefixCls;
  return [...genGroupRadioStyle(p), ...genRadioBasicStyle(p), ...genRadioButtonStyle(p)].join('\n');
}
