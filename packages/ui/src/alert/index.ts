/**
 * Alert 的公共导出（Alert / Alert.ErrorBoundary）。
 *
 * 与 antd 的 `es/alert/index.js` 对齐的对外面：antd 用
 * `Object.assign(Alert, { ErrorBoundary })` 挂静态子组件（skeleton 范式）。
 */

import { withInstall } from '../_internal/with-install';
import AlertComponent from './Alert';
import ErrorBoundaryComponent from './ErrorBoundary';

/** Alert 组件。注册名 `AAlert`（COMPONENT-RULES.md 规则 R2）。 */
export const Alert = withInstall(AlertComponent);

/** `Alert.ErrorBoundary`（onErrorCaptured 实现的错误边界）。 */
export const AlertErrorBoundary = withInstall(ErrorBoundaryComponent);

/** antd 的静态属性形态（`Alert.ErrorBoundary`）逐字保留 —— 两处引用同一定义。 */
Object.assign(Alert, { ErrorBoundary: AlertErrorBoundary });

export default Alert;

export type {
  AlertClosable,
  AlertConfig,
  AlertProps,
  AlertRef,
  AlertSemanticAllType,
  AlertSemanticClassNames,
  AlertSemanticStyles,
  AlertSemanticValue,
  AlertType,
  AlertVariant,
  ErrorBoundaryProps,
} from './interface';
export { genAlertStyle } from './style';
export type { ComponentToken as AlertComponentToken } from './style/token';
export { prepareComponentToken as prepareAlertComponentToken } from './style/token';
