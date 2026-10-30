import { describe, expectTypeOf, it } from 'vitest';
import { h } from 'vue';
import type { DirectoryTree, Tree } from '../index';
import type {
  TreeCheckedKeys,
  TreeEmits,
  TreeKey,
  TreeProps,
  TreeRef,
  TreeSlots,
} from '../interface';
import { useTree } from '../use-tree';
import NativeTree from './fixtures/NativeTree.vue';

interface MappedNode {
  id: string;
  name: string;
  nodes?: MappedNode[];
}
const mapped: MappedNode[] = [{ id: 'one', name: 'One' }];

describe('Tree actual constructor and SFC contracts', () => {
  it('accepts mapped objects, complete VNode content and all active channels', () => {
    const props: TreeProps<MappedNode> = {
      treeData: mapped,
      fieldNames: { key: 'id', title: 'name', children: 'nodes' },
      checkable: h('i', 'check'),
      switcherLoadingIcon: 'loading',
      activeKey: 'one',
    };
    const actual: InstanceType<typeof Tree>['$props'] = props;
    expectTypeOf(actual.activeKey).toEqualTypeOf<TreeKey | null | undefined>();
    expectTypeOf(NativeTree).not.toBeAny();
    expectTypeOf<InstanceType<typeof DirectoryTree>['$props']['checkedKeys']>().toEqualTypeOf<
      SafeKeys | TreeCheckedKeys | undefined
    >();
  });

  it('allows typed raw slot data and a documented template ref', () => {
    const slots: TreeSlots<MappedNode> = {
      title: ({ node, data }) => h('span', `${data.name}:${node.key}`),
    };
    if (slots.title) expectTypeOf(slots.title).toBeFunction();
    const path = useTree(() => mapped, {
      fieldNames: { key: 'id', title: 'name', children: 'nodes' },
    }).getPath('one');
    expectTypeOf(path[0]?.node).toEqualTypeOf<MappedNode | undefined>();
    expectTypeOf<TreeRef<MappedNode>['keyEntities'][string]['node']>().toEqualTypeOf<MappedNode>();
    expectTypeOf<TreeRef['scrollTo']>().toBeFunction();
  });

  void (() => {
    declareEmit('activeChange', 'one');
    declareEmit('update:activeKey', null);
    const actual = getTree();
    actual.$emit('update:activeKey', 'one');
    actual.$emit('mouseEnter', new MouseEvent('mouseenter'), node());
    // @ts-expect-error the actual constructor rejects non-array selection keys.
    actual.$emit('select', 42, {});
    // @ts-expect-error activeKey accepts a key or null, never arrays.
    actual.$emit('update:activeKey', []);
    // @ts-expect-error mouseEnter sends its DOM event before the node.
    actual.$emit('mouseEnter', { event: new MouseEvent('mouseenter'), node: node() });
    // @ts-expect-error unknown slots are not part of the actual Tree constructor.
    actual.$slots.unknownSlot;
    // @ts-expect-error titleRender moved to the title slot.
    const oldTitle = { titleRender: () => 'title' } satisfies TreeProps;
    // @ts-expect-error top-level icon functions use the icon slot.
    const oldIcon = { icon: () => 'icon' } satisfies TreeProps;
    // @ts-expect-error expandAction only supports click and doubleClick.
    const action = { expandAction: 'hover' } satisfies TreeProps;
    void [oldTitle, oldIcon, action];
  });
});
type SafeKeys = TreeKey[];
declare const declareEmit: TreeEmits;
declare function getTree(): InstanceType<typeof Tree>;
declare function node(): import('../interface').EventDataNode;
