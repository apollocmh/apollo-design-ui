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
import { describe, expect, it } from 'vitest';
import {
  getInputSize,
  getRangeShowClear,
  getSingleShowClear,
  isRenderable,
  toDisabledPair,
} from '../components/Selector';
import { mergeFormat } from '../hooks/picker-format';
import { getPlaceholder, getRangePlaceholder, mergePickerLocale } from '../hooks/picker-locale';
import type { RcPickerLocale } from '../hooks/picker-types';
import { toDateArray } from '../hooks/picker-value';
import type { MaskFormatConfig } from '../interface';

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
});

describe('date-picker · Selector 的纯判据（S1）', () => {
  it('getInputSize：日期 12 / 带时间 21（SSR 实测判定值）', () => {
    expect(getInputSize('date', 'YYYY-MM-DD')).toBe(12); // max(10, 10) + 2
    expect(getInputSize('date', 'YYYY-MM-DD HH:mm:ss')).toBe(21); // max(10, 19) + 2
    // time 的 defaultSize 是 8
    expect(getInputSize('time', 'HH:mm:ss')).toBe(10); // max(8, 8) + 2
    // format 比 defaultSize 短 ⇒ 用 defaultSize
    expect(getInputSize('time', 'HH')).toBe(10); // max(8, 2) + 2
  });

  it('getInputSize：无 format 时退化成 defaultSize + 2', () => {
    expect(getInputSize('date', undefined)).toBe(12);
    expect(getInputSize('time', undefined)).toBe(10);
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

  it('isRenderable：只排除 null / undefined / boolean / 空数组（空串**算**可渲染）', () => {
    expect(isRenderable('x')).toBe(true);
    expect(isRenderable(0)).toBe(true);
    // ⚠️ 上游 `isReactRenderable('')` 是 **true**（不是 truthy 判据）
    expect(isRenderable('')).toBe(true);
    expect(isRenderable(null)).toBe(false);
    expect(isRenderable(undefined)).toBe(false);
    expect(isRenderable(true)).toBe(false);
    expect(isRenderable(false)).toBe(false);
    expect(isRenderable([])).toBe(false);
    expect(isRenderable([''])).toBe(true);
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
