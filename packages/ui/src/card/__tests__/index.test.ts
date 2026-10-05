/**
 * Card · L1/L2（jsdom）。
 *
 * ── 为什么这里能钉住大部分契约 ────────────────────────────────────────────────
 *
 * jsdom **没有布局** —— 但 Card 的可见形态几乎全在**结构**上（head / cover / body /
 * actions 四段的存在性与层序、类名的条件组合、`li` 的百分比宽度），所以 L1 能钉住
 * 绝大部分行为契约。像素归 **L6**。
 *
 * 上游测试 `components/card/__tests__/`（本仓不复用，只作判据）。
 * 本文件钉**最容易写错的那批**：四段的存在判据、`tabList` 的两个不同判据
 * （head 用真值 / `-contain-tabs` 用 `?.length`）、`tab` → `label` 归一化、
 * 受控/非受控二选一、`-contain-grid` 的 vnode 身份比较、`actions` 的宽度、
 * 语义化 7 槽、`Card.Meta` 的 avatar/section 层序、`Card.Grid` 的 `hoverable` 默认 `true`、
 * 以及两条**回归防线**（插槽只调一次 / children 变化要跟着变）。
 */

import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { ConfigProvider } from '../../config-provider';
import { Card, CardGrid, CardMeta } from '../index';

const P = 'apollo-card';

type Slots = Record<string, () => unknown>;

const mountCard = (props: Record<string, unknown> = {}, slots?: Slots) =>
  mount(Card, { props, slots, attachTo: document.body });

beforeEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// 结构与根元素
// ---------------------------------------------------------------------------

describe('Card · 根元素与四段结构', () => {
  it('根是 `<div class="apollo-card apollo-card-bordered apollo-card-css-var">`', () => {
    const w = mountCard();

    expect(w.element.tagName).toBe('DIV');
    const cls = w.element.classList;
    expect(cls.contains(P)).toBe(true);
    // 默认 `variant` 是 `outlined` ⇒ `variant !== 'borderless'` ⇒ 有 `-bordered`
    expect(cls.contains(`${P}-bordered`)).toBe(true);
    expect(cls.contains(`${P}-css-var`)).toBe(true);
    w.unmount();
  });

  it('无 title / extra / tabList 且无 children ⇒ 只有根元素（四段全不渲染）', () => {
    const w = mountCard();

    expect(w.find(`.${P}-head`).exists()).toBe(false);
    expect(w.find(`.${P}-cover`).exists()).toBe(false);
    expect(w.find(`.${P}-body`).exists()).toBe(false);
    expect(w.find(`.${P}-actions`).exists()).toBe(false);
    expect(w.element.children).toHaveLength(0);
    w.unmount();
  });

  it('`id` / 原生 `class` / 未声明 attrs 全部落到根', () => {
    const w = mountCard({
      id: 'c1',
      class: ['from-class-name', 'from-root'],
      'data-testid': 'probe',
    });

    expect(w.element.id).toBe('c1');
    expect(w.element.getAttribute('data-testid')).toBe('probe');
    for (const name of ['from-class-name', 'from-root']) {
      expect(w.element.classList.contains(name)).toBe(true);
    }
    w.unmount();
  });

  it('`expose` 出的是 `{ nativeElement }`（不是元素本身）', () => {
    const w = mountCard();
    const vm = w.vm as unknown as { nativeElement: HTMLElement | null };

    expect(vm.nativeElement).toBe(w.element);
    w.unmount();
  });
});

// ---------------------------------------------------------------------------
// head
// ---------------------------------------------------------------------------

