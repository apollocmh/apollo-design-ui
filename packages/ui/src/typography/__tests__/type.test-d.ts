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
 *   2. `EditConfig` / `EllipsisConfig` 等 antd 未导出的类型，我们**导出**了
 *      （Vue 的 `$attrs` 透传模型下，自定义包装组件需要它们）
 *   3. `React.CSSProperties` → Vue `CSSProperties`、`React.ReactNode` → `VNodeChild`
 *
 * ── 五条本组件特有的类型契约 ──────────────────────────────────────────────────
 *
 *   1. `Typography` 本体**没有** `type` / `ellipsis` / `strong` 等（只有
 *      `BaseTypographyProps`）；它们只在 `BlockProps` 上。
 *   2. `Text` 的 `ellipsis` **不支持** `expandable` / `rows` / `onExpand`。
 *   3. `Title` **没有** `strong`（`Omit` 掉），且 `level` 只能是 `1..5`。
 *   4. `Link` 的 `ellipsis` **只能是布尔**。
 *   5. `TypographyRef.nativeElement` 是 `HTMLElement | null`（首次渲染前为 `null`）。
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { CSSProperties, VNodeChild } from 'vue';
import type {
  ActionsConfig,
  AutoSizeType,
  BaseType,
  BaseTypographyProps,
  BlockProps,
  CopyConfig,
  EditConfig,
  EllipsisConfig,
  LinkProps,
  ParagraphProps,
  TextProps,
  TitleProps,
  TypographyConfig,
  TypographyProps,
  TypographyRef,
  TypographySemanticAllType,
  TypographySemanticClassNames,
  TypographySemanticStyles,
  TypographySemanticType,
  TypographySemanticValue,
  TypographySlot,
  TypographyTooltipProps,
} from '../index';
import { Link, Paragraph, Text, Title, Typography } from '../index';

describe('Typography · 基础枚举与配置对象', () => {
  it('`BaseType` 的取值集合与 antd 逐字一致', () => {
    expectTypeOf<BaseType>().toEqualTypeOf<'secondary' | 'success' | 'warning' | 'danger'>();
  });

  it('`ActionsConfig.placement` 只有 start / end（自 6.4.0 起）', () => {
    expectTypeOf<ActionsConfig['placement']>().toEqualTypeOf<'start' | 'end' | undefined>();
  });

  it('`AutoSizeType` 是 `{ minRows?, maxRows? }`（本地定义，不从 `@rc-component` 取，规则 C18）', () => {
    expectTypeOf<AutoSizeType>().toEqualTypeOf<{ minRows?: number; maxRows?: number }>();
  });

  it('`TypographyTooltipProps` 目前**只声明 `title`**（Tooltip 未落地的缺口，README §7）', () => {
    expectTypeOf<TypographyTooltipProps>().toHaveProperty('title');
    expectTypeOf<TypographyTooltipProps['title']>().toEqualTypeOf<VNodeChild | undefined>();
    // ⚠️ 这条断言是**故意的**：antd 那里是完整的 `TooltipProps`（几十个字段）。
    //    一旦 Tooltip 落地，这里会红 —— 提醒把缺口补齐。
    expectTypeOf<keyof TypographyTooltipProps>().toEqualTypeOf<'title'>();
  });

  it('`EllipsisConfig.expandable` 接受 `boolean | "collapsible"`', () => {
    expectTypeOf<EllipsisConfig['expandable']>().toEqualTypeOf<
      boolean | 'collapsible' | undefined
    >();
  });

  it('`EllipsisConfig.onExpand` 的第二参数是 `{ expanded: boolean }`', () => {
    expectTypeOf<NonNullable<EllipsisConfig['onExpand']>>().parameters.toEqualTypeOf<
      [MouseEvent, { expanded: boolean }]
    >();
  });

  it('`EllipsisConfig.symbol` 接受节点或 `(expanded) => 节点`', () => {
    expectTypeOf<EllipsisConfig['symbol']>().toEqualTypeOf<
      VNodeChild | ((expanded: boolean) => VNodeChild) | undefined
    >();
  });

  it('`EditConfig.tooltip` 额外接受 `false`（显式关掉提示）', () => {
    expectTypeOf<EditConfig['tooltip']>().toEqualTypeOf<VNodeChild | false | undefined>();
  });

  it('`EditConfig.triggerType` 是 `("icon" | "text")[]`', () => {
    expectTypeOf<EditConfig['triggerType']>().toEqualTypeOf<('icon' | 'text')[] | undefined>();
  });

  it('`CopyConfig.icon` / `tooltips` 接受节点或 `[未复制, 已复制]` 二元组', () => {
    expectTypeOf<CopyConfig['icon']>().toEqualTypeOf<
      VNodeChild | [VNodeChild, VNodeChild] | undefined
    >();
    expectTypeOf<CopyConfig['tooltips']>().toEqualTypeOf<
      VNodeChild | [VNodeChild, VNodeChild] | undefined
    >();
  });
});

