/**
 * CheckboxGroup —— 复选框组。
 *
 * 契约来源：antd 6.6.4 的 `es/checkbox/Group.js`（判据逐条对齐，G1 分析 §2）。
 *
 * ── 五条最容易写错的判据 ─────────────────────────────────────────────────────
 *
 * 1. **value 受控/非受控**：`useControlledValue(defaultValue || [], value)`；
 *    `mergedValue = value || []`（value=undefined 时回退 defaultValue/内部态）。
 * 2. **onChange 的值**：`newValue.filter(在注册表中).sort(按 options 顺序)` ——
 *    「过滤已移除的值 + 保持顺序」两条都要（上游 issue 16376 / 17297）。
 * 3. **options 归一化**：string/number ⇒ `{label, value}`；过滤 null/undefined value。
 * 4. **disabled 优先级**：`'disabled' in option` 时 option 优先，否则整组 disabled。
 * 5. **domProps**：`omit(restProps, ['value','disabled'])` —— 这两个不落根 div。
 */

import { isNonNullable, isNumber, isString, useControlledValue } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  type PropType,
  reactive,
  shallowRef,
  type VNodeChild,
  type VNodeProps,
} from 'vue';
import { useComponentConfig } from '../config-provider/context';
import { CheckboxComponent } from './Checkbox';
import { provideGroupContext } from './context';
import type { CheckboxGroupProps, CheckboxOptionType, CheckboxProps } from './interface';

interface GroupContextValue {
  toggleOption: (option: { label: VNodeChild; value: unknown }) => void;
  value: unknown[];
  disabled?: boolean;
  name?: string;
  registerValue: (val: unknown) => void;
  cancelValue: (val: unknown) => void;
}

