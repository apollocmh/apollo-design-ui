/**
 * L3 · 类型测试（含负例）。⚠️ 负例包在永不调用的闭包里（*.test-d.ts 被真执行）。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { VNodeChild } from 'vue';
import type {
  ColProps,
  GridRef,
  GridSlot,
  Gutter,
  GutterValue,
  ResponsiveValue,
  RowAlign,
  RowJustify,
  RowProps,
} from '../interface';

describe('Grid · Props 类型', () => {
  it('Row 的 justify/align 支持响应式对象', () => {
    expectTypeOf<RowProps['justify']>().toEqualTypeOf<ResponsiveValue<RowJustify> | undefined>();
    expectTypeOf<RowProps['align']>().toEqualTypeOf<ResponsiveValue<RowAlign> | undefined>();
  });

  it('gutter 三形态', () => {
    expectTypeOf<RowProps['gutter']>().toEqualTypeOf<Gutter | undefined>();
    expectTypeOf<
      readonly [ResponsiveValue<GutterValue>, ResponsiveValue<GutterValue>]
    >().toMatchTypeOf<Gutter>();
  });

  it('Col 响应式 prop 接受数字简写与对象', () => {
    expectTypeOf<ColProps['xs']>().toEqualTypeOf<
      | number
      | {
          span?: number;
          order?: number;
          offset?: number;
          push?: number;
          pull?: number;
          flex?: string | number;
        }
      | undefined
    >();
  });

  it('默认槽接受完整 Vue 内容，ref 只开放实际元素', () => {
    expectTypeOf<ReturnType<GridSlot>>().toEqualTypeOf<VNodeChild>();
    expectTypeOf<GridRef['nativeElement']>().toEqualTypeOf<HTMLElement | null>();
  });

  it('★ 负例（永不调用的闭包内）', () => {
    const _never = () => {
      // @ts-expect-error gutter 不接受布尔
      const badGutter: RowProps = { gutter: true };
      // @ts-expect-error span 不接受字符串
      const badSpan: ColProps = { span: '8' };
      // @ts-expect-error justify 不接受任意字符串
      const badJustify: RowProps = { justify: 'middle-ish' };
      // @ts-expect-error gutter 每个轴是单值或断点对象，不是递归元组
      const badNestedGutter: RowProps = { gutter: [[8, 16], 24] };
      return [badGutter, badSpan, badJustify, badNestedGutter];
    };
    void _never;
  });
});
