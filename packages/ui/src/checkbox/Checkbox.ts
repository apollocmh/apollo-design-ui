/**
 * Checkbox —— 复选框。
 *
 * 契约来源：antd 6.6.4 的 `es/checkbox/Checkbox.js` + `@rc-component/checkbox`
 * 的 DOM 分配（判据逐条对齐，G1 分析 §2/§3）。
 *
 * ── 七条最容易写错的判据 ─────────────────────────────────────────────────────
 *
 * 1. **checked 受控/非受控**：`useControlledValue(defaultChecked, checked)`；
 *    在 Group 内（非 skipGroup）⇒ `mergedChecked = group.value.includes(value)`。
 * 2. **disabled 三级合并**：`props.disabled ?? group.disabled ?? DisabledContext`
 *    —— `false` 必须能显式关闭（?? 判据）。
 * 3. **DOM 分配**（rc-checkbox 语义）：`title` / 语义 styles.icon 落 **span**；
 *    `id/name/required/tabIndex/autofocus/onFocus/onBlur/onKeyDown/…` 落 **input**；
 *    `onMouseEnter/onMouseLeave` 落 **label**。
 * 4. **类名三段**：label = `-wrapper + 状态类 + context + className + 语义 root +
 *    rootClassName`；span = `语义 icon + -indeterminate + ant-wave-target +
 *    -checked + -disabled`；input = `-input`。
 * 5. **indeterminate 是副作用**：直接写 `input.indeterminate`（不是 attr）。
 * 6. **`value` 在组外不是有效 prop**（发 usage 告警）；Group 内是选项值。
 * 7. **事件冒泡锁**：label click 设 raf 锁，锁期内 input click 被 stopPropagation
 *    （防 label→input→label 双触发）。
 */

