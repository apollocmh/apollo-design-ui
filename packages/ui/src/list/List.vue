<script setup lang="ts">
/**
 * `List` —— 列表。对应 antd 6.6.4 的 `es/list/index.tsx`（349 行）。
 *
 * 🚨 **本组件在 antd 6.6.4 里整体 deprecated** —— 源码无条件发
 * `warning(false, 'deprecated', "The \`List\` component is deprecated and will be removed in
 * the next major version. If you're using version 6.6.0 or later, please use \`Listy\` instead.")`
 * ⇒ 本仓保留同款告警（先例：dropdown 的 `DropdownButton`，D91）。
 * ⚠️ `rc-util` 的 `warning` **不去重**（已核对 `@rc-component/util/es/warning.js`）⇒
 *    与上游一样是**每次渲染都打印**。
 *
 * ── 十条必须复刻的判据 ───────────────────────────────────────────────────────
 *
 * 1. **`isSomethingAfterLastItem = !!(loadMore || pagination || footer)`**（三个**原始 prop**的真值）
 *    ⇒ `-something-after-last-item` 类。
 * 2. **`loading`**：`boolean` ⇒ 包成 `{ spinning }`；`isLoading = !!loadingProp?.spinning`。
 * 3. 🚨 **空态判据是「`splitDataSource.length === 0` **且** 无默认插槽 **且** 非 loading」**，
 *    回退链 `locale?.emptyText || renderEmpty?.('List') || <DefaultRenderEmpty/>`（`||` 不是 `??`）。
 *    ⚠️ `isLoading` 时 `childrenContent` 先被置成 `<div style="min-height:53px">`。
 * 4. **分页**：`pagination === false`（默认）不渲染；对象时
 *    `mergeProps({current:1,total:0,position:'bottom'}, {total,current,pageSize}, pagination)`。
 *    🚨 `current = Math.min(current, Math.ceil(total / pageSize))`。
 * 5. 🚨 **切片条件是 `dataSource.length > (current-1)*pageSize`** —— 不满足时**不切片**。
 * 6. 🚨 **`paginationContent` 在 top/bottom 两处使用** ⇒ Vue 侧**每次新建 vnode**；
 *    `position === 'both'` 时**两处都渲染**（顶部那条不能写 `v-else-if`）。
 * 7. **`size`**：`large→'lg'` / `small→'sm'`，其余**不加类**（`'default'` / `'medium'` 都不落类）。
 * 8. **`grid`**：`needResponsive` 由 `responsiveArray` 成员判定；`useBreakpoint(needResponsive)`；
 *    `currentBreakpoint` 取 `responsiveArray`（**从大到小**）**首个**为真的断点；
 *    `columnCount = (currentBreakpoint && grid[currentBreakpoint]) ?? grid.column`；
 *    `colStyle = { width: \`${100/n}%\`, maxWidth: \`${100/n}%\` }`（**字符串**）。
 * 9. **grid 模式的 DOM**：`<Row class={containerCls + cssVarCls} gutter>` >
 *    `<div style={colStyle}>` > `Item`（`Item` 自己再包一层 `Col`）——
 *    ⚠️ 那个 `<div>` **不是** `Col`，是 antd 就有的冗余层，逐字复刻。
 * 10. **`classString` 的顺序**：`prefixCls` → 条件类 → `contextClassName` → `className` →
 *     `rootClassName` → `cssVarCls`（`-rtl` 在条件类里）。
 *
 * ── 平台差异（PLATFORM）──────────────────────────────────────────────────────
 *
 * - **无 `hashId`**（D2）；**无 `useCSSVarCls`** ⇒ 直接拼 `${prefixCls}-css-var`（rate/card 同判）。
 * - **`ListContext` 注入 `ComputedRef`**（见 `context.ts`）。
 * - **`<Spin>` 的 `{...loadingProp}`** 直接 `v-bind`。
 * - **`ref` 归一成 `{ nativeElement }`**（可空）。
 */

