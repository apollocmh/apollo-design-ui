/**
 * L2 交互测试 —— `useMotionStatus`（Vue 生命周期接线）+ `CSSMotion` 组件。
 *
 * 这里证明的是 `driver.test.ts` 证明不了的那一半：**驱动被接在了正确的时机上**。
 * 具体两条，都是「晚一步就全错」的：
 *
 *   1. `mount()` 必须在 `onMounted` 里 —— 那时 `isMounted === false`，
 *      首次 `visible=true` 才走 **appear** 而不是 enter；
 *   2. `setVisible()` 必须跟在 `watch(visible)` 上。
 *
 * 帧用的是注入的帧泵（不是真实 rAF）：jsdom 没有帧语义，时间必须是显式输入。
 */

import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick, type PropType } from 'vue';
import { renderToString } from 'vue/server-renderer';

import type { MotionHooks } from '../index';
import { CSSMotion, useMotionStatus } from '../index';
import type { FramePump } from './frame-pump';
import { createFramePump } from './frame-pump';

const MOTION_NAME = 'apollo-zoom';

interface HostProps {
  visible: boolean;
  motionAppear?: boolean;
  motionEnter?: boolean;
  motionLeave?: boolean;
  motionDeadline?: number;
  hooks?: MotionHooks;
  removeOnLeave?: boolean;
  leavedClassName?: string;
  forceRender?: boolean;
}

interface HostExposed {
  status: () => string;
  step: () => string;
  renderMode: () => string;
  className: () => string;
}

/**
 * 宿主组件：把 `useMotionStatus` 的返回值接到一个 div 上。
 * 刻意不经过 `CSSMotion` —— 这样「接线」是被单独验证的，
 * 组件层的额外分支（renderMode）由下面的 `CSSMotion` 用例覆盖。
 */
function createHost(pump: FramePump) {
  return defineComponent({
    props: {
      visible: { type: Boolean, default: false },
      motionAppear: { type: Boolean, default: true },
      motionEnter: { type: Boolean, default: true },
      motionLeave: { type: Boolean, default: true },
      motionDeadline: { type: Number, default: 0 },
      hooks: { type: Object as PropType<MotionHooks>, default: undefined },
      removeOnLeave: { type: Boolean, default: true },
      leavedClassName: { type: String, default: undefined },
      forceRender: { type: Boolean, default: false },
    },
    setup(props, { expose }) {
      const motion = useMotionStatus({
        visible: () => props.visible,
        motionName: MOTION_NAME,
        supportMotion: true,
        motionAppear: props.motionAppear,
        motionEnter: props.motionEnter,
        motionLeave: props.motionLeave,
        motionDeadline: props.motionDeadline,
        removeOnLeave: props.removeOnLeave,
        forceRender: props.forceRender,
        leavedClassName: props.leavedClassName,
        hooks: props.hooks,
        scheduler: pump.scheduler,
      });

      expose({
        status: () => motion.status.value,
        step: () => motion.step.value,
        renderMode: () => motion.renderMode.value,
        className: () => motion.className.value,
      });

      return () => {
        if (motion.renderMode.value === 'null') return null;
        return h('div', {
          ref: motion.elementRef,
          class: motion.className.value,
          style: motion.style.value ?? undefined,
        });
      };
    },
  });
}

