<script setup lang="ts">
import { ThemeContextKey } from '@apollo-design/theme';
import {
  type ComponentPublicInstance,
  type CSSProperties,
  computed,
  inject,
  mergeProps,
  normalizeStyle,
  shallowRef,
  useAttrs,
} from 'vue';
import { styleAttrs } from '../_internal/use-merge-semantic';
import { useOrientation } from '../_internal/use-orientation';
import { useComponentConfig } from '../config-provider/context';
import { isPresetSize } from '../space/gapSize';
import type { FlexConfig, FlexProps, FlexSlot } from './interface';
import createFlexClassNames from './utils';

defineOptions({ name: 'AFlex', inheritAttrs: false });
const props = withDefaults(defineProps<FlexProps>(), {
  // An omitted boolean must permit the current Provider default.
  vertical: undefined,
  wrap: undefined,
});
defineSlots<{ default?: FlexSlot }>();

const config = useComponentConfig<FlexConfig>('flex');
const attrs = useAttrs();
const theme = inject(ThemeContextKey, undefined);
const prefix = computed(() => config.getPrefixCls('flex', props.prefixCls));
const orientation = useOrientation(
  () => props.orientation,
  () => props.vertical ?? config.vertical,
  () => undefined,
);

// ThemeProvider can supply tokens without writing document-level variables.
// Scope only the three aliases Flex consumes; nested default themes reset them too.
const themeStyle = computed<CSSProperties>(() =>
  theme
    ? {
        '--apollo-padding-xs': `${theme.token.value.paddingXS}px`,
        '--apollo-padding': `${theme.token.value.padding}px`,
        '--apollo-padding-lg': `${theme.token.value.paddingLG}px`,
      }
    : {},
);
const derivedStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {};
  if (props.flex !== undefined && props.flex !== null) style.flex = String(props.flex);
  if (props.gap !== undefined && props.gap !== null && !isPresetSize(props.gap)) {
    style.gap = typeof props.gap === 'number' ? `${props.gap}px` : props.gap;
  }
  return style;
});

// Read current attrs/config in render. Native styles retain all Vue forms.
const rootAttrs = () => {
  const { style: nativeStyle, dir: nativeDir, ...rest } = attrs;
  const direction =
    typeof nativeDir === 'string' ? nativeDir : nativeDir === null ? undefined : config.direction;
  const cls = prefix.value;
  const style = normalizeStyle([themeStyle.value, config.style, nativeStyle, derivedStyle.value]);
  return mergeProps(
    {
      class: [
        config.className,
        cls,
        createFlexClassNames(cls, { ...props, vertical: orientation.value[1] }),
        {
          [`${cls}-gap-${props.gap}`]: isPresetSize(props.gap),
          [`${cls}-vertical`]: orientation.value[1],
          [`${cls}-rtl`]: direction === 'rtl',
        },
      ],
    },
    rest,
    { dir: direction, ...styleAttrs(typeof style === 'object' ? style : undefined) },
  );
};

const rootRef = shallowRef<Element | ComponentPublicInstance | null>(null);
const nativeElement = computed<HTMLElement | null>(() => {
  const value = rootRef.value;
  const element: unknown = value && '$el' in value ? value.$el : value;
  return typeof HTMLElement !== 'undefined' && element instanceof HTMLElement ? element : null;
});
defineExpose({ nativeElement });
const rootTag = computed(() => props.component ?? 'div');
</script>

<template>
  <component :is="rootTag" ref="rootRef" v-bind="rootAttrs()">
    <slot />
  </component>
</template>
