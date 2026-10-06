/**
 * L5 · 无障碍 —— Table
 *
 * 判据来源（antd 6.6.4 + `@rc-component/table`）：
 *   - 表格本体是原生 `<table>`（隐式 `role=table`），表头 `<th scope="col|colgroup">`、
 *     行头 `<th scope="row">`（`engine/Header.ts` / `engine/Cell.ts` 的 `scope`）；
 *   - 排序列表头 `aria-sort="ascending|descending"` + `aria-label`（`hooks/use-sorter.ts`）；
 *   - 筛选是 `role="button"`（`hooks/use-filter.ts`）；
 *   - 选择列复选框有 `aria-label`（"Select all" / 可定制，`hooks/use-selection.ts`）；
 *   - 展开图标 `aria-label` + `aria-expanded`（`ExpandIcon.ts`）。
 *
 * ⚠️ 这是本仓**最后一个没有 a11y 审计的组件**（`docs/KNOWN-ISSUES.md` §1.7）。
 *    若扫描出真实 violation：**不要顺手加豁免** —— `matchA11yAllowances` 的每条豁免
 *    必须写明理由，且先在 KNOWN-ISSUES 登记。
 */

import { a11yDemoTest } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { Table } from '../index';

const columns = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  {
    title: 'Age',
    dataIndex: 'age',
    key: 'age',
    sorter: (a: { age: number }, b: { age: number }) => a.age - b.age,
  },
];
const dataSource = [
  { key: '1', name: 'Alice', age: 30 },
  { key: '2', name: 'Bob', age: 25 },
];

a11yDemoTest('Table', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 12,
});

describe('Table · a11y（L5）', () => {
  it('表头 <th scope="col">、行头 <th scope="row">（有 rowScope 时）', async () => {
    const w = mount(Table, {
      props: { columns, dataSource, rowScope: 'row' },
    });
    await nextTick();
    const ths = w.findAll('thead th');
    expect(ths.length).toBeGreaterThan(0);
    for (const th of ths) {
      expect(th.attributes('scope')).toBeTruthy();
    }
  });

  it('可排序列：已排序时才有 aria-sort，且方向正确', async () => {
    // ⚠️ 判据（`hooks/use-sorter.ts:240`）：`if (sortOrder) cell['aria-sort'] = …`
    //    ⇒ **未排序的列不写 `aria-sort`**（不是写 `none`）。所以这里必须给默认排序。
    const ascColumns = [
      { title: 'Name', dataIndex: 'name', key: 'name' },
      {
        title: 'Age',
        dataIndex: 'age',
        key: 'age',
        defaultSortOrder: 'ascend' as const,
        sorter: (a: { age: number }, b: { age: number }) => a.age - b.age,
      },
    ];
    const w = mount(Table, { props: { columns: ascColumns, dataSource } });
    await nextTick();
    const sorter = w.find('thead th[aria-sort]');
    expect(sorter.exists()).toBe(true);
    expect(sorter.attributes('aria-sort')).toBe('ascending');

    // 未排序时**不**写 aria-sort（与上游一致）
    const plain = mount(Table, { props: { columns, dataSource } });
    await nextTick();
    expect(plain.find('thead th[aria-sort]').exists()).toBe(false);
  });

  it('选择列：全选复选框有可访问名', async () => {
    const w = mount(Table, {
      props: { columns, dataSource, rowSelection: {} },
    });
    await nextTick();
    const boxes = w.findAll('input[type="checkbox"]');
    expect(boxes.length).toBeGreaterThan(0);
    // 至少全选那个有 aria-label（antd 的 "Select all" / 可定制）
    expect(w.find('input[type="checkbox"][aria-label]').exists()).toBe(true);
  });

  it('展开图标：aria-label + aria-expanded', async () => {
    const w = mount(Table, {
      props: { columns, dataSource, expandable: { expandedRowRender: () => 'detail' } },
    });
    await nextTick();
    const icon = w.find('button[aria-expanded]');
    expect(icon.exists()).toBe(true);
    expect(icon.attributes('aria-label')).toBeTruthy();
  });

  it('筛选是 role="button"（不是裸 div）', async () => {
    const filterColumns = [
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        filters: [{ text: 'Alice', value: 'Alice' }],
        onFilter: (value: unknown, record: { name: string }) => record.name === value,
      },
    ];
    const w = mount(Table, { props: { columns: filterColumns, dataSource } });
    await nextTick();
    expect(w.find('.apollo-table-filter-trigger[role="button"]').exists()).toBe(true);
  });
});
