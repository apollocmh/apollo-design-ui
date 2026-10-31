<script setup lang="ts">
import { useResizeObserver } from '@apollo-design/utils';
import { type CSSProperties, computed, ref, useAttrs } from 'vue';
import type { FillerEmits, FillerProps, FillerSlots } from './types';

defineOptions({ name: 'AVirtualListFiller', inheritAttrs: false });
const props = defineProps<Omit<FillerProps, 'onInnerResize'>>();
const emit = defineEmits<FillerEmits>();
defineSlots<FillerSlots>();
const attrs = useAttrs();
const inner = ref<HTMLElement | null>(null);
useResizeObserver({
  target: inner,
  onResize: () => {
    emit('innerResize');
  },
});
defineExpose({ getInnerHeight: () => inner.value?.offsetHeight ?? 0 });
const outerStyle = computed<CSSProperties>(() =>
  props.offsetY === undefined
    ? {}
    : {
        height: `${props.height ?? 0}px`,
        position: 'relative',
        overflow: props.scrollWidth === undefined ? 'hidden' : 'visible',
      },
);
const innerStyle = computed<CSSProperties>(() => ({
  display: 'flex',
  flexDirection: 'column',
  ...(props.offsetY === undefined
    ? {}
    : {
        position: 'absolute',
        top: '0px',
        transform: `translateY(${props.offsetY}px)`,
        ...(props.scrollWidth === undefined
          ? { left: '0px', right: '0px' }
          : props.rtl
            ? { right: '0px' }
            : { left: '0px' }),
      }),
  ...(props.scrollWidth === undefined ? {} : { width: `${props.scrollWidth}px` }),
}));
function outerAttrs() {
  const { style: _style, ...rest } = attrs;
  return rest;
}
function innerAttrs() {
  const { class: _class, style: _style, ...rest } = props.innerProps ?? {};
  return rest;
}
</script>
<template>
  <div v-bind="outerAttrs()" :style="[attrs.style, outerStyle]">
    <div v-bind="innerAttrs()" ref="inner"
      :class="[prefixCls ? `${prefixCls}-holder-inner` : undefined, innerProps?.class]"
      :style="[innerProps?.style, innerStyle]">
      <slot /><slot name="extra" />
    </div>
  </div>
</template>
