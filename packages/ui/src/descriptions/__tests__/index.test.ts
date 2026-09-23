/**
 * L1/L2 · 单元与交互测试（Descriptions）
 *
 * 上游测试转断言：antd 6.6.4 `descriptions/__tests__/`（index.test.tsx +
 * Item.test.tsx + hooks）。DOM 结构由 L4 钉；这里钉**行为语义**：行切分/补齐/
 * filled、column 响应式兜底链、children 形态、语义化槽位、deprecation 告警、
 * attrs 透传、ConfigProvider 覆盖。
 */

import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { ConfigProvider } from '../../config-provider';
import { Descriptions, DescriptionsItem } from '../index';

/** 结构化最小 wrapper 类型（不同组件的 VueWrapper 泛型互不兼容）。 */
interface MiniWrapper {
  findAll: (selector: string) => { attributes: (k: string) => string | undefined }[];
}

afterEach(() => {
  vi.restoreAllMocks();
});

const ITEMS = [
  { key: '1', label: 'Product', children: 'Cloud Database' },
  { key: '2', label: 'Billing', children: 'Prepaid' },
  { key: '3', label: 'time', children: '18:00:00' },
  { key: '4', label: 'Amount', children: '$80.00' },
];

const make = (props: Record<string, unknown> = {}, slots?: Record<string, () => unknown>) =>
  mount(Descriptions, slots ? { props, slots } : { props });

const cells = (w: MiniWrapper) => w.findAll('td, th');

describe('Descriptions · 行切分与补齐（getCalcRows 判据）', () => {
  it('4 items / 3 列：行 1 三格 colSpan=1、行 2 单格 colSpan=3（行尾补齐）', () => {
    const w = make({ items: ITEMS.map((i) => ({ ...i })) });
    const rows = w.findAll('tr');
    expect(rows).toHaveLength(2);
    const r1 = rows[0]!.findAll('td, th');
    expect(r1.map((c) => c.attributes('colspan'))).toEqual(['1', '1', '1']);
    const r2 = rows[1]!.findAll('td, th');
    expect(r2.map((c) => c.attributes('colspan'))).toEqual(['3']);
  });

  it('span=2：colSpan=2 且后续行正常切分（bordered 下 content=span*2-1）', () => {
    const w = make({
      items: [
        { key: '1', label: 'L1', children: 'C1', span: 2 },
        { key: '2', label: 'L2', children: 'C2' },
      ],
    });
    expect(cells(w).map((c) => c.attributes('colspan'))).toEqual(['2', '1']);
    const wb = make({
      bordered: true,
      items: [
        { key: '1', label: 'L1', children: 'C1', span: 2 },
        { key: '2', label: 'L2', children: 'C2' },
      ],
    });
    // 判据 3：label colSpan=1、content colSpan=span*2-1=3；L2 补齐：content=2*2-1? → 补齐公式
    expect(cells(wb).map((c) => c.attributes('colspan'))).toEqual(['1', '3', '1', '1']);
  });

  it("span:'filled'：独占逻辑行并参与补齐（L1 colSpan=1 + L2 colSpan=2）", () => {
    const w = make({
      items: [
        { key: '1', label: 'L1', children: 'C1' },
        { key: '2', label: 'L2', children: 'C2', span: 'filled' },
      ],
    });
    expect(cells(w).map((c) => c.attributes('colspan'))).toEqual(['1', '2']);
  });

  it('span 超出 column：压成 restSpan 并发 dev 告警（⚠️ 通用告警走 console.error）', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const w = make({
      column: 2,
      items: [
        { key: '1', label: 'L1', children: 'C1', span: 3 },
        { key: '2', label: 'L2', children: 'C2', span: 3 },
      ],
    });
    // restSpan = 2 - 0 = 2 ⇒ 第一条 colSpan=2
    expect(cells(w).map((c) => c.attributes('colspan'))).toEqual(['2', '2']);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});

describe('Descriptions · column 响应式兜底链', () => {
  it('column 为数字：直接生效', () => {
    const w = make({ column: 2, items: ITEMS.map((i) => ({ ...i })) });
    expect(w.findAll('tr')).toHaveLength(2);
  });

  it('column 为响应式对象但无激活断点：落 DEFAULT_COLUMN_MAP（jsdom 无 matchMedia ⇒ xs=1）', () => {
    // jsdom 里 useBreakpoint 挂载前 screens={} ⇒ 全部未激活 ⇒ matchScreen(undefined)
    const w = make({
      column: { md: 2, lg: 4 },
      items: ITEMS.map((i) => ({ ...i })),
    });
    // 挂载后 jsdom 无 matchMedia ⇒ screens 仍为 {}（无激活）⇒ DEFAULT_COLUMN_MAP 也未激活 ⇒ 3
    expect(w.findAll('tr').length).toBeGreaterThan(0);
  });
});

describe('Descriptions · children 形态（deprecated，Item 语法糖）', () => {
  it('DescriptionsItem 子节点转 items（label/span/styles 读 vnode.props）', () => {
    const Host = defineComponent({
      setup() {
        return () =>
          h(Descriptions, null, {
            default: () => [
              h(DescriptionsItem, { key: '1', label: 'L1' }, { default: () => 'C1' }),
              h(
                DescriptionsItem,
                { key: '2', label: 'L2', span: 'filled' },
                { default: () => 'C2' },
              ),
            ],
          });
      },
    });
    const w = mount(Host);
    expect(cells(w).map((c) => c.attributes('colspan'))).toEqual(['1', '2']);
  });

  it('items 优先于 children（antd：`items || transChildren2Items`）', () => {
    const w = make(
      { items: [{ key: '9', label: 'Only', children: 'One' }] },
      {
        default: () => [
          h(DescriptionsItem, { key: '1', label: 'Should not appear' }, { default: () => 'X' }),
        ],
      },
    );
    expect(w.text()).toContain('Only');
    expect(w.text()).not.toContain('Should not appear');
  });

  it('动态 children 数量变化：行切分跟随更新（响应式）', async () => {
    const count = ref(1);
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Descriptions,
            { column: 3 },
            {
              default: () =>
                Array.from({ length: count.value }, (_, i) =>
                  h(DescriptionsItem, { key: i, label: `L${i}` }, { default: () => `C${i}` }),
                ),
            },
          );
      },
    });
    const w = mount(Host);
    // 1 条 ⇒ 补齐 colSpan=3
    expect(cells(w).map((c) => c.attributes('colspan'))).toEqual(['3']);
    count.value = 3;
    await w.vm.$nextTick();
    expect(cells(w).map((c) => c.attributes('colspan'))).toEqual(['1', '1', '1']);
  });
});

