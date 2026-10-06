/**
 * CalendarHeader —— 上游 `components/calendar/Header.tsx`（201 行）的 Vue 对应物。
 *
 * ── 为什么是 `.ts` 渲染函数而不是 `.vue` ────────────────────────────────────────
 *
 * 上游这一个文件里有 **三个内联子组件**（`YearSelect` / `MonthSelect` / `ModeSwitch`），
 * 它们**不单独导出**、只被本文件用。写成 `.vue` 会得到三个近乎空的 SFC
 * （每个都只是「一层 Select」或「一层 Radio.Group」），反而看不清结构。
 * 同族的 `auto-complete/AutoComplete.ts` / `anchor/Anchor.ts` 是同样的判断。
 *
 * ── 四条必须复刻的判据（照抄上游，别「统一」）──────────────────────────────────
 *
 * 1. **年下拉是 `year ± 10` 共 20 项**：`start = year - 10`、`end = start + 20`、
 *    循环是 `index < end`（**不是 `<=`**）⇒ `year-10 … year+9`。
 *    有 `validRange` 时改用「范围的起止年」（`end = getYear(range[1]) + 1`，仍然 `<`）。
 * 2. **`suffix` 只对中文生效**：`locale.year === '年' ? '年' : ''` —— 判据是**字符串比较**，
 *    不是「语言是不是中文」。⇒ 只有 `zh_*` 系会得到 `2026年`，其它语言是裸 `2026`。
 * 3. **`MonthSelect` 只在 `mode === 'month'` 时渲染**；而 `ModeSwitch` **恒渲染**。
 * 4. **`size` 的判据是 `fullscreen ? undefined : 'small'`** —— 全屏时**不传**
 *    （让 Select / Radio 走自己的默认尺寸），不是传 `'middle'`。
 *
 * ── 两处平台差异（PLATFORM）──────────────────────────────────────────────────
 *
 * - **`getPopupContainer` 指 header 的那个 `div`**（**不是** root）。上游用 `divRef.current`；
 *   Vue 用模板 ref（`ref<HTMLDivElement>`）取同一个节点。⚠️ 指 root 会让下拉的定位父级
 *   差一层，L6 的 `select` / `customize-header` 用例会红。
 * - **`FormItemInputContext` 的覆盖走 `provide`**：上游是
 *   `<FormItemInputContext.Provider value={...isFormItemInput:false}>`；Vue 侧
 *   `provide(formItemInputContextKey, computed(...))`。目的是让内嵌的 `Select` / `Radio`
 *   **不认成表单项**（否则会多出 `-in-form-item` 类与紧凑样式）。
 */
import type { PickerLangLocale } from '@apollo-design/locale';
import type { GenerateConfig } from '@apollo-design/picker';
import { computed, defineComponent, h, type PropType, provide, ref, type VNodeChild } from 'vue';
import { dayjsConfig } from '../../date-picker/hooks/dayjs-config';
import { formItemInputContextKey, useFormItemInputContext } from '../../form/context';
import { RadioButton, RadioGroup } from '../../radio';
import { Select } from '../../select';
import type { SelectValue } from '../../select/interface';
import type { CalendarDate, CalendarMode, SelectInfo } from '../interface';

/** 年下拉的偏移与总数（上游 `YEAR_SELECT_OFFSET` / `YEAR_SELECT_TOTAL`）。 */
const YEAR_SELECT_OFFSET = 10;
const YEAR_SELECT_TOTAL = 20;

/**
 * 三个内联子组件共用的入参。
 *
 * ⚠️ **不含 `onChange`** —— 上游是 `{...sharedProps}` 再覆盖 `onChange`，
 * 本仓直接把它当独立参数传，避免留一个「永远不会被调用」的默认值
 * （那会让读者以为存在某条走默认值的路径）。
 */
