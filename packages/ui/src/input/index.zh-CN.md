---
category: 数据录入
title: Input
subtitle: 输入框
---

# Input 输入框

基本的表单输入控件。包含 `Input` / `TextArea` / `Input.Password` / `Input.Group` /
`Input.Search` / `Input.OTP`。

## 代码演示

<code src="./demo/basic.vue">基本</code>
<code src="./demo/size.vue">三种大小</code>
<code src="./demo/presuffix.vue">前缀/后缀</code>
<code src="./demo/allow-clear.vue">可清空</code>
<code src="./demo/show-count.vue">字数统计</code>
<code src="./demo/textarea.vue">文本域</code>
<code src="./demo/password.vue">密码框</code>
<code src="./demo/variant-status.vue">形态与状态</code>
<code src="./demo/search.vue">搜索框</code>
<code src="./demo/otp.vue">验证码</code>

## API · Input

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| value | 受控值（`v-model:value`） | string | - |
| defaultValue | 初始值 | string | - |
| size | 尺寸 | `large` \| `middle` \| `small` | - |
| disabled / readOnly | 禁用 / 只读 | boolean | false |
| variant | 形态变体 | `outlined` \| `filled` \| `borderless` \| `underlined` | `outlined` |
| status | 校验状态 | `error` \| `warning` | - |
| prefix / suffix | 前后缀内容；`#prefix` / `#suffix` 插槽优先，已存在的空插槽也会覆盖 prop | VNodeChild / Component | - |
| allowClear | 清空按钮（可 `{ clearIcon, disabled }`） | boolean \| object | false |
| showCount | 字数统计（可 `{ formatter }`） | boolean \| object | false |
| count | 计数策略 / 超长裁剪 | object | - |
| maxLength | 原生最大长度 | number | - |
| htmlSize | 原生 `size` | number | - |
| type | 原生输入类型 | string | text |
| placeholder / autoComplete | 原生提示文本 / 自动填充 | string | - |
| autoFocus / hidden | 原生自动聚焦 / 隐藏逻辑根 | boolean | false |
| prefixCls | 输入框类名前缀 | string | Provider 的 input 前缀 |
| ~~clearIcon~~ | **Deprecated** 使用 `allowClear.clearIcon`；对象内未给图标时仍回退到此字段及 Provider | VNodeChild / Component | - |
| classNames / styles | 语义化（root/prefix/suffix/clear/input/count） | object \| function | - |
| ~~bordered~~ | **Deprecated** 用 `variant` | boolean | true |
| ~~addonBefore / addonAfter~~ | **Deprecated** 用 `Space.Compact` | VNodeChild | - |

### 事件

`update:value(value: string)` 和 `change(event: Event)` 在普通输入时同步发出；`change` 中的 `target` 是实际编辑器，`target.value` 为计数处理后的值。IME 组合期间保留原生草稿，仅在结束时提交一次 model / change，并忽略紧随的重复 input。`input` 仍是原生输入事件，包含组合期间的输入。

`press-enter(event: KeyboardEvent)` 在组合期间不触发；`clear(event: MouseEvent)` 由清空按钮触发。清空顺序为写入空值并更新 model → `clear` → 在实际编辑器派发原生 `input`，其处理链触发 `change`。区分清空请监听 `clear`，不要检查 `change.type === 'click'`。

`focus`、`blur`、`keydown`、`keyup`、`mousedown`、`compositionstart` / `compositionend` 等原生监听器传给编辑器。保留 `composition-start` / `composition-end` 的现有监听名。语义事件及原生事件都支持 Vue 的监听器数组和 `.once`。

### Ref

`focus(option)`（含 `cursor: 'start' \| 'end' \| 'all'`）、`blur()`、
`setSelectionRange()`、`select()`、`input`、`nativeElement`。`input` 为实际 input；`nativeElement` 为承载根 class/style 的逻辑根（有 addon 时为 group，有前后缀时为 affix，否则为 input）。动态插槽、清空及计数开关保留编辑节点、焦点和选区。

