/**
 * Tag 的公共导出（Tag / Tag.CheckableTag / Tag.CheckableTagGroup）。
 *
 * 与 antd 的 `es/tag/index.js` 对齐的对外面。CheckableTag/Group 同时以命名导出
 * 提供（Vue 侧无「静态属性」惯例，antd 的 `Tag.CheckableTag` 语义由两者等价表达）。
 */

import { withInstall } from '../_internal/with-install';
import CheckableTagComponent from './CheckableTag';
import CheckableTagGroupComponent from './CheckableTagGroup';
import TagComponent from './Tag';

/** Tag 组件。注册名 `ATag`（COMPONENT-RULES.md 规则 R2）。 */
export const Tag = withInstall(TagComponent);

/** 可勾选标签（antd 的 `Tag.CheckableTag`）。 */
export const CheckableTag = withInstall(CheckableTagComponent);

/** 可勾选标签组（antd 的 `Tag.CheckableTagGroup`）。 */
export const CheckableTagGroup = withInstall(CheckableTagGroupComponent);

// antd 的静态属性形态（`Tag.CheckableTag`）逐字保留 —— 两处引用同一定义
(Tag as { CheckableTag?: unknown }).CheckableTag = CheckableTag;
(Tag as { CheckableTagGroup?: unknown }).CheckableTagGroup = CheckableTagGroup;

export default Tag;

export { easeInOutCubic } from '../_internal/scroll-to';
export type {
  CheckableTagGroupProps,
  CheckableTagOption,
  CheckableTagProps,
  TagColor,
  TagProps,
  TagRef,
  TagSemanticClassNames,
  TagSemanticStyles,
  TagVariant,
} from './interface';
export { genTagStyle } from './style';
export type { ComponentToken as TagComponentToken } from './style/token';
export { prepareTagComponentToken } from './style/token';
