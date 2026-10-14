/**
 * Issue #17 回归：Table 的三处「setup 期快照」。
 *
 * 判据（antd `InternalTable.tsx`）：`changeEventInfo.pagination` 是**每次 render** 由
 * `mergedPagination + props.pagination` 重算的；本仓 setup 只跑一次 ⇒ 必须是 getter
 * （与文件里已有的 sorter/filters getter 同判）。`column`/`sortDirections`/
 * `showSorterTooltip`/`getPopupContainer` 同理：传给 hook 时要保持响应式。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import type { TablePaginationConfig } from '../interface';
import Table from '../Table';

const data = Array.from({ length: 6 }, (_, i) => ({
  key: String(i + 1),
  name: `name-${i + 1}`,
  age: 20 + i,
}));

const sortColumns = [
  { title: 'Name', dataIndex: 'name', key: 'name' },
  {
    title: 'Age',
    dataIndex: 'age',
    key: 'age',
    sorter: (a: never, b: never) => (a as { age: number }).age - (b as { age: number }).age,
  },
];

const mountTable = (props: Record<string, unknown>) =>
  mount(Table, {
    props: { columns: sortColumns as never, dataSource: data as never, ...props },
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });

const lastPagination = (calls: unknown[][]) => calls.at(-1)![0] as TablePaginationConfig;

const clickPage = async (w: ReturnType<typeof mount>, page: number) => {
  const item = w.findAll('.apollo-pagination-item').find((n) => n.text().trim() === String(page));
  expect(item).toBeTruthy();
  await item!.trigger('click');
  await nextTick();
};

describe('Table · Issue #17', () => {
  describe('#17.1 changeEventInfo.pagination 需实时派生', () => {
    it('[A] 翻到第 2 页后排序 ⇒ onChange.pagination.current 仍是 2', async () => {
      const onChange = vi.fn();
      const w = mountTable({ onChange, pagination: { pageSize: 2 } as never });
      await nextTick();
      await clickPage(w, 2);
      expect(lastPagination(onChange.mock.calls).current).toBe(2);

      await w.findAll('.apollo-table-thead th')[1]!.trigger('click');
      await nextTick();
      // 排序不触发分页重置（action='sort', reset=false）
      expect(lastPagination(onChange.mock.calls).current).toBe(2);
      expect(lastPagination(onChange.mock.calls).pageSize).toBe(2);
      w.unmount();
    });

    it('[B] 翻到第 2 页后过滤 ⇒ onChange.pagination.current 重置为 1', async () => {
      const onChange = vi.fn();
      const w = mountTable({
        onChange,
        pagination: { pageSize: 2 } as never,
        columns: [
          {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            filters: [{ text: '1', value: '1' }],
            onFilter: (value: unknown, record: never) =>
              String((record as { name: string }).name).includes(value as string),
          },
        ] as never,
      });
      await nextTick();
      await clickPage(w, 2);
      expect(lastPagination(onChange.mock.calls).current).toBe(2);

      await w.find('.apollo-table-filter-trigger').trigger('click');
      await nextTick();
      const dropdown = document.body.querySelector('.apollo-table-filter-dropdown');
      expect(dropdown).toBeTruthy();
      dropdown!
        .querySelector('.apollo-dropdown-menu li')!
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await nextTick();
      (
        dropdown!.querySelector(
          '.apollo-table-filter-dropdown-btns button:last-child',
        ) as HTMLElement
      ).click();
      await nextTick();

      expect(lastPagination(onChange.mock.calls).current).toBe(1);
      w.unmount();
    });

    it('[C] 受控 pagination.current 变更后排序 ⇒ onChange 反映最新受控值', async () => {
      const onChange = vi.fn();
      const w = mountTable({ onChange, pagination: { current: 1, pageSize: 2 } as never });
      await nextTick();
      await w.setProps({ pagination: { current: 3, pageSize: 2 } as never });
      await nextTick();

      await w.findAll('.apollo-table-thead th')[1]!.trigger('click');
      await nextTick();
      expect(lastPagination(onChange.mock.calls).current).toBe(3);
      w.unmount();
    });
  });

  describe('#17.2 column 公共列配置需响应式', () => {
    it('[A] column.align 运行时切换 ⇒ 单元格 text-align 同步', async () => {
      const w = mountTable({ column: { align: 'center' } as never });
      await nextTick();
      const cell = () => w.find('.apollo-table-tbody td');
      expect(cell().attributes('style')).toContain('center');

      await w.setProps({ column: { align: 'right' } as never });
      await nextTick();
      expect(cell().attributes('style')).toContain('right');
      w.unmount();
    });

    it('[B] column.className 运行时切换 ⇒ 单元格类名同步', async () => {
      const w = mountTable({ column: { className: 'from-a' } as never });
      await nextTick();
      const cell = () => w.find('.apollo-table-tbody td');
      expect(cell().classes()).toContain('from-a');

      await w.setProps({ column: { className: 'from-b' } as never });
      await nextTick();
      expect(cell().classes()).toContain('from-b');
      expect(cell().classes()).not.toContain('from-a');
      w.unmount();
    });
  });

  describe('#17.3 sorter / filter 配置需响应式', () => {
    it('[A] sortDirections 收窄 ⇒ 对应方向的图标消失', async () => {
      const w = mountTable({ sortDirections: ['ascend', 'descend'] as never });
      await nextTick();
      expect(w.find('.apollo-table-column-sorter-up').exists()).toBe(true);
      expect(w.find('.apollo-table-column-sorter-down').exists()).toBe(true);

      await w.setProps({ sortDirections: ['ascend'] as never });
      await nextTick();
      expect(w.find('.apollo-table-column-sorter-up').exists()).toBe(true);
      expect(w.find('.apollo-table-column-sorter-down').exists()).toBe(false);
      w.unmount();
    });

    it('[B] showSorterTooltip 切到 {target:"sorter-icon"} ⇒ 出现 tooltip target 容器', async () => {
      const w = mountTable({ showSorterTooltip: true });
      await nextTick();
      expect(w.find('.apollo-table-column-sorters-tooltip-target-sorter').exists()).toBe(false);

      await w.setProps({ showSorterTooltip: { target: 'sorter-icon' } as never });
      await nextTick();
      expect(w.find('.apollo-table-column-sorters-tooltip-target-sorter').exists()).toBe(true);
      w.unmount();
    });

    it('[C] getPopupContainer 运行时替换 ⇒ 过滤下拉挂到新容器', async () => {
      const containerA = document.createElement('div');
      const containerB = document.createElement('div');
      containerA.className = 'c-a';
      containerB.className = 'c-b';
      document.body.append(containerA, containerB);

      const w = mountTable({
        getPopupContainer: () => containerA,
        columns: [
          {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            filters: [{ text: '1', value: '1' }],
            onFilter: () => true,
          },
        ] as never,
      });
      await nextTick();
      await w.find('.apollo-table-filter-trigger').trigger('click');
      await nextTick();
      expect(containerA.querySelector('.apollo-table-filter-dropdown')).toBeTruthy();

      await w.setProps({ getPopupContainer: () => containerB });
      await nextTick();
      await w.find('.apollo-table-filter-trigger').trigger('click');
      await nextTick();
      await w.find('.apollo-table-filter-trigger').trigger('click');
      await nextTick();
      expect(containerB.querySelector('.apollo-table-filter-dropdown')).toBeTruthy();

      w.unmount();
      containerA.remove();
      containerB.remove();
    });
  });
});
