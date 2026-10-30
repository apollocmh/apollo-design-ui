import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, reactive, ref } from 'vue';
import DirectoryTree from '../DirectoryTree';
import type { DataNode, TreeRef } from '../interface';
import Tree from '../Tree';

const cleanups: (() => void)[] = [];
function own<T extends { unmount: () => void }>(wrapper: T): T {
  cleanups.push(() => wrapper.unmount());
  return wrapper;
}
const data = (): DataNode[] => [
  {
    key: 'p',
    title: 'Parent',
    children: [
      { key: 'a', title: 'A' },
      { key: 'b', title: 'B' },
    ],
  },
  { key: 'other', title: 'Other' },
];
function row(wrapper: VueWrapper, title: string) {
  const result = wrapper
    .findAll('[role="treeitem"]')
    .find((node) => node.find('.apollo-tree-title').text() === title);
  if (!result) throw new Error(`Missing tree row: ${title}`);
  return result;
}
const selected = (wrapper: VueWrapper) =>
  wrapper
    .findAll('[role="treeitem"][aria-selected="true"]')
    .map((node) => node.find('.apollo-tree-title').text());
afterEach(() => {
  for (const stop of cleanups.splice(0).reverse()) stop();
  vi.restoreAllMocks();
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe('Tree native content and models', () => {
  it('renders full VNodeChild data, custom checkboxes and intentionally empty slots', async () => {
    const error = vi.spyOn(console, 'warn');
    const wrapper = own(
      mount(Tree, {
        props: {
          treeData: [
            { key: 0, title: 0 },
            { key: 'false', title: false },
            { key: 'array', title: ['Text', h('b', 'Bold')] },
          ],
          checkable: h('i', { 'data-check': '' }, 'check'),
        },
      }),
    );
    expect(wrapper.findAll('.apollo-tree-title').map((node) => node.text())).toEqual([
      '0',
      '',
      'TextBold',
    ]);
    expect(wrapper.findAll('[data-check]')).toHaveLength(3);
    expect(error).not.toHaveBeenCalled();
    const empty = own(mount(Tree, { props: { treeData: data() }, slots: { title: () => [] } }));
    expect(empty.findAll('.apollo-tree-title').every((node) => node.text() === '')).toBe(true);
    await nextTick();
  });

  it('reads dynamic slot presence and preserves title editor identity', async () => {
    const enabled = ref(false);
    const nodes = data();
    const keys = ref<string[]>([]);
    const wrapper = own(
      mount(
        defineComponent(
          () => () =>
            h(
              Tree,
              {
                treeData: nodes,
                selectedKeys: keys.value,
              },
              enabled.value
                ? {
                    title: ({ node }: { node: { key: string | number } }) =>
                      h('input', { 'data-node': node.key, value: 'editor' }),
                  }
                : {},
            ),
        ),
      ),
    );
    expect(wrapper.text()).toContain('Parent');
    enabled.value = true;
    await nextTick();
    const editor = wrapper.get('input').element;
    keys.value = ['p'];
    await nextTick();
    expect(wrapper.get('input').element).toBe(editor);
    enabled.value = false;
    await nextTick();
    expect(wrapper.text()).toContain('Parent');
  });

  it('reprojects accepted keys when selectable, multiple, checkable and strict change', async () => {
    const wrapper = own(
      mount(Tree, {
        props: {
          treeData: data(),
          defaultExpandAll: true,
          selectedKeys: ['a', 'b'],
          selectable: false,
          checkedKeys: ['a'],
          checkable: false,
        },
      }),
    );
    await wrapper.setProps({ selectable: true, multiple: true, checkable: true });
    expect(selected(wrapper)).toEqual(['A', 'B']);
    expect(row(wrapper, 'Parent').attributes('aria-checked')).toBe('mixed');
    await wrapper.setProps({ multiple: false, checkStrictly: true });
    expect(selected(wrapper)).toEqual(['A']);
    expect(row(wrapper, 'Parent').attributes('aria-checked')).toBe('false');
    expect(wrapper.emitted('select')).toBeUndefined();
    expect(wrapper.emitted('check')).toBeUndefined();
  });

  it('derives live ancestors and deep check capabilities without emitting changes', async () => {
    const nodes = reactive(data());
    const wrapper = own(
      mount(Tree, {
        props: {
          treeData: nodes,
          expandedKeys: ['a'],
          autoExpandParent: true,
          checkedKeys: ['a'],
          checkable: true,
        },
      }),
    );
    expect(row(wrapper, 'Parent').attributes('aria-expanded')).toBe('true');
    const sibling = nodes[0]?.children?.[1];
    if (!sibling) throw new Error('Missing sibling');
    sibling.disabled = true;
    await nextTick();
    expect(row(wrapper, 'Parent').attributes('aria-checked')).toBe('true');
    await wrapper.setProps({ autoExpandParent: false });
    expect(row(wrapper, 'Parent').attributes('aria-expanded')).toBe('false');
    expect(wrapper.emitted('expand')).toBeUndefined();
    expect(wrapper.emitted('check')).toBeUndefined();
  });

  it('keeps refused checked and active requests out of state after control is removed', async () => {
    const wrapper = own(
      mount(Tree, {
        props: {
          treeData: data(),
          defaultExpandAll: true,
          checkable: true,
          checkedKeys: [],
          activeKey: 'a',
        },
      }),
    );
    await row(wrapper, 'A').get('[role="checkbox"]').trigger('click');
    await wrapper.get('[role="tree"]').trigger('keydown', { key: 'ArrowDown' });
    expect(wrapper.emitted('update:checkedKeys')?.[0]?.[0]).toEqual(['a']);
    expect(wrapper.emitted('update:activeKey')?.[0]?.[0]).toBe('b');
    expect(row(wrapper, 'A').classes()).toContain('apollo-tree-treenode-active');
    await wrapper.setProps({ checkedKeys: undefined, activeKey: undefined });
    expect(row(wrapper, 'A').attributes('aria-checked')).toBe('false');
    expect(row(wrapper, 'A').classes()).toContain('apollo-tree-treenode-active');
  });

  it('supports mapped data without allowing its id to override ARIA ownership', () => {
    const wrapper = own(
      mount(Tree, {
        props: {
          treeData: [{ id: 'custom', label: 'Mapped' }],
          fieldNames: { key: 'id', title: 'label' },
          checkable: true,
        },
        attachTo: document.body,
      }),
    );
    const node = wrapper.get('[role="treeitem"]');
    expect(node.attributes('id')).not.toBe('custom');
    const labelledBy = wrapper.get('[role="checkbox"]').attributes('aria-labelledby');
    if (!labelledBy) throw new Error('Checkbox must label its tree item');
    expect(document.getElementById(labelledBy)).toBe(node.element);
    expect(wrapper.text()).toBe('Mapped');
  });

  it('keeps zero checkbox content and whitespace keys in the ARIA domain', () => {
    const wrapper = own(
      mount(Tree, {
        props: {
          treeData: [{ key: 'space key', title: 'Spaced' }],
          activeKey: 'space key',
          checkable: 0,
        },
        attachTo: document.body,
      }),
    );
    const item = wrapper.get('[role="treeitem"]');
    expect(wrapper.get('[role="checkbox"]').text()).toBe('0');
    expect(item.attributes('id')).not.toContain(' ');
    expect(wrapper.get('[role="checkbox"]').attributes('aria-labelledby')).toBe(
      item.attributes('id'),
    );
    expect(wrapper.get('[role="tree"]').attributes('aria-activedescendant')).toBe(
      item.attributes('id'),
    );
  });
});

describe('DirectoryTree owns defaults and forwards accepted state', () => {
  it('renders derived file/folder icons without expanding a leaf on title click', async () => {
    const wrapper = own(
      mount(DirectoryTree, { props: { treeData: data(), defaultExpandAll: true } }),
    );
    expect(row(wrapper, 'A').find('.apollo-icon-file').exists()).toBe(true);
    expect(row(wrapper, 'Parent').find('.apollo-icon-folder-open').exists()).toBe(true);
    await row(wrapper, 'A').get('.apollo-tree-node-content-wrapper').trigger('click');
    expect(wrapper.emitted('expand')).toBeUndefined();
  });
  it('honors default click, explicit false, custom icons and checked/native channels', async () => {
    const wrapper = own(
      mount(DirectoryTree, {
        props: {
          treeData: data(),
          checkable: true,
          blockNode: false,
          icon: h('i', { 'data-icon': '' }, 'icon'),
        },
      }),
    );
    await row(wrapper, 'Parent').get('.apollo-tree-node-content-wrapper').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('A');
    expect(wrapper.classes()).not.toContain('apollo-tree-block-node');
    expect(wrapper.findAll('[data-icon]').length).toBeGreaterThan(0);
    expect(wrapper.emitted('click')?.[0]?.[0]).toBeInstanceOf(MouseEvent);
    await row(wrapper, 'A').get('[role="checkbox"]').trigger('click');
    expect(wrapper.emitted('update:checkedKeys')).toHaveLength(1);
    expect(wrapper.emitted('check')).toHaveLength(1);
  });

  it('rejects expansion and selection proposals and retains numeric default keys', async () => {
    const wrapper = own(
      mount(DirectoryTree, { props: { treeData: data(), expandedKeys: [], selectedKeys: [] } }),
    );
    await row(wrapper, 'Parent').get('.apollo-tree-node-content-wrapper').trigger('click');
    expect(row(wrapper, 'Parent').attributes('aria-expanded')).toBe('false');
    expect(selected(wrapper)).toEqual([]);
    await wrapper.setProps({ expandedKeys: undefined, selectedKeys: undefined });
    expect(row(wrapper, 'Parent').attributes('aria-expanded')).toBe('false');
    expect(selected(wrapper)).toEqual([]);
    const numeric = own(
      mount(DirectoryTree, {
        props: {
          treeData: [{ key: 0, title: 'Zero', children: [{ key: 1, title: 'One' }] }],
          defaultExpandAll: true,
          defaultExpandParent: false,
        },
      }),
    );
    expect(numeric.text()).toContain('One');
  });
});

describe('Tree list and event owners', () => {
  it('does not schedule a new list timer from a child unmount hook', async () => {
    vi.useFakeTimers();
    const wrapper = own(mount(Tree, { props: { treeData: data() } }));
    await wrapper.get('.apollo-tree-switcher').trigger('click');
    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('focuses and scrolls the real holder, and opens ancestors before scrolling', async () => {
    const tree = ref<TreeRef | null>(null);
    const wrapper = own(
      mount(
        defineComponent(
          () => () =>
            h(Tree, {
              ref: tree,
              treeData: [
                ...Array.from({ length: 60 }, (_, i) => ({ key: i, title: String(i) })),
                ...data(),
              ],
              height: 80,
            }),
        ),
        { attachTo: document.body },
      ),
    );
    tree.value?.focus();
    expect(document.activeElement).toBe(wrapper.get('[role="tree"]').element);
    Object.defineProperty(wrapper.get('.apollo-tree-list-holder').element, 'clientHeight', {
      get: () => 80,
    });
    tree.value?.scrollTo(560);
    await nextTick();
    expect(wrapper.get('.apollo-tree-list-holder').element.scrollTop).toBe(560);
    tree.value?.scrollTo({ key: 'a', autoExpand: true, align: 'bottom' });
    await flushPromises();
    expect(wrapper.findAll('[role="treeitem"]').some((node) => node.text().includes('A'))).toBe(
      true,
    );
  });

  for (const action of ['select', 'check', 'expand'])
    it(`retains KeyboardEvent in ${action}`, async () => {
      const wrapper = own(
        mount(Tree, {
          props: {
            treeData: [
              {
                key: 'one',
                title: 'One',
                ...(action === 'expand' ? { children: [{ key: 'child', title: 'Child' }] } : {}),
              },
            ],
            checkable: action === 'check',
          },
        }),
      );
      await wrapper.get('[role="tree"]').trigger('focus');
      await wrapper
        .get('[role="tree"]')
        .trigger('keydown', { key: action === 'expand' ? 'Enter' : ' ' });
      const args = wrapper.emitted(action)?.[0];
      expect(args?.[1]).toMatchObject({
        nativeEvent: expect.any(KeyboardEvent),
        node: {
          dragOver: false,
          dragOverGapTop: false,
          dragOverGapBottom: false,
        },
      });
    });
});

describe('Tree async request generations', () => {
  it('does not reload after the parent refuses successful loadedKeys', async () => {
    let complete: () => void = () => {
      throw new Error('Load did not start');
    };
    const load = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          complete = resolve;
        }),
    );
    const wrapper = own(
      mount(Tree, {
        props: {
          treeData: [{ key: 'lazy', title: 'Lazy', isLeaf: false }],
          expandedKeys: ['lazy'],
          loadedKeys: [],
          loadData: load,
        },
      }),
    );
    expect(load).toHaveBeenCalledTimes(1);
    complete();
    await flushPromises();
    await wrapper.setProps({ selectedKeys: ['lazy'] });
    expect(load).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted('load')).toHaveLength(1);
    expect(wrapper.emitted('update:loadedKeys')).toEqual([[['lazy']]]);
  });

  it('reports failure once and allows a later explicit expansion to retry', async () => {
    const warning = vi.spyOn(console, 'error').mockImplementation(() => {});
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(undefined);
    const wrapper = own(
      mount(Tree, {
        props: {
          treeData: [{ key: 'lazy', title: 'Lazy', isLeaf: false }],
          defaultExpandedKeys: ['lazy'],
          loadData: load,
        },
      }),
    );
    await flushPromises();
    expect(load).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted('load')).toBeUndefined();
    expect(warning).toHaveBeenCalled();
    await wrapper.get('.apollo-tree-switcher').trigger('click');
    await flushPromises();
    await wrapper.get('.apollo-tree-switcher').trigger('click');
    await flushPromises();
    expect(load).toHaveBeenCalledTimes(2);
    expect(wrapper.emitted('load')).toHaveLength(1);
  });

  it('ignores completion for a replaced node and after unmount', async () => {
    const complete: (() => void)[] = [];
    const load = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          complete.push(resolve);
        }),
    );
    const wrapper = own(
      mount(Tree, {
        props: {
          treeData: [{ key: 'lazy', title: 'Old', isLeaf: false }],
          expandedKeys: ['lazy'],
          loadData: load,
        },
      }),
    );
    await wrapper.setProps({ treeData: [{ key: 'lazy', title: 'New', isLeaf: false }] });
    expect(load).toHaveBeenCalledTimes(2);
    complete[0]?.();
    await flushPromises();
    expect(wrapper.emitted('load')).toBeUndefined();
    complete[1]?.();
    await flushPromises();
    expect(wrapper.emitted('load')).toHaveLength(1);
    const other = own(
      mount(Tree, {
        props: {
          treeData: [{ key: 'later', isLeaf: false }],
          expandedKeys: ['later'],
          loadData: load,
        },
      }),
    );
    other.unmount();
    complete[2]?.();
    await flushPromises();
    expect(other.emitted('load')).toBeUndefined();
  });
});

