import { describe, expect, it } from 'vitest';
import { BRAND, BRAND_BRACKET, warningPrefix } from '../brand';

/**
 * `BRAND` 是待裁决项 Q1（`apollo` vs `ant`）的**唯一收敛点**。
 *
 * ⚠️ 所以这里断言的是「格式」而不是「具体值」：
 *    一旦 Q1 裁决为 `ant`，这个测试文件不需要改一行。
 *    任何硬编码 `'apollo'` 的断言都是给未来埋雷。
 */
describe('brand', () => {
  it('BRAND 是非空小写字符串（会直接拼进类名与 CSS 变量名）', () => {
    expect(typeof BRAND).toBe('string');
    expect(BRAND).not.toBe('');
    expect(BRAND).toBe(BRAND.toLowerCase());
    // 类名前缀不能含空白或分隔符，否则 `.${BRAND}-button` 会碎掉
    expect(BRAND).toMatch(/^[a-z][a-z0-9]*$/);
  });

  it('BRAND_BRACKET 由 BRAND 派生，格式与 antd 的 `[antd]` 同构', () => {
    expect(BRAND_BRACKET).toBe(`[${BRAND}]`);
  });

  it('warningPrefix 格式与 antd 的 `[antd: Button]` 同构', () => {
    expect(warningPrefix('Button')).toBe(`[${BRAND}: Button]`);
    expect(warningPrefix('Empty')).toBe(`[${BRAND}: Empty]`);
  });

  it('warningPrefix 保留组件名的原始大小写（antd 用 PascalCase）', () => {
    expect(warningPrefix('ConfigProvider')).toContain('ConfigProvider');
  });

  it('warningPrefix 不校验入参 —— 空字符串也不抛错', () => {
    expect(() => warningPrefix('')).not.toThrow();
    expect(warningPrefix('')).toBe(`[${BRAND}: ]`);
  });

  it('三个导出彼此一致：前缀里一定含 BRAND，括号里一定是 BRAND', () => {
    expect(warningPrefix('X')).toContain(BRAND);
    expect(BRAND_BRACKET).toContain(BRAND);
  });
});
