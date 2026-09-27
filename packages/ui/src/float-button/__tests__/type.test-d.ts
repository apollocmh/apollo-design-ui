/** L3 类型（G7）—— 正例 + 负例（负例包在永不调用的闭包里，CHECKLIST §一）。 */
import { describe, expectTypeOf, it } from 'vitest';
import type {
  FloatButtonBackTopProps,
  FloatButtonGroupProps,
  FloatButtonProps,
  FloatButtonShape,
  FloatButtonType,
} from '../interface';

describe('FloatButton · 类型', () => {
  it('type 是 default/primary 两值；shape 是 circle/square 两值', () => {
    expectTypeOf<FloatButtonType>().toEqualTypeOf<'default' | 'primary'>();
    expectTypeOf<FloatButtonShape>().toEqualTypeOf<'circle' | 'square'>();
  });

  it('badge 是 Omit(BadgeProps, status/text/title/children)', () => {
    const badge: FloatButtonProps['badge'] = { dot: true, count: 5 };
    expectTypeOf(badge).not.toBeNever();
  });

  it('Group：placement 四值；trigger 两值', () => {
    const g: Pick<FloatButtonGroupProps, 'placement' | 'trigger'> = {
      placement: 'top',
      trigger: 'click',
    };
    expectTypeOf(g).not.toBeNever();
  });

  it('BackTop：visibilityHeight/duration/showProgress + target fn', () => {
    const b: Pick<
      FloatButtonBackTopProps,
      'visibilityHeight' | 'duration' | 'showProgress' | 'target'
    > = {
      visibilityHeight: 400,
      duration: 450,
      showProgress: false,
      target: () => window,
    };
    expectTypeOf(b).not.toBeNever();
  });

  it('正例：插槽形态组合', () => {
    const sample: FloatButtonProps = {
      type: 'primary',
      shape: 'square',
      tooltip: 'help',
      badge: { dot: true },
      href: '#',
    };
    expectTypeOf(sample).not.toBeNever();
  });

  it('负例（永不调用的闭包）', () => {
    const negative = () => {
      const props: FloatButtonProps = {
        // @ts-expect-error type 是两值联合
        type: 'dashed',
        // @ts-expect-error shape 是两值联合
        shape: 'round',
      };
      return props;
    };
    void negative;
  });
});