describe('Typography · Props 的三层结构', () => {
  it('`BaseTypographyProps` 只有 5 个字段（根 class/style 走原生 attrs）', () => {
    expectTypeOf<keyof BaseTypographyProps>().toEqualTypeOf<
      'prefixCls' | 'classNames' | 'styles' | 'direction' | 'component'
    >();
  });

  it('★ `TypographyProps` 就是 `BaseTypographyProps` —— 本体**没有** `type` / `ellipsis` / `strong`', () => {
    expectTypeOf<TypographyProps>().toEqualTypeOf<BaseTypographyProps>();
    expectTypeOf<TypographyProps>().not.toHaveProperty('ellipsis');
    expectTypeOf<TypographyProps>().not.toHaveProperty('type');
    expectTypeOf<TypographyProps>().not.toHaveProperty('strong');
  });

  it('`BlockProps` 在 `TypographyProps` 之上补了 14 个字段（含七个装饰）', () => {
    expectTypeOf<BlockProps>().toHaveProperty('ellipsis');
    expectTypeOf<BlockProps>().toHaveProperty('copyable');
    expectTypeOf<BlockProps>().toHaveProperty('editable');
    expectTypeOf<BlockProps>().toHaveProperty('type');
    expectTypeOf<BlockProps>().toHaveProperty('disabled');
    expectTypeOf<BlockProps>().toHaveProperty('actions');
    expectTypeOf<BlockProps>().toHaveProperty('title');
    for (const key of [
      'code',
      'mark',
      'underline',
      'delete',
      'strong',
      'keyboard',
      'italic',
    ] as const) {
      expectTypeOf<BlockProps>().toHaveProperty(key);
    }
  });

  it('`TextProps` 的 `ellipsis` **不含** `expandable` / `rows` / `onExpand`', () => {
    expectTypeOf<TextProps['ellipsis']>().toEqualTypeOf<
      boolean | Omit<EllipsisConfig, 'expandable' | 'rows' | 'onExpand'> | undefined
    >();
  });

  it('★ `TitleProps` 用 `Omit` 去掉了 `strong`，并加 `level: 1..5`', () => {
    expectTypeOf<TitleProps>().not.toHaveProperty('strong');
    expectTypeOf<TitleProps['level']>().toEqualTypeOf<1 | 2 | 3 | 4 | 5 | undefined>();
  });

  it('`ParagraphProps` 就是 `BlockProps`（没有增删）', () => {
    expectTypeOf<ParagraphProps>().toEqualTypeOf<BlockProps>();
  });

  it('★ `LinkProps.ellipsis` **只能是布尔**（antd 的 `Omit<BlockProps,"ellipsis"> & {ellipsis?: boolean}`）', () => {
    expectTypeOf<LinkProps['ellipsis']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<LinkProps>().toHaveProperty('rel');
    expectTypeOf<LinkProps>().toHaveProperty('target');
  });

  it('全部 prop 都是可选的（antd 的 `Partial<…>` 语义）', () => {
    const emptyText: TextProps = {};
    const emptyTitle: TitleProps = {};
    const emptyParagraph: ParagraphProps = {};
    const emptyLink: LinkProps = {};
    expectTypeOf(emptyText).toMatchTypeOf<TextProps>();
    expectTypeOf(emptyTitle).toMatchTypeOf<TitleProps>();
    expectTypeOf(emptyParagraph).toMatchTypeOf<ParagraphProps>();
    expectTypeOf(emptyLink).toMatchTypeOf<LinkProps>();
  });

  it('根 `class` / `style` 是 Vue 原生 attrs（不在 BaseTypographyProps 键集里）', () => {
    const nativeAttrs: InstanceType<typeof Text>['$props'] = {
      class: ['a', { b: true }],
      style: { color: 'red' } satisfies CSSProperties,
    };
    expectTypeOf(nativeAttrs).toMatchTypeOf<InstanceType<typeof Text>['$props']>();

    const _never = () => {
      // @ts-expect-error `className` 由 Vue 原生 `class` 取代
      const badClassName: BaseTypographyProps = { className: 'legacy' };
      // @ts-expect-error 原生 `style` 不是 BaseTypographyProps
      const badStyle: BlockProps = { style: { color: 'red' } };
      return [badClassName, badStyle];
    };
    void _never;
  });
});

