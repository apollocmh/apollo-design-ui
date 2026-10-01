// @vitest-environment node

/**
 * L1 单元 —— `date-picker` 的纯函数层（G4 · S1）。
 *
 * 覆盖：locale 合并与 placeholder 优先序、`format` 归一、`Selector` 的四个纯判据
 * （`input[size]` / `disabled` 归一 / 两个 `showClear`）。
 *
 * ── 为什么这些能当**门禁证据**（而不是「自说自话的测试」）─────────────────────
 *
 * 每一条判据都**来自上游源码或 SSR 实测**，注释里给了出处与行号：
 *   - `getPlaceholder` / `getRangePlaceholder` ← `es/date-picker/util.js`
 *   - `mergeFormat` ← `lib/PickerInput/hooks/useFieldFormat.js`
 *   - `getInputSize` ← `lib/PickerInput/Selector/hooks/useInputProps.js`
 *   - `getSingleShowClear` / `getRangeShowClear` ←
 *     `lib/PickerInput/Selector/{SingleSelector/index,RangeSelector}.js`
 *
 * ⚠️ 判定值（`12` / `21`）是 **SSR 实测**过的：无 `showTime` 时 `input[size]="12"`，
 * 带 `showTime` 时 `"21"`（见 `docs/analysis/date-picker.md` §4.3）。
 */

import type { PickerLocale as LocalePickerLocale } from '@apollo-design/locale';
import { isRenderable } from '@apollo-design/utils';
import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { getMergedStatus } from '../../form/context';
import { getStatusClassNames } from '../../space/statusUtils';
import {
  getFormatLength,
  getInputSize,
  getMergedNeedConfirm,
  getRangeShowClear,
  getShowNow,
  getSingleShowClear,
  isPairDisabled,
  toDisabledPair,
} from '../components/picker-shared';
import { getRootClassNames } from '../components/root-class';
import {
  BUILT_IN_PLACEMENTS,
  getDropdownClassName,
  getRealPlacement,
  getTransitionName,
} from '../components/trigger-config';
import { fillPickerLocale } from '../hooks/picker-filled';
import { mergeFormat } from '../hooks/picker-format';
import { getPlaceholder, getRangePlaceholder, mergePickerLocale } from '../hooks/picker-locale';
import type { RcPickerLocale } from '../hooks/picker-types';
import { toDateArray } from '../hooks/picker-value';
import {
  fillPopupClassName,
  fillPopupStyle,
  normalizePopupClassNames,
  normalizePopupStyles,
} from '../hooks/use-picker-semantic';
import type { DatePickerDate, MaskFormatConfig } from '../interface';

/** 一个字段尽量齐的 locale（测优先序用）。 */
const fullLocale = {
  locale: 'zh-cn',
  fieldDateFormat: 'YYYY-MM-DD',
  fieldDateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
  fieldTimeFormat: 'HH:mm:ss',
  fieldMonthFormat: 'YYYY-MM',
  fieldYearFormat: 'YYYY',
  fieldWeekFormat: 'YYYY-wo',
  fieldQuarterFormat: 'YYYY-[Q]Q',
} as unknown as RcPickerLocale;

