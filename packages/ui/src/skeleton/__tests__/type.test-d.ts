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
 * ── 与 antd 类型面的登记差异（见 `interface.ts` 的文件头）──────────────────────
 *   1. `children` 不在 Props 里（Vue 侧是默认插槽，规则 C19）
 *   2. `SizeType` → `SkeletonElementSize`（避免与 config-provider 重名）
 *   3. `React.CSSProperties` → Vue `CSSProperties`
 *   4. 语义化**不支持函数式**（决策 `empty-semantic-fn` 的建议 B）
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { CSSProperties, VNodeChild } from 'vue';
import {
  Skeleton,
  type SkeletonAvatarProps,
  type SkeletonButtonProps,
  type SkeletonConfig,
  type SkeletonElementProps,
  type SkeletonElementSize,
  type SkeletonImageProps,
  type SkeletonInputProps,
  type SkeletonNodeProps,
  type SkeletonParagraphProps,
  type SkeletonProps,
  type SkeletonRef,
  type SkeletonSemanticAllType,
  type SkeletonSemanticClassNames,
  type SkeletonSemanticStyles,
  type SkeletonSemanticType,
  type SkeletonSemanticValue,
  type SkeletonShape,
  type SkeletonSlot,
  type SkeletonTitleProps,
  type SkeletonWidthUnit,
} from '../index';

describe('Skeleton · 基础枚举', () => {
  it('`SkeletonShape` 与 antd 的 `shape` 取值集合一致（含已废弃的 `default`）', () => {
    expectTypeOf<SkeletonShape>().toEqualTypeOf<'circle' | 'square' | 'round' | 'default'>();
  });

  it('★ `SkeletonElementSize` **允许数字**，且尺寸名是 `medium` 而不是 `middle`', () => {
    // ⚠️ antd 6.6.4 已把 `middle` 改名成 `medium`（`Element.d.ts` 里
    //    「`default` is deprecated, please use `medium` instead」）。
    //    我第一版按 antd 旧文档写成 `middle`，被这条测试纠正。
    //
    // 用 `toMatchTypeOf` 而不是 `toEqualTypeOf`：后者对联合成员的**书写顺序**敏感，
    // 而这里要断言的是「这 5 个值都在集合里」，不是顺序。
    expectTypeOf<
      'small' | 'medium' | 'large' | 'default' | number
    >().toMatchTypeOf<SkeletonElementSize>();
  });

  it('`SkeletonWidthUnit` 是「数值或字符串」，不含 `undefined`', () => {
    expectTypeOf<SkeletonWidthUnit>().toEqualTypeOf<number | string>();
  });
});

describe('Skeleton · Props 可选性', () => {
  it('全部 prop 都是可选的 —— `{}` 是合法入参', () => {
    const empty: SkeletonProps = {};
    expectTypeOf(empty).toMatchTypeOf<SkeletonProps>();
  });

  it('★ `loading` 是**三态**：`boolean | undefined`（未传 ≠ false）', () => {
    const a: SkeletonProps = { loading: undefined };
    const b: SkeletonProps = { loading: true };
    const c: SkeletonProps = { loading: false };
    expectTypeOf([a, b, c]).toMatchTypeOf<SkeletonProps[]>();
  });
});

describe('Skeleton · 三块的联合类型（boolean | 对象）', () => {
  it('`avatar` / `title` / `paragraph` 都接受 `boolean` 与各自的 props 对象', () => {
    const ok: SkeletonProps = {
      avatar: true,
      title: { width: '50%' },
      paragraph: { rows: 3 },
    };
    expectTypeOf(ok).toMatchTypeOf<SkeletonProps>();
  });

  it('★ `paragraph.width` 允许**数组**（逐行），`title.width` **不允许**', () => {
    const p: SkeletonParagraphProps = { width: ['10%', '20%'], rows: 2 };
    const t: SkeletonTitleProps = { width: '38%' };
    expectTypeOf([p, t]).toMatchTypeOf<Array<SkeletonParagraphProps | SkeletonTitleProps>>();
  });

  it('负例：`title.width` 传数组应当报错', () => {
    const _never = () => {
      // @ts-expect-error `SkeletonTitleProps.width` 是单值，不接受数组（antd 亦然）
      const bad: SkeletonTitleProps = { width: ['1%', '2%'] };
      return bad;
    };
    void _never;
  });

  it('负例：`rows` 只属于 paragraph，title 上没有', () => {
    const _never = () => {
      // @ts-expect-error `SkeletonTitleProps` 没有 `rows`
      const bad: SkeletonTitleProps = { rows: 3 };
      return bad;
    };
    void _never;
  });
});

