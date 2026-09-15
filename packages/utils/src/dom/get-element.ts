/**
 * 从各种「引用形态」解析出真实 DOM 元素。
 *
 * 契约来源：`@rc-component/util/Dom/findDOMNode` 的 `isDOM` / `getDOM`。
 * React 侧还有 `findDOMNode`（读 `{current}`），Vue 里没有对应反模式，**不导出**。
 *
 * 为什么需要 `getElement` 这个超集：
 *   Vue 里"一个 DOM 引用"至少有六种形态，而 rc-* 只认识其中两种：
 *     1. `HTMLElement` / `SVGElement`               ← rc-* 认识
 *     2. `{ nativeElement: Element }`（第三方库约定）← rc-* 认识
 *     3. `ComponentPublicInstance`（模板 ref 到组件）
 *     4. `{ $el: Element }`（同上，鸭子类型）
 *     5. `Ref<Element>`（`{ value }`，`ref()` 的返回值）
 *     6. `VNode`（`el` 或 `component.proxy.$el`）
 *   如果每个调用点各写一遍解析，一定会漏掉其中两三种 —— 这正是浮层定位失效的常见根因。
 *
 * ⚠️ 多根组件（`<template>` 有多个顶层节点）的 `$el` 是 Text/Comment 锚点，不是元素。
 *    此时返回 `null` 而**不是**抛错：调用方（定位、测量、滚动）必须能容忍"拿不到 DOM"。
 */

import type { ComponentPublicInstance, VNode } from 'vue';
import { isComponentVNode, isDOM, isElementVNode, isVNode } from '../is';

export { isDOM };

/**
 * rc-util 兼容版：只认识 DOM 元素与 `{ nativeElement }`。
 *
 * 保留它是为了「迁移对照」时能一一对应；Vue 代码里应优先用 {@link getElement}。
 */
export function getDOM(node: unknown): HTMLElement | SVGElement | null {
  if (isDOM(node)) {
    return node;
  }
  if (
    node &&
    typeof node === 'object' &&
    isDOM((node as { nativeElement?: unknown }).nativeElement)
  ) {
    return (node as { nativeElement: HTMLElement | SVGElement }).nativeElement;
  }
  return null;
}

/** 鸭子类型判断「是不是 Vue 组件实例」。不 import `vue` 的运行时判定，避免多副本问题。 */
function isComponentInstance(value: unknown): value is ComponentPublicInstance {
  return (
    !!value &&
    typeof value === 'object' &&
    '$el' in value &&
    // `$` 是 Vue 内部的 `ComponentInternalInstance`，组件实例一定有
    '$' in value
  );
}

/**
 * 解析出 DOM 元素。认识上面列出的全部六种形态。
 *
 * 解析顺序（先便宜后昂贵）：
 *   DOM 元素 → `{nativeElement}` → `{value}` → `{current}` → 组件实例/`{$el}` → VNode
 *
 * `{current}` 分支是为了兼容从 React 迁移过来的调用点，不是我们的对外契约。
 */
export function getElement(node: unknown): HTMLElement | SVGElement | null {
  const direct = getDOM(node);
  if (direct) {
    return direct;
  }

  if (!node || typeof node !== 'object') {
    return null;
  }

  // `Ref<Element>`：`ref()` 的返回值
  if ('value' in node) {
    return getElement((node as { value: unknown }).value);
  }

  // React ref 形态：只为迁移期兼容
  if ('current' in node) {
    return getElement((node as { current: unknown }).current);
  }

  if (isComponentInstance(node)) {
    return getElement(node.$el);
  }

  if ('$el' in node) {
    return getElement((node as { $el: unknown }).$el);
  }

  if (isVNode(node)) {
    return getElementFromVNode(node);
  }

  return null;
}

/** 从 vnode 取 DOM。元素型看 `el`；组件型看 `component.proxy`。 */
export function getElementFromVNode(
  vnode: VNode | null | undefined,
): HTMLElement | SVGElement | null {
  if (!isVNode(vnode)) {
    return null;
  }
  if (isElementVNode(vnode)) {
    return isDOM(vnode.el) ? (vnode.el as HTMLElement | SVGElement) : null;
  }
  if (isComponentVNode(vnode)) {
    const proxy = vnode.component?.proxy;
    return proxy ? getElement(proxy) : null;
  }
  // Fragment / Text / Comment / Suspense / Teleport：本身没有稳定的元素语义
  return null;
}
