/**
 * L1 · Table 的**纯函数层**（引擎 utils + antd 层 util）—— 逐条对拍上游。
 *
 * 这一层是 Table 唯一能在 jsdom 里被**完整**验证的部分（没有布局、没有时序），
 * 也是后面所有子系统的地基：列 key / 固定列几何 / 展开图标 / 老字段归并 / 分页方位。
 *
 * ⚠️ 其中 `validateValue` 是**全组件最重要的判据**（受控判定全靠它）⇒ 单独一组用例，
 *    并把 `0` / `''` / `false` 三个「看起来像没给、其实给了」的值逐个钉住。
 */

import { describe, expect, it, vi } from 'vitest';
import type { VNode } from 'vue';
import { EXPAND_COLUMN, INTERNAL_HOOKS } from '../engine/constant';
import {
  computedExpandedClassName,
  findAllChildrenKeys,
  renderExpandIcon,
} from '../engine/utils/expandUtil';
import { getCellFixedInfo, type StickyOffsets } from '../engine/utils/fixUtil';
import { getExpandableProps, INTERNAL_COL_DEFINE } from '../engine/utils/legacyUtil';
import { getOffset } from '../engine/utils/offsetUtil';
import { getColumnsKey, validateValue, validNumberValue } from '../engine/utils/valueUtil';
import {
  getColumnKey,
  getColumnPos,
  getPaginationSize,
  normalizePlacement,
  renderColumnTitle,
  safeColumnTitle,
} from '../util';

describe('Table · engine/valueUtil', () => {
  it('getColumnsKey：key → dataIndex（数组用 `-` 连接）→ `RC_TABLE_KEY`', () => {
    expect(
      getColumnsKey([
        { key: 'a' },
        { dataIndex: 'name' },
        { dataIndex: ['user', 'name'] },
        {},
        undefined,
      ]),
    ).toEqual(['a', 'name', 'user-name', 'RC_TABLE_KEY', 'RC_TABLE_KEY_next']);
  });

  it('getColumnsKey：冲突时**循环**追加 `_next`（不是加一次就完）', () => {
    expect(getColumnsKey([{ key: 'a' }, { key: 'a' }, { key: 'a' }, { key: 'a_next' }])).toEqual([
      'a',
      'a_next',
      'a_next_next',
      'a_next_next_next',
    ]);
  });

  // ⚠️ 2026-10-03 修正（原断言写错）：rc-table 的 `valueUtil.js:16` 是
  //    `key || toArray(dataIndex).join('-') || INTERNAL_KEY_PREFIX` —— **真值**判断，
  //    `key: 0` / `key: ''` 会落到 `RC_TABLE_KEY`（重复则 _next）。本仓逐字同构。
  it('getColumnsKey：`key: 0` / `key: ""` 走真值判断 ⇒ 落 RC_TABLE_KEY（rc 逐字）', () => {
    expect(getColumnsKey([{ key: 0 }, { key: '' }])).toEqual(['RC_TABLE_KEY', 'RC_TABLE_KEY_next']);
  });

  it('🚨 validateValue：只有 `null` / `undefined` 算「没给」', () => {
    expect(validateValue(0)).toBe(true);
    expect(validateValue('')).toBe(true);
    expect(validateValue(false)).toBe(true);
    expect(validateValue(null)).toBe(false);
    expect(validateValue(undefined)).toBe(false);
  });

  it('validNumberValue：`NaN` 与字符串都不算数字', () => {
    expect(validNumberValue(1200)).toBe(true);
    expect(validNumberValue(Number.NaN)).toBe(false);
    expect(validNumberValue('1200')).toBe(false);
  });
});

describe('Table · engine/constant', () => {
  it('EXPAND_COLUMN 是模块级单例（引用相等判据）；INTERNAL_HOOKS 字面量', () => {
    expect(EXPAND_COLUMN).toBe(EXPAND_COLUMN);
    expect(EXPAND_COLUMN).toEqual({});
    expect(INTERNAL_HOOKS).toBe('rc-table-internal-hook');
    expect(INTERNAL_COL_DEFINE).toBe('RC_TABLE_INTERNAL_COL_DEFINE');
  });
});

