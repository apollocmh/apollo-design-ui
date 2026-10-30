import { mount } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import type { TreeNodeRenderInfo } from '../../tree/interface';
import type { TreeSelectDataNode } from '../interface';
import TreeSelect from '../TreeSelect';

afterEach(() => {
  document.body.innerHTML = '';
});

it('既有标题与展开图标配置经当前 Tree slots 消费，并可替换和撤除', async () => {
  const title = vi.fn((node: TreeSelectDataNode) =>
    h('strong', { class: 'slot-title' }, node.value),
  );
  const switcher = vi.fn((node: TreeNodeRenderInfo) =>
    h('span', { class: 'slot-switcher' }, node.expanded ? 'Opened' : 'Closed'),
  );
  const wrapper = mount(TreeSelect, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
    props: {
      open: true,
      treeData: [
        { value: 'parent', title: 'Parent', children: [{ value: 'leaf', title: 'Leaf' }] },
      ],
      treeDefaultExpandAll: true,
      treeTitleRender: title,
      switcherIcon: switcher,
    },
  });
  try {
    await nextTick();
    await nextTick();
    expect(document.querySelector('.slot-title')?.textContent).toBe('parent');
    expect(document.querySelector('.slot-switcher')?.textContent).toBe('Opened');
    expect(title).toHaveBeenCalled();
    expect(switcher).toHaveBeenCalled();
    await wrapper.setProps({
      treeTitleRender: (node: TreeSelectDataNode) => h('em', { class: 'next-title' }, node.value),
      switcherIcon: h('b', { class: 'next-switcher' }, 'Icon'),
    });
    expect(document.querySelector('.slot-title')).toBeNull();
    expect(document.querySelector('.next-title')?.textContent).toBe('parent');
    expect(document.querySelector('.next-switcher')?.textContent).toBe('Icon');
    await wrapper.setProps({ treeTitleRender: undefined, switcherIcon: undefined });
    expect(document.querySelector('.next-title')).toBeNull();
    expect(document.querySelector('.next-switcher')).toBeNull();
    expect(document.querySelector('.apollo-tree-select-title')?.textContent).toBe('Parent');
  } finally {
    wrapper.unmount();
  }
});
