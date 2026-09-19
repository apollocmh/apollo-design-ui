/**
 * L3 · 类型测试（含**负例**）
 *
 * 规则 T7：只有正例的类型测试没有价值。每个 `describe` 都同时给出
 * 「应当通过」与「应当报错」两侧。
 *
 * ⚠️ 负例必须包在**永不调用**的闭包里 —— 本文件会被 vitest 真的执行
 *    （`--project types` 开了 typecheck，但仍然跑运行时）。裸写一行错误用法会直接崩。
 *
 * ── 与 antd 类型面的四处登记差异（见 `interface.ts` 文件头）─────────────────────
 *   1. `children` 不在 Props 里（Vue 侧是默认插槽，规则 C19）
 *   2. `size` 的类型名是 `SpinSize`（antd 叫 `SizeType`，避免与 config-provider 重名）
 *   3. `React.ReactNode` → `VNodeChild`、`React.CSSProperties` → Vue `CSSProperties`
 *   4. `SpinIndicator` 是 `VNode`（antd 是 `React.ReactElement<HTMLElement>`）
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { CSSProperties, VNode, VNodeChild } from 'vue';
import { h } from 'vue';
import type {
  SpinComponentToken,
  SpinConfig,
  SpinIndicator,
  SpinPercent,
  SpinProps,
  SpinRef,
  SpinSemanticAllType,
  SpinSemanticClassNames,
  SpinSemanticStyles,
  SpinSemanticType,
  SpinSemanticValue,
  SpinSize,
  SpinSlot,
} from '../index';
import { Spin, type setDefaultIndicator } from '../index';

describe('Spin · 基础枚举', () => {
  it('★ `SpinSize` 含两个已废弃取值 `middle` / `default`（存量代码在传，不能删）', () => {
    expectTypeOf<SpinSize>().toEqualTypeOf<'small' | 'medium' | 'middle' | 'large' | 'default'>();
  });

  it('`SpinPercent` 是 number 或字面量 `auto`', () => {
    expectTypeOf<SpinPercent>().toEqualTypeOf<number | 'auto'>();
  });

  it('★ `SpinIndicator` 是 `VNode`（不是 `VNodeChild`）—— 只有真元素才会被克隆', () => {
    expectTypeOf<SpinIndicator>().toEqualTypeOf<VNode>();
    // 字符串不是可克隆的元素，类型层就要拒绝
    expectTypeOf<string>().not.toMatchTypeOf<SpinIndicator>();
  });
});

describe('Spin · Props', () => {
  it('全部 prop 都是可选的', () => {
    const empty: SpinProps = {};
    expectTypeOf(empty).toMatchTypeOf<SpinProps>();

    const full: SpinProps = {
      prefixCls: 'apollo',
      className: 'a',
      rootClassName: 'b',
      spinning: true,
      style: { color: 'red' },
      size: 'medium',
      tip: 'tip',
      description: 'desc',
      delay: 500,
      wrapperClassName: 'w',
      indicator: h('span'),
      percent: 'auto',
      fullscreen: true,
      classNames: { root: 'r' },
      styles: { root: { color: 'red' } },
    };
    expectTypeOf(full).toMatchTypeOf<SpinProps>();
  });

  it('`delay` 是毫秒数（number），不是字符串', () => {
    expectTypeOf<SpinProps['delay']>().toEqualTypeOf<number | undefined>();
  });

  it('`style` 是 Vue 的 `CSSProperties`，不是字符串', () => {
    expectTypeOf<SpinProps['style']>().toEqualTypeOf<CSSProperties | undefined>();
  });

  it('`spinning` / `fullscreen` 是 boolean（都有运行时默认值）', () => {
    expectTypeOf<SpinProps['spinning']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<SpinProps['fullscreen']>().toEqualTypeOf<boolean | undefined>();
  });

  it('`tip` / `description` 是 `VNodeChild`（不是 `string`）—— 可以传 VNode', () => {
    const withVNode: SpinProps = { description: h('em', 'Loading') };
    expectTypeOf(withVNode).toMatchTypeOf<SpinProps>();
  });

  it('★ `children` **不在** Props 里（规则 C19：Vue 侧是默认插槽）', () => {
    expectTypeOf<SpinProps>().not.toHaveProperty('children');
  });
});

describe('Spin · 语义化 classNames / styles', () => {
  it('对象式：六个槽位 + 两个已废弃的 tip / mask', () => {
    const classNames: SpinSemanticClassNames = {
      root: 'a',
      section: 'b',
      indicator: 'c',
      description: 'd',
      container: 'e',
      tip: 'f',
      mask: 'g',
    };
    const styles: SpinSemanticStyles = {
      root: { color: 'red' },
      section: {},
      indicator: {},
      description: {},
      container: {},
      tip: {},
      mask: {},
    };
    expectTypeOf(classNames.root).toEqualTypeOf<string | undefined>();
    expectTypeOf(styles.root).toEqualTypeOf<CSSProperties | undefined>();
    expectTypeOf<SpinSemanticType>().toHaveProperty('classNames');
  });

  it('★ 函数式：被调用时收到 `{ props }`（裁决 empty-semantic-fn = B）', () => {
    const fromFn: SpinProps = {
      classNames: (info) => {
        expectTypeOf(info).toHaveProperty('props');
        expectTypeOf(info.props).toMatchTypeOf<SpinProps>();
        return { root: 'from-fn' };
      },
      styles: (info) => ({ indicator: { color: info.props.prefixCls } }),
    };

    type ClassNamesFn = Extract<
      NonNullable<SpinProps['classNames']>,
      (...args: never[]) => unknown
    >;
    type StylesFn = Extract<NonNullable<SpinProps['styles']>, (...args: never[]) => unknown>;

    expectTypeOf<Parameters<ClassNamesFn>>().toEqualTypeOf<[{ props: SpinProps }]>();
    expectTypeOf<ReturnType<ClassNamesFn>>().toEqualTypeOf<SpinSemanticClassNames>();
    expectTypeOf<Parameters<StylesFn>>().toEqualTypeOf<[{ props: SpinProps }]>();
    expectTypeOf<ReturnType<StylesFn>>().toEqualTypeOf<SpinSemanticStyles>();

    expectTypeOf(fromFn.classNames).toMatchTypeOf<SpinProps['classNames']>();
  });

  it('`SpinSemanticValue<T>` 是「对象或函数」的联合', () => {
    expectTypeOf<SpinSemanticValue<SpinSemanticClassNames>>().toEqualTypeOf<
      SpinSemanticClassNames | ((info: { props: SpinProps }) => SpinSemanticClassNames)
    >();
  });

  it('`SpinSemanticAllType` 是 antd 的 `GenerateSemantic` 展开形态', () => {
    expectTypeOf<SpinSemanticAllType>().toHaveProperty('classNamesAndFn');
    expectTypeOf<SpinSemanticAllType>().toHaveProperty('stylesAndFn');
  });
});

describe('Spin · ref / config / slot / 静态方法', () => {
  it('nativeElement 可空（与 antd 的 `HTMLDivElement` 有一处登记差异）', () => {
    expectTypeOf<SpinRef['nativeElement']>().toEqualTypeOf<HTMLDivElement | null>();
  });

  it('★ `SpinConfig` 含 `indicator`（与 `DividerConfig` 不同：Spin 有全局可配项）', () => {
    expectTypeOf<SpinConfig>().toHaveProperty('className');
    expectTypeOf<SpinConfig>().toHaveProperty('style');
    expectTypeOf<SpinConfig>().toHaveProperty('classNames');
    expectTypeOf<SpinConfig>().toHaveProperty('styles');
    expectTypeOf<SpinConfig>().toHaveProperty('indicator');
  });

  it('默认插槽签名是 `() => VNodeChild`', () => {
    expectTypeOf<SpinSlot>().toBeFunction();
  });

  it('`Spin` 上挂着静态方法 `setDefaultIndicator`（对应 antd 的 `SpinType`）', () => {
    // ⚠️ 这里只能断言「有这个属性」，不能断言它的签名：
    //    `Spin.vue` 在纯 `tsc` 下解析不到（`Cannot find module './Spin.vue'`，
    //    与 divider / empty / form 同样），`Object.assign(SpinComponent, …)` 退化成 `any`，
    //    于是 `expectTypeOf(Spin.setDefaultIndicator)` 拿到的是 `ExpectFunction<any>`
    //    —— 再点 `.toBeFunction()` 会报「expression is not callable」。
    //    签名的断言走下面的**具名导出**（它不经过 .vue，类型是实的）。
    expectTypeOf(Spin).toHaveProperty('install');
    expectTypeOf(Spin).toHaveProperty('setDefaultIndicator');
  });

  it('★ `setDefaultIndicator` 的签名是 `(indicator: VNodeChild) => void`', () => {
    // antd：`Spin.setDefaultIndicator(indicator: React.ReactNode)` ⇒ 我们的 `VNodeChild`。
    // 用**显式类型实参**而不是 `expectTypeOf(fn).parameters`：后者的 `.returns` /
    // `.parameters` 在不同 expect-type 版本间签名不一致（实测报
    // 「Expected 1 arguments, but got 0」），而整条函数类型的相等断言不依赖它。
    expectTypeOf<typeof setDefaultIndicator>().toEqualTypeOf<(indicator: VNodeChild) => void>();
  });

  it('Component Token 类型可从包入口取到（R7：四个键与 antd 同名）', () => {
    expectTypeOf<SpinComponentToken>().toHaveProperty('contentHeight');
    expectTypeOf<SpinComponentToken>().toHaveProperty('dotSize');
    expectTypeOf<SpinComponentToken>().toHaveProperty('dotSizeSM');
    expectTypeOf<SpinComponentToken>().toHaveProperty('dotSizeLG');
  });
});

describe('Spin · 负例（应当报错）', () => {
  it('下面的用法都应当被类型系统拒绝', () => {
    // 永不调用的闭包 —— 负例只能存在于类型层。
    const negatives = () => {
      // @ts-expect-error `classNames` 不接受未登记的槽位
      const extraClassKey: SpinProps = { classNames: { body: 'x' } };
      // @ts-expect-error `styles` 不接受未登记的槽位
      const extraStyleKey: SpinProps = { styles: { body: { color: 'red' } } };
      // @ts-expect-error `size` 不接受 'huge'
      const badSize: SpinProps = { size: 'huge' };
      // @ts-expect-error `percent` 不接受 'auto-x'
      const badPercent: SpinProps = { percent: 'auto-x' };
      // @ts-expect-error `percent` 不接受 boolean
      const badPercent2: SpinProps = { percent: true };
      // @ts-expect-error `delay` 是毫秒数，不接受字符串
      const badDelay: SpinProps = { delay: '500' };
      // @ts-expect-error `spinning` 不接受字符串
      const badSpinning: SpinProps = { spinning: 'yes' };
      // @ts-expect-error `indicator` 必须是 VNode，不能是字符串
      const badIndicator: SpinProps = { indicator: 'loading' };
      // @ts-expect-error 函数式 `classNames` 的返回值必须是槽位对象
      const badFnReturn: SpinProps = { classNames: () => ({ body: 'x' }) };
      // @ts-expect-error `prefixCls` 必须是字符串
      const badPrefixCls: SpinProps = { prefixCls: 123 };
      // @ts-expect-error `style` 是样式对象，不是字符串
      const badStyle: SpinProps = { style: 'color: red' };
      // @ts-expect-error `children` 不是 prop（Vue 侧是默认插槽）
      const badChildren: SpinProps = { children: 'x' };
      return [
        extraClassKey,
        extraStyleKey,
        badSize,
        badPercent,
        badPercent2,
        badDelay,
        badSpinning,
        badIndicator,
        badFnReturn,
        badPrefixCls,
        badStyle,
        badChildren,
      ];
    };
    expectTypeOf(negatives).toBeFunction();
  });
});