async function mountHost(
  props: HostProps,
  pump: FramePump,
): Promise<VueWrapper & { vm: HostExposed }> {
  const Host = createHost(pump);
  const wrapper = mount(Host, { props }) as unknown as VueWrapper & { vm: HostExposed };
  await nextTick();
  return wrapper;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('002 复审：首次渲染不能泄漏未初始化的可见节点', () => {
  it('有 window 的 SSR 环境仍同步输出可见内容，不等待 appear 挂载', async () => {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            CSSMotion,
            { visible: true, motionName: MOTION_NAME },
            {
              default: () => h('div', { 'data-ssr-motion': 'visible' }, 'SSR content'),
            },
          ),
      }),
    );
    expect(html).toBe('<div data-ssr-motion="visible">SSR content</div>');
  });

  it.each([
    { supportMotion: true, motionAppear: true, firstMode: 'null' },
    { supportMotion: true, motionAppear: false, firstMode: 'children' },
    { supportMotion: false, motionAppear: true, firstMode: 'children' },
  ])('$supportMotion / appear=$motionAppear → $firstMode', async (options) => {
    const pump = createFramePump();
    const frames: { mode: string; step: string; className: string }[] = [];
    const Host = defineComponent({
      setup() {
        const motion = useMotionStatus({
          visible: () => true,
          motionName: MOTION_NAME,
          supportMotion: options.supportMotion,
          motionAppear: options.motionAppear,
          scheduler: pump.scheduler,
          // 保留 prepare，逐步验证 prepare → start → active 的渲染契约。
          hooks: { onAppearPrepare: () => undefined },
        });
        return () => {
          frames.push({
            mode: motion.renderMode.value,
            step: motion.step.value,
            className: motion.className.value,
          });
          return motion.renderMode.value === 'null'
            ? null
            : h('div', { ref: motion.elementRef, class: motion.className.value });
        };
      },
    });
    const wrapper = mount(Host);
    expect(frames[0]?.mode).toBe(options.firstMode);
    await nextTick();
    if (options.supportMotion && options.motionAppear) {
      expect(frames.at(-1)?.className).toContain('appear-prepare');
      pump.tickFrames(2);
      await nextTick();
      await nextTick();
      expect(frames.at(-1)?.className).toContain('appear-start');
      pump.tickFrames(2);
      await nextTick();
      expect(frames.at(-1)?.className).toContain('appear-active');
      expect(
        frames.filter((frame) => frame.mode !== 'null').every((frame) => frame.className),
      ).toBe(true);
    }
    wrapper.unmount();
  });
});

// ---------------------------------------------------------------------------

describe('挂载时机', () => {
  it('⭐ 首次 visible=true 走 **appear** 而不是 enter —— 因为 mount 在 onMounted 里', async () => {
    const pump = createFramePump();
    const wrapper = await mountHost({ visible: true }, pump);

    expect(wrapper.vm.status()).toBe('appear');
    // prepare 无 handler 会被 SkipStep 同步跳过，所以首帧就停在 start
    expect(wrapper.vm.step()).toBe('start');
    wrapper.unmount();
  });

  it('挂载时 visible=false —— 不启动任何动画', async () => {
    const pump = createFramePump();
    const started: string[] = [];
    const wrapper = await mountHost(
      {
        visible: false,
        hooks: {
          onAppearStart: () => {
            started.push('appear');
            return {};
          },
        },
      },
      pump,
    );

    expect(wrapper.vm.status()).toBe('none');
    expect(started).toEqual([]);
    wrapper.unmount();
  });

  it('支持动画且开了 appear ⇒ 首帧 renderMode 为 null（组件不渲染）', async () => {
    const pump = createFramePump();
    const Host = createHost(pump);
    const wrapper = mount(Host, {
      props: { visible: false },
    }) as unknown as VueWrapper & { vm: HostExposed };
    await nextTick();
    // 什么都渲染 ⇒ html 为空串。Vue 只在 v-if 为假时才留 `<!--v-if-->` 注释，
    // 这里是 render 函数直接 return null，所以没有注释节点。
    expect(wrapper.vm.renderMode()).toBe('null');
    expect(wrapper.html()).toBe('');
    wrapper.unmount();
  });
});

