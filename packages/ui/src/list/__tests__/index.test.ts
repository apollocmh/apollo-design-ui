/**
 * L1/L2 · `List` 的单元与交互测试。
 *
 * 每一条都对应 `docs/analysis/list.md` §2 的一条判据（编号即判据号）。
 * ⚠️ 本组件的**告警**是「每次渲染都发」的 `console.error`（上游 deprecated，D91 先例）
 *    ⇒ 每个用例都要 `vi.spyOn(console, 'error')` 兜住，否则测试输出会被刷屏。
 */

import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import { List, ListItem, ListItemMeta } from '../index';

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  errorSpy.mockRestore();
});

/** 用 `dataSource` + `renderItem` 造一个最简列表。 */
const mountList = (
  props: Record<string, unknown> = {},
  slots: Record<string, () => unknown> = {},
) => mount(List, { props, slots });

describe('List · L1 结构与类名（判据 1 / 2 / 7 / 10）', () => {
  it('默认渲染 `apollo-list` + `-split` + `-css-var`，不渲染分页/页头/页脚', () => {
    const w = mountList();
    const classes = w.classes();
    expect(classes).toContain('apollo-list');
    expect(classes).toContain('apollo-list-split');
    expect(classes).toContain('apollo-list-css-var');
    expect(classes).not.toContain('apollo-list-bordered');
    expect(classes).not.toContain('apollo-list-something-after-last-item');
    expect(w.find('.apollo-list-pagination').exists()).toBe(false);
    expect(w.find('.apollo-list-header').exists()).toBe(false);
    expect(w.find('.apollo-list-footer').exists()).toBe(false);
  });

  it('判据 1：`-something-after-last-item` 的判据是 loadMore / pagination / footer 三者**任一**', () => {
    expect(mountList({ footer: 'F' }).classes()).toContain('apollo-list-something-after-last-item');
    expect(mountList({ pagination: { pageSize: 2 } }).classes()).toContain(
      'apollo-list-something-after-last-item',
    );
    expect(mountList({ loadMore: 'L' }).classes()).toContain(
      'apollo-list-something-after-last-item',
    );
    expect(mountList().classes()).not.toContain('apollo-list-something-after-last-item');
  });

  it('判据 7：`size` 只有 large/small 落类，`default` / `medium` **不落类**', () => {
    expect(mountList({ size: 'large' }).classes()).toContain('apollo-list-lg');
    expect(mountList({ size: 'small' }).classes()).toContain('apollo-list-sm');
    const d = mountList({ size: 'default' }).classes();
    expect(d).not.toContain('apollo-list-lg');
    expect(d).not.toContain('apollo-list-sm');
  });

  it('判据 7：`bordered` / `itemLayout="vertical"` / `split=false` 各自落类', () => {
    expect(mountList({ bordered: true }).classes()).toContain('apollo-list-bordered');
    expect(mountList({ itemLayout: 'vertical' }).classes()).toContain('apollo-list-vertical');
    expect(mountList({ split: false }).classes()).not.toContain('apollo-list-split');
  });

  it('判据 2：`loading: true` ⇒ `-loading` 类 + Spin 的嵌套容器 + 53px 占位块', () => {
    const w = mountList({ loading: true });
    expect(w.classes()).toContain('apollo-list-loading');
    // ⚠️ 产物第 42 条的选择器是 `.ant-list-spin-nested-loading` —— **死选择器**
    //    （真类名是 `.ant-spin-nested-loading`）⇒ 这里断言真实存在的 Spin 容器
    expect(w.find('.apollo-spin-container').exists()).toBe(true);
    const placeholder = w.find('.apollo-spin-container > div');
    expect(placeholder.attributes('style')).toContain('min-height: 53px');
  });

  it('判据 2：`loading` 为对象时读 `spinning`', () => {
    expect(mountList({ loading: { spinning: true } }).classes()).toContain('apollo-list-loading');
    expect(mountList({ loading: { spinning: false } }).classes()).not.toContain(
      'apollo-list-loading',
    );
  });

  it('判据 10：`rootClassName` 与 `className` 都落在根上', () => {
    const w = mountList({ className: 'my-cls', rootClassName: 'my-root' });
    expect(w.classes()).toContain('my-cls');
    expect(w.classes()).toContain('my-root');
  });
});

