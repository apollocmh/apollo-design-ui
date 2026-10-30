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

见 [`demo/`](./demo)（原生 Vue 示例，含三模型、条件选项、筛选与键盘交互）。

## 条件选项

默认插槽中的 `SelectOption` / `SelectOptGroup` 在渲染期解析，支持条件 slot、`v-if`、`v-for` 和动态 value/label/disabled。显式 `options` 优先于默认插槽，包括 `options=[]`；切回 `undefined` 才使用插槽。临时移除已选项时保留其标签缓存，选项恢复后使用最新标签。无需更换组件 key，输入节点和选择状态保持。

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| value / defaultValue | 受控值（`v-model:value`）/ 非受控初值 | `SelectValue` | — |
| searchValue | 受控搜索词（`v-model:search-value`） | `string` | `''` |
| mode | 模式 | `'multiple' \| 'tags'` | 单选 |
| options | 选项数据（支持嵌套分组） | `DefaultOptionType[]` | — |
| labelInValue | `change/select/deselect` 输出 `{ label, value }` | `boolean` | `false` |
| showSearch | 可搜索；对象形态配置过滤 | `boolean \| SearchConfig` | `false` |
| filterOption | 自定义过滤（⚠️ 默认按 `value` 匹配，大小写不敏感） | `boolean \| fn` | — |
| optionFilterProp | 过滤字段（传 `string[]` 多字段 OR） | `string \| string[]` | `'value'` |
| filterSort | 过滤结果排序 | `fn` | — |
| allowClear | 清除按钮（`{ clearIcon, label }` 定制） | `boolean \| object` | `false` |
| placeholder | 占位文本（富内容用 `#placeholder` 插槽） | `string` | — |
| size | 尺寸（= `SizeType`，含 `medium`） | `'small' \| 'medium' \| 'middle' \| 'large'` | `'middle'` |
| variant | 变体 | `'outlined' \| 'filled' \| 'borderless' \| 'underlined'` | `'outlined'` |
| status | 校验状态 | `'error' \| 'warning' \| 'success' \| 'validating'` | — |
| disabled / loading | 禁用 / 加载中 | `boolean` | `false` |
| maxCount | 最多可选数（仅多选/标签） | `number` | — |
| maxTagCount / maxTagTextLength | 多选折叠 / 文本截断 | `number` | — |
| tokenSeparators | 自动分词分隔符（数组或函数） | `string[] \| fn` | — |
| listHeight / listItemHeight | 列表最大高 / 估算行高 | `number` | `256 / 32` |
| popupMatchSelectWidth | 浮层宽度跟随触发器 | `boolean \| number` | `true` |
| placement | 弹出位置 | 4 值 | `'bottomLeft'` |
| open / defaultOpen | 受控开合（`v-model:open`） | `boolean` | `false` |
| fieldNames / optionLabelProp | 字段映射 / 回填字段 | — | `label` |
| virtual | 虚拟滚动 | `boolean` | `true` |
| classNames / styles | 语义槽 `root/prefix/suffix/input/placeholder/content/item/itemContent/itemRemove/clear/popup.{root,list,listItem}` | — | — |
| dropdownClassName / dropdownStyle / dropdownMatchSelectWidth / popupClassName / bordered / showArrow 等 | ⚠️ 已废弃 | — | — |

搜索配置只包含 `filterOption`、`filterSort`、`optionFilterProp`、`autoClearSearchValue`；通知使用 `@search`，搜索图标使用 `#searchIcon`。筛选、排序、分词和浮层容器函数保留其业务职责。`showSearch.onSearch/searchValue/searchIcon` 不再是配置通道。

`value`、`searchValue`、`open` 的受控更新是提议；父级拒绝后保持当前值，撤控保留最后接受值。`defaultValue/defaultOpen` 仅作初值。`labelInValue` 开启时单项事件的值为 `{ value, label }`，否则为 `string | number`。

### Events

| 事件 | 说明 | 参数 |
|---|---|---|
| change | 值变化（与 `update:value` 同发） | `(value, option)` |
| select / deselect | 选中 / 取消选中一项 | `(value, option)` |
| search | 输入产生的搜索通知 | `(value: string)` |
| update:searchValue | 搜索词更新提议（含选中后清空） | `(value: string)` |
| openChange / update:open | 开合通知 / 模型提议 | `(open: boolean)` |
| focus / blur | 焦点 | `(event)` |
| clear | 点击清除 | — |
| popupScroll | 下拉滚动 | `(event: Event)` |
| inputKeyDown | 搜索框按键 | `(event: KeyboardEvent)` |

### Slots

`prefix` / `suffixIcon="{ searchValue, open, focused, showSearch, loading }"` / `searchIcon` / `loadingIcon` / `clearIcon` / `removeIcon` / `placeholder` /
`notFoundContent` / `optionRender="{ option, index }"` / `tagRender` / `labelRender` /
`popupRender="{ menu }"` / `maxTagPlaceholder="{ omittedValues }"` /
`menuItemSelectedIcon="{ value, disabled, isSelected }"` /
`default`（`Select.Option` / `Select.OptGroup` 子组件形态，deprecated 但支持）。

> ⚠️ antd 的 ReactNode props（`suffixIcon` / `notFoundContent` / `optionRender` /
> `maxTagPlaceholder` 等）在本仓**一律是作用域插槽**，不保留同名 prop（规则 C8-R2）。

插槽在 render 中读取，动态加入、替换或移除会立即更新；提供空插槽表示有意隐藏，不回退默认内容，数字 `0` 正常显示。`#loadingIcon/#searchIcon` 在对应状态优先，`#suffixIcon` 控制其余 suffix 展示并收到真实焦点。`options` 内的 `label` 与图标配置仍是数据内容，顶层内容函数只通过插槽扩展。

### Attrs、Provider 与主题

原生 `class/style` 落选择器根容器；`id/tabindex/role/aria-*` 落实际 input，`data-*` 和其余原生 attrs 落根容器，监听器与内部交互合并。`focus/blur` 是组件焦点通知。样式优先级为当前主题 → Provider `style` → Provider/局部 `styles.root` → 原生 `style`；语义类名拼接。

当前、嵌套与移除后的 ConfigProvider 配置响应式生效；Select Token 同时写到根和 Teleport 浮层，虚拟列表估算行高跟随 `optionHeight`。使用复杂 CSS 行高时通过 `listItemHeight` 给出数值估算。`SelectPurePanel` 使用同一 Props、Slots、Emits 和 Ref，在自身容器中展开浮层并占据布局。

### Methods

| 方法 | 说明 | 参数 | 返回值 |
|---|---|---|---|
| focus | 聚焦 | `(options?: FocusOptions)` | — |
| blur | 失焦 | — | — |
| scrollTo | 滚动到坐标或指定项 | `(scrollTop \| { index, align, key })` | — |
| nativeElement | 根元素 | — | `HTMLElement` |

## 设计说明

- **rc-select 1.10.1 内核的 Vue 自建**（engine/ 五层）；DOM 无 `-selector` 包裹层（v6）。
- 与 antd 的已知差异见组件 README。
- ⚠️ 搜索默认按 `value` 匹配 —— 按 label 搜请传 `showSearch: { optionFilterProp: 'label' }`。
