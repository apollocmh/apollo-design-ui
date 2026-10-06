/**
 * L1 单元 + L2 交互（G5/G6）—— **上游 testCases 的镜像**。
 *
 * 契约来源：antd 6.6.4 `components/date-picker/__tests__/DatePicker.test.tsx`（**707 行**）。
 * 本文件逐条移植其中**可跨框架表达**的用例（判据是「断言的是什么」，不是「怎么写」）：
 * React 的 `render/rerender/fireEvent` → Vue 的 `mount/setProps/trigger`，
 * `container.querySelector('.ant-x')` → `w.find('.apollo-x')`。
 *
 * ── 与其它测试文件的分工（本仓把上游的一个大文件拆成按阶段分文件）──────────────
 *
 * | 文件 | 对应上游 |
 * |---|---|
 * | **本文件** | `DatePicker.test.tsx` 的 testCases 镜像（G5/G6 的正式交付物） |
 * | `picker-pure.test.ts` | 纯函数（上游没有对应物，是本仓的 L1 拆解） |
 * | `picker-typing.test.ts` / `mask-format.test.ts` | 上游 `useInputProps` / `MaskFormat` |
 * | `picker-value-change.test.ts` | 上游 `useRangeValueChange.js`（405 行状态机） |
 * | `s1-smoke` / `s2-typing` / `s2-commit` / `s3-mask` / `s4-focus` / `s5-mode` / `s5-multiple` | 按阶段拆的 L2 |
 * | `semantic.test.ts` | 上游 `semantic.test.tsx`（L4 DOM 契约） |
 * | `a11y.test.ts` | 上游 `a11y.test.ts`（L5） |
 *
 * ── 🚨 移植时的三处「判据换了但语义没变」────────────────────────────────────
 *
 * 1. **`MockDate.set('2016-11-22')` → 固定 `defaultValue`**。上游靠 MockDate 让
 *    `dayjs()` 恒为 2016-11-22；本仓**不引入 mockdate**，改成把「今天」从判据里去掉
 *    （用 `defaultValue` 锚定面板显示的月份）⇒ 用例不依赖运行时刻，比上游更稳。
 * 2. **`!(oldProp in props)` → `props.x === undefined`**。React 的 `props` 只含**实际传过**
 *    的键；Vue 的 `props` 恒含所有声明过的键 ⇒ 照抄 `in` 会**恒告警**。
 * 3. **`triggerProps.popupPlacement`**（上游 mock 了 `@rc-component/trigger`）**不移植** ——
 *    本仓对应判据在 `picker-pure.test.ts` 的 `getRealPlacement`（纯函数，更好测）。
 *
 * ── ⛔ 未移植清单（**不是**「假装通过」，逐条给理由）──────────────────────────
 *
 * | 上游用例 | 为什么不移植 |
 * |---|---|
 * | `DatePicker.generatePicker` | 本仓**有意不实现**（只支持 dayjs），登记为 INTENDED |
 * | `DatePicker.RangePicker with defaultValue and showTime` / `RangePicker placement api` | 范围版未落地（S5 剩余） |
 * | `focusTest`（上游 `tests/shared/focusTest`） | 上游测的是 **React 组件实例的 `focus()`/`blur()` 命令面**；本仓等价物在 `s4-focus.test.ts` 与 L3 的 `expose` 类型契约里 |
 * | `should support global colorError/WarningAffix token` | 断言的是 **CSS 计算值**（`getComputedStyle` 读 `var(--…)`）⇒ 属 L6/theme 层，由 `theme.test.ts` 的规则断言覆盖 |
 * | 各类 `toMatchSnapshot()` | 本仓以 **L4 的逐属性 DOM 契约**（`semantic.test.ts` + `baselines/date-picker.dom.json`）替代快照 —— 快照「变了就红、不看差在哪」 |
 */

import type { PickerLocale } from '@apollo-design/locale';
import { resetWarned } from '@apollo-design/test-utils';
import { mount } from '@vue/test-utils';
import dayjs from 'dayjs';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import ConfigProvider from '../../config-provider/ConfigProvider';
import DatePicker from '../DatePicker.vue';
import type { SingleValue } from '../interface';
import RangePicker from '../RangePicker.vue';

const P = 'apollo-picker';

