---
category: 导航
title: Steps
subtitle: 步骤条
---

引导用户按照流程完成任务的导航条。

## 何时使用

- 任务需要分步执行，且步骤间有先后顺序。
- 需要向用户展示当前所处的流程位置与整体进度。

## 代码演示

见 [`demo/`](./demo)（21 个，包含原生作用域槽场景）。

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| items | 步骤数据（`title/subTitle/content/icon/status/disabled/onClick` 等；VNode 经 `h()` 程序化传入） | `StepItem[]` | — |
| type | 类型 | `'default' \| 'navigation' \| 'inline' \| 'panel' \| 'dot'` | `'default'` |
| variant | 变体 | `'filled' \| 'outlined'` | `'filled'` |
| size | 尺寸（`default` 已废弃 ⇒ `medium`） | `'small' \| 'medium' \| 'middle' \| 'default'` | `'middle'` |
| orientation | 方向 | `'horizontal' \| 'vertical'` | `'horizontal'` |
| titlePlacement | 标题位置（dot/vertical 下自动推导） | `'horizontal' \| 'vertical'` | `'horizontal'` |
| current | 当前步（从 0 计），支持 `v-model:current` | `number` | `0` |
| initial | 起始序号 | `number` | `0` |
| status | 当前步状态覆盖 | `'wait' \| 'process' \| 'finish' \| 'error'` | `'process'` |
| percent | 当前 process 步的进度环百分比 | `number` | — |
| maxCount | 最大展示步数（≥3，隐藏区段折叠为省略步） | `number` | — |
| responsive | 窄屏自动转竖向 | `boolean` | `true` |
| ellipsis / offset | 省略模式 / inline 偏移 | `boolean` / `number` | — |
| prefixCls | DOM 类名前缀，自定义值需配套静态样式 | `string` | `'apollo-steps'` |
| classNames / styles | 十个语义区域的类名/样式，支持读取当前解析后 props 的函数 | `StepsProps['classNames']` / `StepsProps['styles']` | — |
| direction / labelPlacement / progressDot | ⚠️ 已废弃（`orientation` / `titlePlacement` / `type="dot"`） | — | — |

### Events

| 事件 | 说明 | 参数 |
|---|---|---|
| change | 请求切换到不同步骤；监听此事件使非禁用步骤可点击并支持 Enter/空格 | `(current: number)` |
| update:current | `v-model:current` 更新请求，也启用非禁用步骤的点击和键盘操作 | `(current: number)` |

`current` 始终由父级控制，事件只提出请求；父级未更新时当前步骤保持不变。模板可直接使用 `v-model:current`，或使用 `@change`，支持 `.once` 和监听器数组。原生根节点的 `change` 不会触发该业务事件；根 `@click` 仍接收原生 MouseEvent。`items.onClick` 是数据项回调，接收 MouseEvent，禁用项不会调用。

### Slots

| 插槽 | 说明 | 参数 |
|---|---|---|
| #iconRender | 自定义图标渲染（替换默认图标节点） | `{ iconNode, index, active, item }` |
| #itemRender | 包装整步节点 | `{ itemNode, index, active, item }` |
| #itemWrapperRender | 包装 wrapper 层 | `{ itemNode }` |
| #progressDot | 点状步骤点自定义渲染（deprecated `progressDot` 函数形态的对应物） | `{ iconNode, index, status, title, description, content }` |

> ⚠️ C8-R2：antd 的 `iconRender` / `itemRender` / `itemWrapperRender` /
> `progressDot(fn)` 在本仓**一律是作用域插槽**，不保留同名 prop。`items` 数组字段
> （`icon` 等）是数据 API，`h()` 程序化传 VNode 合法。

四个槽均接收表中单个具名对象，组件声明与原生Vue模板可精确推断作用域；返回值为VNodeChild。显式空槽覆盖对应节点，动态移除恢复默认渲染。items提供条目数据，不提供未实现的默认内容槽；之前StepsSlots.default的空声明已直接移除。内联模式有正文时默认显示Tooltip，无需额外itemRender；自定义itemRender也能安全渲染itemNode。详见[原生槽记录](../../../../docs/migrations/steps-native-slots.md)。

## 设计说明

- **rc-steps 1.2.3 内核的 Vue 自建**（Steps/Step/StepIcon/Rail + useDisplaySteps 折叠算法）。
- **maxCount 折叠**：首/末/当前恒保留，其余按「当前左侧、当前右侧、首右侧、末左侧」
  距离优先补位；非连续区段渲染为禁用省略步（status 反映区段内 error/进度）。
- **rail 语义**：连线 status 取 **nextStatus**（通向下一步）。
- **差异**：Wave 点击波纹未实现（wave 基建缺失）、`components` 注入未接（app 壳），
  见组件 README。

## 响应性

items、current、initial 和 maxCount 变化后重新派生可见项、折叠和当前状态，点击动作使用当前索引。class/style 在 render 中读取，支持 Vue 字符串、对象和数组 style；同名 styles.root 仍按既有顺序覆盖原生 style。classNames/styles 支持文档化的函数形态，读取当前解析后的 props。Steps 没有 large 尺寸，全局 large 默认值按 medium 解析。

responsive 可在挂载后由 false 切为 true，立即按当前视口调整方向，无需等待 resize；再关闭时恢复显式/默认方向。

## 主题 Token

`ConfigProvider.theme.components.Steps` 支持 `descriptionMaxWidth`、`customIconFontSize`、`iconSize`、`iconFontSize`、`dotSize`、`dotCurrentSize`、`navArrowColor`、`navContentMaxWidth`、`iconSizeSM` 九个实际消费字段。组件在自身根节点消费当前主题，支持替换、移除和嵌套作用域；`descriptionMaxWidth` 已废弃但仍保留现有行为。显式原生 style 和 styles.root 可覆盖同名主题变量，styles.root 继续最后生效。图标数据 `0` 显示为零，`false`/空字符串有意隐藏图标；省略 icon 后恢复默认序号。

开发版 `0.0.0` 直接移除 `customIconSize`、`customIconTop`、`iconTop`、`titleLineHeight` 四个无效历史 Token：旧设置从未被 CSS 消费，现不再声明或生成。请使用 `iconSize`/`customIconFontSize` 或现有语义 styles 定制图标；不提供兼容层或弃用期。原 `onChange` 手调通道统一由 Vue `change` emits 处理，`h(Steps, { onChange })` 写法与数字载荷保持，模板使用 `@change`。
