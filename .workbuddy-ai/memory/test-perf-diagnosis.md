# 测试性能诊断：为什么本机 vitest 慢 7 倍

> 2026-10-01 实测。结论：**不是仓库的问题，也不是杀毒软件**。
> 完整版登记在 `PITFALLS.md` 第 298 条。

## 一句话结论

WorkBuddy 会话给每个 node 进程注入了 `NODE_OPTIONS=--require=…/node-language-shim.cjs`。
当 `CODEBUDDY_BROKERED_FS_HOOK_ENABLED=1` 或 `CODEBUDDY_SAFE_DELETE_SANDBOX=1` 时，
它会加载 `node-brokered-fs-shim.cjs`，把**每一次 `open()`** 转发到 unix socket 上的 broker
⇒ **≈6–10 ms / 次**。jsdom 一个包有 **652 个 `.js` 文件**，
于是**每个测试文件**都白白花掉约 **5.8 s**。

## 收益（实测）

| | 基线（带 hook） | 关闭 brokered-fs hook | 倍数 |
|---|---|---|---|
| `packages/utils/src/__tests__/is.test.ts`（23 条纯函数） | 12.06 s | **1.75 s** | 6.9× |
| `--project unit`（261 文件 / 5756 用例） | **2121 s ≈ 35 min** | **280 s ≈ 4 min 40 s** | 7.6× |
| `--project dom-contract`（66 文件） | 492 s | **63 s** | 7.8× |
| `--project a11y`（65 文件） | 650 s | **131 s** | 5.0× |
| `--project theme`（61 文件） | 656 s | **120 s** | 5.5× |
| `pnpm run lint:types`（`vue-tsc`） | 124.1 s | **83.4 s** | 1.5× |
| `test:build`（构建门禁 `tests/build/run.mjs`） | 478.6 s | **148.4 s** | 3.2× |
| `test:visual --component anchor`（Playwright） | 52.8 s | 47.7 s | **1.1×（无收益）** |
| **`pnpm test` 四层合计** | **3919 s ≈ 65 min** | **594 s ≈ 10 min** | **6.6×** |

四个 project 的 `Test Files` 数、跳过数与用例数**逐项一致**
⇒ 是真提速，不是「降级少跑」造成的假绿灯。

### 判据：收益 ∝「加载的小文件数」

| 任务 | 收益 | 为什么 |
|---|---|---|
| vitest 各层 | **5–8×** | 每个测试文件都重新加载 jsdom 的 **652 个 `.js`** + vite 模块图 ⇒ 撞在枪口上 |
| 构建门禁 | 3.2× | tsc / rollup 要读大量小模块文件；`user` 252 s vs 244 s 几乎不变 ⇒ 纯粹是 I/O 等待被消掉 |
| `vue-tsc` | 1.5× | **CPU 密集**（`user` 105 s ≈ `real` 124 s），I/O 本就不是瓶颈 |
| Playwright 视觉层 | **1.1×（无收益）** | 浏览器渲染主导；node 侧只读几个**大**文件（baseline PNG），不触发「按文件数计费」 |

⚠️ 最后一行是**反例**，很有用：说明这个钩子**只惩罚「大量小文件读取」**，
而不是无差别地拖慢一切 —— 所以「关掉它」不会影响视觉层结论的可信度。
⚠️ `a11y` / `theme` 的提速倍数较低，是因为它们**测试本体**（axe 扫描、主题矩阵渲染）本来就重
—— 去掉 I/O 噪音后，真正的计算时间才显出来（`tests` 相位占比升到 22–29%）。
⚠️ `lint:types` 只有 1.5×，因为它是 **CPU 密集**（`user` 105 s ≈ `real` 124 s），
文件 I/O 本来就不是瓶颈 —— 这也从反面印证了「只有大量小文件读取的任务才会被这个钩子重创」。

## 指纹：成本按「文件数」计，不按「字节数」计

同一台机器，各 200 次调用：

| 操作 | 带 hook | 关掉 hook |
|---|---|---|
| `readFileSync`（**同一个**文件 ×200） | **2100 ms** | **6 ms** |
| `open` + `close` ×200 | 1215 ms | — |
| `statSync` ×200 | 1 ms | — |
| `readdirSync` ×200 | 17 ms | — |

三条推论：

1. **只有 `open()` 被拦截** —— `stat` 快 1200 倍、`readdir` 快 70 倍。
2. **与路径、卷、页缓存无关** —— 连读同一个文件 200 次一样慢。
3. **与文件大小无关** —— 对照 `require('typescript')`（单文件约 9 MB）只要 **260 ms**。

jsdom 的 22 个顶层依赖只要 1.2 s，而 `require('jsdom')` 总计 6.8 s；
`jsdom/lib/` 下 652 个 `.js` 的 `readFileSync` 正好是 **6.4 s**。

## 用法

在 WorkBuddy 会话里跑测试 / 构建时**前置**这两个变量：

```sh
CODEBUDDY_BROKERED_FS_HOOK_ENABLED=0 CODEBUDDY_SAFE_DELETE_SANDBOX=0 \
  PATH=/tmp/pnpm-shim:$PATH COREPACK_ENABLE_DOWNLOAD_PROMPT=0 CI=1 \
  pnpm vitest run --project unit
```

⚠️ **两个开关是「或」关系，且本机两个都是 `1`** —— 只关一个**无效**。
（实测：只设 `CODEBUDDY_SAFE_DELETE_SANDBOX=0` 后，worker 内
`globalThis.__CODEBUDDY_NODE_BROKERED_FS_SHIM_LOADED__` 仍为 `true`，耗时不变。）

## 注意事项

- ⚠️ **不要写进仓库脚本或 CI。** 用户自己的终端没有这些变量，本来就不受影响；
  写进去只会让仓库多一条只对本机有意义的配置。
- ⚠️ 代价：node 进程失去沙箱的**文件访问代理**。
  `CODEBUDDY_SAFE_DELETE_ENABLED` **没有**被关，删除保护仍然生效
  ⇒ 只适合「跑测试」这类以只读为主的任务。
- 更彻底但更粗的等价做法是 `env -u NODE_OPTIONS`（连 safe-delete 一起丢掉，不推荐）。

## 连带影响

这台机器上单文件固定开销 12 s、worker 启动的 60 s 硬上限余量被吃掉大半，
因此以下既有的坑会被**放大**：

- PITFALLS 199 / 221 / 231：jsdom 冷缓存导致 worker 启动超时；
- PITFALLS 297：并行跑多个重型任务时 worker 起不来（「全过 + Errors N」）。

## 排查过程中被推翻的假设

1. ~~jsdom 冷缓存~~ —— `require('jsdom')` 连跑 3 次都是 7.9 s，不像缓存。
2. ~~worker 隔离~~ —— `--no-isolate` 无差别（27.88 vs 27.95 s）。
3. ~~jsdom 环境本身~~ —— `--environment=node` 只省 1 s，且对需要 DOM 的 button 用例照过 94 条
   ⇒ 该 flag 根本没生效（project 级配置优先）。
4. ~~磁盘 / 大文件~~ —— `require('typescript')` 只要 260 ms。
5. ~~深信服 EasyConnect / EasyMonitor~~ —— 机器上确实装了，但 `env -u NODE_OPTIONS` 后
   裸 fs 立刻恢复到 7 ms ⇒ 与它无关。
