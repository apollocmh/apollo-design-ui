import {
  getDesignToken,
  type PresetColorKey,
  PresetColors,
  token2CSSVar,
} from '@apollo-design/theme';
import { prepareComponentToken } from './token';

const v = (token: string): string => `var(${token2CSSVar(token)})`;
const component = (token: string, fallback: string): string =>
  `var(${token2CSSVar(token, 'apollo-btn')},${fallback})`;
const toneTokens = new Set<string>();
const tone = (token: string): string => {
  toneTokens.add(token);
  return component(`tone-${token2CSSVar(token, '').slice(2)}`, v(token));
};
const ICON_CLS = '.apollo-icon';
type Triple = readonly [string, string, string];
type ColorKey = 'default' | 'primary' | 'dangerous' | 'link' | PresetColorKey;
type VariantKey = 'outlined' | 'dashed' | 'solid' | 'filled' | 'text' | 'link';
const same = (value: string): Triple => [value, value, value];
const TRANSPARENT = same('transparent');
let presetShadowCache: ReturnType<typeof prepareComponentToken> | undefined;
function presetShadow(color: PresetColorKey): string {
  presetShadowCache ??= prepareComponentToken(getDesignToken());
  return component(`${color}ShadowColor`, presetShadowCache[`${color}ShadowColor`]);
}
interface ColorSlots {
  base: Triple;
  text: Triple;
  light: Triple;
  shadow: string;
  solidBg: Triple;
}
function colorSlots(color: ColorKey): ColorSlots {
  switch (color) {
    case 'default':
      return {
        base: [
          component('defaultBorderColor', v('colorBorder')),
          component('defaultHoverBorderColor', v('colorPrimaryHover')),
          component('defaultActiveBorderColor', v('colorPrimaryActive')),
        ],
        text: [
          component('defaultColor', v('colorText')),
          component('defaultHoverColor', tone('colorPrimaryHover')),
          component('defaultActiveColor', tone('colorPrimaryActive')),
        ],
        light: [v('colorFillTertiary'), v('colorFillSecondary'), v('colorFill')],
        shadow: component(
          'defaultShadow',
          `0 ${v('controlOutlineWidth')} 0 ${v('controlTmpOutline')}`,
        ),
        solidBg: [v('colorBgSolid'), v('colorBgSolidHover'), v('colorBgSolidActive')],
      };
    case 'primary':
      return {
        base: [v('colorPrimary'), v('colorPrimaryHover'), v('colorPrimaryActive')],
        text: [tone('colorPrimary'), tone('colorPrimaryHover'), tone('colorPrimaryActive')],
        light: [v('colorPrimaryBg'), v('colorPrimaryBgHover'), v('colorPrimaryBorder')],
        shadow: component(
          'primaryShadow',
          `0 ${v('controlOutlineWidth')} 0 ${v('controlOutline')}`,
        ),
        solidBg: [v('colorPrimary'), v('colorPrimaryHover'), v('colorPrimaryActive')],
      };
    case 'dangerous':
      return {
        base: [v('colorError'), v('colorErrorHover'), v('colorErrorActive')],
        text: [tone('colorError'), tone('colorErrorHover'), tone('colorErrorActive')],
        light: [v('colorErrorBg'), v('colorErrorBgFilledHover'), v('colorErrorBgActive')],
        shadow: component(
          'dangerShadow',
          `0 ${v('controlOutlineWidth')} 0 ${v('colorErrorOutline')}`,
        ),
        solidBg: [v('colorError'), v('colorErrorHover'), v('colorErrorActive')],
      };
    case 'link':
      return {
        base: [v('colorLink'), v('colorLinkHover'), v('colorLinkActive')],
        text: [tone('colorLink'), tone('colorLinkHover'), tone('colorLinkActive')],
        light: TRANSPARENT,
        shadow: 'none',
        solidBg: TRANSPARENT,
      };
    default:
      return {
        base: [v(`${color}6`), v(`${color}Hover`), v(`${color}Active`)],
        text: [tone(`${color}6`), tone(`${color}Hover`), tone(`${color}Active`)],
        light: [v(`${color}1`), v(`${color}2`), v(`${color}3`)],
        shadow: presetShadow(color),
        solidBg: [v(`${color}6`), v(`${color}Hover`), v(`${color}Active`)],
      };
  }
}
interface Resolved {
  border: Triple;
  text: Triple;
  bg: Triple;
  borderStyle?: string;
  shadow?: string;
}
function resolve(color: ColorKey, variant: VariantKey, ghost: boolean): Resolved {
  const c = colorSlots(color);
  const container = same(v('colorBgContainer'));
  switch (variant) {
    case 'solid': {
      const automatic = component(
        'autoSolidColor',
        v(color === 'default' ? 'colorBgContainer' : 'colorTextLightSolid'),
      );
      const foreground = component('solidTextColor', automatic);
      const text =
        color === 'primary'
          ? component('primaryColor', foreground)
          : color === 'dangerous'
            ? component('dangerColor', foreground)
            : foreground;
      return {
        border: TRANSPARENT,
        text: same(text),
        bg: c.solidBg,
        shadow: ghost ? 'none' : c.shadow,
      };
    }
    case 'outlined':
    case 'dashed': {
      const border: Triple =
        ghost && color === 'default'
          ? [component('defaultGhostBorderColor', v('colorBgContainer')), c.base[1], c.base[2]]
          : c.base;
      const text: Triple =
        ghost && color === 'default'
          ? [component('defaultGhostColor', v('colorBgContainer')), c.text[1], c.text[2]]
          : c.text;
      const bg: Triple = ghost
        ? same(component('ghostBg', 'transparent'))
        : color === 'default'
          ? [
              component('defaultBg', v('colorBgContainer')),
              component('defaultHoverBg', v('colorBgContainer')),
              component('defaultActiveBg', v('colorBgContainer')),
            ]
          : container;
      return {
        border,
        text,
        bg,
        borderStyle: variant === 'dashed' ? 'dashed' : undefined,
        shadow: ghost ? 'none' : c.shadow,
      };
    }
    case 'filled':
      return {
        border: TRANSPARENT,
        text: color === 'default' ? same(component('defaultColor', v('colorText'))) : c.text,
        bg: ghost ? same(component('ghostBg', 'transparent')) : c.light,
      };
    case 'text':
      return {
        border: TRANSPARENT,
        text:
          color === 'default'
            ? [
                component('textTextColor', v('colorText')),
                component('textTextHoverColor', v('colorText')),
                component('textTextActiveColor', v('colorText')),
              ]
            : c.text,
        bg: [
          'transparent',
          color === 'default' ? component('textHoverBg', v('colorFillTertiary')) : c.light[1],
          c.light[2],
        ],
      };
    case 'link':
      return {
        border: TRANSPARENT,
        text: c.text,
        bg: ['transparent', component('linkHoverBg', 'transparent'), 'transparent'],
      };
  }
}
function emitCombo(cls: string, color: ColorKey, variant: VariantKey, ghost: boolean): string[] {
  const r = resolve(color, variant, ghost);
  const sel = `${cls}${cls}-color-${color}${cls}-variant-${variant}${ghost ? `${cls}-background-ghost:not(:disabled):not(${cls}-disabled)` : ''}`;
  const declarations = (i: 0 | 1 | 2): string[] => [
    `  border-color:${r.border[i]};`,
    `  color:${r.text[i]};`,
    `  --apollo-btn-bg-color:${r.bg[i]};`,
    `  background-color:var(--apollo-btn-bg-color);`,
  ];
  const out = [`${sel}{`, ...declarations(0)];
  if (r.borderStyle) out.push(`  border-style:${r.borderStyle};`);
  if (r.shadow) out.push(`  box-shadow:${r.shadow};`);
  out.push('}');
  for (const [state, index] of [
    ['hover', 1],
    ['active', 2],
  ] as const)
    out.push(`${sel}:not(:disabled):not(${cls}-disabled):${state}{`, ...declarations(index), '}');
  return out;
}
export function genButtonStyle(prefixCls: string): string {
  const cls = `.${prefixCls}-btn`;
  const group = `${cls}-group`;
  const compact = `${cls}-compact`;
  const compactVertical = `${cls}-compact-vertical`;
  const lineWidth = v('lineWidth');
  const insetOffset = `calc(${lineWidth} * -1)`;
  const colors: ColorKey[] = ['default', 'primary', 'dangerous', ...PresetColors];
  const linkColors: ColorKey[] = [...colors, 'link'];
  const out: string[] = [];
  const defaults = prepareComponentToken(getDesignToken());
  out.push(
    `${cls}{`,
    ...Object.keys(defaults).map((name) => `  ${token2CSSVar(name, 'apollo-btn')}:initial;`),
    `  --apollo-btn-motion:running;`,
    `  --apollo-btn-auto-solid-color:initial;`,
    `  color-scheme:var(--apollo-btn-color-scheme,light);`,
    `}`,
    `[data-apollo-theme="dark"],[data-apollo-theme="dark-compact"]{--apollo-btn-color-scheme:dark;}`,
    `[data-apollo-theme="light"],[data-apollo-theme="compact"]{--apollo-btn-color-scheme:light;}`,
    `${cls}-content{display:inline-block;}`,
    `${cls}-icon .apollo-icon-spin{animation-play-state:var(--apollo-btn-motion);}`,
    `@media (prefers-reduced-motion:reduce){${cls}-icon .apollo-icon-spin{animation:none;}}`,
    `${cls}${cls}-square{border-radius:0;}`,
  );
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
  out.push(
    `${cls}{`,
    `  outline:none;`,
    `  position:relative;`,
    `  display:inline-flex;`,
    `  gap:${component('iconGap', v('marginXS'))};`,
    `  align-items:center;`,
    `  justify-content:center;`,
    `  font-weight:${component('fontWeight', '400')};`,
    `  white-space:nowrap;`,
    `  text-align:center;`,
    `  background-image:none;`,
    `  cursor:pointer;`,
    `  transition:all ${v('motionDurationMid')} ${v('motionEaseInOut')};`,
    `  user-select:none;`,
    `  touch-action:manipulation;`,
    `  border-width:${lineWidth};`,
    `  border-style:${v('lineType')};`,
    `  border-color:${v('colorBorder')};`,
    `}`,
    `@media (prefers-reduced-motion: reduce){`,
    `${cls},${cls}::before,${cls}::after{`,
    `  transition:none;`,
    `  animation:none;`,
    `}`,
    `}`,
    `${cls}:disabled > *{`,
    `  pointer-events:none;`,
    `}`,
    '',
  );
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
    `  display:inline-flex;`,
    `  align-items:center;`,
    `  line-height:0;`,
    `  vertical-align:middle;`,
    `}`,
    `${cls}-icon ${ICON_CLS} > *{`,
    `  line-height:1;`,
    `}`,
    `${cls}-icon ${ICON_CLS}:before{`,
    `  content:"\\a0";`,
    `  display:inline-block;`,
    `  width:0;`,
    `}`,
    `${cls} > a{`,
    `  color:currentColor;`,
    `}`,
    `${cls}:not(:disabled):focus-visible{`,
    `  outline:${v('lineWidthFocus')} solid ${v('colorPrimaryBorder')};`,
    `  outline-offset:1;`,
    `  transition:outline-offset 0s,outline 0s;`,
    `}`,
    '',
  );
  out.push(
    `${cls}${cls}-two-chinese-chars > ${cls}-content{`,
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
  const paddingInline = `calc(${v('paddingContentHorizontal')} - ${lineWidth})`;
  const paddingInlineSM = `calc(8px - ${lineWidth})`;
  const sizeBlock = (
    sizeSuffix: '' | '-sm' | '-lg',
    heightToken: string,
    fontSizeToken: string,
    padding: string,
    radiusToken: string,
  ): void => {
    const height = v(heightToken);
    const tokenSuffix = sizeSuffix === '-lg' ? 'LG' : sizeSuffix === '-sm' ? 'SM' : '';
    const fontSize = component(`contentFontSize${tokenSuffix}`, v(fontSizeToken));
    const lineHeight = component(
      `contentLineHeight${tokenSuffix}`,
      v(sizeSuffix === '-lg' ? 'lineHeightLG' : 'lineHeight'),
    );
    const inline = component(`paddingInline${tokenSuffix}`, padding);
    const block = component(
      `paddingBlock${tokenSuffix}`,
      `max(0px,calc((${height} - ${fontSize} * ${lineHeight}) / 2 - ${lineWidth}))`,
    );
    const s = `${cls}${sizeSuffix}`;
    const shapeSuffix = sizeSuffix ? s : '';
    out.push(
      `${s}{`,
      `  font-size:${fontSize};`,
      `  height:${height};`,
      `  line-height:${lineHeight};`,
      `  padding:${block} ${inline};`,
      `  border-radius:${v(radiusToken)};`,
      `}`,
      `${s}${cls}-icon-only{`,
      `  width:${height};`,
      `}`,
      `${s}${cls}-icon-only ${cls}-icon{`,
      `  font-size:${component(`onlyIconSize${tokenSuffix}`, 'inherit')};`,
      `}`,
      `${cls}${cls}-circle${shapeSuffix}{`,
      `  min-width:${height};`,
      `  padding-inline:0;`,
      `  border-radius:${v('borderRadiusCircle')};`,
      `}`,
      `${cls}${cls}-round${shapeSuffix}{`,
      `  border-radius:${v(heightToken)};`,
      `}`,
      `${cls}${cls}-round${shapeSuffix}:not(${cls}-icon-only){`,
      `  padding-inline:${inline};`,
      `}`,
      '',
    );
  };
  sizeBlock('', 'controlHeight', 'fontSize', paddingInline, 'borderRadius');
  sizeBlock('-sm', 'controlHeightSM', 'fontSize', paddingInlineSM, 'borderRadiusSM');
  sizeBlock('-lg', 'controlHeightLG', 'fontSizeLG', paddingInline, 'borderRadiusLG');
  out.push(`${cls}${cls}-block{`, `  width:100%;`, `}`, '');
  for (const variant of ['outlined', 'dashed', 'solid', 'filled', 'text'] as const) {
    for (const color of colors) {
      out.push(...emitCombo(cls, color, variant, false), '');
    }
  }
  for (const color of linkColors) {
    out.push(...emitCombo(cls, color, 'link', false), '');
  }
  out.push(
    `${cls}${cls}:disabled,${cls}${cls}${cls}-disabled{`,
    `  cursor:not-allowed;`,
    `  border-color:${component('borderColorDisabled', v('colorBorderDisabled'))};`,
    `  background:${component('defaultBgDisabled', v('colorBgContainerDisabled'))};`,
    `  color:${v('colorTextDisabled')};`,
    `  box-shadow:none;`,
    `}`,
    `${cls}${cls}-variant-text${cls}:disabled,${cls}${cls}-variant-text${cls}${cls}-disabled,${cls}${cls}-variant-link${cls}:disabled,${cls}${cls}-variant-link${cls}${cls}-disabled{`,
    `  background:transparent;`,
    `  border-color:transparent;`,
    `}`,
    '',
  );
  out.push(
    `${cls}${cls}${cls}-color-default:disabled,${cls}${cls}${cls}-color-default${cls}-disabled{border-color:${component('defaultBorderColorDisabled', component('borderColorDisabled', v('colorBorderDisabled')))};}`,
    `${cls}${cls}${cls}-variant-dashed:disabled,${cls}${cls}${cls}-variant-dashed${cls}-disabled{background:${component('dashedBgDisabled', v('colorBgContainerDisabled'))};}`,
  );
  for (const variant of ['outlined', 'dashed', 'filled'] as const) {
    for (const color of colors) {
      out.push(...emitCombo(cls, color, variant, true), '');
    }
  }
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
  groupBorder(`${cls}-primary`, component('groupBorderColor', v('colorPrimaryHover')));
  groupBorder(`${cls}-danger`, v('colorErrorHover'));
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
  const solidSel = `${cls}-variant-solid:not([disabled])`;
  const connectBg = (color: ColorKey): string => {
    const hoverBg = colorSlots(color).solidBg[1];
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
      `  background-color:${component('groupBorderColor', bg)};`,
      `  content:"";`,
      `  inset-block:${insetOffset};`,
      `  inset-inline-start:${insetOffset};`,
      `  width:${lineWidth};`,
      `}`,
      `${compactVertical}-item${solidSel} + ${solidSel}${colorSuffix}:before{`,
      `  position:absolute;`,
      `  background-color:${component('groupBorderColor', bg)};`,
      `  content:"";`,
      `  top:${insetOffset};`,
      `  inset-inline:${insetOffset};`,
      `  height:${lineWidth};`,
      `}`,
    );
  }
  out.push('');
  out.push(
    `@supports (color:contrast-color(white)){${cls}{--apollo-btn-auto-solid-color:contrast-color(var(--apollo-btn-bg-color));}}`,
  );
  out.push(
    `@supports (color:light-dark(oklch(from white min(l,0.39) c h),white)){`,
    `${cls}{`,
    ...[...toneTokens].map(
      (token) =>
        `  ${token2CSSVar(`tone-${token2CSSVar(token, '').slice(2)}`, 'apollo-btn')}:light-dark(oklch(from ${v(token)} min(l,0.39) c h),oklch(from ${v(token)} max(l,0.82) c h));`,
    ),
    `}`,
    `}`,
  );
  return out.join('\n').replaceAll('--apollo-btn', `--${prefixCls}-btn`);
}
