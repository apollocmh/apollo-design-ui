# Apollo Registry

本轮任务唯一状态是 `vue-native-audit.json`。Registry 的静态清单描述组件和依赖事实，不定义外部规格，不替用户授权任务。

| 文件 | 当前职责 |
| --- | --- |
| `vue-native-audit.json` | 任务、架构状态、验收状态、历史证据、真实整改依赖、文件归属、assignment 与暂停状态；唯一当前状态 |
| `vue-native-audit.schema.json` | 上述状态的结构和合法取值 |
| `components.json` | 组件清单、公开导出、分组、优先级、声明依赖与 Token 元数据；不存任务完成状态 |
| `dependencies.json` | 包边界与组件依赖图；描述影响面，不自动阻塞架构推进 |
| `tokens.json` | Apollo 令牌清单和派生统计，不维护另一套 Theme 任务状态 |
| `foundation.json` | 基础包静态事实与只读的已接受决策，不再承包测试、覆盖率或任务推进 |
| `source/antd-*.raw.json`、旧 meta/rc-map | 带来源的初期调研数据，不驱动当前任务状态 |

## 状态与历史

任务 `architectureStatus` 为 `not_started`、`partial`、`in_progress`、`done`、`blocked`。`partial` 保留已有专项成果；不能把未整单元收口的任务一律重置为未开始。

`acceptanceStatus` 与架构状态独立。`historicalAcceptance` 保留过去完整交付的证据，即使后续最终验收通过也不抹去历史。未知、未测和延期不能记为通过；历史通过不表示已经验证当前冻结源码。

旧组件/基础包/Token 状态原始数据在 `docs/history/registry-implementation-2026-10-29/`，旧扫描在 `docs/history/vue-native-audit-2026-10-23.json`。旧 `workstreams` 源、派生文件、调度脚本及基础包写验证状态的专用机制已退役，当前不双写、不保留兼容调度层。

## 命令

```bash
pnpm registry:vue-native --json   # 当前任务和阶段
pnpm registry:next --parallel     # 只读建议；暂停时没有新建议
pnpm registry:progress            # 生成文档站进度页
pnpm registry:gen                 # 刷新静态派生数据及展示
pnpm registry:check               # 只读校验，漂移或非法状态失败
pnpm ask component button         # 元数据和当前任务信息
pnpm ask decisions --open         # 读取已有决策事实
```

集成人使用 `registry:vue-native` 的 `--claim`、`--release`、`--complete --report` 显式维护归属与架构完成；参数见 `--help`。建议不是领取，领取也不自动执行任务。暂停不清空已领取现场，中断后按原 owner 接续，不重复派发。

最多五个并行子任务。任务声明的文件归属不能与活动任务重叠，共享状态、公共出口和全局配置由集成人负责。只有任务的明确整改依赖影响就绪，静态 imports 用于确定受影响消费者。

检查结果可从临时报告写入唯一状态中的紧凑 `verification`，无需每项新增验收文档。非零退出、进程错误、信号中断、空测试或源类型错误均失败；不能只读通过用例数忽略失败状态。状态更新使用短锁和原子替换，冲突明确失败，不隐藏重试。

## 门禁分工

第一阶段只要求本次架构改动的类型、核心行为和必要 Demo/消费者验证。组件状态 `done` 不要求逐项执行完整九维，也不表示最终验收通过。

第二阶段由同一冻结版本的 `verify:full` 执行九维、产物和消费者验收，统一构建后只读消费。静态图、源码交付物、无 React 依赖和有效契约检查保留；旧逐组件 completed 九维门槛不再叠加到第一阶段。

生成器不得覆盖仍有价值的 Token、依赖或历史证据；未知依赖与真实循环仍失败。`--check` 不写盘，正常查询不更新进度。当前进度只由权威状态派生，不手写第二份统计。
