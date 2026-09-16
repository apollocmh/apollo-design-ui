import { describe, expectTypeOf, it } from 'vitest';
import type { Component } from 'vue';
import { HomeOutlined, LoadingOutlined } from '../icons';
import type {
  AbstractNode,
  AntdIconProps,
  CustomIconComponentProps,
  CustomIconOptions,
  IconContextProps,
  IconDefinition,
  ThemeType,
  ThemeTypeUpperCase,
  TwoToneColor,
  TwoToneColorPalette,
  TwoToneColorPaletteSetter,
} from '../index';
import {
  createFromIconfontCN,
  createIcon,
  DEFAULT_ICON_PREFIX_CLS,
  DEFAULT_TWOTONE_COLOR,
  getIconStyle,
  getSecondaryColor,
  getTwoToneColor,
  getTwoToneColors,
  Icon,
  IconProvider,
  isIconDefinition,
  setTwoToneColor,
  setTwoToneColors,
} from '../index';

/**
 * L3 · 类型测试。
 *
 * 必须有**负例**（`TESTING.md` T7）：只断言"这样写能过"是没用的 ——
 * 类型太宽（比如退化成 `any`）时正例照样全绿。
 * 负例用 `@ts-expect-error` 断言"这里应当报错"；若 TS 不再报错，
 * `@ts-expect-error` 本身会变成错误（vitest 的 types project 开了
 * `ignoreSourceErrors: false`，所以它会真的失败）。
 *
 * 这是 `@ts-expect-error` 在本仓库唯一被允许的用法（`AGENTS.md` H10 的例外，
 * 见 vitest.config.ts 里 types project 的注释）。
 *
 * ⚠️ **负例必须只声明、不调用。** `*.test-d.ts` 会被 vitest **真的执行一遍**
 * （types project 只是额外叠了 tsc 检查，不会跳过运行时）。直接写
 * `setTwoToneColor(123)` 这种「负例」会在运行时抛 `TypeError`，
 * 把一个类型问题伪装成运行时失败。统一写成不会被调用的箭头函数。
 */

const SAMPLE_DEFINITION: IconDefinition = {
  name: 'sample',
  theme: 'outlined',
  icon: { tag: 'svg', attrs: { viewBox: '0 0 1024 1024' } },
};

