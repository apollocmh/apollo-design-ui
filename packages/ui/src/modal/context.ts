/**
 * `ModalContext` —— antd `components/modal/context.tsx` 的 Vue 版。
 *
 * | React | Vue |
 * |---|---|
 * | `createContext({})` + `Provider value={memoizedValue}` | `provide` / `inject` + `InjectionKey` |
 *
 * 上游用它把「footer 的按钮配置」与「confirm 的按钮配置」交给子组件：
 *   - `shared.tsx` 的 `Footer` 提供：`confirmLoading` / `okButtonProps` /
 *     `cancelButtonProps` / `okTextLocale` / `cancelTextLocale` / `okType` /
 *     `onOk` / `onCancel`；
 *   - `ConfirmDialog.tsx` 的 `ConfirmContent` 提供：`autoFocusButton` /
 *     `cancelTextLocale` / `okTextLocale` / `mergedOkCancel` / `onClose` +
 *     `...restProps`（含 `close` / `onConfirm` / `onOk` / `onCancel` / `rootPrefixCls` /
 *     `isSilent`）。
 *
 * ⚠️ 本仓的值是 **`ComputedRef`** —— 上游的 `useMemo` 会随依赖变化重建对象，
 *    Vue 侧要保持同一语义就得让消费方读到最新的那个对象。
 */
import { type ComputedRef, computed, type InjectionKey, inject, type VNodeChild } from 'vue';

import type { AutoFocusButton, ModalButtonProps, ModalOkType } from './interface';

export interface ModalContextValue {
  // ------------------------------ Footer ------------------------------
  confirmLoading?: boolean;
  okButtonProps?: ModalButtonProps;
  cancelButtonProps?: ModalButtonProps;
  okTextLocale?: VNodeChild;
  cancelTextLocale?: VNodeChild;
  okType?: ModalOkType;
  onOk?: (e: Event) => void;
  onCancel?: (e: Event) => void;

  // ------------------------------ Confirm ------------------------------
  autoFocusButton?: AutoFocusButton;
  mergedOkCancel?: boolean;
  isSilent?: () => boolean;
  rootPrefixCls?: string;
  /** 关闭（走动效）。`triggerCancel` 是 `close` 的标记参数。 */
  close?: (...args: unknown[]) => void;
  /** `Modal.confirm` 的确认结果回调（HookModal 里是 `resolvePromise`）。 */
  onConfirm?: (confirmed: boolean) => void;
  onClose?: () => void;
}

export const modalContextKey: InjectionKey<ComputedRef<ModalContextValue>> =
  Symbol('apollo-modal-context');

/** 消费方统一的取值入口（没有 Provider 时给空对象，与上游 `createContext({})` 一致）。 */
export function useModalContext(): ComputedRef<ModalContextValue> {
  const injected = inject(modalContextKey, null);
  return computed(() => injected?.value ?? {});
}