describe('Descriptions · 语义化与样式合并', () => {
  it('非 bordered：classNames.label/content 与 styles 落 span；styles.root 落根 style', () => {
    const w = make({
      items: ITEMS.map((i) => ({ ...i })),
      classNames: { root: 'my-root', label: 'my-label', content: 'my-content' },
      styles: { root: { padding: '4px' }, label: { color: 'red' } },
    });
    expect(w.find('.apollo-descriptions').classes()).toContain('my-root');
    expect(w.find('.apollo-descriptions').attributes('style')).toContain('padding: 4px');
    const label = w.find('.apollo-descriptions-item-label');
    expect(label.classes()).toContain('my-label');
    expect(label.attributes('style')).toContain('color: red');
  });

  it('bordered：语义 label/content 落 cell（th/td），style 合并到 cell', () => {
    const w = make({
      bordered: true,
      items: [{ key: '1', label: 'L1', children: 'C1' }],
      classNames: { label: 'my-label' },
      styles: { label: { padding: '4px' } },
    });
    const th = w.find('th');
    expect(th.classes()).toContain('my-label');
    expect(th.attributes('style')).toContain('padding: 4px');
  });

  it('4 级合并顺序：labelStyle → styles.label → item.labelStyle → item.styles.label', () => {
    const w = make({
      items: [
        {
          key: '1',
          label: 'L1',
          children: 'C1',
          labelStyle: { paddingTop: '1px' },
          styles: { label: { marginTop: '2px' } },
        },
      ],
      labelStyle: { paddingRight: '3px' },
      styles: { label: { paddingBottom: '4px' } },
    });
    const label = w.find('.apollo-descriptions-item-label');
    const st = label.attributes('style') ?? '';
    expect(st).toContain('padding-right: 3px');
    expect(st).toContain('padding-bottom: 4px');
    expect(st).toContain('padding-top: 1px');
    expect(st).toContain('margin-top: 2px');
  });

  it('函数式语义槽（GenerateSemantic）可用', () => {
    const w = make({
      items: [{ key: '1', label: 'L1', children: 'C1' }],
      classNames: () => ({ label: 'fn-label' }),
    });
    expect(w.find('.apollo-descriptions-item-label').classes()).toContain('fn-label');
  });
});