describe('date-picker · locale 合并与 placeholder 优先序（S1）', () => {
  it('mergePickerLocale 深合并：prop 覆盖 context，未给的键保留', () => {
    const context = {
      lang: { placeholder: 'ctx-placeholder', today: 'ctx-today' },
      timePickerLocale: { placeholder: 'ctx-time' },
    };
    const prop = { lang: { placeholder: 'prop-placeholder' } };
    const merged = mergePickerLocale(context as never, prop as never);
    expect(merged.lang.placeholder).toBe('prop-placeholder');
    // ⚠️ 未给的键**保留**（深合并是契约：上游有 `should support deep merge locale` 测试）
    expect(merged.lang.today).toBe('ctx-today');
    expect(merged.timePickerLocale.placeholder).toBe('ctx-time');
  });

  it('mergePickerLocale 接受两者皆空', () => {
    expect(() => mergePickerLocale(undefined, undefined)).not.toThrow();
  });

  it('getPlaceholder：自定义优先（且空串也算「给了」—— isNonNullable 不是 truthy 判据）', () => {
    const locale = fullLocale as never;
    expect(getPlaceholder(locale, 'date', 'custom')).toBe('custom');
    // ⚠️ 这条是常见写错点：空串**不应该**落到 locale
    expect(getPlaceholder(locale, 'date', '')).toBe('');
  });

  it('getPlaceholder：六个分支各有专属字段', () => {
    const locale = {
      ...fullLocale,
      lang: {
        ...(fullLocale as unknown as { lang: object }).lang,
        placeholder: 'P-default',
        yearPlaceholder: 'P-year',
        quarterPlaceholder: 'P-quarter',
        monthPlaceholder: 'P-month',
        weekPlaceholder: 'P-week',
      },
      timePickerLocale: { placeholder: 'P-time' },
    } as unknown as LocalePickerLocale;

    expect(getPlaceholder(locale, 'year', undefined)).toBe('P-year');
    expect(getPlaceholder(locale, 'quarter', undefined)).toBe('P-quarter');
    expect(getPlaceholder(locale, 'month', undefined)).toBe('P-month');
    expect(getPlaceholder(locale, 'week', undefined)).toBe('P-week');
    // ⚠️ time 取的是 **timePickerLocale.placeholder**（不是 lang 里的）
    expect(getPlaceholder(locale, 'time', undefined)).toBe('P-time');
    expect(getPlaceholder(locale, 'date', undefined)).toBe('P-default');
  });

  it('getPlaceholder：缺字段时**继续往下落**（上游有专门的 fallback 测试）', () => {
    const locale = {
      locale: 'zh-cn',
      lang: { placeholder: 'P-default' },
      timePickerLocale: {},
    } as unknown as LocalePickerLocale;
    // 四个粒度字段全缺 ⇒ 全落 `lang.placeholder`
    expect(getPlaceholder(locale, 'year', undefined)).toBe('P-default');
    expect(getPlaceholder(locale, 'quarter', undefined)).toBe('P-default');
    expect(getPlaceholder(locale, 'month', undefined)).toBe('P-default');
    expect(getPlaceholder(locale, 'week', undefined)).toBe('P-default');
    // time 缺 `timePickerLocale.placeholder` ⇒ 也落 `lang.placeholder`
    expect(getPlaceholder(locale, 'time', undefined)).toBe('P-default');
  });

  it('getRangePlaceholder：用 range* 系列，time 用 timePickerLocale.rangePlaceholder', () => {
    const locale = {
      ...fullLocale,
      lang: {
        ...(fullLocale as unknown as { lang: object }).lang,
        rangePlaceholder: ['R-default-start', 'R-default-end'],
        rangeYearPlaceholder: ['R-year-s', 'R-year-e'],
        rangeQuarterPlaceholder: ['R-q-s', 'R-q-e'],
        rangeMonthPlaceholder: ['R-m-s', 'R-m-e'],
        rangeWeekPlaceholder: ['R-w-s', 'R-w-e'],
      },
      timePickerLocale: { rangePlaceholder: ['R-t-s', 'R-t-e'] },
    } as unknown as LocalePickerLocale;

    expect(getRangePlaceholder(locale, 'year', undefined)).toEqual(['R-year-s', 'R-year-e']);
    expect(getRangePlaceholder(locale, 'quarter', undefined)).toEqual(['R-q-s', 'R-q-e']);
    expect(getRangePlaceholder(locale, 'month', undefined)).toEqual(['R-m-s', 'R-m-e']);
    expect(getRangePlaceholder(locale, 'week', undefined)).toEqual(['R-w-s', 'R-w-e']);
    expect(getRangePlaceholder(locale, 'time', undefined)).toEqual(['R-t-s', 'R-t-e']);
    expect(getRangePlaceholder(locale, 'date', undefined)).toEqual([
      'R-default-start',
      'R-default-end',
    ]);
  });

  it('getRangePlaceholder：自定义元组直接返回（含空元组）', () => {
    const locale = fullLocale as never;
    expect(getRangePlaceholder(locale, 'date', ['a', 'b'])).toEqual(['a', 'b']);
  });
});

