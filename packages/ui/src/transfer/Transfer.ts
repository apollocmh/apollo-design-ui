/**
 * Transfer —— 穿梭框。
 *
 * 契约来源：antd 6.6.4 `es/transfer/index.js`（375 行，**机械移植**）。
 *
 * 结构：`Section`（左）+ `Actions`（中）+ `Section`（右）。
 * 状态模型：
 *  - 数据拆分：useData（右列按 targetKeys 排序）；
 *  - 勾选：useSelection（左右各自过滤出 source/target 勾选键）；
 *  - 移动：moveTo（过滤禁用项 → 按 targetKeys 重算 → 清对侧勾选 → onChange）；
 *  - oneWay：右列渲染删除按钮（onItemRemove）+ 隐藏向左按钮 + 下拉换 removeAll 组。
 */

import { useLocale } from '@apollo-design/locale';
import { isFunction } from '@apollo-design/utils';
import { computed, defineComponent, h, type PropType, ref, type VNodeChild } from 'vue';
import { clsx } from '../_internal/clsx';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { DefaultRenderEmpty } from '../config-provider/default-render-empty';
import { useDisabled } from '../config-provider/disabled-context';
import { getStatusClassNames } from '../space/statusUtils';
import Actions from './Actions';
import type {
  PaginationType,
  SelectAllLabelRender,
  TransferDirection,
  TransferItem,
  TransferKey,
  TransferProps,
} from './interface';
import Section from './Section';
import { useData } from './use-data';
import { useMultipleSelect } from './use-multiple-select';
import { useSelection } from './use-selection';

