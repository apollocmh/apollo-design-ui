/**
 * matrix.mjs — 视觉回归的截图矩阵定义。
 *
 * 约定：`id = <component>/<variant>__<theme>__<viewport>`，两侧（react / vue）共用同一 id，
 * 因此一张 React 截图与一张 Vue 截图天然配对。
 *
 * ── 与其他层的关系 ──────────────────────────────────────────────────────────
 *
 * `tests/compat` 在 jsdom 里比 DOM 结构（`A9` 允许它 import antd）；本目录在真实
 * 浏览器里比**像素**。两者互补，不重叠。
 *
 * ── 关于 dark / compact ─────────────────────────────────────────────────────
 *
 * `TESTING.md` §9.1 把 dark / compact 列为必选。但我们的主题切换依赖
 * `ConfigProvider`，而 `ConfigProvider` **组件**尚未实现（只有 `context.ts`），
 * 且零运行时架构下 `tokens.css` 是**构建期产物** —— 运行时无法切换算法。
 * 所以本阶段 `THEMES` 只有 light。这不是「降低门槛」（`H8`），而是把不可比的部分
 * 显式登记在 `LIMITATIONS` 里，等 ConfigProvider 落地后补齐。
 */

/** viewport：`TESTING.md` §9.1 要求每个状态至少覆盖 3 个。 */
export const VIEWPORTS = [
  { id: 'mobile', width: 375, height: 667 },
  { id: 'tablet', width: 768, height: 1024 },
  { id: 'desktop', width: 1440, height: 900 },
];

/**
 * 主题。dark / compact 见文件头说明。
 *
 * `antdTheme` 传给 antd 的 `ConfigProvider`；`apolloTokens` 是对应的构建期 token 产物名。
 */
export const THEMES = [{ id: 'light', antdTheme: 'default', apolloTokens: 'light' }];

/**
 * 组件矩阵。
 *
 * ⚠️ `variants` **不是** demo 名。antd 的 demo 与我们的 demo 并不一一对应
 * （antd 的 `customize` / `config-provider` / `style-class` 依赖 antd-style、
 * Select / Table 等我们尚未实现的组件），拿 demo 互相截图比的是「demo 不同」。
 *
 * 所以这里是**视觉用例**：两侧各写一份、语义逐条对齐，覆盖组件的**视觉面**。
 * 同名用例放在 `render/cases/react/<component>.jsx` 与 `render/cases/vue/<component>.js`，
 * 共用 `render/cases/shared.mjs` 里的常量，确保输入一致。
 */
export const COMPONENTS = {
  empty: {
    variants: [
      'default', // 默认：locale 文案 + 默认插画
      'simple', // PRESENTED_IMAGE_SIMPLE（触发 -normal 类名）
      'no-description', // description={false}：不渲染描述块
      'custom-description', // description 传节点
      'custom-image', // image 传 data URI
      'with-footer', // 默认插槽 → footer
      'semantic', // classNames / styles 语义化覆盖
    ],
  },
};

/** 本阶段明确不覆盖的维度 —— 出现在报告里，避免「没做」被误读为「做了」。 */
export const LIMITATIONS = [
  {
    dimension: 'theme',
    missing: ['dark', 'compact'],
    reason:
      '零运行时架构下 tokens.css 是构建期产物，运行时切换算法依赖 ConfigProvider，而该组件尚未实现（只有 context.ts）。',
    unblockWhen: 'ConfigProvider 完成 G0→G14 后，为 dark / compact 各生成一份 token 产物再补矩阵。',
  },
  {
    dimension: 'state',
    missing: ['hover', 'active', 'focus', 'disabled', 'loading'],
    reason:
      'Empty 是纯展示组件：无事件、无状态、无可交互元素。这些状态对它不适用（与 registry 的 interactionStatus = n/a 同源）。',
    unblockWhen: '不适用。',
  },
];

/** 展开成截图任务列表。 */
export function buildCases({ component, variants } = {}) {
  const names = component ? [component] : Object.keys(COMPONENTS);
  const cases = [];

  for (const name of names) {
    const def = COMPONENTS[name];
    if (!def) throw new Error(`组件 ${name} 未在 matrix.mjs 的 COMPONENTS 中登记`);
    const useVariants = variants ?? def.variants;

    for (const variant of useVariants) {
      if (!def.variants.includes(variant)) {
        throw new Error(
          `组件 ${name} 没有 variant「${variant}」（已登记：${def.variants.join(', ')}）`,
        );
      }
      for (const theme of THEMES) {
        for (const viewport of VIEWPORTS) {
          cases.push({
            component: name,
            variant,
            theme: theme.id,
            antdTheme: theme.antdTheme,
            apolloTokens: theme.apolloTokens,
            viewport: viewport.id,
            width: viewport.width,
            height: viewport.height,
            id: `${name}/${variant}__${theme.id}__${viewport.id}`,
          });
        }
      }
    }
  }
  return cases;
}

/** 渲染页的 URL：`?component=&variant=&theme=` */
export function caseUrl(c) {
  const q = new URLSearchParams({
    component: c.component,
    variant: c.variant,
    theme: c.theme,
  });
  return `/?${q.toString()}`;
}
