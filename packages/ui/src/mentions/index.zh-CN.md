---
category: 数据录入
title: Mentions
subtitle: 提及
---

用于在输入中提及某人或某事，常用于发布、聊天或评论框。

## 何时使用

- 需要在文本输入里「@ 某个人 / # 某个标签」并弹出候选。
- 候选可能来自**异步**接口（配 `loading` + `onSearch`）。

## 代码演示

见 [`demo/`](./demo)（16 个，覆盖 antd 的主要用户场景）。

| demo | 内容 |
|---|---|
| `basic` | 基本（`options` 数据驱动） |
| `prefix` | 多触发字符（`['@', '#']`）+ `onSearch` 切换数据源 |
| `autoSize` | 高度自适应 |
| `autosize-textarea-debug` | `style.resize` 的两种取值 |
| `allowClear` | 清除按钮（默认 / 自定义图标 / 多行） |
| `async` | 异步候选（`loading` + `onSearch`） |
| `placement` | 向上展开 |
| `readonly` | `disabled` 与 `readOnly` |
| `size` | `large` / 默认 / `small` |
| `status` | `error` / `warning` |
| `variant` | `outlined` / `filled` / `borderless` / `underlined` |
| `form` | 与 `Form` 配合（受控 + 校验） |
| `popupRender` | 自定义下拉面板 |
| `style-class` | `classNames` / `styles` 的对象与函数形态 |
| `component-token` | Component Token 调试（`dropdownHeight` 等） |
| `render-panel` | 静态面板（调试用，勿在生产使用） |

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
| silent | 显式静默，Enter 不选中；独立于 loading，loading 时始终禁止选择 | `boolean` | `false` | × |
| placement | 浮层方位 | `'top' \| 'bottom'` | `'bottom'` | × |
| getPopupContainer | 浮层挂载点；挂载前可返回 null | `() => HTMLElement \| null` | — | ✅ |
| popupClassName | 浮层额外类名 | `string` | — | × |
| size | 尺寸 | `'large' \| 'middle' \| 'small'` | 从 ConfigProvider 取 | ✅ |
| disabled | 禁用 | `boolean` | 从 `DisabledContext` 取 | ✅ |
| readOnly | 只读；禁止清空与候选编辑 | `boolean` | `false` | × |
| hidden | 隐藏整个组件根元素 | `boolean` | `false` | × |
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
| class / style | **根节点原生 attrs**（替代上游 `className` / `rootClassName` / `style`） | `string \| array \| object` / `StyleValue` | — | × |

原生 class/style 在裸形态、allowClear 及 Form 反馈三种形态中都落到最外层根。style 支持字符串、对象、混合数组和 CSS 变量，优先于 styles.root，移除后恢复语义值；id/ARIA/tabindex 继续属于 textarea。样式与 silent/loading 的当前值更新不会重挂编辑器。组件配置的 style 参与根样式合并；textarea、popup、suffix 语义样式作用于对应区域。ConfigProvider 的当前 getPopupContainer 生效，组件显式指定时优先。

受控更新是请求：父级未接受的输入或清空不会成为撤控后的本地值；移除 value 后保留最后接受值，后续输入转为本地更新。切为 disabled/readOnly 会结束普通候选交互，只读时不允许清空。

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
| input | 原生文本输入 | `(event: Event)` |
| focus / blur | 文本框焦点变化；blur 按浮层焦点协调延后发送 | `(event: FocusEvent)` |
| keydown / keyup | 文本框键盘事件，支持 Vue 修饰符 | `(event: KeyboardEvent)` |
| clear | 点击清空后发送，无参数 | `()` |
| update:value | 值变化（配 `v-model:value`） | `(value: string)` |
| change | 值变化（**收字符串，不是事件**） | `(value: string)` |
| select | 选中候选项 | `(option: MentionsOptionProps, prefix: string)` |
| search | 搜索串变化（异步加载的入口） | `(text: string, prefix: string)` |
| popupScroll | 浮层滚动 | `(event: Event)` |
| pressEnter | 按下 Enter 且**不在**候选态 | `(e: KeyboardEvent)` |
| resize | 尺寸变化（`autoSize` 时） | `({ width, height })` |

`change` / `select` / `search` 使用 typed emits，支持 `@change.once` 等 Vue 监听语法及当前监听器数组；一次原生 input 只发送一次值更新。原生 DOM change/select 不触发这些语义事件。旧 `:on-search="handler"` 等函数 prop 绑定改为 `@search="handler"`；渲染函数的 `onSearch` 是标准 Vue 监听器注册。见 [迁移记录](../../../../docs/migrations/mentions-core-events.md)。

