/**
 * L1/L2 —— **Issue #9 的三项回归**（先复现再修）。
 *
 * | # | 判据 | 修复前的红灯表现 |
 * |---|---|---|
 * | 9.1 | `id` / `required` / `tabIndex` / `autoFocus` 落到原生 `input` | 它们是**声明过的 prop** ⇒ Vue 已从 `attrs` 摘走 ⇒ 一个都不落 input（`id` 连 `label for` 都关联不上） |
 * | 9.2 | 替换 `onClick` 后只调**新**回调 | `useBubbleLock(callbacks.onClick)` 在 setup 期捕获裸值 ⇒ 永远调旧函数 |
 * | 9.3 | 子项 `value` 变了，Group 注册表同步 | 只在挂载/卸载注册 ⇒ `registeredValues` 持旧值；而 `toggleOption` 会 `filter(val => registeredValues.includes(val))` ⇒ **新值被过滤掉** |
 *
 * ── 🚨 落点判据（antd 6.6.4 SSR 实测，不要凭记忆）──────────────────────────
 *
 * ```html
 * <label class="apollo-checkbox-wrapper">
 *   <span class="apollo-checkbox" title="T">
 *     <input id="cb-1" required tabindex="3" autofocus class="apollo-checkbox-input" type="checkbox" name="n1" aria-label="al" />
 *   </span>
 * </label>
 * ```
 * ⇒ `id` / `required` / `tabIndex` / `autoFocus` / `aria-*` / `name` 全在 **input**；
 *   `title` 在**内层 `<span class="apollo-checkbox">`**（不是根 `label`、不是 input）。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { Checkbox, CheckboxGroup } from '../index';

const P = 'apollo-checkbox';

const mountBox = (props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) =>
  mount(Checkbox, { props, attrs, attachTo: document.body });

const inputOf = (w: ReturnType<typeof mount>) => w.find(`.${P}-input`);

// ===========================================================================
// 9.1 · 原生属性落 input
// ===========================================================================

describe('Checkbox · 原生属性落到 input（Issue #9.1）', () => {
  it('★ `id` / `required` / `tabIndex` 都在 `<input>` 上', () => {
    const w = mountBox({ id: 'cb-1', required: true, tabIndex: 3 });
    const input = inputOf(w);

    expect(input.attributes('id')).toBe('cb-1');
    expect(input.attributes('required')).toBeDefined();
    expect(input.attributes('tabindex')).toBe('3');
    // ⚠️ 不能落错地方：根 `label` 上没有 `id`（否则 `label for` 会指到自己）
    expect(w.find('label').attributes('id')).toBeUndefined();
    w.unmount();
  });

  it('不传 ⇒ 三个属性都不渲染（`undefined` 不等于 `false`）', () => {
    const w = mountBox();
    const input = inputOf(w);
    expect(input.attributes('id')).toBeUndefined();
    expect(input.attributes('required')).toBeUndefined();
    expect(input.attributes('tabindex')).toBeUndefined();
    w.unmount();
  });

  it('★ `autoFocus` ⇒ 挂载后原生 input 获得焦点', async () => {
    const w = mountBox({ autoFocus: true });
    await nextTick();
    expect(document.activeElement).toBe(inputOf(w).element);
    w.unmount();
  });

  it('★ `autoFocus` + `disabled` ⇒ 不聚焦', async () => {
    const w = mountBox({ autoFocus: true, disabled: true });
    await nextTick();
    expect(document.activeElement).not.toBe(inputOf(w).element);
    w.unmount();
  });

  it('`title` 落**内层 span**（不是 input、不是根 label）', () => {
    const w = mountBox({ title: 'T' });
    expect(w.find(`span.${P}`).attributes('title')).toBe('T');
    expect(inputOf(w).attributes('title')).toBeUndefined();
    w.unmount();
  });

  it('`aria-label` 落 input（attrs 通道，回归哨兵）', () => {
    const w = mountBox({}, { 'aria-label': 'al' });
    expect(inputOf(w).attributes('aria-label')).toBe('al');
    w.unmount();
  });
});

// ===========================================================================
// 9.2 · 替换 onClick
// ===========================================================================

/**
 * ⚠️ 换 handler 必须经**父组件**（Host）而不是改 `wrapper.vm.$attrs`：
 *    - `setProps({ onClick })` 在**类型层**就不成立（`onClick` 不是声明过的 prop，
 *      PITFALLS 35 ⇒ 只能走 attrs），`vue-tsc` 会报 TS2353；
 *    - 直接改 `wrapper.vm.$attrs` 实测**不生效**（VTU 的 `$attrs` 不是触发源）。
 *    ⇒ 用一个 Host 持有响应式 handler 引用，暴露 `swap()` 换它。
 */
