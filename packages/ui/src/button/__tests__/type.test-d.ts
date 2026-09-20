/**
 * L3 · 类型测试（含**负例**）
 *
 * 规则 T7：只有正例的类型测试是没有价值的。下面每个 `describe` 都同时给出
 * 「应当通过」与「应当报错」两侧。
 *
 * ⚠️ 负例必须包在**永不调用**的闭包里 —— 本文件会被 vitest 真的执行
 *    （`--project types` 开了 typecheck，但仍然跑运行时）。裸写一行错误用法会直接崩。
 *
 * `@ts-expect-error` 在本仓库**只允许**出现在这里（`AGENTS.md` H10）。
 *
 * ── 与 antd 类型面的登记差异（见 `interface.ts` 的文件头）──────────────────────
 *   1. `children` 不在 Props 里（Vue 侧是默认插槽，规则 C19）
 *   2. `SizeType` 改名为 `ButtonSize`（避免与 config-provider 的 `SizeType` 重名）
 *   3. `React.CSSProperties` → Vue `CSSProperties`、`React.ReactNode` → `VNodeChild`
 *      —— 例外：`icon` / `loading.icon` 另接 `Component`（Vue 没有「React 元素」
 *      形态，对应物是组件本身，与 `EmptyImage` 同一裁决）。见下面的
 *      「icon 的取值」describe。
 *   4. ⚠️ **语义化不支持函数式变体**（`empty-semantic-fn` = B）⇒ 下面有一条
 *      「传函数应当报错」的负例，把它钉成类型层的契约。
 */

import { describe, expectTypeOf, it } from 'vitest';
import { type CSSProperties, defineComponent, h, type VNodeChild } from 'vue';
import type {
  ButtonColorType,
  ButtonConfig,
  ButtonHTMLType,
  ButtonIcon,
  ButtonIconPlacement,
  ButtonLoading,
  ButtonProps,
  ButtonRef,
  ButtonSemanticClassNames,
  ButtonSemanticStyles,
  ButtonSemanticType,
  ButtonShape,
  ButtonSize,
  ButtonSlot,
  ButtonType,
  ButtonVariantType,
} from '../index';

describe('Button · 基础枚举', () => {
  it('★ 五个枚举的取值集合与 antd 的 `buttonHelpers.d.ts` 逐字一致', () => {
    expectTypeOf<ButtonType>().toEqualTypeOf<'default' | 'primary' | 'dashed' | 'link' | 'text'>();
    expectTypeOf<ButtonShape>().toEqualTypeOf<'default' | 'circle' | 'round' | 'square'>();
    expectTypeOf<ButtonHTMLType>().toEqualTypeOf<'submit' | 'button' | 'reset'>();
    expectTypeOf<ButtonVariantType>().toEqualTypeOf<
      'outlined' | 'dashed' | 'solid' | 'filled' | 'text' | 'link'
    >();
    expectTypeOf<ButtonSize>().toEqualTypeOf<'small' | 'middle' | 'large'>();
  });

  it('★ `ButtonColorType` 是 3 个语义色 + 13 个预设色板色（16 个）', () => {
    expectTypeOf<ButtonColorType>().toEqualTypeOf<
      | 'default'
      | 'primary'
      | 'danger'
      | 'blue'
      | 'purple'
      | 'cyan'
      | 'green'
      | 'magenta'
      | 'pink'
      | 'red'
      | 'orange'
      | 'yellow'
      | 'volcano'
      | 'geekblue'
      | 'lime'
      | 'gold'
    >();
  });

  it('`ButtonIconPlacement` 只有 start / end', () => {
    expectTypeOf<ButtonIconPlacement>().toEqualTypeOf<'start' | 'end'>();
  });
});

