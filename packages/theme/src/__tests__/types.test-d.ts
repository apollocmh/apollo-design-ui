import { describe, expectTypeOf, it } from 'vitest';
import { h } from 'vue';
import type { AliasToken, MappingAlgorithm, MapToken, SeedToken, ThemeConfig } from '../index';
import {
  compactAlgorithm,
  createCSSVarScope,
  darkAlgorithm,
  defaultAlgorithm,
  defaultSeedToken,
  formatToken,
  getDesignToken,
  type ThemeProvider,
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
  it('组件配置接受已有布尔 Token，但不接受对象和回调', () => {
    const config: ThemeConfig = { components: { InputNumber: { handleVisible: false } } };
    expectTypeOf(config).toMatchTypeOf<ThemeConfig>();
    const invalid = () => {
      const callback: ThemeConfig = {
        components: {
          InputNumber: {
            // @ts-expect-error Component tokens are scalar values, not callbacks.
            handleVisible: () => true,
          },
        },
      };
      const nested: ThemeConfig = {
        components: {
          InputNumber: {
            // @ts-expect-error Nested objects are not component token values.
            handleVisible: { value: true },
          },
        },
      };
      return [callback, nested];
    };
    expectTypeOf(invalid).toBeFunction();
  });
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

  it('Seed、Alias 和未知扩展保留各自的值类型，undefined 表示省略', () => {
    const config: ThemeConfig = {
      token: {
        fontSize: 18,
        colorPrimaryBg: '#ddeeff',
        fontHeight: 26,
        motion: false,
        customLength: 9,
        customEnabled: true,
        colorText: undefined,
      },
    };
    expectTypeOf(getDesignToken(config)).toMatchTypeOf<AliasToken>();
    expectTypeOf(formatToken(defaultAlgorithm(defaultSeedToken))).toMatchTypeOf<AliasToken>();
  });

  it('负例：已知 Alias 键不能借扩展索引签名接收错误值', () => {
    // @ts-expect-error 已知颜色 Alias 是 string；boolean 仅用于布尔 Token 或未知扩展。
    const badColor: ThemeConfig = { token: { colorPrimaryBg: false } };
    // @ts-expect-error 已知字号 Alias 是 number，不能当作未知扩展的 string。
    const badHeight: ThemeConfig = { token: { fontHeight: 'large' } };
    const badOverride = () => {
      return formatToken({
        ...defaultAlgorithm(defaultSeedToken),
        override: {
          // @ts-expect-error 直接 Map → Alias 覆盖也必须保持已知颜色字段的类型。
          colorPrimaryBg: false,
        },
      });
    };
    void [badColor, badHeight, badOverride];
  });

  it('负例：DOM 类名前缀不属于纯主题派生配置', () => {
    // @ts-expect-error 无消费的 theme.prefixCls 已移除；DOM 前缀使用 ConfigProvider 顶层 prefixCls。
    const bad: ThemeConfig = { prefixCls: 'brand' };
    const valid: ThemeConfig = { cssVarPrefix: 'brand', token: { colorPrimary: '#123456' } };
    void [bad, valid];
  });

  it('ThemeProvider target 接受原生 Vue DOM 引用的空值', () => {
    type Target = InstanceType<typeof ThemeProvider>['$props']['target'];
    const initial: Target = null;
    const mounted: Target = document.createElement('div');
    const svg: Target = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    createCSSVarScope(svg);
    // @ts-expect-error target 只能是 HTMLElement、null 或省略，不能传任意布尔值。
    const invalid: Target = false;
    void [initial, mounted, svg, invalid];
  });

  it('ThemeProvider 只公开无业务 scope 的 default 内容槽', () => {
    type Slots = InstanceType<typeof ThemeProvider>['$slots'];
    const valid: Slots = { default: () => [h('span'), 'text', 0, false] };
    // @ts-expect-error header 不是运行时支持的具名槽，不能由宽泛 Slots 接受。
    const invalid: Slots['header'] = () => [];
    void [valid, invalid];
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
    expectTypeOf(scope.apply).parameter(0).toMatchTypeOf<Partial<AliasToken>>();
    scope.apply({ colorPrimary: '#0055aa' });
    // @ts-expect-error 部分别名仍保持已知颜色类型，不能用布尔值伪装颜色。
    scope.apply({ colorPrimary: false });
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
