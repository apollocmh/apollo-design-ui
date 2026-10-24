# Timeline 原生条目插槽迁移

2026-10-25，按 ADR0006/0007 使用 itemTitle / itemContent / itemIcon 原生作用域槽。参数统一为单个 TimelineItemSlotProps 对象 { item, index }。items 保留数据配置；VNode 数据仍可传入，不构建 renderer 回调兼容层。

```vue
<Timeline :items="[{ key: 'a', title: 'Created', content: 'Ready' }]">
  <template #itemTitle="{ item }"><strong>{{ item.title }}</strong></template>
  <template #itemContent="{ item, index }">
    <article>{{ index }} · {{ item.content }}<input aria-label="Note" /></article>
  </template>
  <template #itemIcon><span aria-hidden="true">✓</span></template>
</Timeline>
```

三个槽按存在性覆盖对应数据，显式空槽不回退；动态移除恢复数据。每次渲染使用当前原始项和反转后的显示index，keyed条目在数据替换/反转时保留输入节点与值；SSR支持同样内容。旧 pending 合成节点保持旧数据行为，不伪造其源item，索引包含该占位。

直接移除只返回null的 Timeline.Item 和 TimelineItemComponent，移除声明默认槽却没有运行消费点的 TimelineSlot 类型；无兼容层、无弃用期。使用 items 数据和上述具名槽替代空壳调用。TimelineSlots / TimelineItemSlotProps 是新的公开类型，普通 items 不再因错误的 Timeline.Item 判据发弃用告警；既有 pending/旧数据别名的警告按实际使用保留。

旧测试中「空壳必须不渲染」改为导出移除负例，并补真实模板/空内容/SSR/状态保持测试；未保留一个不可用的Vue公共入口。Item历史快照与上游说明仍为带日期证据，不作为当前规范。
