/**
 * L1/L2 · 单元与交互测试（Radio / RadioGroup / RadioButton）
 *
 * 上游测试转断言：`radio.test.tsx` / `group.test.tsx` / `radio-button.test.tsx`
 * （antd 6.6.4）。每条用例的注释标明它来自上游哪一条 —— 便于日后逐条对账。
 *
 * ⚠️ L4（DOM 契约）只投影 tag / class / role / aria-* / data-*，
 *    `checked` / `disabled` / `name` / `value` 这些**属性语义**只能在这里钉。
 */

import { waitFrames } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { ConfigProvider } from '../../config-provider';
import { Radio, RadioButton, RadioGroup } from '../index';

afterEach(() => {
  vi.restoreAllMocks();
});

const findInput = (w: ReturnType<typeof mount>) => w.find('input');

describe('Radio · 基本行为', () => {
  // 上游：should support uncontrolled checked state
  it('非受控：click ⇒ checked 变化 + onChange 一次', async () => {
    const onChange = vi.fn();
    const w = mount(Radio, { attrs: { onChange }, slots: { default: () => 'Radio' } });
    const input = findInput(w).element as HTMLInputElement;

    expect(input.checked).toBe(false);
    await findInput(w).setValue(true);

    expect(input.checked).toBe(true);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(w.find('.apollo-radio').classes()).toContain('apollo-radio-checked');
    // ⚠️ 上游怪癖（UPSTREAM，逐字保留）：非受控态下 wrapper **不**加 `-wrapper-checked`
    //    —— wrapper 的类名读的是 `mergedChecked`（= `checked` prop，此处 undefined），
    //    只有 span / input 读内部态。见 Radio.ts 的 `mergedChecked` 注释。
    expect(w.find('.apollo-radio-wrapper').classes()).not.toContain('apollo-radio-wrapper-checked');
  });

  // 上游实测（baselines/radio.dom.json 的 radio:default-checked）
  it('defaultChecked：span 有 -checked，wrapper 没有（上游不一致，逐字保留）', () => {
    const w = mount(Radio, { props: { defaultChecked: true }, slots: { default: () => 'x' } });
    expect(w.find('.apollo-radio').classes()).toContain('apollo-radio-checked');
    expect(w.find('.apollo-radio-wrapper').classes()).not.toContain('apollo-radio-wrapper-checked');
    expect(findInput(w).element.checked).toBe(true);
  });

  // 上游：should render correctly（受控）
  it('受控：click 只发事件，状态由父级决定', async () => {
    const onChange = vi.fn();
    const checked = ref(false);
    const App = defineComponent({
      setup() {
        return () =>
          h(Radio, {
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
    expect(w.find('.apollo-radio-wrapper').classes()).toContain('apollo-radio-wrapper-checked');
    checked.value = false;
    await nextTick();
    expect(w.find('.apollo-radio-wrapper').classes()).not.toContain('apollo-radio-wrapper-checked');
  });

  // 上游：responses hover events
  it('hover 事件落 label', async () => {
    const onMouseEnter = vi.fn();
    const onMouseLeave = vi.fn();
    const w = mount(Radio, { attrs: { onMouseEnter, onMouseLeave } });
    await w.find('label').trigger('mouseenter');
    await w.find('label').trigger('mouseleave');
    expect(onMouseEnter).toHaveBeenCalledTimes(1);
    expect(onMouseLeave).toHaveBeenCalledTimes(1);
  });

  // 上游：have static property for type detecting
  it('静态标记 __ANT_RADIO + 静态子组件 Group / Button', () => {
    expect(Radio.__ANT_RADIO).toBe(true);
    expect(Radio.Group).toBe(RadioGroup);
    expect(Radio.Button).toBe(RadioButton);
    // ⚠️ checklist #31：复合组件的具名别名必须是**真组件**，不是 undefined
    expect(RadioGroup).toBeTruthy();
    expect(RadioButton).toBeTruthy();
  });

  // 上游：event bubble should not trigger twice
  it('事件冒泡锁：label click 只触发一次 onClick', async () => {
    const onClick = vi.fn();
    const onRootClick = vi.fn();
    const w = mount(
      defineComponent({
        setup() {
          return () =>
            h('div', { onClick: onRootClick }, h(Radio, { onClick }, { default: () => 'A' }));
        },
      }),
    );

    await w.find('label').trigger('click');
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onRootClick).toHaveBeenCalledTimes(1);

    // 锁只持续一帧
    await waitFrames(2);
    await w.find('input').trigger('click');
    expect(onClick).toHaveBeenCalledTimes(2);
    expect(onRootClick).toHaveBeenCalledTimes(2);
  });

  // 上游：should support custom classNames / custom styles
  it('语义化三槽：classNames 落 root/icon/label，styles 落 root/icon/label', () => {
    const w = mount(Radio, {
      props: {
        classNames: { root: 'custom-root', icon: 'custom-icon', label: 'custom-label' },
        styles: {
          root: { backgroundColor: 'rgb(255, 0, 0)' },
          icon: { backgroundColor: 'rgb(0, 0, 0)' },
          label: { backgroundColor: 'rgb(128, 128, 128)' },
        },
      },
      slots: { default: () => 'Test' },
    });

    expect(w.find('label').classes()).toContain('custom-root');
    expect(w.find('label').attributes('style')).toContain('background-color: rgb(255, 0, 0)');
    expect(w.find('span.apollo-radio').classes()).toContain('custom-icon');
    expect(w.find('span.apollo-radio').attributes('style')).toContain(
      'background-color: rgb(0, 0, 0)',
    );
    expect(w.find('.apollo-radio-label').classes()).toContain('custom-label');
    expect(w.find('.apollo-radio-label').attributes('style')).toContain(
      'background-color: rgb(128, 128, 128)',
    );
  });

  it('函数形态语义化（随 props 变化重算）', async () => {
    const disabled = ref(false);
    const App = defineComponent({
      setup() {
        return () =>
          h(
            Radio,
            {
              classNames: ({ props }: { props: { disabled?: boolean } }) => ({
                label: props.disabled ? 'fn-disabled' : 'fn-enabled',
              }),
              disabled: disabled.value,
            },
            { default: () => 'x' },
          );
      },
    });
    const w = mount(App);
    expect(w.find('.apollo-radio-label').classes()).toContain('fn-enabled');
    disabled.value = true;
    await nextTick();
    expect(w.find('.apollo-radio-label').classes()).toContain('fn-disabled');
  });

  // 上游 issue 46739：title 落 **label**（不是 span —— 与 checkbox 的关键差异）
  it('title 落 label 而不是 icon span（上游 issue 46739）', () => {
    const w = mount(Radio, { props: { title: 'bamboo' }, slots: { default: () => 'x' } });
    expect(w.find('label').attributes('title')).toBe('bamboo');
    expect(w.find('span.apollo-radio').attributes('title')).toBeUndefined();
  });

  it('disabled 落 label / span / input 三层', () => {
    const w = mount(Radio, { props: { disabled: true }, slots: { default: () => 'x' } });
    expect(w.find('label').classes()).toContain('apollo-radio-wrapper-disabled');
    expect(w.find('span.apollo-radio').classes()).toContain('apollo-radio-disabled');
    expect(findInput(w).element.disabled).toBe(true);
  });

  it('无 children ⇒ 不渲染 label span（isRenderable 判据）', () => {
    const w = mount(Radio);
    expect(w.find('.apollo-radio-label').exists()).toBe(false);
  });

  it('非 button 形态带 ant-wave-target，button 形态不带', () => {
    const plain = mount(Radio, { slots: { default: () => 'x' } });
    expect(plain.find('span.apollo-radio').classes()).toContain('ant-wave-target');

    const w = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              RadioGroup,
              { optionType: 'button' },
              {
                default: () => h(RadioButton, null, { default: () => 'x' }),
              },
            );
        },
      }),
    );
    expect(w.find('span.apollo-radio-button').classes()).not.toContain('ant-wave-target');
  });

  it('onFocus / onBlur 落 input', async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const w = mount(Radio, { attrs: { onFocus, onBlur } });
    await findInput(w).trigger('focus');
    await findInput(w).trigger('blur');
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('optionType 直接传给 Radio ⇒ usage 告警（antd 同）', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mount(Radio, { props: { optionType: 'button' } });
    await nextTick();
    expect(
      spy.mock.calls.some((call) =>
        String(call[0]).includes('`optionType` is only support in Radio.Group'),
      ),
    ).toBe(true);
    spy.mockRestore();
  });

  it('expose：focus / blur / input / nativeElement', () => {
    const w = mount(Radio, { slots: { default: () => 'x' } });
    const vm = w.vm as unknown as {
      input: HTMLInputElement | null;
      nativeElement: HTMLElement | null;
      focus: () => void;
      blur: () => void;
    };
    expect(vm.input?.tagName).toBe('INPUT');
    expect(vm.nativeElement?.tagName).toBe('SPAN');
    expect(() => vm.focus()).not.toThrow();
    expect(() => vm.blur()).not.toThrow();
  });
});

