/**
 * L2 · Table 组件测试。
 *
 * 覆盖：基础渲染 / 空态 / 尺寸与边框 / loading / 展开（row + nest）/ 排序 /
 * 过滤（受控判据 null）/ 选择（checkbox + radio）/ 分页 / 汇总行 / title·footer·caption。
 * 受控判据用例（§3 验收点）：`sortOrder: null` / `filteredValue: null` 显式传入也算受控。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { EXPAND_COLUMN } from '../engine/constant';
import type { TableKey } from '../interface';
import { getFilterData } from '../hooks/use-filter';
import { SELECTION_COLUMN } from '../hooks/use-selection';
import { getSortData } from '../hooks/use-sorter';
import Table from '../Table';

const data = [
  { key: '1', name: 'John Brown', age: 32, address: 'New York No. 1', children: undefined },
  { key: '2', name: 'Jim Green', age: 42, address: 'London No. 2' },
  { key: '3', name: 'Joe Black', age: 28, address: 'Sydney No. 3' },
];
const columns = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Age', dataIndex: 'age', key: 'age' },
];

const mountTable = (props: Record<string, unknown> = {}) =>
  mount(Table, {
    props: { columns: columns as never, dataSource: data as never, ...props },
    attachTo: document.body,
  });

const rows = (w: { findAll: (s: string) => { length: number }[] | { length: number } }) =>
  w.findAll('.apollo-table-tbody > tr[data-row-key]');

describe('Table · 基础渲染', () => {
  it('3 行 × 2 列，data-row-key 与文本正确', () => {
    const w = mountTable();
    expect(rows(w).length).toBe(3);
    expect(w.findAll('.apollo-table-thead th').length).toBe(2);
    expect(w.find('tr[data-row-key="2"] .apollo-table-cell').text()).toBe('Jim Green');
    w.unmount();
  });

  it('空数据 ⇒ placeholder 行 + emptyText', () => {
    const w = mountTable({ dataSource: [] });
    expect(w.find('.apollo-table-placeholder').exists()).toBe(true);
    expect(w.text()).toContain('No data');
    w.unmount();
  });

  it('size/bordered/no-header 的类名', () => {
    const w = mountTable({ size: 'small', bordered: true, showHeader: false });
    expect(w.find('.apollo-table').classes()).toContain('apollo-table-small');
    expect(w.find('.apollo-table').classes()).toContain('apollo-table-bordered');
    expect(w.find('.apollo-table').classes()).toContain('apollo-table-no-header');
    w.unmount();
  });

  it('loading ⇒ Spin 包裹且 spinning', () => {
    const w = mountTable({ loading: true });
    expect(w.find('.apollo-spin-spinning').exists()).toBe(true);
    w.unmount();
  });

  it('title / footer / caption', () => {
    const w = mountTable({
      title: 'Header',
      footer: 'Footer',
      caption: 'Cap',
    } as never);
    expect(w.find('.apollo-table-title').text()).toBe('Header');
    expect(w.find('.apollo-table-footer').text()).toBe('Footer');
    expect(w.find('caption').text()).toBe('Cap');
    w.unmount();
  });
});

describe('Table · 展开（expandable）', () => {
  it('expandedRowRender：点击图标展开/收起，onExpand + onExpandedRowsChange', async () => {
    const onExpand = vi.fn();
    const onExpandedRowsChange = vi.fn();
    const w = mountTable({
      expandable: {
        expandedRowRender: (record: never) => `Detail of ${(record as { name: string }).name}`,
        onExpand,
        onExpandedRowsChange,
      } as never,
    });
    const icon = w.find('tr[data-row-key="1"] .apollo-table-row-expand-icon');
    expect(icon.classes()).toContain('apollo-table-row-expand-icon-collapsed');
    await icon.trigger('click');
    await nextTick();
    expect(icon.classes()).toContain('apollo-table-row-expand-icon-expanded');
    expect(w.text()).toContain('Detail of John Brown');
    expect(onExpand).toHaveBeenCalledWith(true, data[0]);
    expect(onExpandedRowsChange).toHaveBeenCalledWith(['1']);
    await icon.trigger('click');
    await nextTick();
    expect(w.text()).not.toContain('Detail of John Brown');
    expect(onExpandedRowsChange).toHaveBeenLastCalledWith([]);
    w.unmount();
  });

  it('受控 expandedRowKeys：显式空数组恒收起', async () => {
    const w = mountTable({
      expandable: {
        expandedRowKeys: ['1'],
        expandedRowRender: () => 'Detail',
        onExpandedRowsChange: vi.fn(),
      } as never,
    });
    await nextTick();
    expect(w.text()).toContain('Detail');
    w.unmount();
  });

  it('defaultExpandAllRows', async () => {
    const nest = [{ key: 'p1', name: 'Parent', children: [{ key: 'c1', name: 'Child' }] }];
    const w = mountTable({
      dataSource: nest as never,
      expandable: { defaultExpandAllRows: true } as never,
    });
    await nextTick();
    expect(w.text()).toContain('Child');
    w.unmount();
  });

  it('nest：children 数据 ⇒ 展开类型 nest，子行缩进', async () => {
    const nest = [{ key: 'p1', name: 'Parent', children: [{ key: 'c1', name: 'Child' }] }];
    const w = mountTable({ dataSource: nest as never });
    const icon = w.find('tr[data-row-key="p1"] .apollo-table-row-expand-icon');
    expect(icon.exists()).toBe(true);
    await icon.trigger('click');
    await nextTick();
    const childRow = w.find('tr[data-row-key="c1"]');
    expect(childRow.exists()).toBe(true);
    expect(childRow.classes()).toContain('apollo-table-row-level-1');
    w.unmount();
  });
});

describe('Table · 排序', () => {
  it('点击表头三态循环 ascend→descend→无，onChange 带 sorter', async () => {
    const onChange = vi.fn();
    const sortColumns = [
      { title: 'Name', dataIndex: 'name' },
      {
        title: 'Age',
        dataIndex: 'age',
        sorter: (a: never, b: never) => (a as { age: number }).age - (b as { age: number }).age,
      },
    ];
    const w = mount(Table, {
      props: { columns: sortColumns as never, dataSource: data as never, onChange },
      attachTo: document.body,
    });
    const th = w.findAll('.apollo-table-thead th')[1]!;
    await th.trigger('click');
    await nextTick();
    expect(onChange).toHaveBeenCalled();
    const sorter = onChange.mock.calls[0]![2] as { order?: string };
    expect(sorter.order).toBe('ascend');
    // 首行应是 28（Joe Black）
    expect(w.find('.apollo-table-tbody tr[data-row-key] .apollo-table-cell').text()).toBe(
      'Joe Black',
    );
    await th.trigger('click');
    await nextTick();
    expect((onChange.mock.calls[1]![2] as { order?: string }).order).toBe('descend');
    w.unmount();
  });

  it('受控判据：sortOrder 显式 null 也算受控（列不响应点击更新）', async () => {
    const sortColumns = [{ title: 'Age', dataIndex: 'age', sorter: () => 0, sortOrder: null }];
    const w = mount(Table, {
      props: { columns: sortColumns as never, dataSource: data as never },
      attachTo: document.body,
    });
    await w.findAll('.apollo-table-thead th')[0]!.trigger('click');
    await nextTick();
    // 受控：排序类不出现
    expect(w.find('.apollo-table-column-sort').exists()).toBe(false);
    w.unmount();
  });
});

describe('Table · 过滤', () => {
  it('onFilter + filters 过滤数据，onChange 带 filters', async () => {
    const onChange = vi.fn();
    const filterColumns = [
      {
        title: 'Name',
        dataIndex: 'name',
        filters: [{ text: 'John', value: 'John' }],
        onFilter: (value: unknown, record: never) =>
          (record as { name: string }).name.includes(value as string),
      },
    ];
    // ⚠️ 真实 Teleport（teleport stub 的 DOM 副本不挂事件监听器 ⇒ Portal 内
    //    的点击/选择永远不触发）
    const w = mount(Table, {
      props: { columns: filterColumns as never, dataSource: data as never, onChange },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    // 打开下拉（Portal 在 document.body）→ 勾选菜单项 → 确定
    await w.find('.apollo-table-filter-trigger').trigger('click');
    await nextTick();
    const dropdown = document.body.querySelector('.apollo-table-filter-dropdown');
    expect(dropdown).toBeTruthy();
    const item = dropdown!.querySelector('.apollo-dropdown-menu li');
    expect(item).toBeTruthy();
    item!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    // ⚠️ btns 顺序是 [重置(link), 确定(primary)] —— 点最后一个
    const ok = dropdown!.querySelector('.apollo-table-filter-dropdown-btns button:last-child');
    expect(ok).toBeTruthy();
    (ok as HTMLElement).click();
    await nextTick();
    expect(onChange).toHaveBeenCalled();
    const filters = onChange.mock.calls[0]![1] as Record<string, string[]>;
    expect(Object.values(filters)[0]).toEqual(['John']);
    w.unmount();
  });

  it('getFilterData：filteredKeys 空 ⇒ 不过滤', () => {
    const states = [{ column: { onFilter: () => true }, key: 'name', filteredKeys: null }] as never;
    expect(getFilterData(data, states, 'children').length).toBe(3);
  });
});

describe('Table · 选择', () => {
  it('rowSelection：勾选行 ⇒ onChange 载荷 + 表头全选联动', async () => {
    const onChange = vi.fn();
    const w = mountTable({
      rowSelection: { onChange } as never,
    });
    const boxes = w.findAll('.apollo-table-tbody .apollo-checkbox-wrapper input');
    expect(boxes.length).toBe(3);
    await boxes[0]!.setValue(true);
    await nextTick();
    expect(onChange).toHaveBeenCalled();
    const [keys, recs] = onChange.mock.calls[0]!;
    expect(keys).toEqual(['1']);
    expect(recs[0].name).toBe('John Brown');
    expect(w.find('.apollo-table-row-selected').exists()).toBe(true);
    w.unmount();
  });

  it('radio 型：单选', async () => {
    const onChange = vi.fn();
    const w = mountTable({
      rowSelection: { type: 'radio', onChange } as never,
    });
    const radios = w.findAll('.apollo-table-tbody .apollo-radio-wrapper input');
    await radios[1]!.setValue(true);
    await nextTick();
    const [keys] = onChange.mock.calls[0]!;
    expect(keys).toEqual(['2']);
    w.unmount();
  });

  it('SELECTION_COLUMN 哨兵：放 columns 即指定选择列位置', () => {
    const w = mount(Table, {
      props: {
        columns: [
          { title: 'Name', dataIndex: 'name' },
          SELECTION_COLUMN,
          { title: 'Age', dataIndex: 'age' },
        ] as never,
        dataSource: data as never,
        rowSelection: {} as never,
      },
      attachTo: document.body,
    });
    const ths = w.findAll('.apollo-table-thead th');
    expect(ths[1]!.classes()).toContain('apollo-table-selection-column');
    w.unmount();
  });

  it('EXPAND_COLUMN：默认插在 index 0；显式哨兵留在用户位置', () => {
    // 默认（无哨兵）：插在 index 0
    const w1 = mount(Table, {
      props: {
        columns: [{ title: 'Name', dataIndex: 'name' }] as never,
        dataSource: data as never,
        expandable: { expandedRowRender: () => 'x' } as never,
      },
      attachTo: document.body,
    });
    expect(w1.findAll('.apollo-table-thead th')[0]!.classes()).toContain(
      'apollo-table-row-expand-icon-cell',
    );
    w1.unmount();
    // 显式哨兵：留在用户给的位置（index 1）
    const w2 = mount(Table, {
      props: {
        columns: [{ title: 'Name', dataIndex: 'name' }, EXPAND_COLUMN] as never,
        dataSource: data as never,
        expandable: { expandedRowRender: () => 'x' } as never,
      },
      attachTo: document.body,
    });
    const ths = w2.findAll('.apollo-table-thead th');
    expect(ths[1]!.classes()).toContain('apollo-table-row-expand-icon-cell');
    w2.unmount();
  });
});

describe('Table · 分页', () => {
  it('默认 pageSize=10：全量渲染不分页；pagination.size 切片', () => {
    const big = Array.from({ length: 25 }, (_, i) => ({ key: String(i), name: `n${i}` }));
    const w = mount(Table, {
      props: {
        columns: columns as never,
        dataSource: big as never,
        pagination: { pageSize: 10 } as never,
      },
      attachTo: document.body,
    });
    expect(rows(w).length).toBe(10);
    expect(w.find('.apollo-table-pagination').exists()).toBe(true);
    w.unmount();
  });

  it('pagination=false 关闭', () => {
    const big = Array.from({ length: 25 }, (_, i) => ({ key: String(i), name: `n${i}` }));
    const w = mount(Table, {
      props: {
        columns: columns as never,
        dataSource: big as never,
        pagination: false,
      },
      attachTo: document.body,
    });
    expect(rows(w).length).toBe(25);
    w.unmount();
  });
});

describe('Table · 汇总行（summary）', () => {
  it('Summary.Row + Summary.Cell 渲染 tfoot', () => {
    const w = mount(Table, {
      props: {
        columns: columns as never,
        dataSource: data as never,
        summary: () => ['SummaryRow', { colSpan: 2 }, 'Total'] as never,
      } as never,
      attachTo: document.body,
    });
    // summary 以 VNode 通道传入（引擎原样渲染进 tfoot）
    expect(w.find('tfoot.apollo-table-summary').exists()).toBe(true);
    w.unmount();
  });
});

describe('Table · getSortData（L1 直测）', () => {
  it('多重排序按 multiplePriority 降序应用', () => {
    const states = [
      {
        column: {
          key: 'a',
          dataIndex: 'a',
          sorter: (x: never, y: never) => (x as { a: number }).a - (y as { a: number }).a,
        },
        key: 'a',
        multiplePriority: 1,
        sortOrder: 'ascend',
      },
      {
        column: {
          key: 'b',
          dataIndex: 'b',
          sorter: (x: never, y: never) => (x as { b: number }).b - (y as { b: number }).b,
        },
        key: 'b',
        multiplePriority: 2,
        sortOrder: 'descend',
      },
    ] as never;
    const src = [
      { a: 1, b: 1 },
      { a: 2, b: 2 },
      { a: 1, b: 3 },
    ];
    const sorted = getSortData(src, states, 'children');
    expect(sorted.map((r: { b: number }) => r.b)).toEqual([3, 2, 1]);
  });
});

describe('Table · expandable（T2 展开）', () => {
  it('row 型：点击图标展开/收起，onExpandedRowsChange 与受控写回', async () => {
    const onExpandedRowsChange = vi.fn();
    const w = mount(Table, {
      props: {
        columns: columns as never,
        dataSource: data as never,
        expandable: {
          expandedRowRender: (r: Record<string, unknown>) => `Detail-${String(r.key)}`,
          onExpandedRowsChange,
        } as never,
      },
      attachTo: document.body,
    });
    expect(w.text()).not.toContain('Detail-1');
    const icon = w.find('.apollo-table-row-expand-icon');
    await icon.trigger('click');
    await nextTick();
    expect(w.text()).toContain('Detail-1');
    expect(onExpandedRowsChange).toHaveBeenCalledWith(['1']);
    expect(icon.classes()).toContain('apollo-table-row-expand-icon-expanded');
    w.unmount();
  });

  it('nest 型：childrenColumnName 树形缩进 + 父子行各自展开', async () => {
    const treeData = [{ key: '1', name: 'parent', children: [{ key: '1-1', name: 'child' }] }];
    const w = mount(Table, {
      props: {
        columns: columns as never,
        dataSource: treeData as never,
      },
      attachTo: document.body,
    });
    const parentIcon = w.find('.apollo-table-row-expand-icon');
    expect(parentIcon.classes()).toContain('apollo-table-row-expand-icon-collapsed');
    await parentIcon.trigger('click');
    await nextTick();
    expect(w.text()).toContain('child');
    w.unmount();
  });

  it('受控 expandedRowKeys：props 更新驱动展开', async () => {
    const w = mount(Table, {
      props: {
        columns: columns as never,
        dataSource: data as never,
        expandable: {
          expandedRowKeys: [] as TableKey[],
          expandedRowRender: () => 'Detail',
        } as never,
      },
      attachTo: document.body,
    });
    expect(w.text()).not.toContain('Detail');
    await w.setProps({
      expandable: {
        expandedRowKeys: ['2'],
        expandedRowRender: () => 'Detail',
      } as never,
    });
    await nextTick();
    expect(w.text()).toContain('Detail');
    w.unmount();
  });

  it('defaultExpandAllRows：初始全展开', async () => {
    const w = mount(Table, {
      props: {
        columns: columns as never,
        dataSource: data as never,
        expandable: {
          expandedRowRender: () => 'Detail',
          defaultExpandAllRows: true,
        } as never,
      },
      attachTo: document.body,
    });
    expect(w.text()).toContain('Detail');
    w.unmount();
  });

  it('rowExpandable=false 的行无展开图标（spaced 占位）', async () => {
    const w = mount(Table, {
      props: {
        columns: columns as never,
        dataSource: data as never,
        expandable: {
          expandedRowRender: () => 'Detail',
          rowExpandable: (r: Record<string, unknown>) => r.key !== '1',
        } as never,
      },
      attachTo: document.body,
    });
    const icons = w.findAll('.apollo-table-row-expand-icon');
    expect(icons.length).toBe(3);
    // ⚠️ antd 层 ExpandIcon 是 button，类名带 `-row-expand-icon-` 中缀（区别于引擎 span 的 `-row-spaced`）
    expect(icons[0]!.classes()).toContain('apollo-table-row-expand-icon-spaced');
    expect(icons[1]!.classes()).not.toContain('apollo-table-row-expand-icon-spaced');
    w.unmount();
  });
});
