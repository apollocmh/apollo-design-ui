# Image / PreviewGroup 预览扩展迁移

适用于当前0.0.0未发布开发版。旧PreviewConfig声明的imageRender/actionsRender/countRender与toolbarRender未被实际消费；七条公开入口探针均失败。按ADR0006直接替换为Vue原生作用域槽，删除四个配置字段及ActionsRender旧类型，无兼容层、弃用期或隐藏回退。

| 旧配置 | 新模板扩展 |
|---|---|
| preview.imageRender(info) | Image/Group的#previewImage="info" |
| preview.actionsRender(originNode, info) | Image/Group的#previewActions="info" |
| preview.toolbarRender(originNode, info) | 同#previewActions，不保留别名 |
| preview.countRender(current, total) | Group的#previewCount="info" |

```vue
<Image src="photo.png" alt="Photo">
  <template #previewImage="info">
    <figure>
      <component :is="info.originNode" />
      <figcaption>{{ info.alt }}</figcaption>
    </figure>
  </template>
  <template #previewActions="info">
    <div>
      <component :is="info.originNode" />
      <button type="button" @click="info.actions.reset">Reset</button>
    </div>
  </template>
</Image>
```

Group使用相同大图/工具栏槽，并可提供计数：

```vue
<ImagePreviewGroup v-model:open="open" :items="images">
  <template #previewCount="{ current, total }">
    <span>Image {{ current + 1 }} of {{ total }}</span>
  </template>
</ImagePreviewGroup>
```

每个槽只有一个具名对象参数。originNode为真实VNode，预览原图保留ref、加载/手势与变换；src为原始可选src并包含fallback，未提供时为undefined。current始终为零基索引，与Group模型一致；单图为0/1。PreviewActionsInfo提供typed零参actions、当前transform快照、image.src/alt、icons与disabled缩放标志，不再提供unknown动作映射或onAction分派。

槽存在且为空时抑制默认内容，移除槽才恢复默认；函数在实际render时现读，不在setup/computed求值。SSR、闭合预览及Progress提前分支不调用预览扩展。Group拥有唯一预览，子Image的imageRender仍只管缩略图。编辑器方向键保留原生行为，普通预览方向键仍切图，Esc与子控件preventDefault按现有焦点契约处理。

根入口导出PreviewImageInfo、PreviewImageData、PreviewActionsInfo、PreviewActions、PreviewCountInfo和PreviewGroupSlots；ImageSlots也包含两个预览槽。真实模板、行为/类型、生产浏览器、消费端与剩余验收见 [报告](../audit/2026-10-25-image-preview-slots-remediation.md)。
