import { expectTypeOf, it } from 'vitest';
import type { Mentions, MentionsOptionProps } from '../../index';

it('public component emits enforce semantic payloads', () => {
  type Emit = InstanceType<typeof Mentions>['$emit'];
  expectTypeOf<Emit>().toBeFunction();
  const check = (emit: Emit, option: MentionsOptionProps) => {
    emit('update:value', 'value');
    emit('change', 'value');
    emit('select', option, '@');
    emit('search', 'query', '@');
    // @ts-expect-error Semantic change receives text, never a DOM event.
    emit('change', new Event('change'));
    // @ts-expect-error Selection requires an option, not its string value.
    emit('select', 'alpha', '@');
    // @ts-expect-error Search requires its prefix.
    emit('search', 'query');
    // @ts-expect-error v-model values are strings.
    emit('update:value', 1);
  };
  void check;
});
