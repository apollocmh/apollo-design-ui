<script lang="ts">
/**
 * Form —— 表单容器（antd `es/form/Form.js` 188 行的 Vue 等价物）。
 *
 * 结构：消费 form-core 的 `Form`（FieldForm 壳，store 逻辑已在 foundation 落地），
 * 本组件只做 **antd 展示层**：context 合并 / 类名 / onFinishFailed 包装
 * （scrollToFirstError）/ NoFormStyle(status) / FormContext 下发。
 *
 * ── 关键判据（docs/analysis/form.md §2）──────────────────────────────────────
 * 1. context 合并：requiredMark（prop → ctx → true）、colon（prop ?? ctx）、
 *    labelAlign/labelWrap（prop ?? ctx）、tooltip（ctx 与 prop 浅合并）、
 *    scrollToFirstError（prop ?? ctx）；
 * 2. 类名：`${p}` + `${p}-${layout}` + `-hide-required-mark`(requiredMark===false)
 *    + `-rtl` + `-large/-small`；
 * 3. onFinishFailed 包装：先回调用户，再有 errorFields 且 scrollToFirstError 时
 *    `scrollToField(fieldName, {block:'nearest', ...options})`；
 * 4. context 栈：VariantContext → DisabledContext → SizeContext → FormProvider →
 *    FormContext → NoFormStyle(status=true)（Form 根上不吃 Item 的状态反馈）；
 * 5. expose：`{ ...formInstance, nativeElement }`。
 */

