# MEMORY.md — 项目长期约定

> 只放**仓库文档里没有的**：工具的所有权、易错判据、未决事项。
> 规则本体看 `AGENTS.md` / `WORKFLOW.md` / `TESTING.md` / `COMPATIBILITY.md`；
> 踩过的坑看同目录 **`PITFALLS.md`**（45 条，体积太大不进注入）；日常进展看 `YYYY-MM-DD.md`。

## 本质与事实来源

**Vue 3 + TS 重写 Ant Design**。antd React 是**兼容性规格，不是代码来源**。目标 antd **6.6.4**。
优先级：用户指令 > 仓库规范 > `registry/*.json` > antd 产物/源码 > 文档 > 模型先验。
**禁止凭记忆描述 antd 行为**：读 `/tmp/antd-src/package/`（产物）或
`/tmp/antd-repo/ant-design-master/`（源码+测试）。

## 取任务

```bash
node registry/tools/next-task.mjs              # 唯一权威
node registry/tools/next-task.mjs --foundation # foundation 视图
```

- 组件 `blockedBy` **只表达组件依赖组件**；`next-task` 打印的「先做 foundation」告警**必须服从**。
- **一轮一个包**：走完 G0→G14 再停下汇报，不许批量推进。
- **派活前先读 `dependencies.json` 的 `purpose`**（曾把 DOM 测量层误派给 `overlay`，实际在 `position`）。

### ⚠️ 派生字段（手改会被覆盖）

| 字段 | 源 |
|---|---|
| `notDo` / `publicApi` / `dependsOn` / `implOrder` / `package.json` | `registry/tools/scaffold-packages.mjs` |
| `foundation.json` 全文 | `foundation-status.mjs`（`OUT_FILE`） |
| `components/dependencies/tokens/workstreams.json` | 各自 `gen-*.mjs` |
| 进度字段（status/dimensions/testLayers/doneWhen/notes/verification） | **Agent 写入**，保留 |

改 `notDo` 这类声明**必须先改模板**再跑 `foundation-status.mjs`。README 由 scaffold 生成但
**默认不覆盖**（`writeIfNeeded` 只在 `--force` 时覆盖），所以模板改了之后 README 要手工同步。

## 架构（要点）

```
L3 ui ｜ L2 form-core/picker/overlay/locale ｜ L1 motion/portal/position/a11y/virtual-list
L0 utils/theme/icons ｜ 测试 test-utils
```

- **包边界判据**：能力只有在「消费者 ≥ 2」且「无视觉语义」时才独立成包，否则留在
  `packages/ui/src/<component>/engine/`。只建 13 个包，不照搬 antd 的 37 个 rc 包。
- 组件间共享代码放 `packages/ui/src/_internal/` 叶子模块；组件间禁止互相 import。
- `prefixCls` 默认 **`apollo`**，ConfigProvider 可覆盖为 `ant`。

### 🚨 R7：发布包零 `@ant-design/*` 运行时依赖（2026-09-18 落地）

用户裁决 + ADR 0004。**发布包的 `dependencies` 不得含任何 antd 生态包**，
它们只允许出现在三处：① 构建期数据源（`registry/tools/gen-*.mjs`）
② 测试 Oracle（`*.oracle.test.ts`）③ `devDependencies`。

- **门禁**：`registry:validate` 的 **E19** 双扫描（package.json 的 `dependencies` + 产物 import）。
  `scaffold-packages.mjs` 另有一道更早的校验（模板的 `deps` 里出现 antd 包直接报错）。
- **`pnpm-workspace.yaml` 的 catalog** 已把这三个包从 Runtime 挪到 Build-time 分组。
- **两个策略**（`registry/dependencies.json` 的 `strategyLegend` 新增）：
  `generate` 构建期固化数据（icons-svg → `src/icons/*.ts` 字面量）；
  `port` 移植算法 + 差分验证（colors / fast-color → `utils/src/color/`）。
