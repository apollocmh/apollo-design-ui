/**
 * BorderBeam 的样式生成。
 *
 * 契约来源：antd 6.6.4 的 `es/border-beam/style/index.js`。选择器结构、属性、
 * 取值**逐条对齐真实产物**（extractStyle 提取，含双层 @supports 与 reduced-motion）。
 *
 * ── 与 antd 产物的有意差异 ────────────────────────────────────────────────────
 *
 * 1. 无 hash 包裹（D5）；keyframes 名前缀派生（spin 范式）。
 * 2. antd 的 genNoMotionRawStyle 在 reduced-motion 下给 ::before 补
 *    `transition:none;animation:none` —— 逐字保留（它是上游共享 motion helper）。
 * 3. 运行时变量 `--{root}-border-beam-*` 由 props 写在 Effect style 上（Teleport
 *    元素），规则侧全部 `var(…, fallback)` 消费，fallback 与 antd 逐字一致。
 */

import { token2CSSVar } from '@apollo-design/theme';
import { DEFAULT_BORDER_BEAM_DURATION, MAX_BEAM_COLOR_STOP_PERCENT } from '../util';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/**
 * 生成 BorderBeam 的静态 CSS。
 *
 * @param rootPrefixCls 根前缀（`apollo` 或 `ant`）—— 组件类名与运行时 CSS 变量的命名根
 */
export function genBorderBeamStyle(rootPrefixCls: string): string {
  const cls = `.${rootPrefixCls}-border-beam`;
  const cssVar = (name: string, fallback?: string): string =>
    fallback
      ? `var(--${rootPrefixCls}-border-beam-${name}, ${fallback})`
      : `var(--${rootPrefixCls}-border-beam-${name})`;

  // 默认渐变（beam-gradient 未写时的 fallback，token 驱动）
  const defaultBeamGradient = `linear-gradient(to left, ${v('colorPrimary')} 0%, ${v('colorPrimaryHover')} ${MAX_BEAM_COLOR_STOP_PERCENT}%, transparent)`;
  const keyframeName = `${rootPrefixCls}-border-beam-move`;

  const rules: string[] = [
    // ---- keyframes（antd 的 antBorderBeamMove）----
    `@keyframes ${keyframeName}{0%{offset-distance:0%;}100%{offset-distance:100%;}}`,

    // ---- 根（Container）----
    `${cls}{`,
    // genCommonStyle（genStyleHooks 注入）：字体规则（全量回归教训，见清单 §六.6）
    `  font-family:${v('fontFamily')};`,
    `  font-size:${v('fontSize')};`,
    `  display:none;`,
    `  position:absolute;`,
    `  inset:${cssVar('inset-offset', '0px')};`,
    `  border-radius:inherit;`,
    `  z-index:1;`,
    `  overflow:hidden;`,
    `  pointer-events:none;`,
    `  padding:${cssVar('line-width', v('lineWidth'))};`,
    `}`,
  ];

  // ---- mask 抠边 + 内层 @supports 才显示（antd 的嵌套 @supports 产物展平为两条）----
  rules.push(
    `${cls}{`,
    `  -webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);`,
    `  -webkit-mask-composite:xor;`,
    `  mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);`,
    `  mask-composite:exclude;`,
    `}`,
    `${cls}{`,
    `  display:block;`,
    `}`,
  );

  // ---- ::before 流光 ----
  rules.push(
    `${cls}::before{`,
    `  content:"";`,
    `  position:absolute;`,
    `  top:0;`,
    `  left:0;`,
    `  width:${cssVar('size', '100px')};`,
    `  aspect-ratio:1/1;`,
    `  opacity:0.95;`,
    `  background-image:${cssVar('beam-gradient', defaultBeamGradient)};`,
    `  offset-anchor:90% 50%;`,
    `  offset-distance:0%;`,
    `  offset-path:rect(0 auto auto 0 round ${cssVar('size', '100px')});`,
    `  offset-rotate:auto;`,
    `  animation-name:${keyframeName};`,
    `  animation-duration:${cssVar('duration', `${DEFAULT_BORDER_BEAM_DURATION}s`)};`,
    `  animation-delay:${cssVar('delay', '0s')};`,
    `  animation-timing-function:linear;`,
    `  animation-iteration-count:infinite;`,
    `  will-change:offset-distance;`,
    `}`,
  );

  // ---- prefers-reduced-motion 双保险（genNoMotionRawStyle + display:none）----
  rules.push(
    `@media (prefers-reduced-motion: reduce){`,
    `  ${cls}::before{`,
    `    transition:none;`,
    `    animation:none;`,
    `  }`,
    `}`,
    `@media (prefers-reduced-motion: reduce){`,
    `  ${cls}::before{`,
    `    display:none;`,
    `  }`,
    `}`,
  );

  return rules.join('\n');
}
