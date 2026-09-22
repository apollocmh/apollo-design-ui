/**
 * L3 · 类型测试（Checkbox）
 *
 * 正例钉 API 形状，负例钉「哪些写法必须被类型系统拒绝」。
 * ⚠️ 负例一律写在**未被调用的闭包**里：只在类型层面存在，不产生运行时行为。
 */

import { expectTypeOf, it } from 'vitest';
import { h } from 'vue';
import { Checkbox, CheckboxGroup } from '../index';
import type { CheckboxChangeEvent, CheckboxProps } from '../interface';

it('CheckboxProps 的关键字段类型', () => {
  expectTypeOf<CheckboxProps['checked']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<CheckboxProps['defaultChecked']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<CheckboxProps['indeterminate']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<CheckboxProps['disabled']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<CheckboxProps['skipGroup']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<CheckboxProps['onChange']>().not.toBeNever();
});

it('CheckboxChangeEvent 的形态', () => {
  const onChange = (e: CheckboxChangeEvent) => {
    expectTypeOf(e.target.checked).toBeBoolean();
    expectTypeOf(e.stopPropagation).toBeFunction();
    expectTypeOf(e.nativeEvent).not.toBeAny();
  };
  void onChange;
});

it('语义化支持对象与函数两态', () => {
  const obj: CheckboxProps = { classNames: { root: 'r', icon: 'i', label: 'l' } };
  const fn: CheckboxProps = {
    styles: ({ props }) => ({ icon: { opacity: props.indeterminate ? 0.5 : 1 } }),
  };
  expectTypeOf(obj).toEqualTypeOf<CheckboxProps>();
  expectTypeOf(fn).toEqualTypeOf<CheckboxProps>();
});

it('Checkbox.Group 可用且能 h()', () => {
  expectTypeOf(h(Checkbox.Group)).not.toBeAny();
  expectTypeOf(h(CheckboxGroup, { options: ['a', 1] })).toBeObject();
});

// ─────────────────────────────────────────────────────────────────────────────
// 负例
// ─────────────────────────────────────────────────────────────────────────────

it('负例：语义槽只有 root / icon / label 三键', () => {
  // @ts-expect-error 没有 body 槽
  const badSlot: CheckboxProps = { classNames: { body: 'b' } };
  void badSlot;
});

it('负例：indeterminate 不能是字符串', () => {
  // @ts-expect-error indeterminate 是 boolean
  const badIndeterminate: CheckboxProps = { indeterminate: 'yes' };
  void badIndeterminate;
});

it('负例：Group 没有语义化槽位（antd 同）', () => {
  // @ts-expect-error CheckboxGroupProps 无 classNames
  const badGroup: import('../interface').CheckboxGroupProps = { classNames: { root: 'r' } };
  void badGroup;
});