const mountSwappable = (eventName: 'onClick' | 'onChange') => {
  const first = vi.fn();
  const second = vi.fn();
  const Host = defineComponent({
    setup(_, { expose }) {
      const handler = ref<((...args: unknown[]) => void) | undefined>(first);
      expose({ swap: () => (handler.value = second) });
      return () =>
        eventName === 'onClick'
          ? h(Checkbox, { onClick: handler.value })
          : h(Checkbox, { onChange: handler.value });
    },
  });
  return { first, second, w: mount(Host) };
};

describe('Checkbox · 替换 `onClick` 后用新回调（Issue #9.2）', () => {
  it('★ 换掉 `onClick` 之后点 input ⇒ 只调新的', async () => {
    const { first, second, w } = mountSwappable('onClick');

    await inputOf(w).trigger('click');
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();

    (w.vm as unknown as { swap: () => void }).swap();
    await nextTick();
    first.mockClear();

    await inputOf(w).trigger('click');
    // 🚨 修复前：这里 first 仍会被调到（hook 把首帧回调焊死了）
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
    w.unmount();
  });

  it('反向哨兵：`onChange` 一直是 attrs（本来就是现读的，不应回退）', async () => {
    const { first, second, w } = mountSwappable('onChange');

    await inputOf(w).setValue(true);
    expect(first).toHaveBeenCalledTimes(1);

    (w.vm as unknown as { swap: () => void }).swap();
    await nextTick();
    first.mockClear();
    await inputOf(w).setValue(false);
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
    w.unmount();
  });
});

// ===========================================================================
// 9.3 · Group 注册表跟随 value
// ===========================================================================

describe('CheckboxGroup · 子项 `value` 变更后注册表同步（Issue #9.3）', () => {
  /** 两个子 Checkbox，第二个的 `value` 可以在运行中改。 */
  const Host = defineComponent({
    name: 'ACheckboxGroupValueHost',
    setup() {
      const second = ref('b');
      return { second };
    },
    render() {
      return h(
        CheckboxGroup,
        { value: [] },
        {
          default: () => [
            h(Checkbox, { value: 'a', key: 'a' }),
            h(Checkbox, { value: this.second, key: 'b' }),
          ],
        },
      );
    },
  });

  it('★ 子项 `value` 从 `b` 改成 `c`（DOM 不卸载）⇒ 点它发出的是 `c`', async () => {
    const w = mount(Host);
    await nextTick();

    const boxes = () => w.findAll(`.${P}-input`);
    expect(boxes()).toHaveLength(2);

    // 改第二个子项的 value
    (w.vm as unknown as { second: string }).second = 'c';
    await nextTick();

    await boxes()[1]?.setValue(true);

    const group = w.findComponent(CheckboxGroup);
    const emitted = group.emitted('update:value')?.at(-1)?.[0];
    // 🚨 修复前：注册表里只有 `a` / `b` ⇒ `toggleOption` 的
    //    `.filter(val => registeredValues.includes(val))` 把 `c` 过滤掉 ⇒ 空数组
    expect(emitted).toEqual(['c']);
    w.unmount();
  });

  it('反向哨兵：未改 `value` 时行为不变（`b` 仍可用）', async () => {
    const w = mount(Host);
    await nextTick();

    await w.findAll(`.${P}-input`)[1]?.setValue(true);

    const group = w.findComponent(CheckboxGroup);
    expect(group.emitted('update:value')?.at(-1)?.[0]).toEqual(['b']);
    w.unmount();
  });

  it('★ 连续改两次（`b → c → d`）不残留、不双注册', async () => {
    const w = mount(Host);
    await nextTick();

    const vm = w.vm as unknown as { second: string };
    vm.second = 'c';
    await nextTick();
    vm.second = 'd';
    await nextTick();

    await w.findAll(`.${P}-input`)[1]?.setValue(true);
    const group = w.findComponent(CheckboxGroup);
    expect(group.emitted('update:value')?.at(-1)?.[0]).toEqual(['d']);
    w.unmount();
  });
});
