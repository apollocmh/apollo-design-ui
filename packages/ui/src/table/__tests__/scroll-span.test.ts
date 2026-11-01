import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref, shallowRef } from 'vue';
import ColspanRowspanDemo from '../demo/colspan-rowspan.vue';
import FixedHeaderDemo from '../demo/fixed-header.vue';
import type { ColumnsType, TableScrollConfig } from '../interface';
import Table from '../Table';

interface Row {
  key: string;
  name: string;
}
const RowTable = Table<Row>;
const columns: ColumnsType<Row> = [{ key: 'name', dataIndex: 'name', title: 'Name' }];
const data: Row[] = Array.from({ length: 20 }, (_, index) => ({
  key: String(index),
  name: `Row ${index}`,
}));
const options = { attachTo: document.body };
const settle = async () => {
  await nextTick();
  await nextTick();
};
afterEach(() => {
  vi.restoreAllMocks();
});

describe('Table scroll height and the actual span demo', () => {
  it.each([false, true])(
    'keeps explicit numeric heights including zero with current data (virtual=%s)',
    async (virtual) => {
      const scroll = shallowRef<TableScrollConfig>({ x: 500, y: 240 });
      const rows = ref(data);
      const w = mount(
        defineComponent({
          setup: () => () =>
            h(RowTable, {
              virtual,
              scroll: scroll.value,
              columns,
              dataSource: rows.value,
              pagination: false,
            }),
        }),
        options,
      );
      const selector = virtual ? '.apollo-table-tbody-virtual-holder' : '.apollo-table-body';
      for (const height of [240, 400, 0]) {
        scroll.value = { x: 500, y: height };
        await settle();
        const body = w.find<HTMLElement>(selector);
        expect({
          maxHeight: body.exists() ? body.element.style.maxHeight : null,
          fixedHeader: w.find('.apollo-table-header').exists(),
          virtualBody: w.find('.apollo-table-tbody-virtual-holder').exists(),
        }).toEqual({ maxHeight: `${height}px`, fixedHeader: true, virtualBody: virtual });
      }
      rows.value = [];
      await settle();
      expect(w.get<HTMLElement>(selector).element.style.maxHeight).toBe('0px');
      if (!virtual) {
        scroll.value = { x: 500 };
        await settle();
        expect(w.find('.apollo-table-body').exists()).toBe(false);
        expect(w.get<HTMLElement>('.apollo-table-content').element.style.maxHeight).toBe('');
      }
      w.unmount();
    },
  );

  it('preserves legal CSS lengths and removes the normal body constraint when y is withdrawn', async () => {
    const scroll = shallowRef<TableScrollConfig>({ y: '240px' });
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(RowTable, { scroll: scroll.value, columns, dataSource: data, pagination: false }),
      }),
      options,
    );
    for (const value of ['240px', '0px', '25vh', 'calc(100vh - 64px)']) {
      scroll.value = { y: value };
      await settle();
      const nativeStyle = document.createElement('div').style;
      nativeStyle.maxHeight = value;
      expect(w.get<HTMLElement>('.apollo-table-body').element.style.maxHeight).toBe(
        nativeStyle.maxHeight,
      );
    }
    scroll.value = {};
    await settle();
    expect(w.find('.apollo-table-body').exists()).toBe(false);
    expect(w.get<HTMLElement>('.apollo-table-content').element.style.maxHeight).toBe('');
    w.unmount();
  });

  it('retains the documented virtual numeric requirement for strings and withdrawal', async () => {
    const error = vi.spyOn(console, 'error');
    const scroll = shallowRef<TableScrollConfig>({ x: 500, y: 240 });
    const w = mount(
      defineComponent({
        setup: () => () =>
          h(RowTable, {
            virtual: true,
            scroll: scroll.value,
            columns,
            dataSource: data,
            pagination: false,
          }),
      }),
      options,
    );
    for (const next of [{ x: 500, y: '240px' }, { x: 500 }]) {
      error.mockClear();
      scroll.value = next;
      await settle();
      expect(w.get<HTMLElement>('.apollo-table-tbody-virtual-holder').element.style.maxHeight).toBe(
        '500px',
      );
      expect(error.mock.calls.length).toBeGreaterThan(0);
      for (const args of error.mock.calls) {
        expect(args).toEqual([
          expect.stringContaining('`scroll.y` in virtual table must be number.'),
        ]);
      }
    }
    w.unmount();
  });

  it('constrains the actual fixed-header demo to its declared 240px with all twenty rows', async () => {
    const w = mount(FixedHeaderDemo, options);
    await settle();
    expect(w.get<HTMLElement>('.apollo-table-body').element.style.maxHeight).toBe('240px');
    expect(w.findAll('.apollo-table-body tbody > tr[data-row-key]')).toHaveLength(20);
    w.unmount();
  });

  it('renders every actual merged-demo cell with complete five-column coverage', async () => {
    const w = mount(ColspanRowspanDemo, options);
    await settle();
    const rows = w.findAll<HTMLTableRowElement>('.apollo-table-tbody > tr[data-row-key]');
    const cells = rows.map((row) => Array.from(row.element.cells));
    expect(cells.map((row) => row.length)).toEqual([5, 3, 4, 5, 3]);
    const occupied = new Map<string, string>();
    for (const [rowIndex, row] of cells.entries()) {
      let column = 0;
      for (const cell of row) {
        while (occupied.has(`${rowIndex}/${column}`)) column += 1;
        for (let down = 0; down < cell.rowSpan; down += 1) {
          for (let across = 0; across < cell.colSpan; across += 1) {
            const key = `${rowIndex + down}/${column + across}`;
            expect(occupied.has(key), `overlapping cell at ${key}`).toBe(false);
            occupied.set(key, cell.textContent?.trim() ?? '');
          }
        }
        column += cell.colSpan;
      }
    }
    expect(
      rows.map((_, row) =>
        Array.from({ length: 5 }, (_, column) => occupied.get(`${row}/${column}`)),
      ),
    ).toEqual([
      ['John Brown', '32', '0571-22098909', '18889898989', 'New York No. 1 Lake Park'],
      ['John Brown', '42', '42', '18889898888', 'London No. 1 Lake Park'],
      ['John Brown', '32', '0575-22098909', '18900010002', 'Sydney No. 1 Lake Park'],
      ['Jim Red', '18', '0575-22098909', '18900010002', 'London No. 2 Lake Park'],
      ['Jim Red', '18', '0575-22098909', '18900010002', 'Dublin No. 2 Lake Park'],
    ]);
    expect(occupied.size).toBe(25);
    expect(cells.map((row) => row.map((cell) => [cell.rowSpan, cell.colSpan]))).toEqual([
      [
        [3, 1],
        [1, 1],
        [1, 1],
        [1, 1],
        [1, 1],
      ],
      [
        [1, 2],
        [1, 1],
        [1, 1],
      ],
      [
        [1, 1],
        [1, 1],
        [1, 1],
        [1, 1],
      ],
      [
        [2, 1],
        [1, 1],
        [2, 1],
        [1, 1],
        [1, 1],
      ],
      [
        [1, 1],
        [1, 1],
        [1, 1],
      ],
    ]);
    w.unmount();
  });
});
