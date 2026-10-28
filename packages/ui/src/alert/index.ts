/**
 * Alert 的公共导出与有类型的静态 ErrorBoundary 子组件。
 */

import { withInstall } from '../_internal/with-install';
import AlertComponent from './Alert';
import ErrorBoundaryComponent from './ErrorBoundary';

/** Alert 组件。注册名 `AAlert`（COMPONENT-RULES.md 规则 R2）。 */
const InstalledAlert = withInstall(AlertComponent);

/** `Alert.ErrorBoundary`（onErrorCaptured 实现的错误边界）。 */
export const AlertErrorBoundary = withInstall(ErrorBoundaryComponent);

/** 静态入口和具名入口引用同一组件定义，并保留完整公开类型。 */
export const Alert = Object.assign(InstalledAlert, { ErrorBoundary: AlertErrorBoundary });

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
  AlertSlots,
  AlertType,
  AlertVariant,
  ErrorBoundaryProps,
  ErrorBoundarySlots,
} from './interface';
export { genAlertStyle } from './style';
export type { ComponentToken as AlertComponentToken } from './style/token';
export { prepareComponentToken as prepareAlertComponentToken } from './style/token';
