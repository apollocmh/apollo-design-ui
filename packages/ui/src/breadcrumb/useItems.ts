import { type ComputedRef, computed, h } from 'vue';
import type { BreadcrumbItemInput } from './interface';

/** Only the deprecated routes channel translates legacy breadcrumbName/children data. */
function route2item(route: BreadcrumbItemInput): BreadcrumbItemInput {
  const { breadcrumbName, children, ...rest } = route;
  const result: BreadcrumbItemInput = { title: breadcrumbName, ...rest };
  if (children) {
    result.menu = {
      items: children.map(({ breadcrumbName: name, title, onClick, ...item }) => {
        const content = name ?? title;
        const linked = item.href !== undefined || item.path !== undefined;
        return {
          ...item,
          title: onClick
            ? h(linked ? 'span' : 'button', { onClick, ...(linked ? {} : { type: 'button' }) }, [
                content,
              ])
            : content,
        };
      }),
    };
  }
  return result;
}

/** null selects native child composition; an explicit empty array still owns the data channel. */
export function useItems(
  items: () => BreadcrumbItemInput[] | undefined,
  routes: () => BreadcrumbItemInput[] | undefined,
): ComputedRef<BreadcrumbItemInput[] | null> {
  return computed(() => {
    const current = items();
    if (current !== undefined) return current;
    const legacy = routes();
    return legacy === undefined ? null : legacy.map(route2item);
  });
}
