# CI 性能瓶颈报告

> **数据来源**：GitHub Actions 真实运行 **run `37201797471`**（commit `1271ab6`，2026-10-04，全绿那次）。
>
> - 逐 step 时间：`GET /repos/apollocmh/apollo-design-ui/actions/runs/37201797471/jobs`
> - vitest 构成：job 日志里的 `Duration …s (environment X%, tests Y%, import Z%, setup …)` 行
> - 视觉层归因：`tests/visual/{run,stabilize,compare}.mjs` 源码
>
> **本报告只做诊断。未修改任何代码 / 测试 / 阈值 / 门禁配置。**



---

## 0. 当前总耗时

| 指标                        | 值                                                            |
| ------------------------- | ------------------------------------------------------------ |
| **墙钟（关键路径）**              | **40m20s**（12:21:05 → 13:01:25）                              |
| 6 个 job 时长合计（≈ runner 分钟） | **86.5 min**（并行度 ≈ 2.1×）                                     |
| 关键路径 job                  | **`L6 视觉回归` 2420s**                                          |
| 第二个长 job                  | `覆盖率` 1422s（12:22:13 起 —— 比其它 job **晚 68s 才开始**，是 runner 排队） |

⚠️ 私有仓库免费额度 **2000 min/月** ⇒ 按 86.5 min/run 算，**约 23 次推送/月**就耗尽。

---

## 1. Top 10 耗时步骤（真实逐 step）

| #  | job · step                                              | 时长                 |
| -- | ------------------------------------------------------- | ------------------ |
| 1  | `visual` · **L6 像素比对（非阻塞）**                             | **2229s = 37m09s** |
| 2  | `coverage` · **覆盖率（串行四 project）**                       | **1395s = 23m15s** |
| 3  | `test` · **运行时四层（unit / dom-contract / a11y / theme）**  | **909s = 15m09s**  |
| 4  | `build` · 构建全部包 + L7 产物校验                               | 152s               |
| 5  | `test` · 类型层（`*.test-d.ts`）                             | 143s               |
| 6  | `visual` · 构建全部包（L6 依赖 dist）                            | 137s               |
| 7  | `lint` · vue-tsc + biome                                | 55s                |
| 8  | `visual` · 安装 Chromium                                  | 28s                |
| 9  | 6 × `Run ./.github/actions/setup`（pnpm install）         | 10–18s 各，合计 ≈ 90s  |
| 10 | artifact 上传（`visual-diff` 14.3 MB / `coverage` 6.25 MB） | **3s / 4s**        |

（`registry:check` 本体 0s；每个 job 的 checkout ≈ 3s；`Set up job` ≈ 1s）

---

## 2. 重复执行分析

### `test` 与 `coverage` —— **完整重复**

|            | 命令                       | 跑的 project                         | 执行方式                                                   | 墙钟    |
| ---------- | ------------------------ | ---------------------------------- | ------------------------------------------------------ | ----- |
| `test`     | `pnpm run test`          | unit + dom-contract + a11y + theme | **4 个独立进程**，各自默认并行                                     | 906s  |
| `coverage` | `pnpm run test:coverage` | **完全相同的这 4 个**                     | **1 个进程 + `--maxWorkers=1 --no-file-parallelism` 全串行** | 1392s |

⇒ **同一批 10092 个用例被执行了两次**，合计 **2298s（38m18s）** 的测试执行时间 —— 其中约一半是纯重复。

### `visual` —— 无「双端渲染」重复，但有两处重复工作

- ✅ `--mode compare` **只渲染 Vue**，React 参照是入库基线 ⇒ 没有「两侧各渲染一遍」的重复。
- ❌ **「构建全部包」被跑了两次**：`build` job 152s + `visual` job 137s。
- ❌ **「安装 Chromium」每次 28s**，未缓存。

---

## 3. `coverage` 为什么比 `test` 慢

|                | 墙钟        | vitest 的 Duration 构成                                                                                                     |
| -------------- | --------- | ------------------------------------------------------------------------------------------------------------------------ |
| `test`（4 进程并行） | **906s**  | unit：env **40%** / import 17% / setup 17% / **tests 16%** / transform 9%<br />dom-contract 115s · a11y 196s · theme 163s |
| `coverage`（串行） | **1392s** | env **30%** / **tests 24%** / import **22%** / setup 14% / transform 8% / worker 2%                                      |

