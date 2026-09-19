---
order: 4
title:
  zh-CN: 尺寸与全局禁用
  en-US: componentSize / componentDisabled
---

`componentSize` 与 `componentDisabled` 是**两条独立的 context**（与 antd 同），
下游用 `useSize()` / `useDisabled()` / `useConfig()` 读取。

两条判据**不同**，不能统一（这是最容易写错的地方）：

| 开关 | 判据 | 为什么 |
|---|---|---|
| `componentSize` | `componentSize \|\| 父级` | 未设置就继承 |
| `componentDisabled` | `componentDisabled ?? 父级` | `false` 必须能**显式关闭**父级的 `true` |

⚠️ 返回值是 `ComputedRef`（要 `.value`），不是 antd 那样的裸值 ——
裸值在 Vue 里等于把配置在 setup 期定死（差异 D27）。
