/**
 * menu 引擎 · L1（parse-items 规范化 / key-records 路径表 / getOffset 键位矩阵）。
 */

import { describe, expect, it } from 'vitest';
import { OVERFLOW_KEY, useKeyRecords } from '../engine/key-records';
import { parseItems, resolveKey } from '../engine/parse-items';
import { getMenuId, getOffset, refreshElements } from '../engine/use-accessibility';

describe('parseItems · rc convertItemsToNodes 同判', () => {
  it('基础 item：label/key 解析，type 缺省 ⇒ item', () => {
    const nodes = parseItems([{ label: 'A', key: 'a' }]);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({ kind: 'item', key: 'a', label: 'A' });
  });

  it('无 key ⇒ tmp-${index}', () => {
    const nodes = parseItems([{ label: 'A' }, { label: 'B' }]);
    expect(nodes.map((n) => n.key)).toEqual(['tmp-0', 'tmp-1']);
    expect(resolveKey(null, 2)).toBe('tmp-2');
  });

  it('children 无 type ⇒ submenu；type=group ⇒ group（递归）', () => {
    const nodes = parseItems([
      { label: 'sub', key: 's', children: [{ label: 'in', key: 'i' }] },
      { type: 'group', label: 'g', key: 'g', children: [{ label: 'gi', key: 'gi' }] },
    ]);
    expect(nodes[0]?.kind).toBe('submenu');
    if (nodes[0]?.kind === 'submenu') {
      expect(nodes[0]?.children[0]).toMatchObject({ kind: 'item', key: 'i' });
    }
    expect(nodes[1]?.kind).toBe('group');
    if (nodes[1]?.kind === 'group') {
      expect(nodes[1]?.children[0]).toMatchObject({ kind: 'item', key: 'gi' });
    }
  });

  it('type=divider ⇒ divider；null 项被过滤；空 children 不构成 submenu（⇒ item）', () => {
    const nodes = parseItems([
      { type: 'divider', key: 'd' },
      null,
      { label: 'x', key: 'x', children: [] },
    ]);
    expect(nodes).toHaveLength(2);
    expect(nodes[0]?.kind).toBe('divider');
    expect(nodes[1]?.kind).toBe('item');
  });
});

describe('useKeyRecords · rc 路径表协议', () => {
  it('registerPath/getKeyPath 双向映射（PATH_SPLIT 序列化）', () => {
    const rec = useKeyRecords();
    rec.registerPath('a', ['a']);
    rec.registerPath('b', ['a', 'b']);
    rec.registerPath('c', ['a', 'b', 'c']);
    expect(rec.getKeyPath('c')).toEqual(['a', 'b', 'c']);
    expect(rec.getKeyPath('b')).toEqual(['a', 'b']);
    expect(rec.getKeys()).toEqual(['a', 'b', 'c']);
  });

  it('unregisterPath 移除双向', () => {
    const rec = useKeyRecords();
    rec.registerPath('a', ['a']);
    rec.registerPath('b', ['a', 'b']);
    rec.unregisterPath('b', ['a', 'b']);
    expect(rec.getKeys()).toEqual(['a']);
  });

  it('overflowKeys：getKeys 追加 OVERFLOW_KEY；getKeyPath(includeOverflow) 前插', () => {
    const rec = useKeyRecords();
    rec.registerPath('a', ['a']);
    rec.refreshOverflowKeys(['a']);
    expect(rec.getKeys()).toEqual(['a', OVERFLOW_KEY]);
    expect(rec.getKeyPath('a', true)).toEqual([OVERFLOW_KEY, 'a']);
    expect(rec.getKeyPath('a')).toEqual(['a']);
  });

  it('isSubPathKey：eventKey 是 pathKeys 某项祖先路径上的 key（rc 语义）', () => {
    const rec = useKeyRecords();
    rec.registerPath('sub', ['a', 'sub']);
    rec.registerPath('inner', ['a', 'sub', 'inner']);
    // inner 的路径 ['a','sub','inner'] 含 'sub' ⇒ true
    expect(rec.isSubPathKey(['inner'], 'sub')).toBe(true);
    // sub 的路径 ['a','sub'] 不含 'inner' ⇒ false（后代判定用 getSubPathKeys）
    expect(rec.isSubPathKey(['sub'], 'inner')).toBe(false);
  });

  it('getSubPathKeys：直接子路径集合', () => {
    const rec = useKeyRecords();
    rec.registerPath('a', ['a']);
    rec.registerPath('sub', ['a', 'sub']);
    rec.registerPath('inner', ['a', 'sub', 'inner']);
    const subs = rec.getSubPathKeys('sub');
    expect(subs.has('inner')).toBe(true);
    expect(subs.has('sub')).toBe(false);
  });
});

describe('getOffset · rc 键位矩阵', () => {
  it('inline：UP/DOWN 移动；ENTER 是 inlineTrigger', () => {
    expect(getOffset('inline', true, false, 38)).toEqual({ offset: -1, sibling: true });
    expect(getOffset('inline', true, false, 13)).toEqual({ inlineTrigger: true });
  });

  it('horizontal 根层：LEFT/RIGHT 同层移动，DOWN 进子菜单', () => {
    expect(getOffset('horizontal', true, false, 37)).toEqual({ offset: -1, sibling: true });
    expect(getOffset('horizontal', true, false, 39)).toEqual({ offset: 1, sibling: true });
    expect(getOffset('horizontal', true, false, 40)).toEqual({ offset: 1, sibling: false });
  });

  it('vertical 子层（isRootLevel=false）：ESC 回父级', () => {
    expect(getOffset('vertical', false, false, 27)).toEqual({ offset: -1, sibling: false });
    expect(getOffset('vertical', false, false, 38)).toEqual({ offset: -1, sibling: true });
  });

  it('RTL：horizontal 的 LEFT/RIGHT 反转', () => {
    expect(getOffset('horizontal', true, true, 37)).toEqual({ offset: 1, sibling: true });
    expect(getOffset('horizontal', true, true, 39)).toEqual({ offset: -1, sibling: true });
  });

  it('无操作键位 ⇒ null（如 inline 的 LEFT）', () => {
    expect(getOffset('inline', true, false, 37)).toBeNull();
  });
});

describe('refreshElements · data-menu-id 协议', () => {
  it('按 key 查询 {uuid}-{key} 并建立双向映射', () => {
    document.body.innerHTML = '<span data-menu-id="m-1"></span><span data-menu-id="m-2"></span>';
    const maps = refreshElements(['1', '2', 'missing'], 'm');
    expect(maps.elements.size).toBe(2);
    expect(maps.key2element.get('1')?.getAttribute('data-menu-id')).toBe('m-1');
    expect(maps.element2key.has(maps.elements.values().next().value ?? ({} as Element))).toBe(true);
    expect(maps.key2element.has('missing')).toBe(false);
    expect(getMenuId('m', '1')).toBe('m-1');
  });
});
