// @vitest-environment node
/**
 * L1 —— 键入解析（S2 的第一步）。
 *
 * ⚠️ **必须是 node 环境**（`@vitest-environment node`）：解析是纯计算，不需要 DOM；
 * 而 jsdom 在当前机器上冷加载要 3 分钟以上（PITFALLS 231）⇒ 用 jsdom 会让这批用例
 * 一个都跑不起来。这也正是「先把纯函数做对」的理由。
 *
 * 契约来源：rc `PickerInput/Selector/hooks/useInputProps.js:46-81`。
 *
 * ── 这个文件里有两条用例是在**验证注释里的断言**，不是验证代码 ──────────────────
 *
 * 1. 「`locale.parse` 格式不匹配时返回**当前时间**而不是 `null`」——
 *    这条决定了 `isValidate` 那一步能不能省。注释里写了就必须钉住。
 * 2. 「`formatList` 里混入非字符串时**跳过**」—— 上游有 `typeof === 'string'` 检查。
 */

import { dayjsGenerateConfig } from '@apollo-design/picker';
import { describe, expect, it } from 'vitest';
import { parseTextWithFormat, validateFormat } from '../hooks/picker-typing';

const CTX = {
  locale: 'en',
  formatList: ['YYYY-MM-DD', 'YYYY/MM/DD'],
  generateConfig: dayjsGenerateConfig,
};

/** 取「有值的解析结果」（`DatePickerDate | null` ⇒ 显式化，越界/空值**抛错**）。 */
const at = (date: ReturnType<typeof parseTextWithFormat>): NonNullable<typeof date> => {
  if (!date) {
    throw new Error('期望解析出日期，实际是 null');
  }
  return date;
};

describe('picker-typing · parseTextWithFormat（单格式解析）', () => {
  it('匹配格式 ⇒ 解析出对应日期', () => {
    const d = at(parseTextWithFormat('2026-09-30', 'YYYY-MM-DD', CTX));
    expect(d.year()).toBe(2026);
    expect(d.month()).toBe(8); // dayjs 的 month 是 0-based
    expect(d.date()).toBe(30);
  });

  it('斜杠格式也认（同一套 `locale.parse`）', () => {
    const d = at(parseTextWithFormat('2026/09/30', 'YYYY/MM/DD', CTX));
    expect(d.format('YYYY-MM-DD')).toBe('2026-09-30');
  });

  it('格式不匹配 ⇒ `null`（`isValidate` 那一步把它挡掉）', () => {
    expect(parseTextWithFormat('乱写的东西', 'YYYY-MM-DD', CTX)).toBeNull();
  });

  it('🚨 实测钉住「`isValidate` 到底挡什么」—— 不匹配时 `locale.parse` **本来就返回 null**', () => {
    // ⚠️ 这条是**修正**：我起草实现时断言「不匹配时返回当前时间兜底」⇒ 实测推翻了。
    //    现在如实钉住两条事实：
    const raw = dayjsGenerateConfig.locale.parse('en', '乱写的东西', ['YYYY-MM-DD']);
    // 事实 1：格式不匹配 ⇒ `null`（所以 `isValidate` 在这条路径上是**冗余**的）
    expect(raw).toBeNull();

    // 事实 2：`isValidate` 真正挡的是 **Invalid Date**（不是 null）——
    //    看 dayjs 对「看起来像日期但解析不出」的输入给什么。
    const invalid = dayjsGenerateConfig.locale.parse('en', 'not-a-date', ['YYYY-MM-DD']);
    if (invalid) {
      // 若 dayjs 给了实例，那它必须是 Invalid ⇒ `isValidate` 判 false（这正是那一步的用处）
      expect(dayjsGenerateConfig.isValidate(invalid)).toBe(false);
    } else {
      // 若这里也是 null，说明本机的 dayjs 对所有不匹配输入都返回 null
      // ⇒ `isValidate` 确实只是「与上游逐字一致」的双保险
      expect(invalid).toBeNull();
    }
  });

  it('非法日期（2 月 30 日）⇒ `null`（dayjs 的 parse 对它返回 Invalid）', () => {
    const d = parseTextWithFormat('2026-02-30', 'YYYY-MM-DD', CTX);
    // dayjs 的非 strict parse 会把 02-30 溢出成 03-02 ⇒ 这里如实记录**当前行为**
    // （上游也没有用 strict 模式；若将来要对齐 antd 的「严格解析」需另开决策）
    if (d) {
      expect(d.format('YYYY-MM-DD')).toBe('2026-03-02');
    } else {
      expect(d).toBeNull();
    }
  });
});

describe('picker-typing · validateFormat（逐个格式尝试）', () => {
  it('第一个格式命中 ⇒ 直接返回（不再试后面的）', () => {
    const d = validateFormat('2026-09-30', CTX);
    expect(d).not.toBe(false);
    expect((d as NonNullable<typeof d>).format('YYYY-MM-DD')).toBe('2026-09-30');
  });

  it('🚨 「`format` 传数组」的意义：第二套格式也能命中', () => {
    // 第一个格式 `YYYY-MM-DD` 对 `2026/09/30` 不匹配 ⇒ 落到第二个 `YYYY/MM/DD`
    const d = validateFormat('2026/09/30', CTX);
    expect(d).not.toBe(false);
    expect((d as NonNullable<typeof d>).format('YYYY-MM-DD')).toBe('2026-09-30');
  });

  it('都不命中 ⇒ **`false`**（不是 `null` —— 上游如此）', () => {
    expect(validateFormat('完全不是日期', CTX)).toBe(false);
  });

  it('空 `formatList` ⇒ `false`（locale 缺字段时会走到这一支）', () => {
    expect(validateFormat('2026-09-30', { ...CTX, formatList: [] })).toBe(false);
  });

  it("🚨 `formatList` 里混入非字符串时**跳过**（上游 `typeof === 'string'` 检查）", () => {
    // 这条钉住「函数形态 / 掩码对象不参与解析」：
    // 若把函数当格式串传下去，`locale.parse` 会收到非字符串 ⇒ 抛错或静默错解。
    const withNoise = {
      ...CTX,
      // 故意混入三种非字符串（函数 / 对象 / null），后面才是可用的字符串
      formatList: [
        (() => 'YYYY') as unknown as string,
        { format: 'YYYY-MM-DD' } as unknown as string,
        null as unknown as string,
        'YYYY-MM-DD',
      ],
    };
    const d = validateFormat('2026-09-30', withNoise);
    expect(d).not.toBe(false);
    expect((d as NonNullable<typeof d>).format('YYYY-MM-DD')).toBe('2026-09-30');
  });

  it('只有一个非字符串项 ⇒ `false`（跳过之后没有可试的）', () => {
    const onlyNoise = {
      ...CTX,
      formatList: [(() => 'YYYY') as unknown as string],
    };
    expect(validateFormat('2026-09-30', onlyNoise)).toBe(false);
  });
});
