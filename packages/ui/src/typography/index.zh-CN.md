---
category: 通用
title: Typography
subtitle: 排版
---

标题、段落、行内文本和链接，支持复制、编辑及省略。

## 代码演示

14 个示例覆盖基础排版、五级标题、语义色、复制、编辑、受控省略、中间省略、后缀、组件 Token、语义样式和 Table 消费场景。

## API

```ts
import { Typography, Text, Title, Paragraph, Link } from '@apollo-design/ui';
import '@apollo-design/ui/style.css';
```

具名组件与 `Typography.Text / Title / Paragraph / Link` 是同一组件。按需样式入口为 `@apollo-design/ui/typography/style.css`；应用仍需加载主题及基础样式。

### 组件与内容

| 组件 | 根元素 | 能力 |
|---|---|---|
| Typography | `article`；可用 `component` 指定标签 | 排版容器、语义样式 |
| Text | `span` | 装饰、复制、编辑、单行省略 |
| Title | `h1`…`h5` | 装饰、复制、编辑、省略；`level` 默认 1 |
| Paragraph | `div` | 装饰、复制、编辑、多行省略 |
| Link | `span` 外壳，内含原生 `a` | 原生链接及装饰、复制、编辑、布尔省略 |

五个组件均使用默认插槽，可传文本、Fragment、条件节点、原生元素和 Vue 组件。四个固定语义组件不接受 `component`；需要自定义容器标签使用 Typography。Title 不接受 `strong`。

Link 的复制/编辑按钮是原生链接的兄弟节点，避免交互控件嵌套。`href`、`target`、`rel`、链接 ARIA、`tabindex` 和原生事件作用于 `a`；`id`、`class`、`style` 和 expose 作用于外壳。`target="_blank"` 且未指定 `rel` 时补 `noopener noreferrer`。禁用链接设置 `aria-disabled`、退出 Tab 顺序并阻止激活。

### 公共 Props 与原生 attrs

| 参数 | 类型 / 默认值 | 说明 |
|---|---|---|
| prefixCls | `string` | 当前 ConfigProvider 前缀，默认 `apollo-typography` |
| direction | `'ltr' \| 'rtl'` | 默认使用当前 Provider |
| classNames | 对象或 `({ props }) => 对象` | `root / actions / action / textarea` 类名 |
| styles | 对象或 `({ props }) => 对象` | 同名语义节点的 Vue CSSProperties |
| component | `string`，默认 `article` | 仅 Typography |

根 `class` / `style` / `id` / `data-*` 使用 Vue 原生 attrs；支持动态替换及移除。类名合并，原生 style 覆盖 `styles.root`。语义函数的 `props` 为 `BaseTypographyProps`。ConfigProvider 的 `components.typography` 可提供类名、样式及语义配置；配置替换、函数式配置及移除不重建业务插槽或正在编辑的输入框。

### Text / Title / Paragraph / Link

| 参数 | 类型 / 默认值 | 说明 |
|---|---|---|
| type | `'secondary' \| 'success' \| 'warning' \| 'danger'` | 语义文字色 |
| disabled | `boolean`，false | 禁用样式；Link 同时阻止导航 |
| copyable | `boolean \| CopyConfig` | 复制 |
| editable | `boolean \| EditConfig` | 编辑 |
| ellipsis | `boolean \| EllipsisConfig` | Text 排除 rows / expandable / onExpand；Link 仅布尔 |
| strong / underline / delete / code / mark / keyboard / italic | `boolean`，false | 七种文本装饰；Title 排除 strong |
| actions | `{ placement?: 'start' \| 'end' }` | 操作区位置，默认 end |
| title | `string` | 原生标题及省略提示候选 |
| level | `1 \| 2 \| 3 \| 4 \| 5`，1 | 仅 Title |
| target / rel | `string` | 仅 Link；href 使用原生 attrs |

### CopyConfig

| 字段 | 类型 / 默认值 | 行为 |
|---|---|---|
| text | `string \| (() => string \| Promise<string>)` | 未提供时读取内容文本；空字符串会复制空文本 |
| onCopy | `(event?: MouseEvent) => void` | 实际写入成功后调用 |
| icon / tooltips | `VNodeChild \| [VNodeChild, VNodeChild]` | 长度为 2 的数组表示未复制/已复制；其他长度保留为完整节点内容 |
| format | `'text/plain' \| 'text/html'` | 剪贴板格式 |
| tabIndex | `number` | 复制按钮 Tab 顺序 |

