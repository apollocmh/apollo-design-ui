/**
 * dayjs 适配层的**自身分支**测试（oracle 之外的部分）。
 *
 * 与 `generate-dayjs.oracle.test.ts` 并存：oracle 只对拍「上游也有的输入」，
 * 下面这些分支**上游没有对应的可测入口**（如 timezone 插件那条），只能单独钉住。
 */

import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { afterEach, describe, expect, it } from 'vitest';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/fr';

import { dayjsGenerateConfig as g } from '../generate/dayjs';

const fmt = (d: Dayjs): string => d.format('YYYY-MM-DD');

describe('getNow', () => {
  afterEach(() => {
    // 保险：任何用例都必须把 prototype 上的桩摘掉
    const proto = Object.getPrototypeOf(dayjs()) as Record<string, unknown>;
    if (Object.getOwnPropertyDescriptor(proto, '__tzStub') !== undefined) {
      delete proto.tz;
      delete proto.__tzStub;
    }
  });

  it('⭐ 装了 timezone 插件时走 `now.tz()`（antd#50934）', () => {
    const proto = Object.getPrototypeOf(dayjs()) as Record<string, unknown>;
    const sentinel = dayjs('2000-01-01');
    Object.defineProperty(proto, 'tz', {
      configurable: true,
      writable: true,
      value: function tzStub() {
        return sentinel;
      },
    });
    Object.defineProperty(proto, '__tzStub', { configurable: true, value: true });

    expect(fmt(g.getNow())).toBe('2000-01-01');
  });

  it('没装 timezone 插件时返回 dayjs()', () => {
    expect(g.getNow().isValid()).toBe(true);
  });
});

describe('locale.parse 的两条出口', () => {
  it('Wo 试算 52 次都没命中 ⇒ null', () => {
    expect(g.locale.parse('en_US', '2026-99', ['YYYY-Wo'])).toBeNull();
    expect(g.locale.parse('en_US', '2026-00', ['YYYY-wo'])).toBeNull();
  });

  it('空 formats ⇒ null；空文本 ⇒ null', () => {
    expect(g.locale.parse('en_US', '2026-09-19', [])).toBeNull();
    expect(g.locale.parse('en_US', '', ['YYYY-MM-DD'])).toBeNull();
  });

  it('多个格式里有一个命中就返回它', () => {
    const out = g.locale.parse('en_US', '2026/09/19', ['YYYY-MM-DD', 'YYYY/MM/DD']);
    expect(out).not.toBeNull();
    expect(fmt(out as Dayjs)).toBe('2026-09-19');
  });
});

describe('parseLocale 的两个出口（localeMap 命中 / fallback）', () => {
  it('映射表命中的：zh_CN → zh-cn（周一为首）', () => {
    expect(g.locale.getWeekFirstDay('zh_CN')).toBe(1);
  });

  it('⭐ 映射表没命中的：fallback 到下划线前的那段（fr_FR → fr）', () => {
    // 与上游 `generate/dayjs.js` 的 localeMap 一致：fr_FR 不在表里 ⇒ 'fr'
    const viaMap = g.locale.getWeekFirstDay('fr_FR');
    const direct = g.locale.getWeekFirstDay('fr');
    expect(viaMap).toBe(direct);
    // fr 是「周一为首」，en 是「周日为首」⇒ fallback 真的生效了（不是两边都回退 en）
    expect(viaMap).toBe(1);
    expect(g.locale.getWeekFirstDay('en_US')).toBe(0);
  });

  it('特殊映射：by_BY → be、kmr_IQ → ku', () => {
    expect(g.locale.getWeekFirstDay('by_BY')).toBe(g.locale.getWeekFirstDay('be'));
    expect(g.locale.getWeekFirstDay('kmr_IQ')).toBe(g.locale.getWeekFirstDay('ku'));
  });
});

describe('getWeekDay 的周日基准（generate/dayjs.js:125-127）', () => {
  it('en 与 zh_CN 下同一天得到同一个数 —— 它恒以周日为 0', () => {
    // getWeekDay 内部强制 `.locale('en')`，所以与传入的 locale 无关
    const d = dayjs('2026-09-19'); // 周六
    expect(g.getWeekDay(d)).toBe(6);
    expect(g.getWeekDay(dayjs('2026-09-20'))).toBe(0); // 周日
  });
});
