---
category: 反馈
title: Result
subtitle: 结果页
---

结果页用于对用户的操作进行反馈，以及作为结果反馈页面。

## 何时使用

- 当有重要操作需告知用户处理结果，且反馈内容较为复杂时使用。

## 代码演示

见 [`demo/`](./demo)（9 个，与 antd 非 debug demo 一一对应）。

| demo | 内容 |
|---|---|
| `success` | 成功 |
| `info` | 信息提示 |
| `warning` | 警告 |
| `403` / `404` / `500` | 异常页面（静态插画） |
| `error` | 失败（含 body 内容区） |
| `custom-icon` | 自定义 icon |
| `style-class` | 自定义语义结构的样式和类 |

## API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| status | 结果状态，决定图标与颜色（异常值渲染静态插画） | `'success' \| 'error' \| 'info' \| 'warning' \| '403' \| '404' \| '500'` | `'info'` |
| icon | 自定义图标开关：`null`/`false` 显式禁用；自定义图标用 `#icon` 插槽（C8-R2） | `boolean \| null` | — |
| title | 标题文本（富内容用 `#title` 插槽，slot 优先） | `string` | — |
| subTitle | 副标题文本（富内容用 `#subTitle` 插槽，slot 优先） | `string` | — |
| classNames / styles | 语义槽位（root / title / subTitle / body / extra / icon） | — | — |

### Slots

- `#icon` —— 自定义状态图标（覆盖默认图标）。
- `#title` / `#subTitle` —— 富文本标题 / 副标题。
- `#extra` —— 操作区。
- 默认插槽 —— 正文内容区。

### 静态导出

- `PRESENTED_IMAGE_403 / 404 / 500`：异常插画组件（与 antd 同名常量对应）。
- `IconMap` / `ExceptionMap`：状态 → 图标/插画映射。

## 设计说明

- 插画为静态 hex（与 antd 一致，不随主题变化）；Empty 的插画则随主题 token 化 —— 两者不同源。
- 宿主的 `nativeElement` 经组件实例暴露。
