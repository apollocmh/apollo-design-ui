/**
 * Layout.Sider × Menu · Issue #32 回归（2 项，先复现后修）。
 */
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { Menu } from '../../menu';
import { Layout, Sider } from '../index';

const SIDER = 'apollo-layout-sider';
const MENU = 'apollo-menu';

const ITEMS = [
  { key: '1', label: 'Nav 1' },
  { key: '2', label: 'Nav 2' },
];

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

/** Layout > Sider(collapsible) > Menu(inline)。 */
const mountWithMenu = (
  siderProps: Record<string, unknown> = {},
  menuProps: Record<string, unknown> = {},
) =>
  mount(Layout, {
    attachTo: document.body,
    slots: {
      default: () => [
        h(Sider, { collapsible: true, ...siderProps } as never, {
          default: () => h(Menu as never, { mode: 'inline', items: ITEMS, ...menuProps } as never),
        }),
      ],
    },
  });

describe('#32.1 Sider 折叠要传导给内部 Menu', () => {
  it('[A] 点 Sider 折叠按钮 ⇒ Menu 进入 inline-collapsed', async () => {
    const w = mountWithMenu();
    await nextTick();

    const menu = () => document.querySelector<HTMLElement>(`.${MENU}`);
    expect(menu()?.classList.contains(`${MENU}-inline-collapsed`)).toBe(false);

    const trigger = document.querySelector<HTMLElement>(`.${SIDER}-trigger`);
    expect(trigger).not.toBeNull();
    trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    await nextTick();

    expect(menu()?.classList.contains(`${MENU}-inline-collapsed`)).toBe(true);

    // 再点一次 ⇒ 展开
    document
      .querySelector<HTMLElement>(`.${SIDER}-trigger`)
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    await nextTick();
    expect(menu()?.classList.contains(`${MENU}-inline-collapsed`)).toBe(false);
    w.unmount();
  });

  it('[B] 受控 collapsed 切换同样传导', async () => {
    const collapsed = ref(false);
    const Host = defineComponent({
      setup: () => () =>
        h(Layout as never, null, {
          default: () => [
            h(Sider as never, { collapsible: true, collapsed: collapsed.value } as never, {
              default: () => h(Menu as never, { mode: 'inline', items: ITEMS } as never),
            }),
          ],
        }),
    });
    const w = mount(Host, { attachTo: document.body });
    await nextTick();
    const menu = () => document.querySelector<HTMLElement>(`.${MENU}`);

    expect(menu()?.classList.contains(`${MENU}-inline-collapsed`)).toBe(false);
    collapsed.value = true;
    await nextTick();
    await nextTick();
    expect(menu()?.classList.contains(`${MENU}-inline-collapsed`)).toBe(true);
    w.unmount();
  });

  it('[C] 守卫：Menu 显式 `inlineCollapsed=false` 覆盖 Sider 的 true', async () => {
    const collapsed = ref(true);
    const Host = defineComponent({
      setup: () => () =>
        h(Layout as never, null, {
          default: () => [
            h(Sider as never, { collapsible: true, collapsed: collapsed.value } as never, {
              default: () =>
                h(
                  Menu as never,
                  {
                    mode: 'inline',
                    items: ITEMS,
                    inlineCollapsed: false,
                  } as never,
                ),
            }),
          ],
        }),
    });
    const w = mount(Host, { attachTo: document.body });
    await nextTick();
    await nextTick();
    const menu = document.querySelector<HTMLElement>(`.${MENU}`);
    expect(menu?.classList.contains(`${MENU}-inline-collapsed`)).toBe(false);
    w.unmount();
  });

  it('[D] 守卫：Menu 不在 Sider 里时不折叠', async () => {
    const w = mount(Menu as never, {
      props: { mode: 'inline', items: ITEMS } as never,
      attachTo: document.body,
    });
    await nextTick();
    expect(
      document
        .querySelector<HTMLElement>(`.${MENU}`)
        ?.classList.contains(`${MENU}-inline-collapsed`),
    ).toBe(false);
    w.unmount();
  });
});

describe('#32.2 更换 onCollapse / onBreakpoint 后要生效', () => {
  it('[A] 替换 onCollapse ⇒ 只有新回调被调用', async () => {
    const oldSpy = vi.fn();
    const newSpy = vi.fn();
    const onCollapse = ref<(c: boolean, t: string) => void>(oldSpy);

    const Host = defineComponent({
      setup: () => () =>
        h(Layout as never, null, {
          default: () => [
            h(Sider as never, { collapsible: true, onCollapse: onCollapse.value } as never, {
              default: () => h('div', 'content'),
            }),
          ],
        }),
    });
    const w = mount(Host, { attachTo: document.body });
    await nextTick();

    document
      .querySelector<HTMLElement>(`.${SIDER}-trigger`)
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(oldSpy).toHaveBeenCalledTimes(1);
    expect(newSpy).not.toHaveBeenCalled();

    // 换回调
    onCollapse.value = newSpy;
    await nextTick();
    document
      .querySelector<HTMLElement>(`.${SIDER}-trigger`)
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();

    expect(oldSpy).toHaveBeenCalledTimes(1);
    expect(newSpy).toHaveBeenCalledTimes(1);
    w.unmount();
  });

  it('[B] 替换 onBreakpoint ⇒ 只有新回调被调用', async () => {
    const oldSpy = vi.fn();
    const newSpy = vi.fn();
    const onBreakpoint = ref<(broken: boolean) => void>(oldSpy);

    const listeners: Array<(e: { matches: boolean }) => void> = [];
    const mql = {
      matches: false,
      media: '(max-width: 500px)',
      // ⚠️ 真实签名是 `addEventListener('change', handler)` ⇒ 第二个参数才是回调
      addListener: (_t: string, fn: (e: { matches: boolean }) => void) => listeners.push(fn),
      removeListener: () => {},
      addEventListener: (_t: string, fn: (e: { matches: boolean }) => void) => listeners.push(fn),
      removeEventListener: () => {},
      dispatchEvent: () => true,
    };
    const matchMedia = vi.fn().mockReturnValue(mql);
    Object.defineProperty(window, 'matchMedia', {
      value: matchMedia,
      configurable: true,
      writable: true,
    });

    const Host = defineComponent({
      setup: () => () =>
        h(Layout as never, null, {
          default: () => [
            h(
              Sider as never,
              { collapsible: true, breakpoint: 'md', onBreakpoint: onBreakpoint.value } as never,
              { default: () => h('div', 'content') },
            ),
          ],
        }),
    });
    const w = mount(Host, { attachTo: document.body });
    await nextTick();

    // 挂载时立即以 mql.matches(false) 调一次
    expect(oldSpy).toHaveBeenCalledWith(false);
    expect(newSpy).not.toHaveBeenCalled();

    onBreakpoint.value = newSpy;
    await nextTick();
    for (const fn of listeners) fn({ matches: true });

    expect(newSpy).toHaveBeenCalledWith(true);
    expect(oldSpy).toHaveBeenCalledTimes(1); // 只有挂载那次
    w.unmount();
  });
});
