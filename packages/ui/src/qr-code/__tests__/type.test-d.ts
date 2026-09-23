/**
 * L3 · 类型测试（QrCode）—— 负例闭包。
 */

import { describe, expectTypeOf, it } from 'vitest';
import { QrCode } from '../index';
import type { QRCodeProps, QRCodeRef, QrcodeStatusType } from '../interface';

describe('QrCode · 类型', () => {
  it('QrCode 是组件，nativeElement ref 可达', () => {
    expectTypeOf(QrCode).toBeObject();
    expectTypeOf<QRCodeRef['nativeElement']>().toEqualTypeOf<HTMLDivElement | null>();
  });

  it('★ status 字面量集合', () => {
    expectTypeOf<QrcodeStatusType>().toEqualTypeOf<'active' | 'expired' | 'loading' | 'scanned'>();
  });

  it('★ errorLevel 字面量集合', () => {
    expectTypeOf<NonNullable<QRCodeProps['errorLevel']>>().toEqualTypeOf<'L' | 'M' | 'Q' | 'H'>();
  });

  it('★ type 字面量集合', () => {
    expectTypeOf<NonNullable<QRCodeProps['type']>>().toEqualTypeOf<'canvas' | 'svg'>();
  });

  it('★ value 支持 string | string[]', () => {
    expectTypeOf<NonNullable<QRCodeProps['value']>>().toEqualTypeOf<string | string[]>();
  });

  it('★ iconSize：数字或宽高对象', () => {
    expectTypeOf<NonNullable<QRCodeProps['iconSize']>>().toEqualTypeOf<
      number | { width?: number | undefined; height?: number | undefined }
    >();
  });
});
