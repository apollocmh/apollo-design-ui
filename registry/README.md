# registry/ — 机器可读的项目状态

> 本目录是 Agent 的**任务来源**与项目的**事实来源**。
> Agent 不允许凭记忆决定「下一个做什么」，必须读取本目录。

---

## 1. 文件分工

```
registry/
├── README.md            本文件
├── schema.json          五个文件的 JSON Schema（结构约束）
├── components.json      ★ 组件状态系统 —— 72 个组件 × 11 个 DoD 维度
├── dependencies.json    ★ 依赖 DAG + rc-* 替代方案
├── tokens.json          ★ Token 清单与覆盖进度
├── foundation.json      ★ 13 个 foundation 包 × 6 维度 + 等待裁决的开放决策
├── workstreams.json     ★ 92 个 Work Item / 15 条泳道 / 当前可并行批次
├── source/              输入：客观事实 + 人工决策
│   ├── antd-6.6.4.raw.json     从 antd 产物提取的事实（生成物，提交）
│   ├── components.meta.mjs     72 个组件的人工决策（分组/优先级/复杂度/备注）
│   ├── rc-map.mjs              rc-* → 能力 → 替代方案的决策表
│   ├── open-decisions.mjs      ★ 开放决策的**种子**（问题/选项/代价/建议）
│   └── workstreams.mjs         ★ 并行编排规则（泳道/冲突集/波次/横切任务）
└── tools/               可执行的工具链
    ├── extract-antd-facts.mjs  从 antd 产物提取事实
    ├── gen-registry.mjs        合成 components/dependencies/tokens
    ├── scaffold-packages.mjs   生成 packages/ 下 13 个包的骨架（导出 PACKAGES 供其他工具复用）
    ├── foundation-status.mjs   ★ foundation 包进度与下一个可做的包
    ├── gen-workstreams.mjs     ★ 推导 Work Item 状态与**当前可并行批次**
    ├── next-task.mjs           ★ 决定下一个（或下一批）任务
    └── validate-registry.mjs   把规范变成可执行的检查（E1–E18）
```

### 数据流向

```
antd npm 产物
     │ extract-antd-facts.mjs
     ▼
source/antd-<v>.raw.json ──┐
                           │ gen-registry.mjs
source/components.meta.mjs ┤
source/rc-map.mjs        ──┘
                           ▼
        components.json / dependencies.json / tokens.json
                           │
                           ├── scaffold-packages.mjs ──► packages/*/{package.json,README,tsconfig}
                           │                                      │
                           │                          foundation-status.mjs（度量 src + 实测覆盖率）
                           │                                      │  ← source/open-decisions.mjs
                           │                                      ▼
                           │                              foundation.json
                           │                                      │
                           ├──────────────────────────────────────┤
                           │                                      │
                           │            gen-workstreams.mjs  ◄────┘
                           │              ▲        （成员/状态/批次全部推导）
                           │              │
                           │      source/workstreams.mjs（编排规则）
                           │              │
                           │              ▼
                           │        workstreams.json
                           │              │
              ┌────────────┼──────────────┴──────────┬───────────────┐
              ▼            ▼                         ▼               ▼
        next-task    next-task --parallel       validate        Agent 的工作依据
        （一个）       （当前可并行批次）        （E1–E18）
```

---

## 2. 关键设计：状态字段是「保留」的

`gen-registry.mjs` / `foundation-status.mjs` 重跑时：

- **派生字段**（依赖、规模、DAG 层级、unblocks、Token 数、implOrder、消费者数）→ **刷新**
- **进度字段**（`status` / `apiStatus` / `testStatus` / ... / `blockers` / `dimensions` / `testLayers` / `openDecisions`）→ **保留**

这是让 Registry 能长期演进而不被生成器抹掉进度的前提。
升级 antd 版本时，重跑 `extract` + `gen`，review diff，进度不丢。

**注意**：派生字段**禁止手工编辑**。改了会在下次生成时被覆盖。
进度字段**可以也应该手工维护** —— 但必须能指向证据（测试输出、覆盖率报告、契约文档）。

---

## 2.5 foundation 包进度（`foundation.json`）

### 为什么单独有这么一个文件

