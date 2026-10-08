---
title: Select 选择器
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

下拉选择器。

## 何时使用

- 从一组互斥选项中选一个（单选），或一组可叠加的选项中选多个（多选 / 标签）。
- 选项多于 7 个、或需要搜索过滤时，用 Select 代替 Radio。
- 选项总数大（千级以上）时默认走虚拟滚动。

:::

## 代码演示

::: v-pre

**automatic-tokenization**：`tokenSeparators`：输入 `,` 自动切分成标签。

:::

<DemoPreview component="select" demo="automatic-tokenization" />

::: v-pre

**basic**：基础单选。

:::

<DemoPreview component="select" demo="basic" />

::: v-pre

**big-data**：10000 条选项，默认开启虚拟滚动。

:::

<DemoPreview component="select" demo="big-data" />

::: v-pre

**clear-suffix-debug**：调试用例：清除按钮与自定义后缀共存。

:::

<DemoPreview component="select" demo="clear-suffix-debug" />

::: v-pre

**component-token**：通过 ConfigProvider 覆盖 Select 的 Component Token。

:::

<DemoPreview component="select" demo="component-token" />

::: v-pre

**coordinate**：两个 Select 联动选择坐标（antd 原例经 hooks 通信，此处以 v-model 等价实现）。

:::

<DemoPreview component="select" demo="coordinate" />

::: v-pre

**custom-dropdown-menu**：`popupRender` 在下拉菜单末尾追加内容。

:::

<DemoPreview component="select" demo="custom-dropdown-menu" />

::: v-pre

**custom-label-render**：`labelRender` 自定义回填内容的渲染。

:::

<DemoPreview component="select" demo="custom-label-render" />

::: v-pre

**custom-tag-render**：`tagRender` 作用域插槽自定义多选标签。

:::

<DemoPreview component="select" demo="custom-tag-render" />

::: v-pre

**custom-tokenization**：`tokenSeparators` 支持函数形态，自定义切分规则。

:::

<DemoPreview component="select" demo="custom-tokenization" />

::: v-pre

**debug-flip-shift**：调试用例：空间不足时翻转。

:::

<DemoPreview component="select" demo="debug-flip-shift" />

::: v-pre

**debug**：调试用例：清除 + 搜索组合。

:::

<DemoPreview component="select" demo="debug" />

::: v-pre

**filled-debug**：调试用例：`filled` 变体。

:::

<DemoPreview component="select" demo="filled-debug" />

::: v-pre

**hide-selected**：过滤掉已选项（antd 原例为自定义 filterOption，此处同样实现）。

:::

<DemoPreview component="select" demo="hide-selected" />

::: v-pre

**label-in-value**：`labelInValue`：`onChange` 收到 `{ label, value }`。

:::

<DemoPreview component="select" demo="label-in-value" />

::: v-pre

**max-count**：`maxCount` 限制最多可选 2 项（仅 multiple / tags）。

:::

<DemoPreview component="select" demo="max-count" />

::: v-pre

**multiple**：多选，`value` 为数组。

:::

<DemoPreview component="select" demo="multiple" />

::: v-pre

**optgroup**：用嵌套 `options` 展示分组（`Select.OptGroup` 子组件形态同样支持）。

:::

<DemoPreview component="select" demo="optgroup" />

::: v-pre

**option-label-center**：选项内容居中展示。

:::

<DemoPreview component="select" demo="option-label-center" />

::: v-pre

**option-render**：`optionRender` 作用域插槽自定义下拉选项内容。

:::

<DemoPreview component="select" demo="option-render" />

::: v-pre

**placement-debug**：调试用例：受控展开。

:::

<DemoPreview component="select" demo="placement-debug" />

::: v-pre

**placement**：四种弹出位置。

:::

<DemoPreview component="select" demo="placement" />

::: v-pre

**render-panel**：`Select._InternalPanelDoNotUseOrYouWillBeFired` 的对应物：静态面板。

:::

<DemoPreview component="select" demo="render-panel" />

::: v-pre

**responsive**：多选溢出折叠为 `+N ...`（antd 原例为 `maxTagCount="responsive"`，本仓以固定值等价展示，见 README）。

:::

<DemoPreview component="select" demo="responsive" />

::: v-pre

**search-filter-option**：自定义过滤函数 `filterOption`。

:::

<DemoPreview component="select" demo="search-filter-option" />

::: v-pre

**search-multi-field**：`optionFilterProp` 传数组时对多个字段做 OR 匹配。

:::

<DemoPreview component="select" demo="search-multi-field" />

::: v-pre

**search-sort**：搜索结果按 `filterSort` 排序。

:::

<DemoPreview component="select" demo="search-sort" />

::: v-pre

**search**：搜索框：`showSearch` + 按 `label` 过滤（注意默认按 `value` 过滤）。

:::

<DemoPreview component="select" demo="search" />

::: v-pre

**select-users**：已选用户列表（antd 原例经 hooks 通信，此处以 v-model 等价实现）。

:::

<DemoPreview component="select" demo="select-users" />

::: v-pre

**size**：三种尺寸：`small` / `middle` / `large`。

:::

<DemoPreview component="select" demo="size" />

::: v-pre

**status**：校验状态：`error` / `warning`。

