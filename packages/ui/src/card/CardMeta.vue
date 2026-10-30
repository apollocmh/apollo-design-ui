<script setup lang="ts">
import { h, mergeProps, ref, useAttrs, type VNodeChild } from 'vue';
import { NodeRenderer } from '../_internal/node-renderer';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import { hasCardContent } from './content';
import type {
  CardMetaConfig,
  CardMetaProps,
  CardMetaSemanticClassNames,
  CardMetaSemanticStyles,
  CardMetaSlots,
} from './interface';
import { useCardTheme } from './use-card-theme';

defineOptions({ name: 'ACardMeta', inheritAttrs: false });
const props = withDefaults(defineProps<CardMetaProps>(), {
  prefixCls: undefined,
  avatar: undefined,
  title: undefined,
  description: undefined,
  classNames: undefined,
  styles: undefined,
});
const attrs = useAttrs();
const slots = defineSlots<CardMetaSlots>();
const config = useComponentConfig<CardMetaConfig>('cardMeta');
const prefixCls = () => config.getPrefixCls('card', props.prefixCls);
const theme = useCardTheme(prefixCls);
const { classNames, styles } = useMergeSemantic<
  CardMetaProps,
  CardMetaSemanticClassNames,
  CardMetaSemanticStyles
>(
  [() => config.classNames, () => props.classNames],
  [() => config.styles, () => semanticRootStyle(config.style), () => props.styles],
  props,
);
const rootRef = ref<HTMLDivElement | null>(null);
defineExpose({ nativeElement: rootRef });
const renderNode = (node: VNodeChild) => h(NodeRenderer, { node });

function renderMeta() {
  const avatar = slots.avatar ? slots.avatar() : props.avatar;
  const title = slots.title ? slots.title() : props.title;
  const description = slots.description
    ? slots.description()
    : props.description !== undefined
      ? props.description
      : slots.default?.();
  const cls = `${prefixCls()}-meta`;
  const children: VNodeChild[] = [];
  if (hasCardContent(avatar))
    children.push(
      h(
        'div',
        {
          key: 'avatar',
          class: [`${cls}-avatar`, classNames.value.avatar],
          style: styles.value.avatar,
        },
        [renderNode(avatar)],
      ),
    );
  const section: VNodeChild[] = [];
  if (hasCardContent(title))
    section.push(
      h(
        'div',
        {
          key: 'title',
          class: [`${cls}-title`, classNames.value.title],
          style: styles.value.title,
        },
        [renderNode(title)],
      ),
    );
  if (hasCardContent(description))
    section.push(
      h(
        'div',
        {
          key: 'description',
          class: [`${cls}-description`, classNames.value.description],
          style: styles.value.description,
        },
        [renderNode(description)],
      ),
    );
  if (section.length)
    children.push(
      h(
        'div',
        {
          key: 'section',
          class: [`${cls}-section`, classNames.value.section],
          style: styles.value.section,
        },
        section,
      ),
    );
  return h(
    'div',
    mergeProps(
      {
        ref: rootRef,
        class: [cls, config.className, classNames.value.root],
        style: [theme.aliasStyles.value, styles.value.root],
      },
      attrs,
    ),
    children,
  );
}
</script>

<template>
  <NodeRenderer :node="renderMeta()" />
</template>
