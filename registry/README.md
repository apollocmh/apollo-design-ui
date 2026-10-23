# Apollo Registry

Registry 是本项目的状态、依赖与证据记录，不是上游规格，也不授权或禁止任务。

| 文件 | 维护方式 |
|---|---|
| `components.json` | Apollo 组件清单、公开导出、分组、优先级、声明依赖、九个质量维度与证据；人工维护非派生字段 |
| `dependencies.json` | foundation 包边界与历史依赖评估；componentDag 由 components.json 派生 |
| `tokens.json` | Apollo 令牌清单；本轮从历史快照承接，增删时与 theme 公共类型核对，保留状态，不再从上游覆盖 |
| `foundation.json` | 基础包六维质量、测试/构建证据及开放决策 |
| `workstreams.json` | 既有计划的派生视图，供排期参考；历史波次不构成任务限制 |
| `source/antd-*.raw.json`、旧 meta/rc-map | 初期调研证据；不再驱动正常 Registry 生成 |

## 命令

```bash
pnpm registry:gen                     # 刷新图、汇总、blockedBy；不覆盖证据或 Token 状态
pnpm registry:foundation              # 刷新基础包派生数据
pnpm registry:workstreams             # 刷新可选计划视图
pnpm registry:check                   # 只读检查，发现漂移则失败
pnpm ask component button
pnpm ask decisions --open
pnpm registry:next                    # 仅建议；已完成组件仍可维护
```

新增组件不必在 antd 存在：登记 components.json 的入口、分组、依赖、状态，创建本库契约与测试，再刷新派生数据。优先级无需与依赖拓扑相同；未知依赖与真正的循环仍失败。声明图从旧图迁入，修改边时须核对源码运行时/类型导入，不能把历史图自动当作最新代码事实。

## 状态与历史

`apiStatus`、`tokenStatus`、`styleStatus`、`unitStatus`、`interactionStatus`、`typeStatus`、`a11yStatus`、`visualStatus`、`docsStatus` 是当前九个质量维度。`n/a` 必须说明原因。历史完成标记按原证据保留；`visualBaseline: legacy-reference` 明确表示尚未以 Apollo 自有基线重新验收。

旧 `antdVersion`、`antdApiStatus`、`compatStatus`、上游规模与依赖放入 `referenceEvidence`。这是工具数据迁移，不是公共组件 API 变化；不自动把参考测试完成解释为本库新验收完成。

## 门禁职责

E2/E3 状态一致性；E4/E5/E6/E7/E8 依赖图与引用；E9 本库契约交付物；E10 令牌规则；E11/E19 发布依赖隔离；E12 Apollo 源码清单；E13 历史 fixture schema；E14–E18 基础包与既有计划记录完整性；E20 完成组件不得保留生成器空壳。

无构建产物时 E11 只能报告未执行，构建后重跑。`registry:check` 不写盘；生成器的幂等性、无上游组件支持、证据保留由 `test:tooling` 验证。上游事实提取、素材生成、Oracle 和参考截图命令仍保留，版本仅用于实验可复现。
