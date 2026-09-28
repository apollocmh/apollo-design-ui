/**
 * L3 · 类型测试（Tour）
 *
 * 正例钉 API 形状，负例钉「哪些写法必须被类型系统拒绝」。
 * ⚠️ 负例一律写在**未被调用的闭包**里（`*.test-d.ts` 会被 vitest 真执行）。
 */

import { expectTypeOf, it } from 'vitest';
import { h } from 'vue';
import { Tour } from '../index';
import type {
  TourClosableConfig,
  TourPlacement,
  TourProps,
  TourSemanticClassNames,
  TourSlots,
  TourStepProps,
  TourType,
} from '../interface';

it('TourProps 的关键字段类型', () => {
  expectTypeOf<TourProps['open']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<TourProps['defaultOpen']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<TourProps['current']>().toEqualTypeOf<number | undefined>();
  expectTypeOf<TourProps['keyboard']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<TourProps['placement']>().toEqualTypeOf<TourPlacement | undefined>();
  expectTypeOf<TourProps['type']>().toEqualTypeOf<TourType | undefined>();
  expectTypeOf<TourProps['steps']>().toEqualTypeOf<TourStepProps[] | undefined>();
  // C8-R2：VNode 类 prop 收窄（title / description / cover 是 string）
  expectTypeOf<TourStepProps['title']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<TourStepProps['description']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<TourStepProps['cover']>().toEqualTypeOf<string | undefined>();
  // D111 例外清单：closeIcon 保留 VNode
  expectTypeOf<TourProps['closeIcon']>().not.toBeNever();
  // 对象形态
  expectTypeOf<TourProps['mask']>().not.toBeNever();
  expectTypeOf<TourProps['gap']>().not.toBeNever();
  expectTypeOf<TourProps['animated']>().not.toBeNever();
});

it('placement 含 center（13 个值）', () => {
  expectTypeOf<TourPlacement>().toEqualTypeOf<
    | 'left'
    | 'leftTop'
    | 'leftBottom'
    | 'right'
    | 'rightTop'
    | 'rightBottom'
    | 'top'
    | 'topLeft'
    | 'topRight'
    | 'bottom'
    | 'bottomLeft'
    | 'bottomRight'
    | 'center'
  >();
});

it('语义槽 12 个（对象与函数双形态）', () => {
  expectTypeOf<keyof TourSemanticClassNames>().toEqualTypeOf<
    | 'root'
    | 'cover'
    | 'close'
    | 'mask'
    | 'section'
    | 'footer'
    | 'actions'
    | 'indicator'
    | 'indicators'
    | 'header'
    | 'title'
    | 'description'
  >();
  expectTypeOf<TourProps['classNames']>().not.toBeNever();
});

it('插槽面（scoped slot 的参数形状）', () => {
  expectTypeOf<TourSlots['indicators']>().not.toBeNever();
  expectTypeOf<TourSlots['actions']>().not.toBeNever();
});

it('closable 的对象形态透传 aria-* / data-*', () => {
  const config: TourClosableConfig = { 'aria-label': 'x', 'data-id': '1' };
  expectTypeOf(config['aria-label']).not.toBeNever();
});

it('负例（仅类型层面）', () => {
  void ((): void => {
    // @ts-expect-error 非法 placement（无 'centerTop' 这种值）
    h(Tour, { placement: 'centerTop' });
  });
  void ((): void => {
    // @ts-expect-error 非法 type
    h(Tour, { type: 'danger' });
  });
  void ((): void => {
    // @ts-expect-error 非法 mask（对象形态只有 style / color）
    h(Tour, { mask: { fill: 'red' } });
  });
  void ((): void => {
    // @ts-expect-error gap.offset 不接受字符串
    h(Tour, { gap: { offset: '10px' } });
  });
  void ((): void => {
    // @ts-expect-error steps[].title 收窄为 string（VNode 走 #title 插槽）
    h(Tour, { steps: [{ title: h('span', 'x') }] });
  });
});