describe('Button · Props', () => {
  it('全部 prop 都是可选的', () => {
    const empty: ButtonProps = {};
    expectTypeOf(empty).toMatchTypeOf<ButtonProps>();

    const full: ButtonProps = {
      type: 'primary',
      color: 'blue',
      variant: 'solid',
      icon: 'x',
      iconPosition: 'end',
      iconPlacement: 'start',
      shape: 'round',
      size: 'large',
      disabled: true,
      loading: { delay: 100, icon: 'x' },
      prefixCls: 'apollo',
      className: 'a',
      rootClassName: 'b',
      ghost: true,
      danger: true,
      block: true,
      href: '#',
      htmlType: 'submit',
      autoInsertSpace: false,
      classNames: { root: 'a' },
      styles: { root: { color: 'red' } },
      style: { color: 'red' },
    };
    expectTypeOf(full).toMatchTypeOf<ButtonProps>();
  });

  it('★ `loading` 是「布尔 | 对象」两种形态（不是只有布尔）', () => {
    expectTypeOf<ButtonLoading>().toEqualTypeOf<boolean | { delay?: number; icon?: ButtonIcon }>();
    expectTypeOf<ButtonProps['loading']>().toEqualTypeOf<ButtonLoading | undefined>();
  });

  it('`icon` 是 `ButtonIcon`（v6 起是节点，不是 v4 的字符串名；且额外接受组件）', () => {
    // `ButtonIcon = VNodeChild | Component` —— 后半段是**平台差异**：
    // antd 的 `React.ReactNode` 容得下「React 元素」（`<SearchOutlined />`），
    // Vue 没有这一形态，对应物是组件对象。与 `EmptyImage` 同一裁决。
    expectTypeOf<ButtonProps['icon']>().toEqualTypeOf<ButtonIcon | undefined>();
  });

  it('`style` / `styles.root` 是 Vue 的 `CSSProperties`', () => {
    expectTypeOf<ButtonProps['style']>().toEqualTypeOf<CSSProperties | undefined>();
    expectTypeOf<ButtonSemanticStyles['root']>().toEqualTypeOf<CSSProperties | undefined>();
  });

  it('★ `disabled` / `ghost` / `danger` / `block` 显式包含 `undefined`（否则 `??` 回退会失效）', () => {
    // 这条不是「类型好不好看」的问题：`withDefaults` 里少了 `default: undefined`，
    // Vue 会把未传的 Boolean prop 赋成 `false`，于是 ConfigProvider 的
    // `componentDisabled` 永久失效（PITFALLS 46）。类型上如实声明 `| undefined`
    // 是让「未传」与「显式 false」在类型层也保持可区分。
    expectTypeOf<ButtonProps['disabled']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<ButtonProps['ghost']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<ButtonProps['danger']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<ButtonProps['block']>().toEqualTypeOf<boolean | undefined>();
  });
});

describe('Button · 语义化（只支持对象形态）', () => {
  it('三个槽位：root / icon / content', () => {
    const classNames: ButtonSemanticClassNames = { root: 'a', icon: 'b', content: 'c' };
    const styles: ButtonSemanticStyles = { root: { color: 'red' }, icon: {}, content: {} };
    expectTypeOf(classNames.root).toEqualTypeOf<string | undefined>();
    expectTypeOf(styles.root).toEqualTypeOf<CSSProperties | undefined>();
    expectTypeOf<ButtonSemanticType>().toHaveProperty('classNames');
    expectTypeOf<ButtonSemanticType>().toHaveProperty('styles');
  });

  it('★ `classNames` / `styles` **不是**「对象 | 函数」的联合（裁决 B）', () => {
    expectTypeOf<ButtonProps['classNames']>().toEqualTypeOf<ButtonSemanticClassNames | undefined>();
    expectTypeOf<ButtonProps['styles']>().toEqualTypeOf<ButtonSemanticStyles | undefined>();
  });
});

describe('Button · ref / config / slot', () => {
  it('`nativeElement` 是 `<button>` 或 `<a>`，可空', () => {
    expectTypeOf<ButtonRef['nativeElement']>().toEqualTypeOf<
      HTMLButtonElement | HTMLAnchorElement | null
    >();
  });

  it('★ `ButtonConfig` 比 `ComponentStyleConfig` 多 4 项（来自上游 `useComponentConfig(button)`）', () => {
    expectTypeOf<ButtonConfig>().toHaveProperty('loadingIcon');
    expectTypeOf<ButtonConfig>().toHaveProperty('shape');
    expectTypeOf<ButtonConfig>().toHaveProperty('color');
    expectTypeOf<ButtonConfig>().toHaveProperty('variant');
    expectTypeOf<ButtonConfig>().toHaveProperty('autoInsertSpace');
  });

  it('插槽签名都是 `() => VNodeChild`（组件要走 prop，不能当插槽返回）', () => {
    expectTypeOf<ButtonSlot>().toEqualTypeOf<() => VNodeChild>();
  });
});