## API · TextArea

共享 Input 的 value/defaultValue、size、disabled/readOnly、variant/status、allowClear/clearIcon、count/showCount、maxLength、placeholder、autoComplete、hidden 及语义事件。没有 prefix/suffix/addon、htmlSize 或 type API。原生 textarea attrs（例如 `name`、`id`、`aria-*`、`autofocus`）传给实际 textarea。

增加 `autoSize`（`true` 或 `{ minRows, maxRows }`）、`rows` 与 `resize({ width, height })`。resize 返回编辑器外框尺寸，autoSize、原生拖拽及调用方尺寸变化都会通知，相同尺寸去重；卸载清理观察和 document 监听。

语义区域为 `{ root, textarea, clear, count, affixWrapper, variant }`，样式区域为 `{ root, textarea, clear, count }`。Ref 为 `focus()`、`blur()`、`resizableTextArea.textArea` 和逻辑根 `nativeElement`。

## API · Input.Password

`action` 为 `'click' | 'hover'`，默认 `'click'`。hover 在进入按钮边界时切换，子图标 mouseover 不会重复切换；原生按钮保留键盘激活能力。

`visibilityToggle` 默认为 `true`，可设 `false` 或 `{ visible, onVisibleChange, tabIndex, action }`。提供 `visible` 时显隐受控；顶层 `action` 优先于对象内同名字段。`#icon="{ visible }"` 渲染切换图标，`classNames.icon` 作用于按钮。`#prefix` / `#suffix` 与 Input 相同；suffix 插槽只替换用户后缀，切换按钮由 `visibilityToggle` 管理。

继承有效的 Input 属性并增加 `inputPrefixCls`，其 `prefixCls` 作用于 Password。`type` 始终由显隐状态决定，已从 Password 公开接口移除；`iconRender` 已迁移为 icon 插槽。迁移说明见仓库 `docs/migrations/input-contracts.md`。

## API · Input.Search

在 Input 基础上增加：

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| enterButton | 搜索按钮：`false` 图标 / `true` 主按钮 / 文本 / 自定义节点 | boolean \| string \| number \| VNodeChild \| Component | false |
| searchIcon | 自定义搜索图标 | VNodeChild \| Component | `<SearchOutlined />` |
| loading | 按钮 loading；拦截 Enter 和按钮搜索，含自定义按钮 | boolean | false |
| onSearch | 搜索回调 `(value, event, { source })`；清空触发时 `source='clear'` | function | - |
| inputPrefixCls | 内层 Input 的前缀 | string | - |
| addonAfter | 按钮后追加的节点 | VNodeChild \| Component | - |

语义槽：`{ root, input, prefix, suffix, clear, count, button }`（`button` 支持对象或
`{ root }` 形态）。自定义原生按钮保留其 disabled；自定义组件需转发传入的 attrs 和状态。普通内容节点与数组由按钮承载。

保留 Input 的 `type`，默认 `search`，并转发 `#prefix` / `#suffix`。`search(value, event, { source })` 支持 `.once`；source 为 `input` 或 `clear`。`nativeElement` 为外层 Compact 根，`input` 为编辑器；原生 `class` / `style` / `hidden` 和 data attrs 作用于该外层根，其余原生字段作用于编辑器。

## API · Input.OTP

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| length | 格子数量；取正整数，至少 1，非有限值回退 6 | number | 6 |
| value / defaultValue | 受控值 / 初始值（`v-model:value`） | string | - |
| onChange | 全部填满且值变化时触发 | `(value: string) => void` | - |
| onInput | 每次格子变化时触发（数组） | `(value: string[]) => void` | - |
| formatter | 对值做格式化（如转大写） | `(value: string) => string` | - |
| separator | 静态格间内容（包括 `0`）；动态内容使用 `#separator="{ index }"` | VNodeChild | - |
| mask | 掩码（`true` 用 •，或单字符） | boolean \| string | false |
| type / inputMode / autoComplete | 透传给每格原生 input | string | - |
| autoFocus | 聚焦第一格 | boolean | false |
| classNames / styles | 语义槽 `{ root, input, separator }` | object \| function | - |

