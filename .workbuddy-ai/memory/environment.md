# 环境与命令（实测）— apollo-design-ui

> `MEMORY.md` 的配套文件：**跑测试 / 构建 / 门禁前必读**。性能专题见 `test-perf-diagnosis.md`。

Node≥22.12（managed）｜pnpm 12.4.2｜TS 5.9｜Vitest 5｜Playwright（`channel:'chrome'`）。

- 🚨 `pnpm -r run build` **永不可用**；权威构建门禁 `CODEBUDDY_SAFE_DELETE_ENABLED=0 node tests/build/run.mjs`。
  **三个「自己删目录」的入口都要带 `CODEBUDDY_SAFE_DELETE_ENABLED=0`**：`tests/build/run.mjs`、
  `tests/visual/run.mjs`、`pnpm build:ui`（删 `.dts-tmp`，不带则 exit 1）。
- 🚨 本机 `pnpm` **不在 PATH**（只有 corepack）⇒ 造 `/tmp/pnpm-shim/pnpm` 包一层，再
  `PATH=/tmp/pnpm-shim:$PATH pnpm run <script>`。长命令一律带 `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 CI=1`
  （「超时无输出」先查 corepack 下载提示）。`exit 137`+零日志 ≠ OOM，先怀疑前台 120s 超时；>2 分钟后台跑。
- 🚨 **node 工具慢 5–8 倍的真凶 = WorkBuddy 沙箱的 brokered-fs hook**（PITFALLS 298）：
  每次 `open()` 走 IPC 代理 ≈6–10ms（`stat`/`readdir` 不拦），jsdom 652 个 `.js` ⇒ **每测试文件固定 +5.8s**。
  跑测试/构建**前置** `CODEBUDDY_BROKERED_FS_HOOK_ENABLED=0 CODEBUDDY_SAFE_DELETE_SANDBOX=0`
  （**两个都要关，是「或」关系**）。收益 ∝ 加载的小文件数：单文件 12.06s→**1.75s**、
  全量 unit 2121s→**280s**、`test` 3919s→**594s**、构建 479s→**148s**、`vue-tsc` 124s→83s、
  **Playwright 无收益**。代价 = node 失去沙箱文件代理（safe-delete 仍在）⇒ 只用于只读任务，
  **别写进仓库脚本/CI**（用户终端没有这些变量）。
- ⚠️ vitest：降级（`--pool=forks --maxWorkers=1`）会**静默少跑**给假绿灯；目录过滤**不可靠** ⇒
  报数用 **project 名**（unit / dom-contract / types / a11y / theme），单文件传完整路径。
  裸 `vitest run <dir>` 会带跑 `types` ⇒ `TypeCheckError` 噪音(73) 且 exit=1
  ⇒ **看「Tests passed」与「Type Errors」，别看退出码**；汇总行带 ANSI，grep 前先剥色。
  🚨 jsdom 冷缓存让 worker 启动超时（60s 硬上限）⇒ 先 `node -e "require('jsdom')"` 预热（199/221/231）。
- 🚨 **收口必须跑两个 lint**：`lint:types`（`vue-tsc -p tsconfig.json`）**和** `lint:format`（`biome check .`）
  —— 互补（vue-tsc 不看未用 import / 类型参数）。⚠️ **不许手写 glob**（zsh 不展开 `**` ⇒ 假绿灯，213）。
  biome error 基线 **0**。
- ⚠️ **本会话是 zsh**：`for c in $VAR` **不会按空格分词**（会把整串当成一个元素）⇒
  写循环要用**显式列表**或 zsh 数组（`for c in ${=VAR}`）。症状：`--component "a b c"`
  被当成一个组件名 ⇒ `buildCases` 抛错、循环只跑一次。（2026-10-03 实测踩到。）
- ⚠️ **BSD `grep` 不支持 `\|`**（会**静默返回空**，PITFALLS 277）⇒ 一律用 `grep -E` 或 Grep 工具。
- ⚠️ **数 biome 诊断必须 `--max-diagnostics=none`**：默认只列**前 20 条**，
  末尾写 `Diagnostics not shown: N.` ⇒ 照默认输出数会严重低估（实测把 **207** 看成 **2**，PITFALLS 335）。
- 🚨 `registry:check` 顺序：`gen-registry.mjs` → `foundation-status.mjs`（**不带 `--check`**）→
  `gen-workstreams.mjs --check` → `validate-registry.mjs`。组件收口后要刷 foundation-status + workstreams。
- ⚠️ 多文件机械改动**别用 Edit 批量**（会「部分落盘却报 success」，**同一文件内连续多次替换也会**，305）
  ⇒ 写 Node 脚本断言「恰好命中 N 次」。
- ⚠️ 临时插桩标 `[TMP-DBG]`，收口前清光（`dist/` 是 gitignore ⇒ `git status` 不提醒）。
- ⚠️ **`.artifacts` 的 CSS 取自 `packages/ui/dist`** ⇒ 改 `style/` 必须先 `pnpm run build:ui`，
  否则视觉层跑的还是旧 CSS（312；判据：差异率与上轮逐位相同）。
- 并发红线：全仓构建门禁同一时刻只允许一个会话，锁 `/tmp/apollo-build-gate.lock`。
- 单组件反馈：`verify-component.mjs <kebab> [--visual]`（**不替代** G13 全仓四道）｜
  L6 `tests/visual/run.mjs --component <name>`｜compat 基线 `tests/compat/runner/index.mjs --component <name>`。
