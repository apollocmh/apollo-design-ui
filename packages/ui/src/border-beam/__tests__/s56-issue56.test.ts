/**
 * Issue #56 · [BorderBeam] 重建宿主 VNode 的透传契约（端到端验证）
 *
 * 上游做法（antd 6.6.4 `es/border-beam/hooks/useChildDom.js` + `BorderBeam.js`）：
 * `cloneElement(childNode, { ref: mergedRef })` —— **克隆**子节点（保留其 children / props
 * / key / 类型），再用 `createPortal(effect, domNode)` 把 Effect 插进宿主的 DOM 内部。
 * 「克隆」是关键：**子节点的一切都原样保留**。
 *
 * 本仓的等价做法：`createVNode(first.type, {...hostProps}, first.children)` 同型重建 +
 * `<Teleport :to="hostDom">` —— 与上迁 `createPortal` 逐字等价。
 *
 * ⚠️ 曾走过的弯路（**不要把 Effect 并进宿主的 children**）：
 *   1. 组件子节点的 `children` 是 **slots 对象**，打包成数组后
 *      `createVNode(Comp, props, [slotsObj])` 走 ARRAY_CHILDREN 而不是 SLOTS_CHILDREN
 *      ⇒ 组件拿不到插槽（内容整块丢失，语义用例 `.inner` 找不到）；
 *   2. 组件**没有 `default` 插槽**时根本无处注入 ⇒ Effect 不渲染（而上游 portal 不受此限）。
 *   children 注入是「实现形态」的差异，不是「行为差异」—— 用 Teleport 才能逐字对齐。
 *
 * 本文件把这个契约按「DOM 子节点 / 组件子节点（有插槽、无插槽）/ Fragment / 纯文本」
 * 以及「动态宿主切换 / 卸载」钉住。
 *
 * ⚠️ 必须 `global: { stubs: { teleport: false } }` —— 仓库全局把 Teleport 换成了
 *    teleport-stub（`vitest.setup.ts`），stub 会把内容渲染到**原地**（宿主的兄弟节点），
 *    断言「Effect 在宿主 DOM 内部」会假绿。
 */

import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, Fragment, h, nextTick, ref } from 'vue';

import BorderBeam from '../BorderBeam';

const P = 'apollo-border-beam';

const effectCount = (el: HTMLElement | null) => (el ? el.querySelectorAll(`.${P}`).length : 0);

/**
 * 拿宿主元素。
 *
 * ⚠️ 本组件的根是 Fragment（宿主 vnode + Teleport）⇒ VTU 判定为「多根」，
 *    `w.element` 退化为**父容器**而不是宿主（VTU `hasMultipleRoots ? parentElement`）
 *    ⇒ 必须从容器里再查一次。
 */
const hostOf = (w: VueWrapper, selector: string): HTMLElement => {
  const root = w.element as HTMLElement | null;
  const found =
    (root?.querySelector?.(selector) as HTMLElement | null) ??
    (document.querySelector(selector) as HTMLElement | null);
  if (!found) throw new Error(`[s56] 找不到宿主元素：${selector}`);
  return found;
};

/** Teleport 需要真实的 portal 语义（见文件头）。 */
const REAL_PORTAL = { global: { stubs: { teleport: false } } };

/** hostDom 在挂载后的下一次渲染才拿到 ⇒ 多刷一帧。 */
const flush = async () => {
  await nextTick();
  await nextTick();
};

