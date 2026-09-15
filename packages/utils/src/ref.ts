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
import { isComponentVNode, isElementVNode, isFragmentVNode, isVNode } from './is';

/** 可以被 `fillRef` 填充的形态。 */
export type RefLike<T> =
  | ((node: T | null) => void)
  | { value: T | null }
  | { current: T | null }
  | null
  | undefined;

/**
 * 把 `node` 写入任意形态的 ref。
 *
 * 支持三种目标（前两种是 Vue 的原生形态，第三种只为迁移期兼容 React 代码）：
 *   - 函数 ref（Vue 模板 `:ref="fn"` 的形态）
 *   - `Ref<T>`（`{ value }`）
 *   - `{ current }`（React ref 对象）
 */
export function fillRef<T>(ref: RefLike<T>, node: T | null): void {
  if (typeof ref === 'function') {
    ref(node);
    return;
  }
  if (ref && typeof ref === 'object') {
    if ('value' in ref) {
      (ref as { value: T | null }).value = node;
    } else if ('current' in ref) {
      (ref as { current: T | null }).current = node;
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
 * 为什么必须有缓存：如果每次求值都返回**新的函数**，Vue 的渲染器会认为 ref 变了，
 * 于是对旧函数调 `null`、对新函数调元素值 —— 组件挂载/更新时都会多做一轮无效的 ref 往返。
 *
 * 缓存键与 rc-util 的比较器一致：**数组长度 + 逐项身份**。
 * 用 `MaybeRefOrGetter` 而不是裸值，是为了在 props 变化时能正确失效
 * （React 版靠每次 render 重新调用 + memo 比较，Vue 版靠响应式追踪）。
 *
 * @example
 * ```vue
 * <Child :ref="mergedRef" />
 * ```
 * 模板里顶层 ref 会自动解包，所以直接把 `mergedRef` 绑到 `:ref` 即可。
 */
export function useComposeRef<T>(
  ...refs: MaybeRefOrGetter<RefLike<T>>[]
): ComputedRef<(node: T | null) => void> {
  let lastValues: unknown[] | null = null;
  let lastFn: ((node: T | null) => void) | null = null;

  return computed(() => {
    const values = refs.map((ref) => toValue(ref));
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
    lastValues = values;
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
 *   - 组件 vnode → `component.proxy`（组件实例；`defineExpose` 决定它能被读到什么）
 *   - 元素 vnode → `el`（真实 DOM）
 *   - 其它 → `null`
 *
 * 需要 DOM 元素时请再经 `getElement()` 解析（组件实例要用 `$el` 取元素）。
 */
export function getNodeRef<T = unknown>(node: VNode | null | undefined): T | null {
  if (!isVNode(node)) {
    return null;
  }
  if (isComponentVNode(node)) {
    return (node.component?.proxy ?? null) as T | null;
  }
  return (node.el ?? null) as T | null;
}