const mountPicker = (props: Record<string, unknown> = {}) => mount(DatePicker, { props });

/** 面板里的一个日期格（按文本找，与上游的 `getCell` 同判）。 */
const getCell = (w: ReturnType<typeof mount>, text: string) =>
  w.findAll(`.${P}-cell`).find((cell) => cell.text() === text);

/** 时间面板的列（每列一组可选项）。 */
const columns = (w: ReturnType<typeof mount>) => w.findAll(`.${P}-time-panel-column`);
const cellsIn = (w: ReturnType<typeof mount>, index: number) =>
  columns(w)[index]?.findAll(`.${P}-time-panel-cell`) ?? [];

const clearButton = (w: ReturnType<typeof mount>) => w.find(`.${P}-clear`);
const inputEl = (w: ReturnType<typeof mount>) =>
  w.find(`.${P}-input input`).element as HTMLInputElement;

describe('DatePicker · locale 与 placeholder（上游 testCases）', () => {
  it('`prop locale` 生效：`lang.placeholder` 与 `lang.clear` 都取自它', () => {
    // 上游 `prop locale should works` 只做快照；本仓改成两条**语义**断言
    // （快照「变了就红、不看差在哪」，结构已由 L4 的逐属性契约覆盖）
    const locale = {
      lang: { locale: 'mk', placeholder: 'Избери дата', clear: 'Изчистване' },
    } as unknown as PickerLocale;

    const w = mountPicker({ locale, defaultValue: dayjs('2000-01-01') });

    expect(inputEl(w).placeholder).toBe('Избери дата');
    // 🚨 清除按钮的可访问名取 **`locale.clear`**（不是字面量 "Clear"）
    expect(clearButton(w).attributes('aria-label')).toBe('Изчистване');
    w.unmount();
  });

  it('`placeholder`：默认取 locale 的 `Select date`，自定义优先', () => {
    const a = mountPicker();
    expect(inputEl(a).placeholder).toBe('Select date');
    a.unmount();

    const b = mountPicker({ placeholder: '自定义' });
    expect(inputEl(b).placeholder).toBe('自定义');
    b.unmount();
  });

  it('`locale` 是**深合并**：只给 `shortWeekDays` 时其余字段保留默认', () => {
    // 上游 `should support deep merge locale with partial fields`
    const w = mountPicker({
      open: true,
      locale: { lang: { shortWeekDays: ['一', '二', '三', '四', '五', '六', '日'] } } as never,
    });

    // ① 面板表头用了自定义的短星期
    expect(w.find(`.${P}-content thead`).text()).toContain('一二三四五六日');
    // ② 但 placeholder 仍是默认值 ⇒ 证明是**深合并**而不是整包替换
    expect(inputEl(w).placeholder).toBe('Select date');
    w.unmount();
  });
});

describe('DatePicker · disabledDate（上游 testCases）', () => {
  it('`disabledDate` 生效：早于锚点的格子被禁用，之后的没有', () => {
    // ⚠️ 上游用 `MockDate.set('2016-11-22')` 让 `dayjs()` 固定；
    //    本仓改用 `defaultValue` **锚定面板显示的月份** + 固定的比较基准
    //    ⇒ 判据与运行时刻无关。
    const anchor = dayjs('2016-11-22');
    const w = mountPicker({
      open: true,
      defaultValue: anchor,
      disabledDate: (current: dayjs.Dayjs) => current.isBefore(anchor.endOf('day')),
    });

    expect(getCell(w, '21')?.classes()).toContain(`${P}-cell-disabled`);
    expect(getCell(w, '23')?.classes()).not.toContain(`${P}-cell-disabled`);
    w.unmount();
  });
});

