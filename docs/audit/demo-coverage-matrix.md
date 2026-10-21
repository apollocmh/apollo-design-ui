# Demo 覆盖矩阵（阶段 0 · AUDIT-02）

> 基线：`master` @ `7eeab16182f91b76bf0eb3e8ad09aa8688c33f7d`
> 本地统计：`packages/ui/src/<component>/demo/*.vue`（只计 `.vue`，不含 `.md`）
> 上游统计：antd 6.6.4 仓库 `components/<component>/demo/*.tsx`（排除 `_` 开头的调试文件）
> 原始数据：`docs/audit/evidence/demo-coverage.json`（含每个组件的完整上游/本地 demo 名）
> 说明：**数量只用于定位缺口，不代表示例可交互或覆盖了 API**。阶段 2 必须逐条核 API 与真实交互。

## 0. 结论先行（2026-10-21 用户校正）

**缺口是系统性的，不是 Form / DatePicker / Upload 三个组件的问题。** 用户明确指出
“几乎跟 antd 比都缺”；本矩阵按两个口径分别量化：

- **按 demo 文件数**：71 个可对照组件中 **47 个少于 antd 6.6.4**；本地合计 **754**，
  上游合计 **1060**（本地/上游 = **71.1%**）。
- **按 demo 场景名**（小写、去 `-`/`_` 后同名）：全站 **712 / 1060 = 67.2%**；
  **14 / 71 个组件重合度 < 50%**，**6 / 71 < 25%**。
- **数量持平 ≠ 场景等价**：例如 `tree-select` 15/15 但只有 **6/15（40%）** 同名场景；
  `carousel` 7/7 但只有 **5/7（71%）**；它们的“数量”不能作为覆盖证明。
- 所以阶段 2 **不能只补三个组件**；必须对 72 个组件逐一建立
  “上游场景 → 本仓 API → 可运行 demo → 测试/缺口”矩阵，本文件只是数量级基线。
- 已静态确认的典型质量缺口：`upload/demo/basic.vue` 用裸
  `<button class="demo-upload-btn">` + 内联 `font-family:sans-serif`；
  DatePicker 中文文档仍写“只有 basic”，但 `range-picker.vue` 已存在未引用。
- `demo-audit.test.ts` 的 758 总量断言只证明文件存在/配对，**不能证明示例可交互或覆盖 API**。

### 0.1 场景名重合度最低的 20 个组件

> 口径：本地 demo 名与上游 6.6.4 demo 名做小写、去 `-`/`_` 归一后求交集；
> 同名也可能实现不同，因此这是**下限指标**，不是“已覆盖”的证明。

| 组件 | 同名场景 / 上游 | 场景名重合度 | 本地 / 上游 demo 数 |
|---|---:|---:|---:|
| date-picker | 2 / 32 | 6% | 2 / 32 |
| form | 3 / 44 | 7% | 5 / 44 |
| upload | 2 / 24 | 8% | 3 / 24 |
| splitter | 3 / 14 | 21% | 4 / 14 |
| cascader | 5 / 23 | 22% | 5 / 23 |
| descriptions | 3 / 13 | 23% | 6 / 13 |
| skeleton | 2 / 8 | 25% | 5 / 8 |
| input | 7 / 27 | 26% | 10 / 27 |
| config-provider | 3 / 10 | 30% | 5 / 10 |
| collapse | 4 / 13 | 31% | 4 / 13 |
| table | 19 / 53 | 36% | 24 / 53 |
| tree-select | 6 / 15 | 40% | 15 / 15 |
| button | 9 / 22 | 41% | 12 / 22 |
| typography | 6 / 14 | 43% | 7 / 14 |
| list | 8 / 16 | 50% | 8 / 16 |
| listy | 4 / 8 | 50% | 4 / 8 |
| auto-complete | 9 / 17 | 53% | 10 / 17 |
| input-number | 12 / 22 | 55% | 12 / 22 |
| tabs | 13 / 20 | 65% | 13 / 20 |
| anchor | 8 / 12 | 67% | 8 / 12 |

