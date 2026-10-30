<script lang="ts">
import {
  Form as CoreForm,
  type FieldData,
  type FormInstance,
  type FormRef,
  type ValidateErrorEntity,
} from '@apollo-design/form-core';
import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  inject,
  normalizeStyle,
  onBeforeUpdate,
  type PropType,
  provide,
  type SlotsType,
  shallowRef,
} from 'vue';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import { disabledContextKey, useDisabled } from '../config-provider/disabled-context';
import { sizeContextKey, useSize } from '../config-provider/size-context';
import {
  type FormContextValue,
  formContextKey,
  provideNoFormStyle,
  variantContextKey,
} from './context';
import { useFormWithRegistry } from './hooks/use-form';
import type { FormProps, FormSemanticProps, FormSlots } from './interface';
import { useFormTheme } from './use-form-theme';

type FormDefaults = Pick<
  FormProps,
  | 'requiredMark'
  | 'colon'
  | 'labelAlign'
  | 'labelWrap'
  | 'scrollToFirstError'
  | 'tooltip'
  | 'classNames'
  | 'styles'
> & { className?: string; style?: CSSProperties };

export default defineComponent({
  name: 'AForm',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    colon: { type: Boolean, default: undefined },
    layout: { type: String as PropType<FormProps['layout']>, default: 'horizontal' },
    labelAlign: { type: String as PropType<FormProps['labelAlign']>, default: undefined },
    labelWrap: { type: Boolean, default: undefined },
    labelCol: { type: Object as PropType<FormProps['labelCol']>, default: undefined },
    wrapperCol: { type: Object as PropType<FormProps['wrapperCol']>, default: undefined },
    size: { type: String as PropType<FormProps['size']>, default: undefined },
    disabled: { type: Boolean, default: undefined },
    scrollToFirstError: {
      type: [Boolean, Object] as PropType<FormProps['scrollToFirstError']>,
      default: undefined,
    },
    requiredMark: {
      type: [Boolean, String] as PropType<FormProps['requiredMark']>,
      default: undefined,
    },
    variant: { type: String as PropType<FormProps['variant']>, default: undefined },
    tooltip: { type: Object as PropType<FormProps['tooltip']>, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<FormProps['classNames']>,
      default: undefined,
    },
    styles: { type: [Object, Function] as PropType<FormProps['styles']>, default: undefined },
    form: { type: Object as PropType<FormInstance>, default: undefined },
    component: {
      type: [Boolean, String, Object, Function] as PropType<FormProps['component']>,
      default: 'form',
    },
    name: { type: String, default: undefined },
    fields: { type: Array as PropType<FieldData[]>, default: undefined },
    validateMessages: {
      type: Object as PropType<FormProps['validateMessages']>,
      default: undefined,
    },
    validateTrigger: {
      type: [String, Array, Boolean] as PropType<FormProps['validateTrigger']>,
      default: undefined,
    },
    preserve: { type: Boolean, default: undefined },
    clearOnDestroy: { type: Boolean, default: undefined },
    initialValues: { type: Object as PropType<FormProps['initialValues']>, default: undefined },
    renderProps: { type: Boolean, default: undefined },
  },
  emits: {
    valuesChange: (_changed: Record<string, unknown>, _values: Record<string, unknown>) => true,
    fieldsChange: (_changed: FieldData[], _fields: FieldData[]) => true,
    finish: (_values: Record<string, unknown>) => true,
    finishFailed: (_error: ValidateErrorEntity) => true,
  },
  slots: Object as SlotsType<FormSlots>,
  setup(props, { slots, attrs, expose, emit }) {
    const defaults = useComponentConfig<FormDefaults>('form');
    const prefixCls = () => defaults.getPrefixCls('form', props.prefixCls);
    const themeStyle = useFormTheme(prefixCls);
    const disabled = useDisabled(() => props.disabled);
    const size = useSize((contextSize) => props.size ?? contextSize);
    provide(disabledContextKey, disabled);
    provide(sizeContextKey, size);
    const parentVariant = inject(variantContextKey, undefined);
    provide(
      variantContextKey,
      computed(() => props.variant ?? parentVariant?.value),
    );
    provideNoFormStyle({ status: true });

    const requiredMark = () => props.requiredMark ?? defaults.requiredMark ?? true;
    const colon = () => props.colon ?? defaults.colon;
    const labelAlign = () => props.labelAlign ?? defaults.labelAlign;
    const labelWrap = () => props.labelWrap ?? defaults.labelWrap;
    const tooltip = () => ({ ...defaults.tooltip, ...props.tooltip });
    const scrollToFirstError = () => props.scrollToFirstError ?? defaults.scrollToFirstError;

    const { form, registerField } = useFormWithRegistry(props.form);
    const element = shallowRef<FormRef | null>(null);
    const exposed: FormRef = {
      getFieldValue: form.getFieldValue,
      getFieldsValue: form.getFieldsValue,
      getFieldError: form.getFieldError,
      getFieldWarning: form.getFieldWarning,
      getFieldsError: form.getFieldsError,
      isFieldsTouched: form.isFieldsTouched,
      isFieldTouched: form.isFieldTouched,
      isFieldValidating: form.isFieldValidating,
      isFieldsValidating: form.isFieldsValidating,
      resetFields: form.resetFields,
      setFields: form.setFields,
      setFieldValue: form.setFieldValue,
      setFieldsValue: form.setFieldsValue,
      validateFields: form.validateFields,
      submit: form.submit,
      scrollToField: form.scrollToField,
      focusField: form.focusField,
      getFieldInstance: form.getFieldInstance,
      get nativeElement() {
        return element.value?.nativeElement ?? null;
      },
    };
    expose(exposed);

    const semanticProps = computed<FormSemanticProps>(() => ({
      ...props,
      layout: props.layout,
      size: size.value,
      disabled: disabled.value,
      colon: colon(),
      requiredMark: requiredMark(),
      labelAlign: labelAlign(),
      labelWrap: labelWrap(),
    }));
    const { classNames, styles } = useMergeSemantic(
      [() => defaults.classNames, () => props.classNames],
      [
        () => defaults.styles,
        () => semanticRootStyle(defaults.style),
        () => props.styles,
        () => semanticRootStyle(normalizeStyle(attrs.style)),
      ],
      () => semanticProps.value,
    );
    const componentVariables = computed<Record<string, string | number>>(() => {
      const variables: Record<string, string | number> = {};
      for (const [name, value] of Object.entries(styles.value.root ?? {})) {
        if (name.startsWith('--') && (typeof value === 'string' || typeof value === 'number'))
          variables[name] = value;
      }
      return variables;
    });
    const feedbackIcon = shallowRef(slots.feedbackIcon);
    const requiredMarkSlot = shallowRef(slots.requiredMark);
    onBeforeUpdate(() => {
      feedbackIcon.value = slots.feedbackIcon;
      requiredMarkSlot.value = slots.requiredMark;
    });
    const context: FormContextValue = {
      get name() {
        return props.name;
      },
      get labelAlign() {
        return labelAlign();
      },
      get labelWrap() {
        return labelWrap();
      },
      get labelCol() {
        return props.labelCol;
      },
      get wrapperCol() {
        return props.wrapperCol;
      },
      get layout() {
        return props.layout;
      },
      get colon() {
        return colon();
      },
      get requiredMark() {
        return requiredMark();
      },
      get tooltip() {
        return tooltip();
      },
      get feedbackIcon() {
        return feedbackIcon.value;
      },
      get requiredMarkSlot() {
        return requiredMarkSlot.value;
      },
      get classNames() {
        return classNames.value;
      },
      get styles() {
        return styles.value;
      },
      get componentVariables() {
        return componentVariables.value;
      },
      get scrollToFirstError() {
        return scrollToFirstError();
      },
      itemRef: registerField,
      form,
    };
    provide(formContextKey, context);

    const onFinishFailed = (error: ValidateErrorEntity): void => {
      emit('finishFailed', error);
      const first = error.errorFields[0];
      const options = scrollToFirstError();
      if (first && options) {
        form.scrollToField?.(
          first.name,
          typeof options === 'object' ? { block: 'nearest', ...options } : { block: 'nearest' },
        );
      }
    };

    return () =>
      h(
        CoreForm,
        {
          ...attrs,
          id: attrs.id ?? props.name,
          name: props.name,
          fields: props.fields,
          initialValues: props.initialValues,
          validateMessages: props.validateMessages,
          validateTrigger: props.validateTrigger,
          preserve: props.preserve,
          clearOnDestroy: props.clearOnDestroy,
          component: props.component,
          renderProps: props.renderProps,
          form,
          ref: element,
          style: [themeStyle.value, styles.value.root],
          class: [
            prefixCls(),
            `${prefixCls()}-${props.layout}`,
            requiredMark() === false ? `${prefixCls()}-hide-required-mark` : '',
            defaults.direction === 'rtl' ? `${prefixCls()}-rtl` : '',
            size.value === 'large' ? `${prefixCls()}-large` : '',
            size.value === 'small' ? `${prefixCls()}-small` : '',
            defaults.className,
            attrs.class,
            classNames.value.root,
          ],
          onFinish: (values: Record<string, unknown>) => emit('finish', values),
          onValuesChange: (changed: Record<string, unknown>, values: Record<string, unknown>) =>
            emit('valuesChange', changed, values),
          onFieldsChange: (changed: FieldData[], fields: FieldData[]) =>
            emit('fieldsChange', changed, fields),
          onFinishFailed,
        },
        { default: slots.default },
      );
  },
});
</script>
