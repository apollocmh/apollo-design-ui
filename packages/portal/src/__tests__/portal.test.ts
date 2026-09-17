/**
 * L2 —— `Portal` 组件：内容到底渲染到哪、渲染几次。
 *
 * 这一层钉的是 `Portal.js:75-92` 的渲染分支，其中有一条是**照抄 antd 的噪音行为**
 * （内联渲染时仍会 append 一个空默认容器），用专门的用例钉住，避免后人当 bug 修掉。
 */

import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, onMounted, ref } from 'vue';

import { Portal, portalInlineMock, resetPortalInlineMock } from '../index';

const wrappers: VueWrapper[] = [];

afterEach(() => {
  while (wrappers.length) {
    wrappers.pop()?.unmount();
  }
  resetPortalInlineMock();
  for (const el of Array.from(document.body.children)) {
    if (el.tagName === 'DIV' && !el.hasAttribute('id') && el.children.length === 0) {
      // 只清本用例可能留下的空默认容器
      el.remove();
    }
  }
});

const CONTENT = '[data-content]';

interface ContentProbe {
  mounted: number;
  /** 首次挂载时的父节点 —— 这才是「有没有先进默认容器」的判据 */
  firstParent: Element | null;
}

/**
 * 内容组件，记录被挂载的次数与首次挂载时的父节点。
 *
 * ⚠️ 为什么记「首次父节点」而不是「挂载次数」：Vue 的 `<Teleport>` 在 `to` 变化时
 *    是**移动**已有节点，不会重新挂载 —— 所以「先渲染进默认容器再搬走」这个错误
 *    用挂载次数根本测不出来（两种实现都是 1 次），只有父节点会露馅。
 */
function createContent(counter: ContentProbe) {
  return defineComponent({
    name: 'PortalContent',
    setup() {
      const el = ref<HTMLElement>();
      onMounted(() => {
        counter.mounted += 1;
        counter.firstParent ??= el.value?.parentElement ?? null;
      });
      return () => h('p', { ref: el, 'data-content': '' });
    },
  });
}

/**
 * ⚠️ 必须关掉 Teleport 打桩：VTU 默认把 `<Teleport>` 渲染成 `<teleport-stub>`，
 *    内容留在原地 —— 那样「内容到底进没进容器」根本测不出来。
 */
const NO_TELEPORT_STUB = { global: { stubs: { teleport: false } } } as const;

function mountPlain(props: Record<string, unknown>) {
  const wrapper = mount(Portal, {
    props: props as never,
    slots: { default: () => h('p', { 'data-content': '' }) },
    ...NO_TELEPORT_STUB,
  });
  wrappers.push(wrapper);
  return wrapper;
}

