/**
 * `onBackground` —— 半透明前景合成到背景（FastColor 的等价物）。
 *
 * ⚠️ 本函数是**全仓单一真源**（2026-09-29 按三次法则从 tour / input-number 收敛而来），
 *    所以这里既测通用式，也把两个真实消费者的判定值钉死 —— 收敛时一旦公式取错，
 *    这两个值会立刻变红。
 */

import { describe, expect, it } from 'vitest';

import { onBackground } from '../color-composite';

describe('onBackground（FastColor 等价物）', () => {
  it('半透明黑叠白底：0.25 ⇒ #bfbfbf（slider handleColorDisabled）', () => {
    expect(onBackground('rgba(0,0,0,0.25)', '#fff').toHexString()).toBe('#bfbfbf');
  });

  it('半透明黑叠白底：0.06 ⇒ #f0f0f0（input-number filledHandleBg）', () => {
    expect(onBackground('rgba(0,0,0,0.06)', '#fff').toHexString()).toBe('#f0f0f0');
  });

  it('前景不透明 ⇒ 结果就是前景（背景不参与）', () => {
    expect(onBackground('#1677ff', '#fff').toHexString()).toBe('#1677ff');
    expect(onBackground('#1677ff', 'rgba(0,0,0,0.06)').toHexString()).toBe('#1677ff');
  });

  it('背景也带 alpha 时按通用式合成（input-number 那份旧实现会算错这条）', () => {
    // 50% 黑 叠 50% 黑于「透明」之上 ⇒ alpha = 0.5 + 0.5*0.5 = 0.75，色相仍是黑
    const c = onBackground('rgba(0,0,0,0.5)', 'rgba(0,0,0,0.5)');
    expect(c.a).toBeCloseTo(0.75, 10);
    expect(c.toRgbString()).toBe('rgba(0,0,0,0.75)');
  });

  it('两侧全透明 ⇒ 透明（不除零）', () => {
    expect(onBackground('rgba(0,0,0,0)', 'rgba(0,0,0,0)').toRgbString()).toBe('rgba(0,0,0,0)');
  });

  it('返回 Color 实例（格式由调用方决定：tour 用 toRgbString、slider/input-number 用 toHexString）', () => {
    const c = onBackground('rgba(0,0,0,0.06)', '#fff');
    expect(c.toRgbString()).toBe('rgb(240,240,240)');
    expect(c.toHexString()).toBe('#f0f0f0');
  });
});
