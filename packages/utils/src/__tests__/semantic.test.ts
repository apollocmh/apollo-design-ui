import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref, useAttrs } from 'vue';
import pickAttrs from '../pick-attrs';

/**
 * L4 DOM 契约层（`dom-contract` project）。
 *
 * 这一层的职责与 L1 单元测试不同：**不测函数返回值，测真实 DOM 上的可观测结果**。
 * `pick-attrs.test.ts` 断言了输出的键名形态；这里断言"绑上去之后事件到底会不会触发"。
 *
 * 主题是 F1：Vue 的 `runtime-dom` 不做 React 那样的合成事件名归一化。
 * 三个形态在真实元素上的行为（已实测）：
 *
 *   | 绑定的键      | trigger('keydown') | Vue 实际走的路径                  |
 *   |--------------|--------------------|-----------------------------------|
 *   | `onKeyDown`  | **不触发**          | `addEventListener('key-down')`     |
 *   | `onkeydown`  | 触发                | `el.onkeydown = fn`（DOM0 属性）   |
 *   | `onKeydown`  | 触发                | `addEventListener('keydown')` ✅   |
 *
 * 我们选第三个。本文件同时锁定「为什么不选另两个」的证据。
 */

function mountInput(props: Record<string, unknown>) {
  const Comp = defineComponent({
    setup: () => () => h('input', pickAttrs(props, { attr: true })),
  });
  return mount(Comp);
}

