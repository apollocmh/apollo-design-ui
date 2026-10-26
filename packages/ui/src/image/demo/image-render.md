---
order: 206
---
## zh-CN

使用原生 `#imageRender="info"` 模板扩展图片。通过 `<component :is="info.originNode" />` 保留真实 img、当前图源、尺寸、语义类名与加载机制，并显示当前说明。

更新按钮同时改变说明、alt、尺寸和本地 data URI 图源；相同结构下图片和输入草稿、焦点保持。插槽存在但有意为空时不恢复默认图片，移除插槽才恢复当前默认 img。第一部分主动关闭预览，用于观察原生组件事件；第二部分保留默认预览，group根内有独立可见的原生预览按钮，originNode保持普通img。输入和保存按钮可直接编辑，无需.stop；图片及非交互封面可点击预览，封面按钮保留原生点击，说明文字可选择。

外根使用有名称、可聚焦的 `role="group"`，通过标准 Vue `@click`、`@keydown`、`@error` 及各自的 `.once` 监听器显示次数和原始事件类型。输入框停止点击与键盘事件冒泡；关闭预览时，点击或按键不会触发 `update:open`，其计数保持为零。

顶层 `imageRender` 函数声明直接迁为此原生插槽，没有函数 prop 兼容通道；预览配置内部的同名字段不属于此次迁移。

第三部分完全替换originNode，仍提供独立可见的原生预览按钮，保留键盘入口；空槽不会补出此按钮。封面原生按钮使用主题文字/背景色，说明使用secondary文字以保持可读对比度。

## en-US

Extend the image with the native `#imageRender="info"` template. Render `<component :is="info.originNode" />` to preserve the real img, current source, dimensions, semantic class and loading behavior while adding the current caption.

The controls update caption, alt, dimensions and a local data URI source. With the same structure, the image node, input draft and focus remain. An intentionally empty slot suppresses the default image; removing the slot restores the current default img. The first part disables preview to inspect native component events. The second keeps preview enabled: a separate visible native preview button shares the group with the plain origin img, editors and save buttons. Native controls need no propagation modifiers. The image and noninteractive cover can open the preview, cover buttons retain their own clicks, and caption text remains selectable.

The root is a named, focusable `role="group"`. Standard Vue `@click`, `@keydown`, `@error` and their `.once` listeners show counts and original event types. The input stops click and keyboard propagation. With preview disabled, clicks and keys do not emit `update:open`, so its counter stays at zero.

The top-level `imageRender` function declaration is replaced directly by this native slot without a function-prop compatibility channel. Preview configuration fields with the same name are outside this migration.

The third part replaces originNode completely and retains a separate visible native preview button for keyboard access. Empty slots do not add it. The native cover button uses theme text/background colors, and captions use secondary text for readable contrast.
