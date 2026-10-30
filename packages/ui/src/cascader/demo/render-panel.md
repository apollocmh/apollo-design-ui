---
order: 208
title:
  zh-CN: 自定义面板
  en-US: Render Panel
---

`#popupRender="{ menu }"` 接收级联面板 VNode，以 `<component :is="menu" />` 渲染，并在其外层插入自定义头部与底部：头部显示面板标题，底部展示当前选择并提供清空按钮。
