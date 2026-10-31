import { expectTypeOf } from 'vitest';
import { h, type VNodeChild } from 'vue';
import { type ClosableCollection, computeClosable } from '../use-closable';

const result = computeClosable(
  { closable: { closeIcon: [h('span'), 0, false, null] } },
  undefined,
  { closeIconRender: (icon) => h('span', [icon]) },
);
expectTypeOf(result.closeIconNode).toEqualTypeOf<VNodeChild>();

// @ts-expect-error Close icons must be renderable Vue content, not arbitrary objects.
const invalid: ClosableCollection = { closeIcon: { unexpected: true } };
void invalid;

computeClosable(undefined, undefined, {
  // @ts-expect-error A close icon renderer must return renderable Vue content.
  closeIconRender: () => ({ unexpected: true }),
});
