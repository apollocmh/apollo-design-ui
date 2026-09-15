import { describe, expect, it, vi } from 'vitest';
import { Comment, createCommentVNode, createTextVNode, createVNode, Fragment, h, Text } from 'vue';
import toArray from '../children/to-array';

/**
 * `toArray` 是 React → Vue 差异最集中的地方（见文件头注释）：
 *   - Vue 会把 `null` / `undefined` / `false` 归一化成 **Comment vnode**，
 *     所以"跳过空子节点"在 Vue 里等于"跳过 Comment vnode"
 *   - Vue 会把数组包成 **Fragment vnode**，所以必须拆 Fragment 才能展平
 *   - 原始值会被包成 Text vnode（`String(child)`，所以 `0` → `'0'`）
 *
 * 这一组测试逐个锁定这三条。
 */

const typeOf = (vnode: { type: unknown }): unknown => vnode.type;

/**
 * `noUncheckedIndexedAccess` 下 `list[i]` 的类型是 `T | undefined`。
 * 测试里下标由**前一行**的 `toHaveLength` 断言保证存在，所以这里显式收窄。
 *
 * 用辅助函数而不是 `!`：万一将来有人删掉那行长度断言，这里会抛出可读的错误，
 * 而不是让断言静默地对 `undefined` 求值（那样测试仍然"通过"，就白测了）。
 */
function at<T>(list: readonly T[], index: number): T {
  const item = list[index];
  if (item === undefined) {
    throw new Error(`断言前提不成立：下标 ${index} 不存在（数组长度 ${list.length}）`);
  }
  return item;
}

describe('toArray —— 基础展平', () => {
  it('单个元素 vnode → 长度 1，且原样保留（不重建）', () => {
    const node = h('div');
    const result = toArray(node);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(node);
  });

  it('数组按顺序展平', () => {
    const a = h('a');
    const b = h('b');
    const result = toArray([a, b]);
    expect(result).toEqual([a, b]);
  });

  it('★ 任意深度嵌套数组都被展平', () => {
    const a = h('a');
    const b = h('b');
    const c = h('c');
    const d = h('d');
    const result = toArray([a, [b, [c, [d]]]]);
    expect(result).toEqual([a, b, c, d]);
  });

  it('★ Fragment vnode 被拆包（Fragment 本身不算一个子节点）', () => {
    const a = h('a');
    const b = h('b');
    const fragment = createVNode(Fragment, null, [a, b]);
    const result = toArray(fragment);
    expect(result).toEqual([a, b]);
    expect(result.some((node) => typeOf(node) === Fragment)).toBe(false);
  });

  it('★ 嵌套 Fragment 也被逐层拆开', () => {
    const a = h('a');
    const inner = createVNode(Fragment, null, [a]);
    const outer = createVNode(Fragment, null, [inner]);
    expect(toArray(outer)).toEqual([a]);
  });

  it('空数组 → 空结果', () => {
    expect(toArray([])).toEqual([]);
  });
});

describe('toArray —— 空值处理（Vue 归一化的对应语义）', () => {
  it('null / undefined 默认跳过', () => {
    expect(toArray(null)).toEqual([]);
    expect(toArray(undefined)).toEqual([]);
    expect(toArray([h('a'), null, undefined, h('b')])).toHaveLength(2);
  });

  it('★ Comment vnode 默认跳过 —— 这是 Vue 侧"空子节点"的实际形态', () => {
    const comment = createVNode(Comment);
    expect(toArray(comment)).toEqual([]);
    expect(toArray([h('a'), comment, h('b')])).toHaveLength(2);
  });

  it('★ 编译器为 v-if 假分支产出 Comment vnode（已用 compiler-sfc 验证）', () => {
    // `<div><span v-if="false">x</span></div>` 的编译产物里是 createCommentVNode("v-if", true)
    const vnode = h('div', [createCommentVNode('v-if', true)]);
    const children = vnode.children as unknown[];
    expect(children).toHaveLength(1);
    expect(typeOf(children[0] as { type: unknown })).toBe(Comment);
    expect(toArray(children as never)).toEqual([]);
  });

  it('★ 手写 render 里的裸 null / undefined / false 不会被 h() 归一化 —— 由 toArray 自己跳过', () => {
    const vnode = h('div', [null, undefined, false]);
    const children = vnode.children as unknown[];
    // h() 不做归一化；归一化发生在渲染器的 patchChildren 里，不是 createVNode 里
    expect(children).toEqual([null, undefined, false]);
    expect(toArray(children as never)).toEqual([]);
  });

  it('★ 插值 null 产出的是**空 Text vnode**，toArray 不跳过它（与 React 的 Children.toArray 一致）', () => {
    // `{{ maybeNull }}` → toDisplayString(null) → '' → Text vnode，而不是 Comment
    const emptyText = createTextVNode('');
    const result = toArray([emptyText, h('a')]);
    expect(result).toHaveLength(2);
    expect(typeOf(at(result, 0))).toBe(Text);
    expect(at(result, 0).children).toBe('');
  });

  it('keepEmpty 时 null / undefined 各补一个 Comment 占位', () => {
    const result = toArray([null, undefined], { keepEmpty: true });
    expect(result).toHaveLength(2);
    expect(result.every((node) => typeOf(node) === Comment)).toBe(true);
  });

  it('keepEmpty 时保留**原** Comment vnode（不是新建的占位）', () => {
    const comment = createVNode(Comment);
    const result = toArray(comment, { keepEmpty: true });
    expect(result).toHaveLength(1);
    expect(at(result, 0)).toBe(comment);
  });

  it('boolean：true 与 false 都不产生内容', () => {
    expect(toArray(true)).toEqual([]);
    expect(toArray(false)).toEqual([]);
  });

  it('keepEmpty 时 boolean 也补占位（true / false 都一样）', () => {
    expect(toArray(true, { keepEmpty: true })).toHaveLength(1);
    expect(toArray(false, { keepEmpty: true })).toHaveLength(1);
  });

  it('★ keepEmpty 只影响"空"，不影响真实内容', () => {
    const a = h('a');
    const result = toArray([a, null], { keepEmpty: true });
    expect(result).toHaveLength(2);
    expect(at(result, 0)).toBe(a);
  });
});

