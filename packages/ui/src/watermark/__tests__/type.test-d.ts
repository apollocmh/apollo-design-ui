/**
 * L3 · 类型测试（Watermark）
 *
 * 正例钉 API 形状，负例钉「哪些写法必须被类型系统拒绝」。
 * ⚠️ 负例一律写在**未被调用的闭包**里：只在类型层面存在，不产生运行时行为
 *    （规则与 result / alert 的类型测试一致）。
 */

import { expectTypeOf, it } from 'vitest';
import { h } from 'vue';
import { Watermark } from '../index';
import type { WatermarkProps, WatermarkRef } from '../interface';

it('WatermarkProps 的关键字段类型', () => {
  expectTypeOf<WatermarkProps['content']>().toEqualTypeOf<
    import('../interface').WatermarkContent | import('../interface').WatermarkContent[] | undefined
  >();
  expectTypeOf<WatermarkProps['gap']>().toEqualTypeOf<[number, number] | undefined>();
  expectTypeOf<WatermarkProps['offset']>().toEqualTypeOf<[number, number] | undefined>();
  expectTypeOf<WatermarkProps['rotate']>().toEqualTypeOf<number | undefined>();
  expectTypeOf<WatermarkProps['zIndex']>().toEqualTypeOf<number | undefined>();
  expectTypeOf<WatermarkProps['inherit']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<WatermarkProps['onRemove']>().toEqualTypeOf<(() => void) | undefined>();
});

it('WatermarkText 每行可带独立 font', () => {
  const props: WatermarkProps = {
    content: ['Ant Design', { text: 'Happy Working', font: { fontSize: 12 } }],
  };
  expectTypeOf(props).toEqualTypeOf<WatermarkProps>();
});

it('Ref：nativeElement 可空（antd 声明为非空，实际未挂载前是 null）', () => {
  expectTypeOf<WatermarkRef['nativeElement']>().toEqualTypeOf<HTMLDivElement | null>();
});

it('组件本身可被 h() 调用', () => {
  expectTypeOf(h(Watermark, { content: 'x' })).toBeObject();
});

// ─────────────────────────────────────────────────────────────────────────────
// 负例：以下写法必须被类型系统拒绝
// ─────────────────────────────────────────────────────────────────────────────

it('负例：gap / offset 必须是二元元组', () => {
  // @ts-expect-error gap 不能是三元组
  const badGap: WatermarkProps = { gap: [1, 2, 3] };
  // @ts-expect-error offset 不能是单值
  const badOffset: WatermarkProps = { offset: 1 };
  void badGap;
  void badOffset;
});

it('负例：rotate / zIndex 不能是字符串', () => {
  // @ts-expect-error rotate 是 number
  const badRotate: WatermarkProps = { rotate: '-22' };
  // @ts-expect-error zIndex 是 number
  const badZIndex: WatermarkProps = { zIndex: '999' };
  void badRotate;
  void badZIndex;
});

it('负例：WatermarkProps 没有语义化槽位（无 classNames / styles）', () => {
  // ⚠️ 不用 `expectTypeOf(...).not.toExist()`（不是真实 API）—— 用 toHaveProperty。
  expectTypeOf<WatermarkProps>().not.toHaveProperty('classNames');
  expectTypeOf<WatermarkProps>().not.toHaveProperty('styles');
});

it('负例：font 的字号/字重是受限联合', () => {
  // @ts-expect-error fontWeight 不接受任意字符串
  const badWeight: WatermarkProps = { font: { fontWeight: 'heavy' } };
  void badWeight;
});
