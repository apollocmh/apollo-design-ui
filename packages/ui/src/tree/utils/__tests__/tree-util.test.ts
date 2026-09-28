/**
 * Tree utils · L1 纯函数直测（G4 前置）。
 *
 * 判据：rc-tree 1.4.0 同名 util 的行为（docs/analysis/tree.md §7 实现顺序第 1 步）。
 * 数据与断言镜像 rc-tree `tests/conductCheck.test.js` 等的主行为。
 */

import { describe, expect, it, vi } from 'vitest';
import {
  arrAdd,
  arrDel,
  calcSelectedKeys,
  conductCheck,
  conductExpandParent,
  convertDataToEntities,
  findExpandedKeys,
  flattenTreeData,
  getExpandRange,
  getPosition,
  getTreeNodeProps,
  isCheckDisabled,
  isLeafNode,
  parseCheckedKeys,
  posToArr,
} from '../index';

const treeData = [
  {
    key: '0-0',
    title: '0-0',
    children: [
      { key: '0-0-0', title: '0-0-0' },
      { key: '0-0-1', title: '0-0-1' },
    ],
  },
  { key: '0-1', title: '0-1' },
];

describe('Tree utils · getPosition / posToArr', () => {
  it('pos 格式为 level-index 链', () => {
    expect(getPosition('0', 1)).toBe('0-1');
    expect(getPosition('0-1', 2)).toBe('0-1-2');
    expect(posToArr('0-1-2')).toEqual(['0', '1', '2']);
  });
});

describe('Tree utils · flattenTreeData', () => {
  it('平铺顺序 + pos + isStart/isEnd', () => {
    const flat = flattenTreeData(treeData, ['0-0']);
    expect(flat.map((n) => n.key)).toEqual(['0-0', '0-0-0', '0-0-1', '0-1']);
    const [n00, n000, n001, n01] = flat;
    expect(n00?.pos).toBe('0-0');
    expect(n00?.isStart).toEqual([true]);
    expect(n00?.isEnd).toEqual([false]);
    expect(n000?.isStart).toEqual([true, true]);
    // isEnd = [...parent.isEnd, index === list.length - 1] —— '0-0-0' 非末位 ⇒ false
    expect(n000?.isEnd).toEqual([false, false]);
    expect(n001?.isEnd).toEqual([false, true]);
    expect(n01?.isStart).toEqual([false]);
    expect(n01?.isEnd).toEqual([true]);
  });

  it('未展开的子树不进平铺列表（children 为空数组）', () => {
    const flat = flattenTreeData(treeData, []);
    expect(flat.map((n) => n.key)).toEqual(['0-0', '0-1']);
    expect(flat[0]?.children).toEqual([]);
  });

  it('expandedKeys=true 表示全展开（rc-tree-select 内部用法）', () => {
    const flat = flattenTreeData(treeData, true);
    expect(flat.map((n) => n.key)).toHaveLength(4);
  });

  it('fieldNames 改写字段', () => {
    const flat = flattenTreeData(
      [{ id: 'a', name: 'A', subs: [{ id: 'a1', name: 'A1' }] }] as never,
      ['a'],
      { key: 'id', title: 'name', children: 'subs' },
    );
    expect(flat.map((n) => n.key)).toEqual(['a', 'a1']);
    expect(flat[0]?.title).toBe('A');
  });

  it('key 缺失时回退 pos 作 key（rc getKey 判据）', () => {
    const flat = flattenTreeData([{ title: 'no-key' }] as never, []);
    expect(flat[0]?.key).toBe('0-0');
  });
});

describe('Tree utils · convertDataToEntities', () => {
  it('keyEntities / posEntities / 父子链 / level', () => {
    const { keyEntities, posEntities } = convertDataToEntities(treeData);
    expect(Object.keys(keyEntities)).toEqual(['0-0', '0-0-0', '0-0-1', '0-1']);
    expect(posEntities['0-0-1']?.pos).toBe('0-0-1');
    expect(keyEntities['0-0-0']?.parent?.key).toBe('0-0');
    expect(keyEntities['0-0']?.children?.map((e) => e.key)).toEqual(['0-0-0', '0-0-1']);
    expect(keyEntities['0-0']?.level).toBe(0);
    expect(keyEntities['0-0-0']?.level).toBe(1);
    expect(keyEntities['0-0']?.index).toBe(0);
    expect(keyEntities['0-1']?.index).toBe(1);
  });

  it('fieldNames 改写', () => {
    const { keyEntities } = convertDataToEntities([{ id: 'a', subs: [{ id: 'a1' }] }] as never, {
      fieldNames: { key: 'id', children: 'subs' },
    });
    expect(Object.keys(keyEntities)).toEqual(['a', 'a1']);
  });
});