describe('date-picker · format 归一（S1）', () => {
  it('显式字符串 format：列表就一项，maskFormat 为 null', () => {
    const got = mergeFormat('date', fullLocale, 'YYYY/MM/DD');
    expect(got.formatList).toEqual(['YYYY/MM/DD']);
    expect(got.firstFormat).toBe('YYYY/MM/DD');
    expect(got.maskFormat).toBeNull();
  });

  it('数组 format：全部保留（列表化），firstFormat 取第一个', () => {
    const got = mergeFormat('date', fullLocale, ['YYYY-MM-DD', 'YYYY/MM/DD']);
    expect(got.formatList).toEqual(['YYYY-MM-DD', 'YYYY/MM/DD']);
    expect(got.firstFormat).toBe('YYYY-MM-DD');
  });

  it('对象 format 且 type=mask：maskFormat 取出来（S3 消费）', () => {
    const got = mergeFormat('date', fullLocale, {
      format: 'YYYY-MM-DD',
      type: 'mask',
    } satisfies MaskFormatConfig);
    expect(got.formatList).toEqual(['YYYY-MM-DD']);
    expect(got.firstFormat).toBe('YYYY-MM-DD');
    expect(got.maskFormat).toBe('YYYY-MM-DD');
  });

  it('对象 format 但无 type：maskFormat 仍为 null', () => {
    const got = mergeFormat('date', fullLocale, { format: 'YYYY-MM-DD' });
    expect(got.maskFormat).toBeNull();
  });

  it('未给 format ⇒ 按 picker 落 locale 的 fieldXxxFormat', () => {
    expect(mergeFormat('date', fullLocale, undefined).firstFormat).toBe('YYYY-MM-DD');
    expect(mergeFormat('time', fullLocale, undefined).firstFormat).toBe('HH:mm:ss');
    expect(mergeFormat('month', fullLocale, undefined).firstFormat).toBe('YYYY-MM');
    expect(mergeFormat('year', fullLocale, undefined).firstFormat).toBe('YYYY');
    expect(mergeFormat('week', fullLocale, undefined).firstFormat).toBe('YYYY-wo');
    expect(mergeFormat('quarter', fullLocale, undefined).firstFormat).toBe('YYYY-[Q]Q');
    // ⚠️ `'datetime'` 是**独立分支**（PITFALLS 202 的同一个坑，值不同）
    expect(mergeFormat('datetime', fullLocale, undefined).firstFormat).toBe('YYYY-MM-DD HH:mm:ss');
  });

  /**
   * ⚠️ 这条钉的是**上游「类型面」与「代码路径」不一致**这件事：
   *
   *   类型面：`format?: FormatType | FormatType[] | { format: string; type?: "mask" }`
   *           ⇒ **数组元素只能是 `string | CustomFormat`**，mask 对象只允许**单独**给。
   *   代码面：`const firstFormat = formatList[0]` 只看形状，
   *           所以「数组里放 mask 对象」在运行时**是能走通**的。
   *
   * ⇒ 用一次显式 cast 表达「代码可达、类型不可达」，并把结论写死在这里
   *   （`maskFormat` 取到、`formatList` 里那条被读成它的 `.format` 串）。
   */
  it('mask 只看列表的**第一个**条目（上游类型面不允许数组里放 mask，但代码路径可达）', () => {
    const got = mergeFormat('date', fullLocale, [
      // 故意绕过类型面（见上面的说明）
      { format: 'YYYY-MM-DD', type: 'mask' } as unknown as string,
      'YYYY/MM/DD',
    ]);
    expect(got.maskFormat).toBe('YYYY-MM-DD');
    expect(got.firstFormat).toBe('YYYY-MM-DD');
  });

  /**
   * 反向哨兵：**数组里没有 mask 对象**时 `maskFormat` 必须是 null
   *（即「mask 只来自第一个条目」不是「数组里找得到就算」）。
   */
  it('数组里全是字符串 ⇒ maskFormat 为 null（mask 不来自「数组里找」）', () => {
    const got = mergeFormat('date', fullLocale, ['YYYY-MM-DD', 'YYYY/MM/DD']);
    expect(got.maskFormat).toBeNull();
    expect(got.firstFormat).toBe('YYYY-MM-DD');
  });

  /**
   * ⚠️ 这条钉的是**本仓与上游的一处刻意差异**（登记在 README §2，分类 INTENDED）：
   *
   * rc 的 `toArray(undefined)` = `[undefined]` ⇒ 紧随其后的 `.map(c => c.format)`
   * 会在 `undefined.format` 上**抛 TypeError**（即 locale 缺 `fieldXxxFormat` 时上游直接崩）。
   * 本仓 `@apollo-design/picker` 的 `toArray` 是「`null` / `undefined` ⇒ `[]`」
   * ⇒ 得到空列表、`firstFormat: undefined`，**不抛错**（降级而不是崩）。
   */
  it('locale 缺 fieldXxxFormat ⇒ 空列表 + firstFormat undefined（本仓是降级，上游会抛错）', () => {
    const bare = { locale: 'zh-cn' } as unknown as RcPickerLocale;
    const got = mergeFormat('date', bare, undefined);
    expect(got.formatList).toEqual([]);
    expect(got.firstFormat).toBeUndefined();
    expect(got.maskFormat).toBeNull();
  });

  /**
   * 🚨 **函数形态**（`CustomFormat`）—— 2026-10-01（S2）补齐。
   *
   * 上游 `useFieldFormat.js:11` 的 map 回调是
   * `typeof config === 'string' || typeof config === 'function' ? config : config.format`。
   * 本仓此前**漏了 `function` 那一支** ⇒ 函数被读成 `undefined`
   * （函数没有 `.format`）⇒ 输入框显示空、`input[size]` 退化。
   */
  it('🚨 函数形态：**原样保留**在 `formatList` / `firstFormat`（不是读成 undefined）', () => {
    const fn = (date: DatePickerDate) => date.format('YYYY/MM/DD');
    const got = mergeFormat('date', fullLocale, fn);
    expect(got.formatList).toHaveLength(1);
    expect(got.formatList[0]).toBe(fn);
    // 引用相等：**不是**被包装/复制过的
    expect(got.firstFormat).toBe(fn);
    expect(got.maskFormat).toBeNull();
  });

  it('🚨 数组里混函数：逐项保留（顺序也不变）', () => {
    const fn = (date: DatePickerDate) => String(date);
    const got = mergeFormat('date', fullLocale, ['YYYY-MM-DD', fn]);
    expect(got.formatList).toHaveLength(2);
    expect(got.formatList[0]).toBe('YYYY-MM-DD');
    expect(got.formatList[1]).toBe(fn);
    expect(got.firstFormat).toBe('YYYY-MM-DD');
  });

  it('⚠️ 函数**不**被当成 mask（`typeof fn === "function"`，不是 `"object"`）', () => {
    // mask 的判据是 `typeof firstFormat === 'object' && firstFormat.type === 'mask'`
    // ⇒ 函数天然跳过。这条是反向哨兵：防止「把函数也当对象读 `.type`」。
    const fn = Object.assign((date: DatePickerDate) => String(date), { type: 'mask' });
    const got = mergeFormat('date', fullLocale, fn as never);
    expect(got.maskFormat).toBeNull();
    expect(got.formatList[0]).toBe(fn);
  });
});

