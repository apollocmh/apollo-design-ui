import { token2CSSVar } from '@apollo-design/theme';

const v = (token: string): string => `var(${token2CSSVar(token)})`;

/** Static CSS for a ConfigProvider root prefix. Empty has no Component Token. */
export function genEmptyStyle(prefixCls: string): string {
  const cls = `.${prefixCls}-empty`;
  return [
    `${cls}{`,
    `  margin-inline:${v('marginXS')};`,
    `  font-size:${v('fontSize')};`,
    `  line-height:${v('lineHeight')};`,
    `  text-align:center;`,
    `}`,
    `${cls}-image{`,
    `  margin-bottom:${v('marginXS')};`,
    `}`,
    `${cls}-image:not(${cls}-image-content){`,
    `  height:calc(${v('controlHeightLG')} * 2.5);`,
    `  opacity:${v('opacityImage')};`,
    `}`,
    `${cls}-image:not(${cls}-image-content) > img,${cls}-image:not(${cls}-image-content) > svg{`,
    `  max-width:100%;`,
    `  height:100%;`,
    `  object-fit:contain;`,
    `  margin:auto;`,
    `}`,
    `${cls}-description{`,
    `  color:${v('colorTextSecondary')};`,
    `  overflow-wrap:anywhere;`,
    `}`,
    `${cls}-footer{`,
    `  margin-top:${v('margin')};`,
    `}`,
    `${cls}-normal{`,
    `  margin-block:${v('marginXL')};`,
    `}`,
    `${cls}-normal ${cls}-image:not(${cls}-image-content){`,
    `  height:${v('controlHeightLG')};`,
    `}`,
    `${cls}-small{`,
    `  margin-block:${v('marginXS')};`,
    `}`,
    `${cls}-small ${cls}-image:not(${cls}-image-content){`,
    `  height:calc(${v('controlHeightLG')} * 0.875);`,
    `}`,
    '',
  ].join('\n');
}
