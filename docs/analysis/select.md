# select 分析（G1）

> **事实层级**：本文结论全部来自本机解包产物，未凭记忆。
> - antd 6.6.4 源码：`/tmp/antd-repo/ant-design-master/components/select/`（518 行壳 + style 1317 行）
> - antd 构建产物：`/tmp/antd-src/package/es/select/`（`.d.ts` 是公开类型面的判据）
> - **rc-select 1.10.1**（antd 依赖 `~1.10.1`）：本次新解包到 `/tmp/rc-select-src/package/es/`（**2815 行 / 24 文件**）
> - rc-trigger / rc-virtual-list / rc-overflow 分别已由本仓 `_internal/trigger.ts`、`@apollo-design/virtual-list`、`_internal/overflow.ts` 承接
> - 补记：rc-select 的**行为**在 antd 自测里几乎没断言（antd `__tests__` 只覆盖 DOM/ARIA/废弃项），
>   所以键盘/事件顺序/过滤/多选细节的判据**必须来自 rc-select 源码**，本文 §5–§8 即据此写成。

---

## 0. 结论先行：这不是「薄壳组件」

`next-task` 备注写的是「trigger + virtual-list 的第一个消费者」，但**实际工作量在内核**：

| 层 | 谁实现 | 规模 | 本仓对应 |
|---|---|---|---|
| antd 壳（主题/尺寸/状态/图标/告警） | antd | 518 行 | `Select.vue` |
| **rc-select 内核（值语义 + 交互 + DOM）** | rc | **2815 行** | **本轮要自建 `engine/`**（同 modal 自建 rc-dialog 的路径） |
| 浮层 Trigger | rc-trigger | 已就绪 | `_internal/trigger.ts`（dropdown/tooltip 已验证） |
| 虚拟滚动 | rc-virtual-list | 已就绪 | `@apollo-design/virtual-list` |
| 多选溢出折叠 | rc-overflow | 已就绪（**能力待核**，见 §13 R3） | `_internal/overflow.ts` |

⇒ **本轮 = 自建 rc-select 的 Vue 等价物 + antd 壳**。预估是 modal 之后最大的一个组件（complexity L 属实）。

---

## 1. 结构判定：rc-select 的 5 层

| rc 文件 | 行 | 职责 | 本仓落点 |
|---|---|---|---|
| `Select.js` | 536 | **值语义层**：value↔labeledValue、labelInValue、tags 补 option、过滤/排序/flatten、onSelect/onDeselect/onChange、activeValue + accessibilityIndex | `engine/useSelectValue.ts` 等 |
| `BaseSelect/index.js` | 539 | **交互外壳层**：open 状态机、键盘分发、focus/blur、清除、tokenSeparators、suffix/clear、`aria-live` Polite | `engine/BaseSelect.ts` |
| `SelectInput/` | 235+214+… | **选择器 DOM**：root + prefix/content/suffix/clear + Single/Multiple Content + Input(ARIA + syncWidth) | `engine/Selector/` |
| `OptionList.js` | 392 | **列表层**：virtual-list、activeIndex、键盘（↑↓/Enter/Tab/Esc）、aria、group、notFound | `engine/OptionList.ts` |
| `SelectTrigger.js` | 136 | **浮层**：Trigger + placement + stretch + motion + popupRender | 直接用 `_internal/trigger.ts` |

rc-select 的两级 Context（`SelectContext` / `BaseSelectContext` / `SelectInputContext`）在 Vue 里用
`provide`/`inject`，且**必须注入 `ComputedRef`**（D27/D37 教训：裸对象是快照）。

---

## 2. antd 壳做了什么（12 件事，逐条对应到 Vue）

读 `components/select/index.tsx`：

1. `prefixCls` = `getPrefixCls('select')`；`rootPrefixCls` 用于动效名 `getTransitionName(rootPrefixCls,'slide-up')`
   ⇒ **动效名是 `apollo-slide-up`，不是 `apollo-select-slide-up`**（modal 的 PITFALL 同源：写错静默失效）。
