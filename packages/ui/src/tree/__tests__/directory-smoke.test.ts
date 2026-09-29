/**
 * DirectoryTree 冒烟测试（G4-3 —— G5 会并入正式测试层）。
 *
 * 验证：默认值（showIcon/expandAction/blockNode/-directory 类）、Folder/File 图标、
 * shift/ctrl 范围多选（calcRangeKeys）、defaultExpandAll 全 key 语义。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { DirectoryTree } from '../index';

const treeData = [
  {
    key: '0-0',
    title: 'parent',
    children: [
      { key: '0-0-0', title: 'leaf-0' },
      { key: '0-0-1', title: 'leaf-1' },
    ],
  },
  { key: '0-1', title: 'standalone' },
];

describe('DirectoryTree smoke', () => {
  it('默认值：-directory 类 + blockNode + Folder 图标', async () => {
    const w = mount(DirectoryTree, {
      props: { treeData, defaultExpandAll: true },
    });
    await nextTick();
    expect(w.find('.apollo-tree-directory').exists()).toBe(true);
    expect(w.find('.apollo-tree-block-node').exists()).toBe(true);
    // icon fn 恒走 `-icon__customize` 槽（rc 判据：currentIcon = props.icon || context.icon）
    // 展开的目录 → FolderOpenOutlined svg；叶子 → FileOutlined svg
    expect(w.find('.apollo-tree-icon__customize').exists()).toBe(true);
    const openIcons = w
      .findAll('.apollo-tree-icon__customize')
      .filter((n) => n.find('.apollo-icon-folder-open').exists());
    expect(openIcons.length).toBeGreaterThan(0);
    w.unmount();
  });

  it('单选：selected 恒 true + selectedNodes 反查', async () => {
    const w = mount(DirectoryTree, {
      props: { treeData, defaultExpandAll: true },
    });
    await nextTick();
    await w.findAll('.apollo-tree-node-content-wrapper')[1]?.trigger('click');
    const info = w.emitted('select')?.[0]?.[1] as { selected: boolean; selectedNodes?: unknown[] };
    expect(info?.selected).toBe(true);
    expect((info?.selectedNodes as { key: string }[])?.[0]?.key).toBe('0-0-0');
    w.unmount();
  });

  it('multiple + shift：范围多选（calcRangeKeys）', async () => {
    const w = mount(DirectoryTree, {
      props: { treeData, multiple: true, defaultExpandAll: true },
    });
    await nextTick();
    const wrappers = w.findAll('.apollo-tree-node-content-wrapper');
    // 先点 0-0-0（index 1），再 shift 点 0-1（index 3）→ 范围 [0-0-0, 0-0-1, 0-1]
    await wrappers[1]?.trigger('click');
    await wrappers[3]?.trigger('click', { shiftKey: true });
    const keys = w.emitted('update:selectedKeys')?.at(-1)?.[0] as string[];
    expect([...keys].sort()).toEqual(['0-0-0', '0-0-1', '0-1']);
    w.unmount();
  });

  it('defaultExpandAll：全部实体 key（含叶子）', async () => {
    const w = mount(DirectoryTree, { props: { treeData, defaultExpandAll: true } });
    await nextTick();
    expect(w.text()).toContain('leaf-0');
    // rc DirectoryTree 判据：Object.keys(keyEntities) 全量（含叶）——
    // 与 Tree 的「只展开有 children」不同
    expect(w.emitted('update:expandedKeys')).toBeUndefined();
    w.unmount();
  });
});