describe('Tree utils · isLeafNode', () => {
  it('isLeaf=false 恒否决；loadData 参与判定', () => {
    expect(isLeafNode(false, undefined, false, false)).toBe(false);
    expect(isLeafNode(true, undefined, false, false)).toBe(true);
    // 无 loadData 且无 children ⇒ 叶子
    expect(isLeafNode(undefined, undefined, false, false)).toBe(true);
    // 有 children ⇒ 非叶子
    expect(isLeafNode(undefined, undefined, true, false)).toBe(false);
    // loadData 存在：未 loaded ⇒ 非叶子（可展开加载）；loaded 且无 children ⇒ 叶子
    expect(isLeafNode(undefined, () => {}, false, false)).toBe(false);
    expect(isLeafNode(undefined, () => {}, false, true)).toBe(true);
    expect(isLeafNode(undefined, () => {}, true, true)).toBe(false);
  });
});

describe('Tree utils · getTreeNodeProps', () => {
  it('全局状态投影到节点', () => {
    const { keyEntities } = convertDataToEntities(treeData);
    const props = getTreeNodeProps('0-0', {
      expandedKeys: ['0-0'],
      selectedKeys: ['0-1'],
      loadedKeys: [],
      loadingKeys: ['0-0'],
      checkedKeys: ['0-0-0'],
      halfCheckedKeys: ['0-0'],
      dragOverNodeKey: '0-1',
      dropPosition: 0,
      keyEntities,
    });
    expect(props).toMatchObject({
      eventKey: '0-0',
      expanded: true,
      selected: false,
      loading: true,
      checked: false,
      halfChecked: true,
      pos: '0-0',
      dragOver: false,
      dragOverGapTop: false,
      dragOverGapBottom: false,
    });
    // 拖拽三态由 dropPosition 区分
    const over = getTreeNodeProps('0-1', {
      expandedKeys: [],
      selectedKeys: [],
      loadedKeys: [],
      loadingKeys: [],
      checkedKeys: [],
      halfCheckedKeys: [],
      dragOverNodeKey: '0-1',
      dropPosition: -1,
      keyEntities,
    });
    expect(over.dragOverGapTop).toBe(true);
    expect(over.dragOver).toBe(false);
  });
});

describe('Tree utils · conductCheck（级联）', () => {
  const { keyEntities } = convertDataToEntities(treeData);

  it('勾父 ⇒ 子全选（fill）', () => {
    const { checkedKeys, halfCheckedKeys } = conductCheck(['0-0'], true, keyEntities);
    expect(checkedKeys.sort()).toEqual(['0-0', '0-0-0', '0-0-1']);
    expect(halfCheckedKeys).toEqual([]);
  });

  it('勾子 ⇒ 父半选（fill 两段式自下而上）', () => {
    const { checkedKeys, halfCheckedKeys } = conductCheck(['0-0-0'], true, keyEntities);
    expect(checkedKeys).toEqual(['0-0-0']);
    expect(halfCheckedKeys).toEqual(['0-0']);
  });

  it('勾满所有子 ⇒ 父全选', () => {
    const { checkedKeys, halfCheckedKeys } = conductCheck(['0-0-0', '0-0-1'], true, keyEntities);
    expect(checkedKeys.sort()).toEqual(['0-0', '0-0-0', '0-0-1']);
    expect(halfCheckedKeys).toEqual([]);
  });

  it('remove（clean）：从勾满态去掉一个子 ⇒ 父半选、子去勾', () => {
    // 先 fill 全勾，再做 clean 移除 0-0-0
    const full = conductCheck(['0-0'], true, keyEntities);
    const { checkedKeys, halfCheckedKeys } = conductCheck(
      full.checkedKeys.filter((k) => k !== '0-0-0'),
      { checked: false, halfCheckedKeys: full.halfCheckedKeys },
      keyEntities,
    );
    expect(checkedKeys).toEqual(['0-0-1']);
    expect(halfCheckedKeys).toEqual(['0-0']);
  });

  it('remove：父级 key 被移除 ⇒ 整个子树去勾', () => {
    const full = conductCheck(['0-0'], true, keyEntities);
    const { checkedKeys, halfCheckedKeys } = conductCheck(
      [],
      { checked: false, halfCheckedKeys: full.halfCheckedKeys },
      keyEntities,
    );
    expect(checkedKeys).toEqual([]);
    expect(halfCheckedKeys).toEqual([]);
  });

  it('disabled 节点不参与级联', () => {
    const data = [
      {
        key: 'p',
        title: 'p',
        children: [
          { key: 'c1', title: 'c1', disabled: true },
          { key: 'c2', title: 'c2' },
        ],
      },
    ];
    const entities = convertDataToEntities(data).keyEntities;
    // disabled 子不随父级联
    const fill = conductCheck(['p'], true, entities);
    expect(fill.checkedKeys.sort()).toEqual(['c2', 'p']);
    // disabled 子可被编程勾选（UI 禁点），但级联按「非 disabled 子」判定：
    // c1 disabled 不参与，c2 勾 ⇒ 父 p 因非 disabled 子全勾而勾上
    const fill2 = conductCheck(['c1', 'c2'], true, entities);
    expect(fill2.checkedKeys.sort()).toEqual(['c1', 'c2', 'p']);
    expect(fill2.halfCheckedKeys).toEqual([]);
  });

  it('checkable===false 的节点不参与级联', () => {
    const data = [
      {
        key: 'p',
        title: 'p',
        children: [
          { key: 'c1', title: 'c1', checkable: false },
          { key: 'c2', title: 'c2' },
        ],
      },
    ];
    const entities = convertDataToEntities(data).keyEntities;
    expect(isCheckDisabled({ checkable: false })).toBe(true);
    const fill = conductCheck(['p'], true, entities);
    // 唯一非 disabled 子 c2 随父级联 ⇒ 父 p 也勾（rc 自下而上判定）
    expect(fill.checkedKeys.sort()).toEqual(['c2', 'p']);
  });

  it('不存在的 key 跳过', () => {
    const fill = conductCheck(['0-0', 'not-exist'], true, keyEntities);
    expect(fill.checkedKeys.sort()).toEqual(['0-0', '0-0-0', '0-0-1']);
  });
});