describe('Typography · 语义化 classNames / styles', () => {
  it('对象式：只接受 root / actions / action / textarea 四个槽位', () => {
    const classNames: TypographySemanticClassNames = {
      root: 'a',
      actions: 'b',
      action: 'c',
      textarea: 'd',
    };
    const styles: TypographySemanticStyles = { root: { color: 'red' }, actions: {}, action: {} };
    expectTypeOf(classNames.root).toEqualTypeOf<string | undefined>();
    expectTypeOf(styles.root).toEqualTypeOf<CSSProperties | undefined>();
    expectTypeOf<TypographySemanticType>().toHaveProperty('classNames');
  });

  it('★ 函数式：被调用时收到 `{ props }`（`info.props` 是**合并后**的 props）', () => {
    const fromFn: TextProps = {
      classNames: (info) => {
        expectTypeOf(info).toHaveProperty('props');
        expectTypeOf(info.props).toMatchTypeOf<BaseTypographyProps>();
        return { root: 'from-fn' };
      },
      styles: (info) => ({ root: { color: info.props.prefixCls } }),
    };

    // 不能直接 `toMatchTypeOf<函数类型>`：`TextProps['classNames']` 是
    // `对象 | 函数` 的**联合**，联合不能赋给函数类型（那正是「两种形态都支持」的含义）。
    // 所以先用 `Extract` 把函数那一支取出来，再断言它的参数与返回值。
    type ClassNamesFn = Extract<
      NonNullable<TextProps['classNames']>,
      (...args: never[]) => unknown
    >;
    type StylesFn = Extract<NonNullable<TextProps['styles']>, (...args: never[]) => unknown>;

    expectTypeOf<Parameters<ClassNamesFn>>().toEqualTypeOf<[{ props: BaseTypographyProps }]>();
    expectTypeOf<ReturnType<ClassNamesFn>>().toEqualTypeOf<TypographySemanticClassNames>();
    expectTypeOf<Parameters<StylesFn>>().toEqualTypeOf<[{ props: BaseTypographyProps }]>();
    expectTypeOf<ReturnType<StylesFn>>().toEqualTypeOf<TypographySemanticStyles>();

    expectTypeOf(fromFn.classNames).toMatchTypeOf<TextProps['classNames']>();
  });

  it('`TypographySemanticValue<T>` 是「对象或函数」的联合', () => {
    expectTypeOf<TypographySemanticValue<TypographySemanticClassNames>>().toEqualTypeOf<
      | TypographySemanticClassNames
      | ((info: { props: BaseTypographyProps }) => TypographySemanticClassNames)
    >();
  });

  it('`TypographySemanticAllType` 是 antd 的 `GenerateSemantic` 展开形态', () => {
    expectTypeOf<TypographySemanticAllType>().toHaveProperty('classNamesAndFn');
    expectTypeOf<TypographySemanticAllType>().toHaveProperty('stylesAndFn');
    expectTypeOf<TypographySemanticAllType>().toHaveProperty('classNames');
    expectTypeOf<TypographySemanticAllType>().toHaveProperty('styles');
  });
});

describe('Typography · ref / config / slot / 复合组件', () => {
  it('`nativeElement` 可空（与 antd 的 `forwardRef` 有一处登记差异）', () => {
    expectTypeOf<TypographyRef['nativeElement']>().toEqualTypeOf<HTMLElement | null>();
  });

  it('`TypographyConfig` 是 `ComponentStyleConfig & Pick<…, classNames|styles>`', () => {
    expectTypeOf<TypographyConfig>().toHaveProperty('className');
    expectTypeOf<TypographyConfig>().toHaveProperty('style');
    expectTypeOf<TypographyConfig>().toHaveProperty('classNames');
    expectTypeOf<TypographyConfig>().toHaveProperty('styles');
    // `prefixCls` **不**在配置里（它是 ConfigProvider 顶层的字段）
    expectTypeOf<TypographyConfig>().not.toHaveProperty('prefixCls');
  });

  it('默认插槽签名是 `() => VNodeChild`', () => {
    expectTypeOf<TypographySlot>().toBeFunction();
    expectTypeOf<ReturnType<TypographySlot>>().toEqualTypeOf<VNodeChild>();
  });

  it('★ 复合组件的四个静态子组件与具名导出**类型相同**（同一批对象）', () => {
    expectTypeOf(Typography.Text).toEqualTypeOf<typeof Text>();
    expectTypeOf(Typography.Title).toEqualTypeOf<typeof Title>();
    expectTypeOf(Typography.Paragraph).toEqualTypeOf<typeof Paragraph>();
    expectTypeOf(Typography.Link).toEqualTypeOf<typeof Link>();
  });

  it('五个组件都是可安装的（`withInstall` 的产物）', () => {
    for (const component of [Typography, Text, Title, Paragraph, Link]) {
      expectTypeOf(component).toHaveProperty('install');
    }
  });
});

