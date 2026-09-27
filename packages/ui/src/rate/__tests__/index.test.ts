/**
 * L1/L2 —— 判据：rc-rate 1.0.1 的 Rate.js/Star.js 逐层 + antd 壳。
 *
 * 覆盖：状态类三态（full/half/zero/focused）/ aria（role=radio, checked, posinset,
 * setsize）/ 半星偏移（mock getBoundingClientRect）/ allowClear 重置与 cleanedValue
 * / 键盘（LEFT/RIGHT、allowHalf 0.5 步长、rtl 反向）/ disabled 全抑制 / expose
 * focus/blur / v-model:value（update:value + onChange 同时发出，C11）/ #character
 * / #characterRender / tooltips 包装（string + TooltipProps 对象）/ size 类。
 */
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import type { RateProps } from '../interface';
import Rate from '../Rate';

const P = 'apollo-rate';

const mountRate = (
  props: RateProps = {},
  slots: Record<string, (...args: never[]) => unknown> = {},
) =>
  mount(Rate, {
    props: props as never,
    slots,
    attachTo: document.body,
    global: { stubs: { teleport: false } },
  });

/** 触发一次 mousemove 半星事件（pageX 相对第一颗星） */
const hoverStar = async (w: ReturnType<typeof mount>, index: number, pageX: number) => {
  const star = w.findAll(`.${P}-star`)[index]!;
  // ⚠️ mock 的是 **li**（starRef 注册的元素 —— getStarValue 用它做偏移测量）
  const el = star.element as HTMLElement;
  // jsdom 的 getBoundingClientRect 全 0 —— mock：星宽 20px，左边缘 offset=index*20
  Object.defineProperty(el, 'clientWidth', { value: 20 });
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    left: index * 20,
    top: 0,
    right: index * 20 + 20,
    bottom: 20,
    width: 20,
    height: 20,
    x: index * 20,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect);
  const evt = new MouseEvent('mousemove', { bubbles: true });
  // jsdom 的 MouseEventInit 不认 pageX —— 手动挂只读属性（合成事件等价物）
  Object.defineProperty(evt, 'pageX', { value: pageX });
  star.find('div[role="radio"]').element.dispatchEvent(evt);
  await nextTick();
};