> 结论：**不能只列“缺口最大的三个”**。上表 20 个组件、以及完整表里其余 51 个组件，
> 都需要在阶段 2 逐场景核验；数量持平的组件也要检查“同名场景是否真的同功能”。

## 1. 全组件覆盖表

| 组件 | 本地 .vue | 上游 6.6.4 | 缺口 | 本地 demo | 上游 demo（节选，完整见 JSON） |
|---|---:|---:|---:|---|---|
| form | 5 | 44 | 39 | basic, customized-form-controls, label, layout, validate-status | advanced-search, basic, col-24-debug, complex-form-control, component-token, control-hooks, custom-feedback-icons, customized-form-controls … |
| date-picker | 2 | 32 | 30 | basic, range-picker | allow-empty, basic, buddhist-era, cell-render, component-token, components, date-range, disabled … |
| table | 24 | 53 | 29 | ajax, basic, bordered, colspan-rowspan, custom-empty, custom-filter-panel, ellipsis, expand, filter, filter-search, fixed-columns, fixed-columns-header, fixed-header, grouping-columns, multiple-sorter, nest, radio-selection, row-selection-and-operation, selection, size, sorter, sticky, summary, virtual-list | ajax, auto-height, basic, bordered, colspan-rowspan, column-defaults, component-token, custom-empty … |
| upload | 3 | 24 | 21 | basic, dragger, picture-card | avatar, basic, component-token, crop-image, customize-progress-bar, debug-disabled, defaultFileList, directory … |
| cascader | 5 | 23 | 18 | basic, change-on-select, multiple, panel, search | basic, change-on-select, component-token, custom-dropdown, custom-render, custom-trigger, default-value, disabled-option … |
| input | 10 | 27 | 17 | allow-clear, basic, otp, password, presuffix, search, show-count, size, textarea, variant-status | addon, advance-count, align, allowClear, autosize-textarea, basic, borderless-debug, compact-style … |
| button | 12 | 22 | 10 | basic, block, color-variant, danger, disabled, ghost, href, icon, loading, semantic, shape, size | basic, block, chinese-chars-loading, chinese-space, color-variant, component-token, custom-disabled-bg, danger … |
| input-number | 12 | 22 | 10 | basic, digit, disabled, formatter, keyboard, out-of-range, presuffix, size, spinner, status, style-class, variant | addon, basic, borderless-height-debug, change-on-wheel, controls, debug-token, digit, disabled … |
| splitter | 4 | 14 | 10 | basic, collapsible, multiple, vertical | collapsible, collapsibleIcon, control, customize, debug, group, lazy, multiple … |
| collapse | 4 | 13 | 9 | accordion, basic, borderless, extra | accordion, basic, borderless, collapsible, component-token, custom, extra, ghost … |
| list | 8 | 16 | 8 | basic, grid, loadmore, pagination, responsive, simple, spin-debug, vertical | basic, component-token, drag-sorting, drag-sorting-handler, grid, grid-drag-sorting, grid-drag-sorting-handler, grid-test … |
| auto-complete | 10 | 17 | 7 | allow-clear, and-select, basic, certain-category, non-case-sensitive, options, status, style-class, uncertain-category, variant | AutoComplete-and-Select, allowClear, basic, certain-category, custom, customize-clear-debug, disabled-custom-debug, disabled-in-form-debug … |
| descriptions | 6 | 13 | 7 | basic, bordered, custom-item, extra, size, vertical | basic, block, border, component-token, jsx, padding, responsive, size … |
| tabs | 13 | 20 | 7 | animated, basic, card, centered, custom-add-trigger, custom-indicator, custom-tab-bar, disabled, editable-card, extra, icon, placement, size | animated, basic, card, card-top, centered, component-token, custom-add-trigger, custom-indicator … |
| typography | 7 | 14 | 7 | basic, copyable, editable, ellipsis, semantic, text, title | basic, componentToken-debug, copyable, editable, ellipsis, ellipsis-controlled, ellipsis-debug, ellipsis-middle … |
| badge | 12 | 17 | 5 | basic, change, colorful, dot, link, no-wrapper, offset, overflow, ribbon, size, status, style-class | basic, change, colorful, colorful-with-count-debug, component-token, dot, link, mix … |
| config-provider | 5 | 10 | 5 | component-config, locale, prefix-cls, size-disabled, theme | direction, focus-outline-debug, holderRender, locale, prefixCls, size, theme, useConfig … |
| menu | 13 | 18 | 5 | component-token, extra-style, horizontal, horizontal-dark, inline, inline-collapsed, sider-current, style-class, submenu-theme, switch-mode, theme, tooltip, vertical | collapsed-icon-debug, component-token, custom-popup-render, extra-collapsed-debug, extra-style, horizontal, horizontal-dark, inline … |
| anchor | 8 | 12 | 4 | basic, customize-highlight, horizontal, onChange, onClick, replace, target-offset, target-offset-per-link | basic, component-token, customizeHighlight, horizontal, legacy-anchor, onChange, onClick, replace … |
| card | 10 | 14 | 4 | basic, border-less, flexible-content, grid-card, in-column, inner, loading, meta, simple, tabs | basic, border-less, button-alignment-debug, component-token, flexible-content, grid-card, in-column, inner … |
| float-button | 12 | 16 | 4 | badge, basic, content, controlled, group, group-menu, placement, progress-ring, shape, style-class, tooltip, type | back-top, badge, badge-debug, basic, content, controlled, draggable, group … |
| listy | 4 | 8 | 4 | basic, group, scroll-to, virtual | basic, drag-sorting, group, infinite, rich, scroll-to, style-class, virtual |
| pagination | 12 | 16 | 4 | align, all, basic, changer, components, controlled, itemRender, jump, mini, more, simple, total | align, all, basic, changer, component-token, components, controlled, itemRender … |
| checkbox | 8 | 11 | 3 | basic, check-all, controller, custom-line-width, disabled, group, layout, style-class | basic, check-all, controller, custom-line-width, debug-disable-popover, debug-group-width, debug-line, disabled … |
| image | 14 | 17 | 3 | basic, component-token, controlled-preview, cover-placement, fallback, image-render, nested, placeholder, preview-group, preview-group-top-progress, preview-group-visible, preview-img-info, preview-mask, preview-src | basic, component-token, controlled-preview, coverPlacement, fallback, imageRender, mask, nested … |
| skeleton | 5 | 8 | 3 | active, avatar, basic, loading, semantic | active, basic, children, complex, componentToken, element, list, style-class |
| time-picker | 14 | 17 | 3 | addon, basic, change-on-scroll, colored-popup, disabled, hide-column, need-confirm, range-picker, size, status, style-class, suffix, value, variant | 12hours, addon, basic, change-on-scroll, colored-popup, disabled, hide-column, interval-options … |
| transfer | 10 | 13 | 3 | advanced, basic, custom-item, custom-select-all-labels, oneway, pagination, search, status, table-transfer, tree-transfer | actions, advanced, basic, component-token, custom-item, custom-select-all-labels, large-data, oneWay … |
| alert | 13 | 15 | 2 | action, banner, basic, closable, custom-icon, custom-title-alignment, description, error-boundary, filled, icon, loop-banner, smooth-closed, style-class | action, banner, basic, closable, component-token, custom-icon, custom-title-alignment, description … |
| border-beam | 8 | 10 | 2 | basic, count, custom-container, customized-color, duration, hover, line-width, size | basic, component-token, count, custom-container, customized-color, duration, hover, line-width … |
| breadcrumb | 7 | 9 | 2 | basic, debug-routes, overlay, separator, separator-component, with-icon, with-params | basic, component-token, debug-routes, overlay, separator, separator-component, style-class, withIcon … |
| calendar | 8 | 10 | 2 | basic, card, customize-header, event-range, notice-calendar, select, style-class, week | basic, card, component-token, customize-header, event-range, lunar, notice-calendar, select … |
| dropdown | 19 | 21 | 2 | arrow, arrow-center, basic, context-menu, custom-dropdown, dropdown-button, event, extra, item, loading, menu-full, overlay-open, placement, render-panel, selectable, selection, style-class, sub-menu, trigger | arrow, arrow-center, basic, context-menu, custom-dropdown, dropdown-button, event, extra … |
| radio | 14 | 16 | 2 | badge, basic, component-token, disabled, radiobutton, radiobutton-solid, radiogroup, radiogroup-block, radiogroup-more, radiogroup-options, radiogroup-with-name, size, style-class, wireframe | badge, basic, component-token, debug-group-width, debug-upload, disabled, radiobutton, radiobutton-solid … |
| segmented | 14 | 16 | 2 | basic, block, component-token, controlled, custom, disabled, dynamic, icon-only, shape, size, style-class, vertical, with-icon, with-name | basic, block, componentToken, controlled, controlled-two, custom, disabled, dynamic … |
| slider | 13 | 15 | 2 | basic, disabled-handle, draggable-track, editable, event, icon-slider, input-number, mark, multiple, reverse, show-tooltip, tip-formatter, vertical | basic, component-token, disabled-handle, draggableTrack, editable, event, icon-slider, input-number … |
| watermark | 4 | 6 | 2 | basic, custom, image, multi-line | basic, custom, debug, image, multi-line, portal |
| avatar | 9 | 10 | 1 | badge, basic, dynamic, fallback, group, max-count, responsive, toggle-debug, type | badge, basic, component-token, dynamic, fallback, group, max-count, responsive … |
| layout | 11 | 12 | 1 | basic, collapsible-overlay, component-token, custom-trigger, fixed, fixed-sider, responsive, side, top, top-side, top-side-2 | basic, collapsible-overlay, component-token, custom-trigger, custom-trigger-debug, fixed, fixed-sider, responsive … |
| popconfirm | 10 | 11 | 1 | async, basic, dynamic-trigger, icon, locale, placement, promise, render-panel, shift, style-class | async, basic, dynamic-trigger, icon, locale, placement, promise, render-panel … |
| result | 9 | 10 | 1 | 403, 404, 500, custom-icon, error, info, style-class, success, warning | 403, 404, 500, component-token, customIcon, error, info, style-class … |
| spin | 9 | 10 | 1 | basic, custom-indicator, delay-and-debounce, description, fullscreen, nested, percent, size, style-class | basic, custom-indicator, delayAndDebounce, fullscreen, list-debug, nested, percent, size … |
| statistic | 6 | 7 | 1 | animated, basic, card, style-class, timer, unit | animated, basic, card, component-token, style-class, timer, unit |
| tag | 11 | 12 | 1 | animation, basic, checkable, colorful, control, customize, disabled, draggable, icon, status, style-class | animation, basic, checkable, colorful, component-token, control, customize, disabled … |
| timeline | 13 | 14 | 1 | alternate, basic, custom, end, horizontal, horizontal-debug, pending, pending-legacy, semantic, style-class, title, title-span, variant | alternate, basic, component-token, custom, end, horizontal, horizontal-debug, pending … |
| tooltip | 14 | 15 | 1 | arrow, auto-adjust-overflow, basic, colorful, debug, destroy-on-close, disabled, disabled-children, placement, render-panel, shift, smooth-transition, style-class, wrap-custom-component | arrow, arrow-point-at-center, auto-adjust-overflow, basic, colorful, debug, destroy-on-close, disabled … |
| tree | 18 | 19 | 1 | basic, basic-controlled, big-data, component-token, customized-icon, directory, directory-debug, drag-debug, draggable, dynamic, line, line-debug, multiple-line, scroll-to, search, style-class, switcher-icon, virtual-scroll | basic, basic-controlled, big-data, block-node, component-token, customized-icon, directory, directory-debug … |
| app | 2 | 2 | 0 | basic, config | basic, config |
| back-top | 1 | 1 | 0 | basic | basic |
| carousel | 7 | 7 | 0 | arrows, autoplay, basic, component-token, drag, fade, position | arrows, autoplay, basic, component-token, dot-duration, fade, placement |
| color-picker | 16 | 16 | 0 | allowClear, base, controlled, disabled, disabled-alpha, format, line-gradient, panel-render, presets, presets-line-gradient, pure-panel, size, style-class, text-render, trigger, trigger-event | allowClear, base, controlled, disabled, disabled-alpha, format, line-gradient, panel-render … |
| divider | 9 | 9 | 0 | component-token, customize-style, horizontal, plain, size, style-class, variant, vertical, with-text | component-token, customize-style, horizontal, plain, size, style-class, variant, vertical … |
| drawer | 18 | 18 | 0 | basic-right, closable-placement, component-token, config-provider, extra, form-in-drawer, loading, mask, multi-level-drawer, no-mask, placement, render-in-current, render-panel, resizable, scroll-debug, size, style-class, user-profile | basic-right, closable-placement, component-token, config-provider, extra, form-in-drawer, loading, mask … |
| empty | 6 | 6 | 0 | basic, config-provider, customize, description, simple, style-class | basic, config-provider, customize, description, simple, style-class |
| flex | 6 | 6 | 0 | align, basic, combination, debug, gap, wrap | align, basic, combination, debug, gap, wrap |
| grid | 13 | 13 | 0 | basic, flex, flex-align, flex-order, flex-stretch, gutter, offset, playground, responsive, responsive-flex, responsive-more, sort, useBreakpoint | basic, flex, flex-align, flex-order, flex-stretch, gutter, offset, playground … |
| masonry | 6 | 6 | 0 | basic, dynamic, fresh, image, responsive, style-class | basic, dynamic, fresh, image, responsive, style-class |
| mentions | 16 | 16 | 0 | allowClear, async, autoSize, autosize-textarea-debug, basic, component-token, form, placement, popupRender, prefix, readonly, render-panel, size, status, style-class, variant | allowClear, async, autoSize, autosize-textarea-debug, basic, component-token, form, placement … |
| message | 11 | 11 | 0 | component-token, duration, hooks, info, loading, other, render-panel, stack, style-class, thenable, update | component-token, duration, hooks, info, loading, other, render-panel, stack … |
| modal | 23 | 23 | 0 | async, basic, button-props, component-token, confirm, confirm-router, custom-mouse-position, dark, footer, footer-render, hooks, loading, locale, manual, mask, modal-render, nested, position, render-panel, static-info, style-class, width, wireframe | async, basic, button-props, component-token, confirm, confirm-router, custom-mouse-position, dark … |
| notification | 14 | 14 | 0 | basic, component-token, custom-icon, duration, hooks, placement, progress-color, render-panel, show-with-progress, stack, style-class, update, with-btn, with-icon | basic, component-token, custom-icon, duration, hooks, placement, progress-color, render-panel … |
| popover | 12 | 12 | 0 | arrow, arrow-point-at-center, basic, component-token, control, hover-with-click, placement, render-panel, shift, style-class, triggerType, wireframe | arrow, arrow-point-at-center, basic, component-token, control, hover-with-click, placement, render-panel … |
| progress | 17 | 17 | 0 | circle, circle-micro, circle-mini, circle-steps, dashboard, dynamic, format, gradient-line, info-position, line, line-mini, linecap, segment, semantic, size, steps, style-class | circle, circle-micro, circle-mini, circle-steps, component-token, dashboard, dynamic, format … |
| rate | 9 | 9 | 0 | basic, character, character-function, clear, component-token, disabled, half, size, text | basic, character, character-function, clear, component-token, disabled, half, size … |
| select | 35 | 35 | 0 | automatic-tokenization, basic, big-data, clear-suffix-debug, component-token, coordinate, custom-dropdown-menu, custom-label-render, custom-tag-render, custom-tokenization, debug, debug-flip-shift, filled-debug, hide-selected, label-in-value, max-count, multiple, optgroup, option-label-center, option-render, placement, placement-debug, render-panel, responsive, search, search-filter-option, search-multi-field, search-sort, select-users, size, status, style-class, suffix, tags, variant | automatic-tokenization, basic, big-data, clear-suffix-debug, component-token, coordinate, custom-dropdown-menu, custom-label-render … |
| space | 15 | 15 | 0 | align, base, compact, compact-button-vertical, compact-buttons, compact-debug, compact-nested, component-token, debug, gap-in-line, separator, size, style-class, vertical, wrap | align, base, compact, compact-button-vertical, compact-buttons, compact-debug, compact-nested, component-token … |
| steps | 20 | 20 | 0 | clickable, component-token, customized-progress-dot, error, icon, inline, max-count, nav, panel, progress, progress-debug, progress-dot, simple, small, step-next, steps-in-steps, style-class, title-placement, variant-debug, vertical | clickable, component-token, customized-progress-dot, error, icon, inline, inline-variant, max-count … |
| switch | 7 | 7 | 0 | basic, component-token, disabled, loading, size, style-class, text | basic, component-token, disabled, loading, size, style-class, text |
| tour | 9 | 9 | 0 | actions-render, basic, gap, indicator, mask, non-modal, placement, render-panel, style-class | actions-render, basic, gap, indicator, mask, non-modal, placement, render-panel … |
| tree-select | 15 | 15 | 0 | async, basic, check-strictly, disabled, field-names, max-count, multiple, placeholder-slot, show-checked-strategy, simple-mode, size, status, tree-checkable, tree-line, virtual-scroll | async, basic, checkable, component-token, maxCount, maxCountNoEffect, multiple, placement … |
| affix | 5 | 4 | -1 | basic, offset-bottom, on-change, target, update-position | basic, debug, on-change, target |
| qr-code | 4 | n/a | n/a | basic, custom, status, svg | — |

