<script setup lang="ts">
import { useDevWarning } from '@apollo-design/utils';
import { computed, mergeProps, onUpdated, ref, useAttrs, useSlots, watchEffect } from 'vue';
import { semanticRootStyle, styleAttrs, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import { useSize } from '../config-provider/size-context';
import type {
  DividerConfig,
  DividerProps,
  DividerSemanticClassNames,
  DividerSemanticStyles,
  DividerSlot,
  Orientation,
  TitlePlacement,
} from './interface';
import { useDividerTheme } from './use-divider-theme';

defineOptions({ name: 'ADivider', inheritAttrs: false });

// An omitted vertical prop must stay undefined: explicit false overrides legacy type.
const props = withDefaults(defineProps<DividerProps>(), {
  prefixCls: undefined,
  type: undefined,
  orientation: undefined,
  vertical: undefined,
  titlePlacement: undefined,
  orientationMargin: undefined,
  dashed: undefined,
  variant: 'solid',
  size: undefined,
  plain: undefined,
  classNames: undefined,
  styles: undefined,
});
defineSlots<{ default?: DividerSlot }>();
const slots = useSlots();
const attrs = useAttrs();
const config = useComponentConfig<DividerConfig>('divider');
const direction = computed(() =>
  attrs.dir === 'ltr' || attrs.dir === 'rtl' ? attrs.dir : config.direction,
);
const prefixCls = computed(() => config.getPrefixCls('divider', props.prefixCls));
const railCls = computed(() => `${prefixCls.value}-rail`);
const innerTextCls = computed(() => `${prefixCls.value}-inner-text`);
const themeStyle = useDividerTheme(() => prefixCls.value);

// Slot keys are read during render. Their existence is not a computed dependency.
const hasChildren = () => !!slots.default;
const isOrientation = (value: unknown): value is Orientation =>
  value === 'horizontal' || value === 'vertical';
const isTitlePlacement = (value: unknown): value is TitlePlacement =>
  value === 'left' ||
  value === 'right' ||
  value === 'start' ||
  value === 'end' ||
  value === 'center';
const mergedOrientation = computed<Orientation>(() => {
  if (isOrientation(props.orientation)) return props.orientation;
  if (typeof props.vertical === 'boolean') return props.vertical ? 'vertical' : 'horizontal';
  return isOrientation(props.type) ? props.type : 'horizontal';
});
const mergedVertical = computed(() => mergedOrientation.value === 'vertical');
const legacyTitlePlacement = computed(() => isTitlePlacement(props.orientation));
const mergedTitlePlacement = computed<'start' | 'end' | 'center'>(() => {
  const placement =
    props.titlePlacement ?? (isTitlePlacement(props.orientation) ? props.orientation : 'center');
  if (placement === 'left') return direction.value === 'rtl' ? 'end' : 'start';
  if (placement === 'right') return direction.value === 'rtl' ? 'start' : 'end';
  return placement;
});
const placementMargin = computed(() => {
  const value = props.orientationMargin;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  if (/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) {
    const number = Number(text);
    return Number.isFinite(number) ? number : undefined;
  }
  return value;
});
const hasMarginStart = computed(
  () => mergedTitlePlacement.value === 'start' && placementMargin.value !== undefined,
);
const hasMarginEnd = computed(
  () => mergedTitlePlacement.value === 'end' && placementMargin.value !== undefined,
);
const cssLength = (value: string | number | undefined) =>
  typeof value === 'number' ? (value === 0 ? '0' : `${value}px`) : value;
const innerStyle = computed(() => ({
  marginInlineStart: hasMarginStart.value ? cssLength(placementMargin.value) : undefined,
  marginInlineEnd: hasMarginEnd.value ? cssLength(placementMargin.value) : undefined,
}));
const size = useSize((contextSize) => props.size ?? contextSize);
const semanticProps = computed<DividerProps>(() => ({
  ...props,
  orientation: mergedOrientation.value,
  titlePlacement: mergedTitlePlacement.value,
  size: size.value,
}));
const { classNames, styles } = useMergeSemantic<
  DividerProps,
  DividerSemanticClassNames,
  DividerSemanticStyles
>(
  [() => config.classNames, () => props.classNames],
  [() => config.styles, () => semanticRootStyle(config.style), () => props.styles],
  semanticProps,
);
const railClass = computed(() => [railCls.value, classNames.value.rail]);
const contentClass = computed(() => [innerTextCls.value, classNames.value.content]);
const railStyleAttrs = computed(() => styleAttrs(styles.value.rail));
const contentStyleAttrs = computed(() =>
  styleAttrs({ ...innerStyle.value, ...styles.value.content }),
);

// Attrs and title presence are read together on each render; the native style stays last.
function rootAttrs() {
  const content = hasChildren();
  return mergeProps(
    {
      dir: direction.value,
      class: [
        prefixCls.value,
        config.className,
        `${prefixCls.value}-${mergedOrientation.value}`,
        {
          [`${prefixCls.value}-with-text`]: content,
          [`${prefixCls.value}-with-text-${mergedTitlePlacement.value}`]: content,
          [`${prefixCls.value}-dashed`]: !!props.dashed,
          [`${prefixCls.value}-${props.variant}`]: props.variant !== 'solid',
          [`${prefixCls.value}-plain`]: !!props.plain,
          [`${prefixCls.value}-rtl`]: direction.value === 'rtl',
          [`${prefixCls.value}-no-default-orientation-margin-start`]: hasMarginStart.value,
          [`${prefixCls.value}-no-default-orientation-margin-end`]: hasMarginEnd.value,
          [`${prefixCls.value}-md`]: size.value === 'medium' || size.value === 'middle',
          [`${prefixCls.value}-sm`]: size.value === 'small',
          [railCls.value]: !content,
        },
        !content ? classNames.value.rail : undefined,
        classNames.value.root,
      ],
      ...styleAttrs({
        ...themeStyle.value,
        ...styles.value.root,
        ...(content ? {} : styles.value.rail),
      }),
    },
    attrs,
    {
      role: content && !mergedVertical.value ? 'group' : 'separator',
      'aria-orientation': mergedVertical.value ? 'vertical' : undefined,
    },
  );
}
const warning = useDevWarning('Divider');
function checkWarnings() {
  warning(!hasChildren() || !mergedVertical.value, '`children` not working in `vertical` mode.');
  warning(
    !legacyTitlePlacement.value,
    '`orientation` is used for direction, please use `titlePlacement` replace this',
  );
  warning.deprecated(props.type === undefined, 'type', 'orientation');
  warning.deprecated(
    props.orientationMargin === undefined,
    'orientationMargin',
    'styles.content.margin',
  );
}
watchEffect(checkWarnings);
onUpdated(checkWarnings);
const rootRef = ref<HTMLDivElement | null>(null);
defineExpose({ nativeElement: rootRef });
</script>

<template>
  <div ref="rootRef" v-bind="rootAttrs()">
    <template v-if="hasChildren() && !mergedVertical">
      <div :class="[railClass, `${railCls}-start`]" role="separator" v-bind="railStyleAttrs" />
      <span :class="contentClass" v-bind="contentStyleAttrs"><slot /></span>
      <div :class="[railClass, `${railCls}-end`]" aria-hidden="true" v-bind="railStyleAttrs" />
    </template>
  </div>
</template>
