/** L3 类型（G7）—— 正例 + 负例（负例包在永不调用的闭包里，CHECKLIST §一）。 */
import { describe, expectTypeOf } from 'vitest';
import type { DropdownPlacement, DropdownProps } from '../interface';

describe('Dropdown · 类型', () => {
  it('placement 是 14 值联合（含 deprecated Center）', () => {
    expectTypeOf<DropdownPlacement>().toEqualTypeOf<
      | 'topLeft'
      | 'topCenter'
      | 'topRight'
      | 'bottomLeft'
      | 'bottomCenter'
      | 'bottomRight'
      | 'top'
      | 'bottom'
      | 'left'
      | 'leftTop'
      | 'leftBottom'
      | 'right'
      | 'rightTop'
      | 'rightBottom'
    >();
  });

  it('正例：合法 prop 组合', () => {
    const sample: Pick<
      DropdownProps,
      'menu' | 'trigger' | 'arrow' | 'placement' | 'destroyOnHidden'
    > = {
      menu: { items: [{ key: '1', label: 'a' }] },
      trigger: ['click', 'contextMenu'],
      arrow: { pointAtCenter: true },
      placement: 'topLeft',
      destroyOnHidden: false,
    };
    expectTypeOf(sample).not.toBeNever();
  });

  it('负例（永不调用的闭包）', () => {
    const negative = () => {
      const props: DropdownProps = {
        // @ts-expect-error trigger 不接受 'focus'
        trigger: ['focus'],
        // @ts-expect-error arrow 不接受字符串字面量
        arrow: 'yes',
      };
      return props;
    };
    void negative;
  });
});