## 2. DatePicker：2 → 32 的落地计划

**当前**：`basic.vue`（date/week/month/quarter/year 五形态）、`range-picker.vue`。
**文档问题**：`index.zh-CN.md:31-33` 仍写「本仓当前只有 basic」，与目录不一致；阶段 2 先修正引用与说明，再补 demo。

### 2.1 能力核验门槛

新增 demo 前必须逐项确认本仓 API 已有对应能力（从 `interface.ts` / 文档 / L1 用例取证），
不允许照搬 React prop 造不存在的 Vue API。下列分组是**计划**，不是已完成：

| 批次 | 上游 demo | 本仓落地条件 | 备注 |
|---|---|---|---|
| D1 基础 | `basic`、`size`、`status`、`variant`、`format`、`placeholder`、`suffix`、`allow-empty` | 已有 prop 直接可做 | `basic` 已有；其余先补 md 配对 |
| D2 禁用/边界 | `disabled`、`disabled-date`、`min-date`/`max-date`（若上游对应）、`date-range` | 核 `disabledDate`、`minDate`、`maxDate` | 范围不可选边界单独一条 |
| D3 时间 | `time`、`needConfirm`、`showTime`、12 小时制/步长 | 核 `showTime`、`needConfirm`、`use12Hours`、`hourStep`/`minuteStep` | 时间面板优先于低频定制 |
| D4 受控/范围 | `preset-ranges`、`start-end`、`select-in-range`、`switchable`、`multiple` | 核 `presets`、RangePicker、`multiple`、`v-model:open` | 受控值/清空/回填要真实可见 |
| D5 定制 | `cell-render`、`extra-footer`、`components`、`render-panel`、`external-panel`、`style-class`、`mask`、`buddhist-era` | 核 `cellRender`、`renderExtraFooter`、`panelRender`、`locale` | 不支持就登记缺口，不做静态占位 |
| D6 调试/Token | `component-token`、`filled-debug`、`multiple-debug`、`suffixIcon-debug` | Token/调试入口按需；调试 demo 不作为公开主推 | 不把调试文件混进正式示例 |