describe('DatePicker · showTime 的列数与格式推导（上游 testCases）', () => {
  /**
   * 上游有 8 条几乎同形的用例，这里用一张表覆盖。
   *
   * 判据：`showTime` 的 show 标志决定**列数与每列的项数** ——
   * 这正是 S2 的 `fillShowTimeConfig` 的产物（`showHour` → 24 项、
   * `showMinute` / `showSecond` → 60 项）。
   */
  const cases: Array<{ title: string; showTime: Record<string, boolean>; expected: number[] }> = [
    {
      title: 'showHour + showMinute',
      showTime: { showHour: true, showMinute: true },
      expected: [24, 60],
    },
    {
      title: 'showMinute + showSecond',
      showTime: { showMinute: true, showSecond: true },
      expected: [60, 60],
    },
    {
      title: 'showHour + showMinute + showSecond',
      showTime: { showHour: true, showMinute: true, showSecond: true },
      expected: [24, 60, 60],
    },
    {
      title: 'showHour + showSecond',
      showTime: { showHour: true, showSecond: true },
      expected: [24, 60],
    },
    { title: 'showSecond', showTime: { showSecond: true }, expected: [60] },
    { title: 'showMinute', showTime: { showMinute: true }, expected: [60] },
    { title: 'showHour', showTime: { showHour: true }, expected: [24] },
  ];

  for (const { title, showTime, expected } of cases) {
    it(`\`showTime=${title}\` ⇒ ${expected.length} 列，每列 ${expected.join('/')} 项`, () => {
      const w = mountPicker({
        defaultValue: dayjs('2016-11-22'),
        showTime,
        format: 'YYYY-MM-DD',
        open: true,
      });

      expect(columns(w)).toHaveLength(expected.length);
      expected.forEach((count, index) => {
        expect(cellsIn(w, index)).toHaveLength(count);
      });
      w.unmount();
    });
  }

  it('`showTime={{}}`（一个 show 都没给）⇒ 三段全开（3 列）', () => {
    // 上游 `showTime={{ }} (no true args)`
    const w = mountPicker({
      defaultValue: dayjs('2016-11-22'),
      showTime: {},
      format: 'YYYY-MM-DD',
      open: true,
    });
    expect(columns(w)).toHaveLength(3);
    w.unmount();
  });

  it('`use12Hours`（基准格式里有 `A`）⇒ 小时列 12 项 + 上午/下午列 2 项', () => {
    // 上游 `12 hours`
    const w = mountPicker({
      defaultValue: dayjs('2016-11-22'),
      showTime: true,
      format: 'YYYY-MM-DD HH:mm:ss A',
      open: true,
    });
    expect(columns(w)).toHaveLength(4);
    expect(cellsIn(w, 0)).toHaveLength(12);
    expect(cellsIn(w, 1)).toHaveLength(60);
    expect(cellsIn(w, 2)).toHaveLength(60);
    expect(cellsIn(w, 3)).toHaveLength(2);
    w.unmount();
  });

  it('24 小时制 ⇒ 3 列 24/60/60（没有上午/下午列）', () => {
    // 上游 `24 hours`
    const w = mountPicker({
      defaultValue: dayjs('2016-11-22'),
      showTime: true,
      format: 'YYYY-MM-DD HH:mm:ss',
      open: true,
    });
    expect(columns(w)).toHaveLength(3);
    expect(cellsIn(w, 0)).toHaveLength(24);
    expect(cellsIn(w, 1)).toHaveLength(60);
    expect(cellsIn(w, 2)).toHaveLength(60);
    w.unmount();
  });
});

describe('DatePicker · format 的形态（上游 testCases）', () => {
  it('🚨 `format` 是**函数**时聚焦 / 按下不抛（S2 的函数形态）', () => {
    // 上游 `showTime should work correctly when format is custom function`。
    // 上游只断言「不抛」；本仓额外钉住「值仍能格式化出来」。
    const w = mountPicker({
      defaultValue: dayjs('2016-11-22'),
      showTime: true,
      format: (value: dayjs.Dayjs) => value.format('YYYY-MM-DD'),
      open: true,
    });

    expect(() => inputEl(w).dispatchEvent(new FocusEvent('focus'))).not.toThrow();
    expect(() =>
      inputEl(w).dispatchEvent(new MouseEvent('mousedown', { bubbles: true })),
    ).not.toThrow();
    // 函数形态**参与格式化**（输入框显示的是函数返回的串）
    expect(inputEl(w).value).toBe('2016-11-22');
    w.unmount();
  });

  it('`format` 是**数组**时聚焦 / 按下不抛', () => {
    // 上游 `showTime should work correctly when format is Array`
    const w = mountPicker({
      defaultValue: dayjs('2016-11-22'),
      showTime: true,
      format: ['YYYY-MM-DD HH:mm'],
      open: true,
    });

    expect(() => inputEl(w).dispatchEvent(new FocusEvent('focus'))).not.toThrow();
    expect(() =>
      inputEl(w).dispatchEvent(new MouseEvent('mousedown', { bubbles: true })),
    ).not.toThrow();
    w.unmount();
  });

  it('`kk:mm` ⇒ 2 列 24/60（`k` 也推出 `showHour`）', () => {
    // 上游 `kk:mm format`：`checkShow` 的关键字表里有 `'k'`
    const w = mountPicker({
      defaultValue: dayjs('2016-11-22'),
      format: 'kk:mm',
      showTime: true,
      open: true,
    });
    expect(columns(w)).toHaveLength(2);
    expect(cellsIn(w, 0)).toHaveLength(24);
    expect(cellsIn(w, 1)).toHaveLength(60);
    w.unmount();
  });
});

