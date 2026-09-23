/**
 * L3 · 类型测试（Radio / RadioGroup / RadioButton）
 *
 * 正例钉 API 形状，负例钉「哪些写法必须被类型系统拒绝」。
 * ⚠️ 负例一律写在**未被调用的闭包**里：只在类型层面存在，不产生运行时行为
 *    （`*.test-d.ts` 会被 vitest 真执行）。
 */

import { expectTypeOf, it } from 'vitest';
import { h } from 'vue';
import { Radio, RadioButton, RadioGroup } from '../index';
import type {
  RadioChangeEvent,
  RadioGroupButtonStyle,
  RadioGroupOptionType,
  RadioGroupProps,
  RadioProps,
  RadioValue,
} from '../interface';

it('RadioProps 的关键字段类型', () => {
  expectTypeOf<RadioProps['checked']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<RadioProps['defaultChecked']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<RadioProps['disabled']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<RadioProps['skipGroup']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<RadioProps['title']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<RadioProps['value']>().toEqualTypeOf<RadioValue | undefined>();
  expectTypeOf<RadioProps['onChange']>().not.toBeNever();
});

it('RadioGroupProps 的关键字段类型（value 是标量不是数组）', () => {
  expectTypeOf<RadioGroupProps['value']>().toEqualTypeOf<RadioValue | undefined>();
  expectTypeOf<RadioGroupProps['defaultValue']>().toEqualTypeOf<RadioValue | undefined>();
  expectTypeOf<RadioGroupProps['buttonStyle']>().toEqualTypeOf<RadioGroupButtonStyle | undefined>();
  expectTypeOf<RadioGroupProps['optionType']>().toEqualTypeOf<RadioGroupOptionType | undefined>();
  expectTypeOf<RadioGroupProps['vertical']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<RadioGroupProps['block']>().toEqualTypeOf<boolean | undefined>();
});

it('RadioChangeEvent 的形态（target.value 是新值）', () => {
  const onChange = (e: RadioChangeEvent) => {
    expectTypeOf(e.target.value).not.toBeNever();
    expectTypeOf(e.target.checked).toBeBoolean();
    expectTypeOf(e.stopPropagation).toBeFunction();
    expectTypeOf(e.nativeEvent).not.toBeAny();
  };
  void onChange;
});

it('语义化支持对象与函数两态', () => {
  const obj: RadioProps = { classNames: { root: 'r', icon: 'i', label: 'l' } };
  const fn: RadioProps = {
    styles: ({ props }) => ({ icon: { opacity: props.checked ? 0.5 : 1 } }),
  };
  expectTypeOf(obj).toEqualTypeOf<RadioProps>();
  expectTypeOf(fn).toEqualTypeOf<RadioProps>();
});

it('Radio.Group / Radio.Button 静态子组件可用且能 h()', () => {
  expectTypeOf(h(Radio.Group)).not.toBeAny();
  expectTypeOf(h(Radio.Button)).not.toBeAny();
  expectTypeOf(h(RadioGroup, { options: ['a', 1] })).toBeObject();
  expectTypeOf(h(RadioButton, { value: 'a' })).toBeObject();
});

// ─────────────────────────────────────────────────────────────────────────────
// 负例（全部包在永不调用的闭包里）
// ─────────────────────────────────────────────────────────────────────────────

it('负例：语义槽只有 root / icon / label 三键', () => {
  // @ts-expect-error 没有 body 槽
  const badSlot: RadioProps = { classNames: { body: 'b' } };
  void badSlot;
});

it('负例：optionType 只接受 default / button', () => {
  // @ts-expect-error 'solid' 不是 optionType（那是 buttonStyle 的值）
  const badOptionType: RadioProps = { optionType: 'solid' };
  void badOptionType;
});

it('负例：buttonStyle 只接受 outline / solid', () => {
  // @ts-expect-error 'button' 不是 buttonStyle（那是 optionType 的值）
  const badButtonStyle: RadioGroupProps = { buttonStyle: 'button' };
  void badButtonStyle;
});

it('负例：Radio 的 checked 不能是字符串', () => {
  // @ts-expect-error checked 是 boolean
  const badChecked: RadioProps = { checked: 'yes' };
  void badChecked;
});

it('负例：RadioGroup 没有语义化槽位（antd 同）', () => {
  // @ts-expect-error RadioGroupProps 无 classNames
  const badGroup: RadioGroupProps = { classNames: { root: 'r' } };
  void badGroup;
});