**阶段目标**：先做 D1–D4 约 12–18 个真实可交互示例；每个示例 `.vue` + `.md` 配对，
中英文标题/说明齐全，浏览器可打开、可选择/清空/受控更新。`showTime` 与 RangePicker 优先。

## 3. Upload：3 → 24 的落地计划

### 3.1 先修 basic（P1，阶段 2 第一个动作）

静态证据（`packages/ui/src/upload/demo/basic.vue:25-33`）：

```vue
<div style="font-family: sans-serif">
  <Upload ...>
    <button class="demo-upload-btn" type="button">
      <UploadOutlined /> Click to Upload
    </button>
  </Upload>
</div>
```

- 这不是库内 `Button`；`.demo-upload-btn` 在 Upload 样式里没有定义，属于用裸 HTML 模拟控件。
- 计划：改用 `Button` + `UploadOutlined`（`#icon` 或 icon prop），删除 `font-family:sans-serif`
  临时样式；先确认 Upload 的点击委托/`hasControlInside` 没丢，再改 demo。
- **不能**给 `.demo-upload-btn` 补一条全局 CSS 来掩盖。

### 3.2 功能覆盖计划

| 批次 | 上游场景 | 本仓落地要求 |
|---|---|---|
| U1 基础生命周期 | `basic`、`defaultFileList`、`fileList`、`max-count`、`file-type` | 用 `customRequest` 本地 mock（进度/成功/失败/取消），不依赖外网 mocky |
| U2 选择前校验 | `beforeUpload` false / `LIST_IGNORE` / Promise / transform-file | 真实文件选择后的事件与列表状态可见 |
| U3 拖拽/批量 | `drag`、`directory`、`paste`、`drag-sorting` | 拖拽态、文件夹、粘贴按浏览器许可实现；不支持就登记缺口 |
| U4 照片墙 | `picture-card`、`picture-circle`、`picture-style`、`avatar`、`crop-image` | 缩略图/错误图/预览真实渲染 |
| U5 自定义请求 | `customRequest` 进度/成功/失败/取消、`upload-manually`、`upload-custom-action-icon` | 完整 mock 生命周期 + 手动上传 + 自定义按钮 |
| U6 其他 | `component-token`、`style-class`、`preview-file`、`upload-png-only` | Token/样式类真实生效；外网依赖的示例不照搬 |

