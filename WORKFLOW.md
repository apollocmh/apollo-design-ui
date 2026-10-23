# Apollo Design · 开发流程

## 选择与实施

1. 确认用户任务、工作区和相关已知问题；以风险、用户价值和真实依赖排序。Registry 的 next-task/workstreams 可辅助计划，不阻止维护已完成组件，也不强制历史波次。
2. 阅读对应公开 API、类型、实现、调用者、测试和最新 ADR。行为缺陷先写可失败的复现；新能力先定义契约，普通文案清理无需组件全流程。
3. 按可审查主题分阶段实施，同步类型、样式、Demo、文档和受影响的 Registry 状态。发现额外债务记录证据，不扩大成未经验证的全仓行为变更。
4. 局部验证后执行适用项目门禁。检查失败先定位根因，区分实现错误、测试错误和环境限制；不删测试换进度。
5. 分主题提交，说明变更、兼容边界、真实验证与剩余问题。push、PR、merge、tag、publish 按用户授权执行，不保存个人代理或凭据操作约定。

## Definition of Done

组件当前质量维度：`apiStatus`、`tokenStatus`、`styleStatus`、`unitStatus`、`interactionStatus`、`typeStatus`、`a11yStatus`、`visualStatus`、`docsStatus`。`done` 需要证据；`n/a` 需要 `layerNotes` 中的适用性解释。Registry 保留旧状态的历史含义，不能把过去的 React 视觉验收伪称为 Apollo 基线验收。

新完成的组件还需明确契约、无未解释阻塞、适用构建/消费端验证，以及已审查的 Apollo 视觉证据。历史上游 `antdApiStatus` / `compatStatus` 仅存入 `referenceEvidence`，不是完成条件。

foundation 包保留 API/实现/类型/测试/文档/产物六维、适用测试层、覆盖率与构建证据。PoC 应验证本库风险，参考差分不能替代自有场景测试。

## 开发命令

```bash
pnpm verify:component <name>
pnpm verify:changed
pnpm registry:gen          # 刷新 Apollo 派生数据，保留状态
pnpm registry:check        # 只检查，不写盘
pnpm verify:full
pnpm verify:consumer
```

`verify:full` 包含 Registry、内容生成、lint、运行时与类型测试、构建和文档验证。覆盖率和浏览器视觉按 `TESTING.md` 执行；文档站单独 typecheck/test/build。发布前须补齐消费端与适用视觉验收，不能以参考测试通过替代。

## 审计衔接

`docs/KNOWN-ISSUES.md` 的 FIX / VERIFY / DECIDE 区分继续有效。修复注明原编号、回归路径和命令；B/C/D 级线索先复现，不把静态扫描当运行结果。已有用户验收的事项保持结论，除非出现新证据。

并行工作如有使用，先明确文件所有权，共享 Registry 和导出文件串行整合；不存在必须使用某种 Agent 分工或历史泳道的要求。
