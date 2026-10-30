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
import { isFunction, useControlledValue } from '@apollo-design/utils';
import {
  type CSSProperties,
  computed,
  defineComponent,
  h,
  type PropType,
  ref,
  type SlotsType,
  type VNodeChild,
} from 'vue';
import { clsx } from '../_internal/clsx';
import { semanticRootStyle, styleAttrs, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { DefaultRenderEmpty } from '../config-provider/default-render-empty';
import { useDisabled } from '../config-provider/disabled-context';
import { getStatusClassNames } from '../space/statusUtils';
import Actions from './Actions';
import type {
  PaginationType,
  TransferDirection,
  TransferItem,
  TransferKey,
  TransferProps,
  TransferSemanticClassNames,
  TransferSemanticStyles,
  TransferSlots,
} from './interface';
import { searchEventValue } from './Search';
import Section from './Section';
import { useData } from './use-data';
import { useSelection } from './use-selection';
import { useTransferTheme } from './use-transfer-theme';

/** Name the runtime schema so published constructors do not expose Vue's private PropOptions. */
export interface TransferSelectAllLabelsSchema {
  type?: PropType<NonNullable<TransferProps['selectAllLabels']>> | null;
  default: () => NonNullable<TransferProps['selectAllLabels']>;
  validator: (value: unknown) => boolean;
}

// ArrayConstructor alone describes an unbounded array. Keep the public tuple
// and its real array/arity validator at this single prop boundary.
const selectAllLabelsProp: TransferSelectAllLabelsSchema = {
  type: null,
  default: () => [],
  validator: (value: unknown) => Array.isArray(value) && value.length <= 2,
};

const Transfer = defineComponent({
  name: 'ATransfer',
  inheritAttrs: false,
  slots: Object as SlotsType<TransferSlots>,
  props: {
    prefixCls: { type: String, default: undefined },
    classNames: { type: Object as PropType<TransferProps['classNames']>, default: undefined },
    styles: { type: Object as PropType<TransferProps['styles']>, default: undefined },
    listStyle: {
      type: [Object, Function] as PropType<TransferProps['listStyle']>,
      default: undefined,
    },
    operationStyle: { type: Object as PropType<CSSProperties>, default: undefined },
    operations: { type: Array as PropType<TransferProps['operations']>, default: undefined },
    actions: { type: Array as PropType<TransferProps['actions']>, default: undefined },
    dataSource: { type: Array as PropType<TransferItem[]>, default: undefined },
    targetKeys: { type: Array as PropType<TransferKey[]>, default: undefined },
    selectedKeys: { type: Array as PropType<TransferKey[]>, default: undefined },
    selectAllLabels: selectAllLabelsProp,
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
      type: [String, Number, Boolean, Object, Array] as PropType<TransferProps['selectionsIcon']>,
      default: undefined,
    },
    filterOption: { type: Function as PropType<TransferProps['filterOption']>, default: undefined },
    rowKey: { type: Function as PropType<TransferProps['rowKey']>, default: undefined },
  },
  emits: {
    'update:targetKeys': (_keys: TransferKey[]) => true,
    'update:selectedKeys': (_keys: TransferKey[]) => true,
    change: (_keys: TransferKey[], _direction: TransferDirection, _moveKeys: TransferKey[]) => true,
    selectChange: (_source: TransferKey[], _target: TransferKey[]) => true,
    search: (_direction: TransferDirection, _value: string) => true,
    scroll: (_direction: TransferDirection, _event: Event) => true,
  },
  setup(props, { attrs, expose, slots, emit }) {
    const config = useComponentConfig<{
      className?: string;
      style?: CSSProperties;
      classNames?: TransferProps['classNames'];
      styles?: TransferProps['styles'];
      selectionsIcon?: TransferProps['selectionsIcon'];
    }>('transfer');
    const direction = useDirection();
    const contextDisabled = useDisabled();
    const mergedDisabled = computed(() => props.disabled ?? contextDisabled.value);
    const prefixCls = computed(() => config.getPrefixCls('transfer', props.prefixCls));
    const themeStyle = useTransferTheme(() => prefixCls.value);
    const mergedActions = computed(() => props.actions ?? props.operations ?? []);
    const isRtl = computed(() => direction.value === 'rtl');

    const [targetKeys, setTargetKeys] = useControlledValue<TransferKey[]>({
      getValue: () => props.targetKeys,
      defaultValue: [],
    });

    // Fill record with `key`
    const [mergedDataSource, leftDataSource, rightDataSource] = useData(
      computed(() => props.dataSource),
      computed(() => props.rowKey),
      targetKeys,
    );

    // Get direction selected keys
    const [sourceSelectedKeys, targetSelectedKeys, setSourceSelectedKeys, setTargetSelectedKeys] =
      useSelection(
        leftDataSource,
        rightDataSource,
        computed(() => props.selectedKeys),
      );

    const setStateKeys = (directionKey: TransferDirection, keys: TransferKey[]) => {
      if (directionKey === 'left') {
        setSourceSelectedKeys(keys);
      } else {
        setTargetSelectedKeys(keys);
      }
    };

    const handleSelectChange = (directionKey: TransferDirection, holder: TransferKey[]) => {
      const source = directionKey === 'left' ? holder : sourceSelectedKeys.value;
      const target = directionKey === 'right' ? holder : targetSelectedKeys.value;
      emit('update:selectedKeys', [...source, ...target]);
      emit('selectChange', source, target);
    };

    const getTitles = (transferLocale: { titles?: VNodeChild[] }) =>
      props.titles ?? transferLocale.titles ?? [];

    const handleLeftScroll = (e: Event) => {
      emit('scroll', 'left', e);
    };
    const handleRightScroll = (e: Event) => {
      emit('scroll', 'right', e);
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
      const tks = targetKeys.value;
      const newTargetKeys =
        directionKey === 'right'
          ? newMoveKeys.concat(tks)
          : tks.filter((targetKey) => !newMoveKeysMap.has(targetKey));
      // empty checked keys
      const oppositeDirection: TransferDirection = directionKey === 'right' ? 'left' : 'right';
      setStateKeys(oppositeDirection, []);
      handleSelectChange(oppositeDirection, []);
      setTargetKeys(newTargetKeys);
      emit('update:targetKeys', newTargetKeys);
      emit('change', newTargetKeys, directionKey, newMoveKeys);
    };

    const moveToLeft = () => {
      moveTo('left');
    };
    const moveToRight = () => {
      moveTo('right');
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
    };
    const onLeftItemSelectAll = (keys: TransferKey[], checkAll: boolean | 'replace') =>
      onItemSelectAll('left', keys, checkAll);
    const onRightItemSelectAll = (keys: TransferKey[], checkAll: boolean | 'replace') =>
      onItemSelectAll('right', keys, checkAll);

    const leftFilter = (event: Event) => {
      const value = searchEventValue(event);
      if (value !== undefined) emit('search', 'left', value);
    };
    const rightFilter = (event: Event) => {
      const value = searchEventValue(event);
      if (value !== undefined) emit('search', 'right', value);
    };
    const handleLeftClear = () => emit('search', 'left', '');
    const handleRightClear = () => emit('search', 'right', '');

    const onItemSelect = (
      directionKey: TransferDirection,
      selectedKey: TransferKey,
      checked: boolean,
    ) => {
      const holder = directionKey === 'left' ? sourceSelectedKeys.value : targetSelectedKeys.value;
      const holderSet = new Set(holder);
      if (checked) holderSet.add(selectedKey);
      else holderSet.delete(selectedKey);
      const holderArr = Array.from(holderSet);
      setStateKeys(directionKey, holderArr);
      handleSelectChange(directionKey, holderArr);
    };

    const onLeftItemSelect = (key: TransferKey, checked: boolean) =>
      onItemSelect('left', key, checked);
    const onRightItemSelect = (key: TransferKey, checked: boolean) =>
      onItemSelect('right', key, checked);
    const onRightItemRemove = (keys: TransferKey[]) => {
      setStateKeys('right', []);
      handleSelectChange('right', []);
      const nextKeys = targetKeys.value.filter((key) => !keys.includes(key));
      setTargetKeys(nextKeys);
      emit('update:targetKeys', nextKeys);
      emit('change', nextKeys, 'left', [...keys]);
    };

    const handleListStyle = (listDirection: TransferDirection) => {
      if (isFunction(props.listStyle)) {
        return props.listStyle({ direction: listDirection });
      }
      return props.listStyle || {};
    };

    const mergedStatus = computed(() => props.status);
    // Slot presence is checked in render; slots are not computed dependencies.
    const mergedPagination = (): PaginationType | false =>
      !slots.list && !!props.pagination && props.pagination;

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
      ],
      props,
    );

    const cls = computed(() =>
      clsx(
        prefixCls.value,
        {
          [`${prefixCls.value}-disabled`]: mergedDisabled.value,
          [`${prefixCls.value}-rtl`]: isRtl.value,
        },
        getStatusClassNames(prefixCls.value, mergedStatus.value, false),
        config.className,
        // 调用方原生 class（位置与原先的 props.className/rootClassName 一致）
        attrs.class,
        mergedSemantic.classNames.value.root,
      ),
    );

    // Locale
    const [contextLocale] = useLocale('Transfer');
    const listLocale = computed(() => ({
      ...contextLocale.value,
      notFoundContent: config.renderEmpty
        ? config.renderEmpty('Transfer')
        : h(DefaultRenderEmpty, { componentName: 'Transfer' }),
      ...(props.locale ?? {}),
    }));

    const nativeElementRef = ref<HTMLElement | null>(null);
    const focus = (options?: FocusOptions) => {
      nativeElementRef.value
        ?.querySelector<HTMLElement>(
          'input:not(:disabled), button:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
        )
        ?.focus(options);
    };
    const blur = () => {
      const root = nativeElementRef.value;
      if (root?.matches(':focus')) root.blur();
      else root?.querySelector<HTMLElement>(':focus')?.blur();
    };
    expose({
      nativeElement: nativeElementRef,
      focus,
      blur,
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

    const sectionClassNames = (dir: 'source' | 'target'): TransferSemanticClassNames => {
      const all = mergedSemantic.classNames.value;
      const dirCls = all[dir];
      const out = { ...all };
      for (const key of SECTION_SEMANTIC_KEYS) {
        out[key] = clsx(all[key], dirCls?.[key]);
      }
      return out;
    };
    const sectionStyles = (dir: 'source' | 'target'): TransferSemanticStyles => {
      const all = mergedSemantic.styles.value;
      const dirStyles = all[dir];
      const out = { ...all };
      for (const key of SECTION_SEMANTIC_KEYS) {
        out[key] = {
          ...all[key],
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
      const styles = sectionStyles(semanticDir);
      return {
        prefixCls: prefixCls.value,
        classNames: sectionClassNames(semanticDir),
        styles: {
          ...styles,
          section: { ...handleListStyle(listDirection), ...styles.section },
        },
        dataSource: listDirection === 'left' ? leftDataSource.value : rightDataSource.value,
        filterOption: props.filterOption,
        checkedKeys: listDirection === 'left' ? sourceSelectedKeys.value : targetSelectedKeys.value,
        onFilter: listDirection === 'left' ? leftFilter : rightFilter,
        onClear: listDirection === 'left' ? handleLeftClear : handleRightClear,
        onItemSelect: listDirection === 'left' ? onLeftItemSelect : onRightItemSelect,
        onItemSelectAll: listDirection === 'left' ? onLeftItemSelectAll : onRightItemSelectAll,
        onItemRemove: onRightItemRemove,
        showSearch: props.showSearch,
        onScroll: listDirection === 'left' ? handleLeftScroll : handleRightScroll,
        disabled: mergedDisabled.value,
        direction: listDirection,
        showSelectAll: props.showSelectAll,
        selectAllLabel: props.selectAllLabels?.[selectAllLabelIndex],
        showRemove: listDirection === 'right' ? !!props.oneWay : false,
        pagination: mergedPagination(),
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
      };
    };

    const renderTransfer = () =>
      h(
        'div',
        {
          ref: nativeElementRef,
          ...attrs,
          class: [cls.value, { [`${prefixCls.value}-customize-list`]: !!slots.list }],
          ...(attrs.style !== undefined
            ? { style: [themeStyle.value, mergedSemantic.styles.value.root, attrs.style] }
            : styleAttrs({ ...themeStyle.value, ...mergedSemantic.styles.value.root })),
        },
        [
          h(Section, sectionBind('left', 0), slots),
          h(Actions, {
            class: clsx(`${prefixCls.value}-actions`, mergedSemantic.classNames.value.actions),
            rightActive: rightActive.value,
            onMoveToRight: moveToRight,
            leftActive: leftActive.value,
            onMoveToLeft: moveToLeft,
            actions: mergedActions.value,
            style: {
              ...props.operationStyle,
              ...mergedSemantic.styles.value.actions,
            },
            disabled: mergedDisabled.value,
            direction: direction.value,
            oneWay: props.oneWay,
          }),
          h(Section, sectionBind('right', 1), slots),
        ],
      );
    return { nativeElement: nativeElementRef, focus, blur, renderTransfer };
  },
  expose: ['nativeElement', 'focus', 'blur'],
  render() {
    return this.renderTransfer();
  },
});

export type { TransferProps };
export default Transfer;
