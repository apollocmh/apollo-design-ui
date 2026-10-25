---
order: 203
---
## zh-CN

使用顶层 `v-model:open` 控制预览。父组件按钮直接更新模型；图片点击或预览关闭通过模型同步，`@open-change(next, prev)` 显示组件请求的前后状态。父组件直接赋值不会触发此事件。

另一个按钮按需挂载设置了顶层 `defaultOpen` 的非受控图片，展示初始打开状态；之后由组件管理开关。两种状态用法都不再放入 `preview` 配置对象。

## en-US

Control preview with top-level `v-model:open`. The parent button updates the model directly; image activation and preview closing update it through the component. `@open-change(next, prev)` shows the component's requested transition. Direct parent assignments do not emit this event.

The other button mounts an uncontrolled image with top-level `defaultOpen`, opening its preview initially. The component manages subsequent state. Both state APIs live outside the `preview` configuration object.
