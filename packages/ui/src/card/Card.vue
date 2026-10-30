<script setup lang="ts">
import { toArray, useDevWarning } from '@apollo-design/utils';
import {
  computed,
  h,
  isVNode,
  mergeProps,
  ref,
  useAttrs,
  type VNode,
  type VNodeChild,
  watchEffect,
} from 'vue';
import { NodeRenderer } from '../_internal/node-renderer';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useConfigContext, useDirection } from '../config-provider/context';
import { useSize } from '../config-provider/size-context';
import Skeleton from '../skeleton/Skeleton.vue';
import type { TabsItem, TabsProps } from '../tabs/interface';
import Tabs from '../tabs/Tabs.vue';
import CardGrid from './CardGrid.vue';
import { hasCardContent } from './content';
import type {
  CardConfig,
  CardEmits,
  CardProps,
  CardSemanticClassNames,
  CardSemanticStyles,
  CardSize,
  CardSlots,
} from './interface';
import { useCardTheme } from './use-card-theme';

defineOptions({ name: 'ACard', inheritAttrs: false });
const props = withDefaults(
  defineProps<Omit<CardProps, 'onTabChange' | 'onUpdate:activeTabKey'>>(),
  {
    prefixCls: undefined,
    title: undefined,
    extra: undefined,
    bordered: undefined,
    headStyle: undefined,
    bodyStyle: undefined,
    loading: undefined,
    hoverable: undefined,
    id: undefined,
    size: undefined,
    type: undefined,
    cover: undefined,
    actions: undefined,
    tabList: undefined,
    tabBarExtraContent: undefined,
    activeTabKey: undefined,
    defaultActiveTabKey: undefined,
    tabProps: undefined,
    classNames: undefined,
    styles: undefined,
    variant: undefined,
  },
);
const emit = defineEmits<CardEmits>();
const slots = defineSlots<CardSlots>();
const attrs = useAttrs();
const config = useComponentConfig<CardConfig>('card');
const globalConfig = useConfigContext();
const direction = useDirection();
const prefixCls = computed(() => config.getPrefixCls('card', props.prefixCls));
const theme = useCardTheme(() => prefixCls.value);

// Card has two surface variants. Form's variant context belongs to input controls.
const variant = computed<NonNullable<CardProps['variant']>>(
  () =>
    props.variant ??
    (props.bordered === false
      ? 'borderless'
      : (config.variant ?? (globalConfig.variant === 'borderless' ? 'borderless' : 'outlined'))),
);
const size = useSize((contextSize) => props.size ?? contextSize);
const mergedSize = computed<CardSize>(() =>
  size.value === 'large' ? 'medium' : (size.value ?? 'medium'),
);
const tabSize = computed<TabsProps['size']>(() =>
  mergedSize.value === 'small' ? 'small' : 'large',
);

const warning = useDevWarning('Card');
watchEffect(() => {
  warning.deprecated(props.size !== 'default', 'size="default"', 'size="medium"');
  warning.deprecated(props.headStyle === undefined, 'headStyle', 'styles.header');
  warning.deprecated(props.bodyStyle === undefined, 'bodyStyle', 'styles.body');
  warning.deprecated(props.bordered === undefined, 'bordered', 'variant');
});

const semanticProps = computed<CardProps>(() => ({
  ...props,
  size: mergedSize.value,
  variant: variant.value,
}));
const { classNames, styles } = useMergeSemantic<
  CardProps,
  CardSemanticClassNames,
  CardSemanticStyles
>(
  [() => config.classNames, () => props.classNames],
  [() => config.styles, () => semanticRootStyle(config.style), () => props.styles],
  semanticProps,
);
const tabsItems = computed<TabsItem[]>(() =>
  (props.tabList ?? []).map(({ tab, ...item }) => ({ label: tab, ...item })),
);
type TabsRuntimeProps = InstanceType<typeof Tabs>['$props'];
const tabsBind = computed(
  () =>
    ({
      ...props.tabProps,
      activeKey: props.activeTabKey,
      defaultActiveKey: props.defaultActiveTabKey,
      tabBarExtraContent: props.tabBarExtraContent,
    }) satisfies TabsRuntimeProps,
);
const onActiveKeyUpdate = (key: string): void => emit('update:activeTabKey', key);
const onTabChange = (key: string): void => emit('tabChange', key);
const rootRef = ref<HTMLDivElement | null>(null);
defineExpose({ nativeElement: rootRef });
const actionsRef = ref<HTMLUListElement | null>(null);
let focusedAction: HTMLElement | null = null;
function captureActionFocus(): void {
  const list = actionsRef.value;
  const active = list?.ownerDocument.activeElement;
  focusedAction = list && active instanceof HTMLElement && list.contains(active) ? active : null;
}
function restoreActionFocus(): void {
  const target = focusedAction;
  focusedAction = null;
  // Moving a keyed li with insertBefore can blur its still-connected editor in Chrome.
  if (
    target?.isConnected &&
    actionsRef.value?.contains(target) &&
    target.ownerDocument.activeElement === target.ownerDocument.body
  ) {
    target.focus({ preventScroll: true });
  }
}
function clearActionFocus(): void {
  focusedAction = null;
}

