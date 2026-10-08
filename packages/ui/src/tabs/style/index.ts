/**
 * Tabs 的静态样式（antd 6.6.4 `es/tabs/style/index.js` 913 行的**机械移植**）。
 *
 * ── 这份文件是怎么来的 ──────────────────────────────────────────────────────
 *
 * ```
 * node tests/visual/debug/extract-tabs-css.mjs --emit-static
 * ```
 *
 * 只做「删壳改名、不改值」：去 `:where(.css-dev-only-do-not-override-X)` 作用域壳、
 * 去 css-var 声明块（那份由 `genTokenDecls` 自己产出）、`.ant-` → `.apollo-`（含属性选择器
 * 里的 `"ant-` 字面量）、空白折成**单空格**。
 *
 * ── 规则面（128 条）────────────────────────────────────────────────────────────
 *
 * 根 / `-nav`（含 `::before` / `::after`）/ `-nav-wrap`（`-ping-*` 四类 + 两侧渐隐遮罩）/
 * `-nav-list` / `-nav-operations[-hidden]` / `-nav-more` / `-nav-add` / `-extra-content` /
 * `-tab[-active|-disabled|-focus|-with-remove]` / `-tab-btn` / `-tab-icon` / `-tab-remove` /
 * `-ink-bar[-animated]` / `-dropdown[-rtl]` / `-dropdown-menu[-item-remove]` /
 * `-body[-{position}][-animated]` / `-content[-hidden][-active]` / `-animated` 的
 * **switch 动效类**（`-switch-appear|enter|leave` × `-start|-active`）。
 *
 * ⚠️ **`simple` 模式没有专属样式**（Tabs 没有 simple）—— 与 pagination 的 `-simple` 不同。
 * ⚠️ 相对 RTL 的规则由 `-rtl` 段承担（`margin:0 0 0 var(--{p}-tabs-horizontal-item-gutter)`）。
 * ⚠️ 动效类的前缀是 **`{p}-tabs-switch`**（`prefixCls` = `apollo-tabs` 拼 `-switch`）——
 *    与 `useAnimateConfig` 的 `motionName` 必须一致（PITFALLS 180 同族）。
 */

import { tabsTokenValues } from './token';

/**
 * Token 声明块（**恰好 26 条** = 26 个自有 Component Token）。
 *
 * ⚠️ **6 个内部 token 不在声明块里**：它们的判定值在构建期就被**内联进规则**了
 *    （`tabsDropdownHeight: 200` → `max-height:200px`；`dropdownEdgeChildVerticalPadding`
 *    → `var(--apollo-padding-xxs)`；`tabsHorizontalItemMargin` → 规则里是
 *    `margin:0 0 0 var(--apollo-tabs-horizontal-item-gutter)` —— 上游 cssinjs 的变量替换
 *    把拼串里的 `32px` 换成了 gutter 的 var 形态）。声明它们只会得到**没人引用的死变量**。
 *    判定值由 `__tests__/theme.test.ts` 钉住（`tabsInternalTokenValues()`）。
 *
 * ⚠️ `horizontalItemMargin` / `-RTL` 是**空值声明**（`--{p}-tabs-horizontal-item-margin:;`）——
 *    与上游产物逐字一致（见 `token.ts` 的说明），且**没有任何规则引用它们**；
 *    保留只为「26 个逐字对齐」这条判据。
 * ⚠️ 数值字段必须带 `px`（`horizontalItemGutter` = 32 → `32px`，`cardGutter` = 2 → `2px`）。
 */
export function genTokenDecls(rootPrefixCls: string): string[] {
  const t = tabsTokenValues();
  const n = `--${rootPrefixCls}-tabs`;

  const px = (v: string | number): string => (typeof v === 'number' ? `${v}px` : v);

  return [
    // ── 26 个自有 ──
    `  ${n}-z-index-popup:${t.zIndexPopup};`,
    `  ${n}-card-bg:${t.cardBg};`,
    `  ${n}-card-height:${px(t.cardHeight)};`,
    `  ${n}-card-height-sm:${px(t.cardHeightSM)};`,
    `  ${n}-card-height-lg:${px(t.cardHeightLG)};`,
    `  ${n}-card-padding:${t.cardPadding};`,
    `  ${n}-card-padding-sm:${t.cardPaddingSM};`,
    `  ${n}-card-padding-lg:${t.cardPaddingLG};`,
    `  ${n}-title-font-size:${px(t.titleFontSize)};`,
    `  ${n}-title-font-size-lg:${px(t.titleFontSizeLG)};`,
    `  ${n}-title-font-size-sm:${px(t.titleFontSizeSM)};`,
    `  ${n}-ink-bar-color:${t.inkBarColor};`,
    `  ${n}-horizontal-margin:${t.horizontalMargin};`,
    `  ${n}-horizontal-item-gutter:${px(t.horizontalItemGutter)};`,
    `  ${n}-horizontal-item-margin:${t.horizontalItemMargin};`,
    `  ${n}-horizontal-item-margin-rtl:${t.horizontalItemMarginRTL};`,
    `  ${n}-horizontal-item-padding:${t.horizontalItemPadding};`,
    `  ${n}-horizontal-item-padding-sm:${t.horizontalItemPaddingSM};`,
    `  ${n}-horizontal-item-padding-lg:${t.horizontalItemPaddingLG};`,
    `  ${n}-vertical-item-padding:${t.verticalItemPadding};`,
    `  ${n}-vertical-item-margin:${t.verticalItemMargin};`,
    `  ${n}-item-color:${t.itemColor};`,
    `  ${n}-item-active-color:${t.itemActiveColor};`,
    `  ${n}-item-hover-color:${t.itemHoverColor};`,
    `  ${n}-item-selected-color:${t.itemSelectedColor};`,
    `  ${n}-card-gutter:${px(t.cardGutter)};`,
  ];
}

