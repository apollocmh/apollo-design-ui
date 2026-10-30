---
category: 数据录入
title: Cascader
subtitle: 级联选择
titleTemplate: '%s - @apollo-design/ui'
description: 多级联动下拉选择。
---

# Cascader 级联选择

从具有层级关系的数据中选择完整路径，支持多选、搜索和异步加载。浮层选择器与 `CascaderPanel` 共用值、字段映射和勾选规则。

```ts
import { Cascader, CascaderPanel } from '@apollo-design/ui';
import type { CascaderOutputValue } from '@apollo-design/ui';
```

<code src="./demo/basic.vue"></code>
<code src="./demo/multiple.vue"></code>
<code src="./demo/search.vue"></code>
<code src="./demo/change-on-select.vue"></code>
<code src="./demo/panel.vue"></code>
<code src="./demo/custom-render.vue"></code>
<code src="./demo/render-panel.vue"></code>

## Props

`ValueCell = (string | number)[]`。单选输出 `ValueCell`，多选输出 `ValueCell[]`；清除时均输出 `[]`，`change` 的 options 同步输出 `[]`。数字 `0`、字符串 `'0'` 和包含分隔符的字符串是不同的合法值。找不到的受控路径仍展示原值，后续补上 options 即使用当前标签。

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| options | 数据源；每层 value 在同级中唯一 | BaseOptionType[] | [] |
| value / defaultValue | 当前值 / 非受控初始值；标量按单段路径处理 | CascaderValue | - |
| multiple / checkable | 多选；仅 `checkable: true` 启用多选 | boolean | false |
| fieldNames | label、value、children 字段映射；支持动态更新 | FieldNames | 标准字段名 |
| changeOnSelect | 单选可选择中间层 | boolean | false |
| showCheckedStrategy | 多选输出和标签去重规则，不改变实际勾选传导 | SHOW_PARENT \| SHOW_CHILD | SHOW_PARENT |
| showSearch | 启用搜索；配置 filter、sort、limit、matchInputWidth、autoClearSearchValue | boolean \| CascaderSearchConfig | 单选 false；多选 true |
| searchValue / autoClearSearchValue | 搜索词 / 选择后清空；配置对象中的 autoClearSearchValue 优先 | string / boolean | '' / true |
| loadData | 加载尚无 children 的非叶子路径；同一未完成路径不重复请求。可返回 Promise，拒绝交给 Vue 错误处理器，加载结束后可重试 | (selectedOptions) => void \| Promise&lt;void&gt; | - |
| expandTrigger | 鼠标展开方式；键盘支持方向键、Enter、Escape，多选 Space | 'click' \| 'hover' | 'click' |
| open / defaultOpen | 当前浮层开关 / 非受控初始值 | boolean | false |
| size / disabled / loading / status | 尺寸、禁用、加载提示、表单状态 | SizeType / boolean / boolean / 'error' \| 'warning' | - |
| variant / bordered | outlined、borderless、filled、underlined；未指定 variant 时 bordered 控制旧的边框选择 | SelectVariant / boolean | outlined / true |
| placeholder / notFoundContent | 占位和空内容；同名插槽优先，空插槽不回退 | VNodeChild | - / 'Not Found' |
| allowClear / clearIcon / removeIcon / suffixIcon | 清除、移除和后缀图标 | boolean \| { clearIcon? } / VNodeChild | true |
| expandIcon / loadingIcon | 列展开和异步加载图标；同名作用域插槽优先 | VNodeChild | 方向箭头 / 加载图标 |
| maxTagCount / maxTagTextLength / maxTagPlaceholder | 多选标签数量、文本长度和静态溢出内容；动态内容用插槽 | number / number / VNodeChild | - |
| placement / direction | 浮层位置和文字方向；方向继承当前 ConfigProvider | SelectCommonPlacement / 'ltr' \| 'rtl' | bottomLeft / 'ltr' |
| popupClassName / dropdownClassName | 浮层 class；前者优先 | string | - |
| popupStyle / popupMenuColumnStyle | 浮层根 / 每个菜单列 ul 的样式 | CSSProperties | - |
| popupMatchSelectWidth | 浮层匹配触发器宽度 | boolean \| number | false |
| getPopupContainer | 浮层容器；未指定时继承当前 ConfigProvider | (node) => HTMLElement | - |
| classNames / styles | 语义目标对象，或 `({ props }) => 对象` | CascaderSemanticClassNames / CascaderSemanticStyles | - |
| id / prefixCls | 输入 ID / 组件前缀 | string | 自动 ID / apollo-cascader |

