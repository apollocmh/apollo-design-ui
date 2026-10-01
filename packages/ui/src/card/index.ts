/**
 * Card 的公共导出。
 *
 * 与 antd 的 es/card/index.js 对齐的对外面。
 * ⚠️ 骨架由 gen-component.mjs 生成 —— G2 完成后补齐类型导出，G4 后补齐样式导出。
 */

import { withInstall } from '../_internal/with-install';
import CardComponent from './Card.vue';

/** Card 组件。注册名 `ACard`（COMPONENT-RULES.md 规则 R2）。 */
export const Card = withInstall(CardComponent);

export default Card;

// TODO(G2): export type { CardProps, CardRef, ... } from './interface';
// TODO(G4): export { genCardStyle } from './style';
// TODO(G4): export type { ComponentToken as CardComponentToken } from './style/token';
// TODO(G4): export { prepareComponentToken as prepareCardComponentToken } from './style/token';