2. `listHeight = 256`（antd 默认，rc 默认是 200）；`listItemHeight = token.controlHeight`（32，rc 默认 20）。
3. `size`：root 加 `-lg` / `-sm`；`variant`：`-outlined` / `-borderless` / `-filled` / `-underlined`。
4. `status`：`getStatusClassNames` → `-status-error/warning/success/validating` + `-has-feedback`；`-in-form-item`。
5. `disabled`：`DisabledContext` + prop。
6. `direction`：`-rtl`；`placement` 默认 `direction==='rtl' ? 'bottomRight' : 'bottomLeft'`。
7. `mode`：`'combobox'` **被吞成 `undefined`**；只有 `SECRET_COMBOBOX_MODE_DO_NOT_USE` 才真走 combobox（AutoComplete 用）。
8. `notFoundContent`：显式传就用；combobox → `null`；否则 `renderEmpty('Select')`。
9. 图标（`useIcons.tsx`）：down / search（open && showSearch）/ loading / close-circle(clear) / check(itemIcon，仅 multiple) / close(removeIcon)。
10. `popupClassName` 合并顺序：`classNames.popup.root` → `popupClassName` → `dropdownClassName` → `-dropdown-rtl` → `rootClassName` → cssVarCls → rootCls → hashId。
11. `zIndex`：`useZIndex('SelectLike')`，可被 `styles.popup.root.zIndex` 覆盖。
12. 告警（dev only）：7 个废弃项 + `showArrow` + `maxCount` 只能用于 multiple/tags。

⚠️ antd **omit** 掉了 `suffixIcon`/`itemIcon` 再透传，且 `maxCount`/`tagRender` **只在 multiple/tags 时下发**。

---

## 3. DOM 契约（取自 antd 真实快照，v6 **没有** `-selector` 包裹层）

单选关闭态（`__snapshots__/index.test.tsx.snap:3-46`）：

```html
<div class="ant-select ant-select-outlined css-var-root ant-select-css-var ant-select-single ant-select-show-arrow">
  <div class="ant-select-content">
    <div class="ant-select-placeholder"></div>          <!-- 无值时也渲染（hidden 而非不渲染） -->
    <input id="test-id" class="ant-select-input" role="combobox" type="text"
           autocomplete="new-password" readonly
           aria-autocomplete="list" aria-expanded="false" aria-haspopup="listbox" value="">
  </div>
  <div class="ant-select-suffix"><span class="anticon anticon-down" role="img" aria-label="down">…</span></div>
</div>
```

根类名集合（`BaseSelect` + antd）：`-{focused,multiple,single,allow-clear,show-arrow,disabled,loading,open,customize-input,show-search}`
+ antd 的 `-{sm,lg,rtl,outlined,borderless,filled,underlined,in-form-item,status-*,has-feedback}`。

有值（单选）时 `-content` 内是 `-content-value`（或裸 label）+ input；`mergedSearchValue` 非空时 `-content-value` 加 `visibility:hidden`。

多选 tag（`MultipleContent.js`，走 Overflow）：
`.ant-select-selection-item[.-disabled]` > `.ant-select-selection-item-content` + `.ant-select-selection-item-remove`（`TransBtn`，`aria-hidden`）。
`maxTagCount` 溢出项用同结构渲染 `maxTagPlaceholder`（默认 `+ N ...`）。

下拉（`__snapshots__/demo-semantic.test.tsx.snap:188-263`）：

```html
<div class="ant-select-dropdown ant-select-dropdown-placement-bottomLeft" style="…left:-1000vw;top:-1000vh">
  <div>                                            <!-- SelectTrigger 的 wrapper（mousedown/blur 挂这） -->
    <div id="{id}_list" role="listbox" style="height:0;width:0;overflow:hidden">   <!-- virtual 时的 a11y 影子 -->
      <div role="option" id="{id}_list_0" aria-label="…" aria-selected="true">…</div>
    </div>
    <div class="ant-select-dropdown-list">
      <div class="ant-select-dropdown-list-holder" style="max-height:256px;overflow-y:auto">
        <div><div class="ant-select-dropdown-list-holder-inner" style="display:flex;flex-direction:column">
          <div class="ant-select-item ant-select-item-option [-active][-selected][-disabled][-grouped]" title="…">
            <div class="ant-select-item-option-content">…</div>
            <span class="ant-select-item-option-state" aria-hidden="true" style="user-select:none" unselectable="on">✓/icon</span>
```

- 空态：`role="listbox"` + `class="{prefix}-item-empty"`（不是 antd v5 的 `-dropdown-empty`）。
- 分组项：`class="ant-select-item ant-select-item-group"`。

---

## 4. ARIA 契约

承载者是**唯一的 `<input>`**（`SelectInput/Input.js`）：

