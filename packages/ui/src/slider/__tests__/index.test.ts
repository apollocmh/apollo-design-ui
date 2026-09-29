/**
 * L1 单元 + L2 交互 —— Slider（antd 6.6.4 = 薄壳 + rc-slider@1.1.1 内核）。
 *
 * 判据来源：`docs/analysis/slider.md`（§3 值域状态机 / §4 几何与量化 / §5 键盘表 /
 * §6 拖拽与点击 / §7 tooltip / §8 DOM）。本文件**逐条**钉这些判据，重心四块：
 *
 * 1. **量化内核**（`describe('useOffset …')`）：`step ∪ marks ∪ {min,max}` 的最近吸附、
 *    `unit` / `dist` 两种位移语义、`pushable` 的四段回推、禁用把手当锚点 ——
 *    这是「拖动时值跳到哪」的全部判据，也是 rc 里最容易写错的一段。
 * 2. **键盘表**（`describe('Slider 键盘表')`）：**Up is plus**、纵向 ttb 反转、Home/End、
 *    PageUp/PageDown 走 ±2 个**候选步**、`keyup` 才 `changeComplete`。
 * 3. **事件链**（`describe('Slider 值域与事件链')`）：`beforeChange` → `update:value`+`change`
 *    → `changeComplete`，以及「点击 mark 不发 beforeChange」这条上游特例。
 * 4. **拖拽**（`describe('Slider 拖拽')`）：jsdom 无布局 ⇒ 手写 `getBoundingClientRect`
 *    （对应 §6 的四方向坐标反算），并断言 `-lock` 类与 `changeComplete`。
 *
 * ── 前缀约定 ───────────────────────────────────────────────────────────────
 * 不传 `prefixCls` 时 `getPrefixCls('slider')` ⇒ `apollo-slider`，子结构是
 * `apollo-slider-rail` 等（无重复段）。
 *
 * ── 这个文件没有证明什么 ────────────────────────────────────────────────────
 *   - 没证明与 antd 的 DOM/像素一致（L4 见 `semantic.test.ts`，L6 见 `tests/visual`）
 *   - 没证明真实指针拖拽的坐标精度（jsdom 用固定 rect 替身）
 *   - 没证明 hover/focus 三态动效（静态帧之外的层，登记在 README 的缺口里）
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h, nextTick, ref } from 'vue';
import type { NormalizedMark } from '../context';
import {
  getClosestEnabledHandleIndex,
  getDisabledBoundaryValues,
  useOffset,
} from '../hooks/use-offset';
import { useRange } from '../hooks/use-range';
import Slider from '../Slider.vue';
import { getDirectionStyle, getIndex, getOffset } from '../util';

const P = 'apollo-slider';

/**
 * 取第 `index` 项（`noUncheckedIndexedAccess` 下的显式化）。
 *
 * ⚠️ 不用 `!`（本仓 `noNonNullAssertion` 会报警）；这里**主动抛错**而不是塞 `undefined`，
 *    这样「用例少建了一个节点」会以清晰的消息失败，而不是在后面某行以 `undefined` 报错。
 */
const at = <T>(list: T[], index: number): T => {
  const item = list[index];
  if (item === undefined) {
    throw new Error(`期望至少有 ${index + 1} 个元素，实际 ${list.length} 个`);
  }
  return item;
};

/** 标准 rect 替身（jsdom 不做布局，`getBoundingClientRect` 恒为 0）。 */
const RECT = {
  left: 0,
  top: 0,
  right: 200,
  bottom: 20,
  width: 200,
  height: 20,
  x: 0,
  y: 0,
  toJSON: () => ({}),
} as DOMRect;

/** 挂一个 Slider 并把容器的 rect 换成 `RECT`。 */
const mountSlider = (props: Record<string, unknown> = {}) => {
  const w = mount(h(Slider as never, { ...props } as never));
  (w.element as HTMLElement).getBoundingClientRect = () => RECT;
  return w;
};

