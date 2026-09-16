/**
 * `focusTest` —— 焦点获取 / 丢失 / 归还的通用断言。
 *
 * ── 与上游的关系（`tests/shared/focusTest.tsx`，131 行）─────────────────────────
 * 上游有两条路径（`refFocus` 与事件路径），用
 * `jest.spyOn(HTMLElement.prototype, 'focus')` 观测「组件有没有请求焦点」。
 *
 * 那个 spy 技巧是**必要的**，不是偷懒：jsdom 的 `focus()` 只对**可聚焦元素**生效，
 * 组件把 `focus()` 转发给一个不可聚焦的包裹 `div` 时，`document.activeElement`
 * 不会变 —— 于是「有没有转发」这件事在 DOM 上不可观测。
 *
 * 我们改成**直接替换目标元素上的方法**（不是替换 prototype）：
 *   - 精确到「调用了**哪一个**元素的方法」，而 prototype spy 只能告诉你「有人调了」
 *   - 不依赖 `vi.spyOn` 记录 `this` 的实现细节（跨 vitest 版本会变）
 *
 * 另外去掉了上游的 `await sleep(blurDelay)`（`TESTING.md` 反模式 A3）。
 * 需要等一拍时用 `flushAll()` —— 它不接收毫秒数。
 *
 * ── 我们比上游**严**的一条 ────────────────────────────────────────────────────
 * 挂载后先断言「`selector` 找到的元素是可聚焦的」（我们自己调一次 `focus()` 看
 * `document.activeElement` 是否变成它）。若不可聚焦，后面的断言就都没有意义 ——
 * 这一步把「测试选错了元素」变成一条**指向明确**的失败，而不是让组件背锅。
 *
 * ── 这个测试没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明 `:focus-visible` 的样式生效（CSS 的职责，jsdom 不计算样式）
 *   - 没证明 **Tab 顺序**合理（需要真实浏览器的键盘导航，属 L6/L5 手工断言）
 *   - 没证明**焦点陷阱**（Modal/Drawer 的 Tab 循环）—— 那需要真实键盘事件序列，
 *     由各组件的 `a11y.test.ts` 承担
 */

import { describe, expect, it, vi } from 'vitest';
import { type Component, isVNode, type VNodeChild } from 'vue';
import { type MountedCase, mountCase } from './render';
import { flushAll } from './timing';
import type { PropsRenderFactory, Wrap } from './types';

export interface FocusTestOptions {
  /**
   * 渲染工厂。**接受 props** —— 本模块需要注入 `onFocus` / `onBlur` / `autoFocus`。
   */
  render: PropsRenderFactory;
  /** Provider 包装。默认恒等。 */
  wrap?: Wrap;
  /**
   * 焦点元素的 CSS 选择器。
   *
   * 默认按 `input` → `textarea` → `select` → `button` → `a[href]` → `[tabindex]` 依次探测。
   * 探测不到（或探测到多个）时**失败**，而不是猜一个 —— 多焦点元素是组件事实，
   * 应当由调用方明确指定。
   */
  selector?: string;
  /** 组件通过 `defineExpose` 暴露了 `focus()` / `blur()`，走命令式路径。 */
  refFocus?: boolean;
  /** 断言挂载后焦点自动落在焦点元素上。 */
  autoFocus?: boolean;
}

/** 默认探测顺序。顺序即优先级。 */
const DEFAULT_PROBES = ['input', 'textarea', 'select', 'button', 'a[href]', '[tabindex]'];

/** 在元素上替换一个方法，返回调用计数与还原函数。 */
function instrument(
  element: HTMLElement,
  method: 'focus' | 'blur',
): { calls: () => number; restore: () => void } {
  const original = element[method];
  let count = 0;

  element[method] = (() => {
    count += 1;
    original.call(element);
  }) as typeof element.focus;

  return {
    calls: () => count,
    restore: () => {
      element[method] = original;
    },
  };
}

/**
 * 取焦点元素。找不到 / 有歧义时给出可操作的错误。
 *
 * 导出是为了让「选错元素」这条失败路径能被单测覆盖 ——
 * 它只在组件测试配错 selector 时才会走到，靠组件测试是测不到的。
 */
export function findFocusElement(
  host: HTMLElement,
  selector: string | undefined,
  context: string,
): HTMLElement {
  if (selector !== undefined) {
    const found = host.querySelectorAll<HTMLElement>(selector);
    if (found.length !== 1) {
      throw new Error(
        `[test-utils] ${context}：selector "${selector}" 命中 ${found.length} 个元素，期望恰好 1 个。`,
      );
    }
    const element = found[0];
    if (element === undefined) {
      // 运行期不可达（上面已保证恰好 1 个）；保留是为了满足 `noUncheckedIndexedAccess`。
      throw new Error(`[test-utils] ${context}：selector "${selector}" 探测结果异常。`);
    }
    return element;
  }

  const matches = DEFAULT_PROBES.flatMap((probe) =>
    Array.from(host.querySelectorAll<HTMLElement>(probe)),
  );
  const unique = [...new Set(matches)];

  // ⚠️ 0 与 >1 必须**分开报**：两者的下一步动作不同（一个要加 selector，一个要选 selector）。
  //    合并成 `!== 1` 会让「一个候选都没有」这句话永远说不出来 —— 实测踩过。
  if (unique.length === 0) {
    throw new Error(
      `[test-utils] ${context}：没有找到任何可聚焦候选（${DEFAULT_PROBES.join(' / ')}）。\n` +
        '  请显式传 selector 指明组件的焦点元素。',
    );
  }
  if (unique.length > 1) {
    throw new Error(
      `[test-utils] ${context}：自动探测到 ${unique.length} 个可聚焦候选（${DEFAULT_PROBES.join(' / ')}）。\n` +
        '  请显式传 selector 指明哪一个才是组件的焦点元素。',
    );
  }

  const element = unique[0];
  if (element === undefined) {
    // 运行期不可达（上面已保证恰好 1 个）；保留是为了满足 `noUncheckedIndexedAccess`。
    throw new Error(`[test-utils] ${context}：焦点元素探测结果异常。`);
  }
  return element;
}

