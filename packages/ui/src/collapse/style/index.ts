/** Static styles for the Collapse scope and its real Vue Panel parts. */
import { token2CSSVar } from '@apollo-design/theme';

export { type ComponentToken, prepareComponentToken } from './token';

const v = (token: string): string => `var(${token2CSSVar(token)})`;

export function genTokenDecls(rootPrefixCls: string): string[] {
  const prefix = `--${rootPrefixCls}-collapse`;
  return [
    `${prefix}-header-padding:${v('paddingSM')} ${v('padding')};`,
    `${prefix}-header-padding-sm:${v('paddingXS')} ${v('paddingSM')} ${v('paddingXS')} ${v('paddingXS')};`,
    `${prefix}-header-padding-lg:${v('padding')} ${v('paddingLG')} ${v('padding')} ${v('padding')};`,
    `${prefix}-header-bg:${v('colorFillAlter')};`,
    `${prefix}-content-padding:${v('padding')} 16px;`,
    `${prefix}-content-padding-sm:${v('paddingSM')};`,
    `${prefix}-content-padding-lg:${v('paddingLG')};`,
    `${prefix}-content-bg:${v('colorBgContainer')};`,
    `${prefix}-borderless-content-padding:${v('paddingXXS')} 16px ${v('padding')};`,
    `${prefix}-borderless-content-bg:transparent;`,
    `${prefix}-panel-border-radius:${v('borderRadiusLG')};`,
  ];
}

export function genCollapseStyle(rootPrefixCls: string): string {
  const cls = `.${rootPrefixCls}-collapse`;
  const token = (name: string) => `var(--${rootPrefixCls}-collapse-${name})`;
  const border = `${v('lineWidth')} ${v('lineType')} ${v('colorBorder')}`;
  const motion = `${cls}-motion`;
  return `
${cls}{
  ${genTokenDecls(rootPrefixCls).join('\n  ')}
  box-sizing:border-box;margin:0;padding:0;
  color:${v('colorText')};font-size:${v('fontSize')};line-height:${v('lineHeight')};
  font-family:${v('fontFamily')};list-style:none;
  background-color:${token('header-bg')};border:${border};border-radius:var(--${rootPrefixCls}-collapse-panel-border-radius);
}
${cls}-rtl,${cls}-item-rtl{direction:rtl;}
${cls}-item{box-sizing:border-box;border-bottom:${border};}
${cls}-item:first-child,${cls}-item:first-child > ${cls}-header{
  border-start-start-radius:${token('panel-border-radius')};border-start-end-radius:${token('panel-border-radius')};
}
${cls}-item:last-child,${cls}-item:last-child > ${cls}-header{
  border-end-start-radius:${token('panel-border-radius')};border-end-end-radius:${token('panel-border-radius')};
}
${cls}-header{
  position:relative;display:flex;flex-wrap:nowrap;align-items:flex-start;
  padding:${token('header-padding')};color:${v('colorTextHeading')};line-height:inherit;cursor:pointer;
  transition:color ${v('motionDurationMid')}, background-color ${v('motionDurationMid')};
}
${cls}-heading{flex:1;min-width:0;margin:0;padding:0;font:inherit;color:inherit;}
${cls}-trigger{
  display:flex;align-items:flex-start;width:100%;min-width:0;box-sizing:border-box;
  margin:0;padding:0;border:0;border-radius:0;background:transparent;color:inherit;
  font:inherit;text-align:start;cursor:pointer;appearance:none;
}
${cls}-trigger:focus-visible{outline:2px solid ${v('colorPrimary')};outline-offset:2px;}
${cls}-title{flex:1;min-width:0;}
${cls}-title > svg{display:inline-block;vertical-align:middle;margin-block-end:0.2em;}
${cls}-expand-icon{
  display:flex;flex:none;align-items:center;height:${v('fontHeight')};
  margin-inline-end:${v('marginSM')};font-size:${v('fontSizeIcon')};
}
${cls}-arrow{display:inline-flex;font-size:inherit;}
${cls}-arrow svg{transition:transform ${v('motionDurationMid')};}
${cls}-extra{flex:none;}
${cls}-item-header > ${cls}-header,${cls}-item-icon > ${cls}-header{cursor:default;}
${cls}-item-header > ${cls}-header > ${cls}-heading,
${cls}-item-icon > ${cls}-header > ${cls}-heading{flex:none;}
${cls}-item-header > ${cls}-header > ${cls}-heading > ${cls}-trigger{width:auto;}
${cls}-item-end > ${cls}-header > ${cls}-heading > ${cls}-trigger > ${cls}-expand-icon{
  order:1;margin-inline-start:${v('marginSM')};margin-inline-end:0;
}
${cls}-item-icon${cls}-item-end > ${cls}-header > ${cls}-heading{order:1;}
${cls}-panel{box-sizing:border-box;color:${v('colorText')};background-color:${token('content-bg')};border-top:${border};}
${cls}-panel > ${cls}-body{padding:${token('content-padding')};}
${cls}-panel-hidden,${cls}-panel[hidden]{display:none;}
${cls}-item-small > ${cls}-header{padding:${token('header-padding-sm')};}
${cls}-item-small > ${cls}-header > ${cls}-heading > ${cls}-trigger > ${cls}-expand-icon{
  margin-inline-start:calc(${v('paddingSM')} - ${v('paddingXS')});
}
${cls}-item-small > ${cls}-panel > ${cls}-body{padding:${token('content-padding-sm')};}
${cls}-item-large{font-size:${v('fontSizeLG')};line-height:${v('lineHeightLG')};}
${cls}-item-large > ${cls}-header{padding:${token('header-padding-lg')};}
${cls}-item-large > ${cls}-header > ${cls}-heading > ${cls}-trigger > ${cls}-expand-icon{
  height:${v('fontHeightLG')};margin-inline-start:calc(${v('paddingLG')} - ${v('padding')});
}
${cls}-item-large > ${cls}-panel > ${cls}-body{padding:${token('content-padding-lg')};}
${cls}-item:last-child{border-bottom:0;}
${cls}-item:last-child > ${cls}-panel{
  border-end-start-radius:${token('panel-border-radius')};border-end-end-radius:${token('panel-border-radius')};
}
${cls}-item-disabled > ${cls}-header{color:${v('colorTextDisabled')};cursor:not-allowed;}
${cls}-trigger:disabled{color:inherit;cursor:not-allowed;}
${cls}-borderless{border:0;}
${cls}-item-borderless:last-child,${cls}-item-borderless:last-child > ${cls}-header{border-radius:0;}
${cls}-item-borderless > ${cls}-panel{background-color:${token('borderless-content-bg')};border-top:0;}
${cls}-item-borderless > ${cls}-panel > ${cls}-body{padding:${token('borderless-content-padding')};}
${cls}-ghost{background-color:transparent;border:0;}
${cls}-item-ghost{border-bottom:0;}
${cls}-item-ghost > ${cls}-panel{background-color:transparent;border:0;}
${cls}-item-ghost > ${cls}-panel > ${cls}-body{padding-block:${v('paddingSM')};}
${motion}{overflow:hidden;transition:height ${v('motionDurationMid')} ${v('motionEaseInOut')}, opacity ${v('motionDurationMid')} ${v('motionEaseInOut')} !important;}
@media (prefers-reduced-motion:reduce){
  ${cls}-header,${cls}-arrow svg,${motion}{transition:none !important;}
}`;
}
