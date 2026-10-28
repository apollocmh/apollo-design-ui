/** Pure item collection and row packing. No slots are evaluated outside rendering. */
import { Comment, Fragment, isVNode, type VNode, type VNodeChild } from 'vue';
import type { Breakpoint, Screens } from '../_internal/responsive-observer';
import { matchScreen } from '../_internal/responsive-observer';
import { DescriptionsItemComponent } from './DescriptionsItem';
import type { DescriptionsItemType, DescriptionsRowItem } from './interface';

export const DEFAULT_COLUMN_MAP: Partial<Record<Breakpoint, number>> = {
  xxxl: 4,
  xxl: 3,
  xl: 3,
  lg: 3,
  md: 3,
  sm: 2,
  xs: 1,
};
export interface NormalizedDescriptionsItem extends Omit<DescriptionsRowItem, 'index'> {
  node?: VNode;
}
export type RenderDescriptionsItem = NormalizedDescriptionsItem & { index: number };

/** Invalid/nonintegral counts have deterministic positive-integer geometry. */
export function positiveInteger(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) && value >= 1 ? Math.floor(value) : fallback;
}

/** Only actual Items are configuration entries; ordinary content isn't silently reinterpreted. */
export function transChildren2Items(
  childNodes: VNodeChild[],
): (DescriptionsItemType & { node: VNode })[] {
  const out: (DescriptionsItemType & { node: VNode })[] = [];
  const walk = (nodes: VNodeChild[]) => {
    for (const node of nodes) {
      if (Array.isArray(node)) {
        walk(node);
        continue;
      }
      if (!isVNode(node) || node.type === Comment) continue;
      if (node.type === Fragment) {
        if (Array.isArray(node.children)) walk(node.children);
        continue;
      }
      if (node.type !== DescriptionsItemComponent) continue;
      const span: unknown = node.props?.span;
      const entry: DescriptionsItemType & { node: VNode } = { node, key: node.key ?? undefined };
      if (typeof span === 'number' || span === 'filled') entry.span = span;
      else if (span && typeof span === 'object') {
        const responsive: Partial<Record<Breakpoint, number>> = {};
        const values = new Map<string, unknown>(Object.entries(span));
        for (const point of ['xxxl', 'xxl', 'xl', 'lg', 'md', 'sm', 'xs'] as const) {
          const value = values.get(point);
          if (typeof value === 'number') responsive[point] = value;
        }
        entry.span = responsive;
      }
      out.push(entry);
    }
  };
  walk(childNodes);
  return out;
}
export function normalizeItems(
  screens: Screens | undefined | null,
  items: DescriptionsItemType[] | undefined,
  children: VNodeChild[] | undefined,
): NormalizedDescriptionsItem[] {
  const merged = items ?? transChildren2Items(children ?? []);
  return merged.map(({ span, ...rest }) =>
    span === 'filled'
      ? { ...rest, filled: true }
      : {
          ...rest,
          span: positiveInteger(
            typeof span === 'number' ? span : matchScreen(screens, span ?? {}),
            1,
          ),
        },
  );
}

/** Clamp excess spans, let filled end its current row, then pad the last entry of each row. */
export function getCalcRows(
  rowItems: NormalizedDescriptionsItem[],
  mergedColumn: number,
): [rows: RenderDescriptionsItem[][], exceed: boolean] {
  const column = positiveInteger(mergedColumn, 3);
  const rows: RenderDescriptionsItem[][] = [];
  let row: RenderDescriptionsItem[] = [],
    count = 0,
    exceed = false;
  rowItems.forEach((item, index) => {
    const requested = item.filled ? column - count : positiveInteger(item.span, 1);
    const span = Math.min(requested, column - count);
    exceed ||= requested > span;
    row.push({ ...item, span, index });
    count += span;
    if (count === column || item.filled) {
      rows.push(row);
      row = [];
      count = 0;
    }
  });
  if (row.length) rows.push(row);
  for (const current of rows) {
    const total = current.reduce((sum, item) => sum + (item.span ?? 1), 0);
    const last = current.at(-1);
    if (last && total < column) last.span = (last.span ?? 1) + column - total;
  }
  return [rows, exceed];
}
