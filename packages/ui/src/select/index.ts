/**
 * Select 的公共导出。
 *
 * 与 antd 的 es/select/index.js 对齐的对外面。
 * ⚠️ 骨架由 gen-component.mjs 生成 —— G2 完成后补齐类型导出，G4 后补齐样式导出。
 */

import { withInstall } from '../_internal/with-install';
import SelectComponent from './Select.vue';

/** Select 组件。注册名 `ASelect`（COMPONENT-RULES.md 规则 R2）。 */
export const Select = withInstall(SelectComponent);

export default Select;

// TODO(G2): export type { SelectProps, SelectRef, ... } from './interface';
// TODO(G4): export { genSelectStyle } from './style';
// TODO(G4): export type { ComponentToken as SelectComponentToken } from './style/token';
// TODO(G4): export { prepareComponentToken as prepareSelectComponentToken } from './style/token';
