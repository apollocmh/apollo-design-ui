/**
 * Section —— Transfer 的列表面板（也作为 `Transfer.List` 静态属性暴露）。
 *
 * 契约来源：antd 6.6.4 `es/transfer/Section.js`（311 行，**机械移植**）。
 *
 * 职责（⚠️ 全部与上游逐条对齐）：
 *  - 头部：全选 checkbox（三态：none/all/part，只统计**未禁用**项）+ 下拉菜单
 *    （selectAll/selectCurrent/selectInvert 或 oneWay 的 removeAll/removeCurrent）+
 *    计数文案（`selectedCount/totalCount unit`）+ 标题；
 *  - 搜索：`showSearch` 为对象时取 `defaultValue`/`placeholder`；
 *  - 过滤：`filterOption` 自定义，否则 `renderedText.includes(filterValue)`；
 *  - 主体：默认 ListBody / 自定义 renderList（函数 render prop）/ not-found 兜底
 *    （`notFoundContent` 支持数组按方向取值）；
 *  - footer：函数形态 `footer(props, { direction })`（旧签名 `footer(props)` 兼容）。
 */

import { DownOutlined } from '@apollo-design/icons';
import { isFunction, isNumber, isPlainObject, isString } from '@apollo-design/utils';
import { computed, defineComponent, h, type PropType, ref, type VNodeChild } from 'vue';
import Checkbox from '../checkbox/Checkbox';
import Dropdown from '../dropdown/Dropdown';
import type {
  PaginationType,
  RenderedItem,
  TransferDirection,
  TransferItem,
  TransferKey,
  TransferLocale,
  TransferSemanticClassNames,
  TransferSemanticStyles,
} from './interface';
import ListBody from './ListBody';
import Search from './Search';

const defaultRender = () => null;

function isRenderResultPlainObject(
  result: unknown,
): result is { label?: VNodeChild; value?: string } {
  return (
    result !== null &&
    result !== undefined &&
    isPlainObject(result) &&
    !((result as { __v_isVNode?: boolean }).__v_isVNode === true)
  );
}

function getEnabledItemKeys(items: TransferItem[]): TransferKey[] {
  return items.reduce<TransferKey[]>((keys, data) => {
    if (!data.disabled) {
      keys.push(data.key);
    }
    return keys;
  }, []);
}

function getTextFromRenderResult(
  renderResult: VNodeChild | { label?: VNodeChild; value?: string },
  item: TransferItem,
): string {
  const candidates: unknown[] = [
    isRenderResultPlainObject(renderResult) ? renderResult.value : renderResult,
    item.title,
    item.key,
  ];
  for (const value of candidates) {
    if (isString(value)) {
      return value;
    }
    if (isNumber(value)) {
      return String(value);
    }
  }
  return '';
}

const isValidIcon = (icon: unknown) => icon !== undefined;

const getShowSearchOption = (
  showSearch: boolean | { defaultValue?: string; placeholder?: string },
) => {
  if (isPlainObject(showSearch)) {
    return {
      ...showSearch,
      defaultValue: showSearch.defaultValue || '',
    };
  }
  return {
    defaultValue: '',
    placeholder: '',
  };
};

