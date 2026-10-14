/**
 * Issue #12 批量修复的回归（cascader）。
 *
 * 五项全部来自「**把 React 的每次渲染语义当成 Vue 的一次 setup**」这一类：
 *
 * 1. [#12.1] 值只有**派生**没有**写回** ⇒ 非受控 Cascader 选完立刻弹回；
 * 2. [#12.2] `...restAttrs` 铺在 BaseSelect props 的**最后** ⇒ 调用方同名监听器
 *    把内部 `onSearch` / `onOpenChange` 顶掉（搜索与开合全哑）；
 * 3. [#12.3] 搜索配置在 setup 期算一次 ⇒ 动态改 `showSearch` / filter 无效；
 * 4. [#12.4] size / direction / getPopupContainer 只认局部 prop，不回退 ConfigProvider；
 * 5. [#12.5] 语义合并第三参传的是 `mergedProps.value`（对象）而不是 getter。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import { ConfigProvider } from '../../config-provider';
import Cascader from '../Cascader';

const OPTIONS = [
  {
    value: 'zj',
    label: '浙江',
    children: [
      { value: 'hz', label: '杭州', children: [{ value: 'xh', label: '西湖' }] },
      { value: 'nb', label: '宁波' },
    ],
  },
  { value: 'js', label: '江苏', children: [{ value: 'nj', label: '南京' }] },
];

const menus = () => document.querySelectorAll('.apollo-cascader-menu');
const menuItems = () => document.querySelectorAll('.apollo-cascader-menu-item');

const mountCascader = (props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) =>
  mount(Cascader, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
    props: { options: OPTIONS, ...props },
    attrs,
  });

const waitMenus = async () => {
  await vi.waitUntil(() => menus().length > 0, { timeout: 2000 }).catch(() => {});
};

describe('Issue #12.1 · 非受控选择状态', () => {
  it('★ 不传 value / v-model：选一次后展示跟着变（不弹回）', async () => {
    const w = mountCascader({ open: true, changeOnSelect: true });
    await nextTick();
    await waitMenus();

    const first = menuItems()[0];
    expect(first?.textContent).toContain('浙江');
    first?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();

    // 上游 `triggerChange` 的第一步是 `setRawValues(nextValues)`
    expect(w.text(), '非受控也必须更新展示').toContain('浙江');
    w.unmount();
  });

  it('★ 非受控：`update:value` 仍然按值形状发出（单选 = 一维）', async () => {
    const w = mountCascader({ open: true, changeOnSelect: true });
    await nextTick();
    await waitMenus();
    menuItems()[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(w.emitted('update:value')?.at(-1)).toEqual([['zj']]);
    w.unmount();
  });

  it('★ 非受控：连续两次选择（改到别的分支）也跟随', async () => {
    const w = mountCascader({ open: true, changeOnSelect: true });
    await nextTick();
    await waitMenus();
    menuItems()[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(w.text()).toContain('浙江');

    const items = [...menuItems()].filter((el) => el.textContent?.includes('江苏'));
    items[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(w.text()).toContain('江苏');
    w.unmount();
  });

  it('★ 反向哨兵：受控 `value` 且父层不回写 ⇒ 展示**不**变（受控边界没被改动）', async () => {
    const w = mountCascader({ open: true, changeOnSelect: true, value: ['js', 'nj'] });
    await nextTick();
    await waitMenus();
    expect(w.text()).toContain('江苏 / 南京');

    menuItems()[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(w.text(), '受控时父层不回写就不该变').toContain('江苏 / 南京');
    w.unmount();
  });
});

describe('Issue #12.2 · 内部事件不被 restAttrs 覆盖', () => {
  it('★ attrs 传 `onOpenChange`：内部开合逻辑**仍然跑** + 用户回调调一次', async () => {
    const onOpenChange = vi.fn();
    const w = mountCascader({}, { onOpenChange });
    await nextTick();

    await w.find('.apollo-cascader').trigger('click');
    await nextTick();
    await waitMenus();

    expect(menus().length, '内部 setOpen 必须仍然生效').toBe(1);
    expect(onOpenChange, '用户回调不能重复调用').toHaveBeenCalledTimes(1);
    w.unmount();
  });

  it('★ attrs 传 `onSearch`：内部 searchValue 仍然更新（搜索结果过滤生效）', async () => {
    const onSearch = vi.fn();
    const w = mountCascader({ open: true, showSearch: true }, { onSearch });
    await nextTick();
    await waitMenus();

    const input = w.find('input');
    await input.setValue('杭州');
    await nextTick();

    expect(onSearch).toHaveBeenCalledTimes(1);
    const texts = [...menuItems()].map((el) => el.textContent ?? '');
    expect(
      texts.some((t) => t.includes('杭州')),
      '内部搜索状态必须更新（结果要过滤）',
    ).toBe(true);
    w.unmount();
  });
});

describe('Issue #12.3 · showSearch / filter 的动态响应', () => {
  it('★ 运行中把 filter 换成「全不匹配」⇒ 结果立刻变空', async () => {
    const w = mountCascader({
      open: true,
      showSearch: { filter: () => true } as never,
    });
    await nextTick();
    await waitMenus();

    const input = w.find('input');
    await input.setValue('州');
    await nextTick();
    expect(menuItems().length, '全匹配 ⇒ 有结果').toBeGreaterThan(0);

    await w.setProps({ showSearch: { filter: () => false } as never });
    await nextTick();
    // ⚠️ 空态会渲染**一条** disabled 的占位项（`Not Found`），所以不能断言长度 0 ——
    //    判据是「没有任何一条是真实候选」（-empty 的占位项）。
    const leftover = [...menuItems()].map((el) => el.textContent ?? '');
    expect(
      leftover.some((t) => t.includes('浙江') || t.includes('江苏')),
      `换成全不匹配 ⇒ 不该再有真实候选，实际：${leftover.join(' | ')}`,
    ).toBe(false);
    w.unmount();
  });

  it('★ showSearch 从 false 切成 true：搜索不再被「首帧快照」锁住', async () => {
    const w = mountCascader({ open: true, showSearch: false });
    await nextTick();
    await waitMenus();
    expect(menuItems().length).toBeGreaterThan(0);

    await w.setProps({ showSearch: true });
    await nextTick();
    await w.find('input').setValue('杭州');
    await nextTick();

    const texts = [...menuItems()].map((el) => el.textContent ?? '');
    expect(
      texts.some((t) => t.includes('杭州')),
      '切成 true 后要能搜',
    ).toBe(true);
    w.unmount();
  });
});

describe('Issue #12.4 · ConfigProvider 的 size / direction / popup 容器', () => {
  it('★ ConfigProvider `componentSize="small"` ⇒ 根带 `-sm`', () => {
    const w = mount(ConfigProvider, {
      props: { componentSize: 'small' },
      slots: { default: () => h(Cascader, { options: OPTIONS }) },
    });
    expect(w.find('.apollo-cascader').classes()).toContain('apollo-cascader-sm');
    w.unmount();
  });

  it('★ ConfigProvider `direction="rtl"` ⇒ 根带 `-rtl`', () => {
    const w = mount(ConfigProvider, {
      props: { direction: 'rtl' },
      slots: { default: () => h(Cascader, { options: OPTIONS }) },
    });
    expect(w.find('.apollo-cascader').classes()).toContain('apollo-cascader-rtl');
    w.unmount();
  });

  it('★ 局部 `direction` 覆盖全局（局部优先）', () => {
    const w = mount(ConfigProvider, {
      props: { direction: 'rtl' },
      slots: { default: () => h(Cascader, { options: OPTIONS, direction: 'ltr' }) },
    });
    expect(w.find('.apollo-cascader').classes()).not.toContain('apollo-cascader-rtl');
    w.unmount();
  });

  it('★ 不传任何一方 ⇒ 仍然落到 `-ltr` 的默认（零行为变化）', () => {
    const w = mount(Cascader, { props: { options: OPTIONS } });
    expect(w.find('.apollo-cascader').classes()).not.toContain('apollo-cascader-rtl');
    w.unmount();
  });

  it('★ ConfigProvider `getPopupContainer` 生效（局部没给时回退全局）', async () => {
    const host = document.createElement('div');
    host.id = 'cp-popup-host';
    document.body.appendChild(host);

    const w = mount(ConfigProvider, {
      props: { getPopupContainer: () => host },
      slots: { default: () => h(Cascader, { options: OPTIONS, open: true }) },
      attachTo: document.body,
      global: { stubs: { teleport: false } },
    });
    await nextTick();
    await waitMenus();

    expect(host.querySelector('.apollo-cascader-dropdown')).not.toBeNull();
    w.unmount();
    host.remove();
  });
});

describe('Issue #12.5 · 函数式语义槽看到最新 props', () => {
  it('★ `classNames(info => …)` 随 `disabled` 变化重算', async () => {
    const w = mountCascader({
      classNames: ({ props }: { props: { disabled?: boolean } }) => ({
        root: props.disabled ? 'dyn-disabled' : 'dyn-enabled',
      }),
    });
    expect(w.find('.apollo-cascader').classes()).toContain('dyn-enabled');

    await w.setProps({ disabled: true });
    await nextTick();
    expect(w.find('.apollo-cascader').classes(), '语义槽必须看到最新 props').toContain(
      'dyn-disabled',
    );
    w.unmount();
  });
});