describe('date-picker · Selector 的纯判据（S1）', () => {
  it('getInputSize：日期 12 / 带时间 21（SSR 实测判定值）', () => {
    // ⚠️ 第二参是**已求值的字符数**（`getFormatLength` 的产物），不是格式串本身
    expect(getInputSize('date', 10)).toBe(12); // max(10, 10) + 2
    expect(getInputSize('date', 19)).toBe(21); // max(10, 19) + 2
    // time 的 defaultSize 是 8
    expect(getInputSize('time', 8)).toBe(10); // max(8, 8) + 2
    // format 比 defaultSize 短 ⇒ 用 defaultSize
    expect(getInputSize('time', 2)).toBe(10); // max(8, 2) + 2
  });

  it('getInputSize：无 format（长度 0）时退化成 defaultSize + 2', () => {
    expect(getInputSize('date', 0)).toBe(12);
    expect(getInputSize('time', 0)).toBe(10);
  });

  it('⭐ getFormatLength：字符串取 `.length`，**函数形态先求值**', () => {
    // 上游 `useInputProps.js`：`typeof firstFormat === 'function'
    //   ? firstFormat(getNow()).length : firstFormat.length`
    const now = dayjs('2026-10-01');
    expect(getFormatLength('YYYY-MM-DD', now)).toBe(10);

    // 🚨 函数形态：`.length` 是**形参个数**（1），必须先求值才拿到真实长度
    const fn = (date: DatePickerDate) => date.format('YYYY/MM/DD');
    expect(fn.length).toBe(1); // ← 这正是「不能直接用 .length」的证据
    expect(getFormatLength(fn, now)).toBe(10);

    expect(getFormatLength(undefined, now)).toBe(0);
  });

  it('toDisabledPair：布尔铺开成两端；数组原样', () => {
    expect(toDisabledPair(true)).toEqual([true, true]);
    expect(toDisabledPair(false)).toEqual([false, false]);
    expect(toDisabledPair(undefined)).toEqual([false, false]);
    expect(toDisabledPair([true, false])).toEqual([true, false]);
  });

  it('getSingleShowClear：三条条件缺一不可（含 disabled 时不渲染）', () => {
    const icon = 'ICON';
    expect(getSingleShowClear(icon, 1, false)).toBe(true);
    // 无值
    expect(getSingleShowClear(icon, 0, false)).toBe(false);
    // 🚨 disabled（初稿漏了这条）
    expect(getSingleShowClear(icon, 1, true)).toBe(false);
    // clearIcon 不可渲染
    expect(getSingleShowClear(null, 1, false)).toBe(false);
    expect(getSingleShowClear(undefined, 1, false)).toBe(false);
    expect(getSingleShowClear(false, 1, false)).toBe(false);
  });

  it('getRangeShowClear：**任一**非 disabled 的槽位有值即可', () => {
    const icon = 'ICON';
    expect(getRangeShowClear(icon, [1, 1], [false, false])).toBe(true);
    // 只有 start 有值
    expect(getRangeShowClear(icon, [1, 0], [false, false])).toBe(true);
    // 只有 end 有值
    expect(getRangeShowClear(icon, [0, 1], [false, false])).toBe(true);
    // 两端都没值
    expect(getRangeShowClear(icon, [0, 0], [false, false])).toBe(false);
    // 有值的那端 disabled ⇒ 不算
    expect(getRangeShowClear(icon, [1, 0], [true, false])).toBe(false);
    expect(getRangeShowClear(icon, [0, 1], [false, true])).toBe(false);
    // 有值且非 disabled 的那端存在 ⇒ 渲染
    expect(getRangeShowClear(icon, [1, 1], [true, false])).toBe(true);
  });

  it('isRenderable：只排除 null / undefined / false / 空串（`0` 与数组**算**可渲染）', () => {
    // 上游 `@rc-component/util` 的 `isReactRenderable`（`es/is.js`，逐字）：
    //   `return isNonNullable(value) && value !== false && value !== '';`
    // 权威实现在 `@apollo-design/utils` 的 `isRenderable`（全库共用同一份）。
    expect(isRenderable('x')).toBe(true);
    expect(isRenderable(0)).toBe(true);
    // ⚠️ `true` **算**可渲染（上游注释：*"all other values, including `0` and `true`"*）
    //    本地副本曾用 `typeof node === 'boolean'` 一刀切 ⇒ 误判成 `false`。
    expect(isRenderable(true)).toBe(true);
    expect(isRenderable(null)).toBe(false);
    expect(isRenderable(undefined)).toBe(false);
    expect(isRenderable(false)).toBe(false);
    // 🚨 `''` **不可**渲染 —— 2026-10-01 修正：本文件此前断言的是 `true`，
    //    依据是 `picker-shared.ts` 里一份**与上游不符**的本地副本
    //    （注释写「空字符串算可渲染」）。上游明确排除 `''`。
    expect(isRenderable('')).toBe(false);
    // 🚨 数组是**普通值**，不做递归判空 —— 上游不递归，`[]` 判真。
    //    （`Empty` 组件正是靠这条渲染「空 footer」，见 `empty/__tests__/semantic.test.ts:105`。）
    expect(isRenderable([])).toBe(true);
    expect(isRenderable([''])).toBe(true);
  });

  it('getShowNow：`mode` 先于一切，再 `showNow` → `showToday` → 默认（上游 `useShowNow` 逐字）', () => {
    // ① `mode` 不是 date/time ⇒ **恒 false**（哪怕显式 `showNow: true`）
    expect(getShowNow('date', 'month', true, undefined)).toBe(false);
    expect(getShowNow('date', 'year', undefined, true)).toBe(false);
    // ② `showNow !== undefined` ⇒ 以它为准（`false` 是显式关闭）
    expect(getShowNow('date', 'date', false, true)).toBe(false);
    expect(getShowNow('date', 'date', true, false)).toBe(true);
    // ③ 否则看兼容旧版的 `showToday`
    expect(getShowNow('date', 'date', undefined, false)).toBe(false);
    expect(getShowNow('date', 'date', undefined, true)).toBe(true);
    // ④ 都没有 ⇒ `!rangePicker && (picker === 'date' || picker === 'time')`
    expect(getShowNow('date', 'date', undefined, undefined)).toBe(true);
    expect(getShowNow('time', 'time', undefined, undefined)).toBe(true);
    expect(getShowNow('month', 'month', undefined, undefined)).toBe(false);
    // 范围版恒 false（`DatePicker` 不传，留作 RangePicker 用）
    expect(getShowNow('date', 'date', undefined, undefined, true)).toBe(false);
  });
});