interface SharedProps {
  prefixCls: string;
  value: CalendarDate;
  validRange?: [CalendarDate, CalendarDate];
  /**
   * 🚨 **两个包都有叫 `PickerLocale` 的类型，但形状不同**：
   *
   * | 包 | 类型 | 形状 |
   * |---|---|---|
   * | `@apollo-design/locale` | `PickerLocale` | `{ lang, timePickerLocale }`（**外层**） |
   * | `@apollo-design/locale` | **`PickerLangLocale`** | `{ locale, year, month, shortMonths?, … }` |
   * | `@apollo-design/picker` | `PickerLocale` | 面板**真正会读**的子集（**没有** `year` / `month`） |
   *
   * 本组件要 `locale.year` / `locale.month` / `locale.shortMonths` ⇒ **必须**用
   * `PickerLangLocale`。用 picker 那份会报 `Property 'year' does not exist`
   * （本轮实测踩到）。
   */
  locale: PickerLangLocale;
  fullscreen: boolean;
  divRef: { value: HTMLDivElement | null };
}

/**
 * Select 的公共 props。
 *
 * ⚠️ **`size` 必须「有则不传」而不是传 `undefined`**：本仓 `Select` 的 `size` 是
 * **带 default 的 prop**（类型 `SizeType`，不含 `undefined`）⇒ 显式传 `undefined`
 * 过不了类型检查。运行期两者等价（Vue 对 `undefined` 会走 default），
 * 所以这里按「非全屏才加 `size: 'small'`」构造。
 */
function selectBase(p: SharedProps, className: string): Record<string, unknown> {
  return {
    // ⚠️ Select 已迁移到「根 class 走原生 attrs」⇒ 必须用 `class`
    //    （传旧的 `className` 会让 Select 的整条类名链塌陷 —— 只留下这一个类）
    class: className,
    getPopupContainer: () => p.divRef.value as HTMLElement,
    ...(p.fullscreen ? {} : { size: 'small' as const }),
  };
}

/** 年下拉（上游 `YearSelect`）。 */
function renderYearSelect(p: SharedProps & { onChange: (date: CalendarDate) => void }): VNodeChild {
  const config: GenerateConfig<CalendarDate> = dayjsConfig;
  const year = config.getYear(p.value || config.getNow());

  let start = year - YEAR_SELECT_OFFSET;
  let end = start + YEAR_SELECT_TOTAL;

  if (p.validRange) {
    start = config.getYear(p.validRange[0]);
    end = config.getYear(p.validRange[1]) + 1;
  }

  // ⚠️ 判据是**字符串比较**，不是「语言是不是中文」
  const suffix = p.locale && p.locale.year === '年' ? '年' : '';
  const options: { label: string; value: number }[] = [];
  for (let index = start; index < end; index += 1) {
    options.push({ label: `${index}${suffix}`, value: index });
  }

  return h(Select, {
    ...selectBase(p, `${p.prefixCls}-year-select`),
    options,
    value: year,
    onChange: (rawYear: SelectValue) => {
      const numYear = rawYear as number;
      let newDate = config.setYear(p.value, numYear);

      if (p.validRange) {
        const [startDate, endDate] = p.validRange;
        const newYear = config.getYear(newDate);
        const newMonth = config.getMonth(newDate);
        if (newYear === config.getYear(endDate) && newMonth > config.getMonth(endDate)) {
          newDate = config.setMonth(newDate, config.getMonth(endDate));
        }
        if (newYear === config.getYear(startDate) && newMonth < config.getMonth(startDate)) {
          newDate = config.setMonth(newDate, config.getMonth(startDate));
        }
      }

      p.onChange(newDate);
    },
  });
}

/** 月下拉（上游 `MonthSelect`，**仅 `mode === 'month'` 时渲染**）。 */
function renderMonthSelect(
  p: SharedProps & { onChange: (date: CalendarDate) => void },
): VNodeChild {
  const config: GenerateConfig<CalendarDate> = dayjsConfig;
  const month = config.getMonth(p.value || config.getNow());

  let start = 0;
  let end = 11;

  if (p.validRange) {
    const [rangeStart, rangeEnd] = p.validRange;
    const currentYear = config.getYear(p.value);
    if (config.getYear(rangeEnd) === currentYear) {
      end = config.getMonth(rangeEnd);
    }
    if (config.getYear(rangeStart) === currentYear) {
      start = config.getMonth(rangeStart);
    }
  }

  const months = p.locale.shortMonths ?? config.locale.getShortMonths?.(p.locale.locale) ?? [];
  const options: { label: string; value: number }[] = [];
  for (let index = start; index <= end; index += 1) {
    options.push({ label: months[index] ?? '', value: index });
  }

  return h(Select, {
    ...selectBase(p, `${p.prefixCls}-month-select`),
    value: month,
    options,
    onChange: (rawMonth: SelectValue) => {
      p.onChange(config.setMonth(p.value, rawMonth as number));
    },
  });
}

