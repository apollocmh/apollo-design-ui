/**
 * Radio —— 单选框。
 *
 * 契约来源：antd 6.6.4 的 `es/radio/radio.js`（源码 `components/radio/radio.tsx`，
 * 143 行）+ `@rc-component/checkbox@2.0.0` 的 DOM 分配。判据逐条对齐 G1 分析
 * （`docs/analysis/radio.md`）。
 *
 * ── 七条最容易写错的判据 ─────────────────────────────────────────────────────
 *
 * 1. **checked 两个来源**：Group 内 ⇒ `props.value === groupContext.value`
 *    （**相等比较**，不是 checkbox 的 `includes`）；Group 外 ⇒ 受控 `checked` /
 *    非受控 `defaultChecked`（rc-checkbox 的 `useControlledState` 语义）。
 * 2. **disabled 三级合并**：`props.disabled ?? group.disabled ?? DisabledContext`
 *    —— `??` 判据让显式 `false` 能关闭（上游 radio.test 的
 *    「should use own disabled status first」）。
 * 3. **`optionType` 在 Radio 上是无效 prop**：出现即发 usage 告警；组内是经
 *    `RadioOptionTypeContext` 生效的。
 * 4. **DOM 分配**：`title` 落 **label**（⚠️ 与 checkbox 不同 —— checkbox 落 span，
 *    上游 issue 46739 的修复点）；`id/name/required/tabIndex/autofocus/value/type`
 *    与 focus/blur/key 事件落 **input**；`onMouseEnter/onMouseLeave` 落 **label**；
 *    语义 `styles.root` 落 label、`styles.icon` 落 span、`styles.label` 落文案 span。
 * 5. **类名三段**：label = `-wrapper` + 状态类（checked/disabled/rtl/block）+
 *    context + className + rootClassName + 语义 root；
 *    span = `-{cls}` + 语义 icon + `ant-wave-target`（**仅非 button 形态**）+
 *    `-checked` + `-disabled`；input = `-input`。
 * 6. **button 形态换整段前缀**：`prefixCls = ${radioPrefixCls}-button`
 *    ⇒ label/span/input/label-span 四层的类名全部换前缀。
 * 7. **事件冒泡锁**：复用 checkbox 的 `useBubbleLock`（label click 设 raf 锁，
 *    锁期内 input click 被 stopPropagation）—— 上游 radio.test 的
 *    「event bubble should not trigger twice」。
 */

import { isRenderable, useControlledValue, useDevWarning } from '@apollo-design/utils';
import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  type PropType,
  shallowRef,
  type VNodeChild,
  watchEffect,
} from 'vue';
import {
  mergeClassNames,
  mergeStyles,
  resolveSemantic,
  styleAttrs,
} from '../_internal/use-merge-semantic';
import { useBubbleLock } from '../checkbox/use-bubble-lock';
import { useComponentConfig } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { useRadioGroup, useRadioOptionType } from './context';
import type {
  RadioChangeEvent,
  RadioProps,
  RadioRef,
  RadioSemanticClassNames,
  RadioSemanticStyles,
} from './interface';

/** antd Wave 的 `TARGET_CLS` 是固定常量（不随 prefixCls 变），SSR 产物里就有它。 */
export const WAVE_TARGET_CLS = 'ant-wave-target';

/**
 * Radio 的 props 定义 —— `Radio` 与 `RadioButton` **共用同一份**。
 *
 * 为什么共用：antd 的 `RadioButton` 是 `Radio` 的薄包装（只多 provide 一个
 * `optionType='button'` 并强制 `type='radio'`），运行时的 `{...radioProps}` 转发
 * 会把 `classNames` / `styles` 一并带过去。共用一份保证「RadioButton 能接受的东西
 * 与 Radio 完全一致」，不会出现两处 prop 表漂移。
 *
 * ⚠️ `RadioButtonProps`（antd 的类型）比这窄（= `AbstractCheckboxProps`，不含
 * `classNames` / `styles` / `optionType`）—— 那是**类型**的差异，不是行为差异，
 * 登记为 INTENDED（见 README §2）。
 */
