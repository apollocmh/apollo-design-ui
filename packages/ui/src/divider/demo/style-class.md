---
order: 8
title:
  zh-CN: 自定义语义结构的样式和类
  en-US: Style & Class
---

`classNames` / `styles` 支持 root / rail / content 三个语义区域，也支持 `(info: { props }) => 对象`。函数接收当前有效方向、位置和尺寸；原生选择框更新 size，立即改变样式函数结果。类名拼接，样式按来源顺序覆盖，原生根 style 优先。