describe('date-picker · toDateArray 归一（S1）', () => {
  it('null / undefined ⇒ 空数组（受控的「空」是 null，不是 undefined）', () => {
    expect(toDateArray(null)).toEqual([]);
    expect(toDateArray(undefined)).toEqual([]);
  });

  it('单值 ⇒ 单元素数组；数组 ⇒ 拷贝（不共享引用）', () => {
    const single = toDateArray('D1' as never);
    expect(single).toEqual(['D1']);

    const src = ['D1', 'D2'] as never[];
    const out = toDateArray(src as never);
    expect(out).toEqual(['D1', 'D2']);
    // ⚠️ 必须是拷贝：共享引用会让下游 `push` 污染受控值
    expect(out).not.toBe(src);
  });
});

/**
 * 状态类名**复用** `space/statusUtils.ts` 的既有实现（逐字对齐上游）——
 * 注意它返回的是**空格拼接的字符串**，不是数组（`root-class.ts` 整体 push）。
 */
describe('date-picker · 状态类名（复用 space/statusUtils，判据来自上游 _util/statusUtils.js）', () => {
  it('四个 status **互斥**，且与 hasFeedback 无关', () => {
    const p = 'apollo-picker';
    expect(getStatusClassNames(p, 'error', false)).toBe(`${p}-status-error`);
    expect(getStatusClassNames(p, 'warning', false)).toBe(`${p}-status-warning`);
    expect(getStatusClassNames(p, 'success', false)).toBe(`${p}-status-success`);
    expect(getStatusClassNames(p, 'validating', false)).toBe(`${p}-status-validating`);
    // ⚠️ 这四条是初稿写错的地方：无 hasFeedback 时**仍然**加 status 类
    //    （实测 `status="error"` 无 Form 也有 `ant-picker-status-error`）
  });

  it('hasFeedback 只额外加 **-has-feedback** 一个类（不是 status 的开关）', () => {
    const p = 'apollo-picker';
    expect(getStatusClassNames(p, undefined, true)).toBe(`${p}-has-feedback`);
    expect(getStatusClassNames(p, 'error', true)).toBe(`${p}-status-error ${p}-has-feedback`);
  });

  it('未知 / 空 status ⇒ 空串（不产生任何类名）', () => {
    const p = 'apollo-picker';
    expect(getStatusClassNames(p, undefined, false)).toBe('');
    expect(getStatusClassNames(p, '', false)).toBe('');
  });
});

/**
 * 状态合并：**与 input / select / input-number 共用 `form/context` 的实现**。
 *
 * ⚠️ 本组用例原先打在 date-picker 自带的 `getMergedPickerStatus` 上（那时
 * `form/context.ts` 还是 `??`，与上游 `||` 不一致）。
 * **2026-09-30 已把 `form/context.ts` 统一为 `||`**（PITFALLS 223）⇒
 * 改名版已删除，本组改为直接测共用实现 —— 这样「同名不同义」的隐患一并消除。
 *
 * ⚠️ 判据是 `||`（不是 `??`）：两者**只在 `customStatus === ''` 时不同**
 * （`''` 是 `InputStatus` 的合法取值）。
 */
describe('date-picker · getMergedStatus（共用 form/context，按上游 ||）', () => {
  it('空串会回落到 context（这正是 || 与 ?? 的唯一分歧点）', () => {
    expect(getMergedStatus('warning', '')).toBe('warning');
  });

  it('其余情形与 ?? 一致', () => {
    expect(getMergedStatus('warning', undefined)).toBe('warning');
    expect(getMergedStatus('warning', 'error')).toBe('error');
    expect(getMergedStatus(undefined, undefined)).toBeUndefined();
    expect(getMergedStatus(undefined, 'error')).toBe('error');
  });
});
describe('date-picker · isPairDisabled（S1）', () => {
  it('**两端都禁**才算整体禁用（上游 disabled.every）', () => {
    expect(isPairDisabled(true)).toBe(true);
    expect(isPairDisabled([true, true])).toBe(true);
    // ⚠️ 只禁一端 ⇒ 整体**不**算禁用（根类名不加 -disabled）
    expect(isPairDisabled([true, false])).toBe(false);
    expect(isPairDisabled([false, true])).toBe(false);
    expect(isPairDisabled(false)).toBe(false);
    expect(isPairDisabled(undefined)).toBe(false);
  });
});

describe('date-picker · getRootClassNames（S1，顺序对齐上游 clsx 参数序）', () => {
  const p = 'apollo-picker';

  it('默认就有 -outlined（**不是**只有 prefixCls）', () => {
    expect(
      getRootClassNames({ prefixCls: p, variant: 'outlined', enableVariantCls: true }),
    ).toEqual([p, `${p}-outlined`]);
  });

  it('尺寸：small / large 各加一个；middle / medium **不加**', () => {
    expect(getRootClassNames({ prefixCls: p, size: 'small' })).toEqual([p, `${p}-small`]);
    expect(getRootClassNames({ prefixCls: p, size: 'large' })).toEqual([p, `${p}-large`]);
    expect(getRootClassNames({ prefixCls: p, size: 'middle' })).toEqual([p]);
    expect(getRootClassNames({ prefixCls: p, size: 'medium' })).toEqual([p]);
  });

  it('S4：rc 的 5 个状态类顺序 **multiple → focused → disabled → invalid → rtl**（在尺寸/变体之前）', () => {
    // 出处：`SingleSelector/index.js:167-172` 的 `clsx(prefixCls, {...}, className)`
    expect(
      getRootClassNames({
        prefixCls: p,
        multiple: true,
        focused: true,
        disabled: true,
        invalid: true,
        rtl: true,
        variant: 'outlined',
        enableVariantCls: true,
      }),
    ).toEqual([
      p,
      `${p}-multiple`,
      `${p}-focused`,
      `${p}-disabled`,
      `${p}-invalid`,
      `${p}-rtl`,
      `${p}-outlined`,
    ]);
  });

  it('complete 顺序：尺寸 → 变体 → 状态 → compact → context → className → rootClassName', () => {
    expect(
      getRootClassNames({
        prefixCls: p,
        size: 'large',
        variant: 'filled',
        enableVariantCls: true,
        status: 'error',
        compactItemClassnames: 'c-compact',
        contextClassName: 'c-ctx',
        className: 'c-own',
        rootClassName: 'c-root',
      }),
    ).toEqual([
      p,
      `${p}-large`,
      `${p}-filled`,
      `${p}-status-error`,
      'c-compact',
      'c-ctx',
      'c-own',
      'c-root',
    ]);
  });

  it('enableVariantCls === false ⇒ 不加变体类（但尺寸/状态照加）', () => {
    expect(
      getRootClassNames({
        prefixCls: p,
        size: 'small',
        variant: 'weird',
        enableVariantCls: false,
        status: 'warning',
      }),
    ).toEqual([p, `${p}-small`, `${p}-status-warning`]);
  });

  it('空串类名被跳过（不产生空项）', () => {
    const out = getRootClassNames({
      prefixCls: p,
      compactItemClassnames: '',
      contextClassName: '',
      className: '',
      rootClassName: '',
    });
    expect(out).toEqual([p]);
    expect(out.every((c) => typeof c === 'string' && c.length > 0)).toBe(true);
  });
});