describe('List · L1 dataSource / renderItem（判据 1 的 key 解析链）', () => {
  it('渲染成 `ul.-items.-container.-css-var`，逐项调用 renderItem', () => {
    const renderItem = vi.fn((item: string) => h(ListItem, null, () => item));
    const w = mountList({ dataSource: ['A', 'B'], renderItem });
    expect(renderItem).toHaveBeenCalledTimes(2);
    expect(renderItem).toHaveBeenNthCalledWith(1, 'A', 0);
    expect(renderItem).toHaveBeenNthCalledWith(2, 'B', 1);
    const ul = w.find('ul');
    expect(ul.classes()).toContain('apollo-list-items');
    expect(ul.classes()).toContain('apollo-list-container');
    expect(ul.findAll('li')).toHaveLength(2);
  });

  it('⚠️ `renderItem` 未传时**不渲染任何项**（但 `<ul>` 仍在 —— 上游同判）', () => {
    const w = mountList({ dataSource: ['A', 'B'] });
    // 上游是 `splitDataSource.length > 0` ⇒ 渲染 <ul>，但 items 全是 null
    expect(w.find('ul').exists()).toBe(true);
    expect(w.findAll('.apollo-list-items > li')).toHaveLength(0);
  });

  it('判据 3：`dataSource` 为空且无默认插槽 ⇒ 渲染 `-empty-text`', () => {
    const w = mountList({ dataSource: [] });
    expect(w.find('.apollo-list-empty-text').exists()).toBe(true);
  });

  it('判据 3：`locale.emptyText` 优先于默认空态', () => {
    const w = mountList({ dataSource: [], locale: { emptyText: '没有数据' } });
    expect(w.find('.apollo-list-empty-text').text()).toContain('没有数据');
  });

  it('判据 3：有默认插槽时不渲染空态', () => {
    const w = mountList({ dataSource: [] }, { default: () => h('span', 'custom') });
    expect(w.find('.apollo-list-empty-text').exists()).toBe(false);
    expect(w.text()).toContain('custom');
  });

  it('判据 3：`loading` 时即使 dataSource 为空也不渲染空态', () => {
    const w = mountList({ dataSource: [], loading: true });
    expect(w.find('.apollo-list-empty-text').exists()).toBe(false);
  });
});

describe('List · L1 分页（判据 4 / 5 / 6）', () => {
  const data = ['A', 'B', 'C', 'D', 'E'];

  it('判据 4：`pagination: false`（默认）不渲染分页', () => {
    expect(mountList({ dataSource: data }).find('.apollo-list-pagination').exists()).toBe(false);
  });

  it('判据 5：切片按 current / pageSize，且 `position` 默认 bottom', () => {
    const w = mountList({
      dataSource: data,
      renderItem: (item: string) => h(ListItem, null, () => item),
      pagination: { pageSize: 2 },
    });
    // ⚠️ Pagination 自己也渲染 <li> ⇒ 必须限定到列表项
    expect(w.findAll('.apollo-list-items > li')).toHaveLength(2);
    expect(w.text()).toContain('A');
    expect(w.text()).not.toContain('C');
    expect(w.find('.apollo-list-pagination').exists()).toBe(true);
  });

  it('判据 6：`position: "both"` 时**两处**都渲染分页', () => {
    const w = mountList({
      dataSource: data,
      renderItem: (item: string) => h(ListItem, null, () => item),
      pagination: { pageSize: 2, position: 'both' },
    });
    expect(w.findAll('.apollo-list-pagination')).toHaveLength(2);
  });

  it('判据 6：`position: "top"` 时只在顶部', () => {
    const w = mountList({
      dataSource: data,
      renderItem: (item: string) => h(ListItem, null, () => item),
      pagination: { pageSize: 2, position: 'top' },
    });
    expect(w.findAll('.apollo-list-pagination')).toHaveLength(1);
  });

  it('判据 5：`current` 超过最大页时被夹到最大页（不切片成空）', () => {
    const w = mountList({
      dataSource: data,
      renderItem: (item: string) => h(ListItem, null, () => item),
      pagination: { pageSize: 2, current: 99 },
    });
    // 5 条 / 每页 2 ⇒ 最大 3 页 ⇒ 第 3 页是第 5 条
    expect(w.findAll('.apollo-list-items > li')).toHaveLength(1);
    expect(w.text()).toContain('E');
  });
});

