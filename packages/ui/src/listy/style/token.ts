/**
 * Listy 的 Component Token（antd `prepareComponentToken` 全 **2 个字段**）。
 *
 * 契约来源：antd 6.6.4 `es/listy/style/index.js`：
 *
 * ```js
 * export const prepareComponentToken = (token) => ({
 *   itemPaddingBlock: token.paddingSM,
 *   itemPaddingInline: token.padding,
 * });
 * ```
 *
 * ── 落地形态（radio D46 同判）────────────────────────────────────────────────
 *
 * 两个字段都是**纯别名引用** ⇒ CSS 声明走 `var(--apollo-*)`，随主题自适应；
 * 组件内消费 `var(--${rootPrefixCls}-listy-item-padding-block|-inline)`。
 */

import type { AliasToken } from '@apollo-design/theme';

export interface ComponentToken {
  /** 项的纵向内边距（= `paddingSM`）。 */
  itemPaddingBlock: number | string;
  /** 项的横向内边距（= `padding`）。 */
  itemPaddingInline: number | string;
}

export const prepareComponentToken = (token: AliasToken): ComponentToken => ({
  itemPaddingBlock: token.paddingSM,
  itemPaddingInline: token.padding,
});

export default prepareComponentToken;