`components.json` 只追踪 72 个组件。但组件进度会被 foundation 包卡住 ——
一个组件标记 `completed`，却建立在一个只有骨架的 `theme` 包上，那是**虚假进度**：
组件能 render，但 Token 与行为无法与 antd 对齐，而且这个错误要到很后面才暴露。

所以 foundation 包的进度必须同样机器可读，并参与「下一个任务」的判定。

### 两个顺序字段，别混淆

| 字段 | 含义 | 是否允许早于依赖 |
|---|---|---|
| `phase2Order` | Phase 1 报告定下的**推进顺序**，含 AR1/AR2 的 PoC 验证槽位 | **允许** —— 前提是 `pocRequired === true`（那个槽位做的是 PoC，不是完整实现） |
| `derived.implOrder` | 推导出的**严格拓扑序**（尊重 `dependsOn`） | 不允许，推导保证 |

例：`trigger` 的 `phase2Order=5`（AR1 定位 PoC 必须早做），但它依赖 `portal`（`phase2Order=7`），
所以 `implOrder=10`。两者不同不是 bug，而是「先验证风险」与「先满足依赖」这两件事本来就不一样。

**硬约束**（E15）：若某包 `pocRequired === false` 却排在其依赖之前，那是真错误 —— 它会无法开工。

### 六个进度维度

| 维度 | 含义 |
|---|---|
| `api` | 公共 API 契约已锁定（对照上游 `.d.ts`） |
| `impl` | 实现完成 |
| `types` | 类型完备（含 `*.test-d.ts` 负例） |
| `tests` | 测试达标（七层中适用的层 + 覆盖率阈值） |
| `docs` | 契约文档 / README 与实现一致 |
| `pkg` | 包配置与构建产物正确（`exports` 可解析、产物无 React 痕迹） |

### 七层测试的适用性

`testLayers` 显式记录 TESTING.md 七层中每一层的状态。
**`n/a` 必须由架构规则支撑**（如 R3 地基纯净 ⇒ L0 无视觉语义 ⇒ L6 不适用），
且必须在 `layerNotes` 里写出依据。

**硬约束**（E16）：有 `n/a` 层但没有 `layerNotes` → 报错。
这条规则是为了让 `n/a` 无法被用来掩盖未做 —— 这是「不降低验收标准」的机械保障。

### PoC 收口必须有结论（`pocResult`）

PoC 的作用是在投入之前**证伪或证实一个架构假设**。如果它只留下一句 `pocStatus: "done"`，
那就退化成一个无法追溯结论的状态字符串 —— 跟没做一样，却会解锁下游任务。

因此 `pocStatus === 'done'` 时**必须**同时填写 `pocResult`（**硬约束** E16）：

| 字段 | 含义 |
|---|---|
| `status` | `pass` / `pass-with-deviations` / `fail` |
| `summary` | 证明了什么，**以及没有证明什么** —— 后者同等重要，它决定风险转移到哪 |
| `evidence` | 可复现的证据：命令、文件路径、用例规模 |
| `deviations` | PoC 中发现并登记的偏差（`COMPATIBILITY.md` 的 `D<n>` 或开放决策 id） |
| `decidedAt` | 结论日期 |

**硬约束**（E16）：`deviations` 里的 `D<n>` 必须**真实出现在** `COMPATIBILITY.md` §9.2 的表格里
（校验器从 Markdown 刮取，不硬编码），否则「引用一个不存在的偏差」和没登记没有区别。
同理 `pocResult.status === 'fail'` 的包不得标记 `completed`。

### 开放决策（`openDecisions`）

项目「卡在什么问题上」与「做到哪了」同等重要。若不记录，它会散落在对话历史里，
每换一个会话就要重新解释一遍。

因此 `openDecisions` 登记等待用户裁决的跨切面决策，`blockedBy` 只能引用这里的 id
（**硬约束** E17）。裁决后把 `status` 改成 `decided` 并填 `decision`，
E17 会立刻报出仍引用它的包 —— 提醒你解除阻塞。

**内容不在 `foundation.json` 里写，写在 `source/open-decisions.mjs`。**
理由：`foundation.json` 是生成文件。早期版本把决策做成「生成时从旧文件原样保留」，
一旦文件丢失或首次生成，全部决策就永久消失了。现在：

