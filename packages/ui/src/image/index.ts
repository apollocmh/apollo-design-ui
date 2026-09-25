/**
 * Image 的公共导出。
 *
 * 与 antd 的 es/image/index.js 对齐的对外面。
 * ⚠️ 骨架由 gen-component.mjs 生成 —— G2 完成后补齐类型导出，G4 后补齐样式导出。
 */

import { withInstall } from '../_internal/with-install';
import ImageComponent from './Image.vue';

/** Image 组件。注册名 `AImage`（COMPONENT-RULES.md 规则 R2）。 */
export const Image = withInstall(ImageComponent);

export default Image;

// TODO(G2): export type { ImageProps, ImageRef, ... } from './interface';
// TODO(G4): export { genImageStyle } from './style';
// TODO(G4): export type { ComponentToken as ImageComponentToken } from './style/token';
// TODO(G4): export { prepareComponentToken as prepareImageComponentToken } from './style/token';
