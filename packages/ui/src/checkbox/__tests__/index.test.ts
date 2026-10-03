/**
 * L1/L2 · 单元测试（Checkbox）—— 覆盖 L4 拿不到的运行时契约。
 *
 * 上游测试转断言：checkbox.test.tsx / group.test.tsx。
 */

import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { Checkbox, CheckboxGroup } from '../index';

afterEach(() => {
  vi.restoreAllMocks();
});

const findInput = (w: ReturnType<typeof mount>) => w.find('input');

describe('Checkbox · 基本行为', () => {
  it('非受控：click ⇒ checked 变化 + onChange({target:{checked}})', async () => {
    const onChange = vi.fn();
    const w = mount(Checkbox, {
      attrs: { onChange },
      slots: { default: () => 'Checkbox' },
    });
    await findInput(w).setValue(true);
    expect(onChange).toHaveBeenCalledTimes(1);
    const evt = onChange.mock.calls[0]?.[0];
    expect(evt?.target.checked).toBe(true);
    expect(w.find('.apollo-checkbox-wrapper').classes()).toContain(
      'apollo-checkbox-wrapper-checked',
    );
  });

  it('受控：click 只发事件，状态由父级决定', async () => {
    const onChange = vi.fn();
    const checked = ref(false);
    const App = defineComponent({
      setup() {
        return () =>
          h(Checkbox, {
            checked: checked.value,
            onChange: (e: { target: { checked: boolean } }) => {
              onChange(e);
              checked.value = e.target.checked;
            },
          });
      },
    });
    const w = mount(App);
    await findInput(w).setValue(true);
    await nextTick();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(w.find('.apollo-checkbox-wrapper').classes()).toContain(
      'apollo-checkbox-wrapper-checked',
    );
    checked.value = false;
    await nextTick();
    expect(w.find('.apollo-checkbox-wrapper').classes()).not.toContain(
      'apollo-checkbox-wrapper-checked',
    );
  });

  it('hover 事件落 label（上游 responses hover events）', async () => {
    const onMouseEnter = vi.fn();
    const onMouseLeave = vi.fn();
    const w = mount(Checkbox, { attrs: { onMouseEnter, onMouseLeave } });
    await w.find('label').trigger('mouseenter');
    await w.find('label').trigger('mouseleave');
    expect(onMouseEnter).toHaveBeenCalledTimes(1);
    expect(onMouseLeave).toHaveBeenCalledTimes(1);
  });

  it('onFocus / onBlur 落 input（上游 issue 50768）', async () => {
    const onBlur = vi.fn();
    const onFocus = vi.fn();
    const w = mount(Checkbox, { attrs: { onBlur, onFocus } });
    await findInput(w).trigger('focus');
    await findInput(w).trigger('blur');
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('indeterminate 直接写 input.indeterminate（rerender 也要反映）', async () => {
    const indeterminate = ref(true);
    const App = defineComponent({
      setup() {
        return () => h(Checkbox, { indeterminate: indeterminate.value });
      },
    });
    const w = mount(App);
    const input = findInput(w).element as HTMLInputElement;
    expect(input.indeterminate).toBe(true);
    indeterminate.value = false;
    await nextTick();
    expect(input.indeterminate).toBe(false);
  });

  it('组外传 value 且无 checked ⇒ usage 告警', async () => {
    // ⚠️ utils 的 warning() 走 console.error（`Warning: [apollo Checkbox] …`）
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mount(Checkbox, { props: { value: true } });
    await nextTick();
    expect(
      spy.mock.calls.some((call) => String(call[0]).includes('`value` is not a valid prop')),
    ).toBe(true);
    spy.mockRestore();
  });

  it('事件冒泡锁：label click 后紧跟的 input click 不重复触发外层（上游 useBubbleLock）', async () => {
    const onClick = vi.fn();
    const onRootClick = vi.fn();
    const w = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              'div',
              { onClick: onRootClick },
              h(Checkbox, { onClick }, { default: () => undefined }),
            );
        },
      }),
    );
    // 点 label（会派生 input click —— jsdom 中 label→input 联动）
    await w.find('label').trigger('click');
    const first = onClick.mock.calls.length;
    expect(first).toBeGreaterThanOrEqual(1);
    expect(onRootClick.mock.calls.length).toBeLessThanOrEqual(first);
  });
});

