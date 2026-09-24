/**
 * `components/input/utils.ts` 的本仓实现。
 *
 * ⚠️ antd 的 `hasPrefixSuffix` 与 rc 的**不同**：antd 版本把 `showCount` 也计入
 * （因为字数统计要渲染后缀节点）。两者不能互相替代 —— 本文件的判据是 antd 版。
 */

import type { InputProps } from './interface';

export function hasPrefixSuffix(props: {
  prefix?: unknown;
  suffix?: unknown;
  allowClear?: InputProps['allowClear'];
  showCount?: InputProps['showCount'];
}): boolean {
  return !!(props.prefix || props.suffix || props.allowClear || props.showCount);
}