每次编辑更新 `v-model:value`（包括部分输入），`input` 发出格子数组，`change` 只在完整值变化时发出。受控值被父级拒绝时保持父值。formatter 处理后按 Unicode 码点截到 length；粘贴后移到实际目标格，左右方向键随 RTL 方向移动。

Ref：`focus()`、`blur()`、`nativeElement`（OTP 容器）。

## API · Input.Group

保留 `prefixCls`、`size`、`compact` 和默认插槽。compact 切换组布局；size 向子组件提供默认尺寸。Group 不提供 value、语义事件或编辑器 Ref。已废弃，请使用 `Space.Compact`。

## 主题、尺寸与样式

默认字号、非负内边距及聚焦阴影消费当前主题。`theme.components.Input` 支持既有的 19 个字段：`lineWidthFocus`、`paddingBlock/SM/LG`、`paddingInline/SM/LG`、`addonBg`、`activeBorderColor`、`hoverBorderColor`、`activeShadow`、`errorActiveShadow`、`warningActiveShadow`、`hoverBg`、`activeBg`、`inputFontSize/SM/LG`、`inputAffixPadding`。长度字段可用数字（px）或 CSS 长度字符串，`0` 有效；移除配置后恢复当前主题默认值。`inputAffixPadding` 控制前后缀间距。公开 `prepareInputComponentToken` 继续返回指定数值快照的准备结果。

尺寸优先级为组件显式 `size` → 最近的 `Space.Compact` / `Input.Group` → `ConfigProvider.componentSize`。Group 的尺寸向子组件提供默认值，子组件显式尺寸优先。Input 保留自然行盒，不压缩显式字体、行高或 padding：默认主题 small/middle/large 为 24/32/40px，compact 为 22/28/35px；small 的自然下限可高于主题目标 `controlHeightSM`。不同类型控件没有外框高度恒等承诺。Search 默认按钮随输入自然伸展，不注入自有最小高度；调用方的 `height` / `min-height` 按其 CSS 生效。TextArea 继续按 rows、已有最小高度及 autoSize 约束排版；autoSize 在主题、尺寸、控件及祖先 class/style、宽度变化和排版过渡结束后，根据实际量测签名重测。无关样式变化不重复量测，禁用和卸载会清理观察与事件。

语义 classNames/styles 回调读取当前完整属性及合并后的 size、disabled、variant、status。组件主题数据先于显式语义样式和原生 `style` 合并。`components.input/textArea/inputPassword` 的 `style` 作用于组件逻辑根；`styles.input` / `styles.textarea` 作用于实际控制节点。Search、OTP 的原生根样式作用于容器，格子或输入节点请使用 `styles.input`。既有 stylesheet 的 `--apollo-input-*` 覆盖继续有效；theme 中显式组件字段以逻辑根内联变量提供。

显式空的 `ThemeProvider :theme="{}"`（或 `createThemeContext({})`）仍是默认主题来源，可在外部 CSS 主题作用域内重置默认值。没有有效主题来源时，Input 保留 CSS-only 变量继承；无 theme 的 ConfigProvider 继续读取最近有效来源，不凭空覆盖 CSS 作用域。

## 注意事项

- 输入法组合期间不做计数裁剪，`compositionend` 后才统一裁剪并触发一次 `change`。
- 清空和密码切换使用可键盘操作、带当前语言名称的原生按钮；清空按钮的 `change` 事件里 `target.value` 固定为空串。
- 清空图标只在 undefined 时继续回退；null、false、0 均是显式内容。禁用、只读或空值时清空按钮不可操作。
- `Input.Group` 已废弃，请用 `Space.Compact`。
