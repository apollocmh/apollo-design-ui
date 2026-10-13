/**
 * L1/L2 —— **Issue #8 的三项回归**（先复现再修）。
 *
 * | # | 判据 | 修复前的红灯表现 |
 * |---|---|---|
 * | 8.1 | Form 的 `size` 运行时更新能传导到子控件 | `useSize(props.size)` 收 setup 期裸值 ⇒ computed 追不到；且根类名判据是裸 `props.size` ⇒ `componentSize` 不产 `-small` |
 * | 8.2 | 调用方 `class` / `style` 与 Form 自己生成的**并存** | 没有语义通道：根 `class` / `style` 直接覆盖 `{...attrs}` ⇒ 调用方值**整条丢**；context 的 `classNames` / `styles` 也被丢 |
 * | 8.3 | 同一次交互里用户回调**恰好一次** | ① 用户回调的键算成 `onOnChange` ⇒ **一次都不调**；② `cloneVNode` 的 `mergeProps` 把 `on*` **拼成数组** ⇒ 非触发事件（`onInput`）调 **2 次**，触发事件变数组后子组件直接当函数调 ⇒ `TypeError: attrs.onChange is not a function` |
 *
 * ── 🚨 三条判据（写错过就会返工）──────────────────────────────────────────
 *
 * 1. **子控件的尺寸类名**是 `apollo-input-sm` / `-lg`；Form 根的是
 *    `apollo-form-small` / `-large`（注意 Form 用全称、Input 用缩写，别抄错）。
 * 2. **VTU 的 `setValue()` 对文本输入会同时派发 `input` 与 `change`** ——
 *    计数用例里**只能调一次** `setValue`（再手动 `trigger('change')` 会数出 2，
 *    那是两个事件，不是双调）。
 * 3. `onChange` 要落在**原生子元素**上才测得到（`FormItem` 的触发事件注入的是
 *    DOM 事件键）；用本仓 `Input` 时它自己的 `onChange` 是组件事件、不会绑到 DOM。
 */

import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import ConfigProvider from '../../config-provider/ConfigProvider';
import Input from '../../input';
import { Form, FormItem } from '../index';

afterEach(() => {
  document.body.innerHTML = '';
});

const P = 'apollo-form';

const mountField = (child: () => ReturnType<typeof h>) =>
  mount(Form, { slots: { default: () => h(FormItem, { name: 'a' }, { default: child }) } });

// ===========================================================================
// 8.1 · 动态 size
// ===========================================================================

describe('Form · `size` 的动态传导（Issue #8.1）', () => {
  const Host = defineComponent({
    name: 'AFormSizeHost',
    setup() {
      const size = ref<'small' | 'large' | undefined>('small');
      return { size };
    },
    render() {
      return h(Form as never, { size: this.size } as never, {
        default: () =>
          h(FormItem as never, { name: 'a' } as never, { default: () => h(Input as never) }),
      });
    },
  });

  it('★ `small → large → undefined` 每次都传到子控件', async () => {
    const w = mount(Host);
    await nextTick();

    const inputCls = () => (w.find('input').element as HTMLElement).className;
    expect(inputCls()).toContain('apollo-input-sm');

    (w.vm as unknown as { size: string }).size = 'large';
    await nextTick();
    expect(inputCls()).toContain('apollo-input-lg');

    (w.vm as unknown as { size: string | undefined }).size = undefined;
    await nextTick();
    expect(inputCls()).not.toContain('apollo-input-lg');
    expect(inputCls()).not.toContain('apollo-input-sm');
    w.unmount();
  });

  it('★ `ConfigProvider componentSize` 也要产出根类 `-small`（上游判据是 `mergedSize`）', () => {
    const w = mount(ConfigProvider, {
      props: { componentSize: 'small' },
      slots: { default: () => h(Form, null, { default: () => h(FormItem, { name: 'a' }) }) },
    });
    expect(w.find(`.${P}`).classes()).toContain(`${P}-small`);
    w.unmount();
  });

  it('反向哨兵：不传 size / componentSize ⇒ 两个尺寸类都没有', () => {
    const w = mount(Form, { slots: { default: () => h(FormItem, { name: 'a' }) } });
    const cls = w.find(`.${P}`).classes();
    expect(cls).not.toContain(`${P}-small`);
    expect(cls).not.toContain(`${P}-large`);
    w.unmount();
  });
});

// ===========================================================================
// 8.2 · 根 class / style 的合并
// ===========================================================================

