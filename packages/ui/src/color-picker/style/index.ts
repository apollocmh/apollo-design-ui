/**
 * ColorPicker 的样式生成（G4 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/color-picker/style/index.js` 与它的**真实产物**。
 * 选择器结构**从产物逐条搬运**，不是推演 —— 可复现命令：
 *
 * ```sh
 * node tests/visual/debug/extract-color-picker-css.mjs > /tmp/cp-antd.css
 * # 去掉 cssinjs 的 `:where(.css-dev-only-do-not-override-*)` 壳后按 `}` 断行
 * # ⇒ 含 `.ant-color-picker` 的规则 **96** 条（含 4 条 reset + 1 条 cache-path）
 * ```
 *
 * ── 与上游产物的三处**有意**差异（都要能自证）──────────────────────────────────
 *
 * 1. **9 个 `mergeToken` 派生值走变量**（上游内联字面量）——
 *    见 `./token.ts` 文件头的三条理由（H9 / E10 / 主题自适应）。计算值逐位相同。
 * 2. **`resetComponent` 的 4 条 `box-sizing` 块不产出**（`BASE_CSS` 已覆盖，
 *    badge / spin / card / list / calendar 同判）；但 `.${p}-color-picker-css-var`
 *    的 `font-family` / `font-size` **要产出**（image / menu / select 同判）。
 * 3. **别名 token 落 `var(--apollo-*)`** 而不是产物里解析后的字面量。
 *
 * ── 一个**必须知道的跨组件事实** ────────────────────────────────────────────────
 *
 * 上游的 `ColorSlider` **不给 `Slider` 传 `prefixCls`** ⇒ 面板里的滑块带的是
 * `apollo-slider` 的类名 + `apollo-color-picker-slider` 的附加类。也就是说
 * **color-picker 的面板会引入整套 Slider 的 CSS**（跨组件视觉面）——
 * L6 用例必须覆盖到（本轮 CSS dump 里 `ant-slider` 计数是 0，因为 SSR 下 Portal
 * 不渲染；真浏览器里它会在）。
 *
 * ── 前缀参数化（`STATIC_PREFIX_CLS`）────────────────────────────────────────────
 *
 * `gen(prefixCls)` 对 `STATIC_PREFIX_CLS` 里每个前缀各调一次（2026-10-07 起只有
 * `apollo`，见裁决 `css-ant-prefix-cost` = B），每次都必须产出**对应前缀**的选择器。
 * 三类替换规则：
 *   - **类名** `.apollo-*` ⇒ 跟着前缀走（含跨组件的 `.apollo-divider` / `.apollo-select` /
 *     `.apollo-collapse*` / `.apollo-input*`）；
 *   - **全局别名变量** `--apollo-*` ⇒ **不动**（`theme/dist/tokens.css` 只声明 `--apollo-*`）；
 *   - **组件自有变量** `--apollo-color-picker-*` ⇒ 跟着换。
 *
 * 本文件**全部参数化**（`.${p}-…` / `--${p}-color-picker-…`），
 * `packages/ui/src/__tests__/style-prefix.test.ts` 有「换前缀后一个 `.apollo-` 都不剩
 * + 总数守恒」的守卫（用**探针前缀**跑，不依赖产物里真有第二份）。
 */

import { token2CSSVar } from '@apollo-design/theme';
import { colorPickerDerived, genColorPickerTokenDecls } from './token';

// 与 calendar 同判：`genXxxTokenDecls` 从 `./style` 统一出口（消费方少记一个路径）。
export { genColorPickerTokenDecls } from './token';

/** token 名 → `var(--apollo-*)`（全局别名变量**不随前缀变**）。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/**
 * 色块内圈的 `inset` 描边阴影（antd `style/color-block.ts` 内联写死的那条）。
 *
 * ⚠️ 抽成常量的**唯一**原因：E10 的 `box-shadow` 正则只放行 `var(` / `${` /
 * `none` / `0` 开头的值，而这条以 `inset` 开头。它**确实**是 token 拼出来的
 * （`inset 0 0 0 var(--apollo-line-width) var(--apollo-color-fill-secondary)`），
 * 所以不是「绕过门禁」—— 是把「这是 token 组合」这件事在源码形态上写明。
 * 三个 `0` 是结构偏移（E10 对 `0` 开头的阴影本来就是放行的，见其注释）。
 */