describe('Tree drag ownership', () => {
  function dispatchDrag(element: Element, name: string, x = 60, y = 20) {
    const event = new MouseEvent(name, { bubbles: true, cancelable: true, clientX: x, clientY: y });
    element.dispatchEvent(event);
    return event;
  }
  it('uses permissive drop by default, sends native events first and clears its timers', async () => {
    vi.useFakeTimers();
    const wrapper = own(mount(Tree, { props: { treeData: data(), draggable: true } }));
    const items = wrapper.findAll('[role="treeitem"]');
    const source = items[0];
    const target = items[1];
    if (!source || !target) throw new Error('Missing drag nodes');
    const start = dispatchDrag(source.element, 'dragstart');
    const enter = dispatchDrag(target.element, 'dragenter');
    await nextTick();
    expect(wrapper.emitted('dragStart')?.[0]?.[0]).toBe(start);
    expect(wrapper.emitted('dragEnter')?.[0]?.[0]).toBe(enter);
    expect(wrapper.find('.apollo-tree-drop-indicator').exists()).toBe(true);
    wrapper.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('removes a formerly allowed indicator when the target refuses a later dragover', async () => {
    let allowed = true;
    const wrapper = own(
      mount(Tree, { props: { treeData: data(), draggable: true, allowDrop: () => allowed } }),
    );
    const source = row(wrapper, 'Parent');
    const target = row(wrapper, 'Other');
    dispatchDrag(source.element, 'dragstart');
    dispatchDrag(target.element, 'dragenter');
    await nextTick();
    expect(wrapper.find('.apollo-tree-drop-indicator').exists()).toBe(true);
    allowed = false;
    dispatchDrag(target.element, 'dragover');
    await nextTick();
    expect(wrapper.find('.apollo-tree-drop-indicator').exists()).toBe(false);
    dispatchDrag(target.element, 'drop');
    expect(wrapper.emitted('drop')).toBeUndefined();
  });
});
