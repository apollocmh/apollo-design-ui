<script setup lang="ts" generic="T = unknown, K extends ListyKey = ListyKey">
import type { ExtraRenderInfo, VirtualListItemSlotProps } from '@apollo-design/virtual-list';
import { VirtualList, type VirtualListExposed } from '@apollo-design/virtual-list';
import {
  type CSSProperties,
  computed,
  defineComponent,
  Fragment,
  h,
  onBeforeUpdate,
  onUpdated,
  ref,
  shallowRef,
  useAttrs,
  type VNode,
} from 'vue';
import { NodeRenderer } from '../_internal/node-renderer';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useConfigContext, useDirection } from '../config-provider/context';
import {
  type FlatRow,
  findActiveHeaderIndex,
  flattenRows,
  resolveItemKey,
  scrollRawList,
  stickyPush,
  toTaggedKey,
} from './engine';
import type {
  ListyClassNames,
  ListyEmits,
  ListyKey,
  ListyProps,
  ListyScrollAlign,
  ListyScrollToConfig,
  ListySlots,
  ListyStyles,
} from './interface';
import { useListyTheme } from './use-listy-theme';
import { useRawSticky } from './use-raw-sticky';

defineOptions({ name: 'AListy', inheritAttrs: false });
const props = withDefaults(defineProps<Omit<ListyProps<T, K>, 'onScroll'>>(), {
  virtual: undefined,
  sticky: undefined,
});
const slots = defineSlots<ListySlots<T, K>>();
const emit = defineEmits<ListyEmits>();
const attrs = useAttrs();
const context = useComponentConfig<{
  className?: string;
  style?: CSSProperties;
  classNames?: ListyClassNames;
  styles?: ListyStyles;
}>('listy');
const config = useConfigContext();
const direction = useDirection();
const prefixCls = computed(() => context.getPrefixCls('listy', props.prefixCls));
const virtual = computed(() => props.virtual ?? config.virtual ?? false);
const theme = useListyTheme(() => prefixCls.value);
const data = computed(() => props.items ?? []);
const flat = computed(() =>
  flattenRows(data.value, props.group, (item) => resolveItemKey(props.rowKey, item)),
);
const { classNames, styles } = useMergeSemantic<ListyProps<T, K>, ListyClassNames, ListyStyles>(
  [() => context.classNames, () => props.classNames],
  [
    () => context.styles,
    () => (context.style ? { root: context.style } : undefined),
    () => props.styles,
  ],
  props,
);
const rawHolder = ref<HTMLElement | null>(null);
const virtualList = shallowRef<VirtualListExposed | null>(null);
const rawSticky = useRawSticky({
  holder: () => rawHolder.value,
  keys: () => flat.value.groupKeys,
  active: () => !virtual.value && !!props.sticky && !!props.group,
});

let focusedBeforeUpdate: HTMLElement | null = null;
onBeforeUpdate(() => {
  const holder = virtual.value ? virtualList.value?.nativeElement : rawHolder.value;
  const focused = typeof document === 'undefined' ? null : document.activeElement;
  focusedBeforeUpdate =
    focused instanceof HTMLElement && holder?.contains(focused) ? focused : null;
});
onUpdated(() => {
  // Moving a keyed row can blur its real editor even while preserving that node.
  if (focusedBeforeUpdate?.isConnected && document.activeElement === document.body) {
    focusedBeforeUpdate.focus({ preventScroll: true });
  }
  focusedBeforeUpdate = null;
});

const mapAlign = (align?: ListyScrollAlign) => (align === 'auto' ? undefined : align);
function scrollTo(config?: ListyScrollToConfig<K>) {
  if (!virtual.value) {
    scrollRawList(rawHolder.value, config, prefixCls.value, !!props.sticky);
    return;
  }
  if (config == null || typeof config === 'number') {
    virtualList.value?.scrollTo(config);
    return;
  }
  if ('groupKey' in config) {
    virtualList.value?.scrollTo({
      key: toTaggedKey(config.groupKey, 'group'),
      align: mapAlign(config.align),
      offset: config.offset,
    });
  } else if ('key' in config) {
    const tag = toTaggedKey(config.key, 'item');
    const groupKey = flat.value.itemKeyToGroupKey.get(tag);
    virtualList.value?.scrollTo({
      key: tag,
      align: mapAlign(config.align),
      offset: ({ getSize, align }) => {
        const size =
          props.sticky && align === 'top' && groupKey !== undefined
            ? getSize(toTaggedKey(groupKey, 'group'))
            : undefined;
        return (config.offset ?? 0) + (size ? size.bottom - size.top : 0);
      },
    });
  } else {
    virtualList.value?.scrollTo(config);
  }
}
defineExpose({ scrollTo });

