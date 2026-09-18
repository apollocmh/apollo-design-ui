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
 * ── 与 antd 类型面的三处登记差异（见 `interface.ts` 的文件头）──────────────────
 *   1. `children` 不在 Props 里（Vue 侧是默认插槽，规则 C19）
 *   2. `size` 的类型名是 `DividerSize`（antd 叫 `SizeType`，避免与 config-provider 重名）
 *   3. `React.CSSProperties` → Vue `CSSProperties`、`React.ReactNode` → `VNodeChild`
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { CSSProperties } from 'vue';
import type {
  DividerComponentToken,
  DividerConfig,
  DividerProps,
  DividerRef,
  DividerSemanticAllType,
  DividerSemanticClassNames,
  DividerSemanticStyles,
  DividerSemanticType,
  DividerSemanticValue,
  DividerSize,
  DividerSlot,
  DividerVariant,
  Orientation,
  TitlePlacement,
} from '../index';
import { Divider } from '../index';

describe('Divider · 基础枚举', () => {
  it('三个枚举的取值集合与 antd 逐字一致', () => {
    expectTypeOf<Orientation>().toEqualTypeOf<'horizontal' | 'vertical'>();
    expectTypeOf<TitlePlacement>().toEqualTypeOf<'left' | 'right' | 'center' | 'start' | 'end'>();
    expectTypeOf<DividerVariant>().toEqualTypeOf<'dashed' | 'dotted' | 'solid'>();
  });

  it('★ `DividerSize` 含已废弃的 `middle`（存量代码在传它，不能删）', () => {
    expectTypeOf<DividerSize>().toEqualTypeOf<'small' | 'medium' | 'middle' | 'large'>();
  });
});

describe('Divider · Props', () => {
  it('全部 prop 都是可选的（antd 的 `Partial<DividerProps>` 语义）', () => {
    const empty: DividerProps = {};
    expectTypeOf(empty).toMatchTypeOf<DividerProps>();

    const full: DividerProps = {
      prefixCls: 'apollo',
      type: 'vertical',
      orientation: 'horizontal',
      vertical: true,
      titlePlacement: 'start',
      orientationMargin: 20,
      className: 'a',
      rootClassName: 'b',
      dashed: true,
      variant: 'dotted',
      style: { color: 'red' },
      size: 'medium',
      plain: true,
      classNames: { root: 'a' },
      styles: { root: { color: 'red' } },
    };
    expectTypeOf(full).toMatchTypeOf<DividerProps>();
  });

  it('`orientationMargin` 接受 string 或 number（antd 的 `string | number`）', () => {
    expectTypeOf<DividerProps['orientationMargin']>().toEqualTypeOf<string | number | undefined>();
  });

  it('`style` 是 Vue 的 `CSSProperties`，不是字符串', () => {
    expectTypeOf<DividerProps['style']>().toEqualTypeOf<CSSProperties | undefined>();
  });

  it('`variant` 有默认值但类型上仍是可选（默认值在运行时生效）', () => {
    expectTypeOf<DividerProps['variant']>().toEqualTypeOf<DividerVariant | undefined>();
  });
});

describe('Divider · 语义化 classNames / styles', () => {
  it('对象式：只接受 root / rail / content 三个槽位', () => {
    const classNames: DividerSemanticClassNames = { root: 'a', rail: 'b', content: 'c' };
    const styles: DividerSemanticStyles = { root: { color: 'red' }, rail: {}, content: {} };
    expectTypeOf(classNames.root).toEqualTypeOf<string | undefined>();
    expectTypeOf(styles.root).toEqualTypeOf<CSSProperties | undefined>();
    expectTypeOf<DividerSemanticType>().toHaveProperty('classNames');
  });

  it('★ 函数式：被调用时收到 `{ props }`（裁决 empty-semantic-fn = B）', () => {
    const fromFn: DividerProps = {
      classNames: (info) => {
        expectTypeOf(info).toHaveProperty('props');
        expectTypeOf(info.props).toMatchTypeOf<DividerProps>();
        return { root: 'from-fn' };
      },
      styles: (info) => ({ root: { color: info.props.prefixCls } }),
    };

    // 不能直接 `toMatchTypeOf<函数类型>`：`DividerProps['classNames']` 是
    // `对象 | 函数` 的**联合**，联合不能赋给函数类型（那正是「两种形态都支持」的含义）。
    // 所以先用 `Extract` 把函数那一支取出来，再断言它的参数与返回值。
    type ClassNamesFn = Extract<
      NonNullable<DividerProps['classNames']>,
      (...args: never[]) => unknown
    >;
    type StylesFn = Extract<NonNullable<DividerProps['styles']>, (...args: never[]) => unknown>;

    expectTypeOf<Parameters<ClassNamesFn>>().toEqualTypeOf<[{ props: DividerProps }]>();
    expectTypeOf<ReturnType<ClassNamesFn>>().toEqualTypeOf<DividerSemanticClassNames>();
    expectTypeOf<Parameters<StylesFn>>().toEqualTypeOf<[{ props: DividerProps }]>();
    expectTypeOf<ReturnType<StylesFn>>().toEqualTypeOf<DividerSemanticStyles>();

    expectTypeOf(fromFn.classNames).toMatchTypeOf<DividerProps['classNames']>();
  });

  it('`DividerSemanticValue<T>` 是「对象或函数」的联合', () => {
    expectTypeOf<DividerSemanticValue<DividerSemanticClassNames>>().toEqualTypeOf<
      DividerSemanticClassNames | ((info: { props: DividerProps }) => DividerSemanticClassNames)
    >();
  });

  it('`DividerSemanticAllType` 是 antd 的 `GenerateSemantic` 展开形态', () => {
    expectTypeOf<DividerSemanticAllType>().toHaveProperty('classNamesAndFn');
    expectTypeOf<DividerSemanticAllType>().toHaveProperty('stylesAndFn');
  });
});