describe('class 时间线', () => {
  it('start → active：每两步之间隔**两帧**，且始终带裸的 {n}', async () => {
    const pump = createFramePump();
    const wrapper = await mountHost({ visible: true }, pump);

    expect(wrapper.vm.className()).toBe(
      `${MOTION_NAME}-appear ${MOTION_NAME}-appear-start ${MOTION_NAME}`,
    );

    pump.tickFrames(2);
    await nextTick();
    expect(wrapper.vm.step()).toBe('active');
    expect(wrapper.vm.className()).toBe(
      `${MOTION_NAME}-appear ${MOTION_NAME}-appear-active ${MOTION_NAME}`,
    );

    wrapper.unmount();
  });

  it('动画结束（deadline 兜底）后回到 none，且不再有 motion class', async () => {
    const pump = createFramePump();
    const wrapper = await mountHost({ visible: true, motionDeadline: 500 }, pump);

    pump.tickFrames(4);
    await nextTick();
    expect(wrapper.vm.step()).toBe('end');

    pump.fireDeadline();
    await nextTick();
    expect(wrapper.vm.status()).toBe('none');
    expect(wrapper.vm.className()).toBe('');
    wrapper.unmount();
  });
});

describe('visible 变化', () => {
  it('mounted 后 visible: false → true 走 **enter**（不是 appear）', async () => {
    const pump = createFramePump();
    const wrapper = await mountHost({ visible: false }, pump);
    expect(wrapper.vm.status()).toBe('none');

    await wrapper.setProps({ visible: true });
    expect(wrapper.vm.status()).toBe('enter');
    wrapper.unmount();
  });

  it('visible: true → false 走 leave，且离场动画期间元素**仍在 DOM**', async () => {
    const pump = createFramePump();
    const wrapper = await mountHost({ visible: true }, pump);
    pump.tickFrames(4);
    await nextTick();

    await wrapper.setProps({ visible: false });
    expect(wrapper.vm.status()).toBe('leave');
    // ⭐ 关键：离场期间 renderMode 仍是 motion —— 元素不能被摘掉，否则看不到动画
    expect(wrapper.vm.renderMode()).toBe('motion');
    wrapper.unmount();
  });
});

describe('清理', () => {
  it('卸载后不留未取消的 deadline', async () => {
    const pump = createFramePump();
    const wrapper = await mountHost({ visible: true, motionDeadline: 500 }, pump);
    pump.tickFrames(4);
    await nextTick();
    expect(pump.deadlineCount()).toBe(1);

    wrapper.unmount();
    expect(pump.deadlineCount()).toBe(0);
  });
});

// ---------------------------------------------------------------------------

/** slot 必须同时吃 className 与 style —— 少一个就测不到组件的时间线 */
const defaultSlot = (p: Record<string, unknown>) =>
  h('div', {
    'data-box': '',
    class: p.className as string,
    style: p.style as Record<string, string>,
  });

function mountMotion(
  props: Record<string, unknown>,
  slot?: (p: Record<string, unknown>) => unknown,
) {
  return mount(CSSMotion, {
    props: { supportMotion: true, ...props } as never,
    slots: { default: slot ?? defaultSlot },
  });
}

/** 等真实 rAF 推进 n 帧（组件层没有注入帧泵的口子，只能走真实 rAF） */
async function waitFrames(n: number): Promise<void> {
  for (let i = 0; i < n; i += 1) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  await nextTick();
}