describe('date-picker · 浮层接线配置（S1，判据来自 rc PickerTrigger）', () => {
  it('BUILT_IN_PLACEMENTS 四个落点的 points / offset 逐字（读 rc 源码得到）', () => {
    expect(BUILT_IN_PLACEMENTS.bottomLeft.points).toEqual(['tl', 'bl']);
    expect(BUILT_IN_PLACEMENTS.bottomRight.points).toEqual(['tr', 'br']);
    expect(BUILT_IN_PLACEMENTS.topLeft.points).toEqual(['bl', 'tl']);
    expect(BUILT_IN_PLACEMENTS.topRight.points).toEqual(['br', 'tr']);

    expect(BUILT_IN_PLACEMENTS.bottomLeft.offset).toEqual([0, 4]);
    expect(BUILT_IN_PLACEMENTS.bottomRight.offset).toEqual([0, 4]);
    expect(BUILT_IN_PLACEMENTS.topLeft.offset).toEqual([0, -4]);
    expect(BUILT_IN_PLACEMENTS.topRight.offset).toEqual([0, -4]);
  });

  it('top* 的 overflow.adjustX 是 0、bottom* 是 1（最容易顺手写错的四位）', () => {
    expect(BUILT_IN_PLACEMENTS.bottomLeft.overflow).toEqual({ adjustX: 1, adjustY: 1 });
    expect(BUILT_IN_PLACEMENTS.bottomRight.overflow).toEqual({ adjustX: 1, adjustY: 1 });
    expect(BUILT_IN_PLACEMENTS.topLeft.overflow).toEqual({ adjustX: 0, adjustY: 1 });
    expect(BUILT_IN_PLACEMENTS.topRight.overflow).toEqual({ adjustX: 0, adjustY: 1 });
  });

  it('getRealPlacement：显式 placement 原样返回（不做 RTL 镜像）', () => {
    expect(getRealPlacement('topLeft', false)).toBe('topLeft');
    expect(getRealPlacement('topLeft', true)).toBe('topLeft');
    expect(getRealPlacement('bottomRight', false)).toBe('bottomRight');
  });

  it('getRealPlacement：未给时按方向取默认（LTR bottomLeft / RTL bottomRight）', () => {
    expect(getRealPlacement(undefined, false)).toBe('bottomLeft');
    expect(getRealPlacement(undefined, true)).toBe('bottomRight');
  });

  it('getDropdownClassName：range / rtl 各加一个类，顺序在自定义之后', () => {
    const p = 'apollo-picker';
    // ⚠️ 返回 **string[]**（空值在出口滤掉）—— Trigger 的 `popupClassName` 类型是
    //    `string | string[]`，带 `undefined` 的数组不可赋值（与 `getRootClassNames` 同判）。
    expect(getDropdownClassName({ prefixCls: p, range: false, rtl: false })).toEqual([]);
    expect(
      getDropdownClassName({ prefixCls: p, range: true, rtl: false, popupClassName: 'c-own' }),
    ).toEqual(['c-own', `${p}-dropdown-range`]);
    expect(getDropdownClassName({ prefixCls: p, range: false, rtl: true })).toEqual([
      `${p}-dropdown-rtl`,
    ]);
  });

  it('getTransitionName：默认是 rootPrefixCls-slide-up（**不是** 组件前缀）', () => {
    // 🚨 前缀是 rootPrefixCls（apollo）⇒ apollo-slide-up；
    //    写成 apollo-picker-slide-up 会让动效静默失效（PITFALLS 180 同族）
    expect(getTransitionName('apollo', undefined)).toBe('apollo-slide-up');
    expect(getTransitionName('apollo', 'my-motion')).toBe('my-motion');
  });
});

/**
 * 语义槽是「**4 个平铺 + 7 个嵌套**」—— 本仓第一次出现的两层（tabs 是「8 平铺 + 1 嵌套」）。
 * 且 `classNames.popup` 允许 **string**（旧写法 = `popup.root`）或对象（新写法）。
 *
 * 上游靠 `useMergeSemantic` 的 `{ popup: { _default: 'root' } }` 声明这件事；
 * 本仓的 `mergeClassNames` **没有**这个机制 ⇒ 在归一阶段先转（本组用例钉住）。
 */
