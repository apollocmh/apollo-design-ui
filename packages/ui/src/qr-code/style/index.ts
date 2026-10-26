/**
 * QRCode 的样式生成（genQrCodeStyle）。
 *
 * 契约来源：antd 6.6.4 `es/qr-code/style/index.js`（逐行对拍）。
 *
 * ── 与 antd 产物的有意差异 ────────────────────────────────────────────────────
 *
 * 1. 静态CSS以当前Alias派生遮罩默认色；源主题在拥有者投射唯一Component Token。
 * 2. `QRCodeTextColor` 是 mergeToken 注入的别名（= colorText）⇒ 直接 `var()`。
 */

import { token2CSSVar } from '@apollo-design/theme';
import { Color } from '@apollo-design/utils';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/** Component Token 的 CSS 变量名（组件内消费用）。 */
const sv = (rootPrefixCls: string, name: string): string =>
  `var(--${rootPrefixCls}-qrcode-${name})`;

/** Public shape of the existing cover token. */
export interface QRCodeComponentToken {
  QRCodeCoverBackgroundColor: string;
}
export function prepareComponentToken(token: { colorBgContainer: string }): QRCodeComponentToken {
  const base = new Color(token.colorBgContainer).toRgb();
  return {
    QRCodeCoverBackgroundColor: new Color({
      r: base.r,
      g: base.g,
      b: base.b,
      a: 0.96,
    }).toRgbString(),
  };
}

export function genTokenDecls(rootPrefixCls: string): string[] {
  const p = rootPrefixCls;
  return [
    `  --${p}-qrcode-cover-background-color:color-mix(in srgb,${v('colorBgContainer')} 96%,transparent);`,
  ];
}

export function genQrCodeStyle(rootPrefixCls: string): string {
  const p = rootPrefixCls;
  const cls = `.${p}-qrcode`;
  return [
    `${cls}{`,
    ...genTokenDecls(p),
    // resetComponent 全套
    `  box-sizing:border-box;`,
    `  margin:0;`,
    `  padding:0;`,
    `  color:${v('colorText')};`,
    `  font-size:${v('fontSize')};`,
    `  line-height:${v('lineHeight')};`,
    `  list-style:none;`,
    `  font-family:${v('fontFamily')};`,
    // genQRCodeStyle
    `  display:flex;`,
    `  justify-content:center;`,
    `  align-items:center;`,
    `  padding:${v('paddingSM')};`,
    `  background-color:${v('colorWhite')};`,
    `  border-radius:${v('borderRadiusLG')};`,
    `  border:${v('lineWidth')} ${v('lineType')} ${v('colorSplit')};`,
    `  position:relative;`,
    `  overflow:hidden;`,
    `}`,
    `${cls} > ${cls}-cover{`,
    `  position:absolute;`,
    `  inset-block-start:0;`,
    `  inset-inline-start:0;`,
    `  z-index:10;`,
    `  display:flex;`,
    `  flex-direction:column;`,
    `  justify-content:center;`,
    `  align-items:center;`,
    `  width:100%;`,
    `  height:100%;`,
    `  color:${v('colorText')};`,
    `  line-height:${v('lineHeight')};`,
    `  background:${sv(p, 'cover-background-color')};`,
    `  text-align:center;`,
    `}`,
    `${cls} > ${cls}-cover > ${cls}-expired,`,
    `${cls} > ${cls}-cover > ${cls}-scanned{`,
    `  color:${v('colorText')};`,
    `}`,
    `${cls} > canvas,${cls} > svg{`,
    `  display:block;`,
    `  width:100%;`,
    `  height:100%;`,
    `  object-fit:contain;`,
    `  align-self:stretch;`,
    `  flex:auto;`,
    `  min-width:0;`,
    `  min-height:0;`,
    `}`,
    `${cls}-icon{`,
    `  margin-block-end:${v('marginXS')};`,
    `  font-size:${v('controlHeight')};`,
    `}`,
    `${cls}-borderless{`,
    `  border-color:transparent;`,
    `  padding:0;`,
    `  border-radius:0;`,
    `}`,
  ].join('\n');
}
