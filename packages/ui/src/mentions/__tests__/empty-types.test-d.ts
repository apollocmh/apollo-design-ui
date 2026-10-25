import { expectTypeOf, it } from 'vitest';
import type { VNodeChild } from 'vue';
import type { MentionsProps, MentionsSlots } from '../../index';

it('empty content is a parameterless native slot while VNodeChild data remains valid', () => {
  expectTypeOf<Parameters<NonNullable<MentionsSlots['notFoundContent']>>>().toEqualTypeOf<[]>();
  expectTypeOf<
    ReturnType<NonNullable<MentionsSlots['notFoundContent']>>
  >().toEqualTypeOf<VNodeChild>();
  expectTypeOf<MentionsProps['notFoundContent']>().toEqualTypeOf<VNodeChild>();
  const check = () => {
    const data: MentionsProps = { notFoundContent: false };
    const empty: MentionsSlots = { notFoundContent: () => [] };
    // @ts-expect-error Content functions use the native slot, not VNodeChild data.
    const callback: MentionsProps = { notFoundContent: () => 'empty' };
    // @ts-expect-error The empty slot has no fabricated positional payload.
    const positional: MentionsSlots = { notFoundContent: (_text: string) => null };
    return [data, empty, callback, positional];
  };
  void check;
});
