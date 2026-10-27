<script setup lang="ts" generic="T extends CheckableTagValue = CheckableTagValue, M extends boolean = false">
import { isEmptyVNode, useControlledValue } from '@apollo-design/utils';
import { computed, mergeProps, shallowRef, useAttrs } from 'vue';
import { NodeRenderer as NodeContent } from '../_internal/node-renderer';
import { styleAttrs } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import CheckableTag from './CheckableTag';
import { initialGroupValue, nextGroupValue, selectedValues } from './group-value';
import { useTagTheme } from './hooks/use-theme';
import type {
  CheckableTagGroupEmits,
  CheckableTagGroupProps,
  CheckableTagGroupValue,
  CheckableTagOption,
  CheckableTagValue,
  TagConfig,
} from './interface';

defineOptions({ name: 'ACheckableTagGroup', inheritAttrs: false });
const props = withDefaults(
  defineProps<CheckableTagGroupProps<T, M> & { multiple?: M & boolean }>(),
  { disabled: undefined },
);
const emit = defineEmits<CheckableTagGroupEmits<T, M>>();
const attrs = useAttrs();
const context = useComponentConfig<TagConfig>('tag'),
  direction = useDirection();
const prefix = computed(() => context.getPrefixCls('tag', props.prefixCls));
const groupPrefix = computed(() => `${prefix.value}-checkable-group`);
const disabled = useDisabled(() => props.disabled),
  themeStyle = useTagTheme(() => prefix.value);
const root = shallowRef<HTMLDivElement | null>(null);
defineExpose({ nativeElement: root });
const [value, setValue] = useControlledValue<CheckableTagGroupValue<T, M>>({
  defaultValue: initialGroupValue<T, M>(props.multiple, props.defaultValue),
  getValue: () => props.value,
  onChange: (next) => {
    emit('update:value', next);
    emit('change', next);
  },
});
const selected = computed(() => selectedValues<T>(value.value));
const parsedOptions = computed<CheckableTagOption<T>[]>(() =>
  (props.options ?? []).map((option) =>
    typeof option === 'object' && option !== null
      ? { ...option, label: option.label === undefined ? option.value : option.label }
      : { value: option, label: option },
  ),
);
const isChecked = (option: T) =>
  props.multiple ? selected.value.includes(option) : selected.value[0] === option;
const change = (checked: boolean, option: T) =>
  setValue(nextGroupValue<T, M>(props.multiple, value.value, option, checked));
const rootAttrs = () =>
  mergeProps(
    {
      class: [
        groupPrefix.value,
        context.className,
        props.classNames?.root,
        {
          [`${groupPrefix.value}-disabled`]: disabled.value,
          [`${groupPrefix.value}-rtl`]: (attrs.dir ?? direction.value) === 'rtl',
        },
      ],
      ...styleAttrs({ ...themeStyle.value, ...context.style, ...props.styles?.root }),
    },
    attrs,
    {
      id: props.id,
      dir: attrs.dir ?? direction.value,
      role: 'group',
      'aria-disabled': disabled.value || undefined,
    },
  );
</script>
<template>
  <div ref="root" v-bind="rootAttrs()">
    <CheckableTag
      v-for="option in parsedOptions" :key="option.value"
      :prefix-cls="prefix"
      :class="[`${groupPrefix}-item`,props.classNames?.item,option.className]"
      :style="[props.styles?.item,option.style]"
      :checked="isChecked(option.value)"
      :disabled="disabled"
      :aria-label="isEmptyVNode(option.label) ? String(option.value) : undefined"
      @change="change($event,option.value)"
    ><NodeContent :node="option.label" /></CheckableTag>
  </div>
</template>