/**
 * 规则体（**128 条**，机械移植）。
 *
 * ⚠️ 末端的 `-animated`（switch）类来自 `style/motion.js`；它们与
 *    `getAnimateConfig` 产出的 `motionName` 必须逐字一致。
 */
export const TABS_RULES = `
  .apollo-tabs-small >.apollo-tabs-nav .apollo-tabs-tab{padding:var(--apollo-tabs-horizontal-item-padding-sm);font-size:var(--apollo-tabs-title-font-size-sm);}
  .apollo-tabs-large >.apollo-tabs-nav .apollo-tabs-tab{padding:var(--apollo-tabs-horizontal-item-padding-lg);font-size:var(--apollo-tabs-title-font-size-lg);line-height:var(--apollo-line-height-lg);}
  .apollo-tabs-card.apollo-tabs-small >.apollo-tabs-nav .apollo-tabs-tab{padding:var(--apollo-tabs-card-padding-sm);}
  .apollo-tabs-card.apollo-tabs-small >.apollo-tabs-nav .apollo-tabs-nav-add{min-width:var(--apollo-tabs-card-height-sm);min-height:var(--apollo-tabs-card-height-sm);}
  .apollo-tabs-card.apollo-tabs-small.apollo-tabs-bottom >.apollo-tabs-nav .apollo-tabs-tab{border-radius:0 0 var(--apollo-border-radius) var(--apollo-border-radius);}
  .apollo-tabs-card.apollo-tabs-small.apollo-tabs-top >.apollo-tabs-nav .apollo-tabs-tab{border-radius:var(--apollo-border-radius) var(--apollo-border-radius) 0 0;}
  .apollo-tabs-card.apollo-tabs-small.apollo-tabs-right >.apollo-tabs-nav .apollo-tabs-tab{border-radius:0 var(--apollo-border-radius) var(--apollo-border-radius) 0;}
  .apollo-tabs-card.apollo-tabs-small.apollo-tabs-left >.apollo-tabs-nav .apollo-tabs-tab{border-radius:var(--apollo-border-radius) 0 0 var(--apollo-border-radius);}
  .apollo-tabs-card.apollo-tabs-large >.apollo-tabs-nav .apollo-tabs-tab{padding:var(--apollo-tabs-card-padding-lg);}
  .apollo-tabs-card.apollo-tabs-large >.apollo-tabs-nav .apollo-tabs-nav-add{min-width:var(--apollo-tabs-card-height-lg);min-height:var(--apollo-tabs-card-height-lg);}
  .apollo-tabs-rtl{direction:rtl;}
  .apollo-tabs-rtl .apollo-tabs-nav .apollo-tabs-tab{margin:0 0 0 var(--apollo-tabs-horizontal-item-gutter);}
  .apollo-tabs-rtl .apollo-tabs-nav .apollo-tabs-tab .apollo-tabs-tab:last-of-type{margin-left:0;}
  .apollo-tabs-rtl .apollo-tabs-nav .apollo-tabs-tab .apollo-icon{margin-right:0;margin-left:var(--apollo-margin-sm);}
  .apollo-tabs-rtl .apollo-tabs-nav .apollo-tabs-tab .apollo-tabs-tab-remove{margin-right:var(--apollo-margin-xs);margin-left:calc(var(--apollo-margin-xxs) * -1);}
  .apollo-tabs-rtl .apollo-tabs-nav .apollo-tabs-tab .apollo-tabs-tab-remove .apollo-icon{margin:0;}
  .apollo-tabs-rtl.apollo-tabs-left >.apollo-tabs-nav{order:1;}
  .apollo-tabs-rtl.apollo-tabs-left >.apollo-tabs-body-holder{order:0;}
  .apollo-tabs-rtl.apollo-tabs-right >.apollo-tabs-nav{order:0;}
  .apollo-tabs-rtl.apollo-tabs-right >.apollo-tabs-body-holder{order:1;}
  .apollo-tabs-rtl.apollo-tabs-card.apollo-tabs-top >.apollo-tabs-nav .apollo-tabs-tab+.apollo-tabs-tab,.apollo-tabs-rtl.apollo-tabs-card.apollo-tabs-bottom >.apollo-tabs-nav .apollo-tabs-tab+.apollo-tabs-tab,.apollo-tabs-rtl.apollo-tabs-card.apollo-tabs-top >div>.apollo-tabs-nav .apollo-tabs-tab+.apollo-tabs-tab,.apollo-tabs-rtl.apollo-tabs-card.apollo-tabs-bottom >div>.apollo-tabs-nav .apollo-tabs-tab+.apollo-tabs-tab{margin-right:var(--apollo-tabs-card-gutter);margin-left:0;}
  .apollo-tabs-dropdown-rtl{direction:rtl;}
  .apollo-tabs-menu-item .apollo-tabs-dropdown-rtl{text-align:right;}
  .apollo-tabs-top,.apollo-tabs-bottom{flex-direction:column;}
  .apollo-tabs-top >.apollo-tabs-nav,.apollo-tabs-bottom >.apollo-tabs-nav,.apollo-tabs-top >div>.apollo-tabs-nav,.apollo-tabs-bottom >div>.apollo-tabs-nav{margin:var(--apollo-tabs-horizontal-margin);}
  .apollo-tabs-top >.apollo-tabs-nav::before,.apollo-tabs-bottom >.apollo-tabs-nav::before,.apollo-tabs-top >div>.apollo-tabs-nav::before,.apollo-tabs-bottom >div>.apollo-tabs-nav::before{position:absolute;right:0;left:0;border-bottom:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-border-secondary);content:'';}
  .apollo-tabs-top >.apollo-tabs-nav .apollo-tabs-ink-bar,.apollo-tabs-bottom >.apollo-tabs-nav .apollo-tabs-ink-bar,.apollo-tabs-top >div>.apollo-tabs-nav .apollo-tabs-ink-bar,.apollo-tabs-bottom >div>.apollo-tabs-nav .apollo-tabs-ink-bar{height:var(--apollo-line-width-bold);}
  .apollo-tabs-top >.apollo-tabs-nav .apollo-tabs-ink-bar-animated,.apollo-tabs-bottom >.apollo-tabs-nav .apollo-tabs-ink-bar-animated,.apollo-tabs-top >div>.apollo-tabs-nav .apollo-tabs-ink-bar-animated,.apollo-tabs-bottom >div>.apollo-tabs-nav .apollo-tabs-ink-bar-animated{transition:width var(--apollo-motion-duration-slow),left var(--apollo-motion-duration-slow),right var(--apollo-motion-duration-slow);}
  .apollo-tabs-top >.apollo-tabs-nav .apollo-tabs-nav-wrap::before,.apollo-tabs-bottom >.apollo-tabs-nav .apollo-tabs-nav-wrap::before,.apollo-tabs-top >div>.apollo-tabs-nav .apollo-tabs-nav-wrap::before,.apollo-tabs-bottom >div>.apollo-tabs-nav .apollo-tabs-nav-wrap::before,.apollo-tabs-top >.apollo-tabs-nav .apollo-tabs-nav-wrap::after,.apollo-tabs-bottom >.apollo-tabs-nav .apollo-tabs-nav-wrap::after,.apollo-tabs-top >div>.apollo-tabs-nav .apollo-tabs-nav-wrap::after,.apollo-tabs-bottom >div>.apollo-tabs-nav .apollo-tabs-nav-wrap::after{top:0;bottom:0;width:var(--apollo-control-height);}
  .apollo-tabs-top >.apollo-tabs-nav .apollo-tabs-nav-wrap::before,.apollo-tabs-bottom >.apollo-tabs-nav .apollo-tabs-nav-wrap::before,.apollo-tabs-top >div>.apollo-tabs-nav .apollo-tabs-nav-wrap::before,.apollo-tabs-bottom >div>.apollo-tabs-nav .apollo-tabs-nav-wrap::before{left:0;box-shadow:var(--apollo-box-shadow-tabs-overflow-left);}
  .apollo-tabs-top >.apollo-tabs-nav .apollo-tabs-nav-wrap::after,.apollo-tabs-bottom >.apollo-tabs-nav .apollo-tabs-nav-wrap::after,.apollo-tabs-top >div>.apollo-tabs-nav .apollo-tabs-nav-wrap::after,.apollo-tabs-bottom >div>.apollo-tabs-nav .apollo-tabs-nav-wrap::after{right:0;box-shadow:var(--apollo-box-shadow-tabs-overflow-right);}
  .apollo-tabs-top >.apollo-tabs-nav .apollo-tabs-nav-wrap.apollo-tabs-nav-wrap-ping-left::before,.apollo-tabs-bottom >.apollo-tabs-nav .apollo-tabs-nav-wrap.apollo-tabs-nav-wrap-ping-left::before,.apollo-tabs-top >div>.apollo-tabs-nav .apollo-tabs-nav-wrap.apollo-tabs-nav-wrap-ping-left::before,.apollo-tabs-bottom >div>.apollo-tabs-nav .apollo-tabs-nav-wrap.apollo-tabs-nav-wrap-ping-left::before{opacity:1;}
  .apollo-tabs-top >.apollo-tabs-nav .apollo-tabs-nav-wrap.apollo-tabs-nav-wrap-ping-right::after,.apollo-tabs-bottom >.apollo-tabs-nav .apollo-tabs-nav-wrap.apollo-tabs-nav-wrap-ping-right::after,.apollo-tabs-top >div>.apollo-tabs-nav .apollo-tabs-nav-wrap.apollo-tabs-nav-wrap-ping-right::after,.apollo-tabs-bottom >div>.apollo-tabs-nav .apollo-tabs-nav-wrap.apollo-tabs-nav-wrap-ping-right::after{opacity:1;}
  .apollo-tabs-top >.apollo-tabs-nav::before,.apollo-tabs-top >div>.apollo-tabs-nav::before{bottom:0;}
  .apollo-tabs-top >.apollo-tabs-nav .apollo-tabs-ink-bar,.apollo-tabs-top >div>.apollo-tabs-nav .apollo-tabs-ink-bar{bottom:0;}
  .apollo-tabs-bottom >.apollo-tabs-nav,.apollo-tabs-bottom >div>.apollo-tabs-nav{order:1;margin-top:var(--apollo-margin);margin-bottom:0;}
  .apollo-tabs-bottom >.apollo-tabs-nav::before,.apollo-tabs-bottom >div>.apollo-tabs-nav::before{top:0;}
  .apollo-tabs-bottom >.apollo-tabs-nav .apollo-tabs-ink-bar,.apollo-tabs-bottom >div>.apollo-tabs-nav .apollo-tabs-ink-bar{top:0;}
  .apollo-tabs-bottom >.apollo-tabs-body-holder,.apollo-tabs-bottom >div>.apollo-tabs-body-holder{order:0;}
  .apollo-tabs-left >.apollo-tabs-nav,.apollo-tabs-right >.apollo-tabs-nav,.apollo-tabs-left >div>.apollo-tabs-nav,.apollo-tabs-right >div>.apollo-tabs-nav{flex-direction:column;min-width:calc(var(--apollo-control-height) * 1.25);}
  .apollo-tabs-left >.apollo-tabs-nav .apollo-tabs-tab,.apollo-tabs-right >.apollo-tabs-nav .apollo-tabs-tab,.apollo-tabs-left >div>.apollo-tabs-nav .apollo-tabs-tab,.apollo-tabs-right >div>.apollo-tabs-nav .apollo-tabs-tab{padding:var(--apollo-tabs-vertical-item-padding);text-align:center;}
  .apollo-tabs-left >.apollo-tabs-nav .apollo-tabs-tab+.apollo-tabs-tab,.apollo-tabs-right >.apollo-tabs-nav .apollo-tabs-tab+.apollo-tabs-tab,.apollo-tabs-left >div>.apollo-tabs-nav .apollo-tabs-tab+.apollo-tabs-tab,.apollo-tabs-right >div>.apollo-tabs-nav .apollo-tabs-tab+.apollo-tabs-tab{margin:var(--apollo-tabs-vertical-item-margin);}
  .apollo-tabs-left >.apollo-tabs-nav .apollo-tabs-nav-wrap,.apollo-tabs-right >.apollo-tabs-nav .apollo-tabs-nav-wrap,.apollo-tabs-left >div>.apollo-tabs-nav .apollo-tabs-nav-wrap,.apollo-tabs-right >div>.apollo-tabs-nav .apollo-tabs-nav-wrap{flex-direction:column;}
  .apollo-tabs-left >.apollo-tabs-nav .apollo-tabs-nav-wrap::before,.apollo-tabs-right >.apollo-tabs-nav .apollo-tabs-nav-wrap::before,.apollo-tabs-left >div>.apollo-tabs-nav .apollo-tabs-nav-wrap::before,.apollo-tabs-right >div>.apollo-tabs-nav .apollo-tabs-nav-wrap::before,.apollo-tabs-left >.apollo-tabs-nav .apollo-tabs-nav-wrap::after,.apollo-tabs-right >.apollo-tabs-nav .apollo-tabs-nav-wrap::after,.apollo-tabs-left >div>.apollo-tabs-nav .apollo-tabs-nav-wrap::after,.apollo-tabs-right >div>.apollo-tabs-nav .apollo-tabs-nav-wrap::after{right:0;left:0;height:var(--apollo-control-height);}
  .apollo-tabs-left >.apollo-tabs-nav .apollo-tabs-nav-wrap::before,.apollo-tabs-right >.apollo-tabs-nav .apollo-tabs-nav-wrap::before,.apollo-tabs-left >div>.apollo-tabs-nav .apollo-tabs-nav-wrap::before,.apollo-tabs-right >div>.apollo-tabs-nav .apollo-tabs-nav-wrap::before{top:0;box-shadow:var(--apollo-box-shadow-tabs-overflow-top);}
  .apollo-tabs-left >.apollo-tabs-nav .apollo-tabs-nav-wrap::after,.apollo-tabs-right >.apollo-tabs-nav .apollo-tabs-nav-wrap::after,.apollo-tabs-left >div>.apollo-tabs-nav .apollo-tabs-nav-wrap::after,.apollo-tabs-right >div>.apollo-tabs-nav .apollo-tabs-nav-wrap::after{bottom:0;box-shadow:var(--apollo-box-shadow-tabs-overflow-bottom);}
  .apollo-tabs-left >.apollo-tabs-nav .apollo-tabs-nav-wrap.apollo-tabs-nav-wrap-ping-top::before,.apollo-tabs-right >.apollo-tabs-nav .apollo-tabs-nav-wrap.apollo-tabs-nav-wrap-ping-top::before,.apollo-tabs-left >div>.apollo-tabs-nav .apollo-tabs-nav-wrap.apollo-tabs-nav-wrap-ping-top::before,.apollo-tabs-right >div>.apollo-tabs-nav .apollo-tabs-nav-wrap.apollo-tabs-nav-wrap-ping-top::before{opacity:1;}
  .apollo-tabs-left >.apollo-tabs-nav .apollo-tabs-nav-wrap.apollo-tabs-nav-wrap-ping-bottom::after,.apollo-tabs-right >.apollo-tabs-nav .apollo-tabs-nav-wrap.apollo-tabs-nav-wrap-ping-bottom::after,.apollo-tabs-left >div>.apollo-tabs-nav .apollo-tabs-nav-wrap.apollo-tabs-nav-wrap-ping-bottom::after,.apollo-tabs-right >div>.apollo-tabs-nav .apollo-tabs-nav-wrap.apollo-tabs-nav-wrap-ping-bottom::after{opacity:1;}
  .apollo-tabs-left >.apollo-tabs-nav .apollo-tabs-ink-bar,.apollo-tabs-right >.apollo-tabs-nav .apollo-tabs-ink-bar,.apollo-tabs-left >div>.apollo-tabs-nav .apollo-tabs-ink-bar,.apollo-tabs-right >div>.apollo-tabs-nav .apollo-tabs-ink-bar{width:var(--apollo-line-width-bold);}
  .apollo-tabs-left >.apollo-tabs-nav .apollo-tabs-ink-bar-animated,.apollo-tabs-right >.apollo-tabs-nav .apollo-tabs-ink-bar-animated,.apollo-tabs-left >div>.apollo-tabs-nav .apollo-tabs-ink-bar-animated,.apollo-tabs-right >div>.apollo-tabs-nav .apollo-tabs-ink-bar-animated{transition:height var(--apollo-motion-duration-slow),top var(--apollo-motion-duration-slow);}
  .apollo-tabs-left >.apollo-tabs-nav .apollo-tabs-nav-list,.apollo-tabs-right >.apollo-tabs-nav .apollo-tabs-nav-list,.apollo-tabs-left >div>.apollo-tabs-nav .apollo-tabs-nav-list,.apollo-tabs-right >div>.apollo-tabs-nav .apollo-tabs-nav-list,.apollo-tabs-left >.apollo-tabs-nav .apollo-tabs-nav-operations,.apollo-tabs-right >.apollo-tabs-nav .apollo-tabs-nav-operations,.apollo-tabs-left >div>.apollo-tabs-nav .apollo-tabs-nav-operations,.apollo-tabs-right >div>.apollo-tabs-nav .apollo-tabs-nav-operations{flex:1 0 auto;flex-direction:column;}
  .apollo-tabs-left >.apollo-tabs-nav .apollo-tabs-ink-bar,.apollo-tabs-left >div>.apollo-tabs-nav .apollo-tabs-ink-bar{right:0;}
  .apollo-tabs-left >.apollo-tabs-body-holder,.apollo-tabs-left >div>.apollo-tabs-body-holder{margin-left:calc(var(--apollo-line-width) * -1);border-left:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-border);}
  .apollo-tabs-left >.apollo-tabs-body-holder >.apollo-tabs-body>.apollo-tabs-content,.apollo-tabs-left >div>.apollo-tabs-body-holder >.apollo-tabs-body>.apollo-tabs-content{padding-left:var(--apollo-padding-lg);}
  .apollo-tabs-right >.apollo-tabs-nav,.apollo-tabs-right >div>.apollo-tabs-nav{order:1;}
  .apollo-tabs-right >.apollo-tabs-nav .apollo-tabs-ink-bar,.apollo-tabs-right >div>.apollo-tabs-nav .apollo-tabs-ink-bar{left:0;}
  .apollo-tabs-right >.apollo-tabs-body-holder,.apollo-tabs-right >div>.apollo-tabs-body-holder{order:0;margin-right:calc(var(--apollo-line-width) * -1);border-right:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-border);}
  .apollo-tabs-right >.apollo-tabs-body-holder >.apollo-tabs-body>.apollo-tabs-content,.apollo-tabs-right >div>.apollo-tabs-body-holder >.apollo-tabs-body>.apollo-tabs-content{padding-right:var(--apollo-padding-lg);}
  .apollo-tabs-dropdown{box-sizing:border-box;margin:0;padding:0;color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);list-style:none;font-family:var(--apollo-font-family);position:absolute;top:-9999px;left:-9999px;z-index:var(--apollo-tabs-z-index-popup);display:block;}
  .apollo-tabs-dropdown-hidden{display:none;}
  .apollo-tabs-dropdown.apollo-slide-down-enter.apollo-slide-down-enter-active.apollo-tabs-dropdown-placement-bottomLeft,.apollo-tabs-dropdown.apollo-slide-down-appear.apollo-slide-down-appear-active.apollo-tabs-dropdown-placement-bottomLeft,.apollo-tabs-dropdown.apollo-slide-down-enter.apollo-slide-down-enter-active.apollo-tabs-dropdown-placement-bottom,.apollo-tabs-dropdown.apollo-slide-down-appear.apollo-slide-down-appear-active.apollo-tabs-dropdown-placement-bottom,.apollo-tabs-dropdown.apollo-slide-down-enter.apollo-slide-down-enter-active.apollo-tabs-dropdown-placement-bottomRight,.apollo-tabs-dropdown.apollo-slide-down-appear.apollo-slide-down-appear-active.apollo-tabs-dropdown-placement-bottomRight{animation-name:apollo-slide-up-in;}
  .apollo-tabs-dropdown.apollo-slide-up-enter.apollo-slide-up-enter-active.apollo-tabs-dropdown-placement-topLeft,.apollo-tabs-dropdown.apollo-slide-up-appear.apollo-slide-up-appear-active.apollo-tabs-dropdown-placement-topLeft,.apollo-tabs-dropdown.apollo-slide-up-enter.apollo-slide-up-enter-active.apollo-tabs-dropdown-placement-top,.apollo-tabs-dropdown.apollo-slide-up-appear.apollo-slide-up-appear-active.apollo-tabs-dropdown-placement-top,.apollo-tabs-dropdown.apollo-slide-up-enter.apollo-slide-up-enter-active.apollo-tabs-dropdown-placement-topRight,.apollo-tabs-dropdown.apollo-slide-up-appear.apollo-slide-up-appear-active.apollo-tabs-dropdown-placement-topRight{animation-name:apollo-slide-down-in;}
  .apollo-tabs-dropdown.apollo-slide-down-leave.apollo-slide-down-leave-active.apollo-tabs-dropdown-placement-bottomLeft,.apollo-tabs-dropdown.apollo-slide-down-leave.apollo-slide-down-leave-active.apollo-tabs-dropdown-placement-bottom,.apollo-tabs-dropdown.apollo-slide-down-leave.apollo-slide-down-leave-active.apollo-tabs-dropdown-placement-bottomRight{animation-name:apollo-slide-up-out;}
  .apollo-tabs-dropdown.apollo-slide-up-leave.apollo-slide-up-leave-active.apollo-tabs-dropdown-placement-topLeft,.apollo-tabs-dropdown.apollo-slide-up-leave.apollo-slide-up-leave-active.apollo-tabs-dropdown-placement-top,.apollo-tabs-dropdown.apollo-slide-up-leave.apollo-slide-up-leave-active.apollo-tabs-dropdown-placement-topRight{animation-name:apollo-slide-down-out;}
  .apollo-tabs-dropdown .apollo-tabs-dropdown-menu{max-height:200px;margin:0;padding:var(--apollo-padding-xxs) 0;overflow-x:hidden;overflow-y:auto;text-align:left;list-style-type:none;background-color:var(--apollo-color-bg-container);background-clip:padding-box;border-radius:var(--apollo-border-radius-lg);outline:none;box-shadow:var(--apollo-box-shadow-secondary);}
  .apollo-tabs-dropdown .apollo-tabs-dropdown-menu-item{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;display:flex;align-items:center;min-width:120px;margin:0;padding:var(--apollo-padding-xxs) var(--apollo-padding-sm);color:var(--apollo-color-text);font-weight:normal;font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);cursor:pointer;transition:all var(--apollo-motion-duration-slow);}
  .apollo-tabs-dropdown .apollo-tabs-dropdown-menu-item >span{flex:1;white-space:nowrap;}
  .apollo-tabs-dropdown .apollo-tabs-dropdown-menu-item-remove{flex:none;margin-left:var(--apollo-margin-sm);color:var(--apollo-color-icon);font-size:var(--apollo-font-size-sm);background:transparent;border:0;cursor:pointer;}
  .apollo-tabs-dropdown .apollo-tabs-dropdown-menu-item-remove:hover{color:var(--apollo-tabs-item-hover-color);}
  .apollo-tabs-dropdown .apollo-tabs-dropdown-menu-item:hover{background:var(--apollo-control-item-bg-hover);}
  .apollo-tabs-dropdown .apollo-tabs-dropdown-menu-item-disabled,.apollo-tabs-dropdown .apollo-tabs-dropdown-menu-item-disabled:hover{color:var(--apollo-color-text-disabled);background:transparent;cursor:not-allowed;}
  .apollo-tabs-card >.apollo-tabs-nav .apollo-tabs-tab,.apollo-tabs-card >div>.apollo-tabs-nav .apollo-tabs-tab{margin:0;padding:var(--apollo-tabs-card-padding);background:var(--apollo-tabs-card-bg);border:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-border-secondary);transition:all var(--apollo-motion-duration-slow) var(--apollo-motion-ease-in-out);}
  .apollo-tabs-card >.apollo-tabs-nav .apollo-tabs-tab-active,.apollo-tabs-card >div>.apollo-tabs-nav .apollo-tabs-tab-active{color:var(--apollo-tabs-item-selected-color);background:var(--apollo-color-bg-container);}
  .apollo-tabs-card >.apollo-tabs-nav .apollo-tabs-tab-focus:has(.apollo-tabs-tab-btn:focus-visible),.apollo-tabs-card >div>.apollo-tabs-nav .apollo-tabs-tab-focus:has(.apollo-tabs-tab-btn:focus-visible){outline:var(--apollo-line-width-focus) solid var(--apollo-color-primary-border);outline-offset:-3px;transition:outline-offset 0s,outline 0s;}
  .apollo-tabs-card >.apollo-tabs-nav .apollo-tabs-tab.apollo-tabs-tab-focus .apollo-tabs-tab-btn:focus-visible,.apollo-tabs-card >div>.apollo-tabs-nav .apollo-tabs-tab.apollo-tabs-tab-focus .apollo-tabs-tab-btn:focus-visible{outline:none;}
  .apollo-tabs-card >.apollo-tabs-nav .apollo-tabs-ink-bar,.apollo-tabs-card >div>.apollo-tabs-nav .apollo-tabs-ink-bar{visibility:hidden;}
  .apollo-tabs-card.apollo-tabs-top >.apollo-tabs-nav .apollo-tabs-tab+.apollo-tabs-tab,.apollo-tabs-card.apollo-tabs-bottom >.apollo-tabs-nav .apollo-tabs-tab+.apollo-tabs-tab,.apollo-tabs-card.apollo-tabs-top >div>.apollo-tabs-nav .apollo-tabs-tab+.apollo-tabs-tab,.apollo-tabs-card.apollo-tabs-bottom >div>.apollo-tabs-nav .apollo-tabs-tab+.apollo-tabs-tab{margin-left:var(--apollo-tabs-card-gutter);}
  .apollo-tabs-card.apollo-tabs-top >.apollo-tabs-nav .apollo-tabs-tab,.apollo-tabs-card.apollo-tabs-top >div>.apollo-tabs-nav .apollo-tabs-tab{border-radius:var(--apollo-border-radius-lg) var(--apollo-border-radius-lg) 0 0;}
  .apollo-tabs-card.apollo-tabs-top >.apollo-tabs-nav .apollo-tabs-tab-active,.apollo-tabs-card.apollo-tabs-top >div>.apollo-tabs-nav .apollo-tabs-tab-active{border-bottom-color:var(--apollo-color-bg-container);}
  .apollo-tabs-card.apollo-tabs-bottom >.apollo-tabs-nav .apollo-tabs-tab,.apollo-tabs-card.apollo-tabs-bottom >div>.apollo-tabs-nav .apollo-tabs-tab{border-radius:0 0 var(--apollo-border-radius-lg) var(--apollo-border-radius-lg);}
  .apollo-tabs-card.apollo-tabs-bottom >.apollo-tabs-nav .apollo-tabs-tab-active,.apollo-tabs-card.apollo-tabs-bottom >div>.apollo-tabs-nav .apollo-tabs-tab-active{border-top-color:var(--apollo-color-bg-container);}
  .apollo-tabs-card.apollo-tabs-left >.apollo-tabs-nav .apollo-tabs-tab+.apollo-tabs-tab,.apollo-tabs-card.apollo-tabs-right >.apollo-tabs-nav .apollo-tabs-tab+.apollo-tabs-tab,.apollo-tabs-card.apollo-tabs-left >div>.apollo-tabs-nav .apollo-tabs-tab+.apollo-tabs-tab,.apollo-tabs-card.apollo-tabs-right >div>.apollo-tabs-nav .apollo-tabs-tab+.apollo-tabs-tab{margin-top:var(--apollo-tabs-card-gutter);}
  .apollo-tabs-card.apollo-tabs-left >.apollo-tabs-nav .apollo-tabs-tab,.apollo-tabs-card.apollo-tabs-left >div>.apollo-tabs-nav .apollo-tabs-tab{border-radius:var(--apollo-border-radius-lg) 0 0 var(--apollo-border-radius-lg);}
  .apollo-tabs-card.apollo-tabs-left >.apollo-tabs-nav .apollo-tabs-tab-active,.apollo-tabs-card.apollo-tabs-left >div>.apollo-tabs-nav .apollo-tabs-tab-active{border-right-color:var(--apollo-color-bg-container);}
  .apollo-tabs-card.apollo-tabs-right >.apollo-tabs-nav .apollo-tabs-tab,.apollo-tabs-card.apollo-tabs-right >div>.apollo-tabs-nav .apollo-tabs-tab{border-radius:0 var(--apollo-border-radius-lg) var(--apollo-border-radius-lg) 0;}
  .apollo-tabs-card.apollo-tabs-right >.apollo-tabs-nav .apollo-tabs-tab-active,.apollo-tabs-card.apollo-tabs-right >div>.apollo-tabs-nav .apollo-tabs-tab-active{border-left-color:var(--apollo-color-bg-container);}
  .apollo-tabs{box-sizing:border-box;margin:0;padding:0;color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);list-style:none;font-family:var(--apollo-font-family);display:flex;}
  .apollo-tabs >.apollo-tabs-nav,.apollo-tabs >div>.apollo-tabs-nav{position:relative;display:flex;flex:none;align-items:center;}
  .apollo-tabs >.apollo-tabs-nav .apollo-tabs-nav-wrap,.apollo-tabs >div>.apollo-tabs-nav .apollo-tabs-nav-wrap{position:relative;display:flex;flex:auto;align-self:stretch;overflow:hidden;white-space:nowrap;transform:translate(0);}
  .apollo-tabs >.apollo-tabs-nav .apollo-tabs-nav-wrap::before,.apollo-tabs >div>.apollo-tabs-nav .apollo-tabs-nav-wrap::before,.apollo-tabs >.apollo-tabs-nav .apollo-tabs-nav-wrap::after,.apollo-tabs >div>.apollo-tabs-nav .apollo-tabs-nav-wrap::after{position:absolute;z-index:1;opacity:0;transition:opacity var(--apollo-motion-duration-slow);content:'';pointer-events:none;}
  .apollo-tabs >.apollo-tabs-nav .apollo-tabs-nav-list,.apollo-tabs >div>.apollo-tabs-nav .apollo-tabs-nav-list{position:relative;display:flex;transition:opacity var(--apollo-motion-duration-slow);}
  .apollo-tabs >.apollo-tabs-nav .apollo-tabs-nav-operations,.apollo-tabs >div>.apollo-tabs-nav .apollo-tabs-nav-operations{display:flex;align-self:stretch;}
  .apollo-tabs >.apollo-tabs-nav .apollo-tabs-nav-operations-hidden,.apollo-tabs >div>.apollo-tabs-nav .apollo-tabs-nav-operations-hidden{position:absolute;visibility:hidden;pointer-events:none;}
  .apollo-tabs >.apollo-tabs-nav .apollo-tabs-nav-more,.apollo-tabs >div>.apollo-tabs-nav .apollo-tabs-nav-more{position:relative;padding:var(--apollo-tabs-card-padding);background:transparent;border:0;color:var(--apollo-color-text);}
  .apollo-tabs >.apollo-tabs-nav .apollo-tabs-nav-more::after,.apollo-tabs >div>.apollo-tabs-nav .apollo-tabs-nav-more::after{position:absolute;right:0;bottom:0;left:0;height:calc(var(--apollo-control-height-lg) / 8);transform:translateY(100%);content:'';}
  .apollo-tabs >.apollo-tabs-nav .apollo-tabs-nav-add,.apollo-tabs >div>.apollo-tabs-nav .apollo-tabs-nav-add{min-width:var(--apollo-tabs-card-height);min-height:var(--apollo-tabs-card-height);margin-left:var(--apollo-tabs-card-gutter);background:transparent;border:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-border-secondary);border-radius:var(--apollo-border-radius-lg) var(--apollo-border-radius-lg) 0 0;outline:none;cursor:pointer;color:var(--apollo-color-text);transition:all var(--apollo-motion-duration-slow) var(--apollo-motion-ease-in-out);}
  .apollo-tabs >.apollo-tabs-nav .apollo-tabs-nav-add:hover,.apollo-tabs >div>.apollo-tabs-nav .apollo-tabs-nav-add:hover{color:var(--apollo-tabs-item-hover-color);}
  .apollo-tabs >.apollo-tabs-nav .apollo-tabs-nav-add:active,.apollo-tabs >div>.apollo-tabs-nav .apollo-tabs-nav-add:active,.apollo-tabs >.apollo-tabs-nav .apollo-tabs-nav-add:focus:not(:focus-visible),.apollo-tabs >div>.apollo-tabs-nav .apollo-tabs-nav-add:focus:not(:focus-visible){color:var(--apollo-tabs-item-active-color);}
  .apollo-tabs >.apollo-tabs-nav .apollo-tabs-nav-add:focus-visible,.apollo-tabs >div>.apollo-tabs-nav .apollo-tabs-nav-add:focus-visible{outline:var(--apollo-line-width-focus) solid var(--apollo-color-primary-border);outline-offset:-3px;transition:outline-offset 0s,outline 0s;}
  .apollo-tabs .apollo-tabs-extra-content{flex:none;}
  .apollo-tabs .apollo-tabs-ink-bar{position:absolute;background:var(--apollo-tabs-ink-bar-color);pointer-events:none;}
  .apollo-tabs .apollo-tabs-tab{position:relative;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;display:inline-flex;align-items:center;padding:var(--apollo-tabs-horizontal-item-padding);font-size:var(--apollo-tabs-title-font-size);background:transparent;border:0;outline:none;cursor:pointer;color:var(--apollo-tabs-item-color);}
  .apollo-tabs .apollo-tabs-tab-btn:focus:not(:focus-visible),.apollo-tabs .apollo-tabs-tab-remove:focus:not(:focus-visible),.apollo-tabs .apollo-tabs-tab-btn:active,.apollo-tabs .apollo-tabs-tab-remove:active{color:var(--apollo-tabs-item-active-color);}
  .apollo-tabs .apollo-tabs-tab-btn{outline:none;transition:all var(--apollo-motion-duration-slow);}
  .apollo-tabs .apollo-tabs-tab-btn .apollo-tabs-tab-icon:not(:last-child){margin-inline-end:var(--apollo-margin-sm);}
  .apollo-tabs .apollo-tabs-tab-btn .apollo-tabs-tab-icon>svg{display:inline-block;vertical-align:middle;margin-block-end:0.2em;}
  .apollo-tabs .apollo-tabs-tab-remove{flex:none;line-height:1;margin-right:calc(var(--apollo-margin-xxs) * -1);margin-left:var(--apollo-margin-xs);color:var(--apollo-color-icon);font-size:var(--apollo-font-size-sm);background:transparent;border:none;outline:none;cursor:pointer;transition:all var(--apollo-motion-duration-slow);}
  .apollo-tabs .apollo-tabs-tab-remove:hover{color:var(--apollo-color-text-heading);}
  .apollo-tabs .apollo-tabs-tab-remove:focus-visible{outline:var(--apollo-line-width-focus) solid var(--apollo-color-primary-border);outline-offset:1px;transition:outline-offset 0s,outline 0s;}
  .apollo-tabs .apollo-tabs-tab:hover{color:var(--apollo-tabs-item-hover-color);}
  .apollo-tabs .apollo-tabs-tab.apollo-tabs-tab-active .apollo-tabs-tab-btn{color:var(--apollo-tabs-item-selected-color);}
  .apollo-tabs .apollo-tabs-tab.apollo-tabs-tab-focus .apollo-tabs-tab-btn:focus-visible{outline:var(--apollo-line-width-focus) solid var(--apollo-color-primary-border);outline-offset:1px;transition:outline-offset 0s,outline 0s;}
  .apollo-tabs .apollo-tabs-tab.apollo-tabs-tab-disabled{color:var(--apollo-color-text-disabled);cursor:not-allowed;}
  .apollo-tabs .apollo-tabs-tab.apollo-tabs-tab-disabled .apollo-tabs-tab-btn:focus,.apollo-tabs .apollo-tabs-tab.apollo-tabs-tab-disabled .apollo-tabs-remove:focus,.apollo-tabs .apollo-tabs-tab.apollo-tabs-tab-disabled .apollo-tabs-tab-btn:active,.apollo-tabs .apollo-tabs-tab.apollo-tabs-tab-disabled .apollo-tabs-remove:active{color:var(--apollo-color-text-disabled);}
  .apollo-tabs .apollo-tabs-tab .apollo-tabs-tab-remove .apollo-icon{margin:0;vertical-align:middle;}
  .apollo-tabs .apollo-tabs-tab .apollo-icon:not(:last-child){margin-right:var(--apollo-margin-sm);}
  .apollo-tabs .apollo-tabs-tab+.apollo-tabs-tab{margin:0 0 0 var(--apollo-tabs-horizontal-item-gutter);}
  .apollo-tabs .apollo-tabs-body{position:relative;width:100%;}
  .apollo-tabs .apollo-tabs-body-holder{flex:auto;min-width:0;min-height:0;}
  .apollo-tabs .apollo-tabs-content:focus-visible{outline:var(--apollo-line-width-focus) solid var(--apollo-color-primary-border);outline-offset:1px;transition:outline-offset 0s,outline 0s;}
  .apollo-tabs .apollo-tabs-content-hidden{display:none;}
  .apollo-tabs-centered >.apollo-tabs-nav .apollo-tabs-nav-wrap:not([class*='.apollo-tabs-nav-wrap-ping'])>.apollo-tabs-nav-list,.apollo-tabs-centered >div>.apollo-tabs-nav .apollo-tabs-nav-wrap:not([class*='.apollo-tabs-nav-wrap-ping'])>.apollo-tabs-nav-list{margin:auto;}
  .apollo-tabs .apollo-tabs-switch-appear,.apollo-tabs .apollo-tabs-switch-enter{transition:none;}
  .apollo-tabs .apollo-tabs-switch-appear-start,.apollo-tabs .apollo-tabs-switch-enter-start{opacity:0;}
  .apollo-tabs .apollo-tabs-switch-appear-active,.apollo-tabs .apollo-tabs-switch-enter-active{opacity:1;transition:opacity var(--apollo-motion-duration-slow);}
  .apollo-tabs .apollo-tabs-switch-leave{position:absolute;transition:none;inset:0;}
  .apollo-tabs .apollo-tabs-switch-leave-start{opacity:1;}
  .apollo-tabs .apollo-tabs-switch-leave-active{opacity:0;transition:opacity var(--apollo-motion-duration-slow);}`;