- ⚠️ **不要**把 antd 包从 devDeps 挪回 deps —— 那会让 E19 直接红。
- ⚠️ **E11/E19 扫描产物前必须 `stripComments()`**：unbuild **不剥 JSDoc**，
  而注释里大量出现「曾经这样写 `from '@ant-design/...'`」的示例，会被当成真实 import。

### ⭐ utils 比想象中全 —— 动手前先 grep `packages/utils/src`

- `dom/focus.ts` —— **焦点陷阱全套**：`focusable` / `getFocusNodeList` / `lockFocus` /
  `useLockFocus` / `triggerFocus` / `resetFocusLock`（rc-util 的忠实移植，含模块级单例与
  Tab 两步式环绕）。**`a11y` 只再导出**，不重写（L0 不能依赖 L1）。
- `dom/is-visible.ts` / `dom/contains.ts` / `hooks/use-id.ts` / `key-code.ts` / `raf.ts` /
  `env.ts`（`isDev`、`canUseDom`）/ `dev-warning.ts`（`devUseWarning(valid, message)` **两参**）
- `color/` —— **上游两个颜色包的移植落点**：`Color` 类（≈ fast-color）、`generatePalette()`
  （≈ `@ant-design/colors` 的 generate）。`theme` 与 `icons` 共用，只放算法**不放色值**。
  暗色的 `backgroundColor` 是**必填**参数（上游硬编码 `#141414`，那是色值字面量，归 theme 持有）。
  改这里必须跑 `packages/utils/src/__tests__/color.oracle.test.ts`（对上游逐位差分）。

## 收口流程（每包照做）

1. 契约文档 `docs/foundation/<pkg>-contract.md`（**必须先于实现**）
2. 实现 → L1/L2/L3 测试（含负例）→ 变异验证
3. 改 `foundation.json` 进度字段
4. `CODEBUDDY_SAFE_DELETE_ENABLED=0 node registry/tools/foundation-status.mjs --verify`（约 20 min）
5. `... --verify-build`（约 5 min）→ `gen-workstreams.mjs` → `pnpm run registry:check` →
   `pnpm run lint` → `pnpm test`
6. 三次提交：`feat(<pkg>)` + `chore(registry)` + `chore(memory)`

## 环境

Node ≥22.12（managed `~/.workbuddy-ai/binaries/node/versions/22.22.2-2/bin/node`）｜
pnpm 12.4.2（`.npmrc` `hoist=false`）｜TS 锁 5.9.x（unbuild 3.6.1 peer）｜Vitest 5｜Playwright + pixelmatch

## 架构风险（细节见各自 contract 文档 §9）

| # | 风险 | 状态 |
|---|---|---|
| AR1 | 浮层定位几何 | ✅ 两半已解除（内核 5000 组差分逐位一致 + `position/src/measure.ts`）。⚠️ 缺 L6 逐像素比对 |
| AR2 | motion 五类语义 | ✅ 已解除（种子 `20260917`，零偏差）。⚠️ `MotionProvider` 未实现；未被真实消费 |
| AR3 | picker 状态机 | 待验证 |
| AR4 | 零运行时下 `classNames`/`styles` 优先级 | 随 config-provider |
| AR6 | Vue 泛型对 `Table<T>` 的表达力 | 待验证 |

## 主分支与合并

主分支是 **`master`**，检出在另一个 worktree **`/Users/nanren/Code/apollo-design-ui`**
（当前工作区是 `workbuddy/master-1c4ca77a`）。阶段性收口后需要合并过去。

⚠️ **合并前必须先看那边的工作区**：master worktree 里常留着上一轮的未提交内容
（实测：一份被取代的 motion 早期实现），会让合并或 fast-forward 被拒。
处置是**先 `git stash push -u`** —— 保留全部（含未跟踪文件）、可恢复 ——
合并完再告诉用户 stash 在哪。**不要 `checkout` / `clean` 掉别人的东西。**

```bash
# 1) 备份并清干净 master worktree
cd /Users/nanren/Code/apollo-design-ui && git stash push -u -m "合并前自动备份"
# 2) 快进合并（master 通常是当前分支的祖先，先确认 0 个对方独有提交）
git rev-list --left-right --count master...workbuddy/master-1c4ca77a
git merge --ff-only workbuddy/master-1c4ca77a
```

