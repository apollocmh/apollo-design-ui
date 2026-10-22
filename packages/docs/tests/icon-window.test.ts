import { describe, expect, it } from 'vitest';
import { iconWindowRange } from '../src/composables/icon-window';

const geometry = {
  columns: 7,
  rowHeight: 104,
  itemCount: 848,
  top: 600,
  scroll: 600,
  viewport: 1000,
};
describe('图标虚拟窗口边界', () => {
  it('首屏和最后一行都可达，未满的末行仍包含在高度内', () => {
    expect(iconWindowRange(geometry)).toEqual({ start: 0, end: 12, rows: 122 });
    expect(iconWindowRange({ ...geometry, scroll: 600 + 121 * 104 })).toEqual({
      start: 119,
      end: 122,
      rows: 122,
    });
  });
  it('窗口外的目录不挂载瓦片，空目录不生成行', () => {
    expect(iconWindowRange({ ...geometry, top: 2000 })).toEqual({ start: 0, end: 0, rows: 122 });
    expect(iconWindowRange({ ...geometry, itemCount: 0 })).toEqual({ start: 0, end: 0, rows: 0 });
    expect(iconWindowRange({ ...geometry, scroll: 20000 })).toEqual({
      start: 122,
      end: 122,
      rows: 122,
    });
  });
  it('任意可见条目都在窗口内，挂载行数始终有界，包括两列手机布局', () => {
    for (const columns of [2, 5, 7, 12]) {
      const total = Math.ceil(848 / columns);
      for (let row = 0; row < total; row++) {
        const { start, end } = iconWindowRange({ ...geometry, columns, scroll: 600 + row * 104 });
        expect(start).toBeLessThanOrEqual(row);
        expect(end).toBeGreaterThan(row);
        expect(end - start).toBeLessThanOrEqual(15);
      }
    }
  });
  it('搜索只有一个结果时不留下空白占位行', () => {
    expect(iconWindowRange({ ...geometry, itemCount: 1 })).toEqual({ start: 0, end: 1, rows: 1 });
  });
});
