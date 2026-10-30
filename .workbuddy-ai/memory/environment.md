# 项目环境与执行入口

当前执行规范见根目录 `WORKFLOW.md`、`TESTING.md`。2026-10-30 起，本文件替代旧的忽略非零退出、逐组件 G13 全仓、旧 workstreams 更新及基础包写验证状态说明。

## 环境核对

- Node.js 至少 22.12；pnpm 版本以根 `package.json` 的 `packageManager` 为准，先检查实际 PATH 和版本，不假定历史临时 shim 仍存在。
- 当前常用终端为 zsh；变量分词和 glob 不能照搬 bash。批量参数用明确数组；搜索优先 `rg`。
- 浏览器用仓库现有 Playwright 启动器及固定环境。旧机器、旧沙箱的性能观测只作故障线索，不是修改平台权限或安全策略的授权。

## 当前命令分层

```bash
pnpm registry:vue-native --json
pnpm registry:next --parallel
pnpm verify:component button
pnpm verify:changed --dry-run
pnpm verify:changed
pnpm registry:progress
pnpm registry:gen
pnpm registry:check
pnpm verify:full --dry-run
```

第一阶段按真实修改范围运行类型、核心行为和必要 Demo/消费者检查。仅工作流、Schema、CI、README/PLAN 变更，不应被扩大成所有组件的完整运行时验收。共享源码变化须检查真实受影响消费者。

全部架构完成后才执行最终 `verify:full`：固定源码，一次构建，后续读取同一份产物。不要同时运行会清空/覆盖 dist 的构建与消费端检查。浏览器中间 bundle 中的 CSS 来自真实 dist；若样式产物过期，先正确更新构建，不以旧产物通过证明新源码。

## 失败与恢复

- 以进程真实退出状态及结果一起判断。非零、signal、启动失败、空测试、源类型错误均失败；不能只抓“Tests passed”忽略错误。
- 不把门禁输出管道到 `tail`/`head` 后用其退出码判断原命令；保留完整日志并读取原进程结果。
- 状态写入锁冲突明确失败；中断后先核对归属与现场，只有确认原进程已退出才恢复锁。不自动重派、不无限重试。
- 不按固定历史用例数判断当前覆盖；核对实际收集的文件和场景。检查范围改变要说明，不能把局部结果称作全库通过。
- 已有检查结果在同源码/范围有效时复用，遇到新改动、失败或缺失才补跑；不因旧环境说明要求再做一遍全仓检查。

性能和故障历史保留在 `PITFALLS.md` 及带日期记录中。历史中的平台开关、旧命令和旧完成数字均不自动成为当前执行要求。
