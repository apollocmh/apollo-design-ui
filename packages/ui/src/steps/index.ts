/**
 * Steps 的公共导出。
 *
 * 与 antd 的 es/steps/index.js 对齐的对外面。
 * ⚠️ 骨架由 gen-component.mjs 生成 —— G2 完成后补齐类型导出，G4 后补齐样式导出。
 */

import { withInstall } from '../_internal/with-install';
import StepsComponent from './Steps.vue';

/** Steps 组件。注册名 `ASteps`（COMPONENT-RULES.md 规则 R2）。 */
export const Steps = withInstall(StepsComponent);

export default Steps;

// TODO(G2): export type { StepsProps, StepsRef, ... } from './interface';
// TODO(G4): export { genStepsStyle } from './style';
// TODO(G4): export type { ComponentToken as StepsComponentToken } from './style/token';
// TODO(G4): export { prepareComponentToken as prepareStepsComponentToken } from './style/token';
