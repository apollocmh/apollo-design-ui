/**
 * `rootPropsTest` —— `rootClassName` / `rootStyle` / `prefixCls` 三个「根属性」的契约。
 *
 * ── 与上游的关系（`tests/shared/rootPropsTest.tsx`，124 行）─────────────────────
 * 上游只测 `rootClassName`，核心断言是这两行：
 *
 *     expect(ele).toHaveClass(rootClassName);
 *     expect(ele.querySelector(`.${rootClassName}`)).toBeFalsy();   // 不下渗
 *
 * 第二行是真正有价值的部分：**`rootClassName` 只能出现在根元素上，不能下渗到子元素**。
 * 我们原样保留它，并补上本仓库 `packages/test-utils/README.md` 声明的另外两个：
 * `rootStyle` 与 `prefixCls`（`COMPONENT-RULES.md` §4 要求每个组件都支持）。
 *
 * 上游用 `jest.requireActual('../../components/' + name)` 动态取组件，并靠
 * `beforeRender` / `afterRender` / `findRootElements` 三个钩子绕开「不同组件的根元素
 * 位置不同」。动态 require 在 Vite/ESM 下不存在，我们改为**由调用方传渲染工厂**，
 * 三个钩子保留（它们解决的是真问题，不是框架问题）。
 *
 * ── `prefixCls` 默认值为什么是 `test-prefix` 而不是 `apollo` ────────────────────
 * 用**非默认值**才能证明组件真的读了 `prefixCls` 这个 prop。
 * 传 `'apollo'`（组件自己的默认值）时，「组件硬编码 `apollo`」与
 * 「组件正确读取了 prop」两种实现的产物**完全一样** —— 这条断言就没有分辨力。
 *
 * ── 这个测试没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明 `rootClassName` 在**浮层**（挂在 `document.body` 的那部分）上也生效。
 *     浮层组件的根属性契约更复杂，需要 `findRoots` 显式指出要看哪里。
 *   - 没证明 `classNames` / `styles`（**语义化**属性）的优先级 ——
 *     那是 `classNames/styles` 的契约，由 `themeTest` 与组件自己的
 *     `semantic.test.ts` 承担。
 *   - 没证明 `rootStyle` 的**优先级**（是否低于组件自身的样式）。这里只证明它被应用了。
 */

import { describe, expect, it } from 'vitest';
import { assertAllowances } from './allowance';
import { mountCase } from './render';
import type { PropsRenderFactory, WarningAllowance, Wrap } from './types';
import { assertNoUnexpectedWarnings, captureWarnings } from './warnings';

/** 默认的根类名。必须是**单个**类名 token（会被当成 CSS 类选择器用）。 */
const DEFAULT_ROOT_CLASS = 'TEST_ROOT_CLS';

/** 默认的根内联样式。键为 kebab-case 的 CSS 属性名。 */
const DEFAULT_ROOT_STYLE: Readonly<Record<string, string>> = { 'margin-top': '1px' };

/**
 * 默认的 `prefixCls`。
 *
 * ⚠️ 刻意**不用**组件自己的默认值（`apollo`）—— 见文件头说明。
 */
const DEFAULT_PREFIX_CLS = 'test-prefix';

export interface RootPropsTestOptions {
  /**
   * 渲染工厂。**接受 props** —— 本模块需要注入 `rootClassName` / `rootStyle` / `prefixCls`。
   */
  render: PropsRenderFactory;
  /** Provider 包装。默认恒等。 */
  wrap?: Wrap;
  /**
   * 承载元素的 `id`。默认 `'holder'`。
   *
   * 存在的意义与上游的 `<div id="holder">` 相同：含浮层的组件需要
   * `getPopupContainer` 指向一个**容器**，`wrap` 里可以写
   * `() => document.getElementById('holder')`。
   */
  containerId?: string;
  /** 期望的根元素个数。不给时只要求「至少一个」。 */
  expectCount?: number;
  /**
   * 自定义根元素查找。
   *
   * 默认取**产物自己的根节点**（已跳过 `@vue/test-utils` 的挂载容器那一层，
   * 见 `defaultFindRoots`）。浮层组件（根在 `document.body` 上）、多根组件、
   * 自带包裹层的组件需要覆盖它 —— 那时 `host` 是承载元素本身，
   * 配合 `containerId` 与 `getPopupContainer` 使用。
   */
  findRoots?: (host: HTMLElement) => Element[];
  /** 渲染前钩子。 */
  beforeRender?: () => void;
  /** 渲染后钩子（拿到承载元素）。可异步。 */
  afterRender?: (host: HTMLElement) => void | Promise<void>;
  /** 透传给被测组件的其他 props。 */
  props?: Record<string, unknown>;
  /** 期望的根类名。默认 `'TEST_ROOT_CLS'`。 */
  rootClassName?: string;
  /** 期望的根内联样式。默认 `{ 'margin-top': '1px' }`。 */
  rootStyle?: Readonly<Record<string, string>>;
  /** 期望的 `prefixCls`。默认 `'test-prefix'`。传 `false` 跳过前缀断言。 */
  prefixCls?: string | false;
  /** 允许的告警。必须带 `reason`。 */
  allow?: readonly WarningAllowance[];
}

function classTokens(element: Element): string[] {
  return Array.from(element.classList);
}

