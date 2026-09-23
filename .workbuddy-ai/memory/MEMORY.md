# MEMORY.md — 项目长期约定

> 只放**仓库文档里没有的**：工具所有权、易错判据、未决事项。
> 规则本体：`AGENTS.md`/`WORKFLOW.md`/`TESTING.md`/`COMPATIBILITY.md`/`ARCHITECTURE.md`；
> 坑：同目录 `PITFALLS.md`（139 条，**查坑先去那**）；日常进展：`YYYY-MM-DD.md`。

## 本质与事实来源

Vue 3 + TS 重写 Ant Design（兼容规格，非代码来源），目标 **6.6.4**。
优先级：用户指令 > 仓库规范 > `registry/*.json` > antd 产物/源码 > 文档 > 先验。
**禁止凭记忆描述 antd**：读 `/tmp/antd-src/package/`（⚠️ /tmp 会清，新会话先 `ls`，缺了按 PITFALLS 42 恢复）。
凡要说「某决策/约定是这样」先跑 `node registry/tools/ask.mjs`（decision <id> 输出原文）。

## 取任务与派生字段

`node registry/tools/next-task.mjs`（唯一权威；并行用 `--parallel`；一轮一包，G0→G14）。
派生字段（手改被覆盖）：`notDo`/`publicApi`/包 package.json ← `scaffold-packages.mjs`；
`foundation.json` ← `foundation-status.mjs`；components/dependencies/tokens/workstreams ← 各 `gen-*.mjs`；
status/notes/layerNotes **Agent 写、跨运行保留**。组件收口后要刷 foundation-status + gen-workstreams（registry:check 会催）。

## 环境

Node ≥22.12（managed 路径）｜pnpm 12.4.2｜TS 5.9｜Vitest 5｜Playwright（`channel:'chrome'`）。
- 🚨 `pnpm -r run build` 永远不可用；权威构建门禁 `CODEBUDDY_SAFE_DELETE_ENABLED=0 node tests/build/run.mjs`。
- 🚨 pnpm「超时无输出」先查 corepack 下载提示，长命令一律 `COREPACK_ENABLE_DOWNLOAD_PROMPT=0 CI=1`。
- ⚠️ `exit 137`+零日志 ≠ OOM，先怀疑前台 120s 超时；>2 分钟的命令后台跑或显式 timeout。
- ⚠️ 降级运行的 vitest（`--pool=forks --maxWorkers=1`）会**静默少跑**给假绿灯，不能当门禁证据；
  看「N passed」先核分母。`vitest run <目录>` 位置过滤不可靠，跑单文件传完整路径。
- 收口只跑一次全仓门禁；跑重型门禁前关 IDE。`tsc --build` 已落地（`pnpm typecheck:build`）。
- 并发红线：全仓构建门禁同一时刻只允许一个会话，锁 `/tmp/apollo-build-gate.lock`（mkdir 抢/rmdir 放）。

## 架构要点

```
L3 ui ｜ L2 form-core/picker/overlay/locale ｜ L1 motion/portal/position/a11y/virtual-list
L0 utils/theme/icons ｜ 测试 test-utils
```

- 包边界：消费者 ≥2 且无视觉语义才独立成包，共 13 包；组件间共享代码放 `packages/ui/src/_internal/`。
- `prefixCls` 默认 `apollo`。动手前先 grep `packages/utils/src`（focus 陷阱/is-visible/raf/dev-warning 两参/color 等）。
- 🚨 R7（ADR 0004）：发布包零 `@ant-design/*` 运行时依赖，门禁 E19 双扫描（产物扫描前必须 stripComments）。
- Oracle 判据：上游零框架耦合 ⇒ 可对拍；绑 React 生命周期 ⇒ 只能读源码+行为测试。oracle 与 units 并存。

## ⚠️ 跨包易错判据（详见 PITFALLS）

1. Vue 事件 prop 名**全小写**（`onMouseenter`；大写静默失效）。
2. `VNodeChild` prop 必须显式 `undefined` 默认值（Boolean 转换陷阱）。
3. `biome.json` 不能写注释；`--write` 配置非法时静默重排全仓。
4. 🚨 `packages/ui/src/index.ts` 手工维护（生成器不覆盖），多流必碰：只动自己的 export 块、按字母序追加。
5. catch-all prop 别用 `PropType<unknown>`（vue-tsc 推断成 undefined 全线误报）；
   用 `[String, Number, Boolean]` 联合 + Group 侧 VNodeProps 放行（PITFALLS 137）。
6. biome warning 不 fail 门禁（error 才会）；对象字面量内 suppression 注释无效，
   用变量替代字面量绕过（PITFALLS 139）。
7. Edit 工具批量编辑可能部分落盘且报 success——改完必须 grep 回读（PITFALLS 138）。

## 主分支 / 合并 / 并行（硬教训浓缩，原文见 PITFALLS）

- master 检出在 `/Users/nanren/Code/apollo-design-ui`；合并前看那边工作区，有 WIP 先 `git stash push -u`。
- `registry/*.json` 冲突**按冲突块解析**（手写 status 会丢），别 `checkout --ours`；之后重跑生成器。
- 合并后必查：`index.ts` export 排序（biome Safe fix）、生成器重跑、`dist/` 各 worktree 自建。
- **收口后立刻合 master**；ff 后必须 `git rev-parse` 确认真的动了。
- 「绿在本地」≠「绿在仓库」：依赖磁盘产物的门禁结论先 `git ls-files` 确认产物已入库。
- 派 subagent：门禁必须前台跑；429 后它可能已跑很久甚至已提交——接手先 `git status`+`git log`，
  **往组件目录写文件前先确认没有别人的东西**（Write 默认 overwrite）。
- 复核纪律：agent 的汇报逐条自己重跑才算数；新坑一律登记 PITFALLS.md（按流分段预留号段防撞车）。

## 当前进度（2026-09-23）

- foundation **12/13** completed；`picker` implementing（面板组件+输入框 hooks 未做）。
- 组件 **22/72** completed（最新：radio，四道门禁全绿）。
- 未决：B6 按需样式子路径（`exports` 缺 `./css/*`，全库基建议题）；`--project types` 的
  SFC 解析噪音（PITFALLS 73，tag/checkbox/radio 同报 unhandled，非本包引入）；
  Empty SVG 不跟 darkAlgorithm 需补；开放决策 7 项（`ask decisions --open`）。
- **全仓 `update:*` 缺口**（PITFALLS 162）：C11 要求 v-model 与语义事件同时发出，
  但截至 radio 只有它实现了 ⇒ 其余 21 个组件上 `v-model:xxx` 不生效，待统一补齐。
- 共享文件 4 个（index.ts / style/index.ts / matrix.mjs / cases/shared.mjs）按字母序追加。