describe('Radio · button 形态', () => {
  it('button 形态换整段类名前缀（label/span/input/label-span）', () => {
    const w = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              RadioGroup,
              { optionType: 'button' },
              {
                default: () => h(RadioButton, null, { default: () => 'A' }),
              },
            );
        },
      }),
    );
    expect(w.find('label').classes()).toContain('apollo-radio-button-wrapper');
    expect(w.find('span.apollo-radio-button').exists()).toBe(true);
    expect(w.find('input').classes()).toContain('apollo-radio-button-input');
    expect(w.find('span.apollo-radio-button-label').text()).toBe('A');
  });

  it('Radio.Button 的 ref 转发到内部 Radio', () => {
    const w = mount(RadioButton, { slots: { default: () => 'A' } });
    const vm = w.vm as unknown as { input: HTMLInputElement | null };
    expect(vm.input?.tagName).toBe('INPUT');
  });
});

describe('RadioGroup', () => {
  const renderGroup = (
    props: Record<string, unknown>,
    children?: () => unknown,
  ): ReturnType<typeof mount> =>
    mount(
      defineComponent({
        setup() {
          return () =>
            h(
              RadioGroup,
              props,
              children ? { default: children } : undefined,
            ) as unknown as ReturnType<typeof h>;
        },
      }),
    );

  const threeChildren = (onChange?: (e: unknown) => void) => () =>
    ['A', 'B', 'C'].map((value) =>
      h(Radio, { key: value, value, onChange }, { default: () => value }),
    );

  // 上游：responses hover events
  it('hover 事件落根 div', async () => {
    const onMouseEnter = vi.fn();
    const onMouseLeave = vi.fn();
    const w = renderGroup({ onMouseEnter, onMouseLeave }, () => h(Radio));
    await w.find('div').trigger('mouseenter');
    await w.find('div').trigger('mouseleave');
    expect(onMouseEnter).toHaveBeenCalledTimes(1);
    expect(onMouseLeave).toHaveBeenCalledTimes(1);
  });

  // 上游：fire change events when value changes
  it('受控：点击另一项 ⇒ onChange 一次，target.value 是新值', async () => {
    const onChange = vi.fn();
    const w = renderGroup({ value: 'A', onChange }, threeChildren());
    const inputs = w.findAll('input');
    await inputs[1]?.setValue(true);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0]?.target.value).toBe('B');
  });

  // 上游：won't fire change events when value not changes
  it('点已选中的项 ⇒ 不触发 onChange（与 checkbox 组相反）', async () => {
    const onChange = vi.fn();
    const w = renderGroup({ value: 'A', onChange }, threeChildren());
    await w.findAll('input')[0]?.setValue(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  // 上游：both of radio and radioGroup will trigger onchange event when they exists
  it('子 Radio 与 Group 的 onChange 都会触发', async () => {
    const onChangeRadio = vi.fn();
    const onChangeGroup = vi.fn();
    const w = renderGroup({ value: 'A', onChange: onChangeGroup }, threeChildren(onChangeRadio));
    await w.findAll('input')[1]?.setValue(true);
    expect(onChangeRadio).toHaveBeenCalledTimes(1);
    expect(onChangeGroup).toHaveBeenCalledTimes(1);
  });

  // 上游：Trigger onChange when both of radioButton and radioGroup exists
  it('RadioButton 在 Group 内也触发 onChange', async () => {
    const onChange = vi.fn();
    const w = renderGroup({ value: 'A', onChange }, () =>
      ['A', 'B', 'C'].map((value) =>
        h(RadioButton, { key: value, value }, { default: () => value }),
      ),
    );
    await w.findAll('input')[1]?.setValue(true);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  // 上游：should only trigger once when in group with options
  it('options 形态只触发一次', async () => {
    const onChange = vi.fn();
    const w = renderGroup({ options: [{ label: 'Bamboo', value: 'Bamboo' }], onChange });
    await w.find('input').setValue(true);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  // 上游：optional should correct render
  it('options 渲染 3 个 input', () => {
    const w = renderGroup({ options: ['A', 'B', 'C'] });
    expect(w.findAll('input').length).toBe(3);
  });

  // 上游：all children should have a name property
  it('name 透传到每个子 input', () => {
    const w = renderGroup({ name: 'GROUP_NAME' }, threeChildren());
    for (const input of w.findAll('input[type="radio"]')) {
      expect(input.attributes('name')).toBe('GROUP_NAME');
    }
  });

  it('未传 name ⇒ 自动生成且整组一致（antd 的 useId 默认值）', () => {
    const w = renderGroup({}, threeChildren());
    const names = w.findAll('input').map((i) => i.attributes('name'));
    expect(names[0]).toBeTruthy();
    expect(new Set(names).size).toBe(1);
  });

  // 上游：passes prefixCls down to radio
  it('prefixCls 下传到子 Radio', () => {
    const w = renderGroup({ prefixCls: 'my-radio', options: ['Apple'] });
    expect(w.find('div').classes()).toContain('my-radio-group');
    expect(w.find('span.my-radio').exists()).toBe(true);
  });

  // 上游：should forward ref
  it('ref 是根 div', () => {
    const w = mount(RadioGroup, { props: { options: ['A'] } });
    expect(w.element.tagName).toBe('DIV');
    expect((w.vm as unknown as { nativeElement: HTMLElement }).nativeElement).toBe(w.element);
  });

  // 上游：should support data-* or aria-* props
  it('data-* / aria-* 透传到根 div', () => {
    const w = mount(
      defineComponent({
        setup() {
          return () =>
            h(RadioGroup, {
              'data-radio-group-id': 'radio-group-id',
              'aria-label': 'radio-group',
            });
        },
      }),
    );
    expect(w.find('div').attributes('data-radio-group-id')).toBe('radio-group-id');
    expect(w.find('div').attributes('aria-label')).toBe('radio-group');
  });

  it('value / disabled / optionType / buttonStyle 不落根 div', () => {
    const w = renderGroup({
      value: 'A',
      disabled: true,
      optionType: 'button',
      buttonStyle: 'solid',
      options: ['A'],
    });
    const attrs = w.find('div').attributes();
    for (const key of ['value', 'disabled', 'optiontype', 'buttonstyle']) {
      expect(attrs[key]).toBeUndefined();
    }
  });

  // 上游：Radio type should not be override
  it('input 的 type 恒为 radio（不被 Radio 的 type prop 覆盖）', async () => {
    const onChange = vi.fn();
    const w = renderGroup({ onChange }, () =>
      [1, 2].map((value) =>
        h(Radio, { key: value, value, type: String(value) }, { default: () => String(value) }),
      ),
    );
    await w.findAll('input')[0]?.setValue(true);
    expect(onChange).toHaveBeenCalled();
    expect(w.findAll('input')[1]?.element.type).toBe('radio');
  });

  // 上游：use `defaultValue` when `value` is undefined
  it('value=undefined 回退 defaultValue，且点击可更新', async () => {
    const onChange = vi.fn();
    const w = renderGroup({ defaultValue: 'A', value: undefined, onChange }, threeChildren());
    expect(w.findAll('.apollo-radio-wrapper-checked').length).toBe(1);
    await w.findAll('input')[1]?.setValue(true);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]?.[0]?.target.value).toBe('B');
  });

  // 上游：should remain controlled when `value` is null
  it('受控 value 变化 ⇒ checked 跟着变', async () => {
    const w = renderGroup({ options: ['A', 'B'] });
    expect(w.findAll('.apollo-radio-wrapper-checked').length).toBe(0);
    await w.setProps({ value: 'A' });
    expect(w.findAll('.apollo-radio-wrapper-checked').length).toBe(1);
  });

  // 上游：onBlur & onFocus should work
  it('onFocus / onBlur 落根 div', async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const w = renderGroup({ options: ['1', '2', '3'], onFocus, onBlur });
    await w.find('div').trigger('focus');
    await w.find('div').trigger('blur');
    expect(onFocus).toHaveBeenCalledTimes(1);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  // 上游：options support id / title / onChange
  it('options 支持 id / title / onChange', async () => {
    const onChange = vi.fn();
    const w = renderGroup({
      options: [{ label: 'bamboo', id: 'bamboo', title: 'bamboo', value: 'bamboo', onChange }],
    });
    expect(w.find('#bamboo').exists()).toBe(true);
    // ⚠️ title 落 label（issue 46739）
    expect(w.find('label').attributes('title')).toBe('bamboo');
    expect(w.find('span.apollo-radio').attributes('title')).toBeUndefined();
    await w.find('input').setValue(true);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('options 对象形态：option.disabled 与整组 disabled 取或', () => {
    const w = renderGroup({
      options: [
        { label: 'A', value: 'A' },
        { label: 'B', value: 'B', disabled: true },
      ],
    });
    const inputs = w.findAll('input');
    expect(inputs[0]?.element.disabled).toBe(false);
    expect(inputs[1]?.element.disabled).toBe(true);
  });

  it('number 选项', () => {
    const w = renderGroup({ options: [1, 2, 3], defaultValue: 2 });
    expect(w.findAll('.apollo-radio-wrapper-checked').length).toBe(1);
    expect(w.findAll('span.apollo-radio-label').map((n) => n.text())).toEqual(['1', '2', '3']);
  });

  it('options 非空时优先于 default 插槽', () => {
    const w = renderGroup({ options: ['A'] }, () => h(Radio, { value: 'X' }));
    expect(w.findAll('input').length).toBe(1);
    expect(w.find('span.apollo-radio-label').text()).toBe('A');
  });

  it('options 渲染出的 Radio **没有** -group-item 类（与 checkbox 的差异）', () => {
    const w = renderGroup({ options: ['A'] });
    expect(
      w
        .find('label')
        .classes()
        .some((c) => c.includes('-group-item')),
    ).toBe(false);
  });

  // 上游：orientation attribute and vertical / role prop
  it('orientation 压过 vertical', () => {
    const w = renderGroup({ vertical: true, orientation: 'horizontal', options: ['A'] });
    expect(w.find('div').classes()).not.toContain('apollo-radio-group-vertical');
  });

  it('vertical=true ⇒ -group-vertical', () => {
    const w = renderGroup({ vertical: true, options: ['A'] });
    expect(w.find('div').classes()).toContain('apollo-radio-group-vertical');
  });

  it('role 默认 radiogroup，可覆盖', () => {
    expect(
      renderGroup({ options: ['A'] })
        .find('div')
        .attributes('role'),
    ).toBe('radiogroup');
    expect(
      renderGroup({ options: ['A'], role: 'radio' })
        .find('div')
        .attributes('role'),
    ).toBe('radio');
  });

  it('buttonStyle / size / block 类名', () => {
    const w = renderGroup({
      options: ['A'],
      optionType: 'button',
      buttonStyle: 'solid',
      size: 'large',
      block: true,
    });
    const classes = w.find('div').classes();
    expect(classes).toContain('apollo-radio-group-solid');
    expect(classes).toContain('apollo-radio-group-large');
    expect(classes).toContain('apollo-radio-group-block');
  });

  it('block ⇒ 子 Radio 的 label 带 -wrapper-block', () => {
    const w = renderGroup({ options: ['A'], block: true });
    expect(w.find('label').classes()).toContain('apollo-radio-wrapper-block');
  });

  it('RadioGroup 的具名别名 = Radio.Group', () => {
    const w = mount(RadioGroup, { props: { options: ['A'] } });
    expect(w.find('div').classes()).toContain('apollo-radio-group');
  });
});

describe('Radio · disabled 三级合并', () => {
  it('props.disabled 优先于 group.disabled', () => {
    const w = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              RadioGroup,
              { disabled: true },
              {
                default: () => h(Radio, { value: 'A', disabled: false }, { default: () => 'A' }),
              },
            );
        },
      }),
    );
    expect(w.find('input').element.disabled).toBe(false);
  });

  it('未传 props.disabled ⇒ 听 group.disabled', () => {
    const w = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              RadioGroup,
              { disabled: true },
              {
                default: () => h(Radio, { value: 'A' }, { default: () => 'A' }),
              },
            );
        },
      }),
    );
    expect(w.find('input').element.disabled).toBe(true);
  });

  it('组内 disabled=false 能显式关闭 ConfigProvider 的 componentDisabled', () => {
    const w = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              ConfigProvider,
              { componentDisabled: true },
              {
                default: () =>
                  h(
                    RadioGroup,
                    { disabled: false },
                    {
                      default: () => h(Radio, { value: 'A' }, { default: () => 'A' }),
                    },
                  ),
              },
            );
        },
      }),
    );
    expect(w.find('input').element.disabled).toBe(false);
  });

  it('无任何来源时不禁用', () => {
    const w = mount(Radio, { slots: { default: () => 'x' } });
    expect(w.find('input').element.disabled).toBe(false);
  });
});

