/** Static layout for stable native dl/div/dt/dd description items. */
import { token2CSSVar } from '@apollo-design/theme';

const v = (token: string) => `var(${token2CSSVar(token)})`;
const sv = (prefix: string, token: string) => `var(--${prefix}-descriptions-${token})`;

export function genTokenDecls(p: string): string[] {
  return [
    `  --${p}-descriptions-label-bg:${v('colorFillAlter')};`,
    `  --${p}-descriptions-label-color:${v('colorTextSecondary')};`,
    `  --${p}-descriptions-title-color:${v('colorText')};`,
    `  --${p}-descriptions-title-margin-bottom:calc(${v('fontSizeSM')} * ${v('lineHeightSM')});`,
    `  --${p}-descriptions-item-padding-bottom:${v('padding')};`,
    `  --${p}-descriptions-item-padding-end:${v('padding')};`,
    `  --${p}-descriptions-colon-margin-right:${v('marginXS')};`,
    `  --${p}-descriptions-colon-margin-left:calc(${v('marginXXS')} / 2);`,
    `  --${p}-descriptions-content-color:${v('colorText')};`,
    `  --${p}-descriptions-extra-color:${v('colorText')};`,
  ];
}
export function genDescriptionsStyle(p: string): string {
  const D = `.${p}-descriptions`,
    view = `${D} > ${D}-view`,
    list = `${view} > ${D}-list`;
  const item = `${list} > ${D}-item`,
    label = `${item} > ${D}-item-label`,
    content = `${item} > ${D}-item-content`;
  const B = `${D}${D}-bordered`,
    V = `${D}${D}-vertical`;
  const bItem = `${B} > ${D}-view > ${D}-list > ${D}-item`;
  const verticalItem = `${V} > ${D}-view > ${D}-list > ${D}-item`;
  const split = `${v('lineWidth')} ${v('lineType')} ${v('colorSplit')}`;
  return [
    `${D}{`,
    ...genTokenDecls(p),
    `  box-sizing:border-box;margin:0;padding:0;color:${v('colorText')};font-size:${v('fontSize')};line-height:${v('lineHeight')};font-family:${v('fontFamily')};`,
    `}`,
    `${D}-rtl{direction:rtl;}`,
    `${D}${D}-medium{--${p}-descriptions-item-padding-bottom:${v('paddingSM')};}`,
    `${D}${D}-small{--${p}-descriptions-item-padding-bottom:${v('paddingXS')};}`,
    `${D} > ${D}-header{display:flex;align-items:center;margin-bottom:${sv(p, 'title-margin-bottom')};}`,
    `${D} > ${D}-header > ${D}-title{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;flex:auto;color:${sv(p, 'title-color')};font-weight:${v('fontWeightStrong')};font-size:${v('fontSizeLG')};line-height:${v('lineHeightLG')};}`,
    `${D} > ${D}-header > ${D}-extra{margin-inline-start:auto;color:${sv(p, 'extra-color')};font-size:${v('fontSize')};}`,
    `${view}{box-sizing:border-box;width:100%;border-radius:${v('borderRadiusLG')};}`,
    `${list}{display:grid;grid-template-columns:repeat(var(--apollo-descriptions-columns),minmax(0,1fr));margin:0;}`,
    `${item}{display:flex;align-items:baseline;min-width:0;grid-column:span var(--apollo-descriptions-span);padding-block-end:${sv(p, 'item-padding-bottom')};padding-inline-end:${sv(p, 'item-padding-end')};}`,
    `${item}${D}-item-row-end{padding-inline-end:0;}`,
    `${item}${D}-item-last-row{padding-block-end:0;}`,
    `${label},${content}{min-width:0;margin:0;font-size:${v('fontSize')};line-height:${v('lineHeight')};text-align:start;overflow-wrap:break-word;}`,
    `${label}{color:${sv(p, 'label-color')};font-weight:normal;}`,
    `${label}::after{content:":";position:relative;top:-0.5px;margin-inline:${sv(p, 'colon-margin-left')} ${sv(p, 'colon-margin-right')};}`,
    `${label}${D}-item-no-colon::after{content:"";}`,
    `${label}${D}-item-no-label{display:none;}`,
    `${content}{flex:1;color:${sv(p, 'content-color')};word-break:break-word;}`,
    `${verticalItem}{display:grid;grid-template-rows:subgrid;grid-row:span 2;align-items:start;}`,
    `${verticalItem} > ${D}-item-label{grid-row:1;padding-block-end:${sv(p, 'item-padding-bottom')};}`,
    `${verticalItem} > ${D}-item-content{grid-row:2;}`,
    `${B} > ${D}-view{border:${split};overflow:hidden;}`,
    `${B} > ${D}-view > ${D}-list{grid-template-columns:repeat(var(--apollo-descriptions-columns),auto minmax(0,1fr));}`,
    `${bItem}{display:grid;grid-template-columns:subgrid;grid-column:span calc(var(--apollo-descriptions-span) * 2);padding:0;align-items:stretch;border-block-end:${split};border-inline-end:${split};}`,
    `${bItem}${D}-item-row-end{border-inline-end:none;}`,
    `${bItem}${D}-item-last-row{border-block-end:none;}`,
    `${bItem} > ${D}-item-label,${bItem} > ${D}-item-content{padding:${sv(p, 'item-padding-bottom')} ${sv(p, 'item-padding-end')};}`,
    `${bItem} > ${D}-item-label{grid-column:1;background-color:${sv(p, 'label-bg')};border-inline-end:${split};}`,
    `${bItem} > ${D}-item-label::after{display:none;}`,
    `${bItem} > ${D}-item-content{grid-column:2 / -1;}`,
    `${bItem}${D}-item-without-label > ${D}-item-content{grid-column:1 / -1;}`,
    `${B}${D}-vertical > ${D}-view > ${D}-list{grid-template-columns:repeat(var(--apollo-descriptions-columns),minmax(0,1fr));}`,
    `${B}${D}-vertical > ${D}-view > ${D}-list > ${D}-item{grid-column:span var(--apollo-descriptions-span);grid-template-columns:minmax(0,1fr);}`,
    `${B}${D}-vertical > ${D}-view > ${D}-list > ${D}-item > ${D}-item-label{grid-column:1;border-inline-end:none;border-block-end:${split};}`,
    `${B}${D}-vertical > ${D}-view > ${D}-list > ${D}-item > ${D}-item-content{grid-column:1;}`,
  ].join('\n');
}
