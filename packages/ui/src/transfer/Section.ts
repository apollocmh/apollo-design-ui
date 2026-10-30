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
 *  - 主体：默认 ListBody / 自定义 #list 插槽/ not-found 兜底
 *    （`notFoundContent` 支持数组按方向取值）；
 *  - footer：#footer 作用域插槽。
 */

import { DownOutlined } from '@apollo-design/icons';
import { isFunction, isNumber, isPlainObject, isString } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  type PropType,
  ref,
  type SlotsType,
  type VNodeChild,
} from 'vue';
import Checkbox from '../checkbox/Checkbox';
import Dropdown from '../dropdown/Dropdown';
import type {
  PaginationType,
  RenderedItem,
  TransferDirection,
  TransferItem,
  TransferItemSlotProps,
  TransferKey,
  TransferListSlotProps,
  TransferLocale,
  TransferSemanticClassNames,
  TransferSemanticStyles,
  TransferSlots,
} from './interface';
import ListBody from './ListBody';
import Search, { searchEventValue } from './Search';
import { useMultipleSelect } from './use-multiple-select';

function getEnabledItemKeys(items: TransferItem[]): TransferKey[] {
  return items.reduce<TransferKey[]>((keys, data) => {
    if (!data.disabled) {
      keys.push(data.key);
    }
    return keys;
  }, []);
}