describe('Form · 根 class / style 与调用方值并存（Issue #8.2）', () => {
  const formEl = (w: ReturnType<typeof mount>) => w.find(`.${P}`).element as HTMLElement;

  it('★ 原生 `class` 与 Form 自己的类名并存', () => {
    const w = mount(Form, {
      attrs: { class: 'my-form' },
      slots: { default: () => h(FormItem, { name: 'a' }) },
    });
    const cls = formEl(w).className;
    expect(cls).toContain('my-form');
    // Form 自己生成的类名一个都不能掉
    expect(cls).toContain(P);
    expect(cls).toContain(`${P}-horizontal`);
    w.unmount();
  });

  it('★ 原生 `style`（字符串 / 对象）落到根，且与 `styles.root` 合并', () => {
    const str = mount(Form, {
      attrs: { style: 'width: 240px' },
      slots: { default: () => h(FormItem, { name: 'a' }) },
    });
    expect(formEl(str).style.width).toBe('240px');
    str.unmount();

    const both = mount(Form, {
      props: { styles: { root: { color: 'red' } } },
      attrs: { style: 'width: 240px' },
      slots: { default: () => h(FormItem, { name: 'a' }) },
    });
    expect(formEl(both).style.width).toBe('240px');
    expect(formEl(both).style.color).toBe('red');
    both.unmount();
  });

  it('★ `ConfigProvider` 的 `components.form.classNames` / `styles` 也参与合并', () => {
    const w = mount(ConfigProvider, {
      props: {
        components: {
          form: { classNames: { root: 'ctx-form' }, styles: { root: { color: 'blue' } } },
        },
      },
      slots: {
        default: () =>
          h(Form as never, { class: 'my-form', style: 'width: 100px' } as never, {
            default: () => h(FormItem as never, { name: 'a' } as never),
          }),
      },
    });
    const el = w.find(`.${P}`).element as HTMLElement;
    expect(el.className).toContain('ctx-form');
    expect(el.className).toContain('my-form');
    expect(el.style.color).toBe('blue');
    expect(el.style.width).toBe('100px');
    w.unmount();
  });

  it('★ 函数式 `classNames` 拿到**当前** props（不再被当对象读）', async () => {
    const disabled = ref(false);
    const Host = defineComponent({
      name: 'AFormFnHost',
      setup: () => () =>
        h(
          Form as never,
          {
            disabled: disabled.value,
            classNames: (info: { props: { disabled?: boolean } }) => ({
              root: info.props.disabled ? 'is-off' : 'is-on',
            }),
          } as never,
        ),
    });
    const w = mount(Host);
    await nextTick();
    expect(formEl(w).className).toContain('is-on');

    disabled.value = true;
    await nextTick();
    expect(formEl(w).className).toContain('is-off');
    expect(formEl(w).className).not.toContain('is-on');
    w.unmount();
  });
});

// ===========================================================================
// 8.3 · 子节点事件只调一次
// ===========================================================================

describe('FormItem · 子节点事件恰好一次（Issue #8.3）', () => {
  it('★ 原生子元素：用户的 `onChange` **恰好一次**，且不再 `attrs.onChange is not a function`', async () => {
    const onChange = vi.fn();
    const w = mountField(() => h('input', { onChange }));
    const input = w.find('input');

    // ⚠️ 只调一次 `setValue`：VTU 对文本输入会同时派发 `input` 与 `change`
    //    （再手动 trigger('change') 会数出 2，那是**两个事件**）
    await input.setValue('y');

    // 修复前：`userHandler` 查的是 `onOnChange` ⇒ 恒 undefined ⇒ **0 次**
    expect(onChange).toHaveBeenCalledTimes(1);
    // 表单值也真的更新了（control 那一半没被牺牲）
    expect(w.emitted('valuesChange')).toBeTruthy();
    w.unmount();
  });

  it('★ 非触发事件（`onInput`）也只调一次（此前被 `mergeProps` 拼成数组 ⇒ 2 次）', async () => {
    const onInput = vi.fn();
    const w = mountField(() => h('input', { onInput }));
    await w.find('input').setValue('z');

    expect(onInput).toHaveBeenCalledTimes(1);
    w.unmount();
  });

  it('★ 本仓 `Input` 子节点同样只调一次（走 v-model 桥那条路径）', async () => {
    const onInput = vi.fn();
    const w = mountField(() => h(Input, { onInput }));
    await w.find('input').setValue('w');

    expect(onInput).toHaveBeenCalledTimes(1);
    w.unmount();
  });

  it('反向哨兵：**不**在 FormItem 里时，用户回调本来就只有一次（对照）', async () => {
    const onInput = vi.fn();
    const w = mount(Input, { props: { onInput } });
    await w.find('input').setValue('v');

    expect(onInput).toHaveBeenCalledTimes(1);
    w.unmount();
  });

  it('`trigger="onBlur"` 也可以（键名就是 `onXxx` 形态，不再被二次加 `on`）', async () => {
    const onBlur = vi.fn();
    const w = mount(Form, {
      slots: {
        default: () =>
          h(FormItem, { name: 'a', trigger: 'onBlur' }, { default: () => h(Input, { onBlur }) }),
      },
    });
    await w.find('input').trigger('blur');

    expect(onBlur).toHaveBeenCalledTimes(1);
    w.unmount();
  });
});
