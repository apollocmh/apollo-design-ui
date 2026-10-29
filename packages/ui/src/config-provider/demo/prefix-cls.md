---
order: 1
title:
  zh-CN: 前缀
  en-US: prefixCls
---

默认类名前缀是 apollo，发布 CSS 仅包含该前缀。设置自定义前缀会更新 DOM 名称；样式需要构建期生成。

本示例的 prefix-cls.css 预先由 genComponentCss('empty', 'brand') 生成，作为静态文件引入。运行时只切换类名，不生成样式表。图标前缀独立由 iconPrefixCls 控制。