describe('Table · engine/fixUtil · getCellFixedInfo', () => {
  const offsets = (start: number[], end: number[], widths: number[]): StickyOffsets => ({
    start,
    end,
    widths,
  });

  it('非固定列 ⇒ 全是「空」值（fixStart/fixEnd 为 null、zIndex 0）', () => {
    const info = getCellFixedInfo(1, 1, [{}, {}, {}], offsets([0, 0, 0], [0, 0, 0], [10, 20, 30]));
    expect(info).toEqual({
      fixStart: null,
      fixEnd: null,
      fixedStartShadow: false,
      fixedEndShadow: false,
      offsetFixedStartShadow: 0,
      offsetFixedEndShadow: 0,
      isSticky: undefined,
      zIndex: 0,
      zIndexReverse: 0,
    });
  });

  it('start 固定（首列）⇒ fixStart 取 stickyOffsets.start[colStart]；zIndex = len*2 - colStart', () => {
    const columns = [{ fixed: 'start' }, {}, {}];
    const info = getCellFixedInfo(
      0,
      0,
      columns,
      offsets([0, 100, 100], [0, 0, 0], [100, 200, 300]),
    );
    expect(info.fixStart).toBe(0);
    expect(info.fixedStartShadow).toBe(true); // 右边一列不是 start 固定
    expect(info.zIndex).toBe(6); // 3*2 - 0
    expect(info.zIndexReverse).toBe(3); // 3 + 0
    expect(info.offsetFixedStartShadow).toBe(0); // colStart 之前没有列
  });

  it('🚨 合并单元格跨到非固定列 ⇒ **不**固定（两个端点都要是 start）', () => {
    const columns = [{ fixed: 'start' }, {}];
    const info = getCellFixedInfo(0, 1, columns, offsets([0, 100], [0, 0], [100, 200]));
    expect(info.fixStart).toBeNull();
    expect(info.zIndex).toBe(0);
  });

  it('start 固定的**中间**列：阴影只在块的最右一个上，偏移累加**非固定**列宽', () => {
    const columns = [{ fixed: 'start' }, { fixed: 'start' }, {}];
    const off = offsets([0, 100, 200], [0, 0, 0], [100, 100, 300]);
    expect(getCellFixedInfo(0, 0, columns, off).fixedStartShadow).toBe(false); // 右边是 start
    expect(getCellFixedInfo(1, 1, columns, off).fixedStartShadow).toBe(true);
    expect(getCellFixedInfo(1, 1, columns, off).offsetFixedStartShadow).toBe(0); // 之前的列都是固定列
  });

  it('end 固定 ⇒ fixEnd 取 stickyOffsets.end[colEnd]；zIndex = colEnd', () => {
    const columns = [{}, {}, { fixed: 'end' }];
    const info = getCellFixedInfo(2, 2, columns, offsets([0, 0, 0], [0, 0, 0], [100, 200, 300]));
    expect(info.fixEnd).toBe(0);
    expect(info.fixedEndShadow).toBe(true); // 左边一列不是 end 固定
    expect(info.zIndex).toBe(2); // colEnd
    expect(info.zIndexReverse).toBe(1); // 3 - 2
    expect(info.offsetFixedEndShadow).toBe(0);
  });

  it('end 阴影偏移累加 colEnd **之后**的非固定列宽', () => {
    const columns = [{ fixed: 'end' }, {}, { fixed: 'end' }];
    const info = getCellFixedInfo(0, 0, columns, offsets([0, 0, 0], [0, 0, 0], [100, 200, 300]));
    expect(info.fixedEndShadow).toBe(true);
    expect(info.offsetFixedEndShadow).toBe(200); // 中间那列的宽（widths[1]=200，rc 累加非固定列）
  });

  it('isSticky 原样透传', () => {
    const info = getCellFixedInfo(0, 0, [{}], {
      start: [0],
      end: [0],
      widths: [1],
      isSticky: true,
    });
    expect(info.isSticky).toBe(true);
  });
});

