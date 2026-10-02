/**
 * Calendar 的样式生成（G4 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/calendar/style/index.js`（275 行）与它的真实产物。
 * 选择器结构**从真实产物逐条搬运**，不是推演 —— 可复现命令：
 *
 * ```sh
 * node tests/visual/debug/extract-calendar-css.mjs > /tmp/calendar-antd.css
 * ```
 *
 * ── 🚨 三条本组件特有的判据（写错必红）─────────────────────────────────────────
 *
 * 1. **根类是 `.apollo-picker-calendar`**（上游 `getPrefixCls('picker')`），
 *    **不是** `.apollo-calendar`；但 **CSS 变量名是 `--apollo-calendar-*`**
 *    （`genStyleHooks('Calendar')` 的命名空间）—— **类名与变量名的命名空间不同**。
 * 2. **面板那 83 条不是自己写的**，是 `genPanelRules(cls, '--{p}-calendar')` 从
 *    `date-picker` 的 `PANEL_RULES` **换作用域 + 换 token 命名空间**得到的
 *    （上游 `[calendarCls]: { ...genPanelStyle(token) }` 的等价物）。
 *    实测与产物 **83/83 逐条逐字节一致**。
 * 3. **插入位置在根规则之后、`-rtl` 之前** —— 上游 spread 的顺序是
 *    `{ ...genPanelStyle, ...resetComponent, background, '&-rtl', '-header' }`，
 *    而 cssinjs 把「纯声明」合并进根规则、把嵌套选择器按出现顺序排在其后。
 *    ⚠️ 顺序不能动：面板的 `.apollo-picker-panel` 与 calendar 的
 *    `.apollo-picker-calendar .apollo-picker-panel` 覆盖是同元素上的层叠关系。
 *
 * ── 与产物**有意**不一致的两处 ─────────────────────────────────────────────────
 *
 * 1. `resetComponent` 的 **4 条** `box-sizing` 块不产出（`BASE_CSS` 已覆盖，
 *    badge / spin / card / list 范式）。产物里它们是
 *    `.ant-picker-calendar` / `::before,::after` / `[class^="ant-picker"]` /
 *    `[class^="ant-picker"]::before,::after` 四条。
 * 2. 别名 token 落 `var(--apollo-*)` 而不是产物的**解析后字面量**
 *    （`#ffffff` / `rgba(0,0,0,0.04)`）—— 见 `./token.ts` 文件头的说明。
 *
 * ── 前缀参数化（`STATIC_PREFIX_CLS = ['apollo', 'ant']`）────────────────────────
 *
 * `packages/ui/src/style/index.ts` 的 `STATIC_PREFIX_CLS` 有两个前缀
 * ⇒ `gen(prefixCls)` 会被**各调一次**，**每次都必须产出对应前缀的选择器**。
 * 本文件是**参数化**的（`.${p}-picker-calendar` / `--${p}-calendar-*`），
 * 与 card / alert / breadcrumb / select 同判。
 *
 * 🚨 **两类替换的规则不同**（照 `date-picker` 的 `genDatePickerRules` 同判）：
 *   - **类名**（`.apollo-*`，含跨组件的 `.apollo-icon` / `.apollo-tag-blue` 与动效名
 *     `.apollo-slide-up-*`）⇒ **跟着前缀走**；
 *   - **全局别名变量**（`--apollo-color-*` 等）⇒ **不动** ——
 *     `theme/dist/tokens.css` 只声明 `--apollo-*`（382 个，0 个 `--ant-*`）；
 *   - **组件自有变量**（`--apollo-calendar-*` / 面板的 `--apollo-date-picker-*`）⇒ 跟着换。
 *
 * ⚠️ 这条曾经是**全仓 22 个组件**的缺口（date-picker 与 calendar 已于 2026-10-02 修好），
 * 剩余清单与双向校验见 `packages/ui/src/__tests__/style-prefix.test.ts` 的 `KNOWN_GAPS`。
 */