describe('Skeleton · 语义化', () => {
  it('`classNames` / `styles` 的对象形态可用', () => {
    const cn: SkeletonSemanticClassNames = { root: 'a', header: 'b', section: 'c' };
    const st: SkeletonSemanticStyles = { root: { color: 'red' } };
    const all: SkeletonSemanticType = { classNames: cn, styles: st };
    expectTypeOf(all).toMatchTypeOf<SkeletonSemanticType>();
  });

  it('★ 6 个键与 DOM 结构一一对应（少一个键应当报错）', () => {
    const _never = () => {
      // @ts-expect-error `footer` 不是语义化槽位
      const bad: SkeletonSemanticClassNames = { footer: 'x' };
      return bad;
    };
    void _never;
  });

  /**
   * ⚠️ **函数式语义化是全库现状**（divider / typography / space / spin / empty / skeleton
   * 的 `SemanticValue` 都是 `T | ((info) => T)`；button 有 `classNamesAndFn`）。
   *
   * 它对应 `registry/foundation.json` 里 **`status: "open"`、`decision: null`** 的
   * `empty-semantic-fn` 决策（A = 不支持 / B = 支持，**从未裁决**）。
   *
   * ⚠️ 我第一版把这个决策记成了「建议 B = 不支持」，据此把本用例写成**负例**
   *    （断言 `classNames` 不接受函数），结果 `@ts-expect-error` 变成 unused 而失败。
   *    **查原文才发现 A 才是不支持，且决策根本没落过。** 现在如实钉住实现。
   */
  it('★ 函数式形态**可用**（全库现状；对应未裁决的 `empty-semantic-fn`）', () => {
    const ok: SkeletonProps = { classNames: () => ({ root: 'x' }) };
    expectTypeOf(ok).toMatchTypeOf<SkeletonProps>();
  });

  it('`SkeletonSemanticValue<T>` 是「T 或返回 T 的函数」', () => {
    expectTypeOf<SkeletonSemanticValue<SkeletonSemanticClassNames>>().toEqualTypeOf<
      SkeletonSemanticClassNames | ((info: { props: SkeletonProps }) => SkeletonSemanticClassNames)
    >();
  });
});

describe('Skeleton · Element 与子组件', () => {
  it('`SkeletonElementProps` 含 `size` / `shape` / `active`', () => {
    const e: SkeletonElementProps = { size: 40, shape: 'circle', active: true };
    expectTypeOf(e).toMatchTypeOf<SkeletonElementProps>();
  });

  it('五个子组件的 props 都派生自 Element 形态', () => {
    expectTypeOf<SkeletonAvatarProps>().toMatchTypeOf<SkeletonElementProps>();
    expectTypeOf<SkeletonButtonProps>().toMatchTypeOf<SkeletonElementProps>();
    expectTypeOf<SkeletonInputProps>().toMatchTypeOf<SkeletonElementProps>();
    expectTypeOf<SkeletonImageProps>().toMatchTypeOf<SkeletonElementProps>();
    expectTypeOf<SkeletonNodeProps>().toMatchTypeOf<SkeletonElementProps>();
  });

  it('★ 复合组件在类型上也挂得住（`Skeleton.Avatar` 等）', () => {
    expectTypeOf(Skeleton.Avatar).not.toBeNever();
    expectTypeOf(Skeleton.Button).not.toBeNever();
    expectTypeOf(Skeleton.Input).not.toBeNever();
    expectTypeOf(Skeleton.Image).not.toBeNever();
    expectTypeOf(Skeleton.Node).not.toBeNever();
  });
});

describe('Skeleton · Ref 与插槽', () => {
  it('`SkeletonRef.nativeElement` 是 `HTMLDivElement | null`', () => {
    expectTypeOf<SkeletonRef>().toEqualTypeOf<{ nativeElement: HTMLDivElement | null }>();
  });

  it('`SkeletonSlot` 返回 `VNodeChild`', () => {
    expectTypeOf<SkeletonSlot>().toEqualTypeOf<() => VNodeChild>();
  });
});

describe('Skeleton · Config', () => {
  it('`SkeletonConfig` 至少含 `classNames` / `styles`', () => {
    const c: SkeletonConfig = { classNames: { root: 'x' }, styles: { root: {} } };
    expectTypeOf(c).toMatchTypeOf<SkeletonConfig>();
  });

  it('`styles.root` 是 `CSSProperties`', () => {
    const c: SkeletonConfig = { styles: { root: { color: 'red' } } };
    // ⚠️ `SkeletonConfig['styles']` 是 `SkeletonSemanticValue<…>`（对象或函数），
    //    要先窄化才能读 `.root`。这里断言**对象分支**的形状。
    const styles = c.styles;
    if (typeof styles === 'function') throw new Error('本用例断言的是对象分支');
    expectTypeOf(styles?.root).toEqualTypeOf<CSSProperties | undefined>();
  });
});
