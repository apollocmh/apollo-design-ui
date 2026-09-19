/**
 * L3 · 类型测试（含**负例**）
 *
 * 规则 T7：只有正例的类型测试没有价值。每个 `describe` 都同时给出
 * 「应当通过」与「应当报错」两侧。
 *
 * ⚠️ 负例必须包在**永不调用**的闭包里 —— 本文件会被 vitest 真的执行
 *    （`--project types` 开了 typecheck，但仍然跑运行时）。裸写一行错误用法会直接崩
 *    （PITFALLS 22 / 74）。
 *
 * ── 本组件类型面的两处**结构性**登记差异 ─────────────────────────────────────
 *   D25：56 个组件配置 prop 退化为「4 个精确 prop + `components` 弱类型 map」
 *   D29：完全不声明 `tooltip` / `popover` / `popconfirm`（`UniqueProvider` 未实现）
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { ComputedRef } from 'vue';
import type {
  ComponentConfigLike,
  ConfigProviderProps,
  ConfigProviderThemeConfig,
  FormConfig,
  GlobalConfigProps,
  RenderEmptyComponentName,
  RenderEmptyHandler,
  SizeType,
  UseConfigResult,
  Variant,
  WaveConfig,
} from '../index';
import type { ConfigContextValue } from '../context';
import type { DividerConfig } from '../../divider/interface';
import type { EmptyConfig } from '../../empty/interface';
import type { SpinConfig } from '../../spin/interface';

describe('ConfigProvider · 枚举', () => {
  it('★ `SizeType` 含 `medium` 与 `middle` 两个别名（antd v6 未移除 `middle`）', () => {
    expectTypeOf<SizeType>().toEqualTypeOf<'small' | 'medium' | 'middle' | 'large'>();
  });

  it('`Variant` 与 antd 的 `Variants` 逐字一致', () => {
    expectTypeOf<Variant>().toEqualTypeOf<'outlined' | 'borderless' | 'filled' | 'underlined'>();
  });

  it('`RenderEmptyComponentName` 含 `Table.filter`（上游让它返回 null）', () => {
    // ⚠️ 不能用 `toHaveProperty('Table.filter')`：本联合是字符串字面量联合，
    //    expect-type 会把键参数收窄成 `string` 的方法名，`'Table.filter'` 直接被拒。
    //    改用「某个字面量可赋给该联合」+「该联合可赋给自身」两条断言夹逼。
    expectTypeOf<'Table.filter'>().toMatchTypeOf<RenderEmptyComponentName>();
    expectTypeOf<'Mentions'>().toMatchTypeOf<RenderEmptyComponentName>();
    const names: RenderEmptyComponentName[] = [
      'Table',
      'Table.filter',
      'List',
      'Select',
      'TreeSelect',
      'Cascader',
      'Transfer',
      'Mentions',
    ];
    expectTypeOf(names).toEqualTypeOf<RenderEmptyComponentName[]>();
  });

  it('`WaveConfig` 不含 React 专用的 `showEffect`', () => {
    expectTypeOf<WaveConfig>().toHaveProperty('disabled');
    expectTypeOf<WaveConfig>().toHaveProperty('triggerType');
    expectTypeOf<WaveConfig>().not.toHaveProperty('showEffect');
  });
});

describe('ConfigProvider · Props', () => {
  it('全部 prop 都是可选的', () => {
    const empty: ConfigProviderProps = {};
    expectTypeOf(empty).toMatchTypeOf<ConfigProviderProps>();
  });

  it('★ 已落地组件的 prop 是**精确类型**（不是 `unknown`）', () => {
    expectTypeOf<ConfigProviderProps['divider']>().toEqualTypeOf<DividerConfig | undefined>();
    expectTypeOf<ConfigProviderProps['empty']>().toEqualTypeOf<EmptyConfig | undefined>();
    expectTypeOf<ConfigProviderProps['spin']>().toEqualTypeOf<SpinConfig | undefined>();
  });

  it('★ (B) 逃生口：`components` 的键开放、值至少含 className / style', () => {
    expectTypeOf<ConfigProviderProps['components']>().toEqualTypeOf<
      Record<string, ComponentConfigLike> | undefined
    >();
    const value: ComponentConfigLike = { className: 'a', style: { color: 'red' }, anything: 1 };
    expectTypeOf(value).toMatchTypeOf<ComponentConfigLike>();
  });

  it('`form` 只落 `validateMessages`（其余字段等 Form 落地）', () => {
    expectTypeOf<FormConfig>().toHaveProperty('validateMessages');
    expectTypeOf<FormConfig>().toHaveProperty('className');
  });

  it('`theme` 是本组件的形态（theme 包的 ThemeConfig + inherit）', () => {
    expectTypeOf<ConfigProviderProps['theme']>().toEqualTypeOf<
      ConfigProviderThemeConfig | undefined
    >();
    expectTypeOf<ConfigProviderThemeConfig>().toHaveProperty('inherit');
    expectTypeOf<ConfigProviderThemeConfig>().toHaveProperty('token');
    expectTypeOf<ConfigProviderThemeConfig>().toHaveProperty('algorithm');
  });

  it('★ `tooltip` / `popover` / `popconfirm` **不在** Props 里（D29）', () => {
    expectTypeOf<ConfigProviderProps>().not.toHaveProperty('tooltip');
    expectTypeOf<ConfigProviderProps>().not.toHaveProperty('popover');
    expectTypeOf<ConfigProviderProps>().not.toHaveProperty('popconfirm');
  });

  it('★ `children` 不在 Props 里（Vue 侧是默认插槽，规则 C19）', () => {
    expectTypeOf<ConfigProviderProps>().not.toHaveProperty('children');
  });

  it('`renderEmpty` 是 `RenderEmptyHandler`', () => {
    expectTypeOf<ConfigProviderProps['renderEmpty']>().toEqualTypeOf<
      RenderEmptyHandler | undefined
    >();
  });

  it('★ `componentDisabled` 是 `boolean | undefined`：false 与未传必须可区分', () => {
    expectTypeOf<ConfigProviderProps['componentDisabled']>().toEqualTypeOf<boolean | undefined>();
  });
});

describe('ConfigProvider · context 与 composable', () => {
  it('`ConfigContextValue` 的键与 antd 的 ConfigConsumerProps 对齐', () => {
    expectTypeOf<ConfigContextValue>().toHaveProperty('getPrefixCls');
    expectTypeOf<ConfigContextValue>().toHaveProperty('iconPrefixCls');
    expectTypeOf<ConfigContextValue>().toHaveProperty('direction');
    expectTypeOf<ConfigContextValue>().toHaveProperty('components');
    expectTypeOf<ConfigContextValue>().toHaveProperty('theme');
    expectTypeOf<ConfigContextValue>().toHaveProperty('renderEmpty');
    expectTypeOf<ConfigContextValue>().toHaveProperty('getPopupContainer');
    expectTypeOf<ConfigContextValue>().toHaveProperty('getTargetContainer');
    expectTypeOf<ConfigContextValue>().toHaveProperty('csp');
    expectTypeOf<ConfigContextValue>().toHaveProperty('variant');
    expectTypeOf<ConfigContextValue>().toHaveProperty('virtual');
    expectTypeOf<ConfigContextValue>().toHaveProperty('popupMatchSelectWidth');
    expectTypeOf<ConfigContextValue>().toHaveProperty('popupOverflow');
    expectTypeOf<ConfigContextValue>().toHaveProperty('wave');
  });

  it('★ `useConfig()` 返回的是 ComputedRef（D27：裸值在 Vue 里等于定死）', () => {
    expectTypeOf<UseConfigResult['componentDisabled']>().toEqualTypeOf<ComputedRef<boolean>>();
    expectTypeOf<UseConfigResult['componentSize']>().toEqualTypeOf<
      ComputedRef<SizeType | undefined>
    >();
  });

  it('`GlobalConfigProps` 不含 `holderRender`（D30）', () => {
    expectTypeOf<GlobalConfigProps>().not.toHaveProperty('holderRender');
  });
});

describe('ConfigProvider · 负例（应当报错）', () => {
  it('下面的用法都应当被类型系统拒绝', () => {
    // 永不调用的闭包 —— 负例只能存在于类型层。
    const negatives = () => {
      // @ts-expect-error `direction` 不接受 'ttb'
      const badDirection: ConfigProviderProps = { direction: 'ttb' };
      // @ts-expect-error `componentSize` 不接受 'huge'
      const badSize: ConfigProviderProps = { componentSize: 'huge' };
      // @ts-expect-error `variant` 不接受未登记的取值
      const badVariant: ConfigProviderProps = { variant: 'ghost' };
      // @ts-expect-error `componentDisabled` 不接受字符串
      const badDisabled: ConfigProviderProps = { componentDisabled: 'yes' };
      // @ts-expect-error `virtual` 是 boolean
      const badVirtual: ConfigProviderProps = { virtual: 1 };
      // @ts-expect-error `divider` 是精确类型：`classNames` 不接受 number
      const badDividerKey: ConfigProviderProps = { divider: { classNames: 1 } };
      // @ts-expect-error `empty` 是精确类型：`classNames` 不接受 number
      const badEmptyImage: ConfigProviderProps = { empty: { classNames: 1 } };
      // @ts-expect-error `popupOverflow` 不接受 'auto'
      const badOverflow: ConfigProviderProps = { popupOverflow: 'auto' };
      // @ts-expect-error `prefixCls` 必须是字符串
      const badPrefixCls: ConfigProviderProps = { prefixCls: 1 };
      // @ts-expect-error `renderEmpty` 必须是函数
      const badRenderEmpty: ConfigProviderProps = { renderEmpty: 'empty' };
      // @ts-expect-error `theme.components` 的值必须是 token 记录
      const badThemeComponents: ConfigProviderProps = { theme: { components: { Button: 1 } } };
      // @ts-expect-error `tooltip.unique` 不存在（D29：不声明就是为了让它在类型层报错）
      const badTooltip: ConfigProviderProps = { tooltip: { unique: true } };
      // @ts-expect-error `children` 不是 prop（Vue 侧是默认插槽）
      const badChildren: ConfigProviderProps = { children: 'x' };
      // @ts-expect-error `button` 尚未落地 ⇒ 不是精确 prop（只能走 components 逃生口）
      const badButton: ConfigProviderProps = { button: { autoInsertSpace: false } };
      return [
        badDirection,
        badSize,
        badVariant,
        badDisabled,
        badVirtual,
        badDividerKey,
        badEmptyImage,
        badOverflow,
        badPrefixCls,
        badRenderEmpty,
        badThemeComponents,
        badTooltip,
        badChildren,
        badButton,
      ];
    };
    expectTypeOf(negatives).toBeFunction();
  });
});
