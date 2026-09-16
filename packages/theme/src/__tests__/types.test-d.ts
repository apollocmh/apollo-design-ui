import { describe, expectTypeOf, it } from 'vitest';
import type { AliasToken, MappingAlgorithm, MapToken, SeedToken, ThemeConfig } from '../index';
import {
  compactAlgorithm,
  createCSSVarScope,
  darkAlgorithm,
  defaultAlgorithm,
  defaultSeedToken,
  getDesignToken,
  token2CSSVar,
  transformToken,
} from '../index';

/**
 * L3 类型测试。
 *
 * 必须有**负例**（TESTING.md T7）：只断言"这样写能过"是没用的 ——
 * 类型太宽（比如退化成 any）时正例照样全绿。负例用 @ts-expect-error 断言
 * "这里应当报错"；若 TS 不再报错，@ts-expect-error 本身会变成错误。
 */
describe('theme 类型契约', () => {
  it('getDesignToken 返回完整 AliasToken', () => {
    expectTypeOf(getDesignToken()).toMatchTypeOf<AliasToken>();
  });

  it('SeedToken 的字段类型正确（不是 any）', () => {
    expectTypeOf(defaultSeedToken.fontSize).toEqualTypeOf<number>();
    expectTypeOf(defaultSeedToken.colorPrimary).toEqualTypeOf<string>();
    expectTypeOf(defaultSeedToken.motion).toEqualTypeOf<boolean>();
  });

  it('三个算法都符合 MappingAlgorithm（可放进数组组合）', () => {
    expectTypeOf(defaultAlgorithm).toMatchTypeOf<MappingAlgorithm>();
    expectTypeOf(darkAlgorithm).toMatchTypeOf<MappingAlgorithm>();
    expectTypeOf(compactAlgorithm).toMatchTypeOf<MappingAlgorithm>();
  });

  it('ThemeConfig.algorithm 接受单个或数组', () => {
    expectTypeOf<ThemeConfig['algorithm']>().toEqualTypeOf<
      MappingAlgorithm | MappingAlgorithm[] | undefined
    >();
  });

  it('token2CSSVar 返回 string', () => {
    expectTypeOf(token2CSSVar('colorPrimary')).toEqualTypeOf<string>();
  });

  it('transformToken 的 refs 允许 number（preserve 的断点）', () => {
    expectTypeOf(transformToken(getDesignToken()).refs).toEqualTypeOf<
      Record<string, string | number>
    >();
  });

  it('createCSSVarScope 返回可 apply / remove 的 scope', () => {
    const scope = createCSSVarScope(document.createElement('div'));
    expectTypeOf(scope.apply).parameter(0).toMatchTypeOf<AliasToken>();
    expectTypeOf(scope.remove).toBeCallableWith();
  });

  // ---------------- 负例 ----------------

  it('负例：SeedToken 不接受错误的字段', () => {
    const bad: SeedToken = {
      ...defaultSeedToken,
      // @ts-expect-error borderRadius 是 number，不能给字符串
      borderRadius: '6',
    };
    void bad;
  });

  it('负例：SecretToken 的必填字段不能缺', () => {
    // @ts-expect-error 缺少 SeedToken 的必填项
    const bad: SeedToken = { colorPrimary: '#1677ff' };
    void bad;
  });

  it('负例：getDesignToken 不接受任意结构', () => {
    // 只声明不调用 —— 类型测试文件也会被执行，真调用会在运行时炸掉
    // （'dark' 不是函数，reduce 会抛 "fn is not a function"）。
    // @ts-expect-error algorithm 必须是算法函数，不是字符串
    const badCall = (): AliasToken => getDesignToken({ algorithm: 'dark' });
    void badCall;
  });

  it('负例：层级是单向的 —— SeedToken 不能当 MapToken 用', () => {
    // MapToken = SeedToken & Map 层，所以「MapToken 赋给 SeedToken」是合法的；
    // 反过来才是不合法的。这条负例盯的是后者。
    // @ts-expect-error SeedToken 缺少 Map 层的字段
    const asMap: MapToken = defaultSeedToken;
    void asMap;
  });
});
