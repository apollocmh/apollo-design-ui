/**
 * Tag 的 Component Token（3 个）。
 *
 * 契约来源：antd 6.6.4 的 `es/tag/style/index.js` 的 prepareComponentToken。
 * `defaultBg`（colorFillTertiary onBackground colorBgContainer）与
 * `solidTextColor`（isBright(colorBgSolid) 判定）是**运行时算出的实色** ——
 * antd cssVar 产物同样是实色（#f5f5f5 / #fff），以 seed 常量落地（badge 范式）。
 */

import type { AliasToken } from '@apollo-design/theme';

export interface ComponentToken {
  /** 默认底色（= colorFillTertiary 在 colorBgContainer 上合成的实色）。 */
  defaultBg?: string;
  /** 默认文字色（= colorText）。 */
  defaultColor?: string;
  /** solid variant 的文字色（= isBright(colorBgSolid) ? '#000' : '#fff'）。 */
  solidTextColor?: string;
}

/** 与 antd 的 `prepareComponentToken` 逐字对应（默认值以 CSS 变量声明落地）。 */
export const prepareTagComponentToken = (token?: AliasToken): Partial<ComponentToken> => ({
  defaultBg: '#f5f5f5',
  defaultColor: token?.colorText ?? 'rgba(0,0,0,0.88)',
  solidTextColor: '#fff',
});
