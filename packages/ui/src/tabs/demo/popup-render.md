---
order: 203
title:
  zh-CN: 自定义溢出菜单
  en-US: Custom overflow popup
---

使用 `#popupRender="{ originNode, restTabs, onClose }"` 接收原始菜单、隐藏页签和关闭动作。可在挂载后添加或移除插槽；空插槽隐藏内容，不回退默认菜单。原始菜单保留页签选择行为。

<!-- en-US -->

Use the named slot object to access the original menu, hidden tabs and close action. Add or remove the slot after mount; an empty slot suppresses the default menu. The original menu retains tab selection.