## ⚠️ 每个新会话的第一件事

`/tmp` **不是持久存储**：`/tmp/antd-src/`（产物）与 `/tmp/antd-repo/ant-design-master/`
（源码+测试+demo）是全项目的**事实来源**，实测会被系统清理。
**先 `ls` 一下，缺了就恢复**（命令见 `PITFALLS.md` 第 42 条）。

---

## 组件侧（packages/ui）尚未搭起来的三件事

`next-task` 判定 `empty` 可以开始（foundation 依赖全 completed），但组件侧的**流水线**还是空的：

| 缺口 | 现状 |
|---|---|
| 样式层 | `packages/ui` 只有骨架：**没有** `build.config.ts`、没有 CSS 汇总方式 |
| `tests/build/run.mjs` | **不覆盖 `packages/ui`** |
| `tests/compat/runner/index.mjs` | ⚠️ **文件不存在**（`package.json` 的 `test:compat` 却指向它） |
| `tests/visual` | 只有 README，基线未入库（决策 `visual-baseline-in-git` 未裁决） |

⇒ `empty` 是「**第一个**组件」不是「一个小组件」。开工前先裁决这三件。

---

## ⚠️ 未决事项（接手先看）

1. AR1 / AR2 均已解除；motion 的三项遗留见 registry `notes`。
2. **`next-task` 的默认视图已切到「组件」**（locale 2026-09-17 收口，foundation 10/13）：
   下一个任务 = `empty` 组件（P0 / complexity S / 解锁 51 个组件）。
   foundation 视图仍剩 3 个 todo：overlay / form-core / picker。
   `empty` 的 **G1 分析产物已完成**（`docs/analysis/empty.md`），**实现未开始**。
3. **六个包的 `api` 标了 done 但尚未被上层真实消费**：`position.measureAlign` / `motion.CSSMotion` /
   `portal.Portal` / `a11y` 全部组合式 / `virtual-list.VirtualList` / `locale` 全部。联调时若 API 形状不够用，需回来改并同步 contract 文档。
   这条风险重复出现在四个包的 registry `notes` 里。⚠️ portal 另有：SSR「不建容器」只覆盖了
   `resolveContainer` 的早退分支。
4. **`verification.typecheck` 是无人校验的 Agent 断言** —— `foundation-status.mjs` 把它初始化为
   `not-run` 后**从不计算**，而 E16 拿它当 `completed` 依据。对应的两个真实错误已修，但机制缺口没修。
   建议给 `--verify` 加全仓 `vue-tsc` 并按包归属写回（登记在 `test-utils-contract.md` §8 Q3）。
5. **别把「没有新增 error」当成「没有 error」** —— 收口必须跑**全仓**门禁并对齐 `lint` 脚本真实定义
   （= `lint:types` + `biome check .`）。
6. **无上游可对齐的区域要显式标注**：`a11y` 的 typeahead 在 antd + rc-* 里零命中（语义自定义）；
   `a11y` 的 live region 隐藏样式选 1×1+clip 是实践判断。这类结论必须写进 contract §9，不能当已验证。
7. 用户此前要求：**规划完成后等待确认，不要自行进入大规模组件实现。**
8. ⚠️ **全仓 `vitest run --project unit` 在这台 16G 机器上会被 OOM killer 杀掉**（exit 137、
   零输出，症状像「命令写错」）。用 `foundation-status.mjs --verify`（按包跑，覆盖全部 13 个包）
   或逐项目跑作为全仓证据。细节见 `PITFALLS.md` 第 41 条。
9. ⚠️ **`locale` 最该先确认的一条**：裁决 A 是单文件产物，73 个语言包都在同一个
   `dist/index.mjs` 里 —— 未使用的语言包能否被摇掉**没有实测打包体积**
   （已声明 `sideEffects: false`）。契约文档 §9 第 7 条。