const Transfer = defineComponent({
  name: 'ATransfer',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    classNames: { type: Object as PropType<TransferProps['classNames']>, default: undefined },
    styles: { type: Object as PropType<TransferProps['styles']>, default: undefined },
    listStyle: {
      type: [Object, Function] as PropType<TransferProps['listStyle']>,
      default: undefined,
    },
    operationStyle: { type: Object as PropType<Record<string, string>>, default: undefined },
    operations: { type: Array as PropType<TransferProps['operations']>, default: undefined },
    actions: { type: Array as PropType<TransferProps['actions']>, default: undefined },
    dataSource: { type: Array as PropType<TransferItem[]>, default: undefined },
    targetKeys: { type: Array as PropType<TransferKey[]>, default: undefined },
    selectedKeys: { type: Array as PropType<TransferKey[]>, default: undefined },
    selectAllLabels: { type: Array as PropType<SelectAllLabelRender[]>, default: () => [] },
    locale: { type: Object as PropType<TransferProps['locale']>, default: undefined },
    titles: { type: Array as PropType<TransferProps['titles']>, default: undefined },
    disabled: { type: Boolean, default: undefined },
    showSearch: {
      type: [Boolean, Object] as PropType<TransferProps['showSearch']>,
      default: undefined,
    },
    showSelectAll: { type: Boolean, default: undefined },
    oneWay: { type: Boolean, default: undefined },
    pagination: { type: [Boolean, Object] as PropType<PaginationType>, default: undefined },
    status: { type: String as PropType<'error' | 'warning'>, default: undefined },
    selectionsIcon: {
      type: null as unknown as PropType<TransferProps['selectionsIcon']>,
      default: undefined,
    },
    filterOption: { type: Function as PropType<TransferProps['filterOption']>, default: undefined },
    render: { type: Function as PropType<TransferProps['render']>, default: undefined },
    footer: { type: Function as PropType<TransferProps['footer']>, default: undefined },
    renderList: { type: Function as PropType<TransferProps['children']>, default: undefined },
    rowKey: { type: Function as PropType<TransferProps['rowKey']>, default: undefined },
    onScroll: { type: Function as PropType<TransferProps['onScroll']>, default: undefined },
    onChange: { type: Function as PropType<TransferProps['onChange']>, default: undefined },
    onSearch: { type: Function as PropType<TransferProps['onSearch']>, default: undefined },
    onSelectChange: {
      type: Function as PropType<TransferProps['onSelectChange']>,
      default: undefined,
    },
  },
  setup(props, { attrs, expose }) {
    const config = useComponentConfig('transfer') as unknown as {
      getPrefixCls: (suffix?: string, custom?: string) => string;
      className?: string;
      style?: Record<string, string>;
      classNames?: TransferProps['classNames'];
      styles?: TransferProps['styles'];
      selectionsIcon?: TransferProps['selectionsIcon'];
    };
    const direction = useDirection();
    const contextDisabled = useDisabled();
    const mergedDisabled = computed(() => props.disabled ?? contextDisabled.value);
    const prefixCls = computed(() => config.getPrefixCls('transfer', props.prefixCls));
    const mergedActions = computed(() => props.actions ?? props.operations ?? []);
    const isRtl = computed(() => direction.value === 'rtl');

    // Fill record with `key`
    const [mergedDataSource, leftDataSource, rightDataSource] = useData(
      computed(() => props.dataSource),
      computed(() => props.rowKey),
      computed(() => props.targetKeys),
    );

    // Get direction selected keys
    const [sourceSelectedKeys, targetSelectedKeys, setSourceSelectedKeys, setTargetSelectedKeys] =
      useSelection(
        leftDataSource,
        rightDataSource,
        computed(() => props.selectedKeys),
      );

    const [leftMultipleSelect, updateLeftPrevSelectedIndex] = useMultipleSelect(
      (item: TransferItem) => item.key,
    );
    const [rightMultipleSelect, updateRightPrevSelectedIndex] = useMultipleSelect(
      (item: TransferItem) => item.key,
    );

    const setStateKeys = (
      directionKey: TransferDirection,
      keys: TransferKey[] | ((prevKeys: TransferKey[]) => TransferKey[]),
    ) => {
      if (directionKey === 'left') {
        setSourceSelectedKeys(isFunction(keys) ? keys(sourceSelectedKeys.value || []) : keys);
      } else {
        setTargetSelectedKeys(isFunction(keys) ? keys(targetSelectedKeys.value || []) : keys);
      }
    };

    const setPrevSelectedIndex = (directionKey: TransferDirection, value: number | null) => {
      const update =
        directionKey === 'left' ? updateLeftPrevSelectedIndex : updateRightPrevSelectedIndex;
      update(value);
    };

    const handleSelectChange = (directionKey: TransferDirection, holder: TransferKey[]) => {
      if (directionKey === 'left') {
        props.onSelectChange?.(holder, targetSelectedKeys.value);
      } else {
        props.onSelectChange?.(sourceSelectedKeys.value, holder);
      }
    };

    const getTitles = (transferLocale: { titles?: VNodeChild[] }) =>
      props.titles ?? transferLocale.titles ?? [];

    const handleLeftScroll = (e: Event) => {
      props.onScroll?.('left', e);
    };
    const handleRightScroll = (e: Event) => {
      props.onScroll?.('right', e);
    };

    const groupDisabledKeysMap = (dataSource: TransferItem[]) => {
      const map = new Set<TransferKey>();
      dataSource.forEach(({ disabled, key }) => {
        if (disabled) {
          map.add(key);
        }
      });
      return map;
    };

    const moveTo = (directionKey: TransferDirection) => {
      const moveKeys =
        directionKey === 'right' ? sourceSelectedKeys.value : targetSelectedKeys.value;
      const dataSourceDisabledKeysMap = groupDisabledKeysMap(mergedDataSource.value);
      // filter the disabled options
      const newMoveKeys = moveKeys.filter((key) => !dataSourceDisabledKeysMap.has(key));
      const newMoveKeysMap = new Map(newMoveKeys.map((k, i) => [k, i] as const));
      // move items to target box
      const tks = props.targetKeys ?? [];
      const newTargetKeys =
        directionKey === 'right'
          ? newMoveKeys.concat(tks)
          : tks.filter((targetKey) => !newMoveKeysMap.has(targetKey));
      // empty checked keys
      const oppositeDirection: TransferDirection = directionKey === 'right' ? 'left' : 'right';
      setStateKeys(oppositeDirection, []);
      handleSelectChange(oppositeDirection, []);
      props.onChange?.(newTargetKeys, directionKey, newMoveKeys);
    };

    const moveToLeft = () => {
      moveTo('left');
      setPrevSelectedIndex('left', null);
    };
    const moveToRight = () => {
      moveTo('right');
      setPrevSelectedIndex('right', null);
    };

    const onItemSelectAll = (
      directionKey: TransferDirection,
      keys: TransferKey[],
      checkAll: boolean | 'replace',
    ) => {
      // ⚠️ 上游在 setStateKeys 的函数形态里合并「该方向」的前值 —— 这里的 prevKeys
      //    必须按方向取（左列勾选的合并基准是 sourceSelectedKeys，右列是 targetSelectedKeys）。
      const prevKeys =
        directionKey === 'left' ? sourceSelectedKeys.value : targetSelectedKeys.value;
      let mergedCheckedKeys: TransferKey[];
      if (checkAll === 'replace') {
        mergedCheckedKeys = keys;
      } else if (checkAll) {
        // Merge current keys with origin key
        mergedCheckedKeys = Array.from(new Set([...prevKeys, ...keys]));
      } else {
        const selectedKeysMap = new Map(keys.map((k) => [k, 0] as const));
        // Remove current keys from origin keys
        mergedCheckedKeys = prevKeys.filter((key) => !selectedKeysMap.has(key));
      }
      setStateKeys(directionKey, mergedCheckedKeys);
      handleSelectChange(directionKey, mergedCheckedKeys);
      setPrevSelectedIndex(directionKey, null);
    };
    const onLeftItemSelectAll = (keys: TransferKey[], checkAll: boolean | 'replace') =>
      onItemSelectAll('left', keys, checkAll);
    const onRightItemSelectAll = (keys: TransferKey[], checkAll: boolean | 'replace') =>
      onItemSelectAll('right', keys, checkAll);

    const leftFilter = (e: { target: { value: string } }) =>
      props.onSearch?.('left', e.target.value);
    const rightFilter = (e: { target: { value: string } }) =>
      props.onSearch?.('right', e.target.value);
    const handleLeftClear = () => props.onSearch?.('left', '');
    const handleRightClear = () => props.onSearch?.('right', '');

    const handleSingleSelect = (
      directionKey: TransferDirection,
      holder: Set<TransferKey>,
      selectedKey: TransferKey,
      checked: boolean,
      currentSelectedIndex: number,
    ) => {
      const isSelected = holder.has(selectedKey);
      if (isSelected) {
        holder.delete(selectedKey);
        setPrevSelectedIndex(directionKey, null);
      }
      if (checked) {
        holder.add(selectedKey);
        setPrevSelectedIndex(directionKey, currentSelectedIndex);
      }
    };

    const handleMultipleSelect = (
      directionKey: TransferDirection,
      data: TransferItem[],
      holder: Set<TransferKey>,
      currentSelectedIndex: number,
    ) => {
      const multipleSelect = directionKey === 'left' ? leftMultipleSelect : rightMultipleSelect;
      multipleSelect(currentSelectedIndex, data, holder);
    };

    const onItemSelect = (
      directionKey: TransferDirection,
      selectedKey: TransferKey,
      checked: boolean,
      multiple?: boolean,
    ) => {
      const holder = directionKey === 'left' ? sourceSelectedKeys.value : targetSelectedKeys.value;
      const holderSet = new Set(holder);
      const data = (directionKey === 'left' ? leftDataSource.value : rightDataSource.value).filter(
        (item) => !item.disabled,
      );
      const currentSelectedIndex = data.findIndex((item) => item.key === selectedKey);
      // multiple select by hold down the shift key
      if (multiple && holder.length > 0) {
        handleMultipleSelect(directionKey, data, holderSet, currentSelectedIndex);
      } else {
        handleSingleSelect(directionKey, holderSet, selectedKey, checked, currentSelectedIndex);
      }
      const holderArr = Array.from(holderSet);
      handleSelectChange(directionKey, holderArr);
      if (!props.selectedKeys) {
        setStateKeys(directionKey, holderArr);
      }
    };

    const onLeftItemSelect = (
      selectedKey: TransferKey,
      checked: boolean,
      e?: { shiftKey?: boolean },
    ) => {
      onItemSelect('left', selectedKey, checked, e?.shiftKey);
    };
    const onRightItemSelect = (
      selectedKey: TransferKey,
      checked: boolean,
      e?: { shiftKey?: boolean },
    ) => {
      onItemSelect('right', selectedKey, checked, e?.shiftKey);
    };
    const onRightItemRemove = (keys: TransferKey[]) => {
      setStateKeys('right', []);
      props.onChange?.(
        (props.targetKeys ?? []).filter((key) => !keys.includes(key)),
        'left',
        [...keys],
      );
    };

    const handleListStyle = (listDirection: TransferDirection) => {
      if (isFunction(props.listStyle)) {
        return props.listStyle({ direction: listDirection });
      }
      return props.listStyle || {};
    };

    const mergedStatus = computed(() => props.status);
    // ⚠️ 上游：`!children && pagination`（自定义列表面板不支持内嵌分页，dev 告警）；
    //    本仓的自定义面板入口是 `renderList` 函数 prop。
    const mergedPagination = computed<PaginationType | false>(
      () => !props.renderList && !!props.pagination && props.pagination,
    );

    const leftActive = computed(() =>
      rightDataSource.value.some(
        (data) =>
          data.key !== null &&
          data.key !== undefined &&
          targetSelectedKeys.value.includes(data.key) &&
          !data.disabled,
      ),
    );
    const rightActive = computed(() =>
      leftDataSource.value.some(
        (data) =>
          data.key !== null &&
          data.key !== undefined &&
          sourceSelectedKeys.value.includes(data.key) &&
          !data.disabled,
      ),
    );

    // ---- 语义合并 ----
    const mergedSemantic = useMergeSemantic<
      TransferProps,
      NonNullable<TransferProps['classNames']>,
      NonNullable<TransferProps['styles']>
    >(
      [computed(() => config.classNames), computed(() => props.classNames)],
      [
        computed(() => config.styles),
        computed(() => semanticRootStyle(config.style)),
        computed(() => props.styles),
        // 根 style 是 Vue 原生 attrs；仍走语义 root 通道（与上游落点一致）
        computed(() => semanticRootStyle(attrs.style as Record<string, string> | undefined)),
      ],
      props as never,
    );

    const cls = computed(() =>
      clsx(
        prefixCls.value,
        {
          [`${prefixCls.value}-disabled`]: mergedDisabled.value,
          [`${prefixCls.value}-customize-list`]: !!props.renderList,
          [`${prefixCls.value}-rtl`]: isRtl.value,
        },
        getStatusClassNames(prefixCls.value, mergedStatus.value, false),
        config.className,
        // 调用方原生 class（位置与原先的 props.className/rootClassName 一致）
        attrs.class as string | undefined,
        (mergedSemantic.classNames.value as Record<string, string | undefined>).root,
      ),
    );

    // Locale
    const [contextLocale] = useLocale('Transfer');
    const listLocale = computed(() => ({
      ...contextLocale,
      notFoundContent: h(DefaultRenderEmpty, { componentName: 'Transfer' }),
      ...(props.locale ?? {}),
    }));

    const nativeElementRef = ref<HTMLElement | null>(null);
    expose({
      nativeElement: nativeElementRef,
      focus: () => {},
      blur: () => {},
    });

    // ── source / target 方向子结构合并（2026-10-04 补齐，antd 逐字）──────────────
    // antd（index.js:250-265）：Section 收到的 classNames/styles 是「全集的浅拷贝 +
    // 每个区块键再叠上对应方向子结构」—— classNames 用 clsx 拼接、styles 用对象合并。
    const SECTION_SEMANTIC_KEYS = [
      'section',
      'header',
      'title',
      'body',
      'list',
      'item',
      'itemIcon',
      'itemContent',
      'footer',
    ] as const;

    const sectionClassNames = (dir: 'source' | 'target') => {
      const all = mergedSemantic.classNames.value as Record<string, unknown>;
      const dirCls = all[dir] as Record<string, string | undefined> | undefined;
      const out: Record<string, unknown> = { ...all };
      for (const key of SECTION_SEMANTIC_KEYS) {
        out[key] = clsx(all[key] as string | undefined, dirCls?.[key]);
      }
      return out;
    };
    const sectionStyles = (dir: 'source' | 'target') => {
      const all = mergedSemantic.styles.value as Record<string, unknown>;
      const dirStyles = all[dir] as Record<string, Record<string, string> | undefined> | undefined;
      const out: Record<string, unknown> = { ...all };
      for (const key of SECTION_SEMANTIC_KEYS) {
        out[key] = {
          ...((all[key] as Record<string, string> | undefined) ?? {}),
          ...(dirStyles?.[key] ?? {}),
        };
      }
      return out;
    };

    const sectionBind = (listDirection: TransferDirection, selectAllLabelIndex: number) => {
      const locale = listLocale.value;
      // ⚠️ direction 键与列表方向对应：left 列吃 source、right 列吃 target
      //（antd：sourceSectionClassNames 给左列）。rtl 下的视觉翻转不影响语义键。
      const semanticDir = listDirection === 'left' ? 'source' : 'target';
      return {
        prefixCls: prefixCls.value,
        style: handleListStyle(listDirection),
        classNames: sectionClassNames(semanticDir),
        styles: sectionStyles(semanticDir),
        dataSource: listDirection === 'left' ? leftDataSource.value : rightDataSource.value,
        filterOption: props.filterOption,
        checkedKeys: listDirection === 'left' ? sourceSelectedKeys.value : targetSelectedKeys.value,
        handleFilter: listDirection === 'left' ? leftFilter : rightFilter,
        handleClear: listDirection === 'left' ? handleLeftClear : handleRightClear,
        onItemSelect: listDirection === 'left' ? onLeftItemSelect : onRightItemSelect,
        onItemSelectAll: listDirection === 'left' ? onLeftItemSelectAll : onRightItemSelectAll,
        onItemRemove: onRightItemRemove,
        render: props.render,
        showSearch: props.showSearch,
        renderList: props.renderList,
        footer: props.footer,
        onScroll: listDirection === 'left' ? handleLeftScroll : handleRightScroll,
        disabled: mergedDisabled.value,
        direction: isRtl.value ? (listDirection === 'left' ? 'right' : 'left') : listDirection,
        showSelectAll: props.showSelectAll,
        selectAllLabel: props.selectAllLabels?.[selectAllLabelIndex],
        showRemove: listDirection === 'right' ? !!props.oneWay : false,
        pagination: mergedPagination.value,
        selectionsIcon: props.selectionsIcon ?? config.selectionsIcon,
        titleText: getTitles(locale)[selectAllLabelIndex === 0 ? 0 : 1],
        searchPlaceholder: locale.searchPlaceholder,
        notFoundContent: locale.notFoundContent,
        selectAll: locale.selectAll,
        deselectAll: locale.deselectAll,
        selectCurrent: locale.selectCurrent,
        selectInvert: locale.selectInvert,
        removeAll: locale.removeAll,
        removeCurrent: locale.removeCurrent,
        remove: locale.remove,
        itemsUnit: locale.itemsUnit,
        itemUnit: locale.itemUnit,
      } as never;
    };

    return () => [
      h(
        'div',
        {
          ref: nativeElementRef,
          ...(attrs as Record<string, unknown>),
          class: cls.value,
          style: (mergedSemantic.styles.value as Record<string, Record<string, string>>).root,
        },
        [
          h(Section, sectionBind('left', 0)),
          h(Actions, {
            class: clsx(
              `${prefixCls.value}-actions`,
              (mergedSemantic.classNames.value as Record<string, string | undefined>).actions,
            ),
            rightActive: rightActive.value,
            moveToRight,
            leftActive: leftActive.value,
            moveToLeft,
            actions: mergedActions.value,
            style: {
              ...props.operationStyle,
              ...(mergedSemantic.styles.value as Record<string, Record<string, string>>).actions,
            },
            disabled: mergedDisabled.value,
            direction: direction.value,
            oneWay: props.oneWay,
          }),
          h(Section, sectionBind('right', 1)),
        ],
      ),
    ];
  },
});

export type { TransferProps };
export default Transfer;
