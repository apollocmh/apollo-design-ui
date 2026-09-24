/**
 * L3 类型（G7）—— 正例 + 负例（负例包在永不调用的闭包里，CHECKLIST §一）。
 */
import { describe, expectTypeOf } from 'vitest';
import type { PopoverProps } from '../interface';

describe('Popover · 类型', () => {
  it('正例：合法 prop 组合（title/content 双通道 + title/content 语义槽）', () => {
    const sample: Pick<
      PopoverProps,
      'title' | 'content' | 'placement' | 'arrow' | 'classNames' | 'styles'
    > = {
      title: 't',
      content: () => 'c',
      placement: 'topLeft',
      arrow: { pointAtCenter: true },
      classNames: { root: 'r', title: 't', content: 'c' },
      styles: { container: { padding: '1px' } },
    };
    expectTypeOf(sample).not.toBeNever();
  });

  it('负例（永不调用的闭包）', () => {
    const negative = () => {
      const props: PopoverProps = {
        // @ts-expect-error placement 不接受任意字符串
        placement: 'middle',
        // @ts-expect-error arrow 不接受字符串字面量
        arrow: 'yes',
      };
      return props;
    };
    void negative;
  });
});
