import '@testing-library/jest-dom/vitest';

import { resetMutationObserver, resetResizeObserver } from '@apollo-design/utils';
import { config, enableAutoUnmount } from '@vue/test-utils';
import { afterEach, beforeAll, vi } from 'vitest';

/**
 * Vitest 全局 setup。
 *
 * 这里做的每一件事都是为了**确定性**（TESTING.md T5/T6）。
 * 不确定的测试比没有测试更糟 —— 它会训练人忽略红灯。
 */

// ---------------------------------------------------------------------------
// 1. 全局关闭 motion
// ---------------------------------------------------------------------------
// 动画会让「渲染完成」的时机变得不确定。测试环境统一禁用，
// 视觉层由 L6（Playwright）在真实浏览器中验证动画的最终状态。
// 注意：这不是"跳过测试"，而是把动画验证放在正确的层。
vi.mock('@apollo-design/motion', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    // 让所有 motion 组件退化为直接渲染，不产生过渡阶段
    defaultMotionConfig: { motion: false },
  };
});

// ---------------------------------------------------------------------------
// 2. ResizeObserver / MutationObserver 桩
// ---------------------------------------------------------------------------
// 两个 API 的**实际**情况不同，必须分别说明（第一版这里写错了）：
//
//   ResizeObserver    jsdom **没有**实现 → 桩是唯一选择。
//   MutationObserver  jsdom **有**实现（`globalThis.MutationObserver.name === 'MutationObserver'`）
//                     → 我们**主动覆盖**它，理由是确定性（TESTING.md T5/T6）：
//                       · 原生实现通过微任务异步派发，"观察者是否触发"的断言会变成时序依赖
//                       · `masonry` / `image` 这类组件需要测试**按需驱动**一次变更，
//                         原生的只能靠真的改 DOM 再等微任务，无法区分"我们的管线通了"
//                         和"DOM 恰好变了"
//                       · `instances.size === 1` 这条单例契约需要两边对称可观测
//
// 桩的语义：注册后不自动触发，由测试显式调用 `trigger()`。
//
// ⚠️ `instances` 是一个**可观测的契约**：
//    `@apollo-design/utils` 的 useResizeObserver / useMutationObserver 要求
//    「全局单例 + 元素→回调集合」，测试通过 `instances.size` 断言它（应当恒为 1）。
export class MockResizeObserver {
  static instances = new Set<MockResizeObserver>();

  callback: ResizeObserverCallback;
  targets = new Set<Element>();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    MockResizeObserver.instances.add(this);
  }

  observe(target: Element): void {
    this.targets.add(target);
  }

  unobserve(target: Element): void {
    this.targets.delete(target);
  }

  disconnect(): void {
    this.targets.clear();
    MockResizeObserver.instances.delete(this);
  }

  /** 测试辅助：显式触发一次尺寸变化 */
  trigger(entries?: ResizeObserverEntry[]): void {
    const list: ResizeObserverEntry[] =
      entries ??
      [...this.targets].map(
        (target) =>
          ({
            target,
            contentRect: target.getBoundingClientRect(),
            borderBoxSize: [],
            contentBoxSize: [],
            devicePixelContentBoxSize: [],
          }) as unknown as ResizeObserverEntry,
      );
    this.callback(list, this as unknown as ResizeObserver);
  }
}

export class MockMutationObserver {
  static instances = new Set<MockMutationObserver>();

  callback: MutationCallback;
  targets = new Set<Element>();
  /** 最后一次 `observe()` 的配置 —— 测试用它断言「options 取第一次注册的值」。 */
  options: MutationObserverInit | undefined;

  constructor(callback: MutationCallback) {
    this.callback = callback;
    MockMutationObserver.instances.add(this);
  }

  observe(target: Element, options?: MutationObserverInit): void {
    this.targets.add(target);
    // 真实 MutationObserver 在同一实例上重复 observe 会**替换**配置，
    // 这里保持一致，方便测试断言"谁最后写的"。
    this.options = options;
  }

  disconnect(): void {
    this.targets.clear();
    MockMutationObserver.instances.delete(this);
  }

  takeRecords(): MutationRecord[] {
    return [];
  }

  /** 测试辅助：显式触发一次 DOM 变更。不传则造一条 childList 记录。 */
  trigger(records?: MutationRecord[]): void {
    const list: MutationRecord[] =
      records ??
      [...this.targets].map(
        (target) =>
          ({
            type: 'childList',
            target,
            addedNodes: [] as unknown as NodeList,
            removedNodes: [] as unknown as NodeList,
            attributeName: null,
            attributeNamespace: null,
            oldValue: null,
            previousSibling: null,
            nextSibling: null,
          }) as unknown as MutationRecord,
      );
    this.callback(list, this as unknown as MutationObserver);
  }
}

// 无条件覆盖（不是 `??`）：见上面的说明，MutationObserver 是**主动**替换掉 jsdom 原生实现的。
globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
globalThis.MutationObserver = MockMutationObserver as unknown as typeof MutationObserver;

// ---------------------------------------------------------------------------
// 3. 其他 jsdom 缺失的 API
// ---------------------------------------------------------------------------
if (!globalThis.matchMedia) {
  globalThis.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof globalThis.matchMedia;
}

if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = function scrollTo() {};
}

if (!globalThis.requestAnimationFrame) {
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback) =>
    setTimeout(() => cb(Date.now()), 0) as unknown as number;
  globalThis.cancelAnimationFrame = (id: number) =>
    clearTimeout(id as unknown as ReturnType<typeof setTimeout>);
}

// ---------------------------------------------------------------------------
// 4. Vue Test Utils 全局配置
// ---------------------------------------------------------------------------
// ⚠️ 每个测试后自动卸载所有已挂载组件（VTU 默认**不**这么做）。
//    没有它，组件里残留的 timer / observer（例如 border-beam 的 500ms border 轮询）
//    会在 `document.body.innerHTML = ''` 之后继续跑 → 全量跑时偶发 unhandled error
//    （单跑却是绿的，因为 worker 立刻退出）。这类红灯不代表真实失败，必须消除。
enableAutoUnmount(afterEach);

config.global.stubs = {
  // Teleport 在测试中默认渲染到原地，便于用 wrapper.find 断言浮层内容。
  // 需要验证真实挂载位置时，测试可显式覆盖该 stub。
  teleport: true,
};

// ---------------------------------------------------------------------------
// 5. 每个测试后清理
// ---------------------------------------------------------------------------
afterEach(() => {
  // ⚠️ 顺序很重要：先重置 utils 里的**单例 observer 注册表**，
  //    否则下一个测试会复用一个已被 disconnect 的 observer 实例。
  //    （utils 要求「全局单例 + 元素→回调集合」，所以桩被外部断开时单例必须重建。）
  resetResizeObserver();
  resetMutationObserver();

  // 再清理桩实例，避免跨测试泄漏导致的内存增长与串扰。
  // ⚠️ 先快照再遍历：`disconnect()` 会把实例从 `instances` 里删掉，
  //    直接边遍历边删虽然对 Set 是安全的，但读起来像 bug。
  for (const instance of [...MockResizeObserver.instances]) instance.disconnect();
  MockResizeObserver.instances.clear();
  for (const instance of [...MockMutationObserver.instances]) instance.disconnect();
  MockMutationObserver.instances.clear();
  document.body.innerHTML = '';
});

beforeAll(() => {
  // 固定随机值，避免 ID 类断言漂移（TESTING.md §11 稳定性要求）
  let seed = 1;
  vi.spyOn(Math, 'random').mockImplementation(() => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  });
});