| 属性 | 关闭 | 打开 |
|---|---|---|
| `role` | `combobox` | `combobox` |
| `aria-autocomplete` | `list` | `list` |
| `aria-haspopup` | `listbox` | `listbox` |
| `aria-expanded` | `false` | `true` |
| `aria-controls` | — | `${id}_list` |
| `aria-owns` | — | `${id}_list` |
| `aria-activedescendant` | — | `${id}_list_${accessibilityIndex}` |

- id 规则：`mergedId = useId(id)`；listbox id = `${id}_list`；option id = `${id}_list_${index}`。
- 选项：`role` = `option`（group 是 `presentation`）、`aria-selected`（combobox 模式下是「值等于搜索词」而非「已选中」）、`aria-disabled`、`aria-label`（label 是 string 且非 group 时）。
- 非 virtual 时 `aria-selected`/`role` 也挂在**可见** item 上；virtual 时只挂在影子 listbox（只渲染 active-1/active/active+1 三个）。
- 屏幕阅读器播报：`BaseSelect` 顶部 `<span aria-live="polite">`（`focused && !open` 时），最多 50 个值。
- clear 是 `<button type="button" aria-label="Clear">`（不是 span）。

---

## 5. 键盘契约（rc-select 源码，antd 无断言）

**`BaseSelect.onInternalKeyDown`**（外壳层，先于列表）：

| 键 | 行为 |
|---|---|
| `Enter` / `Space` | 未打开则 `triggerOpen(true)`；`Space` 且不可编辑 或 `Enter` 且非 combobox ⇒ `preventDefault()`（防表单提交/翻页）。⚠️ **Space 打开后不转发给列表**（`!isSpaceKey` 守卫），所以 Space 不能「选中」。 |
| `Backspace` | `multiple && 搜索为空 && clearLock 未锁` ⇒ **删最后一个非 disabled 的 tag**（`type:'remove'`） |
| 其它 | 打开时转发给 `listRef.onKeyDown`（`Enter` 有 `keyLockRef` 防重复触发） |

**`OptionList.onKeyDown`**（列表层）：

| 键 | 行为 |
|---|---|
| `↑` / `↓` | `getEnabledActiveIndex(activeIndex ± 1, offset)`：跳过 group / disabled /（超 maxCount 时跳过未选项），**循环**；`scrollIntoView` |
| `Ctrl+N` / `Ctrl+P`（仅 Mac） | 同 ↓ / ↑ |
| `Enter` / `Tab` | 选中 active 项；单选选完 `toggleOpen(false)`；`overMaxCount` 或 disabled ⇒ 选 `undefined`；打开时 `preventDefault()` |
| `Esc` | `toggleOpen(false)`（**不清值**）；打开时 `stopPropagation()` |

**输入层**（`SelectInput/Input.js`）：
- `Enter` + `mode==='tags'` + 未打开 + 非输入法组合中 ⇒ `onSearchSubmit` ⇒ 提交成一个 tag（空串/纯空白被丢弃）。
- 输入法：`compositionstart/end` 期间不做 token 切分，`compositionend` 补一次 `onSearch`。
- `SelectInput.onInternalInputKeyDown`：打开时 `↑/↓` 调 `preventDefault()`；按「有效开键」（`isValidateOpenKey`，排除 Esc/Shift/Backspace/Tab/方向键/F1–F12/系统键）⇒ `toggleOpen(true)`。

---

## 6. 事件契约（顺序与参数形态）

`triggerChange(values)`（`Select.js:309`）：**仅在值真的变化时 emit**。

| 事件 | 时机 | 参数 |
|---|---|---|
| `onChange` | 选/删/清/搜索提交后 | `(value, option)`：single → 裸值 / `{label,value}`（labelInValue）；multiple → 数组 / 数组 |
| `onSelect` | 新增选中（含 token 批量） | `(value, option)` |
| `onDeselect` | 删除单个（`type !== 'clear'` 时） | `(value, option)` |
| `onSearch` | 输入 / 清空 / 提交 / 失焦 | `(value)` —— `source: 'typing' \| 'effect' \| 'submit' \| 'blur'` 是 rc 内部参数，antd 只暴露 `(value)` |
| `onOpenChange` / `onDropdownVisibleChange` | open 变化（`useOpen` 的 `mergedOpen !== nextOpen`） | `(open)` |
| `onFocus` / `onBlur` | disabled 时不发 | `(event)` |
| `onPopupScroll` | 列表滚动 | rc 透传 |