| 字段 | 归属 |
|---|---|
| `id` `question` `context` `options` `recommendation` `impact` `blocks` `hardBlock` `raisedAt` | `source/open-decisions.mjs`（工具拥有，每次覆盖） |
| `status` `decision` `decidedAt` `decidedBy` `note` | `foundation.json`（人工裁决，跨运行保留） |

新增决策 → 改 `source/open-decisions.mjs`；裁决决策 → 改 `foundation.json` 的
`status`/`decision`。两者由 `foundation-status.mjs` 的 `mergeOpenDecisions()` 合并。
状态为 `decided` 的条目是**决策记录**（回溯为什么这么定），不是待办。

---

## 2.6 并行编排（`workstreams.json`）

`components.json` 与 `foundation.json` 回答「做到哪了」，
`workstreams.json` 回答「**现在能同时做哪些**」。

92 个 Work Item 分四种：

| kind | 数量 | 例 |
|---|---|---|
| `foundation` | 13 | `FND:theme` `FND:overlay` |
| `poc` | 2 | `FND:position:poc` `FND:motion:poc` |
| `component` | 72 | `COMP:button` |
| `crosscut` | 5 | `X:build-output-contract` `X:ci-pipeline` `X:visual-infra` `X:a11y-pipeline` `X:docs-site` |

**Item 不手工列举** —— 那会与 components/foundation 双份维护、必然漂移。
成员归属、状态、批次全部由 `gen-workstreams.mjs` 从 registry 现状 +
`source/workstreams.mjs` 的编排规则推导。

### 四个状态，必须分清

| 状态 | 含义 |
|---|---|
| `done` | 已完成 |
| `ready` | 依赖已满足，可以开工 |
| `blocked` | 有未完成的依赖 |
| `waiting-decision` | 只被 `hardBlock` 的开放决策挡住 |

外加一个**正交**标记 `cannotFinish`：可以开工，但有软阻塞的决策未裁决，**收不了口**。
混淆「收不了口」与「不能开工」会导致两种事故：前者让人空转，后者让人在空地基上盖楼。

### 泳道与冲突集

- **泳道**（15 条）解决"改不同文件"的并行，每条有 `owns`（独占路径）与 `maxParallel`（并发上限）。
- **冲突集**（8 个）解决"共享文件"的并行：
  - `exclusive`（5 个）：开发期互斥，**跨泳道**冲突即不可同时开工
  - `serialized`（3 个）：提交期排序，不阻止并行开发

同一泳道内不按冲突集互斥（已由 `maxParallel` 限流）—— 否则泳道里永远只能跑一个，
那是把「限流」误实现成「禁用」。

### 波次是怎么算的

```
组件波次 = max(4 + min(dagLevel, 4), 最晚 foundation 依赖波次 + 1)
```

一个组件即使 DAG 层级很低，只要它依赖 `overlay`（W3），也不会早于 W4 开工。

### 硬约束（E18）

引用完整性（泳道/波次/冲突集/Item/决策）、覆盖率（13 包 + 72 组件都必须有 Item）、
依赖无环、批次合法（`currentBatch` 只含 `ready`、无跨泳道 `exclusive` 冲突、未超并发上限）、
泳道归属与 `components.json` 的 `group` 一致。

### foundation 包状态机

```
todo ──► analyzing ──► implementing ──► testing ──► verifying ──► completed
             │              │              │            │
             └──────────────┴──────────────┴────────────┘
                            ▼
                         blocked
```

比组件状态机多一个 `verifying`：foundation 包的验收门槛包含
「覆盖率达标 + 契约文档 + 产物构建」三项，缺一不可。

**硬约束**（E16）：`status === 'completed'` 时必须同时满足
—— 六个维度全部 `done`/`n/a`、七个测试层全部 `done`/`n/a`、
`thresholds.met === true`、`build.status === 'passing'`、`blockedBy` 为空。
**五项缺任何一项都不允许标记 completed。**

---

## 3. 状态机

### 组件级 `status`

```
todo ──► analyzing ──► implementing ──► testing ──► visual-review ──► completed
             │              │              │              │
             └──────────────┴──────────────┴──────────────┘
                            ▼
                         blocked
```

