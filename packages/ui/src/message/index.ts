/**
 * Message 的公共导出。
 *
 * 与 antd 的 es/message/index.js 对齐的对外面。
 * ⚠️ 骨架由 gen-component.mjs 生成 —— G2 完成后补齐类型导出，G4 后补齐样式导出。
 */

import { withInstall } from '../_internal/with-install';
import MessageComponent from './Message.vue';

/** Message 组件。注册名 `AMessage`（COMPONENT-RULES.md 规则 R2）。 */
export const Message = withInstall(MessageComponent);

export default Message;

// TODO(G2): export type { MessageProps, MessageRef, ... } from './interface';
// TODO(G4): export { genMessageStyle } from './style';
// TODO(G4): export type { ComponentToken as MessageComponentToken } from './style/token';
// TODO(G4): export { prepareComponentToken as prepareMessageComponentToken } from './style/token';