describe('BorderBeam · Issue #56 宿主透传契约', () => {
  it('[A] DOM 子节点：attrs / class / style / 原生事件 / ref / key 都落到宿主', async () => {
    const onHostClick = vi.fn();
    const hostRef = vi.fn();
    const w = mount(BorderBeam, {
      attrs: { 'data-probe': '1', 'aria-label': 'beam' },
      slots: {
        default: () =>
          h('div', {
            class: 'host-class',
            style: { color: 'red' },
            ref: hostRef,
            key: 'host-key',
            onClick: onHostClick,
          }),
      },
      attachTo: document.body,
      ...REAL_PORTAL,
    });
    await flush();

    const host = hostOf(w, '.host-class');
    // attrs 落到宿主
    expect(host.getAttribute('data-probe')).toBe('1');
    expect(host.getAttribute('aria-label')).toBe('beam');
    // class **叠加**（宿主原有 class 不被顶掉）
    expect(host.classList.contains('host-class')).toBe(true);
    // 宿主自己的 style 保留
    expect(host.style.color).toBe('red');
    // ref 透传（函数 ref 被调用）
    expect(hostRef).toHaveBeenCalled();
    expect(hostRef.mock.calls.at(-1)?.[0]).toBe(host);
    // 宿主自己的事件仍可触发
    host.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onHostClick).toHaveBeenCalled();
    // Effect 追加在宿主内部
    expect(effectCount(host)).toBe(1);
  });

  it('[B] 组件子节点（内容经 slot）：内容保留 + Effect 落在组件 DOM 内', async () => {
    const Child = defineComponent({
      name: 'Child',
      props: { foo: { type: String, default: undefined } },
      setup(props, { slots }) {
        return () => h('div', { class: 'child-root', 'data-foo': props.foo }, slots.default?.());
      },
    });

    const w = mount(BorderBeam, {
      attrs: { 'data-probe': '2' },
      slots: { default: () => h(Child, { foo: 'bar' }, () => h('span', { class: 'inner' }, 'X')) },
      attachTo: document.body,
      ...REAL_PORTAL,
    });
    await flush();

    const host = hostOf(w, '.child-root');
    expect(host.classList.contains('child-root')).toBe(true);
    // ① 内容（经 slot 传进子组件）必须保留
    expect(w.find('.inner').exists()).toBe(true);
    // ② 子组件自己的 props 不受影响
    expect(host.getAttribute('data-foo')).toBe('bar');
    // ③ 调用方 attrs 落到组件渲染出的根元素
    expect(host.getAttribute('data-probe')).toBe('2');
    // ④ Effect 落在组件 DOM 内部
    expect(effectCount(host)).toBe(1);
  });

  it('[C] Fragment / 纯文本子节点：原样透传，不渲染 Effect（宿主不可用）', async () => {
    const frag = mount(BorderBeam, {
      slots: { default: () => h(Fragment, null, [h('span', 'a'), h('span', 'b')]) },
      attachTo: document.body,
      ...REAL_PORTAL,
    });
    await flush();
    expect(frag.html()).not.toContain(P);

    const text = mount(BorderBeam, {
      slots: { default: () => 'plain' },
      attachTo: document.body,
      ...REAL_PORTAL,
    });
    await flush();
    expect(text.text()).toContain('plain');
  });

  /**
   * [D] **核心回归**：组件子节点**没有 `default` 插槽** ⇒ 也要画流光。
   *
   * 旧实现把 Effect 并进宿主的 children ⇒ 组件不声明 / 不渲染 default 插槽时**无处注入**，
   * Effect 静默消失（上游 `createPortal` 不受此限 —— 属于「复制实现形态、丢了行为」）。
   */
  it('[D] 组件子节点没有 default 插槽：Effect 仍渲染在组件根 DOM 内', async () => {
    const SolidBox = defineComponent({
      name: 'SolidBox',
      setup() {
        // 完全没有插槽：children 恒为 null，任何 children 注入都会被丢掉
        return () => h('div', { class: 'solid-box' }, 'no slot at all');
      },
    });

    const w = mount(BorderBeam, {
      slots: { default: () => h(SolidBox) },
      attachTo: document.body,
      ...REAL_PORTAL,
    });
    await flush();

    const host = hostOf(w, '.solid-box');
    expect(host.classList.contains('solid-box')).toBe(true);
    // 组件自身内容完好
    expect(host.textContent).toContain('no slot at all');
    // 🚨 Effect 必须在宿主 DOM 内部（旧实现这里为 0）
    expect(effectCount(host)).toBe(1);
  });

  /** [D2] 只有**具名插槽**、没有 default 插槽（slots 对象形态，旧实现也会丢）。 */
  it('[D2] 组件子节点只有具名插槽：Effect 仍渲染在组件根 DOM 内', async () => {
    const Card = defineComponent({
      name: 'Card',
      setup(_props, { slots }) {
        return () =>
          h('div', { class: 'card' }, [h('header', { class: 'card-title' }, slots.title?.())]);
      },
    });

    const w = mount(BorderBeam, {
      slots: { default: () => h(Card, null, { title: () => 'T' }) },
      attachTo: document.body,
      ...REAL_PORTAL,
    });
    await flush();

    const host = hostOf(w, '.card');
    expect(host.classList.contains('card')).toBe(true);
    // 具名插槽内容保留
    expect(host.querySelector('.card-title')?.textContent).toBe('T');
    expect(effectCount(host)).toBe(1);
  });

  /**
   * [E] **动态宿主切换**：宿主换成一个新元素时，Effect 必须**搬过去**，
   *     旧宿主里不留残骸（Teleport 的 `to` 变换由 Vue 的 TARGET_CHANGE 处理）。
   */
  it('[E] 动态宿主切换：Effect 跟着搬到新宿主，旧宿主不留残骸', async () => {
    const which = ref<'a' | 'b'>('a');
    const w = mount(
      {
        setup() {
          return () =>
            h(BorderBeam, {}, () =>
              h('div', { class: `host-${which.value}`, key: which.value }, 'x'),
            );
        },
      },
      { attachTo: document.body, ...REAL_PORTAL },
    );
    await flush();

    const hostA = document.querySelector('.host-a') as HTMLElement;
    expect(hostA).not.toBeNull();
    expect(effectCount(hostA)).toBe(1);
    // 全文档只有一份 Effect（没有残骸）
    expect(document.querySelectorAll(`.${P}`).length).toBe(1);

    which.value = 'b';
    await flush();

    // 旧宿主已卸载
    expect(document.querySelector('.host-a')).toBeNull();
    const hostB = document.querySelector('.host-b') as HTMLElement;
    expect(hostB).not.toBeNull();
    expect(effectCount(hostB)).toBe(1);
    // 🚨 仍然只有一份 Effect（旧宿主那份被搬走而不是复制）
    expect(document.querySelectorAll(`.${P}`).length).toBe(1);

    w.unmount();
  });

  /** [F] **卸载**：Teleport 的内容必须从宿主 DOM 里摘干净（不留孤儿节点）。 */
  it('[F] 卸载：Effect 从宿主 DOM 移除', async () => {
    const w = mount(BorderBeam, {
      slots: { default: () => h('div', { class: 'doomed' }, 'x') },
      attachTo: document.body,
      ...REAL_PORTAL,
    });
    await flush();
    const host = hostOf(w, '.doomed');
    expect(effectCount(host)).toBe(1);

    w.unmount();
    expect(effectCount(host)).toBe(0);
    expect(document.querySelectorAll(`.${P}`).length).toBe(0);
  });
});