/**
 * 取产物里**被测组件**的暴露实例（`defineExpose` 的结果挂在它上面）。
 *
 * ⚠️ 不能直接用 `mounted.wrapper.vm`：`mountCase` 外面套了一层 Host
 *    （为了统一处理 `wrap` 与 `update`），`wrapper.vm` 是**那层 Host**，
 *    不是被测组件 —— 在它上面找 `focus` 只会得到 `undefined`，
 *    于是失败信息会指向「组件没 expose focus」，而真相是「找错了对象」。
 *
 * 用 `findComponent(vnode.type)` 精确定位到 `render` 真正返回的那个组件。
 *
 * 注：`render` 会被反复调用（`mountCase.update()` 每次都会调），
 * 所以它本来就必须是**纯工厂**；这里再调一次取 `type` 不引入新的约束。
 */
function exposedOf(
  mounted: MountedCase,
  vnode: VNodeChild,
  context: string,
): Record<string, unknown> {
  const type: unknown = isVNode(vnode) ? vnode.type : vnode;
  if (typeof type !== 'object' || type === null) {
    throw new Error(
      `[test-utils] ${context}：refFocus 需要 render 返回**组件**的 vnode，收到的是 ${typeof type}。\n` +
        '  正确写法：render: (props) => h(AInput, props)',
    );
  }

  const child = mounted.wrapper.findComponent(type as Component);
  if (!child.exists()) {
    throw new Error(`[test-utils] ${context}：在产物里找不到 render 返回的那个组件。`);
  }
  return child.vm as unknown as Record<string, unknown>;
}

/** 派发一个非冒泡的焦点事件（`focus` / `blur` 原生就不冒泡）。 */
function dispatchFocusEvent(element: HTMLElement, type: 'focus' | 'blur'): void {
  element.dispatchEvent(new FocusEvent(type));
}

export function focusTest(name: string, options: FocusTestOptions): void {
  const context = `focusTest('${name}')`;
  const mountWith = (props: Record<string, unknown>) =>
    mountCase(
      () => options.render(props),
      options.wrap === undefined ? {} : { wrap: options.wrap },
    );

  describe(`${name} · focus / blur`, () => {
    it('焦点元素可聚焦（selector 指向正确）', async () => {
      const mounted = mountWith({});
      try {
        const element = findFocusElement(mounted.host, options.selector, context);
        element.focus();
        await flushAll();
        expect(document.activeElement).toBe(element);
      } finally {
        mounted.destroy();
      }
    });

    it('真实 focus 事件触发 onFocus', async () => {
      const onFocus = vi.fn();
      const mounted = mountWith({ onFocus });
      try {
        const element = findFocusElement(mounted.host, options.selector, context);
        dispatchFocusEvent(element, 'focus');
        await flushAll();
        expect(onFocus).toHaveBeenCalledTimes(1);
      } finally {
        mounted.destroy();
      }
    });

    it('真实 blur 事件触发 onBlur', async () => {
      const onBlur = vi.fn();
      const mounted = mountWith({ onBlur });
      try {
        const element = findFocusElement(mounted.host, options.selector, context);
        element.focus();
        await flushAll();
        dispatchFocusEvent(element, 'blur');
        await flushAll();
        expect(onBlur).toHaveBeenCalledTimes(1);
      } finally {
        mounted.destroy();
      }
    });

    if (options.refFocus === true) {
      it('ref.focus() 把焦点请求转发给了焦点元素', async () => {
        const mounted = mountWith({});
        try {
          const element = findFocusElement(mounted.host, options.selector, context);
          const exposed = exposedOf(mounted, options.render({}), context);
          const probe = instrument(element, 'focus');
          try {
            expect(typeof exposed.focus).toBe('function');
            (exposed.focus as () => void)();
            await flushAll();
            expect(probe.calls()).toBe(1);
          } finally {
            probe.restore();
          }
        } finally {
          mounted.destroy();
        }
      });

      it('ref.blur() 把失焦请求转发给了焦点元素', async () => {
        const mounted = mountWith({});
        try {
          const element = findFocusElement(mounted.host, options.selector, context);
          const exposed = exposedOf(mounted, options.render({}), context);
          element.focus();
          await flushAll();

          const probe = instrument(element, 'blur');
          try {
            expect(typeof exposed.blur).toBe('function');
            (exposed.blur as () => void)();
            await flushAll();
            expect(probe.calls()).toBe(1);
          } finally {
            probe.restore();
          }
        } finally {
          mounted.destroy();
        }
      });
    }

    if (options.autoFocus === true) {
      it('autoFocus 时挂载后焦点落在焦点元素上', async () => {
        const mounted = mountWith({ autoFocus: true });
        try {
          const element = findFocusElement(mounted.host, options.selector, context);
          await flushAll();
          expect(document.activeElement).toBe(element);
        } finally {
          mounted.destroy();
        }
      });
    }
  });
}

/**
 * 同时提供默认导出 —— 上游 antd 的 `tests/shared/*` 用的是默认导出，
 * 保留它可以让「从 antd 迁移」时按原样 `import focusTest from "…"` 继续工作。
 */
export default focusTest;
