---
order: 200
title:
  zh-CN: 高级搜索
  en-US: Advanced search
---

使用 `Row` / `Col` 栅格把多个 `Form.Item` 排成筛选区，并通过 `v-show` 控制「展开更多筛选」。`Form` 的 `@finish` 会回传所有字段值，`useForm` 返回的 `resetFields()` 用于重置查询条件。所有输入控件都带 `aria-label`，便于辅助技术识别。