describe('Tree utils · conductExpandParent', () => {
  it('补全祖先', () => {
    const deep = [{ key: '1', children: [{ key: '1-1', children: [{ key: '1-1-1' }] }] }];
    const entities = convertDataToEntities(deep).keyEntities;
    expect(conductExpandParent(['1-1-1'], entities)).toEqual(['1-1-1', '1-1', '1']);
  });

  it('disabled 节点自身入集但不继续向上传导', () => {
    const deep = [{ key: '1', disabled: true, children: [{ key: '1-1' }] }];
    const entities = convertDataToEntities(deep).keyEntities;
    // rc conductUp：先 add 再判 disabled ⇒ '1' 入集、祖先不再传导
    expect(conductExpandParent(['1-1'], entities)).toEqual(['1-1', '1']);
    // 直接给 disabled key：不入祖先
    expect(conductExpandParent(['1'], entities)).toEqual(['1']);
  });
});

describe('Tree utils · arrAdd / arrDel / calcSelectedKeys / parseCheckedKeys', () => {
  it('arrAdd 去重 / arrDel 容错', () => {
    expect(arrAdd(['a'], 'b')).toEqual(['a', 'b']);
    expect(arrAdd(['a', 'b'], 'b')).toEqual(['a', 'b']);
    expect(arrDel(['a', 'b'], 'a')).toEqual(['b']);
    expect(arrDel(undefined as never, 'a')).toEqual([]);
  });

  it('calcSelectedKeys：单选只留第一个', () => {
    expect(calcSelectedKeys(['a', 'b'], { multiple: true })).toEqual(['a', 'b']);
    expect(calcSelectedKeys(['a', 'b'], {})).toEqual(['a']);
    expect(calcSelectedKeys([], {})).toEqual([]);
    expect(calcSelectedKeys(undefined, {})).toBeUndefined();
  });

  it('parseCheckedKeys：数组 / 对象 / 非法', () => {
    expect(parseCheckedKeys(['a'])).toEqual({ checkedKeys: ['a'], halfCheckedKeys: undefined });
    expect(parseCheckedKeys({ checked: ['a'], halfChecked: ['b'] })).toEqual({
      checkedKeys: ['a'],
      halfCheckedKeys: ['b'],
    });
    expect(parseCheckedKeys(undefined)).toBeNull();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(parseCheckedKeys('bad' as never)).toBeNull();
    spy.mockRestore();
  });
});

describe('Tree utils · findExpandedKeys / getExpandRange（motion diff）', () => {
  it('长度差 ≠1 ⇒ 无单键 diff（=1 时即使一方为空也算单键变化）', () => {
    expect(findExpandedKeys(['a', 'b'], ['a'])).toEqual({ add: false, key: 'b' });
    expect(findExpandedKeys(['a'], ['a', 'b', 'c'])).toEqual({ add: false, key: null });
    // rc 判据是 Math.abs(len diff) !== 1 —— 1 → 0 也是合法的「收起唯一键」
    expect(findExpandedKeys(['a'], [])).toEqual({ add: false, key: 'a' });
  });

  it('展开 / 收起识别', () => {
    expect(findExpandedKeys(['a'], ['a', 'b'])).toEqual({ add: true, key: 'b' });
    expect(findExpandedKeys(['a', 'b'], ['a'])).toEqual({ add: false, key: 'b' });
  });

  it('getExpandRange 取可见子树范围', () => {
    const shorter = [{ key: 'a' }, { key: 'last' }];
    const longer = [{ key: 'a' }, { key: 'x1' }, { key: 'x2' }, { key: 'last' }];
    expect(getExpandRange(shorter, longer, 'a').map((n) => n.key)).toEqual(['x1', 'x2']);
    // 被展开的是最后一个 ⇒ 取到末尾
    expect(getExpandRange([{ key: 'a' }], [{ key: 'a' }, { key: 'b' }], 'a')).toEqual([
      { key: 'b' },
    ]);
  });
});
