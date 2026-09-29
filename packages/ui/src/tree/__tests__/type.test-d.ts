/**
 * L3 类型 —— Tree / DirectoryTree（G7）。
 *
 * 正例：API 形状（TreeProps 9 组 / TreeRef / 事件 info 形状 / DirectoryTreeProps）。
 * 负例：包在永不调用的闭包里（*.test-d.ts 会被 vitest 真执行）。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { CSSProperties } from 'vue';
import type {
  DataNode,
  DirectoryTreeProps,
  TreeCheckedKeys,
  TreeKey,
  TreeProps,
  TreeRef,
  TreeSelectEventInfo,
  TreeSemanticClassNames,
} from '../interface';

describe('Tree 类型 · 正例', () => {
  it('TreeProps 9 组字段', () => {
    const props: TreeProps = {
      treeData: [{ key: 'k', title: 't', children: [] }],
      fieldNames: { key: 'id', title: 'name', children: 'subs' },
      expandedKeys: ['a'],
      defaultExpandedKeys: ['a'],
      defaultExpandAll: true,
      defaultExpandParent: true,
      autoExpandParent: false,
      checkable: true,
      checkStrictly: false,
      checkedKeys: ['a'],
      defaultCheckedKeys: [],
      selectable: true,
      multiple: false,
      selectedKeys: ['a'],
      defaultSelectedKeys: [],
      loadData: () => Promise.resolve(),
      loadedKeys: ['a'],
      showIcon: false,
      showLine: true,
      blockNode: false,
      expandAction: 'click',
      disabled: false,
      draggable: true,
      allowDrop: ({ dropNode }) => !dropNode.isLeaf,
      height: 200,
      itemHeight: 28,
      virtual: true,
      focusable: true,
      activeKey: 'a',
      tabIndex: 0,
      filterTreeNode: () => false,
      classNames: { root: 'r', item: 'i', itemIcon: 'ic', itemTitle: 't', itemSwitcher: 's' },
      styles: { root: { padding: 0 } },
    };
    expectTypeOf(props).toMatchTypeOf<TreeProps>();
  });

  it('事件 info 形状（Vue 事件面走 TreeEmits，无 onSelect prop）', () => {
    const info = {
      event: 'select',
      selected: true,
      node: { key: 'a', title: 't' } as never as DataNode,
      selectedNodes: [],
      nativeEvent: new MouseEvent('click'),
    } as unknown as TreeSelectEventInfo;
    expectTypeOf(info.selected).toEqualTypeOf<boolean>();
    expectTypeOf(info.event).toEqualTypeOf<'select'>();
  });

  it('TreeRef 三个方法/字段', () => {
    const ref: TreeRef = {
      scrollTo: (s) => {
        expectTypeOf(s).toMatchTypeOf<
          { key: TreeKey; autoExpand?: boolean; offset?: number } | number | null | undefined
        >();
      },
      focus: () => {},
      keyEntities: {},
    };
    expectTypeOf(ref.scrollTo).toBeFunction();
  });

  it('DirectoryTreeProps 与 TreeProps 同构', () => {
    const d: DirectoryTreeProps = {
      expandAction: 'doubleClick',
      showLine: { showLeafIcon: false },
    };
    expectTypeOf(d).toMatchTypeOf<TreeProps>();
  });

  it('语义槽函数形态', () => {
    const fn: TreeSemanticClassNames | ((info: { props: TreeProps }) => TreeSemanticClassNames) =
      () => ({ root: 'x' });
    expectTypeOf(fn).toBeFunction();
    const styles: TreeProps['styles'] = { itemTitle: {} as CSSProperties };
    expectTypeOf(styles).toMatchTypeOf<TreeProps['styles']>();
  });

  it('checkedKeys 双形态（数组 / checkStrictly 对象）', () => {
    const arr: TreeProps['checkedKeys'] = ['a'];
    const obj: TreeCheckedKeys = { checked: ['a'], halfChecked: ['b'] };
    expectTypeOf(arr).toMatchTypeOf<SafeKeysUnion | TreeCheckedKeys | undefined>();
    expectTypeOf(obj).toMatchTypeOf<TreeCheckedKeys>();
  });
});

type SafeKeysUnion = TreeKey[];

describe('Tree 类型 · 负例（仅类型层面，永不调用）', () => {
  it('负例由 @ts-expect-error 在类型层钉住（本用例保 suite 非空）', () => {
    expectTypeOf(true).toBeBoolean();
  });

  void ((): void => {
    const props = {
      treeData: [{ key: 'a', title: 't' }],
    } satisfies TreeProps;
    void props;

    // @ts-expect-error steps 无此字段（防复制 tour 面板面）
    const bad = { steps: [] } satisfies Partial<TreeProps>;
    void bad;

    // @ts-expect-error expandAction 只接受 false | 'click' | 'doubleClick'
    const badAction = { expandAction: 'hover' } satisfies Partial<TreeProps>;
    void badAction;
  });
});
