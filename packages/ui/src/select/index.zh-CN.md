---
category: 数据录入
title: Select
subtitle: 选择器
---

下拉选择器。

## 何时使用

- 从一组互斥选项中选一个（单选），或一组可叠加的选项中选多个（多选 / 标签）。
- 选项多于 7 个、或需要搜索过滤时，用 Select 代替 Radio。
- 选项总数大（千级以上）时默认走虚拟滚动。

## 代码演示

见 [`demo/`](./demo)（35 个，与 antd 用户可见 demo 一一对应）。

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
| placeholder | 占位内容 | — | — |
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
| optionRender / tagRender / labelRender / popupRender | 自定义渲染（同时提供同名作用域插槽，prop 优先） | `fn` | — |
| notFoundContent | 空列表内容（combobox 默认不渲染） | — | `<Empty>` |
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

`prefix` / `suffixIcon` / `clearIcon` / `removeIcon` / `placeholder` / `notFoundContent` /
`optionRender` / `tagRender` / `labelRender` / `popupRender` / `maxTagPlaceholder` /
`default`（`Select.Option` / `Select.OptGroup` 子组件形态，deprecated 但支持）。

### Methods

| 方法 | 说明 | 参数 | 返回值 |
|---|---|---|---|
| focus | 聚焦 | `(options?: FocusOptions)` | — |
| blur | 失焦 | — | — |
| scrollTo | 滚动到指定项 | `(index \| { index, align, key })` | — |
| nativeElement | 根元素 | — | `HTMLElement` |

## 设计说明

- **rc-select 1.10.1 内核的 Vue 自建**（engine/ 五层）；DOM 无 `-selector` 包裹层（v6）。
- **差异**：D106–D110（COMPATIBILITY §9.2）；缺口见 [`README.md`](./README.md) §5。
- ⚠️ 搜索默认按 `value` 匹配 —— 按 label 搜请传 `showSearch: { optionFilterProp: 'label' }`。
