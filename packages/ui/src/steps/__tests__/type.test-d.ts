/** L3 类型（G7）—— 正例 + 负例（负例包在永不调用的闭包里，CHECKLIST §一）。 */
import { describe, expectTypeOf, it } from 'vitest';
import type { StepItem, StepsProps, StepsSize, StepsStatus, StepsType } from '../interface';

describe('Steps · 类型', () => {
  it('Status 是 4 值联合', () => {
    expectTypeOf<StepsStatus>().toEqualTypeOf<'error' | 'finish' | 'process' | 'wait'>();
  });

  it('type 是 5 值联合；size 不含 large（antd 逐字）', () => {
    expectTypeOf<StepsType>().toEqualTypeOf<
      'default' | 'inline' | 'navigation' | 'panel' | 'dot'
    >();
    expectTypeOf<StepsSize>().toEqualTypeOf<'default' | 'medium' | 'middle' | 'small'>();
  });

  it('正例：items 数据 API（VNodeChild 字段）', () => {
    const items: StepItem[] = [
      { title: 'A', content: 'x', status: 'finish', disabled: false },
      { title: 'B', subTitle: 'sub' },
    ];
    const sample: Pick<
      StepsProps,
      'items' | 'type' | 'variant' | 'maxCount' | 'percent' | 'responsive'
    > = {
      items,
      type: 'dot',
      variant: 'outlined',
      maxCount: 4,
      percent: 60,
      responsive: false,
    };
    expectTypeOf(sample).not.toBeNever();
  });

  it('负例（永不调用的闭包）', () => {
    const negative = () => {
      const props: StepsProps = {
        // @ts-expect-error type 是 5 值联合
        type: 'wizard',
        // @ts-expect-error size 不含 large
        size: 'large',
        // @ts-expect-error status 是 4 值联合
        status: 'pending',
      };
      return props;
    };
    void negative;
  });
});
