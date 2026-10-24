# ADR 0006：开发阶段直接迁移 Vue 模板扩展 API

- 状态：已接受
- 日期：2026-10-23
- 依据：用户明确裁决「不需要主推插槽、函数兼容标废弃；直接改，组件库仍在开发阶段且尚无用户」
- 对应台账：D03、F06

## 决策

组件顶层内容渲染函数 prop 直接替换为 Vue 具名或作用域插槽。逐组件迁移实现、导出类型、文档、Demo 和测试，不保留旧函数 prop、运行时适配器或弃用期。无需为同类迁移重复请求批准。

此决定针对模板内容扩展，不把事件、异步确认、筛选、key 提取、样式计算等业务或算法函数当成渲染 API 删除。数据项渲染字段按实际消费契约逐项评估。D02 的 Switch 点击载荷不在本次裁决内。

## 首批实施：Transfer

- `render` → `#item="{ item, direction, selected, disabled }"`。
- `footer` → `#footer="{ direction, selectedKeys, totalCount }"`。
- `renderList` / 类型中的 `children` → `#list`，明确提供筛选后的条目、选择键、禁用状态、选择/移除/滚动函数。
- `selectAllLabels` 中的函数 → `#selectAllLabel="{ direction, selectedCount, totalCount }"`；静态文案数组继续作为数据配置。
- 删除只服务于旧渲染函数的 `RenderResult` / `RenderResultObject` / `SelectAllLabelRender` 类型及根出口别名。
- 默认条目展示数据 `title`，缺失时展示 `key`；搜索和可访问名称来自相同数据文本。需要额外搜索字段时使用 `filterOption`，不从 VNode 反向提取搜索值。
- 插槽存在则使用其结果，包括有意为空；条件插槽出现/移除均在渲染时读取。自定义列表不启用内嵌分页。

## 与旧规范的关系

覆盖 ADR 0005 中本次独立化不删除公共 API 的限制，以及兼容规范中对这类旧函数 prop 一律保留的要求。其他兼容边界继续有效。开发期仍记录旧/新写法、行为变化和验证证据；未来正式发布后的变更按届时兼容政策处理。

## 证据

见 `docs/migrations/transfer-slots.md`、`packages/ui/src/transfer/__tests__/slots.test.ts` 和本轮整改报告。保留历史 DOM 对照；其无 renderer 的空内容场景用显式空 slot 表达，不更改基线或差异阈值。
