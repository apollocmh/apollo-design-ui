/**
 * Masonry · L1（纯函数，node）+ L2（jsdom 交互）。
 *
 * ── 为什么要分两层 ───────────────────────────────────────────────────────────
 *
 * jsdom **没有布局引擎** ⇒ `getBoundingClientRect()` 恒 0 ⇒ 端到端排布在这里
 * 证明不了（上游自己也是靠 `spyElementPrototypes` mock rect 才测的）。
 * 所以把**算法**抽成纯函数在 L1 里钉死（`hooks/positions.ts` / `hooks/column-count.ts`），
 * L2 只钉「接线」：类名 / 内联样式 / 回调载荷 / 空列表不崩。
 * 真布局由 **L6** 逐像素负责。
 *
 * ── 期望值的来源 ─────────────────────────────────────────────────────────────
 *
 * 高度数组与列数**照抄上游 `__tests__/index.test.tsx`**（15 个高度 / `columns=3`），
 * 期望的 `480` 是上游断言过的值 —— 本文件用**同一组输入**验证我们的纯函数，
 * 这样「算法是否逐字对齐」就有了机械判据（而不是我手算一遍）。
 */

import { mount } from '@vue/test-utils';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { ConfigProvider } from '../../config-provider';
import { DEFAULT_COLUMN_COUNT, resolveColumnCount } from '../hooks/column-count';
import { computeItemPositions, type ItemHeightData } from '../hooks/positions';
import type { MasonryItemRenderInfo } from '../interface';
import Masonry from '../Masonry.vue';

const P = 'apollo-masonry';

/** 上游 `index.test.tsx` 的高度数组（15 项）。 */
const HEIGHTS = [150, 30, 90, 70, 110, 150, 130, 80, 50, 90, 100, 150, 30, 50, 80];

const toHeightData = (heights: number[]): ItemHeightData[] =>
  heights.map((height, index) => [`item-${index}`, height]);

// ===========================================================================
// L1 · 排布算法（纯函数）
// ===========================================================================

describe('computeItemPositions（L1）', () => {
  it('上游用例：15 项 / 3 列 ⇒ 总高 480、列序 [0,1,2,1,2,1,0,2,1,0,2,1,0,2,0]', () => {
    const [positions, totalHeight] = computeItemPositions(toHeightData(HEIGHTS), 3, 0);

    expect(totalHeight).toBe(480);
    expect(HEIGHTS.map((_, index) => positions.get(`item-${index}`)?.column)).toEqual([
      0, 1, 2, 1, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 0,
    ]);
  });

  it('🚨 平局取**第一个**（最左）最小列 —— `indexOf(min)` 的语义', () => {
    const [positions] = computeItemPositions(
      [
        ['a', 100],
        ['b', 100],
        ['c', 100],
        ['d', 10],
      ],
      3,
      0,
    );

    expect(positions.get('a')).toEqual({ column: 0, top: 0 });
    expect(positions.get('b')).toEqual({ column: 1, top: 0 });
    expect(positions.get('c')).toEqual({ column: 2, top: 0 });
    // 平局 ⇒ 回 0 列（**不是** 2 列，也不是按高度排序）
    expect(positions.get('d')).toEqual({ column: 0, top: 100 });
  });

  it('🚨 显式 `column` 优先，且超界要夹到最后一列', () => {
    const [positions] = computeItemPositions(
      [
        ['a', 100, 2],
        // 越界：列数 3 ⇒ 夹成 2（否则 columnHeights[9] 会撑出一个洞）
        ['b', 50, 9],
      ],
      3,
      0,
    );

    expect(positions.get('a')).toEqual({ column: 2, top: 0 });
    expect(positions.get('b')).toEqual({ column: 2, top: 100 });
  });

  it('🚨 总高要**减掉一个**纵向间距（最后一行的 item 后面不留白）', () => {
    const [positions, totalHeight] = computeItemPositions(
      [
        ['a', 100],
        ['b', 50],
      ],
      2,
      16,
    );

    expect(positions.get('a')).toEqual({ column: 0, top: 0 });
    expect(positions.get('b')).toEqual({ column: 1, top: 0 });
    // max(116, 66) - 16 = 100
    expect(totalHeight).toBe(100);
  });

  it('空列表 ⇒ 总高 0（`Math.max(...[])` 是 -Infinity，靠 `Math.max(0, …)` 兜）', () => {
    const [positions, totalHeight] = computeItemPositions([], 3, 8);

    expect(positions.size).toBe(0);
    expect(totalHeight).toBe(0);
  });

  it('单列 ⇒ 全部串起来（top 是前缀和）', () => {
    const [positions, totalHeight] = computeItemPositions(
      [
        ['a', 10],
        ['b', 20],
        ['c', 30],
      ],
      1,
      5,
    );

    expect(positions.get('a')?.top).toBe(0);
    expect(positions.get('b')?.top).toBe(15);
    expect(positions.get('c')?.top).toBe(40);
    // 最后一列累计到 75，再减掉一个间距 ⇒ 70
    expect(totalHeight).toBe(70);
  });
});

