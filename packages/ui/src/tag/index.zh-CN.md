---
category: 数据展示
title: Tag
subtitle: 标签
---

进行标记和分类的小标签。

## 何时使用

- 用于标记事物的属性和维度。
- 进行分类。

## 代码演示

见 [`demo/`](./demo)（11 个，与 antd 非 debug demo 一一对应）。

| demo | 内容 |
|---|---|
| `basic` | 基本用法（链接 / 阻止默认关闭） |
| `checkable` | 可勾选（CheckableTag / Group 单选多选） |
| `colorful` | 多彩标签（3 variant × 预设/状态/自定义色） |
| `control` | 动态添加和关闭 |
| `customize` | 自定义图标与颜色 |
| `disabled` | 禁用 |
| `draggable` | 可拖拽（原生拖拽等价） |
| `icon` | 图标 |
| `status` | 状态色 |
| `style-class` | 自定义语义结构的样式和类 |
| `animation` | 关闭动画 |

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
