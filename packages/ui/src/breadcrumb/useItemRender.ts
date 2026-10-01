/**
 * 默认的项渲染（上游 `es/breadcrumb/useItemRender.tsx`，72 行）。
 *
 * 契约（`docs/analysis/breadcrumb.md` §2.5）：
 *
 * 1. `getBreadcrumbName(item, params)`：`isRenderable(title)` 为假 ⇒ `null`；
 *    `isPlainObject(title)` ⇒ **原样返回**（不替换参数）；否则
 *    `String(title).replace(new RegExp(':(' + Object.keys(params).join('|') + ')', 'g'), …)`。
 * 2. `renderItem(prefixCls, item, children, href)`：`isRenderable(children)` 为假 ⇒ `null`；
 *    `href !== undefined` ⇒ `<a class="{p}-link {item.className}" href>`，
 *    否则 `<span class="{p}-link {item.className}">`；
 *    透传 `pickAttrs(item 去掉 className/onClick, {data,aria})` + `onClick`。
 * 3. 自定义 `itemRender` 只收 **4 个实参**（没有 `href`）—— 上游的既有形状。
 *
 * ── 🚨 三条容易写错的地方 ──────────────────────────────────────────────────
 *
 * - **`params` 为空时正则是 `:()`** —— `()` 是空捕获组，会匹配**裸 `:`**；
 *   回调里 `params['']` 是 `undefined` ⇒ 回退 `replacement` ⇒ **净效果原样**。
 *   无害，但**必须照抄**（别「顺手」加 `paramsKeys &&` 的短路 —— 那会改变
 *   `':'.replace` 这类边界的行为）。
 * - **`params[key] || replacement`**：值是 `0` / `''` 时**也回退**（用 `||` 不是 `??`）。
 * - **`className` 被从 `item` 里摘掉**后再 `pickAttrs` —— 它单独拼进链接元素的
 *   `class`，**不**参与 `pickAttrs`（否则会渲染成 `class="…-link" class="xxx"` 冲突）。
 *   ⚠️ `style` 既不在 `pickAttrs` 的白名单里、也不进 `<li>` ⇒ **落不到 DOM**（分析 §6.2，
 *   待 G10 的 oracle 定论）。
 */

import { isPlainObject, isRenderable, pickAttrs } from '@apollo-design/utils';
import { h, type VNodeChild } from 'vue';
import type { BreadcrumbItemInput, BreadcrumbParams } from './interface';

/** `itemRender` 的签名（上游 `NonNullable<BreadcrumbProps['itemRender']>`）。 */
export type BreadcrumbItemRender = (
  route: BreadcrumbItemInput,
  params: BreadcrumbParams,
  routes: BreadcrumbItemInput[],
  paths: string[],
) => VNodeChild;

/**
 * 取一项的显示名（含 `:param` 替换）。
 *
 * ⚠️ 只有**字符串** title 会被替换；对象 / vnode 原样返回（`isPlainObject` 分支）。
 * ⚠️ `isRenderable(title)` 为假（`undefined` / `''` / `false`）⇒ `null` ——
 * 与 `renderItem` 的 `isRenderable(children)` 叠加后，**`title` 为空串的项不渲染**。
 */
export function getBreadcrumbName(item: BreadcrumbItemInput, params: BreadcrumbParams): VNodeChild {
  if (!isRenderable(item.title)) {
    return null;
  }

  const paramsKeys = Object.keys(params).join('|');

  return isPlainObject(item.title)
    ? item.title
    : String(item.title).replace(
        new RegExp(`:(${paramsKeys})`, 'g'),
        (replacement, key: string) => {
          const value = params[key];
          // 上游是 `params[key] || replacement`（`||` 而非 `??`）：falsy 一律回退
          return value ? String(value) : replacement;
        },
      );
}

/**
 * 把一个 item 渲染成链接 / 文本（上游 `renderItem`，**导出** —— `BreadcrumbItem` 也用它）。
 */
export function renderItem(
  prefixCls: string,
  item: BreadcrumbItemInput,
  children: VNodeChild,
  href?: string,
): VNodeChild {
  if (!isRenderable(children)) {
    return null;
  }

  const { className, onClick, ...restItem } = item;

  const passedProps = {
    ...pickAttrs(restItem, { data: true, aria: true }),
    onClick,
  };

  if (href !== undefined) {
    return h('a', { ...passedProps, class: [`${prefixCls}-link`, className], href }, [children]);
  }

  return h('span', { ...passedProps, class: [`${prefixCls}-link`, className] }, [children]);
}

/**
 * 造出「合并后的 item 渲染器」。
 *
 * @param prefixCls 取**当前**前缀的 getter（`prefixCls` 是 computed，渲染期才求值）。
 * @param itemRender 用户传入的自定义渲染器（**只收 4 个实参**）。
 */
export function useItemRender(
  prefixCls: () => string,
  itemRender?: () => BreadcrumbItemRender | undefined,
): (
  item: BreadcrumbItemInput,
  params: BreadcrumbParams,
  routes: BreadcrumbItemInput[],
  paths: string[],
  href?: string,
) => VNodeChild {
  return (item, params, routes, path, href) => {
    const custom = itemRender?.();
    if (custom) {
      // ⚠️ 上游只传 4 个实参 —— **没有 `href`**
      return custom(item, params, routes, path);
    }

    const name = getBreadcrumbName(item, params);

    return renderItem(prefixCls(), item, name, href);
  };
}
