# Descriptions 实现说明

当前契约见双语 API、行为测试及 [2026-10-28 整改单元清单](../../../../docs/audit/2026-10-28-descriptions-contract-audit.md)。独立 Vue 组件使用稳定的 `dl > div > dt/dd`，数据项和模板 Item 共用原生 Item 实例；行计算只更新 CSS Grid 几何，不改变内容父级。

- `items.ts`：纯归一化、正整数几何、响应式 span、filled 收尾、超额压缩及行尾补齐，不修改调用者数据。
- `Descriptions.ts`：当前 render 的 Item 收集、items 分支独立 computed、当前配置/断点/语义、根 attrs/ref 和重排焦点维护。不会在 render 写状态。
- `DescriptionsItem.ts` / `context.ts`：Vue 原生插槽、响应式 provide/inject、自己的 attrs 与稳定 dt/dd 语义区域。
- `use-descriptions-theme.ts` / style：当前主题的 10 个有效 Token 与静态 CSS；区域选择器限定到所属实例，支持暗色/紧凑/嵌套。

开发期 DOM/类型变化见 [迁移记录](../../../../docs/migrations/descriptions-contracts.md)。保留现有合理 Props、Item 别名、旧样式 alias 与分组规则；不保留会丢失内容身份的旧 table 分支。

历史来源：最初布局算法和样式参考 antd 6.6.4 的 descriptions 目录；`docs/analysis/descriptions.md` 和未修改的参考 DOM/图片保留带日期的原始证据。它们不定义当前 Apollo 规范。F08（2026-10-23）与 Issue #31 的既有回归继续执行；当前原生替代契约另有完整断言。