describe('Typography · 负例（应当报错）', () => {
  it('下面的用法都应当被类型系统拒绝', () => {
    // 永不调用的闭包 —— 负例只能存在于类型层。
    const negatives = () => {
      // @ts-expect-error `Typography` 本体没有 `type`
      const typographyType: TypographyProps = { type: 'danger' };
      // @ts-expect-error `Typography` 本体没有 `ellipsis`
      const typographyEllipsis: TypographyProps = { ellipsis: true };
      // @ts-expect-error `Typography` 本体没有 `strong`
      const typographyStrong: TypographyProps = { strong: true };
      // @ts-expect-error `BaseType` 不接受 'primary'
      const badType: TextProps = { type: 'primary' };
      // @ts-expect-error `Text` 的 `ellipsis` 不支持 `expandable`
      const textExpandable: TextProps = { ellipsis: { expandable: true } };
      // @ts-expect-error `Text` 的 `ellipsis` 不支持 `rows`
      const textRows: TextProps = { ellipsis: { rows: 2 } };
      // @ts-expect-error `Text` 的 `ellipsis` 不支持 `onExpand`
      const textOnExpand: TextProps = { ellipsis: { onExpand: () => {} } };
      // @ts-expect-error `Title` 没有 `strong`（被 `Omit` 掉）
      const titleStrong: TitleProps = { strong: true };
      // @ts-expect-error `Title.level` 不接受 6
      const titleLevel6: TitleProps = { level: 6 };
      // @ts-expect-error `Title.level` 不接受字符串
      const titleLevelStr: TitleProps = { level: '2' };
      // @ts-expect-error `Link.ellipsis` 只能是布尔
      const linkEllipsis: LinkProps = { ellipsis: { rows: 2 } };
      // @ts-expect-error `classNames` 只接受 root / actions / action / textarea
      const extraClassKey: TextProps = { classNames: { body: 'x' } };
      // @ts-expect-error `styles` 只接受 root / actions / action / textarea
      const extraStyleKey: TextProps = { styles: { body: { color: 'red' } } };
      // @ts-expect-error 函数式 `classNames` 的返回值必须是四个槽位的对象
      const badFnReturn: TextProps = { classNames: () => ({ body: 'x' }) };
      // @ts-expect-error `ActionsConfig.placement` 只有 start / end
      const badPlacement: TextProps = { actions: { placement: 'center' } };
      // @ts-expect-error `prefixCls` 必须是字符串
      const badPrefixCls: TextProps = { prefixCls: 123 };
      // @ts-expect-error `style` 是样式对象，不是字符串
      const badStyle: TextProps = { style: 'color: red' };
      // @ts-expect-error `disabled` 是布尔
      const badDisabled: TextProps = { disabled: 'yes' };
      // @ts-expect-error `TypographySemanticClassNames` 没有 `body` 槽位
      const badSemantic: TypographySemanticClassNames = { body: 'x' };
      // @ts-expect-error `nativeElement` 只读语义（`TypographyRef` 只有这一个字段）
      const badRef: TypographyRef = { nativeElement: null, extra: 1 };
      return [
        typographyType,
        typographyEllipsis,
        typographyStrong,
        badType,
        textExpandable,
        textRows,
        textOnExpand,
        titleStrong,
        titleLevel6,
        titleLevelStr,
        linkEllipsis,
        extraClassKey,
        extraStyleKey,
        badFnReturn,
        badPlacement,
        badPrefixCls,
        badStyle,
        badDisabled,
        badSemantic,
        badRef,
      ];
    };
    expectTypeOf(negatives).toBeFunction();
  });
});
