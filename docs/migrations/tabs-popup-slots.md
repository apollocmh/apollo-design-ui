# Tabs 溢出菜单插槽迁移

2026-10-24，按 ADR 0006 / ADR 0007 直接移除 `more.popupRender` 函数入口和旧双位置参数槽签名，不提供兼容层或弃用期。

```vue
<Tabs :items="items">
  <template #popupRender="{ originNode, restTabs, onClose }">
    <section>
      <p>隐藏页签：{{ restTabs.length }}</p>
      <component :is="originNode" />
      <button @click="onClose">关闭</button>
    </section>
  </template>
</Tabs>
```

`TabsPopupSlotProps` 导出 `{ originNode, restTabs, onClose }`，`TabsSlots.popupRender` 只接受这一对象。程序化槽 `(menu, info) => ...` 改为 `({ originNode, restTabs, onClose }) => ...`。

`more` 仅声明实际消费的 `icon` / `transitionName`，移除原先暗示任意浮层属性均会透传的未知键签名；旧实现实际未转发这些属性。`transitionName` 的既有默认值和覆盖行为保持有效。

`#popupRender` / `#extra` 在挂载后可条件出现、变空或移除；空槽压住默认内容。标题外附加内容的 fallback 仅在 slot 不存在时恢复。底层 Dropdown 不再在 setup 固定 popupRender 是否存在，插槽沿真实渲染链转发，无函数适配层。

`#tabBar` 的 `activeKey` 类型修正为 `string | undefined`：空页签列表可以没有活动项，调用方需处理该情况。未通过断言或虚构空 key 掩盖实际类型。