- **主因是「串行」，不是插桩**：1392 / 906 = **1.54×**，与「4 进程并行 → 1 进程串行」的预期一致。  
  串行是**既有的防 thrash 裁决**：4 个 project 挤一个进程并发时 worker 互相争抢，  
  `theme` 从 84s 劣化到 9min、24 条撞 5s 超时（`foundation-status.mjs` 2026-09-16 已记录）。
- 覆盖率插桩的代价只体现在 `transform` / `import` 略高，**不是主因**。
- 🚨 **真正的成本结构**：`tests` 只占 **24%**，其余 **76% 是环境 / 导入 / 初始化**（详见 §9）。

---

## 4. `L6 visual` 的 40 分钟具体在哪

| 阶段                                  | 时长        | 备注                                                     |
| ----------------------------------- | --------- | ------------------------------------------------------ |
| `Set up job` + `checkout` + `setup` | 18s       |                                                        |
| `L6 基线自检`（阻塞）                       | 1s        | 无浏览器、确定性                                               |
| **构建全部包**                           | **137s**  | L6 解析 `packages/ui/dist`，且 `ui/dist` external 化了 11 个包 |
| **安装 Chromium**                     | **28s**   | 未缓存                                                    |
| **像素比对（非阻塞）**                       | **2229s** | **1125 个 case，串行 `for` 循环**（`run.mjs:268`）             |
| 上传 diff 产物                          | 3s        | 14.3 MB ⇒ **artifact 不是瓶颈**                            |

### 像素比对内部拆解（1125 case × **1.98s/case**）

| 项                                                     | 每 case | 合计        | 占比      |
| ----------------------------------------------------- | ------ | --------- | ------- |
| 🚨 **固定 `waitForTimeout(1100)`**（`stabilize.mjs:172`） | 1.10s  | **1237s** | **55%** |
| 另一处固定等待（`waitForFonts` 的 50ms）+ 2 帧 rAF               | ~0.06s | ~67s      | 3%      |
| **每 case 新建 browser context + page**（`run.mjs:181`）   | ~0.3s  | ~340s     | 15%     |
| 导航 + 渲染 + 等 `window.__VISUAL_READY__`                 | ~0.3s  | ~340s     | 15%     |
| 截图 + `sharp` 解码 + `pixelmatch` 比对                     | ~0.2s  | ~225s     | **10%** |

⇒ **像素比对本身（sharp/pixelmatch）只占 ~10%**；**58% 是固定等待**；15% 是每 case 重建浏览器上下文。

### baseline 侧

- 没有「macOS/Linux 双基线」导致的重复渲染 ✓。
- ⚠️ 但**入库基线是 macOS + 系统 Chrome 生成的** ⇒ CI（Linux）上 **1125/1125 全部不同**  
  ⇒ **这 37 分钟不产生任何 pass/fail 信号**，只产出 diff 产物。  
  这是设计如此（跨平台非阻塞），但它意味着这 37 分钟的**门禁信息量目前为 0** —— 纯粹是「留档」。

---

## 5. 哪些 job / step 可以并行

- ✅ **6 个 job 已经全部并行**（无任何 `needs`、无串行依赖）。
- 可并行的**内部**：
  - **视觉的 1125 case 是串行 `for` 循环** ⇒ **可以 shard**（case 之间无共享状态）。
  - `coverage` 的 4 个 project 串行 ⇒ 理论上可拆 4 个进程（但需要合并覆盖率报告）。
- ❌ **不能盲目加 worker**：runner 只有 **2 vCPU**，且仓库已实测「4 project 并发会争抢」  
  （theme 84s → 9min）。

---

## 6. 哪些结果可以复用

1. **4 个 project 的测试结果**（`test` 与 `coverage` 完全重复）—— 最大的一块。
2. **「构建全部包」的 dist**（`build` 与 `visual` 各跑一次，152s + 137s）。
3. **覆盖率报告已上传 artifact**（6.25 MB），但**目前没有任何下游 job 使用它**。

---

## 7. 哪些地方可以使用 cache

| 目标                                                 | 现状                                 | 可省                          |
| -------------------------------------------------- | ---------------------------------- | --------------------------- |
| pnpm store                                         | ✅ **已缓存**（`setup` 仅 10–18s，说明缓存生效） | —                           |
| **Playwright Chromium**（`~/.cache/ms-playwright`）  | ❌ 未缓存，每次 28s                       | ~25s                        |
| **「构建全部包」的 dist**                                  | ❌ 未缓存，两个 job 各 137–152s            | ~2.5 min（或改用 artifact 复用）   |
| vite / vitest 的 transform 缓存（`node_modules/.vite`） | ❌ 未缓存                              | 待验证 —— 可能对 §9 的 76% 导入开销有帮助 |

