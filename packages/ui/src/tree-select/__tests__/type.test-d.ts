/**
 * L6 类型 —— TreeSelect API 形状（正例 + 负例闭包）。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { VNodeChild } from 'vue';
import type { TreeRef } from '../../tree/interface';
import type Tree from '../../tree/Tree';
import type { TreeSelectTree } from '../../tree/Tree';
import type { TreeSelect } from '../index';
import type {
  ChangeEventExtra,
  SimpleModeConfig,
  TreeSelectDataNode,
  TreeSelectProps,
  TreeSelectRef,
  TreeSelectValue,
} from '../interface';
import {
  SHOW_ALL,
  SHOW_CHILD,
  SHOW_PARENT,
  type ShowCheckedStrategy,
} from '../utils/strategy-util';

describe('TreeSelect · props 类型', () => {
  it('the private popup identity stays outside the actual public Tree constructor', () => {
    type Public = InstanceType<typeof Tree>;
    type Private = InstanceType<typeof TreeSelectTree>;
    expectTypeOf<'listId' extends keyof Public['$props'] ? true : false>().toEqualTypeOf<false>();
    expectTypeOf<Private['$props']['listId']>().toEqualTypeOf<string>();
    expectTypeOf<Pick<Private, keyof TreeRef<object>>>().toMatchTypeOf<TreeRef<object>>();
    expectTypeOf<Pick<Public, keyof TreeRef<object>>>().toMatchTypeOf<TreeRef<object>>();
  });
  it('treeData 节点：value 可选（key 兜底）、children 递归', () => {
    const node: TreeSelectDataNode = { value: 'x' };
    expectTypeOf(node.value).toEqualTypeOf<string | number | undefined>();
    expectTypeOf(node.children).toEqualTypeOf<TreeSelectDataNode[] | undefined>();
  });

  it('strategy 常量可赋值给 ShowCheckedStrategy', () => {
    const s1: ShowCheckedStrategy = SHOW_ALL;
    const s2: ShowCheckedStrategy = SHOW_PARENT;
    const s3: ShowCheckedStrategy = SHOW_CHILD;
    expectTypeOf(s1).toBeString();
    expectTypeOf(s2).toBeString();
    expectTypeOf(s3).toBeString();
  });

  it('installed constructor infers owned events, slots and the exposed instance', () => {
    type Instance = InstanceType<typeof TreeSelect>;
    type Props = Instance['$props'];
    expectTypeOf<Parameters<NonNullable<Props['onChange']>>>().toEqualTypeOf<
      [TreeSelectValue, VNodeChild[] | null, ChangeEventExtra]
    >();
    expectTypeOf<Parameters<NonNullable<Props['onSelect']>>>().toEqualTypeOf<
      [string | number, TreeSelectDataNode | null | undefined]
    >();
    expectTypeOf<Instance['nativeElement']>().toEqualTypeOf<HTMLElement | null>();
    expectTypeOf<Pick<Instance, keyof TreeSelectRef>>().toMatchTypeOf<TreeSelectRef>();
    expectTypeOf<
      Parameters<NonNullable<Instance['$slots']['treeTitleRender']>>[0]
    >().toEqualTypeOf<{ node: TreeSelectDataNode }>();
  });

  it('public props retain business algorithms and reject removed notification/content channels', () => {
    expectTypeOf<SimpleModeConfig>().toMatchTypeOf<{
      id?: string | number;
      pId?: string | number;
    }>();
    const props: TreeSelectProps = {
      showSearch: { filterTreeNode: (input, node) => String(node.title).includes(input) },
      loadData: async (node) => node.value,
      variant: 'underlined',
      styles: ({ props: current }) => ({ input: { opacity: current.disabled ? 0.5 : 1 } }),
    };
    expectTypeOf(props).toMatchTypeOf<TreeSelectProps>();
    // @ts-expect-error Content extensions use the treeTitleRender slot.
    const removedTitle: TreeSelectProps = { treeTitleRender: () => 'title' };
    // @ts-expect-error Owned events use emits, not callback props.
    const removedEvent: TreeSelectProps = { onChange: () => undefined };
    // @ts-expect-error Search state uses v-model:searchValue.
    const removedSearch: TreeSelectProps = { showSearch: { searchValue: 'old' } };
    expectTypeOf(removedTitle).not.toBeNever();
    expectTypeOf(removedEvent).not.toBeNever();
    expectTypeOf(removedSearch).not.toBeNever();
  });
});

describe('TreeSelect · 负例', () => {
  it('treeData 不接受纯字符串数组', () => {
    type Acceptable = TreeSelectDataNode[] | undefined;
    // @ts-expect-error 字符串不是 DataNode
    const bad: Acceptable = ['a', 'b'];
    expectTypeOf(bad).not.toBeNever();
  });
});