describe('toArray —— 原始值', () => {
  it('字符串 → Text vnode', () => {
    const result = toArray('hello');
    expect(result).toHaveLength(1);
    expect(typeOf(at(result, 0))).toBe(Text);
    expect(at(result, 0).children).toBe('hello');
  });

  it('★ 数字 0 → Text vnode "0"（String() 转换，不是被当成空值跳过）', () => {
    const result = toArray(0);
    expect(result).toHaveLength(1);
    expect(typeOf(at(result, 0))).toBe(Text);
    expect(at(result, 0).children).toBe('0');
  });

  it('★ 空字符串 → Text vnode ""（是"有内容"，与 null 不同）', () => {
    const result = toArray('');
    expect(result).toHaveLength(1);
    expect(typeOf(at(result, 0))).toBe(Text);
    expect(at(result, 0).children).toBe('');
  });

  it('NaN / Infinity 也按 String() 处理', () => {
    expect(at(toArray(Number.NaN), 0).children).toBe('NaN');
    expect(at(toArray(Number.POSITIVE_INFINITY), 0).children).toBe('Infinity');
  });

  it('原始值混在数组里也保持顺序', () => {
    const a = h('a');
    const result = toArray(['x', a, 0]);
    expect(result).toHaveLength(3);
    expect(typeOf(at(result, 0))).toBe(Text);
    expect(at(result, 1)).toBe(a);
    expect(typeOf(at(result, 2))).toBe(Text);
  });

  it('已归一化的 Text vnode 原样保留，不重复包一层', () => {
    const text = createTextVNode('t');
    const result = toArray(text);
    expect(at(result, 0)).toBe(text);
  });
});

describe('toArray —— Slot', () => {
  it('★ 函数入参按 Slot 调用，其返回值被展平', () => {
    const a = h('a');
    const b = h('b');
    const slot = vi.fn(() => [a, b]);
    expect(toArray(slot)).toEqual([a, b]);
    expect(slot).toHaveBeenCalledTimes(1);
  });

  it('Slot 返回单个 vnode 也支持', () => {
    const a = h('a');
    expect(toArray(() => a)).toEqual([a]);
  });

  it('Slot 返回嵌套数组 / null 也支持', () => {
    const a = h('a');
    expect(toArray(() => [a, [null, h('b')]])).toHaveLength(2);
  });

  it('Slot 返回 undefined 时按空处理', () => {
    expect(toArray(() => undefined as never)).toEqual([]);
  });

  it('★ 函数**不会**被当成 vnode 或原始值（先于其它分支判断）', () => {
    // 若实现顺序写错，函数会被 `String(fn)` 变成文本
    const result = toArray(() => [h('a')]);
    expect(typeOf(at(result, 0))).not.toBe(Text);
  });
});

describe('toArray —— 返回值契约', () => {
  it('恒返回新数组（调用方可以安全地 push）', () => {
    const a = h('a');
    const first = toArray([a]);
    const second = toArray([a]);
    expect(first).not.toBe(second);
    first.push(h('b'));
    expect(second).toHaveLength(1);
  });

  it('空输入恒返回空数组而不是 undefined', () => {
    for (const input of [[], null, undefined, true, false]) {
      expect(Array.isArray(toArray(input as never))).toBe(true);
    }
  });

  it('option 省略时等价于 keepEmpty: false', () => {
    const comment = createVNode(Comment);
    expect(toArray([comment])).toEqual(toArray([comment], {}));
    expect(toArray([comment])).toEqual(toArray([comment], { keepEmpty: false }));
  });
});
