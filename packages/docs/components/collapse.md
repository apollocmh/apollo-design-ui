---
title: Collapse 折叠面板
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

内容分组折叠/展开的面板容器。

## 何时使用

- 分组收纳大段内容（FAQ、设置分区）。
- 手风琴（同时只展开一个）场景。

:::

## 代码演示

::: v-pre

**accordion**：`accordion` 同时只展开一个面板；根节点带 `role="tablist"`。

:::

<DemoPreview component="collapse" demo="accordion" />

::: v-pre

**basic**：`items` 数据驱动；点击 header 切换展开（默认可多开）。

:::

<DemoPreview component="collapse" demo="basic" />

::: v-pre

**borderless**：`bordered={false}` 去外框（分隔线保留）；`ghost` 全透明。

:::

<DemoPreview component="collapse" demo="borderless" />

::: v-pre

**extra**：`extra` 渲染在 header 右侧；`collapsible`: `'header'`（仅标题可点）/ `'icon'`（仅箭头）/ `'disabled'`（禁用）。

:::

<DemoPreview component="collapse" demo="extra" />

::: v-pre

## API

### Collapse

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| items | 面板列表（首选）：`{ key, label, children, collapsible?, extra?, showArrow?, forceRender?, destroyOnHidden?, onItemClick? }` | — | — |
| activeKey / defaultActiveKey | 受控/非受控展开项（string 匹配） | `string \| number \| (string \| number)[]` | — |
| accordion | 手风琴 | `boolean` | — |
| bordered | 边框 | `boolean` | `true` |
| ghost | 全透明 | `boolean` | — |
| size | `'large' \| 'middle' \| 'small'` | — | `'middle'` |
| collapsible | 全局交互模式：`'header'`（仅标题可点）/ `'icon'`（仅箭头）/ `'disabled'` | — | — |
| expandIcon | 自定义展开图标（panelProps 含 isActive/collapsible） | `(panelProps) => VNodeChild` | — |
| expandIconPlacement | 箭头位置 `'start' \| 'end'` | — | `'start'` |
| destroyOnHidden | 收起后销毁内容 | `boolean` | — |
| onChange | 展开项变化 | `(key: string[]) => void` | — |
| classNames / styles | 语义槽 `{ root, header, title, body, icon }` | — | — |

> ⚠️ deprecated：`destroyInactivePanel` ⇒ `destroyOnHidden`；`expandIconPosition` ⇒
> `expandIconPlacement`；`Collapse.Panel` children 形态与 `layout` 同理（保留可用但告警）。

### Collapse.Panel（children 形态，deprecated）

`header / showArrow / collapsible / forceRender / destroyOnHidden / headerClass`。

- `header`：文本主导 prop，收窄为 `string`；富内容走 `#header` 插槽。
- `extra`：原 VNode prop 已移除，富内容走 `#extra` 插槽。
- 面板内容：原 `children` React 遗留 prop 已移除，一律走**默认插槽**。

### Ref

`{ nativeElement: HTMLDivElement | null }`

## Theme（Component Token）

10 个（CSS 变量 `--apollo-collapse-*`）：`headerBg`(colorFillAlter) /
`contentBg`(colorBgContainer) / `headerPadding`(12px 16px) / `headerPaddingSM` /
`headerPaddingLG` / `contentPadding` / `contentPaddingSM` / `contentPaddingLG` /
`borderlessContentPadding` / `borderlessContentBg`(transparent)；派生
`collapsePanelBorderRadius = borderRadiusLG`。

## FAQ

**折叠动画怎么实现？**

`@apollo-design/motion` 的 `initCollapseMotion`：height `0 ↔ scrollHeight` +
opacity，时长 `motionDurationMid`。收起后的面板保留 DOM（`-panel-hidden`），
`destroyOnHidden` 才卸载。

:::
