/**
 * L1 —— 73 个语言包与 antd 源**逐字段**比对。
 *
 * oracle 是 `tests/compat/baselines/locale.json`：由 `gen-locale.mjs` 在生成时
 * 顺手写出的**求值结果**（不是人写的期望值）。这样「73 个包都没抄错」不需要人眼核对，
 * 也让「生成器改坏了」立刻变成红灯。
 *
 * ⚠️ 基线是**生成物**，与 `packages/locale/src/locales/` 同源同版本。
 *    两者不一致就说明有人手改了产物，或者生成器与基线没同步重跑。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { Locale } from '../index';
import * as locales from '../locales';

const here = path.dirname(fileURLToPath(import.meta.url));
const BASELINE = path.resolve(here, '../../../../tests/compat/baselines/locale.json');

const baseline = JSON.parse(fs.readFileSync(BASELINE, 'utf8')) as Record<string, Locale>;
const names = Object.keys(baseline).sort();

/** 上游的语言包清单（73 个）。 */
const EXPECTED_NAMES = names;

describe('语言包清单', () => {
  it('⭐ 恰好 73 个（不是早期文档写的 75）', () => {
    expect(names).toHaveLength(73);
    expect(Object.keys(locales)).toHaveLength(73);
  });

  it('⭐ 导出的名字与基线一一对应（不多不少）', () => {
    expect(Object.keys(locales).sort()).toEqual(EXPECTED_NAMES);
  });

  it('包含必须完整覆盖的 zh_CN 与 en_US', () => {
    expect(names).toContain('zh_CN');
    expect(names).toContain('en_US');
  });

  it('导出名保留 antd 的下划线原名（便于只改包名迁移）', () => {
    for (const name of ['zh_CN', 'zh_TW', 'zh_HK', 'en_GB', 'pt_BR', 'sr_RS']) {
      expect(names).toContain(name);
    }
  });
});

describe('⭐ 每个语言包与 antd 源逐字段一致', () => {
  it.each(EXPECTED_NAMES)('%s', (name) => {
    expect((locales as Record<string, unknown>)[name]).toEqual(baseline[name]);
  });
});

describe('语言包的形状', () => {
  it('⭐ 每个包都有 `locale` 字段且是连字符小写', () => {
    for (const name of names) {
      const value = baseline[name] as Locale;
      expect(typeof value.locale).toBe('string');
      // 文件名是下划线（zh_CN），locale 字段是连字符小写（zh-cn）—— 两者不能互推
      expect(value.locale).not.toContain('_');
      expect(value.locale).toBe(value.locale.toLowerCase());
    }
  });

  it('⭐ 73 个包全部覆盖了 18 个分片（除 Select 与 Carousel）', () => {
    const alwaysPresent = [
      'locale',
      'Pagination',
      'DatePicker',
      'TimePicker',
      'Calendar',
      'global',
      'Table',
      'Tour',
      'Modal',
      'Popconfirm',
      'Transfer',
      'Upload',
      'Empty',
      'Icon',
      'Text',
      'Form',
      'QRCode',
      'ColorPicker',
    ];
    for (const name of names) {
      for (const key of alwaysPresent) {
        expect(Object.keys(baseline[name] as Locale)).toContain(key);
      }
    }
  });

  it('⭐ `Select` 分片一个包都没有 —— 它是留给 ConfigProvider 的口子，不是疏漏', () => {
    for (const name of names) {
      expect((baseline[name] as Locale).Select).toBeUndefined();
    }
  });

  it('⭐ `Carousel` 只有 48 个包有（其余 25 个没有）', () => {
    const withCarousel = names.filter((n) => (baseline[n] as Locale).Carousel !== undefined);
    expect(withCarousel).toHaveLength(48);
  });

  it('⭐ 分片内部的字段名与 antd 一致（抽查几个易错的）', () => {
    const zh = baseline.zh_CN as Locale;
    // Pagination 是 snake_case，与其它分片的 camelCase 不一致 —— rc-pagination 的既有形状
    expect(zh.Pagination).toHaveProperty('items_per_page');
    expect(zh.Pagination).toHaveProperty('prev_5');
    // Table 有 17 个字段
    expect(Object.keys(zh.Table ?? {})).toHaveLength(17);
    // Modal 三个
    expect(zh.Modal).toEqual({ okText: '确定', cancelText: '取消', justOkText: '知道了' });
    // Tour 的键是**大写开头**（Next / Previous / Finish）
    expect(Object.keys(zh.Tour ?? {}).sort()).toEqual(['Finish', 'Next', 'Previous']);
  });

  it('⭐ Form 的 13 个 types 指向同一个模板串（生成器把它抽成了 typeTemplate）', () => {
    for (const name of names) {
      const types = (baseline[name] as Locale).Form?.defaultValidateMessages?.types;
      expect(types).toBeDefined();
      const values = Object.values(types ?? {});
      expect(values).toHaveLength(13);
      expect(new Set(values).size).toBe(1);
    }
  });

  it('Pagination 的 jump_to_confirm / page_size 是部分语言才有的', () => {
    const missing = names.filter(
      (n) => (baseline[n] as Locale).Pagination?.jump_to_confirm === undefined,
    );
    expect(missing.length).toBeGreaterThan(0);
    expect(missing.length).toBeLessThan(names.length);
  });
});
