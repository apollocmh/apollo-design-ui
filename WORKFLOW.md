# WORKFLOW.md

> 定义**怎么做**：任务的领取方式、Definition of Done、并行执行协议、14 道 Gate。
>
> 配套文档：`ARCHITECTURE.md`（结构是什么）、`COMPATIBILITY.md`（对齐到什么程度）、
> `COMPONENT-RULES.md`（单个组件怎么写）、`ROADMAP.md`（什么时候做什么）、`TESTING.md`（七层测试细节）。

---

## 0. 总览

本项目的开发循环只有一条，不存在"我自己挑一个组件先写着"这种路径。

```
  ┌──────────────────────────────────────────────────────────────┐
  │  领取      next-task.mjs --parallel                           │
  │            └── 从 DAG 推导出的当前可并行批次（唯一权威来源）     │
  └───────────────────────────┬──────────────────────────────────┘
                              ▼
  ┌──────────────────────────────────────────────────────────────┐
  │  执行      G0 CLAIM → G14 COMMIT  共 15 步                     │
  │            每步有明确产出物，缺一步即未完成                      │
  └───────────────────────────┬──────────────────────────────────┘
                              ▼
  ┌──────────────────────────────────────────────────────────────┐
  │  收口      pnpm verify:full（registry:check + lint + test +      │
  │            test:build，全仓四道全绿）                            │
  │            ⚠️ 跑之前先关掉 IDE —— 实测 16 分钟 → 7 分 49 秒        │
  └───────────────────────────┬──────────────────────────────────┘
                              ▼
                        回到领取（DAG 自动解锁下游）
```

---

## 1. Definition of Done

DoD 分两套：**基础设施包 6 个维度**，**组件 11 个维度**。
两者都要求 7 层测试按适用性通过。

### 1.1 基础设施包 DoD（6 维度）

| 维度 | 含义 | 判据 |
|---|---|---|
| `api` | 公共 API 契约锁定 | 与上游 `.d.ts` 逐条对照完毕，全部偏差登记在 `COMPATIBILITY.md` |
| `impl` | 实现完成 | 源码完成，无 `TODO` / 空实现 |
| `types` | 类型完备 | 含 `*.test-d.ts` 负例；`vue-tsc` 零错误（含 `noUncheckedIndexedAccess`） |
| `tests` | 测试达标 | 适用的 7 层全通过 + 覆盖率 **95 / 90 / 95** |
| `docs` | 文档一致 | README / 契约文档与实现一致 |
| `pkg` | 包配置与产物正确 | `exports` 每个子路径可解析；`pnpm build` 退出码 0；产物无 React 痕迹 |

**置 `completed` 的硬门禁**（由 `registry:validate` E16 强制）：
6 个维度全部 `done` 或 `n/a` ＋ 7 个测试层全部 `done` 或 `n/a`（`n/a` 必须填 `layerNotes`）
＋ `thresholds.met === true` ＋ `build.status === 'passing'` ＋ `blockedBy` 为空。

### 1.1.1 PoC 的 DoD（只适用于 `pocRequired === true` 的包）

PoC 不是「先写个能跑的」，它是**一次证伪实验**：目的是在投入之前判断架构假设是否成立。
因此它的验收标准与包的实现验收不同 —— 不看功能完整度，看**结论是否站得住**。

| 判据 | 要求 |
|---|---|
| 对照物是**机械移植**，不是理解重写 | 把上游对应实现逐行搬过来当 oracle，保留变量名与求值顺序。否则差分通过只能说明「两边都想通了」，无法把分歧归因于「我们有意改了什么」 |
| 差分规模够大且可复现 | 用确定性 PRNG 生成千级用例，比对全部输出量。写死种子，使失败可复现 |
| 发现的偏差已登记 | 进 `COMPATIBILITY.md` §9.2 与 `openDecisions`；oracle 上保留开关，使「这是唯一差异」本身成为断言 |
| **写明没有证明什么** | 同等重要。PoC 通过不代表风险消失，只代表它**转移**了 —— 必须写清转移到哪个包 / 哪一层 |
| 填 `pocResult` | `status` / `summary` / `evidence` / `deviations` / `decidedAt`。E16 强制 |

> 判据「对照物是机械移植」是 AR1 PoC 之后补的。当时如果照理解重写，
> 5000 组差分通过会给出一个**虚假的**安心感 —— 因为连 antd 的缺陷都会被一起重写进来。

### 1.2 组件 DoD（11 维度）

