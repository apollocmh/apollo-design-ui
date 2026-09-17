# MEMORY.md — 项目长期约定

> 只放**仓库文档里没有的**：工具的所有权、易错判据、未决事项。
> 规则本体看 `AGENTS.md` / `WORKFLOW.md` / `TESTING.md` / `COMPATIBILITY.md`；
> 踩过的坑看同目录 **`PITFALLS.md`**（53 条，体积太大不进注入）；日常进展看 `YYYY-MM-DD.md`。

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

### ⭐ utils 比想象中全 —— 动手前先 grep `packages/utils/src`

- `dom/focus.ts` —— **焦点陷阱全套**：`focusable` / `getFocusNodeList` / `lockFocus` /
  `useLockFocus` / `triggerFocus` / `resetFocusLock`（rc-util 的忠实移植，含模块级单例与
  Tab 两步式环绕）。**`a11y` 只再导出**，不重写（L0 不能依赖 L1）。
- `dom/is-visible.ts` / `dom/contains.ts` / `hooks/use-id.ts` / `key-code.ts` / `raf.ts` /
  `env.ts`（`isDev`、`canUseDom`）/ `dev-warning.ts`（`devUseWarning(valid, message)` **两参**）

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

## 组件侧（packages/ui）—— 2026-09-18 已搭起来的部分

第一个组件 `empty` 落地时把流水线补齐了。**新增/改动的件**（细节见 `2026-09-18.md`）：

| 件 | 现状 |
|---|---|
| `packages/ui/build.config.ts` | ✅ SFC 构建（`rollup:options` 塞 `@vitejs/plugin-vue`）+ 每组件 CSS + `dist/index.css` |
| 类型产物 | ✅ **关掉 unbuild 的 `declaration`**（对 `.vue` 会静默产出错误的 `.d.ts`），改 `vue-tsc` |
| `tests/build/run.mjs` | ✅ 改为**拓扑序**构建；B5/B7/B8 对 ui 转为真实校验（B6 仍 PENDING） |
| `tests/compat/runner/index.mjs` | ✅ 已创建（基线生成/校验入口） |
| `tests/visual` | ⬜ **仍未落地**（只有 README）—— 这是 `empty` 唯一未达的维度 |

⚠️ **`pnpm -r run build` 永远不可用**（`ERR_PNPM_TASK_CYCLE`，见 PITFALLS 49）。
权威构建入口是 `node tests/build/run.mjs`。

---

## ⚠️ 未决事项（接手先看）

1. **下一个组件**：`empty` 已推到 `blocked`（只差 L6），`next-task` 会给新目标。
   建议第二个选**有交互**的组件（如 `button`），把 L2 那层也验一遍。
2. ⚠️⚠️ **`VNodeChild` 类型的 prop 必须在 `withDefaults` 里显式声明 `undefined` 默认值**
   —— Vue 的 Boolean prop 转换会把「未传」变成 `false`（PITFALLS 46 / COMPATIBILITY D21）。
   症状极隐蔽：组件能渲染，只是少一块；不报错、不警告、类型检查也过。
3. **L6 视觉回归基建**是 `empty` 从 `blocked` 到 `completed` 的唯一缺口，也是 G9 的门。
   裁决已定（`visual-baseline-in-git` = A：入库 git）。
4. **D24（locale 变更不触发重渲染）** 的正解是给 `@apollo-design/locale` **新增**一个
   返回 `ComputedRef` 的变体 —— **不能改 `useLocale` 的签名**（会破坏它已完成的契约）。
5. **B6（按需引入体积预算）** 仍 PENDING：需要 `budget.json` + 一次 vite lib 构建量体积。
6. **`biome.json` 不能写注释**，且 `biome check --write` 在配置非法时会**静默重排全仓**
   （PITFALLS 47）。改完配置先跑一次不带 `--write` 的检查。
7. **六个 foundation 包的 `api` 标了 done 但尚未被上层真实消费**：`position.measureAlign` /
   `motion.CSSMotion` / `portal.Portal` / `a11y` 全部组合式 / `virtual-list.VirtualList` /
   `locale` 全部。`empty` 首次消费了 `locale.useLocale` 与 `theme.token2CSSVar`，
   **发现 locale 的响应式缺口（第 4 条）** —— 其余仍未联调。
8. **`verification.typecheck` 是无人校验的 Agent 断言**（`foundation-status.mjs` 从不计算它，
   而 E16 拿它当 `completed` 依据）。机制缺口未修。
9. **无上游可对齐的区域要显式标注**：`a11y` 的 typeahead 零命中、live region 的隐藏样式
   是实践判断。这类结论必须写进 contract §9，不能当已验证。
10. ⚠️ **全仓 `vitest run --project unit` 在这台 16G 机器上会被 OOM killer 杀掉**（exit 137、
    零输出）。用 `foundation-status.mjs --verify`（按包跑）或**逐项目跑**作为全仓证据。
    连续跑多个 project 也会 OOM —— 跑完一个等内存回收再跑下一个。
11. **`locale` 最该先确认的一条**：裁决 A 是单文件产物，73 个语言包都在同一个
    `dist/index.mjs` 里 —— 未使用的语言包能否被摇掉**没有实测打包体积**。