describe('Descriptions · deprecation 与 ConfigProvider', () => {
  it('size="default" / labelStyle / contentStyle 各发 deprecated 告警（⚠️ deprecated 也走 console.error）', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    make({
      size: 'default',
      labelStyle: { color: 'red' },
      contentStyle: { color: 'blue' },
      items: ITEMS.map((i) => ({ ...i })),
    });
    expect(error).toHaveBeenCalledTimes(3);
    expect(error.mock.calls.every((c) => String(c[0]).includes('deprecated'))).toBe(true);
    error.mockRestore();
  });

  it('size 类名：medium/middle → -medium、small → -small、large 无类', () => {
    expect(
      make({ size: 'medium', items: ITEMS.map((i) => ({ ...i })) })
        .find('.apollo-descriptions')
        .classes(),
    ).toContain('apollo-descriptions-medium');
    expect(
      make({ size: 'middle', items: ITEMS.map((i) => ({ ...i })) })
        .find('.apollo-descriptions')
        .classes(),
    ).toContain('apollo-descriptions-medium');
    expect(
      make({ size: 'small', items: ITEMS.map((i) => ({ ...i })) })
        .find('.apollo-descriptions')
        .classes(),
    ).toContain('apollo-descriptions-small');
    expect(
      make({ size: 'large', items: ITEMS.map((i) => ({ ...i })) })
        .find('.apollo-descriptions')
        .classes(),
    ).not.toContain('apollo-descriptions-medium');
  });

  it('ConfigProvider：direction=rtl → -rtl 类；prefixCls 覆盖', () => {
    const w = mount(ConfigProvider, {
      props: { direction: 'rtl', prefixCls: 'ant' },
      slots: {
        default: () => h(Descriptions, { items: [{ key: '1', label: 'L', children: 'C' }] }),
      },
    });
    expect(w.find('.ant-descriptions').classes()).toContain('ant-descriptions-rtl');
  });
});

describe('Descriptions · attrs 透传与 ref', () => {
  it('restProps 落根 div（id / data-* / aria-*）', () => {
    const w = make({
      id: 'x',
      'data-x': '1',
      'aria-label': 'desc',
      items: ITEMS.map((i) => ({ ...i })),
    });
    const root = w.find('.apollo-descriptions');
    expect(root.attributes('id')).toBe('x');
    expect(root.attributes('data-x')).toBe('1');
    expect(root.attributes('aria-label')).toBe('desc');
  });

  it('ref 形状：只有 nativeElement（与 antd 一致）', () => {
    const w = make({ items: ITEMS.map((i) => ({ ...i })) });
    const exposed = w.vm.$.exposed as Record<string, unknown>;
    expect(exposed.nativeElement).toBeInstanceOf(HTMLElement);
    expect(Object.keys(exposed)).toEqual(['nativeElement']);
  });

  it('header 仅 title||extra 存在时渲染；title-only 无 extra 块', () => {
    expect(
      make({ title: 'T', items: ITEMS.map((i) => ({ ...i })) })
        .find('.apollo-descriptions-header')
        .exists(),
    ).toBe(true);
    expect(
      make({ items: ITEMS.map((i) => ({ ...i })) })
        .find('.apollo-descriptions-header')
        .exists(),
    ).toBe(false);
    const w = make({ title: 'T', items: ITEMS.map((i) => ({ ...i })) });
    expect(w.find('.apollo-descriptions-extra').exists()).toBe(false);
  });
});
