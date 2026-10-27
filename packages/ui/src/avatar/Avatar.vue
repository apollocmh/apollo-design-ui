<script setup lang="ts">
import { isEmptyVNode, useResizeObserver } from '@apollo-design/utils';
import {
  computed,
  inject,
  mergeProps,
  onMounted,
  onUpdated,
  ref,
  useAttrs,
  useSlots,
  watch,
} from 'vue';
import { NodeRenderer } from '../_internal/node-renderer';
import { responsiveArray } from '../_internal/responsive-observer';
import { useComponentConfig } from '../config-provider/context';
import { useSize } from '../config-provider/size-context';
import { useBreakpoint } from '../grid/hooks/use-breakpoint';
import { avatarContextKey, avatarGroupPrefixKey } from './context';
import type { AvatarConfig, AvatarEmits, AvatarProps, AvatarSlots } from './interface';
import { useAvatarTheme } from './use-avatar-theme';

defineOptions({ name: 'AAvatar', inheritAttrs: false });
const props = withDefaults(defineProps<AvatarProps>(), { gap: 4, alt: '', draggable: undefined });
const emit = defineEmits<AvatarEmits>();
defineSlots<AvatarSlots>();
const attrs = useAttrs(),
  slots = useSlots();
const context = useComponentConfig<AvatarConfig>('avatar');
const avatarCtx = inject(avatarContextKey, undefined);
const groupPrefix = inject(avatarGroupPrefixKey, undefined);
const prefixCls = computed(
  () => props.prefixCls ?? groupPrefix?.value ?? context.getPrefixCls('avatar'),
);
const themeStyle = useAvatarTheme(() => prefixCls.value);
const scale = ref(1),
  isImgExist = ref(true);
const rootRef = ref<HTMLSpanElement | null>(null),
  childrenRef = ref<HTMLSpanElement | null>(null);
const mergedSize = useSize((ctxSize) => props.size ?? avatarCtx?.size ?? ctxSize ?? 'medium');
const screens = useBreakpoint(() => typeof mergedSize.value === 'object');
const currentSize = computed(() => {
  const size = mergedSize.value;
  if (typeof size !== 'object') return size;
  const screen = responsiveArray.find((key) => screens.value?.[key] && size[key] !== undefined);
  return screen ? size[screen] : undefined;
});
const imageSrc = computed(() =>
  typeof props.src === 'string' && props.src.length > 0 && isImgExist.value ? props.src : undefined,
);
const imageData = computed(() => typeof props.src !== 'string' && !isEmptyVNode(props.src));
const hasImage = () => Boolean(slots.image || imageSrc.value || imageData.value);
const hasIcon = () => Boolean(slots.icon || !isEmptyVNode(props.icon));

function setScaleParam(): void {
  const contentWidth = childrenRef.value?.offsetWidth ?? 0,
    width = rootRef.value?.offsetWidth ?? 0;
  if (!contentWidth || !width) {
    scale.value = 1;
    return;
  }
  const gap = Number.isFinite(props.gap) ? Math.max(0, props.gap) : 4;
  scale.value = gap * 2 >= width ? 1 : Math.min(1, (width - gap * 2) / contentWidth);
}
onMounted(setScaleParam);
onUpdated(setScaleParam);
watch([() => props.src, () => props.srcSet, () => props.crossOrigin], () => {
  isImgExist.value = true;
  scale.value = 1;
});
useResizeObserver({ target: rootRef, onResize: setScaleParam });
useResizeObserver({ target: childrenRef, onResize: setScaleParam });
function onImageError(event: Event): void {
  emit('error', event);
  if (props.beforeFallback?.(event) !== false) isImgExist.value = false;
}
function rootAttrs() {
  const size = currentSize.value;
  return mergeProps(
    {
      dir: context.direction,
      class: [
        prefixCls.value,
        context.className,
        `${prefixCls.value}-${props.shape ?? avatarCtx?.shape ?? 'circle'}`,
        `${prefixCls.value}-css-var`,
        {
          [`${prefixCls.value}-lg`]: size === 'large',
          [`${prefixCls.value}-sm`]: size === 'small',
          [`${prefixCls.value}-image`]: hasImage(),
          [`${prefixCls.value}-icon`]: hasIcon(),
        },
      ],
      style: [
        themeStyle.value,
        typeof size === 'number' && Number.isFinite(size)
          ? {
              width: `${Math.max(0, size)}px`,
              height: `${Math.max(0, size)}px`,
              ...(hasIcon() && !hasImage() ? { fontSize: `${Math.max(0, size) / 2}px` } : {}),
            }
          : undefined,
        context.style,
      ],
    },
    attrs,
  );
}
defineExpose({ nativeElement: rootRef });
</script>
<template>
  <span ref="rootRef" v-bind="rootAttrs()" @click="emit('click', $event)">
    <span v-if="$slots.image" :class="`${prefixCls}-image-content`"><slot name="image" /></span>
    <img v-else-if="imageSrc" :src="imageSrc" :draggable="props.draggable" :srcset="props.srcSet" :alt="props.alt" :crossorigin="props.crossOrigin" @error="onImageError" />
    <NodeRenderer v-else-if="imageData" :node="props.src" />
    <span v-else-if="$slots.icon" :class="`${prefixCls}-icon-content`"><slot name="icon" /></span>
    <NodeRenderer v-else-if="hasIcon()" :node="props.icon" />
    <span v-else ref="childrenRef" :class="`${prefixCls}-string`" :style="{transform: `scale(${scale})`}"><slot /></span>
  </span>
</template>