describe('Rate · 渲染与状态类（rc Star 三态）', () => {
  it('默认 5 颗星；value=3 ⇒ 3 full + 2 zero', () => {
    const w = mountRate({ value: 3 });
    const stars = w.findAll(`.${P}-star`);
    expect(stars).toHaveLength(5);
    expect(w.findAll(`.${P}-star-full`)).toHaveLength(3);
    expect(w.findAll(`.${P}-star-zero`)).toHaveLength(2);
    w.unmount();
  });

  it('count=10 value=8 ⇒ 10 颗、8 full', () => {
    const w = mountRate({ count: 10, value: 8 });
    expect(w.findAll(`.${P}-star`)).toHaveLength(10);
    expect(w.findAll(`.${P}-star-full`)).toHaveLength(8);
    w.unmount();
  });

  it('allowHalf value=2.5 ⇒ 2 full + 1 half(-active) + 2 zero；-first/-second 双层渲染', () => {
    const w = mountRate({ allowHalf: true, value: 2.5 });
    expect(w.findAll(`.${P}-star-full`)).toHaveLength(2);
    expect(w.findAll(`.${P}-star-half`)).toHaveLength(1);
    expect(w.findAll(`.${P}-star-active`)).toHaveLength(1);
    expect(w.findAll(`.${P}-star-zero`)).toHaveLength(2);
    const star = w.findAll(`.${P}-star`)[2]!;
    expect(star.find(`.${P}-star-first`).exists()).toBe(true);
    expect(star.find(`.${P}-star-second`).exists()).toBe(true);
    w.unmount();
  });

  it('aria：role=radio / aria-checked / aria-posinset / aria-setsize', () => {
    const w = mountRate({ value: 2 });
    const radios = w.findAll('div[role="radio"]');
    expect(radios).toHaveLength(5);
    expect(radios[0]?.attributes('aria-checked')).toBe('true');
    expect(radios[1]?.attributes('aria-checked')).toBe('true');
    expect(radios[2]?.attributes('aria-checked')).toBe('false');
    expect(radios[0]?.attributes('aria-posinset')).toBe('1');
    expect(radios[0]?.attributes('aria-setsize')).toBe('5');
    w.unmount();
  });

  it('根元素：ul + tabIndex；id 透传；pickAttrs 透传 role', () => {
    const w = mountRate({ id: 'my-rate', value: 1 });
    const root = w.find('ul');
    expect(root.attributes('id')).toBe('my-rate');
    expect(root.attributes('tabindex')).toBe('0');
    expect(root.classes()).toContain(P);
    w.unmount();

    const w2 = mount(Rate, {
      props: { value: 1 } as never,
      attrs: { role: 'group', 'data-x': '1' },
      attachTo: document.body,
    });
    expect(w2.find('ul').attributes('role')).toBe('group');
    expect(w2.find('ul').attributes('data-x')).toBe('1');
    w2.unmount();
  });

  it('size ⇒ -large / -small 落类；middle 不落', () => {
    expect(mountRate({ size: 'large' }).find('ul').classes()).toContain(`${P}-large`);
    expect(mountRate({ size: 'small' }).find('ul').classes()).toContain(`${P}-small`);
    expect(mountRate().find('ul').classes()).not.toContain(`${P}-large`);
  });

  it('默认字符是 StarFilled（svg）', () => {
    const w = mountRate({ value: 1 });
    expect(w.find(`.${P}-star-second svg`).exists()).toBe(true);
    w.unmount();
  });
});

