# Image 缩略图原生槽迁移

当前0.0.0未发布开发版按ADR 0006直接迁移，无函数兼容层或弃用期。

旧顶层ImageProps.imageRender只有类型/文档声明，Image.ts没有消费它；原image-render Demo也未使用该声明。不能把旧声明当成已有可用行为。顶层函数prop直接删除，以原生 `#imageRender` 实现缩略图扩展。

```vue
<!-- 旧声明写法（原实现未消费） -->
<Image :image-render="renderThumbnail" />
<!-- 新写法 -->
<Image src="/photo.png" alt="Photo">
  <template #imageRender="{ originNode, src }">
    <figure><component :is="originNode" /><figcaption>{{ src }}</figcaption></figure>
  </template>
</Image>
```

新导出ImageSlots / ImageRenderInfo。槽只收一个对象，originNode精确为VNode，src为当前实际原img的raw src（含fallback，缺省undefined），其余字段包括当前alt/width/height、字符串原生title及合并语义classNames.image。原VNode携带ref/load/error属性；直接使用它可保持图片状态机制。空返回不回退默认img，移除槽恢复默认；切换结构会按Vue规则卸载/恢复对应区域。Progress独立返回不提前执行槽。

调用者只迁移本Demo与文档，没有发现需要保留的实际顶层renderer函数调用。PreviewConfig.imageRender、actions/count等配置属于另一范围，类型保持，不由本批声称运行通过。具体证据与剩余事项见 [报告](../audit/2026-10-25-image-render-slot-remediation.md)。
