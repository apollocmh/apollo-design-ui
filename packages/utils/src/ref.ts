/**
 * ref 合并与「能否拿到 DOM」的判定。
 *
 * 契约来源：`@rc-component/util/ref`（`fillRef` / `composeRef` / `useComposeRef` /
 * `supportRef` / `supportNodeRef` / `getNodeRef`）。
 *
 * ---------------------------------------------------------------------------
 * ⚠️ 首要认知：Vue 里「转发 ref」这件事与 React 完全不同
 * ---------------------------------------------------------------------------
 *
 *   React：`ref` 是 `forwardRef` 显式转发的一个特殊 prop，因此"把外部 ref 和内部 ref 合起来"
 *          是高频操作（antd 的 `checkbox` 等大量使用）。
 *
 *   Vue：组件上的 `ref` **不会**出现在 props 里。父组件拿到什么，由子组件的 `defineExpose`
 *        决定。所以"转发 ref"在 Vue 里的正确写法是 `defineExpose`，**不是**合并 ref。
 *
 * 结论：`composeRef` 在 Vue 里的用途收窄为「一个组件内需要同时持有多个 ref」
 * （例如既要把元素暴露给父级、又要自己测量它）。这仍然需要，所以保留；
 * 但不要把 React 的 `forwardRef + useComposeRef` 模式机械搬过来。
 *
 * ---------------------------------------------------------------------------
 * `supportRef` 的语义调整
 * ---------------------------------------------------------------------------
 *
 *   React 版判断「把 ref 传下去能不能拿到 DOM」，靠 `$$typeof` / `prototype.render` 等
 *   内部标记区分函数组件、类组件、`forwardRef`。
 *
 *   Vue 里没有这些区分：元素 vnode 一定能拿到 `el`；组件 vnode 一定能拿到
 *   `component.proxy`（组件实例），但它背后是不是 DOM 取决于组件是单根还是多根。
 *   多根组件的 `$el` 是锚点而非元素，**静态无法判定**。
 *
 *   因此我们的策略是：**组件 vnode 一律视为支持 ref**，
 *   拿到之后用 `getElement()` 解析；解析失败返回 `null` 而不是抛错。
 *   （对应 docs/foundation/rc-util-contract.md §3.7 的登记项）
 */

import type { VNode } from 'vue';
import { type ComputedRef, computed, type MaybeRefOrGetter, toValue } from 'vue';
import { isComponentVNode, isDOM, isElementVNode, isFragmentVNode, isVNode } from './is';

/** 可以被 `fillRef` 填充的形态。 */
export type RefLike<T> = ((node: T | null) => void) | { value: T | null } | null | undefined;

/**
 * 把 `node` 写入任意形态的 ref。
 *
 * 支持 Vue 的函数 ref 与可写 `{ value }` 引用：
 *   - 函数 ref（Vue 模板 `:ref="fn"` 的形态）
 *   - `Ref<T>`（`{ value }`）
 */
export function fillRef<T>(ref: RefLike<T>, node: T | null): void {
  if (typeof ref === 'function') {
    ref(node);
    return;
  }
  if (ref && typeof ref === 'object') {
    if ('value' in ref) {
      ref.value = node;
    }
  }
}

/**
 * 合并多个 ref 为一个函数 ref。
 *
 * ⚠️ 两个可观测行为（与 rc-util 一致，测试会锁定）：
 *   1. **`length <= 1` 时原样返回第一个 ref，不做包装。**
 *      所以 `composeRef(fn) === fn`。调用方可以据此判断"没有被包装过"。
 *   2. 传入的 ref 数组是**原数组**，过滤 falsy 只影响判断、不影响后续遍历
 *      （遍历时仍会 `fillRef` 全部元素，falsy 的会被 `fillRef` 静默忽略）。
 */