import { devUseWarning, isFunction, isPlainObject, mergeProps } from '@apollo-design/utils';
import {
  computed,
  Fragment,
  h,
  provide,
  ref,
  useAttrs,
  useSlots,
  type VNode,
  type VNodeChild,
} from 'vue';
import { type Breakpoint, responsiveArray } from '../_internal/responsive-observer';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { DefaultRenderEmpty } from '../config-provider/default-render-empty';
import { useSize } from '../config-provider/size-context';
import { NodeRenderer } from '../empty/components/NodeRenderer';
import { Row, useBreakpoint } from '../grid';
import { Pagination } from '../pagination';
import { Spin } from '../spin';
import { listContextKey } from './context';
import type { ListConfig, ListProps } from './interface';

defineOptions({ name: 'AList', inheritAttrs: false });

/**
 * ⚠️ `split` 的默认值是 **`true`**（上游解构默认）⇒ 必须用 `withDefaults` 显式声明。
 * 其余布尔 prop（`bordered` / `loading`）的默认值是 `false`，`undefined` 已是 falsy，
 * 不需要声明（声明了反而会与「未传」不可区分）。
 */
const props = withDefaults(defineProps<ListProps>(), {
  split: true,
});
const attrs = useAttrs();
const slots = useSlots();

const config = useComponentConfig<ListConfig>('list');
const direction = useDirection();

const prefixCls = computed(() => config.getPrefixCls('list', props.prefixCls));

// ---------------------------------------------------------------------------
// 分页的内部状态（判据 4 / 5）
// ---------------------------------------------------------------------------

const paginationObj = computed(() =>
  isPlainObject(props.pagination) ? (props.pagination as unknown as Record<string, unknown>) : {},
);

const paginationCurrent = ref((paginationObj.value.defaultCurrent as number) || 1);
const paginationSize = ref((paginationObj.value.defaultPageSize as number) || 10);

const triggerPaginationEvent =
  (eventName: 'onChange' | 'onShowSizeChange') => (page: number, pageSize: number) => {
    paginationCurrent.value = page;
    paginationSize.value = pageSize;
    const pagination = props.pagination;
    if (pagination) {
      const handler = (pagination as unknown as Record<string, unknown>)[eventName];
      if (isFunction(handler)) {
        (handler as (p: number, s: number) => void)(page, pageSize);
      }
    }
  };

const onPaginationChange = triggerPaginationEvent('onChange');
const onPaginationShowSizeChange = triggerPaginationEvent('onShowSizeChange');

// ---------------------------------------------------------------------------
// loading / size / 条件类（判据 1 / 2 / 7）
// ---------------------------------------------------------------------------

const loadingProp = computed<Record<string, unknown>>(() => {
  const loading = props.loading;
  return typeof loading === 'boolean' ? { spinning: loading } : { ...(loading ?? {}) };
});

const isLoading = computed(() => !!loadingProp.value.spinning);

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

const isSomethingAfterLastItem = computed(
  () => !!(props.loadMore || props.pagination || props.footer),
);

const cssVarCls = computed(() => `${prefixCls.value}-css-var`);
const containerCls = computed(() => `${prefixCls.value}-container`);

const classString = computed(() => {
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
      [`${p}-something-after-last-item`]: isSomethingAfterLastItem.value,
      [`${p}-rtl`]: direction.value === 'rtl',
    },
    config.className,
    props.className,
    props.rootClassName,
    cssVarCls.value,
  ];
});

// ---------------------------------------------------------------------------
// 分页 props（判据 4 / 5 / 6）
// ---------------------------------------------------------------------------

const dataSource = computed(() => props.dataSource ?? []);

const paginationProps = computed(() => {
  const merged = mergeProps(
    { current: 1, total: 0, position: 'bottom' },
    {
      total: dataSource.value.length,
      current: paginationCurrent.value,
      pageSize: paginationSize.value,
    },
    (props.pagination || {}) as unknown as Record<string, unknown>,
  );
  const pageSize = (merged.pageSize as number) || 1;
  const largestPage = Math.ceil((merged.total as number) / pageSize);
  merged.current = Math.min(merged.current as number, largestPage);
  return merged;
});

const splitDataSource = computed(() => {
  const source = [...dataSource.value];
  if (!props.pagination) return source;
  const { current, pageSize } = paginationProps.value as { current: number; pageSize: number };
  // 🚨 不满足条件时**不切片**（判据 5）
  if (source.length > (current - 1) * pageSize) {
    return source.splice((current - 1) * pageSize, pageSize);
  }
  return source;
});

