---
order: 206
---
## zh-CN

使用原生 `#imageRender="info"` 模板扩展图片。通过 `<component :is="info.originNode" />` 保留真实 img、当前图源、尺寸、语义类名与加载机制，并显示当前说明。

更新按钮同时改变说明、alt、尺寸和本地 data URI 图源；相同结构下图片和输入草稿、焦点保持。插槽存在但有意为空时不恢复默认图片，移除插槽才恢复当前默认 img。示例含交互输入，因此关闭预览，避免将表单字段放在可预览按钮内。

顶层 `imageRender` 函数声明直接迁为此原生插槽，没有函数 prop 兼容通道；预览配置内部的同名字段不属于此次迁移。

## en-US

Extend the image with the native `#imageRender="info"` template. Render `<component :is="info.originNode" />` to preserve the real img, current source, dimensions, semantic class and loading behavior while adding the current caption.

The controls update caption, alt, dimensions and a local data URI source. With the same structure, the image node, input draft and focus remain. An intentionally empty slot suppresses the default image; removing the slot restores the current default img. Preview is disabled here because the slot contains an interactive form field.

The top-level `imageRender` function declaration is replaced directly by this native slot without a function-prop compatibility channel. Preview configuration fields with the same name are outside this migration.