/** 模式切换（上游 `ModeSwitch`，一个 `Radio.Group` + 两个 `Radio.Button`）。 */
function renderModeSwitch(
  p: SharedProps & { mode: CalendarMode; onModeChange: (m: CalendarMode) => void },
): VNodeChild {
  return h(
    RadioGroup,
    {
      // ⚠️ `value` / `onChange` 是 RadioGroup 的 **prop**（不是 emit），见其 interface
      value: p.mode,
      // RadioGroup 已迁移到「根 class 走原生 attrs」⇒ 这里必须用 `class`
      class: `${p.prefixCls}-mode-switch`,
      ...(p.fullscreen ? {} : { size: 'small' as const }),
      onChange: (e: { target: { value: string } }) => {
        p.onModeChange(e.target.value as CalendarMode);
      },
    },
    () => [
      h(RadioButton, { value: 'month' }, () => p.locale.month),
      h(RadioButton, { value: 'year' }, () => p.locale.year),
    ],
  );
}

/** `CalendarHeader` 的 props（上游 `CalendarHeaderProps`）。 */
export const CalendarHeader = defineComponent({
  name: 'ACalendarHeader',
  props: {
    className: { type: String, default: undefined },
    style: { type: Object as PropType<Record<string, string>>, default: undefined },
    prefixCls: { type: String, required: true },
    value: { type: null as unknown as PropType<CalendarDate>, required: true },
    validRange: {
      type: Array as unknown as PropType<[CalendarDate, CalendarDate] | undefined>,
      default: undefined,
    },
    locale: { type: Object as PropType<PickerLangLocale>, required: true },
    mode: { type: String as PropType<CalendarMode>, required: true },
    fullscreen: { type: Boolean, default: true },
    onChange: {
      type: Function as PropType<(date: CalendarDate, source: SelectInfo['source']) => void>,
      required: true,
    },
    onModeChange: {
      type: Function as PropType<(mode: CalendarMode) => void>,
      required: true,
    },
  },
  setup(props) {
    const divRef = ref<HTMLDivElement | null>(null);

    /**
     * 覆盖 `isFormItemInput: false` —— 让内嵌的 Select / Radio **不认成表单项**。
     *
     * ⚠️ `useFormItemInputContext()` 返回的是 `ComputedRef`（可能来自 StatusProvider
     * 的响应式源）⇒ 这里 provide 一个 `computed` 而不是快照对象，
     * 否则外层 status 变化传不进来。
     */
    const formItemInputContext = useFormItemInputContext();
    provide(
      formItemInputContextKey,
      computed(() => ({ ...formItemInputContext.value, isFormItemInput: false })),
    );

    return () => {
      const shared: SharedProps = {
        prefixCls: props.prefixCls,
        value: props.value,
        validRange: props.validRange,
        locale: props.locale,
        fullscreen: props.fullscreen,
        divRef,
      };

      return h(
        'div',
        {
          class: [`${props.prefixCls}-header`, props.className],
          style: props.style,
          ref: divRef,
        },
        [
          renderYearSelect({ ...shared, onChange: (v) => props.onChange(v, 'year') }),
          // ⚠️ 仅 `mode === 'month'` 时渲染月下拉
          props.mode === 'month'
            ? renderMonthSelect({ ...shared, onChange: (v) => props.onChange(v, 'month') })
            : null,
          renderModeSwitch({
            ...shared,
            mode: props.mode,
            onModeChange: props.onModeChange,
          }),
        ],
      );
    };
  },
});

export default CalendarHeader;