describe('Table · engine/expandUtil', () => {
  const asSpan = (vnode: VNode): { class: unknown; onClick?: (e: Event) => void } =>
    vnode.props as never;

  it('renderExpandIcon：不可展开 ⇒ 只加 `-row-spaced`，**不绑 onClick**', () => {
    const node = renderExpandIcon({
      prefixCls: 'apollo-table',
      record: { key: '1' },
      onExpand: vi.fn(),
      expanded: false,
      expandable: false,
    });
    expect(node.type).toBe('span');
    // ⚠️ Vue 的 `h()` 会把 class 归一成**字符串**（React 的 className 原样保留 prop）——
    //    断言按归一化后的形态写（原写数组形态是拿 React 语义当 Vue 契约）。
    expect(asSpan(node).class).toBe('apollo-table-row-expand-icon apollo-table-row-spaced');
    expect(asSpan(node).onClick).toBeUndefined();
  });

  it('renderExpandIcon：可展开 ⇒ `-row-expanded` / `-row-collapsed`；点击先 onExpand 再 stopPropagation', () => {
    const onExpand = vi.fn();
    const expandedNode = renderExpandIcon({
      prefixCls: 'apollo-table',
      record: { key: '1' },
      onExpand,
      expanded: true,
      expandable: true,
    });
    expect(asSpan(expandedNode).class).toBe(
      'apollo-table-row-expand-icon apollo-table-row-expanded',
    );

    const collapsedNode = renderExpandIcon({
      prefixCls: 'apollo-table',
      record: { key: '1' },
      onExpand,
      expanded: false,
      expandable: true,
    });
    expect(asSpan(collapsedNode).class).toBe(
      'apollo-table-row-expand-icon apollo-table-row-collapsed',
    );

    const order: string[] = [];
    const event = {
      stopPropagation: () => order.push('stop'),
    } as unknown as Event;
    onExpand.mockImplementation(() => order.push('expand'));
    asSpan(collapsedNode).onClick?.(event);
    expect(order).toEqual(['expand', 'stop']); // 顺序是契约
    expect(onExpand).toHaveBeenCalledWith({ key: '1' }, event);
  });

  it('findAllChildrenKeys：递归收集整棵树；`index` 是**同层**索引', () => {
    const data = [
      { key: 'a', children: [{ key: 'a1' }, { key: 'a2', children: [{ key: 'a21' }] }] },
      { key: 'b' },
    ];
    const seen: [string, number][] = [];
    const keys = findAllChildrenKeys(
      data,
      (record, index) => {
        seen.push([record.key, index]);
        return record.key;
      },
      'children',
    );
    expect(keys).toEqual(['a', 'a1', 'a2', 'a21', 'b']);
    expect(seen).toEqual([
      ['a', 0],
      ['a1', 0],
      ['a2', 1],
      ['a21', 0],
      ['b', 1],
    ]);
  });

  it('findAllChildrenKeys：`data` 为 undefined ⇒ `[]`（不抛）', () => {
    expect(findAllChildrenKeys(undefined, (r: { key: string }) => r.key, 'children')).toEqual([]);
  });

  it('computedExpandedClassName：string / function / 其余 ⇒ ""', () => {
    expect(computedExpandedClassName('x', {}, 0, 0)).toBe('x');
    expect(
      computedExpandedClassName(
        (r: { key: string }, i: number, indent: number) => `${r.key}-${i}-${indent}`,
        { key: 'k' },
        2,
        1,
      ),
    ).toBe('k-2-1');
    expect(computedExpandedClassName(undefined, {}, 0, 0)).toBe('');
  });
});

