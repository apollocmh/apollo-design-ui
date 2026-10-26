<script setup lang="ts">
import { isEmptyVNode } from '@apollo-design/utils';
import { computed, h, ref, useAttrs, type VNode } from 'vue';
import { NodeRenderer } from '../_internal/node-renderer';
import { useConfigContext } from '../config-provider/context';
import { useListContext } from './context';
import type { ListItemMetaProps, ListItemMetaSlots } from './interface';

defineOptions({ name: 'AListItemMeta', inheritAttrs: false });
const props = withDefaults(defineProps<ListItemMetaProps>(), {
  avatar: undefined,
  title: undefined,
  description: undefined,
});
const slots = defineSlots<ListItemMetaSlots>();
const attrs = useAttrs();
const { getPrefixCls } = useConfigContext();
const context = useListContext();
const cls = computed(
  () => `${getPrefixCls('list', props.prefixCls || context.value.prefixCls)}-item-meta`,
);
const rootRef = ref<HTMLDivElement | null>(null);
defineExpose({ nativeElement: rootRef });

function renderMeta(): VNode {
  const avatar = slots.avatar ? slots.avatar() : props.avatar;
  const title = slots.title ? slots.title() : props.title;
  const description = slots.description ? slots.description() : props.description;
  const hasAvatar = !isEmptyVNode(avatar);
  const hasTitle = !isEmptyVNode(title);
  const hasDescription = !isEmptyVNode(description);
  return h(
    'div',
    {
      ...attrs,
      class: [
        cls.value,
        {
          [`${cls.value}-vertical`]:
            context.value.inItem && context.value.itemLayout === 'vertical',
        },
        attrs.class,
      ],
      ref: rootRef,
    },
    [
      hasAvatar
        ? h('div', { class: `${cls.value}-avatar` }, [h(NodeRenderer, { node: avatar })])
        : null,
      hasTitle || hasDescription
        ? h('div', { class: `${cls.value}-content` }, [
            hasTitle
              ? h('h4', { class: `${cls.value}-title` }, [h(NodeRenderer, { node: title })])
              : null,
            hasDescription
              ? h('div', { class: `${cls.value}-description` }, [
                  h(NodeRenderer, { node: description }),
                ])
              : null,
          ])
        : null,
    ],
  );
}
</script>

<template>
  <NodeRenderer :node="renderMeta()" />
</template>
