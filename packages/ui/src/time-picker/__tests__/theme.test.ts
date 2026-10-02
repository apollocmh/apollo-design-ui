/**
 * L7 主题矩阵 —— TimePicker **没有样式表**（零 Component Token），
 * 所以这一层钉的是另外三件事：
 *
 * 1. **主题无关性**（`themeTest`）：14 个 demo 在默认 / 暗色 / 紧凑 / token-override
 *    四态下都能渲染、**都不产生告警**。
 * 2. 🚨 **「无样式表」这条契约本身**：`COMPONENT_STYLES` 里**没有** `time-picker` 这一行
 *    （加了会产出 0 条规则的空文件），`index.ts` 也不导出 `genTimePickerStyle` /
 *    `TimePickerComponentToken`。
 * 3. **零 Component Token 的判据**：antd 的 `es/time-picker/` 里**没有 `style/` 目录**，
 *    也没有一句样式代码（138 个「文件」里 136 个是 dayjs 语言包）。
 *
 * ⚠️ registry 里本组件的 `tokenStatus` / `styleStatus` 是 **`n/a`** + `layerNotes`
 * 写清依据（照 `watermark` 先例）—— 本文件就是那个依据的**可执行版本**。
 */

import { themeTest } from '@apollo-design/test-utils';
import { describe, expect, it } from 'vitest';
import { COMPONENT_STYLES } from '../../style';
import { TimePicker, TimePickerWithRange, TimeRangePicker } from '../index';

themeTest('TimePicker', {
  demos: import.meta.glob('../demo/*.vue', { eager: true }),
  expectCount: 14,
});

describe('TimePicker · 无样式表契约', () => {
  it('🚨 不注册 `genTimePickerStyle`（观感全部来自 date-picker 的 `-picker-*`）', () => {
    // 判据：`es/time-picker/` 没有 `style/` 目录 ⇒ 本仓也不该有
    // （`COMPONENT_STYLES` 加一行会产出 0 条规则的空 CSS 文件）。
    expect(COMPONENT_STYLES.some((item) => item.name === 'time-picker')).toBe(false);
  });

  it('🚨 不导出样式生成函数 / Component Token（逐字对齐 antd）', async () => {
    const mod = (await import('../index')) as Record<string, unknown>;
    expect(
      Object.keys(mod).some((k) => /genTimePickerStyle|TimePickerComponentToken/i.test(k)),
    ).toBe(false);
  });

  it('三个导出都可构造（token 取用不依赖样式表）', () => {
    expect(TimePicker).toBeTruthy();
    expect(TimeRangePicker).toBeTruthy();
    expect(TimePickerWithRange).toBeTruthy();
  });

  it('`TimePicker.RangePicker` 静态别名指向 `TimeRangePicker`（`Object.assign` 的产物）', () => {
    // ⚠️ `Object.assign` 是**原地**修改 ⇒ `TimePicker` 自己也带上了 `RangePicker`。
    expect(TimePickerWithRange.RangePicker).toBe(TimeRangePicker);
  });
});