/** 键盘事件：jsdom 的 `which` 是只读 getter ⇒ 必须 defineProperty（VTU 的 trigger 会抛错）。 */
const fireKey = (el: Element, keyCode: number, type: 'keydown' | 'keyup' = 'keydown'): void => {
  const ev = new KeyboardEvent(type, { keyCode, bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'which', { value: keyCode });
  el.dispatchEvent(ev);
};

/** 第 index 个把手（`findAll` 的元素）。 */
const handle = (w: ReturnType<typeof mountSlider>, index = 0) =>
  at(w.findAll(`.${P}-handle`), index);

// ---------------------------------------------------------------------------
// L1 · util
// ---------------------------------------------------------------------------

describe('slider/util（L1）', () => {
  it('getOffset 是线性比例（不 clamp，越界交给调用方）', () => {
    expect(getOffset(0, 0, 100)).toBe(0);
    expect(getOffset(50, 0, 100)).toBe(0.5);
    expect(getOffset(150, 0, 100)).toBe(1.5);
  });

  it('getDirectionStyle 四方向的属性名与 transform 符号逐条不同', () => {
    expect(getDirectionStyle('ltr', 30, 0, 100)).toEqual({
      left: '30%',
      transform: 'translateX(-50%)',
    });
    expect(getDirectionStyle('rtl', 30, 0, 100)).toEqual({
      right: '30%',
      transform: 'translateX(50%)',
    });
    expect(getDirectionStyle('btt', 30, 0, 100)).toEqual({
      bottom: '30%',
      transform: 'translateY(50%)',
    });
    expect(getDirectionStyle('ttb', 30, 0, 100)).toEqual({
      top: '30%',
      transform: 'translateY(-50%)',
    });
  });

  it('getIndex：数组按索引取、单值原样返回', () => {
    expect(getIndex(['a', 'b'], 1)).toBe('b');
    expect(getIndex('a', 3)).toBe('a');
    expect(getIndex(undefined, 0)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// L1 · useOffset（量化内核）
// ---------------------------------------------------------------------------

const markList = (...values: number[]): NormalizedMark[] =>
  values.map((value) => ({ value, label: String(value) }));

/** 造一个 useOffset（它返回纯函数，不需要组件上下文）。 */
const makeOffset = (opts: Partial<Parameters<typeof useOffset>[0]> = {}) =>
  useOffset({
    min: 0,
    max: 100,
    step: 1,
    markList: [],
    allowCross: true,
    pushable: false,
    isHandleDisabled: () => false,
    ...opts,
  });

describe('useOffset · formatValue（L1）', () => {
  it('按 step 对齐并 clamp 到 [min,max]', () => {
    const { formatValue } = makeOffset({ step: 10 });
    expect(formatValue(24)).toBe(20);
    expect(formatValue(26)).toBe(30);
    expect(formatValue(-5)).toBe(0);
    expect(formatValue(999)).toBe(100);
  });

  it('step=null 时只按 marks ∪ {min,max} 吸附', () => {
    const { formatValue } = makeOffset({ step: null, markList: markList(0, 30, 70, 100) });
    expect(formatValue(44)).toBe(30);
    expect(formatValue(55)).toBe(70);
    expect(formatValue(101)).toBe(100);
  });

  it('marks 与 step 同时存在时取更近者（marks 可以压过网格）', () => {
    const { formatValue } = makeOffset({ step: 10, markList: markList(0, 25, 100) });
    expect(formatValue(23)).toBe(25); // 距 20 为 3、距 25 为 2 ⇒ 选 mark
    expect(formatValue(18)).toBe(20); // 距 20 为 2、距 25 为 7 ⇒ 选网格
  });

  it('小数步长用 toFixed 去浮点毛刺', () => {
    const { formatValue } = makeOffset({ step: 0.1 });
    expect(formatValue(0.3)).toBe(0.3);
    expect(formatValue(0.30000000000000004)).toBe(0.3);
  });
});

describe('useOffset · offsetValues（L1）', () => {
  it('unit 模式走「候选步」（step=null 时按 marks）', () => {
    const { offsetValues } = makeOffset({ step: null, markList: markList(0, 30, 70, 100) });
    expect(offsetValues([30], 1, 0).value).toBe(70);
    expect(offsetValues([70], -1, 0).value).toBe(30);
  });

  it('unit 模式的 ±2 走两次候选步（PageUp/PageDown 语义）', () => {
    const { offsetValues } = makeOffset({ step: 10 });
    expect(offsetValues([30], 2, 0).value).toBe(50);
    expect(offsetValues([30], -2, 0).value).toBe(10);
  });

  it("'min' / 'max' 直接到端点", () => {
    const { offsetValues } = makeOffset({ step: 10 });
    expect(offsetValues([30], 'min', 0).value).toBe(0);
    expect(offsetValues([30], 'max', 0).value).toBe(100);
  });

  it('dist 模式按距离吸附（拖拽用）', () => {
    const { offsetValues } = makeOffset({ step: 10 });
    expect(offsetValues([30], 24, 0, 'dist').value).toBe(50); // 目标 54 ⇒ 吸附 50
  });

  it('allowCross=false 时被邻居挤住（不交叉）', () => {
    const { offsetValues } = makeOffset({ step: 1, allowCross: false, pushable: 1 });
    const next = offsetValues([20, 40], 100, 0);
    expect(next.values[0]).toBe(40 - 1);
  });

  it('pushable 是**数字**时把邻居推开（`true` 由组件层归一成 step，见 analysis §3.4）', () => {
    // ⚠️ `useOffset` 收的是**已归一**的 pushable（rc 在 Slider.js 里把 true ⇒ mergedStep）
    const { offsetValues } = makeOffset({ step: 10, pushable: 10 });
    // ⚠️ 数字 offset 在 **unit** 模式是「候选步数」；要移动 20 的距离必须用 `dist` 模式
    const next = offsetValues([20, 40], 20, 0, 'dist');
    expect(next.values[0]).toBe(40);
    expect(next.values[1]).toBe(50);
  });

  it('禁用把手是固定锚点：可动区间被夹在 [锚点±pushGap]', () => {
    const isHandleDisabled = (i: number): boolean => i === 1;
    const { offsetValues } = makeOffset({ step: 10, pushable: 5, isHandleDisabled });
    expect(offsetValues([20, 60], 100, 0).values[0]).toBe(55); // 60 - 5
  });

  it('getDisabledBoundaryValues / getClosestEnabledHandleIndex', () => {
    const disabledIdx = (i: number): boolean => i === 0;
    expect(getDisabledBoundaryValues([20, 60], 1, 0, 100, 5, disabledIdx)).toEqual([25, 100]);
    expect(getClosestEnabledHandleIndex([20, 60], 70, 0, 100, 5, disabledIdx)).toBe(1);
    const allDisabled = (): boolean => true;
    expect(getClosestEnabledHandleIndex([20, 60], 70, 0, 100, 5, allDisabled)).toBe(-1);
  });
});

describe('useRange（L1）', () => {
  it('range 三形态 → 五开关（editable × draggableTrack 互斥）', () => {
    expect(useRange(undefined).rangeEnabled.value).toBe(false);
    expect(useRange(true).rangeEnabled.value).toBe(true);
    expect(useRange(true).rangeEditable.value).toBe(false);

    const editable = useRange({ editable: true, minCount: 2, maxCount: 5 });
    expect(editable.rangeEnabled.value).toBe(true);
    expect(editable.rangeEditable.value).toBe(true);
    expect(editable.minCount.value).toBe(2);
    expect(editable.maxCount.value).toBe(5);

    expect(useRange({ editable: true, draggableTrack: true }).rangeDraggableTrack.value).toBe(
      false,
    );
  });
});

// ---------------------------------------------------------------------------
// L2 · 渲染结构
// ---------------------------------------------------------------------------

describe('Slider 渲染（L2）', () => {
  it('默认：root + rail + track + step + handle（无 marks 时不渲染 -mark）', () => {
    const w = mountSlider({ defaultValue: 30 });
    expect(w.classes()).toContain(P);
    expect(w.classes()).toContain(`${P}-horizontal`);
    expect(w.find(`.${P}-rail`).exists()).toBe(true);
    expect(w.find(`.${P}-track`).exists()).toBe(true);
    expect(w.find(`.${P}-step`).exists()).toBe(true);
    expect(w.find(`.${P}-mark`).exists()).toBe(false);
  });

  it('track 的位置与宽度按比例', () => {
    const w = mountSlider({ defaultValue: 30 });
    const style = w.find(`.${P}-track`).attributes('style') ?? '';
    expect(style).toContain('left: 0%');
    expect(style).toContain('width: 30%');
  });

  it('startPoint 改变轨道起点', () => {
    const w = mountSlider({ defaultValue: 60, startPoint: 20 });
    expect(w.find(`.${P}-track`).attributes('style') ?? '').toContain('left: 20%');
  });

  it('included=false / track=false 都不渲染已选轨道', () => {
    expect(mountSlider({ defaultValue: 30, included: false }).find(`.${P}-track`).exists()).toBe(
      false,
    );
    expect(mountSlider({ defaultValue: 30, track: false }).find(`.${P}-track`).exists()).toBe(
      false,
    );
  });

  it('null 值不渲染轨道也不渲染把手（rc：values.length===0）', () => {
    const w = mountSlider({ value: null });
    expect(w.find(`.${P}-track`).exists()).toBe(false);
    expect(w.findAll(`.${P}-handle`).length).toBe(0);
  });

  it('range：两个把手 + 序号类 + 单段轨道', () => {
    const w = mountSlider({ range: true, defaultValue: [20, 60] });
    expect(w.findAll(`.${P}-handle`).length).toBe(2);
    expect(w.find(`.${P}-handle-1`).exists()).toBe(true);
    expect(w.find(`.${P}-handle-2`).exists()).toBe(true);
    expect(w.findAll(`.${P}-track`).length).toBe(1);
    expect(w.find(`.${P}-track`).attributes('style') ?? '').toContain('width: 40%');
  });

  it('marks 归一：过滤 falsy、按值升序、label=0 保留、乱序入参', async () => {
    const w = mountSlider({
      defaultValue: 30,
      marks: { 100: '100', 0: 0, 50: { label: 'mid' }, 30: '' },
    });
    await nextTick();
    expect(w.findAll(`.${P}-mark-text`).map((n) => n.text())).toEqual(['0', 'mid', '100']);
    expect(w.classes()).toContain(`${P}-with-marks`);
  });

  it('dots：按 step 铺满 0..100', () => {
    const w = mountSlider({ defaultValue: 0, dots: true, step: 10 });
    expect(w.findAll(`.${P}-dot`).length).toBe(11);
  });

  it('vertical：根类 + aria-orientation + 位置走 bottom', () => {
    const w = mountSlider({ orientation: 'vertical', defaultValue: 40 });
    expect(w.classes()).toContain(`${P}-vertical`);
    expect(handle(w).attributes('aria-orientation')).toBe('vertical');
    expect(handle(w).attributes('style') ?? '').toContain('bottom: 40%');
  });

  it('reverse：横向走 rtl（right + translateX(50%)）', () => {
    const style =
      handle(mountSlider({ reverse: true, defaultValue: 40 })).attributes('style') ?? '';
    expect(style).toContain('right: 40%');
    expect(style).toContain('translateX(50%)');
  });

  it('把手 ARIA 全套', () => {
    const w = mountSlider({
      defaultValue: 30,
      ariaLabelForHandle: ['音量'],
      ariaRequired: true,
      ariaValueTextFormatterForHandle: (v: number) => `${v} 分`,
    });
    const el = handle(w);
    expect(el.attributes('role')).toBe('slider');
    expect(el.attributes('aria-valuemin')).toBe('0');
    expect(el.attributes('aria-valuemax')).toBe('100');
    expect(el.attributes('aria-valuenow')).toBe('30');
    expect(el.attributes('aria-label')).toBe('音量');
    expect(el.attributes('aria-required')).toBe('true');
    expect(el.attributes('aria-valuetext')).toBe('30 分');
    expect(el.attributes('tabindex')).toBe('0');
  });

  it('数组形态的逐把手 props 按索引取', () => {
    const w = mountSlider({
      range: true,
      defaultValue: [20, 60],
      tabIndex: [0, -1],
      ariaLabelForHandle: ['起', '止'],
      ariaValueTextFormatterForHandle: [(v: number) => `起${v}`, (v: number) => `止${v}`],
    });
    expect(handle(w, 0).attributes('aria-label')).toBe('起');
    expect(handle(w, 1).attributes('aria-label')).toBe('止');
    expect(handle(w, 1).attributes('tabindex')).toBe('-1');
    expect(handle(w, 1).attributes('aria-valuetext')).toBe('止60');
  });
});

// ---------------------------------------------------------------------------
// L2 · 值 / 事件链
// ---------------------------------------------------------------------------

describe('Slider 值域与事件链（L2）', () => {
  it('非受控：键盘改值后 DOM 跟着走', async () => {
    const w = mountSlider({ defaultValue: 30 });
    fireKey(handle(w).element, 39);
    await nextTick();
    expect(handle(w).attributes('aria-valuenow')).toBe('31');
  });

  it('v-model:value：同时发 update:value 与 change（C11）', async () => {
    const value = ref(30);
    const w = mount(h(Slider as never, { value: value.value } as never));
    (w.element as HTMLElement).getBoundingClientRect = () => RECT;
    fireKey(handle(w).element, 39);
    await nextTick();
    expect(w.emitted('update:value')?.[0]).toEqual([31]);
    expect(w.emitted('change')?.[0]).toEqual([31]);
  });

  it('受控：DOM 不自己动，但事件照发（由父级决定回写）', async () => {
    const w = mountSlider({ value: 30 });
    fireKey(handle(w).element, 39);
    await nextTick();
    expect(handle(w).attributes('aria-valuenow')).toBe('30');
    expect(w.emitted('change')?.[0]).toEqual([31]);
  });

  it('事件链顺序：beforeChange → change → （keyup）changeComplete', async () => {
    const w = mountSlider({ defaultValue: 30 });
    fireKey(handle(w).element, 39);
    await nextTick();
    expect(w.emitted('beforeChange')).toBeTruthy();
    expect(w.emitted('change')).toBeTruthy();
    expect(w.emitted('changeComplete')).toBeFalsy();

    fireKey(handle(w).element, 39, 'keyup');
    await nextTick();
    expect(w.emitted('changeComplete')?.[0]).toEqual([31]);
  });

  it('range 的载荷是数组；单把手是数字', async () => {
    const single = mountSlider({ defaultValue: 30 });
    fireKey(handle(single).element, 39);
    await nextTick();
    expect(single.emitted('change')?.[0]).toEqual([31]);

    const range = mountSlider({ range: true, defaultValue: [20, 60] });
    fireKey(handle(range, 1).element, 39);
    await nextTick();
    expect(range.emitted('change')?.[0]).toEqual([[20, 61]]);
  });

  it('同值不重复触发 change', async () => {
    const w = mountSlider({ defaultValue: 100 });
    fireKey(handle(w).element, 39);
    await nextTick();
    expect(w.emitted('change')).toBeFalsy();
  });

  it('range 的把手数由 count / value 决定（rc：`if (count || value === undefined)` 才补齐）', () => {
    // 受控给了明确的 [50] ⇒ **不补**，只有 1 个把手
    expect(mountSlider({ range: true, value: [50] }).findAll(`.${P}-handle`).length).toBe(1);
    // count=3 ⇒ 4 个把手（不足用最后一个值补齐）
    const counted = mountSlider({ range: true, count: 3, value: [10] });
    expect(counted.findAll(`.${P}-handle`).length).toBe(4);
    // 未传 value（非受控且无 defaultValue）⇒ 默认补到 2 个
    expect(mountSlider({ range: true }).findAll(`.${P}-handle`).length).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// L2 · 键盘表
// ---------------------------------------------------------------------------

describe('Slider 键盘表（L2）', () => {
  const payloadOf = async (
    keyCode: number,
    props: Record<string, unknown> = {},
  ): Promise<unknown> => {
    const w = mountSlider({ defaultValue: 50, ...props });
    fireKey(handle(w).element, keyCode);
    await nextTick();
    return w.emitted('change')?.[0]?.[0];
  };

  it('← / → 是 ∓1（横向 ltr）', async () => {
    expect(await payloadOf(39)).toBe(51);
    expect(await payloadOf(37)).toBe(49);
  });

  it('↑ is plus / ↓ is minus；纵向 reverse（ttb）时反转', async () => {
    expect(await payloadOf(38)).toBe(51);
    expect(await payloadOf(40)).toBe(49);
    expect(await payloadOf(38, { orientation: 'vertical' })).toBe(51);
    expect(await payloadOf(38, { orientation: 'vertical', reverse: true })).toBe(49);
  });

  it('横向 reverse：→ 变 -1', async () => {
    expect(await payloadOf(39, { reverse: true })).toBe(49);
  });

  it('Home → min / End → max', async () => {
    expect(await payloadOf(36)).toBe(0);
    expect(await payloadOf(35)).toBe(100);
  });

  it('PageUp / PageDown = ±2 个候选步', async () => {
    expect(await payloadOf(33)).toBe(52);
    expect(await payloadOf(34)).toBe(48);
    expect(await payloadOf(33, { step: 10 })).toBe(70); // ±20
  });

  it('step=null 时 PageUp 走两个 mark', async () => {
    expect(
      await payloadOf(33, {
        step: null,
        marks: { 0: 'a', 20: 'b', 40: 'c', 60: 'd' },
        defaultValue: 20,
      }),
    ).toBe(60);
  });

  it('keyboard=false：方向键不响应，但把手仍可聚焦', async () => {
    const w = mountSlider({ defaultValue: 50, keyboard: false });
    fireKey(handle(w).element, 39);
    await nextTick();
    expect(w.emitted('change')).toBeFalsy();
    expect(handle(w).attributes('tabindex')).toBe('0');
  });

  it('禁用把手不响应键盘', async () => {
    const w = mountSlider({ range: true, defaultValue: [20, 60], disabled: [true, false] });
    fireKey(handle(w, 0).element, 39);
    await nextTick();
    expect(w.emitted('change')).toBeFalsy();
    expect(handle(w, 0).attributes('tabindex')).toBeUndefined();
  });

  it('Backspace/Delete 删除（仅 editable）；keyboard=false 时也不响应', async () => {
    const w = mountSlider({ range: { editable: true }, defaultValue: [10, 50, 90] });
    fireKey(handle(w, 1).element, 46);
    await nextTick();
    expect(w.emitted('change')?.[0]).toEqual([[10, 90]]);

    const kbOff = mountSlider({
      range: { editable: true },
      defaultValue: [10, 50, 90],
      keyboard: false,
    });
    fireKey(handle(kbOff, 1).element, 8);
    await nextTick();
    expect(kbOff.emitted('change')).toBeFalsy();
  });

  it('minCount 下限：到下限后删除无效', async () => {
    const w = mountSlider({ range: { editable: true, minCount: 2 }, defaultValue: [10, 50] });
    fireKey(handle(w, 1).element, 8);
    await nextTick();
    expect(w.emitted('change')).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// L2 · 点击与拖拽
// ---------------------------------------------------------------------------

describe('Slider 点击轨道（L2）', () => {
  it('点最左侧：吸附到 min + 发 beforeChange + 进入拖拽', async () => {
    const w = mountSlider({ defaultValue: 30 });
    w.find(`.${P}-rail`).element.dispatchEvent(
      new MouseEvent('mousedown', { clientX: 0, clientY: 5, bubbles: true }),
    );
    await nextTick();
    // ⚠️ rc 的 `changeToCloseValue` 里 `onBeforeChange(nextValue)` 发的是**新值**（不是旧值）
    expect(w.emitted('beforeChange')?.[0]).toEqual([0]);
    expect(w.emitted('change')?.[0]).toEqual([0]);
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  });

  it('点轨道吸附到最近的 mark', async () => {
    const w = mountSlider({ defaultValue: 0, step: null, marks: { 0: 'a', 40: 'b', 100: 'c' } });
    w.find(`.${P}-rail`).element.dispatchEvent(
      // 200px 宽、值域 0..100 ⇒ clientX 76 ≈ 38% ⇒ 吸附 40
      new MouseEvent('mousedown', { clientX: 76, clientY: 5, bubbles: true }),
    );
    await nextTick();
    expect(w.emitted('change')?.[0]).toEqual([40]);
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  });

  it('禁用时点轨道无效', async () => {
    const w = mountSlider({ defaultValue: 30, disabled: true });
    w.find(`.${P}-rail`).element.dispatchEvent(
      new MouseEvent('mousedown', { clientX: 0, clientY: 5, bubbles: true }),
    );
    await nextTick();
    expect(w.emitted('change')).toBeFalsy();
  });

  it('点 mark：beforeChange + change + changeComplete 都发（与拖拽的区别只是「不开始拖拽」）', async () => {
    const w = mountSlider({ defaultValue: 0, marks: { 0: 'a', 50: 'b' } });
    await nextTick();
    at(w.findAll(`.${P}-mark-text`), 1).trigger('click');
    await nextTick();
    expect(w.emitted('beforeChange')?.[0]).toEqual([50]);
    expect(w.emitted('change')?.[0]).toEqual([50]);
    expect(w.emitted('changeComplete')?.[0]).toEqual([50]);
    expect(w.classes()).not.toContain(`${P}-lock`); // 没进入拖拽
  });
});

describe('Slider 拖拽（L2）', () => {
  it('把手拖拽：改值 + `-lock` 类 + `-dragging` 类 + mouseup 发 changeComplete', async () => {
    const w = mountSlider({ defaultValue: 30 });
    handle(w).element.dispatchEvent(
      new MouseEvent('mousedown', { clientX: 60, clientY: 10, bubbles: true }),
    );
    await nextTick();
    expect(w.classes()).toContain(`${P}-lock`);
    expect(handle(w).classes()).toContain(`${P}-handle-dragging`);

    // 右移 40px ⇒ +20%（200px 宽、0..100）⇒ 50
    document.dispatchEvent(
      new MouseEvent('mousemove', { clientX: 100, clientY: 10, bubbles: true }),
    );
    await nextTick();
    expect(w.emitted('change')?.at(-1)).toEqual([50]);

    document.dispatchEvent(new MouseEvent('mouseup', { clientX: 100, clientY: 10, bubbles: true }));
    await nextTick();
    expect(w.emitted('changeComplete')?.[0]).toEqual([50]);
    expect(w.classes()).not.toContain(`${P}-lock`);
  });

  it('拖拽结束把焦点交给被拖的把手', async () => {
    // ⚠️ 焦点类断言必须 `attachTo: document.body`：游离树里的元素 `.focus()` 不会成为
    //    `document.activeElement`（jsdom 的硬约束）
    // 用**非受控**：rc 的判据是 `rawValues.lastIndexOf(draggingValue)` —— 受控且父级不回写时
    // 该值不在 rawValues 里，focus 会被跳过（上游同判，所以这里必须非受控）
    const w = mount(h(Slider as never, { defaultValue: 30 } as never), {
      attachTo: document.body,
    });
    (w.element as HTMLElement).getBoundingClientRect = () => RECT;
    handle(w).element.dispatchEvent(
      new MouseEvent('mousedown', { clientX: 60, clientY: 10, bubbles: true }),
    );
    await nextTick();
    document.dispatchEvent(
      new MouseEvent('mousemove', { clientX: 100, clientY: 10, bubbles: true }),
    );
    await nextTick();
    document.dispatchEvent(new MouseEvent('mouseup', { clientX: 100, clientY: 10, bubbles: true }));
    await nextTick();
    expect(document.activeElement?.classList.contains(`${P}-handle`)).toBe(true);
  });

  it('垂直方向：向下拖 10px ⇒ -50%（20px 高、0..100 的 btt）', async () => {
    const w = mountSlider({ orientation: 'vertical', defaultValue: 50 });
    handle(w).element.dispatchEvent(
      new MouseEvent('mousedown', { clientX: 10, clientY: 10, bubbles: true }),
    );
    await nextTick();
    document.dispatchEvent(
      new MouseEvent('mousemove', { clientX: 10, clientY: 15, bubbles: true }),
    );
    await nextTick();
    expect(w.emitted('change')?.at(-1)).toEqual([25]); // -5/20 = -25%
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  });

  it('禁用把手不响应 mousedown', async () => {
    const w = mountSlider({ defaultValue: 30, disabled: true });
    handle(w).element.dispatchEvent(
      new MouseEvent('mousedown', { clientX: 60, clientY: 10, bubbles: true }),
    );
    await nextTick();
    expect(w.classes()).not.toContain(`${P}-lock`);
    expect(w.emitted('change')).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// L2 · 禁用 / tooltip / expose / 自定义把手
// ---------------------------------------------------------------------------

describe('Slider 禁用（L2）', () => {
  it('布尔禁用：根 -disabled + aria-disabled + 不可聚焦', () => {
    const w = mountSlider({ defaultValue: 30, disabled: true });
    expect(w.classes()).toContain(`${P}-disabled`);
    expect(handle(w).attributes('aria-disabled')).toBe('true');
    expect(handle(w).attributes('tabindex')).toBeUndefined();
  });

  it('数组禁用：逐把手生效；「有任一禁用」⇒ 删除与整轨拖拽都关闭', async () => {
    const w = mountSlider({
      range: { editable: true },
      defaultValue: [20, 60],
      disabled: [false, true],
    });
    expect(handle(w, 0).attributes('aria-disabled')).toBe('false');
    expect(handle(w, 1).attributes('aria-disabled')).toBe('true');
    fireKey(handle(w, 0).element, 8);
    await nextTick();
    expect(w.emitted('change')).toBeFalsy();
  });
});

describe('Slider tooltip（L2）', () => {
  /**
   * ⚠️ tooltip 必须 `attachTo: document.body`：浮层走 portal，而 VTU 默认把组件挂在
   *    **游离** 的 div 里 ⇒ 触发元素不在文档中，popup 不会渲染（tooltip 的测试同判）。
   */
  const mountTip = (props: Record<string, unknown> = {}) =>
    mount(h(Slider as never, { ...props } as never), { attachTo: document.body });

  it('formatter=null ⇒ 永不显示', async () => {
    const w = mountTip({ defaultValue: 30, formatter: null });
    await nextTick();
    await nextTick();
    expect(document.body.textContent ?? '').not.toContain('30');
    w.unmount();
  });

  it('tooltip.open=true ⇒ 内容可见（默认 formatter 把数字转字符串）', async () => {
    const w = mountTip({ defaultValue: 30, tooltip: { open: true } });
    await nextTick();
    await nextTick();
    expect(document.body.textContent ?? '').toContain('30');
    w.unmount();
  });

  it('tooltip.open=false 锁定关闭：hover 也不显示', async () => {
    const w = mountTip({ defaultValue: 30, tooltip: { open: false } });
    await nextTick();
    handle(w).element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(document.body.textContent ?? '').not.toContain('30');
    w.unmount();
  });

  it('自定义 formatter 生效', async () => {
    const w = mountTip({
      defaultValue: 30,
      tooltip: { open: true },
      formatter: (v?: number) => `${v}% 音量`,
    });
    await nextTick();
    await nextTick();
    expect(document.body.textContent ?? '').toContain('30% 音量');
    w.unmount();
  });
});

describe('Slider expose（L2）', () => {
  it('focus() 聚焦第一个把手，blur() 让它失焦', async () => {
    const w = mount(h(Slider as never, { defaultValue: 30 } as never), {
      attachTo: document.body,
    });
    (w.vm as unknown as { focus: () => void }).focus();
    await nextTick();
    expect(document.activeElement?.classList.contains(`${P}-handle`)).toBe(true);
    (w.vm as unknown as { blur: () => void }).blur();
    await nextTick();
    expect(document.activeElement?.classList.contains(`${P}-handle`)).toBe(false);
  });
});

describe('Slider 开发期告警（L2）', () => {
  it('editable × draggableTrack 互斥 ⇒ 告警且 draggableTrack 被关掉', () => {
    // ⚠️ 本仓的 `warning()` 走 **console.error**（`utils/warning.ts:76`），不是 console.warn
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { rangeDraggableTrack } = useRange({ editable: true, draggableTrack: true });
      expect(rangeDraggableTrack.value).toBe(false);
      expect(warn.mock.calls.map((c) => String(c[0])).join('\n')).toContain(
        'editable` can not work with `draggableTrack',
      );
    } finally {
      warn.mockRestore();
    }
  });

  it('vertical 已废弃 ⇒ 告警但功能照旧（走 orientation 归一）', () => {
    // 组件里手写的告警走 console.warn（antd 的 deprecated 是另一条通道）
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const w = mountSlider({ vertical: true, defaultValue: 40 });
      expect(w.classes()).toContain(`${P}-vertical`);
      expect(warn.mock.calls.map((c) => String(c[0])).join('\n')).toContain(
        '`vertical` is deprecated',
      );
    } finally {
      warn.mockRestore();
    }
  });

  it('draggableTrack × step=null ⇒ 关掉并告警', () => {
    // 组件里手写的告警走 console.warn（与本文件的 vertical 用例同通道）
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const w = mountSlider({
        range: { draggableTrack: true },
        step: null,
        defaultValue: [20, 60],
      });
      // 轨道不可拖 ⇒ 没有 -track-draggable 类
      expect(w.find(`.${P}-track-draggable`).exists()).toBe(false);
      expect(warn.mock.calls.map((c) => String(c[0])).join('\n')).toContain(
        '`draggableTrack` is not supported when `step` is `null`',
      );
    } finally {
      warn.mockRestore();
    }
  });
});

describe('Slider 自定义把手（L2）', () => {
  it('#handle 槽替换把手节点（能拿到 nodeProps / className / style）', () => {
    const w = mount(h(Slider as never, { defaultValue: 30 } as never), {
      slots: {
        handle: (info: { value?: number; className: string }) =>
          h('div', { class: `${info.className} custom`, 'data-value': info.value }),
      },
    });
    expect(w.find(`.${P}-handle`).classes()).toContain('custom');
    expect(w.find(`.${P}-handle`).attributes('data-value')).toBe('30');
  });
});
