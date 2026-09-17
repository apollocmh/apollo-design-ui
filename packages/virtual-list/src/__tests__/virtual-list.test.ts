import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick, ref } from 'vue';
import { MockResizeObserver } from '../../../../vitest.setup';
import type { ExtraRenderInfo, ScrollInfo } from '../index';
import { VirtualList } from '../index';

const PREFIX = 'apollo-virtual-list';

/** 100 项，键为 `item-N`。 */
function makeData(count = 100): string[] {
  return Array.from({ length: count }, (_, i) => `item-${i}`);
}

interface Rig {
  wrapper: ReturnType<typeof mount>;
  /** 外层容器（带 position: relative） */
  container: HTMLElement;
  /** 真正的滚动元素 */
  holder: HTMLElement;
  inner: HTMLElement;
  /** 模拟浏览器：设 `scrollTop` 再派发 `scroll`（jsdom 赋值**不会**自动派发） */
  scrollTo(top: number): Promise<void>;
  /** 手动派发一次 scroll（读当前 scrollTop） */
  fireScroll(): Promise<void>;
  items(): string[];
  /** 把当前渲染出来的项桩成「可测量」（见实现处的说明） */
  makeItemsMeasurable(height?: number): void;
}

function mountList(
  props: Record<string, unknown> = {},
  options: { extra?: (info: ExtraRenderInfo) => unknown } = {},
): Rig {
  const wrapper = mount(VirtualList, {
    props: {
      prefixCls: PREFIX,
      data: makeData(),
      // 数据是 `string[]`，用函数取键；字符串 itemKey 另有专门用例
      itemKey: (item: unknown) => String(item),
      height: 100,
      itemHeight: 20,
      ...props,
    },
    slots: {
      default: ({ item }: { item: string }) => h('div', { 'data-item': item }, item),
      ...(options.extra ? { extra: options.extra } : {}),
    },
    attachTo: document.body,
  });

  const container = wrapper.element as HTMLElement;
  const holder = wrapper.find(`.${PREFIX}-holder`).element as HTMLElement;
  // jsdom 无布局：`clientHeight` 恒 0 ⇒ 手动桩替，否则 `computeScrollTarget` 直接早退
  Object.defineProperty(holder, 'clientHeight', { value: 100, configurable: true });
  const inner = wrapper.find(`.${PREFIX}-holder-inner`).element as HTMLElement;

  return {
    wrapper,
    container,
    holder,
    inner,
    async scrollTo(top: number) {
      holder.scrollTop = top;
      holder.dispatchEvent(new Event('scroll'));
      await nextTick();
      await nextTick();
    },
    async fireScroll() {
      holder.dispatchEvent(new Event('scroll'));
      await nextTick();
      await nextTick();
    },
    items() {
      return wrapper.findAll('[data-item]').map((node) => node.attributes('data-item') ?? '');
    },
    /**
     * 把当前渲染出来的项桩成「可测量」。
     *
     * ⚠️ jsdom 量不到高度 ⇒ `computeScrollTarget` 的「可见范围内有未测量的项」永远为真
     *    ⇒ `scrollTo({index})` 会一路迭代到 10 次上限。桩成可测量之后循环两轮就收敛，
     *    既不刷告警也不慢。见契约文档 §7.1。
     */
    makeItemsMeasurable(height = 20) {
      for (const node of wrapper.findAll('[data-item]')) {
        const el = node.element as HTMLElement;
        Object.defineProperty(el, 'offsetParent', { value: document.body, configurable: true });
        Object.defineProperty(el, 'offsetHeight', { value: height, configurable: true });
      }
    },
  };
}

