# Breadcrumb 原生插槽迁移

2026-10-24，按 ADR0006/0007 直接移除 itemRender 函数 prop，不保留函数兼容层或弃用期。

```vue
<Breadcrumb :items="items" :params="params">
  <template #itemRender="{ route, params, routes, paths, href }">
    <a :href="href">{{ route.title }}</a>
  </template>
</Breadcrumb>
```

`BreadcrumbItemSlotProps` 与 `BreadcrumbSlots.itemRender` 提供单对象契约。旧 `(route, params, routes, paths)` 函数改为解构对象；无需为了沿用 React 的四参数限制丢弃 href。paths 是当前项的路径快照，href 已按现有路径/参数规则解析。空槽压住默认内容，移除槽恢复默认链接。

默认插槽中的 BreadcrumbItem/BreadcrumbSeparator 是受支持的 Vue 原生组合；移除照搬上游的整组件弃用告警。默认子节点每次 render 读取一次，并保留调用方 key，重排时输入状态跟随对应节点。items 数据存在时仍优先使用数据，不求值默认槽。

routes/breadcrumbName 与 item 数据中的 children 等既有数据迁移不在本次范围；数据字段与原生子组件组合分别描述，不混用弃用结论。