describe('Radio · v-model（COMPATIBILITY.md 规则 C11）', () => {
  it('v-model:checked 与 onChange 同时发出', async () => {
    const onChange = vi.fn();
    const checked = ref(false);
    const App = defineComponent({
      setup() {
        return () =>
          h(Radio, {
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

  it('v-model:value 与 onChange 同时发出', async () => {
    const onChange = vi.fn();
    const value = ref('A');
    const App = defineComponent({
      setup() {
        return () =>
          h(RadioGroup, {
            value: value.value,
            options: ['A', 'B'],
            'onUpdate:value': (v: string) => {
              value.value = v;
            },
            onChange,
          });
      },
    });
    const w = mount(App);
    await w.findAll('input')[1]?.setValue(true);
    await nextTick();
    expect(value.value).toBe('B');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(w.findAll('.apollo-radio-wrapper-checked').length).toBe(1);
  });

  it('值未变化时不发 update:value', async () => {
    const onUpdate = vi.fn();
    const w = mount(RadioGroup, {
      props: { value: 'A', options: ['A', 'B'] },
      attrs: { 'onUpdate:value': onUpdate },
    });
    await w.findAll('input')[0]?.setValue(true);
    expect(onUpdate).not.toHaveBeenCalled();
  });
});

describe('RadioGroup · size 与 ConfigProvider', () => {
  it('ConfigProvider 的 componentSize 生效', () => {
    const w = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              ConfigProvider,
              { componentSize: 'large' },
              {
                default: () => h(RadioGroup, { options: ['A'] }),
              },
            );
        },
      }),
    );
    expect(w.find('div').classes()).toContain('apollo-radio-group-large');
  });

  it('props.size 优先于 componentSize', () => {
    const w = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              ConfigProvider,
              { componentSize: 'large' },
              {
                default: () => h(RadioGroup, { options: ['A'], size: 'small' }),
              },
            );
        },
      }),
    );
    const classes = w.find('div').classes();
    expect(classes).toContain('apollo-radio-group-small');
    expect(classes).not.toContain('apollo-radio-group-large');
  });

  // 回归：`useSize(props.size)`（非函数形态）只在 setup 期读一次 props.size，
  // 受控切换 size 会静默失效 —— 由 switch 流发现，radio 同源。
  it('受控切换 size ⇒ 类名跟随变化（useSize 必须用函数形态）', async () => {
    const size = ref<'small' | 'large'>('small');
    const App = defineComponent({
      setup() {
        return () => h(RadioGroup, { options: ['A'], size: size.value });
      },
    });
    const w = mount(App);
    expect(w.find('div').classes()).toContain('apollo-radio-group-small');
    size.value = 'large';
    await nextTick();
    const classes = w.find('div').classes();
    expect(classes).toContain('apollo-radio-group-large');
    expect(classes).not.toContain('apollo-radio-group-small');
  });
});