**验收**：basic 使用库 Button；无外网请求即可重现成功/失败/取消；上传中进度、列表移除、
预览与事件一致。

## 4. Form：5 → 44 的落地计划

**当前**：`basic`、`customized-form-controls`、`label`、`layout`、`validate-status`。
现有 `basic` 已有必填校验；但动态字段、异步校验、字段联动、`Form.List`、`useWatch`、
`shouldUpdate`、`scrollToFirstError` 等都没有示例。仓库 `form/index.ts` 已导出
`Form.List` / `Form.useWatch` / `useForm`，先逐项核运行时行为再写 demo。

| 批次 | 上游场景 | 本仓落地条件 |
|---|---|---|
| F1 校验基础 | 必填/邮箱/自定义同步+异步校验、`validateTrigger`、`initialValues`、`resetFields`、`finishFailed`、错误展示 | 确认 `FormItem.rules`、`validateTrigger`、`resetFields` 已接通 |
| F2 布局/状态 | `layout`、`layout-multiple`、`label`、`size`、`variant`、`disabled`、`required-mark`、`warning-only` | 与现有 layout/label demo 合并，避免重复 |
| F3 字段联动 | `form-dependencies`、`useWatch`、`shouldUpdate`、`dynamic-rule`、`getValueProps-normalize` | 先用最小可交互表单证明值/校验联动 |
| F4 动态字段 | `dynamic-form-item(s)`、`dynamic-form-items-complex`、`dynamic-form-items-drag-sorting`、`dynamic-form-items-no-style`、`form-item-path` | `Form.List` 增删/移动/嵌套 namePath；拖拽若未支持则登记缺口 |
| F5 表单方法 | `control-hooks`、`validate-only`、`validate-other`、`validate-scroll-to-field`、`ref-item`、`without-form-create` | `validateFields`/`setFieldsValue`/`getFieldsValue`/`scrollToFirstError` 真实调用 |
| F6 跨组件/上下文 | `complex-form-control`、`customized-form-controls`、`form-context`、`form-in-modal`、`inline-login`、`login`、`advanced-search` | 只用本仓真实组件组合，不伪造 Form 能力 |

