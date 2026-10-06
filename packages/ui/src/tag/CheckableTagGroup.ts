/**
 * CheckableTagGroup —— 可勾选标签组。
 *
 * 契约来源：antd 6.6.4 的 `es/tag/CheckableTagGroup.js`（判据逐条对齐）。
 *
 * 三条最容易写错的判据：
 *   1. **multiple 的值语义**：数组增删；单选是「值或 null」（再点已选项取消）。
 *   2. **options 归一**：原始值 → `{ value, label }`（antd 的 isPlainObject 分支）。
 *   3. **aria/data 透传**走 pickAttrs（id/class 等不上 DOM —— 与 antd 一致）。
 */

import { pickAttrs, useControlledValue } from '@apollo-design/utils';
import { computed, defineComponent, h, type PropType, shallowRef } from 'vue';
import { useComponentConfig } from '../config-provider/context';
import CheckableTag from './CheckableTag';
import type {
  CheckableTagGroupProps,
  CheckableTagOption,
  TagSemanticClassNames,
  TagSemanticStyles,
} from './interface';

/** Group 的语义槽位与 Tag 不同：root + item（antd 的 GroupSemanticType）。 */
export interface GroupSemanticClassNames extends TagSemanticClassNames {
  item?: string;
}
export interface GroupSemanticStyles extends TagSemanticStyles {
  item?: Record<string, string | number>;
}

export default defineComponent({
  name: 'ACheckableTagGroup',
  inheritAttrs: false,
  props: {
    id: { type: String, default: undefined },
    prefixCls: { type: String, default: undefined },
    disabled: { type: Boolean, default: undefined },
    multiple: { type: Boolean, default: undefined },
    options: {
      type: Array as PropType<CheckableTagGroupProps['options']>,
      default: undefined,
    },
    value: {
      type: [String, Number, Array] as PropType<CheckableTagGroupProps['value']>,
      default: undefined,
    },
    defaultValue: {
      type: [String, Number, Array] as PropType<CheckableTagGroupProps['defaultValue']>,
      default: undefined,
    },
    onChange: {
      type: Function as PropType<CheckableTagGroupProps['onChange']>,
      default: undefined,
    },
    classNames: { type: Object as PropType<GroupSemanticClassNames>, default: undefined },
    styles: { type: Object as PropType<GroupSemanticStyles>, default: undefined },
  },
  setup(props, { attrs, expose }) {
    const { getPrefixCls, direction, className: contextClassName } = useComponentConfig('tag');

    const divRef = shallowRef<HTMLDivElement | null>(null);
    expose({ nativeElement: divRef });

    const prefixCls = computed(() => getPrefixCls('tag', props.prefixCls));
    const groupPrefixCls = computed(() => `${prefixCls.value}-checkable-group`);

    // ---- options 归一（antd 逐字：非对象 → { value, label }）----
    const parsedOptions = computed<CheckableTagOption[]>(() => {
      if (!Array.isArray(props.options)) {
        return [];
      }
      return props.options.map((option) =>
        typeof option === 'object' && option !== null
          ? (option as CheckableTagOption)
          : { value: option as string | number, label: option as string | number },
      );
    });

    // ---- 受控/非受控值（utils 的 useControlledValue，契约同 useControlledState）----
    const [mergedValue, setMergedValue] = useControlledValue<
      string | number | (string | number)[] | null
    >({
      defaultValue: props.defaultValue ?? null,
      getValue: () => props.value,
      onChange: (next) => props.onChange?.(next),
    });

    const isChecked = (value: string | number): boolean => {
      if (props.multiple) {
        return ((mergedValue.value as (string | number)[] | null) ?? []).includes(value);
      }
      return mergedValue.value === value;
    };

    const handleChange = (checked: boolean, option: CheckableTagOption) => {
      let newValue: string | number | (string | number)[] | null = null;
      if (props.multiple) {
        const valueList = (mergedValue.value as (string | number)[] | null) ?? [];
        newValue = checked
          ? [...valueList, option.value]
          : valueList.filter((item) => item !== option.value);
      } else {
        newValue = checked ? option.value : null;
      }
      setMergedValue(newValue);
      props.onChange?.(newValue);
    };

    return () => {
      const groupCls = [
        groupPrefixCls.value,
        contextClassName,
        {
          [`${groupPrefixCls.value}-disabled`]: props.disabled,
          [`${groupPrefixCls.value}-rtl`]: direction === 'rtl',
        },
        // 调用方原生 `class`（位置与原先的 props.className/rootClassName 一致）
        attrs.class,
        props.classNames?.root,
      ];

      const ariaProps = pickAttrs(attrs, { aria: true, data: true });

      return h(
        'div',
        {
          ...ariaProps,
          class: groupCls,
          // 根 `style` 是 Vue 原生 attrs（位置与原先的 props.style 一致）
          style: props.styles?.root ?? (attrs.style as Record<string, string | number> | undefined),
          id: props.id,
          ref: divRef,
        },
        parsedOptions.value.map((option) =>
          h(
            CheckableTag,
            {
              key: option.value,
              class: [`${groupPrefixCls.value}-item`, props.classNames?.item, option.className],
              style: { ...props.styles?.item, ...option.style },
              checked: isChecked(option.value),
              onChange: (checked: boolean) => handleChange(checked, option),
              disabled: props.disabled,
            },
            { default: () => option.label },
          ),
        ),
      );
    };
  },
});