describe('Divider · ref / config / slot', () => {
  it('nativeElement 可空（与 antd 的 `HTMLDivElement` 有一处登记差异）', () => {
    expectTypeOf<DividerRef['nativeElement']>().toEqualTypeOf<HTMLDivElement | null>();
  });

  it('`DividerConfig` 是 `ComponentStyleConfig & Pick<DividerProps, classNames|styles>`', () => {
    expectTypeOf<DividerConfig>().toHaveProperty('className');
    expectTypeOf<DividerConfig>().toHaveProperty('style');
    expectTypeOf<DividerConfig>().toHaveProperty('classNames');
    expectTypeOf<DividerConfig>().toHaveProperty('styles');
  });

  it('默认插槽签名是 `() => VNodeChild`', () => {
    expectTypeOf<DividerSlot>().toBeFunction();
  });

  it('组件上的 Component Token 类型可从包入口取到', () => {
    expectTypeOf<DividerComponentToken>().toHaveProperty('textPaddingInline');
    expectTypeOf<DividerComponentToken>().toHaveProperty('orientationMargin');
    expectTypeOf<DividerComponentToken>().toHaveProperty('verticalMarginInline');
  });

  it('`Divider` 是可安装的组件（`withInstall` 的产物）', () => {
    expectTypeOf(Divider).toHaveProperty('install');
  });
});

describe('Divider · 负例（应当报错）', () => {
  it('下面的用法都应当被类型系统拒绝', () => {
    // 永不调用的闭包 —— 负例只能存在于类型层。
    const negatives = () => {
      // @ts-expect-error `classNames` 只接受 root / rail / content
      const extraClassKey: DividerProps = { classNames: { body: 'x' } };
      // @ts-expect-error `styles` 只接受 root / rail / content
      const extraStyleKey: DividerProps = { styles: { body: { color: 'red' } } };
      // @ts-expect-error `orientation` 只有 horizontal / vertical
      const badOrientation: DividerProps = { orientation: 'center' };
      // @ts-expect-error `titlePlacement` 不接受 'top'
      const badPlacement: DividerProps = { titlePlacement: 'top' };
      // @ts-expect-error `variant` 不接受 'solid-dashed'
      const badVariant: DividerProps = { variant: 'double' };
      // @ts-expect-error `size` 不接受 'huge'
      const badSize: DividerProps = { size: 'huge' };
      // @ts-expect-error `orientationMargin` 不接受 boolean
      const badMargin: DividerProps = { orientationMargin: true };
      // @ts-expect-error 函数式 `classNames` 的返回值必须是三个槽位的对象
      const badFnReturn: DividerProps = { classNames: () => ({ body: 'x' }) };
      // @ts-expect-error `prefixCls` 必须是字符串
      const badPrefixCls: DividerProps = { prefixCls: 123 };
      // @ts-expect-error `style` 是样式对象，不是字符串
      const badStyle: DividerProps = { style: 'color: red' };
      return [
        extraClassKey,
        extraStyleKey,
        badOrientation,
        badPlacement,
        badVariant,
        badSize,
        badMargin,
        badFnReturn,
        badPrefixCls,
        badStyle,
      ];
    };
    expectTypeOf(negatives).toBeFunction();
  });
});
