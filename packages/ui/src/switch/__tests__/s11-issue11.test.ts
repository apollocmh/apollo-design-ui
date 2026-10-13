/**
 * Issue #11 批量修复的回归（switch）。
 *
 * 两项都是「**类型与运行时不一致**」家族：
 *
 * 1. [#11.1] 调用方的 `@keydown` 被内部 `onKeydown` **整条盖掉**：
 *    `restAttrs` 只摘走了 camelCase 的 `onKeyDown`，而 Vue 模板 `@keydown`
 *    编译出的键是 `onKeydown` ⇒ 它留在 `restAttrs` 里被 `...restAttrs` 铺上 button，
 *    紧接着又被 `onKeydown: onInternalKeyDown` **覆盖** ⇒ 调用方回调**一次都不调**。
 *    （`onInternalKeyDown` 内部读的是 `callbacks.onKeyDown`，即 camelCase 键。）
 * 2. [#11.2] 运行时 prop 声明成 `String`，而公开类型是 `VNodeChild`
 *    ⇒ 传 VNode 时 Vue 报 `Invalid prop: type check failed`。
 *    `interface.ts` 的注释**自己**写着该用
 *    `type: null as unknown as PropType<VNodeChild>`（规则 D21），代码却没照做。
 */

import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { Switch } from '../index';

const findButton = (w: ReturnType<typeof mount>) => w.find('button');

const keydown = async (el: Element, which: number) => {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'which', { value: which });
  el.dispatchEvent(event);
  await nextTick();
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Issue #11.1 · 调用方 keydown 监听器', () => {
  it('antd 名（camelCase `onKeyDown`）照旧只调一次', async () => {
    const onKeyDown = vi.fn();
    const w = mount(Switch, { attrs: { onKeyDown } });
    await keydown(findButton(w).element, 39);
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    w.unmount();
  });

  it('★ Vue 模板名（全小写 `onKeydown`）也要调一次，且不被内部覆盖', async () => {
    // Vue 的 `@keydown` 编译出的键就是 `onKeydown`（见
    // `packages/ui/src/__tests__/event-name-casing.test.ts` 的判据）。
    const onKeydown = vi.fn();
    const w = mount(Switch, { attrs: { onKeydown } });
    await keydown(findButton(w).element, 39);
    expect(onKeydown, 'Vue 模板写法必须生效').toHaveBeenCalledTimes(1);
    w.unmount();
  });

  it('★ 两种写法都生效时，内部键盘逻辑仍然跑（方向键改值）', async () => {
    const onKeydown = vi.fn();
    const w = mount(Switch, { attrs: { onKeydown }, props: { defaultChecked: false } });
    await keydown(findButton(w).element, 39); // RIGHT ⇒ 置为 true
    expect(w.emitted('update:checked')?.at(-1)).toEqual([true]);
    expect(onKeydown).toHaveBeenCalledTimes(1);
    w.unmount();
  });

  it('★ `@keydown` 形式的模板绑定（经 attrs 传）不落 button 的 DOM 属性', () => {
    const w = mount(Switch, { attrs: { onKeydown: () => {} } });
    // 监听器不应变成属性（Vue 的 isOn 判据 /^on[a-z]/ ⇒ 正确识别为监听器）
    expect(w.html()).not.toMatch(/onkeydown=/i);
    w.unmount();
  });
});

describe('Issue #11.2 · checkedChildren / unCheckedChildren 的 VNodeChild', () => {
  it('★ 传 VNode 不触发 Vue 的 prop 类型警告', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const w = mount(Switch, {
      props: { checked: true, checkedChildren: h('span', { class: 'node' }, 'N') },
    });
    expect(findButton(w).find('.node').exists(), 'VNode 内容应渲染').toBe(true);
    const messages = warn.mock.calls.map((c) => String(c[0])).join('\n');
    expect(messages, `不该有 prop 类型警告：\n${messages}`).not.toMatch(/Invalid prop/i);
    w.unmount();
  });

  it('★ 传组件 VNode 也不警告', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const Inner = defineComponent({ name: 'Inner', setup: () => () => h('b', 'inner') });
    const w = mount(Switch, {
      props: { checked: true, checkedChildren: h(Inner) },
    });
    expect(findButton(w).find('b').exists()).toBe(true);
    const messages = warn.mock.calls.map((c) => String(c[0])).join('\n');
    expect(messages, `不该有 prop 类型警告：\n${messages}`).not.toMatch(/Invalid prop/i);
    w.unmount();
  });

  it('★ 字符串仍然照常（不因放宽类型而回退）', () => {
    const w = mount(Switch, { props: { checked: true, checkedChildren: 'On' } });
    expect(findButton(w).text()).toContain('On');
    w.unmount();
  });

  it('★ 动态替换 VNode 内容会跟随更新（受控 checked 切换两侧）', async () => {
    const checked = ref(true);
    const Host = defineComponent({
      setup: () => () =>
        h(Switch, {
          checked: checked.value,
          checkedChildren: h('i', { class: 'on' }, '+'),
          unCheckedChildren: h('i', { class: 'off' }, '-'),
        }),
    });
    const w = mount(Host);
    expect(w.find('i.on').exists()).toBe(true);
    checked.value = false;
    await nextTick();
    expect(w.find('i.off').exists()).toBe(true);
    w.unmount();
  });
});