其他公开事件也通过 typed emits 发送，支持监听器数组、替换和 `.once`。`@keydown.stop.prevent` 等修饰符作用于原生事件；`@press-enter` 仅在非候选态发送。组件卸载会取消待处理 blur，浮层内部焦点协调不伪造 FocusEvent。旧 `:on-press-enter` / `:on-popup-scroll` / `:on-resize` 函数 prop 直接改为 `@press-enter` / `@popup-scroll` / `@resize`，见 [迁移记录](../../../../docs/migrations/mentions-native-events.md)。

候选键盘使用标准 `KeyboardEvent.key`：↑/↓ 跳过禁用项，Enter 单次选择，Escape 关闭；这些键的 keyup 不重复搜索或重开。IME `isComposing` 期间方向键和 Enter 留给输入法，仍向公开键盘监听器发送原始事件。手动构造键盘事件时请提供 `key`，不再依赖废弃的 `which`。见 [标准键盘迁移](../../../../docs/migrations/mentions-keyboard.md)。

### Slots

| 名称 | 说明 | 参数 |
|---|---|---|
| default | `Mentions.Option` 形式的候选项（**已 deprecated**，用 `options`） | — |
| notFoundContent | 无候选时的当前内容；存在且为空也抑制回退 | — |
| popupRender | 自定义浮层；槽存在则使用其内容，空槽不恢复默认菜单 | `{ originNode: VNode }` |

`MentionsSlots` / `MentionsPopupRenderSlotProps` 已导出并接入组件。槽按当前 render 沿包装与引擎转发；条件移除后恢复菜单，保留 textarea 节点、当前值、焦点及默认菜单的选择行为。旧 popupRender 函数 prop 已直接移除，无兼容层，见 [迁移记录](../../../../docs/migrations/mentions-popup-slot.md)。

空内容优先级为 `#notFoundContent`（含有意为空）→ `notFoundContent` prop → `ConfigProvider.components.mentions.notFoundContent` → `renderEmpty('Select')` → 默认空状态。插槽只在实际空菜单 render 时调用，关闭/SSR、已有候选或 loading 不提前执行；存在时不调用回退渲染函数。移除后恢复当前回退数据。`false` 保持空白，`0`、VNode 及数组按 Vue 内容规则渲染，不增加额外包装元素。

### Expose（模板 ref）

| 名称 | 说明 | 类型 |
|---|---|---|
| focus | 聚焦 | `() => void` |
| blur | 失焦 | `() => void` |
| textarea | 当前原生 `<textarea>` | `HTMLTextAreaElement \| null` |
| nativeElement | 根元素 | `HTMLElement \| null` |

### 静态成员

| 名称 | 说明 |
|---|---|
| `Mentions.Option` | @deprecated，用 `options`（也可用具名导出 `MentionsOption`） |
| `Mentions.getMentions(value, config?)` | **纯函数**：解析文本里的提及实体 |
| `Mentions._InternalPanelDoNotUseOrYouWillBeFired` | 静态面板（调试/文档用） |

`InstanceType<typeof Mentions>` 与 `MentionsRef` 均提供实际方法和元素类型。已弃用的 `Mentions.Option` 仍读取当前默认插槽，支持模板 v-for、原生 class/style 及 string/number key；未被消费的 `OptionProps.children` 已移除，内容直接写入默认插槽。`options[].label` 继续接收 VNodeChild 数据。

内部静态面板在 value 含触发前缀时展示真实候选菜单；菜单挂在自身容器内并参与布局，卸载时释放。普通 Mentions 不增加 open prop。

### Component Token

当前主题的全局别名和 21 个有效组件字段同时作用于根与 Teleport 浮层；嵌套覆盖、替换和撤除会更新现有节点。语义样式及原生根 style 继续优先。

- 长度字段（number 自动转 px，也可用 CSS 长度字符串）：lineWidthFocus、paddingBlock/SM/LG、paddingInline/SM/LG、inputFontSize/SM/LG、dropdownHeight、controlItemWidth、itemPaddingVertical。
- 字符串字段：activeBorderColor、hoverBorderColor、activeShadow、errorActiveShadow、warningActiveShadow、hoverBg、activeBg。
- 层级字段：zIndexPopup；显式 styles.popup.zIndex 优先，保留 CSS 字符串。

删除没有 CSS 消费点的 addonBg；不提供无效字段兼容通道。其余字段按当前主题派生默认值，再接受 components.Mentions 覆盖。

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