export const radioPropDefs = {
  prefixCls: { type: String, default: undefined },
  defaultChecked: { type: Boolean, default: false },
  checked: { type: Boolean, default: undefined },
  disabled: { type: Boolean, default: undefined },
  title: { type: String, default: undefined },
  // ⚠️ 不能写 PropType<unknown>：vue-tsc 会把它推断成 undefined（SFC 模板与 h()
  //    全线误报「not assignable to undefined」，PITFALLS 137）。antd 的 value 语义上
  //    是原始值选项 ⇒ 收窄为 string|number|boolean（Group 侧已用 VNodeProps 放行）。
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
  skipGroup: { type: Boolean, default: false },
  /** ⚠️ 无效 prop：出现即 usage 告警（见文件头判据 3）。 */
  optionType: { type: String as PropType<RadioProps['optionType']>, default: undefined },
  classNames: {
    type: [Object, Function] as PropType<RadioProps['classNames']>,
    default: undefined,
  },
  styles: { type: [Object, Function] as PropType<RadioProps['styles']>, default: undefined },
};

export const RadioComponent = defineComponent({
  name: 'ARadio',
  inheritAttrs: false,
  props: radioPropDefs,
  /**
   * ⚠️ 只声明 `update:checked`（供 `v-model:checked`），**不**声明 `change` ——
   * antd 的 `onChange` 是 props 形态回调，声明成 emits 会被 Vue 从 attrs 摘掉
   * （PITFALLS 35）。两者同时发出（COMPATIBILITY.md 规则 C11）。
   */
  emits: ['update:checked'],
  // ⚠️ onChange/onClick/onFocus/onBlur/… 是 antd 的 props 形态回调 —— 走 attrs
  //    （PITFALLS 35：Vue 里声明 emits 会把它们从 attrs 摘掉）。
  setup(props, { attrs, emit, expose, slots }) {
    const callbacks = attrs as unknown as Pick<
      RadioProps,
      'onChange' | 'onClick' | 'onMouseEnter' | 'onMouseLeave'
    >;

    const context = useComponentConfig('radio');
    const { getPrefixCls, direction } = context;
    const groupContext = useRadioGroup();
    const optionTypeContext = useRadioOptionType();
    const contextDisabled = useDisabled();
    const devWarning = useDevWarning('Radio');

    // ============================ Warning ==============================
    // antd：`warning(!('optionType' in props), 'usage', …)`。
    // ⚠️ Vue 的 props 恒含全部声明键 ⇒ 判据必须是 `!== undefined`（PITFALLS 13）。
    watchEffect(() => {
      devWarning(props.optionType === undefined, '`optionType` is only support in Radio.Group.');
    });

    // ============================= Prefix ==============================
    const radioPrefixCls = computed(() => getPrefixCls('radio', props.prefixCls));
    const isButtonType = computed(
      () => (groupContext?.optionType || optionTypeContext) === 'button',
    );
    /** button 形态换整段前缀（判据 6）。 */
    const prefixCls = computed(() =>
      isButtonType.value ? `${radioPrefixCls.value}-button` : radioPrefixCls.value,
    );

    // ============================= Disabled =============================
    const mergedDisabled = computed<boolean>(
      () => props.disabled ?? groupContext?.disabled ?? contextDisabled.value,
    );

    // ============================== Checked =============================
    const [innerChecked, setInnerChecked] = useControlledValue<boolean>({
      defaultValue: () => props.defaultChecked,
      getValue: () => props.checked,
    });

    /**
     * antd 的 `mergedChecked` —— **只**由 `checked` prop 或 Group 的值决定。
     *
     * ⚠️ 它**不含**非受控的内部态。后果（上游实测，`tests/compat/baselines/radio.dom.json`）：
     *    `<Radio defaultChecked />` 时 **span 有 `-checked`、wrapper 没有 `-wrapper-checked`**
     *    —— 因为 wrapper 的类名读的是 `mergedChecked`（这里是 `undefined`），
     *    而 span / input 读的是 rc-checkbox 的内部态。
     *    这是上游的不一致（非受控态下 wrapper 类名不跟随），**逐字保留**，
     *    登记在 `COMPATIBILITY.md` §9.2.1 的 U9（有意不复刻「修正」）。
     */
    const mergedChecked = computed<boolean | undefined>(() => {
      if (groupContext) {
        return props.value === groupContext.value;
      }
      return props.checked;
    });

    /** 真正生效的选中态 —— 用于 span 的 `-checked` 与 input 的 `checked`。 */
    const effectiveChecked = computed<boolean>(() => {
      if (groupContext) {
        return props.value === groupContext.value;
      }
      return innerChecked.value;
    });

    // ============================== Events =============================
    const onInternalChange = (event: Event) => {
      const inputEl = event.target as HTMLInputElement;
      const nextChecked = inputEl.checked;
      // 组内由 Group 的 value 驱动（radioProps.checked 恒为受控），不写内部态
      if (!groupContext) {
        setInnerChecked(nextChecked);
      }
      // v-model:checked 通道（规则 C11：与语义事件同时发出）
      emit('update:checked', nextChecked);
      const radioEvent: RadioChangeEvent = {
        target: {
          ...(props as unknown as Record<string, unknown>),
          type: 'radio',
          checked: nextChecked,
        },
        stopPropagation: () => event.stopPropagation(),
        preventDefault: () => event.preventDefault(),
        nativeEvent: event,
      };
      callbacks.onChange?.(radioEvent);
      groupContext?.onChange?.(radioEvent);
    };

    // ============================ Semantic ==============================
    const semanticProps = computed<RadioProps>(
      () =>
        ({
          ...props,
          disabled: mergedDisabled.value,
          checked: mergedChecked.value,
        }) as RadioProps,
    );
    const info = computed(() => ({ props: semanticProps.value }));
    const mergedClassNames = computed(() =>
      mergeClassNames<RadioSemanticClassNames>(
        resolveSemantic<RadioSemanticClassNames, RadioProps>(props.classNames as never, info.value),
      ),
    );
    const mergedStyles = computed(() =>
      mergeStyles<RadioSemanticStyles>(
        resolveSemantic<RadioSemanticStyles, RadioProps>(props.styles as never, info.value),
      ),
    );

    // ============================ Event Lock ============================
    const { onLabelClick, onInputClick } = useBubbleLock(callbacks.onClick);

    // ============================== Refs ===============================
    const inputRef = shallowRef<HTMLInputElement | null>(null);
    const holderRef = shallowRef<HTMLElement | null>(null);

    expose({
      focus: (options?: FocusOptions) => inputRef.value?.focus(options),
      blur: () => inputRef.value?.blur(),
      get input() {
        return inputRef.value;
      },
      get nativeElement() {
        return holderRef.value;
      },
    } satisfies RadioRef);

    return () => {
      const cls = prefixCls.value;

      const wrapperClassString = [
        `${cls}-wrapper`,
        {
          [`${cls}-wrapper-checked`]: mergedChecked.value,
          [`${cls}-wrapper-disabled`]: mergedDisabled.value,
          [`${cls}-wrapper-rtl`]: direction === 'rtl',
          // `-wrapper-in-form-item` 依赖 form 未落地 ⇒ 恒 false（PLATFORM）
          [`${cls}-wrapper-block`]: !!groupContext?.block,
        },
        context.className,
        // 调用方原生 `class`（位置与原先的 props.className/rootClassName 一致）
        attrs.class,
        mergedClassNames.value.root,
      ];

      const radioClassString = [
        cls,
        mergedClassNames.value.icon,
        // ⚠️ button 形态无波纹 ⇒ 只有非 button 才加 `ant-wave-target`
        { [WAVE_TARGET_CLS]: !isButtonType.value },
        {
          [`${cls}-checked`]: effectiveChecked.value,
          [`${cls}-disabled`]: mergedDisabled.value,
        },
      ];

      // rc-checkbox 语义：除「被 antd 消费的字段」外的 attrs 全部落 input
      const {
        class: _attrClass,
        style: _attrStyle,
        ...inputAttrs
      } = attrs as Record<string, unknown>;

      const labelValue = slots.default?.() as VNodeChild;

      return h(
        'label',
        {
          class: wrapperClassString,
          // 根 `style` 是 Vue 原生 attrs（`_attrStyle` 已从 inputAttrs 里摘出）
          ...styleAttrs({
            ...mergedStyles.value.root,
            ...((_attrStyle as CSSProperties | undefined) ?? {}),
          }),
          title: props.title,
          onMouseenter: callbacks.onMouseEnter,
          onMouseleave: callbacks.onMouseLeave,
          onClick: onLabelClick,
        },
        [
          h(
            'span',
            {
              class: radioClassString,
              ...styleAttrs(mergedStyles.value.icon),
              ref: holderRef,
            },
            [
              h('input', {
                ...inputAttrs,
                class: `${cls}-input`,
                // ⚠️ 上游 radio.test「Radio type should not be override」：恒为 radio
                type: 'radio',
                ref: inputRef,
                name: groupContext ? groupContext.name : props.name,
                value: props.value,
                checked: effectiveChecked.value,
                disabled: mergedDisabled.value,
                id: props.id,
                required: props.required,
                tabIndex: props.tabIndex,
                autofocus: props.autoFocus,
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
                  ...styleAttrs(mergedStyles.value.label),
                },
                [labelValue],
              )
            : null,
        ],
      );
    };
  },
});

export const Radio = RadioComponent;
export default Radio;