const paginationPosition = computed(() => paginationProps.value.position as string | undefined);

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
function paginationContent(): VNode {
  const {
    onChange: _onChange,
    onShowSizeChange: _onShowSizeChange,
    ...rest
  } = paginationProps.value as Record<string, unknown>;
  return h('div', { class: `${prefixCls.value}-pagination` }, [
    h(Pagination, {
      ...rest,
      align: 'end',
      onChange: onPaginationChange,
      onShowSizeChange: onPaginationShowSizeChange,
    }),
  ]);
}

// ---------------------------------------------------------------------------
// grid（判据 8 / 9）
// ---------------------------------------------------------------------------

const needResponsive = computed(() =>
  Object.keys(props.grid ?? {}).some((key) => responsiveArray.includes(key as Breakpoint)),
);

const screens = useBreakpoint(needResponsive.value);

const currentBreakpoint = computed<Breakpoint | undefined>(() => {
  const s = screens.value;
  if (!s) return undefined;
  for (const breakpoint of responsiveArray) {
    if (s[breakpoint]) return breakpoint;
  }
  return undefined;
});

const colStyle = computed(() => {
  const grid = props.grid;
  if (!grid) return undefined;
  const bp = currentBreakpoint.value;
  const columnCount = bp && grid[bp] ? grid[bp] : grid.column;
  if (columnCount) {
    return { width: `${100 / columnCount}%`, maxWidth: `${100 / columnCount}%` };
  }
  return undefined;
});

// ---------------------------------------------------------------------------
// 逐项渲染（判据 1 的 key 解析链）
// ---------------------------------------------------------------------------

function renderInternalItem(item: unknown, index: number): VNode | null {
  if (!props.renderItem) return null;
  let key: unknown;
  const rowKey = props.rowKey;
  if (isFunction(rowKey)) {
    key = (rowKey as (i: unknown) => unknown)(item);
  } else if (rowKey) {
    key = (item as Record<string, unknown>)[rowKey as string];
  } else {
    key = (item as Record<string, unknown>)?.key;
  }
  // ⚠️ `??=` —— `0` / `''` 是**有效 key**，只有 null/undefined 才回退
  key ??= `list-item-${index}`;
  return h(Fragment, { key: key as string }, [
    props.renderItem(item as never, index) as VNodeChild,
  ]);
}

// ---------------------------------------------------------------------------
// 内容（判据 3 / 9）
// ---------------------------------------------------------------------------

/** 空态的三级回退（判据 3）。⚠️ `||` 不是 `??` ⇒ `''` 会走下一级。 */
function emptyNode(): VNodeChild {
  return (
    props.locale?.emptyText ||
    // ⚠️ 上游 `renderEmpty` 的返回类型是 `unknown`（可返回任意可渲染值）⇒ 需要一次断言
    (config.renderEmpty?.('List') as VNodeChild) ||
    h(DefaultRenderEmpty, { componentName: 'List' })
  );
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
function childrenContent(): VNodeChild {
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
        { class: [`${prefixCls.value}-items`, containerCls.value, cssVarCls.value] },
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

const contextValue = computed(() => ({
  grid: props.grid,
  itemLayout: props.itemLayout,
}));

provide(listContextKey, contextValue);

if (import.meta.env?.DEV ?? true) {
  const warning = devUseWarning('List');
  warning(
    false,
    'The `List` component is deprecated and will be removed in the next major version. ' +
      "If you're using version 6.6.0 or later, please use `Listy` instead.",
  );
}

const rootAttrs = computed(() => ({
  ...attrs,
  style: { ...config.style, ...props.style },
}));

const rootRef = ref<HTMLDivElement | null>(null);
defineExpose({ nativeElement: rootRef });
</script>

<template>
  <div ref="rootRef" :class="classString" v-bind="rootAttrs">
    <NodeRenderer v-if="showTopPagination" :node="paginationContent()" />
    <div v-if="props.header" :class="`${prefixCls}-header`">
      <NodeRenderer :node="props.header" />
    </div>
    <Spin v-bind="loadingProp">
      <NodeRenderer :node="childrenContent()" />
      <slot />
    </Spin>
    <div v-if="props.footer" :class="`${prefixCls}-footer`">
      <NodeRenderer :node="props.footer" />
    </div>
    <NodeRenderer v-if="props.loadMore" :node="props.loadMore" />
    <NodeRenderer v-else-if="showBottomPagination" :node="paginationContent()" />
  </div>
</template>