function header(groupKey: K, sticky: boolean, fixed: boolean, extra: CSSProperties = {}): VNode {
  const cls = prefixCls.value;
  return h(
    'div',
    {
      class: [
        `${cls}-group-header`,
        { [`${cls}-group-header-sticky`]: sticky, [`${cls}-group-header-fixed`]: fixed },
        classNames.value.groupHeader,
      ],
      style: [styles.value.groupHeader, extra],
      'data-key': fixed ? undefined : toTaggedKey(groupKey, 'group'),
    },
    [
      slots.groupHeader
        ? slots.groupHeader({
            groupKey,
            items: flat.value.groupKeyToItems.get(groupKey) ?? [],
            sticky,
            fixed,
          })
        : groupKey,
    ],
  );
}
function itemRow(row: Extract<FlatRow<T, K>, { type: 'item' }>): VNode {
  const cls = prefixCls.value;
  return h(
    'div',
    {
      key: row.taggedKey,
      class: [`${cls}-item`, classNames.value.item],
      style: styles.value.item,
      'data-key': row.taggedKey,
      ref:
        virtual.value || !props.sticky || !props.group
          ? undefined
          : rawSticky.nodeRef(row.taggedKey),
    },
    [slots.default?.({ item: row.item, index: row.index })],
  );
}
function rawRow(row: FlatRow<T, K>): VNode {
  if (row.type === 'item') return itemRow(row);
  const id = `${typeof row.groupKey}:${row.groupKey}`;
  const node = header(
    row.groupKey,
    !!props.sticky,
    false,
    props.sticky ? { top: `${rawSticky.offsets.value.get(row.groupKey) ?? 0}px` } : {},
  );
  // Ref normalization belongs to h(), rather than assigning raw VNode.ref values.
  const groupNode = h(node, { ref: props.sticky ? rawSticky.nodeRef(`header:${id}`) : undefined });
  return h(Fragment, { key: row.taggedKey }, [
    h('span', {
      ref: props.sticky ? rawSticky.nodeRef(`anchor:${id}`) : undefined,
      'aria-hidden': 'true',
      style: { display: 'block', height: 0, padding: 0, margin: 0, border: 0 },
    }),
    groupNode,
  ]);
}

function holderAttrs() {
  const result: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(attrs)) {
    if (
      name === 'tabindex' ||
      name === 'role' ||
      name.startsWith('aria-') ||
      /^on(?:Key|Focus|Blur)/.test(name)
    )
      result[name] = value;
  }
  return result;
}
// VirtualList.component is its existing native-holder extension point. Keep its ref/scroll handling.
const Holder = defineComponent({
  name: 'AListyHolder',
  inheritAttrs: false,
  setup(_, { attrs: holderAttributes, slots: holderSlots }) {
    return () => h('div', { ...holderAttributes, ...holderAttrs() }, holderSlots.default?.());
  },
});
function virtualSticky(info: ExtraRenderInfo): VNode | null {
  if (!props.sticky || !props.group || !info.virtual || !flat.value.groupKeys.length) return null;
  const keys = flat.value.groupKeys;
  const topOf = (key: K) => info.getSize(toTaggedKey(key, 'group')).top;
  const active = findActiveHeaderIndex(keys, topOf, info.scrollTop);
  const key = keys[active];
  if (key === undefined) return null;
  const size = info.getSize(toTaggedKey(key, 'group'));
  const height = size.bottom - size.top;
  const nextKey = keys[active + 1];
  const push = stickyPush(
    nextKey === undefined ? undefined : topOf(nextKey),
    height,
    info.scrollTop,
  );
  return h(
    'div',
    {
      class: `${prefixCls.value}-group-header-holder`,
      style: {
        top: `${info.scrollTop - (info.offsetY ?? 0)}px`,
        bottom: 'auto',
        height: `${height}px`,
      },
    },
    [header(key, false, true, { top: `${push}px` })],
  );
}
function renderListy(): VNode {
  const cls = prefixCls.value;
  const dir = direction.value ?? 'ltr';
  const rootClass = [
    cls,
    { [`${cls}-rtl`]: dir === 'rtl' },
    context.className,
    classNames.value.root,
    attrs.class,
  ];
  const { class: _class, style: _style, dir: _dir, ...rest } = attrs;
  const rootStyle = [theme.styles.value, styles.value.root, attrs.style];
  if (!virtual.value) {
    return h(
      'div',
      {
        ...rest,
        ref: rawHolder,
        class: rootClass,
        dir,
        style: [
          {
            maxHeight: props.height === undefined ? undefined : `${props.height}px`,
            overflowY: props.height === undefined ? undefined : 'auto',
            overflowAnchor: 'none',
          },
          ...rootStyle,
        ],
        onScroll: (event: Event) => emit('scroll', event),
      },
      flat.value.rows.map(rawRow),
    );
  }
  const outer: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(rest)) {
    if (name !== 'tabindex' && name !== 'role' && !/^on(?:Key|Focus|Blur)/.test(name))
      outer[name] = value;
  }
  return h(
    VirtualList<FlatRow<T, K>>,
    {
      ...outer,
      ref: virtualList,
      class: rootClass,
      style: rootStyle,
      dir,
      data: flat.value.rows,
      itemKey: 'taggedKey',
      component: Holder,
      direction: dir,
      prefixCls: cls,
      virtual: true,
      fullHeight: false,
      height: props.height,
      itemHeight: theme.itemHeight.value,
      onScroll: (event: Event) => emit('scroll', event),
    },
    {
      default: ({ item: row }: VirtualListItemSlotProps<FlatRow<T, K>>) => {
        return row.type === 'item' ? itemRow(row) : header(row.groupKey, false, false);
      },
      extra: virtualSticky,
    },
  );
}
</script>

<template><NodeRenderer :node="renderListy()" /></template>