原生 `class`、`style` 与其他 attrs 落到实际触发器；`aria-label`、`aria-labelledby` 落到输入框。语义目标为 root、prefix、suffix、input、placeholder、content、item、itemContent、itemRemove、clear 及 popup.root/list/listItem。Provider 配置、语义样式、原生根样式依次合并，原生根样式优先。

## Slots

插槽内容遵守 Vue 的完整 VNodeChild 语义，支持文本、零值、多个节点和条件插槽。

| 插槽 | 作用域 | 用途 |
| --- | --- | --- |
| default | - | 自定义完整触发器内容 |
| displayRender | { labels, selectedOptions } | 选中路径标签；默认单选以 ` / ` 连接，多选显示末段 |
| optionRender | { option, pathOptions } | 普通菜单选项内容 |
| searchRender | { inputValue, pathOptions, fieldNames } | 搜索命中路径内容 |
| popupRender | { menu: VNode } | 包装原生菜单；用 `<component :is="menu" />` 渲染，保留面板身份与原有事件 |
| expandIcon / loadingIcon | { option } | 每个选项的展开 / 加载图标 |
| suffixIcon / searchIcon | { focused, open, searchValue, showSearch, loading } | 后缀 / 聚焦搜索图标 |
| maxTagPlaceholder | { omittedValues: { value: ValueCell, label, disabled? }[] } | 多选溢出标签内容 |
| placeholder / notFoundContent / clearIcon / removeIcon | - | 对应内容 |

## Emits 与 v-model

| 事件 | 参数 |
| --- | --- |
| update:value | value: CascaderOutputValue |
| change | value: CascaderOutputValue, selectedOptions: CascaderSelectedOptions |
| update:open / openChange | open: boolean |
| update:searchValue / search | text: string |
| focus / blur | FocusEvent |
| clear | 无 |
| popupScroll | Event |
| keydown / keyup / mousedown | 对应原生事件 |

使用 `v-model:value`、`v-model:open`、`v-model:searchValue`；受控时仅提出更新，父级未接收不改变已接受值。传入 `undefined` 撤控时沿用最后实际收到的值。公开通知由 Vue Emits 派发，支持 Vue 原生监听器数组，不再手工调用 attrs 中的回调。

## Ref 与 Panel

组件 ref 提供 `nativeElement: HTMLElement | null` 属性、`focus(options?: FocusOptions)`、`blur()`。

`CascaderPanel`（或 `Cascader.Panel`）只有菜单列，无浮层和输入框。支持 options、value/defaultValue、multiple、fieldNames、changeOnSelect、showCheckedStrategy、loadData、expandTrigger、expandIcon、loadingIcon、direction、disabled、notFoundContent、popupMenuColumnStyle、classNames/styles；支持 `update:value`、`change` 及 optionRender/searchRender/expandIcon/loadingIcon/notFoundContent 插槽。原生 attrs 直接落在可聚焦面板根，键盘交互与浮层一致。

静态属性 `Cascader.SHOW_PARENT` / `Cascader.SHOW_CHILD` 提供策略常量。内部别名 `_InternalPanelDoNotUseOrYouWillBeFired` 仍指向 Panel（历史边界 D113）。

## 开发期迁移与主题

移除函数 Props `displayRender`、`optionRender`、`popupRender`，改用同名作用域插槽；`showSearch.render` 改为 `#searchRender`，嵌套 searchValue/onSearch 改为顶层模型与 `@search`。函数式 maxTagPlaceholder 改为插槽，图标函数改为插槽。无效的 trigger、placeholder2 和重复的 popupVisibleChange/dropdownVisibleChange 通知不再作为公共接口。

8 个组件 Token：controlWidth(184)、controlItemWidth(111)、dropdownHeight(180)、optionSelectedBg、optionSelectedFontWeight、optionPadding、menuPadding、optionSelectedColor。当前 Provider 的 Cascader Token 同步作用于触发器、独立浮层和 Panel，Select 组件覆盖不会越过组件职责覆盖 Cascader。
