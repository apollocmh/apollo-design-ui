/**
 * Image 的公共导出。
 *
 * 与 antd 的 es/image/index.js 对齐的对外面（Image.PreviewGroup 静态属性同构）。
 */

import { withInstall } from '../_internal/with-install';
import ImageComponent from './Image';
import PreviewGroupComponent from './PreviewGroup';

/** 预览分组（`Image.PreviewGroup` 的对应物）。 */
export const ImagePreviewGroup = withInstall(PreviewGroupComponent);

/** Preserve the real Group type on both the static and named public exports. */
export const Image = withInstall(
  Object.assign(ImageComponent, { PreviewGroup: ImagePreviewGroup }),
);

export type {
  CoverPlacement,
  GroupPreviewConfig,
  ImageProgressConfig,
  ImageProps,
  ImageRenderInfo,
  ImageSemanticType,
  ImageSlots,
  ImageStatus,
  MaskType,
  PlaceholderType,
  PreviewActions,
  PreviewActionsInfo,
  PreviewConfig,
  PreviewCountInfo,
  PreviewGroupItem,
  PreviewGroupProps,
  PreviewGroupSemanticType,
  PreviewGroupSlots,
  PreviewIcons,
  PreviewImageData,
  PreviewImageInfo,
  ProgressClassNames,
  ProgressStyles,
  TransformInfo,
} from './interface';
export { genImageStyle, genImageTokenDecls } from './style';
export type { ComponentToken as ImageComponentToken } from './style/token';
export { prepareComponentToken as prepareImageComponentToken } from './style/token';

export default Image;
