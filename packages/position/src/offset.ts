import type { OffsetType, Rect } from './types';

/**
 * 解析单个 offset：`12` → 12；`'50%'` → size * 0.5。
 *
 * antd 的实现是 `offsetStr.match(/^(.*)\%$/)`，注意它用 `.*` 贪婪匹配，
 * 因此 `'abc%'` 会得到 parseFloat('abc') = NaN。这里等价保留 NaN 语义 ——
 * 因为下游 `getNumberOffset` 对 `offset || []` 的默认处理依赖它，
 * 擅自改成 0 会改变未定义行为下的一致性。
 */
export function getUnitOffset(size: number, offset: OffsetType = 0): number {
  const offsetStr = `${offset}`;
  const cells = offsetStr.match(/^(.*)%$/);
  if (cells?.[1] !== undefined) {
    return size * (parseFloat(cells[1]) / 100);
  }
  return parseFloat(offsetStr);
}

/**
 * 把 [x, y] 的 offset 解析为像素。
 * 百分比相对 `rect` 自身的宽高。
 */
export function getNumberOffset(rect: Rect, offset?: readonly OffsetType[]): [number, number] {
  const [offsetX, offsetY] = offset ?? [];
  return [getUnitOffset(rect.width, offsetX), getUnitOffset(rect.height, offsetY)];
}