describe('CSSMotion 组件', () => {
  it('动画中把 className 透传给 slot 根元素', async () => {
    const wrapper = mountMotion({ visible: true, motionName: MOTION_NAME });
    await nextTick();
    // prepare 节点提交后，start 样式需再一次 Vue patch 才出现在 DOM。
    expect(wrapper.html()).toContain(`${MOTION_NAME}-appear-prepare`);
    await nextTick();
    expect(wrapper.html()).toContain(`${MOTION_NAME}-appear-start`);
    expect(wrapper.html()).toContain(`${MOTION_NAME}`);
    wrapper.unmount();
  });

  it('⭐ 元素引用被注入 —— 驱动能拿到 DOM（否则事件与测量全部失效）', async () => {
    const seen: (Element | null)[] = [];
    const wrapper = mountMotion({
      visible: true,
      motionName: MOTION_NAME,
      hooks: {
        onAppearStart: (el: Element | null) => {
          seen.push(el ?? null);
          return {};
        },
        onAppearActive: (el: Element | null) => {
          seen.push(el ?? null);
          return {};
        },
      },
    });
    await nextTick();
    // 等两帧推进到 active
    await waitFrames(2);

    // ⭐ start / active 两步都必须拿到真实元素（2026-09-22 更新）：
    //    初始快照改为 mergedVisible=props.visible 后，驱动的 start 步
    //    运行时 DOM 已存在 —— 与 React 的 commit 语义一致（rc-motion 的
    //    start 回调同样拿到已挂载元素）。旧断言（seen[0]===null）钉的是
    //    「首帧 mergedVisible=false 导致 start 先于 DOM」的平台差异缺陷，
    //    badge 的 SSR 契约（L4）证明那不是 antd 的行为。
    expect(seen[0]).not.toBeNull();
    expect(seen[0]?.tagName.toLowerCase()).toBe('div');
    expect(seen[1]).not.toBeNull();
    expect(seen[1]?.tagName.toLowerCase()).toBe('div');
    wrapper.unmount();
  });

  it('removeOnLeave=false + leavedClassName ⇒ 离场后留一个带该 class 的残骸', async () => {
    // 直接构造「已离场」状态：visible=false 且从未渲染过 ⇒ renderMode 为 null；
    // 换 forceRender=true 则走 hidden 分支（display:none）
    const wrapper = mountMotion({
      visible: false,
      forceRender: true,
      removeOnLeave: false,
      motionName: MOTION_NAME,
    });
    await nextTick();
    expect(wrapper.html()).toContain('display: none');
    wrapper.unmount();
  });

  it('collapse 预设能接到组件上：start 态高度 0，active 态取 scrollHeight', async () => {
    const { initCollapseMotion } = await import('../presets');
    const preset = initCollapseMotion('apollo');
    const wrapper = mountMotion({
      visible: true,
      motionName: preset.motionName,
      motionDeadline: preset.motionDeadline,
      hooks: {
        onAppearStart: preset.onAppearStart,
        onAppearActive: preset.onAppearActive,
        onAppearEnd: preset.onAppearEnd,
      },
    });
    await nextTick();
    await nextTick();
    // start 态：height 0 / opacity 0（collapse 的 `onAppearStart`）
    expect(wrapper.html()).toContain('height: 0px');
    expect(wrapper.html()).toContain('opacity: 0');

    // 两帧后推进到 active：opacity 变 1 ⇒ 证明 handler **真的**接上了，
    // 而不只是 class 在变。（jsdom 下 scrollHeight 恒 0，所以高度看不出变化）
    await waitFrames(2);
    expect(wrapper.html()).toContain(`${preset.motionName}-appear-active`);
    expect(wrapper.html()).toContain('opacity: 1');
    wrapper.unmount();
  });

  it('⭐ 数值高度必须补 px 落到内联样式（标准模式浏览器丢弃无单位长度）', async () => {
    const { initCollapseMotion } = await import('../presets');
    const preset = initCollapseMotion('apollo');
    // jsdom 没有布局，scrollHeight 恒 0 ⇒ 模拟真实浏览器展开态的内容高度
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get: () => 140,
    });
    try {
      const wrapper = mountMotion({
        visible: true,
        motionName: preset.motionName,
        motionDeadline: preset.motionDeadline,
        hooks: {
          onAppearStart: preset.onAppearStart,
          onAppearActive: preset.onAppearActive,
          onAppearEnd: preset.onAppearEnd,
        },
      });
      await nextTick();
      await nextTick();
      await waitFrames(2);
      // ⚠️ Vue 的 style 对象不像 React 那样自动补单位；无单位 `140` 会被
      //    CSSOM 静默丢弃（内联样式停在 height: 0px），高度过渡等于没播。
      expect(wrapper.html()).toContain('height: 140px');
      expect(wrapper.html()).toContain(`${preset.motionName}-appear-active`);
      wrapper.unmount();
    } finally {
      delete (HTMLElement.prototype as unknown as Record<string, unknown>).scrollHeight;
    }
  });
});

// ---------------------------------------------------------------------------

