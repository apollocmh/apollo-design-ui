# Transfer 模板插槽迁移 · 2026-10-23

适用：当前未发布的 `0.0.0` 开发版本。依据 [ADR 0006](../adr/0006-development-template-slots.md) 和用户裁决，旧函数 prop 直接移除，没有兼容层或弃用期。

| 旧写法 | 新写法 |
|---|---|
| `:render="item => ..."` | `<template #item="{ item, direction, selected, disabled }">…</template>` |
| `:footer="(props, info) => ..."` | `<template #footer="{ direction, selectedKeys, totalCount }">…</template>` |
| `:render-list="props => ..."` / 类型字段 `children` | `<template #list="{ direction, filteredItems, selectedKeys, disabled, onItemSelect, onItemSelectAll, onItemRemove, onScroll }">…</template>` |
| `:select-all-labels="[info => ...]"` | `<template #selectAllLabel="{ direction, selectedCount, totalCount }">…</template>` |
| `TransferRenderResult` / `RenderResult` / `RenderResultObject` / `TransferSelectAllLabel` / `SelectAllLabelRender` | 使用 `TransferSlots` 及各 `Transfer*SlotProps`；无需表示 VNode/搜索值复合返回值 |

```vue
<Transfer :data-source="items" :target-keys="targetKeys" @change="targetKeys = $event">
  <template #item="{ item, selected }">
    <strong>{{ item.title }}</strong>{{ selected ? ' ✓' : '' }}
  </template>
  <template #footer="{ direction, selectedKeys, totalCount }">
    {{ direction }}：{{ selectedKeys.length }}/{{ totalCount }}
  </template>
</Transfer>
```

`#item` 不传时展示数据 `title`（非文本时回退 `key`），而旧实现无 `render` 时条目内容为空；显式空 slot 仍为空。搜索、行 title 和 checkbox 名称取数据文本；旧 `{ label, value }` 的自定义搜索值应放入数据字段并由 `filterOption(input, item, direction)` 匹配。

`direction` 始终表示数据方向 `left/right`，不随 RTL 镜像互换。`#footer.totalCount` 是该侧全部条目数，`#list.filteredItems` 是搜索后条目。`selectedKeys` 为当前侧的受控/内部选择结果。自定义列表的选择/移除函数会过滤禁用和不属于当前筛选列表的键；消费者仍应正确绑定 UI 的 disabled 状态及 `onScroll`。

自定义列表与内嵌分页不组合；列表内部的 Table 等可自行分页。`#list` 存在但为空时也不会回退默认列表。Table / Tree 的完整 Vue 模板示例见 `packages/ui/src/transfer/demo/`。

回归入口：`pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme --project types packages/ui/src/transfer`；产物、文档与浏览器验证见本轮整改报告。
