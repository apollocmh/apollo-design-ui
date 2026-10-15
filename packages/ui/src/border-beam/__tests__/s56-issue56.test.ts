/**
 * Issue #56 · [BorderBeam] 重建宿主 VNode 的透传契约（端到端验证）
 *
 * 上游做法（antd 6.6.4 `es/border-beam/hooks/useChildDom.js` + `BorderBeam.js`）：
 * `cloneElement(childNode, { ref: mergedRef })` —— **克隆**子节点（保留其 children / props
 * / key / 类型），再用 `createPortal(effect, domNode)` 把 Effect 插进宿主的 DOM 内部。
 * 「克隆」是关键：**子节点的一切都原样保留**。
 *
 * 本仓的等价做法是 `createVNode(first.type, {...hostProps}, newChildren)` —— 同型重建。
 * 问题在于：**子节点的内容若来自 slot，`first.children` 是一个 slots 对象**，
 * 被折成数组后 `createVNode(Comp, props, [slotsObj])` 会走 ARRAY_CHILDREN 而不是
 * SLOTS_CHILDREN ⇒ 组件拿不到插槽（内容丢失）、插进去的 Effect 也不落 DOM。
 *
 * 本文件把这个契约按「DOM 子节点 / 组件子节点（含 slot）/ Fragment / 纯文本」四类钉住。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, Fragment, h, nextTick } from 'vue';

import BorderBeam from '../BorderBeam';

const P = 'apollo-border-beam';

const effectCount = (el: HTMLElement | null) => (el ? el.querySelectorAll(`.${P}`).length : 0);

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
    });
    await nextTick();

    const host = w.element as HTMLElement;
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
    });
    await nextTick();

    const host = w.element as HTMLElement;
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
    });
    await nextTick();
    expect(frag.html()).not.toContain(P);

    const text = mount(BorderBeam, {
      slots: { default: () => 'plain' },
      attachTo: document.body,
    });
    await nextTick();
    expect(text.text()).toContain('plain');
  });
});
