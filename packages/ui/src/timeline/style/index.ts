/**
 * Timeline 的样式生成（G4 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/timeline/style/index.ts`（275 行）+ `style/horizontal.ts`（120 行）。
 * 选择器结构**从真实产物提取**，不是推演 —— 可复现命令：
 *
 * ```sh
 * node tests/visual/debug/extract-timeline-css.mjs > /tmp/timeline-antd.css
 * ```
 *
 * 产物共 **44 条**含 `ant-timeline` 的规则（其中 1 条是 cssinjs 的缓存标记）；
 * 本文件 + `horizontal.ts` 产出 **39 条**，差掉的 5 条是：
 * `resetComponent` 的 **4 条** `box-sizing` 块（`BASE_CSS` 已覆盖）+ 1 条缓存标记。
 *
 * ── 🚨 本组件样式的**唯一耦合面**：Steps 的内部变量 ───────────────────────────
 *
 * `Timeline` 是 `Steps` 的薄壳（分析 §0），它的样式表**不画自己的 DOM**，
 * 而是大量**覆盖 Steps 的中间变量**（`--{p}-cmp-steps-*`）把「步骤条」改造成「时间轴」：
 *
 * | 覆盖的变量 | 来源 | 作用 |
 * |---|---|---|
 * | `--{p}-cmp-steps-icon-dot-size-custom` | `var(--{p}-timeline-dot-size)` | 节点大小（用户可覆盖） |
 * | `--{p}-cmp-steps-icon-size` | `var(custom, origin)` | **两层回退链**（见 `token.ts` 文件头） |
 * | `--{p}-cmp-steps-dot-icon-border-width` | `var(--{p}-timeline-dot-border-width)` | 节点边框 |
 * | `--{p}-cmp-steps-item-solid-line-color` | `var(--{p}-timeline-tail-color)` | 连线颜色 |
 * | `--{p}-cmp-steps-rail-size` | `var(--{p}-timeline-tail-width)` | 连线粗细 |
 * | `--{p}-cmp-steps-item-process-rail-line-style` | `dotted` | 时间轴的连线是**虚线** |
 *
 * ⚠️ 本仓 `steps` 已声明这些变量的**上游一侧**（已实测：15/17 命中），
 * 所以 Timeline 只需**覆盖**，不需要再改 steps。
 *
 * ── 从产物里抄下来的四处**非显然**结构 ────────────────────────────────────────
 *
 * 1. **`color` 预设色用「三连类」提高特异性**：
 *    `.apollo-timeline-item.apollo-timeline-item.apollo-timeline-item-color-blue`
 *    —— 同一个类写三遍（特异性 0,3,0），压过 Steps 自身的 dot 颜色规则。
 * 2. **`head-span-ptg` 是 `calc(head-span / 24 * 100%)`** —— 24 栅格制，
 *    且 `head-span` 的默认值 **`12`** 由 CSS 声明（运行时被 `titleSpan` 覆盖）。
 * 3. **`-layout-alternate` 与 `:not(-layout-alternate)` 是两套独立布局**（见 `horizontal.ts`）。
 * 4. **`:not(-horizontal)` 把纵向规则全部限定住** —— 横向是**另一套**（`horizontal.ts`）。
 *
 * ── 这个函数证明什么 / 不证明什么 ────────────────────────────────────────────
 *
 * 证明：39 条规则的**选择器结构与声明顺序**与产物逐条对应；4 个 Component Token 的
 * 变量名与**构建期解析值**一致（`genTokenDecls`）。
 *
 * 不证明：视觉正确（L6 逐像素负责）；Steps 的中间变量真的被消费
 * （那是 `steps` 自己的契约）；`--apollo-*` 全局 token 的取值（theme 包负责）。
 */

import { getDesignToken, token2CSSVar } from '@apollo-design/theme';
import type { TimelineStyleContext } from './context';
import { genHorizontalStyle } from './horizontal';
import { type ComponentToken, prepareComponentToken } from './token';

/** token 名 → `var(--apollo-*)`。变量名由 theme 包的命名函数给出，不手写字面量。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

let tokenCache: ComponentToken | null = null;

function timelineTokenValues(): ComponentToken {
  if (!tokenCache) {
    tokenCache = prepareComponentToken(getDesignToken()) as ComponentToken;
  }
  return tokenCache;
}

/** 数字带 `px`、字符串原样 —— 与 cssinjs 的 `unit()` 同义。 */
const unit = (value: number | string): string =>
  typeof value === 'number' ? `${value}px` : String(value);

/**
 * Component Token 的声明块。
 *
 * 🚨 **只有 4 条** —— `dotSize` / `dotBg` 上游**刻意不声明**
 * （`prepareComponentToken` 显式返回 `undefined`），以保住 `var(custom, origin)` 的
 * 两层回退链。详见 `token.ts` 的文件头。
 */