describe('resolveColumnCount（L1）', () => {
  it('没给 ⇒ 3', () => {
    expect(resolveColumnCount(undefined, {})).toBe(DEFAULT_COLUMN_COUNT);
  });

  it('🚨 `columns={0}` 也走「没给」分支（判据是 **falsy**）⇒ 3，不是 0', () => {
    expect(resolveColumnCount(0, {})).toBe(3);
  });

  it('数字 ⇒ 直接用', () => {
    expect(resolveColumnCount(4, {})).toBe(4);
  });

  it('🚨 响应式对象：按 `responsiveArray` **从大到小**取第一个命中的断点', () => {
    // 屏幕同时命中 sm 与 xs ⇒ 取 sm（大者优先）
    expect(resolveColumnCount({ xs: 1, sm: 2, md: 3 }, { sm: true, xs: true })).toBe(2);
    // 只命中 md ⇒ 取 md
    expect(resolveColumnCount({ xs: 1, sm: 2, md: 3 }, { md: true })).toBe(3);
  });

  it('🚨 一个都没命中 ⇒ `columns.xs ?? 1`（显式 xs 优先于 1）', () => {
    expect(resolveColumnCount({ xs: 2, md: 3 }, {})).toBe(2);
    expect(resolveColumnCount({ md: 3 }, {})).toBe(1);
  });

  it('命中但该断点的值显式是 `undefined` ⇒ 继续往下找', () => {
    // sm 命中但没给值 ⇒ 落到 xs
    expect(resolveColumnCount({ xs: 1, sm: undefined }, { sm: true })).toBe(1);
  });
});

// ===========================================================================
// L2 · 组件接线（jsdom）
// ===========================================================================

