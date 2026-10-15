/**
 * Issue #52 · [Masonry] 原地修改 items 的布局同步（运行时验证 → 已修复）
 *
 * ── 上游判据（antd 6.6.4 `es/masonry/Masonry.js:55-58`）─────────────────────
 * ```js
 * const [mergedItems, setMergedItems] = React.useState([]);
 * React.useEffect(() => { setMergedItems(items || []); }, [items]);
 * ```
 * `[items]` 是**引用比较** ⇒ 原地 `push` / `splice` 不重跑 effect ⇒ **完全不更新**。
 *
 * ── 本仓修复前的**半更新态**（比上游更糟）────────────────────────────────────
 * `mergedItems` 存的就是调用方那个响应式数组本身，而 `motionKeys` 是
 * `mergedItems.value.map(...)` —— 遍历会读到数组的 `length` ⇒ **DOM 跟着多渲染
 * 出 item**；但 `watch([mergedItems, columnCount], collectItemSize)` 因**引用未变**
 * 不重测量 ⇒ 新 item **没有位置**（`top: undefined`、列号 0，视觉上堆在左上角），
 * 且 `collectLayout` 要求「**全部** item 都有位置」才写 `itemColumns`
 * ⇒ `onLayoutChange` 停在旧载荷。
 *
 * ⇒ 按「对齐 Ant Design ≠ 复制 Ant Design 的缺陷」翻案为真缺陷：上游是「不更新」，
 *    本仓是「**DOM 更新了但布局没更新**」，属本仓自造的中间态。
 *
 * ── 修复（两条配套，缺一不可）──────────────────────────────────────────────
 * 1. **依赖探针** `itemsSignature()`：逐条读 `length` / `key` / `column` 建立响应式
 *    依赖，返回**字符串签名**（内容相同 ⇒ 字符串相同 ⇒ `Object.is` 判定未变 ⇒ 不触发）。
 *    ⚠️ 刻意**不用** `{ deep: true }` —— `item.children` 是 `VNodeChild`（递归类型、
 *    含 `el`/`component` 等成环引用），深遍历既贵又危险。
 * 2. **赋值拷贝** `[...props.items]`：原地变更时 `props.items` 与 `mergedItems.value`
 *    是同一个数组 ⇒ 直接赋值等于赋同一个引用 ⇒ 量测链条**仍然不触发**。
 *
 * 保留的边界（非缺陷）：`children` / `data` 变化 ⇒ 走 `fresh`（item 级
 * ResizeObserver），上游同判；**普通（非响应式）数组**没有数据源，物理上不可追踪。
 */

import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, reactive, ref } from 'vue';

import Masonry from '../Masonry.vue';

const P = 'apollo-masonry';

/**
 * ⚠️ 刻意用 `unknown[]` 而不是 `MasonryItemType[]`：后者的 `children` 是 `VNodeChild`
 * （递归类型），在 `[...items.value, {...}]` 这种表达里会让 tsc 报
 * TS2589「Type instantiation is excessively deep」。
 */
const ITEMS = (): unknown[] => [
  { key: 'a', data: 1 },
  { key: 'b', data: 2 },
];

/**
 * 等若干帧 + 跑掉 raf 去抖（`collectItemSize` / `collectLayout` 都挂在 raf 节流上，
 * 一次 20ms 不够 —— 断言以 `onLayoutChange` 载荷为准，它才是「布局已同步」的公开契约）。
 */
const flush = async (): Promise<void> => {
  for (let i = 0; i < 3; i += 1) {
    await nextTick();
    vi.advanceTimersByTime(50);
  }
  await nextTick();
};

const itemCount = (w: ReturnType<typeof mount>) => w.findAll(`.${P}-item`).length;

/** `onLayoutChange` 最近一次的载荷长度（移除场景里 DOM 计数受退场动效干扰，用它才稳）。 */
const lastLayoutLength = (fn: ReturnType<typeof vi.fn>): number | undefined =>
  fn.mock.calls.at(-1)?.[0]?.length as number | undefined;

/** `onLayoutChange` 最近一次载荷里各 item 的 `key`（顺序即 items 顺序）。 */
const lastLayoutKeys = (fn: ReturnType<typeof vi.fn>): unknown[] =>
  (fn.mock.calls.at(-1)?.[0] as Array<{ key: unknown }> | undefined)?.map((i) => i.key) ?? [];

