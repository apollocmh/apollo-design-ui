---
title: Mentions 提及
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

用于在输入中提及某人或某事，常用于发布、聊天或评论框。

## 何时使用

- 需要在文本输入里「@ 某个人 / # 某个标签」并弹出候选。
- 候选可能来自**异步**接口（配 `loading` + `onSearch`）。

:::

## 代码演示

::: v-pre

**allowClear**：自定义清除按钮。

:::

<DemoPreview component="mentions" demo="allowClear" />

::: v-pre

**async**：匹配内容列表为异步返回时。

:::

<DemoPreview component="mentions" demo="async" />

::: v-pre

**autoSize**：自适应内容高度。

:::

<DemoPreview component="mentions" demo="autoSize" />

::: v-pre

**autosize-textarea-debug**：autoSize debug

:::

<DemoPreview component="mentions" demo="autosize-textarea-debug" />

::: v-pre

**basic**：基本使用。

:::

<DemoPreview component="mentions" demo="basic" />

::: v-pre

**component-token**：Component Token Debug.

:::

<DemoPreview component="mentions" demo="component-token" />

::: v-pre

**form**：受控模式，例如配合 Form 使用。

:::

<DemoPreview component="mentions" demo="form" />

::: v-pre

**placement**：向上展开建议。

:::

<DemoPreview component="mentions" demo="placement" />

::: v-pre

**popupRender**：使用 `popupRender` 对下拉菜单进行自定义渲染。

:::

<DemoPreview component="mentions" demo="popupRender" />

::: v-pre

**prefix**：通过 `prefix` 属性自定义触发字符。默认为 `@`, 可以定义为数组。

:::

<DemoPreview component="mentions" demo="prefix" />

::: v-pre

**readonly**：通过 `disabled` 属性设置是否生效。通过 `readOnly` 属性设置是否只读。

:::

<DemoPreview component="mentions" demo="readonly" />

::: v-pre

**render-panel**：调试用组件，请勿直接使用。

:::

<DemoPreview component="mentions" demo="render-panel" />

::: v-pre

**size**：通过 `size` 属性配置大小。

:::

<DemoPreview component="mentions" demo="size" />

::: v-pre

**status**：使用 `status` 为 Mentions 添加状态。可选 `error` 或者 `warning`。

:::

<DemoPreview component="mentions" demo="status" />

::: v-pre

**style-class**：通过 `classNames` 和 `styles` 传入对象/函数可以自定义 Mentions 的语义化结构样式，例如设置文本框可缩放。

:::

<DemoPreview component="mentions" demo="style-class" />

::: v-pre

**variant**：Mentions 形态变体，可选 `outlined` `filled` `borderless` `underlined` 四种形态。

:::

<DemoPreview component="mentions" demo="variant" />

::: v-pre

## API

### Props

| 参数 | 说明 | 类型 | 默认值 | 全局配置 |
|---|---|---|---|---|
| value | 受控值（配 `v-model:value`） | `string` | — | × |
| defaultValue | 非受控初始值 | `string` | — | × |
| options | 候选项（数据驱动） | `MentionsOptionProps[]` | — | × |
| prefix | 触发字符，可传数组 | `string \| string[]` | `'@'` | × |
| split | 分词符（同时是「搜索串是否合法」的默认判据） | `string` | `' '` | × |
| filterOption | 候选过滤。传 `false` 表示**不做过滤** | `false \| ((input, option) => boolean)` | 按 `option.value` 包含输入串（大小写不敏感） | × |
| validateSearch | 搜索串是否合法 | `(text, split) => boolean` | 不含 `split` | × |
| notFoundContent | 无候选时的内容 | `VNodeChild` | `renderEmpty('Select')` | ✅（`mentions.notFoundContent`） |
| loading | 候选加载中（面板显示 Spin，且 **Enter 不选中**） | `boolean` | `false` | × |
| silent | 静默（`loading` 时自动置真）—— 置真后 Enter 不选中 | `boolean` | `false` | × |
| placement | 浮层方位 | `'top' \| 'bottom'` | `'bottom'` | × |
| getPopupContainer | 浮层挂载点 | `() => HTMLElement` | — | ✅ |
| popupClassName | 浮层额外类名 | `string` | — | × |
| popupRender | 自定义浮层渲染（收默认菜单，返回新节点） | `(menu) => VNodeChild` | — | × |
| size | 尺寸 | `'large' \| 'middle' \| 'small'` | 从 ConfigProvider 取 | ✅ |
| disabled | 禁用 | `boolean` | 从 `DisabledContext` 取 | ✅ |
| readOnly | 只读（**不加类名**，只给 textarea 加 `readonly`） | `boolean` | `false` | × |
| status | 校验状态 | `'error' \| 'warning'` | 从 `Form.Item` 取 | ✅ |
| variant | 形态 | `'outlined' \| 'filled' \| 'borderless' \| 'underlined'` | `'outlined'` | ✅ |
| allowClear | 清除按钮 | `boolean \| { clearIcon?, disabled? }` | `false` | ✅（`mentions.allowClear`） |
| rows | 文本框行数 | `number` | `1` | × |
| autoSize | 高度自适应 | `boolean \| { minRows?, maxRows? }` | — | × |
| maxLength | 最大长度 | `number` | — | × |
| placeholder | 占位文本（**同时是可访问名**） | `string` | — | × |
| classNames | 语义化类名（`root` / `textarea` / `popup` / `suffix`），支持函数形态 | `MentionsSemanticClassNames \| ((info) => …)` | — | ✅（`mentions.classNames`） |
| styles | 语义化样式（同上 4 键），支持函数形态 | `MentionsSemanticStyles \| ((info) => …)` | — | ✅（`mentions.styles`） |
| prefixCls | 类名前缀 | `string` | 从 ConfigProvider 取，兜底 `apollo-mentions` | × |
| class / style | **根节点原生 attrs**（替代上游 `className` / `rootClassName` / `style`） | `string \| array \| object` / `CSSProperties` | — | × |

