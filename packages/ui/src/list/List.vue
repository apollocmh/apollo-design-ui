<script setup lang="ts" generic="T = unknown">
import { isEmptyVNode, mergeDomAttrs } from '@apollo-design/utils';
import {
  computed,
  Fragment,
  h,
  provide,
  ref,
  useAttrs,
  type VNode,
  type VNodeChild,
  watchEffect,
} from 'vue';
import { NodeRenderer } from '../_internal/node-renderer';
import { type Breakpoint, responsiveArray } from '../_internal/responsive-observer';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { DefaultRenderEmpty } from '../config-provider/default-render-empty';
import { useSize } from '../config-provider/size-context';
import { Row, useBreakpoint } from '../grid';
import { Pagination, type PaginationConfig } from '../pagination';
import { Spin } from '../spin';
import { type ListContextValue, listContextKey } from './context';
import type { ListConfig, ListProps, ListSlots } from './interface';
import { useListTheme } from './use-list-theme';

defineOptions({ name: 'AList', inheritAttrs: false });

/**
 * ⚠️ `split` 的默认值是 **`true`**（上游解构默认）⇒ 必须用 `withDefaults` 显式声明。
 * 其余布尔 prop（`bordered` / `loading`）的默认值是 `false`，`undefined` 已是 falsy，
 * 不需要声明（声明了反而会与「未传」不可区分）。
 */
const props = withDefaults(defineProps<ListProps<T>>(), {
  split: true,
  header: undefined,
  footer: undefined,
  loadMore: undefined,
  extra: undefined,
});
const attrs = useAttrs();
const slots = defineSlots<ListSlots<T>>();

const config = useComponentConfig<ListConfig>('list');
const direction = useDirection();

const prefixCls = computed(() => config.getPrefixCls('list', props.prefixCls));
const theme = useListTheme(() => prefixCls.value);
const dataSource = computed(() => props.dataSource ?? []);

// ---------------------------------------------------------------------------
// 分页的内部状态（判据 4 / 5）
// ---------------------------------------------------------------------------

const paginationObj = computed<PaginationConfig>(() => props.pagination || {});
const paginationCurrent = ref(1);
const paginationSize = ref(10);
let paginationInitialized = false;

function positiveInteger(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1
    ? Math.floor(value)
    : fallback;
}
function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}
function paginationTotal(): number {
  const total = paginationObj.value.total;
  return typeof total === 'number' && Number.isFinite(total) && total >= 0
    ? Math.floor(total)
    : dataSource.value.length;
}

watchEffect(() => {
  if (!props.pagination) return;
  const cfg = paginationObj.value;
  if (!paginationInitialized) {
    paginationCurrent.value = positiveInteger(cfg.defaultCurrent, 1);
    paginationSize.value = positiveInteger(cfg.defaultPageSize, 10);
    paginationInitialized = true;
  }
  if (cfg.pageSize !== undefined) paginationSize.value = positiveInteger(cfg.pageSize, 10);
  if (cfg.current !== undefined) paginationCurrent.value = positiveInteger(cfg.current, 1);
  else
    paginationCurrent.value = Math.min(
      paginationCurrent.value,
      pageCount(paginationTotal(), paginationSize.value),
    );
});

const triggerPaginationEvent =
  (eventName: 'onChange' | 'onShowSizeChange') => (page: number, pageSize: number) => {
    const cfg = paginationObj.value;
    if (cfg.current === undefined) paginationCurrent.value = page;
    if (cfg.pageSize === undefined) paginationSize.value = pageSize;
    cfg[eventName]?.(page, pageSize);
  };

const onPaginationChange = triggerPaginationEvent('onChange');
const onPaginationShowSizeChange = triggerPaginationEvent('onShowSizeChange');

// ---------------------------------------------------------------------------
// loading / size / 条件类（判据 1 / 2 / 7）
// ---------------------------------------------------------------------------

const loadingProp = computed(() => {
  const loading = props.loading;
  return loading && typeof loading === 'object' ? loading : { spinning: !!loading };
});

const isLoading = computed(() => loadingProp.value.spinning !== false);

const mergedSize = useSize((ctxSize) => props.size ?? ctxSize);

/** `large → lg` / `small → sm`，其余**不加类**。 */
const sizeCls = computed(() => {
  switch (mergedSize.value) {
    case 'large':
      return 'lg';
    case 'small':
      return 'sm';
    default:
      return '';
  }
});

const cssVarCls = computed(() => `${prefixCls.value}-css-var`);
const containerCls = computed(() => `${prefixCls.value}-container`);

function classString(hasContentAfterItems: boolean, hasExtra: boolean) {
  const p = prefixCls.value;
  return [
    p,
    {
      [`${p}-vertical`]: props.itemLayout === 'vertical',
      [`${p}-${sizeCls.value}`]: !!sizeCls.value,
      [`${p}-split`]: props.split,
      [`${p}-bordered`]: props.bordered,
      [`${p}-loading`]: isLoading.value,
      [`${p}-grid`]: !!props.grid,
      [`${p}-something-after-last-item`]: hasContentAfterItems,
      [`${p}-rtl`]: direction.value === 'rtl',
      [`${p}-with-extra`]: hasExtra,
      [`${p}-empty`]: !dataSource.value.length && !isLoading.value && !slots.default,
    },
    config.className,
    // 调用方原生 class（位置与原先的 props.className/rootClassName 一致）
    attrs.class,
    cssVarCls.value,
  ];
}

