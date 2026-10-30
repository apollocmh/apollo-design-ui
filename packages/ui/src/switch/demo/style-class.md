---
order: 5
title:
  zh-CN: 语义化样式
  en-US: Semantic styles
---

通过 `classNames` / `styles` 自定义三槽（root / content / indicator）；两者都支持对象与
函数两种形态，函数形态能拿到合并后的 props（如 `size`）。

最后一个开关从 `ConfigProvider.components.switch` 读取根样式和语义配置，切换时函数样式会随当前 `checked` 更新。