/** 临时静音 dev 告警（`console.error`）。返回恢复函数。 */
function silenceDevWarning(): () => void {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
  return () => spy.mockRestore();
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('VirtualList · DOM 结构', () => {
  it('容器 > holder > holder-inner 三层', () => {
    const rig = mountList();
    expect(rig.container.classList.contains(PREFIX)).toBe(true);
    expect(rig.container.style.position).toBe('relative');
    expect(rig.holder.classList.contains(`${PREFIX}-holder`)).toBe(true);
    expect(rig.inner.classList.contains(`${PREFIX}-holder-inner`)).toBe(true);
    rig.wrapper.unmount();
  });

  it('⭐ holder 的滚动样式：height + overflowY auto + overflowAnchor none', () => {
    const rig = mountList();
    expect(rig.holder.style.height).toBe('100px');
    expect(rig.holder.style.overflowY).toBe('auto');
    // 少了 overflowAnchor，浏览器会在内容变化时自动调 scrollTop（scroll anchoring）
    expect(rig.holder.style.overflowAnchor).toBe('none');
    rig.wrapper.unmount();
  });

  it('fullHeight=false ⇒ 用 maxHeight 而不是 height', () => {
    const rig = mountList({ fullHeight: false });
    expect(rig.holder.style.maxHeight).toBe('100px');
    expect(rig.holder.style.height).toBe('');
    rig.wrapper.unmount();
  });

  it('⭐ Filler 内层：flex column + 绝对定位 + translateY，且**不设 width**', () => {
    const rig = mountList();
    expect(rig.inner.style.display).toBe('flex');
    expect(rig.inner.style.flexDirection).toBe('column');
    expect(rig.inner.style.position).toBe('absolute');
    expect(rig.inner.style.transform).toBe('translateY(0px)');
    // 上游注释：设 width 会破坏 sticky: right
    expect(rig.inner.style.width).toBe('');
    rig.wrapper.unmount();
  });

  it('Filler 外层的 height 就是内容总高（100 × 20）', () => {
    const rig = mountList();
    const outer = rig.inner.parentElement as HTMLElement;
    expect(outer.style.height).toBe('2000px');
    expect(outer.style.position).toBe('relative');
    expect(outer.style.overflow).toBe('hidden');
    rig.wrapper.unmount();
  });

  it('RTL：容器加 dir="rtl" 且 class 带 -rtl', () => {
    const rig = mountList({ direction: 'rtl' });
    expect(rig.container.getAttribute('dir')).toBe('rtl');
    expect(rig.container.classList.contains(`${PREFIX}-rtl`)).toBe(true);
    rig.wrapper.unmount();
  });
});

describe('VirtualList · 虚拟化开关', () => {
  it('⭐ 不传 itemHeight ⇒ 走真实滚动，全部渲染', () => {
    const rig = mountList({ itemHeight: undefined });
    expect(rig.items()).toHaveLength(100);
    // 非虚拟路径下 Filler 外层没有高度/定位
    const outer = rig.inner.parentElement as HTMLElement;
    expect(outer.style.height).toBe('');
    expect(rig.inner.style.position).toBe('');
    rig.wrapper.unmount();
  });

  it('virtual=false ⇒ 强制真实滚动', () => {
    const rig = mountList({ virtual: false });
    expect(rig.items()).toHaveLength(100);
    rig.wrapper.unmount();
  });

  it('⭐ 数据太少撑不满容器 ⇒ 不虚拟化，全部渲染', () => {
    const rig = mountList({ data: makeData(3) });
    expect(rig.items()).toHaveLength(3);
    rig.wrapper.unmount();
  });

  it('⭐ 虚拟化时只渲染窗口内的项（顶部：0..6）', () => {
    const rig = mountList();
    expect(rig.items()).toEqual([
      'item-0',
      'item-1',
      'item-2',
      'item-3',
      'item-4',
      'item-5',
      'item-6',
    ]);
    rig.wrapper.unmount();
  });

  it('设了 scrollWidth ⇒ 强制虚拟化，且 Filler 内层有显式宽度、外层不裁剪', () => {
    const rig = mountList({ data: makeData(1), scrollWidth: 500 });
    const outer = rig.inner.parentElement as HTMLElement;
    expect(rig.inner.style.width).toBe('500px');
    // 与上游的差异：外层改成 visible，让横向溢出传得到 holder
    expect(outer.style.overflow).toBe('visible');
    rig.wrapper.unmount();
  });
});

describe('VirtualList · 滚动驱动窗口', () => {
  it('⭐ 滚动后窗口前移（start 用 >=，所以贴住视口顶的项仍在窗口内）', async () => {
    const rig = mountList();
    await rig.scrollTo(100);
    // offsetTop = 100 ⇒ 第 4 项底正好 100 ⇒ start = 4；end = 11
    expect(rig.items()[0]).toBe('item-4');
    expect(rig.items()).toHaveLength(8);
    rig.wrapper.unmount();
  });

  it('Filler 内层的 translateY 跟着 start 走', async () => {
    const rig = mountList();
    await rig.scrollTo(100);
    // start = 4 ⇒ 第 4 项顶 = 80
    expect(rig.inner.style.transform).toBe('translateY(80px)');
    rig.wrapper.unmount();
  });

  it('⭐ 外部直接改 scrollTop 会被同步进内部状态（onFallbackScroll）', async () => {
    const rig = mountList();
    rig.holder.scrollTop = 300;
    await rig.fireScroll();
    // offsetTop = 300 ⇒ 第 (i+1)×20 >= 300 ⇒ i >= 14 ⇒ start = 14
    expect(rig.items()[0]).toBe('item-14');
    rig.wrapper.unmount();
  });

  it('onScroll 收到原生事件', async () => {
    const onScroll = vi.fn();
    const rig = mountList({ onScroll });
    await rig.scrollTo(50);
    expect(onScroll).toHaveBeenCalledTimes(1);
    expect(onScroll.mock.calls[0]?.[0]).toBeInstanceOf(Event);
    rig.wrapper.unmount();
  });

  it('⭐ onVirtualScroll 只在偏移真的变化时回调', async () => {
    const onVirtualScroll = vi.fn<(info: ScrollInfo) => void>();
    const rig = mountList({ onVirtualScroll });
    await rig.scrollTo(0); // 与初始偏移相同 ⇒ 不回调
    expect(onVirtualScroll).not.toHaveBeenCalled();

    await rig.scrollTo(120);
    expect(onVirtualScroll).toHaveBeenCalledTimes(1);
    expect(onVirtualScroll.mock.calls[0]?.[0]).toEqual({ x: 0, y: 120 });

    await rig.scrollTo(120); // 同值 ⇒ 不重复回调
    expect(onVirtualScroll).toHaveBeenCalledTimes(1);
    rig.wrapper.unmount();
  });

  it('RTL 下 getScrollInfo 的 x 取负', async () => {
    const rig = mountList({ direction: 'rtl' });
    const api = rig.wrapper.vm as unknown as { getScrollInfo(): ScrollInfo };
    expect(api.getScrollInfo()).toEqual({ x: -0, y: 0 });
    rig.wrapper.unmount();
  });
});

describe('VirtualList · 命令式 API', () => {
  it('⭐ scrollTo(数字) 直接设 scrollTop 并夹进范围', async () => {
    const rig = mountList();
    const api = rig.wrapper.vm as unknown as { scrollTo(arg?: unknown): void };
    api.scrollTo(200);
    await nextTick();
    expect(rig.holder.scrollTop).toBe(200);
    rig.wrapper.unmount();
  });

  it('⭐ 超过 maxScrollHeight 会被夹住（2000 - 100 = 1900）', async () => {
    const rig = mountList();
    const api = rig.wrapper.vm as unknown as { scrollTo(arg?: unknown): void };
    api.scrollTo(99999);
    await nextTick();
    expect(rig.holder.scrollTop).toBe(1900);
    rig.wrapper.unmount();
  });

  it('负数被夹到 0', async () => {
    const rig = mountList();
    const api = rig.wrapper.vm as unknown as { scrollTo(arg?: unknown): void };
    api.scrollTo(-50);
    await nextTick();
    expect(rig.holder.scrollTop).toBe(0);
    rig.wrapper.unmount();
  });

  it("⭐ scrollTo({ index, align: 'top' }) 把目标项顶对齐容器顶", async () => {
    // ⚠️ jsdom 量不到高度（`offsetParent` 恒 null）⇒ `computeScrollTarget` 的
    //    「可见范围内有未测量的项」永远为真 ⇒ 会迭代到 10 次上限并打 dev 告警。
    //    这是**上游行为**（同一个上限），这里静音掉。见契约文档 §7.1。
    const rig = mountList();
    rig.makeItemsMeasurable();
    const api = rig.wrapper.vm as unknown as { scrollTo(arg?: unknown): void };
    api.scrollTo({ index: 5, align: 'top' });
    await nextTick();
    await nextTick();
    await nextTick();
    expect(rig.holder.scrollTop).toBe(100);
    rig.wrapper.unmount();
  });

  it("⭐ scrollTo({ index, align: 'bottom' })", async () => {
    const rig = mountList();
    rig.makeItemsMeasurable();
    const api = rig.wrapper.vm as unknown as { scrollTo(arg?: unknown): void };
    api.scrollTo({ index: 20, align: 'bottom' });
    await nextTick();
    await nextTick();
    await nextTick();
    // 第 20 项底 = 420；420 - 100 + 0 = 320
    expect(rig.holder.scrollTop).toBe(320);
    rig.wrapper.unmount();
  });

  it('⭐ 高度永远量不到时会迭代到上限并打 dev 告警（上游的 MAX_TIMES 守卫）', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const rig = mountList();
    const api = rig.wrapper.vm as unknown as { scrollTo(arg?: unknown): void };
    api.scrollTo({ index: 5, align: 'top' });
    // 10 轮迭代，每轮一次 nextTick
    for (let i = 0; i < 12; i += 1) {
      await nextTick();
    }
    const printed = spy.mock.calls.flat().join(' ');
    expect(printed).toContain('reach the max limitation');
    spy.mockRestore();
    rig.wrapper.unmount();
  });

  it('scrollTo({ key }) 现查下标', async () => {
    const rig = mountList({ itemKey: (item: unknown) => String(item) });
    rig.makeItemsMeasurable();
    const api = rig.wrapper.vm as unknown as { scrollTo(arg?: unknown): void };
    api.scrollTo({ key: 'item-10', align: 'top' });
    await nextTick();
    await nextTick();
    await nextTick();
    expect(rig.holder.scrollTop).toBe(200);
    rig.wrapper.unmount();
  });

  it('⭐ scrollTo({ top }) 走坐标形态', async () => {
    const rig = mountList();
    const api = rig.wrapper.vm as unknown as { scrollTo(arg?: unknown): void };
    api.scrollTo({ top: 160 });
    await nextTick();
    expect(rig.holder.scrollTop).toBe(160);
    rig.wrapper.unmount();
  });

  it('⭐ scrollTo({ left }) 用 keepInHorizontalRange 夹住（没设 scrollWidth ⇒ 压成 0）', async () => {
    const rig = mountList({ scrollWidth: 500 });
    const api = rig.wrapper.vm as unknown as {
      scrollTo(arg?: unknown): void;
      getScrollInfo(): ScrollInfo;
    };
    api.scrollTo({ left: 120 });
    await nextTick();
    expect(rig.holder.scrollLeft).toBe(120);
    rig.wrapper.unmount();
  });

  it('⭐ 坐标形态优先于 index（上游的 isPosScroll 先判）', async () => {
    const rig = mountList();
    const api = rig.wrapper.vm as unknown as { scrollTo(arg?: unknown): void };
    // 带 index 但同时有 top ⇒ 被当成坐标，index 被忽略
    api.scrollTo({ index: 50, top: 40 });
    await nextTick();
    expect(rig.holder.scrollTop).toBe(40);
    rig.wrapper.unmount();
  });

  it('⭐ scrollTo() 无参是 no-op（上游是「闪一下自绘滚动条」）', async () => {
    const rig = mountList();
    const api = rig.wrapper.vm as unknown as { scrollTo(arg?: unknown): void };
    api.scrollTo();
    await nextTick();
    expect(rig.holder.scrollTop).toBe(0);
    rig.wrapper.unmount();
  });

  it('nativeElement 指向 holder', () => {
    const rig = mountList();
    const api = rig.wrapper.vm as unknown as { nativeElement: HTMLElement | null };
    expect(api.nativeElement).toBe(rig.holder);
    rig.wrapper.unmount();
  });
});

