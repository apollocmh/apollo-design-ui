import { describe, expectTypeOf, it } from 'vitest';
import type { EmitsToProps } from 'vue';
import type Checkbox from '../Checkbox';
import type Group from '../Group';
import type {
  CheckboxChangeEvent,
  CheckboxEmits,
  CheckboxGroupProps,
  CheckboxOptionType,
  CheckboxProps,
  CheckboxValueType,
} from '../interface';

describe('Checkbox actual Vue public contracts', () => {
  it('exposes owned native notifications, typed models and actual nullable refs', () => {
    expectTypeOf<CheckboxChangeEvent>().toEqualTypeOf<Event>();
    expectTypeOf<CheckboxEmits['change']>().toEqualTypeOf<
      (event: Event, checked: boolean) => void
    >();
    expectTypeOf<InstanceType<typeof Checkbox>['$props']['onChange']>().toEqualTypeOf<
      EmitsToProps<{ change: CheckboxEmits['change'] }>['onChange']
    >();
    expectTypeOf<InstanceType<typeof Checkbox>['input']>().toEqualTypeOf<HTMLInputElement | null>();
    expectTypeOf<
      InstanceType<typeof Group>['nativeElement']
    >().toEqualTypeOf<HTMLDivElement | null>();
    expectTypeOf<CheckboxGroupProps['value']>().toEqualTypeOf<CheckboxValueType[] | undefined>();
    expectTypeOf<CheckboxOptionType['onChange']>().toEqualTypeOf<
      CheckboxEmits['change'] | undefined
    >();
  });
  it('rejects fake change wrappers and unsupported option value objects', () => {
    const negative = () => {
      // @ts-expect-error Checkbox emits an actual Event; there is no nativeEvent wrapper.
      const old: CheckboxProps = { onChange: (_event: { nativeEvent: Event }) => {} };
      // @ts-expect-error A checkbox option is a scalar value, matching the rendered checkbox prop.
      const values: CheckboxGroupProps = { value: [{ id: 1 }] };
      void old;
      void values;
    };
    expectTypeOf(negative).toBeFunction();
  });
});