export const GroupComponent = defineComponent({
  name: 'ACheckboxGroup',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    className: { type: String, default: undefined },
    rootClassName: { type: String, default: undefined },
    options: {
      type: Array as PropType<CheckboxGroupProps['options']>,
      default: () => [],
    },
    disabled: { type: Boolean, default: undefined },
    style: { type: Object as PropType<CheckboxGroupProps['style']>, default: undefined },
    name: { type: String, default: undefined },
    defaultValue: {
      type: Array as PropType<CheckboxGroupProps['defaultValue']>,
      default: undefined,
    },
    value: { type: Array as PropType<CheckboxGroupProps['value']>, default: undefined },
    role: { type: String, default: 'group' },
  },
  /**
   * ⚠️ 只声明 `update:value`（供 `v-model:value`），**不**声明 `change` ——
   * antd 的 `onChange` 是 props 形态回调，声明成 emits 会被 Vue 从 attrs 摘掉
   * （PITFALLS 35）。两者同时发出（COMPATIBILITY.md 规则 C11，radio Group 同款）。
   */
  emits: ['update:value'],
  // onChange 走 attrs（props 形态回调）
  setup(props, { attrs, emit, expose, slots }) {
    const callbacks = attrs as unknown as {
      onChange?: (checkedValue: unknown[]) => void;
    };
    const context = useComponentConfig('checkbox');
    const { getPrefixCls, direction } = context;
    const rootRef = shallowRef<HTMLDivElement | null>(null);

    // ============================== Value ===============================
    const [innerValue, setInnerValue] = useControlledValue<unknown[]>({
      defaultValue: () => props.defaultValue ?? [],
      getValue: () => props.value,
    });
    const mergedValue = computed<unknown[]>(() => innerValue.value ?? []);

    // ========================= Registered values ========================
    let registeredValues: unknown[] = [];
    const registerValue = (val: unknown) => {
      registeredValues = [...registeredValues, val];
    };
    const cancelValue = (val: unknown) => {
      registeredValues = registeredValues.filter((v) => v !== val);
    };

    // ============================== Options =============================
    const memoizedOptions = computed<CheckboxOptionType<unknown>[]>(() =>
      (props.options ?? [])
        .map((option) => {
          if (isString(option) || isNumber(option)) {
            return { label: option as VNodeChild, value: option };
          }
          return option as CheckboxOptionType<unknown>;
        })
        .filter((item) => isNonNullable(item) && isNonNullable(item.value)),
    );

    // ============================ toggleOption ==========================
    const toggleOption = (option: { label: VNodeChild; value: unknown }) => {
      const optionIndex = mergedValue.value.indexOf(option.value);
      const newValue = [...mergedValue.value];
      if (optionIndex === -1) {
        newValue.push(option.value);
      } else {
        newValue.splice(optionIndex, 1);
      }
      setInnerValue(newValue);
      // ⚠️ 排序依据：options 里的顺序优先；options 空或值不在 options 里时退化为
      //    **注册顺序**。antd 的比较器在空 options 时恒 0（稳定排序保持插入序
      //    [2,1]），但上游测试（issue 17297）期望 [1,2] —— 以测试期望为契约。
      const orderIndex = (val: unknown): number => {
        if (memoizedOptions.value.length > 0) {
          const i = memoizedOptions.value.findIndex((opt) => opt.value === val);
          if (i !== -1) return i;
        }
        const r = registeredValues.indexOf(val);
        return r === -1 ? Number.MAX_SAFE_INTEGER : r;
      };
      const nextValue = newValue
        .filter((val) => registeredValues.includes(val))
        .sort((a, b) => orderIndex(a) - orderIndex(b));
      // v-model:value 通道（规则 C11：与语义事件同时发出，载荷同 onChange）
      emit('update:value', nextValue);
      callbacks.onChange?.(nextValue);
    };

    // ⚠️ 必须 reactive（自动解包 ref/computed）：子 Checkbox 的
    //    `group.value.includes(props.value)` 要**随受控 value 更新**——
    //    提供快照会让受控用例红（受控 value 用例实测抓到）。
    provideGroupContext(
      reactive({
        toggleOption,
        value: mergedValue,
        disabled: computed(() => props.disabled),
        name: computed(() => props.name),
        registerValue,
        cancelValue,
      }) as unknown as GroupContextValue,
    );

    expose({
      get nativeElement() {
        return rootRef.value;
      },
    });

    const prefixCls = computed(() => getPrefixCls('checkbox', props.prefixCls));

    return () => {
      const groupPrefixCls = `${prefixCls.value}-group`;

      // ⚠️ antd 把 onChange 解构出 restProps —— 不然 domProps 会把它绑到根 div 的
      //    原生 change 上（change 冒泡 ⇒ onChange 被多调一次，debug 实测抓到）。
      //    ⚠️ attrs 是 readonly proxy —— 不能 delete，只能在渲染时解构排除。
      const {
        value: _value,
        disabled: _disabled,
        onChange: _onChange,
        ...restAttrs
      } = attrs as Record<string, unknown>;
      const domProps = restAttrs;

      const childrenNode =
        memoizedOptions.value.length > 0
          ? memoizedOptions.value.map((option) =>
              h(
                // ⚠️ Vue 的 props 推断对「跨组件 h + 联合 prop 类型」会产生链式误报
                //    （boolean|undefined → boolean 等）—— 契约正确性由 L4/L1 兜底，
                //    这里统一按 VNodeProps 放行（statistic → Skeleton 同场景）。
                CheckboxComponent as unknown as (
                  props: Omit<CheckboxProps, 'value'> & {
                    value?: unknown;
                  } & VNodeProps,
                ) => ReturnType<typeof h>,
                {
                  key: String(option.value),
                  prefixCls: prefixCls.value,
                  disabled: option && 'disabled' in option ? option.disabled : props.disabled,
                  value: option.value,
                  checked: mergedValue.value.includes(option.value),
                  onChange: option.onChange,
                  className: `${groupPrefixCls}-item${option.className ? ` ${option.className}` : ''}`,
                  style: option.style,
                  title: option.title,
                  id: option.id,
                  required: option.required,
                },
                { default: () => option.label },
              ),
            )
          : (slots.default?.() as VNodeChild);

      const classString = [
        groupPrefixCls,
        {
          [`${groupPrefixCls}-rtl`]: direction === 'rtl',
        },
        props.className,
        props.rootClassName,
      ];

      return h(
        'div',
        {
          ...domProps,
          // ⚠️ antd 的 name 保留在 restProps ⇒ 既进 GroupContext 也落根 div
          //    （上游快照 group:name 钉住这个双写）
          name: props.name,
          class: classString,
          style: props.style,
          role: props.role,
          ref: rootRef,
        },
        [childrenNode as VNodeChild],
      );
    };
  },
});

/** 兼容类型引用（避免 props 类型仅被类型层消费时的告警）。 */
export type { CheckboxGroupProps, CheckboxProps };

export const Group = GroupComponent;
export default Group;
