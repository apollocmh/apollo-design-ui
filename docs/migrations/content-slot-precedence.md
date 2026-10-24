# Alert / Collapse 内容优先级 · 2026-10-24

当前未发布 `0.0.0` 开发版，在用户已确认直接整改的范围内统一 F07 的内容插槽契约。此前公开文档明确写 prop 优先，本次作为独立行为变更记录；无兼容分支或弃用期，不把它夹带为无行为清理。

| 内容 | 旧优先级 | 新优先级 |
| --- | --- | --- |
| Alert 标题 | title → message → #title | #title 存在 → title → message |
| Alert 描述 | description → #description | #description 存在 → description |
| CollapsePanel 标题 | header → #header | #header 存在 → header |

“存在”是 slot 函数存在，不是返回非空节点。空数组、注释、空 Fragment 不会使旧 prop 重新出现。Alert 空描述同时移除 with-description 状态；数字 0 和显式文本继续按既有内容判据处理。其他关闭、动作、图标、数据 items、展开与事件语义不在此变更内。

只传 prop 的现有调用保持。依赖旧 prop 抢占 slot 的代码应移除重复 slot，或将最终内容放入 slot；条件 slot 消失时才回到 prop。

```vue
<Alert title="Fallback" description="Fallback description">
  <template v-if="show" #title><strong>{{ title }}</strong></template>
  <template v-if="show" #description>{{ description }}</template>
</Alert>
```

Collapse 在每轮 render 收集一次面板树，标题/extra/body 共用该快照；动态 default/header slot 不使用 computed 缓存，也不为刷新标题而重新挂载面板。数据 items 与 children 的优先级不变。

回归：`packages/ui/src/alert/__tests__/slot-priority.test.ts`，六条修前全失败，修后覆盖同传、空 slot、条件 slot、最新内容、input/面板身份与单次子树读取。既有 prop-only、展开/关闭、DOM/a11y/theme 回归继续执行，结果见本轮报告。