`tooltips: false` 关闭提示。默认提示读取当前语言。一次异步复制未完成时拒绝重复请求；失败不显示复制成功，卸载后不更新状态或发送完成回调。自定义图标仍保留原生按钮和可访问名称。

### EditConfig

| 字段 | 类型 / 默认值 | 行为 |
|---|---|---|
| text | `string` | 编辑初值；未提供时使用可识别的纯文本内容 |
| editing | `boolean` | 受控编辑态；省略时为非受控 |
| onStart / onCancel / onEnd | `() => void` | 进入、取消、Enter 保存完成 |
| onChange | `(value: string) => void` | Enter 或失焦保存；首尾空白被移除，内部换行保留 |
| icon / tooltip / enterIcon | `VNodeChild` | 编辑图标、完整提示内容、确认图标；tooltip false 关闭提示，enterIcon null 隐藏 |
| triggerType | `('icon' \| 'text')[]`，`['icon']` | text 模式仍提供可聚焦的原生编辑按钮 |
| autoSize | `boolean \| { minRows?: number; maxRows?: number }`，true | 原生 textarea 高度随内容、宽度和当前配置变化 |
| maxLength / tabIndex | `number` | 编辑框长度限制 / 编辑按钮 Tab 顺序 |

编辑框填满其宿主宽度，并保留确认图标所需空间；`autoSize: false` 仍显示完整的一行。边框、背景及焦点读取当前主题，`styles.textarea` 可显式覆盖原生样式。

Enter 保存，Escape 取消；带修饰键的 Enter 保留原生换行，IME 组合期间不提交。受控模式中回调仅通知请求，父组件决定是否关闭。键盘完成后恢复所属编辑按钮焦点；失焦至外部控件时保留外部焦点。

`aria-label` / `aria-labelledby` / `aria-describedby` 传给实际 textarea。未提供名称时使用纯文本内容或当前语言的编辑文案。编辑态保留根 attrs 和实际根 expose。

### EllipsisConfig

| 字段 | 类型 / 默认值 | 行为 |
|---|---|---|
| rows | `number`，1 | 正有限值向下取整，非法值回退 1 |
| expandable | `boolean \| 'collapsible'`，false | 可展开；collapsible 支持再次收起 |
| suffix | `string` | 省略后的后缀 |
| symbol | `VNodeChild \| ((expanded: boolean) => VNodeChild)` | 展开/收起按钮内容 |
| expanded / defaultExpanded | `boolean` | 受控值 / 非受控初值 |
| onExpand | `(event: MouseEvent, info: { expanded: boolean }) => void` | 展开请求 |
| onEllipsis | `(ellipsis: boolean) => void` | 实际省略状态变化时调用 |
| tooltip | `VNodeChild \| { title?: VNodeChild }` | true 使用原内容；false 关闭 |

简单情况使用 CSS；需要操作区、后缀或展开时按实际宽度测量。隐藏测量区使用已挂载内容的原生 DOM 投影，不再次挂载业务组件。动态宽度、行数、内容和字体变化会重新测量，过期测量及卸载任务取消。

### Slots / Emits / v-model / Expose

唯一公共插槽是 `default`。没有组件 emits 或 v-model；编辑和展开通过各自配置的受控值与回调表达。`TypographyRef.nativeElement` 是只读的当前实际根元素或 null，包含编辑态；Link 返回外壳。

### 组件 Token

通过 `ConfigProvider :theme="{ components: { Typography: { titleMarginTop: 0, titleMarginBottom: '0.8em' } } }"` 设置。数字按 px 处理，支持 0、配置替换和移除。

| Token | 默认值 | 消费位置 |
|---|---|---|
| titleMarginTop | `1.2em` | 内容后标题的上间距 |
| titleMarginBottom | `0.5em` | 标题下间距 |

默认语义文字和操作文字随当前主题保持可读对比。原生 style 是用户显式覆盖；使用自定义前景色时需与背景配对。
