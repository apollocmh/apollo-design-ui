import { expectTypeOf, it } from 'vitest';
import { type EmitsToProps, h } from 'vue';
import type { SizeType } from '../../config-provider/size-context';
import { Radio, RadioButton, RadioGroup } from '../index';
import type {
  RadioChangeEvent,
  RadioEmits,
  RadioGroupButtonStyle,
  RadioGroupEmits,
  RadioGroupOptionType,
  RadioGroupProps,
  RadioGroupRef,
  RadioGroupSlots,
  RadioOptionItem,
  RadioProps,
  RadioRef,
  RadioSlots,
  RadioValue,
} from '../interface';

type RadioInstance = InstanceType<typeof Radio>;
type ButtonInstance = InstanceType<typeof RadioButton>;
type GroupInstance = InstanceType<typeof RadioGroup>;

it('Radio models and scalar option values retain their exact public types', () => {
  expectTypeOf<RadioProps['checked']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<RadioProps['defaultChecked']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<RadioProps['disabled']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<RadioProps['title']>().toEqualTypeOf<string | undefined>();
  expectTypeOf<RadioProps['value']>().toEqualTypeOf<RadioValue | undefined>();
  expectTypeOf<RadioGroupProps['value']>().toEqualTypeOf<RadioValue | undefined>();
  expectTypeOf<RadioGroupProps['defaultValue']>().toEqualTypeOf<RadioValue | undefined>();
  expectTypeOf<RadioGroupProps['size']>().toEqualTypeOf<SizeType | undefined>();
  expectTypeOf<RadioGroupProps['buttonStyle']>().toEqualTypeOf<RadioGroupButtonStyle | undefined>();
  expectTypeOf<RadioGroupProps['optionType']>().toEqualTypeOf<RadioGroupOptionType | undefined>();
  expectTypeOf<RadioGroupProps['vertical']>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<RadioGroupProps['block']>().toEqualTypeOf<boolean | undefined>();
});

it('owned native notifications have the same payload in public and actual constructor types', () => {
  expectTypeOf<RadioChangeEvent>().toEqualTypeOf<Event>();
  expectTypeOf<RadioProps['onChange']>().toEqualTypeOf<RadioEmits['change'] | undefined>();
  expectTypeOf<RadioOptionItem['onChange']>().toEqualTypeOf<RadioEmits['change'] | undefined>();
  expectTypeOf<RadioGroupProps['onChange']>().toEqualTypeOf<
    RadioGroupEmits['change'] | undefined
  >();
  expectTypeOf<RadioInstance['$props']['onChange']>().toEqualTypeOf<
    EmitsToProps<RadioEmits>['onChange']
  >();
  expectTypeOf<ButtonInstance['$props']['onChange']>().toEqualTypeOf<
    RadioInstance['$props']['onChange']
  >();
  expectTypeOf<GroupInstance['$props']['onChange']>().toEqualTypeOf<
    EmitsToProps<RadioGroupEmits>['onChange']
  >();
});

it('actual Radio/Button/Group references expose the native nullable elements', () => {
  expectTypeOf<RadioInstance['input']>().toEqualTypeOf<RadioRef['input']>();
  expectTypeOf<RadioInstance['nativeElement']>().toEqualTypeOf<RadioRef['nativeElement']>();
  expectTypeOf<RadioInstance['focus']>().toEqualTypeOf<RadioRef['focus']>();
  expectTypeOf<RadioInstance['blur']>().toEqualTypeOf<RadioRef['blur']>();
  expectTypeOf<ButtonInstance['input']>().toEqualTypeOf<RadioRef['input']>();
  expectTypeOf<ButtonInstance['nativeElement']>().toEqualTypeOf<RadioRef['nativeElement']>();
  expectTypeOf<GroupInstance['nativeElement']>().toEqualTypeOf<RadioGroupRef['nativeElement']>();
});

it('default slots and object/function semantic styles keep their current contract', () => {
  const slots: RadioSlots = { default: () => 0 };
  const groupSlots: RadioGroupSlots = { default: () => [h(Radio, { value: false })] };
  const props: RadioProps = {
    classNames: { root: 'r', icon: 'i', label: 'l' },
    styles: ({ props }) => ({ icon: { opacity: props.checked ? 0.5 : 1 } }),
  };
  h(Radio, props, slots);
  h(RadioGroup, { options: [1, '1', { value: false, label: 'False' }] }, groupSlots);
  h(Radio.Button, {
    checked: false,
    'onUpdate:checked': (checked) => {
      expectTypeOf(checked).toBeBoolean();
    },
  });
  h(Radio.Group, {
    onChange: (value, event) => {
      expectTypeOf(value).toEqualTypeOf<RadioValue>();
      expectTypeOf(event).toEqualTypeOf<Event>();
    },
  });
  h(RadioButton, {
    onChange: (event, checked) => {
      expectTypeOf(event).toEqualTypeOf<Event>();
      expectTypeOf(checked).toEqualTypeOf<boolean>();
    },
    onKeydown: (event) => {
      expectTypeOf(event).toEqualTypeOf<KeyboardEvent>();
    },
  });
});

// Type-negative probes stay uncalled; no invalid component is mounted.
function invalidContracts() {
  // @ts-expect-error Radio semantic regions are root/icon/label.
  const badSlot: RadioProps = { classNames: { body: 'b' } };
  // @ts-expect-error optionType only accepts default/button on Group.
  const badOptionType: RadioGroupProps = { optionType: 'solid' };
  // @ts-expect-error buttonStyle only accepts outline/solid.
  const badButtonStyle: RadioGroupProps = { buttonStyle: 'button' };
  // @ts-expect-error checked is boolean.
  const badChecked: RadioProps = { checked: 'yes' };
  // @ts-expect-error Group has no leaf semantic regions.
  const badGroup: RadioGroupProps = { classNames: { root: 'r' } };
  // @ts-expect-error skipGroup never had a Radio runtime responsibility.
  const badSkip: RadioInstance['$props'] = { skipGroup: true };
  // @ts-expect-error Standalone appearance uses RadioButton; optionType belongs to Group.
  const badAppearance: ButtonInstance['$props'] = { optionType: 'button' };
  // @ts-expect-error input type is fixed to radio.
  const badType: RadioProps = { type: 'checkbox' };
  // @ts-expect-error the legacy React listener spelling is not a Radio event.
  const badKey: RadioProps = { onKeyDown: (_event: KeyboardEvent) => {} };
  // @ts-expect-error Radio change receives Event and a separate boolean snapshot.
  h(Radio, { onChange: (_event: { target: { checked: boolean } }) => {} });
  // @ts-expect-error Group change receives a scalar value, not the leaf Event payload.
  h(RadioGroup, { onChange: (_event: Event) => {} });
  // @ts-expect-error Arbitrary objects cannot be radio option identities.
  h(RadioButton, { value: { key: 1 } });
  // @ts-expect-error Group values are scalars, not checkbox arrays.
  h(RadioGroup, { value: ['a'] });
  const nativeEvent: RadioChangeEvent = new Event('change');
  // @ts-expect-error No synthetic nativeEvent wrapper exists.
  nativeEvent.nativeEvent;
  void [
    badSlot,
    badOptionType,
    badButtonStyle,
    badChecked,
    badGroup,
    badSkip,
    badAppearance,
    badType,
    badKey,
  ];
}
void invalidContracts;
