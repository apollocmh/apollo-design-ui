/**
 * L3 · 类型测试（含**负例**）
 *
 * 规则 T7：只有正例的类型测试是没有价值的。下面每个 `describe` 都同时给出
 * 「应当通过」与「应当报错」两侧。
 *
 * ⚠️ 负例必须包在**永不调用**的闭包里 —— 本文件会被 vitest 真的执行
 *    （`--project types` 开了 typecheck，但仍然跑运行时）。裸写一行错误用法会直接崩。
 *
 * `@ts-expect-error` 在本仓库**只允许**出现在这里（`AGENTS.md` H10）：
 * 它的语义是「此处应当报错」，一旦 TS 不再报错，`@ts-expect-error` 本身会变成错误。
 *
 * ── 与 antd 类型面的五处登记差异（见 `interface.ts` 的文件头）────────────────────
 *   1. `children` 不在 Props 里（Vue 侧是默认插槽，规则 C19）
 *   2. `SpaceRef.nativeElement` 可空（antd 的 `forwardRef` 类型没体现 `null`）
 *   3. `React.CSSProperties` → Vue `CSSProperties`、`React.ReactNode` → `VNodeChild`
 *   4. `Orientation` **不**从 `space` 导出（与 barrel 里 divider 的同名类型冲突，D35）
 *   5. `Compact` / `Addon` 额外有具名导出（Vue 模板里没有 `<Space.Compact>` 写法）
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { CSSProperties, VNodeChild } from 'vue';
import type {
  SpaceAddonProps,
  SpaceAddonRef,
  SpaceAlign,
  SpaceCompactItemContextType,
  SpaceCompactProps,
  SpaceCompactRef,
  SpaceConfig,
  SpaceProps,
  SpaceRef,
  SpaceSemanticAllType,
  SpaceSemanticClassNames,
  SpaceSemanticStyles,
  SpaceSemanticType,
  SpaceSemanticValue,
  SpaceSize,
  SpaceSlot,
} from '../index';
import { Space, SpaceAddon, SpaceCompact } from '../index';

describe('Space · 基础枚举', () => {
  it('`SpaceAlign` 四个取值与 antd 逐字一致', () => {
    expectTypeOf<SpaceAlign>().toEqualTypeOf<'start' | 'end' | 'center' | 'baseline'>();
  });

  it('★ `SpaceSize` = 尺寸串 **或** 数字（antd 的 `SizeType | number`）', () => {
    // ⚠️ `'middle'` 必须在：antd 6 起 `'medium'` 是推荐写法，但 `'middle'` 仍是默认值、
    //    尚未移除（上游注释：middle is deprecated and will be removed in v7）。
    //    `COMPONENT-RULES.md` §4 要求枚举值与 antd 一致 ⇒ 不裁剪。
    expectTypeOf<SpaceSize>().toEqualTypeOf<'small' | 'medium' | 'middle' | 'large' | number>();
  });

  it("`orientation` / `direction` 是 `'horizontal' | 'vertical'`", () => {
    expectTypeOf<SpaceProps['orientation']>().toEqualTypeOf<
      'horizontal' | 'vertical' | undefined
    >();
    expectTypeOf<SpaceProps['direction']>().toEqualTypeOf<'horizontal' | 'vertical' | undefined>();
  });
});

describe('Space · Props', () => {
  it('全部 prop 都是可选的（antd 的 `Partial<SpaceProps>` 语义）', () => {
    const empty: SpaceProps = {};
    expectTypeOf(empty).toMatchTypeOf<SpaceProps>();

    const full: SpaceProps = {
      prefixCls: 'apollo',
      className: 'a',
      rootClassName: 'b',
      style: { color: 'red' },
      size: 'medium',
      direction: 'vertical',
      vertical: true,
      orientation: 'horizontal',
      align: 'baseline',
      split: '-',
      separator: '|',
      wrap: true,
      classNames: { root: 'a' },
      styles: { root: { color: 'red' } },
    };
    expectTypeOf(full).toMatchTypeOf<SpaceProps>();
  });

  it('★ `size` 接受标量**或**二元组（`[horizontal, vertical]`）', () => {
    expectTypeOf<SpaceProps['size']>().toEqualTypeOf<
      SpaceSize | [SpaceSize, SpaceSize] | undefined
    >();

    // 两种形态都真的能写进去（正例）。元组的**长度**是契约的一部分：
    // 三个元素应当被拒绝 —— 见下面的负例。
    const scalar: SpaceProps = { size: 12 };
    const preset: SpaceProps = { size: 'large' };
    const tuple: SpaceProps = { size: [8, 16] };
    const mixed: SpaceProps = { size: ['small', 24] };
    expectTypeOf([scalar, preset, tuple, mixed]).toMatchTypeOf<SpaceProps[]>();
  });

  it('★ `style` 是 Vue 的 `CSSProperties`，不是字符串', () => {
    expectTypeOf<SpaceProps['style']>().toEqualTypeOf<CSSProperties | undefined>();
  });

  it('★ `separator` / `split` 是 `VNodeChild`（可空 —— PITFALLS 46 的类型面）', () => {
    // ⚠️ 这两个 prop 在运行时是 `VNodeChild`，而 `VNodeChild` 的联合里**含 `void`**。
    //    Vue 的 Boolean 强转会把「没传」变成 `false`，所以 `withDefaults` 必须显式给
    //    `undefined`（PITFALLS 46）。类型面上它们仍然接受 `undefined`。
    expectTypeOf<SpaceProps['separator']>().toEqualTypeOf<VNodeChild | undefined>();
    expectTypeOf<SpaceProps['split']>().toEqualTypeOf<VNodeChild | undefined>();
  });

  it('`vertical` / `wrap` 是可选布尔（不是 `boolean`）', () => {
    expectTypeOf<SpaceProps['vertical']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<SpaceProps['wrap']>().toEqualTypeOf<boolean | undefined>();
  });

  it('★ `children` **不在** Props 里（Vue 侧是默认插槽，规则 C19）', () => {
    // 这条是「结构差异」的可执行判据：若有人把 `children` 加回 Props，
    // `SpaceProps` 会多出一个键 —— 用 `keyof` 的集合断言把它钉住。
    expectTypeOf<keyof SpaceProps>().toEqualTypeOf<
      | 'prefixCls'
      | 'className'
      | 'rootClassName'
      | 'style'
      | 'size'
      | 'direction'
      | 'vertical'
      | 'orientation'
      | 'align'
      | 'split'
      | 'separator'
      | 'wrap'
      | 'classNames'
      | 'styles'
    >();
  });
});

describe('Space · 语义化 classNames / styles', () => {
  it('对象式：只接受 root / item / separator 三个槽位', () => {
    const classNames: SpaceSemanticClassNames = { root: 'a', item: 'b', separator: 'c' };
    const styles: SpaceSemanticStyles = { root: { color: 'red' }, item: {}, separator: {} };
    expectTypeOf(classNames.root).toEqualTypeOf<string | undefined>();
    expectTypeOf(styles.root).toEqualTypeOf<CSSProperties | undefined>();
    expectTypeOf<SpaceSemanticType>().toHaveProperty('classNames');
    expectTypeOf<SpaceSemanticType>().toHaveProperty('styles');
  });

  it('★ 函数式：被调用时收到 `{ props }`（裁决 empty-semantic-fn = B）', () => {
    const fromFn: SpaceProps = {
      classNames: (info) => {
        expectTypeOf(info).toHaveProperty('props');
        expectTypeOf(info.props).toMatchTypeOf<SpaceProps>();
        return { root: 'from-fn' };
      },
      styles: (info) => ({ root: { color: info.props.prefixCls } }),
    };

    // 不能直接 `toMatchTypeOf<函数类型>`：`SpaceProps['classNames']` 是
    // `对象 | 函数` 的**联合**，联合不能赋给函数类型（那正是「两种形态都支持」的含义）。
    // 所以先用 `Extract` 把函数那一支取出来，再断言它的参数与返回值。
    type ClassNamesFn = Extract<
      NonNullable<SpaceProps['classNames']>,
      (...args: never[]) => unknown
    >;
    type StylesFn = Extract<NonNullable<SpaceProps['styles']>, (...args: never[]) => unknown>;

    expectTypeOf<Parameters<ClassNamesFn>>().toEqualTypeOf<[{ props: SpaceProps }]>();
    expectTypeOf<ReturnType<ClassNamesFn>>().toEqualTypeOf<SpaceSemanticClassNames>();
    expectTypeOf<Parameters<StylesFn>>().toEqualTypeOf<[{ props: SpaceProps }]>();
    expectTypeOf<ReturnType<StylesFn>>().toEqualTypeOf<SpaceSemanticStyles>();

    expectTypeOf(fromFn.classNames).toMatchTypeOf<SpaceProps['classNames']>();
  });

  it('`SpaceSemanticValue<T>` 是「对象或函数」的联合', () => {
    expectTypeOf<SpaceSemanticValue<SpaceSemanticClassNames>>().toEqualTypeOf<
      SpaceSemanticClassNames | ((info: { props: SpaceProps }) => SpaceSemanticClassNames)
    >();
  });

  it('`SpaceSemanticAllType` 是 antd 的 `GenerateSemantic` 展开形态', () => {
    expectTypeOf<SpaceSemanticAllType>().toHaveProperty('classNamesAndFn');
    expectTypeOf<SpaceSemanticAllType>().toHaveProperty('stylesAndFn');
  });
});

describe('Space.Compact · 跨组件协议的类型面', () => {
  it('★ `SpaceCompactItemContextType` 四个字段与 antd 逐字一致，且**全部可选**', () => {
    // Compact **不**要求子组件必须提供任何字段：下游组件可能在没有 Compact 祖先时
    // 读到 `null`（`useCompactItemContext` 返回 `null`），所以每个字段都可选。
    expectTypeOf<keyof SpaceCompactItemContextType>().toEqualTypeOf<
      'compactSize' | 'compactDirection' | 'isFirstItem' | 'isLastItem'
    >();
    expectTypeOf<SpaceCompactItemContextType['compactSize']>().toEqualTypeOf<
      'small' | 'medium' | 'middle' | 'large' | undefined
    >();
    expectTypeOf<SpaceCompactItemContextType['compactDirection']>().toEqualTypeOf<
      'horizontal' | 'vertical' | undefined
    >();
    expectTypeOf<SpaceCompactItemContextType['isFirstItem']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<SpaceCompactItemContextType['isLastItem']>().toEqualTypeOf<boolean | undefined>();
  });

  it('`SpaceCompactProps` 有 size / orientation / vertical / block / direction', () => {
    const full: SpaceCompactProps = {
      prefixCls: 'apollo',
      size: 'small',
      direction: 'vertical',
      orientation: 'horizontal',
      vertical: true,
      block: true,
      className: 'a',
      rootClassName: 'b',
      style: { color: 'red' },
    };
    expectTypeOf(full).toMatchTypeOf<SpaceCompactProps>();
    expectTypeOf<keyof SpaceCompactProps>().toEqualTypeOf<
      | 'prefixCls'
      | 'size'
      | 'direction'
      | 'orientation'
      | 'vertical'
      | 'block'
      | 'className'
      | 'rootClassName'
      | 'style'
    >();
  });

  it('★ Compact **没有**语义化 classNames / styles（与 antd 一致）', () => {
    // 上游 `SpaceCompactProps` 不含 `classNames` / `styles`。这不是漏实现 ——
    // 语义化 DOM 只定义在 Space 上（Compact 不产 `-item` 包装）。
    type CompactKeys = keyof SpaceCompactProps;
    expectTypeOf<Extract<CompactKeys, 'classNames' | 'styles'>>().toEqualTypeOf<never>();
  });

  it('`SpaceAddonProps` 有 variant / disabled / status', () => {
    const full: SpaceAddonProps = {
      prefixCls: 'apollo',
      className: 'a',
      style: { color: 'red' },
      variant: 'filled',
      disabled: true,
      status: 'error',
    };
    expectTypeOf(full).toMatchTypeOf<SpaceAddonProps>();
    expectTypeOf<SpaceAddonProps['variant']>().toEqualTypeOf<
      'outlined' | 'borderless' | 'filled' | 'underlined' | undefined
    >();
    // ⚠️ `status` 的类型是完整的 `InputStatus`（五个取值，含**空串**），不是
    //    「只允许 error / warning」。antd 的 `Addon.tsx` 用的就是 `InputStatus`：
    //      export type InputStatus = 'warning' | 'error' | '' | 'success' | 'validating';
    //    `getStatusClassNames` 对 `''` 不产生任何类名，但 `''` 是**合法输入**
    //    （「显式传了一个空状态」≠「没传」）。裁剪成两个取值会与 antd 漂移。
    expectTypeOf<SpaceAddonProps['status']>().toEqualTypeOf<
      'warning' | 'error' | '' | 'success' | 'validating' | undefined
    >();
  });
});

describe('Space · ref / config / slot', () => {
  it('三个 ref 的 `nativeElement` 都可空（与 antd 的 PLATFORM 差异）', () => {
    expectTypeOf<SpaceRef['nativeElement']>().toEqualTypeOf<HTMLDivElement | null>();
    expectTypeOf<SpaceCompactRef['nativeElement']>().toEqualTypeOf<HTMLDivElement | null>();
    expectTypeOf<SpaceAddonRef['nativeElement']>().toEqualTypeOf<HTMLDivElement | null>();
  });

  it('★ `SpaceConfig` 是 `ComponentStyleConfig & Pick<SpaceProps, size|classNames|styles>`', () => {
    // antd：`SpaceConfig = ComponentStyleConfig & Pick<SpaceProps, 'size' | 'classNames' | 'styles'>`
    expectTypeOf<SpaceConfig>().toHaveProperty('className');
    expectTypeOf<SpaceConfig>().toHaveProperty('style');
    expectTypeOf<SpaceConfig>().toHaveProperty('classNames');
    expectTypeOf<SpaceConfig>().toHaveProperty('styles');
    expectTypeOf<SpaceConfig>().toHaveProperty('size');
    // ⚠️ **不**含 `align` / `wrap` / `separator` —— 它们不是可全局配置的。
    type ConfigKeys = keyof SpaceConfig;
    expectTypeOf<
      Extract<ConfigKeys, 'align' | 'wrap' | 'separator' | 'split'>
    >().toEqualTypeOf<never>();
  });

  it('默认插槽签名是 `() => VNodeChild`', () => {
    expectTypeOf<SpaceSlot>().toBeFunction();
    expectTypeOf<ReturnType<SpaceSlot>>().toEqualTypeOf<VNodeChild>();
  });

  it('`Space` 是可安装的组件，且静态别名 `Compact` / `Addon` 在类型层可见', () => {
    // ⚠️ 这条是 `Object.assign` 写法的判据：若改成 `Space.Compact = …` 裸赋值，
    //    下面两行会报 TS2339（赋值不会更新 `Space` 的类型）。
    expectTypeOf(Space).toHaveProperty('install');
    expectTypeOf(Space).toHaveProperty('Compact');
    expectTypeOf(Space).toHaveProperty('Addon');
    expectTypeOf(Space.Compact).toEqualTypeOf(SpaceCompact);
    expectTypeOf(Space.Addon).toEqualTypeOf(SpaceAddon);
  });
});

describe('Space · 负例（应当报错）', () => {
  it('下面的用法都应当被类型系统拒绝', () => {
    // 永不调用的闭包 —— 负例只能存在于类型层。
    const negatives = () => {
      // @ts-expect-error `classNames` 只接受 root / item / separator
      const extraClassKey: SpaceProps = { classNames: { body: 'x' } };
      // @ts-expect-error `styles` 只接受 root / item / separator
      const extraStyleKey: SpaceProps = { styles: { body: { color: 'red' } } };
      // @ts-expect-error `align` 不接受 'middle'
      const badAlign: SpaceProps = { align: 'middle' };
      // @ts-expect-error `orientation` 不接受 'diagonal'
      const badOrientation: SpaceProps = { orientation: 'diagonal' };
      // @ts-expect-error `direction` 不接受 'diagonal'
      const badDirection: SpaceProps = { direction: 'diagonal' };
      // @ts-expect-error `size` 不接受 'huge'
      const badSize: SpaceProps = { size: 'huge' };
      // @ts-expect-error 元组**恰好**两个元素，三个不行
      const badTuple3: SpaceProps = { size: [8, 16, 24] };
      // @ts-expect-error 元组**恰好**两个元素，一个也不行
      const badTuple1: SpaceProps = { size: [8] };
      // @ts-expect-error 元组里不能混进布尔
      const badTupleBool: SpaceProps = { size: [true, 8] };
      // @ts-expect-error `vertical` 是布尔，不是字符串
      const badVertical: SpaceProps = { vertical: 'vertical' };
      // @ts-expect-error `wrap` 是布尔，不是字符串
      const badWrap: SpaceProps = { wrap: 'wrap' };
      // @ts-expect-error `prefixCls` 必须是字符串
      const badPrefixCls: SpaceProps = { prefixCls: 123 };
      // @ts-expect-error `style` 是样式对象，不是字符串
      const badStyle: SpaceProps = { style: 'color: red' };
      // @ts-expect-error 函数式 `classNames` 的返回值必须是三个槽位的对象
      const badFnReturn: SpaceProps = { classNames: () => ({ body: 'x' }) };
      // @ts-expect-error `children` 不是 prop（Vue 侧走默认插槽）
      const badChildren: SpaceProps = { children: 'x' };
      // @ts-expect-error Compact 的 `size` 不接受数字（antd 的 `SizeType`，不含 number）
      const badCompactSize: SpaceCompactProps = { size: 12 };
      // @ts-expect-error Compact 没有 `block` 之外的布局开关：`align` 不存在
      const badCompactAlign: SpaceCompactProps = { align: 'center' };
      // @ts-expect-error Addon 的 `variant` 不接受 'ghost'
      const badAddonVariant: SpaceAddonProps = { variant: 'ghost' };
      // @ts-expect-error Addon 的 `status` 不接受 'failed'（antd 的五个取值里没有它）
      const badAddonStatus: SpaceAddonProps = { status: 'failed' };
      // @ts-expect-error `SpaceConfig` 不接受 `align`（不是可全局配置的字段）
      const badConfigAlign: SpaceConfig = { align: 'center' };
      return [
        extraClassKey,
        extraStyleKey,
        badAlign,
        badOrientation,
        badDirection,
        badSize,
        badTuple3,
        badTuple1,
        badTupleBool,
        badVertical,
        badWrap,
        badPrefixCls,
        badStyle,
        badFnReturn,
        badChildren,
        badCompactSize,
        badCompactAlign,
        badAddonVariant,
        badAddonStatus,
        badConfigAlign,
      ];
    };
    expectTypeOf(negatives).toBeFunction();
  });
});
