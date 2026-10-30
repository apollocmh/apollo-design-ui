/** Scalar radio owner with native named inputs, reactive configuration and complete root attrs. */
import { useControlledValue, useId } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  mergeProps,
  onBeforeUpdate,
  onUpdated,
  type PropType,
  type SlotsType,
  shallowRef,
} from 'vue';
import { useOrientation } from '../_internal/use-orientation';
import { useComponentConfig } from '../config-provider/context';
import { useSize } from '../config-provider/size-context';
import { provideRadioGroupContext } from './context';
import type { RadioGroupProps, RadioGroupSlots, RadioOptionItem, RadioValue } from './interface';
import { RadioComponent } from './Radio';
import { useRadioTheme } from './use-radio-theme';

export const GroupComponent = defineComponent({
  name: 'ARadioGroup',
  inheritAttrs: false,
  expose: ['nativeElement'],
  props: {
    prefixCls: { type: String, default: undefined },
    options: { type: Array as PropType<RadioGroupProps['options']>, default: () => [] },
    disabled: { type: Boolean, default: undefined },
    name: { type: String, default: undefined },
    defaultValue: { type: [String, Number, Boolean] as PropType<RadioValue>, default: undefined },
    value: { type: [String, Number, Boolean] as PropType<RadioValue>, default: undefined },
    size: { type: String as PropType<RadioGroupProps['size']>, default: undefined },
    id: { type: String, default: undefined },
    optionType: { type: String as PropType<RadioGroupProps['optionType']>, default: undefined },
    buttonStyle: { type: String as PropType<RadioGroupProps['buttonStyle']>, default: 'outline' },
    orientation: { type: String as PropType<RadioGroupProps['orientation']>, default: undefined },
    vertical: { type: Boolean, default: undefined },
    block: { type: Boolean, default: false },
    role: { type: String, default: 'radiogroup' },
  },
  emits: {
    'update:value': (_value: RadioValue) => true,
    change: (_value: RadioValue, _event: Event) => true,
    mouseenter: (_event: MouseEvent) => true,
    mouseleave: (_event: MouseEvent) => true,
    focus: (_event: FocusEvent) => true,
    blur: (_event: FocusEvent) => true,
  },
  slots: Object as SlotsType<RadioGroupSlots>,
  setup(props, { attrs, emit, slots }) {
    const context = useComponentConfig<{ className?: string; style?: import('vue').CSSProperties }>(
      'radio',
    );
    const nativeElement = shallowRef<HTMLDivElement | null>(null);
    // Moving a keyed label can blur its surviving input. Restore only this owner's lost focus.
    let focusedBeforeUpdate: Element | null = null;
    onBeforeUpdate(() => {
      const root = nativeElement.value;
      const active = root?.ownerDocument.activeElement;
      focusedBeforeUpdate = root && active && root.contains(active) ? active : null;
    });
    onUpdated(() => {
      const focused = focusedBeforeUpdate;
      focusedBeforeUpdate = null;
      const root = nativeElement.value;
      if (
        focused instanceof HTMLElement &&
        focused.isConnected &&
        root?.contains(focused) &&
        root.ownerDocument.activeElement === root.ownerDocument.body
      ) {
        focused.focus({ preventScroll: true });
      }
    });
    const defaultName = useId();
    const [value, setValue] = useControlledValue<RadioValue | undefined>({
      defaultValue: () => props.defaultValue,
      getValue: () => props.value,
    });
    const onChange = (next: RadioValue, event: Event) => {
      if (next === value.value) return;
      setValue(next);
      emit('update:value', next);
      emit('change', next, event);
    };
    const options = computed<RadioOptionItem[]>(() =>
      (props.options ?? []).map((option) =>
        typeof option === 'object' ? option : { label: option, value: option },
      ),
    );
    const orientation = useOrientation(
      () => props.orientation,
      () => props.vertical,
      () => undefined,
    );
    const size = useSize((current) => props.size ?? current);
    // Native activation unchecks siblings before Vue sees the request. Restore every accepted member.
    const checkedControls = new Set<() => void>();
    const registerChecked = (sync: () => void) => {
      checkedControls.add(sync);
      return () => {
        checkedControls.delete(sync);
      };
    };
    const syncChecked = () => {
      for (const sync of checkedControls) sync();
    };
    provideRadioGroupContext({
      onChange,
      registerChecked,
      syncChecked,
      get value() {
        return value.value;
      },
      get disabled() {
        return props.disabled;
      },
      get name() {
        return props.name ?? defaultName;
      },
      get optionType() {
        return props.optionType;
      },
      get block() {
        return props.block;
      },
    });
    const prefix = computed(() => context.getPrefixCls('radio', props.prefixCls));
    const themeStyle = useRadioTheme(() => prefix.value);
    const renderGroup = () => {
      const cls = prefix.value;
      const groupCls = `${cls}-group`;
      const children = options.value.length
        ? options.value.map((option) =>
            h(
              RadioComponent,
              {
                key: `${typeof option.value}:${String(option.value)}`,
                prefixCls: cls,
                value: option.value,
                disabled: option.disabled,
                title: option.title,
                style: option.style,
                class: option.className,
                id: option.id,
                required: option.required,
                onChange: option.onChange,
              },
              { default: () => option.label },
            ),
          )
        : slots.default?.();
      const { class: _class, style: _style, ...rootAttrs } = attrs;
      return h(
        'div',
        mergeProps(rootAttrs, {
          ref: nativeElement,
          id: props.id,
          role: props.role,
          class: [
            groupCls,
            `${groupCls}-${props.buttonStyle}`,
            {
              [`${groupCls}-large`]: size.value === 'large',
              [`${groupCls}-small`]: size.value === 'small',
              [`${groupCls}-rtl`]: context.direction === 'rtl',
              [`${groupCls}-block`]: props.block,
              [`${groupCls}-vertical`]: orientation.value[1],
            },
            context.className,
            attrs.class,
          ],
          style: [themeStyle.value, context.style, attrs.style],
          onMouseenter: (event: MouseEvent) => emit('mouseenter', event),
          onMouseleave: (event: MouseEvent) => emit('mouseleave', event),
          onFocusCapture: (event: FocusEvent) => emit('focus', event),
          onBlurCapture: (event: FocusEvent) => emit('blur', event),
        }),
        [children],
      );
    };
    return { nativeElement, renderGroup };
  },
  render() {
    return this.renderGroup();
  },
});
export const Group = GroupComponent;
export default Group;