#### MentionsOptionProps

| 字段 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| value | 选中后回填的值 | `string` | — |
| label | 展示内容 | `VNodeChild` | — |
| disabled | 不可选（键盘 ↑/↓ 会跳过） | `boolean` | `false` |
| className | 该项的类名 | `string` | — |
| style | 该项的内联样式 | `CSSProperties` | — |
| key | 只用于 `data-menu-id` | `string \| number` | `value` |

### Events

| 名称 | 说明 | 参数 |
|---|---|---|
| update:value | 值变化（配 `v-model:value`） | `(value: string)` |
| change | 值变化（**收字符串，不是事件**） | `(value: string)` |
| select | 选中候选项 | `(option: MentionsOptionProps, prefix: string)` |
| search | 搜索串变化（异步加载的入口） | `(text: string, prefix: string)` |
| popupScroll | 浮层滚动 | `(event: Event)` |
| pressEnter | 按下 Enter 且**不在**候选态 | `(e: KeyboardEvent)` |
| resize | 尺寸变化（`autoSize` 时） | `({ width, height })` |

### Slots

| 名称 | 说明 | 参数 |
|---|---|---|
| default | `Mentions.Option` 形式的候选项（**已 deprecated**，用 `options`） | — |

### Expose（模板 ref）

| 名称 | 说明 | 类型 |
|---|---|---|
| focus | 聚焦 | `() => void` |
| blur | 失焦 | `() => void` |
| textarea | 原生 `<textarea>`（**上游标注 may not work as expected**） | `HTMLTextAreaElement \| null` |
| nativeElement | 根元素 | `HTMLElement \| null` |

### 静态成员

| 名称 | 说明 |
|---|---|
| `Mentions.Option` | @deprecated，用 `options`（也可用具名导出 `MentionsOption`） |
| `Mentions.getMentions(value, config?)` | **纯函数**：解析文本里的提及实体 |
| `Mentions._InternalPanelDoNotUseOrYouWillBeFired` | 静态面板（调试/文档用） |

## 键盘与无障碍

焦点**始终留在 textarea**（候选列表只是展示，`role="menu"` + `role="menuitem"`）：

| 键 | 行为 |
|---|---|
| ↑ / ↓ | 移动高亮（**跳过 `disabled` 的项**，环形） |
| Enter | 选中当前高亮项并回填（`silent` 时不选中） |
| Esc | 关闭候选面板 |

⚠️ 文本框的可访问名由**使用方**提供（`placeholder` / `aria-label` / `Form.Item` 的 label），
与 antd 一致 —— 组件猜不出「这段文本在说什么」。

## 设计指引

- 候选超过 10 条时建议配 `onSearch` 做异步过滤（`async` demo）。
- `split` 是「一个提及的结束符」：默认空格 ⇒ `@afc163 hello` 里 `afc163` 是一个完整提及。
- 回填时会在前缀前补一个 `split`（若前文没有），并去掉与候选重复的开头。

:::
