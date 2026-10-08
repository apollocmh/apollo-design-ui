---
title: Steps 步骤条
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

引导用户按照流程完成任务的导航条。

## 何时使用

- 任务需要分步执行，且步骤间有先后顺序。
- 需要向用户展示当前所处的流程位置与整体进度。

:::

## 代码演示

::: v-pre

**clickable**：设置 `onChange` 后，步骤条变为可点击状态（`role="button"` + 键盘可操作）。

:::

<DemoPreview component="steps" demo="clickable" />

::: v-pre

**component-token**：通过 ConfigProvider 覆盖 Steps 的 Component Token。

:::

<DemoPreview component="steps" demo="component-token" />

::: v-pre

**customized-progress-dot**：`#progressDot` 作用域插槽自定义点状步骤点（接收 `index/status/title/content`）。

:::

<DemoPreview component="steps" demo="customized-progress-dot" />

::: v-pre

**error**：使用 `status: 'error'` 指定某一步骤为错误状态。

:::

<DemoPreview component="steps" demo="error" />

::: v-pre

**icon**：通过 `items.icon` 自定义图标（数据 API，`h()` 程序化传 VNode）。

:::

<DemoPreview component="steps" demo="icon" />

::: v-pre

**inline**：行内步骤条（`type="inline"`，content 走 Tooltip）。

:::

<DemoPreview component="steps" demo="inline" />

::: v-pre

**max-count**：`maxCount` 限制最大展示步数（首/末/当前恒保留，其余折叠为省略步）。

:::

<DemoPreview component="steps" demo="max-count" />

::: v-pre

**nav**：导航类型的步骤条（`type="navigation"`）。

:::

<DemoPreview component="steps" demo="nav" />

::: v-pre

**panel**：面板类型（`type="panel"`，步间箭头分隔）。

:::

<DemoPreview component="steps" demo="panel" />

::: v-pre

**progress-debug**：调试用例：percent=100 的进度环。

:::

<DemoPreview component="steps" demo="progress-debug" />

::: v-pre

**progress-dot**：点状步骤条（`type="dot"`；函数形态自定义渲染用 `#progressDot` 作用域插槽）。

:::

<DemoPreview component="steps" demo="progress-dot" />

::: v-pre

**progress**：`percent` 配合当前 `process` 步显示进度环。

:::

<DemoPreview component="steps" demo="progress" />

::: v-pre

**simple**：最简单的用法。

:::

<DemoPreview component="steps" demo="simple" />

::: v-pre

**small**：`size="small"` 小号步骤条。

:::

<DemoPreview component="steps" demo="small" />

::: v-pre

**step-next**：配合按钮进行下一步操作（`onChange` 受控当前步）。

:::

<DemoPreview component="steps" demo="step-next" />

::: v-pre

**steps-in-steps**：嵌套步骤（antd 原例经 panel+children 嵌套；本仓 v1 以组合近似，见 README）。

:::

<DemoPreview component="steps" demo="steps-in-steps" />

::: v-pre

**style-class**：语义化 `classNames` / `styles`。

:::

<DemoPreview component="steps" demo="style-class" />

::: v-pre

**title-placement**：标题竖排（`titlePlacement="vertical"`；deprecated `labelPlacement` 同效）。

:::

<DemoPreview component="steps" demo="title-placement" />

::: v-pre

**variant-debug**：调试用例：`filled` / `outlined` 变体。

:::

<DemoPreview component="steps" demo="variant-debug" />

::: v-pre

**vertical**：竖直方向的步骤条（deprecated `direction` 同效）。

:::

<DemoPreview component="steps" demo="vertical" />

::: v-pre

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
| current | 当前步（从 0 计） | `number` | `0` |
| initial | 起始序号 | `number` | `0` |
| status | 当前步状态覆盖 | `'wait' \| 'process' \| 'finish' \| 'error'` | `'process'` |
| percent | 当前 process 步的进度环百分比 | `number` | — |
| maxCount | 最大展示步数（≥3，隐藏区段折叠为省略步） | `number` | — |
| responsive | 窄屏自动转竖向 | `boolean` | `true` |
| ellipsis / offset | 省略模式 / inline 偏移 | `boolean` / `number` | — |
| onChange | 点击步骤回调（使步骤可点击 + 键盘可操作） | `(current) => void` | — |
| direction / labelPlacement / progressDot | ⚠️ 已废弃（`orientation` / `titlePlacement` / `type="dot"`） | — | — |

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

## 设计说明

- **rc-steps 1.2.3 内核的 Vue 自建**（Steps/Step/StepIcon/Rail + useDisplaySteps 折叠算法）。
- **maxCount 折叠**：首/末/当前恒保留，其余按「当前左侧、当前右侧、首右侧、末左侧」
  距离优先补位；非连续区段渲染为禁用省略步（status 反映区段内 error/进度）。
- **rail 语义**：连线 status 取 **nextStatus**（通向下一步）。
- **差异**：Wave 点击波纹未实现（wave 基建缺失）、`components` 注入未接（app 壳），
  见 `COMPATIBILITY.md` D111 / README §3。

:::