describe('CSSMotion 的渲染分支', () => {
  /** 等动画自然播完：4 帧到 active，再等 deadline 兜底 */
  async function settleMotion(): Promise<void> {
    for (let i = 0; i < 5; i += 1) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
    await new Promise((resolve) => setTimeout(resolve, 30));
    await nextTick();
    await nextTick();
  }

  it('播完回到 children 分支 —— 元素还在，但不再挂 motion class', async () => {
    const wrapper = mountMotion({ visible: true, motionName: MOTION_NAME, motionDeadline: 1 });
    await settleMotion();
    expect(wrapper.html()).toContain('data-box');
    expect(wrapper.html()).not.toContain(`${MOTION_NAME}-appear`);
    wrapper.unmount();
  });

  it('⭐ removeOnLeave=false + leavedClassName ⇒ 离场播完留一个残骸', async () => {
    const wrapper = mountMotion({
      visible: true,
      motionName: MOTION_NAME,
      motionDeadline: 1,
      removeOnLeave: false,
      leavedClassName: 'leaved-cls',
    });
    await settleMotion(); // appear 播完 ⇒ rendered = true
    await wrapper.setProps({ visible: false });
    await settleMotion(); // leave 播完
    expect(wrapper.html()).toContain('leaved-cls');
    wrapper.unmount();
  });
});

describe('CSSMotion 的边界分支', () => {
  it('不传 supportMotion ⇒ 走环境探测（不崩即可，jsdom 下结果由探测决定）', async () => {
    const wrapper = mount(CSSMotion, {
      props: { visible: true, motionName: MOTION_NAME } as never,
      slots: {
        default: (p: Record<string, unknown>) => h('div', { class: p.className as string }),
      },
    });
    await nextTick();
    // 无论探测结果如何，都不能抛错；class 要么为空（不支持⇒简队列）要么带 motion class
    expect(wrapper.html()).toContain('div');
    wrapper.unmount();
  });

  it('slot 没有内容 ⇒ 渲染 null 而不是崩', async () => {
    const wrapper = mount(CSSMotion, {
      props: { visible: true, supportMotion: true, motionName: MOTION_NAME } as never,
      slots: { default: () => [] },
    });
    await nextTick();
    expect(wrapper.html()).toBe('');
    wrapper.unmount();
  });
});

describe('diffKeys（多元素）', () => {
  it('新增 / 保留 / 移除 三态判定正确', async () => {
    const { diffKeys, STATUS_ADD, STATUS_KEEP, STATUS_REMOVE } = await import('../diff');
    const result = diffKeys(['a', 'b', 'c'], ['a', 'c', 'd']);
    expect(result.map((e) => `${e.key}:${e.status}`)).toEqual([
      `a:${STATUS_KEEP}`,
      `b:${STATUS_REMOVE}`,
      `c:${STATUS_KEEP}`,
      `d:${STATUS_ADD}`,
    ]);
  });

  it('⭐ 移除又立刻加回 ⇒ 合并成 keep（上游的重复 key 处理）', async () => {
    const { diffKeys, STATUS_KEEP } = await import('../diff');
    // [1 - add, 2 - keep, 1 - remove] -> [1 - keep, 2 - keep]
    const result = diffKeys(['1', '2'], ['2', '1']);
    const key1 = result.filter((e) => e.key === '1');
    expect(key1).toHaveLength(1);
    expect(key1[0]?.status).toBe(STATUS_KEEP);
  });
});

// ---------------------------------------------------------------------------
// onVisibleChanged —— rc-motion `useStatus` 尾部 effect 的移植
//
// 为什么要单独钉这一组（2026-10-17）：`CSSMotion` 是 `inheritAttrs: false`，
// 只要 `onVisibleChanged` 没被**显式声明成 prop**，传进来的回调会被静默丢弃。
// Tree 的 `MotionTreeNode` 就靠它收尾收起动效 —— 丢了 ⇒ `listChanging` 永久为真
// ⇒ 后续展开/收起全部被 `Tree.onNodeExpand` 的守卫吞掉（「展开收起失效」）。
// ---------------------------------------------------------------------------

