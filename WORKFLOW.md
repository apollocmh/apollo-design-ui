# Apollo Design · 开发流程

## 选择与实施

1. 确认用户任务、工作区和相关已知问题；以风险、用户价值和真实依赖排序。Registry 的 next-task/workstreams 可辅助计划，不阻止维护已完成组件，也不强制历史波次。
2. 完整盘点当前整改单元后再修复。组件、基础包、文档和 Demo 均以当前源码为准，逐项核对公开 Props、Slots、Emits、v-model、Expose、响应式、attrs、Provider、样式及关联子组件；沿“声明 → 传递 → 消费 → 实际行为”核对实现、调用者、测试和适用 ADR，不只核对类型或历史报告。普通文案清理按实际范围盘点，不机械扩成组件创建流程。
3. 动手前确定本轮范围、完整清单和验收标准。每项注明已验证正常、本轮必修、需要裁决或另案处理，并保留证据/待验证路径。已有接口无效、关键交互缺失属于本轮必须解决的缺陷，不能随意改称后续优化；无关新能力另案登记。
4. 检查同类根因和关联链路后集中设计、成组修复，集中评估公共 API 变更，避免反复迁移。缺陷先建立可失败复现，同步实现、类型、测试、Demo、必要文档和受影响的 Registry；不靠放宽断言、删除场景或新增兼容绕路通过检查。
5. 整改单元核对完整清单、统一验收后再切换。覆盖适用的受控/非受控、动态配置、条件插槽、反复开关、卸载重挂、焦点和多实例；共享层检查受影响组件。新增发现属于本轮缺陷则纳入修复，无关需求另案登记。阻塞须说明证据和原因，不宣称全部完成，也不无限打磨。
6. 允许按独立问题分主题提交，但提交不是整改单元完成标记。记录对应提交、修复项、实际命令/结果和剩余边界，区分已实现、已验证、未验证、受阻；全部整改结束后，对最终同一提交执行全量门禁。push、PR、merge、tag、publish 按用户授权执行，不保存个人代理或凭据操作约定。

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