describe('Table · engine/legacyUtil · getExpandableProps', () => {
  it('有 expandable ⇒ `{...legacy, ...expandable}`', () => {
    expect(
      getExpandableProps({ expandable: { expandedRowKeys: ['1'] }, indentSize: 20 }, true),
    ).toEqual({ indentSize: 20, expandedRowKeys: ['1'] });
  });

  it('无 expandable ⇒ 用老字段，且**有老字段时告警**', () => {
    const warn = vi.fn();
    expect(getExpandableProps({ expandedRowKeys: ['1'] }, false, warn)).toEqual({
      expandedRowKeys: ['1'],
    });
    expect(warn).toHaveBeenCalledWith(
      false,
      'expanded related props have been moved into `expandable`.',
    );
  });

  it('无 expandable 且无老字段 ⇒ **不告警**', () => {
    const warn = vi.fn();
    getExpandableProps({ dataSource: [] }, false, warn);
    expect(warn).not.toHaveBeenCalled();
  });

  it('`showExpandColumn: false` ⇒ 强制 `expandIconColumnIndex = -1`', () => {
    expect(getExpandableProps({ expandable: { showExpandColumn: false } }, true)).toEqual({
      showExpandColumn: false,
      expandIconColumnIndex: -1,
    });
  });
});

describe('Table · engine/offsetUtil · getOffset', () => {
  it('= getBoundingClientRect + 页面滚动量 - documentElement 的 border', () => {
    const el = {
      getBoundingClientRect: () => ({ left: 30, top: 40, width: 10, height: 10 }),
    } as unknown as HTMLElement;
    const info = getOffset(el);
    // jsdom 里 pageXOffset/pageYOffset/clientLeft/clientTop 都是 0 ⇒ 等于 rect 本身
    expect(info.left).toBe(30);
    expect(info.top).toBe(40);
  });
});

describe('Table · util（antd 层）', () => {
  it('getColumnKey：`key`（含 0 / ""）→ `dataIndex`（数组用 `.` 连接）→ defaultKey', () => {
    expect(getColumnKey({ key: 'a' } as never, 'd')).toBe('a');
    expect(getColumnKey({ key: 0 } as never, 'd')).toBe(0);
    expect(getColumnKey({ dataIndex: 'name' } as never, 'd')).toBe('name');
    expect(getColumnKey({ dataIndex: ['a', 'b'] } as never, 'd')).toBe('a.b');
    expect(getColumnKey({} as never, 'd')).toBe('d');
  });

  it('getColumnPos：`pos-index` 或 `index`', () => {
    expect(getColumnPos(3)).toBe('3');
    expect(getColumnPos(3, '0-1')).toBe('0-1-3');
  });

  it('renderColumnTitle：函数则调用', () => {
    const props = { sortOrder: 'ascend' };
    expect(renderColumnTitle((p: unknown) => `t:${JSON.stringify(p)}`, props)).toBe(
      `t:${JSON.stringify(props)}`,
    );
    expect(renderColumnTitle('plain', props)).toBe('plain');
  });

  it('🚨 safeColumnTitle：对象 / 数组 ⇒ `""`（给 `aria-label` 用，避免 `[object Object]`）', () => {
    expect(safeColumnTitle({ a: 1 }, {})).toBe('');
    expect(safeColumnTitle([1, 2], {})).toBe('');
    expect(safeColumnTitle('ok', {})).toBe('ok');
    expect(safeColumnTitle(0, {})).toBe(0);
  });

  it('normalizePlacement：6 → 3（**先判 center**）', () => {
    expect(normalizePlacement('topLeft')).toBe('start');
    expect(normalizePlacement('topCenter')).toBe('center');
    expect(normalizePlacement('topRight')).toBe('end');
    expect(normalizePlacement('bottomLeft')).toBe('start');
    expect(normalizePlacement('bottomCenter')).toBe('center');
    expect(normalizePlacement('bottomRight')).toBe('end');
    // `top` / `bottom` 不含 left/start ⇒ end
    expect(normalizePlacement('top')).toBe('end');
    expect(normalizePlacement('bottom')).toBe('end');
  });

  it('getPaginationSize：显式优先；small / medium ⇒ small；middle ⇒ undefined', () => {
    expect(getPaginationSize('large', 'small')).toBe('large');
    expect(getPaginationSize(undefined, 'small')).toBe('small');
    expect(getPaginationSize(undefined, 'medium')).toBe('small');
    expect(getPaginationSize(undefined, 'large')).toBeUndefined();
    expect(getPaginationSize(undefined, 'middle')).toBeUndefined();
  });
});
