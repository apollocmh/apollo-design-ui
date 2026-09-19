/**
 * `ConfigProvider.useConfig()` —— 读「组件级」的两个全局开关。
 *
 * 契约来源：antd 6.6.4 的 `components/config-provider/hooks/useConfig.ts`：
 *
 * ```js
 * { componentDisabled: useContext(DisabledContext), componentSize: useContext(SizeContext) }
 * ```
 *
 * ⚠️ 与 antd 的一处**平台差异**：返回的是 `ComputedRef`（要 `.value`），不是裸值。
 *    裸值在 Vue 里等于把配置在 setup 期定死（`inject` 只解析一次），之后
 *    `componentSize` 变化就读不到了 —— 与 D27「解构即快照」同源。
 */

import { useDisabled } from './disabled-context';
import type { UseConfigResult } from './interface';
import { useSize } from './size-context';

export function useConfig(): UseConfigResult {
  return {
    componentDisabled: useDisabled(),
    componentSize: useSize<undefined>(),
  };
}

export default useConfig;