describe('F1 反向验证：React 原名在 Vue 里静默失效', () => {
  it('★ 直接绑 `onKeyDown` 不会在 keydown 时触发', async () => {
    const handler = vi.fn();
    const Comp = defineComponent({ setup: () => () => h('input', { onKeyDown: handler }) });
    const wrapper = mount(Comp);

    await wrapper.find('input').trigger('keydown');
    expect(handler).not.toHaveBeenCalled();

    // 而它实际监听的是 hyphenate 之后的 'key-down'
    await wrapper.find('input').trigger('key-down');
    expect(handler).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it('★ 直接绑 `onDoubleClick` 不会在 dblclick 时触发', async () => {
    const handler = vi.fn();
    const Comp = defineComponent({ setup: () => () => h('input', { onDoubleClick: handler }) });
    const wrapper = mount(Comp);

    await wrapper.find('input').trigger('dblclick');
    expect(handler).not.toHaveBeenCalled();

    await wrapper.find('input').trigger('double-click');
    expect(handler).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it('★ `rawEventNames: true` 的输出在真实元素上依然失效（证明这条 deviation 是必需的）', async () => {
    const handler = vi.fn();
    const Comp = defineComponent({
      setup: () => () =>
        h('input', pickAttrs({ onKeyDown: handler }, { attr: true, rawEventNames: true })),
    });
    const wrapper = mount(Comp);

    await wrapper.find('input').trigger('keydown');
    expect(handler).not.toHaveBeenCalled();

    wrapper.unmount();
  });
});

describe('F1 正向验证：pickAttrs 的输出在真实元素上生效', () => {
  it('★ `onKeyDown` → 绑到元素后 keydown 触发', async () => {
    const handler = vi.fn();
    const wrapper = mountInput({ onKeyDown: handler });

    await wrapper.find('input').trigger('keydown', { key: 'Enter' });
    expect(handler).toHaveBeenCalledTimes(1);

    const event = handler.mock.calls[0]?.[0] as KeyboardEvent;
    expect(event.type).toBe('keydown');
    expect(event.key).toBe('Enter');

    wrapper.unmount();
  });

  it('★ `onDoubleClick` → 改写成 onDblclick 后 dblclick 真的触发', async () => {
    const handler = vi.fn();
    const wrapper = mountInput({ onDoubleClick: handler });

    await wrapper.find('input').trigger('dblclick');
    expect(handler).toHaveBeenCalledTimes(1);

    // 反向：不应该监听到 'double-click'
    await wrapper.find('input').trigger('double-click');
    expect(handler).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it('★ `onDragExit` → 改写成 onDragleave 后 dragleave 真的触发（DOM 没有 dragexit 事件）', async () => {
    const handler = vi.fn();
    const wrapper = mountInput({ onDragExit: handler });

    await wrapper.find('input').trigger('dragleave');
    expect(handler).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it('多词事件名逐个验证：onMouseEnter / onTouchStart / onCompositionStart / onGotPointerCapture', async () => {
    const cases: [string, string][] = [
      ['onMouseEnter', 'mouseenter'],
      ['onTouchStart', 'touchstart'],
      ['onCompositionStart', 'compositionstart'],
      ['onGotPointerCapture', 'gotpointercapture'],
      ['onBeforeInput', 'beforeinput'],
      ['onContextMenu', 'contextmenu'],
      ['onAnimationIteration', 'animationiteration'],
      ['onPointerDown', 'pointerdown'],
    ];

    for (const [reactName, nativeEvent] of cases) {
      const handler = vi.fn();
      const wrapper = mountInput({ [reactName]: handler });

      await wrapper.find('input').trigger(nativeEvent);
      expect(handler, `${reactName} 未能响应 ${nativeEvent}`).toHaveBeenCalledTimes(1);

      wrapper.unmount();
    }
  });

  it('单单词事件名本来就对，不需要改写', async () => {
    const cases: [string, string][] = [
      ['onClick', 'click'],
      ['onInput', 'input'],
      ['onFocus', 'focus'],
      ['onBlur', 'blur'],
      ['onChange', 'change'],
    ];

    for (const [reactName, nativeEvent] of cases) {
      const handler = vi.fn();
      const wrapper = mountInput({ [reactName]: handler });

      await wrapper.find('input').trigger(nativeEvent);
      expect(handler, `${reactName} 未能响应 ${nativeEvent}`).toHaveBeenCalledTimes(1);

      wrapper.unmount();
    }
  });

  it('★ 同时绑多个事件互不干扰', async () => {
    const onKeyDown = vi.fn();
    const onMouseEnter = vi.fn();
    const onClick = vi.fn();
    const wrapper = mountInput({ onKeyDown, onMouseEnter, onClick });

    await wrapper.find('input').trigger('keydown');
    await wrapper.find('input').trigger('mouseenter');
    await wrapper.find('input').trigger('click');

    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(onMouseEnter).toHaveBeenCalledTimes(1);
    expect(onClick).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });
});

describe('为什么不用 DOM0 形态（onkeydown）', () => {
  it('★ DOM0 同一元素同一事件只有一个槽位 —— 后写覆盖先写', () => {
    const first = vi.fn();
    const second = vi.fn();
    const input = document.createElement('input');

    input.onkeydown = first;
    input.onkeydown = second;
    input.dispatchEvent(new KeyboardEvent('keydown'));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('对照：addEventListener 允许并存 —— Vue 对 `onKeydown` 走的就是这条', () => {
    const first = vi.fn();
    const second = vi.fn();
    const input = document.createElement('input');

    input.addEventListener('keydown', first);
    input.addEventListener('keydown', second);
    input.dispatchEvent(new KeyboardEvent('keydown'));

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('★ Vue 对 `onKeydown` 走 addEventListener：DOM0 槽位保持空闲，两种机制可并存', async () => {
    const handler = vi.fn();
    const Comp = defineComponent({ setup: () => () => h('input', { onKeydown: handler }) });
    const wrapper = mount(Comp);
    const el = wrapper.find('input').element as HTMLInputElement;

    // ⚠️ 不要去读 Vue 内部的 invoker 注册表：Vue 3.5 起它的键是 `Symbol("_vei")`，
    //    不再是 `el._vei`。断言内部结构会随版本失效，所以这里只断言**可观测后果**。
    expect(el.onkeydown).toBeNull();

    // DOM0 槽位空着 ⇒ 组件内部/用户仍可安全使用 el.onkeydown，且两者互不覆盖
    const dom0 = vi.fn();
    el.onkeydown = dom0;
    await wrapper.find('input').trigger('keydown');

    expect(handler).toHaveBeenCalledTimes(1);
    expect(dom0).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });
});

describe('非事件属性仍然落到真实 DOM 上', () => {
  it('普通属性变成 attribute', () => {
    const wrapper = mountInput({ title: 'hello', id: 'my-input', tabIndex: 3 });

    const el = wrapper.find('input').element as HTMLInputElement;
    expect(el.getAttribute('title')).toBe('hello');
    expect(el.id).toBe('my-input');

    wrapper.unmount();
  });

  it('aria-* / role 落到真实 DOM 上', () => {
    const Comp = defineComponent({
      setup: () => () =>
        h('input', pickAttrs({ role: 'textbox', 'aria-label': 'name' }, { aria: true })),
    });
    const wrapper = mount(Comp);

    const el = wrapper.find('input').element as HTMLInputElement;
    expect(el.getAttribute('role')).toBe('textbox');
    expect(el.getAttribute('aria-label')).toBe('name');

    wrapper.unmount();
  });

  it('data-* 落到真实 DOM 上', () => {
    const Comp = defineComponent({
      setup: () => () => h('input', pickAttrs({ 'data-testid': 'x' }, { data: true })),
    });
    const wrapper = mount(Comp);

    expect(wrapper.find('input').attributes('data-testid')).toBe('x');

    wrapper.unmount();
  });
});

describe('★ 展开到组件（而不是元素）时依然生效', () => {
  it('pickAttrs 结果作为 prop 传给组件，经 $attrs 转发到内层元素后事件仍触发', async () => {
    const handler = vi.fn();

    // 内层组件：把 $attrs 原样透传给真实元素（antd 组件的通用模式）
    const Inner = defineComponent({
      name: 'Inner',
      inheritAttrs: false,
      setup() {
        const attrs = useAttrs();
        return () => h('input', attrs);
      },
    });

    const Comp = defineComponent({
      setup: () => () => h(Inner, pickAttrs({ onKeyDown: handler, title: 't' }, { attr: true })),
    });

    const wrapper = mount(Comp);
    await wrapper.find('input').trigger('keydown');

    expect(handler).toHaveBeenCalledTimes(1);
    expect(wrapper.find('input').attributes('title')).toBe('t');

    wrapper.unmount();
  });

  it('★ 反证：DOM0 形态经组件转发后占用唯一槽位，后续写入会静默顶掉前一个', async () => {
    const first = vi.fn();
    const second = vi.fn();

    const Inner = defineComponent({
      name: 'Inner',
      inheritAttrs: false,
      setup() {
        const attrs = useAttrs();
        return () => h('input', attrs);
      },
    });

    const handler = ref<(e: Event) => void>(first);
    const Comp = defineComponent({
      setup: () => () => h(Inner, { onkeydown: handler.value }),
    });

    const wrapper = mount(Comp);
    const el = wrapper.find('input').element as HTMLInputElement;
    expect(el.onkeydown).toBe(first);

    // 重新渲染换一个处理器 → DOM0 槽位被直接覆盖，first 永久丢失
    handler.value = second;
    await nextTick();
    expect(el.onkeydown).toBe(second);
    expect(el.onkeydown).not.toBe(first);

    await wrapper.find('input').trigger('keydown');
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });
});
