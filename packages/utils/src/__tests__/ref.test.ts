import { describe, expect, it, vi } from 'vitest';
import type { VNode } from 'vue';
import {
  Comment,
  createTextVNode,
  createVNode,
  defineComponent,
  Fragment,
  h,
  ref,
  watch,
} from 'vue';
import {
  composeRef,
  fillRef,
  getNodeRef,
  type RefLike,
  supportNodeRef,
  supportRef,
  useComposeRef,
} from '../ref';

/**
 * ref.ts 的核心认知（见文件头）：Vue 里「转发 ref」靠 `defineExpose`，不靠合并 ref。
 * 所以这一组测试的重点不是"模拟 React 的 forwardRef"，而是：
 *   1. 锁定 rc-util 那几个**可观测的怪癖**（`length <= 1` 原样返回、缓存键的比较方式）
 *   2. 锁定 Vue 侧 `supportRef` / `getNodeRef` 的语义调整（组件 vnode 一律视为支持）
 */

describe('fillRef', () => {
  it('函数 ref 被调用', () => {
    const fn = vi.fn();
    const node = document.createElement('div');
    fillRef(fn, node);
    expect(fn).toHaveBeenCalledWith(node);
  });

  it('{ value } 形态（Vue 的 Ref）', () => {
    const target = { value: null as HTMLElement | null };
    const node = document.createElement('div');
    fillRef(target, node);
    expect(target.value).toBe(node);
  });

  it('{ current } 形态（React 的 ref 对象，仅为迁移期兼容）', () => {
    const target = { current: null as HTMLElement | null };
    const node = document.createElement('div');
    fillRef(target, node);
    expect(target.current).toBe(node);
  });

  it('写 null 可以清空（卸载时渲染器会这样调）', () => {
    const node = document.createElement('div');
    const target = { value: node as HTMLElement | null };
    fillRef(target, null);
    expect(target.value).toBeNull();
  });

  it('null / undefined 目标静默忽略，不抛错', () => {
    expect(() => fillRef(null, document.createElement('div'))).not.toThrow();
    expect(() => fillRef(undefined, document.createElement('div'))).not.toThrow();
  });

  it('★ 既没有 value 也没有 current 的对象被静默忽略（不报错、不新增字段）', () => {
    const target: Record<string, unknown> = {};
    expect(() =>
      fillRef(target as unknown as RefLike<HTMLElement>, document.createElement('div')),
    ).not.toThrow();
    expect(Object.keys(target)).toHaveLength(0);
  });

  it('★ 优先看 value 而不是 current（两者都有时只写 value）', () => {
    const target = { value: null as unknown, current: null as unknown };
    const node = document.createElement('div');
    fillRef(target, node);
    expect(target.value).toBe(node);
    expect(target.current).toBeNull();
  });
});

describe('composeRef', () => {
  it('★ length <= 1 时原样返回第一个 ref，不做包装（所以 composeRef(fn) === fn）', () => {
    const fn = vi.fn();
    expect(composeRef(fn)).toBe(fn);
  });

  it('★ 单个对象 ref 也原样返回（不是函数，调用方需自己判断）', () => {
    const target = { value: null };
    expect(composeRef(target)).toBe(target);
  });

  it('★ 全部为 falsy 时返回 undefined（不是空函数）', () => {
    expect(composeRef()).toBeUndefined();
    expect(composeRef(null, undefined)).toBeUndefined();
  });

  it('多个 ref 时返回函数，调用一次写全部', () => {
    const fn = vi.fn();
    const a = { value: null as HTMLElement | null };
    const b = { current: null as HTMLElement | null };
    const node = document.createElement('div');

    const composed = composeRef(fn, a, b);
    expect(typeof composed).toBe('function');
    (composed as (n: HTMLElement | null) => void)(node);

    expect(fn).toHaveBeenCalledWith(node);
    expect(a.value).toBe(node);
    expect(b.current).toBe(node);
  });

  it('★ falsy 项被过滤只影响「是否包装」的判断，遍历时仍会走 fillRef', () => {
    // 两个 falsy + 一个真 ref ⇒ 过滤后长度 1 ⇒ 原样返回，不包装
    const fn = vi.fn();
    expect(composeRef(null, fn, undefined)).toBe(fn);

    // 一个 falsy + 两个真 ref ⇒ 包装，且遍历的是**原数组**（含 falsy）
    const a = vi.fn();
    const b = vi.fn();
    const composed = composeRef(null, a, b);
    expect(typeof composed).toBe('function');
    expect(() => (composed as (n: null) => void)(null)).not.toThrow();
    expect(a).toHaveBeenCalledWith(null);
    expect(b).toHaveBeenCalledWith(null);
  });

  it('composeRef(fn) 与传入的 fn 共享引用，因此修改后者会反映到前者', () => {
    const fn = vi.fn();
    const composed = composeRef(fn);
    expect(composed).toBe(fn);
  });
});