describe('VirtualList · 回调与透传', () => {
  it('⭐ onVisibleChange 在挂载时就报一次（上游的 layout effect 行为）', () => {
    const onVisibleChange = vi.fn<(visible: string[], full: string[]) => void>();
    const rig = mountList({ onVisibleChange });
    expect(onVisibleChange).toHaveBeenCalledTimes(1);
    expect(onVisibleChange.mock.calls[0]?.[0]).toEqual(rig.items());
    expect(onVisibleChange.mock.calls[0]?.[1]).toHaveLength(100);
    rig.wrapper.unmount();
  });

  it('extra 插槽收到完整的 ExtraRenderInfo', () => {
    let info: ExtraRenderInfo | undefined;
    const rig = mountList(
      {},
      {
        extra: (i) => {
          info = i;
          return h('span', { 'data-extra': '' });
        },
      },
    );
    expect(rig.wrapper.find('[data-extra]').exists()).toBe(true);
    expect(info?.start).toBe(0);
    expect(info?.end).toBe(6);
    expect(info?.virtual).toBe(true);
    expect(info?.offsetY).toBe(0);
    expect(info?.rtl).toBe(false);
    expect(typeof info?.getSize).toBe('function');
    rig.wrapper.unmount();
  });

  it('⭐ innerProps 透传到 holder-inner（消费方用它注入 aria）', () => {
    const rig = mountList({ innerProps: { 'aria-label': '列表', role: 'listbox' } });
    expect(rig.inner.getAttribute('aria-label')).toBe('列表');
    expect(rig.inner.getAttribute('role')).toBe('listbox');
    rig.wrapper.unmount();
  });

  it('⭐ showScrollBar 被消费掉，不会漏到 DOM 上', () => {
    const rig = mountList({ showScrollBar: false });
    expect(rig.holder.hasAttribute('showscrollbar')).toBe(false);
    expect(rig.container.hasAttribute('showscrollbar')).toBe(false);
    rig.wrapper.unmount();
  });

  it('⭐ 项的 key 不写到 DOM 上（key 在 isReservedProp 里）', () => {
    const rig = mountList();
    expect(rig.wrapper.findAll('[data-item]')[0]?.attributes('key')).toBeUndefined();
    rig.wrapper.unmount();
  });

  it('itemKey 支持函数', () => {
    const rig = mountList({ itemKey: (item: string) => `k:${item}` });
    expect(rig.items()[0]).toBe('item-0');
    rig.wrapper.unmount();
  });

  it('⭐ itemKey 传字符串时取对象的字段', () => {
    const data = Array.from({ length: 100 }, (_, i) => ({ id: `row-${i}`, name: `第 ${i} 行` }));
    const wrapper = mount(VirtualList, {
      props: { prefixCls: PREFIX, data, itemKey: 'id', height: 100, itemHeight: 20 },
      slots: {
        default: ({ item }: { item: { id: string; name: string } }) =>
          h('div', { 'data-item': item.id }, item.name),
      },
    });
    const items = wrapper.findAll('[data-item]').map((n) => n.attributes('data-item'));
    expect(items[0]).toBe('row-0');
    expect(items).toHaveLength(7);
    wrapper.unmount();
  });

  it('⚠️ itemKey 取不到键时会给一次告警（所有项共用一个键）', () => {
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = mount(VirtualList, {
      props: {
        prefixCls: PREFIX,
        data: makeData(5),
        itemKey: 'not-exist',
        height: 100,
        itemHeight: 20,
      },
      slots: { default: ({ item }: { item: string }) => h('div', { 'data-item': item }, item) },
    });
    // 告警内容里带上了 itemKey 的名字，便于定位
    const printed = warn.mock.calls.flat().join(' ');
    expect(printed).toContain('not-exist');
    warn.mockRestore();
    wrapper.unmount();
  });

  it('外层 attrs 透传（class / style / 其它属性）', () => {
    const rig = mountList({ class: 'my-list', 'data-test': 'x' });
    expect(rig.container.classList.contains('my-list')).toBe(true);
    expect(rig.container.getAttribute('data-test')).toBe('x');
    rig.wrapper.unmount();
  });

  it('⚠️ 上游的陷阱照抄：innerProps 里的 style 会**整个覆盖**算出来的样式', () => {
    const rig = mountList({ innerProps: { style: { color: 'red' } } });
    expect(rig.inner.style.color).toBe('red');
    // 覆盖之后 flex / transform 都没了 —— 这是上游 Object.assign 顺序的后果
    expect(rig.inner.style.display).toBe('');
    rig.wrapper.unmount();
  });
});

