/**
 * Form 的**叶子模块** —— `form/context`。
 *
 * 契约来源：antd 6.6.4 的 `es/form/context.js`。这里只落 input 族组件（当前
 * InputNumber）需要的最小子集：`FormItemInputContext`（校验状态/反馈图标/
 * 表单内标记）与 `VariantContext`（Form.Item 级 variant 覆盖）。
 *
 * ── 为什么在本轮新建（empty → config-provider/context 先例）──────────────────
 *
 * `form/context` 是 InputNumber 的 `leafModules` 依赖，但 Form 组件本体尚未
 * 落地（registry `form: todo`）。registry 把它标成 `leafModules` 而不是
 * `components` 依赖，正是因为消费组件只需要其中几个通道 —— 本文件就是那个
 * 「先落的最小可用版」。Form 落地时在此扩展 FormContext / FormProvider /
 * FormItemPrefixContext，**不改已有键的语义**。
 *
 * `getMergedStatus` 同理（antd 在 `_util/statusUtils`）：space/statusUtils 只落了
 * `getStatusClassNames`，`getMergedStatus` 依赖 Form 侧的 status 通道 —— 一行
 * 合并逻辑随本叶子先落，Input 落地时再评估是否提升。
 */

import { type ComputedRef, computed, type InjectionKey, inject } from 'vue';
import type { InputStatus } from '../space/statusUtils';

/** antd 的 `FormItemInputContext` 值形状（Form.Item 向输入族组件广播的通道）。 */
export interface FormItemInputContextValue {
  status?: InputStatus;
  hasFeedback?: boolean;
  feedbackIcon?: unknown;
  /** 处于 Form.Item 内（影响 `-in-form-item` 类与紧凑样式）。 */
  isFormItemInput?: boolean;
  /** Form.Item 的 variant 覆盖（经 `VariantContext` 单独广播，此处合并收口）。 */
  variant?: 'outlined' | 'borderless' | 'filled' | 'underlined';
}

/** 注入键。没有 Provider 时走「不在 Form.Item 里」的默认值。 */
export const formItemInputContextKey: InjectionKey<FormItemInputContextValue> = Symbol(
  'apolloFormItemInputContext',
);

/** Form.Item 级 variant 覆盖（antd 的 `VariantContext`）。 */
export const variantContextKey: InjectionKey<
  ComputedRef<'outlined' | 'borderless' | 'filled' | 'underlined' | undefined>
> = Symbol('apolloFormVariantContext');

/** 读取 FormItemInputContext（恒有值：空对象即默认）。 */
export function useFormItemInputContext(): ComputedRef<FormItemInputContextValue> {
  const injected = inject(formItemInputContextKey, undefined);
  return computed(() => injected ?? {});
}

/**
 * 校验状态合并：自定义 status 优先，否则用 Form.Item 的（antd 的
 * `getMergedStatus(contextStatus, customStatus)` —— `customStatus ?? contextStatus`）。
 */
export function getMergedStatus(
  contextStatus: InputStatus | undefined,
  customStatus: InputStatus | undefined,
): InputStatus | undefined {
  return customStatus ?? contextStatus;
}