export function genTokenDecls(rootPrefixCls: string): string[] {
  const p = rootPrefixCls;
  const t = timelineTokenValues();
  return [
    `  --${p}-timeline-tail-color:${t.tailColor};`,
    `  --${p}-timeline-tail-width:${unit(t.tailWidth as number | string)};`,
    `  --${p}-timeline-dot-border-width:${unit(t.dotBorderWidth as number | string)};`,
    `  --${p}-timeline-item-padding-bottom:${unit(t.itemPaddingBottom as number)};`,
  ];
}

export function genTimelineStyle(rootPrefixCls: string): string {
  const p = rootPrefixCls;
  const cls = `.${p}-timeline`;
  const item = `${cls}-item`;
  /** 组件 token → `var(--{p}-timeline-*)`。⚠️ 这些**随前缀变**（`genTokenDecls(p)` 同源）。 */
  const tv = (name: string): string => `var(--${p}-timeline-${name})`;
  /**
   * **Steps 的内部变量** → `var(--apollo-cmp-steps-*)`（见文件头）。
   *
   * 🚨 **前缀是固定的 `apollo`，不是 `{p}`** —— 这是本组件最容易写错的一处。
   * 判据：`steps/style/index.ts:172-179` 的 `genStepsStyle(prefixCls)` **只重命名
   * `.apollo-steps` 选择器**（`cssText.split('.apollo-steps').join('.' + prefixCls + '-steps')`），
   * **不重命名 `--apollo-cmp-steps-*` 变量名** ⇒ 两个前缀的产物里这些变量名都是 `--apollo-`。
   *
   * ⚠️ 写成 `--${p}-cmp-steps-*` 时 `ant` 变体会产出 `--ant-cmp-steps-*`：
   * **引用得到、声明不存在** ⇒ `var()` 全部失效 + **B7 报 3 个未声明变量**
   * （实测：`--ant-cmp-steps-icon-size-active` / `-icon-size-max` / `-horizontal-rail-margin`）。
   */
  const sv = (name: string): string => `var(--apollo-cmp-steps-${name})`;

  const ctx: TimelineStyleContext = { p, cls, v, tv, sv };

  return [
    // ---- 5 根：resetComponent 展开（box-sizing 块不产出）+ genBaseStyle ----
    `${cls}{`,
    // 🚨 **Component Token 的声明块必须内联在根规则里**（与 list / card / avatar 同一写法）。
    ...genTokenDecls(p),
    `  box-sizing:border-box;`,
    `  margin:0;`,
    `  padding:0;`,
    `  color:${v('colorText')};`,
    `  font-size:${v('fontSize')};`,
    `  line-height:${v('lineHeight')};`,
    `  list-style:none;`,
    `  font-family:${v('fontFamily')};`,
    `}`,

    // ---- 6-7 item / icon：把 Steps 的节点尺寸与颜色接到 timeline token 上 ----
    `${cls} ${item}{`,
    `  --${p}-cmp-steps-title-horizontal-title-height:${v('fontHeight')};`,
    `  --${p}-cmp-steps-vertical-rail-margin:0px;`,
    `  --${p}-cmp-steps-title-horizontal-rail-gap:0px;`,
    `  --${p}-cmp-steps-icon-dot-size-origin:${sv('icon-size-active')};`,
    `  --${p}-cmp-steps-icon-dot-size-custom:${tv('dot-size')};`,
    `  --${p}-cmp-steps-item-icon-dot-bg-color-origin:${sv('item-icon-dot-bg-color')};`,
    `  --${p}-cmp-steps-item-icon-dot-bg-color-custom:${tv('dot-bg')};`,
    `  --${p}-cmp-steps-icon-size:var(--${p}-cmp-steps-icon-dot-size-custom, var(--${p}-cmp-steps-icon-dot-size-origin));`,
    `}`,
    `${cls} ${item} ${item}-icon{`,
    `  --${p}-cmp-steps-dot-icon-border-width:${tv('dot-border-width')};`,
    `  --${p}-cmp-steps-dot-icon-size:var(--${p}-cmp-steps-icon-size);`,
    `  --${p}-cmp-steps-item-icon-dot-bg-color:var(--${p}-cmp-steps-item-icon-dot-bg-color-custom, var(--${p}-cmp-steps-item-icon-dot-bg-color-origin));`,
    `}`,

    // ---- 8-10 title / content / rail ----
    `${cls} ${item} ${item}-title{`,
    `  font-size:${v('fontSize')};`,
    `  line-height:${v('lineHeight')};`,
    `}`,
    `${cls} ${item} ${item}-content{`,
    `  color:${v('colorText')};`,
    `}`,
    `${cls} ${item} ${item}-rail{`,
    `  --${p}-cmp-steps-item-solid-line-color:${tv('tail-color')};`,
    `  --${p}-cmp-steps-rail-size:${tv('tail-width')};`,
    `}`,

    // ---- 11 时间轴的连线是**虚线** ----
    `${cls} ${item}{`,
    `  --${p}-cmp-steps-item-process-rail-line-style:dotted;`,
    `}`,

    // ---- 12-15 预设色（**三连类**提高特异性，压过 Steps 自己的 dot 颜色）----
    `${cls} ${item}.${p}-timeline-item.${p}-timeline-item-color-blue{`,
    `  --${p}-cmp-steps-item-icon-dot-color:${v('colorPrimary')};`,
    `}`,
    `${cls} ${item}.${p}-timeline-item.${p}-timeline-item-color-red{`,
    `  --${p}-cmp-steps-item-icon-dot-color:${v('colorError')};`,
    `}`,
    `${cls} ${item}.${p}-timeline-item.${p}-timeline-item-color-green{`,
    `  --${p}-cmp-steps-item-icon-dot-color:${v('colorSuccess')};`,
    `}`,
    `${cls} ${item}.${p}-timeline-item.${p}-timeline-item-color-gray{`,
    `  --${p}-cmp-steps-item-icon-dot-color:${v('colorTextDisabled')};`,
    `}`,

    // ---- 16 纵向：标题栏占比（24 栅格制，默认 12 ⇒ 50%）----
    `${cls}:not(${cls}-horizontal){`,
    `  --${p}-timeline-head-span:12;`,
    `  --${p}-timeline-head-span-ptg:calc(var(--${p}-timeline-head-span) / 24 * 100%);`,
    `}`,

    // ---- 17-22 纵向 + 交错：左右分栏 ----
    `${cls}:not(${cls}-horizontal)${cls}-layout-alternate ${item}{`,
    `  --${p}-timeline-alternate-gap:calc(${v('margin')} * 2 + ${sv('dot-icon-size')});`,
    `  min-height:auto;`,
    `  padding-bottom:${tv('item-padding-bottom')};`,
    `}`,
    `${cls}:not(${cls}-horizontal)${cls}-layout-alternate ${item} ${item}-icon,${cls}:not(${cls}-horizontal)${cls}-layout-alternate ${item} ${item}-rail{`,
    `  position:absolute;`,
    `  inset-inline-start:var(--${p}-timeline-head-span-ptg);`,
    `}`,
    `${cls}:not(${cls}-horizontal)${cls}-layout-alternate ${item} ${item}-icon{`,
    `  margin-inline-start:calc(${sv('icon-size')} / -2);`,
    `}`,
    `${cls}:not(${cls}-horizontal)${cls}-layout-alternate ${item} ${item}-section{`,
    `  display:flex;`,
    `  flex-wrap:nowrap;`,
    `  gap:var(--${p}-timeline-alternate-gap);`,
    `}`,
    `${cls}:not(${cls}-horizontal)${cls}-layout-alternate ${item} ${item}-header{`,
    `  text-align:end;`,
    `  flex-direction:column;`,
    `  align-items:stretch;`,
    `  flex:1 1 calc(var(--${p}-timeline-head-span-ptg) - var(--${p}-timeline-alternate-gap) / 2);`,
    `}`,
    `${cls}:not(${cls}-horizontal)${cls}-layout-alternate ${item} ${item}-content{`,
    `  text-align:start;`,
    `  flex:1 1 calc(100% - var(--${p}-timeline-head-span-ptg) - var(--${p}-timeline-alternate-gap) / 2);`,
    `}`,

    // ---- 23-25 交错 + placement-end：整块镜像到右侧 ----
    `${cls}:not(${cls}-horizontal)${cls}-layout-alternate ${item}-placement-end ${item}-header{`,
    `  text-align:start;`,
    `  order:1;`,
    `}`,
    `${cls}:not(${cls}-horizontal)${cls}-layout-alternate ${item}-placement-end ${item}-content{`,
    `  text-align:end;`,
    `}`,
    `${cls}:not(${cls}-horizontal)${cls}-layout-alternate ${item}-placement-end ${item}-icon,${cls}:not(${cls}-horizontal)${cls}-layout-alternate ${item}-placement-end ${item}-rail{`,
    `  inset-inline-start:calc(100% - var(--${p}-timeline-head-span-ptg));`,
    `}`,

    // ---- 26-28 纵向 + 非交错 + placement-end：单侧靠右 ----
    `${cls}:not(${cls}-horizontal):not(${cls}-layout-alternate) ${item}-placement-end{`,
    `  text-align:end;`,
    `}`,
    `${cls}:not(${cls}-horizontal):not(${cls}-layout-alternate) ${item}-placement-end ${item}-icon{`,
    `  order:1;`,
    `}`,
    `${cls}:not(${cls}-horizontal):not(${cls}-layout-alternate) ${item}-placement-end ${item}-rail{`,
    `  inset-inline-start:auto;`,
    `  inset-inline-end:calc(${sv('icon-size')} / 2);`,
    `  margin-inline-end:calc(${sv('rail-size')} / -2);`,
    `}`,

    // ---- 29-42 横向（单独一个文件，与上游一致）----
    ...genHorizontalStyle(ctx),
  ].join('\n');
}