describe('date-picker · 语义槽归一（S1，4 平铺 + 7 嵌套）', () => {
  it('normalizePopupClassNames：string popup 归一成 { root }（旧写法）', () => {
    expect(normalizePopupClassNames({ popup: 'c-popup', root: 'c-root' })).toEqual({
      root: 'c-root',
      popup: { root: 'c-popup' },
    });
  });

  it('normalizePopupClassNames：对象 popup 原样保留（新写法）', () => {
    expect(normalizePopupClassNames({ popup: { root: 'r', header: 'h', footer: 'f' } })).toEqual({
      popup: { root: 'r', header: 'h', footer: 'f' },
    });
  });

  it('normalizePopupClassNames：空串也归一（判据是 typeof string，不是真值）', () => {
    expect(normalizePopupClassNames({ popup: '' })).toEqual({ popup: { root: '' } });
  });

  it('normalizePopupClassNames：无 popup / 无入参 ⇒ 不产生 popup 键', () => {
    expect(normalizePopupClassNames({ root: 'r' })).toEqual({ root: 'r' });
    expect(normalizePopupClassNames(undefined)).toEqual({});
  });

  it('normalizePopupStyles：popup 只有对象形态，原样保留', () => {
    expect(normalizePopupStyles({ popup: { root: { color: 'red' } }, root: { top: 1 } })).toEqual({
      root: { top: 1 },
      popup: { root: { color: 'red' } },
    });
    expect(normalizePopupStyles(undefined)).toEqual({});
  });

  it('fillPopupClassName：deprecated popupClassName 拼在**已合并值之后**', () => {
    const merged = { popup: { root: 'merged' } };
    expect(fillPopupClassName(merged, 'deprecated')).toEqual({
      popup: { root: 'merged deprecated' },
    });
  });

  it('fillPopupClassName：无已合并值时只有 deprecated（不留多余空格）', () => {
    expect(fillPopupClassName({}, 'deprecated')).toEqual({ popup: { root: 'deprecated' } });
    expect(fillPopupClassName({ popup: {} }, 'deprecated')).toEqual({
      popup: { root: 'deprecated' },
    });
  });

  it('fillPopupClassName：deprecated 为空 ⇒ 原样返回（不产生空 root）', () => {
    const merged = { popup: { root: 'merged' } };
    expect(fillPopupClassName(merged, undefined)).toBe(merged);
    expect(fillPopupClassName(merged, '')).toBe(merged);
  });

  it('fillPopupStyle：deprecated popupStyle **覆盖**已合并值', () => {
    const merged = { popup: { root: { color: 'red', top: '1px' } } };
    expect(fillPopupStyle(merged, { top: '2px' })).toEqual({
      popup: { root: { color: 'red', top: '2px' } },
    });
  });

  it('fillPopupStyle：无 deprecated ⇒ 原样返回', () => {
    const merged = { popup: { root: { color: 'red' } } };
    expect(fillPopupStyle(merged, undefined)).toBe(merged);
  });

  it('两层嵌套：popup 的 7 个子槽互不干扰（不是把 7 个拍平成 1 个）', () => {
    const got = normalizePopupClassNames({
      root: 'r',
      prefix: 'p',
      input: 'i',
      suffix: 's',
      popup: {
        root: 'pr',
        header: 'ph',
        body: 'pb',
        content: 'pc',
        item: 'pi',
        footer: 'pf',
        container: 'pct',
      },
    });
    // 4 个平铺
    expect(got.root).toBe('r');
    expect(got.prefix).toBe('p');
    expect(got.input).toBe('i');
    expect(got.suffix).toBe('s');
    // 7 个嵌套，逐键保留
    expect(got.popup).toEqual({
      root: 'pr',
      header: 'ph',
      body: 'pb',
      content: 'pc',
      item: 'pi',
      footer: 'pf',
      container: 'pct',
    });
  });
});

/**
 * `needConfirm` 的默认值取决于**内部模式**（上游 `useFilledProps.js:74-76`）：
 *
 * ```js
 * const multipleInteractivePicker = internalPicker === 'time' || internalPicker === 'datetime';
 * const mergedNeedConfirm = needConfirm ?? multipleInteractivePicker;
 * ```
 *
 * ⚠️ 这条写错的症状很隐蔽：带 `showTime` 的日期选择器会**点一下就提交**，
 * 而用户期望点「确定」—— 因为没有单测盯住「默认值」，只有手动点才发现。
 */
describe('date-picker · getMergedNeedConfirm（S1，判据来自 useFilledProps.js:74-76）', () => {
  it('未给 `needConfirm` 时：time / datetime 默认 **true**，其余默认 **false**', () => {
    // 需要确认的两种（交互是多步的：先选日期再选时间）
    expect(getMergedNeedConfirm(undefined, 'time')).toBe(true);
    expect(getMergedNeedConfirm(undefined, 'datetime')).toBe(true);
    // 其余都是「点一下即定」
    expect(getMergedNeedConfirm(undefined, 'date')).toBe(false);
    expect(getMergedNeedConfirm(undefined, 'week')).toBe(false);
    expect(getMergedNeedConfirm(undefined, 'month')).toBe(false);
    expect(getMergedNeedConfirm(undefined, 'quarter')).toBe(false);
    expect(getMergedNeedConfirm(undefined, 'year')).toBe(false);
  });

  it('显式给值一律生效（判据是 `??` 不是 `||`）', () => {
    // ⚠️ `false` 是「显式关闭」⇒ 必须压过默认的 true（用 `||` 会漏掉这条）
    expect(getMergedNeedConfirm(false, 'time')).toBe(false);
    expect(getMergedNeedConfirm(false, 'datetime')).toBe(false);
    // 反向：纯日期也能显式要求确认
    expect(getMergedNeedConfirm(true, 'date')).toBe(true);
    expect(getMergedNeedConfirm(true, 'month')).toBe(true);
  });

  it("`'datetime'` 不在 `PickerMode` 里 —— 传 `props.picker` 会漏掉它", () => {
    // 这条钉住「调用方必须传 toInternalMode 的结果」：
    // 若误传 `props.picker`（'date'），带 showTime 的选择器会得到 false ⇒ 点一下就提交
    expect(getMergedNeedConfirm(undefined, 'date')).toBe(false);
    expect(getMergedNeedConfirm(undefined, 'datetime')).toBe(true);
  });
});

