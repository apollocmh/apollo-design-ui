/**
 * DatePicker 的静态样式（antd 6.6.4 的 date-picker 样式产物的**机械移植**）。
 *
 * ── 这份文件是怎么来的 ──────────────────────────────────────────────────────
 *
 * ```bash
 * node tests/visual/debug/extract-date-picker-css.mjs --emit-static > /tmp/dp-static.css
 * ```
 *
 * 只做「删壳改名、不改值」：去 `:where(.css-dev-only-do-not-override-X)` 作用域壳、
 * 去 css-var 声明块（那份由 `genTokenDecls` 自己产出）、`.ant-` → `.apollo-`、
 * 空白折成**单空格**。
 *
 * ── 规则面（**257 条**）────────────────────────────────────────────
 *
 * 触发器：`-picker`（尺寸 / 变体 / 状态 / 禁用 / 清除 / 前缀 / 后缀）·
 * `-picker-range`（两端 / 分隔符 / `-active-bar`）· `-picker-multiple`（标签）·
 * `-picker-input`（含 `-active` / `-placeholder`）· `-picker-clear` · `-picker-suffix`。
 *
 * 浮层：`-picker-dropdown`（含 `-range` / `-rtl`）· `-picker-panel-container` ·
 * `-picker-panel-layout` · `-picker-presets` · `-picker-footer` · `-picker-ok` / `-picker-now`。
 *
 * 面板：`-picker-panel`（含 `-header` / `-body` / `-content` / `-footer` / `-container`）·
 * `-picker-date-panel` · `-picker-week-panel` · `-picker-month-panel` ·
 * `-picker-quarter-panel` · `-picker-year-panel` · `-picker-decade-panel` ·
 * `-picker-time-panel`（含 `-column` / `-content`）· `-picker-cell`（含 `-inner` / 各状态）。
 *
 * ── 🚨 三处与其它组件**不同**的地方 ───────────────────────────────────────────
 *
 * 1. **类名前缀与变量命名空间不同名**：类名是 `apollo-picker`
 *    （上游 `getPrefixCls('picker', …)` 传的是**字面量** `'picker'`），
 *    而 CSS 变量是 `--apollo-date-picker-*`（由组件名 `DatePicker` 派生）。
 *    ⇒ `genTokenDecls` 里的变量前缀用 `date-picker`、`genDatePickerStyle` 的根类用 `picker`。
 * 2. **`ant-picker` 前缀被 date-picker 与 time-picker 共用**（上游刻意如此）⇒
 *    本文件里含 time-picker 的规则（`-time-panel` / `-time-column` 等）。
 *    那是**对的**（同一组件族），不要当 bug 过滤掉。
 * 3. **浮层走 Portal** ⇒ 这些规则挂在 `.apollo-picker-dropdown` 下，但 DOM 里它在
 *    `document.body` 上（`Trigger` 的 Portal）—— **不是** `.apollo-picker` 的后代。
 */

import { datePickerTokenValues } from './token';

/**
 * Token 声明块（**恰好 45 条** = `prepareComponentToken` 的**全部** 45 个键）。
 *
 * 🚨 **`INTERNAL_FIXED_ITEM_MARGIN` 也在这里**（2026-09-30 实测纠正）：
 * 我先前断言「它是内部量、不落变量」是**错的** —— 实测 antd 产物里它是
 * `--ant-date-picker-internal_fixed_item_margin: 2px`（**带下划线**，值补了 `px`），
 * 且被 `multiple` 的规则引用（`margin-block:var(…)`）。
 *
 * 当时漏掉它的原因是**探针的正则**：`/--ant-date-picker-([a-z0-9-]+)/` 的字符类
 * **不含下划线** ⇒ 这个变量压根没被扫出来，于是「45 个」被我误读成
 * 「44 个 + affix-color」。**变量名里的下划线是这条坑的关键**
 * （上游的 `INTERNAL_FIXED_ITEM_MARGIN` 是全大写 + 下划线，转 kebab 后
 * `toLowerCase()` 恰好得到 `internal_fixed_item_margin` —— 保留了下划线）。
 *
 * ⚠️ 数值字段要补 `px`，**唯一例外是 `zIndexPopup`**（层叠序号，不是长度）。
 * 不补会让尺寸静默失效（PITFALLS 170 / D94 的产物侧）。
 *
 * ⚠️ 顺序 = `prepareComponentToken` 的返回键序。**CSS 变量声明顺序不影响行为**
 * （同一个选择器块内的声明），所以不刻意对齐 antd 产物的注册序。
 *
 * ⚠️ 产物里还有第 **46** 个变量 `--apollo-date-picker-affix-color` —— 它**不在**
 * `prepareComponentToken` 的返回值里，而是**规则内声明**的（`.apollo-picker{…}` 与两个
 * 状态变体），所以**不在这里**（见 `README §4` 的说明）。
 */
export function genTokenDecls(rootPrefixCls: string): string[] {
  const t = datePickerTokenValues();
  const n = `--${rootPrefixCls}-date-picker`;
  const out: string[] = [];

  for (const [key, value] of Object.entries(t)) {
    // ⚠️ 不排除任何键 —— `INTERNAL_FIXED_ITEM_MARGIN` 也落变量（见上面的说明）
    const kebab = toKebab(key);
    // ⚠️ 数值补 px，`zIndexPopup` 例外
    const cssValue =
      typeof value === 'number' && key !== 'zIndexPopup' ? `${value}px` : String(value);
    out.push(`  ${n}-${kebab}:${cssValue};`);
  }

  return out;
}

/**
 * 驼峰 → kebab-case。
 *
 * 🚨 **必须只在小写/数字与紧跟的大写之间插连字符**，不能给每个大写字母都插 ——
 * 否则 `paddingBlockSM` 会变成 `padding-block-s-m`，而规则引用的是
 * `padding-block-sm` ⇒ **变量名对不上 ⇒ 静默失效**（`-sm` / `-lg` 系的尺寸全部走兜底值）。
 *
 * 本轮实测踩到（**8 个**变量名全部拼错）：
 *
 * | 键 | ✅ 正确 | ❌ 逐大写插连字符 |
 * |---|---|---|
 * | `paddingBlockSM` | `padding-block-sm` | `padding-block-s-m` |
 * | `paddingInlineSM` | `padding-inline-sm` | `padding-inline-s-m` |
 * | `paddingBlockLG` | `padding-block-lg` | `padding-block-l-g` |
 * | `inputFontSizeLG` | `input-font-size-lg` | `input-font-size-l-g` |
 * | `multipleItemHeightSM` | `multiple-item-height-sm` | `multiple-item-height-s-m` |
 * | `zIndexPopup` | `z-index-popup` | `z-index-popup`（碰巧对） |
 *
 * ⚠️ **`-s-m` 这种拼错的变量名不会报错**：`genTokenDecls` 声明了它、规则引用了
 * `-sm` ⇒ 规则里的 `var()` 解析不到、**回退到继承值或初始值**。
 * 这就是 B7 存在的理由，也是「声明清单 vs 引用清单**双向**比对」必须做的原因
 * （只做「外部变量是否声明」的单向检查会漏掉这一类 —— 本轮实测漏了）。
 */