export function composeRef<T>(...refs: RefLike<T>[]): RefLike<T> {
  const refList = refs.filter(Boolean);
  if (refList.length <= 1) {
    return refList[0];
  }
  return (node: T | null) => {
    for (const ref of refs) {
      fillRef(ref, node);
    }
  };
}

/**
 * 带缓存的 `composeRef`。
 *
 * 接收者集合不变时保持函数身份，避免重复 ref 通知；替换函数后由 Vue 通知新函数，
 * 卸载时通知当前函数 `null`。
 *
 * 缓存键与 rc-util 的比较器一致：**数组长度 + 逐项身份**。
 * 接受一个明确的数组、ref 数组或 getter 集合源。只解析集合来源，不执行其中的
 * 函数 ref、不解包其中的 Vue Ref；集合内逐项身份决定缓存是否失效。
 *
 * @example
 * ```vue
 * <Child :ref="mergedRef" />
 * ```
 * 模板里顶层 ref 会自动解包，所以直接把 `mergedRef` 绑到 `:ref` 即可。
 */
export function useComposeRef<T>(
  refs: MaybeRefOrGetter<readonly RefLike<T>[]> = [],
): ComputedRef<(node: T | null) => void> {
  let lastValues: readonly RefLike<T>[] | null = null;
  let lastFn: ((node: T | null) => void) | null = null;

  return computed(() => {
    const values = toValue(refs);
    if (lastFn && lastValues && sameIdentity(lastValues, values)) {
      return lastFn;
    }
    // composeRef 在 <=1 时可能返回非函数（原 ref），这里统一包成函数
    const composed = composeRef<T>(...values);
    lastFn =
      typeof composed === 'function'
        ? composed
        : (node: T | null) => {
            fillRef(composed, node);
          };
    lastValues = [...values];
    return lastFn;
  });
}

function sameIdentity(a: readonly unknown[], b: readonly unknown[]): boolean {
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

/**
 * 该 vnode 是否"支持 ref"（即挂上 ref 之后能解析出东西）。
 *
 * Vue 侧：元素 vnode 与组件 vnode 都算支持。Fragment / 文本 / 注释 / Teleport / Suspense 不算。
 */
export function supportRef(nodeOrComponent: unknown): boolean {
  if (!nodeOrComponent) return false;
  if (isVNode(nodeOrComponent)) {
    return isElementVNode(nodeOrComponent) || isComponentVNode(nodeOrComponent);
  }
  // 传入的是已经解析出来的实例/元素 → 也视为支持
  return typeof nodeOrComponent === 'object';
}

/**
 * 该 **vnode 节点**是否支持 ref。
 *
 * 与 `supportRef` 的区别：入参必须是 vnode，且排除 Fragment。
 * （对应 rc-util 的 `isValidElement && !isFragment` 检查。）
 */
export function supportNodeRef(node: unknown): boolean {
  return isVNode(node) && !isFragmentVNode(node) && supportRef(node);
}

/**
 * 取 vnode 上挂载的 ref 解析结果。
 *
 * Vue 侧：
 *   - 已挂载的有状态组件 → Vue 已解析的 public expose proxy，或无 expose 的实例
 *   - 函数组件单 DOM 根 → 真实元素
 *   - 元素 vnode → `el`（真实 DOM）
 *   - 其它 → `null`
 *
 * 需要 DOM 元素时请再经 `getElement()` 解析（组件实例要用 `$el` 取元素）。
 */
export function getNodeRef(node: VNode | null | undefined): object | null {
  if (!isVNode(node)) return null;
  if (isElementVNode(node) || (isComponentVNode(node) && typeof node.type === 'function')) {
    return isDOM(node.el) ? node.el : null;
  }
  if (isComponentVNode(node)) {
    const instance = node.component;
    if (!instance) return null;
    // Vue owns the public expose proxy. Never substitute its private setup proxy.
    return instance.exposed ? (instance.exposeProxy ?? null) : instance.proxy;
  }
  return null;
}
