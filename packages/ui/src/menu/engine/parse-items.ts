/**
 * `parseItems` —— rc-menu `utils/nodeUtil.js` 的 Vue 版（items 数组规范化）。
 *
 * 与 rc 的差异：rc 返回 React 元素（组件替换机制 `_internalComponents`）；
 * Vue 版返回**规范化节点描述**（纯数据），由 Menu.ts 的渲染层消费 ——
 * 本仓不需要组件替换机制（antd 用它注入 MenuItem/SubMenu 的 antd 包装）。
 *
 * children 写法：Vue 的默认插槽无法逐项携带 key/type 语义（antd 的 children
 * 依赖 cloneElement 注入 eventKey）—— v1 items 为唯一真源（antd 6 的推荐
 * API，children 已 deprecated）；children slot 支持 PENDING（analysis §6 D89）。
 */
import type {
  ItemType,
  MenuDividerType,
  MenuItemGroupType,
  MenuItemType,
  SubMenuType,
} from '../interface';

/** 规范化节点（渲染层直接消费）。 */
export type ParsedNode =
  | ({ kind: 'item'; key: string; label: ItemType extends null ? never : unknown } & MenuItemType)
  | ({ kind: 'submenu'; key: string; children: ParsedNode[] } & SubMenuType)
  | ({ kind: 'group'; key: string; children: ParsedNode[] } & MenuItemGroupType)
  | ({ kind: 'divider'; key: string } & MenuDividerType);

/** rc 的 `tmp-${index}` 缺省 key。 */
export function resolveKey(opt: ItemType, index: number): string {
  const key = opt && typeof opt === 'object' ? opt.key : undefined;
  return (key !== undefined && key !== null ? String(key) : `tmp-${index}`) as string;
}

/** rc `convertItemsToNodes` 的数据层等价物（原序、同判）。 */
export function parseItems(list: ItemType[] | undefined | null): ParsedNode[] {
  return (list ?? [])
    .map((opt, index): ParsedNode | null => {
      if (opt && typeof opt === 'object') {
        const { label, children, key, type, ...rest } = opt as unknown as Record<string, unknown> &
          ItemType & { children?: ItemType[] };
        const mergedKey = resolveKey(opt, index);

        // Group & SubMenu
        if (children?.length || type === 'group') {
          if (type === 'group') {
            return {
              kind: 'group',
              ...rest,
              key: mergedKey,
              label,
              children: parseItems(children as ItemType[]),
            } as ParsedNode;
          }
          return {
            kind: 'submenu',
            ...rest,
            key: mergedKey,
            label,
            children: parseItems(children),
          } as ParsedNode;
        }

        // Divider
        if (type === 'divider') {
          return { kind: 'divider', ...rest, key: mergedKey } as ParsedNode;
        }

        // Item
        return { kind: 'item', ...rest, key: mergedKey, label } as ParsedNode;
      }
      return null;
    })
    .filter((node): node is ParsedNode => node !== null);
}
