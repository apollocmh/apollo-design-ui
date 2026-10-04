/**
 * L2 · Table 组件测试。
 *
 * 覆盖：基础渲染 / 空态 / 尺寸与边框 / loading / 展开（row + nest）/ 排序 /
 * 过滤（受控判据 null）/ 选择（checkbox + radio）/ 分页 / 汇总行 / title·footer·caption。
 * 受控判据用例（§3 验收点）：`sortOrder: null` / `filteredValue: null` 显式传入也算受控。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h, nextTick, ref } from 'vue';
import { EXPAND_COLUMN } from '../engine/constant';
import { getFilterData } from '../hooks/use-filter';
import { SELECTION_COLUMN } from '../hooks/use-selection';
import { getSortData } from '../hooks/use-sorter';
import type { TableKey } from '../interface';
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

describe('Table · 排序/过滤（T3）', () => {
  it('多重排序：multiple 靠后的列在先前列已排序基础上叠加', async () => {
    const onChange = vi.fn();
    const multiColumns = [
      { title: 'Name', dataIndex: 'name' },
      {
        title: 'Age',
        dataIndex: 'age',
        sorter: { compare: (a: { age: number }, b: { age: number }) => a.age - b.age, multiple: 2 },
      },
      {
        title: 'Key',
        dataIndex: 'key',
        sorter: { compare: () => 0, multiple: 1 },
      },
    ];
    const w = mount(Table, {
      props: { columns: multiColumns as never, dataSource: data as never, onChange },
      attachTo: document.body,
    });
    // 先点 Key（multiple:1 主排序），再点 Age（multiple:2 次排序）
    const ths = w.findAll('.apollo-table-thead th');
    await ths[2]!.trigger('click');
    await nextTick();
    await ths[1]!.trigger('click');
    await nextTick();
    // ⚠️ antd 语义：多重排序时 onChange 的 sorter 是 SorterResult[]（multiple 优先级序）
    const sorterArg = onChange.mock.calls.at(-1)![2] as
      | { column?: { dataIndex?: string }; order?: string }
      | { column?: { dataIndex?: string }; order?: string }[];
    const last = Array.isArray(sorterArg) ? sorterArg.at(-1)! : sorterArg;
    expect(last.column?.dataIndex).toBe('age');
    expect(last.order).toBe('ascend');
    w.unmount();
  });

  it('受控 sortOrder 有效值：点击后 onChange 仍发、表头保持 ascend', async () => {
    const onChange = vi.fn();
    const w = mount(Table, {
      props: {
        columns: [
          { title: 'Age', dataIndex: 'age', sorter: () => 0, sortOrder: 'ascend' },
        ] as never,
        dataSource: data as never,
        onChange,
      },
      attachTo: document.body,
    });
    await w.find('.apollo-table-thead th').trigger('click');
    await nextTick();
    expect(onChange).toHaveBeenCalled();
    expect(
      w
        .find('.apollo-table-thead th')
        .classes()
        .some((c) => c.includes('sort')),
    ).toBe(true);
    w.unmount();
  });

  it('filterIcon 定制渲染；确定后 onChange 带过滤数据', async () => {
    const onChange = vi.fn();
    const filterColumns = [
      {
        title: 'Name',
        dataIndex: 'name',
        filters: [{ text: 'John', value: 'John' }],
        onFilter: (value: unknown, record: never) =>
          (record as { name: string }).name.includes(value as string),
        filterIcon: () => h('span', { class: 'my-filter-icon' }, 'F'),
      },
    ];
    // ⚠️ 真实 Teleport（stub 副本不挂事件监听器）
    const w = mount(Table, {
      props: { columns: filterColumns as never, dataSource: data as never, onChange },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    expect(w.find('.my-filter-icon').exists()).toBe(true);
    await w.find('.apollo-table-filter-trigger').trigger('click');
    await nextTick();
    const dropdown = document.body.querySelector('.apollo-table-filter-dropdown')!;
    const checkbox = dropdown.querySelector('.apollo-dropdown-menu input') as HTMLInputElement;
    expect(checkbox).toBeTruthy();
    checkbox.click();
    await nextTick();
    (
      dropdown.querySelector('.apollo-table-filter-dropdown-btns button:last-child') as HTMLElement
    ).click();
    await nextTick();
    // ⚠️ onChange 载荷：args[1] = filters 映射（{字段: FilterValue}），数据在 args[3].currentDataSource
    const filters = onChange.mock.calls.at(-1)![1] as Record<string, string[]>;
    expect(filters.name).toEqual(['John']);
    const currentDataSource = (
      onChange.mock.calls.at(-1)![3] as { currentDataSource: { key: string }[] }
    ).currentDataSource;
    expect(currentDataSource.length).toBe(1); // 只有 John Brown
    w.unmount();
  });

  it('受控 filteredValue 有效值：初始即过滤生效', async () => {
    const filterColumns = [
      {
        title: 'Name',
        dataIndex: 'name',
        filters: [{ text: 'John', value: 'John' }],
        onFilter: (value: unknown, record: never) =>
          (record as { name: string }).name.includes(value as string),
        filteredValue: ['John'],
      },
    ];
    const w = mount(Table, {
      props: { columns: filterColumns as never, dataSource: data as never },
      attachTo: document.body,
    });
    expect(w.findAll('.apollo-table-tbody > tr[data-row-key]').length).toBe(1);
    w.unmount();
  });
});

describe('Table · 选择/分页（T4）', () => {
  it('radio 型：单选互斥，selectedRowKeys 单元素', async () => {
    const onChange = vi.fn();
    const w = mount(Table, {
      props: {
        columns: columns as never,
        dataSource: data as never,
        rowSelection: { type: 'radio', onChange } as never,
      },
      attachTo: document.body,
    });
    const radios = w.findAll('.apollo-table-tbody .apollo-radio-wrapper input');
    expect(radios.length).toBe(3);
    await radios[1]!.setValue(true);
    await nextTick();
    expect(onChange).toHaveBeenLastCalledWith(['2'], expect.anything(), expect.anything());
    await radios[2]!.setValue(true);
    await nextTick();
    expect(onChange).toHaveBeenLastCalledWith(['3'], expect.anything(), expect.anything());
    w.unmount();
  });

  it('树形选择：勾父全选子，半选态在表头', async () => {
    const treeData = [
      {
        key: 'p',
        name: 'parent',
        children: [
          { key: 'c1', name: 'c1' },
          { key: 'c2', name: 'c2' },
        ],
      },
    ];
    const onChange = vi.fn();
    const w = mount(Table, {
      props: {
        columns: columns as never,
        dataSource: treeData as never,
        rowSelection: { onChange } as never,
        expandable: { defaultExpandAllRows: true } as never,
      },
      attachTo: document.body,
    });
    // 默认展开后：p + c1 + c2 共 3 个 checkbox
    const boxes = w.findAll('.apollo-table-tbody .apollo-checkbox-wrapper input');
    expect(boxes.length).toBe(3);
    // 勾子节点 c1 → 父半选
    await boxes[1]!.setValue(true);
    await nextTick();
    const keys = onChange.mock.calls.at(-1)![0] as string[];
    expect(keys).toEqual(['c1']);
    // 表头 checkbox 呈 indeterminate（halfChecked）
    const header = w.find('.apollo-table-thead .apollo-checkbox');
    expect(header.classes()).toContain('apollo-checkbox-indeterminate');
    // 勾另一个子 → 父全选
    await boxes[2]!.setValue(true);
    await nextTick();
    expect((onChange.mock.calls.at(-1)![0] as string[]).sort()).toEqual(['c1', 'c2']);
    w.unmount();
  });

  it('selections 菜单：ALL/INVERT/NONE 三项可执行', async () => {
    const onChange = vi.fn();
    const w = mount(Table, {
      props: {
        columns: columns as never,
        dataSource: data as never,
        rowSelection: {
          onChange,
          selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT, Table.SELECTION_NONE],
        } as never,
      },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    // 先勾第一行
    await w.findAll('.apollo-table-tbody .apollo-checkbox-wrapper input')[0]!.setValue(true);
    await nextTick();
    // ⚠️ antd 语义：selections 下拉**未传 trigger** ⇒ 默认 hover 打开（useSelection.js:325）；
    //    hover 有 150ms mouseEnterDelay ⇒ 用 vi.waitFor 轮询
    await w.find('.apollo-table-selection-extra .apollo-dropdown-trigger').trigger('mouseenter');
    await vi.waitFor(
      () => {
        const items = document.body.querySelectorAll('.apollo-dropdown-menu li');
        expect(items.length).toBe(3);
      },
      { timeout: 2000, interval: 50 },
    );
    // ⚠️ 等展开 motion 结束（过渡中的 popup DOM 会被替换 ⇒ li 监听器丢失）
    await new Promise((resolve) => setTimeout(resolve, 300));
    await nextTick();
    const menuItems = document.body.querySelectorAll('.apollo-dropdown-menu li');
    // INVERT：1 勾 → 2/3 勾（⚠️ Menu 的监听器可能在 li 内层 —— 逐层点到底）
    const invertLi = menuItems[1] as HTMLElement;
    invertLi.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await nextTick();
    const keys = onChange.mock.calls.at(-1)![0] as string[];
    expect(keys.sort()).toEqual(['2', '3']);
    w.unmount();
  });

  it('受控分页：current 变化驱动切片，onPageChange 通知', async () => {
    const big = Array.from({ length: 12 }, (_, i) => ({ key: String(i), name: `n${i}` }));
    const current = ref(1);
    const w = mount(Table, {
      props: {
        columns: columns as never,
        dataSource: big as never,
        pagination: {
          defaultCurrent: 1,
          pageSize: 10,
          onChange: (c: number) => {
            current.value = c;
          },
        },
      },
      attachTo: document.body,
    });
    expect(w.findAll('.apollo-table-tbody > tr[data-row-key]').length).toBe(10);
    // 非受控路径（defaultCurrent）：内部 current 翻页
    const page2 = w
      .findAll('.apollo-pagination .apollo-pagination-item')
      .find((el) => el.text() === '2');
    await page2!.trigger('click');
    await nextTick();
    await nextTick();
    expect(w.findAll('.apollo-table-tbody > tr[data-row-key]').length).toBe(2);
    w.unmount();
  });

  it('受控 current：setProps 驱动切片', async () => {
    const big = Array.from({ length: 12 }, (_, i) => ({ key: String(i), name: `n${i}` }));
    const w = mount(Table, {
      props: {
        columns: columns as never,
        dataSource: big as never,
        pagination: { current: 1, pageSize: 10 },
      },
      attachTo: document.body,
    });
    expect(w.findAll('.apollo-table-tbody > tr[data-row-key]').length).toBe(10);
    await w.setProps({ pagination: { current: 2, pageSize: 10 } });
    await nextTick();
    expect(w.findAll('.apollo-table-tbody > tr[data-row-key]').length).toBe(2);
    w.unmount();
  });

  it('showSizeChanger 换页大小：pageSize=5 → 3 页', async () => {
    const big = Array.from({ length: 12 }, (_, i) => ({ key: String(i), name: `n${i}` }));
    const pageSize = ref(10);
    const w = mount(Table, {
      props: {
        columns: columns as never,
        dataSource: big as never,
        pagination: {
          current: 1,
          pageSize: pageSize.value,
          pageSizeOptions: [5, 10],
          showSizeChanger: true,
          onShowSizeChange: (_c: number, ps: number) => {
            pageSize.value = ps;
          },
        },
      },
      attachTo: document.body,
    });
    // options 选择器存在（Select 组件，交互已在 select 流覆盖）
    expect(
      w
        .find('.apollo-pagination-options .apollo-select, .apollo-pagination-options select')
        .exists(),
    ).toBe(true);
    // setProps 换 pageSize → 切片 5
    await w.setProps({ pagination: { current: 1, pageSize: 5 } });
    await nextTick();
    expect(w.findAll('.apollo-table-tbody > tr[data-row-key]').length).toBe(5);
    w.unmount();
  });
});

describe('Table · 固定/汇总（T5）', () => {
  it('scroll.x + fixed 列：cell 带 fix-start/end 类与列宽 style', async () => {
    const fixedColumns = [
      { title: 'Name', dataIndex: 'name', key: 'name', width: 200, fixed: 'left' },
      { title: 'Age', dataIndex: 'age', key: 'age', width: 400 },
      { title: 'Address', dataIndex: 'address', key: 'address', width: 600, fixed: 'right' },
    ];
    const w = mount(Table, {
      props: {
        columns: fixedColumns as never,
        dataSource: data as never,
        scroll: { x: 1200 },
      },
      attachTo: document.body,
    });
    await nextTick();
    const headCells = w.findAll('.apollo-table-thead th');
    expect(headCells[0]!.classes()).toContain('apollo-table-cell-fix-start');
    expect(headCells[2]!.classes()).toContain('apollo-table-cell-fix-end');
    // body 首列同样固定
    const bodyFirst = w.find('.apollo-table-tbody > tr[data-row-key] > td');
    expect(bodyFirst.classes()).toContain('apollo-table-cell-fix-start');
    w.unmount();
  });

  it('scroll.y：独立表头（FixedHolder 双表结构）', async () => {
    const w = mount(Table, {
      props: {
        columns: columns as never,
        dataSource: data as never,
        scroll: { y: 100 },
      },
      attachTo: document.body,
    });
    await nextTick();
    // fixHeader 形态：the 的容器带 -header（FixedHolder 渲染）
    expect(w.find('.apollo-table-header').exists()).toBe(true);
    expect(w.find('.apollo-table-body').exists()).toBe(true);
    w.unmount();
  });

  it('Summary 行：colSpan 聚合 + tfoot 在表体内', async () => {
    const w = mount(Table, {
      props: {
        columns: columns as never,
        dataSource: data as never,
        summary: () =>
          h(Table.Summary, null, {
            default: () =>
              h(Table.Summary.Row, null, {
                default: () => [
                  h(Table.Summary.Cell, { index: 0, colSpan: 2 }, { default: () => 'Total' }),
                  h(Table.Summary.Cell, { index: 2 }, { default: () => '72' }),
                ],
              }),
          }),
      } as never,
      attachTo: document.body,
    });
    await nextTick();
    const tfoot = w.find('.apollo-table-tfoot, tfoot');
    expect(tfoot.exists()).toBe(true);
    expect(tfoot.text()).toContain('Total');
    expect(tfoot.text()).toContain('72');
    w.unmount();
  });

  it('sticky prop：FixedHolder 带 -sticky-holder 类', async () => {
    // ⚠️ rc useSticky.js:19：stickyClassName = `${prefixCls}-sticky-holder`（挂在
    //    FixedHolder 容器上），不是根 `-sticky`（`.ant-table-sticky` 不存在 ——
    //    style/sticky.js 的选择器都在 -sticky-holder 子树下）。
    const w = mount(Table, {
      props: {
        columns: columns as never,
        dataSource: data as never,
        sticky: { offsetHeader: 32 },
      } as never,
      attachTo: document.body,
    });
    await nextTick();
    expect(w.find('.apollo-table-sticky-holder').exists()).toBe(true);
    w.unmount();
  });
});