describe('Rate · 受控 / 事件（C11：update:value + onChange 同时发出）', () => {
  it('点击第 3 颗星 ⇒ onChange(3) + emit update:value', async () => {
    const onChange = vi.fn();
    const w = mountRate({ onChange });
    await w.findAll(`.${P}-star`)[2]!.find('div[role="radio"]').trigger('click');
    expect(onChange).toHaveBeenCalledWith(3);
    expect(w.emitted('update:value')?.[0]).toEqual([3]);
    expect(w.findAll(`.${P}-star-full`)).toHaveLength(3);
    w.unmount();
  });

  it('allowClear=true：再点同值 ⇒ 重置 0（onChange(0)；非受控 defaultValue 才看得到 UI 复位）', async () => {
    const onChange = vi.fn();
    const w = mountRate({ defaultValue: 3, onChange });
    await w.findAll(`.${P}-star`)[2]!.find('div[role="radio"]').trigger('click');
    expect(onChange).toHaveBeenCalledWith(0);
    expect(w.emitted('update:value')?.[0]).toEqual([0]);
    expect(w.findAll(`.${P}-star-zero`)).toHaveLength(5);
    w.unmount();
  });

  it('allowClear=false：再点同值 ⇒ 保持', async () => {
    const onChange = vi.fn();
    const w = mountRate({ defaultValue: 3, onChange, allowClear: false });
    await w.findAll(`.${P}-star`)[2]!.find('div[role="radio"]').trigger('click');
    expect(onChange).toHaveBeenCalledWith(3);
    expect(w.findAll(`.${P}-star-full`)).toHaveLength(3);
    w.unmount();
  });

  it('hover ⇒ onHoverChange(值) 且星星按 hoverValue 展示；移出 ⇒ onHoverChange(undefined)', async () => {
    const onHoverChange = vi.fn();
    const w = mountRate({ value: 1, onHoverChange });
    await hoverStar(w, 3, 3 * 20 + 10); // 第 4 颗星中点
    expect(onHoverChange).toHaveBeenCalledWith(4);
    expect(w.findAll(`.${P}-star-full`)).toHaveLength(4); // hover 展示值
    // 移出根元素
    w.find('ul').element.dispatchEvent(new MouseEvent('mouseleave'));
    await nextTick();
    expect(onHoverChange).toHaveBeenCalledWith(undefined);
    expect(w.findAll(`.${P}-star-full`)).toHaveLength(1); // 回落 value
    w.unmount();
  });

  it('allowHalf hover 半星：pageX 落左半 ⇒ 3.5', async () => {
    const onHoverChange = vi.fn();
    const w = mountRate({ value: 1, allowHalf: true, onHoverChange });
    await hoverStar(w, 3, 3 * 20 + 5); // 第 4 颗星左半
    expect(onHoverChange).toHaveBeenCalledWith(3.5);
    w.unmount();
  });

  it('键盘 RIGHT/LEFT 增减 1；allowHalf ⇒ 0.5 步长', async () => {
    const w = mountRate({ value: 3 });
    await w.find('ul').trigger('keydown', { keyCode: 39, key: 'ArrowRight' });
    expect(w.emitted('update:value')?.[0]).toEqual([4]);
    await w.find('ul').trigger('keydown', { keyCode: 37, key: 'ArrowLeft' });
    await w.find('ul').trigger('keydown', { keyCode: 37, key: 'ArrowLeft' });
    expect(w.emitted('update:value')?.[2]).toEqual([2]);
    w.unmount();

    const w2 = mountRate({ value: 3, allowHalf: true });
    await w2.find('ul').trigger('keydown', { keyCode: 39, key: 'ArrowRight' });
    expect(w2.emitted('update:value')?.[0]).toEqual([3.5]);
    w2.unmount();
  });

  it('count 上限：value=count 时 RIGHT 不再加', async () => {
    const w = mountRate({ value: 5 });
    await w.find('ul').trigger('keydown', { keyCode: 39, key: 'ArrowRight' });
    expect(w.emitted('update:value')).toBeUndefined();
    w.unmount();
  });

  it('keyboard=false ⇒ 方向键不生效', async () => {
    const w = mountRate({ value: 3, keyboard: false });
    await w.find('ul').trigger('keydown', { keyCode: 39, key: 'ArrowRight' });
    expect(w.emitted('update:value')).toBeUndefined();
    w.unmount();
  });

  it('Star 上 ENTER ⇒ 触发点击', async () => {
    const onChange = vi.fn();
    const w = mountRate({ onChange });
    await w.findAll(`.${P}-star`)[0]!.find('div[role="radio"]').trigger('keydown', {
      keyCode: 13,
      key: 'Enter',
    });
    expect(onChange).toHaveBeenCalledWith(1);
    w.unmount();
  });

  it('focus/blur 事件回调 + expose focus/blur', async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const w = mountRate({ onFocus, onBlur });
    await w.find('ul').trigger('focus');
    expect(onFocus).toHaveBeenCalledTimes(1);
    await w.find('ul').trigger('blur');
    expect(onBlur).toHaveBeenCalledTimes(1);
    (w.vm as unknown as { blur: () => void }).blur();
    w.unmount();
  });

  it('autoFocus ⇒ 挂载即 focus（对 root 元素）', async () => {
    const w = mountRate({ autoFocus: true });
    expect(document.activeElement).toBe(w.find('ul').element);
    w.unmount();
  });
});

describe('Rate · disabled 全抑制', () => {
  it('类名 + 事件全不触发 + tabIndex=-1 + hover/键盘抑制', async () => {
    const onChange = vi.fn();
    const onHoverChange = vi.fn();
    const w = mountRate({ value: 2, disabled: true, onChange, onHoverChange });
    expect(w.find('ul').classes()).toContain(`${P}-disabled`);
    expect(w.find('ul').attributes('tabindex')).toBe('-1');
    await w.findAll(`.${P}-star`)[3]!.find('div[role="radio"]').trigger('click');
    await w.findAll(`.${P}-star`)[3]!.find('div[role="radio"]').trigger('mousemove');
    await w.find('ul').trigger('keydown', { keyCode: 39, key: 'ArrowRight' });
    expect(onChange).not.toHaveBeenCalled();
    expect(onHoverChange).not.toHaveBeenCalled();
    expect(w.emitted('update:value')).toBeUndefined();
    w.unmount();
  });
});