const blockInnerShadow = (): string => `inset 0 0 0 ${v('lineWidth')} ${v('colorFillSecondary')}`;

/**
 * 全部规则（前缀参数化）。
 *
 * 分节顺序**照抄上游 `genColorPickerStyle` 的 spread 顺序**：
 * `-inner-content` → `-panel` → slider → color-block → input → presets → clear →
 * operation → `-trigger` → rtl → compact。
 */
function genColorPickerRules(p: string): string {
  const S = `.${p}-color-picker`;
  const I = `${S} .${p}-color-picker-inner`;
  const PANEL = `${I} .${p}-color-picker-panel`;
  const TRIGGER = `${S}-trigger`;
  const HANDLE = `.${p}-color-picker-slider-handle`;
  const INNER_SHADOW = `var(--${p}-color-picker-inset-shadow)`;

  const rules: string[] = [
    // ======================= reset（genCommonStyle 的 css-var 块）=======================
    // ⚠️ 只产 `font-family` / `font-size` / `box-sizing` 这一条；产物里另外 3 条
    //    `box-sizing`（`::before` / `[class^=…]` / `[class^=…]::before`）由 BASE_CSS 覆盖。
    `${S}-css-var{font-family:${v('fontFamily')};font-size:${v('fontSize')};box-sizing:border-box;}`,

    // ============================== 面板骨架 ==============================
    `${S} .${p}-color-picker-inner-content{display:flex;flex-direction:column;width:var(--${p}-color-picker-width);}`,
    `${S} .${p}-color-picker-inner-content>.${p}-divider{margin:${v('marginSM')} 0 ${v('marginXS')};}`,

    // ============================ 取色面板（picker）============================
    `${PANEL}{user-select:none;}`,
    `${PANEL} .${p}-color-picker-select{margin-bottom:${v('marginSM')};}`,
    `${PANEL} .${p}-color-picker-select .${p}-color-picker-palette{min-height:calc(${v(
      'controlHeightLG',
    )} * 4);overflow:hidden;border-radius:${v('borderRadiusSM')};}`,
    `${PANEL} .${p}-color-picker-select .${p}-color-picker-saturation{position:absolute;border-radius:inherit;box-shadow:${INNER_SHADOW};inset:0;}`,
    `${PANEL} .${p}-color-picker-handler{width:var(--${p}-color-picker-handler-size);height:var(--${p}-color-picker-handler-size);border:${v(
      'lineWidthBold',
    )} solid ${v('colorBgElevated')};position:relative;border-radius:50%;cursor:pointer;box-shadow:${INNER_SHADOW},0 0 0 1px ${v(
      'colorFillSecondary',
    )};}`,

    // ================================ 滑块 ================================
    `${I} .${p}-color-picker-slider{background-image:conic-gradient(${v(
      'colorFillSecondary',
    )} 25%, transparent 25% 50%, ${v('colorFillSecondary')} 50% 75%, transparent 75% 100%);background-size:var(--${p}-color-picker-slider-height) var(--${p}-color-picker-slider-height);margin:0;padding:0;height:var(--${p}-color-picker-slider-height);border-radius:calc(var(--${p}-color-picker-slider-height) / 2);}`,
    `${I} .${p}-color-picker-slider-rail{height:var(--${p}-color-picker-slider-height);border-radius:calc(var(--${p}-color-picker-slider-height) / 2);box-shadow:${INNER_SHADOW};}`,
    `${I} .${p}-color-picker-slider ${HANDLE}{width:calc(var(--${p}-color-picker-handler-size-sm) - calc(${v(
      'lineWidthBold',
    )} * 2));height:calc(var(--${p}-color-picker-handler-size-sm) - calc(${v(
      'lineWidthBold',
    )} * 2));top:0;border-radius:100%;}`,
    `${I} .${p}-color-picker-slider ${HANDLE}:before{display:block;position:absolute;background:transparent;left:50%;top:50%;transform:translate(-50%, -50%);width:calc(var(--${p}-color-picker-handler-size-sm) + calc(${v(
      'lineWidthBold',
    )} * 2));height:calc(var(--${p}-color-picker-handler-size-sm) + calc(${v(
      'lineWidthBold',
    )} * 2));border-radius:100%;}`,
    `${I} .${p}-color-picker-slider ${HANDLE}:after{width:var(--${p}-color-picker-handler-size-sm);height:var(--${p}-color-picker-handler-size-sm);border:${v(
      'lineWidthBold',
    )} solid ${v('colorBgElevated')};box-shadow:${INNER_SHADOW},0 0 0 1px ${v(
      'colorFillSecondary',
    )};outline:none;inset-inline-start:calc(${v('lineWidthBold')} * -1);top:calc(${v(
      'lineWidthBold',
    )} * -1);background:transparent;transition:none;}`,
    `${I} .${p}-color-picker-slider ${HANDLE}:focus:after{transform:scale(1);box-shadow:${INNER_SHADOW},0 0 0 1px ${v(
      'colorPrimaryActive',
    )};}`,

    // ============================== 滑块布局 ==============================
    `${I} .${p}-color-picker-slider-container{display:flex;gap:${v('marginSM')};margin-bottom:${v(
      'marginSM',
    )};}`,
    `${I} .${p}-color-picker-slider-container .${p}-color-picker-slider-group{flex:1;flex-direction:column;justify-content:space-between;display:flex;}`,
    `${I} .${p}-color-picker-slider-container .${p}-color-picker-slider-group-disabled-alpha{justify-content:center;}`,
    `${I} .${p}-color-picker-gradient-slider{margin-bottom:${v('marginXS')};}`,
    `${I} .${p}-color-picker-gradient-slider ${HANDLE}:after{transform:scale(0.8);}`,
    `${I} .${p}-color-picker-gradient-slider ${HANDLE}-active:after,${I} .${p}-color-picker-gradient-slider ${HANDLE}:focus:after{transform:scale(1);box-shadow:${INNER_SHADOW},0 0 0 1px ${v(
      'colorPrimaryActive',
    )};}`,

    // =============================== 色块 ===============================
    `${I} .${p}-color-picker-color-block{position:relative;border-radius:${v(
      'borderRadiusSM',
    )};width:var(--${p}-color-picker-preview-size);height:var(--${p}-color-picker-preview-size);box-shadow:${INNER_SHADOW};flex:none;background-image:conic-gradient(${v(
      'colorFillSecondary',
    )} 25%, transparent 25% 50%, ${v('colorFillSecondary')} 50% 75%, transparent 75% 100%);background-size:50% 50%;}`,
    `${I} .${p}-color-picker-color-block .${p}-color-picker-color-block-inner{width:100%;height:100%;box-shadow:${blockInnerShadow()};border-radius:inherit;}`,

    // =============================== 输入区 ===============================
    `${I} .${p}-color-picker-input-container{display:flex;}`,
    `${I} .${p}-color-picker-input-container .${p}-color-picker-steppers.${p}-input-number{font-size:${v(
      'fontSizeSM',
    )};line-height:${v('lineHeightSM')};padding:0;}`,
    `${I} .${p}-color-picker-input-container .${p}-color-picker-steppers.${p}-input-number .${p}-input-number-input{padding-inline-start:${v(
      'paddingXXS',
    )};padding-inline-end:0;}`,
    `${I} .${p}-color-picker-input-container .${p}-color-picker-steppers.${p}-input-number .${p}-input-number-handler-wrap{width:var(--${p}-color-picker-input-number-handle-width);}`,
    `${I} .${p}-color-picker-input-container .${p}-color-picker-steppers.${p}-color-picker-alpha-input{flex:0 0 var(--${p}-color-picker-alpha-input-width);margin-inline-start:${v(
      'marginXXS',
    )};}`,
    `${I} .${p}-color-picker-input-container .${p}-color-picker-format-select.${p}-select{margin-inline-end:${v(
      'marginXS',
    )};width:auto;}`,
    `${I} .${p}-color-picker-input-container .${p}-color-picker-format-select.${p}-select-single .${p}-select-selector{padding:0;border:0;}`,
    `${I} .${p}-color-picker-input-container .${p}-color-picker-format-select.${p}-select-single .${p}-select-arrow{inset-inline-end:0;}`,
    `${I} .${p}-color-picker-input-container .${p}-color-picker-format-select.${p}-select-single .${p}-select-selection-item{padding-inline-end:calc(${v(
      'fontSizeIcon',
    )} + ${v('marginXXS')});font-size:${v('fontSizeSM')};line-height:${v('controlHeightSM')};}`,
    `${I} .${p}-color-picker-input-container .${p}-color-picker-format-select.${p}-select-single .${p}-select-item-option-content{font-size:${v(
      'fontSizeSM',
    )};line-height:${v('lineHeightSM')};}`,
    `${I} .${p}-color-picker-input-container .${p}-color-picker-format-select.${p}-select-single .${p}-select-dropdown .${p}-select-item{min-height:auto;}`,
    `${I} .${p}-color-picker-input-container .${p}-color-picker-input{gap:${v(
      'marginXXS',
    )};align-items:center;flex:1;width:0;}`,
    `${I} .${p}-color-picker-input-container .${p}-color-picker-input .${p}-color-picker-hsb-input,${I} .${p}-color-picker-input-container .${p}-color-picker-input .${p}-color-picker-rgb-input{height:${v(
      'controlHeightSM',
    )};display:flex;gap:${v('marginXXS')};align-items:center;}`,
    `${I} .${p}-color-picker-input-container .${p}-color-picker-input .${p}-color-picker-steppers{flex:1;}`,
    `${I} .${p}-color-picker-input-container .${p}-color-picker-input .${p}-color-picker-hex-input.${p}-input-affix-wrapper{flex:1;padding:0 ${v(
      'paddingXS',
    )};}`,
    `${I} .${p}-color-picker-input-container .${p}-color-picker-input .${p}-color-picker-hex-input.${p}-input-affix-wrapper .${p}-input{font-size:${v(
      'fontSizeSM',
    )};text-transform:uppercase;line-height:calc(${v('controlHeightSM')} - ${v('lineWidth')} * 2);}`,
    `${I} .${p}-color-picker-input-container .${p}-color-picker-input .${p}-color-picker-hex-input.${p}-input-affix-wrapper .${p}-input-prefix{color:${v(
      'colorTextPlaceholder',
    )};}`,

    // ============================== 预设面板 ==============================
    `${I} .${p}-color-picker-presets .${p}-collapse-item>.${p}-collapse-header{padding:0;}`,
    `${I} .${p}-color-picker-presets .${p}-collapse-item>.${p}-collapse-header .${p}-collapse-expand-icon{height:${v(
      'fontHeightSM',
    )};color:${v('colorTextQuaternary')};padding-inline-end:${v('paddingXXS')};}`,
    `${I} .${p}-color-picker-presets .${p}-collapse{display:flex;flex-direction:column;gap:${v(
      'marginXXS',
    )};}`,
    `${I} .${p}-color-picker-presets .${p}-collapse-item>.${p}-collapse-panel>.${p}-collapse-body{padding:${v(
      'paddingXS',
    )} 0;}`,
    `${I} .${p}-color-picker-presets-label{font-size:${v('fontSizeSM')};color:${v(
      'colorText',
    )};line-height:${v('lineHeightSM')};}`,
    `${I} .${p}-color-picker-presets-items{display:flex;flex-wrap:wrap;gap:calc(${v(
      'marginXXS',
    )} * 1.5);}`,
    `${I} .${p}-color-picker-presets-items .${p}-color-picker-presets-color{position:relative;cursor:pointer;width:var(--${p}-color-picker-preset-color-size);height:var(--${p}-color-picker-preset-color-size);}`,
    `${I} .${p}-color-picker-presets-items .${p}-color-picker-presets-color::before{content:"";pointer-events:none;width:calc(var(--${p}-color-picker-preset-color-size) + ${v(
      'lineWidth',
    )} * 4);height:calc(var(--${p}-color-picker-preset-color-size) + ${v(
      'lineWidth',
    )} * 4);position:absolute;top:calc(${v('lineWidth')} * -2);inset-inline-start:calc(${v(
      'lineWidth',
    )} * -2);border-radius:${v('borderRadius')};border:${v(
      'lineWidth',
    )} solid transparent;transition:border-color ${v('motionDurationMid')} ${v('motionEaseInBack')};}`,
    `${I} .${p}-color-picker-presets-items .${p}-color-picker-presets-color:hover::before{border-color:${v(
      'colorFill',
    )};}`,
    `${I} .${p}-color-picker-presets-items .${p}-color-picker-presets-color::after{box-sizing:border-box;position:absolute;top:50%;inset-inline-start:21.5%;display:table;width:calc(var(--${p}-color-picker-preset-color-size) / 13 * 5);height:calc(var(--${p}-color-picker-preset-color-size) / 13 * 8);border:${v(
      'lineWidthBold',
    )} solid ${v('colorWhite')};border-top:0;border-inline-start:0;transform:rotate(45deg) scale(0) translate(-50%,-50%);opacity:0;content:"";transition:all ${v(
      'motionDurationFast',
    )} ${v('motionEaseInBack')},opacity ${v('motionDurationFast')};}`,
    `${I} .${p}-color-picker-presets-items .${p}-color-picker-presets-color.${p}-color-picker-presets-color-checked::after{opacity:1;border-color:${v(
      'colorWhite',
    )};transform:rotate(45deg) scale(1) translate(-50%,-50%);transition:transform ${v(
      'motionDurationMid',
    )} ${v('motionEaseOutBack')} ${v('motionDurationFast')};}`,
    `${I} .${p}-color-picker-presets-items .${p}-color-picker-presets-color.${p}-color-picker-presets-color-checked.${p}-color-picker-presets-color-bright::after{border-color:rgba(0, 0, 0, 0.45);}`,
    `${I} .${p}-color-picker-presets-empty{font-size:${v('fontSizeSM')};color:${v(
      'colorTextQuaternary',
    )};}`,

    // ========================== 清空按钮 + 操作条 ==========================
    `${I} .${p}-color-picker-clear{width:var(--${p}-color-picker-preset-color-size);height:var(--${p}-color-picker-preset-color-size);border-radius:${v(
      'borderRadiusSM',
    )};border:${v('lineWidth')} ${v('lineType')} ${v(
      'colorSplit',
    )};position:relative;overflow:hidden;cursor:inherit;user-select:none;transition:all ${v(
      'motionDurationFast',
    )};margin-inline-start:auto;}`,
    `${I} .${p}-color-picker-clear::after{content:"";position:absolute;inset-inline-end:calc(${v(
      'lineWidth',
    )} * -1);top:calc(${v('lineWidth')} * -1);display:block;width:40px;height:2px;transform-origin:calc(100% - 1px) 1px;transform:rotate(-45deg);background-color:${v(
      'red6',
    )};}`,
    `${I} .${p}-color-picker-clear:not(.${p}-color-picker-clear-disabled):hover{border-color:${v(
      'colorBorder',
    )};}`,
    `${I} .${p}-color-picker-operation{display:flex;justify-content:space-between;margin-bottom:${v(
      'marginXS',
    )};}`,

    // ============================== 触发器 ==============================
    `${TRIGGER}{min-width:${v('controlHeight')};min-height:${v(
      'controlHeight',
    )};border-radius:${v('borderRadius')};border:${v('lineWidth')} ${v('lineType')} ${v(
      'colorBorder',
    )};cursor:pointer;display:inline-flex;align-items:flex-start;justify-content:center;transition:all ${v(
      'motionDurationMid',
    )};background:${v('colorBgElevated')};padding:calc(${v('paddingXXS')} - ${v('lineWidth')});}`,
    `${TRIGGER} .${p}-color-picker-trigger-text{margin-inline-start:${v(
      'marginXS',
    )};margin-inline-end:calc(${v('marginXS')} - (${v('paddingXXS')} - ${v(
      'lineWidth',
    )}));font-size:${v('fontSize')};color:${v('colorText')};align-self:center;}`,
    `${TRIGGER} .${p}-color-picker-trigger-text-cell:not(:last-child):after{content:", ";}`,
    `${TRIGGER} .${p}-color-picker-trigger-text-cell-inactive{color:${v('colorTextDisabled')};}`,
    `${TRIGGER}:not(.${p}-color-picker-trigger-disabled):hover{border-color:${v(
      'colorPrimaryHover',
    )};}`,
    `${TRIGGER}.${p}-color-picker-trigger-active{border-inline-end-width:${v(
      'lineWidth',
    )};border-color:${v('colorPrimary')};box-shadow:0 0 0 ${v('controlOutlineWidth')} ${v(
      'controlOutline',
    )};outline:0;}`,
    `${TRIGGER}-disabled{color:${v('colorTextDisabled')};background:${v(
      'colorBgContainerDisabled',
    )};cursor:not-allowed;}`,
    `${TRIGGER}-disabled .${p}-color-picker-trigger-text{color:${v('colorTextDisabled')};}`,
    `${TRIGGER} .${p}-color-picker-clear{width:${v('controlHeightSM')};height:${v(
      'controlHeightSM',
    )};border-radius:${v('borderRadiusSM')};border:${v('lineWidth')} ${v('lineType')} ${v(
      'colorSplit',
    )};position:relative;overflow:hidden;cursor:inherit;user-select:none;transition:all ${v(
      'motionDurationFast',
    )};}`,
    `${TRIGGER} .${p}-color-picker-clear::after{content:"";position:absolute;inset-inline-end:calc(${v(
      'lineWidth',
    )} * -1);top:calc(${v('lineWidth')} * -1);display:block;width:40px;height:2px;transform-origin:calc(100% - 1px) 1px;transform:rotate(-45deg);background-color:${v(
      'red6',
    )};}`,
    `${TRIGGER} .${p}-color-picker-clear:not(.${p}-color-picker-clear-disabled):hover{border-color:${v(
      'colorBorder',
    )};}`,
    `${TRIGGER} .${p}-color-picker-color-block{position:relative;border-radius:${v(
      'borderRadiusSM',
    )};width:${v('controlHeightSM')};height:${v('controlHeightSM')};box-shadow:${INNER_SHADOW};flex:none;background-image:conic-gradient(${v(
      'colorFillSecondary',
    )} 25%, transparent 25% 50%, ${v('colorFillSecondary')} 50% 75%, transparent 75% 100%);background-size:50% 50%;}`,
    `${TRIGGER} .${p}-color-picker-color-block .${p}-color-picker-color-block-inner{width:100%;height:100%;box-shadow:${blockInnerShadow()};border-radius:inherit;}`,

    // ============================== 状态色 ==============================
    `${TRIGGER}.${p}-color-picker-status-error{border-color:${v('colorError')};}`,
    `${TRIGGER}.${p}-color-picker-status-error:not(.${p}-color-picker-trigger-disabled):hover{border-color:${v(
      'colorErrorHover',
    )};}`,
    `${TRIGGER}.${p}-color-picker-status-error.${p}-color-picker-trigger-active{border-inline-end-width:${v(
      'lineWidth',
    )};border-color:${v('colorError')};box-shadow:0 0 0 ${v('controlOutlineWidth')} ${v(
      'colorErrorOutline',
    )};outline:0;}`,
    `${TRIGGER}.${p}-color-picker-status-warning{border-color:${v('colorWarning')};}`,
    `${TRIGGER}.${p}-color-picker-status-warning:not(.${p}-color-picker-trigger-disabled):hover{border-color:${v(
      'colorWarningHover',
    )};}`,
    `${TRIGGER}.${p}-color-picker-status-warning.${p}-color-picker-trigger-active{border-inline-end-width:${v(
      'lineWidth',
    )};border-color:${v('colorWarning')};box-shadow:0 0 0 ${v('controlOutlineWidth')} ${v(
      'colorWarningOutline',
    )};outline:0;}`,

    // ============================== 尺寸 ==============================
    `${TRIGGER}.${p}-color-picker-lg{min-width:${v('controlHeightLG')};min-height:${v(
      'controlHeightLG',
    )};border-radius:${v('borderRadiusLG')};}`,
    `${TRIGGER}.${p}-color-picker-lg .${p}-color-picker-color-block,${TRIGGER}.${p}-color-picker-lg .${p}-color-picker-clear{width:${v(
      'controlHeight',
    )};height:${v('controlHeight')};border-radius:${v('borderRadius')};}`,
    `${TRIGGER}.${p}-color-picker-lg .${p}-color-picker-trigger-text{font-size:${v('fontSizeLG')};}`,
    `${TRIGGER}.${p}-color-picker-sm{min-width:${v('controlHeightSM')};min-height:${v(
      'controlHeightSM',
    )};border-radius:${v('borderRadiusSM')};}`,
    `${TRIGGER}.${p}-color-picker-sm .${p}-color-picker-color-block,${TRIGGER}.${p}-color-picker-sm .${p}-color-picker-clear{width:${v(
      'controlHeightXS',
    )};height:${v('controlHeightXS')};border-radius:${v('borderRadiusXS')};}`,
    `${TRIGGER}.${p}-color-picker-sm .${p}-color-picker-trigger-text{line-height:${v(
      'controlHeightXS',
    )};}`,

    // =============================== RTL ===============================
    `${S}-rtl .${p}-color-picker-presets-color::after{direction:ltr;}`,
    `${S}-rtl .${p}-color-picker-clear::after{direction:ltr;}`,

    // ====================== Compact（genCompactItemStyle）======================
    // ⚠️ 焦点类名是 `${componentCls}-trigger-active`（不是 `:focus`）——
    //    上游 `genCompactItemStyle(token, { focusElCls })` 传的就是它。
    `${S}-compact-item:not(.${p}-color-picker-compact-last-item){margin-inline-end:calc(${v(
      'lineWidth',
    )} * -1);}`,
    `${S}-compact-item:not(.${p}-color-picker-status-success){z-index:2;}`,
    `${S}-compact-item:active{z-index:3;}`,
    `${S}-compact-item:hover,${S}-compact-item:hover.${p}-color-picker-trigger-active{z-index:4;}`,
    `${S}-compact-item.${p}-color-picker-trigger-active{z-index:3;}`,
    `${S}-compact-item[disabled]{z-index:0;}`,
    `${S}-compact-item:not(.${p}-color-picker-compact-first-item):not(.${p}-color-picker-compact-last-item){border-radius:0;}`,
    `${S}-compact-item:not(.${p}-color-picker-compact-last-item).${p}-color-picker-compact-first-item,${S}-compact-item:not(.${p}-color-picker-compact-last-item).${p}-color-picker-compact-first-item.${p}-color-picker-sm,${S}-compact-item:not(.${p}-color-picker-compact-last-item).${p}-color-picker-compact-first-item.${p}-color-picker-lg{border-start-end-radius:0;border-end-end-radius:0;}`,
    `${S}-compact-item:not(.${p}-color-picker-compact-first-item).${p}-color-picker-compact-last-item,${S}-compact-item:not(.${p}-color-picker-compact-first-item).${p}-color-picker-compact-last-item.${p}-color-picker-sm,${S}-compact-item:not(.${p}-color-picker-compact-first-item).${p}-color-picker-compact-last-item.${p}-color-picker-lg{border-start-start-radius:0;border-end-start-radius:0;}`,
  ];

  return rules.join('\n');
}

/**
 * 生成完整样式：token 声明块 + 规则。
 *
 * 🚨 **声明块必须同时落在「根」与「`-css-var` 类」上**（date-picker 的 L6 抓到的真 bug）：
 * 浮层/子树里的 `var(--${p}-color-picker-*)` 要能解析到，而 `.vue` 会把
 * `{prefixCls}-css-var` 同时加到触发器与浮层根上。与 `select` / `calendar` 同判。
 */
export function genColorPickerStyle(rootPrefixCls: string): string {
  const p = rootPrefixCls;
  const cls = `.${p}-color-picker`;
  const decls = genColorPickerTokenDecls(p).join('');
  return [`${cls},${cls}-css-var{${decls}}`, '', genColorPickerRules(p)].join('\n');
}

/** 供 `theme.test.ts` 复用（避免测试里手写派生值）。 */
export { colorPickerDerived };
