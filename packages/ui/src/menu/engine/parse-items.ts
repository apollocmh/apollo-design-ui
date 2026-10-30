/** Normalize the public items data; rendering and path registration stay in Menu. */
import type {
  ItemType,
  MenuDividerType,
  MenuItemGroupType,
  MenuItemType,
  SubMenuType,
} from '../interface';

export type ParsedNode =
  | (MenuItemType & { kind: 'item'; key: string })
  | (Omit<SubMenuType, 'children'> & { kind: 'submenu'; key: string; children: ParsedNode[] })
  | (Omit<MenuItemGroupType, 'children'> & { kind: 'group'; key: string; children: ParsedNode[] })
  | (MenuDividerType & { kind: 'divider'; key: string });

export function resolveKey(opt: ItemType, index: number): string {
  return opt?.key == null ? `tmp-${index}` : String(opt.key);
}

export function parseItems(list: ItemType[] | undefined | null): ParsedNode[] {
  const nodes: ParsedNode[] = [];
  for (const [index, item] of (list ?? []).entries()) {
    if (!item) continue;
    const key = resolveKey(item, index);
    if (item.type === 'group') {
      nodes.push({ ...item, kind: 'group', key, children: parseItems(item.children) });
    } else if (item.type === 'divider') {
      nodes.push({ ...item, kind: 'divider', key });
    } else if ('children' in item && (item.children.length > 0 || item.type === 'submenu')) {
      nodes.push({ ...item, kind: 'submenu', key, children: parseItems(item.children) });
    } else {
      const { children: _children, ...leaf } =
        'children' in item ? item : { ...item, children: undefined };
      nodes.push({ ...leaf, kind: 'item', type: 'item', key });
    }
  }
  return nodes;
}
