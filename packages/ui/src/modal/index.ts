/**
 * Modal 的公共导出。
 *
 * 与 antd 的 es/modal/index.js 对齐的对外面。
 * ⚠️ 骨架由 gen-component.mjs 生成 —— G2 完成后补齐类型导出，G4 后补齐样式导出。
 */

import { withInstall } from '../_internal/with-install';
import ModalComponent from './Modal.vue';

/** Modal 组件。注册名 `AModal`（COMPONENT-RULES.md 规则 R2）。 */
export const Modal = withInstall(ModalComponent);

export default Modal;

// TODO(G2): export type { ModalProps, ModalRef, ... } from './interface';
// TODO(G4): export { genModalStyle } from './style';
// TODO(G4): export type { ComponentToken as ModalComponentToken } from './style/token';
// TODO(G4): export { prepareComponentToken as prepareModalComponentToken } from './style/token';
