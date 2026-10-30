import { LeftOutlined, LoadingOutlined, RightOutlined } from '@apollo-design/icons';
import {
  computed,
  defineComponent,
  h,
  mergeProps,
  normalizeStyle,
  type SlotsType,
  shallowRef,
} from 'vue';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { type CascaderContextProps, provideCascaderContext } from './context';
import { useCascaderValues } from './hooks/values';
import type {
  CascaderOutputValue,
  CascaderPanelProps,
  CascaderPanelSlots,
  CascaderSelectedOptions,
  CascaderSemanticClassNames,
  CascaderSemanticStyles,
} from './interface';
import RawOptionList, { type CascaderOptionListRef } from './OptionList';
import { panelProps } from './props';
import { useCascaderTheme } from './use-cascader-theme';

export type { CascaderPanelProps } from './interface';

const CascaderPanel = defineComponent({
  name: 'ACascaderPanel',
  inheritAttrs: false,
  props: panelProps,
  slots: Object as SlotsType<CascaderPanelSlots>,
  emits: {
    'update:value': (_value: CascaderOutputValue) => true,
    change: (_value: CascaderOutputValue, _selected: CascaderSelectedOptions) => true,
  },
  setup(props, { attrs, emit, slots }) {
    const config = useComponentConfig<
      CascaderPanelProps & { className?: string; style?: import('vue').CSSProperties }
    >('cascader');
    const inheritedDirection = useDirection();
    const direction = computed(() => props.direction ?? inheritedDirection.value ?? 'ltr');
    const disabled = useDisabled(() => props.disabled);
    const prefix = computed(() => config.getPrefixCls('cascader', props.prefixCls));
    const state = useCascaderValues(
      props,
      computed(() => props.multiple),
      (value, selected) => {
        emit('update:value', value);
        emit('change', value, selected);
      },
    );
    const semantic = useMergeSemantic<
      Readonly<CascaderPanelProps>,
      CascaderSemanticClassNames,
      CascaderSemanticStyles
    >(
      [() => config.classNames, () => props.classNames],
      [() => config.styles, () => props.styles],
      props,
      { popup: { _default: 'root' } },
    );
    const theme = useCascaderTheme();
    const list = shallowRef<CascaderOptionListRef | null>(null);
    provideCascaderContext(
      computed<CascaderContextProps>(() => ({
        options: state.options.value,
        fieldNames: state.fields.value,
        values: state.values.value.checkedValues,
        halfValues: state.values.value.halfCheckedValues,
        classNames: semantic.classNames.value,
        styles: semantic.styles.value,
        changeOnSelect: props.changeOnSelect,
        onSelect: state.select,
        searchOptions: [],
        loadData: props.loadData,
        expandTrigger: props.expandTrigger,
        expandIcon:
          props.expandIcon !== undefined
            ? props.expandIcon
            : config.expandIcon !== undefined
              ? config.expandIcon
              : h(direction.value === 'rtl' ? LeftOutlined : RightOutlined),
        loadingIcon:
          props.loadingIcon !== undefined
            ? props.loadingIcon
            : config.loadingIcon !== undefined
              ? config.loadingIcon
              : h(LoadingOutlined, { spin: true }),
        popupMenuColumnStyle: props.popupMenuColumnStyle,
      })),
    );
    return () => {
      const { class: nativeClass, style: nativeStyle, ...rest } = attrs;
      const p = prefix.value;
      const notFound = slots.notFoundContent
        ? slots.notFoundContent()
        : props.notFoundContent !== undefined
          ? props.notFoundContent
          : config.renderEmpty
            ? config.renderEmpty('Cascader')
            : 'Not Found';
      return h(
        'div',
        mergeProps(
          {
            tabindex: disabled.value ? -1 : 0,
            onKeydown: (event: KeyboardEvent) => list.value?.onKeyDown(event),
          },
          rest,
          {
            class: [
              `${p}-panel`,
              {
                [`${p}-panel-rtl`]: direction.value === 'rtl',
                [`${p}-panel-empty`]: !state.options.value.length,
              },
              config.className,
              semantic.classNames.value.root,
              nativeClass,
            ],
            style: [
              theme.style.value,
              config.style,
              semantic.styles.value.root,
              normalizeStyle(nativeStyle),
            ],
            dir: direction.value,
          },
        ),
        state.options.value.length
          ? h(
              RawOptionList,
              {
                ref: list,
                prefixCls: p,
                multiple: props.multiple,
                searchValue: '',
                open: true,
                disabled: disabled.value,
                direction: direction.value,
                notFoundContent: notFound,
                toggleOpen: () => {},
              },
              slots,
            )
          : [notFound],
      );
    };
  },
});
export default CascaderPanel;