import { isRenderable, useControlledValue, useDevWarning } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  onMounted,
  onScopeDispose,
  type PropType,
  shallowRef,
  type VNodeChild,
  watchEffect,
} from 'vue';
import { mergeClassNames, mergeStyles, resolveSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { useCheckboxGroup } from './context';
import type {
  CheckboxProps,
  CheckboxRef,
  CheckboxSemanticClassNames,
  CheckboxSemanticStyles,
} from './interface';
import { useBubbleLock } from './use-bubble-lock';

/** antd Wave 的 TARGET_CLS 是固定常量（不随 prefixCls 变），SSR 产物里就有它。 */
export const WAVE_TARGET_CLS = 'ant-wave-target';

export const CheckboxComponent = defineComponent({
  name: 'ACheckbox',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    className: { type: String, default: undefined },
    rootClassName: { type: String, default: undefined },
    defaultChecked: { type: Boolean, default: false },
    checked: { type: Boolean, default: undefined },
    style: { type: Object as PropType<CheckboxProps['style']>, default: undefined },
    disabled: { type: Boolean, default: undefined },
    title: { type: String, default: undefined },
    indeterminate: { type: Boolean, default: false },
    skipGroup: { type: Boolean, default: false },
    // ⚠️ 不能写 PropType<unknown>：vue-tsc 会把它推断成 undefined（SFC 模板与
    //    h() 全线误报「not assignable to undefined」）。antd 的 value 语义上是
    //    原始值选项 ⇒ 收窄为 string|number|boolean（Group 侧已用 VNodeProps 放行）。
    value: {
      type: [String, Number, Boolean] as PropType<string | number | boolean>,
      default: undefined,
    },
    name: { type: String, default: undefined },
    id: { type: String, default: undefined },
    type: { type: String, default: undefined },
    tabIndex: { type: Number, default: undefined },
    required: { type: Boolean, default: undefined },
    autoFocus: { type: Boolean, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<CheckboxProps['classNames']>,
      default: undefined,
    },
    styles: { type: [Object, Function] as PropType<CheckboxProps['styles']>, default: undefined },
  },
  // ⚠️ onChange/onClick/onFocus/onBlur/… 是 antd 的 props 形态回调 —— 走 attrs（layout 同判）
  setup(props, { attrs, expose, slots }) {
    const callbacks = attrs as unknown as Pick<
      CheckboxProps,
      'onChange' | 'onClick' | 'onMouseEnter' | 'onMouseLeave' | 'onFocus' | 'onBlur'
    >;

    const context = useComponentConfig('checkbox');
    const { getPrefixCls, direction } = context;
    const checkboxGroup = useCheckboxGroup();
    const contextDisabled = useDisabled();
    const devWarning = useDevWarning('Checkbox');

    // ============================ Warning ==============================
    // antd：`'checked' in props || !!checkboxGroup || !('value' in props)`
    // —— 组外传 value 且没传 checked ⇒ 告警。
    const hasChecked = computed(() => props.checked !== undefined);
    watchEffect(() => {
      devWarning(
        hasChecked.value || !!checkboxGroup || props.value === undefined,
        '`value` is not a valid prop, do you mean `checked`?',
      );
    });

    // ============================= Disabled =============================
    const mergedDisabled = computed<boolean>(
      () => props.disabled ?? checkboxGroup?.disabled ?? contextDisabled.value,
    );

    // ============================== Checked =============================
    const [innerChecked, setInnerChecked] = useControlledValue<boolean>({
      defaultValue: () => props.defaultChecked,
      getValue: () => props.checked,
    });

    const mergedChecked = computed<boolean>(() => {
      if (checkboxGroup && !props.skipGroup) {
        return (checkboxGroup.value ?? []).includes(props.value);
      }
      return innerChecked.value;
    });

    const onInternalChange = (event: Event) => {
      const inputEl = event.target as HTMLInputElement;
      setInnerChecked(inputEl.checked);
      callbacks.onChange?.({
        target: {
          ...(props as unknown as Record<string, unknown>),
          type: 'checkbox',
          checked: inputEl.checked,
        },
        stopPropagation: () => event.stopPropagation(),
        preventDefault: () => event.preventDefault(),
        nativeEvent: event,
      });
      if (!props.skipGroup && checkboxGroup?.toggleOption) {
        checkboxGroup.toggleOption({
          label: slots.default?.() as VNodeChild,
          value: props.value,
        });
      }
    };

    // ======================== Register to Group =========================
    if (checkboxGroup && !props.skipGroup) {
      checkboxGroup.registerValue?.(props.value);
      onScopeDispose(() => checkboxGroup.cancelValue?.(props.value));
    }

    // ========================== Indeterminate ===========================
    const inputRef = shallowRef<HTMLInputElement | null>(null);
    const holderRef = shallowRef<HTMLElement | null>(null);
    // ⚠️ watchEffect（pre-flush）在首帧 inputRef 还没赋值时就跑完了，且此后
    //    props 不变不再触发 —— 挂载后要主动补一次（antd 的 useEffect 同语义）。
    const applyIndeterminate = () => {
      if (inputRef.value) {
        inputRef.value.indeterminate = props.indeterminate ?? false;
      }
    };
    onMounted(applyIndeterminate);
    watchEffect(applyIndeterminate);

    // ============================ Semantic ==============================
    const semanticProps = computed<CheckboxProps>(
      () =>
        ({
          ...props,
          disabled: mergedDisabled.value,
          checked: mergedChecked.value,
        }) as CheckboxProps,
    );
    const info = computed(() => ({ props: semanticProps.value }));
    const mergedClassNames = computed(() =>
      mergeClassNames<CheckboxSemanticClassNames>(
        resolveSemantic<CheckboxSemanticClassNames, CheckboxProps>(
          props.classNames as never,
          info.value,
        ),
      ),
    );
    const mergedStyles = computed(() =>
      mergeStyles<CheckboxSemanticStyles>(
        resolveSemantic<CheckboxSemanticStyles, CheckboxProps>(props.styles as never, info.value),
      ),
    );

    // ============================ Event Lock ============================
    const { onLabelClick, onInputClick } = useBubbleLock(callbacks.onClick);

    expose({
      focus: (options?: FocusOptions) => inputRef.value?.focus(options),
      blur: () => inputRef.value?.blur(),
      get input() {
        return inputRef.value;
      },
      get nativeElement() {
        return holderRef.value;
      },
    } satisfies CheckboxRef);

    const prefixCls = computed(() => getPrefixCls('checkbox', props.prefixCls));

    return () => {
      const cls = prefixCls.value;

      const classString = [
        `${cls}-wrapper`,
        {
          [`${cls}-rtl`]: direction === 'rtl',
          [`${cls}-wrapper-checked`]: mergedChecked.value,
          [`${cls}-wrapper-disabled`]: mergedDisabled.value,
        },
        context.className,
        props.className,
        mergedClassNames.value.root,
        props.rootClassName,
      ];

      const checkboxClass = [
        cls,
        mergedClassNames.value.icon,
        {
          [`${cls}-indeterminate`]: props.indeterminate,
        },
        WAVE_TARGET_CLS,
        {
          [`${cls}-checked`]: mergedChecked.value,
          [`${cls}-disabled`]: mergedDisabled.value,
        },
      ];

      // rc-checkbox 语义：除「被 antd 消费的字段」外的 attrs 全部落 input
      const {
        class: attrClass,
        style: attrStyle,
        ...inputAttrs
      } = attrs as Record<string, unknown>;

      const labelValue = slots.default?.() as VNodeChild;

      return h(
        'label',
        {
          class: classString,
          style: mergedStyles.value.root,
          onMouseenter: callbacks.onMouseEnter,
          onMouseleave: callbacks.onMouseLeave,
          onClick: onLabelClick,
        },
        [
          h(
            'span',
            {
              class: checkboxClass,
              title: props.title,
              style: mergedStyles.value.icon,
              ref: holderRef,
            },
            [
              h('input', {
                ...inputAttrs,
                class: `${cls}-input`,
                type: 'checkbox',
                ref: inputRef,
                name: !props.skipGroup && checkboxGroup ? checkboxGroup.name : props.name,
                checked: mergedChecked.value,
                disabled: mergedDisabled.value,
                onClick: onInputClick,
                onChange: onInternalChange,
              }),
            ],
          ),
          isRenderable(labelValue)
            ? h(
                'span',
                {
                  class: [`${cls}-label`, mergedClassNames.value.label],
                  style: mergedStyles.value.label,
                },
                [labelValue],
              )
            : null,
        ],
      );
    };
  },
});

export const Checkbox = CheckboxComponent;
export default Checkbox;