describe('VirtualList · 数据变化', () => {
  it('数据变短后窗口跟着夹住', async () => {
    const data = ref(makeData(100));
    const wrapper = mount(VirtualList, {
      props: {
        prefixCls: PREFIX,
        data: data.value,
        itemKey: (item: unknown) => String(item),
        height: 100,
        itemHeight: 20,
      },
      slots: { default: ({ item }: { item: string }) => h('div', { 'data-item': item }, item) },
    });
    const holder = wrapper.element as HTMLElement;
    holder.scrollTop = 1900;
    holder.dispatchEvent(new Event('scroll'));
    await nextTick();

    data.value = makeData(3);
    await wrapper.setProps({ data: data.value });
    await nextTick();
    await nextTick();

    // 3 项 × 20 = 60 < 100 ⇒ inVirtual 为假 ⇒ 全渲染
    expect(wrapper.findAll('[data-item]')).toHaveLength(3);
    wrapper.unmount();
  });

  it('暴露 lastDiff（用于滚动锚定的单处变更定位）', async () => {
    const data = ref(makeData(10));
    const wrapper = mount(VirtualList, {
      props: {
        prefixCls: PREFIX,
        data: data.value,
        itemKey: (item: unknown) => String(item),
        height: 100,
        itemHeight: 20,
      },
      slots: { default: ({ item }: { item: string }) => h('div', { 'data-item': item }, item) },
    });
    const api = wrapper.vm as unknown as { lastDiff: unknown };
    expect(api.lastDiff).toBeNull();

    data.value = ['item-0', 'X', ...makeData(10).slice(2)];
    await wrapper.setProps({ data: data.value });
    await nextTick();
    expect(api.lastDiff).toEqual({ index: 1, multiple: true });
    wrapper.unmount();
  });
});