// ---------------------------------------------------------------------------
// 分页 props（判据 4 / 5 / 6）
// ---------------------------------------------------------------------------

const paginationProps = computed(() => {
  const cfg = paginationObj.value;
  const pageSize = positiveInteger(cfg.pageSize ?? paginationSize.value, 10);
  const total = paginationTotal();
  return {
    ...cfg,
    current: Math.min(
      positiveInteger(cfg.current ?? paginationCurrent.value, 1),
      pageCount(total, pageSize),
    ),
    pageSize,
    total,
    position: cfg.position ?? 'bottom',
    align: cfg.align ?? 'end',
  } satisfies PaginationConfig;
});

const splitDataSource = computed(() => {
  const source = [...dataSource.value];
  if (!props.pagination) return source;
  const { current, pageSize } = paginationProps.value;
  // 🚨 不满足条件时**不切片**（判据 5）
  if (source.length > (current - 1) * pageSize) {
    return source.splice((current - 1) * pageSize, pageSize);
  }
  return source;
});

const paginationPosition = computed(() => paginationProps.value.position);

const showTopPagination = computed(
  () =>
    !!props.pagination &&
    (paginationPosition.value === 'top' || paginationPosition.value === 'both'),
);
const showBottomPagination = computed(
  () =>
    !!props.pagination &&
    (paginationPosition.value === 'bottom' || paginationPosition.value === 'both'),
);

/** ⚠️ **每次调用都新建 vnode**（判据 6：top/bottom 两处使用）。 */
function paginationContent(placement: 'top' | 'bottom'): VNode {
  const {
    onChange: _onChange,
    onShowSizeChange: _onShowSizeChange,
    position: _position,
    ...rest
  } = paginationProps.value;
  return h(
    'div',
    {
      class: [`${prefixCls.value}-pagination`, `${prefixCls.value}-pagination-${placement}`],
      key: `pagination-${placement}`,
    },
    [
      h(
        Pagination,
        {
          ...rest,
          onChange: onPaginationChange,
          onShowSizeChange: onPaginationShowSizeChange,
        },
        {
          ...(slots.paginationItemRender ? { itemRender: slots.paginationItemRender } : {}),
          ...(slots.paginationTotal ? { total: slots.paginationTotal } : {}),
          ...(slots.paginationSizeChanger ? { sizeChanger: slots.paginationSizeChanger } : {}),
        },
      ),
    ],
  );
}

// ---------------------------------------------------------------------------
// grid（判据 8 / 9）
// ---------------------------------------------------------------------------

const needResponsive = computed(() =>
  responsiveArray.some((breakpoint) => props.grid?.[breakpoint] !== undefined),
);

// 🚨 取值函数（不是裸布尔）：后者会被订阅闭包捕获一次 ⇒ 永不随 props 变化（VNA-AVATAR-01 同族）
const screens = useBreakpoint(() => needResponsive.value);

const currentBreakpoint = computed<Breakpoint | undefined>(() => {
  const s = screens.value;
  if (!s) return undefined;
  for (const breakpoint of responsiveArray) {
    const columns = props.grid?.[breakpoint];
    if (s[breakpoint] && typeof columns === 'number' && Number.isFinite(columns) && columns > 0)
      return breakpoint;
  }
  return undefined;
});

const colStyle = computed(() => {
  const grid = props.grid;
  if (!grid) return undefined;
  const bp = currentBreakpoint.value;
  const columnCount = bp && grid[bp] ? grid[bp] : grid.column;
  if (typeof columnCount === 'number' && Number.isFinite(columnCount) && columnCount > 0) {
    return { width: `${100 / columnCount}%`, maxWidth: `${100 / columnCount}%` };
  }
  return undefined;
});

// ---------------------------------------------------------------------------
// 逐项渲染（判据 1 的 key 解析链）
// ---------------------------------------------------------------------------

function renderInternalItem(item: T, index: number): VNode | null {
  if (!slots.item) return null;
  const rowKey = props.rowKey;
  let key: unknown;
  if (typeof rowKey === 'function') {
    key = rowKey(item);
  } else if (rowKey !== undefined) {
    key = item?.[rowKey];
  } else if (item !== null && typeof item === 'object' && 'key' in item) {
    key = item.key;
  }
  const resolvedKey =
    typeof key === 'string' || typeof key === 'number' ? key : `list-item-${index}`;
  return h(Fragment, { key: resolvedKey }, [slots.item({ item, index })]);
}

// ---------------------------------------------------------------------------
// 内容（判据 3 / 9）
// ---------------------------------------------------------------------------

/** Explicit empty content is intentional; absence alone selects the next source. */
function emptyNode(): VNodeChild {
  if (props.locale?.emptyText !== undefined) return props.locale.emptyText;
  return config.renderEmpty
    ? config.renderEmpty('List')
    : h(DefaultRenderEmpty, { componentName: 'List' });
}

