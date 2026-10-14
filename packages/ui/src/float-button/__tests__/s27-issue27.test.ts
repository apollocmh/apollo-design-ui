/**
 * FloatButton · Issue #27 回归（4 项，先复现后修）。
 *
 * ⚠️ 与 index.test.ts 同款：`attachTo: document.body` + 禁 teleport-stub。
 */
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import FloatButtonBackTop from '../BackTop';
import FloatButtonGroup from '../FloatButtonGroup';
import { useScroll } from '../hooks/useScroll';

const G = 'apollo-float-btn-group';

function mountGroup(props: Record<string, unknown> = {}, slots?: Record<string, () => unknown>) {
  return mount(FloatButtonGroup, {
    attachTo: document.body,
    global: { stubs: { teleport: false } },
    props: { trigger: 'click', ...props } as never,
    slots:
      slots ??
      ({
        default: () => h('span', { class: 'fb-child' }, 'child'),
      } as never),
  });
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('#27.1 一次开合只通知一次', () => {
  it('[A] 点击展开：onOpenChange 只调 1 次，update:open 只发 1 次', async () => {
    const onOpenChange = vi.fn();
    const w = mountGroup({ onOpenChange });
    await nextTick();
    const trigger = w.find(`.${G}-trigger`);
    if (trigger.exists()) {
      await trigger.trigger('click');
    } else {
      await w.find(`.${G}`).trigger('click');
    }
    await nextTick();

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(w.emitted('update:open')?.length ?? 0).toBeLessThanOrEqual(1);
    w.unmount();
  });

  it('[B] 外部点击关闭：也只调 1 次', async () => {
    const onOpenChange = vi.fn();
    const w = mountGroup({ open: true, onOpenChange });
    await nextTick();
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();

    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    w.unmount();
  });
});

describe('#27.2 document 点击监听要跟随 trigger 安装/卸载', () => {
  it('[A] hover → click 会补装监听；click → hover 会摘掉', async () => {
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');

    const w = mountGroup({ trigger: 'hover' });
    await nextTick();
    const addedAtHover = add.mock.calls.filter((c) => c[0] === 'click').length;

    await w.setProps({ trigger: 'click' });
    await nextTick();
    const addedAtClick = add.mock.calls.filter((c) => c[0] === 'click').length;
    expect(addedAtClick).toBe(addedAtHover + 1);

    const removedBefore = remove.mock.calls.filter((c) => c[0] === 'click').length;
    await w.setProps({ trigger: 'hover' });
    await nextTick();
    const removedAfter = remove.mock.calls.filter((c) => c[0] === 'click').length;
    expect(removedAfter).toBe(removedBefore + 1);

    w.unmount();
  });

  it('[B] 卸载后 document 上没有残留监听（外部点击不再触发回调）', async () => {
    const onOpenChange = vi.fn();
    const w = mountGroup({ trigger: 'click', open: true, onOpenChange });
    await nextTick();
    w.unmount();
    onOpenChange.mockClear();
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe('#27.3 原生 attrs 不能覆盖内部 class 与鼠标监听', () => {
  it('[A] 用户 class 与内部类名共存', async () => {
    const w = mount(FloatButtonGroup, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: { trigger: 'click' } as never,
      attrs: { class: 'my-actions' },
      slots: { default: () => h('span', { class: 'fb-child' }, 'child') } as never,
    });
    await nextTick();
    const root = document.querySelector<HTMLElement>(`.${G}`);
    expect(root).not.toBeNull();
    expect(root?.classList.contains('my-actions')).toBe(true);
    expect(root?.classList.contains(G)).toBe(true);
    w.unmount();
  });

  it('[B] hover 模式下用户 onMouseenter 与内部 hover 处理都要触发', async () => {
    const spy = vi.fn();
    const w = mount(FloatButtonGroup, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: { trigger: 'hover', open: false } as never,
      attrs: { onMouseenter: spy },
      slots: { default: () => h('span', { class: 'fb-child' }, 'child') } as never,
    });
    await nextTick();
    const root = document.querySelector<HTMLElement>(`.${G}`);
    root?.dispatchEvent(new MouseEvent('mouseenter'));
    await nextTick();

    // 用户回调要被调用（不能被内部 onMouseenter 顶掉）
    expect(spy).toHaveBeenCalled();
    // 内部 hover 打开也要生效（class 上有 -menu-mode/-open 或 update:open 发出）
    expect(w.emitted('update:open')).toBeTruthy();
    w.unmount();
  });
});

describe('#27.4 BackTop 的滚动配置要能动态更新', () => {
  /** 用 hook 直接验证（`BackTop` 的可见性不对外暴露）。 */
  const mountScroll = (cfg: {
    visibilityHeight: number;
    showProgress: boolean;
    getTarget: () => unknown;
  }) => {
    const state = { visible: false, progress: 0 };
    const visibilityHeight = ref(cfg.visibilityHeight);
    const showProgress = ref(cfg.showProgress);
    const Host = defineComponent({
      setup() {
        const { scrollProgress, visible } = useScroll({
          getTarget: () => cfg.getTarget() as never,
          showProgress,
          visibilityHeight,
        });
        return () => {
          state.visible = visible.value;
          state.progress = scrollProgress.value;
          return h('div');
        };
      },
    });
    const w = mount(Host, { attachTo: document.body });
    return { w, state, visibilityHeight, showProgress };
  };

  it('[A] visibilityHeight 动态放宽 ⇒ 重新判定可见性', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    Object.defineProperty(container, 'scrollTop', { value: 500, writable: true });

    const { w, state, visibilityHeight } = mountScroll({
      visibilityHeight: 400,
      showProgress: false,
      getTarget: () => container,
    });
    await nextTick();
    container.dispatchEvent(new Event('scroll'));
    await new Promise((r) => setTimeout(r, 30));
    expect(state.visible).toBe(true);

    // 阈值放宽到 600 ⇒ 重绑时会立即重算 ⇒ 变不可见
    visibilityHeight.value = 600;
    await nextTick();
    await new Promise((r) => setTimeout(r, 30));
    expect(state.visible).toBe(false);

    w.unmount();
    container.remove();
  });

  it('[B] target 替换 ⇒ 旧元素解绑、新元素生效（无残留）', async () => {
    const a = document.createElement('div');
    const b = document.createElement('div');
    document.body.appendChild(a);
    document.body.appendChild(b);
    Object.defineProperty(a, 'scrollTop', { value: 0, writable: true });
    Object.defineProperty(b, 'scrollTop', { value: 900, writable: true });

    const which = ref<'a' | 'b'>('a');
    const state = { visible: false };
    const Host = defineComponent({
      setup() {
        const { visible } = useScroll({
          getTarget: () => (which.value === 'a' ? a : b) as never,
          showProgress: false,
          visibilityHeight: 400,
        });
        return () => {
          state.visible = visible.value;
          return h('div');
        };
      },
    });
    const w = mount(Host, { attachTo: document.body });
    await nextTick();

    const removeSpy = vi.spyOn(a, 'removeEventListener');
    const addSpy = vi.spyOn(b, 'addEventListener');
    which.value = 'b';
    await nextTick();
    await new Promise((r) => setTimeout(r, 30));

    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(state.visible).toBe(true);

    w.unmount();
    a.remove();
    b.remove();
  });

  it('[C] 守卫：BackTop 组件仍可正常挂载', async () => {
    const w = mount(FloatButtonBackTop, {
      attachTo: document.body,
      global: { stubs: { teleport: false } },
      props: { visibilityHeight: 0 } as never,
    });
    await nextTick();
    expect(w.find('.apollo-float-btn').exists()).toBe(true);
    w.unmount();
  });
});
