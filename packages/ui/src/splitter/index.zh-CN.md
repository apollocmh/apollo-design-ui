---
category: 布局
title: Splitter
subtitle: 分割面板
---

可拖拽调整大小的面板分割容器。

## 何时使用

- 两侧/多栏布局需要用户手动调整占比（如 IDE 面板、详情页分栏）。
- 需要面板折叠/展开与尺寸约束（min/max）。

## 代码演示

见 [`demo/`](./demo)（4 个：basic / vertical / collapsible / multiple）。

## API

### Splitter

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| orientation | 分割方向 | `'horizontal' \| 'vertical'` | `'horizontal'` |
| vertical | 等价 `orientation="vertical"` | `boolean` | — |
| layout | ⚠️ 已废弃：用 `orientation` | `'horizontal' \| 'vertical'` | — |
| collapsible | 折叠全局配置 `{ motion?: boolean; icon?: { start?, end? } }`（motion 开启折叠过渡动画） | — | — |
| draggerIcon | 自定义拖拽手柄图标（替换默认 spinner） | `VNodeChild` | — |
| collapsibleIcon | ⚠️ 已废弃：用 `collapsible.icon` | — | — |
| lazy | 拖拽时只移动预览线，松手才提交尺寸 | `boolean` | — |
| destroyOnHidden | 面板折叠后销毁内容（Panel 可覆盖） | `boolean` | — |
| classNames / styles | 语义槽 `{ root, panel, dragger }`（dragger 支持 string 或 `{ default, active }`） | — | — |

### 事件

| 事件 | 说明 | 回调参数 |
|---|---|---|
| resize-start | 拖拽开始 | `(sizes: number[])` |
| resize | 拖拽中 / 折叠后 | `(sizes: number[])` |
| resize-end | 拖拽结束 | `(sizes: number[])` |
| collapse | 折叠状态变化 | `(collapsed: boolean[], sizes: number[])` |
| dragger-double-click | 双击把手 | `(index: number)` |

### Splitter.Panel

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| size | 受控尺寸（number px 或 `'50%'`） | `number \| string` | — |
| defaultSize | 非受控初始尺寸 | `number \| string` | — |
| min / max | 最小/最大尺寸（受控需配 `resize` 事件） | `number \| string` | — |
| collapsible | `boolean` 或 `{ start?, end?, showCollapsibleIcon? }`（图标显隐：`true`/`false`/`'auto'` 悬浮显隐） | — | — |
| resizable | 是否可拖拽调整 | `boolean` | `true` |
| destroyOnHidden | 折叠后销毁内容 | `boolean` | — |

### Ref

`{ nativeElement: HTMLDivElement | null }`

## Theme（Component Token）

4 个（CSS 变量 `--apollo-splitter-*`）：`splitBarSize`(2px 把手宽) /
`splitTriggerSize`(6px 热区) / `resizeSpinnerSize`(20px) /
`splitBarDraggableSize`(20px)。

## FAQ

**SSR / 首帧的面板尺寸是多少？**

容器未测量时使用开发者配置的原值（未配置 ⇒ `flex-basis: auto` 均分）；测量后由
归一化算法接管（`autoPtgSizes`：均分 / 缩放 / 贪婪填充，受 min/max 约束）。

**为什么 aria-valuenow 在 SSR 是 50？**

未测量时容器尺寸为 0，百分比归一化仍然成立（50/50）——与 antd 一致。
