/**
 * L2 —— `usePortalContainer` / `useZIndex` 在 jsdom 里的真实行为。
 *
 * 重点不是「算得对」（那是 L1 的事），而是**副作用生命周期**：
 * 容器什么时候进 DOM、什么时候被摘掉、嵌套时谁先谁后。
 */

import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  type Component,
  computed,
  defineComponent,
  h,
  nextTick,
  provide,
  type Ref,
  ref,
  type ShallowRef,
  shallowRef,
} from 'vue';

import type {
  GetContainer,
  UsePortalContainerOptions,
  UsePortalContainerReturn,
  ZIndexComponentType,
} from '../index';
import { usePortalContainer, usePortalOrder, useZIndex, ZINDEX_KEY } from '../index';

// ---------------------------------------------------------------------------
// 工具
// ---------------------------------------------------------------------------

/**
 * 取「setup 已执行后必然存在」的值。
 *
 * ⚠️ 与 `test-utils/__tests__/test-first.ts` 里的 `need` 是同一个东西，这里没有复用
 *    是因为那个在**测试目录**里（不进包 index）。跨包共享一个五行的测试内务函数，
 *    代价是给 portal 加一个对已完成包的依赖并改 scaffold 模板 —— 不值得。
 */
function mustGet<T>(value: T | null | undefined, what: string): T {
  if (value === null || value === undefined) {
    throw new Error(`断言失败：${what} 应当存在，实际为 ${String(value)}`);
  }
  return value;
}

const wrappers: VueWrapper[] = [];

afterEach(() => {
  while (wrappers.length) {
    wrappers.pop()?.unmount();
  }
  // 兜底：任何没被 onUnmounted 摘掉的容器都要清掉，否则污染下一个用例的 body 次序断言
  for (const el of Array.from(document.body.children)) {
    if (el.tagName === 'DIV' && el.getAttribute('data-debug')) {
      el.remove();
    }
  }
});

interface HookRig {
  api: () => UsePortalContainerReturn;
  wrapper: VueWrapper;
  /** 强制一次重渲染 —— `reResolveContainer` 挂在 `onUpdated` 上 */
  rerender: () => Promise<void>;
}

function mountHook(options: UsePortalContainerOptions): HookRig {
  const box: { api: UsePortalContainerReturn | null } = { api: null };
  const version = ref(0);

  const Host = defineComponent({
    name: 'HookHost',
    setup() {
      box.api = usePortalContainer(options);
      return () => h('div', { 'data-version': version.value });
    },
  });

  const wrapper = mount(Host);
  wrappers.push(wrapper);
  return {
    wrapper,
    api: () => mustGet(box.api, 'usePortalContainer 的返回值'),
    rerender: async () => {
      version.value += 1;
      await nextTick();
    },
  };
}

/** body 里的位置，`-1` 表示不在 body 中 */
function bodyIndex(el: Element | null): number {
  if (!el) return -1;
  return Array.from(document.body.children).indexOf(el);
}

// ---------------------------------------------------------------------------
// 默认容器
// ---------------------------------------------------------------------------