import { genPanelRules } from '../../date-picker/style';
import { CALENDAR_DERIVED, calendarTokenValues } from './token';

/** 5 个 `mergeToken` 派生里会进 CSS 的 3 条表达式（唯一真源在 `./token.ts`）。 */
const D = CALENDAR_DERIVED;

/**
 * 驼峰 → kebab-case。
 *
 * 🚨 **必须只在小写/数字与紧跟的大写之间插连字符**，不能给每个大写字母都插 ——
 * 否则 `paddingBlockSM` 会变成 `padding-block-s-m`（规则引用的是 `padding-block-sm`）
 * ⇒ 变量名对不上 ⇒ **静默失效**。判据与踩坑记录见
 * `date-picker/style/index.ts` 的 `toKebab`（同一条，8 个变量名拼错那次）。
 */
function toKebab(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Component Token 的声明块（**27** 条 = 6 自有 + 21 面板，构建期解析值）。
 *
 * ⚠️ 顺序 = `prepareComponentToken` 的返回键序。实测产物顺序是
 * `full-bg` → … → `mini-content-height` → **`internal_fixed_item_margin`** → `cell-hover-bg` → …，
 * 即 `...initPanelComponentToken(token)` 的 21 个键里**第一个**就是内部量。
 */
export function genCalendarTokenDecls(rootPrefixCls: string): string[] {
  const t = calendarTokenValues();
  const n = `--${rootPrefixCls}-calendar`;
  const out: string[] = [];

  for (const [key, value] of Object.entries(t)) {
    const kebab = toKebab(key);
    // ⚠️ 数值补 px；本组没有 `zIndexPopup` 那类无单位量，所以不做例外分支
    const cssValue = typeof value === 'number' ? `${value}px` : String(value);
    out.push(`  ${n}-${kebab}:${cssValue};`);
  }

  return out;
}

const CALENDAR_RULES_HEAD = (p: string): string => `
  .${p}-picker-calendar{box-sizing:border-box;margin:0;padding:0;color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);list-style:none;font-family:var(--apollo-font-family);background:var(--${p}-calendar-full-bg);}
`;

const CALENDAR_RULES_TAIL = (p: string): string => `
  .${p}-picker-calendar-rtl{direction:rtl;}
  .${p}-picker-calendar .${p}-picker-calendar-header{display:flex;justify-content:flex-end;padding:var(--apollo-padding-sm) 0;}
  .${p}-picker-calendar .${p}-picker-calendar-header .${p}-picker-calendar-year-select{min-width:var(--${p}-calendar-year-control-width);}
  .${p}-picker-calendar .${p}-picker-calendar-header .${p}-picker-calendar-month-select{min-width:var(--${p}-calendar-month-control-width);margin-inline-start:var(--apollo-margin-xs);}
  .${p}-picker-calendar .${p}-picker-calendar-header .${p}-picker-calendar-mode-switch{margin-inline-start:var(--apollo-margin-xs);}
  .${p}-picker-calendar .${p}-picker-panel{background:var(--${p}-calendar-full-panel-bg);border:0;border-top:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-split);border-radius:0;}
  .${p}-picker-calendar .${p}-picker-panel .${p}-picker-month-panel,.${p}-picker-calendar .${p}-picker-panel .${p}-picker-date-panel{width:auto;}
  .${p}-picker-calendar .${p}-picker-panel .${p}-picker-body{padding:var(--apollo-padding-xs) 0;}
  .${p}-picker-calendar .${p}-picker-panel .${p}-picker-content{width:100%;}
  .${p}-picker-calendar-mini{border-radius:var(--apollo-border-radius-lg);}
  .${p}-picker-calendar-mini .${p}-picker-calendar-header{padding-inline-end:var(--apollo-padding-xs);padding-inline-start:var(--apollo-padding-xs);}
  .${p}-picker-calendar-mini .${p}-picker-panel{border-radius:0 0 var(--apollo-border-radius-lg) var(--apollo-border-radius-lg);}
  .${p}-picker-calendar-mini .${p}-picker-content{height:var(--${p}-calendar-mini-content-height);}
  .${p}-picker-calendar-mini .${p}-picker-content th{height:auto;padding:0;line-height:${D.weekHeight};}
  .${p}-picker-calendar-mini .${p}-picker-cell::before{pointer-events:none;}
  .${p}-picker-calendar.${p}-picker-calendar-full .${p}-picker-panel{display:block;width:100%;text-align:end;background:var(--${p}-calendar-full-bg);border:0;}
  .${p}-picker-calendar.${p}-picker-calendar-full .${p}-picker-panel .${p}-picker-body th,.${p}-picker-calendar.${p}-picker-calendar-full .${p}-picker-panel .${p}-picker-body td{padding:0;}
  .${p}-picker-calendar.${p}-picker-calendar-full .${p}-picker-panel .${p}-picker-body th{height:auto;padding-inline-end:var(--apollo-padding-sm);padding-bottom:var(--apollo-padding-xxs);line-height:${D.weekHeight};}
  .${p}-picker-calendar.${p}-picker-calendar-full .${p}-picker-cell-week .${p}-picker-cell-inner{display:block;border-radius:0;border-top:var(--apollo-line-width-bold) var(--apollo-line-type) var(--apollo-color-split);width:100%;height:calc(${D.dateValueHeight} + ${D.dateContentHeight} + var(--apollo-padding-xs) / 2 + var(--apollo-line-width-bold));}
  .${p}-picker-calendar.${p}-picker-calendar-full .${p}-picker-cell::before{display:none;}
  .${p}-picker-calendar.${p}-picker-calendar-full .${p}-picker-cell:hover .${p}-picker-calendar-date{background:var(--apollo-control-item-bg-hover);}
  .${p}-picker-calendar.${p}-picker-calendar-full .${p}-picker-cell .${p}-picker-calendar-date-today::before{display:none;}
  .${p}-picker-calendar.${p}-picker-calendar-full .${p}-picker-cell-in-view.${p}-picker-cell-selected .${p}-picker-calendar-date,.${p}-picker-calendar.${p}-picker-calendar-full .${p}-picker-cell-in-view.${p}-picker-cell-selected .${p}-picker-calendar-date-today{background:var(--${p}-calendar-item-active-bg);}
  .${p}-picker-calendar.${p}-picker-calendar-full .${p}-picker-cell-selected .${p}-picker-calendar-date .${p}-picker-calendar-date-value,.${p}-picker-calendar.${p}-picker-calendar-full .${p}-picker-cell-selected:hover .${p}-picker-calendar-date .${p}-picker-calendar-date-value,.${p}-picker-calendar.${p}-picker-calendar-full .${p}-picker-cell-selected .${p}-picker-calendar-date-today .${p}-picker-calendar-date-value,.${p}-picker-calendar.${p}-picker-calendar-full .${p}-picker-cell-selected:hover .${p}-picker-calendar-date-today .${p}-picker-calendar-date-value{color:var(--apollo-color-primary);}
  .${p}-picker-calendar.${p}-picker-calendar-full .${p}-picker-calendar-date{display:block;width:auto;height:auto;margin:0 calc(var(--apollo-margin-xs) / 2);padding:calc(var(--apollo-padding-xs) / 2) var(--apollo-padding-xs) 0;border:0;border-top:var(--apollo-line-width-bold) var(--apollo-line-type) var(--apollo-color-split);border-radius:0;transition:background-color var(--apollo-motion-duration-slow);}
  .${p}-picker-calendar.${p}-picker-calendar-full .${p}-picker-calendar-date-value{line-height:${D.dateValueHeight};transition:color var(--apollo-motion-duration-slow);}
  .${p}-picker-calendar.${p}-picker-calendar-full .${p}-picker-calendar-date-content{position:static;width:auto;height:${D.dateContentHeight};overflow-y:auto;color:var(--apollo-color-text);line-height:var(--apollo-line-height);text-align:start;}
  .${p}-picker-calendar.${p}-picker-calendar-full .${p}-picker-calendar-date-today{border-color:var(--apollo-color-primary);}
  .${p}-picker-calendar.${p}-picker-calendar-full .${p}-picker-calendar-date-today .${p}-picker-calendar-date-value{color:var(--apollo-color-text);}
  @media only screen and (max-width: 480px){
  .${p}-picker-calendar .${p}-picker-calendar-header{display:block;}
  .${p}-picker-calendar .${p}-picker-calendar-header .${p}-picker-calendar-year-select{width:50%;}
  .${p}-picker-calendar .${p}-picker-calendar-header .${p}-picker-calendar-month-select{width:calc(50% - var(--apollo-padding-xs));}
  .${p}-picker-calendar .${p}-picker-calendar-header .${p}-picker-calendar-mode-switch{width:100%;margin-top:var(--apollo-margin-xs);margin-inline-start:0;}
  .${p}-picker-calendar .${p}-picker-calendar-header .${p}-picker-calendar-mode-switch >label{width:50%;text-align:center;}
  }
`;

/**
 * 面板规则换到 calendar 的作用域 —— **两步都要做**。
 *
 * 1. `genPanelRules(cls, tokenNs)` 换**作用域类**（`.apollo-picker-dropdown ` → `cls`）
 *    与**组件自有变量的命名空间**（`--apollo-date-picker-*` → `--${p}-calendar-*`）；
 * 2. 再把**其余所有类名** `.apollo-*` 换成 `.${p}-*`。
 *
 * 🚨 **第 2 步不能省**（2026-10-02 由「全仓前缀扫描」抓到）：`genPanelRules` 只替换
 * **每个选择器的开头那个作用域类**，选择器**其余部分**的面板类名（`.apollo-picker-panel`
 * / `-header` / `-cell` …）原样留着 ⇒ `ant` 版会产出
 * `.ant-picker-calendar .apollo-picker-panel{…}` —— **面板样式完全不生效**
 * （实测 `apollo` 517 处 `.apollo-` vs `ant` 只有 264 处，缺口 253）。
 *
 * ⚠️ 顺序不能反：先换作用域（得到 `cls`），再全局换 `.apollo-` ——
 * 若反过来，`cls` 里的 `.apollo-picker-calendar` 会被一起换掉（那是我们要的结果，
 * 但 `genPanelRules` 收到的 `cls` 就已经是错的了）。
 */
function genCalendarPanelRules(p: string, cls: string): string {
  return genPanelRules(cls, `--${p}-calendar`).replace(/\.apollo-/g, `.${p}-`);
}

/**
 * 生成完整样式：token 声明块 + 根规则 + 面板规则（换作用域）+ 自有规则。
 *
 * 🚨 **声明块必须同时落在「根」与「`-css-var` 类」上**（2026-10-01 date-picker 的 L6
 * 抓到的真 bug，18/21 组红）：浮层/子树里的 `var(--{p}-calendar-*)` 要能解析到，
 * 而 `.vue` 会把 `css-var-root` 与 `{cls}-css-var` 同时加到根上。
 * 与 `select` 的 `.apollo-select,.apollo-select-css-var{…}` 同判。
 */
export function genCalendarStyle(rootPrefixCls: string): string {
  const p = rootPrefixCls;
  const cls = `.${p}-picker-calendar`;
  const decls = genCalendarTokenDecls(p).join('');
  return [
    `${cls},${cls}-css-var{${decls}}`,
    '',
    CALENDAR_RULES_HEAD(p),
    genCalendarPanelRules(p, cls),
    CALENDAR_RULES_TAIL(p),
  ].join('\n');
}
