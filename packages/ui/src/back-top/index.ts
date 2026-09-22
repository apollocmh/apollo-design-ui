/**
 * BackTop 的公共导出。
 *
 * 与 antd 的 `es/back-top/index.js` 对齐的对外面。
 */

import { withInstall } from '../_internal/with-install';
import BackTopComponent from './BackTop';

/**
 * BackTop 组件。注册名 `ABackTop`（COMPONENT-RULES.md 规则 R2）。
 *
 * @deprecated Please use `FloatButton.BackTop` instead.
 */
export const BackTop = withInstall(BackTopComponent);

export default BackTop;

export { easeInOutCubic, type ScrollToOptions, scrollTo } from '../_internal/scroll-to';
export type { BackTopProps, BackTopTarget } from './interface';
export { genBackTopStyle } from './style';
export type { ComponentToken as BackTopComponentToken } from './style/token';
export { prepareBackTopComponentToken } from './style/token';
