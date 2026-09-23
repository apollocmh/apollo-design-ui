/**
 * L3 · 类型测试（Carousel）—— 负例闭包：API 面被裁剪后，越界用法必须编译失败。
 */

import { describe, expectTypeOf, it } from 'vitest';
import { Carousel } from '../index';
import type { CarouselEffect, CarouselProps, CarouselRef, DotPlacement } from '../interface';

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
    expectTypeOf<CarouselRef['innerSlider']>().toEqualTypeOf<Record<string, unknown>>();
  });
});

describe('Carousel · 组件导出', () => {
  it('Carousel 是 withInstall 产物（组件 + Plugin）', () => {
    // withInstall 返回 T & Plugin —— 既是组件也是插件
    expectTypeOf(Carousel).toHaveProperty('install');
  });
});
