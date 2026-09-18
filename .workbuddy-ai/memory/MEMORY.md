# MEMORY.md — 项目长期约定

> 只放**仓库文档里没有的**：工具所有权、易错判据、未决事项。
> 规则本体：`AGENTS.md`/`WORKFLOW.md`/`TESTING.md`/`COMPATIBILITY.md`/`ARCHITECTURE.md`；
> 坑：同目录 `PITFALLS.md`（64 条）；日常进展：`YYYY-MM-DD.md`。

## 本质与事实来源

Vue 3 + TS 重写 Ant Design。antd 是**兼容性规格不是代码来源**，目标 **6.6.4**。
优先级：用户指令 > 仓库规范 > `registry/*.json` > antd 产物/源码 > 文档 > 模型先验。
**禁止凭记忆描述 antd**：读 `/tmp/antd-src/package/` 或 `/tmp/antd-repo/ant-design-master/`。
⚠️ `/tmp` 会被清理 —— **每个新会话先 `ls`，缺了就恢复**（命令见 PITFALLS 42）。

## 取任务

`node registry/tools/next-task.mjs`（唯一权威；`--foundation` 看包视图）

- 它打印的「先做 foundation」告警**必须服从**；**一轮一个包**，走完 G0→G14 再汇报。
- 派活前先读 `registry/dependencies.json` 的 `purpose`。

### 派生字段（手改会被覆盖）

| 字段 | 源 |
|---|---|
| `notDo`/`publicApi`/`dependsOn`/`implOrder`/包 `package.json` | `scaffold-packages.mjs` |
| `foundation.json` 全文 | `foundation-status.mjs` |
| `components`/`dependencies`/`tokens`/`workstreams.json` | 各自 `gen-*.mjs` |
| status/dimensions/testLayers/doneWhen/notes/verification | **Agent 写**，跨运行保留 |

改 `notDo` 这类声明先改模板再跑生成器。README 由 scaffold 生成但**默认不覆盖**
（`--force` 才覆盖），模板改了要手工同步 README。

## 收口流程（每包照做）

契约文档 `docs/foundation/<pkg>-contract.md`（**先于实现**）→ 实现 → 测试 + 变异 →
改进度 → `--verify`（~20min）→ `--verify-build`（~5min）→ 重跑三个生成器 →
`registry:check` → `lint` → `test` → 三次提交 `feat`/`chore(registry)`/`chore(memory)`。

## 环境

Node ≥22.12（managed `~/.workbuddy-ai/binaries/node/versions/22.22.2-2/bin/node`）｜
pnpm 12.4.2（`.npmrc` `hoist=false`）｜TS 锁 5.9.x｜Vitest 5｜Playwright + pixelmatch。
⚠️ **`pnpm -r run build` 永远不可用**（`ERR_PNPM_TASK_CYCLE`，PITFALLS 49）——
权威构建入口是 `CODEBUDDY_SAFE_DELETE_ENABLED=0 node tests/build/run.mjs`
（不带该变量会被沙箱拦掉 `ui` 的 `.dts-tmp`）。
⚠️ 全仓 `vitest run --project unit` 在 16G 机器上会 **OOM（exit 137、零输出）**；
用 `--verify`（按包）或逐 project 跑，跑完一个等内存回收。

## 架构要点

```
L3 ui ｜ L2 form-core/picker/overlay/locale ｜ L1 motion/portal/position/a11y/virtual-list
L0 utils/theme/icons ｜ 测试 test-utils
```

- 包边界判据：消费者 ≥2 且无视觉语义才独立成包，否则留在
  `packages/ui/src/<component>/engine/`。只建 13 个包，不照搬 antd 的 37 个 rc 包。
- 组件间共享代码放 `packages/ui/src/_internal/` 叶子模块；组件间禁止互相 import。
- `prefixCls` 默认 **`apollo`**，ConfigProvider 可覆盖为 `ant`。

### 🚨 R7：发布包零 `@ant-design/*` 运行时依赖（ADR 0004）

只允许出现在：① 构建期数据源 ② 测试 Oracle ③ `devDependencies`。
门禁是 `registry:validate` 的 **E19** 双扫描（deps + 产物 import）。
- ⚠️ 扫描产物前必须 `stripComments()`：unbuild **不剥 JSDoc**，注释里的
  「曾经这样写 `from '@ant-design/...'`」会被当成真实 import。