/**
 * 各 item 的 `top` 内联样式。
 *
 * 🚨 这是「视觉不错位」的直接探针：未量测到位置的 item 是 `top: undefined`
 * ⇒ `toCssSize` 不产出 ⇒ **没有 `top` 样式**（堆在容器左上角）。
 * ⚠️ jsdom 的 `getBoundingClientRect` 恒为 0 ⇒ 已排布的 item 一律 `top: 0px`。
 */
const itemTops = (w: ReturnType<typeof mount>): string[] =>
  w.findAll(`.${P}-item`).map((el) => (el.element as HTMLElement).style.top);

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('Masonry · Issue #52 items 更新契约', () => {
  it('[A] 换成**新数组** ⇒ 重新量测 / 重排 / onLayoutChange（契约）', async () => {
    const onLayoutChange = vi.fn();
    const items = ref<unknown[]>(ITEMS());

    const wrapper = mount(
      defineComponent({
        name: 'Host',
        // ⚠️ `as never`：`Masonry` 的 props 是非泛型默认实例化（`unknown`），
        //    传具体 item 类型会触发 TS2589「instantiation excessively deep」
        setup: () => () => h(Masonry, { items: items.value as never, columns: 2, onLayoutChange }),
      }),
      { attachTo: document.body },
    );
    await flush();
    expect(itemCount(wrapper)).toBe(2);

    items.value = [...items.value, { key: 'c', data: 3 }];
    await flush();

    expect(itemCount(wrapper)).toBe(3);
    expect(onLayoutChange).toHaveBeenCalled();
    expect(lastLayoutLength(onLayoutChange)).toBe(3);

    // 内容相同的新数组（引用变了）也走一遍
    items.value = [...items.value];
    await flush();
    expect(itemCount(wrapper)).toBe(3);

    wrapper.unmount();
  });

  it('[B] **`reactive` 数组原地 push ⇒ 布局与 DOM 同样跟到 3**（修复前是半更新）', async () => {
    const arr = reactive<unknown[]>(ITEMS());
    const onLayoutChange = vi.fn();
    const wrapper = mount(Masonry, {
      props: { items: arr as never, columns: 2, onLayoutChange },
      attachTo: document.body,
    });
    await flush();
    expect(itemCount(wrapper)).toBe(2);
    expect(lastLayoutLength(onLayoutChange)).toBe(2);

    arr.push({ key: 'c', data: 3 });
    await flush();

    // ① DOM 列表跟随
    expect(itemCount(wrapper)).toBe(3);
    // ② 🚨 布局回调**也必须**跟到 3 —— 修复前是 2：
    //    `collectLayout` 要求「全部 item 都有位置」，新 item 没位置 ⇒ 整轮不写
    //    `itemColumns` ⇒ 回调停在旧载荷（Issue #52 的核心断言）
    expect(lastLayoutLength(onLayoutChange)).toBe(3);
    // ③ 每个 item 都有 `top`（没有 ⇒ 该 item 未参与排布 ⇒ 视觉堆在左上角）
    expect(itemTops(wrapper)).toHaveLength(3);
    expect(itemTops(wrapper).filter((t) => t === '')).toEqual([]);

    wrapper.unmount();
  });

  it('[B2] `reactive` 数组原地 splice（删除）⇒ 布局载荷跟随', async () => {
    const arr = reactive<unknown[]>(ITEMS());
    const onLayoutChange = vi.fn();
    const wrapper = mount(Masonry, {
      props: { items: arr as never, columns: 2, onLayoutChange },
      attachTo: document.body,
    });
    await flush();
    expect(lastLayoutLength(onLayoutChange)).toBe(2);

    arr.splice(0, 1); // 删掉 'a'
    await flush();

    // ⚠️ 不用 DOM 计数断言移除：`MotionList` 的退场动效在 jsdom 里不会结束
    //    （MEMORY/PITFALLS 已记），离开的节点会留在 DOM 里。
    expect(lastLayoutKeys(onLayoutChange)).toEqual(['b']);

    wrapper.unmount();
  });

  it('[B3] `reactive` 数组原地 swap ⇒ 载荷顺序跟随（重新排布）', async () => {
    const arr = reactive<unknown[]>(ITEMS());
    const onLayoutChange = vi.fn();
    const wrapper = mount(Masonry, {
      props: { items: arr as never, columns: 2, onLayoutChange },
      attachTo: document.body,
    });
    await flush();
    expect(lastLayoutKeys(onLayoutChange)).toEqual(['a', 'b']);

    // 原地交换（不换引用）—— 上游 `[items]` 引用比较 ⇒ 完全无感
    const tmp = arr[0];
    arr[0] = arr[1];
    arr[1] = tmp;
    await flush();

    expect(lastLayoutKeys(onLayoutChange)).toEqual(['b', 'a']);

    wrapper.unmount();
  });

  it('[B4] 原地改 `item.column`（对象字段）⇒ 重新排布到指定列', async () => {
    const arr = reactive<unknown[]>(ITEMS());
    const onLayoutChange = vi.fn();

    const wrapper = mount(Masonry, {
      props: { items: arr as never, columns: 2, onLayoutChange },
      attachTo: document.body,
    });
    await flush();
    // jsdom 恒高 0 ⇒ 自动排布一律落在第 0 列（`indexOf(min)` 平局取最左）
    const before = (onLayoutChange.mock.calls.at(-1)?.[0] as Array<{ column: number }>) ?? [];
    expect(before.map((i) => i.column)).toEqual([0, 0]);

    // 原地把 'a' 钉到第 1 列
    (arr[0] as { column?: number }).column = 1;
    await flush();

    const after = (onLayoutChange.mock.calls.at(-1)?.[0] as Array<{ column: number }>) ?? [];
    expect(after.map((i) => i.column)).toEqual([1, 0]);

    wrapper.unmount();
  });

  it('[E] 原地修改后布局**收敛**（签名稳定 ⇒ 不反复重排）', async () => {
    const arr = reactive<unknown[]>(ITEMS());
    const onLayoutChange = vi.fn();
    const wrapper = mount(Masonry, {
      props: { items: arr as never, columns: 2, onLayoutChange },
      attachTo: document.body,
    });
    await flush();

    arr.push({ key: 'c', data: 3 });
    await flush();
    const settled = onLayoutChange.mock.calls.length;

    // 再跑三轮：签名未变 ⇒ 不应再产生任何一次布局回调（防「依赖探针」引发自激循环）
    await flush();
    await flush();
    await flush();
    expect(onLayoutChange.mock.calls.length).toBe(settled);

    wrapper.unmount();
  });

  it('[C] **普通（非响应式）数组**原地 push ⇒ 不更新（无数据源，物理边界）', async () => {
    const arr = ITEMS();
    const wrapper = mount(Masonry, {
      props: { items: arr as never, columns: 2 },
      attachTo: document.body,
    });
    await flush();
    expect(itemCount(wrapper)).toBe(2);

    arr.push({ key: 'c', data: 3 });
    await flush();
    // ⚠️ 这是 Vue 响应式的固有边界，不是缺陷：数组不是响应式的 ⇒ 没有任何依赖可建立。
    //    （修复后连「DOM 半更新」也一并消失 —— 因为 `mergedItems` 现在是拷贝，
    //     不再持有调用方的数组。）
    expect(itemCount(wrapper)).toBe(2);

    // 换成新数组立刻恢复同步 —— 证明只是「没有数据源」而不是管线断了
    await wrapper.setProps({ items: arrayOf(arr) as never });
    await flush();
    expect(itemCount(wrapper)).toBe(3);

    wrapper.unmount();
  });

  it('[D] 移除 item（新数组，长度 -1）⇒ onLayoutChange 载荷跟随', async () => {
    // ⚠️ 不用 DOM 计数断言移除：`MotionList` 的退场动效在 jsdom 里不会结束
    //    （MEMORY/PITFALLS 已记），离开的节点会留在 DOM 里。
    const onLayoutChange = vi.fn();
    const items = ref<unknown[]>(ITEMS());
    const wrapper = mount(
      defineComponent({
        name: 'HostRemove',
        // ⚠️ `as never`：`Masonry` 的 props 是非泛型默认实例化（`unknown`），
        //    传具体 item 类型会触发 TS2589「instantiation excessively deep」
        setup: () => () => h(Masonry, { items: items.value as never, columns: 2, onLayoutChange }),
      }),
      { attachTo: document.body },
    );
    await flush();
    expect(lastLayoutLength(onLayoutChange)).toBe(2);

    items.value = items.value.slice(1);
    await flush();

    expect(lastLayoutLength(onLayoutChange)).toBe(1);

    wrapper.unmount();
  });
});

/** 内容相同的新数组（引用不同）。 */
const arrayOf = (arr: unknown[]): unknown[] => arr.slice();
