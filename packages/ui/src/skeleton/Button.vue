<script setup lang="ts">
import { useSize } from '../config-provider/size-context';
import Element from './Element.vue';
import type { SkeletonButtonProps } from './interface';
import { useSkeletonRoot } from './use-skeleton-root';

defineOptions({ name: 'ASkeletonButton', inheritAttrs: false });
const props = withDefaults(defineProps<SkeletonButtonProps>(), {
  prefixCls: undefined,
  size: undefined,
  shape: undefined,
  block: false,
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
      :prefix-cls="`${prefixCls}-button`"
      :class-name="props.classNames?.content"
      :style="props.styles?.content"
      :shape="props.shape"
      :size="mergedSize"
    />
  </div>
</template>
