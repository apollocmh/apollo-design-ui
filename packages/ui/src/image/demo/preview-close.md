---
order: 206
---
## zh-CN

Image 与 PreviewGroup 通过原生 `#previewCloseIcon` 定制关闭图标。槽存在时优先于 `preview.closeIcon` 和 `preview.icons.close`，有意为空也不回退；移除槽恢复配置或默认图标。按钮独立保留可访问名称。

示例在槽图标、空槽、VNode 配置、隐藏按钮和默认图标间循环。`preview.closable=false` 只隐藏关闭按钮且不求值图标槽；Esc、遮罩和工具栏关闭动作仍按各自契约工作。打开时切换不会重挂图片、清除编辑内容或复位变换。

## en-US

Use native `#previewCloseIcon` on Image or PreviewGroup to customize the close icon. A present slot takes priority over `preview.closeIcon` and `preview.icons.close`, including an intentionally empty result. Removing it restores configured or default content. The button retains its own accessible name.

Cycle through a slot icon, an empty slot, VNode configuration, a hidden button and the default icon. `preview.closable=false` hides only the close button and does not evaluate the icon slot; Escape, mask and toolbar close actions keep their own behavior. Live changes retain the image, editable note and transform.
