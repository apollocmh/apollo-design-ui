import { expectTypeOf, it } from 'vitest';
import type { Image, ImageProps } from '../../index';

it('Image exposes exact native events and Boolean update:open payloads', () => {
  type PublicProps = InstanceType<typeof Image>['$props'];
  type Emit = InstanceType<typeof Image>['$emit'];

  expectTypeOf<Parameters<NonNullable<PublicProps['onClick']>>>().toEqualTypeOf<[MouseEvent]>();
  expectTypeOf<Parameters<NonNullable<PublicProps['onError']>>>().toEqualTypeOf<[Event]>();
  expectTypeOf<Parameters<NonNullable<PublicProps['onKeydown']>>>().toEqualTypeOf<
    [KeyboardEvent]
  >();
  expectTypeOf<Parameters<NonNullable<PublicProps['onUpdate:open']>>>().toEqualTypeOf<[boolean]>();
  expectTypeOf<Parameters<NonNullable<ImageProps['onClick']>>>().toEqualTypeOf<[MouseEvent]>();
  expectTypeOf<Parameters<NonNullable<ImageProps['onError']>>>().toEqualTypeOf<[Event]>();
  expectTypeOf<Parameters<NonNullable<ImageProps['onKeydown']>>>().toEqualTypeOf<[KeyboardEvent]>();
  expectTypeOf<Parameters<NonNullable<ImageProps['onUpdate:open']>>>().toEqualTypeOf<[boolean]>();
  expectTypeOf<Parameters<NonNullable<PublicProps['onOpenChange']>>>().toEqualTypeOf<
    [boolean, boolean]
  >();

  const check = (emit: Emit) => {
    emit('click', new MouseEvent('click'));
    emit('error', new Event('error'));
    emit('keydown', new KeyboardEvent('keydown'));
    emit('update:open', true);
    // Preview state now uses a top-level typed Vue event, alongside v-model:open.
    emit('openChange', true, false);
    // @ts-expect-error Click receives the native MouseEvent, not a generic Event.
    emit('click', new Event('click'));
    // @ts-expect-error Error receives the original Event, not an error message.
    emit('error', 'load failed');
    // @ts-expect-error Keyboard listeners receive KeyboardEvent.
    emit('keydown', new Event('keydown'));
    // @ts-expect-error Keyboard events require their payload.
    emit('keydown');
    // @ts-expect-error Open state is a primitive Boolean value.
    emit('update:open', 'true');
    // @ts-expect-error Open state does not accept a boxed Boolean.
    emit('update:open', new Boolean(true));
    // @ts-expect-error State change requires both next and previous Boolean values.
    emit('openChange', true, 'false');
    // @ts-expect-error Unknown events are not part of the public Image contract.
    emit('unknownImageEvent', new Event('unknownImageEvent'));
  };
  void check;
});