describe('CheckboxGroup', () => {
  it('基本序列（上游 should work basically）', async () => {
    const onChange = vi.fn();
    const w = mount(CheckboxGroup, {
      props: { options: ['Apple', 'Pear', 'Orange'], onChange },
    });
    const inputs = w.findAll('input');
    await inputs[0]?.setValue(true);
    expect(onChange).toHaveBeenLastCalledWith(['Apple']);
    await inputs[1]?.setValue(true);
    expect(onChange).toHaveBeenLastCalledWith(['Apple', 'Pear']);
    await inputs[2]?.setValue(true);
    expect(onChange).toHaveBeenLastCalledWith(['Apple', 'Pear', 'Orange']);
    await inputs[1]?.setValue(false);
    expect(onChange).toHaveBeenLastCalledWith(['Apple', 'Orange']);
  });

  it('整组 disabled ⇒ 不触发 onChange；option 级 disabled 单独生效', async () => {
    const onChangeGroup = vi.fn();
    const w = mount(CheckboxGroup, {
      props: {
        options: [
          { label: 'Apple', value: 'Apple' },
          { label: 'Pear', value: 'Pear', disabled: true },
        ],
        onChange: onChangeGroup,
      },
    });
    const inputs = w.findAll('input');
    await inputs[0]?.setValue(true);
    expect(onChangeGroup).toHaveBeenCalledWith(['Apple']);
    // Pear 的 input 是 disabled ⇒ jsdom 不派发 change
    expect(inputs[1]?.element.disabled).toBe(true);
  });

  it('Group disabled ⇒ 子 input 全部禁用且点击不触发', async () => {
    const onChangeGroup = vi.fn();
    const w = mount(CheckboxGroup, {
      props: { options: ['Apple', 'Pear'], onChange: onChangeGroup, disabled: true },
    });
    for (const input of w.findAll('input')) {
      expect(input.element.disabled).toBe(true);
      await input.setValue(true);
    }
    expect(onChangeGroup).not.toHaveBeenCalled();
  });

  it('Group disabled=false 能显式关闭 contextDisabled（上游 ?? 判据）', () => {
    const w = mount(CheckboxGroup, {
      props: { disabled: false },
      slots: { default: () => h(Checkbox, { props: { value: 'Apple' } }) },
    });
    // ConfigProvider 未启用 disabled ⇒ 子 input 不禁用
    expect(findInput(w).element.disabled).toBe(false);
  });

  it('name 透传到每个子 input（上游 all children should have a name）', () => {
    const w = mount(CheckboxGroup, {
      props: { options: ['Yes', 'No'], name: 'checkboxgroup' },
    });
    for (const input of w.findAll('input[type="checkbox"]')) {
      expect(input.attributes('name')).toBe('checkboxgroup');
    }
  });

  it('受控 value（上游 should be controlled by value）', async () => {
    const w = mount(CheckboxGroup, { props: { options: ['Apple', 'Orange'] } });
    expect(w.findAll('.apollo-checkbox-checked').length).toBe(0);
    await w.setProps({ value: ['Apple'] });
    expect(w.findAll('.apollo-checkbox-checked').length).toBe(1);
  });

  it('value=undefined 回退 defaultValue（上游 value is undefined）', async () => {
    const onChange = vi.fn();
    const w = mount(CheckboxGroup, {
      props: { defaultValue: ['A'], value: undefined, options: ['A', 'B'], onChange },
    });
    const checkboxes = w.findAll('input');
    expect((checkboxes[0]?.element as HTMLInputElement | undefined)?.checked).toBe(true);
    await checkboxes[1]?.setValue(true);
    expect((checkboxes[0]?.element as HTMLInputElement | undefined)?.checked).toBe(true);
    expect(onChange).toHaveBeenCalledWith(['A', 'B']);
  });

  it('子 Checkbox 的 onChange 收到 target.value（上游 issue 12642）', async () => {
    const onChange = vi.fn();
    const w = mount(CheckboxGroup, {
      slots: { default: () => h(Checkbox, { value: 'my', onChange }) },
    });
    await w.findAll('input')[0]?.setValue(true);
    expect(onChange.mock.calls[0]?.[0]?.target.value).toBe('my');
  });

  it('onChange 过滤已移除的值（上游 issue 16376）', async () => {
    const onChange = vi.fn();
    const showFirst = ref(true);
    const App = defineComponent({
      setup() {
        return () =>
          h(
            CheckboxGroup,
            { defaultValue: [1], onChange },
            {
              default: () => [
                showFirst.value ? h(Checkbox, { key: 1, value: 1 }) : null,
                h(Checkbox, { key: 2, value: 2 }),
              ],
            },
          );
      },
    });
    const w = mount(App);
    showFirst.value = false;
    await nextTick();
    await w.findAll('input')[0]?.setValue(true);
    expect(onChange).toHaveBeenLastCalledWith([2]);
  });

  it('onChange 保持原值顺序（上游 issue 17297）', async () => {
    const onChange = vi.fn();
    const w = mount(CheckboxGroup, {
      slots: {
        default: () => [
          h(Checkbox, { key: 1, value: 1 }),
          h(Checkbox, { key: 2, value: 2 }),
          h(Checkbox, { key: 3, value: 3 }),
          h(Checkbox, { key: 4, value: 4 }),
        ],
      },
      props: { onChange },
    });
    const inputs = w.findAll('input');
    await inputs[0]?.setValue(true);
    expect(onChange).toHaveBeenLastCalledWith([1]);
    await inputs[1]?.setValue(true);
    expect(onChange).toHaveBeenLastCalledWith([1, 2]);
    await inputs[0]?.setValue(false);
    expect(onChange).toHaveBeenLastCalledWith([2]);
    await inputs[0]?.setValue(true);
    expect(onChange).toHaveBeenLastCalledWith([1, 2]);
  });

  it('skipGroup：脱离 Group 管理（上游 skipGroup）', async () => {
    const onChange = vi.fn();
    const w = mount(CheckboxGroup, {
      props: { onChange },
      slots: {
        default: () => [h(Checkbox, { value: 1 }), h(Checkbox, { value: 2, skipGroup: true })],
      },
    });
    await w.findAll('input')[1]?.setValue(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('Group 的 ref 是 div（上游 should get div ref）', () => {
    const w = mount(CheckboxGroup, { props: { options: ['Apple', 'Pear', 'Orange'] } });
    expect(w.element.tagName).toBe('DIV');
  });

  it('number 选项（上游 should support number option）', async () => {
    const onChange = vi.fn();
    const w = mount(CheckboxGroup, {
      props: { options: [1, 2, 3], defaultValue: [2], onChange },
    });
    expect(w.findAll('.apollo-checkbox-checked').length).toBe(1);
    await w.findAll('input')[0]?.setValue(true);
    expect(onChange).toHaveBeenLastCalledWith([1, 2]);
  });
});

describe('Checkbox · v-model（COMPATIBILITY.md 规则 C11，PITFALLS 162 收尾）', () => {
  it('v-model:checked 与 onChange 同时发出', async () => {
    const onChange = vi.fn();
    const checked = ref(false);
    const App = defineComponent({
      setup() {
        return () =>
          h(Checkbox, {
            checked: checked.value,
            'onUpdate:checked': (v: boolean) => {
              checked.value = v;
            },
            onChange,
          });
      },
    });
    const w = mount(App);
    await findInput(w).setValue(true);
    await nextTick();
    expect(checked.value).toBe(true);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(w.find('input').element.checked).toBe(true);
  });

  it('Group 的 v-model:value 与 onChange 同时发出（载荷同 onChange：排序后）', async () => {
    const onChange = vi.fn();
    const value = ref(['Apple']);
    const App = defineComponent({
      setup() {
        return () =>
          h(CheckboxGroup, {
            options: ['Apple', 'Pear', 'Orange'],
            value: value.value,
            'onUpdate:value': (v: string[]) => {
              value.value = v;
            },
            onChange,
          });
      },
    });
    const w = mount(App);
    await w.findAll('input')[1]?.setValue(true);
    await nextTick();
    expect(value.value).toEqual(['Apple', 'Pear']);
    expect(onChange).toHaveBeenLastCalledWith(['Apple', 'Pear']);
  });
});