| 维度 | 对应 Gate | 含义 |
|---|---|---|
| `antdApiStatus` | G1 | antd 6.6.4 的 API 面已完整枚举（props/events/slots/methods/ref） |
| `apiStatus` | G2 | Vue API 设计定型（props/ emits / slots / expose） |
| `compatStatus` | G10 | 与 antd 的双实现比对通过，差异已登记 |
| `tokenStatus` | G3 | Component Token 已定义并接入派生链 |
| `styleStatus` | G4 | 样式完成且无硬编码视觉值（E10） |
| `unitStatus` | G5 | L1 单元测试通过 |
| `interactionStatus` | G6 | L2 交互测试通过 |
| `typeStatus` | G7 | L3 类型测试（含负例）通过 |
| `a11yStatus` | G8 | L5 无障碍测试通过 |
| `visualStatus` | G9 | L6 视觉回归基线建立且通过 |
| `docsStatus` | G11 | 组件文档 + demo 与 antd 一一对应 |

**另外两道不在维度表里但同样强制**：L4 DOM 契约（并入 `compatStatus` 的证据）、
L7 构建（`registry:validate` 全绿 + `pnpm build`）。

### 1.3 七层测试的适用性

| 层 | 基础设施包 | 组件 |
|---|---|---|
| L1 单元 | ✅ 必需 | ✅ 必需 |
| L2 交互 | 有 DOM 交互的包必需 | ✅ 必需 |
| L3 类型 | ✅ 必需 | ✅ 必需 |
| L4 DOM 契约 | 有 DOM 产物的包必需 | ✅ 必需 |
| L5 无障碍 | 无 DOM 语义的包 `n/a` | 有交互/语义的组件必需 |
| L6 视觉 | **全部 `n/a`**（L0/L1/L2 不产组件样式，R4） | ✅ 必需 |
| L7 构建 | ✅ 必需 | ✅ 必需 |

`n/a` 不是免死金牌：E16 要求每个 `n/a` 都有 `layerNotes` 说明架构依据。

---

## 2. 并行执行协议

### 2.1 三种视图

```
node registry/tools/next-task.mjs                 # 单人串行：下一个**一个**任务
node registry/tools/next-task.mjs --parallel      # 多人并行：当前**全部**可开工任务
node registry/tools/next-task.mjs --workstream WS-C  # 单条泳道的全部任务
node registry/tools/gen-workstreams.mjs --wave W2  # 单个波次的成员与退出条件
```

三者从**同一份 DAG** 推导，不可能给出矛盾结论。

### 2.2 泳道（Workstream）

15 条泳道，每条独占一块地盘：

| 泳道 | 名称 | 归属 | 并发上限 |
|---|---|---|---|
| `WS-A` | 地基与工具 | `utils` `test-utils` | 2 |
| `WS-B` | 主题与图标 | `theme` `icons` | 2 |
| `WS-C` | 浮层与定位 | `position` `overlay` | 2 |
| `WS-D` | 动效与传送 | `motion` `portal` | 2 |
| `WS-E` | 无障碍与虚拟列表 | `a11y` `virtual-list` | 2 |
| `WS-F` | 表单与选择引擎 | `form-core` `picker` | 2 |
| `WS-G` | 国际化 | `locale` | 2 |
| `WS-1`…`WS-7` | 通用 / 布局 / 导航 / 数据录入 / 数据展示 / 反馈 / 其他 | 按 `components.json` 的 `group` | 3 |
| `WS-X` | 横切基建 | 文档站 / CI / 视觉回归 / registry 工具 | 2 |

### 2.3 冲突集（Conflict Set）

泳道独占解决"改不同文件"的并行；**共享文件**由冲突集管理：

| 冲突集 | 模式 | 路径 | 说明 |
|---|---|---|---|
| `CF-ROOT-CONFIG` | **exclusive** | `package.json` `tsconfig.json` `vitest.config.ts` `biome.json` `pnpm-workspace.yaml` … | 改这里会同时改变所有人的构建/类型/lint 结果 |
| `CF-REGISTRY-TOOLS` | **exclusive** | `registry/tools/**` `registry/schema.json` `registry/source/**` | "改规则"必须与"用规则"分开 |
| `CF-TOKEN-SOURCE` | **exclusive** | `packages/theme/src/**` `registry/tokens.json` | Token 改名影响全部 72 个组件 |
| `CF-STYLE-GLOBAL` | **exclusive** | `packages/ui/src/style/**` | 所有组件的公共样式祖先 |
| `CF-TEST-INFRA` | **exclusive** | `vitest.setup.ts` `tests/**` `packages/test-utils/**` | 改断言工具会静默改变所有测试的含义 |
| `CF-REGISTRY-STATE` | serialized | `registry/components.json` `foundation.json` `workstreams.json` | 状态字段，可并行写，提交时排序 |
| `CF-VISUAL-BASELINE` | serialized | `tests/visual/**` | 按组件分目录，追加不冲突 |
| `CF-DOCS` | serialized | `docs/**` `*.md` | 按组件分文件，可并行 |

