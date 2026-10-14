/**
 * Descriptions · Issue #31 回归（2 项，先复现后修）。
 */
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { Descriptions, DescriptionsItem } from '../index';

interface MiniWrapper {
  findAll: (selector: string) => { attributes: (k: string) => string | undefined }[];
}

const cells = (w: MiniWrapper) => w.findAll('td, th');

afterEach(() => {
  vi.restoreAllMocks();
});

describe('#31.1 Descriptions.Item 的默认插槽要变成条目内容', () => {
  it('[A] 文本子节点 ⇒ 内容单元格出现该文本', () => {
    const Host = defineComponent({
      setup: () => () =>
        h(Descriptions, null, {
          default: () => [
            h(DescriptionsItem, { key: '1', label: '姓名' }, { default: () => '张三' }),
          ],
        }),
    });
    const w = mount(Host);
    expect(w.text()).toContain('姓名');
    expect(w.text()).toContain('张三');
    w.unmount();
  });

  it('[B] VNode 子节点（富内容）也要保留', () => {
    const Host = defineComponent({
      setup: () => () =>
        h(Descriptions, null, {
          default: () => [
            h(
              DescriptionsItem,
              { key: '2', label: '操作' },
              { default: () => h('button', { class: 'rich-btn' }, '编辑') },
            ),
          ],
        }),
    });
    const w = mount(Host);
    expect(w.find('.rich-btn').exists()).toBe(true);
    expect(w.text()).toContain('编辑');
    w.unmount();
  });

  it('[C] 插槽内容响应式更新', async () => {
    const text = ref('before');
    const Host = defineComponent({
      setup: () => () =>
        h(Descriptions, null, {
          default: () => [
            h(DescriptionsItem, { key: '3', label: 'L' }, { default: () => text.value }),
          ],
        }),
    });
    const w = mount(Host);
    expect(w.text()).toContain('before');
    text.value = 'after';
    await nextTick();
    expect(w.text()).toContain('after');
    w.unmount();
  });

  it('[D] 守卫：`items` 数据源仍然优先于 children', () => {
    const w = mount(Descriptions, {
      props: { items: [{ key: '9', label: 'Only', children: 'One' }] } as never,
      slots: {
        default: () => [h(DescriptionsItem, { key: '1', label: 'L1' }, { default: () => 'C1' })],
      },
    });
    expect(w.text()).toContain('Only');
    expect(w.text()).not.toContain('C1');
    w.unmount();
  });
});

describe("#31.2 span='filled' 要结束当前行", () => {
  it('[A] column=3 / A(1) B(filled) C(1) ⇒ 两行，B 收尾本行', () => {
    const w = mount(Descriptions, {
      props: {
        column: 3,
        items: [
          { key: 'a', label: 'A', children: 'CA' },
          { key: 'b', label: 'B', children: 'CB', span: 'filled' },
          { key: 'c', label: 'C', children: 'CC' },
        ],
      } as never,
    });
    const rows = w.findAll('tr');
    expect(rows).toHaveLength(2);
    // 第 1 行：[A, B]；第 2 行：[C]
    expect(rows.at(0)?.text()).toContain('CA');
    expect(rows.at(0)?.text()).toContain('CB');
    expect(rows.at(0)?.text()).not.toContain('CC');
    expect(rows.at(1)?.text()).toContain('CC');
    w.unmount();
  });

  it('[B] 非 bordered：每格一个 td，B 补齐到 2、C 补齐到 3', () => {
    const w = mount(Descriptions, {
      props: {
        column: 3,
        items: [
          { key: 'a', label: 'A', children: 'CA' },
          { key: 'b', label: 'B', children: 'CB', span: 'filled' },
          { key: 'c', label: 'C', children: 'CC' },
        ],
      } as never,
    });
    // ⚠️ 非 bordered 是「一格一 td」（label/content 在容器 span 里），
    //    bordered 才是「label th + content td」两格。
    const spans = cells(w).map((c) => c.attributes('colspan'));
    expect(spans).toEqual(['1', '2', '3']);
    w.unmount();
  });

  it('[C] bordered 模式：同样两行，且 label/content 各占一格', () => {
    const w = mount(Descriptions, {
      props: {
        bordered: true,
        column: 3,
        items: [
          { key: 'a', label: 'A', children: 'CA' },
          { key: 'b', label: 'B', children: 'CB', span: 'filled' },
          { key: 'c', label: 'C', children: 'CC' },
        ],
      } as never,
    });
    expect(w.findAll('tr')).toHaveLength(2);
    // bordered：label colSpan=1、content colSpan=span*2-1
    const spans = cells(w).map((c) => c.attributes('colspan'));
    expect(spans).toEqual(['1', '1', '1', '3', '1', '5']);
    w.unmount();
  });

  it('[D] 守卫：filled 是最后一条时不会多出空行', () => {
    const w = mount(Descriptions, {
      props: {
        column: 3,
        items: [
          { key: 'a', label: 'A', children: 'CA' },
          { key: 'b', label: 'B', children: 'CB', span: 'filled' },
        ],
      } as never,
    });
    expect(w.findAll('tr')).toHaveLength(1);
    w.unmount();
  });
});
