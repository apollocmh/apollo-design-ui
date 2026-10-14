// @vitest-environment jsdom
/**
 * L1/L2 —— **Issue #15 的三项回归**（先复现再修）。
 *
 * | # | 判据 | 修复前的红灯表现 |
 * |---|---|---|
 * | 15.1 | 自定义操作按钮的用户 `onClick` **恰好一次**、move（`onChange`）一次 | `h(element, { onClick })` 对已有 VNode 走 `cloneVNode` → `mergeProps` 把 `on*` **拼成数组** ⇒ 用户回调先在数组里调一次、又在新 `onClick` 里显式调一次 ⇒ **双调**（React `cloneElement` 是**替换**语义，同 Issue #8.3 / `FormItem.vue` 判据） |
 * | 15.2 | 只改 attrs（`class` / `style`）⇒ 根节点跟着更新；attrs.style 走语义 root 通道 | 动态 class/style 更新**本身是好的**（Vue 3.5 的 attrs 代理对 `computed` 有追踪，Issue 原文的猜测不成立）；真正钉住的是**合并语义**：attrs.style 是 stylesList 最后一项 ⇒ 压过 `styles.root`（antd `index.js:234` 的 `[contextStyles, contextStyleRoot, styles, styleRoot]` 逐字） |
 * | 15.3 | `prefixCls` 动态切换 ⇒ Section 子级前缀同步 | `sectionPrefixCls` / `listPrefixCls` 是 **setup 期普通字符串** ⇒ 切换后 Section/ListBody 仍渲染旧前缀类名（实测：根 `custom` 已换、子级还挂 `apollo-section`） |
 *
 * ── 四条写测试时踩过的判据 ──────────────────────────────────────────────
 *
 * 1. **jsdom 不给 `disabled` 元素派发 click**（原生 `<button disabled>` 与
 *    `Button` 组件双通道都测不到监听器层）⇒ 禁用态用例必须用**非表单元素**
 *    （`<a>`）作自定义操作按钮才有区分度。
 * 2. `.apollo-transfer-actions button` 的 `[0]` 是「向右」按钮；勾左列一项才可用
 *    （`rightActive` = 左列有勾选）。
 * 3. `prefixCls` prop 传的是**完整前缀**（`prefixCls: 'p1'` ⇒ `.p1-section`，
 *    不是 `.p1-transfer-section`）；不传时才走 `getPrefixCls('transfer')`。
 * 4. **空列不渲染 ListBody**（走 `-body-not-found`）⇒ `.…-list-content` 只有 1 个。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { Button } from '../../button';
import { ConfigProvider } from '../../config-provider';
import Transfer from '../index';
import type { TransferItem } from '../interface';

const DATA_SOURCE: TransferItem[] = Array.from({ length: 8 }, (_, i) => ({
  key: String(i),
  title: `content${i + 1}`,
  disabled: i === 3,
}));

const mountTransfer = (props: Record<string, unknown> = {}) =>
  mount(Transfer, {
    props: { dataSource: DATA_SOURCE, ...props },
    attachTo: document.body,
  });

// ===========================================================================
// 15.1 · 自定义操作按钮：用户 onClick 恰好一次
// ===========================================================================

describe('Transfer · 自定义操作按钮事件恰好一次（Issue #15.1）', () => {
  it('★ 组件形态（antd 文档同款 `<Button onClick>`）：用户回调 1 次、move 1 次', async () => {
    const userOnClick = vi.fn();
    const onChange = vi.fn();
    const makeBtn = (text: string) =>
      h(Button, { size: 'small', onClick: userOnClick }, { default: () => text });
    const wrapper = mountTransfer({
      actions: [makeBtn('去右边'), makeBtn('去左边')],
      onChange,
    });

    // 勾左列第一项 ⇒ 向右按钮可用
    await wrapper.findAll('.apollo-transfer-list-content-item')[0]!.trigger('click');

    const buttons = wrapper.findAll('.apollo-transfer-actions button');
    await buttons[0]!.trigger('click');

    // 修复前：mergeProps 拼成 [user, ours] ⇒ user 2 次
    expect(userOnClick).toHaveBeenCalledTimes(1);
    // move 那一半没被牺牲：key=0 移入右列
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(['0'], 'right', ['0']);
    wrapper.unmount();
  });

  it('★ 原生元素形态（`h("button", { onClick })`）：同样只调一次', async () => {
    const userOnClick = vi.fn();
    const onChange = vi.fn();
    const makeBtn = (text: string) => h('button', { onClick: userOnClick }, text);
    const wrapper = mountTransfer({
      actions: [makeBtn('去右边'), makeBtn('去左边')],
      onChange,
    });

    await wrapper.findAll('.apollo-transfer-list-content-item')[0]!.trigger('click');
    await wrapper.findAll('.apollo-transfer-actions button')[0]!.trigger('click');

    expect(userOnClick).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('★ 禁用态（无勾选）：非表单元素形态也不调用户回调、不触发 move', async () => {
    const userOnClick = vi.fn();
    const onChange = vi.fn();
    const makeBtn = (text: string) => h('a', { onClick: userOnClick }, text);
    const wrapper = mountTransfer({
      actions: [makeBtn('去右边'), makeBtn('去左边')],
      onChange,
    });

    // `<a disabled>` 不是表单控件 ⇒ jsdom 照常派发 ⇒ 能测到监听器层
    await wrapper.findAll('.apollo-transfer-actions a')[0]!.trigger('click');

    // 修复前：数组里排在首位的 user 回调先跑 ⇒ 1 次
    expect(userOnClick).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('★ 自定义按钮 disabled 判据不变：element 自带 disabled 时不可点', async () => {
    const userOnClick = vi.fn();
    const onChange = vi.fn();
    const wrapper = mountTransfer({
      actions: [
        h('a', { onClick: userOnClick, disabled: true }, '去右边'),
        h('a', { onClick: userOnClick }, '去左边'),
      ],
      onChange,
    });

    await wrapper.findAll('.apollo-transfer-list-content-item')[0]!.trigger('click');
    await wrapper.findAll('.apollo-transfer-actions a')[0]!.trigger('click');

    expect(userOnClick).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    wrapper.unmount();
  });
});

// ===========================================================================
// 15.2 · 只改 attrs ⇒ 根 class/style 跟着更新
// ===========================================================================

describe('Transfer · 动态 attrs 响应性（Issue #15.2）', () => {
  it('★ 宿主只改 class / style ⇒ 根节点类名与宽度同步更新', async () => {
    const cls = ref('user-a');
    const width = ref('200px');
    const Host = defineComponent({
      name: 'ATransferAttrsHost',
      setup: () => () =>
        h(Transfer, {
          dataSource: DATA_SOURCE,
          class: cls.value,
          style: { width: width.value },
        }),
    });
    const w = mount(Host);
    await nextTick();

    const root = w.find('.apollo-transfer');
    expect(root.exists()).toBe(true);
    expect(root.classes()).toContain('user-a');
    expect((root.element as HTMLElement).style.width).toBe('200px');

    cls.value = 'user-b';
    width.value = '321px';
    await nextTick();

    expect(root.classes()).toContain('user-b');
    expect(root.classes()).not.toContain('user-a');
    // 引擎自己的类名一个都不掉
    expect(root.classes()).toContain('apollo-transfer');
    expect((root.element as HTMLElement).style.width).toBe('321px');
    w.unmount();
  });

  it('★ attrs.style 走语义 root 通道：压过 styles.root 同字段、其余合并', async () => {
    const Host = defineComponent({
      name: 'ATransferStyleMergeHost',
      setup: () => () =>
        h(Transfer, {
          dataSource: DATA_SOURCE,
          style: { width: '200px', color: 'red' },
          styles: { root: { color: 'blue', fontSize: '12px' } },
        }),
    });
    const w = mount(Host);
    await nextTick();

    const style = (w.find('.apollo-transfer').element as HTMLElement).style;
    // attrs.style 是 stylesList 最后一项（antd 的 styleRoot 位）⇒ 覆盖 styles.root
    expect(style.color).toBe('red');
    // 没被覆盖的字段仍在（合并而非替换）
    expect(style.width).toBe('200px');
    expect(style.fontSize).toBe('12px');
    w.unmount();
  });

  it('★ 优先级链：ConfigProvider 组件级 style < styles.root < attrs.style', async () => {
    const w = mount(ConfigProvider, {
      props: { components: { transfer: { style: { color: 'green', padding: '1px' } } } },
      slots: {
        default: () =>
          h(Transfer, {
            dataSource: DATA_SOURCE,
            style: { color: 'red' },
            styles: { root: { margin: '2px' } },
          }),
      },
    });
    await nextTick();

    const style = (w.find('.apollo-transfer').element as HTMLElement).style;
    // 组件级 style 被 attrs.style 覆盖
    expect(style.color).toBe('red');
    // 但组件级里没被覆盖的字段保留（合并而非替换）
    expect(style.padding).toBe('1px');
    // styles.root 也没被丢
    expect(style.margin).toBe('2px');
    w.unmount();
  });
});

// ===========================================================================
// 15.3 · prefixCls 动态切换 ⇒ Section 子级前缀同步
// ===========================================================================

describe('Transfer · prefixCls 动态切换（Issue #15.3）', () => {
  it('★ 局部 prefixCls 切换 ⇒ Section / ListBody 前缀全部跟上', async () => {
    const prefix = ref('p1');
    const Host = defineComponent({
      name: 'ATransferPrefixHost',
      setup: () => () => h(Transfer, { dataSource: DATA_SOURCE, prefixCls: prefix.value }),
    });
    const w = mount(Host);
    await nextTick();

    expect(w.findAll('.p1-section').length).toBe(2);
    expect(w.findAll('.p1-list-content').length).toBe(1); // 右列为空 ⇒ not-found，无 ul
    expect(w.findAll('.p1-list-header').length).toBe(2);

    prefix.value = 'p2';
    await nextTick();

    // 根 / Section / 列表体前缀一致换成新值
    expect(w.find('.p2').exists()).toBe(true);
    expect(w.findAll('.p2-section').length).toBe(2);
    expect(w.findAll('.p2-list-content').length).toBe(1);
    expect(w.findAll('.p2-list-header').length).toBe(2);
    // 旧前缀一个不剩
    expect(w.find('.p1-section').exists()).toBe(false);
    expect(w.find('.p1-list-content').exists()).toBe(false);
    w.unmount();
  });

  it('★ 全局 ConfigProvider prefixCls 切换 ⇒ 同样贯通到 Section 子级', async () => {
    const w = mount(ConfigProvider, {
      props: { prefixCls: 'g1' },
      slots: { default: () => h(Transfer, { dataSource: DATA_SOURCE }) },
    });
    await nextTick();

    expect(w.findAll('.g1-transfer-section').length).toBe(2);
    expect(w.findAll('.g1-transfer-list-content').length).toBe(1);

    await w.setProps({ prefixCls: 'g2' });
    await nextTick();

    expect(w.findAll('.g2-transfer-section').length).toBe(2);
    expect(w.findAll('.g2-transfer-list-content').length).toBe(1);
    expect(w.find('.g1-transfer-section').exists()).toBe(false);
    w.unmount();
  });
});
