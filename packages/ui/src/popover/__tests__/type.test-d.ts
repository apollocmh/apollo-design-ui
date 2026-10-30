/**
 * L3 类型（G7）—— 正例 + 负例（负例包在永不调用的闭包里，CHECKLIST §一）。
 */
import { describe, expectTypeOf } from 'vitest';
import { h } from 'vue';
import type { PopoverEmits, PopoverProps } from '../interface';
import Popover from '../Popover';

describe('Popover · 类型', () => {
  it('正例：合法 prop 组合（title/content 双通道 + title/content 语义槽）', () => {
    const sample: Pick<
      PopoverProps,
      'title' | 'content' | 'placement' | 'arrow' | 'classNames' | 'styles'
    > = {
      title: 't',
      content: 'c',
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

  it('keeps the event listeners and emitted payloads precise', () => {
    expectTypeOf<Parameters<PopoverEmits['openChange']>>().toEqualTypeOf<[open: boolean]>();
    expectTypeOf<Parameters<PopoverEmits['afterOpenChange']>>().toEqualTypeOf<[open: boolean]>();
    expectTypeOf<Parameters<PopoverEmits['popupClick']>>().toEqualTypeOf<[event: MouseEvent]>();
    const props: PopoverProps = {
      onOpenChange: (_open: boolean) => {},
      'onUpdate:open': (_open: boolean) => {},
      onAfterOpenChange: (_open: boolean) => {},
      onPopupClick: (_event: MouseEvent) => {},
    };
    h(Popover, props);
    const negative = () => {
      // @ts-expect-error Popup clicks carry the original MouseEvent.
      h(Popover, { onPopupClick: (_open: boolean) => {} });
      // @ts-expect-error Open proposals carry a boolean.
      h(Popover, { onOpenChange: (_event: MouseEvent) => {} });
    };
    void negative;
  });
});