describe('VirtualList · 覆盖补充', () => {
  it('⭐ Filler 内层的尺寸变化会触发重新收集高度，并进到范围计算里', async () => {
    const rig = mountList();
    const outer = rig.inner.parentElement as HTMLElement;
    // 全部未测量 ⇒ 100 × 20
    expect(outer.style.height).toBe('2000px');
    // ⚠️ ResizeObserver 注册在挂载后的下一拍，先等两拍再触发
    await nextTick();
    await nextTick();

    // 让首项「可被测量」且高度与 itemHeight 不同
    const first = rig.wrapper.findAll('[data-item]')[0]?.element as HTMLElement;
    Object.defineProperty(first, 'offsetParent', { value: document.body, configurable: true });
    Object.defineProperty(first, 'offsetHeight', { value: 40, configurable: true });
    // Filler 内层也要有非 0 的 offsetHeight，否则 onInnerResize 不回调
    Object.defineProperty(rig.inner, 'offsetHeight', { value: 2020, configurable: true });

    // 触发 ResizeObserver（utils 是全局单例，一次 trigger 覆盖全部注册目标）
    for (const observer of MockResizeObserver.instances) {
      observer.trigger();
    }
    await nextTick();
    await nextTick();

    // 40 + 99 × 20 = 2020
    expect(outer.style.height).toBe('2020px');
    rig.wrapper.unmount();
  });

  it('component 可以换 holder 的标签名', () => {
    const rig = mountList({ component: 'section' });
    expect(rig.holder.tagName.toLowerCase()).toBe('section');
    rig.wrapper.unmount();
  });

  it('⭐ 默认插槽渲染不出单个元素时给告警并跳过该项', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = mount(VirtualList, {
      props: {
        prefixCls: PREFIX,
        data: makeData(100),
        itemKey: (item: unknown) => String(item),
        height: 100,
        itemHeight: 20,
      },
      // 返回数组（多根）⇒ 不是单个 VNode
      slots: { default: () => [h('div', 'a'), h('div', 'b')] },
    });
    expect(wrapper.findAll('[data-item]')).toHaveLength(0);
    spy.mockRestore();
    wrapper.unmount();
  });

  it('暴露 containerElement', () => {
    const rig = mountList();
    const api = rig.wrapper.vm as unknown as { containerElement: HTMLElement | null };
    expect(api.containerElement).toBe(rig.container);
    rig.wrapper.unmount();
  });

  it('稀疏数组里的洞会被跳过（不渲染、不抛错）', () => {
    // 先填满再 delete 造洞 —— 字面量稀疏数组会被 biome 的 noSparseArray 拦下
    const sparse: string[] = ['a', 'b', 'c'];
    delete sparse[1];
    expect(1 in sparse).toBe(false);

    const rig = mountList({ data: sparse });
    expect(rig.items()).toEqual(['a', 'c']);
    rig.wrapper.unmount();
  });

  it('没有 onVisibleChange 时不抛错', () => {
    const rig = mountList();
    expect(() => rig.wrapper.unmount()).not.toThrow();
  });

  it('RTL + scrollWidth 时内层用 marginRight 而不是 marginLeft', () => {
    const rig = mountList({ direction: 'rtl', scrollWidth: 400, data: makeData(100) });
    // 本包不做 marginLeft 模拟 ⇒ 两个 margin 都不设，宽度直接给死
    expect(rig.inner.style.marginLeft).toBe('');
    expect(rig.inner.style.marginRight).toBe('');
    expect(rig.inner.style.width).toBe('400px');
    rig.wrapper.unmount();
  });
});

