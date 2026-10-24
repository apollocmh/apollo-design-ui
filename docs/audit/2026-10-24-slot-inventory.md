# F11：当前内容扩展清单 · 2026-10-24

新增 `pnpm run audit:content-slots` 与只读 `audit:content-slots:check`，产物为 [content-slot-inventory.json](evidence/content-slot-inventory.json)。不再将 2026-10-08 的 190/36/154 当作当前统计。

## 范围与结果

以 TypeScript AST/符号解析收集 **/interface.ts 的属性，追踪导入别名、类型别名、泛型实参和继承。每个 owner/field 一行；同一继承属性可能出现在多个 owner，故总行数不是独立公开 prop 数。函数只检查返回内容，不把接受 VNode 参数但返回 void 的业务回调当成 renderer；不将数据接口的内部 label 展开成调用者 items 的顶层内容。

本次 73 个 interface.ts，共 499 行：内容候选 148、渲染函数候选 75、数据 134、内联配置 12、deprecated 53、内部/插槽协议 77。分类为调查分流，不是公共 API 决策；Props 后缀也不能证明它就是公开组件。

当前 Badge.count/text、InputNumber.prefix/suffix 与 List.header/footer/loadMore、Item.extra/actions、Meta.avatar/title/description 十二行关联具体运行报告而标 verified。List.renderItem 已移除，新 ListSlots 五个字段及 Item/Meta 六个 slot 字段归内部插槽协议；迁移证据见 [List 报告](2026-10-24-list-slots-remediation.md) 和 [Item/Meta 报告](2026-10-24-list-item-slots-remediation.md)。其余 source-reference 只记录源码/类型/测试/Demo 的同名线索，**不等于已经实际消费或测试通过**；未命中也不直接等于缺少插槽，别名、动态键与其他组件的同名模板都需复核。146 行保持数据/配置，130 行因内部/协议/deprecated 跳过，211 行继续 review。

Drawer 已存在的四个内容槽补充动态、空内容、ARIA 与正文身份验证，新增 DrawerSlots 五个字段归内部插槽协议；未将内部 DrawerPanel 字段升级为 verified，见 [Drawer 报告](2026-10-24-drawer-vue-remediation.md)。

本工具不覆盖单独 SFC/TS 文件中的内联 props；不会以“候选数”替代缺口数，也不将清单写入组件验收状态。F11 继续开放，下一步按真实组件、调用者和作用域逐项审查，公开 Vue 契约修正遵循 ADR 0006 / ADR 0007。

## 验证

两条 tooling 检查通过：fixture 验证别名/继承、数组与配置分流、业务回调排除、deprecated/内部跳过及静态线索不能升级为 verified；CLI 正常输出、只读检查不写文件、漂移非零退出且不覆盖输入。`audit:content-slots` 生成后 `audit:content-slots:check` 通过。

Tabs 的 more.popupRender 函数入口已移除，popupRender 改用单对象槽并补全动态链路，见 [Tabs 报告](2026-10-24-tabs-popup-remediation.md)。新增 TabsPopupSlotProps.originNode 被扫描器记为内容候选 review，实际是槽参数，不能当作缺失公共 prop 插槽；不为清单好看而升级为 verified。

Breadcrumb 的 itemRender 函数已直接迁为单对象槽，默认子组件恢复本帧求值与原生 key；详见 [Breadcrumb 报告](2026-10-24-breadcrumb-slots-remediation.md)。

Pagination 的三个函数入口直接移除并改为单对象槽，List/Table 分页转发协议归内部槽；当前结果见 [Pagination 报告](2026-10-24-pagination-slots-remediation.md)。业务回调仍排除在 renderer 候选之外。
