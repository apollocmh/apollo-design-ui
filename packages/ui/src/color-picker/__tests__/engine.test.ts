/**
 * ColorPicker · L1/L2 —— **引擎**的拖拽内核与渲染件（jsdom）。
 *
 * 为什么单独一个文件：引擎（`engine/`）是 registry 指定的 rc 替代层，
 * 它自己就是一块可独立验证的单元（几何 + 拖拽 + 三个渲染件）。
 * antd 层的组件行为在 `index.test.ts`。
 *
 * ⚠️ **jsdom 没有布局** ⇒ 所有矩形恒 0，而 `useColorDrag` 有一条
 * 「手柄非正方形就不派发」的守卫（判据 3）⇒ 用例**必须自己 mock 矩形**
 * （否则整组用例都会「通过」但什么都没测到）。
 *
 * ⚠️ 事件名必须用 **`onMousedown`**（小写 `d`）：Vue 的 `parseName` 会对
 * `on` 之后的部分做 `hyphenate` ⇒ 写成 `onMouseDown` 会得到事件名 `mouse-down`
 * （**永不触发、且不报错**）。本文件末尾有一条**反向哨兵**钉住这条。
 */
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { Color } from '../engine/color';
import { ColorBlock } from '../engine/components/color-block';
import { ColorHandler } from '../engine/components/handler';
import { ColorPalette } from '../engine/components/palette';
import { Picker } from '../engine/components/picker';

const P = 'apollo-cp';
const BLUE = new Color('#1677ff');

/** 造一个假矩形（`getBoundingClientRect` 的返回值）。 */
const rect = (width: number, height: number): DOMRect =>
  ({
    x: 0,
    y: 0,
    width,
    height,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    toJSON: () => ({}),
  }) as DOMRect;

/** 挂一个 Picker，并把「容器 200×200、手柄 10×10」的矩形装好。 */
function mountPicker(extraProps: Record<string, unknown> = {}) {
  const onChange = vi.fn();
  const onChangeComplete = vi.fn();
  const wrapper = mount(Picker, {
    props: { color: BLUE, prefixCls: P, onChange, onChangeComplete, ...extraProps },
    attachTo: document.body,
  });

  const select = wrapper.find(`.${P}-select`).element as HTMLElement;
  const handler = wrapper.find(`.${P}-handler`).element as HTMLElement;
  const transform = handler.parentElement as HTMLElement;
  select.getBoundingClientRect = () => rect(200, 200);
  transform.getBoundingClientRect = () => rect(10, 10);

  return { wrapper, onChange, onChangeComplete, select, transform };
}

/** 派发一个鼠标事件（⚠️ `pageX` 不在 `MouseEventInit` 里，用 `clientX`；滚动为 0 ⇒ 两者同值）。 */
const mouse = (type: string, clientX: number, clientY: number) =>
  new MouseEvent(type, { clientX, clientY, bubbles: true, cancelable: true });

afterEach(() => {
  document.body.innerHTML = '';
});

// ---------------------------------------------------------------------------
// DOM 骨架
// ---------------------------------------------------------------------------

