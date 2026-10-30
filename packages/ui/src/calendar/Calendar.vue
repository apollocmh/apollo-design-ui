<script setup lang="ts">
import type { PickerLocale } from '@apollo-design/locale';
import { useLocale } from '@apollo-design/locale';
import type { PanelCellRenderScope } from '@apollo-design/picker';
import { PickerPanel } from '@apollo-design/picker';
import { merge, useControlledValue } from '@apollo-design/utils';
import {
  type CSSProperties,
  computed,
  h,
  mergeProps,
  type PropType,
  ref,
  useAttrs,
  type VNodeChild,
} from 'vue';
import { NodeRenderer } from '../_internal/node-renderer';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { dayjsConfig } from '../date-picker/hooks/dayjs-config';
import CalendarHeader, { calendarValidRangeProp } from './components/CalendarHeader';
import type {
  CalendarDate,
  CalendarHeaderRenderConfig,
  CalendarMode,
  CalendarProps,
  CalendarSemanticClassNames,
  CalendarSemanticStyles,
  CalendarSlots,
  SelectInfo,
} from './interface';
import { useCalendarTheme } from './use-calendar-theme';

defineOptions({ name: 'ACalendar', inheritAttrs: false });
const props = defineProps({
  prefixCls: { type: String, default: undefined },
  classNames: {
    type: [Object, Function] as PropType<CalendarProps['classNames']>,
    default: undefined,
  },
  styles: { type: [Object, Function] as PropType<CalendarProps['styles']>, default: undefined },
  locale: { type: Object as PropType<PickerLocale>, default: undefined },
  validRange: calendarValidRangeProp,
  disabledDate: { type: Function as PropType<CalendarProps['disabledDate']>, default: undefined },
  value: { type: Object as PropType<CalendarDate>, default: undefined },
  defaultValue: { type: Object as PropType<CalendarDate>, default: undefined },
  mode: { type: String as PropType<CalendarMode>, default: undefined },
  fullscreen: { type: Boolean, default: true },
  showWeek: { type: Boolean, default: undefined },
});
const emit = defineEmits<{
  change: [date: CalendarDate];
  'update:value': [date: CalendarDate];
  panelChange: [date: CalendarDate, mode: CalendarMode];
  'update:mode': [mode: CalendarMode];
  select: [date: CalendarDate, info: SelectInfo];
}>();
const slots = defineSlots<CalendarSlots>();
const attrs = useAttrs();
const context = useComponentConfig<
  Pick<CalendarProps, 'classNames' | 'styles'> & { className?: string; style?: CSSProperties }
>('calendar');
const direction = useDirection();
const prefixCls = computed(() => context.getPrefixCls('picker', props.prefixCls));
const calendarPrefixCls = computed(() => `${prefixCls.value}-calendar`);
const themeStyle = useCalendarTheme(() => context.getPrefixCls());
const [mergedValue, setValue] = useControlledValue<CalendarDate>({
  getValue: () => props.value,
  defaultValue: () => props.defaultValue ?? dayjsConfig.getNow(),
});
const [mergedMode, setMode] = useControlledValue<CalendarMode>({
  getValue: () => props.mode,
  defaultValue: 'month',
});
const panelMode = computed(() => (mergedMode.value === 'year' ? 'month' : 'date'));
const today = dayjsConfig.getNow();
const sameYear = (left: CalendarDate, right: CalendarDate) => left.year() === right.year();
const sameMonth = (left: CalendarDate, right: CalendarDate) =>
  sameYear(left, right) && left.month() === right.month();
const sameDate = (left: CalendarDate, right: CalendarDate) =>
  sameMonth(left, right) && left.date() === right.date();

const { classNames, styles } = useMergeSemantic<
  CalendarProps,
  CalendarSemanticClassNames,
  CalendarSemanticStyles
>(
  [() => context.classNames, () => props.classNames],
  [() => context.styles, () => semanticRootStyle(context.style), () => props.styles],
  props,
);
const panelClassNames = computed(() => {
  const { root: _root, header: _header, ...panel } = classNames.value;
  return panel;
});
const panelStyles = computed(() => {
  const { root: _root, header: _header, ...panel } = styles.value;
  return panel;
});
const [contextLocale] = useLocale('Calendar');
const locale = computed(() =>
  props.locale === undefined
    ? contextLocale.value
    : merge<PickerLocale>(contextLocale.value, props.locale),
);
const disabledDate = (date: CalendarDate): boolean => {
  const range = props.validRange;
  return Boolean(
    (range && (dayjsConfig.isAfter(range[0], date) || dayjsConfig.isAfter(date, range[1]))) ||
      props.disabledDate?.(date),
  );
};

