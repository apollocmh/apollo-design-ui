/**
 * Empty 的样式生成。
 *
 * 契约来源：antd 6.6.4 的 `es/empty/style/index.js`。选择器结构、属性、取值来源逐条对齐。
 *
 * ── 为什么是「返回 CSS 文本的函数」而不是 CSS 文件 ──────────────────────────────
 *
 * 类名里含 `prefixCls`（裁决 `prefix-cls-default` = A：默认 `apollo`，可覆盖为 `ant`），
 * 而零运行时架构下 CSS 必须是**构建期静态产物** —— 同一个组件要为多个前缀各生成一份。
 * 所以样式的真源是一个纯函数 `(prefixCls) => css`，由构建钩子
 * （`packages/ui/build.config.ts`）落成 `dist/<component>/style.css`。
 *
 * ── Component Token：Empty 一个都没有 ────────────────────────────────────────
 *
 * antd 的 `mergeToken` 造了 4 个**内部** token：
 *
 *   | 内部 token | 值 |
 *   |---|---|
 *   | `emptyImgCls` | `${componentCls}-img` |
 *   | `emptyImgHeight` | `controlHeightLG * 2.5` |
 *   | `emptyImgHeightMD` | `controlHeightLG` |
 *   | `emptyImgHeightSM` | `controlHeightLG * 0.875` |
 *
 * 它们**不在** antd 的 `ComponentToken` 里 —— 用户无法通过 `theme.components.Empty` 覆盖。
 * 所以我们也不暴露，`registry/components.json` 的 `tokenStatus` 记 `n/a`（附依据）。
 * 「登记 0 个 token 并声称完成」与「确认它确实没有 token」是两件事。
 *
 * `emptyImgCls` 是死代码：antd 定义了它但 `genSharedEmptyStyle` 从未引用。
 * 我们不复刻 —— 复刻一个不会被读到的常量只会让人以为它有用。
 *
 * ── 这个函数没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明**视觉**正确。那由 L6（`tests/visual`）逐像素比对。
 *   - 没证明变量名存在。`var(--apollo-*)` 写错不会报错，只会静默失效 ——
 *     这条由 `tests/build/run.mjs` 的 B7 校验（CSS 里引用的每个 `--apollo-*`
 *     都必须在 theme 的 `tokens.css` 里有声明）。
 */

import { token2CSSVar } from '@apollo-design/theme';

/** token 名 → `var(--apollo-*)`。变量名由 theme 包的命名函数给出，不手写字面量。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/**
 * 生成 Empty 的静态 CSS。
 *
 * @param prefixCls 类名前缀（`apollo` 或 `ant`）
 */
export function genEmptyStyle(prefixCls: string): string {
  // ⚠️ 必须带 `-empty` 后缀。Empty.vue 算出来的根类名是 `${prefixCls}-empty`（默认 `apollo-empty`），
  // 选择器若只写 `.${prefixCls}`（即 `.apollo{...}`）会选不中任何元素 —— 视觉回归里
  // 立刻表现为「antd 居中、我们左对齐」。2026-09-18 由 L6 暴露并修复。
  const cls = `.${prefixCls}-empty`;

  // 内部 token：由 controlHeightLG 派生，与 antd 的 `mergeToken` 逐条对应。
  // 写成 calc() 而不是先算成像素 —— 这样 compact / 自定义 controlHeightLG 时高度会跟着变，
  // 与 antd 的运行时行为一致。
  const imgHeight = `calc(${v('controlHeightLG')} * 2.5)`;
  const imgHeightMD = v('controlHeightLG');
  const imgHeightSM = `calc(${v('controlHeightLG')} * 0.875)`;

  return [
    `${cls}{`,
    `  margin-inline:${v('marginXS')};`,
    `  font-size:${v('fontSize')};`,
    `  line-height:${v('lineHeight')};`,
    `  text-align:center;`,
    `}`,
    '',
    // 注意 antd 的写法：`[componentCls-image]: {...}` 是**对象子键**，编译成 CSS 是一段
    // **顶级**选择器 `.ant-empty-image{...}`，不是后代。我们之前写成 `${cls} ${cls}-image`
    // （后代），虽然对当前 DOM 也选得中（image 是 root 的子），但特异性更高、未来 DOM 一变
    // 就断。L6 暴露后统一改成顶级。
    `${cls}-image{`,
    `  height:${imgHeight};`,
    `  margin-bottom:${v('marginXS')};`,
    `  opacity:${v('opacityImage')};`,
    `}`,
    `${cls}-image img{`,
    `  height:100%;`,
    `}`,
    `${cls}-image svg{`,
    `  max-width:100%;`,
    `  height:100%;`,
    `  margin:auto;`,
    `}`,
    '',
    `${cls}-description{`,
    `  color:${v('colorTextDescription')};`,
    `}`,
    `${cls}-footer{`,
    `  margin-top:${v('margin')};`,
    `}`,
    '',
    `${cls}-normal{`,
    `  margin-block:${v('marginXL')};`,
    `  color:${v('colorTextDescription')};`,
    `}`,
    `${cls}-normal ${cls}-description{`,
    `  color:${v('colorTextDescription')};`,
    `}`,
    `${cls}-normal ${cls}-image{`,
    `  height:${imgHeightMD};`,
    `}`,
    '',
    `${cls}-small{`,
    `  margin-block:${v('marginXS')};`,
    `  color:${v('colorTextDescription')};`,
    `}`,
    `${cls}-small ${cls}-image{`,
    `  height:${imgHeightSM};`,
    `}`,
    '',
  ].join('\n');
}
