<script setup lang="ts">
import { styleAttrs } from '../_internal/use-merge-semantic';
import type { SkeletonNodeProps, SkeletonNodeSlot } from './interface';
import { useSkeletonRoot } from './use-skeleton-root';

defineOptions({ name: 'ASkeletonNode', inheritAttrs: false });
const props = withDefaults(defineProps<SkeletonNodeProps>(), {
  prefixCls: undefined,
  active: undefined,
  classNames: undefined,
  styles: undefined,
  internalClassName: undefined,
});
defineSlots<{ default?: SkeletonNodeSlot }>();
const { prefixCls, rootAttrs } = useSkeletonRoot(props);
</script>
<template>
  <div v-bind="rootAttrs()">
    <div :class="[props.classNames?.content, props.internalClassName || `${prefixCls}-node`]" v-bind="styleAttrs(props.styles?.content)">
      <slot />
    </div>
  </div>
</template>
