<script lang="ts">
/**
 * Calendar 主实现 —— antd 6.6.4 `es/calendar/generateCalendar.js`（445 行）。
 *
 * 契约全文见 `docs/analysis/calendar.md`（G1 产物）与 `interface.ts` 的文件头；
 * 这里只留**实现期最容易写错的判据**。
 *
 * ── 渲染骨架（上游 `generateCalendar.tsx:370-431`）────────────────────────────
 *
 * ```html
 * <div class="{calendarPrefixCls} [-full | -mini] [-rtl] …" style={rootStyle}>
 *   {headerRender ? headerRender({value, type, onChange, onTypeChange}) : <CalendarHeader/>}
 *   <PickerPanel hideHeader cellRender={mergedCellRender} … />
 * </div>
 * ```
 *
 * ── 八条必须复刻的判据 ──────────────────────────────────────────────────────
 *
 * 1. 🚨 **`prefixCls` 默认是 `getPrefixCls('picker')` = `apollo-picker`**（**不是**
 *    `apollo-calendar`）⇒ 根类是 **`.apollo-picker-calendar`**。
 *    ⚠️ 但 `-css-var` 类挂在 **`${calendarPrefixCls}-css-var`** 上，与
 *    `genCalendarStyle` 的 `${cls}-css-var` 对应。
 * 2. **`triggerChange` 的三条顺序判据**（上游 `:238-252`）：
 *    `setMergedValue(date)` → 若**与当前值同一天则 `change` / `panelChange` 都不发**
 *    （`isSameDate` 守卫）→ 跨月（`panelMode==='date'`）或跨年（`panelMode==='month'`）
 *    才补发 `panelChange(date, mergedMode)` → 最后才 `change(date)`。
 * 3. **`triggerModeChange` 传的是「当前值」而不是新日期**：
 *    `panelChange(mergedValue, newMode)`（上游 `:256`）。
 * 4. **面板那一支的 `source` 是 `panelMode`**（`'date'` | `'month'`），不是字面量 `'date'`。
 * 5. 🚨 **`dateRender` 判 `isFunction(fullCellRender)`，而 `monthRender` 判
 *    `fullCellRender` 的真值** —— **两处判据不同**，照抄上游别「统一」。
 * 6. **`monthRender` 的月份名来自 `info.locale.shortMonths || getShortMonths(locale)`**：
 *    `shortMonths` 在 73 个语言包里**只有 5 个有**（见 `locale/src/types.ts` 的统计）
 *    ⇒ 回退分支是**主路径**，不是兜底。
 * 7. **`mergedCellRender` 按 `info.type` 分派**：`'date'` → `dateRender`；
 *    `'month'` → `monthRender`（**并且把 `locale` 换成 `locale.lang` 再传**）；
 *    其它类型返回 `undefined`（不渲染）。
 * 8. **`-full` / `-mini` 由 `fullscreen`（默认 `true`）决定**，两者互斥且必有其一。
 *
 * ── 五处平台差异（PLATFORM）──────────────────────────────────────────────────
 *
 * - **`PickerPanel` 的 `value` 必须传数组**：上游给 rc 的 `PickerPanel` 传的是**单个**
 *   `mergedValue`（rc 内部 `toArray`）；本仓 `@apollo-design/picker` 的 `PickerPanel`
 *   契约是 `PanelDateType[]`（`rawValue` 直接 `.filter`）⇒ 传 `[mergedValue]`。
 *   这是**包内 API 差异**，不影响对外行为。
 * - **`headerRender` 是函数 prop**（C8 双通道）：函数返回值走 `NodeRenderer`
 *   （`.vue` 模板没有「渲染一个 VNode 变量」的语法）。
 * - **`deprecated` 的判据是 `!== undefined`**（Vue 没有「键存在」）—— 与 date-picker 同判。
 * - **无 `hashId`**（D2）；`-css-var` 直接拼（D5 家族）。
 * - **`useStyle(prefixCls, calendarPrefixCls)` 传两个前缀**（上游如此）——
 *   本仓的静态 CSS 里没有这一步，类名由上面的判据 1 直接拼出。
 */
