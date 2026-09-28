/** L3 类型（G7）—— 正例 + 负例（负例包在永不调用的闭包里，CHECKLIST §一）。 */
import { describe, expectTypeOf, it } from 'vitest';
import type {
  PercentPositionType,
  ProgressGradient,
  ProgressProps,
  ProgressSize,
  ProgressStatus,
  ProgressType,
  SuccessProps,
} from '../interface';

describe('Progress · 类型', () => {
  it('type 三值；status 四值', () => {
    expectTypeOf<ProgressType>().toEqualTypeOf<'line' | 'circle' | 'dashboard'>();
    expectTypeOf<ProgressStatus>().toEqualTypeOf<'normal' | 'exception' | 'active' | 'success'>();
  });

  it('size 是数字 | [w,h] | 预设 | 对象', () => {
    expectTypeOf<ProgressSize>().toEqualTypeOf<'middle' | 'small' | 'default'>();
    const s: ProgressProps['size'] = [300, 20];
    expectTypeOf(s).not.toBeNever();
  });

  it('gradient：from/to 或 % 键', () => {
    const g1: ProgressGradient = { from: '#108ee9', to: '#87d068' };
    const g2: ProgressGradient = { '0%': '#108ee9', '100%': '#87d068' };
    expectTypeOf([g1, g2]).not.toBeNever();
  });

  it('success / percentPosition', () => {
    const sp: SuccessProps = { percent: 20, strokeColor: '#52c41a' };
    const pp: PercentPositionType = { align: 'center', type: 'inner' };
    expectTypeOf([sp, pp]).not.toBeNever();
  });

  it('format / rounding 是 fn prop', () => {
    const f: ProgressProps['format'] = (p?: number) => `${p}%`;
    expectTypeOf(f).not.toBeNever();
  });

  it('负例（永不调用的闭包）', () => {
    const negative = () => {
      const props: ProgressProps = {
        // @ts-expect-error type 是三值联合
        type: 'bar',
        // @ts-expect-error status 是四值联合
        status: 'failed',
      };
      return props;
    };
    void negative;
  });
});
