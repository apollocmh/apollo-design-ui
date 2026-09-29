/**
 * TreeSelect · L1 纯函数层（utils）—— valueUtil / strategyUtil 独立直测。
 */

import { describe, expect, it } from 'vitest';
import type { TreeEntity } from '../../tree/utils/treeUtil';
import type { TreeSelectDataNode } from '../interface';
import { formatStrategyValues, SHOW_ALL, SHOW_CHILD, SHOW_PARENT } from '../utils/strategy-util';
import { fillFieldNames, getAllKeys, isCheckDisabled, isNil, toArray } from '../utils/value-util';

const FN = fillFieldNames();

// 与 analysis §7 对照的最小实体表：p(0-0) → [l1(0-0-0), l2(0-0-1)], p2(0-1)
const makeEntity = (
  key: string,
  children: string[] = [],
  disabled = false,
): TreeEntity<TreeSelectDataNode> =>
  ({
    node: { value: key, disabled },
    key,
    children: children.map((c) => makeEntity(c)),
    // formatStrategyValues 只读 node/key/parent/children —— 其余字段给占位值
    nodes: [],
    index: 0,
    pos: '',
    level: 0,
  }) as TreeEntity<TreeSelectDataNode>;

// ⚠️ 实体表的 parent/children 必须互相链接（rc formatStrategyValues 走 entity.parent）
const parentEntity = makeEntity('0-0');
const leaf0 = { ...makeEntity('0-0-0'), parent: parentEntity };
const leaf1 = { ...makeEntity('0-0-1'), parent: parentEntity };
parentEntity.children = [leaf0, leaf1];
const KEY_ENTITIES = {
  '0-0': parentEntity,
  '0-0-0': leaf0,
  '0-0-1': leaf1,
  '0-1': makeEntity('0-1'),
};

describe('value-util', () => {
  it('fillFieldNames：key === value（TreeSelect 专属判据）', () => {
    expect(fillFieldNames()).toEqual({
      _title: ['title', 'label'],
      value: 'value',
      key: 'value',
      children: 'children',
    });
    expect(fillFieldNames({ value: 'id', label: 'name', children: 'subs' })).toEqual({
      _title: ['name'],
      value: 'id',
      key: 'id',
      children: 'subs',
    });
  });

  it('toArray：单值包数组 / null ⇒ []', () => {
    expect(toArray('a')).toEqual(['a']);
    expect(toArray(['a', 'b'])).toEqual(['a', 'b']);
    expect(toArray(undefined)).toEqual([]);
    expect(toArray(null)).toEqual([]);
  });

  it('isCheckDisabled：disabled / disableCheckbox / checkable === false', () => {
    expect(isCheckDisabled(null)).toBe(false);
    expect(isCheckDisabled({})).toBe(false);
    expect(isCheckDisabled({ disabled: true })).toBe(true);
    expect(isCheckDisabled({ disableCheckbox: true })).toBe(true);
    expect(isCheckDisabled({ checkable: false })).toBe(true);
    expect(isCheckDisabled({ checkable: true })).toBe(false);
  });

  it('getAllKeys：只收集父节点（有 children 的）', () => {
    const data = [
      {
        value: '0-0',
        children: [{ value: '0-0-0' }, { value: '0-0-1', children: [{ value: 'x' }] }],
      },
      { value: '0-1' },
    ];
    expect(getAllKeys(data as never, FN)).toEqual(['0-0', '0-0-1']);
  });

  it('isNil', () => {
    expect(isNil(null)).toBe(true);
    expect(isNil(undefined)).toBe(true);
    expect(isNil('')).toBe(false);
    expect(isNil(0)).toBe(false);
  });
});

describe('strategy-util', () => {
  it('常量值与 antd 一致', () => {
    expect(SHOW_ALL).toBe('SHOW_ALL');
    expect(SHOW_PARENT).toBe('SHOW_PARENT');
    expect(SHOW_CHILD).toBe('SHOW_CHILD');
  });

  it('SHOW_ALL：原样返回', () => {
    expect(formatStrategyValues(['0-0-0', '0-0-1'], SHOW_ALL, KEY_ENTITIES, FN)).toEqual([
      '0-0-0',
      '0-0-1',
    ]);
  });

  it('SHOW_CHILD：全勾（级联补全含父）⇒ 父被滤只显示子', () => {
    // rc 逐字：父有子且子全勾 ⇒ 保留条件全 false ⇒ 过滤父；leaf 无子 ⇒ 保留
    const values = ['0-0', '0-0-0', '0-0-1'];
    expect(formatStrategyValues(values, SHOW_CHILD, KEY_ENTITIES, FN)).toEqual(['0-0-0', '0-0-1']);
  });

  it('SHOW_CHILD：未级联的子集 ⇒ 原样保留', () => {
    expect(formatStrategyValues(['0-0-0'], SHOW_CHILD, KEY_ENTITIES, FN)).toEqual(['0-0-0']);
  });

  it('SHOW_CHILD：只勾部分子 ⇒ 全部保留', () => {
    const values = ['0-0-0'];
    expect(formatStrategyValues(values, SHOW_CHILD, KEY_ENTITIES, FN)).toEqual(['0-0-0']);
  });

  it('SHOW_PARENT：全勾（含父）⇒ 子被滤只留父', () => {
    // rc 逐字：leaf 的父 0-0 已勾 ⇒ 保留条件含 !valueSet.has(parent.key) 为 false ⇒ 过滤
    const full = formatStrategyValues(['0-0', '0-0-0', '0-0-1'], SHOW_PARENT, KEY_ENTITIES, FN);
    expect(full).toEqual(['0-0']);
    // 子勾但父未勾 ⇒ 保留子
    const partial = formatStrategyValues(['0-0-0'], SHOW_PARENT, KEY_ENTITIES, FN);
    expect(partial).toEqual(['0-0-0']);
  });

  it('SHOW_PARENT：disabled 节点或 disabled 父 ⇒ 保留', () => {
    const entities: Record<string, TreeEntity<TreeSelectDataNode>> = {
      p: { ...makeEntity('p', ['c']), children: [makeEntity('c')] },
      c: makeEntity('c'),
    };
    entities.p?.children?.forEach((c) => {
      c.node.disabled = true;
    });
    expect(formatStrategyValues(['c'], SHOW_PARENT, entities, FN)).toEqual(['c']);
  });
});
