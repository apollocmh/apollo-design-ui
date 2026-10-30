/**
 * L3 类型（G7）—— 正例 + 负例（负例包在永不调用的闭包里，CHECKLIST §一）。
 */
import { describe, expectTypeOf } from 'vitest';
import { h } from 'vue';
import type { TooltipEmits, TooltipPlacement, TooltipProps } from '../interface';
import Tooltip from '../Tooltip';

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
      // @ts-expect-error C8-R2 已移除 overlay（运行时不消费，内容走 `#title` 插槽）
      void props.overlay;
      return props;
    };
    void negative;
  });

  it('#24.5 `overlay` 不在公开类型里（C8-R2 裁决：类型与运行时一致）', () => {
    expectTypeOf<TooltipProps>().not.toHaveProperty('overlay');
  });

  it('declares state, motion and popup notifications as typed Vue events', () => {
    expectTypeOf<Parameters<TooltipEmits['openChange']>>().toEqualTypeOf<[open: boolean]>();
    expectTypeOf<Parameters<TooltipEmits['afterOpenChange']>>().toEqualTypeOf<[open: boolean]>();
    expectTypeOf<Parameters<TooltipEmits['popupClick']>>().toEqualTypeOf<[event: MouseEvent]>();
    const props: TooltipProps = {
      onOpenChange: (_open: boolean) => {},
      'onUpdate:open': (_open: boolean) => {},
      onAfterOpenChange: (_open: boolean) => {},
      onPopupClick: (_event: MouseEvent) => {},
    };
    h(Tooltip, props);
    const negative = () => {
      const bad: TooltipProps = {
        // @ts-expect-error Motion completion uses @after-open-change/onAfterOpenChange.
        afterOpenChange: (_open: boolean) => {},
      };
      // @ts-expect-error Popup clicks carry their actual MouseEvent.
      h(Tooltip, { onPopupClick: (_open: boolean) => {} });
      return bad;
    };
    void negative;
  });
});
