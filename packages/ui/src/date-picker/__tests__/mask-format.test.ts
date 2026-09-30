// @vitest-environment node

/**
 * L1 单元 —— 掩码格式（S3）。
 *
 * 契约来源：`@rc-component/picker` 的 `PickerInput/Selector/MaskFormat.js`（81 行）。
 * 每一条判据都注明出处；**纯计算** ⇒ node 环境即可（不需要 jsdom）。
 *
 * ⚠️ 交互行为（键入 / 方向键 / 选择区间同步）在 `s3-mask.test.ts`（jsdom），
 * 本文件只钉「掩码对象本身」。
 */

import { describe, expect, it } from 'vitest';
import { createMaskFormat, MASK_REPLACE_KEY } from '../components/mask-format';

/** 占位字符是**汉字**（上游注释：避免与用户格式串冲突）。 */
const R = MASK_REPLACE_KEY;

describe('createMaskFormat · 模板与分段', () => {
  it('字段位被替换成占位字符，**分隔符原样保留**', () => {
    const m = createMaskFormat('YYYY-MM-DD');
    expect(m.maskFormat).toBe(`${R.repeat(4)}-${R.repeat(2)}-${R.repeat(2)}`);
    expect(m.format).toBe('YYYY-MM-DD');
  });

  it('分段：字段与分隔符交替，`[start, end)` 是**在整串里的**偏移', () => {
    const m = createMaskFormat('YYYY-MM-DD');
    expect(m.cells).toEqual([
      { text: 'YYYY', mask: true, start: 0, end: 4 },
      { text: '-', mask: false, start: 4, end: 5 },
      { text: 'MM', mask: true, start: 5, end: 7 },
      { text: '-', mask: false, start: 7, end: 8 },
      { text: 'DD', mask: true, start: 8, end: 10 },
    ]);
    expect(m.maskCells.map((cell) => cell.text)).toEqual(['YYYY', 'MM', 'DD']);
    expect(m.size()).toBe(3);
  });

  it('字面量（`[年]` 这种）算**非字段**段，也进 `cells` 但不进 `maskCells`', () => {
    const m = createMaskFormat('YYYY[年]MM');
    expect(m.cells.map((cell) => cell.text)).toEqual(['YYYY', '[年]', 'MM']);
    expect(m.cells.map((cell) => cell.mask)).toEqual([true, false, true]);
    expect(m.maskCells).toHaveLength(2);
    // 字面量段的长度也参与偏移
    expect(m.maskCells[1]).toEqual({ text: 'MM', mask: true, start: 7, end: 9 });
  });

  it('`HH:mm:ss.SSS` ⇒ 7 个字段（含毫秒）', () => {
    const m = createMaskFormat('YYYY-MM-DD HH:mm:ss.SSS');
    expect(m.maskCells.map((cell) => cell.text)).toEqual([
      'YYYY',
      'MM',
      'DD',
      'HH',
      'mm',
      'ss',
      'SSS',
    ]);
  });

  it('🚨 `MM` 与 `mm` **大小写敏感**（正则不能加 `i`）', () => {
    expect(createMaskFormat('MM').maskCells.map((c) => c.text)).toEqual(['MM']);
    expect(createMaskFormat('mm').maskCells.map((c) => c.text)).toEqual(['mm']);
    // `MM` 不会被 `mm` 抢走（交替按 FORMAT_KEYS 顺序，`MM` 在前）
    expect(createMaskFormat('MM-DD').maskFormat).toBe(`${R.repeat(2)}-${R.repeat(2)}`);
  });

  it('🚨 `SSS` 排在 `ss` **之后** ⇒ `ssSSS` 切成 `ss` + `SSS`', () => {
    const m = createMaskFormat('ssSSS');
    expect(m.maskCells.map((cell) => cell.text)).toEqual(['ss', 'SSS']);
  });

  it('空格式串 ⇒ 空对象（不抛）', () => {
    const m = createMaskFormat('');
    expect(m.maskFormat).toBe('');
    expect(m.cells).toEqual([]);
    expect(m.maskCells).toEqual([]);
    expect(m.size()).toBe(0);
  });
});