**规则**：
- `exclusive` 集合**跨泳道互斥** —— 不同泳道的两个任务不能同时改。
- 同一泳道内不按冲突集互斥（已由 `maxParallel` 限流）。
- `serialized` 集合不阻止并行开发，只在合并时排序。

### 2.4 批次是怎么算出来的

`gen-workstreams.mjs` 的 `buildBatch()`：

1. 取所有 `status === 'ready'` 的 Item
2. 按 `(波次, 是否横切, 优先级, -解锁下游数, 复杂度)` 排序
3. 逐个尝试加入：泳道未超 `maxParallel` 且不与已选项**跨泳道**冲突 → 加入

结果写进 `workstreams.json` 的 `currentBatch`，由 `registry:validate` 的 **E18** 复核
（无环 / 无跨泳道 `exclusive` 冲突 / 未超并发上限 / `currentBatch` 只含 `ready`）。

### 2.5 三种"卡住"必须分清

| 状态 | 含义 | 该做什么 |
|---|---|---|
| `blocked` | 有未完成的依赖 | 去做依赖，别硬上 |
| `waiting-decision` | 被 `hardBlock` 的开放决策挡住 | 找用户裁决，别猜 |
| `ready` + `cannotFinish` | 可以开工，但有软阻塞的决策未裁决，**收不了口** | 可以做，但要清楚最后一步会卡住；优先推动裁决 |

混淆这三者会导致两种典型事故：把"收不了口"当成"不能开工"从而空转；
或把"不能开工"当成"可以开工"从而在空地基上盖楼。

---

## 3. 十五道 Gate（G0–G14）

### G0 · CLAIM — 领取任务

```bash
node registry/tools/next-task.mjs --parallel
# 或串行：node registry/tools/next-task.mjs
```

**禁止**自己挑组件。选任务的权力在 DAG，不在执行者的直觉。

### G1 · ANALYZE — 分析 antd 参考实现

- 读 `/tmp/antd-src/package/es/<name>/` 的 `.d.ts`，枚举完整 API 面
- 读 antd 的 demo（1148 个）与测试（641 个文件），提取行为契约
- 产出：API 面清单（props / events / slots / methods / ref / token）
- 维度：`antdApiStatus` → `done`

### G2 · API DESIGN — 定义 Vue API

按 `COMPATIBILITY.md` 的映射规则把 React API 转成 Vue API：
`value+onChange → v-model`、`children/render → slot`、`Context → provide/inject`、
`useXxx → useXxx composable`。

- 维度：`apiStatus` → `done`

### G3 · TOKEN — 定义 Component Token

- 在 `packages/theme` 中定义该组件的 Token 组（对齐 antd 的 Component Token 命名）
- 全部视觉值走 `var(--apollo-*)`，无字面值
- 维度：`tokenStatus` → `done`

### G4 · IMPLEMENT — 实现

按 `COMPONENT-RULES.md` 的骨架规范实现。

- 维度：`styleStatus` → `done`

### G5 · TEST L1 — 单元测试

### G6 · TEST L2 — 交互测试（`@vue/test-utils`）

### G7 · TEST L3 — 类型测试（`*.test-d.ts`，含负例）

> ⚠️ `*.test-d.ts` **会被 vitest 真的执行**，不只是类型检查。
> 负例必须包在永不调用的闭包里，否则运行时崩溃。

### G8 · TEST L5 — 无障碍测试

`axe-core` + 键盘导航 + 焦点管理断言。

### G9 · VISUAL — 视觉回归验收

`tests/visual/` 建立基线并比对。基线存放策略见开放决策 `visual-baseline-in-git`。

### G10 · COMPAT — 双实现兼容性比对

`tests/compat/` 同时挂载 antd（React 侧）与本实现（Vue 侧），比对：
DOM 结构、class 命名、ARIA 属性、键盘行为、受控/非受控语义。
差异必须写进 `COMPATIBILITY.md` 的差异登记表。

### G11 · DOCS — 文档

组件文档 + demo，与 antd 的 demo 一一对应。

### G12 · REGISTRY — 更新 Registry

把 11 个维度中已完成的置 `done`。**这是唯一让进度被承认的方式。**

### G13 · BUILD — 构建校验

```bash
pnpm run registry:check   # E1–E18
pnpm run lint             # vue-tsc + biome
pnpm run test             # unit / dom-contract / a11y / theme
pnpm run test:build       # 构建门禁（127 项）
```

四道全绿才能把维度置 `done`。

#### ⚠️ 关于「增量门禁」：**已验证无效，不要采用**（2026-09-20）

曾经尝试用「只跑受影响包」来提速（`scripts/verify-changed.mjs`），
**实测证伪**，结论如下（本机 i7-4770HQ / 4c8t / 16GB）：