- 策略：`generate`（icons-svg → 字面量）/ `port`（colors、fast-color → `utils/src/color/`）。
  改 `utils/src/color/` 必须跑 `color.oracle.test.ts`（对上游逐位差分）。

### ⭐ 动手前先 grep `packages/utils/src`

`dom/focus.ts` 焦点陷阱全套（`a11y` 只再导出，L0 不依赖 L1）｜`is-visible`/`contains`/
`use-id`/`key-code`/`raf`/`env`/`dev-warning(valid, message)` **两参**｜`color/`。

## ⚠️ 跨包易错判据

1. **Vue 事件 prop 名必须全小写**：`onMouseenter`/`onTouchstart`/`onContextmenu`/
   `onPointerdownCapture`。`runtime-dom` 会 `hyphenate(name.slice(2))`，
   `onMouseEnter` → `mouse-enter` **不存在**且**完全静默**（不报错、事件永不触发）。
   只有修饰符后缀（Once/Capture/Passive）保留大写。
2. **`VNodeChild` 类型的 prop 必须在 `withDefaults` 里显式给 `undefined` 默认值**
   —— Boolean prop 转换会把「未传」变 `false`，组件能渲染只是少一块（PITFALLS 46）。
3. `biome.json` **不能写注释**；`biome check --write` 在配置非法时会**静默重排全仓**。
4. 🚨 **`packages/ui/src/index.ts` 是并行雷区**：scaffold 生成，但
   `writeIfNeeded(file, content, overwrite = force)` 的 `overwrite` 默认 `false`
   ⇒ **已存在就永不重生成，等于手工维护**。多会话各加一个组件 export 必然冲突，
   **重跑生成器救不了**（与 `registry/*.json` 相反）。约定：只动自己的 export 块、
   组件块按字母序追加，让三方合并自动过。

## 主分支与合并

主分支 `master`，检出在另一 worktree `/Users/nanren/Code/apollo-design-ui`。

- 合并前先看那边工作区（常留未提交内容）→ 有则 **`git stash push -u`**（可恢复），
  不要 `checkout`/`clean` 掉别人的东西。
- **master 可能已领先**，`--ff-only` 常不可行：先 `git merge master --no-edit` 进来。
  `registry/*.json` 冲突 → `checkout --ours` + 重跑生成器；
  `memory/<日期>.md` 的 add/add → **两边都保留**。
- 然后 `git rev-list --left-right --count master...HEAD` 确认变成 `0 N`，再 ff。
- ⭐ **合并前必须导出进度快照**（各包 status/dimensions/met + 非 todo 组件），
  合并后逐项比对 —— 实测过 `components.json` 合并取错侧会把已收口维度冲回 todo。
- `dist/` 不入库，各 worktree 各一份；合并后要在 master 侧重建，否则 E19 报假阳性。
- ⚠️ **分支收口后立刻合 master**：`4dfafdb2` 的批次② 提交完滞留了未合，
  新会话从 master 起会以为没做 → 重做/冲突。`--ff-only` 在「master ⊂ 分支」时可用且零冲突
  （先 `git rev-list --left-right --count master...<branch>` 判断方向，别凭印象）。

## 并行作业（多会话 + worktree）

**取任务的权威是 `node registry/tools/next-task.mjs --parallel`** —— 它列 18 个可并行项，
含 **13 个组件**（不只 foundation）。不带 `--parallel` 的那个推 `config-provider`，
并**同时警告「不要开始」**（foundation 未就绪）—— 那条警告必须服从。

- 文件域互斥是硬要求：`packages/ui/src/<component>/**` 天然互斥，
  共享冲突只有 `ui/src/index.ts`（见「跨包易错判据」4）、`registry/*.json`、memory。
- 2026-09-18 起的分工：`wt-form-core`（form 骨架 + form-core 批次③）、
  `wt-comp-a`（divider → spin）、`master-15e7f018`（整合：合并/生成器/门禁/registry）。
  交接单在各 worktree 的 `.workbuddy-ai/handoff.md`（已 exclude，不入库）。
- ⚠️ **并发资源红线**：全仓构建门禁同一时刻**只允许一个会话跑**；
  其余只跑自己包的 `vitest` / `vue-tsc`（16G 机器，全仓 vitest 已知 OOM）。