describe('Rate · C8-R2 插槽与 tooltips（数据 prop）', () => {
  it('#character 插槽替换默认字符', () => {
    const w = mountRate({ value: 1 }, { character: () => h('i', { class: 'my-star' }, 'A') });
    expect(w.findAll('.my-star')).toHaveLength(10); // first + second 双层
    expect(w.find(`.${P}-star-second svg`).exists()).toBe(false);
    w.unmount();
  });

  it('#character 作用域插槽收到 index/value/count', () => {
    const w = mountRate(
      { value: 3, count: 4 },
      {
        character: (info: unknown) => {
          const { index, value, count } = info as { index: number; value: number; count: number };
          return h('b', null, `${index}-${value}-${count}`);
        },
      },
    );
    expect(w.findAll(`.${P}-star-second b`)[2]!.text()).toBe('2-3-4');
    w.unmount();
  });

  it('#characterRender 插槽包装整颗星（li）', () => {
    const w = mountRate(
      {},
      {
        characterRender: (p: unknown) => {
          const { node } = p as { node: unknown };
          return h('div', { class: 'wrapped-star' }, [node as never]);
        },
      },
    );
    expect(w.findAll('.wrapped-star')).toHaveLength(5);
    expect(w.find('.wrapped-star li').exists()).toBe(true);
    w.unmount();
  });

  it('tooltips string ⇒ 包 Tooltip（title 属性在浮层内容里）', async () => {
    const w = mountRate({ value: 1, tooltips: ['one', 'two'] });
    // tooltips 只影响提示，不改变星数（count 默认 5）
    expect(w.findAll(`.${P}-star`)).toHaveLength(5);
    // hover 触发 tooltip
    // Tooltip 的触发元素是包装 li（克隆注入 onMouseenter）—— 对 li 直接触发
    await w.findAll(`.${P}-star`)[0]!.trigger('mouseenter');
    await new Promise((r) => setTimeout(r, 300));
    expect(document.body.textContent).toContain('one');
    w.unmount();
  });

  it('tooltips 对象形态（TooltipProps）逐字转发', async () => {
    const w = mountRate({
      value: 1,
      tooltips: [{ placement: 'top' as const, title: 'obj tip' }],
    });
    // Tooltip 的触发元素是包装 li（克隆注入 onMouseenter）—— 对 li 直接触发
    await w.findAll(`.${P}-star`)[0]!.trigger('mouseenter');
    await new Promise((r) => setTimeout(r, 300));
    expect(document.body.textContent).toContain('obj tip');
    w.unmount();
  });

  it('tooltips 与 #characterRender 组合（本仓为组合语义，非覆盖）', () => {
    const w = mountRate(
      { tooltips: ['t0'] },
      {
        characterRender: (p: unknown) => {
          const { node } = p as { node: unknown };
          return h('div', { class: 'wrapped-star' }, [node as never]);
        },
      },
    );
    // 5 颗星都被用户插槽包装（tooltips 的 Tooltip 在内层，组合不冲突）
    expect(w.findAll('.wrapped-star')).toHaveLength(5);
    w.unmount();
  });
});

describe('Rate · rtl', () => {
  it('direction=rtl ⇒ -rtl 类；键盘左右反向', async () => {
    const w = mountRate({ value: 3, direction: 'rtl' });
    expect(w.find('ul').classes()).toContain(`${P}-rtl`);
    await w.find('ul').trigger('keydown', { keyCode: 39, key: 'ArrowRight' });
    expect(w.emitted('update:value')?.[0]).toEqual([2]);
    w.unmount();
  });
});