describe('Button · icon 的取值（平台差异：额外接受**组件**）', () => {
  it('★ `ButtonConfig.loadingIcon` 与 `ButtonProps.icon` 同一类型（配置面不漏）', () => {
    expectTypeOf<ButtonConfig['loadingIcon']>().toEqualTypeOf<ButtonIcon | undefined>();
  });

  it('antd 的 `icon={<SearchOutlined />}` 在 Vue 侧的对应物 —— **组件对象**可以直接传', () => {
    // React 的 `<Icon />` 求值后是一个「元素」；Vue 没有这个形态，对应物是组件本身。
    const Icon = defineComponent({ setup: () => () => h('i') });
    const asComponent: ButtonProps = { icon: Icon };
    const asVNode: ButtonProps = { icon: h(Icon) };
    const asText: ButtonProps = { icon: 'x' };
    const asLoading: ButtonProps = { loading: { delay: 0, icon: Icon } };
    const viaConfig: ButtonConfig = { loadingIcon: Icon };
    expectTypeOf(asComponent).toEqualTypeOf<ButtonProps>();
    expectTypeOf(asVNode).toEqualTypeOf<ButtonProps>();
    expectTypeOf(asText).toEqualTypeOf<ButtonProps>();
    expectTypeOf(asLoading).toEqualTypeOf<ButtonProps>();
    expectTypeOf(viaConfig).toEqualTypeOf<ButtonConfig>();
  });
});

describe('Button · 负例（应当报错）', () => {
  it('下面的用法都应当被类型系统拒绝', () => {
    // 永不调用的闭包 —— 负例只能存在于类型层。
    const negatives = () => {
      // @ts-expect-error `type` 不接受 'secondary'
      const badType: ButtonProps = { type: 'secondary' };
      // @ts-expect-error `color` 不接受 'teal'（不在 16 个预设色里）
      const badColor: ButtonProps = { color: 'teal' };
      // @ts-expect-error `variant` 不接受 'ghost'（ghost 是独立 prop）
      const badVariant: ButtonProps = { variant: 'ghost' };
      // @ts-expect-error `size` 不接受 'middle' 之外的其它值拼写
      const badSize: ButtonProps = { size: 'medium' };
      // @ts-expect-error `shape` 不接受 'pill'
      const badShape: ButtonProps = { shape: 'pill' };
      // @ts-expect-error `htmlType` 不接受 'menu'
      const badHtmlType: ButtonProps = { htmlType: 'menu' };
      // @ts-expect-error `href` 必须是字符串
      const badHref: ButtonProps = { href: 123 };
      // @ts-expect-error `loading` 的对象形态里 `delay` 是数字
      const badDelay: ButtonProps = { loading: { delay: '100' } };
      // @ts-expect-error ★ 函数式 `classNames` 不被支持（裁决 B）
      const badFnClassNames: ButtonProps = { classNames: () => ({ root: 'x' }) };
      // @ts-expect-error ★ 函数式 `styles` 不被支持（裁决 B）
      const badFnStyles: ButtonProps = { styles: () => ({ root: { color: 'red' } }) };
      // @ts-expect-error `classNames` 只接受 root / icon / content
      const extraKey: ButtonProps = { classNames: { body: 'x' } };
      // @ts-expect-error `styles` 只接受 root / icon / content
      const extraStyleKey: ButtonProps = { styles: { body: { color: 'red' } } };
      // @ts-expect-error `style` 是样式对象，不是字符串
      const badStyle: ButtonProps = { style: 'color: red' };
      // @ts-expect-error `iconPlacement` 不接受 'top'
      const badPlacement: ButtonProps = { iconPlacement: 'top' };
      return [
        badType,
        badColor,
        badVariant,
        badSize,
        badShape,
        badHtmlType,
        badHref,
        badDelay,
        badFnClassNames,
        badFnStyles,
        extraKey,
        extraStyleKey,
        badStyle,
        badPlacement,
      ];
    };
    expectTypeOf(negatives).toBeFunction();
  });
});