/** 根属性的期望值。 */
export interface RootPropExpectations {
  rootClassName: string;
  rootStyle: Readonly<Record<string, string>>;
  /** `false` 表示不校验前缀。 */
  prefixCls: string | false;
}

/**
 * 逐根元素收集不满足项。空数组 = 全部通过。
 *
 * **纯函数**，不依赖测试框架 —— 判定逻辑本身可被单测覆盖，
 * 而不是只能在某个组件的 `rootPropsTest` 失败时才被执行到。
 */
export function collectRootPropFailures(
  roots: readonly Element[],
  expectations: RootPropExpectations,
): string[] {
  const { rootClassName, rootStyle, prefixCls } = expectations;
  const failures: string[] = [];

  for (const [index, root] of roots.entries()) {
    const tokens = classTokens(root);

    if (!tokens.includes(rootClassName)) {
      failures.push(
        `根[${index}] 缺少 rootClassName="${rootClassName}"，实际 [${tokens.join(' ')}]`,
      );
    }

    // 不下渗：根**内部**不应再出现同一个类名。
    if (root.querySelector(`.${rootClassName}`) !== null) {
      failures.push(`根[${index}] 的子孙元素上出现了 rootClassName（应当只落在根上）`);
    }

    for (const [property, value] of Object.entries(rootStyle)) {
      const actual = (root as HTMLElement).style.getPropertyValue(property).trim();
      if (actual !== value) {
        failures.push(`根[${index}] 的 rootStyle["${property}"] 期望 "${value}"，实际 "${actual}"`);
      }
    }

    if (prefixCls !== false && !tokens.some((token) => token.startsWith(`${prefixCls}-`))) {
      failures.push(
        `根[${index}] 没有以 "${prefixCls}-" 开头的类名（prefixCls 未被读取或未用于根类名），` +
          `实际 [${tokens.join(' ')}]`,
      );
    }
  }

  return failures;
}

/**
 * 默认的根元素查找：**跳过挂载容器那一层**，取产物自己的根节点。
 *
 * ⚠️ 实测 DOM 结构是 `host > div[data-v-app] > 产物`（见 `render.ts` 的 `MountedCase.content`）。
 *    直接取 `host.children` 会拿到容器 div —— 它当然没有 `rootClassName`，
 *    于是**每个**组件都会以「根[0] 缺少 rootClassName」失败，且失败原因指向错误的方向。
 *    这个坑是靠本模块的单测（`root-props.test.ts`）钉住的。
 */
function defaultFindRoots(host: HTMLElement): Element[] {
  return Array.from(host.firstElementChild?.children ?? []);
}

export function rootPropsTest(name: string, options: RootPropsTestOptions): void {
  const context = `rootPropsTest('${name}')`;
  const rootClassName = options.rootClassName ?? DEFAULT_ROOT_CLASS;
  const rootStyle = options.rootStyle ?? DEFAULT_ROOT_STYLE;
  const prefixCls = options.prefixCls === undefined ? DEFAULT_PREFIX_CLS : options.prefixCls;
  const containerId = options.containerId ?? 'holder';

  if (rootClassName.includes(' ')) {
    throw new Error(
      `[test-utils] ${context}：rootClassName 必须是单个类名 token（会作为 CSS 选择器使用），收到 "${rootClassName}"。`,
    );
  }

  // ⚠️ 与其它共享契约模块一致：收集阶段就校验豁免（快速失败）。
  assertAllowances(options.allow ?? [], context);

  const findRoots = (host: HTMLElement): Element[] =>
    options.findRoots ? options.findRoots(host) : defaultFindRoots(host);

  describe(`${name} · root props`, () => {
    it(`rootClassName / rootStyle${prefixCls === false ? '' : ' / prefixCls'} 落在根元素上`, async () => {
      options.beforeRender?.();

      const capture = captureWarnings();
      let roots: Element[] = [];
      let host: HTMLElement | null = null;

      try {
        const mounted = mountCase(
          () =>
            options.render({
              ...options.props,
              rootClassName,
              rootStyle,
              ...(prefixCls === false ? {} : { prefixCls }),
            }),
          {
            ...(options.wrap === undefined ? {} : { wrap: options.wrap }),
            attach: true,
          },
        );
        try {
          host = mounted.host;
          host.id = containerId;
          // 挂载后钩子可能触发浮层；它拿到的就是承载元素本身。
          await options.afterRender?.(host);
          roots = findRoots(host);
        } finally {
          mounted.destroy();
        }
      } finally {
        capture.restore();
      }

      assertNoUnexpectedWarnings(capture.records, options.allow, context);

      expect(roots.length).toBeGreaterThan(0);
      if (options.expectCount !== undefined) {
        expect(roots).toHaveLength(options.expectCount);
      }

      expect(collectRootPropFailures(roots, { rootClassName, rootStyle, prefixCls })).toEqual([]);
    });
  });
}

/** 本模块的默认值。导出是为了让调用方与类型测试能引用同一份常量，而不是抄一遍。 */
export const ROOT_PROPS_DEFAULTS = {
  rootClassName: DEFAULT_ROOT_CLASS,
  rootStyle: DEFAULT_ROOT_STYLE,
  prefixCls: DEFAULT_PREFIX_CLS,
} as const;

/**
 * 同时提供默认导出 —— 上游 antd 的 `tests/shared/*` 用的是默认导出，
 * 保留它可以让「从 antd 迁移」时按原样 `import rootPropsTest from "…"` 继续工作。
 */
export default rootPropsTest;
