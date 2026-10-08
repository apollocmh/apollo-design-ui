---
category: 数据录入
title: Cascader 级联选择
titleTemplate: '%s - @apollo-design/ui'
description: 多级联动下拉选择。
---

# Cascader 级联选择

需要从一组**相关联的数据集合**进行选择（省市区、分类层级等）。

## 引入

```ts
import { Cascader } from '@apollo-design/ui';
```

## 代码演示

<code src="./demo/basic.vue"></code>
<code src="./demo/multiple.vue"></code>
<code src="./demo/search.vue"></code>
<code src="./demo/change-on-select.vue"></code>
<code src="./demo/panel.vue"></code>

## API

### CascaderProps

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| options | 可选项数据源 | DefaultOptionType[] | [] |
| value / defaultValue | 选中值（单选一维；多选二维） | SegmentedValue[] 或二维 | - |
| multiple | 多选 | boolean | false |
| changeOnSelect | 选中即返回（可选中任意层级） | boolean | false |
| showCheckedStrategy | 多选回填策略 | SHOW_PARENT \| SHOW_CHILD | SHOW_PARENT |
| showSearch | 搜索（对象可配 filter/render/sort/limit） | boolean \| object | false |
| loadData | 动态加载（非叶子触发） | (options) => void | - |
| expandTrigger | 次级展开方式 | 'click' \| 'hover' | 'click' |
| displayRender | 展示渲染（默认 ` / ` 连接） | (labels, options) => VNodeChild | - |
| fieldNames | 字段映射（label/value/children；key 与 value 同字段） | object | - |
| size / disabled / status | 与 select 同物 | - | - |
| placement / direction / popupClassName / popupStyle / popupRender | 浮层（select 同物） | - | - |
| notFoundContent | 空态内容 | VNodeChild | 'Not Found' |
| classNames / styles | 语义化（root/prefix/suffix/input/placeholder/content/item/itemContent/itemRemove/popup） | 对象或函数 | - |

### 事件

| 事件名 | 说明 | 回调参数 |
| --- | --- | --- |
| update:value | 值变化 | 单选 `string[]`；多选 `string[][]` |
| update:open | 浮层开合 | (open: boolean) => void |
| update:searchValue | 搜索词变化 | (text: string) => void |
| onChange | 值变化（含 options 路径） | (value, selectedOptions) |
| onSearch / onOpenChange / onFocus / onBlur / onClear | 同 select | - |

### Ref

`focus` / `blur` / `nativeElement`。

### 静态属性

`Cascader.Panel`（= `Cascader._InternalPanelDoNotUseOrYouWillBeFired`）纯面板；`Cascader.SHOW_PARENT` / `Cascader.SHOW_CHILD`。

### 主题变量

8 个：controlWidth(184) / controlItemWidth(111) / dropdownHeight(180) / optionSelectedBg / optionSelectedFontWeight / optionPadding(5px 12px) / menuPadding / optionSelectedColor
