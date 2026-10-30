/** L3 类型（G7）—— 正例 + 负例（负例包在永不调用的闭包里，CHECKLIST §一）。 */
import { describe, expectTypeOf, it } from 'vitest';
import type { VNodeChild } from 'vue';
import type { Steps } from '../index';
import type {
  StepItem,
  StepsItemRenderSlotProps,
  StepsProps,
  StepsSize,
  StepsSlots,
  StepsStatus,
  StepsType,
} from '../interface';
import type { ComponentToken } from '../style/token';

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

  it('native renderer slots have explicit scopes and renderable return values', () => {
    expectTypeOf<keyof StepsSlots>().toEqualTypeOf<
      'iconRender' | 'itemRender' | 'itemWrapperRender' | 'progressDot'
    >();
    expectTypeOf<NonNullable<StepsSlots['itemRender']>>().parameters.toEqualTypeOf<
      [props: StepsItemRenderSlotProps]
    >();
    expectTypeOf<NonNullable<StepsSlots['itemRender']>>().returns.toEqualTypeOf<VNodeChild>();
  });

  it('types native change listeners and payloads', () => {
    const listeners: StepsProps = {
      'onUpdate:current': (current) => current.toFixed(),
      onChange: [(current) => current.toFixed()],
      onChangeOnce: (current) => current.toFixed(),
      style: ['color: red', { '--apollo-steps-icon-size': '40px' }],
    };
    const events = (vm: InstanceType<typeof Steps>) => {
      vm.$emit('update:current', 1);
      // @ts-expect-error The current model emits a numeric step index.
      vm.$emit('update:current', '1');
      vm.$emit('change', 1);
      // @ts-expect-error change emits a step index, never a native DOM event.
      vm.$emit('change', new Event('change'));
    };
    void listeners;
    void events;
  });

  it('retains only the nine consumed component tokens', () => {
    expectTypeOf<keyof ComponentToken>().toEqualTypeOf<
      | 'descriptionMaxWidth'
      | 'customIconFontSize'
      | 'iconSize'
      | 'iconFontSize'
      | 'dotSize'
      | 'dotCurrentSize'
      | 'navArrowColor'
      | 'navContentMaxWidth'
      | 'iconSizeSM'
    >();
    const removed = () => {
      // @ts-expect-error customIconSize was never consumed; use iconSize.
      const size: Partial<ComponentToken> = { customIconSize: 40 };
      // @ts-expect-error customIconTop was never consumed; use semantic styles.
      const customTop: Partial<ComponentToken> = { customIconTop: 2 };
      // @ts-expect-error iconTop was never consumed; use semantic styles.
      const top: Partial<ComponentToken> = { iconTop: 2 };
      // @ts-expect-error titleLineHeight was an unused deprecated token.
      const title: Partial<ComponentToken> = { titleLineHeight: 20 };
      return [size, customTop, top, title];
    };
    void removed;
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
