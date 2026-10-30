---
order: 202
title:
  zh-CN: 组件 Token
  en-US: Component token
---

通过 `ConfigProvider theme.components.Form` 设置组件 Token；当前配置会同步作用于 Form 和独立 Form.Item，配置替换或撤除后也会更新。示例共用一份配置展示 vertical 与 inline 布局。需要局部覆盖时仍可在 Form 或 Form.Item 的原生 `style` 中设置 `--apollo-form-*` CSS 变量。