describe('DatePicker · multiple（上游 testCases）', () => {
  it('`tagRender` 支持**自定义删除逻辑**（受控）', async () => {
    // 上游 `multiple tagRender should support custom remove logic`。
    // ⚠️ 上游的 Demo 是个**受控**组件（`onChange` 里 `setValue`）；
    //    本仓用 `value` + `update:value` 复刻同一件事。
    const lockedBefore = dayjs('2016-11-22');
    let value: dayjs.Dayjs[] = [dayjs('2016-11-20'), dayjs('2016-11-23')];

    const Host = defineComponent({
      setup() {
        return () =>
          h(DatePicker, {
            multiple: true,
            value,
            // ⚠️ `update:value` 的载荷是 `SingleValue`（`Date | Date[] | null`），
            //    不是 `Date[]` —— 多选下运行时恒为数组，但类型面要按 `SingleValue` 接。
            'onUpdate:value': (next: SingleValue) => {
              value = (next as dayjs.Dayjs[] | null) ?? [];
            },
            tagRender: (info: { label: unknown; value: unknown; onClose: () => void }) => {
              const tagValue = info.value as dayjs.Dayjs;
              const locked = tagValue.isBefore(lockedBefore, 'day');
              return h('span', { 'data-testid': `tag-${tagValue.format('YYYY-MM-DD')}` }, [
                h('span', null, [String(info.label)]),
                locked ? null : h('button', { type: 'button', onClick: info.onClose }, ['remove']),
              ]);
            },
          });
      },
    });

    const w = mount(Host);
    // 早于锚点的那个标签**没有**删除按钮
    expect(w.find('[data-testid="tag-2016-11-20"] button').exists()).toBe(false);

    await w.find('[data-testid="tag-2016-11-23"] button').trigger('click');

    expect(w.find('[data-testid="tag-2016-11-20"]').exists()).toBe(true);
    expect(w.find('[data-testid="tag-2016-11-23"]').exists()).toBe(false);
    w.unmount();
  });
});

describe('DatePicker · suffixIcon（上游 testCases）', () => {
  it('默认渲染图标；`false` / `null` ⇒ 整块不渲染；字符串 ⇒ 原样显示', () => {
    // 上游 `suffixIcon`
    const a = mountPicker();
    expect(a.find(`.${P}-suffix`).exists()).toBe(true);
    a.unmount();

    for (const value of [false, null]) {
      const w = mountPicker({ suffixIcon: value });
      expect(w.find(`.${P}-suffix`).exists()).toBe(false);
      w.unmount();
    }

    const c = mountPicker({ suffixIcon: '123' });
    expect(c.find(`.${P}-suffix`).text()).toBe('123');
    c.unmount();
  });

  it('`suffixIcon` 走 ConfigProvider 的 `components.datePicker`，且 **prop 优先**', () => {
    // 上游 `suffixIcon` describe 的前三条
    const viaContext = mount(ConfigProvider, {
      props: { components: { datePicker: { suffixIcon: 'foobar' } } },
      slots: { default: () => h(DatePicker) },
    });
    expect(viaContext.find(`.${P}-suffix`).text()).toBe('foobar');
    viaContext.unmount();

    const preferProp = mount(ConfigProvider, {
      props: { components: { datePicker: { suffixIcon: 'foobar' } } },
      slots: { default: () => h(DatePicker, { suffixIcon: 'bamboo' }) },
    });
    expect(preferProp.find(`.${P}-suffix`).text()).toBe('bamboo');
    preferProp.unmount();
  });
});

