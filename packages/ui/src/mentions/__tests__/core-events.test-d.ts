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
    emit('input', new Event('input'));
    emit('focus', new FocusEvent('focus'));
    emit('blur', new FocusEvent('blur'));
    emit('keydown', new KeyboardEvent('keydown'));
    emit('keyup', new KeyboardEvent('keyup'));
    emit('pressEnter', new KeyboardEvent('keydown'));
    emit('popupScroll', new Event('scroll'));
    emit('resize', { width: 100, height: 20 });
    emit('clear');
    // @ts-expect-error Focus events require native FocusEvent data.
    emit('focus', 'focus');
    // @ts-expect-error Keyboard listeners receive KeyboardEvent.
    emit('keydown', new Event('keydown'));
    // @ts-expect-error Clear has no payload.
    emit('clear', new Event('click'));
    // @ts-expect-error Resize must include both dimensions.
    emit('resize', { height: 20 });
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
