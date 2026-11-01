# L7 构建产物与 B6 体积门禁

当前 `run.mjs` 实施 B1–B11；按包职责给出 PASS、FAIL、SKIP、n/a 或 PENDING。非零退出与 PENDING 均不能解释为通过，`--strict` 将 PENDING 视为失败。

```sh
node tests/build/run.mjs --strict                    # 按各包实际脚本构建并校验
node tests/build/run.mjs --no-build --strict         # 只校验已有产物；B1明确为SKIP
node tests/build/run.mjs --package ui --strict       # 仅UI
node tests/build/run.mjs --no-build --strict --json  # 机器可读检查结果
node tests/build/checks/treeshake.mjs --measure-all > /tmp/apollo-budget-measurement.json
```

复用产物须记录构建来源、源码/依赖/配置差额和实际摘要。`--no-build` 不是一次新的构建，不得把其 B1 SKIP 写成 PASS。

## 实际检查

| 检查 | 适用范围 |
| --- | --- |
| B1 | 每个包声明的实际 `scripts.build`，不以裸 unbuild 替代 |
| B2 | exports / types 解析及“产出即有声明”的反查 |
| B3 / B4 / B10 | 发布产物无 React、CSS-in-JS 运行时及 React 耦合 rc 引擎 |
| B5 / B7 | 产出 CSS 的 Theme / UI：CSS 非空、主题变量符合当前运行时默认值 |
| B6 | UI 当前全部 73 个组件按需入口：绝对预算与全量比例同时满足 |
| B8 | UI 当前入口的无 DOM SSR 冒烟 |
| B9 | Node >= 22.12 |
| B11 | 静态 CSS 无 NaN / Infinity / undefined / 未转换表达式等残留 |

不产 CSS 的基础包不强加 B5/B7；无按组件入口的包不强加 B6。n/a 按架构职责说明，不能用于掩盖缺失检查。

## B6 统计口径

`checks/treeshake.mjs` 是测量与判定实现。探针在仓库内解析发布包，用 Vite / Rolldown 和 `minify: esbuild`，`vue` / `dayjs` external；只累加最终 JavaScript chunk 的 UTF-8 字节，不计 CSS / 其他 asset，不做 gzip / Brotli。

历史 JSON 字段名保留 `budgetKb` / `measuredKb` / `actualKb`，实际单位均是 **KiB（1024 B）**。按需组件与全量 `import * as all` 使用相同口径。

每项同时要求：

1. `actualKb <= budgetKb`；缺预算、空预算或无效上限不能通过。
2. `actualKb / fullKb <= maxRatioOfFull`，当前仍为 **30%**。

配置入口覆盖当前 72 个组件目录与 `layout-sider` 的并集。测量 CLI 核对入口集合后输出 `results`、`failures`、绝对差额及比例；超预算仍非零退出。它不覆盖预算，也不再生成 `1.5 × 实测 + 5` 的统一倍率阈值。

## 基线校准

体积超旧预算本身不等于功能缺陷。先核查保留模块、依赖版本、按需路径与公开功能职责；异常依赖、重复保留或 tree-shaking 失效应修复，不能通过涨预算掩盖。

合理架构/功能成本经确认后，只调整对应条目，并记录旧上限、当前字节、新上限、余量、来源提交和理由。保留旧 `measuredKb` 与带日期的 `_note`，最新基线通过 `_calibration.report` 追溯。余量按各入口成本确定，不统一乘倍数，不关闭比例限制。

2026-11-01 的 13 项调整属于**基线校准，未优化或改写发布产物**，完整数据见[本轮报告](../../docs/audit/2026-11-01-issues-budget-calibration.md)。其余 60 项和 30% 比例限制保持。修改 B6 判定时应对相关预算/比例反例验证真实拒绝，不为改文案重复注入无关 React 或 exports 故障。

## 与 Registry 的关系

`registry:check` 的产物扫描是快速一致性检查；L7 进一步验证真实 exports、CSS、SSR 和按需消费者。Registry 状态或历史报告不能替代当前命令执行结果，构建成功也不能代替运行时、视觉或类型验收。
