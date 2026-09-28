/**
 * CascaderPanel —— rc `Panel.js`（115 行）的 Vue 版（antd `Panel.tsx` 是它的薄壳）。
 *
 * 纯面板形态（无浮层 / 无输入框）：自带 values 状态机（受控或内部态），
 * 渲染 `.{p}-panel` + 内嵌 RawOptionList（popupPrefixCls 留空 ⇒ 用 panel 自己的前缀）。
 *
 * 判据：
 * - 空 options ⇒ 根类 `-empty` + 直接渲染 `notFoundContent`（rc 默认 'Not Found'）；
 * - onChange / update:value 的 payload 与 Cascader 同构（单选一维；多选二维数组）；
 * - `checkable` / `expandIcon`（默认 `RightOutlined`，RTL `LeftOutlined`）/ `loadingIcon`
 *   （默认 `LoadingOutlined spin`）透传给 context —— 默认值取 antd `useIcons`，
 *   不是 rc Panel 的字面量 `'>'`；
 * - 多选勾选传导复用 S2 的 createSelectHandler 语义（此处内联以拿最新受控值）。
 */

import { LeftOutlined, LoadingOutlined, RightOutlined } from '@apollo-design/icons';
import { computed, defineComponent, h, type PropType, ref, type VNodeChild, watch } from 'vue';

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
      // ⚠️ antd 的 `Panel.tsx` 把 `useIcons` 解析后的图标传进 rc Panel ⇒ 默认是
      //    `RightOutlined` / RTL `LeftOutlined` / `LoadingOutlined spin`，
      //    **不是** rc 的字面量 `'>'`（照抄 rc 会把展开图标渲染成文字 `>`，L6 抓出）。
      expandIcon: (props.expandIcon ??
        (props.direction === 'rtl' ? h(LeftOutlined) : h(RightOutlined))) as VNodeChild | null,
      loadingIcon: (props.loadingIcon ?? h(LoadingOutlined, { spin: true })) as VNodeChild | null,
      popupMenuColumnStyle: undefined,
      optionRender: props.optionRender as
        | ((option: BaseOptionType) => VNodeChild)
        | null
        | undefined,
    }));
    provideCascaderContext(makeBridge(contextValue));

    const isEmpty = computed(() => !mergedOptions.value.length);

    // ========================= Render =========================
    // ⚠️ rc `Panel.js` 同构：**只有列**，没有 select 外壳（readonly input / combobox /
    //    suffix / clear 一个都没有）。`CascaderPanel` 与
    //    `Cascader._InternalPanelDoNotUseOrYouWillBeFired` 在 antd 里是**两个不同的东西**：
    //      · `Cascader.Panel` = rc Panel = `.{p}-panel` + RawOptionList（本文件）
    //      · `_InternalPanelDoNotUseOrYouWillBeFired` = antd `genPurePanel(Cascader)`
    //        = **完整 Cascader**（外壳 + 浮层）塞进一个 holder div
    //    曾经把后者当成「antd Panel 的形态」而给本组件补了 BaseSelect 外壳 —— 那是误判，
    //    两者不可互换（L6 用例两侧比的就是不同组件）。
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

      return h(
        'div',
        {
          class: [
            panelPrefixCls,
            {
              [`${panelPrefixCls}-rtl`]: props.direction === 'rtl',
              [`${panelPrefixCls}-empty`]: isEmpty.value,
            },
            props.className,
          ],
          style: props.style,
        },
        isEmpty.value ? ((props.notFoundContent ?? undefined) as never) : listNode,
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
