/**
 * CascaderPanel —— rc `Panel.js`（115 行）的 Vue 版（antd `Panel.tsx` 是它的薄壳）。
 *
 * 纯面板形态（无浮层 / 无输入框）：自带 values 状态机（受控或内部态），
 * 渲染 `.{p}-panel` + 内嵌 RawOptionList（popupPrefixCls 留空 ⇒ 用 panel 自己的前缀）。
 *
 * 判据：
 * - 空 options ⇒ 根类 `-empty` + 直接渲染 `notFoundContent`（rc 默认 'Not Found'）；
 * - onChange / update:value 的 payload 与 Cascader 同构（单选一维；多选二维数组）；
 * - `checkable` / `expandIcon`（默认 `'>'`）/ `loadingIcon` 透传给 context；
 * - 多选勾选传导复用 S2 的 createSelectHandler 语义（此处内联以拿最新受控值）。
 */

import { useId } from '@apollo-design/utils';
import { computed, defineComponent, h, type PropType, ref, type VNodeChild, watch } from 'vue';
import BaseSelect from '../select/engine/BaseSelect';

import { provideCascaderContext } from './context';
import { createSelectHandler, useOptions, useValues } from './hooks/values';
import RawOptionList from './OptionList';
import {
  type BaseOptionType,
  type FieldNames,
  fillFieldNames,
  type RawValue,
  type ShowCheckedStrategy,
  toPathOptions,
  toRawValues,
  type ValueCell,
} from './utils';

export interface CascaderPanelProps {
  prefixCls?: string;
  className?: string;
  style?: Record<string, string | number>;
  options?: BaseOptionType[];
  multiple?: boolean;
  value?: RawValue | RawValue[];
  defaultValue?: RawValue | RawValue[];
  fieldNames?: FieldNames;
  changeOnSelect?: boolean;
  showCheckedStrategy?: ShowCheckedStrategy;
  loadData?: (options: BaseOptionType[]) => void;
  expandTrigger?: 'click' | 'hover';
  expandIcon?: unknown;
  loadingIcon?: unknown;
  direction?: 'ltr' | 'rtl';
  notFoundContent?: unknown;
  disabled?: boolean;
  optionRender?: (option: BaseOptionType) => unknown;
}

const noop = (): void => {};