## ⚠️ 未决事项（接手先看）

0. 🔶 **`form-core` 是 `implementing`（2026-09-18，批次①② 完成）** —— 上游约 3600 行，
   一轮做不完，契约 §3 拆成三批：① 校验引擎 ✅ ｜ ② 取值工具（valueUtil/NameMap/
   validateMessages）✅ ｜ ③ 状态机（FormStore/useForm/Field）⬜。
   ⚠️ **批次③ 开工前必须先有 `ui/src/form` 骨架** —— 否则重复 overlay 的处境
   （契约封了但无人消费，API 形状无从校验）。
   ⚠️ ③ 是**唯一没有 Oracle 的部分**（`validateUtil.js` 依赖 React 的 isValidElement /
   cloneElement，且 FormStore 是 forceUpdate 驱动）—— 只能读源码 + 行为测试。
1. **foundation 11/13 completed**；`form-core` 见上（implementing），`picker` 仍 todo。
   组件 **1/72**（`empty`）。听 `next-task.mjs`（并行时用 `--parallel`）。
   第二个组件原建议选**有交互**的（验 L2 层）；2026-09-18 实际先派了 **`divider`(P0, 最小)**
   把组件侧 G0→G14 走顺，`spin`(P1) 跟上（会走 motion 层）。
2. **`form-core` 挡着 `config-provider`**，后者解锁 50 个组件 —— 这是当前关键路径。

3. `packages/ui/src/config-provider/` 目前**只有 `context.ts` 最小集**（Empty 够用），
   ConfigProvider 组件本身未实现。
4. 六个 foundation 包的 API 已 done 但**零上层消费**：`position.measureAlign`/
   `motion.CSSMotion`/`portal.Portal`/`a11y`/`virtual-list`/`overlay.useOverlay`/
   `locale`。首次联调很可能暴露契约缺口（已由 `empty` 暴露过 locale 响应式）。
5. **D24**：locale 变更不触发重渲染 —— 正解是给 locale **新增**返回 `ComputedRef` 的变体，
   **不能改 `useLocale` 签名**（会破坏已完成契约）。
6. `verification.typecheck` 是无人校验的 Agent 断言（生成器从不计算它，E16 却拿它当依据）。
7. B6 按需引入体积预算仍 PENDING；`ui` 的 `tests/visual` 只有 README。
8. macOS 12 上 Playwright 1.63 不自带 Chromium，需降级 `channel: 'chrome'`。
9. **根 `package.json` 的 `dev` 指向 `@apollo-design/docs`，该包不存在**（占位命令）。
   文档站是 `X:docs-site`，W6 波次，卡在 `docs-site-framework` 决策未裁决
   （推荐 VitePress）。`packages/docs/**` 只在 `CF-DOCS` 冲突集里被预留。

---

### ⭐ 能不能做 Oracle，判据是「上游有没有框架耦合」

2026-09-18 在 `form-core` 上确立：`@rc-component/async-validator` 是**纯 JS**
⇒ 两侧同时跑、逐位差分（与 position 的 5000 组几何差分同档）。
**这在 foundation 包里是第一次。**

判据：**上游零框架耦合 ⇒ 可做 Oracle；绑 React 生命周期 ⇒ 不能**。
`@rc-component/form` 的 `FormStore` 就是后者 —— 它用 `forceUpdate` 驱动，
必须 Vue 化重写，**只能靠读源码 + 行为测试**。

⚠️ Oracle 不是万能的：它比的是「最终错误」，中间值在两侧都是 `undefined` 时差异会被抹平
（实测：`complementError` 的 `fullFields` 分支变异，oracle 抓不到，只有直接调用测试抓到）。
**oracle 与 units 必须并存。**

判据细化（2026-09-18 在 form-core 批次② 实测）：
- **可对拍的前提是「那个文件不 import 框架」** —— rc-form 的
  `utils/{valueUtil,NameMap,messages}.js` 都不 import react，所以能对拍；
  同目录的 `utils/validateUtil.js` import 了 react ⇒ **不能**。
- 深路径 import 的前提：包**没有 `exports` 字段**（有的话会被路径白名单挡住）。
- peer 缺失（如 react）不影响 —— 只要不 import 那个 peer。
