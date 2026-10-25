import { expectTypeOf, it } from 'vitest';
import type { VNode, VNodeChild } from 'vue';
import type { MentionsPopupRenderSlotProps, MentionsProps, MentionsSlots } from '../../index';

it('Mentions popupRender is a single native scoped slot with a real origin VNode', () => {
  expectTypeOf<MentionsPopupRenderSlotProps>().toEqualTypeOf<{ originNode: VNode }>();
  expectTypeOf<Parameters<NonNullable<MentionsSlots['popupRender']>>>().toEqualTypeOf<
    [MentionsPopupRenderSlotProps]
  >();
  expectTypeOf<ReturnType<NonNullable<MentionsSlots['popupRender']>>>().toEqualTypeOf<VNodeChild>();
  expectTypeOf<MentionsProps>().not.toHaveProperty('popupRender');
  const negative = () => {
    // @ts-expect-error Render-function props migrate directly to #popupRender.
    const old: MentionsProps = { popupRender: () => null };
    // @ts-expect-error Native slots receive a named object, not a positional menu VNode.
    const positional: MentionsSlots = { popupRender: (_menu: VNode) => null };
    return [old, positional];
  };
  void negative;
});