describe('Card · head 的判据与结构', () => {
  it('只有 children ⇒ **没有** head', () => {
    const w = mountCard({}, { default: () => [h('p', 'x')] });

    expect(w.find(`.${P}-head`).exists()).toBe(false);
    expect(w.find(`.${P}-body`).exists()).toBe(true);
    w.unmount();
  });

  it('只有 `title` ⇒ head + head-wrapper + head-title（**没有** extra）', () => {
    const w = mountCard({ title: 'T' });

    const head = w.find(`.${P}-head`);
    expect(head.exists()).toBe(true);
    expect(head.find(`.${P}-head-wrapper`).exists()).toBe(true);
    expect(head.find(`.${P}-head-title`).text()).toBe('T');
    expect(head.find(`.${P}-extra`).exists()).toBe(false);
    w.unmount();
  });

  it('只有 `extra` ⇒ head + extra（**没有** head-title）', () => {
    const w = mountCard({ extra: h('a', { href: '#' }, 'More') });

    const head = w.find(`.${P}-head`);
    expect(head.exists()).toBe(true);
    expect(head.find(`.${P}-extra`).text()).toBe('More');
    expect(head.find(`.${P}-head-title`).exists()).toBe(false);
    w.unmount();
  });

  it('🚨 `title` / `extra` 用 `isRenderable` 判据：`""` 与 `false` **不渲染** head', () => {
    expect(mountCard({ title: '' }).find(`.${P}-head`).exists()).toBe(false);
    expect(mountCard({ title: false }).find(`.${P}-head`).exists()).toBe(false);
    // `0` 是 `isNonNullable` 的成员 ⇒ **渲染**（与上游 `isReactRenderable` 一致）
    expect(mountCard({ title: 0 }).find(`.${P}-head-title`).text()).toBe('0');
  });

  it('`headStyle`（deprecated）与语义化 `styles.header` **按顺序合并**（语义化槽覆盖）', () => {
    const w = mountCard({
      title: 'T',
      headStyle: { color: 'red', marginTop: '1px' },
      styles: { header: { color: 'blue' } },
    });

    const style = w.find(`.${P}-head`).element.getAttribute('style') ?? '';
    expect(style).toContain('color: blue');
    expect(style).toContain('margin-top: 1px');
    expect(style).not.toContain('red');
    w.unmount();
  });

  it('`bodyStyle`（deprecated）与语义化 `styles.body` 同理', () => {
    const w = mountCard(
      { bodyStyle: { padding: '1px' }, styles: { body: { padding: '2px' } } },
      { default: () => [h('p', 'x')] },
    );

    const style = w.find(`.${P}-body`).element.getAttribute('style') ?? '';
    expect(style).toContain('padding: 2px');
    expect(style).not.toContain('1px');
    w.unmount();
  });
});

// ---------------------------------------------------------------------------
// cover / body / actions
// ---------------------------------------------------------------------------

