# Image / PreviewGroup 变换事件迁移

适用于当前0.0.0未发布开发版。旧PreviewConfig声明onTransform，但两个公开入口都没有接线；内部Preview还在setup固定回调。按Vue公共契约直接使用顶层typed transform事件，移除旧配置字段，无兼容层、弃用期或第二通知来源。

旧写法（原先不会收到通知）：

```vue
<Image :preview="{ onTransform: recordTransform }" />
```

新写法（ImagePreviewGroup使用同一事件）：

```vue
<script setup lang="ts">
import { Image, type TransformInfo } from '@apollo-design/ui';
function recordTransform(info: TransformInfo) {
  console.log(info.rotate, info.scale, info.flipX, info.flipY, info.x, info.y);
}
</script>

<template>
  <Image src="image.png" alt="Preview example" @transform="recordTransform" />
</template>
```

每次变换更新提供完整快照，后续操作不修改已交付的payload。打开及监听器更换不伪造变换；接受关闭时通知复位快照，受控父级拒绝关闭则保持变换且不发复位。Group只通知Group监听器，子Image不重复发送。根DOM的同名事件不混入业务通知；监听器数组、替换/移除及@transform.once均使用标准Vue事件语义。

原生模板实际类型、运行回归、生产浏览器与发布消费端证据见 [整改报告](../audit/2026-10-25-image-transform-event-remediation.md)。afterOpenChange与渲染扩展不夹带迁移。