const renderNode = (node: VNodeChild) => h(NodeRenderer, { node });

/** Called once by this component's render; slot presence and values remain current. */
function renderCard(): VNode {
  const title = slots.title ? slots.title() : props.title;
  const extra = slots.extra ? slots.extra() : props.extra;
  const cover = slots.cover ? slots.cover() : props.cover;
  const body = props.loading ? [] : toArray(slots.default?.());
  const actions = slots.actions ? toArray(slots.actions()) : (props.actions ?? []);
  const hasTitle = hasCardContent(title);
  const hasExtra = hasCardContent(extra);
  const hasTabs = props.tabList != null;
  const hasGrid = body.some((child) => child.type === CardGrid);
  const cls = prefixCls.value;
  const children: VNodeChild[] = [];

  if (hasTitle || hasExtra || hasTabs) {
    const headerContent: VNodeChild[] = [];
    if (hasTitle)
      headerContent.push(
        h(
          'div',
          {
            key: 'title',
            class: [`${cls}-head-title`, classNames.value.title],
            style: styles.value.title,
          },
          [renderNode(title)],
        ),
      );
    if (hasExtra)
      headerContent.push(
        h(
          'div',
          {
            key: 'extra',
            class: [`${cls}-extra`, classNames.value.extra],
            style: styles.value.extra,
          },
          [renderNode(extra)],
        ),
      );
    const header: VNodeChild[] = [h('div', { class: `${cls}-head-wrapper` }, headerContent)];
    if (hasTabs)
      header.push(
        h(
          Tabs,
          mergeProps({ size: tabSize.value }, tabsBind.value, {
            class: `${cls}-head-tabs`,
            items: tabsItems.value,
            onChange: onTabChange,
            'onUpdate:activeKey': onActiveKeyUpdate,
          }),
        ),
      );
    children.push(
      h(
        'div',
        {
          key: 'head',
          class: [`${cls}-head`, classNames.value.header],
          style: [props.headStyle, styles.value.header],
        },
        header,
      ),
    );
  }
  if (hasCardContent(cover))
    children.push(
      h(
        'div',
        {
          key: 'cover',
          class: [`${cls}-cover`, classNames.value.cover],
          style: styles.value.cover,
        },
        [renderNode(cover)],
      ),
    );
  if (props.loading || body.length) {
    children.push(
      h(
        'div',
        {
          key: 'body',
          class: [`${cls}-body`, classNames.value.body],
          style: [props.bodyStyle, styles.value.body],
        },
        [
          props.loading
            ? h(Skeleton, { loading: true, active: true, paragraph: { rows: 4 }, title: false })
            : renderNode(body),
        ],
      ),
    );
  }
  if (actions.length) {
    const width = `${100 / actions.length}%`;
    children.push(
      h(
        'ul',
        {
          key: 'actions',
          ref: actionsRef,
          onVnodeBeforeUpdate: captureActionFocus,
          onVnodeUpdated: restoreActionFocus,
          onVnodeBeforeUnmount: clearActionFocus,
          class: [`${cls}-actions`, classNames.value.actions],
          style: styles.value.actions,
        },
        actions.map((action, index) =>
          h(
            'li',
            {
              key: isVNode(action) ? (action.key ?? `action-${index}`) : `action-${index}`,
              style: { width },
            },
            [h('span', [renderNode(action)])],
          ),
        ),
      ),
    );
  }
  return h(
    'div',
    mergeProps(
      {
        id: props.id,
        ref: rootRef,
        class: [
          cls,
          config.className,
          {
            [`${cls}-loading`]: props.loading,
            [`${cls}-bordered`]: variant.value !== 'borderless',
            [`${cls}-hoverable`]: props.hoverable,
            [`${cls}-contain-grid`]: hasGrid,
            [`${cls}-contain-tabs`]: Boolean(props.tabList?.length),
            [`${cls}-small`]: mergedSize.value === 'small',
            [`${cls}-type-${props.type}`]: Boolean(props.type),
            [`${cls}-rtl`]: direction.value === 'rtl',
          },
          `${cls}-css-var`,
          classNames.value.root,
        ],
        style: [theme.styles.value, styles.value.root],
      },
      attrs,
    ),
    children,
  );
}
</script>

<template>
  <NodeRenderer :node="renderCard()" />
</template>
