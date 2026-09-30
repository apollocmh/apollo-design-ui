/**
 * 时间面板（`TimePanel`）与「日期 + 时间」面板（`DateTimePanel`）。
 *
 * 上游：`es/PickerPanel/TimePanel/index.js`（33 行）与
 * `es/PickerPanel/DateTimePanel/index.js`（48 行）。
 *
 * ── `TimePanel` 的表头是**一行文字**而不是翻页按钮 ────────────────────────────
 * 上游给 `PanelHeader` 不传 `offset` / `superOffset` ⇒ 只剩中间那个「标题槽」，
 * 内容是当前值按 `showTime.format` 格式化的结果；**没有值时是一个 `\u00A0`
 * （不换行空格）**，不是空串 —— 这是为了让表头高度不塌（照抄）。
 *
 * ── `DateTimePanel` 的「时间来自哪」────────────────────────────────────────────
 * 它是 `DatePanel` + `TimePanel` 的上下拼装，但它**改写了两个日期格的回调**：
 *  - `onSelect(date)` ⇒ 把日期与当前时刻合并（`fillTime`）后再 `getValidTime`；
 *  - `onHover(date)` ⇒ 同样合并（让 hover 预览也带时间）。
 * 合并的时间来源：**有 `value` 用 `value` 的时间，否则用 `pickerValue` 的时间** ——
 * 所以「先点日期再调时间」时，点日期那一刻继承的是**浏览值**的时刻。
 */

import { defineComponent, h, type PropType } from 'vue';
import { DatePanel } from './date-panel';
import { fillTime } from './date-util';
import type { PanelDateType } from './panel-context';
import { PanelHeader } from './panel-header';
import { formatWith, providePanelInfoFromProps, sharedPanelProps } from './panel-props';
import type { TimePanelConfig } from './time-config';
import { TimePanelBody } from './time-panel-body';
import { getTimeInfo } from './time-units';

/** `showTime` 通道（`PickerPanel` 会把归一后的配置透传下来）。 */
const showTimeProp = {
  showTime: {
    type: Object as PropType<TimePanelConfig<PanelDateType>>,
    default: () => ({}),
  },
};

export const TimePanel = defineComponent({
  name: 'ApolloPickerTimePanel',
  props: { ...sharedPanelProps, ...showTimeProp },
  setup(props) {
    // ⚠️ 用返回值而不是 `usePanelInfo()`：面板自己 provide 的东西自己 inject 不到
    //    （`inject` 读 `parent.provides`）。见 `panel-props.ts` 的说明。
    const info = providePanelInfoFromProps(props, 'time');

    return () => {
      const ctx = info.value;
      const { prefixCls, locale, generateConfig: g, values } = ctx;

      const value = values[0] ?? null;
      const panelPrefixCls = `${prefixCls}-time-panel`;

      return h('div', { class: panelPrefixCls }, [
        h(
          PanelHeader,
          {},
          {
            default: () => (value ? formatWith(g, locale, props.showTime.format, value) : '\u00A0'),
          },
        ),
        h(TimePanelBody, {
          showHour: props.showTime.showHour,
          showMinute: props.showTime.showMinute,
          showSecond: props.showTime.showSecond,
          showMillisecond: props.showTime.showMillisecond,
          use12Hours: props.showTime.use12Hours,
          changeOnScroll: props.showTime.changeOnScroll,
          timeConfig: props.showTime,
        }),
      ]);
    };
  },
});

export const DateTimePanel = defineComponent({
  name: 'ApolloPickerDateTimePanel',
  props: { ...sharedPanelProps, ...showTimeProp },
  setup(props) {
    // ⚠️ `DateTimePanel` **不 provide** 上下文 —— 它只是把 `DatePanel` 与 `TimePanel`
    //    上下拼起来，而那两个各自 `useInfo(自己的 props)` 并 provide
    //    （上游同样如此）。所以这里需要的一切都从**自己的 props** 取。
    return () => {
      const { prefixCls, generateConfig: g, values, pickerValue, onHover } = props;
      const panelPrefixCls = `${prefixCls}-datetime-panel`;

      const value = values[0] ?? null;

      /** 合并「日期 + 当前时刻」。`value` 有时间就用它，否则用 `pickerValue`。 */
      const mergeTime = (date: PanelDateType): PanelDateType =>
        value ? fillTime(g, date, value) : fillTime(g, date, pickerValue);

      const timeInfo = getTimeInfo(g, props.showTime, value ?? undefined);

      const onDateSelect = (date: PanelDateType): void => {
        const cloneDate = mergeTime(date);
        // ⚠️ 两个实参都传 `cloneDate`：`certainDate` 决定「按哪一天算哪些时刻被禁用」，
        //    这里就是刚选的那一天本身。
        props.onSelect?.(timeInfo.getValidTime(cloneDate, cloneDate));
      };
      const onDateHover = (date: PanelDateType | null): void => {
        onHover?.(date ? mergeTime(date) : date);
      };

      return h('div', { class: panelPrefixCls }, [
        h(DatePanel, {
          ...props,
          onSelect: onDateSelect as never,
          onHover: onDateHover as never,
        }),
        h(TimePanel, {
          ...props,
          values: value ? [value] : [],
        }),
      ]);
    };
  },
});