**验收**：至少 12–16 个有效示例；动态表单、异步校验失败、字段联动三类必须有浏览器交互证据；
不允许 15 张空白卡片充当完成。

## 5. 阶段 2：全组件推进方式（不是只补三个组件）

**总判断**：47/71 有文件数缺口，14/71 场景名重合度 <50%，其余 24 个数量持平的组件也
必须逐场景检查；不能把 Form / DatePicker / Upload 补完就宣布 Demo 完成。

### 5.1 每个组件的统一工作表

阶段 2 为每个组件建立一行（或一张小表）：

| 字段 | 要求 |
|---|---|
| 上游场景 | antd 6.6.4 的具体 demo 名 + 该 demo 实际验证的行为 |
| 本仓 API | 该场景依赖的 props/events/slots 是否真实存在（读 `interface.ts`/测试，不猜） |
| 本仓 demo | `.vue` + `.md` 文件名，是否可复制运行 |
| 交互证据 | 至少一条 Playwright 测试或明确的人工浏览器步骤 |
| i18n | 中英文标题/说明/按钮/占位是否齐全 |
| 缺口 | 不支持的场景、阻塞的依赖、计划批次 |

**禁止**：只加标题/空卡片；用静态 HTML 冒充组件；用外网 mock 才能显示成功；
把 `demo-audit.test.ts` 的总量断言当作功能覆盖证明。