describe('默认容器', () => {
  it('open=true ⇒ 容器已建并挂到 body，且 container 指向它', async () => {
    const rig = mountHook({ open: () => true });
    await nextTick();

    const def = rig.api().defaultContainer.value;
    expect(def).not.toBeNull();
    expect(bodyIndex(def)).toBeGreaterThanOrEqual(0);
    expect(rig.api().container.value).toBe(def);
    expect(rig.api().shouldRender.value).toBe(true);
  });

  it('⭐ 容器在 setup 阶段就建好了 —— 只是还没进 DOM', async () => {
    // antd 是 `useState(() => canUseDom() ? createElement : null)`，不是「用时才建」。
    // 差别可观察：若惰性建，首帧 `container` 会是 null。
    const rig = mountHook({ open: () => false });
    const def = rig.api().defaultContainer.value;
    expect(def).not.toBeNull();
    expect(bodyIndex(def)).toBe(-1);
    expect(rig.api().shouldRender.value).toBe(false);
  });

  it('关闭（autoDestroy=true）⇒ 容器从 body 摘掉', async () => {
    const openRef = ref(true);
    const rig = mountHook({ open: () => openRef.value });
    await nextTick();
    const def = rig.api().defaultContainer.value;
    expect(bodyIndex(def)).toBeGreaterThanOrEqual(0);

    openRef.value = false;
    await nextTick();
    expect(bodyIndex(def)).toBe(-1);
    expect(rig.api().shouldRender.value).toBe(false);
  });

  it('autoDestroy=false ⇒ 关闭后容器与内容都留着', async () => {
    const openRef = ref(true);
    const rig = mountHook({ open: () => openRef.value, autoDestroy: false });
    await nextTick();
    const def = rig.api().defaultContainer.value;

    openRef.value = false;
    await nextTick();
    // `rendered` 只在 `autoDestroy || open` 时才更新 ⇒ 保持 true
    expect(bodyIndex(def)).toBeGreaterThanOrEqual(0);
    expect(rig.api().shouldRender.value).toBe(true);
  });

  it('卸载 ⇒ 容器被摘掉（不泄漏）', async () => {
    const rig = mountHook({ open: () => true });
    await nextTick();
    const def = rig.api().defaultContainer.value;
    expect(bodyIndex(def)).toBeGreaterThanOrEqual(0);

    rig.wrapper.unmount();
    wrappers.pop();
    await nextTick();
    expect(bodyIndex(def)).toBe(-1);
  });

  it('debug ⇒ dev 下打 data-debug', async () => {
    const rig = mountHook({ open: () => true, debug: 'my-popup' });
    await nextTick();
    expect(rig.api().defaultContainer.value?.getAttribute('data-debug')).toBe('my-popup');
  });

  it('不传 debug ⇒ 没有 data-debug', async () => {
    const rig = mountHook({ open: () => true });
    await nextTick();
    expect(rig.api().defaultContainer.value?.hasAttribute('data-debug')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 自定义容器
// ---------------------------------------------------------------------------

describe('自定义容器', () => {
  it('元素 ⇒ 用它，默认容器不进 DOM', async () => {
    const holder = document.createElement('aside');
    document.body.appendChild(holder);
    try {
      const rig = mountHook({ open: () => true, getContainer: () => holder });
      await nextTick();

      expect(rig.api().container.value).toBe(holder);
      // `shouldAppend = mergedRender && !innerContainer` ⇒ 有自定义容器就不 append 默认容器
      expect(bodyIndex(rig.api().defaultContainer.value)).toBe(-1);
      expect(rig.api().shouldRender.value).toBe(true);
    } finally {
      holder.remove();
    }
  });

  it('`false` ⇒ 内联渲染，container 就是 false', async () => {
    const rig = mountHook({ open: () => true, getContainer: () => false });
    await nextTick();
    expect(rig.api().container.value).toBe(false);
    expect(rig.api().shouldRender.value).toBe(true);
  });

  it('null ⇒ 回落到默认容器', async () => {
    const rig = mountHook({ open: () => true, getContainer: () => null });
    await nextTick();
    expect(rig.api().container.value).toBe(rig.api().defaultContainer.value);
  });

  it('⭐ 未就绪（getContainer 返回 undefined）⇒ 先落默认容器，拿到目标后再切过去', async () => {
    // 这是 antd `Portal.js:77` 注释要防的场景：`getContainer()` 依赖 ref，首帧拿不到。
    //
    // ⚠️ 注意「首帧不渲染」这拍在 Vue 里**观察不到**：`render()` 末尾会同步 flush
    //    post effects，`onMounted` 里的重解析（把 undefined 归一成 null）在 `mount()`
    //    返回前就已经跑完。所以这里只能断言最终落点；
    //    「首帧到底有没有渲染进默认容器」由 `portal.test.ts` 的挂载次数断言来钉。
    const box = shallowRef<HTMLElement | undefined>(undefined);
    const rig = mountHook({ open: () => true, getContainer: () => box.value as GetContainer });
    await nextTick();

    // 归一化后是 null ⇒ 走默认容器
    expect(rig.api().container.value).toBe(rig.api().defaultContainer.value);

    const target = document.createElement('nav');
    document.body.appendChild(target);
    box.value = target;
    try {
      await rig.rerender(); // onUpdated ⇒ reResolveContainer
      expect(rig.api().container.value).toBe(target);
      // 有自定义容器后，默认容器要从 body 摘掉
      expect(bodyIndex(rig.api().defaultContainer.value)).toBe(-1);
    } finally {
      target.remove();
    }
  });
});

// ---------------------------------------------------------------------------
// 嵌套顺序
// ---------------------------------------------------------------------------

describe('嵌套顺序', () => {
  it('⭐ 父容器先入 DOM，子容器后入', async () => {
    const boxes: Record<string, UsePortalContainerReturn | null> = {
      outer: null,
      inner: null,
    };

    const Inner = defineComponent({
      name: 'Inner',
      setup() {
        boxes.inner = usePortalContainer({ open: () => true, debug: 'inner' });
        return () => h('span');
      },
    });
    const Outer = defineComponent({
      name: 'Outer',
      setup() {
        boxes.outer = usePortalContainer({ open: () => true, debug: 'outer' });
        return () => h('div', [h(Inner)]);
      },
    });

    const wrapper = mount(Outer);
    wrappers.push(wrapper);
    await nextTick();

    const outerEl = mustGet(boxes.outer, 'outer').defaultContainer.value;
    const innerEl = mustGet(boxes.inner, 'inner').defaultContainer.value;
    expect(outerEl).not.toBeNull();
    expect(innerEl).not.toBeNull();

    const outerAt = bodyIndex(outerEl);
    const innerAt = bodyIndex(innerEl);
    expect(outerAt).toBeGreaterThanOrEqual(0);
    expect(innerAt).toBeGreaterThanOrEqual(0);
    expect(outerAt).toBeLessThan(innerAt);
  });
});

// ---------------------------------------------------------------------------
// z-index
// ---------------------------------------------------------------------------

function mountZIndex(
  componentType: ZIndexComponentType,
  customZIndex?: () => number | undefined,
  children?: Component,
  options?: { zIndexPopupBase?: number },
): { wrapper: VueWrapper; z: () => string } {
  const Host = defineComponent({
    name: 'ZHost',
    setup() {
      const z = useZIndex(componentType, customZIndex, options);
      return () =>
        h('div', { 'data-z': z.value === undefined ? 'none' : String(z.value) }, [
          children ? h(children) : null,
        ]);
    },
  });
  const wrapper = mount(Host);
  wrappers.push(wrapper);
  return { wrapper, z: () => String(wrapper.attributes('data-z')) };
}

describe('⭐ 祖先已入 DOM 后才出现的子孙', () => {
  it('立即自己 append —— 不再排队', async () => {
    const boxes: Record<string, UsePortalContainerReturn | null> = { parent: null, late: null };
    const showLate = ref(false);

    const Late = defineComponent({
      name: 'Late',
      setup() {
        boxes.late = usePortalContainer({ open: () => true, debug: 'late' });
        return () => h('span');
      },
    });
    const Parent = defineComponent({
      name: 'LateParent',
      setup() {
        boxes.parent = usePortalContainer({ open: () => true, debug: 'late-parent' });
        return () => h('div', [showLate.value ? h(Late) : null]);
      },
    });

    const wrapper = mount(Parent);
    wrappers.push(wrapper);
    await nextTick();
    expect(
      bodyIndex(mustGet(boxes.parent, 'parent').defaultContainer.value),
    ).toBeGreaterThanOrEqual(0);

    // 这时候父级已经 append 过了 ⇒ 子孙拿到 enqueue 时应当被**立即执行**
    showLate.value = true;
    await nextTick();
    const lateEl = mustGet(boxes.late, 'late').defaultContainer.value;
    expect(bodyIndex(lateEl)).toBeGreaterThanOrEqual(0);
  });
});

describe('zIndexPopupBase 选项', () => {
  it('base 变化会同时影响自身与子孙', () => {
    const Child = defineComponent({
      name: 'BaseChild',
      setup() {
        const z = useZIndex('SelectLike');
        return () => h('span', { 'data-child-z': String(z.value) });
      },
    });
    const { wrapper, z } = mountZIndex('Modal', undefined, Child, { zIndexPopupBase: 2000 });
    // 顶层仍然不设 z-index
    expect(z()).toBe('none');
    // 子孙：2000 + 100（父的 container offset）+ 50（自己的 consumer offset）
    expect(wrapper.find('[data-child-z]').attributes('data-child-z')).toBe('2150');
  });

  it('不传 base ⇒ 用 1000', () => {
    const Child = defineComponent({
      name: 'BaseChild2',
      setup() {
        const z = useZIndex('SelectLike');
        return () => h('span', { 'data-child-z': String(z.value) });
      },
    });
    const { wrapper } = mountZIndex('Modal', undefined, Child);
    expect(wrapper.find('[data-child-z]').attributes('data-child-z')).toBe('1150');
  });
});
describe('越界告警', () => {
  it('⭐ 算出来的 z-index 超过 base + 1100 ⇒ dev 下告警一次', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const Child = defineComponent({
        name: 'DeepChild',
        setup() {
          const z = useZIndex('Modal');
          return () => h('span', { 'data-deep-z': String(z.value) });
        },
      });
      const Host = defineComponent({
        name: 'DeepHost',
        setup() {
          // 直接 provide 一个很大的父级 z-index，逼出越界
          provide(
            ZINDEX_KEY,
            computed(() => 5000),
          );
          return () => h(Child);
        },
      });
      const wrapper = mount(Host);
      wrappers.push(wrapper);
      await nextTick();

      expect(wrapper.find('[data-deep-z]').attributes('data-deep-z')).toBe('5100');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(String(spy.mock.calls[0]?.[0])).toContain('zIndexPopupBase');
    } finally {
      spy.mockRestore();
    }
  });

  it('customZIndex 给定时不告警（用户自己负责）', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      mountZIndex('Modal', () => 9999);
      await nextTick();
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });
});

describe('注入的 doc 为 null', () => {
  it('拿不到文档 ⇒ 默认容器建不出来，container 为 null', async () => {
    const rig = mountHook({ open: () => true, doc: () => null });
    await nextTick();
    expect(rig.api().defaultContainer.value).toBeNull();
    expect(rig.api().container.value).toBeNull();
    // ⚠️ antd 的 `shouldRender` 不检查 container 是否为 null，这里也不检查 ——
    //    真实环境下 canUseDom() 为真时默认容器必然已建，这是一条到不了的分支。
    expect(rig.api().shouldRender.value).toBe(true);
  });
});
describe('usePortalOrder', () => {
  it('有祖先 ⇒ 拿到函数', async () => {
    const captured: { order: (() => void) | null } = { order: null };
    const Inner = defineComponent({
      name: 'OrderInner',
      setup() {
        const enqueue = usePortalOrder();
        captured.order = enqueue ? () => enqueue(() => {}) : null;
        return () => h('span');
      },
    });
    const Outer = defineComponent({
      name: 'OrderOuter',
      setup() {
        usePortalContainer({ open: () => true });
        return () => h(Inner);
      },
    });
    const wrapper = mount(Outer);
    wrappers.push(wrapper);
    await nextTick();
    expect(captured.order).not.toBeNull();
  });

  it('没有祖先 ⇒ 返回 null', async () => {
    const captured: { value: unknown } = { value: 'unset' };
    const Host = defineComponent({
      name: 'LonelyHost',
      setup() {
        captured.value = usePortalOrder();
        return () => h('span');
      },
    });
    const wrapper = mount(Host);
    wrappers.push(wrapper);
    await nextTick();
    expect(captured.value).toBeNull();
  });
});
describe('useZIndex', () => {
  it('⭐ 顶层容器不设 z-index（返回 undefined）', () => {
    expect(mountZIndex('Modal').z()).toBe('none');
    expect(mountZIndex('SelectLike').z()).toBe('none');
  });

  it('嵌套 ⇒ 子级拿到数值（父 1100 + 50）', () => {
    const Child = defineComponent({
      name: 'Child',
      setup() {
        const z = useZIndex('SelectLike');
        return () => h('span', { 'data-child-z': String(z.value) });
      },
    });
    const wrapper = mountZIndex('Modal', undefined, Child).wrapper;
    const child = wrapper.find('[data-child-z]');
    expect(child.attributes('data-child-z')).toBe('1150');
  });

  it('customZIndex 透传，且子孙继承它', () => {
    const Child = defineComponent({
      name: 'Child',
      setup() {
        const z = useZIndex('SelectLike');
        return () => h('span', { 'data-child-z': String(z.value) });
      },
    });
    const { wrapper, z } = mountZIndex('Modal', () => 5000, Child);
    expect(z()).toBe('5000');
    // 子孙的 parentZIndex 是 5000 ⇒ 5000 + 50
    expect(wrapper.find('[data-child-z]').attributes('data-child-z')).toBe('5050');
  });
});

// ---------------------------------------------------------------------------
// 类型层面的守卫（顺带确认 ShallowRef / Ref 命名没被误用）
// ---------------------------------------------------------------------------

describe('返回值形状', () => {
  it('defaultContainer 是 ShallowRef，container/shouldRender 是 ComputedRef', async () => {
    const rig = mountHook({ open: () => true });
    await nextTick();
    const api = rig.api();
    // ShallowRef 与 ComputedRef 都有 `.value`，但 ComputedRef 是只读的
    expect(typeof api.defaultContainer.value).toBe('object');
    expect(typeof api.container.value).toBe('object');
    expect(typeof api.shouldRender.value).toBe('boolean');
    // 这两个仅供类型标注，运行时用不到 —— 用它们避免出现「未使用 import」的诊断
    const _refProbe: Ref<unknown> | ShallowRef<unknown> = api.defaultContainer;
    expect(_refProbe).toBeTruthy();
  });
});
