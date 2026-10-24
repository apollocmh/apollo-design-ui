# Pagination 原生插槽迁移

2026-10-24，按 ADR0006/0007 直接移除 itemRender、showTotal、sizeChangerRender 三个渲染函数 prop 和旧渲染函数类型导出，不保留函数兼容层或弃用期。

```vue
<Pagination v-model:current="current" v-model:pageSize="pageSize" :total="85" show-size-changer>
  <template #itemRender="{ page, type, element }">
    <b v-if="type === 'page'">{{ page }}</b>
    <component :is="element" v-else />
  </template>
  <template #total="{ total, range }">{{ range[0] }}-{{ range[1] }} / {{ total }}</template>
  <template #sizeChanger="{ value, onSizeChange, disabled }">
    <button :disabled="disabled" @click="onSizeChange(value === 10 ? 20 : 10)">Size {{ value }}</button>
  </template>
</Pagination>
```

页码和总数均接收单个具名对象；新类型为 PaginationItemSlotProps / PaginationTotalSlotProps / PaginationSlots。itemRender 覆盖 page、prev、next、jump-prev、jump-next。存在的空槽压住默认内容，移除槽恢复默认渲染。尺寸切换通过现有业务动作提交，分页与尺寸事件载荷继续表达领域状态。

List 和 Table 通过 `#paginationItemRender`、`#paginationTotal`、`#paginationSizeChanger` 转发同样的参数。顶部/底部分页器各取当前作用域；配置对象保留数据与业务回调。PaginationConfig 和 TablePaginationConfig 补齐既有运行时 onChange/onShowSizeChange 的类型。受控 current/pageSize 仍由调用方更新，示例使用 refs 和业务回调同步。

Pagination 根 id/title/原生事件和字符串、对象、数组 style 按 Vue 规则透传；不再按 React 引擎的 aria/data 白名单丢弃 Vue 原生 attrs。调用方 style 覆盖同名语义 root 样式。