import type { PickerLocale } from '@apollo-design/locale';
import { useLocale } from '@apollo-design/locale';
import type { PanelCellRenderInfo, PanelDateType } from '@apollo-design/picker';
import { PickerPanel } from '@apollo-design/picker';
import { isFunction, merge, useDevWarning } from '@apollo-design/utils';
import {
  type Component,
  type CSSProperties,
  computed,
  defineComponent,
  h,
  type PropType,
  ref,
  type VNodeChild,
  watch,
} from 'vue';
import { NodeRenderer } from '../_internal/node-renderer';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { dayjsConfig } from '../date-picker/hooks/dayjs-config';
import CalendarHeader from './components/CalendarHeader';
import type {
  CalendarCellRenderInfo,
  CalendarDate,
  CalendarMode,
  CalendarProps,
  CalendarSemanticClassNames,
  CalendarSemanticStyles,
  SelectInfo,
} from './interface';

/** 年 / 月 / 日的「同…」判定（上游 `isSameYear` / `isSameMonth` / `isSameDate`）。 */
const isSameYear = (a: CalendarDate, b: CalendarDate): boolean =>
  dayjsConfig.getYear(a) === dayjsConfig.getYear(b);
const isSameMonth = (a: CalendarDate, b: CalendarDate): boolean =>
  isSameYear(a, b) && dayjsConfig.getMonth(a) === dayjsConfig.getMonth(b);
const isSameDate = (a: CalendarDate, b: CalendarDate): boolean =>
  isSameMonth(a, b) && dayjsConfig.getDate(a) === dayjsConfig.getDate(b);

