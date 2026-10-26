# List 内容插槽迁移（2026-10-24）

2026-10-26 后续修正：根 extra 已接通；Item main 现在始终保留，extra 两种布局都有语义容器。下文保留首批迁移时的行为说明，当前用法见 [List 契约迁移](./list-contracts.md)。

当前开发版按 ADR 0006 直接移除 `ListProps.renderItem`，使用泛型 `#item="{ item, index }"`。不保留旧函数 prop、别名或弃用期。仓库内 12 个示例、单元/DOM/axe/视觉用例同步迁移；参考侧的 React 基线保持原样。

```vue
<List :data-source="users" row-key="id" :pagination="{ pageSize: 10 }">
  <template #item="{ item, index }">
    <ListItem>{{ index + 1 }}. {{ item.name }}</ListItem>
  </template>
  <template #header>用户</template>
  <template #footer>共 {{ users.length }} 人</template>
  <template #loadMore><button @click="loadMore">加载更多</button></template>
</List>
```

组件现为 Vue 泛型 SFC，消费实例类型使用已导出的 `ListRef`。`item` 类型从 `dataSource` 推断；`index` 是当前页内的索引。`rowKey` 函数仍负责生成数据身份，分页回调仍是业务事件，不属于模板函数迁移。省略 `#item` 时保持不渲染数据项的行为；手动内容仍用默认插槽。

新增接通 `header` / `footer` / `loadMore` 内容插槽。同名 slot 存在即优先，空 slot 不回退 prop，也不创建空 header/footer 容器。`#loadMore`（大小写一致）存在即替换底部分页，即使内容为空；上方分页保留。简单内容仍可用同名 prop；插槽在渲染时各求值一次，按同一快照决定内容、容器和尾部边框。

Apollo 没有废弃 List 的决定。本批移除照搬 antd 6.6.4 的整组件废弃警告，常规挂载/更新不得输出该告警；同步移除 Demo 的告警豁免并加入零告警断言。

本批同时修复根 `id` 被声明后未透传、原生字符串 style 被拆成字符键，以及 computed 缓存非响应式 attrs 的问题；根原生属性按渲染更新，实例 DOM 保持一致。

首批未裁决的 Item/Meta 内容字段已在下文增量中接通。根 `ListProps.extra` 有历史声明但无渲染落点，已如实标明待审查；不为补字段临时发明布局。List 拖拽示例与全库 F11 审查继续开放。验证证据见 [整改报告](../audit/2026-10-24-list-slots-remediation.md)。


## List.Item / Meta 增量（2026-10-24）

ListItem 的 `#extra` / `#actions`，ListItemMeta 的 `#avatar` / `#title` / `#description` 接通原生模板。简单内容 prop 和 actions 的 VNode 数组数据形态继续可用；本批没有函数适配层。

```vue
<ListItem>
  <ListItemMeta>
    <template #avatar><Avatar>{{ user.initial }}</Avatar></template>
    <template #title><a :href="user.url">{{ user.name }}</a></template>
    <template #description>{{ user.description }}</template>
  </ListItemMeta>
  <template #extra><img :src="user.image" :alt="user.name" /></template>
  <template #actions>
    <Button v-for="action in actions" :key="action.id" @click="action.run">{{ action.label }}</Button>
  </template>
</ListItem>
```

所有具名 slot 存在即优先，包括空 slot。extra 空内容不生成竖向 main/extra 两段布局；Meta 的头像、标题、描述独立判断，0 可显示。actions 展开数组/Fragment，跳过注释与纯空白，每个可见顶层节点包装一个 li 并自动分隔；一个包装元素视作一项。原有 actions prop 保留原数组项语义。稳定 key 用于在重排时保留按钮 DOM。

默认内容与具名内容在 render 内各求值一次，共同决定布局与样式，移除 computed 中的默认插槽消费与跨帧缓存；Item/Meta 的 attrs-only 更新同步生效。`ListItemRef.nativeElement`（新增导出类型）保留原契约：普通模式是 li，grid 模式为外层 Col 根 div。布局从单段切到竖向两段时主体需要重新挂载；同一布局内内容更新和 keyed actions 重排保持 DOM 身份。

见 [子组件整改证据](../audit/2026-10-24-list-item-slots-remediation.md)。