describe('DatePicker · allowClear / clearIcon（上游 testCases）', () => {
  const somePoint = dayjs('2023-08-01');

  it('`allowClear` 的四种形态', async () => {
    // 上游 `allows or prohibits clearing as applicable`
    const w = mountPicker({ value: somePoint });
    expect(clearButton(w).exists()).toBe(true);

    await w.setProps({ allowClear: false });
    expect(clearButton(w).exists()).toBe(false);

    await w.setProps({ allowClear: { clearIcon: h('i', { 'data-testid': 'custom-clear' }) } });
    expect(clearButton(w).exists()).toBe(true);
    expect(w.find('[data-testid="custom-clear"]').exists()).toBe(true);

    await w.setProps({ allowClear: {} });
    expect(clearButton(w).exists()).toBe(true);
    w.unmount();
  });

  it('`allowClear` 走 ConfigProvider，且 **prop 优先**', () => {
    const viaContext = mount(ConfigProvider, {
      props: { components: { datePicker: { allowClear: false } } },
      slots: { default: () => h(DatePicker, { value: somePoint }) },
    });
    expect(viaContext.find(`.${P}-clear`).exists()).toBe(false);
    viaContext.unmount();

    const preferProp = mount(ConfigProvider, {
      props: { components: { datePicker: { allowClear: false } } },
      slots: {
        default: () => h(DatePicker, { value: somePoint, allowClear: { clearIcon: h('i') } }),
      },
    });
    expect(preferProp.find(`.${P}-clear`).exists()).toBe(true);
    preferProp.unmount();
  });

  it('`clearIcon` 走 ConfigProvider，且 **prop 优先**', () => {
    const preferProp = mount(ConfigProvider, {
      props: {
        components: {
          datePicker: { allowClear: { clearIcon: h('i', { 'data-testid': 'config-clear' }) } },
        },
      },
      slots: {
        default: () =>
          h(DatePicker, {
            value: somePoint,
            allowClear: { clearIcon: h('i', { 'data-testid': 'custom-clear' }) },
          }),
      },
    });
    expect(preferProp.find('[data-testid="custom-clear"]').exists()).toBe(true);
    expect(preferProp.find('[data-testid="config-clear"]').exists()).toBe(false);
    preferProp.unmount();
  });

  it('点清除按钮 ⇒ 发 `clear` 事件（上游 `onClear`）', async () => {
    // 上游 `should trigger onClear when click clear button`
    const w = mountPicker({ defaultValue: somePoint });
    await clearButton(w).trigger('click');
    expect(w.emitted('clear')).toHaveLength(1);
    w.unmount();
  });
});

describe('DatePicker · legacy prop 的告警与落点（上游 testCases）', () => {
  /** 捕获 `console.error`（本仓的 `warning` 走它）。 */
  const captureWarnings = () => {
    resetWarned();
    return vi.spyOn(console, 'error').mockImplementation(() => {});
  };

  it('`dropdownClassName` / `popupClassName` ⇒ 告警 + 类名落到浮层', () => {
    // 上游 `legacy dropdownClassName & popupClassName`
    for (const prop of ['dropdownClassName', 'popupClassName'] as const) {
      const spy = captureWarnings();
      const w = mountPicker({ open: true, [prop]: 'legacy' });

      expect(spy.mock.calls.flat().join(' ')).toContain(
        `\`${prop}\` is deprecated. Please use \`classNames.popup.root\` instead.`,
      );
      expect(w.find(`.${P}-dropdown`).classes()).toContain('legacy');
      w.unmount();
      spy.mockRestore();
    }
  });

  it('`popupStyle` ⇒ 告警 + style 落到浮层', () => {
    // 上游 `legacy popupStyle`
    const spy = captureWarnings();
    const w = mountPicker({ open: true, popupStyle: { backgroundColor: 'red' } });

    expect(spy.mock.calls.flat().join(' ')).toContain(
      '`popupStyle` is deprecated. Please use `styles.popup.root` instead.',
    );
    expect(w.find(`.${P}-dropdown`).attributes('style')).toContain('background-color: red');
    w.unmount();
    spy.mockRestore();
  });

  it('`bordered` ⇒ 告警（`variant` 取代它）', () => {
    const spy = captureWarnings();
    const w = mountPicker({ bordered: true });
    expect(spy.mock.calls.flat().join(' ')).toContain(
      '`bordered` is deprecated. Please use `variant` instead.',
    );
    w.unmount();
    spy.mockRestore();
  });

  it('`onSelect` ⇒ 告警（`onCalendarChange` 取代它）', () => {
    const spy = captureWarnings();
    const w = mountPicker({ onSelect: () => {} });
    expect(spy.mock.calls.flat().join(' ')).toContain(
      '`onSelect` is deprecated. Please use `onCalendarChange` instead.',
    );
    w.unmount();
    spy.mockRestore();
  });

  it('🚨 **不传**这些 prop ⇒ **一条告警都没有**（反向哨兵）', async () => {
    // 这条钉的是「判据必须是 `props.x === undefined` 而不是 `!(x in props)`」——
    // 后者在 Vue 里恒真 ⇒ 每条告警都会误报（恒假告警会淹掉真告警）。
    const spy = captureWarnings();
    const w = mountPicker({ open: true, defaultValue: dayjs('2023-08-01') });
    await nextTick();

    const messages = spy.mock.calls.flat().join(' ');
    for (const prop of [
      'dropdownClassName',
      'popupClassName',
      'popupStyle',
      'bordered',
      'onSelect',
    ]) {
      expect(messages).not.toContain(`\`${prop}\` is deprecated`);
    }
    w.unmount();
    spy.mockRestore();
  });
});