describe('useComposeRef', () => {
  it('返回 computed；单 ref 时直接复用该函数（不产生新闭包）', () => {
    const fn = vi.fn();
    const merged = useComposeRef<(n: unknown) => void>(() => fn);
    expect(merged.value).toBe(fn);
  });

  it('多个 ref 时合成函数，写入全部', () => {
    const a = vi.fn();
    const b = vi.fn();
    // 泛型用 unknown 而不是函数类型：我们要测的是"载荷被原样传给每个 ref"
    const merged = useComposeRef<unknown>(
      () => a,
      () => b,
    );
    merged.value('x');
    expect(a).toHaveBeenCalledWith('x');
    expect(b).toHaveBeenCalledWith('x');
  });

  it('★ 值未变时复用同一个函数 —— 否则渲染器会多做一轮 ref 往返', () => {
    const tick = ref(0);
    const a = ref<(n: unknown) => void>(() => {});
    const b = ref<(n: unknown) => void>(() => {});
    // 读 tick 只是为了制造一次「重算但值没变」
    const merged = useComposeRef<(n: unknown) => void>(
      () => {
        void tick.value;
        return a.value;
      },
      () => b.value,
    );

    let notifications = 0;
    watch(merged, () => {
      notifications += 1;
    });

    const first = merged.value;
    tick.value += 1;
    void merged.value;

    expect(merged.value).toBe(first);
    // 身份没变 ⇒ computed 不通知 ⇒ 下游不会多跑一轮
    expect(notifications).toBe(0);
  });

  it('ref 身份变化时返回新函数（缓存失效）', () => {
    const a = ref<(n: unknown) => void>(() => {});
    const b = ref<(n: unknown) => void>(() => {});
    const merged = useComposeRef<(n: unknown) => void>(a, b);

    const first = merged.value;
    a.value = () => {};

    expect(merged.value).not.toBe(first);
  });

  it('★ 唯一一个 ref 不是函数时会被包成函数（保证返回值恒为可调用）', () => {
    const target = { value: null as unknown };
    const merged = useComposeRef(target);
    expect(typeof merged.value).toBe('function');

    const node = document.createElement('div');
    merged.value(node);
    expect(target.value).toBe(node);
  });
});

describe('supportRef', () => {
  it('元素 vnode 支持', () => {
    expect(supportRef(h('div'))).toBe(true);
  });

  it('组件 vnode 支持（Vue 侧语义调整：拿到实例后再用 getElement 解析）', () => {
    const Comp = defineComponent({ render: () => h('div') });
    expect(supportRef(createVNode(Comp))).toBe(true);
  });

  it('★ Fragment / Text / Comment vnode 不支持', () => {
    expect(supportRef(createVNode(Fragment, null, [h('div')]))).toBe(false);
    expect(supportRef(createTextVNode('x'))).toBe(false);
    expect(supportRef(createVNode(Comment))).toBe(false);
  });

  it('★ 非 vnode 的 object 一律视为支持（已解析出的实例/元素）', () => {
    expect(supportRef(document.createElement('div'))).toBe(true);
    expect(supportRef({})).toBe(true);
  });

  it('falsy 一律不支持', () => {
    expect(supportRef(null)).toBe(false);
    expect(supportRef(undefined)).toBe(false);
    expect(supportRef(0)).toBe(false);
    expect(supportRef('')).toBe(false);
  });
});

describe('supportNodeRef', () => {
  it('元素 / 组件 vnode 支持', () => {
    expect(supportNodeRef(h('div'))).toBe(true);
    const Comp = defineComponent({ render: () => h('div') });
    expect(supportNodeRef(createVNode(Comp))).toBe(true);
  });

  it('★ 与 supportRef 的区别：入参必须是 vnode，Fragment 被排除', () => {
    const fragment = createVNode(Fragment, null, [h('div')]);
    expect(supportRef(fragment)).toBe(false);
    expect(supportNodeRef(fragment)).toBe(false);

    // 非 vnode 的 object：supportRef 为 true，supportNodeRef 为 false
    expect(supportRef(document.createElement('div'))).toBe(true);
    expect(supportNodeRef(document.createElement('div'))).toBe(false);
  });

  it('Text / Comment / null 不支持', () => {
    expect(supportNodeRef(createTextVNode('x'))).toBe(false);
    expect(supportNodeRef(createVNode(Comment))).toBe(false);
    expect(supportNodeRef(null)).toBe(false);
  });
});

describe('getNodeRef', () => {
  it('元素 vnode → el', () => {
    const vnode = createVNode('div');
    const el = document.createElement('div');
    (vnode as VNode & { el: Element | null }).el = el;
    expect(getNodeRef(vnode)).toBe(el);
  });

  it('组件 vnode → component.proxy（defineExpose 决定它暴露什么）', () => {
    const vnode = createVNode(defineComponent({ render: () => h('div') }));
    const proxy = { exposed: true };
    // 组件实例的形状由 Vue 定义，这里只关心 getNodeRef 把 proxy 原样取出来
    (vnode as unknown as { component: { proxy: unknown } }).component = { proxy };
    expect(getNodeRef(vnode)).toBe(proxy);
  });

  it('组件 vnode 尚未挂载（component 为 null）→ null，不抛错', () => {
    const vnode = createVNode(defineComponent({ render: () => h('div') }));
    expect(getNodeRef(vnode)).toBeNull();
  });

  it('元素 vnode 未挂载（el 为 null）→ null', () => {
    expect(getNodeRef(createVNode('div'))).toBeNull();
  });

  it('非 vnode 入参 → null', () => {
    expect(getNodeRef(null)).toBeNull();
    expect(getNodeRef(undefined)).toBeNull();
    expect(getNodeRef(document.createElement('div') as unknown as VNode)).toBeNull();
  });

  it('泛型参数决定返回类型（编译期），运行期仍是同一个对象', () => {
    const vnode = createVNode('div');
    const el = document.createElement('div');
    (vnode as VNode & { el: Element | null }).el = el;
    const typed = getNodeRef<HTMLDivElement>(vnode);
    expect(typed).toBe(el as unknown as HTMLDivElement);
  });
});
