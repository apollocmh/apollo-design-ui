import { describe, expectTypeOf, it } from 'vitest';
import type {
  ChildProps,
  FieldSlots,
  FormInstance,
  FormRef,
  FormSlots,
  ListSlots,
  Meta,
  Store,
} from '../form-types';
import type { Field, Form, FormProvider, List } from '../index';

describe('Vue component contracts', () => {
  it('all scoped slots have one named argument', () => {
    expectTypeOf<Parameters<NonNullable<FieldSlots['default']>>>().toEqualTypeOf<
      [{ control: ChildProps; meta: Meta; form: FormInstance }]
    >();
    expectTypeOf<Parameters<NonNullable<FormSlots['default']>>>().toEqualTypeOf<
      [{ values: Store; form: FormInstance }]
    >();
    expectTypeOf<Parameters<NonNullable<ListSlots['default']>>['length']>().toEqualTypeOf<1>();
    expectTypeOf<FormRef['nativeElement']>().toEqualTypeOf<HTMLElement | null>();
  });

  it('component listeners and scopes reject the old shapes', () => {
    const check = (
      field: InstanceType<typeof Field>,
      form: InstanceType<typeof Form>,
      list: InstanceType<typeof List>,
      provider: InstanceType<typeof FormProvider>,
      instance: FormInstance,
      meta: Meta,
    ) => {
      field.$emit('metaChange', meta);
      field.$emit('reset');
      form.$emit('valuesChange', { title: 'Apollo' }, { title: 'Apollo' });
      provider.$emit('formFinish', 'profile', { values: {}, forms: {} });
      field.$slots.default?.({ control: {}, meta, form: instance });
      form.$slots.default?.({ values: {}, form: instance });
      list.$slots.default?.({ fields: [], operations: { add() {}, remove() {}, move() {} }, meta });
      // @ts-expect-error metaChange sends field metadata rather than a string.
      field.$emit('metaChange', 'changed');
      // @ts-expect-error finishFailed sends the validation result object.
      form.$emit('finishFailed', 1);
      // @ts-expect-error FormProvider notification requires its forms map.
      provider.$emit('formFinish', 'profile', { values: {} });
      // @ts-expect-error Field scope is a named object, not three positional arguments.
      field.$slots.default?.({}, meta, instance);
      // @ts-expect-error Form scope is a named object, not values and form positions.
      form.$slots.default?.({}, instance);
    };
    void check;
  });
});
