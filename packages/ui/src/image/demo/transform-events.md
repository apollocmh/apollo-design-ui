---
order: 204
---
## zh-CN

通过顶层 `@transform="info => ..."` 接收当前旋转、缩放、翻转和位移的 `TransformInfo` 快照；`@transform.once` 使用标准 Vue 单次事件语义。Image 与 PreviewGroup 使用同一事件，组内子 Image 不重复通知。关闭预览会复位变换并通知复位快照；父级拒绝关闭时不复位。

原来未生效的 `preview.onTransform` 直接移除此配置字段，改用顶层事件，没有兼容通道。`TransformInfo` 可从 `@apollo-design/ui` 导入。

## en-US

Receive the current rotation, scale, flips and translation through top-level `@transform="info => ..."`. Its `TransformInfo` payload is a snapshot, and `@transform.once` follows standard Vue event semantics. Image and PreviewGroup share this event; grouped child Images do not duplicate it. Closing resets the transform and emits that snapshot. A parent declining a close request keeps the transform.

The ineffective `preview.onTransform` field is removed directly in favor of this event, without a compatibility channel. Import `TransformInfo` from `@apollo-design/ui`.
