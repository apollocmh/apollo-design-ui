# Apollo Design · 质量标准

## 判据

功能由公开 API、真实用户场景与明确组件契约决定。实现、快照和上游都不是自动正确的答案。修复应先证明回归测试能失败，再验证修复；保留已有有价值的测试。

| 层 | 检查 | 命令与证据 |
|---|---|---|
| L1 | 单元、算法和状态边界 | `pnpm test:unit` |
| L2 | 受控更新、插槽、事件、动态 props、卸载和实际交互 | unit project 中的交互测试 |
| L3 | 公开类型、正反例 | `pnpm lint:types`、`pnpm test:types` |
| L4 | Apollo DOM/ARIA/attrs 契约 | `pnpm test:dom`；保留历史参考快照作为回归证据 |
| L5 | 无障碍、键盘、焦点 | `pnpm test:a11y`，axe 与行为断言结合 |
| L6 | Apollo 已审查视觉基线 | `pnpm test:visual`，见下文 |
| L7 | exports、类型产物、依赖、CSS、预算、消费端 | `pnpm test:build`、`pnpm verify:consumer` |

主题回归用 `pnpm test:theme`。所有适用层必须覆盖；基础纯函数不要求无意义浏览器截图，豁免记录理由。测试收集为空、渲染报错、基线缺失均不能作为通过。

## 视觉基线

默认 `test:visual` 使用 Apollo 自有基线；与 React 同机对照通过显式 `test:visual:reference` 调用。旧 React PNG 不得直接复制或改名为 Apollo 已验收基线。

基线流程：在固定浏览器/系统/字体/视口/主题下生成候选 → 审阅正常、交互、暗色、紧凑等适用状态 → 附 commit、环境和审阅说明 → 接受为 `baselines/apollo`。缺失基线返回失败并明确显示待验收；首次迁移期间 CI 将参考视觉保留为非阻塞证据，自有基线检查作为独立显式流程逐步纳入。

更新不是验收，候选不得静默覆盖已有批准图。差异先评估布局、裁切、状态和无障碍，不为绿灯降低阈值。渲染异常、空白页、重复用例自检与分片完整性必须保留。跨平台噪声应固定环境或建立独立平台基线，不能伪称像素一致。

## 上游与 Oracle

`tests/compat` 和算法 Oracle 继续执行现有有价值的回归。它们的锁定版本属于实验元数据，不是库版本承诺。新组件无需上游对应物、fixture 或逐像素相同。修改旧对照断言须说明 Apollo 契约和替代覆盖，不能批量删断言。

## 覆盖率与发布

现有 `vitest.config.ts` 阈值和构建预算继续生效，不因独立化降低；覆盖率用 `pnpm test:coverage`。不盲目增加镜像实现的测试。负例类型测试允许带理由的 `@ts-expect-error`。

`pnpm verify:full` 是全仓本地检查入口；文档站包含 content:check、typecheck、test 和 build。最终报告区分：通过、代码失败、环境阻塞、未执行。构建成功不证明浏览器行为正确，Registry completed 不证明当前 HEAD 通过。
