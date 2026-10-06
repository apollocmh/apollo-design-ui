/**
 * RadioGroup —— 单选框组。
 *
 * 契约来源：antd 6.6.4 的 `es/radio/group.js`（源码 `components/radio/group.tsx`，
 * 180 行）。判据逐条对齐 G1 分析（`docs/analysis/radio.md`）。
 *
 * ── 六条最容易写错的判据 ─────────────────────────────────────────────────────
 *
 * 1. **value 是标量不是数组**（与 checkbox 组的关键差异）：`useControlledState`
 *    单值；选中判据是子 Radio 侧的 `props.value === groupContext.value`。
 * 2. **`onChange` 只在值真的变了才触发**：`if (val !== lastValue)` ——
 *    点已选中的项**不发事件**（上游 group.test「won't fire change events when
 *    value not changes」）。⚠️ 与 checkbox 组的「点同一项会 toggle」正相反。
 * 3. **`name` 有默认值**：`useId(toNamePathStr(formItemName))`。form 未落地 ⇒
 *    formItemName 恒 undefined ⇒ `toNamePathStr` 得空串 ⇒ 走 `useId()` 生成。
 *    即**每个 Group 的每个子 input 都带同一个自动 name**（原生 radio 分组语义）。
 * 4. **options 优先于 children**：`options && options.length > 0` 时渲染 options，
 *    否则渲染 `default` 插槽。⚠️ options 渲染出的 Radio **没有** `-group-item` 类
 *    （checkbox 有、radio 没有 —— 上游差异，实测产物确认）。
 * 5. **`orientation` / `vertical` 合并后只落一个 `-group-vertical` 类**，且
 *    两者都**不透传**到根 div（解构排除）。
 * 6. **根 div 只收 aria-* / data-***：antd 的 `pickAttrs(props, {aria, data})`；
 *    `value` / `disabled` / `optionType` / `buttonStyle` / `size` / `vertical` /
 *    `orientation` 都不落 DOM。
 */

import { isNumber, isString, pickAttrs, useControlledValue, useId } from '@apollo-design/utils';
import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  type PropType,
  reactive,
  shallowRef,
  type VNodeChild,
  type VNodeProps,
} from 'vue';
import { styleAttrs } from '../_internal/use-merge-semantic';
import { useOrientation } from '../_internal/use-orientation';
import { useComponentConfig } from '../config-provider/context';
import { useSize } from '../config-provider/size-context';
import { provideRadioGroupContext } from './context';
import type {
  RadioChangeEvent,
  RadioGroupContextValue,
  RadioGroupProps,
  RadioOptionItem,
  RadioValue,
} from './interface';
import { RadioComponent } from './Radio';

