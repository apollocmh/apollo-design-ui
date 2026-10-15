/**
 * Issue #52 · [Masonry] 原地修改 items 的布局同步（运行时验证）
 *
 * 上游判据（antd 6.6.4 `es/masonry/Masonry.js:120-124`）：
 * ```jsx
 * const [mergedItems, setMergedItems] = useState([]);
 * React.useEffect(() => { setMergedItems(items); }, [items]);
 * ```
 * `[items]` 是**引用比较** ⇒ 原地 `push` / `splice`（同一数组引用）不重跑 effect。
 *
 * 本仓实测（本轮新增用例）：
 *   · **换成新数组** ⇒ 重新量测 / 重排 / `onLayoutChange`（契约，与上游一致）；
 *   · **`reactive` 数组原地 push** ⇒ **会更新** —— 这是 Vue 侧的**超集**：`mergedItems`
 *     存的就是那个代理对象，而 `motionKeys` 是 `mergedItems.value.map(...)`，
 *     遍历会读到 `length` / 各索引 ⇒ 原地变更被追踪（React 无此能力）；
 *   · **普通（非响应式）数组原地 push** ⇒ 不更新（没有响应式来源），与上游「引用比较」同观感。
 *
 * 结论：**不是缺陷，且不需要补订阅** —— 「原地改也生效」在 reactive 数组上已经成立，
 * 在普通数组上本就不可能（没有数据源）。本文件的用例把这个**真实边界**钉住，
 * 避免以后有人照 issue 的措辞去加 `{ deep: true }`（那会与上游行为分叉，且是 O(n) 深遍历）。
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

  it('[B] `reactive` 数组原地 push ⇒ DOM 跟随但 `onLayoutChange` 不跟随（⇒ 请用新数组）', async () => {
    const arr = reactive<unknown[]>(ITEMS());
    const onLayoutChange = vi.fn();
    const wrapper = mount(Masonry, {
      props: { items: arr as never, columns: 2, onLayoutChange },
      attachTo: document.body,
    });
    await flush();
    expect(itemCount(wrapper)).toBe(2);

    arr.push({ key: 'c', data: 3 });
    await flush();

    // ① DOM 列表跟随（Vue 侧超集：`mergedItems` 存的是代理对象，`motionKeys` 的
    //    `.map` 遍历会读到 `length` —— React 无此能力）
    expect(itemCount(wrapper)).toBe(3);
    // ② 但**布局回调不跟随**（`itemColumns` 没被重算，2026-10-15 实测载荷仍是 2）
    //    ⇒ 原地修改**不是**完整的更新路径（上游更是两条都不跟随）
    expect(lastLayoutLength(onLayoutChange)).toBe(2);

    // ③ 换成新数组 ⇒ 两条通道重新对齐（这才是受支持的更新方式）
    await wrapper.setProps({ items: arrayOf(arr) as never });
    await flush();
    expect(lastLayoutLength(onLayoutChange)).toBe(3);

    wrapper.unmount();
  });

  it('[C] **普通（非响应式）数组**原地 push ⇒ 不更新（无响应式来源，与上游观感一致）', async () => {
    const arr = ITEMS();
    const wrapper = mount(Masonry, {
      props: { items: arr as never, columns: 2 },
      attachTo: document.body,
    });
    await flush();
    expect(itemCount(wrapper)).toBe(2);

    arr.push({ key: 'c', data: 3 });
    await flush();
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
