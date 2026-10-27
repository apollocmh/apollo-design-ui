import { describe, expectTypeOf, it } from 'vitest';
import type { CheckableTag, CheckableTagGroup, Tag } from '../index';
import type {
  CheckableTagEmits,
  CheckableTagGroupEmits,
  CheckableTagGroupProps,
  CheckableTagProps,
  GroupSemanticClassNames,
  TagColor,
  TagConfig,
  TagEmits,
  TagProps,
  TagSemanticClassNames,
  TagVariant,
} from '../interface';

describe('Tag public Vue contracts', () => {
  it('finite variants, semantics and existing arbitrary colours', () => {
    expectTypeOf<TagVariant>().toEqualTypeOf<'filled' | 'solid' | 'outlined'>();
    expectTypeOf<keyof TagSemanticClassNames>().toEqualTypeOf<
      'root' | 'icon' | 'content' | 'close'
    >();
    expectTypeOf<keyof GroupSemanticClassNames>().toEqualTypeOf<'root' | 'item'>();
    expectTypeOf<TagProps['color']>().toEqualTypeOf<TagColor | undefined>();
    expectTypeOf<TagConfig['variant']>().toEqualTypeOf<TagVariant | undefined>();
  });
  it('typed Vue events and mode-specific models', () => {
    expectTypeOf<TagEmits['close']>().toEqualTypeOf<[event: MouseEvent]>();
    expectTypeOf<CheckableTagEmits['change']>().toEqualTypeOf<[checked: boolean]>();
    expectTypeOf<CheckableTagEmits['keydown']>().toEqualTypeOf<[event: KeyboardEvent]>();
    expectTypeOf<CheckableTagGroupProps<string, false>['value']>().toEqualTypeOf<
      string | null | undefined
    >();
    expectTypeOf<CheckableTagGroupEmits<string, true>['update:value']>().toEqualTypeOf<
      [value: string[]]
    >();
  });
  it('actual exposed roots and precise static component identities', () => {
    expectTypeOf<
      InstanceType<typeof Tag>['nativeElement']
    >().toEqualTypeOf<HTMLSpanElement | null>();
    expectTypeOf<
      InstanceType<typeof CheckableTag>['nativeElement']
    >().toEqualTypeOf<HTMLSpanElement | null>();
    type GroupExpose = Parameters<NonNullable<Parameters<typeof CheckableTagGroup>[2]>>[0];
    expectTypeOf<GroupExpose['nativeElement']>().toEqualTypeOf<HTMLDivElement | null>();
    expectTypeOf<typeof Tag.CheckableTag>().toEqualTypeOf<typeof CheckableTag>();
    expectTypeOf<typeof Tag.CheckableTagGroup>().toEqualTypeOf<typeof CheckableTagGroup>();
    expectTypeOf<typeof Tag.CheckableTag>().not.toBeAny();
    expectTypeOf<typeof Tag.CheckableTagGroup>().not.toBeAny();
  });
  it('negative public declarations', () => {
    const privateBindings = (
      tag: InstanceType<typeof Tag>,
      checkable: InstanceType<typeof CheckableTag>,
    ) => {
      // @ts-expect-error The public ref exposes nativeElement, not a private render helper.
      tag.renderTag();
      // @ts-expect-error The public ref exposes nativeElement, not a private render helper.
      checkable.renderCheckable();
    };
    void privateBindings;
    const never = () => {
      // @ts-expect-error No dashed variant exists.
      const variant: TagProps = { variant: 'dashed' };
      // @ts-expect-error Checked belongs to CheckableTag.
      const checked: TagProps = { checked: true };
      // @ts-expect-error Root classes use native class, not a stale prop alias.
      const root: TagProps = { rootClassName: 'root' };
      // @ts-expect-error Content comes from the icon slot.
      const icon: TagProps = { icon: 'icon' };
      // @ts-expect-error DOM keyboard listeners use Vue keydown, not React casing props.
      const keydown: CheckableTagProps = { onKeyDown: () => {} };
      // @ts-expect-error Group supports root/item semantics only.
      const group: CheckableTagGroupProps = { classNames: { content: 'content' } };
      // @ts-expect-error A multiple model is an array.
      const model: CheckableTagGroupProps<string, true> = { value: 'a', multiple: true };
      return [variant, checked, root, icon, keydown, group, model];
    };
    void never;
  });
});
