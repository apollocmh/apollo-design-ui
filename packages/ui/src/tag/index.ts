/**
 * Tag 的公共导出（Tag / Tag.CheckableTag / Tag.CheckableTagGroup）。
 *
 * 与 antd 的 `es/tag/index.js` 对齐的对外面。CheckableTag/Group 同时以命名导出
 * 提供（Vue 侧无「静态属性」惯例，antd 的 `Tag.CheckableTag` 语义由两者等价表达）。
 */

import { type WithInstall, withInstall } from '../_internal/with-install';
import CheckableTagComponent from './CheckableTag';
import CheckableTagGroupComponent from './CheckableTagGroup';
import TagComponent from './Tag';

export const CheckableTag = withInstall(CheckableTagComponent);
export const CheckableTagGroup: WithInstall<typeof CheckableTagGroupComponent> = withInstall(
  CheckableTagGroupComponent,
);
export const Tag: WithInstall<
  typeof TagComponent & {
    CheckableTag: typeof CheckableTag;
    CheckableTagGroup: typeof CheckableTagGroup;
  }
> = withInstall(Object.assign(TagComponent, { CheckableTag, CheckableTagGroup }));

export default Tag;

export { easeInOutCubic } from '../_internal/scroll-to';
export type {
  CheckableTagEmits,
  CheckableTagGroupEmits,
  CheckableTagGroupProps,
  CheckableTagGroupRef,
  CheckableTagGroupValue,
  CheckableTagOption,
  CheckableTagProps,
  CheckableTagRef,
  CheckableTagSlots,
  CheckableTagValue,
  GroupSemanticClassNames,
  GroupSemanticStyles,
  TagClosable,
  TagClosableConfig,
  TagColor,
  TagConfig,
  TagEmits,
  TagProps,
  TagRef,
  TagSemanticClassNames,
  TagSemanticStyles,
  TagSlots,
  TagVariant,
} from './interface';
export { genTagStyle } from './style';
export type { ComponentToken as TagComponentToken } from './style/token';
export { prepareTagComponentToken } from './style/token';
