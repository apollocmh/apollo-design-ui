<script setup lang="ts">
import { mergeDomAttrs } from '@apollo-design/utils';
import { computed, normalizeClass, ref, useAttrs, type VNodeChild } from 'vue';
import { semanticRootStyle, styleAttrs, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import Element from './Element.vue';
import type {
  SkeletonConfig,
  SkeletonProps,
  SkeletonSemanticClassNames,
  SkeletonSemanticStyles,
} from './interface';
import Paragraph from './Paragraph.vue';
import Title from './Title.vue';
import { useSkeletonTheme } from './use-skeleton-theme';

defineOptions({ name: 'ASkeleton', inheritAttrs: false });
const props = withDefaults(defineProps<SkeletonProps>(), {
  active: undefined,
  loading: undefined,
  prefixCls: undefined,
  avatar: false,
  title: true,
  paragraph: true,
  round: undefined,
  classNames: undefined,
  styles: undefined,
});
defineSlots<{ default?: () => VNodeChild }>();
const config = useComponentConfig<SkeletonConfig>('skeleton');
const attrs = useAttrs();
const direction = useDirection();
const prefixCls = computed(() => config.getPrefixCls('skeleton', props.prefixCls));
const theme = useSkeletonTheme(() => prefixCls.value);
const hasAvatar = computed(() => !!props.avatar);
const hasTitle = computed(() => !!props.title);
const hasParagraph = computed(() => !!props.paragraph);
const isSkeleton = computed(() => props.loading !== false);

const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
  SkeletonProps,
  SkeletonSemanticClassNames,
  SkeletonSemanticStyles
>(
  [() => config.classNames, () => props.classNames],
  [() => config.styles, () => semanticRootStyle(config.style), () => props.styles],
  props,
);
function blockProps<T extends object>(value: T | boolean): Partial<T> {
  return typeof value === 'object' && value !== null ? value : {};
}
const avatarProps = computed(() => {
  const custom = blockProps(props.avatar);
  return {
    prefixCls: `${prefixCls.value}-avatar`,
    size: 'large' as const,
    shape: hasTitle.value && !hasParagraph.value ? ('square' as const) : ('circle' as const),
    ...custom,
    className: normalizeClass([mergedClassNames.value.avatar, custom.className]),
    style: { ...custom.style, ...mergedStyles.value.avatar },
  };
});
const titleProps = computed(() => {
  const custom = blockProps(props.title);
  return {
    prefixCls: `${prefixCls.value}-title`,
    ...(hasParagraph.value ? { width: hasAvatar.value ? '50%' : '38%' } : {}),
    ...custom,
    className: normalizeClass([mergedClassNames.value.title, custom.className]),
    style: { ...custom.style, ...mergedStyles.value.title },
  };
});
const paragraphProps = computed(() => {
  const custom = blockProps(props.paragraph);
  return {
    prefixCls: `${prefixCls.value}-paragraph`,
    rows: !hasAvatar.value && hasTitle.value ? 3 : 2,
    ...(!hasAvatar.value || !hasTitle.value ? { width: '61%' } : {}),
    ...custom,
    className: normalizeClass([mergedClassNames.value.paragraph, custom.className]),
    style: { ...custom.style, ...mergedStyles.value.paragraph },
  };
});
const rootAttrs = () =>
  mergeDomAttrs(
    {
      class: [
        prefixCls.value,
        {
          [`${prefixCls.value}-with-avatar`]: hasAvatar.value,
          [`${prefixCls.value}-active`]: props.active,
          [`${prefixCls.value}-rtl`]: direction.value === 'rtl',
          [`${prefixCls.value}-round`]: props.round,
        },
        mergedClassNames.value.root,
        config.className,
      ],
      style: [theme.styles.value, mergedStyles.value.root],
    },
    attrs,
    { 'aria-busy': 'true' },
  );
const rootRef = ref<HTMLDivElement | null>(null);
defineExpose({ nativeElement: rootRef });
</script>

<template>
  <div v-if="isSkeleton" ref="rootRef" v-bind="rootAttrs()">
    <div v-if="hasAvatar" :class="[mergedClassNames.header, `${prefixCls}-header`]" aria-hidden="true" v-bind="styleAttrs(mergedStyles.header)">
      <Element v-bind="avatarProps" />
    </div>
    <div v-if="hasTitle || hasParagraph" :class="[mergedClassNames.section, `${prefixCls}-section`]" aria-hidden="true" v-bind="styleAttrs(mergedStyles.section)">
      <Title v-if="hasTitle" v-bind="titleProps" />
      <Paragraph v-if="hasParagraph" v-bind="paragraphProps" />
    </div>
  </div>
  <slot v-else />
</template>