describe('List · L1 grid（判据 8 / 9）', () => {
  it('判据 9：grid 模式是 `Row > div[style] > Col > div.-item`，根加 `-grid`', () => {
    const w = mountList({
      dataSource: ['A'],
      grid: { column: 3, gutter: 16 },
      renderItem: (item: string) => h(ListItem, null, () => item),
    });
    expect(w.classes()).toContain('apollo-list-grid');
    const row = w.find('.apollo-row');
    expect(row.exists()).toBe(true);
    expect(row.classes()).toContain('apollo-list-container');
    const col = row.find('.apollo-col');
    expect(col.exists()).toBe(true);
    // ⚠️ grid 模式下 Item 的根是 `div`（不是 `li`）
    expect(col.find('div.apollo-list-item').exists()).toBe(true);
    expect(col.find('li.apollo-list-item').exists()).toBe(false);
  });

  it('判据 8：`column` 转成内联百分比（**字符串**，不是裸数字）', () => {
    const w = mountList({
      dataSource: ['A'],
      grid: { column: 4 },
      renderItem: (item: string) => h(ListItem, null, () => item),
    });
    const div = w.find('.apollo-row > div');
    const style = div.attributes('style') ?? '';
    expect(style).toContain('width: 25%');
    expect(style).toContain('max-width: 25%');
  });
});

describe('List · L1 页头 / 页脚 / loadMore', () => {
  it('header / footer 各自成 `-header` / `-footer` 容器', () => {
    const w = mountList({ header: 'H', footer: 'F' });
    expect(w.find('.apollo-list-header').text()).toBe('H');
    expect(w.find('.apollo-list-footer').text()).toBe('F');
  });

  it('`loadMore` 优先于底部分页（二者互斥）', () => {
    const w = mountList({
      dataSource: ['A'],
      renderItem: (item: string) => h(ListItem, null, () => item),
      loadMore: 'MORE',
      pagination: { pageSize: 1 },
    });
    expect(w.text()).toContain('MORE');
    expect(w.find('.apollo-list-pagination').exists()).toBe(false);
  });
});

