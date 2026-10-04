/**
 * L1 + L2/L4 · Table 虚拟滚动（T6 片）。
 *
 * 判据来源：`/tmp/antd-repo/ant-design-master/components/table/__tests__/Table.virtual.test.tsx`
 * + rc `VirtualTable/VirtualCell.js`（`getColumnWidth`）。
 * 分析见 `docs/analysis/table-virtual.md`。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { getColumnWidth } from '../engine/VirtualTable/VirtualCell';
import Table from '../Table';

const columns = [
  { title: 'Name', dataIndex: 'name', key: 'name', width: 100 },
  { title: 'Age', dataIndex: 'age', key: 'age', width: 80 },
];
const data = [
  { key: '1', name: 'John Brown', age: 32 },
  { key: '2', name: 'Jim Green', age: 42 },
];

const mountVirtual = (props: Record<string, unknown> = {}) =>
  mount(Table, {
    props: {
      virtual: true,
      scroll: { x: 180, y: 100 },
      columns: columns as never,
      dataSource: data as never,
      pagination: false as never,
      ...props,
    },
    attachTo: document.body,
  });

describe('Table · virtual · L1 getColumnWidth', () => {
  it('第一列（colIndex=0 ⇒ startColIndex=-1）取首列前缀和', () => {
    expect(getColumnWidth(-1, 1, [100, 180])).toBe(100);
  });

  it('跨列（startColIndex=-1, colSpan=2）取区间前缀和差', () => {
    expect(getColumnWidth(-1, 2, [100, 180])).toBe(180);
  });

  it('colSpan=0 当 1 处理（rc 契约）', () => {
    expect(getColumnWidth(-1, 0, [100, 180])).toBe(100);
  });

  it('越界 ⇒ NaN（逐字上游，不「顺手修」）', () => {
    expect(Number.isNaN(getColumnWidth(1, 2, [100, 180]))).toBe(true);
  });
});

describe('Table · virtual · L4 DOM 契约', () => {
  it('渲染 -tbody-virtual / -holder / -holder-inner 三层', () => {
    const w = mountVirtual();
    expect(w.find('.apollo-table-tbody-virtual').exists()).toBe(true);
    expect(w.find('.apollo-table-tbody-virtual-holder').exists()).toBe(true);
    expect(w.find('.apollo-table-tbody-virtual-holder-inner').exists()).toBe(true);
    w.unmount();
  });

  it('虚拟行是 div（不是 tr）', () => {
    const w = mountVirtual();
    const virtualRows = w.findAll('.apollo-table-tbody-virtual .apollo-table-row:not(tr)');
    expect(virtualRows.length).toBeGreaterThan(0);
    w.unmount();
  });

  it('单元格挂在 holder 内且文本正确', () => {
    const w = mountVirtual();
    const cells = w.findAll('.apollo-table-tbody-virtual-holder .apollo-table-cell');
    expect(cells.length).toBeGreaterThan(0);
    expect(cells[0]?.text()).toBe('John Brown');
    w.unmount();
  });

  it('虚拟表体不再渲染 <table> 形式的 tbody', () => {
    const w = mountVirtual();
    expect(w.find('.apollo-table-tbody-virtual tbody').exists()).toBe(false);
    w.unmount();
  });

  it('非虚拟模式不出现 -tbody-virtual', () => {
    const w = mount(Table, {
      props: {
        columns: columns as never,
        dataSource: data as never,
        pagination: false as never,
      },
      attachTo: document.body,
    });
    expect(w.find('.apollo-table-tbody-virtual').exists()).toBe(false);
    expect(w.findAll('.apollo-table-tbody > tr[data-row-key]').length).toBe(2);
    w.unmount();
  });
});
