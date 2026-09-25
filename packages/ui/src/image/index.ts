/**
 * Image 的公共导出。
 *
 * 与 antd 的 es/image/index.js 对齐的对外面（Image.PreviewGroup 静态属性同构）。
 */

import { withInstall } from '../_internal/with-install';
import ImageComponent from './Image';
import PreviewGroupComponent from './PreviewGroup';

/** Image 组件。注册名 `AImage`（COMPONENT-RULES.md 规则 R2）。 */
export const Image = withInstall(ImageComponent);

/** 预览分组（`Image.PreviewGroup` 的对应物）。 */
export const ImagePreviewGroup = withInstall(PreviewGroupComponent);

Image.PreviewGroup = ImagePreviewGroup as never;

export type {
  CoverPlacement,
  GroupPreviewConfig,
  ImageProgressConfig,
  ImageProps,
  ImageSemanticType,
  ImageStatus,
  MaskType,
  PlaceholderType,
  PreviewConfig,
  PreviewGroupProps,
  PreviewIcons,
  ProgressClassNames,
  ProgressStyles,
  TransformInfo,
} from './interface';
export { genImageStyle, genImageTokenDecls } from './style';
export type { ComponentToken as ImageComponentToken } from './style/token';
export { prepareComponentToken as prepareImageComponentToken } from './style/token';

export default Image;