describe('Card · cover / body / actions', () => {
  it('`cover` 渲染成 `.apollo-card-cover`，且是 head 与 body 之间的兄弟', () => {
    const w = mountCard(
      { title: 'T', cover: h('img', { alt: 'c' }) },
      { default: () => [h('p', 'x')] },
    );

    expect(w.find(`.${P}-cover img`).exists()).toBe(true);
    const children = Array.from<Element>(w.element.children).map((n) => n.className.split(' ')[0]);
    expect(children).toEqual([`${P}-head`, `${P}-cover`, `${P}-body`]);
    w.unmount();
  });

  it('`body` 只在 `loading || children.length` 时渲染', () => {
    expect(mountCard().find(`.${P}-body`).exists()).toBe(false);
    expect(
      mountCard({}, { default: () => [h('p', 'x')] })
        .find(`.${P}-body`)
        .exists(),
    ).toBe(true);
    expect(mountCard({ loading: true }).find(`.${P}-body`).exists()).toBe(true);
  });

  it('`loading` ⇒ 根上 `-loading`，body 里是 Skeleton（4 行段落、无标题）', () => {
    const w = mountCard({ loading: true });

    expect(w.element.classList.contains(`${P}-loading`)).toBe(true);
    const skeleton = w.find(`.${P}-body .apollo-skeleton`);
    expect(skeleton.exists()).toBe(true);
    // `title={false}` ⇒ 骨架里**没有**标题行
    expect(skeleton.find('.apollo-skeleton-title').exists()).toBe(false);
    // `paragraph={{rows:4}}` ⇒ 4 行
    expect(skeleton.findAll('.apollo-skeleton-paragraph li')).toHaveLength(4);
    w.unmount();
  });

  it('🚨 `actions` 的每个 `li` 宽度是内联百分比（`100 / n`），里面是 `<span>`', () => {
    const w = mountCard({ actions: [h('span', null, 'A'), h('span', null, 'B')] });

    const items = w.findAll(`.${P}-actions > li`);
    expect(items).toHaveLength(2);
    expect(items[0]?.attributes('style')).toContain('width: 50%');
    expect(items[1]?.attributes('style')).toContain('width: 50%');
    expect(items[0]?.find('span').exists()).toBe(true);
    w.unmount();
  });

  it('`actions` 为 `[]` ⇒ 不渲染 `<ul>`（真值判据是 `length`）', () => {
    expect(mountCard({ actions: [] }).find(`.${P}-actions`).exists()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 类名条件
// ---------------------------------------------------------------------------

describe('Card · 条件类名', () => {
  it('`variant="borderless"` ⇒ **没有** `-bordered`（判据是「不是 borderless」）', () => {
    const w = mountCard({ variant: 'borderless' });
    expect(w.element.classList.contains(`${P}-bordered`)).toBe(false);
  });

  it('`bordered={false}`（deprecated）⇒ 也变成 borderless', () => {
    const w = mountCard({ bordered: false });
    expect(w.element.classList.contains(`${P}-bordered`)).toBe(false);
  });

  it('`hoverable` / `size="small"` / `type="inner"` 各自的类名', () => {
    expect(mountCard({ hoverable: true }).element.classList.contains(`${P}-hoverable`)).toBe(true);
    expect(mountCard({ size: 'small' }).element.classList.contains(`${P}-small`)).toBe(true);
    expect(mountCard({ type: 'inner' }).element.classList.contains(`${P}-type-inner`)).toBe(true);
    // `size="medium"` 不落任何尺寸类名
    const medium = mountCard({ size: 'medium' });
    expect(medium.element.classList.contains(`${P}-small`)).toBe(false);
  });

  it('🚨 `-contain-grid` 靠 **vnode 身份比较**：只有 `Card.Grid` 子元素才加', () => {
    const withGrid = mountCard({}, { default: () => [h(CardGrid, null, { default: () => 'g' })] });
    expect(withGrid.element.classList.contains(`${P}-contain-grid`)).toBe(true);

    const withPlain = mountCard({}, { default: () => [h('div', 'g')] });
    expect(withPlain.element.classList.contains(`${P}-contain-grid`)).toBe(false);
  });

  it('🚨 `-contain-tabs` 用 `tabList?.length`（**空数组不加**，但 head 仍然渲染）', () => {
    const nonEmpty = mountCard({ tabList: [{ key: 'k', tab: 'T' }] });
    expect(nonEmpty.element.classList.contains(`${P}-contain-tabs`)).toBe(true);

    const empty = mountCard({ tabList: [] });
    expect(empty.element.classList.contains(`${P}-contain-tabs`)).toBe(false);
    // ⚠️ head 的判据是 `tabList` 的**真值**（空数组也是真值）⇒ head 与 Tabs 仍然渲染
    expect(empty.find(`.${P}-head`).exists()).toBe(true);
    expect(empty.find(`.${P}-head .apollo-tabs-top`).exists()).toBe(true);
  });

  it('`direction="rtl"`（ConfigProvider）⇒ 根上 `-rtl`', async () => {
    const w = mount(ConfigProvider, {
      props: { direction: 'rtl' },
      slots: { default: () => h(Card, { title: 'T' }) },
      attachTo: document.body,
    });
    await nextTick();

    expect(w.find(`.${P}`).element.classList.contains(`${P}-rtl`)).toBe(true);
    w.unmount();
  });
});

// ---------------------------------------------------------------------------
// tabList
// ---------------------------------------------------------------------------

describe('Card · tabList', () => {
  const tabList = [
    { key: 'a', tab: 'TabA' },
    { key: 'b', tab: 'TabB' },
  ];

  it('tabs 在 `head` **里面**、`head-wrapper` **外面**', () => {
    const w = mountCard({ tabList });

    const head = w.find(`.${P}-head`);
    const tabs = head.find('.apollo-tabs-top');
    expect(tabs.exists()).toBe(true);
    expect(tabs.element.parentElement?.className).toContain(`${P}-head`);
    expect(w.find(`.${P}-head-wrapper .apollo-tabs-top`).exists()).toBe(false);
    // Tabs 自己的 className 是 `{p}-head-tabs`
    expect(tabs.classes()).toContain(`${P}-head-tabs`);
    w.unmount();
  });

  it('`tab` 被归一成 `label`（页签文本可见）', () => {
    const w = mountCard({ tabList });

    const labels = w.findAll('.apollo-tabs-tab-btn').map((n) => n.text());
    expect(labels).toEqual(['TabA', 'TabB']);
    w.unmount();
  });

  it('🚨 item 里同时有 `label` 与 `tab` 时 **`label` 赢**（`{label: tab, ...item}`）', () => {
    const w = mountCard({ tabList: [{ key: 'a', tab: 'from-tab', label: 'from-label' }] });

    expect(w.find('.apollo-tabs-tab-btn').text()).toBe('from-label');
    w.unmount();
  });

  it('受控：`activeTabKey` 生效；非受控：`defaultActiveTabKey` 生效', () => {
    const controlled = mountCard({ tabList, activeTabKey: 'b' });
    expect(controlled.find('.apollo-tabs-tab-active').text()).toContain('TabB');

    const uncontrolled = mountCard({ tabList, defaultActiveTabKey: 'b' });
    expect(uncontrolled.find('.apollo-tabs-tab-active').text()).toContain('TabB');
  });

  it('点击页签触发 `onTabChange`（prop，**不是** emits）', async () => {
    const onTabChange = vi.fn();
    const w = mountCard({ tabList, defaultActiveTabKey: 'a', onTabChange });

    const tabs = w.findAll('.apollo-tabs-tab-btn');
    await tabs[1]?.trigger('click');
    await nextTick();

    expect(onTabChange).toHaveBeenCalledTimes(1);
    expect(onTabChange).toHaveBeenCalledWith('b');
    w.unmount();
  });

  it('`tabBarExtraContent` 落到页签栏', () => {
    const w = mountCard({
      tabList,
      tabBarExtraContent: h('a', { href: '#' }, 'More'),
    });

    expect(w.find('.apollo-tabs-extra-content').text()).toContain('More');
    w.unmount();
  });

  it('`tabProps` 透传（`size` 被 Card 的 `tabSize` 覆盖，其余保留）', () => {
    const w = mountCard({ tabList, tabProps: { centered: true } });

    expect(w.find('.apollo-tabs-centered').exists()).toBe(true);
    w.unmount();
  });
});

// ---------------------------------------------------------------------------
// 语义化（7 槽）
// ---------------------------------------------------------------------------

describe('Card · 语义化 7 槽', () => {
  it('`classNames` 的 7 个槽各自落到对应元素', () => {
    const w = mountCard(
      {
        title: 'T',
        extra: 'E',
        cover: h('img', { alt: 'c' }),
        actions: [h('span', null, 'A')],
        classNames: {
          root: 'c-root',
          header: 'c-header',
          body: 'c-body',
          extra: 'c-extra',
          title: 'c-title',
          actions: 'c-actions',
          cover: 'c-cover',
        },
      },
      { default: () => [h('p', 'x')] },
    );

    expect(w.element.classList.contains('c-root')).toBe(true);
    for (const [slot, cls] of [
      ['head', 'c-header'],
      ['head-title', 'c-title'],
      ['extra', 'c-extra'],
      ['cover', 'c-cover'],
      ['body', 'c-body'],
      ['actions', 'c-actions'],
    ] as const) {
      expect(w.find(`.${P}-${slot}`).classes()).toContain(cls);
    }
    w.unmount();
  });

  it('`styles` 的槽落到对应元素的内联样式；`style` prop 覆盖 `styles.root`', () => {
    const w = mountCard({
      title: 'T',
      styles: { root: { marginTop: '1px' }, header: { marginTop: '2px' } },
      style: { marginTop: '9px' },
    });

    expect(w.element.getAttribute('style')).toContain('margin-top: 9px');
    expect(w.find(`.${P}-head`).element.getAttribute('style')).toContain('margin-top: 2px');
    w.unmount();
  });

  it('函数形态：`classNames` / `styles` 收到解析后的 `props`（`size` / `variant`）', () => {
    const seen: Record<string, unknown>[] = [];
    const w = mountCard({
      title: 'T',
      size: 'small',
      classNames: (info: { props: Record<string, unknown> }) => {
        seen.push(info.props);
        return { root: 'fn-root' };
      },
    });

    expect(seen[0]?.size).toBe('small');
    expect(seen[0]?.variant).toBe('outlined');
    expect(w.element.classList.contains('fn-root')).toBe(true);
    w.unmount();
  });
});

// ---------------------------------------------------------------------------
// Card.Meta
// ---------------------------------------------------------------------------

describe('Card.Meta', () => {
  it('结构：`avatar` 在 `section` **外面**，`title` / `description` 在 **里面**', () => {
    const w = mount(CardMeta, {
      props: { avatar: h('span', null, 'AV'), title: 'MT', description: 'MD' },
      attachTo: document.body,
    });

    const root = w.element;
    expect(root.classList.contains(`${P}-meta`)).toBe(true);
    const kids = Array.from<Element>(root.children).map((n) => n.className.split(' ')[0]);
    expect(kids).toEqual([`${P}-meta-avatar`, `${P}-meta-section`]);

    const section = w.find(`.${P}-meta-section`);
    expect(section.find(`.${P}-meta-title`).text()).toBe('MT');
    expect(section.find(`.${P}-meta-description`).text()).toBe('MD');
    w.unmount();
  });

  it('只有 `avatar` ⇒ **没有** section；只有 `title` ⇒ 有 section 没有 avatar', () => {
    const avatarOnly = mount(CardMeta, { props: { avatar: 'AV' } });
    expect(avatarOnly.find(`.${P}-meta-avatar`).exists()).toBe(true);
    expect(avatarOnly.find(`.${P}-meta-section`).exists()).toBe(false);

    const titleOnly = mount(CardMeta, { props: { title: 'MT' } });
    expect(titleOnly.find(`.${P}-meta-section`).exists()).toBe(true);
    expect(titleOnly.find(`.${P}-meta-avatar`).exists()).toBe(false);
  });

  it('🚨 `prefixCls` 是**根前缀**（`getPrefixCls` 语义：`x` ⇒ `x-meta`，不带 `card` 后缀）', () => {
    const w = mount(CardMeta, { props: { prefixCls: 'x', title: 'MT' } });
    expect(w.element.classList.contains('x-meta')).toBe(true);
  });

  it('根类名顺序是 `metaPrefixCls` → context → 语义化 root（调用方 class 由 attrs 合并）', () => {
    const w = mount(CardMeta, {
      props: { class: 'user-cls', classNames: { root: 'sem-cls' } },
    });
    const cls = w.element.classList;
    expect(cls.contains(`${P}-meta`)).toBe(true);
    expect(cls.contains('user-cls')).toBe(true);
    expect(cls.contains('sem-cls')).toBe(true);
  });

  it('🚨 根上**没有** `-rtl`（Card.Meta 不读 direction）', async () => {
    const w = mount(ConfigProvider, {
      props: { direction: 'rtl' },
      slots: { default: () => h(CardMeta, { title: 'MT' }) },
      attachTo: document.body,
    });
    await nextTick();

    expect(w.find(`.${P}-meta`).element.classList.contains(`${P}-meta-rtl`)).toBe(false);
    w.unmount();
  });

  it('`expose` 出的是 `{ nativeElement }`', () => {
    const w = mount(CardMeta, { props: { title: 'MT' } });
    const vm = w.vm as unknown as { nativeElement: HTMLElement | null };
    expect(vm.nativeElement).toBe(w.element);
  });
});

// ---------------------------------------------------------------------------
// Card.Grid
// ---------------------------------------------------------------------------

describe('Card.Grid', () => {
  it('🚨 `hoverable` **默认 `true`**（与 `Card` 的默认 `false` 不同）', () => {
    const w = mount(CardGrid, { attachTo: document.body });

    expect(w.element.classList.contains(`${P}-grid`)).toBe(true);
    expect(w.element.classList.contains(`${P}-grid-hoverable`)).toBe(true);
    w.unmount();
  });

  it('`hoverable={false}` ⇒ 没有 `-grid-hoverable`', () => {
    const w = mount(CardGrid, { props: { hoverable: false } });
    expect(w.element.classList.contains(`${P}-grid-hoverable`)).toBe(false);
  });

  it('原生 `class` / `style` / attrs 落到根；`prefixCls` 生效', () => {
    const w = mount(CardGrid, {
      props: { prefixCls: 'x', class: 'user-cls', style: { width: '25%' } },
      attrs: { 'data-testid': 'g' },
    });

    expect(w.element.classList.contains('x-grid')).toBe(true);
    expect(w.element.classList.contains('user-cls')).toBe(true);
    expect(w.element.getAttribute('style')).toContain('width: 25%');
    expect(w.element.getAttribute('data-testid')).toBe('g');
  });

  it('`expose` 出的是 `{ nativeElement }`', () => {
    const w = mount(CardGrid);
    const vm = w.vm as unknown as { nativeElement: HTMLElement | null };
    expect(vm.nativeElement).toBe(w.element);
  });
});

// ---------------------------------------------------------------------------
// 告警（上游 :149-152、:175-184）
// ---------------------------------------------------------------------------

describe('Card · deprecated 告警', () => {
  const errorSpy = () => vi.spyOn(console, 'error').mockImplementation(() => {});

  it('`size="default"` ⇒ 告警（建议用 `medium`）', () => {
    const spy = errorSpy();
    mountCard({ size: 'default' });

    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls.flat().join(' ')).toContain('size="default"');
  });

  it('`headStyle` / `bodyStyle` / `bordered` ⇒ 各自的告警', () => {
    const headStyle = errorSpy();
    mountCard({ headStyle: {} });
    expect(headStyle.mock.calls.flat().join(' ')).toContain('headStyle');
    vi.restoreAllMocks();

    const bodyStyle = errorSpy();
    mountCard({ bodyStyle: {} });
    expect(bodyStyle.mock.calls.flat().join(' ')).toContain('bodyStyle');
    vi.restoreAllMocks();

    const bordered = errorSpy();
    mountCard({ bordered: true });
    expect(bordered.mock.calls.flat().join(' ')).toContain('bordered');
  });

  it('都不传 ⇒ 无任何 deprecated 告警', () => {
    const spy = errorSpy();
    mountCard({ title: 'T', size: 'small', variant: 'outlined' });

    expect(spy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 两条回归防线（都是实测踩过的形态）
// ---------------------------------------------------------------------------

describe('Card · 回归防线', () => {
  it('🚨 一次渲染只调用插槽函数**一次**（`childNodes` 被两处消费）', async () => {
    const slot = vi.fn(() => [h('p', 'x')]);
    const w = mountCard({ title: 'T' }, { default: slot });

    expect(slot).toHaveBeenCalledTimes(1);

    await w.setProps({ title: 'T2' });
    await nextTick();
    expect(slot).toHaveBeenCalledTimes(2);
    w.unmount();
  });

  it('🚨 children 变化时 `-contain-grid` 与 body 内容都要跟着变（缓存按渲染失效）', async () => {
    const showGrid = ref(false);
    const Host = defineComponent({
      setup() {
        return () =>
          h(Card, null, {
            default: () => [
              showGrid.value ? h(CardGrid, null, { default: () => 'g' }) : h('div', 'plain'),
            ],
          });
      },
    });
    const w = mount(Host, { attachTo: document.body });
    const cardEl = () => w.find(`.${P}`).element;

    expect(cardEl().classList.contains(`${P}-contain-grid`)).toBe(false);

    showGrid.value = true;
    await nextTick();
    expect(cardEl().classList.contains(`${P}-contain-grid`)).toBe(true);

    showGrid.value = false;
    await nextTick();
    expect(cardEl().classList.contains(`${P}-contain-grid`)).toBe(false);

    w.unmount();
  });
});