顺序要点：
1. 选一项：`triggerChange` → `triggerSelect`（先 change 再 select）；随后清搜索（single 总是清；multiple 看 `autoClearSearchValue`，默认 true）。
2. 点清除按钮：`onClear` → 焦点回 input → `onDisplayValuesChange([], {type:'clear'})` → 对每个旧值发 `onDeselect`…（注意：`type==='clear'` 时 **不发** onDeselect，`triggerSelect(item,false,'clear')` 被 `type !== 'clear'` 拦掉）→ 清搜索。
3. 失焦：有搜索词时，tags ⇒ `submit`（把搜索词变成 tag）；multiple ⇒ `blur`（只清搜索，不发 onSearch）。
4. 关闭下拉（非 multiple、非 combobox）⇒ 自动 `onSearch('')`（用 `rawOpen` 判据，避免 `notFoundContent=null` 时把用户输入吃掉）。

---

## 7. 搜索 / 过滤契约

- `showSearch` 可为 `boolean | SearchConfig`（`{searchValue, autoClearSearchValue, onSearch, filterOption, filterSort, optionFilterProp}`）+ antd 额外 `searchIcon`。
  顶层 `searchValue/onSearch/filterOption/filterSort/optionFilterProp/autoClearSearchValue` 全部 **deprecated 但保留**（对象形态优先）。
- `useSearchConfig`：`mode==='combobox' || 'tags'` ⇒ 强制 `true`；`multiple && showSearch===undefined` ⇒ `true`。
- 默认过滤（`useFilterOptions`）：`searchValue` 为空或 `filterOption===false`（combobox 默认）⇒ 不过滤；
  否则把 `搜索词` 与 `目标值` 都 `toUpperCase()` 后做 `includes`（**大小写不敏感**）：
  有 `optionFilterProp` 用之（**antd 默认 `value`** —— 官方 FAQ「搜索不到」条目明说，别想当然按 label）；
  分组项（有 `options` 字段）先匹配 group 自身 label、再过滤子项；叶子项按 `value` 匹配。
- `filterSort`：`(a, b, {searchValue}) => number`，对 group 递归排序。
- `defaultActiveFirstOption` 默认：非 combobox 时 `true`。
- `autoClearSearchValue` 默认 `true`。

---

## 8. 多选 / tags 契约

- `maxCount`：只在 multiple/tags 生效（antd 会告警）；`overMaxCount` 时未选项变 disabled、搜索被拦截（`onInternalSearch` 直接 return）。
- `maxTagCount`：`number | 'responsive'`（走 Overflow，R3 待核）；`maxTagPlaceholder` 默认 `omitted => \`+ ${n} ...\``；`maxTagTextLength` 截断加 `...`。
- `tokenSeparators`：`string[] | (input)=>string[]`；切分成功后**关闭下拉**、搜索清空、`onSearchSplit`。
- tags 模式：把「不在 options 里的值」补成 option（`createTagOption`），且搜索时若无完全匹配项会**临时插入一个以搜索词为值的 option 置顶**（disabled 的同值项除外）。
- `tagRender({label,value,disabled,closable,onClose,isMaxTag,index})`：自定义时整块（含溢出项）都走它，且外层 `<span>` 会 `toggleOpen`。
- 重复值：`Array.from(new Set([...]))` 去重。
- `labelInValue`：`onChange` 给 `{label,value}`；combobox 不支持。

---

## 9. Component Token（26 键：公开 25 + 派生 3）

来源 `components/select/style/token.ts`。registry 记的 `tokenCount: 16` = **ComponentToken 自有键**（不含继承的 `MultipleSelectorToken`）。

**`MultipleSelectorToken`（9，多选专属）**：`multipleItemBg`(`colorFillSecondary`) / `multipleItemBorderColor`(`'transparent'` 字面量) / `multipleItemHeight`(`min(controlHeight-2*paddingXXS, controlHeight-2*lineWidth)`) / `multipleItemHeightSM` / `multipleItemHeightLG` / `multipleSelectorBgDisabled`(`colorBgContainerDisabled`) / `multipleItemColorDisabled`(`colorTextDisabled`) / `multipleItemBorderColorDisabled`(`'transparent'`)。

**`ComponentToken`（16）**：

