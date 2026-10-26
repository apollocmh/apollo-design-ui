<script setup lang="ts">
import { useSize } from '../config-provider/size-context';
import Element from './Element.vue';
import type { SkeletonInputProps } from './interface';
import { useSkeletonRoot } from './use-skeleton-root';

defineOptions({ name: 'ASkeletonInput', inheritAttrs: false });
const props = withDefaults(defineProps<SkeletonInputProps>(), {
  prefixCls: undefined,
  size: undefined,
  block: undefined,
  active: undefined,
  classNames: undefined,
  styles: undefined,
});
const { prefixCls, rootAttrs } = useSkeletonRoot(props);
const mergedSize = useSize((size) => props.size ?? size);
</script>
<template>
  <div v-bind="rootAttrs()">
    <Element
      :prefix-cls="`${prefixCls}-input`"
      :class-name="props.classNames?.content"
      :style="props.styles?.content"
      :size="mergedSize"
    />
  </div>
</template>