| 状态 | 含义 | 对应 Gate |
|---|---|---|
| `todo` | 尚未开始 | — |
| `analyzing` | 正在分析 antd 参考实现 | G1 |
| `implementing` | 正在实现（API / Token / 代码） | G2-G4 |
| `testing` | 正在跑测试 | G5-G8 |
| `visual-review` | 正在视觉验收与双实现比对 | G9-G10 |
| `blocked` | 被阻塞，见 `blockers` 字段 | — |
| `completed` | 全部 14 道 Gate 通过 | G0-G14 |

### 维度级 `*Status`

| 值 | 含义 |
|---|---|
| `todo` | 未开始 |
| `analyzing` | 分析中 |
| `in-progress` | 进行中 |
| `done` | 已完成 |
| `blocked` | 被阻塞 |
| `n/a` | 该组件不适用此维度 |

**硬约束**（由 `validate-registry.mjs` 检查 E3）：
`status === 'completed'` 时，7 个维度必须全部为 `done` 或 `n/a`。

---

## 4. 优先级

| 优先级 | 含义 | 数量 |
|---|---|---|
| **P0** | 地基与首个垂直切片 —— 没有它就无法验证任何流水线 | 8 |
| **P1** | 简单展示 —— 无浮层、无引擎，用来把 7 层测试跑顺 | 12 |
| **P2** | 无浮层的表单/展示控件 | 12 |
| **P3** | 浮层基础设施的第一个消费者（trigger / portal / motion 的验证点） | 10 |
| **P4** | 浮层之上的交互控件 | 14 |
| **P5** | 数据密集型与复杂引擎 | 16 |

**硬约束**（E5）：组件的优先级**不得早于**其任一阻塞性依赖。
这条规则保证「按优先级顺序开发」永远不会遇到「依赖还没做」的情况。

---

## 5. 常用命令

```bash
# 生成 / 刷新三个 registry 文件（保留进度字段）
node registry/tools/gen-registry.mjs

# 打印依赖 DAG 分层 + 推荐开发顺序
node registry/tools/gen-registry.mjs --print-dag

# ★ foundation 包进度（保留进度字段）
node registry/tools/foundation-status.mjs
node registry/tools/foundation-status.mjs --package utils   # 单包详情
node registry/tools/foundation-status.mjs --verify          # 跑测试+覆盖率，写入实测事实
node registry/tools/foundation-status.mjs --check           # CI：过期则失败
node registry/tools/foundation-status.mjs --json            # 机器可读

# ★ 并行编排（保留/推导 92 个 Work Item 与当前批次）
node registry/tools/gen-workstreams.mjs
node registry/tools/gen-workstreams.mjs --parallel    # 只打印当前可并行批次
node registry/tools/gen-workstreams.mjs --wave W2     # 单个波次的成员与退出条件
node registry/tools/gen-workstreams.mjs --check       # CI：过期则失败

# ★ 决定下一个任务（Agent 的唯一权威来源）
node registry/tools/next-task.mjs                     # 下一个**一个**（单人串行）
node registry/tools/next-task.mjs --parallel           # 当前**全部**可并行开工的任务
node registry/tools/next-task.mjs --workstream WS-C    # 单条泳道的全部任务
node registry/tools/next-task.mjs --explain            # 完整候选排序与理由
node registry/tools/next-task.mjs --json               # 机器可读
node registry/tools/next-task.mjs --component button   # 单组件详情
node registry/tools/next-task.mjs --foundation         # foundation 包进度与下一个包
node registry/tools/next-task.mjs --require-foundation # 只列 foundation 依赖已就绪的组件
node registry/tools/next-task.mjs --all                # 全部候选

# 校验规范是否被遵守
node registry/tools/validate-registry.mjs
node registry/tools/validate-registry.mjs --strict       # warning 也算失败

# 一条命令跑完全部注册表检查（CI 用）
pnpm run registry:check

# 升级 antd 目标版本时
node registry/tools/extract-antd-facts.mjs --version 6.7.0
node registry/tools/gen-registry.mjs
git diff registry/        # ★ 必须人工 review 这个 diff
```

