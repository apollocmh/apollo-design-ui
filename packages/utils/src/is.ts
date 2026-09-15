/**
 * 类型判断集合。
 *
 * 来源：`@rc-component/util/is`（antd 直接导入）+ antd `es/_util/is.js`（antd 自己的补充）。
 * 两者的语义差异是**刻意的**，不要"统一"它们：
 *   - rc-util 的 `isReactRenderable` 是「React node 是否会被渲染」的判定；
 *   - antd `_util/is.js` 的 `isPlainObject` 实际上是「是不是对象」，
 *     数组也会通过（`[] !== null && typeof [] === 'object'`）。这是 antd 的真实行为，
 *     被 `isTransitionEvent` 依赖，必须原样保留（已登记为 quirk）。
 */

import type { VNode } from 'vue';
import { Comment, Fragment, Text } from 'vue';

// ---------------------------------------------------------------------------
// 值判定
// ---------------------------------------------------------------------------

/**
 * 既不是 `null` 也不是 `undefined`。
 *
 * 这是整个库使用最广的判定（antd 侧 26 个组件依赖），语义必须精确：
 * `isNonNullable(0) === true`、`isNonNullable('') === true`、`isNonNullable(false) === true`。
 */
export function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== undefined && value !== null;
}

/**
 * 该值是否应被当作「有内容」渲染。
 *
 * 语义等价于 rc-util 的 `isReactRenderable`，但名字去掉了 React 色彩。
 *
 * 只有 `null` / `undefined` / `false` / `''` 会被判为「无内容」；
 * **`0` 与 `true` 是有内容的**。
 *
 * ⚠️ 因此组件模板里**禁止**写 `v-if="someProp"`（`0` 会被当 falsy），
 *    必须写 `v-if="isRenderable(someProp)"`。见 COMPONENT-RULES.md。
 */
export function isRenderable<T>(value: T): value is Exclude<NonNullable<T>, false | ''> {
  return isNonNullable(value) && (value as unknown) !== false && (value as unknown) !== '';
}

/** 是有限或无限的 `number`（`NaN` 不算）。 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isFunction(value: unknown): value is (...args: never[]) => unknown {
  return typeof value === 'function';
}

/**
 * 「是不是对象」——注意不是「是不是纯对象」，数组也会返回 `true`。
 *
 * 这是 antd `_util/is.js` 的真实语义，被 `isTransitionEvent` 依赖。
 * 需要"纯对象"判定时用 `isPlainObjectStrict`。
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

/** 原型链直接指向 `Object.prototype` 的对象（数组 / Date / Map / class 实例都不算）。 */
export function isPlainObjectStrict(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype
  );
}

export function isThenable<T>(value: unknown): value is PromiseLike<T> {
  return isNonNullable(value) && isFunction((value as PromiseLike<T>).then);
}

/** 原始值：非对象、非函数，或者 `null`。 */
export function isPrimitive(value: unknown): boolean {
  return (typeof value !== 'object' && !isFunction(value)) || value === null;
}

/** 是 `TransitionEvent`（或同形状对象）：有字符串型的 `propertyName`。 */
export function isTransitionEvent(event: unknown): boolean {
  return isPlainObject(event) && 'propertyName' in event && isString(event.propertyName);
}

// ---------------------------------------------------------------------------
// DOM 判定（全部带 SSR 守卫）
// ---------------------------------------------------------------------------

export function isWindow(value: unknown): value is Window {
  if (!isNonNullable(value)) return false;
  // `value === value.window` 是跨 realm 安全的判定（比 instanceof Window 可靠）
  return (value as Window).window === value;
}

export function isDocument(value: unknown): value is Document {
  if (!isNonNullable(value)) return false;
  if (typeof Document !== 'undefined' && value instanceof Document) return true;
  // 跨 realm：用 nodeType 兜底
  return (value as Node).nodeType === 9;
}

export function isHTMLElement(value: unknown): value is HTMLElement {
  if (!isNonNullable(value)) return false;
  return typeof HTMLElement !== 'undefined' && value instanceof HTMLElement;
}

