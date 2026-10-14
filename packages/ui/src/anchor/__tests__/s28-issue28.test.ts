/**
 * Anchor · Issue #28 回归（2 项，先复现后修）。
 *
 * ⚠️ jsdom 无布局/滚动 ⇒ 只钉「接线与配置透传」，真实滚动归 L6。
 */
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import Affix from '../../affix';
import Anchor from '../Anchor';

const P = 'apollo-anchor';

const mountTarget = (id: string, top = 0): HTMLElement => {
  const el = document.createElement('div');
  el.id = id;
  document.body.appendChild(el);
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    top,
    bottom: top + 100,
    height: 100,
    width: 100,
    left: 0,
    right: 100,
    x: 0,
    y: top,
    toJSON: () => ({}),
  } as DOMRect);
  vi.spyOn(el, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
  return el;
};

const mountAnchor = (props: Record<string, unknown> = {}) =>
  mount(Anchor, { props: { affix: false, ...props } as never, attachTo: document.body });

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('#28.1 items 单项的 replace 不能被父级默认值顶掉', () => {
  it('[A] 父级不传 + 单项 `replace: true` ⇒ replaceState', async () => {
    const replaceState = vi.spyOn(window.history, 'replaceState');
    const pushState = vi.spyOn(window.history, 'pushState');
    mountTarget('a');
    const w = mountAnchor({
      items: [{ key: 'a', href: '#a', title: 'A', replace: true }],
    });
    await nextTick();

    await w.find(`.${P}-link-title`).trigger('click');

    expect(replaceState).toHaveBeenCalledWith(null, '', '#a');
    expect(pushState).not.toHaveBeenCalled();
    w.unmount();
  });

  it('[B] 父级 `replace: false` + 单项 `replace: true` ⇒ 单项胜（antd：`{replace, ...item}`）', async () => {
    const replaceState = vi.spyOn(window.history, 'replaceState');
    mountTarget('a');
    const w = mountAnchor({
      replace: false,
      items: [{ key: 'a', href: '#a', title: 'A', replace: true }],
    });
    await nextTick();
    await w.find(`.${P}-link-title`).trigger('click');
    expect(replaceState).toHaveBeenCalledWith(null, '', '#a');
    w.unmount();
  });

  it('[C] 父级 `replace: true` + 单项 `replace: false` ⇒ 单项胜（pushState）', async () => {
    const pushState = vi.spyOn(window.history, 'pushState');
    const replaceState = vi.spyOn(window.history, 'replaceState');
    mountTarget('a');
    const w = mountAnchor({
      replace: true,
      items: [{ key: 'a', href: '#a', title: 'A', replace: false }],
    });
    await nextTick();
    await w.find(`.${P}-link-title`).trigger('click');
    expect(pushState).toHaveBeenCalledWith(null, '', '#a');
    expect(replaceState).not.toHaveBeenCalled();
    w.unmount();
  });

  it('[D] 守卫：都不传 ⇒ pushState；父级 true + 单项不传 ⇒ replaceState', async () => {
    const pushState = vi.spyOn(window.history, 'pushState');
    mountTarget('a');
    const w1 = mountAnchor({ items: [{ key: 'a', href: '#a', title: 'A' }] });
    await nextTick();
    await w1.find(`.${P}-link-title`).trigger('click');
    expect(pushState).toHaveBeenCalledWith(null, '', '#a');
    w1.unmount();

    pushState.mockClear();
    const replaceState = vi.spyOn(window.history, 'replaceState');
    const w2 = mountAnchor({
      replace: true,
      items: [{ key: 'a', href: '#a', title: 'A' }],
    });
    await nextTick();
    await w2.find(`.${P}-link-title`).trigger('click');
    expect(replaceState).toHaveBeenCalledWith(null, '', '#a');
    expect(pushState).not.toHaveBeenCalled();
    w2.unmount();
  });

  it('[E] 嵌套子项也要继承同一优先级', async () => {
    const replaceState = vi.spyOn(window.history, 'replaceState');
    mountTarget('c1');
    const w = mountAnchor({
      replace: false,
      items: [
        {
          key: 'p',
          href: '#p',
          title: 'P',
          children: [{ key: 'c1', href: '#c1', title: 'C1', replace: true }],
        },
      ],
    });
    await nextTick();
    const titles = w.findAll(`.${P}-link-title`);
    const child = titles.find((t) => t.text() === 'C1');
    expect(child).toBeTruthy();
    await child!.trigger('click');
    expect(replaceState).toHaveBeenCalledWith(null, '', '#c1');
    w.unmount();
  });
});

describe('#28.2 affix 对象配置要能动态更新', () => {
  /** `AnchorAffixConfig = Omit<AffixProps,'offsetTop'|'target'>` ⇒ 只能用它允许的键。 */
  const affixPropsOf = (w: unknown): Record<string, unknown> => {
    const holder = w as {
      findComponent: (c: unknown) => { props: () => Record<string, unknown> };
    };
    return holder.findComponent(Affix as never).props();
  };

  it('[A] object 的字段动态更新 ⇒ 内层 Affix 收到新值', async () => {
    // ⚠️ 用 Host 模拟「模板里绑 ref」：Vue 在模板表达式里会解包 ref ⇒ 组件收到的是
    //    **普通对象**，重渲染时换成新对象（等价于调用方改配置）。
    const affixCfg = ref<Record<string, unknown>>({ offsetBottom: 24 });
    const Host = defineComponent({
      setup: () => () =>
        h(
          Anchor as never,
          {
            items: [{ key: 'a', href: '#a', title: 'A' }],
            affix: affixCfg.value,
          } as never,
        ),
    });
    const w = mount(Host, { attachTo: document.body });
    await nextTick();
    expect(affixPropsOf(w).offsetBottom).toBe(24);

    affixCfg.value = { offsetBottom: 48 };
    await nextTick();
    expect(affixPropsOf(w).offsetBottom).toBe(48);
    w.unmount();
  });

  it('[B] true → object ⇒ 开始吃对象字段', async () => {
    const w = mount(Anchor, {
      props: { items: [{ key: 'a', href: '#a', title: 'A' }], affix: true } as never,
      attachTo: document.body,
    });
    await nextTick();
    expect(affixPropsOf(w).offsetBottom).toBeUndefined();

    await w.setProps({ affix: { offsetBottom: 12 } });
    await nextTick();
    expect(affixPropsOf(w).offsetBottom).toBe(12);
    w.unmount();
  });

  it('[C] object → false ⇒ 不再包 Affix（回到 `-wrapper` 根）', async () => {
    const w = mount(Anchor, {
      props: {
        items: [{ key: 'a', href: '#a', title: 'A' }],
        affix: { offsetBottom: 12 },
      } as never,
      attachTo: document.body,
    });
    await nextTick();
    expect(w.findComponent(Affix as never).exists()).toBe(true);

    await w.setProps({ affix: false });
    await nextTick();
    expect(w.findComponent(Affix as never).exists()).toBe(false);
    expect((w.element as HTMLElement).classList.contains(`${P}-wrapper`)).toBe(true);
    w.unmount();
  });

  it('[D] 守卫：offsetTop prop 仍作为 Affix 的默认起点', async () => {
    const w = mount(Anchor, {
      props: {
        items: [{ key: 'a', href: '#a', title: 'A' }],
        affix: true,
        offsetTop: 64,
      } as never,
      attachTo: document.body,
    });
    await nextTick();
    expect(affixPropsOf(w).offsetTop).toBe(64);
    w.unmount();
  });
});
