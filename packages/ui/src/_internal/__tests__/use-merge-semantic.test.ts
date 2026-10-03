/**
 * L1 · `useMergeSemantic` 的**两条语义**与 `schema`（嵌套语义槽）。
 *
 * ── 为什么必须有这份用例（2026-10-03）────────────────────────────────────────
 *
 * 本模块此前只覆盖「无 schema」一条路径，而 antd 6.6.4 有 **9 个组件**传了第四参
 * schema（`select` / `cascader` / `color-picker` / `menu` / `tabs` / `image` /
 * `splitter` / `input.Search` / `table`）。本仓当时用「只要有一侧是对象就递归」
 * 绕过 —— 那在**字符串与对象混用**时会产生垃圾键（见下面第 2 条用例的反向哨兵）。
 * Table 是第一个**真的需要** schema 的组件（`body.cell` / `header.cell`），
 * 所以这里按 antd 的 `mergeClassNames(schema, …)` + `fillObjectBySchema` 逐字补齐。
 *
 * ⚠️ 两条路径**必须都测**：无 schema 的行为被 7 个既有组件钉住，不能为了加 schema 改掉它。
 */

import { describe, expect, it } from 'vitest';
import {
  fillObjectBySchema,
  mergeClassNames,
  mergeClassNamesBySchema,
  mergeStyles,
  type SemanticSchema,
  useMergeSemantic,
} from '../use-merge-semantic';

/** Table 的 schema（antd 原文：`InternalTable.tsx:322-333`）。 */
const TABLE_SCHEMA: SemanticSchema = {
  pagination: { _default: 'root' },
  header: { _default: 'wrapper' },
  body: { _default: 'wrapper' },
};

describe('use-merge-semantic · fillObjectBySchema', () => {
  it('`_default` 键 ⇒ 至少是空对象（不是 undefined）', () => {
    expect(fillObjectBySchema({ root: 'r' }, TABLE_SCHEMA)).toEqual({
      root: 'r',
      pagination: {},
      header: {},
      body: {},
    });
  });

  it('非 `_default` 子 schema ⇒ 递归；空 schema `{}` ⇒ 该键变成 `{}`', () => {
    expect(fillObjectBySchema(undefined, { placeholder: {} })).toEqual({ placeholder: {} });
    expect(fillObjectBySchema({ placeholder: { progress: 'p' } }, { placeholder: {} })).toEqual({
      placeholder: { progress: 'p' },
    });
  });

  it('已有的值不被覆盖（只补空）', () => {
    expect(fillObjectBySchema({ body: { cell: 'c' } }, TABLE_SCHEMA).body).toEqual({ cell: 'c' });
  });
});

describe('use-merge-semantic · mergeClassNamesBySchema', () => {
  it('🚨 `_default`：字符串形态被转成 `{ root: … }`（这正是 schema 存在的理由）', () => {
    const merged = mergeClassNamesBySchema<{ popup?: unknown }>({ popup: { _default: 'root' } }, {
      popup: 'a',
    } as never);
    expect(merged).toEqual({ popup: { root: 'a' } });
  });

  it('🚨 字符串与对象混用 ⇒ 落到同一个 `_default` 槽并**拼接**', () => {
    const merged = mergeClassNamesBySchema<{ popup?: unknown }>(
      { popup: { _default: 'root' } },
      { popup: 'a' } as never,
      { popup: { root: 'b' } } as never,
    );
    expect(merged).toEqual({ popup: { root: 'a b' } });
  });

  it('🔁 反向哨兵：**无 schema** 的路径在这条输入上会产垃圾键（所以两条语义不能合并）', () => {
    const legacy = mergeClassNames<{ popup?: unknown }>(
      { popup: 'a' } as never,
      {
        popup: { root: 'b' },
      } as never,
    );
    // `'a'` 被当成对象递归 ⇒ `Object.keys('a')` = ['0'] ⇒ 出现 `0` 这个垃圾键
    expect(legacy).not.toEqual({ popup: { root: 'a b' } });
    expect(Object.keys((legacy.popup ?? {}) as object)).toContain('0');
  });

  it('嵌套对象按子 schema 递归合并（Table 的 `body.cell` / `header.row`）', () => {
    const merged = mergeClassNamesBySchema<Record<string, unknown>>(
      TABLE_SCHEMA,
      { body: { cell: 'c1' }, root: 'r1' } as never,
      { body: { row: 'r2' }, header: { cell: 'h1' } } as never,
    );
    expect(merged).toEqual({
      root: 'r1',
      body: { cell: 'c1', row: 'r2' },
      header: { cell: 'h1' },
    });
  });

  it('schema **未声明**的键 ⇒ 一律 `clsx` 平铺（antd 语义）', () => {
    const merged = mergeClassNamesBySchema<{ root?: string }>(
      TABLE_SCHEMA,
      { root: 'a' } as never,
      {
        root: 'b',
      } as never,
    );
    expect(merged.root).toBe('a b');
  });
});

describe('use-merge-semantic · 无 schema 路径（既有行为，不能被改掉）', () => {
  it('classNames 拼接；一侧是对象时递归（auto-complete 期加的行为）', () => {
    expect(mergeClassNames<{ root?: string }>({ root: 'a' }, { root: 'b' })).toEqual({
      root: 'a b',
    });
    expect(
      mergeClassNames<Record<string, unknown>>(
        { popup: { root: 'a' } } as never,
        { popup: { list: 'b' } } as never,
      ),
    ).toEqual({ popup: { root: 'a', list: 'b' } });
  });

  it('styles 逐键浅合并、后者胜（与 classNames 语义不同）', () => {
    expect(
      mergeStyles<{ root?: Record<string, unknown> }>(
        { root: { color: 'red', width: 1 } },
        { root: { color: 'blue' } },
      ),
    ).toEqual({ root: { color: 'blue', width: 1 } });
  });
});

describe('use-merge-semantic · useMergeSemantic 的第四参', () => {
  const props = {};

  it('给 schema ⇒ classNames 走 schema 语义 + 两个结果都过 fillObjectBySchema', () => {
    const { classNames, styles } = useMergeSemantic<
      typeof props,
      Record<string, unknown>,
      Record<string, unknown>
    >([() => ({ popup: 'a' }) as never], [() => ({ popup: { color: 'red' } }) as never], props, {
      popup: { _default: 'root' },
    });
    expect(classNames.value).toEqual({ popup: { root: 'a' } });
    // styles 也补了结构（`popup` 已是对象 ⇒ 原样）
    expect(styles.value).toEqual({ popup: { color: 'red' } });
  });

  it('不给 schema ⇒ 与旧行为逐字相同（`popup` 保持对象、`root` 平铺）', () => {
    const { classNames } = useMergeSemantic<
      typeof props,
      Record<string, unknown>,
      Record<string, unknown>
    >([() => ({ root: 'r' }) as never, () => ({ popup: { root: 'p' } }) as never], [], props);
    expect(classNames.value).toEqual({ root: 'r', popup: { root: 'p' } });
  });
});