describe('VirtualList · 分支补充', () => {
  it('不传 data（用默认空数组）也不抛错', () => {
    const wrapper = mount(VirtualList, {
      props: { prefixCls: PREFIX, itemKey: 'id' },
      slots: { default: () => h('div', 'x') },
    });
    expect(wrapper.findAll('[data-item]')).toHaveLength(0);
    wrapper.unmount();
  });

  it('⭐ 不传 height / itemHeight 时全部走 `?? 0` 兜底', () => {
    const wrapper = mount(VirtualList, {
      props: { prefixCls: PREFIX, data: makeData(5), itemKey: (item: unknown) => String(item) },
      slots: { default: ({ item }: { item: string }) => h('div', { 'data-item': item }, item) },
    });
    // 无 height ⇒ 不虚拟化，全渲染；holder 也没有尺寸样式
    expect(wrapper.findAll('[data-item]')).toHaveLength(5);
    const holder = wrapper.find(`.${PREFIX}-holder`).element as HTMLElement;
    expect(holder.style.height).toBe('');
    expect(holder.style.overflowY).toBe('');
    wrapper.unmount();
  });

  it('⭐ 横向滚动会同步 offsetLeft（原生 scrollLeft 驱动）', async () => {
    const rig = mountList({ scrollWidth: 500 });
    const api = rig.wrapper.vm as unknown as { getScrollInfo(): ScrollInfo };
    expect(api.getScrollInfo().x).toBe(0);

    rig.holder.scrollLeft = 60;
    await rig.fireScroll();
    expect(api.getScrollInfo().x).toBe(60);
    rig.wrapper.unmount();
  });

  it('⭐ scrollTo({ key }) 找不到时按 key 现查一次（index < 0 分支）', async () => {
    const restore = silenceDevWarning();
    const rig = mountList();
    const api = rig.wrapper.vm as unknown as { scrollTo(arg?: unknown): void };
    api.scrollTo({ key: 'not-in-data', align: 'top' });
    // 索引永远是 -1 ⇒ 必然迭代到 10 次上限，等满轮次再还原 spy
    for (let i = 0; i < 12; i += 1) {
      await nextTick();
    }
    // 找不到 ⇒ index 一直是 -1 ⇒ 不滚
    expect(rig.holder.scrollTop).toBe(0);
    rig.wrapper.unmount();
    restore();
  });

  it('⭐ clientHeight 为 0 时 computeScrollTarget 直接早退（needCollectHeight 为假）', async () => {
    const rig = mountList();
    Object.defineProperty(rig.holder, 'clientHeight', { value: 0, configurable: true });
    const api = rig.wrapper.vm as unknown as { scrollTo(arg?: unknown): void };
    api.scrollTo({ index: 5, align: 'top' });
    await nextTick();
    await nextTick();
    // 早退 ⇒ 一轮就结束，scrollTop 不变
    expect(rig.holder.scrollTop).toBe(0);
    rig.wrapper.unmount();
  });

  it('⭐ 稀疏数据：窗口内的洞被跳过（不渲染、不抛错）', () => {
    // 先填满再 delete 造洞 —— biome 的 noSparseArray 会报 `new Array(n)`
    const sparse: unknown[] = makeData(100);
    delete sparse[3];
    expect(3 in sparse).toBe(false);
    const wrapper = mount(VirtualList, {
      props: {
        prefixCls: PREFIX,
        data: sparse,
        itemKey: (item: unknown) => String(item),
        height: 100,
        itemHeight: 20,
      },
      slots: { default: ({ item }: { item: string }) => h('div', { 'data-item': item }, item) },
    });
    const items = wrapper.findAll('[data-item]').map((n) => n.attributes('data-item'));
    expect(items).toContain('item-0');
    expect(items).not.toContain('item-3');
    wrapper.unmount();
  });

  it('⭐ 默认插槽返回非 VNode（文本）时告警并跳过', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const wrapper = mount(VirtualList, {
      props: {
        prefixCls: PREFIX,
        data: makeData(100),
        itemKey: (item: unknown) => String(item),
        height: 100,
        itemHeight: 20,
      },
      slots: { default: () => 'just text' },
    });
    expect(wrapper.findAll('[data-item]')).toHaveLength(0);
    spy.mockRestore();
    wrapper.unmount();
  });

  it('⭐ 首项实测高度 ≠ itemHeight 时会补偿 scrollTop（避免向上滚动跳动）', async () => {
    const rig = mountList();
    // ⚠️ ResizeObserver 的注册发生在挂载后的下一拍（post-flush watcher），
    //    不先等两拍的话 instances 还是空的，trigger 什么也触发不到。
    await nextTick();
    await nextTick();

    const first = rig.wrapper.findAll('[data-item]')[0]?.element as HTMLElement;
    Object.defineProperty(first, 'offsetParent', { value: document.body, configurable: true });
    Object.defineProperty(first, 'offsetHeight', { value: 40, configurable: true });
    // Filler 内层要有非 0 的 offsetHeight，onInnerResize 才会回调
    Object.defineProperty(rig.inner, 'offsetHeight', { value: 2020, configurable: true });

    for (const observer of MockResizeObserver.instances) {
      observer.trigger();
    }
    for (let i = 0; i < 4; i += 1) {
      await nextTick();
    }

    // 补偿量 = 实测高度 − itemHeight = 40 − 20 = 20
    expect(rig.holder.scrollTop).toBe(20);
    rig.wrapper.unmount();
  });

  it('不传 itemHeight 时 scrollTo({ index }) 走 `?? 0` 兜底', async () => {
    const rig = mountList({ itemHeight: undefined });
    rig.makeItemsMeasurable(0);
    const api = rig.wrapper.vm as unknown as { scrollTo(arg?: unknown): void };
    api.scrollTo({ index: 2, align: 'top' });
    for (let i = 0; i < 3; i += 1) {
      await nextTick();
    }
    expect(rig.holder.scrollTop).toBe(0);
    rig.wrapper.unmount();
  });
});
