<script setup lang="ts">
// Default SVG path retained from the existing Ant Design 6.6.4 illustration.
import { computed, useAttrs } from 'vue';
import { useConfigContext } from '../config-provider/context';
import type { SkeletonImageProps, SkeletonNodeSlot } from './interface';
import Node from './Node.vue';

defineOptions({ name: 'ASkeletonImage', inheritAttrs: false });
const props = withDefaults(defineProps<SkeletonImageProps>(), {
  prefixCls: undefined,
  active: undefined,
  classNames: undefined,
  styles: undefined,
});
defineSlots<{ default?: SkeletonNodeSlot }>();
const config = useConfigContext();
const attrs = useAttrs();
const prefixCls = computed(() => config.getPrefixCls('skeleton', props.prefixCls));
const imageCls = computed(() => `${prefixCls.value}-image`);
const svgCls = computed(() => `${prefixCls.value}-image-svg`);
const pathCls = computed(() => `${prefixCls.value}-image-path`);
</script>
<template>
  <Node
    :prefix-cls="props.prefixCls"
    :active="props.active"
    :class-names="props.classNames"
    :styles="props.styles"
    :internal-class-name="imageCls"
    v-bind="attrs"
  >
    <template v-if="$slots.default"><slot /></template>
    <svg v-else
      viewBox="0 0 1098 1024"
      xmlns="http://www.w3.org/2000/svg"
      :class="svgCls"
      aria-hidden="true"
      focusable="false"
    >
      <title>Image placeholder</title>
      <path
        d="M365.7 329.1q0 45.8-32 77.7t-77.7 32-77.7-32-32-77.7 32-77.6 77.7-32 77.7 32 32 77.6M951 548.6v256H146.3V694.9L329 512l91.5 91.4L713 311zm54.8-402.3H91.4q-7.4 0-12.8 5.4T73 164.6v694.8q0 7.5 5.5 12.9t12.8 5.4h914.3q7.5 0 12.9-5.4t5.4-12.9V164.6q0-7.5-5.4-12.9t-12.9-5.4m91.4 18.3v694.8q0 37.8-26.8 64.6t-64.6 26.9H91.4q-37.7 0-64.6-26.9T0 859.4V164.6q0-37.8 26.8-64.6T91.4 73h914.3q37.8 0 64.6 26.9t26.8 64.6"
        :class="pathCls"
      />
    </svg>
  </Node>
</template>