const Section = defineComponent({
  name: 'ATransferSection',
  props: {
    prefixCls: { type: String, required: true },
    classNames: { type: Object as PropType<TransferSemanticClassNames>, default: undefined },
    styles: { type: Object as PropType<TransferSemanticStyles>, default: undefined },
    dataSource: { type: Array as PropType<TransferItem[]>, default: () => [] },
    titleText: { type: null as unknown as PropType<VNodeChild>, default: '' },
    checkedKeys: { type: Array as PropType<TransferKey[]>, required: true },
    disabled: { type: Boolean, default: undefined },
    showSearch: {
      type: [Boolean, Object] as PropType<
        boolean | { defaultValue?: string; placeholder?: string }
      >,
      default: undefined,
    },
    searchPlaceholder: { type: String, default: undefined },
    notFoundContent: {
      type: null as unknown as PropType<VNodeChild | VNodeChild[]>,
      default: undefined,
    },
    selectAll: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    deselectAll: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    selectCurrent: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    selectInvert: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    removeAll: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    removeCurrent: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    showSelectAll: { type: Boolean, default: true },
    showRemove: { type: Boolean, default: undefined },
    pagination: { type: [Boolean, Object] as PropType<PaginationType>, default: undefined },
    direction: { type: String as PropType<TransferDirection>, required: true },
    itemsUnit: { type: String, default: undefined },
    itemUnit: { type: String, default: undefined },
    remove: { type: String, default: undefined },
    selectAllLabel: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    selectionsIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    footer: {
      type: Function as PropType<
        (props: Record<string, unknown>, info?: { direction: TransferDirection }) => VNodeChild
      >,
      default: undefined,
    },
    renderList: {
      type: Function as PropType<(props: Record<string, unknown>) => VNodeChild>,
      default: undefined,
    },
    filterOption: {
      type: Function as PropType<
        (inputValue: string, item: TransferItem, direction: TransferDirection) => boolean
      >,
      default: undefined,
    },
    render: {
      type: Function as PropType<
        (item: TransferItem) => VNodeChild | { label?: VNodeChild; value?: string }
      >,
      default: undefined,
    },
    onItemSelectAll: {
      type: Function as PropType<(keys: TransferKey[], checkAll: boolean | 'replace') => void>,
      default: undefined,
    },
    onItemSelect: {
      type: Function as PropType<
        (key: TransferKey, check: boolean, e?: { shiftKey?: boolean }) => void
      >,
      default: undefined,
    },
    onItemRemove: {
      type: Function as PropType<(keys: TransferKey[]) => void>,
      default: undefined,
    },
    handleFilter: {
      type: Function as PropType<(e: { target: { value: string } }) => void>,
      required: true,
    },
    handleClear: { type: Function as PropType<() => void>, required: true },
    onScroll: { type: Function as PropType<(e: Event) => void>, default: undefined },
  },
  setup(props, { attrs }) {
    const sectionPrefixCls = `${props.prefixCls}-section`;
    const listPrefixCls = `${props.prefixCls}-list`;
    const searchOptions = computed(() => getShowSearchOption(props.showSearch ?? false));
    const filterValue = ref(searchOptions.value.defaultValue ?? '');
    const listBodyRef = ref<{ items?: RenderedItem[] } | null>(null);

    const showSearchBool = computed(
      () => props.showSearch === true || isPlainObject(props.showSearch),
    );

    const internalHandleFilter = (e: { target: { value: string } }) => {
      filterValue.value = e.target.value;
      props.handleFilter(e);
    };
    const internalHandleClear = () => {
      filterValue.value = '';
      props.handleClear();
    };

    const matchFilter = (text: string, item: TransferItem) => {
      const fo = props.filterOption;
      if (isFunction(fo)) {
        return fo(filterValue.value, item, props.direction);
      }
      return text.includes(filterValue.value);
    };

    const renderItem = (item: TransferItem): RenderedItem => {
      const render = props.render ?? defaultRender;
      const renderResult = render(item);
      const isRenderResultPlain = isRenderResultPlainObject(renderResult);
      const renderedEl = (isRenderResultPlain ? renderResult.label : renderResult) as VNodeChild;
      const renderedText = isRenderResultPlain
        ? ((renderResult.value ?? '') as string)
        : getTextFromRenderResult(renderResult, item);
      return {
        item,
        renderedEl,
        renderedText,
      };
    };

    const notFoundContentEle = computed<VNodeChild>(() =>
      Array.isArray(props.notFoundContent)
        ? props.notFoundContent[props.direction === 'left' ? 0 : 1]
        : props.notFoundContent,
    );

    const filtered = computed<[TransferItem[], RenderedItem[]]>(() => {
      const filterItems: TransferItem[] = [];
      const filterRenderItems: RenderedItem[] = [];
      props.dataSource.forEach((item) => {
        const renderedItem = renderItem(item);
        if (filterValue.value && !matchFilter(renderedItem.renderedText, item)) {
          return;
        }
        filterItems.push(item);
        filterRenderItems.push(renderedItem);
      });
      return [filterItems, filterRenderItems];
    });
    const filteredItems = computed(() => filtered.value[0]);
    const filteredRenderItems = computed(() => filtered.value[1]);

    const checkedActiveItems = computed(() =>
      filteredItems.value.filter((item) => props.checkedKeys.includes(item.key) && !item.disabled),
    );

    const checkStatus = computed<'none' | 'all' | 'part'>(() => {
      if (checkedActiveItems.value.length === 0) {
        return 'none';
      }
      const checkedKeysMap = new Map(props.checkedKeys.map((k) => [k, 0]));
      if (filteredItems.value.every((item) => checkedKeysMap.has(item.key) || !!item.disabled)) {
        return 'all';
      }
      return 'part';
    });

    const checkBox = computed(() =>
      h(Checkbox, {
        disabled: !filteredItems.value.some((d) => !d.disabled) || props.disabled,
        checked: checkStatus.value === 'all',
        indeterminate: checkStatus.value === 'part',
        className: `${listPrefixCls}-checkbox`,
        // 有意增强（超出 antd）：头部全选框无可读文本，aria-label 取全选文案
        //（axe `label` 规则要求表单元素有可访问名）。
        'aria-label': props.selectAll ? String(props.selectAll) : 'Select all',
        onChange: () => {
          // Only select enabled items
          props.onItemSelectAll?.(
            getEnabledItemKeys(filteredItems.value),
            checkStatus.value !== 'all',
          );
        },
      }),
    );

    const getSelectAllLabel = (selectedCount: number, totalCount: number): VNodeChild => {
      if (props.selectAllLabel) {
        return isFunction(props.selectAllLabel)
          ? (
              props.selectAllLabel as unknown as (info: {
                selectedCount: number;
                totalCount: number;
              }) => VNodeChild
            )({
              selectedCount,
              totalCount,
            })
          : props.selectAllLabel;
      }
      const unit = totalCount > 1 ? props.itemsUnit : props.itemUnit;
      return `${(selectedCount > 0 ? `${selectedCount}/` : '') + totalCount} ${unit}`;
    };

    // Custom Layout
    const footerDom = computed<VNodeChild | null>(() => {
      const footer = props.footer;
      if (!footer) return null;
      const self = {
        ...props,
        prefixCls: sectionPrefixCls,
      } as unknown as Record<string, unknown>;
      return footer.length < 2 ? footer(self) : footer(self, { direction: props.direction });
    });

    const listFooter = computed(() =>
      footerDom.value
        ? h(
            'div',
            {
              class: [`${listPrefixCls}-footer`, props.classNames?.footer as string | undefined],
              style: props.styles?.footer,
            },
            footerDom.value,
          )
        : null,
    );

    const renderListBody = () => {
      const search = showSearchBool.value
        ? h(
            'div',
            { class: `${listPrefixCls}-body-search-wrapper` },
            h(Search, {
              prefixCls: `${listPrefixCls}-search`,
              onChange: internalHandleFilter,
              handleClear: internalHandleClear,
              placeholder:
                searchOptions.value.placeholder || (props.searchPlaceholder as string | undefined),
              value: filterValue.value,
              disabled: props.disabled,
            } as never),
          )
        : null;

      const listProps: Record<string, unknown> = {
        prefixCls: props.prefixCls,
        dataSource: props.dataSource,
        filteredItems: filteredItems.value,
        filteredRenderItems: filteredRenderItems.value,
        selectedKeys: props.checkedKeys,
        checkedKeys: props.checkedKeys,
        disabled: props.disabled,
        direction: props.direction,
        showRemove: props.showRemove,
        showSearch: props.showSearch,
        searchPlaceholder: props.searchPlaceholder,
        notFoundContent: props.notFoundContent,
        selectAll: props.selectAll,
        deselectAll: props.deselectAll,
        selectCurrent: props.selectCurrent,
        selectInvert: props.selectInvert,
        removeAll: props.removeAll,
        removeCurrent: props.removeCurrent,
        remove: props.remove,
        itemUnit: props.itemUnit,
        itemsUnit: props.itemsUnit,
        pagination: props.pagination,
        onItemSelect: props.onItemSelect,
        onItemSelectAll: props.onItemSelectAll,
        onItemRemove: props.onItemRemove,
        render: props.render,
        renderList: props.renderList,
        footer: props.footer,
        onScroll: props.onScroll,
        handleFilter: props.handleFilter,
        handleClear: props.handleClear,
        filterOption: props.filterOption,
        classNames: props.classNames,
        styles: props.styles,
      };

      let bodyContent = props.renderList
        ? props.renderList({
            ...listProps,
            onItemSelect: (key: TransferKey, check: boolean) =>
              (listProps.onItemSelect as (k: TransferKey, c: boolean) => void)(key, check),
          })
        : null;
      const customize = !!bodyContent;
      if (!customize) {
        // ⚠️ ListBody 渲染 fragment（根是数组）⇒ attrs 无法继承 ⇒ 多余键会触发
        //    `Extraneous non-props attributes` 的 Vue warn（demoTest 对 warn 零容忍）。
        //    只传 ListBody **声明过**的 props，其余（dataSource/locale/搜索文案等）
        //    留在 listProps 里供自定义 renderList 使用。
        bodyContent = h(ListBody, {
          ref: (el: unknown) => {
            listBodyRef.value = el as { items?: RenderedItem[] } | null;
          },
          prefixCls: listPrefixCls,
          classNames: props.classNames,
          styles: props.styles,
          filteredRenderItems: filteredRenderItems.value,
          selectedKeys: props.checkedKeys,
          disabled: props.disabled,
          showRemove: props.showRemove,
          pagination: props.pagination,
          remove: props.remove,
          onItemSelect: props.onItemSelect,
          onItemRemove: props.onItemRemove,
          onScroll: props.onScroll,
        } as never);
      }

      let bodyNode: VNodeChild;
      if (customize) {
        bodyNode = h(
          'div' as never,
          { class: `${listPrefixCls}-body-customize-wrapper` } as never,
          bodyContent as never,
        );
      } else {
        bodyNode = filteredItems.value.length
          ? bodyContent
          : h(
              'div' as never,
              { class: `${listPrefixCls}-body-not-found` } as never,
              notFoundContentEle.value as never,
            );
      }

      return h(
        'div',
        {
          class: [
            `${listPrefixCls}-body`,
            { [`${listPrefixCls}-body-with-search`]: showSearchBool.value },
            props.classNames?.body as string | undefined,
          ],
          style: props.styles?.body,
        },
        [search, bodyNode],
      );
    };

    const dropdownItems = computed(() => {
      if (props.showRemove) {
        const items: { key: string; label?: VNodeChild; onClick: (info: unknown) => void }[] = [];
        // Remove Current Page
        if (props.pagination) {
          items.push({
            key: 'removeCurrent',
            label: props.removeCurrent,
            onClick: () => {
              const pageKeys = getEnabledItemKeys(
                ((listBodyRef.value as { items?: RenderedItem[] } | null)?.items ?? []).map(
                  (entity) => entity.item,
                ),
              );
              props.onItemRemove?.(pageKeys);
            },
          });
        }
        // Remove All
        items.push({
          key: 'removeAll',
          label: props.removeAll,
          onClick: () => {
            props.onItemRemove?.(getEnabledItemKeys(filteredItems.value));
          },
        });
        return items;
      }
      const items: { key: string; label?: VNodeChild; onClick: (info: unknown) => void }[] = [
        {
          key: 'selectAll',
          label: checkStatus.value === 'all' ? props.deselectAll : props.selectAll,
          onClick: () => {
            const keys = getEnabledItemKeys(filteredItems.value);
            props.onItemSelectAll?.(keys, checkStatus.value !== 'all');
          },
        },
      ];
      if (props.pagination) {
        items.push({
          key: 'selectCurrent',
          label: props.selectCurrent,
          onClick: () => {
            const pageItems = (listBodyRef.value as { items?: RenderedItem[] } | null)?.items ?? [];
            props.onItemSelectAll?.(
              getEnabledItemKeys(pageItems.map((entity) => entity.item)),
              true,
            );
          },
        });
      }
      items.push({
        key: 'selectInvert',
        label: props.selectInvert,
        onClick: () => {
          const availablePageItemKeys = getEnabledItemKeys(
            ((listBodyRef.value as { items?: RenderedItem[] } | null)?.items ?? []).map(
              (entity) => entity.item,
            ),
          );
          const checkedKeySet = new Set(props.checkedKeys);
          const newCheckedKeysSet = new Set(checkedKeySet);
          availablePageItemKeys.forEach((key) => {
            if (checkedKeySet.has(key)) {
              newCheckedKeysSet.delete(key);
            } else {
              newCheckedKeysSet.add(key);
            }
          });
          props.onItemSelectAll?.([...newCheckedKeysSet], 'replace');
        },
      });
      return items;
    });

    const dropdown = computed(() =>
      h(
        Dropdown,
        {
          // ⚠️ antd 的 `<Dropdown className>` 落的是**浮层**（classNames.root →
          //    overlayClassName），不是触发器 —— SSR DOM 里看不到这个类，照抄。
          classNames: { root: `${listPrefixCls}-header-dropdown` },
          menu: { items: dropdownItems.value as never },
          disabled: props.disabled,
        },
        () => (isValidIcon(props.selectionsIcon) ? props.selectionsIcon : h(DownOutlined)),
      ),
    );

    return () => {
      const checkAllCheckbox = !props.showRemove && !props.pagination ? checkBox.value : null;

      return h(
        'div',
        {
          class: [
            sectionPrefixCls,
            props.classNames?.section as string | undefined,
            {
              [`${sectionPrefixCls}-with-pagination`]: !!props.pagination,
              [`${sectionPrefixCls}-with-footer`]: !!footerDom.value,
            },
          ],
          // 根 style 是 Vue 原生 attrs
          style: {
            ...((attrs.style as Record<string, string> | undefined) ?? {}),
            ...props.styles?.section,
          },
        },
        [
          h(
            'div',
            {
              class: [`${listPrefixCls}-header`, props.classNames?.header as string | undefined],
              style: props.styles?.header,
            },
            [
              props.showSelectAll ? [checkAllCheckbox, dropdown.value] : null,
              h(
                'span',
                { class: `${listPrefixCls}-header-selected` },
                getSelectAllLabel(
                  checkedActiveItems.value.length,
                  filteredItems.value.length,
                ) as never,
              ),
              h(
                'span' as never,
                {
                  class: [
                    `${listPrefixCls}-header-title`,
                    props.classNames?.title as string | undefined,
                  ],
                  style: props.styles?.title,
                } as never,
                props.titleText as never,
              ),
            ],
          ),
          renderListBody() as never,
          listFooter.value as never,
        ],
      );
    };
  },
});

export type { TransferLocale };
export default Section;
