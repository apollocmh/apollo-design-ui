/**
 * ListBody —— Transfer 列表面板的主体（`ul` 列表 + 可选内嵌分页）。
 *
 * 契约来源：antd 6.6.4 `es/transfer/ListBody.js`（**机械移植**）。
 *
 * 分页模型（⚠️ 与 antd 逐条对齐）：
 *  - `pagination` 为 true 时用默认 `{ simple: true, showSizeChanger: false, showLessItems: false }`；
 *  - `current` 内部维护，但随 `filteredRenderItems`/`pageSize` 变化**钳制**到合法页码区间；
 *  - `pageSize` 受控（`pagination.pageSize`）+ 内部 10 默认（`useControlledState`）；
 *  - expose `items`（当前页的渲染项）—— Section 的「移除当前页 / 反选当前页」菜单
 *    靠它取本页数据。
 */

import { isPlainObject, useControlledValue } from '@apollo-design/utils';
import { computed, defineComponent, h, type PropType, ref, watch } from 'vue';
import Pagination from '../pagination/Pagination.vue';
import type {
  PaginationType,
  RenderedItem,
  TransferItem,
  TransferKey,
  TransferSemanticClassNames,
  TransferSemanticStyles,
} from './interface';
import ListItem from './ListItem';

/** 自定义列表面板不应透传的 props（上游 `OmitProps`）。 */
export const OmitProps = ['handleFilter', 'handleClear', 'checkedKeys'];

const parsePagination = (pagination: PaginationType) => {
  const defaultPagination = {
    simple: true,
    showSizeChanger: false,
    showLessItems: false,
  };
  return {
    ...defaultPagination,
    ...(isPlainObject(pagination) ? pagination : {}),
  };
};

const ListBody = defineComponent({
  name: 'ATransferListBody',
  props: {
    prefixCls: { type: String, required: true },
    classNames: { type: Object as PropType<TransferSemanticClassNames>, default: undefined },
    styles: { type: Object as PropType<TransferSemanticStyles>, default: undefined },
    filteredRenderItems: { type: Array as PropType<RenderedItem[]>, required: true },
    selectedKeys: { type: Array as PropType<TransferKey[]>, required: true },
    disabled: { type: Boolean, default: undefined },
    showRemove: { type: Boolean, default: undefined },
    pagination: { type: [Boolean, Object] as PropType<PaginationType>, default: undefined },
    remove: { type: String, default: undefined },
    onItemSelect: {
      type: Function as PropType<
        (key: TransferKey, check: boolean, e?: { shiftKey?: boolean }) => void
      >,
      required: true,
    },
    onItemRemove: {
      type: Function as PropType<(keys: TransferKey[]) => void>,
      default: undefined,
    },
    onScroll: { type: Function as PropType<(e: Event) => void>, default: undefined },
  },
  setup(props, { expose }) {
    const current = ref(1);

    const mergedPagination = computed(() => {
      if (!props.pagination) return null;
      return parsePagination(props.pagination);
    });

    const [pageSize, setPageSize] = useControlledValue<number>({
      defaultValue: 10,
      getValue: () => mergedPagination.value?.pageSize,
    });

    watch(
      [() => props.filteredRenderItems, mergedPagination, pageSize],
      () => {
        if (mergedPagination.value) {
          const maxPageCount = Math.ceil(props.filteredRenderItems.length / pageSize.value);
          current.value = Math.max(1, Math.min(current.value, maxPageCount));
        }
      },
      { immediate: true },
    );

    const memoizedItems = computed<RenderedItem[]>(() => {
      const fr = props.filteredRenderItems;
      if (mergedPagination.value) {
        return fr.slice((current.value - 1) * pageSize.value, current.value * pageSize.value);
      }
      return fr;
    });

    expose({
      items: memoizedItems,
    });

    const onInternalClick = (item: TransferItem, e: { shiftKey?: boolean }) => {
      props.onItemSelect(item.key, !props.selectedKeys.includes(item.key), e);
    };

    const onRemove = (item: TransferItem) => {
      props.onItemRemove?.([item.key]);
    };

    const onPageChange = (cur: number) => {
      current.value = cur;
    };

    const onSizeChange = (cur: number, size: number) => {
      current.value = cur;
      setPageSize(size);
    };

    return () => {
      const p = props.prefixCls;
      const listNode = h(
        'ul',
        {
          class: [
            `${p}-content`,
            props.classNames?.list as string | undefined,
            { [`${p}-content-show-remove`]: props.showRemove },
          ],
          style: props.styles?.list,
          onScroll: props.onScroll as never,
        },
        (memoizedItems.value ?? []).map(({ renderedEl, renderedText, item }) =>
          h(ListItem, {
            key: String(item.key),
            prefixCls: p,
            classNames: props.classNames,
            styles: props.styles,
            item,
            renderedText,
            renderedEl,
            showRemove: props.showRemove,
            onClick: onInternalClick,
            onRemove,
            removeLabel: props.remove,
            checked: props.selectedKeys.includes(item.key),
            disabled: props.disabled,
          }),
        ),
      );

      const paginationNode = mergedPagination.value
        ? h(Pagination, {
            size: 'small',
            disabled: props.disabled,
            simple: mergedPagination.value.simple,
            pageSize: pageSize.value,
            showLessItems: mergedPagination.value.showLessItems,
            showSizeChanger: mergedPagination.value.showSizeChanger,
            className: `${p}-pagination`,
            total: props.filteredRenderItems.length,
            current: current.value,
            'onUpdate:current': onPageChange,
            onChange: onPageChange,
            onShowSizeChange: onSizeChange,
          })
        : null;

      return [listNode, paginationNode];
    };
  },
});

export default ListBody;
