/** CheckboxGroup owns selected values and orders proposals by current options/registration. */
import { useControlledValue } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  type PropType,
  type SlotsType,
  shallowRef,
  type VNodeChild,
} from 'vue';
import { useComponentConfig } from '../config-provider/context';
import { CheckboxComponent } from './Checkbox';
import { provideGroupContext } from './context';
import type { CheckboxGroupProps, CheckboxOptionType, CheckboxValueType } from './interface';

export const GroupComponent = defineComponent({
  name: 'ACheckboxGroup',
  inheritAttrs: false,
  expose: ['nativeElement'],
  props: {
    prefixCls: { type: String, default: undefined },
    options: { type: Array as PropType<CheckboxGroupProps['options']>, default: () => [] },
    disabled: { type: Boolean, default: undefined },
    name: { type: String, default: undefined },
    defaultValue: { type: Array as PropType<CheckboxValueType[]>, default: undefined },
    value: { type: Array as PropType<CheckboxValueType[]>, default: undefined },
    role: { type: String, default: 'group' },
  },
  emits: {
    'update:value': (_value: CheckboxValueType[]) => true,
    change: (_value: CheckboxValueType[]) => true,
  },
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { attrs, emit, slots }) {
    const context = useComponentConfig('checkbox');
    const rootRef = shallowRef<HTMLDivElement | null>(null);
    const [mergedValue, setValue] = useControlledValue<CheckboxValueType[]>({
      defaultValue: () => props.defaultValue ?? [],
      getValue: () => props.value,
    });
    let registeredValues: CheckboxValueType[] = [];
    const registerValue = (value: CheckboxValueType) => {
      registeredValues = [...registeredValues, value];
    };
    const cancelValue = (value: CheckboxValueType) => {
      registeredValues = registeredValues.filter((item) => item !== value);
    };
    const options = computed<CheckboxOptionType[]>(() =>
      (props.options ?? [])
        .map((option) =>
          typeof option === 'string' || typeof option === 'number'
            ? { label: option, value: option }
            : option,
        )
        .filter((option) => option?.value !== null && option?.value !== undefined),
    );
    const toggleOption = (value: CheckboxValueType) => {
      const proposed = mergedValue.value.includes(value)
        ? mergedValue.value.filter((item) => item !== value)
        : [...mergedValue.value, value];
      const orderIndex = (item: CheckboxValueType) => {
        const optionIndex = options.value.findIndex((option) => option.value === item);
        return optionIndex >= 0 ? optionIndex : registeredValues.indexOf(item);
      };
      const next = proposed
        .filter((item) => registeredValues.includes(item))
        .sort((a, b) => orderIndex(a) - orderIndex(b));
      setValue(next);
      emit('update:value', next);
      emit('change', next);
    };
    provideGroupContext({
      toggleOption,
      registerValue,
      cancelValue,
      get value() {
        return mergedValue.value;
      },
      get disabled() {
        return props.disabled;
      },
      get name() {
        return props.name;
      },
    });
    const prefixCls = computed(() => context.getPrefixCls('checkbox', props.prefixCls));
    const renderGroup = () => {
      const groupCls = `${prefixCls.value}-group`;
      const children = options.value.length
        ? options.value.map((option) =>
            h(
              CheckboxComponent,
              {
                key: `${typeof option.value}:${String(option.value)}`,
                prefixCls: prefixCls.value,
                disabled: option.disabled ?? props.disabled,
                value: option.value,
                checked: mergedValue.value.includes(option.value),
                onChange: option.onChange,
                class: [`${groupCls}-item`, option.className],
                style: option.style,
                title: option.title,
                id: option.id,
                required: option.required,
              },
              { default: () => option.label },
            ),
          )
        : slots.default?.();
      return h(
        'div',
        {
          ...attrs,
          name: props.name,
          class: [groupCls, { [`${groupCls}-rtl`]: context.direction === 'rtl' }, attrs.class],
          style: attrs.style,
          role: props.role,
          ref: rootRef,
        },
        [children],
      );
    };
    return { nativeElement: rootRef, renderGroup };
  },
  render() {
    return this.renderGroup();
  },
});
export type { CheckboxGroupProps };
export const Group = GroupComponent;
export default Group;
