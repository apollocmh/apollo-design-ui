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

见 [`demo/`](./demo)（20 个，与 antd 用户可见 demo 一一对应）。

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
