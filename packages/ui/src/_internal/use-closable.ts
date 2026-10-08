/**
 * `useClosable` / `pickClosable` —— closable + closeIcon 的三方合并。
 *
 * 契约来源：antd 6.6.4 的 `es/_util/hooks/useClosable.js`（**判据逐条对齐**；
 * Tag 是第一个消费者，Alert / Notification 将来复用 —— 三次法则内收进 _internal）。
 *
 * 合并语义（与直觉不同，必须精确）：
 *   - props 层：`closable === false` 或 `closeIcon === false/null` → 强制关闭（false）
 *   - props 层给出任何非空值 → `merge(fallback, context, props)`（props 胜）
 *   - context 层：`false` → 强制关闭；truthy → `merge(fallback, context)`
 *   - 都没有 → fallback.closable ? fallback : false（Tag 的 fallback closable=false
 *     —— 所以默认**不可**关闭）
 */

import { CloseOutlined } from '@apollo-design/icons';
import { isNonNullable, isPlainObject, mergeProps, pickAttrs } from '@apollo-design/utils';
import {
  type ComputedRef,
  cloneVNode,
  computed,
  h,
  isVNode,
  type MaybeRefOrGetter,
  toValue,
  type VNode,
} from 'vue';

/** `closable` 支持布尔或配置对象（antd 的 ClosableType）。 */
export interface ClosableConfig {
  closeIcon?: unknown;
  disabled?: boolean;
  [key: string]: unknown;
}

/**
 * ⚠️ 含 `null` —— antd 的 `ClosableType = DialogProps['closable'] | null`。
 * notification 的 `ArgsProps.closable` 就是 `boolean | null | {...}`。
 */
export type ClosableType = boolean | ClosableConfig | null;

export interface ClosableCollection {
  closable?: ClosableType;
  closeIcon?: unknown;
}

export interface ClosableFallback extends ClosableCollection {
  /** 关闭图标的渲染前处理（Tag 用它注入 role/tabIndex/类名/事件）。 */
  closeIconRender?: (iconNode: unknown) => unknown;
  /** aria-label 文案（来自 locale 的 global.close）。 */
  closeLabel?: string;
}

export interface ClosableResult {
  /** 是否渲染关闭按钮。 */
  closable: boolean;
  /** 关闭图标节点（可能经 closeIconRender 处理）。 */
  closeIconNode: unknown;
  /** 关闭按钮是否处于禁用态（来自 closable 配置对象的 disabled）。 */
  closeBtnIsDisabled: boolean;
  /** 需要透传到关闭按钮上的 aria/data 属性。 */
  ariaProps: Record<string, unknown>;
}

/** `pickClosable`：从 context/props 里摘出两个字段（antd 逐字）。 */
export function pickClosable(
  source: MaybeRefOrGetter<ClosableCollection | undefined | null>,
): ComputedRef<ClosableCollection | undefined> {
  return computed<ClosableCollection | undefined>(() => {
    const ctx = toValue(source);
    if (!ctx) return undefined;
    return { closable: ctx.closable, closeIcon: ctx.closeIcon };
  });
}

/** antd 逐字：`!closable && (closable === false || closeIcon === false/null)` → false。 */
function computeClosableConfig(
  closable: ClosableType | undefined,
  closeIcon: unknown,
): ClosableConfig | boolean | null {
  if (!closable && (closable === false || closeIcon === false || closeIcon === null)) {
    return false;
  }
  if (!isNonNullable(closable) && !isNonNullable(closeIcon)) {
    return null;
  }
  let closableConfig: ClosableConfig = {
    closeIcon: typeof closeIcon !== 'boolean' && isNonNullable(closeIcon) ? closeIcon : undefined,
  };
  if (isPlainObject(closable)) {
    closableConfig = { ...closableConfig, ...closable };
  }
  return closableConfig;
}

function mergeClosableConfigs(
  propConfig: ClosableConfig | boolean | null,
  contextConfig: ClosableConfig | boolean | null,
  fallbackConfig: ClosableConfig,
): ClosableConfig | boolean {
  if (propConfig === false) {
    return false;
  }
  if (propConfig) {
    return mergeProps(fallbackConfig, contextConfig ?? {}, propConfig) as ClosableConfig;
  }
  if (contextConfig === false) {
    return false;
  }
  if (contextConfig) {
    return mergeProps(fallbackConfig, contextConfig) as ClosableConfig;
  }
  return fallbackConfig.closable ? fallbackConfig : false;
}

