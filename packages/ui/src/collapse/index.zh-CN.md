---
category: 数据展示
title: Collapse
subtitle: 折叠面板
---

内容分组折叠/展开的面板容器。

## 何时使用

- 分组收纳大段内容（FAQ、设置分区）。
- 手风琴（同时只展开一个）场景。

## 代码演示

见 [`demo/`](./demo)（4 个：basic / accordion / borderless / extra）。

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

`header / showArrow / extra / collapsible / forceRender / destroyOnHidden / headerClass`。

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