function getItemText(item: TransferItem): string {
  for (const value of [item.title, item.key]) {
    if (isString(value) || isNumber(value)) return String(value);
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
  inheritAttrs: false,
  slots: Object as SlotsType<TransferSlots>,
  props: {
    prefixCls: { type: String, required: true },
    classNames: { type: Object as PropType<TransferSemanticClassNames>, default: undefined },
    styles: { type: Object as PropType<TransferSemanticStyles>, default: undefined },
    dataSource: { type: Array as PropType<TransferItem[]>, default: () => [] },
    titleText: {
      type: [String, Number, Boolean, Object, Array] as PropType<VNodeChild>,
      default: '',
    },
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
      type: [String, Number, Boolean, Object, Array] as PropType<VNodeChild | VNodeChild[]>,
      default: undefined,
    },
    selectAll: {
      type: [String, Number, Boolean, Object, Array] as PropType<VNodeChild>,
      default: undefined,
    },
    deselectAll: {
      type: [String, Number, Boolean, Object, Array] as PropType<VNodeChild>,
      default: undefined,
    },
    selectCurrent: {
      type: [String, Number, Boolean, Object, Array] as PropType<VNodeChild>,
      default: undefined,
    },
    selectInvert: {
      type: [String, Number, Boolean, Object, Array] as PropType<VNodeChild>,
      default: undefined,
    },
    removeAll: {
      type: [String, Number, Boolean, Object, Array] as PropType<VNodeChild>,
      default: undefined,
    },
    removeCurrent: {
      type: [String, Number, Boolean, Object, Array] as PropType<VNodeChild>,
      default: undefined,
    },
    showSelectAll: { type: Boolean, default: true },
    showRemove: { type: Boolean, default: undefined },
    pagination: { type: [Boolean, Object] as PropType<PaginationType>, default: undefined },
    direction: { type: String as PropType<TransferDirection>, required: true },
    itemsUnit: { type: String, default: undefined },
    itemUnit: { type: String, default: undefined },
    remove: { type: String, default: undefined },
    selectAllLabel: {
      type: [String, Number, Boolean, Object, Array] as PropType<VNodeChild>,
      default: undefined,
    },
    selectionsIcon: {
      type: [String, Number, Boolean, Object, Array] as PropType<VNodeChild>,
      default: undefined,
    },
    filterOption: {
      type: Function as PropType<
        (inputValue: string, item: TransferItem, direction: TransferDirection) => boolean
      >,
      default: undefined,
    },
  },
  emits: {
    itemSelectAll: (_keys: TransferKey[], _check: boolean | 'replace') => true,
    itemSelect: (_key: TransferKey, _check: boolean, _event?: { shiftKey?: boolean }) => true,
    itemRemove: (_keys: TransferKey[]) => true,
    filter: (_event: Event) => true,
    clear: () => true,
    scroll: (_event: Event) => true,
  },
  setup(props, { attrs, slots, emit }) {
    // 🚨 必须是 **computed**（Issue #15.3）：此前是 setup 期普通字符串，父级
    //    （Transfer）动态切 `prefixCls` 后这里仍是旧值 ⇒ Section/ListBody/ListItem
    //    整棵子树继续渲染旧前缀类名（实测：根 `custom` 已换、子级还挂 `apollo-section`）。
    //    这些字符串被多个 computed（checkBox / footerDom / search / dropdown）和渲染函数
    //    读取 ⇒ 包成 computed 后依赖链自动贯通。
    const sectionPrefixCls = computed(() => `${props.prefixCls}-section`);
    const listPrefixCls = computed(() => `${props.prefixCls}-list`);
    const searchOptions = computed(() => getShowSearchOption(props.showSearch ?? false));
    const filterValue = ref(searchOptions.value.defaultValue ?? '');
    const listBodyRef = ref<InstanceType<typeof ListBody> | null>(null);

    const showSearchBool = computed(
      () => props.showSearch === true || isPlainObject(props.showSearch),
    );

    const internalHandleFilter = (event: Event) => {
      const value = searchEventValue(event);
      if (value === undefined) return;
      filterValue.value = value;
      emit('filter', event);
    };
    const internalHandleClear = () => {
      filterValue.value = '';
      emit('clear');
    };

    const matchFilter = (text: string, item: TransferItem) => {
      const fo = props.filterOption;
      if (isFunction(fo)) {
        return fo(filterValue.value, item, props.direction);
      }
      return text.includes(filterValue.value);
    };

    const renderItem = (item: TransferItem): RenderedItem => {
      const renderedText = getItemText(item);
      return { item, renderedEl: renderedText, renderedText };
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
    const [multipleSelect, setAnchor] = useMultipleSelect((item) => item.key);
    const selectAllItems = (keys: TransferKey[], check: boolean | 'replace') => {
      if (props.disabled) return;
      setAnchor(null);
      emit('itemSelectAll', keys, check);
    };
    const selectItem = (key: TransferKey, selected: boolean, event?: { shiftKey?: boolean }) => {
      const enabled = filteredItems.value.filter((item) => !item.disabled);
      const currentIndex = enabled.findIndex((item) => item.key === key);
      if (props.disabled || currentIndex < 0) return;
      if (event?.shiftKey && props.checkedKeys.length) {
        const selectedKeys = new Set(props.checkedKeys);
        multipleSelect(currentIndex, enabled, selectedKeys);
        emit('itemSelectAll', [...selectedKeys], 'replace');
      } else {
        setAnchor(selected ? key : null);
        emit('itemSelect', key, selected, event);
      }
    };
    const removeItems = (keys: TransferKey[]) => {
      if (props.disabled || !props.showRemove) return;
      const enabled = new Set(getEnabledItemKeys(filteredItems.value));
      emit(
        'itemRemove',
        keys.filter((key) => enabled.has(key)),
      );
    };

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
        // Checkbox 已迁移到「根 class 走原生 attrs」⇒ 这里用 `class`
        class: `${listPrefixCls.value}-checkbox`,
        // 有意增强（超出 antd）：头部全选框无可读文本，aria-label 取全选文案
        //（axe `label` 规则要求表单元素有可访问名）。
        'aria-label': props.selectAll ? String(props.selectAll) : 'Select all',
        onChange: () => {
          // Only select enabled items
          selectAllItems(getEnabledItemKeys(filteredItems.value), checkStatus.value !== 'all');
        },
      }),
    );

    const getSelectAllLabel = (selectedCount: number, totalCount: number): VNodeChild => {
      if (slots.selectAllLabel) {
        return slots.selectAllLabel({ direction: props.direction, selectedCount, totalCount });
      }
      if (props.selectAllLabel !== undefined) return props.selectAllLabel;
      const unit = totalCount > 1 ? props.itemsUnit : props.itemUnit;
      return `${(selectedCount > 0 ? `${selectedCount}/` : '') + totalCount} ${unit}`;
    };

    // Content slots are read during render, never cached in computed.
    const renderFooter = (): VNodeChild =>
      slots.footer
        ? h(
            'div',
            {
              class: [`${listPrefixCls.value}-footer`, props.classNames?.footer],
              style: props.styles?.footer,
            },
            [
              slots.footer({
                direction: props.direction,
                selectedKeys: props.checkedKeys,
                totalCount: props.dataSource.length,
              }),
            ],
          )
        : null;

    const renderListBody = () => {
      const search = showSearchBool.value
        ? h(
            'div',
            { class: `${listPrefixCls.value}-body-search-wrapper` },
            h(Search, {
              prefixCls: `${listPrefixCls.value}-search`,
              onChange: internalHandleFilter,
              onClear: internalHandleClear,
              placeholder: searchOptions.value.placeholder || props.searchPlaceholder,
              value: filterValue.value,
              disabled: props.disabled,
            }),
          )
        : null;

      const listProps: TransferListSlotProps = {
        direction: props.direction,
        filteredItems: filteredItems.value,
        selectedKeys: props.checkedKeys,
        disabled: !!props.disabled,
        onItemSelect: selectItem,
        onItemSelectAll: (keys, selected) => {
          const enabled = new Set(getEnabledItemKeys(filteredItems.value));
          selectAllItems(
            keys.filter((key) => enabled.has(key)),
            selected,
          );
        },
        onItemRemove: removeItems,
        onScroll: (event) => emit('scroll', event),
      };
      const customize = !!slots.list;
      let bodyContent = slots.list?.(listProps);
      if (!customize) {
        // ⚠️ ListBody 渲染 fragment（根是数组）⇒ attrs 无法继承 ⇒ 多余键会触发
        //    `Extraneous non-props attributes` 的 Vue warn（demoTest 对 warn 零容忍）。
        //    只传 ListBody **声明过**的 props，其余（dataSource/locale/搜索文案等）
        //    自定义列表的作用域只提供明确的 TransferListSlotProps。
        bodyContent = h(
          ListBody,
          {
            ref: listBodyRef,
            prefixCls: listPrefixCls.value,
            classNames: props.classNames,
            styles: props.styles,
            filteredRenderItems: filteredRenderItems.value,
            selectedKeys: props.checkedKeys,
            disabled: props.disabled,
            showRemove: props.showRemove,
            pagination: props.pagination,
            remove: props.remove,
            onItemSelect: selectItem,
            onItemRemove: removeItems,
            onScroll: (event: Event) => emit('scroll', event),
          },
          slots.item
            ? {
                item: (scope: Omit<TransferItemSlotProps, 'direction'>) =>
                  slots.item?.({ ...scope, direction: props.direction }),
              }
            : undefined,
        );
      }

      let bodyNode: VNodeChild;
      if (customize) {
        bodyNode = h('div', { class: `${listPrefixCls.value}-body-customize-wrapper` }, [
          bodyContent,
        ]);
      } else {
        bodyNode = filteredItems.value.length
          ? bodyContent
          : h('div', { class: `${listPrefixCls.value}-body-not-found` }, [
              notFoundContentEle.value,
            ]);
      }

      return h(
        'div',
        {
          class: [
            `${listPrefixCls.value}-body`,
            { [`${listPrefixCls.value}-body-with-search`]: showSearchBool.value },
            props.classNames?.body,
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
                (listBodyRef.value?.items ?? []).map((entity) => entity.item),
              );
              removeItems(pageKeys);
            },
          });
        }
        // Remove All
        items.push({
          key: 'removeAll',
          label: props.removeAll,
          onClick: () => {
            removeItems(filteredItems.value.map((item) => item.key));
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
            selectAllItems(keys, checkStatus.value !== 'all');
          },
        },
      ];
      if (props.pagination) {
        items.push({
          key: 'selectCurrent',
          label: props.selectCurrent,
          onClick: () => {
            const pageItems = listBodyRef.value?.items ?? [];
            selectAllItems(getEnabledItemKeys(pageItems.map((entity) => entity.item)), true);
          },
        });
      }
      items.push({
        key: 'selectInvert',
        label: props.selectInvert,
        onClick: () => {
          const availablePageItemKeys = getEnabledItemKeys(
            (listBodyRef.value?.items ?? []).map((entity) => entity.item),
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
          selectAllItems([...newCheckedKeysSet], 'replace');
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
          classNames: { root: `${listPrefixCls.value}-header-dropdown` },
          menu: { items: dropdownItems.value },
          trigger: ['hover', 'click'],
          disabled: props.disabled,
        },
        () =>
          h(
            'button',
            {
              type: 'button',
              class: `${listPrefixCls.value}-header-dropdown`,
              disabled: props.disabled,
              'aria-label': props.showRemove
                ? typeof props.removeAll === 'string'
                  ? props.removeAll
                  : 'Remove items'
                : typeof props.selectAll === 'string'
                  ? props.selectAll
                  : 'Select items',
              'aria-haspopup': 'menu',
            },
            [isValidIcon(props.selectionsIcon) ? props.selectionsIcon : h(DownOutlined)],
          ),
      ),
    );

    return () => {
      const checkAllCheckbox = !props.showRemove && !props.pagination ? checkBox.value : null;

      return h(
        'div',
        {
          ...attrs,
          class: [
            sectionPrefixCls.value,
            props.classNames?.section,
            attrs.class,
            {
              [`${sectionPrefixCls.value}-with-pagination`]: !!props.pagination,
              [`${sectionPrefixCls.value}-with-footer`]: !!slots.footer,
            },
          ],
          // 根 style 是 Vue 原生 attrs
          style: [props.styles?.section, attrs.style],
        },
        [
          h(
            'div',
            {
              class: [`${listPrefixCls.value}-header`, props.classNames?.header],
              style: props.styles?.header,
            },
            [
              props.showSelectAll ? [checkAllCheckbox, dropdown.value] : null,
              h('span', { class: `${listPrefixCls.value}-header-selected` }, [
                getSelectAllLabel(checkedActiveItems.value.length, filteredItems.value.length),
              ]),
              h(
                'span',
                {
                  class: [`${listPrefixCls.value}-header-title`, props.classNames?.title],
                  style: props.styles?.title,
                },
                [props.titleText],
              ),
            ],
          ),
          renderListBody(),
          renderFooter(),
        ],
      );
    };
  },
});

export type { TransferLocale };
export default Section;