/**
 * 纯函数版 computeClosable（antd 逐字）。
 *
 * vnode 的 aria 注入（antd 的 `cloneElement(icon, { 'aria-label': closeLabel, ... })`）
 * 用 Vue 的 `cloneVNode` 等价实现 —— 不需要组件上下文。
 * ⚠️ 2026-10-08 修正：此前注释声称「注入需要组件侧闭包、本函数做不到」是**错误结论**
 *    （notification 的 D98 早就用 cloneVNode 做了同一件事）。漏掉它导致 modal 的
 *    `-close-x` span 比 antd 少一个 `aria-label=Close`（dom-probe modal/basic 实测）。
 */
export function computeClosable(
  propCloseCollection: ClosableCollection | undefined,
  contextCloseCollection: ClosableCollection | undefined,
  fallbackCloseCollection: ClosableFallback = {},
): ClosableResult {
  const propConfig = computeClosableConfig(
    propCloseCollection?.closable,
    propCloseCollection?.closeIcon,
  );
  const contextConfig = computeClosableConfig(
    contextCloseCollection?.closable,
    contextCloseCollection?.closeIcon,
  );
  const mergedFallback: ClosableConfig = {
    closeIcon: h(CloseOutlined),
    ...fallbackCloseCollection,
  };
  const merged = mergeClosableConfigs(propConfig, contextConfig, mergedFallback);
  const closeBtnIsDisabled = typeof merged !== 'boolean' ? !!merged?.disabled : false;
  if (merged === false) {
    return { closable: false, closeIconNode: null, closeBtnIsDisabled, ariaProps: {} };
  }

  // merged 此时必为配置对象（false 已提前返回）
  const mergedConfig = merged as ClosableConfig;
  const closeLabel = fallbackCloseCollection.closeLabel ?? 'Close';
  const { closeIconRender } = fallbackCloseCollection;
  const { closeIcon: _ignored, ...restConfig } = mergedConfig;
  void _ignored;
  // antd 逐字：`ariaOrDataProps = pickAttrs(restConfig, true)` —— 只留 aria/data，
  // `closable` / `closeIconRender` 这类配置键不能漏到 DOM 上。
  const ariaOrDataProps = pickAttrs(restConfig, true);
  let finalCloseIcon: unknown = mergedConfig.closeIcon;

  if (isNonNullable(finalCloseIcon)) {
    if (closeIconRender) {
      finalCloseIcon = closeIconRender(finalCloseIcon);
    }
    if (isVNode(finalCloseIcon)) {
      // antd 逐字：`cloneElement(finalCloseIcon, {
      //   'aria-label': closeLabel, ...finalCloseIcon.props, ...ariaOrDataProps })`
      // —— 优先级：closable 对象里的 aria > 图标自身 props > locale 文案。
      const vnode = finalCloseIcon as VNode;
      finalCloseIcon = cloneVNode(vnode, {
        'aria-label': closeLabel,
        ...vnode.props,
        ...ariaOrDataProps,
      });
    } else if (typeof finalCloseIcon !== 'object') {
      // 非 vnode 的原始值（字符串等）兜底包 span（antd 的 createElement 分支）
      finalCloseIcon = h(
        'span',
        { 'aria-label': closeLabel, ...ariaOrDataProps },
        finalCloseIcon as never,
      );
    }
  }

  return {
    closable: true,
    closeIconNode: finalCloseIcon,
    closeBtnIsDisabled,
    ariaProps: { 'aria-label': closeLabel, ...ariaOrDataProps },
  };
}

/** composable 版：响应式包装 computeClosable。 */
export function useClosable(
  propCloseCollection: MaybeRefOrGetter<ClosableCollection | undefined>,
  contextCloseCollection: MaybeRefOrGetter<ClosableCollection | undefined>,
  fallbackCloseCollection: ClosableFallback = {},
): ComputedRef<ClosableResult> {
  return computed(() =>
    computeClosable(
      toValue(propCloseCollection),
      toValue(contextCloseCollection),
      fallbackCloseCollection,
    ),
  );
}