/**
 * 内容（判据 3 / 9）。
 *
 * 🚨 **赋值的顺序就是判据**（L4 契约抓出的真 bug）：上游是
 * `let childrenContent = isLoading && <div style={{minHeight:53}} />`，
 * **随后**被 `if (splitDataSource.length > 0)` **覆盖** ⇒
 * **有数据 + loading 时渲染的是列表本身**，不是那个 53px 占位块！
 * 占位块只在「`isLoading` 且 `splitDataSource` 为空」时才可见。
 * ⚠️ 写成「先判 isLoading 就 return」会让 `loading` + `dataSource` 的形态整个跑偏。
 */
function childrenContent(hasContentAfterItems: boolean): VNodeChild {
  let content: VNodeChild = isLoading.value
    ? // ⚠️ 数字必须转字符串（Vue 的 patchStyle 不补 px）
      h('div', { style: { minHeight: '53px' } })
    : null;

  const source = splitDataSource.value;
  if (source.length > 0) {
    const items = source
      .map((item, index) => renderInternalItem(item, index))
      .filter((node): node is VNode => node !== null);

    if (props.grid) {
      content = h(
        Row,
        { class: [containerCls.value, cssVarCls.value], gutter: props.grid.gutter },
        // ⚠️ 必须写成**显式插槽函数** —— `h(Row, props, 数组)` 会被 Vue 判成
        //    「Non-function value encountered for default slot」并告警
        //    （数组里只有一个 vnode 时尤甚）。元素（`ul`）不受影响，组件才要。
        {
          default: () =>
            items.map((child) =>
              h('div', { key: child.key ?? undefined, style: colStyle.value }, [child]),
            ),
        },
      );
    } else {
      content = h(
        'ul',
        {
          class: [
            `${prefixCls.value}-items`,
            containerCls.value,
            cssVarCls.value,
            { [`${prefixCls.value}-items-with-after`]: hasContentAfterItems },
          ],
        },
        items,
      );
    }
  } else if (!slots.default && !isLoading.value) {
    content = h('div', { class: `${prefixCls.value}-empty-text` }, [emptyNode()]);
  }

  return content;
}

// ---------------------------------------------------------------------------
// context / 告警 / ref
// ---------------------------------------------------------------------------

const contextValue = computed<ListContextValue>(() => ({
  prefixCls: prefixCls.value,
  size: mergedSize.value === 'small' || mergedSize.value === 'large' ? mergedSize.value : undefined,
  split: props.split,
  bordered: props.bordered,
  grid: props.grid,
  itemLayout: props.itemLayout,
}));

provide(listContextKey, contextValue);

// Vue attrs update the render, but are not reactive dependencies of computed.
// Merge during render so native string styles and attrs-only updates remain valid.
function rootAttrs() {
  const { class: _attrsClass, ...restAttrs } = attrs;
  return mergeDomAttrs(
    { dir: direction.value, style: [theme.styles.value, config.style] },
    restAttrs,
    { id: props.id },
  );
}

const rootRef = ref<HTMLDivElement | null>(null);
defineExpose({ nativeElement: rootRef });

// Slot functions run in this render call. Resolve once so visibility, borders and
// fallback decisions all use the same content (including intentionally empty slots).
function renderList(): VNode {
  const header = slots.header ? slots.header() : props.header;
  const footer = slots.footer ? slots.footer() : props.footer;
  const loadMore = slots.loadMore ? slots.loadMore() : props.loadMore;
  const extra = slots.extra ? slots.extra() : props.extra;
  const hasHeader = !isEmptyVNode(header);
  const hasFooter = !isEmptyVNode(footer);
  const hasLoadMore = !isEmptyVNode(loadMore);
  const hasExtra = !isEmptyVNode(extra);
  const replacesBottomPagination = !!slots.loadMore || hasLoadMore;
  const hasContentAfterItems =
    hasFooter || hasLoadMore || (showBottomPagination.value && !replacesBottomPagination);
  const content = childrenContent(hasContentAfterItems);
  return h(
    'div',
    {
      ...rootAttrs(),
      ref: rootRef,
      class: classString(hasContentAfterItems, hasExtra),
    },
    [
      showTopPagination.value ? paginationContent('top') : null,
      hasHeader ? h('div', { class: `${prefixCls.value}-header`, key: 'header' }, [header]) : null,
      h(
        Spin,
        { ...loadingProp.value, class: `${prefixCls.value}-spin`, key: 'content' },
        {
          default: () => [content, slots.default?.()],
        },
      ),
      hasFooter ? h('div', { class: `${prefixCls.value}-footer`, key: 'footer' }, [footer]) : null,
      hasLoadMore
        ? h('div', { class: `${prefixCls.value}-load-more`, key: 'load-more' }, [loadMore])
        : !replacesBottomPagination && showBottomPagination.value
          ? paginationContent('bottom')
          : null,
      hasExtra ? h('div', { class: `${prefixCls.value}-extra`, key: 'extra' }, [extra]) : null,
    ],
  );
}
</script>

<template>
  <NodeRenderer :node="renderList()" />
</template>
