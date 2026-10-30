/** L3 类型（G7）—— 正例 + 负例（负例包在永不调用的闭包里，CHECKLIST §一）。 */
import { describe, expectTypeOf, it } from 'vitest';
import type BackTop from '../BackTop';
import type FloatButton from '../FloatButton';
import type Group from '../FloatButtonGroup';
import type {
  FloatButtonBackTopProps,
  FloatButtonGroupProps,
  FloatButtonGroupSlots,
  FloatButtonProps,
  FloatButtonShape,
  FloatButtonSlots,
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

  it('typed Vue emits, slots and real instance refs', () => {
    expectTypeOf<InstanceType<typeof FloatButton>['nativeElement']>().toEqualTypeOf<
      HTMLButtonElement | HTMLAnchorElement | null
    >();
    expectTypeOf<
      InstanceType<typeof Group>['nativeElement']
    >().toEqualTypeOf<HTMLDivElement | null>();
    expectTypeOf<InstanceType<typeof BackTop>['nativeElement']>().toEqualTypeOf<
      HTMLButtonElement | HTMLAnchorElement | null
    >();
    const slots: FloatButtonSlots = { icon: () => [null, 'icon'], content: () => 0 };
    const groupSlots: FloatButtonGroupSlots = {
      ...slots,
      default: () => [],
      closeIcon: () => null,
    };
    const props: InstanceType<typeof Group>['$props'] = {
      onOpenChange: (open) => expectTypeOf(open).toBeBoolean(),
      'onUpdate:open': (open) => expectTypeOf(open).toBeBoolean(),
      onClick: (event) => expectTypeOf(event).toEqualTypeOf<MouseEvent>(),
    };
    const pending: FloatButtonBackTopProps = { target: () => null };
    expectTypeOf(props).not.toBeNever();
    expectTypeOf(groupSlots).not.toBeNever();
    expectTypeOf(pending).not.toBeNever();
  });

  it('负例（永不调用的闭包）', () => {
    const negative = () => {
      const props: FloatButtonProps = {
        // @ts-expect-error type 是两值联合
        type: 'dashed',
        // @ts-expect-error shape 是两值联合
        shape: 'round',
      };
      const group: InstanceType<typeof Group>['$props'] = {
        // @ts-expect-error openChange carries boolean, not a React-style event.
        onOpenChange: (_event: MouseEvent) => {},
      };
      const slots: FloatButtonSlots = {
        // @ts-expect-error FloatButton exposes named icon/content slots only.
        title: () => 'title',
      };
      void group;
      void slots;
      return props;
    };
    void negative;
  });
});
