<script setup lang="ts">
import { useSize } from '../config-provider/size-context';
import Element from './Element.vue';
import type { SkeletonAvatarOwnProps } from './interface';
import { useSkeletonRoot } from './use-skeleton-root';

defineOptions({ name: 'ASkeletonAvatar', inheritAttrs: false });
const props = withDefaults(defineProps<SkeletonAvatarOwnProps>(), {
  prefixCls: undefined,
  size: undefined,
  shape: 'circle',
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
      :prefix-cls="`${prefixCls}-avatar`"
      :class-name="props.classNames?.content"
      :style="props.styles?.content"
      :shape="props.shape"
      :size="mergedSize"
    />
  </div>
</template>
