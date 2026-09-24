/**
 * L3 类型（G7）—— 正例 + 负例（负例包在永不调用的闭包里，CHECKLIST §一）。
 */
import { describe, expectTypeOf } from 'vitest';
import type { TooltipPlacement, TooltipProps } from '../interface';

describe('Tooltip · 类型', () => {
  it('placement 是 12 值联合', () => {
    expectTypeOf<TooltipPlacement>().toEqualTypeOf<
      | 'top'
      | 'left'
      | 'right'
      | 'bottom'
      | 'topLeft'
      | 'topRight'
      | 'bottomLeft'
      | 'bottomRight'
      | 'leftTop'
      | 'leftBottom'
      | 'rightTop'
      | 'rightBottom'
    >();
  });

  it('正例：合法 prop 组合', () => {
    const sample: Pick<TooltipProps, 'title' | 'arrow' | 'color' | 'destroyOnHidden' | 'trigger'> =
      {
        title: 'x',
        arrow: true,
        color: 'blue',
        destroyOnHidden: false,
        trigger: 'hover',
      };
    expectTypeOf(sample).not.toBeNever();
  });

  it('负例（永不调用的闭包）', () => {
    const negative = () => {
      const props: TooltipProps = {
        // @ts-expect-error placement 不接受任意字符串
        placement: 'middle',
        // @ts-expect-error arrow 不接受字符串字面量
        arrow: 'yes',
        // @ts-expect-error zIndex 不接受字符串
        zIndex: '100',
      };
      return props;
    };
    void negative;
  });
});