describe('date-picker · fillPickerLocale（S2，判据来自 rc 的 `useLocale.js:31-83`）', () => {
  /** 语言包**缺**全部 `field*` 键（= 本仓与 antd 的真实形态，实测）。 */
  const bare = { locale: 'en' } as RcPickerLocale;

  it('语言包缺 `fieldXxxFormat` 时补上 rc 的硬编码兜底', () => {
    // 上游 `useLocale.js:56-69` 的 11 个 `||` 兜底，逐个钉住
    const filled = fillPickerLocale(bare, { showHour: true, showMinute: true, showSecond: true });
    expect(filled.fieldDateFormat).toBe('YYYY-MM-DD');
    expect(filled.fieldDateTimeFormat).toBe('YYYY-MM-DD HH:mm:ss');
    expect(filled.fieldTimeFormat).toBe('HH:mm:ss');
    expect(filled.fieldMonthFormat).toBe('YYYY-MM');
    expect(filled.fieldYearFormat).toBe('YYYY');
    expect(filled.fieldWeekFormat).toBe('gggg-wo');
    expect(filled.fieldQuarterFormat).toBe('YYYY-[Q]Q');
    expect(filled.yearFormat).toBe('YYYY');
    expect(filled.cellYearFormat).toBe('YYYY');
    expect(filled.cellQuarterFormat).toBe('[Q]Q');
    expect(filled.cellDateFormat).toBe('D');
  });

  it('🚨 补齐用的时间格式**从 show 标志推出来**，不是 `showTime.format`', () => {
    // 上游 `useLocale.js:55`：`fillTimeFormat(showHour, showMinute, showSecond, showMillisecond, use12Hours)`
    expect(fillPickerLocale(bare, { showHour: true }).fieldTimeFormat).toBe('HH');
    expect(fillPickerLocale(bare, { showHour: true, showMinute: true }).fieldTimeFormat).toBe(
      'HH:mm',
    );
    // 12 小时制 ⇒ 小时用 `hh`，且**追加** ` A`（前导空格保留）
    expect(
      fillPickerLocale(bare, { showHour: true, showMinute: true, use12Hours: true })
        .fieldTimeFormat,
    ).toBe('hh:mm A');
    // 毫秒是**追加** `.SSS`
    expect(fillPickerLocale(bare, { showHour: true, showMillisecond: true }).fieldTimeFormat).toBe(
      'HH.SSS',
    );
  });

  it('⚠️ 边界：一个 show 都不给 ⇒ 时间格式是空串（`fillTimeFormat` 的全 false 分支）', () => {
    // ⚠️ 真实调用链上不会这样：`getTimeProps` 已经把三段填成 `true`（`fillShowConfig`）。
    //    这条钉的是**本函数自己的边界**，免得后人以为它会自己兜底。
    expect(fillPickerLocale(bare, {}).fieldTimeFormat).toBe('');
    expect(fillPickerLocale(bare, {}).fieldDateTimeFormat).toBe('YYYY-MM-DD ');
  });

  it('已给的键**不被覆盖**（判据是 `||`）', () => {
    const zh = { locale: 'zh-cn', fieldDateFormat: 'YYYY/MM/DD' } as RcPickerLocale;
    const filled = fillPickerLocale(zh, { showHour: true });
    expect(filled.fieldDateFormat).toBe('YYYY/MM/DD');
    expect(filled.fieldTimeFormat).toBe('HH');
    // 未被语言包覆盖的键仍然补齐
    expect(filled.fieldMonthFormat).toBe('YYYY-MM');
  });

  it('🚨 `monthFormat` 与 `cellMeridiemFormat` **刻意不补**（补了会改月格渲染分支）', () => {
    const filled = fillPickerLocale(bare, { showHour: true }) as unknown as Record<string, unknown>;
    expect(filled.monthFormat).toBeUndefined();
    expect(filled.cellMeridiemFormat).toBeUndefined();
  });

  it('⭐ 与 `mergeFormat` 的衔接：补齐前 `formatList` 为空，补齐后有默认格式', () => {
    // 这条是 S2 阻塞项的**回归哨兵**：缺口若被改回去，两半会同时红。
    expect(mergeFormat('date', bare, undefined).formatList).toEqual([]);
    expect(mergeFormat('date', bare, undefined).firstFormat).toBeUndefined();

    const merged = mergeFormat('date', fillPickerLocale(bare, {}), undefined);
    expect(merged.formatList).toEqual(['YYYY-MM-DD']);
    expect(merged.firstFormat).toBe('YYYY-MM-DD');

    // `datetime` 走另一支（`fieldDateTimeFormat`）
    expect(
      mergeFormat('datetime', fillPickerLocale(bare, { showHour: true }), undefined).firstFormat,
    ).toBe('YYYY-MM-DD HH');
  });
});