---

## 8. matrix / shard / worker 能不能安全提速

| 手段                                | 可行性           | 依据                                                                 |
| --------------------------------- | ------------- | ------------------------------------------------------------------ |
| **视觉层 shard（matrix N 份）**         | ✅ **安全且收益最大** | case 之间无共享状态；每个 shard 固定成本 = 构建 137s + 装浏览器 28s + setup 18s ≈ 183s |
| **`test` job 的 `vitest --shard`** | ✅ 安全          | 4 个进程互不依赖，可按文件均分                                                   |
| **`coverage` 的 shard**            | ⚠️ **高风险**    | 覆盖率阈值需要**合并**分片报告；且串行是防 thrash 的既有裁决，要重测                           |
| **盲目加 worker**                    | ❌ **不可**      | 2 vCPU；已实测并发争抢（theme 84s→9min）                                     |
| **按 project 拆 coverage 成 4 个进程**  | ⚠️ 中高风险       | 需要把 4 份覆盖率报告合并后再判阈值                                                |

---

## 9. 「CPU 用得少、一直在等」的步骤

1. 🚨 **视觉每 case 的固定 1100ms `waitForTimeout`** ⇒ **1237s（20.6 min）纯等待**，  
   占像素比对的 **55%**。  
   它存在的原因：`STABILIZE_CSS` 的 `animation: none` 让 rc-motion 的 `animationend` **永不触发**，  
   只能等 `motionDeadline`（tooltip 1000ms）兜底 —— 所以这 1100ms 是**为正确性付的**，不能直接删。
2. 🚨 **`test` / `coverage` 有 76% 的时间不是测试**：  
   `environment 30% + import 22% + setup 14% + transform 8%`。  
   根因：**每个测试文件都重建一次 jsdom 环境、并重新 transform/import 一遍模块**（506 个文件）。
3. `coverage` job **比其它 job 晚 68s 才开始**（runner 排队）—— GitHub Actions 层面的等待。

---

## 10. 优化项、预计节省与风险

### 关键路径推演

| 阶段                                      | 墙钟           | runner 分钟    |
| --------------------------------------- | ------------ | ------------ |
| **现在**                                  | **40.3 min** | **86.5 min** |
| + P0 视觉 shard×4（含复用 dist + 缓存 Chromium） | **~24 min**  | ~84 min      |
| + P1 coverage 改 4 进程并行                  | **~18 min**  | ~77 min      |
| + P1′ 去掉 `test`/`coverage` 的重复执行        | **~18 min**  | **~62 min**  |
| + P2 视觉 1100ms 等待改造                     | ~18 min      | **~55 min**  |

（推演依据：shard 后视觉 ≈ 573s ⇒ coverage 1422s 成为关键路径；coverage 并行化后 ≈ 950s ⇒ `test` 1077s  
成为关键路径；`test` 去重后 ≈ 310s ⇒ 关键路径落到 coverage 950s ≈ 15.8 min。）

### 逐项

| 优先级    | 优化项                                                              | 预计节省                                     | 风险                                                                   |
| ------ | ---------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------- |
| **P0** | **视觉像素比对 shard（matrix 4 份）**                                     | **墙钟 −16.6 min**（40.3→23.7）              | **低**：case 无共享状态；每 shard 固定成本 183s；需把 diff/报告按 shard 上传后再合并（或各自留档）   |
| **P1** | **coverage 改「4 进程 + 合并覆盖率报告」**                                   | **墙钟 −5.8 min**（23.7→17.9）               | **中高**：需先验证 vitest 的报告合并；与「串行防 thrash」的既有裁决冲突，要重测阈值是否仍稳定             |
| **P1** | **去掉 `test`/`coverage` 的重复执行**（二选一保留；或 `test` 只跑 coverage 不覆盖的层） | **runner 分钟 −15.1 min**（墙钟不变，两者并行）       | **中**：合并后**失败归因变模糊**（现在 `test` 报测试失败、`coverage` 报阈值失败）               |
| **P1** | **视觉每 case 的 1100ms 固定等待**（改事件驱动 / 按需等待）                         | **runner 分钟 −20.6 min**（墙钟在 P0/P1 之后才体现） | **中高**：那 1100ms 是为覆盖 `motionDeadline=1000ms`；改错会让浮层截到**未显形帧** ⇒ 基线失真 |
| **P2** | **视觉层复用 `build` job 的 dist**（artifact 传递）                        | 墙钟 **−2.3 min**                          | 低：artifact ~14 MB，传输几秒                                               |
| **P2** | **缓存 Playwright Chromium**                                       | 墙钟 **−25s**                              | 低                                                                    |
| **P2** | **`test` job 的 `vitest --shard`（2–4 份）**                         | 墙钟 **−5~7 min**（在 P0/P1 之后才有意义）          | 低：需保证分片间无共享状态                                                        |
| **P3** | **vitest 复用 environment**（`isolate: false` 等，针对 74% 的环境/导入开销）    | 潜在 **`test`/`coverage` 各 −40~50%**       | **高**：测试间状态泄漏；与仓库的确定性要求（`TESTING.md` T5/T6）冲突                        |