| token | 默认 |
|---|---|
| `zIndexPopup` | `zIndexPopupBase + 50`（1050） |
| `optionSelectedColor` / `optionSelectedFontWeight` / `optionSelectedBg` / `optionActiveBg` | `colorText` / `fontWeightStrong` / `controlItemBgActive` / `controlItemBgHover` |
| `optionPadding` | `${(controlHeight - fontSize*lineHeight)/2}px ${controlPaddingHorizontal}px`（⚠️ lineHeight=22/14 ⇒ **5px** 12px，不是 5.5px） |
| `optionFontSize` / `optionLineHeight` / `optionHeight` | `fontSize` / `lineHeight` / `controlHeight` |
| `selectorBg` / `clearBg` | `colorBgContainer`（`clearBg` 上游**只声明不引用**，同 modal 的 `--ant-modal-xs-width`） |
| `singleItemHeightLG` | `controlHeightLG` |
| `showArrowPaddingInlineEnd` | `ceil(fontSize * 1.25)` |
| `hoverBorderColor` / `activeBorderColor` / `activeOutlineColor` | `colorPrimaryHover` / `colorPrimary` / `controlOutline` |

**派生（不可覆盖）**：`lineWidthFocus`、`INTERNAL_FIXED_ITEM_MARGIN = floor(paddingXXS/2)`、`selectAffixPadding = paddingXXS`；
`style/index.ts` 里再补 `inputPaddingHorizontalBase = paddingSM - lineWidth`、`multipleSelectItemHeight`、`selectHeight`。

CSS 变量形态（antd 用 `--select-*` 承载）：`--select-background-color`、`--select-multi-item-background`、`--select-multi-item-height`、`--select-border-color`、`--select-input-width`（由 JS 写）。

---

## 10. 关键样式与硬编码字面量（白名单候选）

- `.ant-select`：`inline-flex`、`height: controlHeight`、`paddingInline: paddingSM - lineWidth`、`--select-border-color: #000`（**硬编码**）、`borderRadius`。
- `-sm`：`controlHeightSM` + `paddingXS - lineWidth`；`-lg`：`controlHeightLG` + `fontSizeLG`。
- `.ant-select-clear`：`absolute; top:50%; insetInlineEnd: inputPaddingHorizontalBase; opacity:0`（hover 显）。
- `.ant-select-placeholder`：`colorTextPlaceholder`、`pointer-events:none`、`z-index:1`。
- 多选 tag：`marginBlock: INTERNAL_FIXED_ITEM_MARGIN`、`marginInlineEnd: 2*该值`、`paddingInlineStart: paddingXS`、`paddingInlineEnd: paddingXXS`。
- `.ant-select-dropdown`：`position:absolute; top:-9999; z-index: zIndexPopup; padding: paddingXXS; background: colorBgElevated; border-radius: borderRadiusLG; box-shadow: boxShadowSecondary`（`top:-9999` **硬编码**）。
- `.ant-select-item`：`min-height: optionHeight`、`padding: optionPadding`、`font-size: optionFontSize`、`border-radius: borderRadiusSM`。
- 多选输入宽度：`min-width: 4px`（`FIXED_INPUT_MIN_WIDTH` 硬编码）、`width: calc(var(--select-input-width,0) * 1px)`。
- `.ant-select-content::before` 内容 `"\a0"`（NBSP 占位，**硬编码**）。
- `-remove` 图标：`font-size:10`、`font-weight:bold`、`vertical-align:-0.2em`。
- 列表高度 `max-height` = `listHeight`（256），由运行时注入，**不在样式表**。

---

## 11. Vue 化决策（G2 的输入）

| React | Vue | 依据 |
|---|---|---|
| `value` + `onChange` | `v-model:value` + 语义事件 `onChange` 同发 | COMPATIBILITY §3 + **⚠️ 全仓 `update:*` 缺口（PITFALLS 162）：本组件必须一开始就同时 emit `update:value` 与 `change`** |
| `open` / `onPopupVisibleChange` | `v-model:open` + `onOpenChange` | 同上（radio/switch/upload 已实现） |
| `searchValue` / `onSearch` | `v-model:searchValue`?（antd 里是 deprecated 顶层 + `showSearch.searchValue`） | 建议：**不升 v-model**，保持 `searchValue` prop（受控）+ `onSearch`（同 antd），避免与 `showSearch` 对象形态打架 |
| `optionRender` / `tagRender` / `labelRender` / `popupRender` / `notFoundContent` | 函数 prop **+** 作用域插槽（prop 优先） | 规则 C8；COMPATIBILITY.md §Select 已举例 `#optionRender` / `#notFoundContent` |
| `Option` / `OptGroup` 子组件 | `SelectOption` / `SelectOptGroup`（deprecated 但导出） | antd 同款 |
| 两级 Context | `provide/inject` + **注入 `ComputedRef`** | D27 / D37 |
| `useOpen` 的 `MessageChannel` 延迟关 | Vue 侧用同一宏任务语义（jsdom 里需 `await`） | PITFALLS 179（关闭是异步的，测试必须轮询） |
| `BaseSelectRef{focus,blur,scrollTo,nativeElement}` | `expose` 同名 4 个 | antd 导出名 `RefSelectProps` |

