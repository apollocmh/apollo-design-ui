---
category: 数据录入
title: AutoComplete
subtitle: 自动完成
---

输入框自动完成功能。

## 何时使用

- 需要一个输入框，根据输入内容给出候选建议（本地或远程）。
- 自定义候选过滤与渲染逻辑。

## 代码演示

见 [`demo/`](./demo)（10 个，与 antd 用户可见 demo 一一对应；`custom`（自定义输入元素）
v1 未实现，见 README §5）。

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
