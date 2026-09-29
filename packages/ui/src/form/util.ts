/**
 * Form 的工具函数（antd `es/form/util.js` 40 行逐字语义）。
 */

import type { InternalNamePath, Meta } from '@apollo-design/form-core';
import type { ValidateStatus } from './interface';

/** form item name 黑名单（`form_item_` 前缀兜底）。 */
const formItemNameBlackList = ['parentNode'];

const defaultItemNamePrefixCls = 'form_item';

export function toArray<T>(candidate: T | T[] | undefined | false | null): T[] {
  if (candidate === undefined || candidate === false || candidate === null) {
    return [];
  }
  return Array.isArray(candidate) ? candidate : [candidate as T];
}

/**
 * 字段的 DOM id（label htmlFor / control id / aria-describedby 共用）。
 * rc 逐字：`namePath.join('_')`，form 有 name 时加前缀；黑名单 name 加 `form_item_`。
 */
export function getFieldId(namePath: InternalNamePath, formName?: string): string | undefined {
  if (!namePath.length) {
    return undefined;
  }
  const mergedId = namePath.join('_');
  if (formName) {
    return `${formName}_${mergedId}`;
  }
  const isIllegalName = formItemNameBlackList.includes(mergedId);
  return isIllegalName ? `${defaultItemNamePrefixCls}_${mergedId}` : mergedId;
}

/**
 * 合并校验状态（antd `getStatus` 逐字）：
 * validateStatus prop > validating > errors > warnings > (touched || (hasFeedback && validated)) ⇒ success。
 */
export function getStatus(
  errors: unknown[],
  warnings: unknown[],
  meta: Meta,
  defaultValidateStatus: ValidateStatus | '',
  hasFeedback: boolean | undefined,
  validateStatus?: ValidateStatus | '',
): ValidateStatus {
  let status: ValidateStatus = defaultValidateStatus as ValidateStatus;
  if (validateStatus !== undefined) {
    status = validateStatus as ValidateStatus;
  } else if (meta.validating) {
    status = 'validating';
  } else if (errors.length) {
    status = 'error';
  } else if (warnings.length) {
    status = 'warning';
  } else if (meta.touched || (hasFeedback && meta.validated)) {
    // success feedback should display when pass hasFeedback prop and current value is valid value
    status = 'success';
  }
  return status;
}
