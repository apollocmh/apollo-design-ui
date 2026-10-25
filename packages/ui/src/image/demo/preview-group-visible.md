---
order: 211
---
## zh-CN

通过顶层 `v-model:open` 与 `v-model:current` 同步预览开关和当前图片索引。父组件按钮可直接打开、关闭或选择下一张；预览内部的关闭与切换则通过模型回传，并分别触发 `@open-change(next, prev)`、`@change(next, prev)`。示例显示当前模型与事件的前后状态，父组件直接赋值不触发组件变更事件。

状态不再放入 `preview` 配置，也不使用 `visible` 或配置对象内的回调。

## en-US

Use top-level `v-model:open` and `v-model:current` to synchronize preview state and the current image index. Parent controls open, close or select the next image directly. Closing or switching inside the preview updates the models and emits `@open-change(next, prev)` or `@change(next, prev)`. The example displays both current models and event transitions; direct parent assignments do not emit component change events.

State lives outside the `preview` configuration, without `visible` or state callbacks inside the configuration object.
