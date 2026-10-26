<script setup lang="ts">
import { useDevWarning } from '@apollo-design/utils';
import { type CSSProperties, computed, watchEffect } from 'vue';
import { styleAttrs } from '../_internal/use-merge-semantic';
import type { SkeletonElementSize, SkeletonShape } from './interface';
import { toCssLength } from './styleLength';

defineOptions({ name: 'ASkeletonElement', inheritAttrs: false });
// This private span receives explicit content configuration, never a public root's attrs.
const props = defineProps<{
  prefixCls?: string;
  className?: string;
  style?: CSSProperties;
  size?: SkeletonElementSize;
  shape?: SkeletonShape;
}>();
const classList = computed(() => [
  props.prefixCls,
  {
    [`${props.prefixCls}-lg`]: props.size === 'large',
    [`${props.prefixCls}-sm`]: props.size === 'small',
    [`${props.prefixCls}-circle`]: props.shape === 'circle',
    [`${props.prefixCls}-square`]: props.shape === 'square',
    [`${props.prefixCls}-round`]: props.shape === 'round',
  },
  props.className,
]);
const mergedStyle = computed<CSSProperties>(() => ({
  ...(typeof props.size === 'number' && Number.isFinite(props.size) && props.size >= 0
    ? {
        width: toCssLength(props.size),
        height: toCssLength(props.size),
        lineHeight: `${props.size}px`,
      }
    : {}),
  ...props.style,
}));
const warning = useDevWarning('Skeleton');
watchEffect(() => {
  warning.deprecated(props.size !== 'default', 'size="default"', 'size="medium"');
});
</script>
<template>
  <span :class="classList" v-bind="styleAttrs(mergedStyle)" />
</template>