describe('Portal 的渲染分支', () => {
  it('open=false ⇒ 什么都不渲染', async () => {
    const wrapper = mountPlain({ open: false });
    await nextTick();
    expect(wrapper.html()).not.toContain('data-content');
    expect(document.body.querySelector(CONTENT)).toBeNull();
  });

  it('open=true ⇒ 内容出现在 body 的默认容器里，不在原地', async () => {
    const wrapper = mountPlain({ open: true });
    await nextTick();
    expect(wrapper.find(CONTENT).exists()).toBe(false);
    const node = document.body.querySelector(CONTENT);
    expect(node).not.toBeNull();
    // 默认容器是**裸 div**，没有 class
    expect(node?.parentElement?.tagName).toBe('DIV');
    expect(node?.parentElement?.getAttribute('class')).toBeNull();
  });

  it('open=true ⇒ 默认容器挂到了 body（不是游离节点）', async () => {
    mountPlain({ open: true });
    await nextTick();
    const node = document.body.querySelector(CONTENT);
    expect(document.body.contains(node?.parentElement ?? null)).toBe(true);
  });

  it('getContainer 给元素 ⇒ 内容渲染进它', async () => {
    const holder = document.createElement('aside');
    document.body.appendChild(holder);
    try {
      mountPlain({ open: true, getContainer: () => holder });
      await nextTick();
      expect(holder.querySelector(CONTENT)).not.toBeNull();
    } finally {
      holder.remove();
    }
  });

  it('getContainer 给 false ⇒ 内联渲染（内容留在原地）', async () => {
    const wrapper = mountPlain({ open: true, getContainer: () => false });
    await nextTick();
    expect(wrapper.find(CONTENT).exists()).toBe(true);
    expect(document.body.querySelector(CONTENT)).toBeNull();
  });

  it('⭐ 内联时 antd 仍会 append 一个**空**默认容器 —— 照抄的噪音，别顺手删', async () => {
    // `useDom(mergedRender && !innerContainer, ...)`：innerContainer 为 `false` 时
    // `!innerContainer` 是 true ⇒ 仍然创建并 append 默认容器，尽管它根本不会被用到。
    // 这是 antd 的真实行为。改成不 append 就会与上游产生 DOM 差异。
    mountPlain({ open: true, getContainer: () => false });
    await nextTick();
    const empties = Array.from(document.body.children).filter(
      (el) => el.tagName === 'DIV' && el.children.length === 0,
    );
    expect(empties.length).toBeGreaterThan(0);
  });

  it('portalInlineMock(true) ⇒ 内联；reset 后恢复', async () => {
    expect(portalInlineMock(true)).toBe(true);
    try {
      const wrapper = mountPlain({ open: true });
      await nextTick();
      expect(wrapper.find(CONTENT).exists()).toBe(true);
      expect(document.body.querySelector(CONTENT)).toBeNull();
    } finally {
      resetPortalInlineMock();
    }
    expect(portalInlineMock()).toBe(false);
  });

  it('关闭 ⇒ 内容从 DOM 消失（autoDestroy 默认 true）', async () => {
    const wrapper = mountPlain({ open: true });
    await nextTick();
    expect(document.body.querySelector(CONTENT)).not.toBeNull();

    await wrapper.setProps({ open: false });
    await nextTick();
    expect(document.body.querySelector(CONTENT)).toBeNull();
  });

  it('autoDestroy=false ⇒ 关闭后内容仍在', async () => {
    const wrapper = mountPlain({ open: true, autoDestroy: false });
    await nextTick();
    await wrapper.setProps({ open: false });
    await nextTick();
    expect(document.body.querySelector(CONTENT)).not.toBeNull();
  });
});

describe('⭐ 未就绪态：getContainer 依赖模板 ref', () => {
  it('内容只挂载**一次**，且最终落在目标容器里', async () => {
    // 这是 `Portal.js:77` 注释要防的场景。若 `resolveContainer` 把 undefined 归一成 null，
    // 首帧就会渲染进默认容器，等 ref 就位后再搬一次家 ⇒ 挂载两次、动画重启、焦点丢失。
    const counter: ContentProbe = { mounted: 0, firstParent: null };
    const Content = createContent(counter);
    const box = ref<HTMLElement>();

    const Host = defineComponent({
      name: 'RefHost',
      setup() {
        return () =>
          h('div', [
            h('section', { ref: box, 'data-holder': '' }),
            h(Portal, { open: true, getContainer: () => box.value }, { default: () => h(Content) }),
          ]);
      },
    });

    const wrapper = mount(Host, NO_TELEPORT_STUB);
    wrappers.push(wrapper);
    await nextTick();

    expect(counter.mounted).toBe(1);
    // ⚠️ 不能用 `document.querySelector`：VTU 默认把组件挂在一个**游离**元素上，
    //    Host 自己渲染的 `<section>` 并不在 document 里。
    const holder = box.value;
    expect(holder).toBeTruthy();
    const node = holder?.querySelector(CONTENT) ?? null;
    expect(node).not.toBeNull();
    expect(node?.parentElement).toBe(holder);
    // ⭐ 真正的判据：内容**从一开始**就在目标容器里，没有先落默认容器再搬家
    expect(counter.firstParent).toBe(holder);
    // 默认容器不该被 append 到 body
    expect(Array.from(document.body.children).some((el) => el.querySelector(CONTENT))).toBe(false);
  });
});
