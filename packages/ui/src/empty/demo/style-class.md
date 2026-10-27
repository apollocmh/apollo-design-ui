---
order: 5
title:
  zh-CN: 语义化类名与样式
  en-US: Style & Class
---

classNames/styles 覆盖 root、image、description、footer 四个区域。局部函数式语义配置接收当前 props；勾选后说明文字与字重同步更新。

背景和文字使用成对的主题 Token。根样式优先级为 Provider styles.root → Provider style → 局部 styles.root → 原生根 style，其他区域由局部语义覆盖 Provider。