### 5.2 批次

1. **第 1 批（P0 交互）**：Select / DatePicker / Form / Upload / Modal / Tree /
   Popconfirm / Notification / FloatButton —— 与阶段 1 的动效组件重合，先做真实交互。
2. **第 2 批（复杂数据/浮层）**：Dropdown / Tooltip / Popover / Drawer / Cascader /
   TimePicker / TreeSelect / AutoComplete / Table / Tabs / Collapse / Input /
   InputNumber / Splitter / Descriptions / Skeleton / ConfigProvider。
3. **第 3 批（其余）**：按“场景名重合度低 + 用户价值”排序，完整表 72 行全部要有
   状态（已覆盖/待补/不适用/阻塞），不允许空白。
4. **复核**：每批完成后重新跑本矩阵脚本（口径见 §6），对比数量与场景名重合度；
   数量增加但重合度不升 ⇒ 只是堆示例，必须返工。

### 5.3 数量持平的组件也要审

`tree-select`（15/15，6/15 同名）、`carousel`（7/7，5/7）、`button`（12/22，9/22）、
`tabs`（13/20，13/20）等说明“数量接近”不等于“场景等价”；阶段 2 必须先看
上游场景的实际行为，再决定补哪些，不得按数量凑数。

## 6. 统计口径与限制

- 本地 `.vue` 数不含 `.md`；上游 `.tsx` 数排除 `_debug`/`_semantic` 等 `_` 前缀文件。
- 上游 demo 名与本地名并非一一对应；完整名单在 `demo-coverage.json`，阶段 2 建立
  “上游场景 → 本仓 API → 示例 → 测试/缺口”映射表。
- 本阶段没有执行新增/修改 demo，也没有更新 `demo-audit.test.ts` 的 758 总量断言。
