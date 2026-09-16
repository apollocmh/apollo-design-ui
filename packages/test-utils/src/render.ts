/**
 * 渲染源 → 一组可挂载的用例。**内部模块，不从包入口导出。**
 *
 * 存在的理由：`demoTest` / `rtlTest` / `themeTest` / `a11yDemoTest` 都需要
 * 「把 `RenderSource` 变成 N 个已挂载的 wrapper」。若各写一遍，
 * 「demo 模块怎么解析成组件」这条规则就会有 4 份实现（T2 禁止的那种重复）。
 */

import { mount, type VueWrapper } from '@vue/test-utils';
import { type Component, defineComponent, h, isVNode, ref, type VNodeChild } from 'vue';
import { flushAll } from './timing';
import type { DemoModules, RenderFactory, RenderSource, Wrap } from './types';

/** 一个可渲染的用例。 */
export interface RenderCase {
  /** 用例标识。`demos` 下是 glob 的键（相对路径），`render` 下是 `'(render)'`。 */
  id: string;
  render: RenderFactory;
}

/** 已挂载的用例。 */
export interface MountedCase {
  wrapper: VueWrapper;
  /**
   * **外层**承载元素（由本模块创建）。`destroy()` 会把它从文档移除。
   *
   * ⚠️ 它的 `innerHTML` / `children` **不是**被测产物 —— 中间还隔着
   *    `@vue/test-utils` 自建的挂载容器（见 {@link MountedCase.content}）。
   *    需要 `id` 供 `getPopupContainer` 定位时用这个元素。
   */
  host: HTMLElement;
  /**
   * 挂载容器 —— 产物是它的**子节点**。
   *
   * 实测的 DOM 结构是三层：
   * ```
   * host  >  content(div[data-v-app])  >  产物
   *  ↑         ↑                           ↑
   *  本模块建   @vue/test-utils 建           要断言「根元素」就取它的 children
   * ```
   * `data-v-app` 是 Vue 打给**挂载容器**的标记。
   */
  content: HTMLElement;
  /**
   * 被测产物的 HTML（与 React 侧 `renderToStaticMarkup` 对位）。
   *
   * 即 `content.innerHTML`。直接读 `host.innerHTML` 会多出一层包装 div，
   * 让 DOM 契约比对永远多一条 `我们多出属性 data-v-app=""`。
   */
  html(): string;
  /**
   * 强制走一次**更新**路径（不是重新挂载）。
   *
   * 实现方式是 bump 一个被渲染函数读取的 `ref`：Vue 会重跑渲染函数并 patch。
   * 这比 `setProps` 更通用 —— 被测对象可能是多根组件、可能根本不接受 props。
   */
  update(): Promise<void>;
  /** 卸载并移除承载元素。幂等。 */
  destroy(): void;
}

const IDENTITY_WRAP: Wrap = (slot) => slot();

/**
 * 构造「用例条数与声明不符」的失败信息。空数组 = 通过。**纯函数**。
 *
 * 存在的理由：`import.meta.glob` 匹配不到文件时**不会报错**，只会少生成用例 ——
 * 文件被重命名 / 删除 / 移出目录后，「测试全绿」会静默地少测几条。
 * 声明条数把这件事变成红灯（见 `test-utils-contract.md` F1）。
 *
 * 抽成纯函数是为了让**这条判定本身**可被单测覆盖，
 * 而不是只能在某个组件把 `expectCount` 写错时才执行到。
 */
export function collectCountFailures(
  actual: number,
  expected: number | undefined,
  label: string,
): string[] {
  if (expected === undefined || actual === expected) return [];
  return [
    `${label}：实际 ${actual} 条，声明 ${expected} 条。` +
      '请检查 glob 模式是否仍匹配到全部文件（文件被重命名/移动时不会报错，只会少生成用例）。',
  ];
}

/** 一个「看起来像组件」的对象。用于把 `{ name, render }` / `defineComponent(...)` 与普通数据区分开。 */
function looksLikeComponent(value: object): boolean {
  return ['render', 'setup', 'template', '__name', 'name', 'props', 'emits', 'components'].some(
    (key) => key in value,
  );
}

/**
 * 把 demo 模块 / 组件 / vnode 统一解析成可渲染的 vnode。
 *
 * `import.meta.glob('*.vue', { eager: true })` 的产物形状是 `{ default: Component }`；
 * 若 demo 是 `.ts` 且 `export default` 一个 vnode 工厂，形状又会不同。
 * 与其在文档里约定「必须长成什么样」，不如在这里**显式**处理两种已知形状，
 * 并对第三种**抛错** —— 静默渲染出空内容会让「demo 测试通过」变成一句空话。
 *
 * ⚠️ **必须**经由此函数，不能把组件对象直接塞进渲染函数：
 *    Vue 的渲染函数返回一个**裸组件对象**时不会渲染任何东西（它只认 vnode），
 *    结果是「零个根节点」这种极其难查的假失败。`dom-contract` 曾踩过这个坑。
 *
 * 内部导出（不进包入口）：`dom-contract` 的 `toHtml` 需要与这里**同一套**解析规则（T2）。
 */