/** 是 DOM 元素（含 SVG）。SSR 下恒为 `false`，不抛错。 */
export function isDOM(value: unknown): value is HTMLElement | SVGElement {
  if (!isNonNullable(value)) return false;
  if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) return true;
  if (typeof SVGElement !== 'undefined' && value instanceof SVGElement) return true;
  return false;
}

// ---------------------------------------------------------------------------
// VNode 判定（Vue 特有 —— antd 侧没有对应物）
// ---------------------------------------------------------------------------

/**
 * 是不是 VNode。
 *
 * 判定依据是 Vue 内部约定：VNode 是带 `__v_isVNode` 标记的普通对象。
 * 不用 `instanceof` 是为了兼容多份 Vue 副本（monorepo / 重复依赖场景）。
 */
export function isVNode(value: unknown): value is VNode {
  return isPlainObject(value) && (value as { __v_isVNode?: boolean }).__v_isVNode === true;
}

/** 元素型 vnode（`<div>`、`<button>`…）。它的 `el` 是真实 DOM。 */
export function isElementVNode(value: unknown): value is VNode & { type: string } {
  return isVNode(value) && typeof value.type === 'string';
}

/**
 * 组件型 vnode。它的 DOM 需要经 `component.proxy.$el` 或 `el` 解析。
 *
 * 类型谓词刻意收窄到 `{ type: object | Function }` 而不是 `{ component: ... }`：
 * Vue 的 `VNode` 本身**就带** `component` 字段，用后者做谓词会让「取反分支」被
 * TS 推断成 `never`（因为 `VNode` 可赋值给 `VNode & { component }`）。
 * 这是纯类型层面的坑，运行时判定不受影响。
 */
export function isComponentVNode(value: unknown): value is VNode & {
  type: object | ((...args: never[]) => unknown);
} {
  return isVNode(value) && (typeof value.type === 'object' || typeof value.type === 'function');
}

/** Fragment vnode。 */
export function isFragmentVNode(value: unknown): value is VNode & { type: typeof Fragment } {
  return isVNode(value) && value.type === Fragment;
}

/** 文本 vnode。 */
export function isTextVNode(value: unknown): value is VNode & { type: typeof Text } {
  return isVNode(value) && value.type === Text;
}

/** 注释 vnode。Vue 会把 `v-if="false"`、空插槽等渲染成注释占位。 */
export function isCommentVNode(value: unknown): value is VNode & { type: typeof Comment } {
  return isVNode(value) && value.type === Comment;
}

/**
 * vnode 是否「空」——即渲染后不产生任何可见内容。
 *
 * 为什么需要它（依据：docs/foundation/rc-util-contract.md §6.3）：
 *   React 里 `{''}` 不渲染任何东西，`{0}` 渲染 `0`。
 *   Vue 里两者都会变成**文本 vnode**（`children === ''` 或 `0`），
 *   用「vnode 是否存在」判空会得到错误结论。
 *   如果不做这一层判定，所有「有内容才渲染包裹元素」的逻辑（empty / card header /
 *   descriptions title …）都会产出多余空节点，导致 DOM Contract 与视觉回归失败。
 *
 * 判定规则：
 *   - `null` / `undefined` / `false` → 空
 *   - 注释 vnode → 空
 *   - 文本 vnode 且 children 为 `''` / `null` / `undefined` / `false` → 空
 *     （`0` 与 `'0'` **不算空**）
 *   - 数组 / Fragment → 递归判定，全部为空才算空
 *   - 其余 → 非空
 */
export function isEmptyVNode(value: unknown): boolean {
  if (!isNonNullable(value) || value === false) return true;
  if (Array.isArray(value)) return value.every(isEmptyVNode);
  if (!isVNode(value)) return false;

  if (value.type === Comment) return true;

  if (value.type === Text) {
    const text = value.children as unknown;
    return text === '' || text === null || text === undefined || text === false;
  }

  if (value.type === Fragment) {
    const children = value.children;
    if (Array.isArray(children)) return children.every(isEmptyVNode);
    return isEmptyVNode(children);
  }

  return false;
}