describe('createMaskFormat · getSelection', () => {
  const m = createMaskFormat('YYYY-MM-DD');

  it('按字段下标取 `[start, end)`', () => {
    expect(m.getSelection(0)).toEqual([0, 4]);
    expect(m.getSelection(1)).toEqual([5, 7]);
    expect(m.getSelection(2)).toEqual([8, 10]);
  });

  it('越界 / `null` ⇒ `[0, 0]`（上游 `this.maskCells[i] || {}` 之后 `start || 0`）', () => {
    expect(m.getSelection(3)).toEqual([0, 0]);
    expect(m.getSelection(99)).toEqual([0, 0]);
    expect(m.getSelection(null)).toEqual([0, 0]);
  });

  it('⚠️ 字段从 `0` 开始时也是 `[0, end)` —— `start || 0` 的 `||` 不会吃掉合法的 0', () => {
    // 反向哨兵：若写成 `start ?? 0` 与 `start || 0` 在这里等价；
    // 但若有人「优化」成 `start === undefined ? 0 : start` 也等价 —— 三种写法都对。
    // 真正会错的是把 `end` 也写成 `end || 0` 之外的形态（end 恒 > 0）。
    expect(createMaskFormat('MM-DD').getSelection(0)).toEqual([0, 2]);
  });
});

describe('createMaskFormat · match', () => {
  const m = createMaskFormat('YYYY-MM-DD');

  it('模板本身匹配；字段位任意字符；分隔符必须**逐字**相同', () => {
    expect(m.match(`${R.repeat(4)}-${R.repeat(2)}-${R.repeat(2)}`)).toBe(true);
    expect(m.match('2026-09-30')).toBe(true);
    expect(m.match('2026/09/30')).toBe(false);
    expect(m.match('2026_09_30')).toBe(false);
  });

  it('长度不足 ⇒ 不匹配（少了字符）', () => {
    expect(m.match('2026-09-3')).toBe(false);
    expect(m.match('2026-09-')).toBe(false);
    expect(m.match('')).toBe(false);
  });

  it('🚨 **只查前缀** ⇒ 更长的文本**也**匹配（上游形态，别改成严格等长）', () => {
    expect(m.match('2026-09-30123')).toBe(true);
    expect(m.match('2026-09-30xyz')).toBe(true);
  });

  it('⚠️ 空格式串：**任何**文本都算匹配（循环 0 次 ⇒ 直接 `true`）', () => {
    // ⚠️ 这条记录的是上游的**真实**行为，不是「合理」行为：
    //    `for (let i = 0; i < maskFormat.length; ...)` 在空模板下不迭代 ⇒ 返回 `true`。
    //    生产路径上不会用到（`mask-input.ts` 的 `enabled` 在空格式串时为假），
    //    但**不能**「顺手」改成 `text === ''` —— 那是改判据，不是修 bug。
    const empty = createMaskFormat('');
    expect(empty.match('')).toBe(true);
    expect(empty.match('x')).toBe(true);
    expect(empty.match('2026-09-30')).toBe(true);
  });
});

describe('createMaskFormat · getMaskCellIndex（鼠标点哪一格）', () => {
  const m = createMaskFormat('YYYY-MM-DD');

  it('落在某段的 `[start, end]` 内 ⇒ 直接给该字段（**闭区间**，`end` 也算）', () => {
    expect(m.getMaskCellIndex(0)).toBe(0);
    expect(m.getMaskCellIndex(3)).toBe(0);
    expect(m.getMaskCellIndex(4)).toBe(0); // 上界的 4 归 YYYY（不是 MM 的 5）
    expect(m.getMaskCellIndex(5)).toBe(1);
    expect(m.getMaskCellIndex(7)).toBe(1);
    expect(m.getMaskCellIndex(9)).toBe(2);
  });

  it('落在分隔符上 ⇒ 取**最近**的字段', () => {
    // 6 在 MM 里
    expect(m.getMaskCellIndex(6)).toBe(1);
    // 8 是第二个 `-`，到 MM.end=7 的距离 1、到 DD.start=8 的距离 0 ⇒ DD
    expect(m.getMaskCellIndex(8)).toBe(2);
  });

  it('远超范围 ⇒ 最近的边界那一格', () => {
    expect(m.getMaskCellIndex(-100)).toBe(0);
    expect(m.getMaskCellIndex(1000)).toBe(2);
  });

  it('空格式串 ⇒ `0`（不抛）', () => {
    expect(createMaskFormat('').getMaskCellIndex(5)).toBe(0);
  });
});
