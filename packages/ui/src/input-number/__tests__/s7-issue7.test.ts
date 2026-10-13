/**
 * L1/L2 —— **Issue #7 的五项回归**（先复现再修）。
 *
 * | # | 判据 | 修复前的红灯表现 |
 * |---|---|---|
 * | 7.1 | 调用方 `style` **落根** | `restInputAttrs()` 保留 `style`（不给 input），而根只合并 `styles.root` ⇒ `style="width:240px"` **整条丢掉** |
 * | 7.2 | `autoFocus` 挂载后真的聚焦 | 原生 `autofocus` 只在 HTML **解析期**生效，Vue 是创建后才设属性 ⇒ 浏览器/jsdom 都不聚焦；且 `autoFocus` 被摘成 prop ⇒ 传不进去 |
 * | 7.3 | 函数式 `classNames` / `styles` 拿到**当前** props | 第三参传 `mergedProps.value`（setup 期快照）⇒ 永远按首帧算 |
 * | 7.4 | `onStep` 载荷是 `ValueType`（`stringMode` 下是**字符串**） | 类型写死 `number`，实现靠 `as number` 断言骗 TS |
 * | 7.5 | `parser` 可返回 `number`、形参可为 `undefined` | 声明成 `(string_) => string` ⇒ `(t) => Number(t)` 这类合法用法被类型拒 |
 *
 * ── 🚨 三条判据（写错过一次就会返工）─────────────────────────────────────
 *
 * 1. **`onStep` 不是声明 prop**（`inputNumberPropDefs` 里没有）⇒ 它留在 `attrs` 里，
 *    测试要**当 attrs 传**（`mount(..., { attrs: { onStep } })` 或直接放进 props 对象
 *    都会落到 attrs，但显式写 attrs 更清楚）。`style` 同理。
 * 2. **`autoFocus` 是声明 prop**（`props.autoFocus`）—— 与 `style` / `onStep` 相反。
 * 3. **步进按钮是 `<span>`**（`-action-up` / `-action-down`），不是 `button`。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import ConfigProvider from '../../config-provider/ConfigProvider';
import { InputNumber } from '../index';

const P = 'apollo-input-number';

const rootOf = (w: ReturnType<typeof mount>) => w.find(`.${P}`).element as HTMLElement;

// ===========================================================================
// 7.1 · 调用方 `style` 落根
// ===========================================================================

describe('InputNumber · 根 style 的合并（Issue #7.1）', () => {
  it('★ 原生 `style`（CSS 字符串）落到根', () => {
    const w = mount(InputNumber, { attrs: { style: 'width: 240px' } });
    expect(rootOf(w).style.width).toBe('240px');
    w.unmount();
  });

  it('★ 原生 `style`（对象）也落到根', () => {
    const w = mount(InputNumber, { attrs: { style: { width: '321px' } } });
    expect(rootOf(w).style.width).toBe('321px');
    w.unmount();
  });

  it('★ `style` **不**落到内部 `input`（免得宽度算两遍）', () => {
    const w = mount(InputNumber, { attrs: { style: 'width: 240px' } });
    expect((w.find('input').element as HTMLElement).style.width).not.toBe('240px');
    w.unmount();
  });

  it('★ 语义 `styles.root` 仍然生效，且**原生 attrs 胜**', () => {
    const withSemantic = mount(InputNumber, {
      props: { styles: { root: { width: '100px', color: 'red' } } },
    });
    expect(rootOf(withSemantic).style.width).toBe('100px');
    expect(rootOf(withSemantic).style.color).toBe('red');
    withSemantic.unmount();

    const both = mount(InputNumber, {
      props: { styles: { root: { width: '100px', color: 'red' } } },
      attrs: { style: 'width: 240px' },
    });
    // 原生 attrs 在 sources 的**最后** ⇒ 胜
    expect(rootOf(both).style.width).toBe('240px');
    // 语义里没被覆盖的字段仍保留（合并而不是替换）
    expect(rootOf(both).style.color).toBe('red');
    both.unmount();
  });

  it('组件级 `components.inputNumber.styles.root` 也参与合并（被原生 attrs 覆盖）', () => {
    const w = mount(ConfigProvider, {
      props: { components: { inputNumber: { styles: { root: { color: 'blue' } } } } },
      slots: { default: () => h(InputNumber, { style: 'width: 240px' }) },
    });
    const root = w.find(`.${P}`).element as HTMLElement;
    expect(root.style.color).toBe('blue');
    expect(root.style.width).toBe('240px');
    w.unmount();
  });
});

// ===========================================================================
// 7.2 · autoFocus
// ===========================================================================

describe('InputNumber · autoFocus（Issue #7.2）', () => {
  it('★ `autoFocus` ⇒ 挂载后原生 input 获得焦点', async () => {
    const w = mount(InputNumber, { props: { autoFocus: true }, attachTo: document.body });
    await nextTick();

    expect(document.activeElement).toBe(w.find('input').element);
    w.unmount();
  });

  it('★ `autoFocus` + `disabled` ⇒ 不聚焦', async () => {
    const w = mount(InputNumber, {
      props: { autoFocus: true, disabled: true },
      attachTo: document.body,
    });
    await nextTick();

    expect(document.activeElement).not.toBe(w.find('input').element);
    w.unmount();
  });

  it('不传 ⇒ 不抢焦点', async () => {
    const w = mount(InputNumber, { attachTo: document.body });
    await nextTick();
    expect(document.activeElement).not.toBe(w.find('input').element);
    w.unmount();
  });
});

// ===========================================================================
// 7.3 · 函数式语义槽
// ===========================================================================

describe('InputNumber · 函数式语义槽拿到当前 props（Issue #7.3）', () => {
  it('★ 函数式 `classNames` 随 `disabled` 变化重算', async () => {
    const disabled = ref(false);
    const Host = defineComponent({
      name: 'AINFnClassNamesHost',
      setup: () => () =>
        h(InputNumber, {
          disabled: disabled.value,
          classNames: (info: { props: { disabled?: boolean } }) => ({
            root: info.props.disabled ? 'is-off' : 'is-on',
          }),
        } as never),
    });
    const w = mount(Host);
    await nextTick();
    expect(rootOf(w).classList.contains('is-on')).toBe(true);

    disabled.value = true;
    await nextTick();
    expect(rootOf(w).classList.contains('is-off')).toBe(true);
    expect(rootOf(w).classList.contains('is-on')).toBe(false);
    w.unmount();
  });

  it('★ 函数式 `styles` 随 `size` 变化重算', async () => {
    const size = ref<'small' | 'large'>('small');
    const Host = defineComponent({
      name: 'AINFnStylesHost',
      setup: () => () =>
        h(InputNumber, {
          size: size.value,
          styles: (info: { props: { size?: string } }) => ({
            root: { width: info.props.size === 'large' ? '300px' : '100px' },
          }),
        } as never),
    });
    const w = mount(Host);
    await nextTick();
    expect(rootOf(w).style.width).toBe('100px');

    size.value = 'large';
    await nextTick();
    expect(rootOf(w).style.width).toBe('300px');
    w.unmount();
  });
});

// ===========================================================================
// 7.4 · onStep 载荷
// ===========================================================================

describe('InputNumber · onStep 的载荷形态（Issue #7.4）', () => {
  const upHandler = (w: ReturnType<typeof mount>) => w.find(`.${P}-action-up`);

  it('★ `stringMode` ⇒ `onStep` 收到**字符串**（类型已放宽到 `ValueType`）', async () => {
    const onStep = vi.fn();
    const w = mount(InputNumber, {
      props: { stringMode: true, defaultValue: '5', keyboard: false },
      attrs: { onStep },
    });
    await nextTick();

    await upHandler(w).trigger('mousedown');
    await nextTick();

    expect(onStep).toHaveBeenCalled();
    const payload = onStep.mock.calls.at(-1)?.[0];
    // 🚨 修复前类型写死 `number`，实现靠 `as number` 骗 TS ⇒ 这里拿到的其实是字符串
    expect(typeof payload).toBe('string');
    expect(payload).toBe('6');
    w.unmount();
  });

  it('非 stringMode ⇒ 收到**数字**（反向哨兵：没有被一刀切成字符串）', async () => {
    const onStep = vi.fn();
    const w = mount(InputNumber, {
      props: { defaultValue: 5, keyboard: false },
      attrs: { onStep },
    });
    await nextTick();

    await upHandler(w).trigger('mousedown');
    await nextTick();

    const payload = onStep.mock.calls.at(-1)?.[0];
    expect(typeof payload).toBe('number');
    expect(payload).toBe(6);
    w.unmount();
  });
});

// ===========================================================================
// 7.5 · parser 返回 number
// ===========================================================================

describe('InputNumber · parser 返回 number（Issue #7.5）', () => {
  it('★ 返回数字的 parser 仍然正常解析（不再被类型层拒）', async () => {
    const update = vi.fn();
    const w = mount(InputNumber, {
      // 上游签名：`(displayValue: string | undefined) => T`，`T extends ValueType`
      props: { parser: (text: string | undefined) => Number((text ?? '').replace(/,/g, '')) },
      attrs: { 'onUpdate:value': update },
    });
    const input = w.find('input');
    await input.setValue('1,234');
    await input.trigger('blur');
    await nextTick();
    await nextTick();

    expect(w.emitted('update:value')?.at(-1)?.[0]).toBe(1234);
    w.unmount();
  });
});