function toKebab(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/** 257 条规则（由 `--emit-static` 产出，逐字搬运、只改前缀）。 */
export const DATE_PICKER_RULES = `
  .apollo-picker-dropdown .apollo-picker-footer{border-top:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-split);}
  .apollo-picker-dropdown .apollo-picker-footer-extra{padding:0 var(--apollo-padding-sm);line-height:calc(var(--apollo-date-picker-text-height) - var(--apollo-line-width) * 2);text-align:start;}
  .apollo-picker-dropdown .apollo-picker-footer-extra:not(:last-child){border-bottom:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-split);}
  .apollo-picker-dropdown .apollo-picker-panels+.apollo-picker-footer .apollo-picker-ranges{justify-content:space-between;}
  .apollo-picker-dropdown .apollo-picker-ranges{margin-block:0;padding-inline:var(--apollo-padding-sm);overflow:hidden;text-align:start;list-style:none;display:flex;justify-content:center;align-items:center;}
  .apollo-picker-dropdown .apollo-picker-ranges >li{line-height:calc(var(--apollo-date-picker-text-height) - var(--apollo-line-width) * 2);display:inline-block;}
  .apollo-picker-dropdown .apollo-picker-ranges .apollo-picker-now-btn-disabled{pointer-events:none;color:var(--apollo-color-text-disabled);}
  .apollo-picker-dropdown .apollo-picker-ranges .apollo-picker-preset>.apollo-tag-blue{color:var(--apollo-color-primary);background:var(--apollo-date-picker-cell-active-with-range-bg);border-color:var(--apollo-color-primary-border);cursor:pointer;}
  .apollo-picker-dropdown .apollo-picker-ranges .apollo-picker-ok{padding-block:calc(var(--apollo-line-width) * 2);margin-inline-start:auto;}
  .apollo-picker{--apollo-date-picker-affix-color:inherit;box-sizing:border-box;margin:0;padding:var(--apollo-date-picker-padding-block) var(--apollo-date-picker-padding-inline);color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:1;list-style:none;font-family:var(--apollo-font-family);position:relative;display:inline-flex;align-items:center;border-radius:var(--apollo-border-radius);transition:border var(--apollo-motion-duration-mid),box-shadow var(--apollo-motion-duration-mid),background-color var(--apollo-motion-duration-mid);}
  .apollo-picker .apollo-picker-prefix{color:var(--apollo-date-picker-affix-color);flex:0 0 auto;margin-inline-end:var(--apollo-padding-xxs);}
  .apollo-picker .apollo-picker-input{position:relative;display:inline-flex;align-items:center;width:100%;}
  .apollo-picker .apollo-picker-input >input{position:relative;display:inline-block;width:100%;color:inherit;font-size:var(--apollo-date-picker-input-font-size);line-height:var(--apollo-line-height);transition:all var(--apollo-motion-duration-mid);flex:auto;min-width:1px;height:auto;padding:0;background:transparent;border:0;font-family:inherit;}
  .apollo-picker .apollo-picker-input >input::-moz-placeholder{opacity:1;}
  .apollo-picker .apollo-picker-input >input::placeholder{color:var(--apollo-color-text-placeholder);user-select:none;}
  .apollo-picker .apollo-picker-input >input:placeholder-shown{text-overflow:ellipsis;}
  .apollo-picker .apollo-picker-input >input:focus{box-shadow:none;outline:0;}
  .apollo-picker .apollo-picker-input >input[disabled]{background:transparent;color:var(--apollo-color-text-disabled);cursor:not-allowed;}
  .apollo-picker .apollo-picker-input-placeholder >input{color:var(--apollo-color-text-placeholder);}
  .apollo-picker-large{padding:var(--apollo-date-picker-padding-block-lg) var(--apollo-date-picker-padding-inline-lg);border-radius:var(--apollo-border-radius-lg);}
  .apollo-picker-large .apollo-picker-input>input{font-size:var(--apollo-date-picker-input-font-size-lg);line-height:var(--apollo-line-height-lg);}
  .apollo-picker-small{padding:var(--apollo-date-picker-padding-block-sm) var(--apollo-date-picker-padding-inline-sm);border-radius:var(--apollo-border-radius-sm);}
  .apollo-picker-small .apollo-picker-input>input{font-size:var(--apollo-date-picker-input-font-size-sm);}
  .apollo-picker .apollo-picker-suffix{display:flex;flex:none;align-self:center;margin-inline-start:calc(var(--apollo-padding-xs) / 2);color:var(--apollo-color-text-quaternary);line-height:1;pointer-events:none;transition:opacity var(--apollo-motion-duration-mid),color var(--apollo-motion-duration-mid);}
  .apollo-picker .apollo-picker-suffix >*{vertical-align:top;}
  .apollo-picker .apollo-picker-suffix >*:not(:last-child){margin-inline-end:var(--apollo-margin-xs);}
  .apollo-picker .apollo-picker-clear{position:absolute;top:50%;inset-inline-end:0;color:var(--apollo-color-text-quaternary);line-height:1;padding:0;font-size:inherit;font-family:inherit;background:transparent;border:0;appearance:none;transform:translateY(-50%);cursor:pointer;opacity:0;pointer-events:none;transition:opacity var(--apollo-motion-duration-mid),color var(--apollo-motion-duration-mid);}
  .apollo-picker .apollo-picker-clear >*{vertical-align:top;}
  .apollo-picker .apollo-picker-clear:hover{color:var(--apollo-color-icon);}
  .apollo-picker .apollo-picker-clear:focus-visible{color:var(--apollo-color-icon);border-radius:var(--apollo-border-radius-sm);outline:var(--apollo-date-picker-line-width-focus) solid var(--apollo-color-primary-border);outline-offset:1px;transition:outline-offset 0s,outline 0s;}
  .apollo-picker:hover .apollo-picker-clear,.apollo-picker:focus-within .apollo-picker-clear{opacity:1;pointer-events:auto;}
  .apollo-picker:hover .apollo-picker-suffix:not(:last-child),.apollo-picker:focus-within .apollo-picker-suffix:not(:last-child){opacity:0;}
  .apollo-picker .apollo-picker-separator{position:relative;display:inline-block;width:1em;height:var(--apollo-font-size-lg);color:var(--apollo-color-text-quaternary);font-size:var(--apollo-font-size-lg);vertical-align:top;cursor:default;}
  .apollo-picker-focused .apollo-picker .apollo-picker-separator{color:var(--apollo-color-icon);}
  .apollo-picker-disabled .apollo-picker-range-separator .apollo-picker .apollo-picker-separator{cursor:not-allowed;}
  .apollo-picker-range{position:relative;display:inline-flex;}
  .apollo-picker-range .apollo-picker-active-bar{bottom:calc(var(--apollo-line-width) * -1);height:var(--apollo-line-width-bold);background:var(--apollo-color-primary);opacity:0;transition:all var(--apollo-motion-duration-slow) ease-out;pointer-events:none;}
  .apollo-picker-range.apollo-picker-focused .apollo-picker-active-bar{opacity:1;}
  .apollo-picker-range .apollo-picker-range-separator{align-items:center;padding:0 var(--apollo-padding-xs);line-height:1;}
  .apollo-picker-range .apollo-picker-clear,.apollo-picker-multiple .apollo-picker-clear{inset-inline-end:var(--apollo-date-picker-padding-inline);}
  .apollo-picker-range.apollo-picker-small .apollo-picker-clear,.apollo-picker-multiple.apollo-picker-small .apollo-picker-clear{inset-inline-end:var(--apollo-date-picker-padding-inline-sm);}
  .apollo-picker-dropdown{box-sizing:border-box;margin:0;padding:0;color:var(--apollo-color-text);font-size:var(--apollo-font-size);line-height:var(--apollo-line-height);list-style:none;font-family:var(--apollo-font-family);pointer-events:none;position:absolute;top:-9999px;left:-9999px;z-index:var(--apollo-date-picker-z-index-popup);}
  .apollo-picker-dropdown .apollo-picker-panel{display:inline-flex;flex-direction:column;text-align:center;background:var(--apollo-color-bg-container);border-radius:var(--apollo-border-radius-lg);outline:none;}
  .apollo-picker-dropdown .apollo-picker-panel-focused{border-color:var(--apollo-color-primary);}
  .apollo-picker-dropdown .apollo-picker-panel-rtl .apollo-picker-prev-icon,.apollo-picker-dropdown .apollo-picker-panel-rtl .apollo-picker-super-prev-icon{transform:rotate(45deg);}
  .apollo-picker-dropdown .apollo-picker-panel-rtl .apollo-picker-next-icon,.apollo-picker-dropdown .apollo-picker-panel-rtl .apollo-picker-super-next-icon{transform:rotate(-135deg);}
  .apollo-picker-dropdown .apollo-picker-panel-rtl .apollo-picker-time-panel .apollo-picker-content{direction:ltr;}
  .apollo-picker-dropdown .apollo-picker-panel-rtl .apollo-picker-time-panel .apollo-picker-content >*{direction:rtl;}
  .apollo-picker-dropdown .apollo-picker-decade-panel,.apollo-picker-dropdown .apollo-picker-year-panel,.apollo-picker-dropdown .apollo-picker-quarter-panel,.apollo-picker-dropdown .apollo-picker-month-panel,.apollo-picker-dropdown .apollo-picker-week-panel,.apollo-picker-dropdown .apollo-picker-date-panel,.apollo-picker-dropdown .apollo-picker-time-panel{display:flex;flex-direction:column;width:calc(var(--apollo-date-picker-cell-width) * 7 + calc(var(--apollo-padding) + var(--apollo-padding-xxs) / 2) * 2);}
  .apollo-picker-dropdown .apollo-picker-header{display:flex;padding:0 var(--apollo-padding-xs);color:var(--apollo-color-text-heading);border-bottom:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-split);}
  .apollo-picker-dropdown .apollo-picker-header >*{flex:none;}
  .apollo-picker-dropdown .apollo-picker-header button{padding:0;color:var(--apollo-color-icon);line-height:var(--apollo-date-picker-text-height);background:transparent;border:0;cursor:pointer;transition:color var(--apollo-motion-duration-mid);font-size:inherit;display:inline-flex;align-items:center;justify-content:center;}
  .apollo-picker-dropdown .apollo-picker-header button:empty{display:none;}
  .apollo-picker-dropdown .apollo-picker-header >button{min-width:1.6em;font-size:var(--apollo-font-size);}
  .apollo-picker-dropdown .apollo-picker-header >button:hover{color:var(--apollo-color-icon-hover);}
  .apollo-picker-dropdown .apollo-picker-header >button:disabled{opacity:0.25;pointer-events:none;}
  .apollo-picker-dropdown .apollo-picker-header-view{flex:auto;font-weight:var(--apollo-font-weight-strong);line-height:var(--apollo-date-picker-text-height);}
  .apollo-picker-dropdown .apollo-picker-header-view >button{color:inherit;font-weight:inherit;vertical-align:top;}
  .apollo-picker-dropdown .apollo-picker-header-view >button:not(:first-child){margin-inline-start:var(--apollo-padding-xs);}
  .apollo-picker-dropdown .apollo-picker-header-view >button:hover{color:var(--apollo-color-primary);}
  .apollo-picker-dropdown .apollo-picker-prev-icon,.apollo-picker-dropdown .apollo-picker-next-icon,.apollo-picker-dropdown .apollo-picker-super-prev-icon,.apollo-picker-dropdown .apollo-picker-super-next-icon{position:relative;width:7px;height:7px;}
  .apollo-picker-dropdown .apollo-picker-prev-icon::before,.apollo-picker-dropdown .apollo-picker-next-icon::before,.apollo-picker-dropdown .apollo-picker-super-prev-icon::before,.apollo-picker-dropdown .apollo-picker-super-next-icon::before{position:absolute;top:0;inset-inline-start:0;width:7px;height:7px;border:0 solid currentcolor;border-block-start-width:1.5px;border-inline-start-width:1.5px;content:"";}
  .apollo-picker-dropdown .apollo-picker-super-prev-icon::after,.apollo-picker-dropdown .apollo-picker-super-next-icon::after{position:absolute;top:4px;inset-inline-start:4px;display:inline-block;width:7px;height:7px;border:0 solid currentcolor;border-block-start-width:1.5px;border-inline-start-width:1.5px;content:"";}
  .apollo-picker-dropdown .apollo-picker-prev-icon,.apollo-picker-dropdown .apollo-picker-super-prev-icon{transform:rotate(-45deg);}
  .apollo-picker-dropdown .apollo-picker-next-icon,.apollo-picker-dropdown .apollo-picker-super-next-icon{transform:rotate(135deg);}
  .apollo-picker-dropdown .apollo-picker-content{width:100%;table-layout:fixed;border-collapse:collapse;}
  .apollo-picker-dropdown .apollo-picker-content th,.apollo-picker-dropdown .apollo-picker-content td{position:relative;min-width:var(--apollo-date-picker-cell-height);font-weight:normal;}
  .apollo-picker-dropdown .apollo-picker-content th{height:calc(var(--apollo-date-picker-cell-height) + calc(var(--apollo-padding-xxs) + var(--apollo-padding-xxs) / 2) * 2);color:var(--apollo-color-text);vertical-align:middle;}
  .apollo-picker-dropdown .apollo-picker-cell{padding:calc(var(--apollo-padding-xxs) + var(--apollo-padding-xxs) / 2) 0;color:var(--apollo-color-text-disabled);cursor:pointer;}
  .apollo-picker-dropdown .apollo-picker-cell-in-view{color:var(--apollo-color-text);}
  .apollo-picker-dropdown .apollo-picker-cell::before{position:absolute;top:50%;inset-inline-start:0;inset-inline-end:0;z-index:1;height:var(--apollo-date-picker-cell-height);transform:translateY(-50%);content:"";pointer-events:none;}
  .apollo-picker-dropdown .apollo-picker-cell .apollo-picker-cell-inner{position:relative;z-index:2;display:inline-block;min-width:var(--apollo-date-picker-cell-height);height:var(--apollo-date-picker-cell-height);line-height:var(--apollo-date-picker-cell-height);border-radius:var(--apollo-border-radius-sm);transition:background-color var(--apollo-motion-duration-mid);}
  .apollo-picker-dropdown .apollo-picker-cell:hover:not(.apollo-picker-cell-in-view):not(.apollo-picker-cell-disabled) .apollo-picker-cell-inner,.apollo-picker-dropdown .apollo-picker-cell:hover:not(.apollo-picker-cell-selected):not(.apollo-picker-cell-range-start):not(.apollo-picker-cell-range-end):not(.apollo-picker-cell-disabled) .apollo-picker-cell-inner{background:var(--apollo-date-picker-cell-hover-bg);}
  .apollo-picker-dropdown .apollo-picker-cell-in-view.apollo-picker-cell-today .apollo-picker-cell-inner::before{position:absolute;top:0;inset-inline-end:0;bottom:0;inset-inline-start:0;z-index:1;border:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-primary);border-radius:var(--apollo-border-radius-sm);content:"";}
  .apollo-picker-dropdown .apollo-picker-cell-in-view.apollo-picker-cell-in-range,.apollo-picker-dropdown .apollo-picker-cell-in-view.apollo-picker-cell-range-start,.apollo-picker-dropdown .apollo-picker-cell-in-view.apollo-picker-cell-range-end{position:relative;}
  .apollo-picker-dropdown .apollo-picker-cell-in-view.apollo-picker-cell-in-range:not(.apollo-picker-cell-disabled):before,.apollo-picker-dropdown .apollo-picker-cell-in-view.apollo-picker-cell-range-start:not(.apollo-picker-cell-disabled):before,.apollo-picker-dropdown .apollo-picker-cell-in-view.apollo-picker-cell-range-end:not(.apollo-picker-cell-disabled):before{background:var(--apollo-date-picker-cell-active-with-range-bg);}
  .apollo-picker-dropdown .apollo-picker-cell-in-view.apollo-picker-cell-selected:not(.apollo-picker-cell-disabled) .apollo-picker-cell-inner,.apollo-picker-dropdown .apollo-picker-cell-in-view.apollo-picker-cell-range-start:not(.apollo-picker-cell-disabled) .apollo-picker-cell-inner,.apollo-picker-dropdown .apollo-picker-cell-in-view.apollo-picker-cell-range-end:not(.apollo-picker-cell-disabled) .apollo-picker-cell-inner{color:var(--apollo-color-text-light-solid);background:var(--apollo-color-primary);}
  .apollo-picker-dropdown .apollo-picker-cell-in-view.apollo-picker-cell-selected.apollo-picker-cell-disabled .apollo-picker-cell-inner,.apollo-picker-dropdown .apollo-picker-cell-in-view.apollo-picker-cell-range-start.apollo-picker-cell-disabled .apollo-picker-cell-inner,.apollo-picker-dropdown .apollo-picker-cell-in-view.apollo-picker-cell-range-end.apollo-picker-cell-disabled .apollo-picker-cell-inner{background:var(--apollo-color-fill-secondary);}
  .apollo-picker-dropdown .apollo-picker-cell-in-view.apollo-picker-cell-range-start:not(.apollo-picker-cell-disabled):before{inset-inline-start:50%;}
  .apollo-picker-dropdown .apollo-picker-cell-in-view.apollo-picker-cell-range-end:not(.apollo-picker-cell-disabled):before{inset-inline-end:50%;}
  .apollo-picker-dropdown .apollo-picker-cell-in-view.apollo-picker-cell-range-start:not(.apollo-picker-cell-range-end) .apollo-picker-cell-inner{border-start-start-radius:var(--apollo-border-radius-sm);border-end-start-radius:var(--apollo-border-radius-sm);border-start-end-radius:0;border-end-end-radius:0;}
  .apollo-picker-dropdown .apollo-picker-cell-in-view.apollo-picker-cell-range-end:not(.apollo-picker-cell-range-start) .apollo-picker-cell-inner{border-start-start-radius:0;border-end-start-radius:0;border-start-end-radius:var(--apollo-border-radius-sm);border-end-end-radius:var(--apollo-border-radius-sm);}
  .apollo-picker-dropdown .apollo-picker-cell-disabled{color:var(--apollo-color-text-disabled);cursor:not-allowed;}
  .apollo-picker-dropdown .apollo-picker-cell-disabled .apollo-picker-cell-inner{background:transparent;}
  .apollo-picker-dropdown .apollo-picker-cell-disabled::before{background:var(--apollo-date-picker-cell-bg-disabled);}
  .apollo-picker-dropdown .apollo-picker-cell-disabled.apollo-picker-cell-today .apollo-picker-cell-inner::before{border-color:var(--apollo-color-text-disabled);}
  .apollo-picker-dropdown .apollo-picker-decade-panel .apollo-picker-content,.apollo-picker-dropdown .apollo-picker-year-panel .apollo-picker-content,.apollo-picker-dropdown .apollo-picker-quarter-panel .apollo-picker-content,.apollo-picker-dropdown .apollo-picker-month-panel .apollo-picker-content{height:calc(var(--apollo-date-picker-without-time-cell-height) * 4);}
  .apollo-picker-dropdown .apollo-picker-decade-panel .apollo-picker-cell-inner,.apollo-picker-dropdown .apollo-picker-year-panel .apollo-picker-cell-inner,.apollo-picker-dropdown .apollo-picker-quarter-panel .apollo-picker-cell-inner,.apollo-picker-dropdown .apollo-picker-month-panel .apollo-picker-cell-inner{padding:0 var(--apollo-padding-xs);}
  .apollo-picker-dropdown .apollo-picker-quarter-panel .apollo-picker-content{height:calc(var(--apollo-control-height-lg) * 1.4);}
  .apollo-picker-dropdown .apollo-picker-decade-panel .apollo-picker-cell-inner{padding:0 calc(var(--apollo-padding-xs) / 2);}
  .apollo-picker-dropdown .apollo-picker-decade-panel .apollo-picker-cell::before{display:none;}
  .apollo-picker-dropdown .apollo-picker-year-panel .apollo-picker-body,.apollo-picker-dropdown .apollo-picker-quarter-panel .apollo-picker-body,.apollo-picker-dropdown .apollo-picker-month-panel .apollo-picker-body{padding:0 var(--apollo-padding-xs);}
  .apollo-picker-dropdown .apollo-picker-year-panel .apollo-picker-cell-inner,.apollo-picker-dropdown .apollo-picker-quarter-panel .apollo-picker-cell-inner,.apollo-picker-dropdown .apollo-picker-month-panel .apollo-picker-cell-inner{width:calc(var(--apollo-control-height-lg) * 1.5);}
  .apollo-picker-dropdown .apollo-picker-date-panel .apollo-picker-body{padding:var(--apollo-padding-xs) calc(var(--apollo-padding) + var(--apollo-padding-xxs) / 2);}
  .apollo-picker-dropdown .apollo-picker-date-panel .apollo-picker-content th{box-sizing:border-box;padding:0;}
  .apollo-picker-dropdown .apollo-picker-week-panel-row td:before{transition:background-color var(--apollo-motion-duration-mid);}
  .apollo-picker-dropdown .apollo-picker-week-panel-row td:first-child:before{border-start-start-radius:var(--apollo-border-radius-sm);border-end-start-radius:var(--apollo-border-radius-sm);}
  .apollo-picker-dropdown .apollo-picker-week-panel-row td:last-child:before{border-start-end-radius:var(--apollo-border-radius-sm);border-end-end-radius:var(--apollo-border-radius-sm);}
  .apollo-picker-dropdown .apollo-picker-week-panel-row:hover td:before{background:var(--apollo-date-picker-cell-hover-bg);}
  .apollo-picker-dropdown .apollo-picker-week-panel-row-range-start td.apollo-picker-cell:before,.apollo-picker-dropdown .apollo-picker-week-panel-row-range-end td.apollo-picker-cell:before,.apollo-picker-dropdown .apollo-picker-week-panel-row-selected td.apollo-picker-cell:before,.apollo-picker-dropdown .apollo-picker-week-panel-row-hover td.apollo-picker-cell:before{background:var(--apollo-color-primary);}
  .apollo-picker-dropdown .apollo-picker-week-panel-row-range-start td.apollo-picker-cell.apollo-picker-cell-week,.apollo-picker-dropdown .apollo-picker-week-panel-row-range-end td.apollo-picker-cell.apollo-picker-cell-week,.apollo-picker-dropdown .apollo-picker-week-panel-row-selected td.apollo-picker-cell.apollo-picker-cell-week,.apollo-picker-dropdown .apollo-picker-week-panel-row-hover td.apollo-picker-cell.apollo-picker-cell-week{color:#00000080;}
  .apollo-picker-dropdown .apollo-picker-week-panel-row-range-start td.apollo-picker-cell .apollo-picker-cell-inner,.apollo-picker-dropdown .apollo-picker-week-panel-row-range-end td.apollo-picker-cell .apollo-picker-cell-inner,.apollo-picker-dropdown .apollo-picker-week-panel-row-selected td.apollo-picker-cell .apollo-picker-cell-inner,.apollo-picker-dropdown .apollo-picker-week-panel-row-hover td.apollo-picker-cell .apollo-picker-cell-inner{color:var(--apollo-color-text-light-solid);}
  .apollo-picker-dropdown .apollo-picker-week-panel-row-range-hover td:before{background:var(--apollo-control-item-bg-active);}
  .apollo-picker-dropdown .apollo-picker-week-panel .apollo-picker-body,.apollo-picker-dropdown .apollo-picker-date-panel-show-week .apollo-picker-body{padding:var(--apollo-padding-xs) var(--apollo-padding-sm);}
  .apollo-picker-dropdown .apollo-picker-week-panel .apollo-picker-content th,.apollo-picker-dropdown .apollo-picker-date-panel-show-week .apollo-picker-content th{width:auto;}
  .apollo-picker-dropdown .apollo-picker-datetime-panel{display:flex;}
  .apollo-picker-dropdown .apollo-picker-datetime-panel .apollo-picker-time-panel{border-inline-start:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-split);}
  .apollo-picker-dropdown .apollo-picker-datetime-panel .apollo-picker-date-panel,.apollo-picker-dropdown .apollo-picker-datetime-panel .apollo-picker-time-panel{transition:opacity var(--apollo-motion-duration-slow);}
  .apollo-picker-dropdown .apollo-picker-datetime-panel-active .apollo-picker-date-panel,.apollo-picker-dropdown .apollo-picker-datetime-panel-active .apollo-picker-time-panel{opacity:0.3;}
  .apollo-picker-dropdown .apollo-picker-datetime-panel-active .apollo-picker-date-panel-active,.apollo-picker-dropdown .apollo-picker-datetime-panel-active .apollo-picker-time-panel-active{opacity:1;}
  .apollo-picker-dropdown .apollo-picker-time-panel{width:auto;min-width:auto;}
  .apollo-picker-dropdown .apollo-picker-time-panel .apollo-picker-content{display:flex;flex:auto;height:var(--apollo-date-picker-time-column-height);}
  .apollo-picker-dropdown .apollo-picker-time-panel-column{flex:1 0 auto;width:var(--apollo-date-picker-time-column-width);margin:var(--apollo-padding-xxs) 0;padding:0;overflow-y:auto;text-align:start;list-style:none;transition:background-color var(--apollo-motion-duration-mid);overflow-x:hidden;}
  .apollo-picker-dropdown .apollo-picker-time-panel-column::-webkit-scrollbar{width:8px;background-color:transparent;}
  .apollo-picker-dropdown .apollo-picker-time-panel-column::-webkit-scrollbar-thumb{background-color:var(--apollo-color-text-tertiary);border-radius:var(--apollo-border-radius-sm);}
  .apollo-picker-dropdown .apollo-picker-time-panel-column{scrollbar-width:thin;scrollbar-color:var(--apollo-color-text-tertiary) transparent;}
  .apollo-picker-dropdown .apollo-picker-time-panel-column::after{display:block;height:calc(100% - var(--apollo-date-picker-time-cell-height));content:"";}
  .apollo-picker-dropdown .apollo-picker-time-panel-column:not(:first-child){border-inline-start:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-split);}
  .apollo-picker-dropdown .apollo-picker-time-panel-column-active{background:#00000033;}
  .apollo-picker-dropdown .apollo-picker-time-panel-column >li{margin:0;padding:0;}
  .apollo-picker-dropdown .apollo-picker-time-panel-column >li.apollo-picker-time-panel-cell{margin-inline:var(--apollo-margin-xxs);}
  .apollo-picker-dropdown .apollo-picker-time-panel-column >li.apollo-picker-time-panel-cell .apollo-picker-time-panel-cell-inner{display:block;width:calc(var(--apollo-date-picker-time-column-width) - var(--apollo-margin-xxs) * 2);height:var(--apollo-date-picker-time-cell-height);margin:0;padding-block:0;padding-inline-end:0;padding-inline-start:calc((var(--apollo-date-picker-time-column-width) - var(--apollo-date-picker-time-cell-height)) / 2);color:var(--apollo-color-text);line-height:var(--apollo-date-picker-time-cell-height);border-radius:var(--apollo-border-radius-sm);cursor:pointer;transition:background-color var(--apollo-motion-duration-mid);}
  .apollo-picker-dropdown .apollo-picker-time-panel-column >li.apollo-picker-time-panel-cell .apollo-picker-time-panel-cell-inner:hover{background:var(--apollo-date-picker-cell-hover-bg);}
  .apollo-picker-dropdown .apollo-picker-time-panel-column >li.apollo-picker-time-panel-cell-selected .apollo-picker-time-panel-cell-inner{background:var(--apollo-control-item-bg-active);}
  .apollo-picker-dropdown .apollo-picker-time-panel-column >li.apollo-picker-time-panel-cell-disabled .apollo-picker-time-panel-cell-inner{color:var(--apollo-color-text-disabled);background:transparent;cursor:not-allowed;}
  .apollo-picker-dropdown.apollo-picker-dropdown-hidden{display:none;}
  .apollo-picker-dropdown-rtl{direction:rtl;}
  .apollo-picker-dropdown.apollo-picker-dropdown-placement-bottomLeft .apollo-picker-range-arrow,.apollo-picker-dropdown.apollo-picker-dropdown-placement-bottomRight .apollo-picker-range-arrow{top:0;display:block;transform:translateY(-100%);}
  .apollo-picker-dropdown.apollo-picker-dropdown-placement-topLeft .apollo-picker-range-arrow,.apollo-picker-dropdown.apollo-picker-dropdown-placement-topRight .apollo-picker-range-arrow{bottom:0;display:block;transform:translateY(100%) rotate(180deg);}
  .apollo-picker-dropdown.apollo-slide-up-appear .apollo-picker-range-arrow.apollo-picker-range-arrow,.apollo-picker-dropdown.apollo-slide-up-enter .apollo-picker-range-arrow.apollo-picker-range-arrow{transition:none;}
  .apollo-picker-dropdown.apollo-slide-up-enter.apollo-slide-up-enter-active.apollo-picker-dropdown-placement-topLeft,.apollo-picker-dropdown.apollo-slide-up-enter.apollo-slide-up-enter-active.apollo-picker-dropdown-placement-topRight,.apollo-picker-dropdown.apollo-slide-up-appear.apollo-slide-up-appear-active.apollo-picker-dropdown-placement-topLeft,.apollo-picker-dropdown.apollo-slide-up-appear.apollo-slide-up-appear-active.apollo-picker-dropdown-placement-topRight{animation-name:css-dev-only-do-not-override-19u5a7b-antSlideDownIn;}
  .apollo-picker-dropdown.apollo-slide-up-enter.apollo-slide-up-enter-active.apollo-picker-dropdown-placement-bottomLeft,.apollo-picker-dropdown.apollo-slide-up-enter.apollo-slide-up-enter-active.apollo-picker-dropdown-placement-bottomRight,.apollo-picker-dropdown.apollo-slide-up-appear.apollo-slide-up-appear-active.apollo-picker-dropdown-placement-bottomLeft,.apollo-picker-dropdown.apollo-slide-up-appear.apollo-slide-up-appear-active.apollo-picker-dropdown-placement-bottomRight{animation-name:css-dev-only-do-not-override-19u5a7b-antSlideUpIn;}
  .apollo-picker-dropdown.apollo-slide-up-leave .apollo-picker-panel-container{pointer-events:none;}
  .apollo-picker-dropdown.apollo-slide-up-leave.apollo-slide-up-leave-active.apollo-picker-dropdown-placement-topLeft,.apollo-picker-dropdown.apollo-slide-up-leave.apollo-slide-up-leave-active.apollo-picker-dropdown-placement-topRight{animation-name:css-dev-only-do-not-override-19u5a7b-antSlideDownOut;}
  .apollo-picker-dropdown.apollo-slide-up-leave.apollo-slide-up-leave-active.apollo-picker-dropdown-placement-bottomLeft,.apollo-picker-dropdown.apollo-slide-up-leave.apollo-slide-up-leave-active.apollo-picker-dropdown-placement-bottomRight{animation-name:css-dev-only-do-not-override-19u5a7b-antSlideUpOut;}
  .apollo-picker-dropdown .apollo-picker-panel>.apollo-picker-time-panel{padding-top:var(--apollo-padding-xxs);}
  .apollo-picker-dropdown .apollo-picker-range-wrapper{display:flex;position:relative;}
  .apollo-picker-dropdown .apollo-picker-range-arrow{position:absolute;z-index:1;display:none;padding-inline:calc(var(--apollo-date-picker-padding-inline) * 1.5);box-sizing:content-box;transition:all var(--apollo-motion-duration-slow) ease-out;pointer-events:none;width:var(--apollo-size-popup-arrow);height:var(--apollo-size-popup-arrow);overflow:hidden;}
  .apollo-picker-dropdown .apollo-picker-range-arrow::before{position:absolute;bottom:0;inset-inline-start:0;width:var(--apollo-size-popup-arrow);height:calc(var(--apollo-size-popup-arrow) / 2);background:var(--apollo-color-bg-elevated);clip-path:var(--apollo-date-picker-arrow-polygon);clip-path:var(--apollo-date-picker-arrow-path);content:"";}
  .apollo-picker-dropdown .apollo-picker-range-arrow::after{content:"";position:absolute;width:var(--apollo-date-picker-arrow-shadow-width);height:var(--apollo-date-picker-arrow-shadow-width);bottom:0;inset-inline:0;margin:auto;border-radius:0 0 var(--apollo-border-radius-xs) 0;transform:translateY(50%) rotate(-135deg);z-index:0;background:transparent;box-shadow:var(--apollo-box-shadow-popover-arrow);}
  .apollo-picker-dropdown .apollo-picker-range-arrow:before{inset-inline-start:calc(var(--apollo-date-picker-padding-inline) * 1.5);}
  .apollo-picker-dropdown .apollo-picker-panel-container{overflow:hidden;vertical-align:top;background:var(--apollo-color-bg-elevated);border-radius:var(--apollo-border-radius-lg);box-shadow:var(--apollo-box-shadow-secondary);transition:margin var(--apollo-motion-duration-slow);display:inline-block;pointer-events:auto;}
  .apollo-picker-dropdown .apollo-picker-panel-container .apollo-picker-panel-layout{display:flex;flex-wrap:nowrap;align-items:stretch;}
  .apollo-picker-dropdown .apollo-picker-panel-container .apollo-picker-presets{display:flex;flex-direction:column;min-width:var(--apollo-date-picker-presets-width);max-width:var(--apollo-date-picker-presets-max-width);}
  .apollo-picker-dropdown .apollo-picker-panel-container .apollo-picker-presets ul{height:0;flex:auto;list-style:none;overflow:auto;margin:0;padding:var(--apollo-padding-xs);border-inline-end:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-split);}
  .apollo-picker-dropdown .apollo-picker-panel-container .apollo-picker-presets ul li{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;border-radius:var(--apollo-border-radius-sm);padding-inline:var(--apollo-padding-xs);padding-block:calc((var(--apollo-control-height-sm) - var(--apollo-font-height)) / 2);cursor:pointer;transition:all var(--apollo-motion-duration-slow);}
  .apollo-picker-dropdown .apollo-picker-panel-container .apollo-picker-presets ul li +li{margin-top:var(--apollo-margin-xs);}
  .apollo-picker-dropdown .apollo-picker-panel-container .apollo-picker-presets ul li:hover{background:var(--apollo-date-picker-cell-hover-bg);}
  .apollo-picker-dropdown .apollo-picker-panel-container .apollo-picker-panels{display:inline-flex;flex-wrap:nowrap;}
  .apollo-picker-dropdown .apollo-picker-panel-container .apollo-picker-panels:last-child .apollo-picker-panel{border-width:0;}
  .apollo-picker-dropdown .apollo-picker-panel-container .apollo-picker-panel{vertical-align:top;background:transparent;border-radius:0;border-width:0;}
  .apollo-picker-dropdown .apollo-picker-panel-container .apollo-picker-panel .apollo-picker-content,.apollo-picker-dropdown .apollo-picker-panel-container .apollo-picker-panel table{text-align:center;}
  .apollo-picker-dropdown .apollo-picker-panel-container .apollo-picker-panel-focused{border-color:var(--apollo-color-border);}
  .apollo-picker-dropdown-range{padding:calc(var(--apollo-size-popup-arrow) * 2 / 3) 0;}
  .apollo-picker-dropdown-range-hidden{display:none;}
  .apollo-picker-rtl{direction:rtl;}
  .apollo-picker-rtl .apollo-picker-separator{transform:scale(-1, 1);}
  .apollo-picker-rtl .apollo-picker-footer-extra{direction:rtl;}
  .apollo-picker-outlined{background:var(--apollo-color-bg-container);border-width:var(--apollo-line-width);border-style:var(--apollo-line-type);border-color:var(--apollo-color-border);}
  .apollo-picker-outlined:hover{border-color:var(--apollo-date-picker-hover-border-color);background-color:var(--apollo-date-picker-hover-bg);}
  .apollo-picker-outlined:focus,.apollo-picker-outlined:focus-within{border-color:var(--apollo-date-picker-active-border-color);box-shadow:var(--apollo-date-picker-active-shadow);outline:0;background-color:var(--apollo-date-picker-active-bg);}
  .apollo-picker-outlined.apollo-picker-disabled,.apollo-picker-outlined[disabled]{color:var(--apollo-color-text-disabled);background-color:var(--apollo-color-bg-container-disabled);border-color:var(--apollo-color-border-disabled);box-shadow:none;cursor:not-allowed;opacity:1;}
  .apollo-picker-outlined.apollo-picker-disabled input[disabled],.apollo-picker-outlined[disabled] input[disabled],.apollo-picker-outlined.apollo-picker-disabled textarea[disabled],.apollo-picker-outlined[disabled] textarea[disabled]{cursor:not-allowed;}
  .apollo-picker-outlined.apollo-picker-disabled:hover:not([disabled]),.apollo-picker-outlined[disabled]:hover:not([disabled]){border-color:var(--apollo-color-border-disabled);background-color:var(--apollo-color-bg-container-disabled);}
  .apollo-picker-outlined.apollo-picker-status-error:not(.apollo-picker-disabled){background:var(--apollo-color-bg-container);border-width:var(--apollo-line-width);border-style:var(--apollo-line-type);border-color:var(--apollo-color-error);}
  .apollo-picker-outlined.apollo-picker-status-error:not(.apollo-picker-disabled):hover{border-color:var(--apollo-color-error-border-hover);background-color:var(--apollo-date-picker-hover-bg);}
  .apollo-picker-outlined.apollo-picker-status-error:not(.apollo-picker-disabled):focus,.apollo-picker-outlined.apollo-picker-status-error:not(.apollo-picker-disabled):focus-within{border-color:var(--apollo-color-error);box-shadow:var(--apollo-date-picker-error-active-shadow);outline:0;background-color:var(--apollo-date-picker-active-bg);}
  .apollo-picker-outlined.apollo-picker-status-error:not(.apollo-picker-disabled) .apollo-picker-prefix,.apollo-picker-outlined.apollo-picker-status-error:not(.apollo-picker-disabled) .apollo-picker-suffix{color:var(--apollo-color-error-affix);}
  .apollo-picker-outlined.apollo-picker-status-error.apollo-picker-disabled{border-color:var(--apollo-color-error);}
  .apollo-picker-outlined.apollo-picker-status-warning:not(.apollo-picker-disabled){background:var(--apollo-color-bg-container);border-width:var(--apollo-line-width);border-style:var(--apollo-line-type);border-color:var(--apollo-color-warning);}
  .apollo-picker-outlined.apollo-picker-status-warning:not(.apollo-picker-disabled):hover{border-color:var(--apollo-color-warning-border-hover);background-color:var(--apollo-date-picker-hover-bg);}
  .apollo-picker-outlined.apollo-picker-status-warning:not(.apollo-picker-disabled):focus,.apollo-picker-outlined.apollo-picker-status-warning:not(.apollo-picker-disabled):focus-within{border-color:var(--apollo-color-warning);box-shadow:var(--apollo-date-picker-warning-active-shadow);outline:0;background-color:var(--apollo-date-picker-active-bg);}
  .apollo-picker-outlined.apollo-picker-status-warning:not(.apollo-picker-disabled) .apollo-picker-prefix,.apollo-picker-outlined.apollo-picker-status-warning:not(.apollo-picker-disabled) .apollo-picker-suffix{color:var(--apollo-color-warning-affix);}
  .apollo-picker-outlined.apollo-picker-status-warning.apollo-picker-disabled{border-color:var(--apollo-color-warning);}
  .apollo-picker-underlined{background:var(--apollo-color-bg-container);border-width:var(--apollo-line-width) 0;border-style:var(--apollo-line-type) none;border-color:transparent transparent var(--apollo-color-border) transparent;border-radius:0;}
  .apollo-picker-underlined:hover{border-color:transparent transparent var(--apollo-date-picker-hover-border-color) transparent;background-color:var(--apollo-date-picker-hover-bg);}
  .apollo-picker-underlined:focus,.apollo-picker-underlined:focus-within{border-color:transparent transparent var(--apollo-date-picker-active-border-color) transparent;outline:0;background-color:var(--apollo-date-picker-active-bg);}
  .apollo-picker-underlined.apollo-picker-disabled,.apollo-picker-underlined[disabled]{color:var(--apollo-color-text-disabled);box-shadow:none;cursor:not-allowed;}
  .apollo-picker-underlined.apollo-picker-disabled:hover,.apollo-picker-underlined[disabled]:hover{border-color:transparent transparent var(--apollo-color-border) transparent;}
  .apollo-picker-underlined input[disabled],.apollo-picker-underlined textarea[disabled]{cursor:not-allowed;}
  .apollo-picker-underlined.apollo-picker-status-error:not(.apollo-picker-disabled){background:var(--apollo-color-bg-container);border-width:var(--apollo-line-width) 0;border-style:var(--apollo-line-type) none;border-color:transparent transparent var(--apollo-color-error) transparent;border-radius:0;}
  .apollo-picker-underlined.apollo-picker-status-error:not(.apollo-picker-disabled):hover{border-color:transparent transparent var(--apollo-color-error-border-hover) transparent;background-color:var(--apollo-date-picker-hover-bg);}
  .apollo-picker-underlined.apollo-picker-status-error:not(.apollo-picker-disabled):focus,.apollo-picker-underlined.apollo-picker-status-error:not(.apollo-picker-disabled):focus-within{border-color:transparent transparent var(--apollo-color-error) transparent;outline:0;background-color:var(--apollo-date-picker-active-bg);}
  .apollo-picker-underlined.apollo-picker-status-error:not(.apollo-picker-disabled) .apollo-picker-prefix,.apollo-picker-underlined.apollo-picker-status-error:not(.apollo-picker-disabled) .apollo-picker-suffix{color:var(--apollo-color-error-affix);}
  .apollo-picker-underlined.apollo-picker-status-error.apollo-picker-disabled{border-color:transparent transparent var(--apollo-color-error) transparent;}
  .apollo-picker-underlined.apollo-picker-status-warning:not(.apollo-picker-disabled){background:var(--apollo-color-bg-container);border-width:var(--apollo-line-width) 0;border-style:var(--apollo-line-type) none;border-color:transparent transparent var(--apollo-color-warning) transparent;border-radius:0;}
  .apollo-picker-underlined.apollo-picker-status-warning:not(.apollo-picker-disabled):hover{border-color:transparent transparent var(--apollo-color-warning-border-hover) transparent;background-color:var(--apollo-date-picker-hover-bg);}
  .apollo-picker-underlined.apollo-picker-status-warning:not(.apollo-picker-disabled):focus,.apollo-picker-underlined.apollo-picker-status-warning:not(.apollo-picker-disabled):focus-within{border-color:transparent transparent var(--apollo-color-warning) transparent;outline:0;background-color:var(--apollo-date-picker-active-bg);}
  .apollo-picker-underlined.apollo-picker-status-warning:not(.apollo-picker-disabled) .apollo-picker-prefix,.apollo-picker-underlined.apollo-picker-status-warning:not(.apollo-picker-disabled) .apollo-picker-suffix{color:var(--apollo-color-warning-affix);}
  .apollo-picker-underlined.apollo-picker-status-warning.apollo-picker-disabled{border-color:transparent transparent var(--apollo-color-warning) transparent;}
  .apollo-picker-filled{background:var(--apollo-color-fill-tertiary);border-width:var(--apollo-line-width);border-style:var(--apollo-line-type);border-color:transparent;}
  input.apollo-picker-filled,.apollo-picker-filled input,textarea.apollo-picker-filled,.apollo-picker-filled textarea{color:var(--apollo-color-text);}
  .apollo-picker-filled:hover{background:var(--apollo-color-fill-secondary);}
  .apollo-picker-filled:focus,.apollo-picker-filled:focus-within{outline:0;border-color:var(--apollo-date-picker-active-border-color);background-color:var(--apollo-date-picker-active-bg);}
  .apollo-picker-filled.apollo-picker-disabled,.apollo-picker-filled[disabled]{color:var(--apollo-color-text-disabled);background-color:var(--apollo-color-bg-container-disabled);border-color:var(--apollo-color-border-disabled);box-shadow:none;cursor:not-allowed;opacity:1;}
  .apollo-picker-filled.apollo-picker-disabled input[disabled],.apollo-picker-filled[disabled] input[disabled],.apollo-picker-filled.apollo-picker-disabled textarea[disabled],.apollo-picker-filled[disabled] textarea[disabled]{cursor:not-allowed;}
  .apollo-picker-filled.apollo-picker-disabled:hover:not([disabled]),.apollo-picker-filled[disabled]:hover:not([disabled]){border-color:var(--apollo-color-border-disabled);background-color:var(--apollo-color-bg-container-disabled);}
  .apollo-picker-filled.apollo-picker-status-error:not(.apollo-picker-disabled){background:var(--apollo-color-error-bg);border-width:var(--apollo-line-width);border-style:var(--apollo-line-type);border-color:transparent;}
  input.apollo-picker-filled.apollo-picker-status-error:not(.apollo-picker-disabled),.apollo-picker-filled.apollo-picker-status-error:not(.apollo-picker-disabled) input,textarea.apollo-picker-filled.apollo-picker-status-error:not(.apollo-picker-disabled),.apollo-picker-filled.apollo-picker-status-error:not(.apollo-picker-disabled) textarea{color:var(--apollo-color-error-text);}
  .apollo-picker-filled.apollo-picker-status-error:not(.apollo-picker-disabled):hover{background:var(--apollo-color-error-bg-hover);}
  .apollo-picker-filled.apollo-picker-status-error:not(.apollo-picker-disabled):focus,.apollo-picker-filled.apollo-picker-status-error:not(.apollo-picker-disabled):focus-within{outline:0;border-color:var(--apollo-color-error);background-color:var(--apollo-date-picker-active-bg);}
  .apollo-picker-filled.apollo-picker-status-error:not(.apollo-picker-disabled) .apollo-picker-prefix,.apollo-picker-filled.apollo-picker-status-error:not(.apollo-picker-disabled) .apollo-picker-suffix{color:var(--apollo-color-error-affix);}
  .apollo-picker-filled.apollo-picker-status-warning:not(.apollo-picker-disabled){background:var(--apollo-color-warning-bg);border-width:var(--apollo-line-width);border-style:var(--apollo-line-type);border-color:transparent;}
  input.apollo-picker-filled.apollo-picker-status-warning:not(.apollo-picker-disabled),.apollo-picker-filled.apollo-picker-status-warning:not(.apollo-picker-disabled) input,textarea.apollo-picker-filled.apollo-picker-status-warning:not(.apollo-picker-disabled),.apollo-picker-filled.apollo-picker-status-warning:not(.apollo-picker-disabled) textarea{color:var(--apollo-color-warning-text);}
  .apollo-picker-filled.apollo-picker-status-warning:not(.apollo-picker-disabled):hover{background:var(--apollo-color-warning-bg-hover);}
  .apollo-picker-filled.apollo-picker-status-warning:not(.apollo-picker-disabled):focus,.apollo-picker-filled.apollo-picker-status-warning:not(.apollo-picker-disabled):focus-within{outline:0;border-color:var(--apollo-color-warning);background-color:var(--apollo-date-picker-active-bg);}
  .apollo-picker-filled.apollo-picker-status-warning:not(.apollo-picker-disabled) .apollo-picker-prefix,.apollo-picker-filled.apollo-picker-status-warning:not(.apollo-picker-disabled) .apollo-picker-suffix{color:var(--apollo-color-warning-affix);}
  .apollo-picker-borderless{background:transparent;border:none;padding-block:calc(var(--apollo-date-picker-padding-block) + var(--apollo-line-width));}
  .apollo-picker-borderless.apollo-picker-sm,.apollo-picker-borderless.apollo-picker-affix-wrapper-sm{padding-block:calc(var(--apollo-date-picker-padding-block-sm) + var(--apollo-line-width));}
  .apollo-picker-borderless.apollo-picker-lg,.apollo-picker-borderless.apollo-picker-affix-wrapper-lg{padding-block:calc(var(--apollo-date-picker-padding-block-lg) + var(--apollo-line-width));}
  .apollo-picker-borderless:focus,.apollo-picker-borderless:focus-within{outline:none;}
  .apollo-picker-borderless:focus-visible,.apollo-picker-borderless:has(input:focus-visible),.apollo-picker-borderless:has(textarea:focus-visible){outline:var(--apollo-date-picker-line-width-focus) var(--apollo-line-type) var(--apollo-date-picker-active-border-color);outline-offset:calc(var(--apollo-line-width) * -1);transition:outline-offset 0s,outline 0s;}
  .apollo-picker-borderless.apollo-picker-disabled,.apollo-picker-borderless[disabled]{color:var(--apollo-color-text-disabled);cursor:not-allowed;}
  .apollo-picker-borderless.apollo-picker-status-error,.apollo-picker-borderless.apollo-picker-status-error input,.apollo-picker-borderless.apollo-picker-status-error textarea{color:var(--apollo-color-error);}
  .apollo-picker-borderless.apollo-picker-status-error:focus-visible,.apollo-picker-borderless.apollo-picker-status-error:has(input:focus-visible),.apollo-picker-borderless.apollo-picker-status-error:has(textarea:focus-visible){outline:var(--apollo-date-picker-line-width-focus) var(--apollo-line-type) var(--apollo-color-error);outline-offset:calc(var(--apollo-line-width) * -1);transition:outline-offset 0s,outline 0s;}
  .apollo-picker-borderless.apollo-picker-status-error .apollo-picker-prefix,.apollo-picker-borderless.apollo-picker-status-error .apollo-picker-suffix{color:var(--apollo-color-error-affix);}
  .apollo-picker-borderless.apollo-picker-status-warning,.apollo-picker-borderless.apollo-picker-status-warning input,.apollo-picker-borderless.apollo-picker-status-warning textarea{color:var(--apollo-color-warning);}
  .apollo-picker-borderless.apollo-picker-status-warning:focus-visible,.apollo-picker-borderless.apollo-picker-status-warning:has(input:focus-visible),.apollo-picker-borderless.apollo-picker-status-warning:has(textarea:focus-visible){outline:var(--apollo-date-picker-line-width-focus) var(--apollo-line-type) var(--apollo-color-warning);outline-offset:calc(var(--apollo-line-width) * -1);transition:outline-offset 0s,outline 0s;}
  .apollo-picker-borderless.apollo-picker-status-warning .apollo-picker-prefix,.apollo-picker-borderless.apollo-picker-status-warning .apollo-picker-suffix{color:var(--apollo-color-warning-affix);}
  .apollo-picker-outlined.apollo-picker-multiple .apollo-picker-selection-item{background:var(--apollo-date-picker-multiple-item-bg);border:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-date-picker-multiple-item-border-color);}
  .apollo-picker-filled.apollo-picker-multiple .apollo-picker-selection-item{background:var(--apollo-color-bg-container);border:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-color-split);}
  .apollo-picker-borderless.apollo-picker-multiple .apollo-picker-selection-item{background:var(--apollo-date-picker-multiple-item-bg);border:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-date-picker-multiple-item-border-color);}
  .apollo-picker-underlined.apollo-picker-multiple .apollo-picker-selection-item{background:var(--apollo-date-picker-multiple-item-bg);border:var(--apollo-line-width) var(--apollo-line-type) var(--apollo-date-picker-multiple-item-border-color);}
  .apollo-picker:not(.apollo-picker-disabled):not([disabled]).apollo-picker-status-error{--apollo-date-picker-affix-color:var(--apollo-color-error-affix);}
  .apollo-picker:not(.apollo-picker-disabled):not([disabled]).apollo-picker-status-error .apollo-picker-active-bar{background:var(--apollo-color-error);}
  .apollo-picker:not(.apollo-picker-disabled):not([disabled]).apollo-picker-status-warning{--apollo-date-picker-affix-color:var(--apollo-color-warning-affix);}
  .apollo-picker:not(.apollo-picker-disabled):not([disabled]).apollo-picker-status-warning .apollo-picker-active-bar{background:var(--apollo-color-warning);}
  .apollo-picker-multiple.apollo-picker-small{padding-block:max(calc(max(calc(var(--apollo-padding-xxs) - var(--apollo-line-width)),0px) - var(--apollo-date-picker-internal_fixed_item_margin)),0px);padding-inline-start:max(calc(var(--apollo-padding-xxs) - var(--apollo-line-width)),0px);min-height:var(--apollo-control-height-sm);}
  .apollo-picker-multiple.apollo-picker-small .apollo-picker-selection-item{height:var(--apollo-date-picker-multiple-item-height-sm);line-height:calc(var(--apollo-date-picker-multiple-item-height-sm) - var(--apollo-line-width) * 2);}
  .apollo-picker-multiple{padding-block:max(calc(max(calc(var(--apollo-padding-xxs) - var(--apollo-line-width)),0px) - var(--apollo-date-picker-internal_fixed_item_margin)),0px);padding-inline-start:max(calc(var(--apollo-padding-xxs) - var(--apollo-line-width)),0px);min-height:var(--apollo-control-height);}
  .apollo-picker-multiple .apollo-picker-selection-item{height:var(--apollo-date-picker-multiple-item-height);line-height:calc(var(--apollo-date-picker-multiple-item-height) - var(--apollo-line-width) * 2);}
  .apollo-picker-multiple.apollo-picker-large{padding-block:max(calc(max(calc(var(--apollo-padding-xxs) - var(--apollo-line-width)),0px) - var(--apollo-date-picker-internal_fixed_item_margin)),0px);padding-inline-start:max(calc(var(--apollo-padding-xxs) - var(--apollo-line-width)),0px);min-height:var(--apollo-control-height-lg);}
  .apollo-picker-multiple.apollo-picker-large .apollo-picker-selection-item{height:var(--apollo-date-picker-multiple-item-height-lg);line-height:calc(var(--apollo-date-picker-multiple-item-height-lg) - var(--apollo-line-width) * 2);}
  .apollo-picker.apollo-picker-multiple{width:100%;cursor:text;}
  .apollo-picker.apollo-picker-multiple .apollo-picker-selector{flex:auto;padding:0;position:relative;}
  .apollo-picker.apollo-picker-multiple .apollo-picker-selector:after{margin:0;}
  .apollo-picker.apollo-picker-multiple .apollo-picker-selector .apollo-picker-selection-placeholder{position:absolute;top:50%;inset-inline-start:calc(var(--apollo-padding-sm) - 1px);inset-inline-end:0;transform:translateY(-50%);transition:all var(--apollo-motion-duration-slow);flex:1;color:var(--apollo-color-text-placeholder);pointer-events:none;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
  .apollo-picker.apollo-picker-multiple .apollo-picker-selection-overflow{position:relative;display:flex;flex:auto;flex-wrap:wrap;max-width:100%;}
  .apollo-picker.apollo-picker-multiple .apollo-picker-selection-overflow-item{flex:none;align-self:center;max-width:calc(100% - 4px);display:inline-flex;}
  .apollo-picker.apollo-picker-multiple .apollo-picker-selection-overflow .apollo-picker-selection-item{display:flex;align-self:center;flex:none;box-sizing:border-box;max-width:100%;margin-block:var(--apollo-date-picker-internal_fixed_item_margin);border-radius:var(--apollo-border-radius-sm);cursor:default;transition:font-size var(--apollo-motion-duration-slow),line-height var(--apollo-motion-duration-slow),height var(--apollo-motion-duration-slow);margin-inline-end:calc(var(--apollo-date-picker-internal_fixed_item_margin) * 2);padding-inline-start:var(--apollo-padding-xs);padding-inline-end:calc(var(--apollo-padding-xs) / 2);}
  .apollo-picker-disabled.apollo-picker.apollo-picker-multiple .apollo-picker-selection-overflow .apollo-picker-selection-item{color:var(--apollo-date-picker-multiple-item-color-disabled);border-color:var(--apollo-date-picker-multiple-item-border-color-disabled);cursor:not-allowed;}
  .apollo-picker.apollo-picker-multiple .apollo-picker-selection-overflow .apollo-picker-selection-item-content{display:inline-block;margin-inline-end:calc(var(--apollo-padding-xs) / 2);overflow:hidden;white-space:pre;text-overflow:ellipsis;}
  .apollo-picker.apollo-picker-multiple .apollo-picker-selection-overflow .apollo-picker-selection-item-remove{display:inline-flex;align-items:center;color:var(--apollo-color-icon);font-style:normal;line-height:inherit;text-align:center;text-transform:none;vertical-align:-0.125em;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;font-weight:bold;font-size:10px;cursor:pointer;}
  .apollo-picker.apollo-picker-multiple .apollo-picker-selection-overflow .apollo-picker-selection-item-remove >*{line-height:1;}
  .apollo-picker.apollo-picker-multiple .apollo-picker-selection-overflow .apollo-picker-selection-item-remove svg{display:inline-block;vertical-align:inherit;}
  .apollo-picker.apollo-picker-multiple .apollo-picker-selection-overflow .apollo-picker-selection-item-remove >.apollo-icon{vertical-align:-0.2em;}
  .apollo-picker.apollo-picker-multiple .apollo-picker-selection-overflow .apollo-picker-selection-item-remove:hover{color:var(--apollo-color-icon-hover);}
  .apollo-picker.apollo-picker-multiple .apollo-picker-multiple-input{width:0;height:0;border:0;visibility:hidden;position:absolute;z-index:-1;}
  .apollo-picker-compact-item:not(.apollo-picker-compact-last-item){margin-inline-end:calc(var(--apollo-line-width) * -1);}
  .apollo-picker-compact-item:not(.apollo-picker-status-success){z-index:2;}
  .apollo-picker-compact-item:active{z-index:3;}
  .apollo-picker-compact-item:hover,.apollo-picker-compact-item:hover.apollo-picker-focused{z-index:4;}
  .apollo-picker-compact-item.apollo-picker-focused{z-index:3;}
  .apollo-picker-compact-item[disabled]{z-index:0;}
  .apollo-picker-compact-item:not(.apollo-picker-compact-first-item):not(.apollo-picker-compact-last-item){border-radius:0;}
  .apollo-picker-compact-item:not(.apollo-picker-compact-last-item).apollo-picker-compact-first-item,.apollo-picker-compact-item:not(.apollo-picker-compact-last-item).apollo-picker-compact-first-item.apollo-picker-sm,.apollo-picker-compact-item:not(.apollo-picker-compact-last-item).apollo-picker-compact-first-item.apollo-picker-lg{border-start-end-radius:0;border-end-end-radius:0;}
  .apollo-picker-compact-item:not(.apollo-picker-compact-first-item).apollo-picker-compact-last-item,.apollo-picker-compact-item:not(.apollo-picker-compact-first-item).apollo-picker-compact-last-item.apollo-picker-sm,.apollo-picker-compact-item:not(.apollo-picker-compact-first-item).apollo-picker-compact-last-item.apollo-picker-lg{border-start-start-radius:0;border-end-start-radius:0;}
`;

/** 生成完整样式：token 声明块 + 规则体。 */
export function genDatePickerStyle(rootPrefixCls: string): string {
  const decls = genTokenDecls(rootPrefixCls).join('');
  // ⚠️ 根类是 `{rootPrefixCls}-picker`（**不是** `-date-picker`），见文件头第 1 条
  return `.${rootPrefixCls}-picker{${decls}}\n\n${DATE_PICKER_RULES}`;
}
