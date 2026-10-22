/** Window-scroll geometry shared by the icon catalog and its boundary tests. */
export interface IconWindow {
  columns: number;
  rowHeight: number;
  itemCount: number;
  top: number;
  scroll: number;
  viewport: number;
  overscan?: number;
}
export function iconWindowRange({
  columns,
  rowHeight,
  itemCount,
  top,
  scroll,
  viewport,
  overscan = 2,
}: IconWindow): { start: number; end: number; rows: number } {
  const rows = Math.ceil(itemCount / columns);
  const start = Math.min(rows, Math.max(0, Math.floor((scroll - top) / rowHeight) - overscan));
  const end = Math.max(
    start,
    Math.min(rows, Math.ceil((scroll + viewport - top) / rowHeight) + overscan),
  );
  return { start, end, rows };
}