describe('List · L2 复合组件与 Item 判据', () => {
  it('`List.Item` / `List.Item.Meta` 静态属性与具名导出指向同一对象', () => {
    expect(List.Item).toBe(ListItem);
    expect(List.Item.Meta).toBe(ListItemMeta);
  });

  it('判据 1（Item）：非 vertical 时，**字符串子节点且 >1 个**才落 `-item-no-flex`', () => {
    const multi = mount(ListItem, { slots: { default: () => ['a', 'b'] } });
    expect(multi.classes()).toContain('apollo-list-item-no-flex');

    // 单个字符串子节点 ⇒ 不落
    const single = mount(ListItem, { slots: { default: () => 'a' } });
    expect(single.classes()).not.toContain('apollo-list-item-no-flex');

    // 两个**非字符串**子节点 ⇒ 不落
    const two = mount(ListItem, {
      slots: { default: () => [h('span', 'a'), h('span', 'b')] },
    });
    expect(two.classes()).not.toContain('apollo-list-item-no-flex');

    // 🚨 **平台差异**：两个**数字**子节点。上游 `isString(0)` 判**假** ⇒ 不落；
    //    本仓判的是 Text vnode（模板里的 `{{ 0 }}` 也被 `toDisplayString` 变成 '0'）
    //    ⇒ 判**真**、落类。登记在 README §2（PLATFORM）。
    const nums = mount(ListItem, { slots: { default: () => [0, 1] } });
    expect(nums.classes()).toContain('apollo-list-item-no-flex');
  });

  it('判据 4（Item）：`actions` 逐项成 `<li>`，项间有 `-item-action-split`（最后一项没有）', () => {
    const w = mount(ListItem, {
      props: { actions: [h('a', 'edit'), h('a', 'more')] },
      slots: { default: () => 'x' },
    });
    const lis = w.findAll('.apollo-list-item-action > li');
    expect(lis).toHaveLength(2);
    expect(w.findAll('.apollo-list-item-action-split')).toHaveLength(1);
  });

  it('判据 4（Item）：`actions: []` 空数组**不渲染**', () => {
    const w = mount(ListItem, { props: { actions: [] }, slots: { default: () => 'x' } });
    expect(w.find('.apollo-list-item-action').exists()).toBe(false);
  });

  it('判据 3（Item）：vertical + extra ⇒ 两段式（`-item-main` + `-item-extra`）', () => {
    const w = mount(
      {
        components: { List, ListItem },
        template: `<List item-layout="vertical">
          <ListItem extra="E">body</ListItem>
        </List>`,
      },
      { global: { plugins: [] } },
    );
    expect(w.find('.apollo-list-item-main').exists()).toBe(true);
    expect(w.find('.apollo-list-item-extra').exists()).toBe(true);
  });

  it('判据 3（Item）：非 vertical 时 extra 与 children **平级**（不包 div）', () => {
    const w = mount(ListItem, {
      props: { extra: 'E' },
      slots: { default: () => 'body' },
    });
    expect(w.find('.apollo-list-item-main').exists()).toBe(false);
    expect(w.find('.apollo-list-item-extra').exists()).toBe(false);
    expect(w.text()).toContain('E');
  });

  it('判据 5（Meta）：三个判据各自独立 —— 只有 description 时没有 `<h4>`', () => {
    const w = mount(ListItemMeta, {
      props: { description: 'desc' },
    });
    expect(w.find('.apollo-list-item-meta-content').exists()).toBe(true);
    expect(w.find('.apollo-list-item-meta-title').exists()).toBe(false);
    expect(w.find('.apollo-list-item-meta-description').text()).toBe('desc');
  });

  it('判据 5（Meta）：avatar / title 各自落位，title 是 `<h4>`', () => {
    const w = mount(ListItemMeta, { props: { avatar: 'A', title: 'T' } });
    expect(w.find('.apollo-list-item-meta-avatar').text()).toBe('A');
    const title = w.find('.apollo-list-item-meta-title');
    expect(title.element.tagName).toBe('H4');
    expect(title.text()).toBe('T');
  });
});

describe('List · L2 ref 与告警', () => {
  it('暴露 `{ nativeElement }`（可空）', async () => {
    const w = mountList();
    await nextTick();
    expect(w.vm.$.exposed?.nativeElement).toBeDefined();
  });

  it('🚨 deprecated 告警：挂载时发一次（上游每次渲染都发；本仓按 D91 先例收成一次）', async () => {
    const w = mountList();
    const hits = () =>
      errorSpy.mock.calls.filter((c: unknown[]) =>
        String(c[0]).includes('is deprecated and will be removed'),
      );
    expect(hits().length).toBeGreaterThan(0);
    // ⚠️ **平台差异**：上游把告警写在渲染体里 ⇒ 每次渲染都发；
    //    本仓按 D91（DropdownButton）的既有先例放在 setup ⇒ 每个实例一次。
    //    这是 dev-only 的提示频率差异，不影响 DOM / 行为（登记在 README §2）。
    errorSpy.mockClear();
    await w.setProps({ bordered: true });
    expect(hits()).toHaveLength(0);
  });
});
