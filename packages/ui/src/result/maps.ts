/**
 * IconMap / ExceptionMap —— antd `es/result/index.js` 具名导出的契约。
 *
 * 单独成模块：Result.vue 与 barrel（index.ts 的 PRESENTED_IMAGE_*）都要消费，
 * 避免「两处各写一份」漂移。
 */

import {
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  WarningFilled,
} from '@apollo-design/icons';
import { NoFound } from './components/NoFound';
import { ServerError } from './components/ServerError';
import { Unauthorized } from './components/Unauthorized';

export const IconMap = {
  success: CheckCircleFilled,
  error: CloseCircleFilled,
  info: ExclamationCircleFilled,
  warning: WarningFilled,
} as const;

export const ExceptionMap = {
  404: NoFound,
  500: ServerError,
  403: Unauthorized,
} as const;
