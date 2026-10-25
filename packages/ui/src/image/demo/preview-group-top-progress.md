---
order: 210
---
## zh-CN

通过原生 `#previewImage`、`#previewActions` 与 `#previewCount` 扩展预览大图、工具栏和计数。每个槽接收单对象信息，`originNode` 为原始VNode；用 `<component :is="info.originNode" />` 保留现有图片手势或默认工具栏。

示例保留可编辑说明及组内状态，工具栏用typed `actions.reset/zoomIn` 操作。`current` 为零基索引，显示时加1。空槽抑制默认内容，移除槽恢复默认。旧preview配置的imageRender/actionsRender/countRender及toolbarRender别名直接移除，无兼容层。

## en-US

Extend preview images, toolbars and counters through native `#previewImage`, `#previewActions` and `#previewCount`. Each slot receives one info object. Render its original VNode with `<component :is="info.originNode" />` to preserve image gestures or the default toolbar.

The editable caption and group state survive updates. Typed actions.reset/zoomIn operate the transform. The current index is zero-based; add one for display. Empty slots suppress defaults, while removing a slot restores them. Legacy preview renderer fields and the toolbarRender alias are removed directly without a compatibility channel.