| 方案 | 实测 | 结论 |
|---|---|---|
| 全仓 vue-tsc（WebStorm 开着、内存吃紧） | 约 **16 分钟** | 基线 |
| 全仓 vue-tsc（WebStorm 关闭、空闲内存 5.4G） | **7 分 49 秒** | ⭐ **真正的瓶颈是机器负载，不是门禁设计** |
| 作用域 vue-tsc（只含 `ui` 包） | **> 10 分钟**（未跑完） | ❌ **比全仓还慢** |
| 作用域 vue-tsc（只含单个组件目录） | **> 4 分钟**（未跑完） | ❌ 同样无效 |

**根因：TypeScript 会沿 `import` 传递地检查文件。**
收窄 `include` 只减少「根文件」，而 `packages/ui/src/index.ts` → 各组件 → `config-provider`
→ `utils`/`theme`… 会把**整个依赖图**拉进来 ⇒ 实际工作量几乎没变，
反而因为「没有全仓那份可复用的模块解析结果」而更慢。

⇒ **提速的正确方向是「减少运行次数」与「降低机器负载」，不是「收窄范围」：**
1. ⭐ **一次收口只跑一次全仓门禁**（把 G13 的四道命令串成一次，别在开发中途反复跑）
2. ⭐ **跑门禁前先关掉 IDE / 浏览器等吃内存的进程**（实测 16 分钟 → 7 分 49 秒）
3. 若还要进一步提速，正解是 **`tsc --build` + project references（`composite: true`）**——
   让 TS 按包增量、并用 `.tsbuildinfo` 缓存。那是**独立的结构性改造**，
   需要给每个包加 `tsconfig.json`，尚未做。

⚠️ `scripts/verify-changed.mjs` 保留在仓库里作为**实验记录**，
   但**不要**把它当作门禁使用（它的默认行为已改为只跑 typecheck，
   且实测不比全仓快）。`pnpm verify:full` 是全仓门禁的便捷入口。

### G14 · COMMIT — 提交

一次提交只做一件事。commit message 带上 Item id（如 `feat(button): … [COMP:button]`）。

---

## 4. 「继续推进」协议

当用户说"继续"时，按顺序执行，**不要跳步**：

1. `node registry/tools/next-task.mjs --parallel` —— 拿当前批次
2. 若批次为空：
   - 有 `waiting-decision` → 向用户列出决策与建议，等待裁决
   - 全是 `blocked` → 打印阻塞链，找出最上游的未完成项
3. 从批次中挑一个（默认取排序最前的；有依赖冲突时按 §2.4 的排序）
4. 走 G1→G14
5. 每完成一个维度，立即更新 registry
6. 完成后重新运行批次选择 —— DAG 会自动解锁下游
7. 汇报：做了什么、哪些维度置 done、解锁了什么、遇到什么阻塞

**禁止**：
- 不查 registry 就开始写组件
- 一次同时推进同一泳道内超过 `maxParallel` 个任务
- 在 `registry:check` 红的情况下继续下一个任务

---

## 5. 阻塞处理

### 5.1 遇到开放决策

1. 不要猜。把决策写进 `registry/source/open-decisions.mjs`（内容）
   与 `foundation.json` 的 `blockedBy`（影响面）。
2. 向用户列出：问题、选项、各自的代价、建议。
3. 裁决后：在 `foundation.json` 中把决策 `status` 置 `decided` 并填 `decision`，
   从相关包的 `blockedBy` 中移除，重新生成。

> E17 会检查：`blockedBy` 只能指向**已登记的开放决策**；指向已裁决的决策是错误
> （说明裁决后忘了解除阻塞）。

### 5.2 遇到测试失败

按 `TESTING.md` 的顺序处理：**先确认是测试写错了，还是实现错了**。
不允许通过放宽断言、跳过用例、调低覆盖率阈值来"修好"测试。

### 5.3 遇到与 antd 无法对齐的地方

判定顺序：
1. 是我们实现错了 → 改实现
2. 是 Vue 与 React 的固有差异 → 用 Vue 原生方案，登记到 `COMPATIBILITY.md` §9
3. 是 antd 自身的缺陷 → 登记差异并说明理由，**不要复刻缺陷**

---

## 6. 证据规则

任何"已完成"的声称都必须附证据：

| 声称 | 证据 |
|---|---|
| 测试通过 | 命令输出（文件数 / 用例数 / 失败数） |
| 覆盖率达标 | `coverage-summary.json` 的实际数字 |
| 类型无误 | `vue-tsc` 退出码 0 的输出 |
| 与 antd 对齐 | `tests/compat` 的比对结果或 DOM 结构 diff |
| 无 React 痕迹 | E11 扫描输出 |

**不能作为证据的**："应该没问题"、"我检查过了"、"理论上成立"。
