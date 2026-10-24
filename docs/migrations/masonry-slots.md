# Masonry 原生 item 插槽迁移

2026-10-24，按 ADR0006/0007 直接移除 itemRender prop 和 MasonryItemRenderInfo 导出，不保留兼容或弃用层。

```vue
<Masonry :items="[{ key: 'a', data: { title: 'Alpha' } }]">
  <template #item="{ data, index, column }">
    <article>{{ data.title }} · {{ index }} · {{ column }}</article>
  </template>
</Masonry>
```

新类型为 MasonryItemSlotProps<T> / MasonrySlots<T>，模板从 items 推导业务 T，layoutChange 同样保留 T。item 槽接收单个对象，包含 key/data/index/column 和原项的 children/height。column 在首次实测前暂为 0；不要将初始值当最终排布。

显式 item 插槽优先于 item.children，包括返回空内容的槽。移除槽恢复 children 回退；旧 children 优先于 renderer 的规则不再保留。条件槽和内容更新在当前 Vue render 中生成，再交给 MotionList；不缓存 setup 时的槽存在性。相同 key 的新数组会更新数据并保留 keyed DOM。classNames/styles 函数读取当前 props 和已解析列数。

组件更新、根 ResizeObserver、图片 load/error 捕获事件会调度测量，未挂载齐全的 DOM 不发布零高度占位。fresh 继续观察条目持续变化（例如 CSS 高度过渡）。该插槽阶段未改变首帧延迟与 SSR；随后已按[首屏迁移记录](masonry-ssr.md)直接修复为空容器的问题。
