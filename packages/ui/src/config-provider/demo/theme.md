---
order: 5
title:
  zh-CN: 主题
  en-US: theme
---

theme 支持 token、algorithm（单个或数组）、components、cssVarPrefix 和 inherit。示例使用显式 section 宿主，让完整内容与 Alias 变量在 SSR 同树；原生宿主 attrs/style 按原生规则合并。

默认无宿主时客户端向实际原生根投射变量，SSR 直接原生槽根可序列化；opaque 组件或纯文本需要显式宿主才能获得完整服务端 CSS 作用域。算法切换与 useTheme().config 可写 Ref 保留业务草稿，外部主题变更会恢复外部配置。组件令牌由各组件消费者落地，不在运行时生成 CSS 选择器。
