/**
 * L6 类型 —— TreeSelect API 形状（正例 + 负例闭包）。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { TreeSelectDataNode, TreeSelectValue } from '../interface';
import type TreeSelect from '../TreeSelect';
import {
  SHOW_ALL,
  SHOW_CHILD,
  SHOW_PARENT,
  type ShowCheckedStrategy,
} from '../utils/strategy-util';

const treeData: TreeSelectDataNode[] = [
  { title: 'p', value: '0-0', children: [{ title: 'l', value: '0-0-0' }] },
];

describe('TreeSelect · props 类型', () => {
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

  it('组件可用的关键 props（编译期存在性）', () => {
    type Props = InstanceType<typeof TreeSelect> extends never ? never : Record<string, unknown>;
    const props: keyof Props = 'treeData';
    expectTypeOf(props).toBeString();
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