/**
 * 下拉溢出菜单的滑动动画 keyframes（select/style「动画名稳定化」的同款副本；
 * 体逐字相同，供 tabs/style.css 单独引入时命中）。
 *
 * 🚨 2026-10-08：此前 `animation-name` 照抄了 cssinjs 开发态占位名
 * `css-dev-only-do-not-override-…-antSlideUpIn` 等，`@keyframes` 从未定义
 * ⇒ 溢出菜单开合动画不跑（U-KEYFRAMES 家族）。
 */
const KEYFRAMES = `
@keyframes apollo-slide-up-in{0%{transform:scaleY(0.8);transform-origin:0% 0%;opacity:0;}100%{transform:scaleY(1);transform-origin:0% 0%;opacity:1;}}
@keyframes apollo-slide-down-in{0%{transform:scaleY(0.8);transform-origin:100% 100%;opacity:0;}100%{transform:scaleY(1);transform-origin:100% 100%;opacity:1;}}
@keyframes apollo-slide-up-out{0%{transform:scaleY(1);transform-origin:0% 0%;opacity:1;}100%{transform:scaleY(0.8);transform-origin:0% 0%;opacity:0;}}
@keyframes apollo-slide-down-out{0%{transform:scaleY(1);transform-origin:100% 100%;opacity:1;}100%{transform:scaleY(0.8);transform-origin:100% 100%;opacity:0;}}`;

/** 生成完整样式：token 声明块 + 规则体。 */
export function genTabsStyle(rootPrefixCls: string): string {
  const decls = genTokenDecls(rootPrefixCls).join('');
  return `${KEYFRAMES}\n.${rootPrefixCls}-tabs{${decls}}\n\n${TABS_RULES}`;
}
