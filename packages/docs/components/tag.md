---
title: Tag 标签
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

进行标记和分类的小标签。

## 何时使用

- 用于标记事物的属性和维度。
- 进行分类。

:::

## 代码演示

::: v-pre

**animation**：关闭标签（关闭后 DOM 保留，`-hidden` 类隐藏 —— antd 逐字语义）。

:::

<DemoPreview component="tag" demo="animation" />

::: v-pre

**basic**：最简单的用法（含链接、阻止默认关闭行为）。

:::

<DemoPreview component="tag" demo="basic" />

::: v-pre

**checkable**：CheckableTag 与 CheckableTagGroup（单选 / 多选）。

:::

<DemoPreview component="tag" demo="checkable" />

::: v-pre

**colorful**：三种 variant ×（预设色 / 状态色 / 自定义色）。

:::

<DemoPreview component="tag" demo="colorful" />

::: v-pre

**control**：用数组生成一组标签，动态添加和关闭。

:::

<DemoPreview component="tag" demo="control" />

::: v-pre

**customize**：自定义图标与颜色的组合。

:::

<DemoPreview component="tag" demo="customize" />

::: v-pre

**disabled**：禁用状态的标签（关闭按钮与交互均禁用）。

:::

<DemoPreview component="tag" demo="disabled" />

::: v-pre

**draggable**：拖拽排序（antd 用 @dnd-kit 实现；此处用 HTML5 原生拖拽等价替换）。

:::

<DemoPreview component="tag" demo="draggable" />

::: v-pre

**icon**：带图标的标签（裸 svg 的居中修正见样式层 `> svg` 规则）。

:::

<DemoPreview component="tag" demo="icon" />

::: v-pre

**status**：状态色（success / processing / warning / error）× 三 variant。

:::

<DemoPreview component="tag" demo="status" />

::: v-pre

**style-class**：通过 `classNames` / `styles` 自定义语义结构。

:::

<DemoPreview component="tag" demo="style-class" />

::: v-pre

## API

### Tag

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| color | 预设色键或任意色串（`-inverse` 后缀 → solid） | `string` | — |
| variant | 变体 | `'filled' \| 'solid' \| 'outlined'` | `'filled'` |
| closable | 可关闭（布尔或配置对象） | `boolean \| {closeIcon, disabled}` | — |
| closeIcon | 自定义关闭图标 | `VNodeChild` | CloseOutlined |
| onClose | 关闭回调（`preventDefault` 阻止关闭） | `(e: MouseEvent) => void` | — |
| icon | 标签图标 | `VNodeChild` | — |
| href / target | 链接模式（渲染 `<a>`） | `string` | — |
| disabled | 禁用 | `boolean` | `false` |
| bordered | **已废弃** → `variant=\"filled\"` | `boolean` | — |
| classNames / styles | 语义槽位（root / icon / content / close） | — | — |

### CheckableTag

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| checked | 选中状态 | `boolean` | `false` |
| onChange | 勾选变化（点击或空格键） | `(checked: boolean) => void` | — |

### CheckableTagGroup

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| options | 选项（原始值或 `{value, label, className, style}`） | `(string \| number \| Option)[]` | — |
| value / defaultValue | 选中值（单选为值或 null；多选为数组） | — | — |
| multiple | 多选 | `boolean` | `false` |
| onChange | 值变化 | `(value) => void` | — |

## Theme

### Component Token（3 个）

| Token | 默认值 | 说明 |
|---|---|---|
| defaultBg | `#f5f5f5` | 默认底色 |
| defaultColor | `var(--color-text)` | 默认文字色 |
| solidTextColor | `#fff` | solid 变体文字色 |

## 设计说明

- 关闭后 **DOM 保留**（`-hidden` 类隐藏）—— antd 逐字语义。
- 预设色走类名（`-blue` 等）+ 三 variant 规则；任意色串走动态内联
  （浅底为 `hsl.l=0.95` 计算）。
- Wave 点击波纹暂未实现（无静态 DOM 差异）。

:::
