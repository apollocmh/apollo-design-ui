/** Shared status-to-component maps; illustration exports retain component identity. */

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