const CascaderPanel = defineComponent({
  name: 'ACascaderPanel',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<Record<string, string | number>>, default: undefined },
    options: { type: Array as PropType<BaseOptionType[]>, default: undefined },
    multiple: { type: Boolean, default: false },
    value: { type: null as unknown as PropType<RawValue | RawValue[]>, default: undefined },
    defaultValue: {
      type: null as unknown as PropType<RawValue | RawValue[]>,
      default: undefined,
    },
    fieldNames: { type: Object as PropType<FieldNames>, default: undefined },
    changeOnSelect: { type: Boolean, default: undefined },
    showCheckedStrategy: {
      type: String as PropType<ShowCheckedStrategy>,
      default: 'SHOW_PARENT',
    },
    loadData: {
      type: Function as PropType<(options: BaseOptionType[]) => void>,
      default: undefined,
    },
    expandTrigger: { type: String as PropType<'click' | 'hover'>, default: undefined },
    expandIcon: { type: null as unknown as PropType<unknown>, default: undefined },
    loadingIcon: { type: null as unknown as PropType<unknown>, default: undefined },
    direction: { type: String as PropType<'ltr' | 'rtl'>, default: 'ltr' },
    notFoundContent: { type: null as unknown as PropType<unknown>, default: 'Not Found' },
    disabled: { type: Boolean, default: undefined },
    optionRender: {
      type: Function as PropType<(option: BaseOptionType) => unknown>,
      default: undefined,
    },
  },
  emits: ['update:value', 'change'],
  setup(props, { emit }) {
    // ========================= Values =========================
    const panelId = useId(undefined);
    // rc useControlledState：受控优先，否则内部态
    const innerValues = ref<ValueCell[]>(toRawValues(props.defaultValue));
    watch(
      () => props.value,
      (next) => {
        if (next !== undefined) innerValues.value = toRawValues(next);
      },
      { immediate: true },
    );
    const rawValues = computed<ValueCell[]>(() =>
      props.value !== undefined ? toRawValues(props.value) : innerValues.value,
    );

    const mergedFieldNames = computed(() => fillFieldNames(props.fieldNames));
    const { mergedOptions, getPathKeyEntities, getValueByKeyPath } = useOptions(
      mergedFieldNames,
      computed(() => props.options),
    );
    const getMissingValues = (list: ValueCell[]): [ValueCell[], ValueCell[]] => {
      const exists: ValueCell[] = [];
      const missing: ValueCell[] = [];
      list.forEach((valueCell) => {
        const path = toPathOptions(valueCell, mergedOptions.value, mergedFieldNames.value);
        if (path.every((opt) => opt.option)) exists.push(valueCell);
        else missing.push(valueCell);
      });
      return [exists, missing];
    };

    const valuesResult = computed(() =>
      useValues(props.multiple, rawValues, getPathKeyEntities, getValueByKeyPath, getMissingValues),
    );

    const triggerChange = (nextValues: ValueCell | ValueCell[]): void => {
      // 多选 payload = ValueCell[]；单选 payload = 一维 ValueCell（上游 triggerValues 判据）
      const isMultipleShape = Array.isArray((nextValues as unknown[])[0] as unknown);
      const payload = isMultipleShape ? (nextValues as ValueCell[]) : (nextValues as ValueCell);
      innerValues.value = isMultipleShape ? (nextValues as ValueCell[]) : [nextValues as ValueCell];
      emit('update:value', payload);
      emit('change', payload);
    };

    const handleSelection = (valuePath: ValueCell): void => {
      const { checkedValues, halfCheckedValues, missingCheckedValues } = valuesResult.value;
      const handler = createSelectHandler(
        props.multiple,
        triggerChange,
        checkedValues,
        halfCheckedValues,
        missingCheckedValues,
        getPathKeyEntities,
        getValueByKeyPath,
        props.showCheckedStrategy ?? 'SHOW_PARENT',
      );
      handler(valuePath);
    };

    // ======================== Context =========================
    // ⚠️ 用 Proxy 桥：OptionList 直接解构 context 字段，Proxy 的 get 每次取
    //    computed 的最新值（provide 一个 reactive 对象也可以，但 Proxy 免深响应开销）
    const contextValue = computed(() => ({
      options: mergedOptions.value,
      fieldNames: mergedFieldNames.value,
      values: valuesResult.value.checkedValues,
      halfValues: valuesResult.value.halfCheckedValues,
      changeOnSelect: props.changeOnSelect,
      onSelect: handleSelection,
      checkable: props.multiple,
      searchOptions: [] as BaseOptionType[],
      popupPrefixCls: undefined,
      loadData: props.loadData,
      expandTrigger: props.expandTrigger,
      expandIcon: (props.expandIcon ?? '>') as VNodeChild | null,
      loadingIcon: props.loadingIcon as VNodeChild | null,
      popupMenuColumnStyle: undefined,
      optionRender: props.optionRender as
        | ((option: BaseOptionType) => VNodeChild)
        | null
        | undefined,
    }));
    provideCascaderContext(makeBridge(contextValue));

    const isEmpty = computed(() => !mergedOptions.value.length);

    // ========================= Render =========================
    // antd 的 Panel 是「完整外壳形态」：readonly input（role=combobox，
    // aria-expanded=false）+ suffix 箭头 + 下方内嵌列（无 Trigger/portal）。
    // 外壳复用 BaseSelect 的静态形态（L4/L6 基线依赖此结构）。
    return () => {
      const p = props.prefixCls ?? 'apollo-cascader';
      const panelPrefixCls = `${p}-panel`;
      const listNode = h(RawOptionList, {
        prefixCls: p,
        searchValue: '',
        multiple: props.multiple,
        toggleOpen: noop,
        open: true,
        direction: props.direction,
        disabled: props.disabled,
      } as never);

      if (isEmpty.value) {
        return h(
          'div',
          {
            class: [panelPrefixCls, { [`${panelPrefixCls}-empty`]: true }, props.className],
            style: props.style,
          },
          (props.notFoundContent ?? undefined) as never,
        );
      }

      return h(
        'div',
        {
          class: [panelPrefixCls, props.className],
          style: { paddingBottom: 0, position: 'relative', minWidth: 0, ...(props.style ?? {}) },
        },
        [
          h(BaseSelect, {
            prefixCls: p,
            id: panelId,
            open: false,
            displayValues: [],
            disabled: props.disabled,
            tabIndex: -1,
            style: { margin: 0 },
            optionListRenderer: () => null,
          } as never),
          // ⚠️ 列直接内嵌（rc Panel 同构）：不要包 -dropdown 容器——select 的
          //    dropdown 样式带定位/边距，会把列挤开（L6 差异抓出）
          listNode,
        ],
      );
    };
  },
});

/** 把 computed 桥成「每次属性读取都取最新值」的对象（OptionList 直接解构用）。 */
function makeBridge<T extends object>(source: { value: T }): T {
  return new Proxy({} as T, {
    get(_t, key) {
      return source.value[key as keyof T];
    },
  });
}

export default CascaderPanel;
