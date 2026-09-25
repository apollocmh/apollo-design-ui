/**
 * App 的静态样式（G4 产物）。
 *
 * 契约来源：antd 6.6.4 `components/app/style/index.ts`（30 行，单规则 ——
 * 产物体积极小，直接手写逐字对拍，提取脚本管线对单规则组件是过度工程；
 * 关键值由 L7 对拍）。ComponentToken 为空（antd 同款）。
 */

/** 根形态规则（对拍 antd genBaseStyle）。 */
const RULES = `.apollo-app{color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);font-family:var(--apollo-font-family);}
.apollo-app.apollo-app-rtl{direction:rtl;}`;

/** 单前缀产物（约定出口；ant 前缀在出口替换类名段）。 */
export function genAppStyle(prefixCls: string = 'apollo'): string {
  const rules =
    prefixCls === 'apollo' ? RULES : RULES.split('.apollo-app').join('.' + prefixCls + '-app');
  return rules;
}
