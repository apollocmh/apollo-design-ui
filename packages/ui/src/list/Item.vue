<script setup lang="ts">
import { isEmptyVNode, isTextVNode, toArray } from '@apollo-design/utils';
import { computed, h, isVNode, ref, useAttrs, type VNode, type VNodeChild } from 'vue';
import { NodeRenderer } from '../_internal/node-renderer';
import { useComponentConfig } from '../config-provider/context';
import { Col } from '../grid';
import { useListContext } from './context';
import type { ListConfig, ListItemProps, ListItemSemanticName, ListItemSlots } from './interface';

defineOptions({ name: 'AListItem', inheritAttrs: false });
const props = withDefaults(defineProps<ListItemProps>(), { extra: undefined });
const slots = defineSlots<ListItemSlots>();
const attrs = useAttrs();
const listContext = useListContext();
const config = useComponentConfig<ListConfig>('list');
const prefixCls = computed(() => config.getPrefixCls('list', props.prefixCls));
const cls = computed(() => `${prefixCls.value}-item`);

const moduleClass = (name: ListItemSemanticName) => [
  config.item?.classNames?.[name],
  props.classNames?.[name],
];
const moduleStyle = (name: ListItemSemanticName) => ({
  ...config.item?.styles?.[name],
  ...props.styles?.[name],
});

const rootEl = ref<HTMLElement | null>(null);
const colRef = ref<InstanceType<typeof Col> | null>(null);
const nativeElement = computed(() =>
  listContext.value.grid ? (colRef.value?.nativeElement ?? null) : rootEl.value,
);
defineExpose({ nativeElement });

function renderActions(actions: VNodeChild[], keyed: boolean): VNode | null {
  if (actions.length === 0) return null;
  const actionCls = `${cls.value}-action`;
  return h(
    'ul',
    { class: [actionCls, moduleClass('actions')], key: 'actions', style: moduleStyle('actions') },
    actions.map((action, index) =>
      h(
        'li',
        {
          key:
            keyed && isVNode(action)
              ? (action.key ?? `${actionCls}-${index}`)
              : `${actionCls}-${index}`,
        },
        [
          h(NodeRenderer, { node: action }),
          index < actions.length - 1 ? h('em', { class: `${actionCls}-split` }) : null,
        ],
      ),
    ),
  );
}

function flattenContent(content: VNodeChild): VNode[] {
  return Array.isArray(content) ? content.flatMap(flattenContent) : toArray(content ?? null);
}

function renderItem(): VNode {
  // One render-local snapshot drives both content and layout. No slot reads in
  // computed/lifecycle caches; conditional slots and attrs-only updates stay current.
  const children = flattenContent(slots.default?.());
  const extra = slots.extra ? slots.extra() : props.extra;
  const hasExtra = !isEmptyVNode(extra);
  const actions = slots.actions
    ? flattenContent(slots.actions()).filter(
        (node) =>
          !isEmptyVNode(node) &&
          !(isTextVNode(node) && typeof node.children === 'string' && node.children.trim() === ''),
      )
    : (props.actions ?? []);
  const actionsNode = renderActions(actions, !!slots.actions);
  const vertical = listContext.value.itemLayout === 'vertical';
  const noFlex = vertical ? !hasExtra : children.length > 1 && children.some(isTextVNode);
  const content =
    vertical && hasExtra
      ? [
          h('div', { class: `${cls.value}-main`, key: 'content' }, [...children, actionsNode]),
          h(
            'div',
            {
              class: [`${cls.value}-extra`, moduleClass('extra')],
              key: 'extra',
              style: moduleStyle('extra'),
            },
            [h(NodeRenderer, { node: extra })],
          ),
        ]
      : [...children, actionsNode, h(NodeRenderer, { node: extra, key: 'extra' })];
  const { class: attrsClass, ...restAttrs } = attrs;
  const itemAttrs = {
    ...restAttrs,
    class: [cls.value, { [`${cls.value}-no-flex`]: noFlex }, attrsClass],
  };
  if (listContext.value.grid) {
    return h(
      Col,
      { flex: 1, style: props.colStyle, ref: colRef },
      { default: () => h('div', itemAttrs, content) },
    );
  }
  return h('li', { ...itemAttrs, ref: rootEl }, content);
}
</script>

<template>
  <NodeRenderer :node="renderItem()" />
</template>