describe('ColorPicker 引擎 · Picker 的 DOM 骨架', () => {
  it('三层结构：`-select` > `-palette` > [手柄的绝对定位包装 + `-saturation`]', () => {
    const { wrapper } = mountPicker();
    const select = wrapper.find(`.${P}-select`);
    expect(select.exists()).toBe(true);
    const palette = select.find(`.${P}-palette`);
    expect(palette.exists()).toBe(true);
    expect(palette.find(`.${P}-handler`).exists()).toBe(true);
    expect(palette.find(`.${P}-saturation`).exists()).toBe(true);
  });

  it('🚨 手柄的包装 div 是**绝对定位 + 百分比偏移 + translate(-50%,-50%)**', () => {
    const { wrapper, transform } = mountPicker();
    expect(transform.style.position).toBe('absolute');
    expect(transform.style.transform).toBe('translate(-50%, -50%)');
    expect(transform.style.zIndex).toBe('1');
    // #1677ff ⇒ hsb = {h:215, s:233/255, b:1} ⇒ 偏移 = {x: 91.37%, y: 0%}
    expect(Number.parseFloat(transform.style.left)).toBeCloseTo((233 / 255) * 100, 2);
    expect(transform.style.top).toBe('0%');
    void wrapper;
  });

  it('手柄底色是 `toRgbString()`，面板底色是 `hsl(h,100%,50%)`（两个量不同）', () => {
    const { wrapper } = mountPicker();
    const handler = wrapper.find(`.${P}-handler`);
    // ⚠️ jsdom（cssstyle）会把 `rgb(22,119,255)` 规范化成**带空格**的形态 ⇒ 断言要按它写
    expect(handler.attributes('style')).toContain('background-color: rgb(22, 119, 255)');
    const sat = wrapper.find(`.${P}-saturation`);
    const satStyle = sat.attributes('style') ?? '';
    // ⚠️ **jsdom 的 cssstyle 会把 `hsl()` / hex 规范化成 `rgb()` / `rgba()`**
    //    （`hsl(215,100%,50%)` → `rgb(0, 106, 255)`，`#000` → `rgb(0, 0, 0)`）
    //    ⇒ 断言写成「两种形态都接受」，真浏览器保留 `hsl()`、jsdom 给 `rgb()`。
    //    判据仍然是**语义**的：面板底色 = 该色相的**满饱和满亮度**版本，不是颜色本身。
    expect(satStyle).toMatch(
      /background-color:\s*(?:hsl\(215,\s*100%,\s*50%\)|rgb\(0,\s*106,\s*255\))/,
    );
    expect(satStyle).toMatch(
      /linear-gradient\(0deg,\s*(?:#000|rgb\(0,\s*0,\s*0\)),\s*transparent\)/,
    );
  });

  it('🚨 面板底色由**色相**驱动（换色相 ⇒ 换底色，而不是跟着颜色本身走）', async () => {
    const { wrapper } = mountPicker();
    const sat = wrapper.find(`.${P}-saturation`);
    // #1677ff 的 h = 215；#ff0000 的 h = 0 ⇒ hsl(0,100%,50%) → rgb(255, 0, 0)
    await wrapper.setProps({ color: new Color('#ff0000') });
    const style = sat.attributes('style') ?? '';
    expect(style).toMatch(/background-color:\s*(?:hsl\(0,\s*100%,\s*50%\)|rgb\(255,\s*0,\s*0\))/);
  });
});

// ---------------------------------------------------------------------------
// 拖拽（核心）
// ---------------------------------------------------------------------------

describe('ColorPicker 引擎 · useColorDrag 的拖拽链', () => {
  it('mousedown ⇒ onChange；mousemove ⇒ 再 onChange；mouseup ⇒ onChangeComplete', async () => {
    const { select, onChange, onChangeComplete } = mountPicker();

    // 按下：x=100 ⇒ offsetX = 100-5 = 95 ⇒ saturation = (95+5)/200 = 0.5；
    //        y=5   ⇒ offsetY = 5-5 = 0   ⇒ bright     = 1-(0+5)/200 = 0.975
    select.dispatchEvent(mouse('mousedown', 100, 5));
    expect(onChange).toHaveBeenCalledTimes(1);
    const first = onChange.mock.calls[0]?.[0] as Color;
    expect(first.toHsb().s).toBeCloseTo(0.5, 10);
    expect(first.toHsb().b).toBeCloseTo(0.975, 10);
    expect(first.toHsb().h).toBe(215);
    // mousedown 阶段**不**发 complete
    expect(onChangeComplete).toHaveBeenCalledTimes(0);

    // 移动：x=195 ⇒ 0.975；y=205 ⇒ 1-200/200 = 0
    document.dispatchEvent(mouse('mousemove', 195, 205));
    expect(onChange).toHaveBeenCalledTimes(2);
    const second = onChange.mock.calls[1]?.[0] as Color;
    expect(second.toHsb().s).toBeCloseTo(0.975, 10);
    expect(second.toHsb().b).toBeCloseTo(0, 10);

    // 抬起 ⇒ complete 拿到的是**拖拽结束那一刻**的颜色（= 第二次的结果）
    document.dispatchEvent(mouse('mouseup', 195, 205));
    expect(onChangeComplete).toHaveBeenCalledTimes(1);
    const done = onChangeComplete.mock.calls[0]?.[0] as Color;
    expect(done.toHsb().s).toBeCloseTo(0.975, 10);
    expect(done.toHsb().b).toBeCloseTo(0, 10);
  });

  it('🚨 mouseup 之后**摘掉** document 监听（再移动不再 onChange）', () => {
    const { select, onChange } = mountPicker();
    select.dispatchEvent(mouse('mousedown', 100, 5));
    document.dispatchEvent(mouse('mouseup', 100, 5));
    const callsAfterUp = onChange.mock.calls.length;
    document.dispatchEvent(mouse('mousemove', 195, 205));
    expect(onChange.mock.calls.length).toBe(callsAfterUp);
  });

  it('🚨 越界坐标被夹到容器内（`Math.max(0, Math.min(pageX - rectX, width))`）', () => {
    const { select, onChange } = mountPicker();
    // 负坐标 ⇒ 夹到 0 ⇒ 偏移 -5 ⇒ saturation = 0/200 = 0
    select.dispatchEvent(mouse('mousedown', -100, -100));
    const c = onChange.mock.calls[0]?.[0] as Color;
    expect(c.toHsb().s).toBe(0);
    expect(c.toHsb().b).toBe(1);
  });

  it('`disabled` ⇒ 按下**不派发** onChange', () => {
    const { select, onChange, onChangeComplete } = mountPicker({ disabled: true });
    select.dispatchEvent(mouse('mousedown', 100, 5));
    expect(onChange).toHaveBeenCalledTimes(0);
    expect(onChangeComplete).toHaveBeenCalledTimes(0);
  });

  it('🚨 手柄**非正方形**时整个不派发（上游的「排除边界情形」守卫）', () => {
    const { wrapper, select, onChange } = mountPicker();
    const handler = wrapper.find(`.${P}-handler`).element as HTMLElement;
    (handler.parentElement as HTMLElement).getBoundingClientRect = () => rect(10, 20);
    select.dispatchEvent(mouse('mousedown', 100, 5));
    expect(onChange).toHaveBeenCalledTimes(0);
  });

  it('🚨 手柄**尺寸为 0**（未布局）时也不派发 —— 这正是 jsdom 的默认状态', () => {
    const { wrapper, onChange } = mountPicker();
    const select = wrapper.find(`.${P}-select`).element as HTMLElement;
    const handler = wrapper.find(`.${P}-handler`).element as HTMLElement;
    (handler.parentElement as HTMLElement).getBoundingClientRect = () => rect(0, 0);
    select.dispatchEvent(mouse('mousedown', 100, 5));
    expect(onChange).toHaveBeenCalledTimes(0);
  });

  it('颜色变化 ⇒ 偏移重算（`watch` 把位置同步回颜色）', async () => {
    const { wrapper, transform } = mountPicker();
    await wrapper.setProps({ color: new Color('#ff0000') });
    // #ff0000 ⇒ hsb = {h:0, s:1, b:1} ⇒ {x: 100%, y: 0%}
    expect(Number.parseFloat(transform.style.left)).toBeCloseTo(100, 2);
    expect(transform.style.top).toBe('0%');
  });
});

// ---------------------------------------------------------------------------
// 三个渲染件
// ---------------------------------------------------------------------------

describe('ColorPicker 引擎 · 渲染件', () => {
  it('`ColorHandler`：`size="small"` 才加 `-handler-sm`', () => {
    const normal = mount(ColorHandler, { props: { color: '#fff', prefixCls: P } });
    expect(normal.classes()).toEqual([`${P}-handler`]);
    const small = mount(ColorHandler, { props: { color: '#fff', prefixCls: P, size: 'small' } });
    expect(small.classes()).toEqual([`${P}-handler`, `${P}-handler-sm`]);
  });

  it('🚨 `ColorBlock`：`style` 落**外层**、`innerStyle` 落**内层**（且与 background 合并）', () => {
    const w = mount(ColorBlock, {
      props: {
        color: 'rgb(1,2,3)',
        prefixCls: P,
        style: { margin: '4px' },
        innerStyle: { opacity: '0.5' },
      },
    });
    expect(w.attributes('style')).toContain('margin: 4px');
    const inner = w.find(`.${P}-color-block-inner`);
    // ⚠️ jsdom 规范化：`rgb(1,2,3)` → `rgb(1, 2, 3)`
    expect(inner.attributes('style')).toContain('background: rgb(1, 2, 3)');
    expect(inner.attributes('style')).toContain('opacity: 0.5');
  });

  it('`ColorPalette`：`position:relative` 可被传入的 style 覆盖（顺序是 `{position, ...style}`）', () => {
    const w = mount(ColorPalette, {
      props: { prefixCls: P, style: { position: 'absolute' } },
      slots: { default: () => h('span', { class: 'kid' }) },
    });
    expect(w.classes()).toEqual([`${P}-palette`]);
    expect(w.attributes('style')).toContain('position: absolute');
    expect(w.find('.kid').exists()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 反向哨兵：事件名大小写
// ---------------------------------------------------------------------------

describe('ColorPicker 引擎 · 事件名大小写的反向哨兵', () => {
  it('🚨 `onMouseDown`（大写 D）会被 Vue 规范化成 `mouse-down` ⇒ **永不触发**', () => {
    // 这条钉住一个**静默**陷阱：`onMouseDown` 不报错、类型也过，只是永远不触发。
    // 本仓 `segmented/README.md:41` 把它的症状记成了「jsdom 不派发 mousedown」——
    // 那是**误诊**（同文件用的是 `onMouseDown`）。见 PITFALLS 323。
    const onRight = vi.fn();
    const onWrong = vi.fn();
    const Right = defineComponent({
      setup: () => () => h('div', { class: 'right', onMousedown: onRight }),
    });
    const Wrong = defineComponent({
      setup: () => () => h('div', { class: 'wrong', onMouseDown: onWrong }),
    });

    const w = mount(Right, { attachTo: document.body });
    w.element.dispatchEvent(mouse('mousedown', 0, 0));
    expect(onRight).toHaveBeenCalledTimes(1);

    const w2 = mount(Wrong, { attachTo: document.body });
    w2.element.dispatchEvent(mouse('mousedown', 0, 0));
    expect(onWrong).toHaveBeenCalledTimes(0);

    w.unmount();
    w2.unmount();
  });
});
