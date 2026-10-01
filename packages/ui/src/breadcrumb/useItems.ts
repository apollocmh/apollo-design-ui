/**
 * `items` / `routes` 的合并（上游 `es/breadcrumb/useItems.ts`，44 行）。
 *
 * 契约（`docs/analysis/breadcrumb.md` §2.2）：
 *   `items` 优先 → 否则 `routes.map(route2item)` → 都没有 ⇒ **`null`**
 *   `route2item`：`breadcrumbName → title`，`children → menu.items`
 *   （子项同样 `breadcrumbName → title`）。
 *
 * ── 🚨 两处**不对称**的字段优先级（照抄，别「顺手统一」）──────────────────────
 *
 * ```js
 * // 父级：title 在后 ⇒ 传了 title 就以 title 为准（breadcrumbName 只是兜底）
 * const clone = { title: breadcrumbName, ...rest };
 * // 子级：title 在**前**被 ...itemProps 覆盖 ⇒ 传了 breadcrumbName 就以 breadcrumbName 为准
 * items: children.map(({ breadcrumbName, ...itemProps }) => ({ ...itemProps, title: breadcrumbName }))
 * ```
 *
 * ⇒ 同一份数据里，父级的 `title` 赢、子级的 `breadcrumbName` 赢。上游如此，**照抄**。
 *
 * ⚠️ 上游用 `useMemo(..., [items, routes])` ⇒ 本仓用 `computed`（两者变化时重算）。
 * 注意 `computed` 返回的是 `ComputedRef`，调用方要 `.value`（不要在 setup 里解构）。
 */

import { type ComputedRef, computed } from 'vue';
import type { BreadcrumbItemInput } from './interface';

/**
 * `routes`（已废弃）→ `items` 的形态。
 *
 * ⚠️ 返回类型是 `BreadcrumbItemInput`（`Partial<...>`），因为 `title` 可能是
 * `undefined`（`breadcrumbName` 与 `title` 都没传时）。
 */
function route2item(route: BreadcrumbItemInput): BreadcrumbItemInput {
  const { breadcrumbName, children, ...rest } = route;

  const clone: BreadcrumbItemInput = {
    title: breadcrumbName,
    ...rest,
  };

  if (children) {
    clone.menu = {
      items: children.map(({ breadcrumbName: itemBreadcrumbName, ...itemProps }) => ({
        ...itemProps,
        title: itemBreadcrumbName,
      })),
    };
  }

  return clone;
}

/**
 * 合并 `items` 与 `routes`。
 *
 * @returns `null` 表示「两个通道都没给」—— 调用方据此走 `children` 分支（上游同判）。
 */
export function useItems(
  items: () => BreadcrumbItemInput[] | undefined,
  routes: () => BreadcrumbItemInput[] | undefined,
): ComputedRef<BreadcrumbItemInput[] | null> {
  return computed(() => {
    const mergedItems = items();
    if (mergedItems) {
      return mergedItems;
    }

    const legacyRoutes = routes();
    if (legacyRoutes) {
      return legacyRoutes.map(route2item);
    }

    return null;
  });
}