### 明确**不做**的（用户已明令）

- 加 worker（2 vCPU + 已实测争抢，会把 theme 从 84s 劣化到 9min）。
- 把视觉像素比对改成阻塞（它跨平台必然红）。
- 删除测试 / 减少 case / 降覆盖率阈值 / 关 ratchet / 降 a11y / 把阻塞门禁改非阻塞 /  
  只跑部分测试 / 改业务代码迎合测试。

---

## 附：一句话结论

**40 分钟的反馈里，93% 是 `L6 visual` 这一个 job；而这个 job 的 55% 是每 case 固定 1100ms 的等待，  
10% 才是真正的像素比对。** 第二、三名（`coverage` 23m15s、`test` 15m09s）**跑的是同一批测试**，  
且它们 76% 的时间花在 jsdom 环境重建与模块导入上，只有 24% 是测试本身。

---

# 优化后（2026-10-05）

## 落地了什么

| # | 改动 | 文件 |
|---|---|---|
| 1 | `L6 visual` 4-way shard（按 case 下标取模，确定性划分）+ 缓存 Chromium + 复用 build 的 dist | `ci.yml`、`tests/visual/{run,report,assert-shard}.mjs` |
| 2 | `test` job 去掉「运行时四层」（与 `coverage` 100% 重复），只留类型层 | `ci.yml` |
| 3 | 触发收窄：`pull_request.branches:[master]` + `paths-ignore`（`**.md` / `docs/**` / `.workbuddy-ai/**`） | `ci.yml` |
| 4 | `test:coverage` 由 `--maxWorkers=1 --no-file-parallelism` 改 **`--maxWorkers=2`** | `package.json` |

## 实测对比

| 指标 | 优化前 | P0 后（实测） | 阶段 3 后（预计） |
|---|---|---|---|
| **Critical Path** | **40m20s** | **21m10s** | **~17.7 min** |
| **Runner Minutes** | **86.5 min** | **71.4 min** | ~68 min |

## coverage 并行度 benchmark（真实 runner：2 vCPU / 7 GB）

| 变体 | 墙钟 | 结论 |
|---|---|---|
| 1 进程完全串行（原配置） | 23.3 min | 基线 |
| **1 进程 `--maxWorkers=2`** | **19.5 min** | ✅ **采用**（−16%，且不需要合并覆盖率报告） |
| 2 进程并发 | 19.6 min | 同收益但需合并报告 ⇒ 不值得 |
| 4 进程并发 | 21.2 min | ❌ 2 vCPU 超额订阅，反而更慢 |

✅ 安全性核过：v2 的 `ui/src` 是四次运行里**覆盖最高**的一次（branches 14388 / statements 23875）；
逐文件差异只落在**已知的时序抖动文件**且**双向**（有增有减）⇒ 噪声，不是并行丢数据。

⚠️ **副产物**：benchmark 顺带暴露 ratchet 的 branches 阈值**坐在噪声带里**
（阈值 73.8，实测最低 73.8071，余量 +0.0071 < 噪声带 0.0102）⇒ 见 `docs/KNOWN-ISSUES.md` §1.6，需单独裁决。

## 明确不做（风险/收益不划算）

| 项 | 原因 |
|---|---|
| vitest transform cache | 实测 `node_modules/.vite` 仅 64K，vitest 转换缓存不落盘 ⇒ 零收益 |
| visual 每 case 的 1100ms 等待改造 | 承担 `motionDeadline` 正确性；shard 后只占 ~5 min/10 min ⇒ 高风险低收益 |
| 盲目加 worker | runner 只有 2 vCPU；4 进程实测更慢（21.2 min） |
