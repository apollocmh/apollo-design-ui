/**
 * L3 · 类型测试（Segmented）
 *
 * 正例钉 API 形状，负例钉「哪些写法必须被类型系统拒绝」。
 * ⚠️ 负例一律写在**未被调用的闭包**里：只在类型层面存在，不产生运行时行为
 *    （`*.test-d.ts` 会被 vitest 真执行）。
 */

import { expectTypeOf, it } from 'vitest';
import { Segmented } from '../index';
import type { SegmentedLabeledOption, SegmentedProps, SegmentedValue } from '../interface';

it('SegmentedProps 的关键字段类型', () => {
  expectTypeOf<SegmentedProps['value']>().toEqualTypeOf<SegmentedValue | undefined>();
  expectTypeOf<SegmentedProps['defaultValue']>().toEqualTypeOf<SegmentedValue | undefined>();
  expectTypeOf<SegmentedProps['disabled']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<SegmentedProps['block']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<SegmentedProps['size']>().toEqualTypeOf<'small' | 'middle' | 'large' | undefined>();
  expectTypeOf<SegmentedProps['shape']>().toEqualTypeOf<'default' | 'round' | undefined>();
  expectTypeOf<SegmentedProps['options']>().toEqualTypeOf<SegmentedProps['options']>();
});

it('语义化 classNames / styles 的键集合（root/icon/label/item）', () => {
  expectTypeOf<keyof NonNullable<SegmentedProps['classNames']>>().toEqualTypeOf<
    'root' | 'icon' | 'label' | 'item'
  >();
  expectTypeOf<keyof NonNullable<SegmentedProps['styles']>>().toEqualTypeOf<
    'root' | 'icon' | 'label' | 'item'
  >();
});

it('对象选项的两种形态', () => {
  // 无 icon：label 必填
  const plain: SegmentedLabeledOption = { label: 'A', value: 'a' };
  // 带 icon：label 可省
  const withIcon: SegmentedLabeledOption = { icon: '★', value: 'a' };
  expectTypeOf(plain.value).toEqualTypeOf<SegmentedValue>();
  expectTypeOf(withIcon.value).toEqualTypeOf<SegmentedValue>();
});

it('负例（仅类型层面）', () => {
  expectTypeOf<SegmentedProps['value']>().not.toBeNever();
  void ((): void => {
    // @ts-expect-error 非法 size
    h(Segmented, { options: [], size: 'huge' });
  });
  void ((): void => {
    // @ts-expect-error 非法 shape
    h(Segmented, { options: [], shape: 'square' });
  });
});

import { h } from 'vue';