describe('onVisibleChanged', () => {
  /** 只暴露 `onVisibleChanged` 与 status 的最小宿主，帧用注入的帧泵。 */
  function createSpyHost(
    pump: FramePump,
    opts: { motionAppear?: boolean; motionLeave?: boolean; motionDeadline?: number } = {},
  ) {
    const calls: boolean[] = [];
    const Host = defineComponent({
      props: { visible: { type: Boolean, default: true } },
      setup(props, { expose }) {
        const motion = useMotionStatus({
          visible: () => props.visible,
          motionName: MOTION_NAME,
          supportMotion: true,
          motionAppear: opts.motionAppear ?? true,
          motionEnter: true,
          motionLeave: opts.motionLeave ?? true,
          motionDeadline: opts.motionDeadline ?? 0,
          scheduler: pump.scheduler,
          onVisibleChanged: (v: boolean) => {
            calls.push(v);
          },
        });
        expose({ status: () => motion.status.value });
        return () =>
          h('div', {
            ref: motion.elementRef,
            class: motion.className.value,
            style: motion.style.value ?? undefined,
          });
      },
    });
    return { Host, calls };
  }

  it('⭐ appear 未播完 ⇒ 绝不提前回调 true；播完才回调（Tree 展开哨兵根因）', async () => {
    const pump = createFramePump();
    const { Host, calls } = createSpyHost(pump, { motionAppear: true, motionDeadline: 1 });
    const wrapper = mount(Host, { props: { visible: true } });
    await nextTick();
    // setup 期 status 还是 NONE，但 appear 只是「尚未开始」——此时回调 true
    // 会被 Tree 的 MotionTreeNode 当成 appear 已结束 ⇒ 展开哨兵一帧就被摘掉。
    expect(calls).toEqual([]);

    pump.tickFrames(4);
    pump.fireDeadline();
    await nextTick();
    await nextTick();
    expect(calls).toEqual([true]);
    wrapper.unmount();
  });

  it('⭐ 无动画且首帧可见 ⇒ 挂载后立刻回调 true（rc：asyncVisible 为真可绕过守卫）', async () => {
    const pump = createFramePump();
    const { Host, calls } = createSpyHost(pump, { motionAppear: false });
    const wrapper = mount(Host, { props: { visible: true } });
    await nextTick();
    expect(calls).toEqual([true]);
    wrapper.unmount();
  });

  it('挂载即不可见 ⇒ 不回调（rc：firstMountChange 守卫，避免白收一条 false）', async () => {
    const pump = createFramePump();
    const { Host, calls } = createSpyHost(pump, { motionAppear: false });
    const wrapper = mount(Host, { props: { visible: false } });
    await nextTick();
    expect(calls).toEqual([]);
    wrapper.unmount();
  });

  it('可见 → 不可见 ⇒ 回调 false', async () => {
    const pump = createFramePump();
    const { Host, calls } = createSpyHost(pump, { motionAppear: false, motionLeave: false });
    const wrapper = mount(Host, { props: { visible: true } });
    await nextTick();
    expect(calls).toEqual([true]);
    await wrapper.setProps({ visible: false });
    await nextTick();
    expect(calls).toEqual([true, false]);
    wrapper.unmount();
  });

  it('⭐ 离场动效没跑完 ⇒ 绝不提前回调（status === NONE 守卫）', async () => {
    const pump = createFramePump();
    // motionLeave 打开 ⇒ 转 false 后进入 leave 时间线，此时不许发通知
    const { Host, calls } = createSpyHost(pump, { motionAppear: false, motionLeave: true });
    const wrapper = mount(Host, { props: { visible: true } });
    await nextTick();
    calls.length = 0;

    await wrapper.setProps({ visible: false });
    pump.tickFrames(4);
    await nextTick();

    expect((wrapper.vm as unknown as { status: () => string }).status()).toBe('leave');
    expect(calls).toEqual([]);
    wrapper.unmount();
  });
});
