/**
 * L3 · 类型测试（QrCode）—— 负例闭包。
 */

import { describe, expectTypeOf, it } from 'vitest';
import { QrCode } from '../index';
import type {
  QRCodeProps,
  QRCodeRef,
  QRCodeSlots,
  QRCodeStatusSlotProps,
  QrcodeStatusType,
} from '../interface';
import type { QRCodeComponentToken } from '../style';

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

  it('status is a named Vue scope with current data and a stable emit action', () => {
    expectTypeOf<
      Parameters<NonNullable<QRCodeSlots['status']>>[0]
    >().toEqualTypeOf<QRCodeStatusSlotProps>();
    expectTypeOf<QRCodeStatusSlotProps['status']>().toEqualTypeOf<QrcodeStatusType>();
    expectTypeOf<QRCodeStatusSlotProps['refresh']>().toEqualTypeOf<() => void>();
    expectTypeOf<QRCodeComponentToken['QRCodeCoverBackgroundColor']>().toEqualTypeOf<string>();
    const valid: QRCodeProps = {
      value: ['Current', ' segments'],
      onRefresh: () => {},
      styles: { root: { width: '200px' } },
    };
    expectTypeOf(valid).toMatchTypeOf<QRCodeProps>();
    // @ts-expect-error Development migration replaces the content function with #status.
    const removed: QRCodeProps = { statusRender: () => 'old content' };
    void removed;
  });
});