export default defineComponent({
  name: 'ACalendar',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    /**
     * 🚨 **运行时类型必须是 `[Object, Function]`** —— `classNames` / `styles` 支持
     * **函数形态**（`(info: { props }) => 对象`）。只写 `Object` 时 Vue 会对函数报
     * `Invalid prop: type check failed for prop "classNames". Expected Object, got Function`
     * （本轮实测：L1 的「函数形态」用例把它打出来了 —— 用例**仍然通过**，
     * 因为告警不 fail；这正是「只有告警没有红灯」的典型假绿）。
     */
    classNames: {
      type: [Object, Function] as PropType<CalendarProps['classNames']>,
      default: undefined,
    },
    styles: {
      type: [Object, Function] as PropType<CalendarProps['styles']>,
      default: undefined,
    },
    locale: { type: Object as PropType<CalendarProps['locale']>, default: undefined },

    validRange: {
      type: Array as unknown as PropType<CalendarProps['validRange']>,
      default: undefined,
    },
    disabledDate: { type: Function as PropType<CalendarProps['disabledDate']>, default: undefined },

    // ⚠️ 4 个废弃 prop + 3 个渲染 prop：函数 / VNode 都没有可靠构造器 ⇒ `type: null`
    //    （仓内惯例，见 `picker/panel-props.ts` 的说明），不要用 `PropType<unknown>`
    //    （那会让该 prop 推断成 `undefined`，PITFALLS 13）。
    dateFullCellRender: {
      type: null as unknown as PropType<CalendarProps['dateFullCellRender']>,
      default: undefined,
    },
    dateCellRender: {
      type: null as unknown as PropType<CalendarProps['dateCellRender']>,
      default: undefined,
    },
    monthFullCellRender: {
      type: null as unknown as PropType<CalendarProps['monthFullCellRender']>,
      default: undefined,
    },
    monthCellRender: {
      type: null as unknown as PropType<CalendarProps['monthCellRender']>,
      default: undefined,
    },
    cellRender: {
      type: null as unknown as PropType<CalendarProps['cellRender']>,
      default: undefined,
    },
    fullCellRender: {
      type: null as unknown as PropType<CalendarProps['fullCellRender']>,
      default: undefined,
    },
    headerRender: {
      type: null as unknown as PropType<CalendarProps['headerRender']>,
      default: undefined,
    },

    value: { type: null as unknown as PropType<CalendarDate>, default: undefined },
    defaultValue: { type: null as unknown as PropType<CalendarDate>, default: undefined },
    mode: { type: String as PropType<CalendarMode>, default: undefined },
    /**
     * 🚨 **布尔 prop 必须显式 `undefined` 默认值**（PITFALLS 46）：Vue 会把未传的
     * Boolean prop 赋成 `false`，而 `fullscreen` 的默认值是 **`true`** ⇒ 不写就是
     * 「默认迷你日历」。
     */
    fullscreen: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    showWeek: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  },
  emits: {
    change: (_date: CalendarDate) => true,
    'update:value': (_date: CalendarDate) => true,
    panelChange: (_date: CalendarDate, _mode: CalendarMode) => true,
    'update:mode': (_mode: CalendarMode) => true,
    select: (_date: CalendarDate, _info: SelectInfo) => true,
  },
  setup(props, { attrs, emit, expose }) {
    /**
     * ⚠️ `useComponentConfig` 的默认泛型是 `Record<string, unknown>`（它只负责搬运）——
     * 这里按 `slider/Slider.vue` 的既有手法显式收窄成本组件要用的形状。
     * 不收窄的话 `context.classNames` 是 `unknown`，`useMergeSemantic` 会报
     * 「`() => unknown` 不可赋给 `MaybeSource<…>`」。
     */
    const context = useComponentConfig('calendar') as unknown as {
      classNames?: CalendarSemanticClassNames;
      styles?: CalendarSemanticStyles;
      className?: string;
      style?: CSSProperties;
      getPrefixCls: (suffix?: string, custom?: string) => string;
      direction?: 'ltr' | 'rtl';
    };
    /**
     * ⚠️ **必须** `useDirection()`：`useComponentConfig()` 的 `direction` 是 `inject`
     * 的快照，直接解构不会跟着 Provider 变（D27）。
     */
    const direction = useDirection();

    const prefixCls = computed(() => context.getPrefixCls('picker', props.prefixCls));
    const calendarPrefixCls = computed(() => `${prefixCls.value}-calendar`);

    // ============================== 状态 ==============================
    /**
     * 受控 / 非受控（上游 `useControlledState(() => defaultValue || getNow(), value)`）。
     *
     * ⚠️ 默认值是 **`getNow()`（运行时求值）** ⇒ 用例必须显式传 `value`，
     * 否则基线随运行日变化（与 date-picker 的 `defaultPickerValue` 同判）。
     */
    const innerValue = ref<CalendarDate>(props.defaultValue ?? dayjsConfig.getNow());
    watch(
      () => props.value,
      (next) => {
        if (next !== undefined) {
          innerValue.value = next;
        }
      },
    );
    const mergedValue = computed<CalendarDate>(() => props.value ?? innerValue.value);

    const innerMode = ref<CalendarMode>('month');
    watch(
      () => props.mode,
      (next) => {
        if (next !== undefined) {
          innerMode.value = next;
        }
      },
    );
    const mergedMode = computed<CalendarMode>(() => props.mode ?? innerMode.value);

    /** `'year'` 模式下面板退化成「月网格」（`panelMode = 'month'`）。 */
    const panelMode = computed<'month' | 'date'>(() =>
      mergedMode.value === 'year' ? 'month' : 'date',
    );

    const mergedFullscreen = computed(() => props.fullscreen ?? true);

    const today = dayjsConfig.getNow();

    // ============================== 告警 ==============================
    const devWarning = useDevWarning('Calendar');
    /**
     * ⚠️ 判据是 `!== undefined`（Vue 的 props 恒含所有声明过的键，照抄上游的
     * `in props` 会**恒告警**）—— 与 date-picker 同判。
     */
    watch(
      () => [
        props.dateFullCellRender,
        props.dateCellRender,
        props.monthFullCellRender,
        props.monthCellRender,
      ],
      () => {
        devWarning.deprecated(
          props.dateFullCellRender === undefined,
          'dateFullCellRender',
          'fullCellRender',
        );
        devWarning.deprecated(props.dateCellRender === undefined, 'dateCellRender', 'cellRender');
        devWarning.deprecated(
          props.monthFullCellRender === undefined,
          'monthFullCellRender',
          'fullCellRender',
        );
        devWarning.deprecated(props.monthCellRender === undefined, 'monthCellRender', 'cellRender');
      },
      { immediate: true },
    );

    // ============================== 语义槽 ==============================
    /**
     * 传给函数式 `classNames` / `styles` 的 `info.props`。
     *
     * 上游：`const mergedProps = { ...props, mode, fullscreen, showWeek }` ——
     * 这里的 `mode` / `fullscreen` / `showWeek` 是**解构出来的 props**，其中
     *   - `fullscreen` 有解构默认值 `= true` ⇒ 是**解析后**的（未传 ⇒ `true`）；
     *   - `mode` **没有**默认值 ⇒ 未传时是 **`undefined`**（**不是** `'month'`！）；
     *   - `showWeek` 同理是原始值。
     *
     * 🚨 这条是 L4 抓到的**真 bug**：我最初写的是 `mode: mergedMode.value`（`'month'`），
     * 于是 `calendar:semantic-fn` 用例里上游产出 `m-undefined`、我们产出 `m-month`。
     * ⇒ **只有 `fullscreen` 需要补默认值，`mode` 必须保持原始 prop**。
     */
    const semanticProps = { ...props } as CalendarProps;
    watch(
      () => props.fullscreen,
      () => {
        Object.assign(semanticProps, props, { fullscreen: mergedFullscreen.value });
      },
      { immediate: true },
    );

    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      CalendarProps,
      CalendarSemanticClassNames,
      CalendarSemanticStyles
    >(
      [() => context.classNames, () => props.classNames],
      [() => context.styles, () => semanticRootStyle(context.style), () => props.styles],
      semanticProps,
    );

    /**
     * **6 个槽是两段式归属**：`root` / `header` 归 Calendar 自己用，
     * `body` / `content` / `item` / `itemContent` **转交面板**。
     */
    const rootCls = computed(() => mergedClassNames.value.root);
    const headerCls = computed(() => mergedClassNames.value.header);
    const rootStyle = computed(() => mergedStyles.value.root);
    const headerStyle = computed(() => mergedStyles.value.header);
    const panelClassNames = computed(() => {
      const { root: _root, header: _header, ...rest } = mergedClassNames.value;
      return rest;
    });
    const panelStyles = computed(() => {
      const { root: _root, header: _header, ...rest } = mergedStyles.value;
      return rest;
    });

    /**
     * ⚠️ `itemContent` **特殊**：它除了转交面板，还**单独**被默认的单元格渲染
     * 用在 `${calendarPrefixCls}-date-content` 上（同一个槽名落两处）。
     */
    const mergedItemContentClassName = computed(() => mergedClassNames.value.itemContent);
    const mergedItemContentStyle = computed(() => mergedStyles.value.itemContent);

    // ============================== 禁用 ==============================
    /**
     * `validRange` 与 `disabledDate` 是**「或」**，且越界判定用 `isAfter`
     * （**不含端点**）—— 上游 `:222-231`。
     */
    const mergedDisabledDate = (date: CalendarDate): boolean => {
      const notInRange = props.validRange
        ? dayjsConfig.isAfter(props.validRange[0], date) ||
          dayjsConfig.isAfter(date, props.validRange[1])
        : false;
      return notInRange || !!props.disabledDate?.(date);
    };

    // ============================== 事件 ==============================
    const triggerPanelChange = (date: CalendarDate, newMode: CalendarMode): void => {
      emit('panelChange', date, newMode);
    };

    /**
     * 判据 2：三条顺序 + `isSameDate` 守卫。
     *
     * 🚨 **必须先取快照再写状态**（PITFALLS 13 / 207）：
     * 上游是 React —— `mergedValue` 是**本次渲染的闭包常量**，`setMergedValue(next)` 是
     * 排队的 state 更新 ⇒ 后面那句 `isSameDate(date, mergedValue)` 比的是**旧**值。
     * 本仓的 `mergedValue` 是 Vue 的 `computed` ⇒ 一旦写了 `innerValue`，
     * 它**立刻**返回新值 ⇒ `isSameDate(date, mergedValue)` **恒真** ⇒
     * **非受控模式下 `change` / `panelChange` 永远不发**。
     *
     * 这个 bug 是 L1 抓到的（非受控用例），修法就是下面这行 `const prev`。
     */
    const triggerChange = (date: CalendarDate): void => {
      /** 🚨 快照：下面写 `innerValue` 之后 `mergedValue` 就变了。 */
      const prev = mergedValue.value;
      const changed = !isSameDate(date, prev);

      // 上游 `setMergedValue(date)` 是**无条件**的（同一天也会把内部值归一）
      if (props.value === undefined) {
        innerValue.value = date;
      }

      // ⚠️ `update:value` 放在守卫**里面**：与 `change` 同时发（C11 的「双发」），
      //    而不是在「同一天」时单独发一个值没变的更新。
      if (changed) {
        emit('update:value', date);

        if (
          (panelMode.value === 'date' && !isSameMonth(date, prev)) ||
          (panelMode.value === 'month' && !isSameYear(date, prev))
        ) {
          triggerPanelChange(date, mergedMode.value);
        }
        emit('change', date);
      }
    };

    /** 判据 3：传**当前值**，不是新日期；判据 4 见 `onInternalSelect`。 */
    const triggerModeChange = (newMode: CalendarMode): void => {
      const changed = newMode !== mergedMode.value;
      if (props.mode === undefined) {
        innerMode.value = newMode;
      }
      // ⚠️ `update:mode` **只在模式真的变了**时发（`panelChange` 会因跨月/跨年多发一次）
      if (changed) {
        emit('update:mode', newMode);
      }
      triggerPanelChange(mergedValue.value, newMode);
    };

    /** 判据 4：面板那一支传的是 `panelMode`。 */
    const onInternalSelect = (date: CalendarDate, source: SelectInfo['source']): void => {
      triggerChange(date);
      emit('select', date, { source });
    };

    // ============================== 渲染 ==============================
    /** 判据 5：这里判 **`isFunction`**（`monthRender` 判真值，两处不同）。 */
    const dateRender = (date: CalendarDate, info: CalendarCellRenderInfo): VNodeChild => {
      if (isFunction(props.fullCellRender)) {
        return props.fullCellRender(date, info);
      }
      if (isFunction(props.dateFullCellRender)) {
        return props.dateFullCellRender(date, info);
      }
      return h(
        'div',
        {
          class: [
            `${prefixCls.value}-cell-inner`,
            `${calendarPrefixCls.value}-date`,
            { [`${calendarPrefixCls.value}-date-today`]: isSameDate(today, date) },
          ],
        },
        [
          h('div', { class: `${calendarPrefixCls.value}-date-value` }, [
            String(dayjsConfig.getDate(date)).padStart(2, '0'),
          ]),
          h(
            'div',
            {
              class: [`${calendarPrefixCls.value}-date-content`, mergedItemContentClassName.value],
              style: mergedItemContentStyle.value,
            },
            [
              isFunction(props.cellRender)
                ? props.cellRender(date, info)
                : props.dateCellRender?.(date, info),
            ],
          ),
        ],
      );
    };

    /** 判据 5（第二处）：这里判 **真值**，不是 `isFunction`。 */
    const monthRender = (date: CalendarDate, info: CalendarCellRenderInfo): VNodeChild => {
      if (props.fullCellRender) {
        return props.fullCellRender(date, info);
      }
      if (props.monthFullCellRender) {
        return props.monthFullCellRender(date, info);
      }

      /**
       * 判据 6：`shortMonths` 只有 5 个语言包有 ⇒ 回退分支是**主路径**。
       *
       * ⚠️ `info.locale` **本身就是「lang」那一层**（上游 `monthRender` 收的是
       * `{...info, locale: locale?.lang}`，见 `mergedCellRender`）——
       * 写成 `info.locale.lang` 会差一级（本轮实测报 `Property 'lang' does not exist`）。
       */
      const lang = info.locale;
      const months = lang.shortMonths ?? dayjsConfig.locale.getShortMonths?.(lang.locale) ?? [];

      return h(
        'div',
        {
          class: [
            `${prefixCls.value}-cell-inner`,
            `${calendarPrefixCls.value}-date`,
            { [`${calendarPrefixCls.value}-date-today`]: isSameMonth(today, date) },
          ],
        },
        [
          h('div', { class: `${calendarPrefixCls.value}-date-value` }, [
            months[dayjsConfig.getMonth(date)],
          ]),
          h(
            'div',
            {
              class: [`${calendarPrefixCls.value}-date-content`, mergedItemContentClassName.value],
              style: mergedItemContentStyle.value,
            },
            [
              isFunction(props.cellRender)
                ? props.cellRender(date, info)
                : props.monthCellRender?.(date, info),
            ],
          ),
        ],
      );
    };

    /** locale：与 `ConfigProvider` 的 `locale.Calendar` **深合并**（上游用 `merge`）。 */
    const [contextLocale] = useLocale('Calendar');
    const locale = computed<PickerLocale>(() =>
      merge<PickerLocale>(contextLocale, (props.locale ?? {}) as PickerLocale),
    );

    /** 判据 7：按 `info.type` 分派；`month` 那一支**把 `locale` 换成 `locale.lang`**。 */
    const mergedCellRender = (current: PanelDateType, info: PanelCellRenderInfo): VNodeChild => {
      if (info.type === 'date') {
        return dateRender(current as CalendarDate, info);
      }
      if (info.type === 'month') {
        return monthRender(current as CalendarDate, { ...info, locale: locale.value.lang });
      }
      return undefined;
    };

    const nativeElementRef = ref<HTMLDivElement | null>(null);
    expose({
      get nativeElement() {
        return nativeElementRef.value;
      },
    });

    return () => {
      const cls = calendarPrefixCls.value;

      /** 上游 `clsx(calendarPrefixCls, {…}, contextClassName, className, rootClassName, rootCls, hashId, cssVarCls)`。 */
      const rootClass = [
        cls,
        {
          [`${cls}-full`]: mergedFullscreen.value,
          [`${cls}-mini`]: !mergedFullscreen.value,
          [`${cls}-rtl`]: direction.value === 'rtl',
        },
        context.className,
        rootCls.value,
        // 无 `hashId`（D2）；`css-var` 类与 `genCalendarStyle` 的 `${cls}-css-var` 对应
        'css-var-root',
        `${cls}-css-var`,
      ];

      const headerVNode = props.headerRender
        ? h(NodeRenderer, {
            node: props.headerRender({
              value: mergedValue.value,
              type: mergedMode.value,
              onChange: (nextDate: CalendarDate) => onInternalSelect(nextDate, 'customize'),
              onTypeChange: triggerModeChange,
            }),
          })
        : h(CalendarHeader as Component, {
            class: headerCls.value,
            style: headerStyle.value,
            prefixCls: cls,
            value: mergedValue.value,
            mode: mergedMode.value,
            fullscreen: mergedFullscreen.value,
            locale: locale.value.lang,
            validRange: props.validRange,
            onChange: onInternalSelect,
            onModeChange: triggerModeChange,
          });

      const panelVNode = h(PickerPanel as Component, {
        classNames: panelClassNames.value,
        styles: panelStyles.value,
        /**
         * ⚠️ **必须是数组**：本仓 `PickerPanel` 的 `value` 契约是 `PanelDateType[]`
         * （上游给 rc 传单个值，rc 内部 `toArray`）。见文件头「平台差异」第 1 条。
         */
        value: [mergedValue.value],
        prefixCls: prefixCls.value,
        locale: locale.value.lang,
        generateConfig: dayjsConfig,
        cellRender: mergedCellRender,
        onSelect: (nextDate: PanelDateType) => {
          onInternalSelect(nextDate as CalendarDate, panelMode.value);
        },
        mode: panelMode.value,
        picker: panelMode.value,
        disabledDate: mergedDisabledDate,
        hideHeader: true,
        showWeek: props.showWeek,
      });

      /**
       * 🚨 **根节点不透传 `attrs`** —— 上游 `generateCalendar.js` 的根节点是
       * `className={clsx(…)} style={rootStyle}`，**没有 `{...restProps}`**
       * （实测该文件里 `restProps` 出现 **0** 次）⇒ `id` / `data-*` / `aria-*`
       * 在 antd 那边会被**丢弃**。L4 的 `calendar:attrs` 用例钉的就是这条
       * （首轮红：`我们多出属性 aria-label="日历"` / `data-testid="cal"`）。
       *
       * ⚠️ 但 **Vue 的 `class` / `style` 落的是 `attrs`**（React 是 `className` / `style`
       * **prop**）⇒ 必须**显式并入**，否则 `<Calendar class="x">` 会被一起丢掉，
       * 反而与上游不一致（上游的 `className` 是会合并的）。
       */
      return h(
        'div',
        {
          ref: nativeElementRef,
          class: [...rootClass, attrs.class],
          style: [rootStyle.value, attrs.style],
        },
        [headerVNode, panelVNode],
      );
    };
  },
});
</script>
