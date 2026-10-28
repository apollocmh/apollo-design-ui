/** Horizontal alternate rows share intrinsic title/content tracks. Subgrids keep
 * the existing semantic element boxes, one aligned axis and natural long text.
 * The original absolute/nowrap layout overlapped real horizontal-debug content.
 */

import type { TimelineStyleContext } from './context';

export function genHorizontalStyle(ctx: TimelineStyleContext): string[] {
  // ⚠️ 横向的 14 条规则只消费**全局 token**（`v`）与 **Steps 的内部变量**（`sv`）——
  //    不用 Component Token（`tv`），所以不解构它。
  const { cls, v, sv } = ctx;
  const item = `${cls}-item`;
  const icon = `${item}-icon`;
  const rail = `${item}-rail`;
  const title = `${item}-title`;
  const content = `${item}-content`;
  const wrapper = `${item}-wrapper`;
  const section = `${item}-section`;
  const header = `${item}-header`;

  /** `-horizontal` 的两套布局前缀。 */
  const alt = `${cls}-horizontal${cls}-layout-alternate`;
  const single = `${cls}-horizontal:not(${cls}-layout-alternate)`;

  return [
    // ---- 29 根：覆盖 Steps 的纵向行距 + 自己的 content-height ----
    `${cls}-horizontal{`,
    // ⚠️ **声明**的是 Steps 的变量 ⇒ 必须用它的**固定 `apollo`** 前缀（见文件头 / `index.ts` 的 `sv`）
    `  --apollo-cmp-steps-title-vertical-row-gap:${v('paddingXS')};`,
    `  --${ctx.p}-timeline-content-height:${v('fontHeight')};`,
    `  align-items:stretch;`,
    `}`,

    `${alt}{`,
    `  display:grid;`,
    `  grid-auto-flow:column;`,
    `  grid-auto-columns:minmax(0, 1fr);`,
    `  grid-template-rows:minmax(var(--${ctx.p}-timeline-content-height), auto) ${sv('icon-size-max')} minmax(var(--${ctx.p}-timeline-content-height), auto);`,
    `  row-gap:${sv('title-vertical-row-gap')};`,
    `}`,
    `${alt} ${item},${alt} ${item} ${wrapper},${alt} ${item} ${section},${alt} ${item} ${header}{`,
    `  display:grid;`,
    `  grid-template-rows:subgrid;`,
    `  grid-template-columns:minmax(0, 1fr);`,
    `  grid-row:1 / 4;`,
    `  min-width:0;`,
    `  row-gap:inherit;`,
    `  align-self:stretch;`,
    `}`,
    `${alt} ${item} ${wrapper},${alt} ${item} ${section},${alt} ${item} ${header}{`,
    `  grid-column:1;`,
    `}`,
    `${alt} ${item} ${icon}{`,
    `  grid-row:2;`,
    `  grid-column:1;`,
    `  margin:0;`,
    `  justify-self:center;`,
    `}`,
    `${alt} ${item} ${rail}{`,
    `  grid-row:2;`,
    `  grid-column:1;`,
    `  position:relative;`,
    `  top:auto;`,
    `  height:0;`,
    `  align-self:center;`,
    `  transform:none;`,
    `  margin:0;`,
    `}`,
    `${alt} ${item} ${title},${alt} ${item} ${content}{`,
    `  grid-column:1;`,
    `  min-width:0;`,
    `  padding-inline:${v('paddingXXS')};`,
    `  white-space:normal;`,
    `  overflow-wrap:anywhere;`,
    `}`,
    `${alt} ${item}-placement-start ${title},${alt} ${item}-placement-end ${content}{`,
    `  grid-row:1;`,
    `  align-self:end;`,
    `}`,
    `${alt} ${item}-placement-start ${content},${alt} ${item}-placement-end ${title}{`,
    `  grid-row:3;`,
    `  align-self:start;`,
    `}`,

    // ---- 40-42 非交错的横向：单侧靠齐 + rail 翻转 ----
    `${single} ${item}-placement-end{`,
    `  display:flex;`,
    `  align-items:flex-end;`,
    `}`,
    `${single} ${item}-placement-end ${wrapper}{`,
    `  flex:auto;`,
    `  flex-direction:column-reverse;`,
    `}`,
    `${single} ${item}-placement-end ${rail}{`,
    `  top:auto;`,
    `  bottom:${sv('horizontal-rail-margin')};`,
    `  transform:none;`,
    `}`,
  ];
}