:::

<DemoPreview component="select" demo="status" />

::: v-pre

**style-class**：语义化 `classNames` / `styles`。

:::

<DemoPreview component="select" demo="style-class" />

::: v-pre

**suffix**：自定义后缀图标。

:::

<DemoPreview component="select" demo="suffix" />

::: v-pre

**tags**：标签模式，输入后回车即可创建新标签。

:::

<DemoPreview component="select" demo="tags" />

::: v-pre

**variant**：四种变体：`outlined` / `filled` / `borderless` / `underlined`。

:::

<DemoPreview component="select" demo="variant" />

::: v-pre

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| value / defaultValue | 受控值（`v-model:value`）/ 非受控初值 | `SelectValue` | — |
| mode | 模式 | `'multiple' \| 'tags'` | 单选 |
| options | 选项数据（支持嵌套分组） | `DefaultOptionType[]` | — |
| labelInValue | `onChange` 输出 `{ label, value }` | `boolean` | `false` |
| showSearch | 可搜索；对象形态配置过滤 | `boolean \| SearchConfig` | `false` |
| filterOption | 自定义过滤（⚠️ 默认按 `value` 匹配，大小写不敏感） | `boolean \| fn` | — |
| optionFilterProp | 过滤字段（传 `string[]` 多字段 OR） | `string \| string[]` | `'value'` |
| filterSort | 过滤结果排序 | `fn` | — |
| allowClear | 清除按钮（`{ clearIcon, label }` 定制） | `boolean \| object` | `false` |
| placeholder | 占位文本（富内容用 `#placeholder` 插槽） | `string` | — |
| size | 尺寸 | `'small' \| 'middle' \| 'large'` | `'middle'` |
| variant | 变体 | `'outlined' \| 'filled' \| 'borderless' \| 'underlined'` | `'outlined'` |
| status | 校验状态 | `'error' \| 'warning' \| 'success' \| 'validating'` | — |
| disabled / loading | 禁用 / 加载中 | `boolean` | `false` |
| maxCount | 最多可选数（仅多选/标签） | `number` | — |
| maxTagCount / maxTagTextLength / maxTagPlaceholder | 多选折叠 | `number` 等 | `+ N ...` |
| tokenSeparators | 自动分词分隔符（数组或函数） | `string[] \| fn` | — |
| listHeight / listItemHeight | 列表最大高 / 估算行高 | `number` | `256 / 32` |
| popupMatchSelectWidth | 浮层宽度跟随触发器 | `boolean \| number` | `true` |
| placement | 弹出位置 | 4 值 | `'bottomLeft'` |
| open / defaultOpen | 受控开合（`v-model:open`） | `boolean` | `false` |
| fieldNames / optionLabelProp | 字段映射 / 回填字段 | — | `label` |
| virtual | 虚拟滚动 | `boolean` | `true` |
| classNames / styles | 语义槽 `root/prefix/suffix/input/placeholder/content/item/itemContent/itemRemove/clear/popup.{root,list,listItem}` | — | — |
| dropdownClassName / dropdownStyle / dropdownRender / dropdownMatchSelectWidth / popupClassName / bordered / showArrow / searchValue 等 | ⚠️ 已废弃 | — | — |

### Events

| 事件 | 说明 | 参数 |
|---|---|---|
| change | 值变化（与 `update:value` 同发） | `(value, option)` |
| select / deselect | 选中 / 取消选中一项 | `(value, option)` |
| search | 搜索词变化 | `(value)` |
| openChange | 开合 | `(open)` |
| focus / blur | 焦点 | `(event)` |
| clear | 点击清除 | — |
| popupScroll | 下拉滚动 | `(event)` |

### Slots

`prefix` / `suffixIcon` / `loadingIcon` / `clearIcon` / `removeIcon` / `placeholder` /
`notFoundContent` / `optionRender="{ option, index }"` / `tagRender` / `labelRender` /
`popupRender="{ menu }"` / `maxTagPlaceholder="{ omittedValues }"` /
`menuItemSelectedIcon="{ value, disabled, isSelected }"` /
`default`（`Select.Option` / `Select.OptGroup` 子组件形态，deprecated 但支持）。

> ⚠️ antd 的 ReactNode props（`suffixIcon` / `notFoundContent` / `optionRender` /
> `maxTagPlaceholder` 等）在本仓**一律是作用域插槽**，不保留同名 prop（规则 C8-R2）。

### Methods

| 方法 | 说明 | 参数 | 返回值 |
|---|---|---|---|
| focus | 聚焦 | `(options?: FocusOptions)` | — |
| blur | 失焦 | — | — |
| scrollTo | 滚动到指定项 | `(index \| { index, align, key })` | — |
| nativeElement | 根元素 | — | `HTMLElement` |

## 设计说明

- **rc-select 1.10.1 内核的 Vue 自建**（engine/ 五层）；DOM 无 `-selector` 包裹层（v6）。
- **差异**：D106–D110（COMPATIBILITY §9.2）；ReactNode props → slot 全量迁移（C8-R2）；缺口见 [`README.md`](./README.md) §5。
- ⚠️ 搜索默认按 `value` 匹配 —— 按 label 搜请传 `showSearch: { optionFilterProp: 'label' }`。

:::
