---
category: 数据录入
title: AutoComplete
subtitle: 自动完成
---

可自由输入文本，并从候选中选择的自动完成输入框。候选、键盘、无障碍与主题由 Select 共享引擎负责。

## 代码演示

见 [`demo/`](./demo)。基础示例包含三个模型与键盘回填；候选支持当前条件选项和自定义内容。

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| value / defaultValue | 受控值 / 初值；支持 `v-model:value`，输入和选择输出原始值 | `SelectValue` | — |
| searchValue | 搜索词；支持 `v-model:search-value` | `string` | `''` |
| open / defaultOpen | 受控开合 / 初值；支持 `v-model:open` | `boolean` | `false` |
| options | 候选数据；显式 `[]` 也优先于选项插槽 | `DefaultOptionType[]` | — |
| dataSource | 已废弃；文本、`{ value, text? }` 或 Option/OptGroup VNode，保留已有映射 | `DataSourceItemType[]` | — |
| placeholder | 占位文本；富内容使用 `#placeholder` | `string` | — |
| allowClear | 清除按钮及图标/可访问名配置 | `SelectProps['allowClear']` | `false` |
| disabled / size / variant / status | 同 Select 的禁用、尺寸、变体与校验状态 | — | — |
| showSearch | 搜索算法配置；仅含 `filterOption/filterSort/optionFilterProp/autoClearSearchValue` | `boolean \| SelectSearchConfig` | `true` |
| filterOption | 过滤算法，第二参为实际候选；`false` 保留全部候选 | `boolean \| (text, option) => boolean` | — |
| defaultActiveFirstOption | 默认激活首项；`false` 时等待键盘或鼠标激活 | `boolean` | `true` |
| backfill | 键盘导航时预览候选值；Enter/Tab 或点击确认时提交，不因预览发送值或搜索通知 | `boolean` | `false` |
| autoFocus / maxLength / id / tabIndex | 实际输入框的自动聚焦、长度、标识与 Tab 顺序 | — | — |
| listHeight / listItemHeight / virtual | 候选列表尺寸和虚拟滚动 | 同 Select | — |
| popupMatchSelectWidth / placement / getPopupContainer | 浮层宽度、位置与容器（支持 ShadowRoot） | 同 Select | — |
| classNames / styles | 对象或 `({ props }) => 对象`；语义面为 `root/prefix/input/placeholder/content/clear/popup.{root,list,listItem}` | — | — |

受控更新是提议，父级拒绝后保持接受值，撤控保留最后接受值。键盘回填是临时预览：鼠标激活不回填；接受新值、输入、实际关闭、撤销 `backfill` 或禁用时清除。关闭再打开不会恢复旧预览。`0` 是有效候选值。

默认插槽在 render 中读取并分类，支持条件插槽、`v-if/v-for` 与动态分组；沿用已交付的选项缓存与响应性。`dataSource` 中的富文本是数据，顶层内容扩展使用插槽。单个自定义 input/textarea 仍未提供替换协议，会给出明确警告；当前没有 AutoComplete PurePanel 公共入口。

### Events

| 事件 | 参数与说明 |
|---|---|
| change / update:value | `(value, option)` / `(value)`；输入、选择或清除提交值 |
| search / update:searchValue | `(text: string)`；输入搜索通知 / 搜索模型提议，候选选择同步搜索模型；外部 value 的派生同步不重复通知 |
| select / deselect | `(value: string \| number, option)`；候选选择通知；combobox 没有多选取消操作 |
| openChange / update:open | `(open: boolean)`；开合通知与模型提议 |
| focus / blur | `(event: FocusEvent)`；实际控件焦点 |
| clear | 清除操作 |
| popupScroll / inputKeyDown | `(event: Event)` / `(event: KeyboardEvent)` |

通知使用 typed emits。`h()` 的 `onSearch/onChange` 等是 Vue 监听器属性，不再作为组件回调 Props 手动调用。`onDropdownVisibleChange` 直接迁为 `@openChange`；`showSearch.onSearch/searchValue/searchIcon` 分别迁为 `@search`、顶层搜索模型与 `#searchIcon`。

### Slots

`default`（Option/OptGroup 数据）、`prefix`、`placeholder`、`notFoundContent`、`clearIcon`、`loadingIcon`、`searchIcon`、`labelRender="{ value, label }"`、`optionRender="{ option, index }"`、`popupRender="{ menu }"`、`menuItemSelectedIcon="{ value, disabled, isSelected }"`、`suffixIcon="{ searchValue, open, focused, showSearch, loading }"`。

当前插槽动态转发，提供空插槽表示有意隐藏，数字 `0` 正常显示。未提供 suffix 插槽时默认无箭头；`#searchIcon/#loadingIcon` 在对应状态可单独定制。

### Attrs、Provider 与主题

原生 `class/style/data-*` 落选择器根，`id/tabindex/role/aria-*` 落实际输入框。attrs 在 render 中读取，类名合并一次，字符串/数组样式和移除均生效；透传不能覆盖内部 combobox 模式或通知处理。

当前 `components.autoComplete` 的类名、样式、语义与搜索/清除配置可响应式替换或移除；Select 与 AutoComplete 的专属组件配置相互隔离；全局尺寸、方向与 Form/Compact 上下文继续由共享引擎读取。主题完全使用 Select Token，根与 Teleport 浮层同步，无独立 AutoComplete Token。

### Expose

| 成员 | 说明 |
|---|---|
| focus(options?: FocusOptions) / blur() | 操作真实输入框 |
| scrollTo(arg?) | 数字为像素坐标；条目使用 `{ index?, key?, align? }`；已有 `{ top }` 坐标形态继续支持 |
| nativeElement | 真实选择器根 `HTMLElement \| null` |

保留的样式别名：`dropdownMatchSelectWidth` → `popupMatchSelectWidth`，`popupClassName/dropdownClassName` → `classNames.popup.root`，`dropdownStyle` → `styles.popup.root`。内容函数使用 `#popupRender` 等原生插槽。
