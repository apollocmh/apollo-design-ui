/**
 * L3 · 类型测试（含**负例**）
 *
 * 规则 T7：只有正例的类型测试是没有价值的。下面每个 `describe` 都同时给出
 * 「应当通过」与「应当报错」两侧。
 *
 * ⚠️ 负例必须包在**永不调用**的闭包里 —— 本文件会被 vitest 真的执行。
 * `@ts-expect-error` 在本仓库**只允许**出现在这里（`AGENTS.md` H10）。
 *
 * ── 与 antd 类型面的登记差异 ──────────────────────────────────────────────────
 *   1. `children` 不在 Props 里（Vue 侧是默认插槽，规则 C19）
 *   2. `onChange` 是 Vue 事件（`emit('change', affixed)`），Props 里没有 `onChange`
 *   3. `AffixTarget` 的返回类型是 `HTMLElement | Window | null` —— antd 亦然；
 *      ConfigProvider 的 `getTargetContainer` 更宽（还允许 `ShadowRoot`），
 *      由 `Affix.vue` 的 `targetFunc` 收窄（见那里的注释）
 */

import { describe, expectTypeOf, it } from 'vitest';
import type { CSSProperties, VNodeChild } from 'vue';
import type {
  AffixConfig,
  AffixProps,
  AffixRect,
  AffixRef,
  AffixSlot,
  AffixTarget,
} from '../index';
import { Affix } from '../index';

describe('Affix · Props 可选性', () => {
  it('全部 prop 都是可选的 —— `{}` 是合法入参', () => {
    const empty: AffixProps = {};
    expectTypeOf(empty).toMatchTypeOf<AffixProps>();
  });

  it('★ `offsetTop` / `offsetBottom` 是 `number | undefined`（三态判据的基础）', () => {
    const a: AffixProps = { offsetTop: 64 };
    const b: AffixProps = { offsetBottom: 0 };
    const c: AffixProps = { offsetTop: undefined, offsetBottom: undefined };
    expectTypeOf([a, b, c]).toMatchTypeOf<AffixProps[]>();
  });

  it('`offsetBottom` 可以为 `0`（数值 0 是合法偏移，不是「没传」）', () => {
    const ok: AffixProps = { offsetBottom: 0 };
    expectTypeOf(ok).toMatchTypeOf<AffixProps>();
  });

  it('★ `offsetTop` / `offsetBottom` **不接受字符串**（antd 亦然）', () => {
    const _never = () => {
      // @ts-expect-error 偏移必须是数字
      const bad: AffixProps = { offsetTop: '64px' };
      return bad;
    };
    void _never;
  });

  it("★ `onChange` 不在 Props 里（Vue 侧是 emit('change')，规则 C19）", () => {
    const _never = () => {
      // @ts-expect-error React 的回调 prop 在 Vue 侧由 emit 承担
      const bad: AffixProps = { onChange: (_affixed: boolean) => {} };
      return bad;
    };
    void _never;
  });
});

describe('Affix · target', () => {
  it('★ `AffixTarget` 返回 `HTMLElement | Window | null`', () => {
    const t1: AffixTarget = () => window;
    const t2: AffixTarget = () => document.createElement('div');
    const t3: AffixTarget = () => null;
    expectTypeOf([t1, t2, t3]).toMatchTypeOf<AffixTarget[]>();
  });

  it('`target` 接受返回元素的函数', () => {
    const el = document.createElement('div');
    const ok: AffixProps = { target: () => el };
    expectTypeOf(ok).toMatchTypeOf<AffixProps>();
  });

  it('负例：`target` **不接受元素本身**（必须是返回元素的函数，antd 亦然）', () => {
    const _never = () => {
      // @ts-expect-error target 是工厂函数，不是元素
      const bad: AffixProps = { target: document.createElement('div') };
      return bad;
    };
    void _never;
  });
});

describe('Affix · Ref 与插槽', () => {
  it('★ `AffixRef` 只有 `updatePosition`（与 antd 的 `useImperativeHandle` 对齐）', () => {
    expectTypeOf<AffixRef>().toEqualTypeOf<{ updatePosition: () => void }>();
  });

  it('`AffixSlot.default` 返回 `VNodeChild`', () => {
    expectTypeOf<AffixSlot>().toEqualTypeOf<{ default?: () => VNodeChild }>();
  });
});

describe('Affix · Config 与 Rect', () => {
  it('`AffixConfig` 含 `className` / `style`', () => {
    const c: AffixConfig = { className: 'x', style: { color: 'red' } };
    expectTypeOf(c).toMatchTypeOf<AffixConfig>();
    expectTypeOf(c.style).toEqualTypeOf<CSSProperties | undefined>();
  });

  it('★ `AffixRect` 的 `height` / `width` 是**可选**的（window 分支没有它们）', () => {
    // 这正是 getTargetRect 的 window 分支能通过类型检查的前提：
    // 它只返回 { top: 0, bottom: innerHeight }。
    const windowShape: AffixRect = { top: 0, bottom: 800 };
    expectTypeOf(windowShape).toMatchTypeOf<AffixRect>();
  });

  it('负例：`AffixRect.top` 必须是数字', () => {
    const _never = () => {
      // @ts-expect-error top 不能是字符串
      const bad: AffixRect = { top: '0', bottom: 0 };
      return bad;
    };
    void _never;
  });
});

describe('Affix · 组件本体', () => {
  it('★ `Affix` 在类型上也挂得住（可作组件使用）', () => {
    expectTypeOf(Affix).not.toBeNever();
  });
});
