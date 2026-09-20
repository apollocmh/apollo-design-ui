/**
 * 组件样式的汇总清单与静态 CSS 生成。
 *
 * ── 为什么这里要有一份「清单」 ────────────────────────────────────────────────
 *
 * 零运行时架构下没有运行时样式注入，CSS 必须在**构建期**落成静态文件。
 * 构建钩子（`packages/ui/build.config.ts`）需要一个「有哪些组件、各自的样式怎么生成」的
 * 真源 —— 那就是本文件。它被打包进 `dist/index.mjs`，钩子从产物里 import 它来生成 CSS
 * （与 `packages/theme/build.config.ts` 从 `dist/index.mjs` 取 `getCSSVarDeclarations`
 * 同一套路：顺带验证了「产物能被真实 import」）。
 *
 * ── 为什么同时为 `apollo` 与 `ant` 生成 ──────────────────────────────────────
 *
 * 裁决 `prefix-cls-default` = A 承诺「默认 `apollo`，允许 ConfigProvider 覆盖为 `ant`」。
 * 但零运行时下 CSS 是构建期产物：只生成 `apollo` 的话，用户把 prefixCls 改成 `ant`
 * 会得到一堆没有样式的类名 —— 那条承诺就是空的。
 *
 * 所以 `STATIC_PREFIX_CLS` 里的每个前缀都会生成一份。代价是 CSS 体积翻倍
 * （单个组件的 CSS 只有几百字节，可接受），换来的是「迁移时把 prefixCls 设成 `ant`
 * 就能复用 antd 的覆盖样式」这条真实可用的路径。
 *
 * **自定义前缀（如 `my-app`）不生成** —— 那种情况请调用 `genComponentCss(name, prefixCls)`
 * 自行产出并引入。这是零运行时的固有代价，登记在 `COMPONENT-RULES.md` 的 R9 讨论里。
 *
 * ── 加一个新组件时要做什么 ──────────────────────────────────────────────────
 *
 * 往 `COMPONENT_STYLES` 里加一行。就这一行 —— 构建钩子、`dist/index.css`、
 * `budget.json` 的体积校验全部自动跟上。
 */

import { genDividerStyle } from '../divider/style';
import { genEmptyStyle } from '../empty/style';
import { genSpaceStyle } from '../space/style';
import { genSpinStyle } from '../spin/style';
import { genTypographyStyle } from '../typography/style';

/**
 * 静态 CSS 覆盖的前缀。
 *
 * 顺序即产物顺序：第一个是默认前缀（`prefix-cls-default` 裁决的 `apollo`）。
 * 新增前缀只要加进这个数组 —— 它同时决定 `dist/<component>/style.css` 的内容。
 */
export const STATIC_PREFIX_CLS = ['apollo', 'ant'] as const;

/** 一个组件的样式入口。 */
export interface ComponentStyleEntry {
  /** 组件目录名（`packages/ui/src/<name>/`），也是 CSS 产物的目录名。 */
  name: string;
  /** 纯函数：类名前缀 → CSS 文本。 */
  gen: (prefixCls: string) => string;
}

/**
 * 组件样式清单。
 *
 * 只列**已经落地样式**的组件。没列的组件不会产出 CSS，`package.json` 的 exports
 * 也不会声明对应的子路径（见 `scaffold-packages.mjs` 的 `uiStyleExports`）。
 */
export const COMPONENT_STYLES: readonly ComponentStyleEntry[] = [
  { name: 'divider', gen: genDividerStyle },
  { name: 'empty', gen: genEmptyStyle },
  { name: 'space', gen: genSpaceStyle },
  { name: 'spin', gen: genSpinStyle },
  { name: 'typography', gen: genTypographyStyle },
];

/** 生成单个组件在**指定前缀**下的 CSS。自定义 prefixCls 的用户用这个。 */
export function genComponentCss(name: string, prefixCls: string): string {
  const entry = COMPONENT_STYLES.find((item) => item.name === name);
  if (!entry) {
    throw new Error(
      `[apollo: style] 未知组件 "${name}"。已知：${COMPONENT_STYLES.map((i) => i.name).join(', ')}`,
    );
  }
  return entry.gen(prefixCls);
}

/**
 * 全局基础样式（antd `reset.css` 的最小版）。
 *
 * ⚠️ 2026-09-18 L6 暴露的**基础设施缺口**：
 *   `tokens.css` 只声明 `var(--apollo-*)` 变量，**没人**把它应用到 `:root` 或 `body` —
 *   结果浏览器用默认字体（macOS Chrome = **Times**），所有含描述文字的组件视觉差异
 *   都被判 block-diff。
 *
 * 这一段同时嵌进「汇总 CSS」与「每个组件 CSS」—— 不然只引单个组件 CSS（如
 * `@apollo-design/ui/empty/style.css`）也会退回 Times。
 *
 * 现在只覆盖**L6 必需**的几条（box-sizing、font-family/size、body 基础 reset）。
 * 完整的全局 reset（h1-h6 重置、列表样式、button 重置等）按 antd 的范围补齐
 * —— 但那不是 empty 收口的工作，记入未决。
 */
export const BASE_CSS = [
  '*',
  '*::before',
  '*::after',
  '{box-sizing:border-box}',
  // html + body 同时设：避免任何不一致的 DOM 结构（例如把 `<style>` 挂到 `<html>`）拿到不同字体。
  'html,body{margin:0;padding:0}',
  'html{font-family:var(--apollo-font-family)}',
  'body{font-family:var(--apollo-font-family);font-size:var(--apollo-font-size)}',
].join('');

/** 生成单个组件在**全部静态前缀**下的 CSS（`dist/<name>/style.css` 的内容）。 */
export function genComponentStyleSheet(name: string): string {
  const entry = COMPONENT_STYLES.find((item) => item.name === name);
  if (!entry) {
    throw new Error(
      `[apollo: style] 未知组件 "${name}"。已知：${COMPONENT_STYLES.map((i) => i.name).join(', ')}`,
    );
  }
  return [
    `/*! @apollo-design/ui — ${name} 组件样式（自动生成，勿手改） */`,
    `/*! 前缀：${STATIC_PREFIX_CLS.join(' / ')} ｜ 生成方式：packages/ui/build.config.ts */`,
    '',
    BASE_CSS,
    '',
    ...STATIC_PREFIX_CLS.map((prefix) => entry.gen(prefix)),
  ].join('\n');
}

/** 组件名 → 该组件的完整 CSS。构建钩子据此写出每组件一份。 */
export function genComponentStyleMap(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const entry of COMPONENT_STYLES) {
    out[entry.name] = genComponentStyleSheet(entry.name);
  }
  return out;
}

/** 全部组件的汇总 CSS（`dist/index.css` 的内容）。 */
export function genAllStyles(): string {
  return [
    '/*!',
    ' * @apollo-design/ui — 全部组件样式（自动生成，勿手改）',
    ` * 组件数：${COMPONENT_STYLES.length} ｜ 前缀：${STATIC_PREFIX_CLS.join(' / ')}`,
    ' * 按需引入请用 `@apollo-design/ui/<component>/style.css`，不要引本文件。',
    ' * 主题变量不在本文件里 —— 先引入 `@apollo-design/theme/tokens.css`。',
    ' */',
    '',
    BASE_CSS,
    '',
    ...COMPONENT_STYLES.flatMap((entry) => STATIC_PREFIX_CLS.map((prefix) => entry.gen(prefix))),
  ].join('\n');
}