export const GroupComponent = defineComponent({
  name: 'ARadioGroup',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    options: {
      type: Array as PropType<RadioGroupProps['options']>,
      default: () => [],
    },
    disabled: { type: Boolean, default: undefined },
    name: { type: String, default: undefined },
    defaultValue: {
      type: [String, Number, Boolean] as PropType<RadioValue>,
      default: undefined,
    },
    value: { type: [String, Number, Boolean] as PropType<RadioValue>, default: undefined },
    size: { type: String as PropType<RadioGroupProps['size']>, default: undefined },
    id: { type: String, default: undefined },
    optionType: { type: String as PropType<RadioGroupProps['optionType']>, default: undefined },
    buttonStyle: { type: String as PropType<RadioGroupProps['buttonStyle']>, default: 'outline' },
    orientation: {
      type: String as PropType<RadioGroupProps['orientation']>,
      default: undefined,
    },
    // ⚠️ 必须是 undefined（不是 false）：`useOrientation` 的第二级判据是
    //    `typeof vertical === 'boolean'` —— 未传与显式 false 是两条不同分支
    //    （use-orientation.ts 文件头 + PITFALLS 46）。
    vertical: { type: Boolean, default: undefined },
    block: { type: Boolean, default: false },
    role: { type: String, default: 'radiogroup' },
  },
  /**
   * ⚠️ 只声明 `update:value`（供 `v-model:value`），**不**声明 `change` ——
   * antd 的 `onChange` 是 props 形态回调，声明成 emits 会被 Vue 从 attrs 摘掉
   * （PITFALLS 35）。两者同时发出（COMPATIBILITY.md 规则 C11）。
   */
  emits: ['update:value'],
  // onChange / onMouseEnter / onMouseLeave / onFocus / onBlur 走 attrs（PITFALLS 35）
  setup(props, { attrs, emit, expose, slots }) {
    const callbacks = attrs as unknown as Pick<
      RadioGroupProps,
      'onChange' | 'onMouseEnter' | 'onMouseLeave' | 'onFocus' | 'onBlur'
    >;

    const context = useComponentConfig('radio');
    const { getPrefixCls, direction } = context;
    const rootRef = shallowRef<HTMLDivElement | null>(null);

    // ============================== Name ===============================
    // antd：`useId(toNamePathStr(formItemName))`。form 未落地 ⇒ formItemName 恒
    // undefined ⇒ `toNamePathStr` 得空串 ⇒ useId 生成（判据 3）。
    const defaultName = useId();
    const mergedName = computed(() => props.name ?? defaultName);

    // ============================== Value ==============================
    const [innerValue, setInnerValue] = useControlledValue<RadioValue | undefined>({
      defaultValue: () => props.defaultValue,
      getValue: () => props.value,
    });

    const onRadioChange = (event: RadioChangeEvent) => {
      const lastValue = innerValue.value;
      const val = event.target.value as RadioValue;
      setInnerValue(val);
      // ⚠️ 只在值真的变了才发事件（判据 2）。`update:value` 与 `onChange` 同一判据
      //    —— 值没变时 v-model 也无需回写（COMPATIBILITY.md 规则 C11）。
      if (val !== lastValue) {
        emit('update:value', val);
        callbacks.onChange?.(event);
      }
    };

    // ============================== Options ============================
    const memoizedOptions = computed<RadioOptionItem[]>(() =>
      (props.options ?? []).map((option) =>
        isString(option) || isNumber(option)
          ? ({ label: option as VNodeChild, value: option } as RadioOptionItem)
          : (option as RadioOptionItem),
      ),
    );

    // ============================ Orientation ==========================
    const orientationPair = useOrientation(
      () => props.orientation,
      () => props.vertical,
      () => undefined,
    );
    const mergedVertical = computed(() => orientationPair.value[1]);

    // ============================== Size ===============================
    /**
     * antd 的 `useSize(customizeSize)` —— ConfigProvider 的 `componentSize` 已落地。
     *
     * ⚠️ 必须用**函数形态**：`useSize(props.size)` 只在 setup 期读一次 `props.size`，
     *    之后 props 变化不会重算（`size` 受控切换会静默失效）。skeleton 的
     *    Avatar/Button/Input 与 switch 同判。
     */
    const mergedSize = useSize((ctxSize) => props.size ?? ctxSize);

    // ============================ Provide ==============================
    // ⚠️ 必须 reactive（自动解包 ref/computed）：子 Radio 的
    //    `props.value === groupContext.value` 要**随受控 value 更新** ——
    //    提供快照会让受控用例红（checkbox 组实测抓到，PITFALLS 39）。
    provideRadioGroupContext(
      reactive({
        onChange: onRadioChange,
        value: innerValue,
        disabled: computed(() => props.disabled),
        name: mergedName,
        optionType: computed(() => props.optionType),
        block: computed(() => props.block),
      }) as unknown as RadioGroupContextValue,
    );

    expose({
      get nativeElement() {
        return rootRef.value;
      },
    });

    const prefixCls = computed(() => getPrefixCls('radio', props.prefixCls));

    return () => {
      const cls = prefixCls.value;
      const groupPrefixCls = `${cls}-group`;
      const currentValue = innerValue.value;

      const childrenToRender =
        memoizedOptions.value.length > 0
          ? memoizedOptions.value.map((option) => {
              // ⚠️ Vue 的 props 推断对「跨组件 h + 联合 prop 类型」会产生链式误报
              //    （PITFALLS 137 / checklist 19）。契约正确性由 L4/L1 兜底，
              //    这里统一按 VNodeProps 放行。
              const Radio = RadioComponent as unknown as (
                props: Record<string, unknown> & VNodeProps,
              ) => ReturnType<typeof h>;
              const isPrimitive = isString(option) || isNumber(option);
              return h(
                Radio,
                {
                  key: isPrimitive
                    ? String(option)
                    : `radio-group-value-options-${option.value as string}`,
                  prefixCls: cls,
                  // 原始值形态：整组 disabled 生效；对象形态：option 级优先
                  disabled: isPrimitive ? props.disabled : option.disabled || props.disabled,
                  value: option.value,
                  checked: currentValue === option.value,
                  title: isPrimitive ? undefined : option.title,
                  style: isPrimitive ? undefined : option.style,
                  // Radio 已迁移到「根 class 走原生 attrs」⇒ 这里必须用 `class`
                  class: isPrimitive ? undefined : option.className,
                  id: isPrimitive ? undefined : option.id,
                  required: isPrimitive ? undefined : option.required,
                  onChange: isPrimitive ? undefined : option.onChange,
                },
                { default: () => option.label },
              );
            })
          : (slots.default?.() as VNodeChild);

      const classString = [
        groupPrefixCls,
        `${groupPrefixCls}-${props.buttonStyle}`,
        {
          [`${groupPrefixCls}-large`]: mergedSize.value === 'large',
          [`${groupPrefixCls}-small`]: mergedSize.value === 'small',
          [`${groupPrefixCls}-rtl`]: direction === 'rtl',
          [`${groupPrefixCls}-block`]: props.block,
        },
        // 调用方原生 `class`（位置与原先的 props.className/rootClassName 一致）
        attrs.class,
        // ⚠️ antd 把它拼在 classString **之后**（`clsx(classString, {...})`）
        { [`${groupPrefixCls}-vertical`]: mergedVertical.value },
      ];

      return h(
        'div',
        {
          // antd 的 `pickAttrs(props, { aria: true, data: true })`（判据 6）
          ...pickAttrs(attrs as Record<string, unknown>, { aria: true, data: true }),
          role: props.role,
          class: classString,
          // 根 `style` 是 Vue 原生 attrs
          ...styleAttrs((attrs.style as CSSProperties | undefined) ?? {}),
          onMouseenter: callbacks.onMouseEnter,
          onMouseleave: callbacks.onMouseLeave,
          onFocus: callbacks.onFocus,
          onBlur: callbacks.onBlur,
          id: props.id,
          ref: rootRef,
        },
        [childrenToRender as VNodeChild],
      );
    };
  },
});

export const Group = GroupComponent;
export default Group;