`engine/` 拟划分（G4 落地时微调）：

```
engine/
  interface.ts        FlattenOptionData / DisplayValueType / FieldNames / Mode / SemanticName
  valueUtil.ts        fillFieldNames / flattenOptions / toArray / getSeparatedContent / isValidCount
  keyUtil.ts          isValidateOpenKey
  useOpen.ts          open 状态机（含 macroTask 延迟关 + lock）
  useLock.ts  useCache.ts  useOptions.ts  useFilterOptions.ts  useSearchConfig.ts  useAllowClear.ts
  context.ts          SelectContext / BaseSelectContext / SelectInputContext（ComputedRef）
  Selector/           SelectInput + SingleContent + MultipleContent + Placeholder + SearchInput + Affix + TransBtn
  OptionList.ts       virtual-list + activeIndex + 键盘 + a11y
```

---

## 12. demo 清单（35 个 + `_semantic.tsx`）

`basic` `multiple` `tags` `size` `variant` `status` `option-render` `custom-tag-render`
`custom-label-render` `label-in-value` `optgroup` `search` `search-filter-option` `search-sort`
`search-multi-field` `hide-selected` `maxCount` `automatic-tokenization` `custom-tokenization`
`big-data` `select-users` `coordinate` `custom-dropdown-menu` `option-label-center` `suffix`
`responsive` `placement` `component-token` `style-class` `render-panel`
+ 5 个 debug（`debug` `debug-flip-shift` `placement-debug` `filled-debug` `clear-suffix-debug`）

按仓库约定：依赖**未落地组件**的 demo 用等价原生结构替换并登记。目前看 `select-users`（用 Avatar/List？需核）、`coordinate`、`big-data`（虚拟滚动）可能需处理。

---

## 13. 风险预登记

| # | 风险 | 对策 |
|---|---|---|
| R1 | **open 关闭是宏任务延迟的**，且 `notFoundContent=null && 无匹配` 时 `rawOpen` 与 `mergedOpen` 分叉 | 严格照 `useOpen` 的 `[rawOpen, mergedOpen, toggleOpen, lock]` 四元组实现；测试用轮询而非同步断言 |
| R2 | 动效名是 `rootPrefixCls` 前缀（`apollo-slide-up`） | 与 modal 同判据：写错不报错、也不生效 |
| R3 | `maxTagCount: 'responsive'` 依赖 rc-overflow 的 ResizeObserver 折叠算法；本仓 `_internal/overflow.ts` 能力**待核**（G4 前确认是否支持 `renderRest` + responsive） | 不支持则先实现 `number` 形态，`responsive` 登记为缺口 |
| R4 | virtual-list 的**自绘滚动条**本仓不做（契约 §5）⇒ `showScrollBar` 接受但不生效；`scrollTo()` 无参 no-op | 登记 INTENDED 差异；OptionList 打开时的 `scrollTo(undefined)` 要判空 |
| R5 | combobox 模式：antd 公开面吞掉 `mode='combobox'`，但 AutoComplete 会复用内核 | 内核实现 combobox，`SelectProps['mode']` 只声明 `multiple \| tags`（同 antd） |
| R6 | `Space.Compact` / `Form` 的 status 注入：本仓 `form` 组件状态？ | G4 前用 `ask component form` 确认 |
| R7 | 样式提取：at-rule 块的判据要按**块体**而非选择器（modal 期教训 PITFALLS） | 写 `tests/visual/debug/extract-select.mjs` 时直接带上该修正 |
| R8 | 规模：rc-select 2815 行 + antd 壳 518 + style 1317 | 建议分 3 批提交（内核 / 组件壳 / 收口），同 modal |

## 14. 待验证（G4 前必须补）

1. rc-overflow 的 `responsive` 折叠实现（需要 `npm pack @rc-component/overflow` 读）。
2. antd `render-panel.tsx` 用的 `PurePanel`（`genPurePanel(Select,'popupAlign')`）具体产物。
3. `select-users.tsx` / `coordinate.tsx` 依赖哪些未落地组件。