### 为什么 `next-task` 会提醒你「不要开始这个组件」

组件的 `blockedBy` 只表达「组件依赖组件」，不表达「组件依赖 foundation 包」。
所以 `next-task` 会把 `empty`（P0，解锁 51 个下游）报成下一个任务 ——
但它依赖的 `@apollo-design/theme` 还只有骨架。

此时 `next-task` 会打印显式告警并把 foundation 任务指向出来：

```
⚠️  不要开始这个组件：它依赖的 foundation 包尚未就绪
      @apollo-design/theme  status=todo
      @apollo-design/utils  status=blocked
    在空地基上做组件会产出虚假进度 —— 组件可以 render，但 Token/行为无法与 antd 对齐。

    先做 foundation：node registry/tools/next-task.mjs --foundation
```

用 `--require-foundation` 可以硬过滤掉这些组件。在 foundation 全部 `completed` 之前，
这个模式会诚实地报告「没有可执行的任务」—— 那是事实，不是工具故障。

### 串行 vs 并行：用哪个

```
node registry/tools/next-task.mjs              单人推进：只给一个
node registry/tools/next-task.mjs --parallel   多人/多会话：给当前最大可并行集合
```

两者从**同一份 DAG** 推导（并行视图读 `workstreams.json`，而它又由 components/foundation
推导），因此不可能给出矛盾结论。默认模式适合一次做一件事；
`--parallel` 适合先看清全局再决定投入哪里。

---

## 6. 校验项清单

`validate-registry.mjs` 检查：

| 编号 | 检查 |
|---|---|
| E1 | registry 文件存在且可解析 |
| E2 | 状态字段取值合法 |
| E3 | completed 组件的 11 个维度全部 done |
| E4 | 组件级运行时 DAG 无环 |
| E5 | 优先级不违反 DAG 拓扑序 |
| E6 | `blockedBy` 与实际依赖完成状态一致 |
| E7 | `dependencies.json` 的边与 `components.json` 的依赖一致 |
| E8 | foundation 包引用合法 |
| E9 | completed 组件有 compat fixture |
| E10 | 已实现的组件样式中无硬编码视觉值 |
| E11 | 构建产物中无 React 痕迹（违反 H1/H5/H6） |
| E12 | 与 antd 事实文件一致（组件数、Token 数） |
| E13 | `tests/compat/schema.json` 存在 |
| E14 | `foundation.json` 与 `dependencies.json` / `components.json` 一致 |
| E15 | foundation 顺序约束（`phase2Order` 唯一、`implOrder` 拓扑有效、PoC 豁免规则） |
| E16 | foundation 进度字段合法；`completed` 必须通过覆盖率与构建门禁；`n/a` 必须有 `layerNotes` |
| E17 | `blockedBy` / `softBlockers` / `decidedBy` 只能引用已登记的开放决策 |
| E18 | `workstreams.json` 一致：Item 覆盖 13 包 + 72 组件、依赖无环、批次合法（无跨泳道 exclusive 冲突、未超并发上限、只含 ready）、泳道归属与 `group` 一致 |

**E10 与 E11 是硬 Gate**：前者守住 Token 系统（H9），后者守住「不引入 React」（H1）。
**E15/E16/E17 是 foundation 的硬 Gate**：它们让「地基没做完就去做组件」在机械上不可能通过校验。
**E18 是并行编排的硬 Gate**：它让「按过期图施工」与「批次里塞进互相打架的任务」无法通过校验。

---

## 7. 与 antd 版本升级的关系

Registry 的价值在于：**升级 antd 目标版本时，变更影响面是可见的。**

流程：

1. `extract-antd-facts.mjs --version <new>`
2. `gen-registry.mjs`
3. `git diff registry/` —— 你会看到：
   - 新增/删除的组件
   - 新增/删除的 rc 依赖
   - 变化的内部依赖 DAG 边
   - 变化的 Token 数量
   - 因依赖变化而需要调整的优先级（E5 会报错提示）
4. **人工 review 这个 diff**，判断哪些是破坏性变更
5. 更新 `AGENTS.md` §5.1 的锁定版本号

没有 Registry，这一步只能靠翻 antd 的 CHANGELOG 猜。
