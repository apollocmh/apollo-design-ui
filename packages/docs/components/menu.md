---
title: Menu 导航菜单
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

为页面和功能提供导航的菜单列表。

## 何时使用

- 需要为网站提供全局性的导航菜单（顶部/侧边）。
- 支持水平/垂直/内嵌三种模式与亮暗双主题。

:::

## 代码演示

::: v-pre

**component-token**：Component Token

:::

<DemoPreview component="menu" demo="component-token" />

::: v-pre

**extra-style**：Extra

:::

<DemoPreview component="menu" demo="extra-style" />

::: v-pre

**horizontal-dark**：Horizontal Dark

:::

<DemoPreview component="menu" demo="horizontal-dark" />

::: v-pre

**horizontal**：Horizontal

:::

<DemoPreview component="menu" demo="horizontal" />

::: v-pre

**inline-collapsed**：Inline collapsed

:::

<DemoPreview component="menu" demo="inline-collapsed" />

::: v-pre

**inline**：Inline

:::

<DemoPreview component="menu" demo="inline" />

::: v-pre

**sider-current**：With Layout.Sider

:::

<DemoPreview component="menu" demo="sider-current" />

::: v-pre

**style-class**：Custom style

:::

<DemoPreview component="menu" demo="style-class" />

::: v-pre

**submenu-theme**：Submenu theme

:::

<DemoPreview component="menu" demo="submenu-theme" />

::: v-pre

**switch-mode**：Switch mode

:::

<DemoPreview component="menu" demo="switch-mode" />

::: v-pre

**theme**：Theme

:::

<DemoPreview component="menu" demo="theme" />

::: v-pre

**tooltip**：Tooltip

:::

<DemoPreview component="menu" demo="tooltip" />

::: v-pre

**vertical**：Vertical

:::

<DemoPreview component="menu" demo="vertical" />

::: v-pre

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| items | 菜单内容（唯一真源） | `ItemType[]` | — |
| mode | 菜单类型 | `'horizontal' \| 'vertical' \| 'inline'` | `'vertical'` |
| theme | 主题 | `'light' \| 'dark'` | `'light'` |
| selectedKeys / defaultSelectedKeys | 受控/非受控选中（`v-model:selectedKeys`） | `string[]` | — |
| openKeys / defaultOpenKeys | 受控/非受控展开（`v-model:openKeys`） | `string[]` | — |
| onSelect / onDeselect / onClick | 选择事件（keyPath 为 **逆序**，antd 同款） | — | — |
| onOpenChange | 子菜单展开回调 | `(openKeys) => void` | — |
| selectable / multiple | 是否可选中 / 多选 | `boolean` | `true` / `false` |
| inlineCollapsed | 折叠为图标条（配合 Tooltip 显示标题） | `boolean` | — |
| inlineIndent | 缩进（px） | `number` | `24` |
| triggerSubMenuAction | 子菜单触发方式 | `'hover' \| 'click'` | `'hover'` |
| disabledOverflow | 关闭水平溢出折叠 | `boolean` | `false` |
| classNames / styles | 语义槽 `root/list/itemTitle/item/itemIcon/itemContent`（+popup/subMenu） | — | — |

### ItemType

```ts
{ key, label, icon?, danger?, disabled?, extra?, children?, type?: 'group' | 'divider' }
```

### Slots（C8-R2）

静态子组件 `AMenuItem` / `AMenu.SubMenu` 的富内容改走 slot（与 antd 的 VNode prop 对齐）：

| 组件 | Slot | 说明 | 对应原 prop |
|---|---|---|---|
| AMenuItem / AMenu.SubMenu | `#title` | 标题富内容（文本可仍用 `title` prop，slot 优先） | `title` |
| AMenuItem | `#extra` | 右侧附加内容（富内容） | `extra` |

> `title` prop 已收窄为 `string`（数据载体）；`extra` prop 已删除，富内容统一走 `items[].extra` 或 `#extra` slot。

### Expose

`focus(options?)`、`list`、`findItem({key})`。

## 设计说明

- **rc-menu 内核自建**：items 解析 / key↔path 登记 / 键盘导航三件 engine，
  Overflow 溢出折叠为新基建（`_internal/overflow.ts`）。
- **差异**：D87–D90（COMPATIBILITY §9.2）；已知缺口见 [`README.md`](./README.md) §3。

:::