import { Form as CoreForm, type FormInstance, useForm } from '@apollo-design/form-core';
import { computed, defineComponent, h, type PropType, provide, type Ref, shallowRef } from 'vue';
import { useComponentConfig } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import {
  type FormContextValue,
  formContextKey,
  provideNoFormStyle,
  variantContextKey,
} from './context';
import { useForm as useUiForm } from './hooks/use-form';
import type { FormProps } from './interface';

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
    feedbackIcons: { type: Function as PropType<FormProps['feedbackIcons']>, default: undefined },
    size: { type: String as PropType<FormProps['size']>, default: undefined },
    disabled: { type: Boolean, default: undefined },
    scrollToFirstError: {
      type: [Boolean, Object] as PropType<FormProps['scrollToFirstError']>,
      default: undefined,
    },
    requiredMark: {
      type: [Boolean, String, Function] as PropType<FormProps['requiredMark']>,
      default: undefined,
    },
    variant: { type: String as PropType<FormProps['variant']>, default: undefined },
    tooltip: { type: Object as PropType<FormProps['tooltip']>, default: undefined },
    rootClassName: { type: String, default: undefined },
    classNames: { type: Object as PropType<FormProps['classNames']>, default: undefined },
    styles: { type: Object as PropType<FormProps['styles']>, default: undefined },
    // ---- form-core FormProps（Form.vue 原骨架声明，转发给 core Form）----
    form: { type: Object as PropType<FormInstance<never>>, default: undefined },
    component: { type: [Boolean, String] as PropType<FormProps['component']>, default: 'form' },
    name: { type: String, default: undefined },
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
  emits: ['valuesChange', 'fieldsChange', 'finish', 'finishFailed'],
  setup(props, { slots, attrs, expose, emit }) {
    const context = useComponentConfig('form');
    const contextSemantic = context as unknown as {
      requiredMark?: FormProps['requiredMark'];
      colon?: boolean;
      labelAlign?: FormProps['labelAlign'];
      labelWrap?: boolean;
      scrollToFirstError?: FormProps['scrollToFirstError'];
      tooltip?: FormProps['tooltip'];
      className?: string;
      style?: Record<string, string | number>;
      direction?: 'ltr' | 'rtl';
      getPrefixCls: (s?: string, c?: string) => string;
    };
    const contextDisabled = useDisabled(props.disabled);

    const mergedRequiredMark = (): FormProps['requiredMark'] => {
      if (props.requiredMark !== undefined) return props.requiredMark;
      if (contextSemantic.requiredMark !== undefined) return contextSemantic.requiredMark;
      return true;
    };
    const mergedColon = (): boolean | undefined => props.colon ?? contextSemantic.colon;
    const mergedLabelAlign = (): FormProps['labelAlign'] =>
      props.labelAlign ?? contextSemantic.labelAlign;
    const mergedLabelWrap = (): boolean | undefined => props.labelWrap ?? contextSemantic.labelWrap;
    const mergedTooltip = (): FormProps['tooltip'] => ({
      ...(contextSemantic.tooltip ?? {}),
      ...(props.tooltip ?? {}),
    });
    const mergedScrollToFirstError = (): FormProps['scrollToFirstError'] =>
      props.scrollToFirstError ?? contextSemantic.scrollToFirstError;

    const prefixCls = () => contextSemantic.getPrefixCls('form', props.prefixCls);

    // ── form 实例（转发外部受控 form）──
    const [wrapForm] = useUiForm(props.form as FormInstance | undefined);

    // itemRef 注册表（__INTERNAL__.itemRef 同构）
    const itemRefMap = new Map<string, Ref<unknown>>();
    const itemRef = (name: string | string[]): Ref<unknown> => {
      const key = Array.isArray(name) ? name.join('_') : name;
      if (!itemRefMap.has(key)) {
        const holder = shallowRef(null);
        itemRefMap.set(key, holder);
      }
      return itemRefMap.get(key) as Ref<unknown>;
    };
    // ⚠️ `__INTERNAL__` 非空是 useCoreForm 的构造保证（同 antd 壳的直接访问）
    if (import.meta.env?.DEV) {
      console.log(
        'DBG-FORM-PROP:',
        props.form !== undefined,
        props.form === (wrapForm as unknown),
        Object.keys(props).filter((k) => (props as Record<string, unknown>)[k] !== undefined),
      );
    }
    const internal = (wrapForm as unknown as { __INTERNAL__: Record<string, unknown> })
      .__INTERNAL__;
    internal.name = props.name;
    internal.itemRef = itemRef;

    const nativeElementRef = shallowRef<HTMLElement | null>(null);
    expose({
      ...wrapForm,
      get nativeElement() {
        return nativeElementRef.value;
      },
    });

    // ── onFinishFailed 包装（scrollToFirstError）──
    const onInternalFinishFailed = (errorInfo: { errorFields: { name: string[] }[] }): void => {
      props.onFinishFailed?.(errorInfo as never);
      const firstError = errorInfo.errorFields[0];
      if (firstError) {
        const fieldName = firstError.name;
        const options = mergedScrollToFirstError();
        if (options !== undefined) {
          const defaultOpt = { block: 'nearest' as ScrollBehavior | 'nearest' };
          const merged = typeof options === 'object' ? { ...defaultOpt, ...options } : defaultOpt;
          wrapForm.scrollToField?.(fieldName as never, merged as never);
        }
      }
    };

    // ── FormContext（Proxy 桥：读时取最新合并值）──
    const formContextValue: FormContextValue = new Proxy({} as FormContextValue, {
      get(_t, key) {
        const source: FormContextValue = {
          name: props.name,
          get labelAlign() {
            return mergedLabelAlign();
          },
          labelCol: props.labelCol as never,
          get labelWrap() {
            return mergedLabelWrap();
          },
          wrapperCol: props.wrapperCol as never,
          layout: props.layout ?? 'horizontal',
          get colon() {
            return mergedColon();
          },
          get requiredMark() {
            return mergedRequiredMark();
          },
          itemRef: itemRef as never,
          form: wrapForm as never,
          feedbackIcons: props.feedbackIcons as never,
          get tooltip() {
            return mergedTooltip();
          },
          classNames: props.classNames as never,
          styles: props.styles as never,
          get scrollToFirstError() {
            return mergedScrollToFirstError();
          },
        };
        return (source as unknown as Record<string | symbol, unknown>)[key];
      },
    });
    provide(formContextKey, formContextValue);
    // VariantContext（Form 级 variant 覆盖）
    provide(
      variantContextKey,
      computed(() => props.variant),
    );
    // ⚠️ NoFormStyle(status=true)：Form 根上不吃 Item 的状态反馈（antd 逐字）
    provideNoFormStyle({ status: true });

    return () => {
      const p = prefixCls();
      const rm = mergedRequiredMark();
      const formClassName = [
        p,
        `${p}-${props.layout}`,
        rm === false ? `${p}-hide-required-mark` : '',
        contextSemantic.direction === 'rtl' ? `${p}-rtl` : '',
        props.size === 'large' ? `${p}-large` : '',
        props.size === 'small' ? `${p}-small` : '',
        props.classNames?.root,
      ]
        .filter(Boolean)
        .join(' ');

      // 外层 provider（variant / disabled）先落，再进 core Form
      const core = h(
        CoreForm as never,
        {
          ...(attrs as Record<string, unknown>),
          id: props.name,
          name: props.name,
          initialValues: props.initialValues,
          validateMessages: props.validateMessages,
          validateTrigger: props.validateTrigger,
          preserve: props.preserve,
          clearOnDestroy: props.clearOnDestroy,
          component: props.component,
          renderProps: props.renderProps,
          form: wrapForm as never,
          ref: nativeElementRef as never,
          style: props.styles?.root,
          class: formClassName,
          onFinish: (values: unknown) => {
            emit('finish', values);
          },
          onValuesChange: (changed: unknown, all: unknown) => {
            emit('valuesChange', changed, all);
          },
          onFieldsChange: (changed: unknown, all: unknown) => {
            emit('fieldsChange', changed, all);
          },
          onFinishFailed: onInternalFinishFailed as never,
        },
        { default: slots.default as never },
      );

      return core;
    };
  },
});
</script>
