---
title: AutoComplete 自动完成
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

输入框自动完成功能。

## 何时使用

- 需要一个输入框，根据输入内容给出候选建议（本地或远程）。
- 自定义候选过滤与渲染逻辑。

:::

## 代码演示

::: v-pre

**allow-clear**：`allowClear` 与自定义清除图标（`#clearIcon` 插槽）。

:::

<DemoPreview component="auto-complete" demo="allow-clear" />

::: v-pre

**and-select**：AutoComplete 与 Select 组合使用（同一份 options 数据源）。

:::

<DemoPreview component="auto-complete" demo="and-select" />

::: v-pre

**basic**：不自定义过滤条件（`showSearch.onSearch` 驱动候选）+ 受控模式。

:::

<DemoPreview component="auto-complete" demo="basic" />

::: v-pre

**certain-category**：`showSearch.onSearch` 驱动候选更新（完成输入建议）。

:::

<DemoPreview component="auto-complete" demo="certain-category" />

::: v-pre

**non-case-sensitive**：不区分大小写的过滤（`filterOption` 自定义）。

:::

<DemoPreview component="auto-complete" demo="non-case-sensitive" />

::: v-pre

**options**：`options` 数据源（deprecated `ASelectOption` 子组件形态见 `AutoComplete.Option`）。

:::

<DemoPreview component="auto-complete" demo="options" />

::: v-pre

**status**：`status="error"` / `"warning"` 校验状态。

:::

<DemoPreview component="auto-complete" demo="status" />

::: v-pre

**style-class**：语义化 `classNames` / `styles`（对象式与函数式变体）。

:::

<DemoPreview component="auto-complete" demo="style-class" />

::: v-pre

**uncertain-category**：候选数量不确定（输入即搜索）。

:::

<DemoPreview component="auto-complete" demo="uncertain-category" />

::: v-pre

**variant**：`outlined` / `filled` / `borderless` / `underlined` 四种变体。

:::

<DemoPreview component="auto-complete" demo="variant" />

::: v-pre

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| value / defaultValue | 当前值（`v-model:value`）/ 默认值 | `string` | — |
| options | 自动完成的数据源 | `DefaultOptionType[]` | — |
| dataSource | ⚠️ 已废弃（用 `options`）；string / `{value,text}` 自动映射 | `DataSourceItemType[]` | — |
| placeholder | 占位文本 | `string` | — |
| allowClear | 清除按钮 | `boolean \| object` | `false` |
| disabled / size / variant / status | 状态面（与 Select 一致） | — | — |
| popupMatchSelectWidth | 浮层宽度对齐（deprecated `dropdownMatchSelectWidth`） | `boolean \| number` | `true` |
| showSearch | `boolean` 或 `{ onSearch, filterOption, searchIcon }` 配置 | — | `true` |
| filterOption | 过滤判据 | `boolean \| fn` | — |
| defaultActiveFirstOption | 默认高亮第一项 | `boolean` | `true` |
| backfill | 键盘激活项回填输入框 | `boolean` | `false` |
| autoFocus / defaultOpen / open / id / tabIndex 等 | 透传 Select | — | — |
| onChange / onSearch / onSelect / onOpenChange / onFocus / onBlur / onClear 等 | 回调（props 形态） | — | — |

> ⚠️ deprecated：`dropdownClassName` / `popupClassName` → `classNames.popup.root`、
> `dropdownStyle` → `styles.popup.root`、`onDropdownVisibleChange` → `onOpenChange`、
> `dropdownRender` / `popupRender`（fn）→ `#popupRender` 插槽（C8-R2）。

### Slots

| 插槽 | 说明 | 参数 |
|---|---|---|
| #default | `ASelectOption` 子组件形态（deprecated；OPTION_MARK 数据化） | — |
| #popupRender | 自定义浮层内容 | `{ menu }` |
| #notFoundContent / #optionRender / #placeholder / #clearIcon 等 | 透传 Select 同名插槽 | — |
| #suffixIcon | 用户插槽优先；未传时**无箭头**（antd 的 suffixIcon={null}） | 同 Select |

### Expose

`focus()` / `blur()` / `scrollTo()`（中继 Select）。

## 设计说明

- **Select 的薄包装**：`prefixCls` 复用 select（root 类 `{prefix}-select-auto-complete`）；
  内核走 combobox 分支（mode 内部值，公开类型不含）。
- **无独立样式/Token**（token 数 = 0），完全复用 select 的样式与 Component Token。
- **suffixIcon={null}**：无箭头是 AutoComplete 的默认形态（用户 `#suffixIcon` 可恢复）。

:::