function selectDate(date: CalendarDate, source: SelectInfo['source']): void {
  const previous = mergedValue.value;
  const mode = mergedMode.value;
  const crossing =
    panelMode.value === 'date' ? !sameMonth(date, previous) : !sameYear(date, previous);
  setValue(date);
  if (!sameDate(date, previous)) {
    emit('update:value', date);
    if (crossing) emit('panelChange', date, mode);
    emit('change', date);
  }
  emit('select', date, { source });
}
function changeMode(mode: CalendarMode): void {
  const current = mergedValue.value;
  const changed = mode !== mergedMode.value;
  setMode(mode);
  if (changed) emit('update:mode', mode);
  emit('panelChange', current, mode);
}
const headerConfig = computed<CalendarHeaderRenderConfig>(() => ({
  value: mergedValue.value,
  type: mergedMode.value,
  onChange: (date) => selectDate(date, 'customize'),
  onTypeChange: changeMode,
}));
function selectPanelDate(date: CalendarDate): void {
  selectDate(date, panelMode.value);
}

/** Calendar only asks the panel for date/month cells; the engine's time slots stay numeric. */
function renderCell(
  current: PanelCellRenderScope['current'],
  info: PanelCellRenderScope['info'],
): VNodeChild {
  if (typeof current !== 'object' || (info.type !== 'date' && info.type !== 'month'))
    return undefined;
  const cellInfo = info.type === 'month' ? { ...info, locale: locale.value.lang } : info;
  const scope = { current, info: cellInfo };
  if (slots.fullCellRender) return slots.fullCellRender(scope);
  const months =
    cellInfo.locale.shortMonths ??
    dayjsConfig.locale.getShortMonths?.(cellInfo.locale.locale) ??
    [];
  const text =
    info.type === 'date' ? String(current.date()).padStart(2, '0') : months[current.month()];
  return h(
    'div',
    {
      class: [
        `${prefixCls.value}-cell-inner`,
        `${calendarPrefixCls.value}-date`,
        {
          [`${calendarPrefixCls.value}-date-today`]:
            info.type === 'date' ? sameDate(today, current) : sameMonth(today, current),
        },
      ],
    },
    [
      h('div', { class: `${calendarPrefixCls.value}-date-value` }, text),
      h(
        'div',
        {
          class: [`${calendarPrefixCls.value}-date-content`, classNames.value.itemContent],
          style: styles.value.itemContent,
        },
        [slots.cellRender?.(scope)],
      ),
    ],
  );
}

const rootRef = ref<HTMLDivElement | null>(null);
defineExpose({
  get nativeElement() {
    return rootRef.value;
  },
});
function rootBindings() {
  const cls = calendarPrefixCls.value;
  return mergeProps(
    {
      class: [
        cls,
        {
          [`${cls}-full`]: props.fullscreen,
          [`${cls}-mini`]: !props.fullscreen,
          [`${cls}-rtl`]: direction.value === 'rtl',
        },
        context.className,
        classNames.value.root,
        'css-var-root',
        `${cls}-css-var`,
      ],
      style: [themeStyle.value, styles.value.root],
    },
    attrs,
  );
}
</script>

<template>
  <div v-bind="rootBindings()" ref="rootRef">
    <slot v-if="slots.headerRender" name="headerRender" v-bind="headerConfig" />
    <CalendarHeader
      v-else
      :class="classNames.header"
      :style="styles.header"
      :prefix-cls="calendarPrefixCls"
      :value="mergedValue"
      :mode="mergedMode"
      :fullscreen="props.fullscreen"
      :locale="locale.lang"
      :valid-range="props.validRange"
      @change="selectDate"
      @mode-change="changeMode"
    />
    <PickerPanel
      :class-names="panelClassNames"
      :styles="panelStyles"
      :value="[mergedValue]"
      :prefix-cls="prefixCls"
      :locale="locale.lang"
      :generate-config="dayjsConfig"
      :direction="direction"
      :mode="panelMode"
      :picker="panelMode"
      :disabled-date="disabledDate"
      hide-header
      :show-week="props.showWeek"
      @select="selectPanelDate"
    >
      <template #cellRender="{ current, info }">
        <NodeRenderer :node="renderCell(current, info)" />
      </template>
    </PickerPanel>
  </div>
</template>