/** 读 `data-height` 决定高度（照抄上游 mock 的判据）。 */
const rectOf = (el: HTMLElement): DOMRect => {
  const record = el.querySelector<HTMLElement>('.bamboo');
  const raw = record?.getAttribute('data-height');
  const height = raw ? Number(raw) : 100;
  return {
    height,
    width: 100,
    top: 0,
    left: 0,
    right: 100,
    bottom: height,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect;
};

/** 固定尺寸的 item 内容（`data-height` 就是 mock 的输入）。 */
const Bamboo = defineComponent({
  name: 'Bamboo',
  props: {
    height: { type: Number, required: true },
    label: { type: String, default: '' },
  },
  setup(props) {
    return () =>
      h(
        'div',
        {
          class: 'bamboo',
          'data-height': String(props.height),
          style: { height: `${props.height}px` },
        },
        props.label,
      );
  },
});

const buildItems = (heights: number[]) =>
  heights.map((height, index) => ({ key: `item-${index}`, data: height }));

/** 等两帧 + 跑掉 raf（`collectItemSize` 是 raf 去抖的）。 */
const flushMasonry = async (): Promise<void> => {
  await nextTick();
  await nextTick();
  vi.advanceTimersByTime(20);
  await nextTick();
  await nextTick();
};

/** 挂载 + 跑完「一拍延迟」与 raf 去抖。 */
const mountMasonry = async (props: Record<string, unknown> = {}) => {
  const wrapper = mount(Masonry, {
    props: {
      columns: 3,
      items: buildItems(HEIGHTS),
      /**
       * ⚠️ 入参类型必须是 `MasonryItemRenderInfo<unknown>` —— 组件的 props 用
       * **非泛型默认实例化**（`unknown`），而函数参数是**逆变**的：
       * 写窄成 `{ data: number }` 会编译不过（TS2322）。要窄化就在函数体里 `Number(...)`。
       */
      itemRender: (info: MasonryItemRenderInfo<unknown>) =>
        h(Bamboo, { height: Number(info.data), label: String(info.index + 1) }),
      ...props,
    },
    attachTo: document.body,
  });
  await flushMasonry();
  return wrapper;
};

describe('Masonry（L2）', () => {
  beforeAll(() => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      return rectOf(this);
    });
  });

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('根类名：`apollo-masonry` + `-css-var`（无 rtl）', async () => {
    const w = await mountMasonry();
    const root = w.find(`.${P}`);

    expect(root.exists()).toBe(true);
    expect(root.classes()).toContain(`${P}-css-var`);
    expect(root.classes()).not.toContain(`${P}-rtl`);
    w.unmount();
  });

  it('每个 item 一个 `.apollo-masonry-item`，且**内容优先于 `itemRender`**', async () => {
    const w = await mountMasonry({
      items: [
        { key: 'a', data: 1, children: h('div', { class: 'from-children' }) },
        { key: 'b', data: 2 },
      ],
    });

    expect(w.findAll(`.${P}-item`)).toHaveLength(2);
    // 第一个有 children ⇒ 不调 itemRender
    expect(w.find('.from-children').exists()).toBe(true);
    expect(w.findAll('.bamboo')).toHaveLength(1);
    w.unmount();
  });

  it('量测后：根高 = 480px，item 拿到 `--item-width` / 列偏移 / `top`', async () => {
    const w = await mountMasonry();
    const root = w.find(`.${P}`);

    expect(root.attributes('style')).toContain('height: 480px');

    const items = w.findAll(`.${P}-item`);
    expect(items).toHaveLength(HEIGHTS.length);

    const first = items[0]?.attributes('style') ?? '';
    // ① 组件作用域变量（`--{rootPrefixCls}-masonry-item-width`）
    expect(first).toContain('--apollo-masonry-item-width');
    // ② 列偏移用 `var()` 引用它
    expect(first).toContain('inset-inline-start');
    // ③ 🚨 数字必须带 px（Vue 不补单位）
    expect(first).toContain('top: 0px');
    expect(first).toContain('position: absolute');

    // 第 2 个（idx 1）落在第 1 列 ⇒ 偏移 1 个宽度
    expect(items[1]?.attributes('style')).toContain('* 1)');
    w.unmount();
  });

  it('`layoutChange` 事件与 `onLayoutChange` prop **同时**发出，载荷是 `{...item, column}`', async () => {
    const onLayoutChange = vi.fn();
    const w = await mountMasonry({ onLayoutChange });

    const emitted = w.emitted('layoutChange') ?? [];
    expect(emitted).toHaveLength(1);
    expect(onLayoutChange).toHaveBeenCalledTimes(1);

    const payload = emitted[0]?.[0] as { key: string; column: number; data: number }[];
    expect(payload).toHaveLength(HEIGHTS.length);
    // ① 载荷里 **item 本体被展开**（key / data 都在）
    expect(payload[0]).toMatchObject({ key: 'item-0', data: 150, column: 0 });
    // ② 与 prop 回调拿到的是同一份
    expect(onLayoutChange).toHaveBeenCalledWith(payload);
    w.unmount();
  });

  it('不传 `onLayoutChange` ⇒ 一次都不发（上游两段 effect 都先判它）', async () => {
    const w = await mountMasonry();

    expect(w.emitted('layoutChange')).toBeUndefined();
    w.unmount();
  });

  it('空 items 不崩，且根高 0px', async () => {
    const w = await mountMasonry({ items: [] });

    expect(w.findAll(`.${P}-item`)).toHaveLength(0);
    expect(w.find(`.${P}`).attributes('style')).toContain('height: 0px');
    w.unmount();
  });

  it('`rtl` 由 ConfigProvider 的 direction 决定', async () => {
    const w = mount(ConfigProvider, {
      props: { direction: 'rtl' },
      slots: { default: () => h(Masonry, { items: [] }) },
      attachTo: document.body,
    });
    await flushMasonry();

    expect(w.find(`.${P}`).classes()).toContain(`${P}-rtl`);
    w.unmount();
  });

  it('`fresh` ⇒ 每个 item 都挂观察者（jsdom 无 ResizeObserver ⇒ 静默降级不报错）', async () => {
    const w = await mountMasonry({ fresh: true });

    expect(w.findAll(`.${P}-item`)).toHaveLength(HEIGHTS.length);
    w.unmount();
  });

  /**
   * 🚨 这条**替代了 L4 的 `keepStyle`**（那里关掉了内联样式比对，见 `semantic.test.ts` 的说明）。
   *
   * 上游的根样式是 `{ height: totalHeight, ...mergedStyles.root }` ——
   * **`height` 在前、用户的 `styles.root` 在后**（用户的能覆盖高度）。
   * 顺序反了不会有任何报错，只是「用户设的高度不生效」。
   */
  it('根样式顺序：`height` 在前、用户 `styles.root` 在后（后者可覆盖）', async () => {
    const w = await mountMasonry({
      styles: { root: { height: '999px', border: '1px solid red' } },
    });
    const style = w.find(`.${P}`).attributes('style') ?? '';

    expect(style).toContain('height: 999px');
    expect(style).not.toContain('height: 0px');
    // 用户的两条都在，且 `height` 只出现一次（没有被拼成两条冲突声明）
    expect(style.match(/height/g)).toHaveLength(1);
    w.unmount();
  });

  it('语义化 classNames：`root` / `item` 两个槽都落到 DOM 上', async () => {
    const w = await mountMasonry({
      classNames: { root: 'my-root', item: 'my-item' },
      items: buildItems([10]),
    });

    expect(w.find(`.${P}`).classes()).toContain('my-root');
    expect(w.find(`.${P}-item`).classes()).toContain('my-item');
    w.unmount();
  });
});
