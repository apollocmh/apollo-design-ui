# F03 · FormItem 动态前缀复核（2026-10-24）

台账仍将 setup 快照列为当前源码缺陷，但提交 `6867166a`（2026-10-23，fix: preserve Vue reactivity and avoid unused inline portal containers）已经把 ItemHolder 的 itemPrefixCls 改为 computed，派生类名、row 与 margin-offset 的使用改为 `.value`。本批核对该历史提交与当前源码，不重复改写已修逻辑。

StatusProvider 的同名变量位于 feedbackIcon 的 computed 内部，本来就参与响应式重算；本批没有修改它。动态前缀对应 CSS 预生成/加载仍归 D04，本次不引入运行时样式。

执行：

```sh
pnpm exec vitest run --project unit packages/ui/src/form/__tests__/prefix-reactivity.test.ts --maxWorkers=1
```

结果：1 文件 1 条通过（Node 22.22.2 / pnpm 12.4.2）。日志 `/tmp/apollo-form-prefix-recheck.log`。现有用例覆盖 ConfigProvider `f1 → f2 → f1`，检查根、row、vertical、with-help、has-error、has-feedback 类；全树无旧 form-item 前缀，且 input DOM 始终为原元素。这是当前源码的基础回归复核，没有在本批新造修复或重挂载规避。

未在本批扩展：margin-offset 的浏览器测量与占位、消费反馈 context 的真实输入组件图标 DOM、完整 layout 矩阵、生产浏览器与适用视觉门禁。原测试使用原生 input，不把根 has-feedback 类存在说成已经验证图标消费。F03 标为源码已修/基础回归通过，并保留这些扩展验证任务；不宣称 Form 重新完整验收。

Registry 只追加证据，保留历史质量状态。文档和 Registry 的本批一致性以 `registry:check` 与 `git diff --check` 检查，不因事实清账重复运行无关构建或写实现镜像测试。