/**
 * 根 attrs 透传（`docs/KNOWN-ISSUES.md` §1.8）。
 *
 * 上游把 `...restProps` spread 给**内层 picker**（`generateSinglePicker.js:180` /
 * `generateRangePicker.js:165`）⇒ `data-*` / `aria-*` 落到选择器根元素上。
 * 本仓此前 `inheritAttrs: false` 且**从不读 attrs** ⇒ 这些属性**全部静默丢弃**。
 */
describe('DatePicker · 根 attrs 透传（§1.8）', () => {
  it('data-* / aria-* 落到选择器根元素上', async () => {
    const w = mount(DatePicker, {
      props: { defaultValue: dayjs('2016-11-22') },
      attrs: { 'data-testid': 'dp', 'aria-describedby': 'hint' },
    });
    await nextTick();
    // ⚠️ 落点是**选择器根元素**（外层还有 Trigger）—— 不是
    const root = w.find('.apollo-picker');
    expect(root.exists()).toBe(true);
    expect(root.attributes('data-testid')).toBe('dp');
    expect(root.attributes('aria-describedby')).toBe('hint');
    w.unmount();
  });

  it('原生 class / style 仍落根（没被 attrs 透传挤掉）', async () => {
    const w = mount(DatePicker, {
      props: { defaultValue: dayjs('2016-11-22') },
      attrs: { class: 'my-dp', style: 'width: 200px' },
    });
    await nextTick();
    const root = w.find('.apollo-picker');
    expect(root.classes()).toContain('my-dp');
    expect(root.attributes('style')).toContain('width: 200px');
    w.unmount();
  });

  it('引擎自己的 props 不被调用方 attrs 顶掉（顺序：attrs 在前、引擎在后）', async () => {
    const w = mount(DatePicker, {
      props: { defaultValue: dayjs('2016-11-22') },
      attrs: { id: 'user-id' },
    });
    await nextTick();
    // `id` 是引擎自己的 prop（mergedId），不该被 attrs 覆盖
    expect(w.element.getAttribute('id')).not.toBe('user-id');
    w.unmount();
  });
});

/** 范围（RangePicker）也要透传 —— 它走 `Selector` 的另一个根分支。 */
describe('RangePicker · 根 attrs 透传（§1.8）', () => {
  it('data-* / aria-* 落到范围选择器根元素上', async () => {
    const w = mount(RangePicker, {
      props: { defaultValue: [dayjs('2016-11-22'), dayjs('2016-11-23')] as never },
      attrs: { 'data-testid': 'rp', 'aria-describedby': 'hint2' },
    });
    await nextTick();
    const root = w.find('.apollo-picker');
    expect(root.exists()).toBe(true);
    expect(root.attributes('data-testid')).toBe('rp');
    expect(root.attributes('aria-describedby')).toBe('hint2');
    w.unmount();
  });
});
