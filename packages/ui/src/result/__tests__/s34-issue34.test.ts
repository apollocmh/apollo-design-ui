/**
 * Issue #34 · [Result] 空具名插槽无法覆盖同名 Prop
 *
 * `readNamedSlot()` 用 `null` 表示「显式空插槽」、`undefined` 表示「没有插槽」，
 * 但回退写成 `readNamedSlot('title') ?? props.title` —— `??` 把 `null` 也当成
 * 「未提供」⇒ 空插槽反而回退到旧 prop（Issue #34.1）。
 *
 * 覆盖矩阵：无 slot / 有内容 slot / 空 slot / 动态空化 / 动态恢复，title 与
 * subTitle 各一套。
 */

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import {
  Comment,
  type Component,
  createCommentVNode,
  defineComponent,
  h,
  type Ref,
  ref,
} from 'vue';
import { Result } from '../index';

const P = 'apollo-result';

/**
 * 父组件：title/subTitle 插槽内容由 `show` 控制（`v-if` 为假 ⇒ comment vnode）。
 * ⚠️ 必须走**父组件重渲染**这条链路：插槽函数里读 `show`（ref）⇒ Result 内部的
 *    computed 能 track 到 ⇒ 空化/恢复都能驱动重算。
 */
const dynamicParent = (show: Ref<boolean>): Component =>
  defineComponent({
    setup() {
      return () =>
        h(
          Result,
          { title: '旧标题', subTitle: '旧副标题' },
          {
            title: () => (show.value ? h('span', '新标题') : createCommentVNode('v-if', true)),
            subTitle: () => (show.value ? h('em', '新副标题') : createCommentVNode('v-if', true)),
          },
        );
    },
  });

/** 静态空插槽：`null` / `false` / comment —— 都不该回退到 prop。 */
const emptySlotParent = (empty: () => unknown): Component =>
  defineComponent({
    setup() {
      return () =>
        h(Result, { title: '旧标题', subTitle: '旧副标题' }, { title: empty, subTitle: empty });
    },
  });

describe('Result · Issue #34 空插槽不得回退 prop', () => {
  it('[A] 无插槽 ⇒ 用 prop（守卫：基础语义不变）', () => {
    const w = mount(Result, { props: { title: '旧标题', subTitle: '旧副标题' } });
    expect(w.find(`.${P}-title`).text()).toBe('旧标题');
    expect(w.find(`.${P}-subtitle`).text()).toBe('旧副标题');
    w.unmount();
  });

  it('[B] 有内容插槽 ⇒ 覆盖 prop（守卫：slot 优先）', () => {
    const w = mount(Result, {
      props: { title: '旧标题', subTitle: '旧副标题' },
      slots: { title: () => h('span', '新标题'), subTitle: () => h('em', '新副标题') },
    });
    expect(w.find(`.${P}-title`).text()).toBe('新标题');
    expect(w.find(`.${P}-subtitle`).text()).toBe('新副标题');
    w.unmount();
  });

  it('[C1] 空插槽（v-if false ⇒ comment）⇒ 不回退 prop，容器也不渲染', () => {
    const w = mount(emptySlotParent(() => createCommentVNode('v-if', true)));
    expect(w.find(`.${P}-title`).exists()).toBe(false);
    expect(w.find(`.${P}-subtitle`).exists()).toBe(false);
    w.unmount();
  });

  it('[C2] 空插槽（返回 null）⇒ 不回退 prop', () => {
    const w = mount(emptySlotParent(() => null));
    expect(w.find(`.${P}-title`).exists()).toBe(false);
    expect(w.find(`.${P}-subtitle`).exists()).toBe(false);
    w.unmount();
  });

  it('[C3] 空插槽（返回 false）⇒ 不回退 prop', () => {
    const w = mount(emptySlotParent(() => false));
    expect(w.find(`.${P}-title`).exists()).toBe(false);
    expect(w.find(`.${P}-subtitle`).exists()).toBe(false);
    w.unmount();
  });

  it('[D] 动态空化：show true → false 时不回退旧标题（核心回归）', async () => {
    const show = ref(true);
    const w = mount(dynamicParent(show));
    expect(w.find(`.${P}-title`).text()).toBe('新标题');
    expect(w.find(`.${P}-subtitle`).text()).toBe('新副标题');

    show.value = false;
    await w.vm.$nextTick();

    // 空插槽是「显式覆盖」⇒ 既不能显示旧标题，也不能显示空容器
    expect(w.find(`.${P}-title`).exists()).toBe(false);
    expect(w.find(`.${P}-subtitle`).exists()).toBe(false);
    expect(w.html()).not.toContain('旧标题');
    expect(w.html()).not.toContain('旧副标题');
    w.unmount();
  });

  it('[E] 动态恢复：show false → true 时新标题回来', async () => {
    const show = ref(false);
    const w = mount(dynamicParent(show));
    expect(w.find(`.${P}-title`).exists()).toBe(false);

    show.value = true;
    await w.vm.$nextTick();

    expect(w.find(`.${P}-title`).text()).toBe('新标题');
    expect(w.find(`.${P}-subtitle`).text()).toBe('新副标题');
    w.unmount();
  });

  it('[F] 守卫：#extra / #icon 的“无插槽”语义不受影响', () => {
    const w = mount(Result, {
      props: { title: 'T' },
      slots: { extra: () => createCommentVNode('v-if', true), icon: () => null },
    });
    expect(w.find(`.${P}-extra`).exists()).toBe(false);
    // 空 icon 插槽 ⇒ 覆盖默认图标（antd 同理：显式给空就不画）
    expect(w.find(`.${P}-icon`).exists()).toBe(false);
    w.unmount();
  });

  it('[G] 守卫：Comment 类型的空 slot 与 Text 空串等价处理', () => {
    const w = mount(Result, {
      props: { title: '旧标题' },
      slots: { title: () => [h(Comment)] },
    });
    expect(w.find(`.${P}-title`).exists()).toBe(false);
    w.unmount();
  });
});
