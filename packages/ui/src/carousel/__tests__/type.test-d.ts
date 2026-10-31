/**
 * L3 · 类型测试（Carousel）—— 负例闭包：API 面被裁剪后，越界用法必须编译失败。
 */

import { describe, expectTypeOf, it } from 'vitest';
import { type CSSProperties, h } from 'vue';
import type { CarouselEngineState } from '../engine';
import { Carousel } from '../index';
import type {
  CarouselArrowScope,
  CarouselEffect,
  CarouselEmits,
  CarouselProps,
  CarouselRef,
  CarouselSemanticStyles,
  CarouselSlots,
  DotPlacement,
} from '../interface';

describe('Carousel · Props 类型', () => {
  it('★ 核心参数类型', () => {
    expectTypeOf<CarouselProps['effect']>().toEqualTypeOf<CarouselEffect | undefined>();
    expectTypeOf<CarouselProps['dotPlacement']>().toEqualTypeOf<DotPlacement | undefined>();
    expectTypeOf<CarouselProps['dots']>().toEqualTypeOf<
      boolean | { className?: string } | undefined
    >();
    expectTypeOf<CarouselProps['autoplay']>().toEqualTypeOf<
      boolean | { dotDuration?: boolean } | undefined
    >();
    expectTypeOf<CarouselProps['infinite']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<CarouselProps['initialSlide']>().toEqualTypeOf<number | undefined>();
  });

  it('★ antd 默认值覆盖点：waitForAnimate=false / arrows=false / dots=true', () => {
    // 类型上都是可选 —— 默认值语义由 L1 钉；这里钉「存在且类型正确」
    expectTypeOf<CarouselProps['waitForAnimate']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<CarouselProps['arrows']>().toEqualTypeOf<boolean | undefined>();
  });

  it('★ antd 的 dotPosition 还允许 left/right（dotPlacement 不允许）', () => {
    expectTypeOf<NonNullable<CarouselProps['dotPosition']>>().toEqualTypeOf<
      DotPlacement | 'left' | 'right'
    >();
  });

  it('★ 无 value 语义 ⇒ 无 update:* 通道（C11 的否定面）', () => {
    // CarouselProps 不能出现 checked / value / onChange 之类受控 API
    type HasControlled = 'checked' | 'value' | 'onChange' extends keyof CarouselProps
      ? true
      : false;
    expectTypeOf<HasControlled>().toEqualTypeOf<false>();
  });
});

describe('Carousel · Ref 形状', () => {
  it('nativeElement / goTo / next / prev / autoPlay / innerSlider', () => {
    expectTypeOf<CarouselRef['nativeElement']>().toEqualTypeOf<HTMLDivElement | null>();
    expectTypeOf<CarouselRef['goTo']>().toEqualTypeOf<
      (slide: number, dontAnimate?: boolean) => void
    >();
    expectTypeOf<CarouselRef['next']>().toEqualTypeOf<() => void>();
    expectTypeOf<CarouselRef['prev']>().toEqualTypeOf<() => void>();
    expectTypeOf<CarouselRef['autoPlay']>().toEqualTypeOf<
      (playType?: 'update' | 'leave' | 'blur') => void
    >();
    // ⚠️ innerSlider 是 PLATFORM 差异：引擎状态对象（非 slick 实例）
    expectTypeOf<CarouselRef['innerSlider']>().toEqualTypeOf<Readonly<CarouselEngineState>>();
  });
});

describe('Carousel · 组件导出', () => {
  it('Carousel 是 withInstall 产物（组件 + Plugin）', () => {
    // withInstall 返回 T & Plugin —— 既是组件也是插件
    expectTypeOf(Carousel).toHaveProperty('install');
  });
});

describe('Carousel actual Vue contracts', () => {
  it('keeps the real runtime slots and event payloads precise', () => {
    type Instance = InstanceType<typeof Carousel>;
    type Scope = Parameters<NonNullable<Instance['$slots']['next-arrow']>>[0];
    expectTypeOf<Scope['currentSlide']>().toEqualTypeOf<number>();
    expectTypeOf<Scope['slideCount']>().toEqualTypeOf<number>();
    expectTypeOf<CarouselSemanticStyles['slider']>().toEqualTypeOf<CSSProperties | undefined>();
    expectTypeOf<CarouselEmits['beforeChange']>().toEqualTypeOf<
      (current: number, next: number) => void
    >();
    h(
      Carousel,
      {
        onBeforeChange: (current, next) => {
          expectTypeOf(current).toEqualTypeOf<number>();
          expectTypeOf(next).toEqualTypeOf<number>();
        },
        onAfterChange: (current) => expectTypeOf(current).toEqualTypeOf<number>(),
        onKeydown: (event) => expectTypeOf(event).toEqualTypeOf<KeyboardEvent>(),
        useCSS: false,
        useTransform: false,
        edgeFriction: 0.35,
      },
      {
        default: () => [h('div', 'One'), h('div', 'Two')],
        'next-arrow': (scope: CarouselArrowScope) => [
          h('span', scope.currentSlide),
          h('b', scope.slideCount),
        ],
      },
    );
    expectTypeOf<CarouselSlots['next-arrow']>().toMatchTypeOf<
      ((scope: CarouselArrowScope) => import('vue').VNodeChild) | undefined
    >();
  });
  it('rejects unconsumed API, synthetic payloads and invalid CSS', () => {
    void (() => {
      const obsolete: CarouselProps = {
        // @ts-expect-error easing had no runtime consumer and is removed; use cssEase
        easing: 'linear',
      };
      // @ts-expect-error beforeChange has numeric indices
      h(Carousel, { onBeforeChange: (_current: string, _next: string) => {} });
      // @ts-expect-error semantic CSS types are actual Vue CSSProperties
      h(Carousel, { styles: { slider: { textAlign: 123 } } });
      void obsolete;
    });
  });
});