export function resolveRenderable(value: unknown, label: string): VNodeChild {
  if (value === null || value === undefined) return null;
  if (isVNode(value)) return value as VNodeChild;
  if (typeof value === 'function') return h(value as Component);

  if (typeof value === 'object') {
    const wrapped = (value as { default?: unknown }).default;
    if (wrapped !== undefined) return resolveRenderable(wrapped, label);
    if (looksLikeComponent(value)) return h(value as Component);
  }

  throw new Error(
    `[test-utils] ${label}：无法解析成可渲染的组件。\n` +
      '  期望形状：SFC 模块 `{ default: Component }`、组件本身、组件工厂、或 vnode。\n' +
      '  检查 import.meta.glob 的 eager 选项与 demo 文件的默认导出。',
  );
}

/** 把一个渲染源展开成用例列表。 */
export function collectRenderCases(source: RenderSource, label: string): RenderCase[] {
  const hasDemos = source.demos !== undefined;
  const hasRender = source.render !== undefined;

  if (hasDemos && hasRender) {
    throw new Error(`[test-utils] ${label}：demos 与 render 互斥，只能给一个。`);
  }

  if (hasRender) {
    const factory = source.render;
    if (factory === undefined) throw new Error(`[test-utils] ${label}：render 不可用。`);
    return [{ id: '(render)', render: factory }];
  }

  if (hasDemos) {
    const modules: DemoModules = source.demos ?? {};
    // 排序：`import.meta.glob` 的键顺序由 Vite 决定，不排序会让用例顺序随构建细节变化。
    return Object.keys(modules)
      .sort()
      .map((key) => ({
        id: key,
        render: () => resolveRenderable(modules[key], `${label} → ${key}`),
      }));
  }

  throw new Error(
    `[test-utils] ${label}：必须提供 demos 或 render。\n` +
      '  demo 遍历的写法：demoTest(name, import.meta.glob("../demo/*.vue", { eager: true }))',
  );
}

/** 挂载一个用例。 */
export function mountCase(
  render: RenderFactory,
  options: { wrap?: Wrap; attach?: boolean } = {},
): MountedCase {
  const { wrap = IDENTITY_WRAP, attach = true } = options;

  const host = document.createElement('div');
  // ⚠️ `attach` 只控制 host **是否进入文档**，不控制 `attachTo`。
  //    必须始终 `attachTo: host`：否则 `@vue/test-utils` 会自建一个内部容器，
  //    内容落在那里，`html()` 读 `host.innerHTML` 就永远是空串
  //    （实测过，见 render.test.ts 的 `attach: false` 用例）。
  //    `attachTo` 接受游离元素，不要求它在文档里。
  if (attach) document.body.appendChild(host);

  // 渲染函数读它 → Vue 建立依赖；`update()` bump 它 → 触发重渲染。
  const version = ref(0);

  const Host = defineComponent({
    name: 'TestUtilsRenderHost',
    setup() {
      return () => {
        // 显式读取，制造依赖（不读就不会重渲染）。
        void version.value;
        return wrap(() => render());
      };
    },
  });

  const wrapper = mount(Host, { attachTo: host });
  let destroyed = false;

  // `@vue/test-utils` 的 `mount` 会自建一个容器元素、append 进 host、并把 Vue 应用挂在它上面
  // （Vue 会给挂载容器打 `data-v-app`）。所以产物在**第二层**：
  //     host > div[data-v-app] > 产物
  // 直接读 `host.innerHTML` 会多出一层包装 div，契约比对必然报 `data-v-app` 多出属性。
  const container = host.firstElementChild;
  if (!(container instanceof HTMLElement)) {
    throw new Error(
      '[test-utils] mountCase：挂载后找不到承载容器，`html()` / `content` 无法工作。\n' +
        '  这通常意味着 @vue/test-utils 的内部结构变了 —— 请检查它是否仍会创建挂载容器。',
    );
  }

  return {
    wrapper,
    host,
    content: container,
    html: () => container.innerHTML,
    /**
     * 强制走一次更新路径：bump `version` → Host 重跑渲染函数 → patch。
     *
     * ⚠️ 它**只保证 Host 重跑渲染函数并 patch**。被测组件内部若没有响应式依赖变化，
     *    Vue 不会重跑它自己的 render —— 这是 Vue 的正常语义，不是本函数的缺陷。
     *    要驱动组件内部状态变化，请在用例里改它自己的响应式数据或 `setProps`。
     */
    update: async () => {
      version.value += 1;
      await flushAll();
    },
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      wrapper.unmount();
      host.remove();
    },
  };
}