describe('icons 类型契约', () => {
  it('TwoToneColor 恰好是 string | [string, string]', () => {
    expectTypeOf<TwoToneColor>().toEqualTypeOf<string | [string, string]>();
    expectTypeOf<TwoToneColor>().not.toEqualTypeOf<string[]>();
  });

  it('TwoToneColor 拒绝其它形态（负例）', () => {
    // @ts-expect-error 三元组不是 TwoToneColor
    const triple: TwoToneColor = ['#1', '#2', '#3'];
    // @ts-expect-error number 不是 TwoToneColor
    const numeric: TwoToneColor = 123;
    // @ts-expect-error 无界数组不能赋给定长二元组
    const unbounded: TwoToneColor = ['#1'] as string[];
    void triple;
    void numeric;
    void unbounded;
  });

  it('AntdIconProps 的每个字段都是具体类型，不是 any', () => {
    expectTypeOf<AntdIconProps['spin']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<AntdIconProps['rotate']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<AntdIconProps['tabIndex']>().toEqualTypeOf<number | undefined>();
    expectTypeOf<AntdIconProps['twoToneColor']>().toEqualTypeOf<TwoToneColor | undefined>();
  });

  it('AntdIconProps 拒绝错误类型（负例）', () => {
    // @ts-expect-error rotate 是 number，不接受字符串（"90deg" 这类写法必须在编译期被拦住）
    const badRotate: AntdIconProps = { rotate: '90' };
    // @ts-expect-error spin 是 boolean
    const badSpin: AntdIconProps = { spin: 'yes' };
    // @ts-expect-error twoToneColor 不接受三元组
    const badColor: AntdIconProps = { twoToneColor: ['#1', '#2', '#3'] };
    void badRotate;
    void badSpin;
    void badColor;
  });

  it('上游类型被复用而不是重新声明（结构一致性）', () => {
    expectTypeOf<ThemeType>().toEqualTypeOf<'filled' | 'outlined' | 'twotone'>();
    expectTypeOf<ThemeTypeUpperCase>().toEqualTypeOf<'Filled' | 'Outlined' | 'TwoTone'>();
    expectTypeOf<IconDefinition['theme']>().toEqualTypeOf<ThemeType>();
    expectTypeOf<AbstractNode['tag']>().toEqualTypeOf<string>();
    expectTypeOf<AbstractNode['attrs']>().toMatchTypeOf<Record<string, string>>();
    expectTypeOf<AbstractNode['children']>().toEqualTypeOf<AbstractNode[] | undefined>();
  });

  it('IconDefinition.icon 是「函数或对象」的联合（TwoTone 的分流依据）', () => {
    expectTypeOf<IconDefinition['icon']>().toEqualTypeOf<
      ((primaryColor: string, secondaryColor: string) => AbstractNode) | AbstractNode
    >();
  });

  it('isIconDefinition 是类型守卫，能把 unknown 收窄', () => {
    const value: unknown = SAMPLE_DEFINITION;
    if (isIconDefinition(value)) {
      expectTypeOf(value).toEqualTypeOf<IconDefinition>();
    }
  });

  it('图标组件都是合法的 Vue 组件', () => {
    expectTypeOf(HomeOutlined).toMatchTypeOf<Component>();
    expectTypeOf(LoadingOutlined).toMatchTypeOf<Component>();
    expectTypeOf(Icon).toMatchTypeOf<Component>();
    expectTypeOf(IconProvider).toMatchTypeOf<Component>();
  });

  it('createIcon 的签名：定义必填、名字可选', () => {
    const unnamed: Component = createIcon(SAMPLE_DEFINITION);
    const named: Component = createIcon(SAMPLE_DEFINITION, 'Sample');
    expectTypeOf(unnamed).toMatchTypeOf<Component>();
    expectTypeOf(named).toMatchTypeOf<Component>();

    // 负例只声明不调用 —— 类型测试文件也会被执行，真调用会在运行时炸掉。
    // @ts-expect-error 定义必填
    const noArgs = () => createIcon();
    // @ts-expect-error 第二个参数必须是 string
    const badName = () => createIcon(SAMPLE_DEFINITION, 1);
    void noArgs;
    void badName;
  });

  it('createFromIconfontCN 的选项与返回值', () => {
    const IconFont: Component = createFromIconfontCN({
      scriptUrl: ['//a.js', '//b.js'],
      extraCommonProps: { class: 'x' },
    });
    expectTypeOf(IconFont).toMatchTypeOf<Component>();

    // scriptUrl 单值与数组都允许
    const options: CustomIconOptions = { scriptUrl: '//a.js' };
    expectTypeOf(options).toEqualTypeOf<CustomIconOptions>();

    // @ts-expect-error scriptUrl 不接受数字
    const bad: CustomIconOptions = { scriptUrl: 1 };
    void bad;
  });

  it('IconContextProps 与 antd 的字段一一对应', () => {
    expectTypeOf<IconContextProps>().toMatchTypeOf<{
      prefixCls?: string;
      rootClassName?: string;
      csp?: { nonce?: string };
      layer?: string;
      zeroRuntime?: boolean;
    }>();
    expectTypeOf<IconContextProps['csp']>().toEqualTypeOf<{ nonce?: string } | undefined>();
  });

  it('双色调色板的读写类型', () => {
    expectTypeOf(setTwoToneColor).parameter(0).toEqualTypeOf<TwoToneColor>();
    expectTypeOf(getTwoToneColor()).toEqualTypeOf<TwoToneColor>();
    expectTypeOf(getTwoToneColors()).toEqualTypeOf<TwoToneColorPalette>();
    expectTypeOf<TwoToneColorPalette['calculated']>().toEqualTypeOf<boolean>();

    expectTypeOf(setTwoToneColors).parameter(0).toEqualTypeOf<TwoToneColorPaletteSetter>();
    expectTypeOf<TwoToneColorPaletteSetter['primaryColor']>().toEqualTypeOf<string>();
    expectTypeOf<TwoToneColorPaletteSetter['secondaryColor']>().toEqualTypeOf<string | undefined>();

    // 下面三条是负例，只声明不调用：`setTwoToneColor(123)` 真跑起来会在
    // `getSecondaryColor` 里把 123 交给 fast-color 解析而抛 TypeError。
    // @ts-expect-error 数字不是 TwoToneColor
    const badColor = () => setTwoToneColor(123);
    // @ts-expect-error 入参必填
    const missingColor = () => setTwoToneColor();
    // @ts-expect-error setTwoToneColors 需要 primaryColor
    const missingPrimary = () => setTwoToneColors({ secondaryColor: '#fff' });
    void badColor;
    void missingColor;
    void missingPrimary;
  });

  it('getIconStyle 的签名与返回类型', () => {
    expectTypeOf(getIconStyle).parameter(0).toEqualTypeOf<string | undefined>();
    expectTypeOf(getIconStyle()).toEqualTypeOf<string>();
    expectTypeOf(getIconStyle('anticon')).toEqualTypeOf<string>();

    // @ts-expect-error 前缀必须是 string
    const badPrefix = () => getIconStyle(1);
    void badPrefix;
  });

  it('常量都是字面量收窄后的 string', () => {
    expectTypeOf(DEFAULT_TWOTONE_COLOR).toEqualTypeOf<string>();
    expectTypeOf(DEFAULT_ICON_PREFIX_CLS).toEqualTypeOf<string>();
    expectTypeOf(getSecondaryColor('#1677ff')).toEqualTypeOf<string>();

    // @ts-expect-error getSecondaryColor 需要主色
    const noColor = () => getSecondaryColor();
    void noColor;
  });

  it('CustomIconComponentProps 描述的是自定义组件收到的 props', () => {
    expectTypeOf<CustomIconComponentProps['width']>().toEqualTypeOf<string | number>();
    expectTypeOf<CustomIconComponentProps['height']>().toEqualTypeOf<string | number>();
    expectTypeOf<CustomIconComponentProps['fill']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<CustomIconComponentProps['viewBox']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<CustomIconComponentProps['color']>().toEqualTypeOf<string | undefined>();
  });
});
