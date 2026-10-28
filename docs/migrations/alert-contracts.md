# Alert / ErrorBoundary 当前 Vue 契约 · 2026-10-29

适用于当前未发布 `0.0.0` 开发版。按 ADR0006/0007 直接修正错误的 Vue 通知、内容和 DOM 落点；不为这些错误保留兼容通道或弃用期。既有数据 props、语义区域、配置业务回调和合理默认视觉保留。

| 旧路径 | 当前行为与写法 |
| --- | --- |
| `closable.onClose` 抢占顶层 `@close` | `@close="onClose"` 总是收到原生 MouseEvent；配置对象的业务回调独立通知，相同函数不会重复调用。事件不是取消钩子。 |
| 仅 `afterClose` / `closable.afterClose`，模板 `@after-close` 无效 | 推荐 `<Alert closable @after-close="remove" />`。内部移除完成后一次通知，禁动效/减少动画也有效；旧 plain `afterClose` 与配置业务钩子仍按原配置优先级消费。父级立即 v-if 卸载不冒充内部动画完成。 |
| 关闭中可重复发请求 | 同一实例只接受一次内部关闭；没有 open/visible/v-model。用父级 v-if/key 重挂可再次显示，closable 改回true不重置 closed。 |
| 条件 `#closeIcon` 缓存、空内容恢复默认图标 | 五个 named slots 每轮 render 调用完整内容。slot 存在即优先；空 closeIcon 不回退，显式 closable 的原生按钮仍有默认 Close 名称与焦点范围。自定义名称放 `closable['aria-label']`。 |
| closable 对象用真值挑 closeIcon | 明确0、false、null、空字符串均是图标内容配置，不被其他图标覆盖；对象依然可关闭。遗留顶层标量 closeIcon 保留既有数字运行时支持并补齐类型。 |
| 根只过滤 aria/data，遗漏 tabindex/keydown/once等 | 普通 native attrs 与事件修饰符落在实际 Alert div，`nativeElement` 指向同一节点。`title` 已是内容 prop，不改成同名 HTML 提示属性；id/role/class/style保持自身约定。 |
| Provider setup 快照 | 当前 `components.alert` 的替换/删除、最近作用域和局部优先均实时消费；不新增 ConfigProvider 顶层 alert prop。 |
| Provider icon=null 回退默认图标时漏掉装饰语义 | 保留 null/undefined 的既有默认图标回退，回退图标与普通默认图标一样隐藏于无障碍树；自定义内容继续负责自身语义。 |
| 语义函数缺少解析后的 prefixCls / role | `role` 按已声明 API 作为运行时 prop 消费，默认 alert；语义函数收到真实的合并前缀和 role，与 DOM 当前值一致。 |
| 四 Token 只声明默认 CSS 变量 | 现在消费最近 `theme.components.Alert`，四字段可动态设置/移除；直接 root `--apollo-alert-*` 值仍优先，当前 Alias 决定默认/紧凑 padding。 |
| 把 config={} 当作没有主题来源 | 显式空 ThemeProvider 恢复默认值，包括其下无 theme 的 ConfigProvider；真正缺少主题来源才保留页面 CSS 继承。缺少内部来源标识的自定义 context 按显式来源消费。 |
| ErrorBoundary 用错误值真值判断，丢掉0/false/null/undefined | 使用独立已捕获状态；所有捕获值可转成默认文字。健康内容仍为完整 Fragment，不加包装；class/style/ARIA/native attrs只有在错误回退 Alert 上有原生落点。 |
| 默认错误详情窄屏溢出但不能键盘滚动 | 默认 pre 是具名、可聚焦的 Error details region，Tab/方向键可原生操作；自定义 description 保留自己的交互语义。 |
| `Alert.ErrorBoundary` 只有运行时静态属性 | 所属入口现在保留静态子组件类型，与具名 AlertErrorBoundary 为同一定义。 |

```vue
<Alert closable @close="observeNativeClick" @after-close="removeAlert">
  <template #title><strong>Task updated</strong></template>
  <template #closeIcon>Dismiss</template>
</Alert>
```

标题/描述的 string 数据及旧 message 别名保持；富内容继续用 slots，ErrorBoundary 的 VNode 数据 props保留。不添加旧顶层 render函数、beforeClose/controlled-open 或 reset 方法。

原28个参考 DOM 场景与原PNG保持；10个场景只有默认原生关闭按钮 aria-label 和装饰图标 aria-hidden 的逐路径有限差异，见 `alert/__tests__/contract-differences.ts`。共享归一化和阈值不变，额外差异仍失败。完整红绿与未验收边界见 `docs/audit/2026-10-29-alert-contract-audit.md`；发布产物、正式视觉和全库最终同提交门禁须由主线程补齐。
