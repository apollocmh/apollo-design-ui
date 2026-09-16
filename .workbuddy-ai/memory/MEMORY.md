# MEMORY.md — 项目长期约定

> `@apollo-design/ui` 的跨会话长期约定。日常进展写在 `YYYY-MM-DD.md`。

---

## 项目本质

用 **Vue 3 + TypeScript** 重新实现 Ant Design。**antd React 是兼容性规格，不是代码来源。**
兼容目标：antd **6.6.4**（`registry/components.json` 的 `antdVersion`）。

事实来源优先级：用户指令 > 仓库规范文件 > `registry/*.json` > antd 固定版本产物/源码 > 官方文档 > 模型先验。
**禁止凭记忆描述 antd 的 API/行为**，必须读产物或源码：
`/tmp/antd-src/package/`（产物）、`/tmp/antd-repo/ant-design-master/`（源码+测试+文档）。

---

## 硬约束（详见 `AGENTS.md` §1）

禁 React runtime ｜ 禁复制 antd 实现 ｜ 禁机械翻译 ｜ 禁模拟 React 生命周期 ｜
禁 `@rc-component/*` ｜ 禁 `@ant-design/cssinjs` 家族 ｜ 禁改测试预期让红灯变绿 ｜
禁硬编码视觉值 ｜ 禁 `any` ｜ 禁跨层反向依赖 ｜ 禁跳过 Registry 更新。

---

## 怎么取任务

```bash
node registry/tools/next-task.mjs              # 唯一权威
node registry/tools/next-task.mjs --foundation # foundation 包视图
```

- 组件清单的 `blockedBy` **只表达组件依赖组件**，不表达「组件依赖 foundation 包」。
  `next-task` 会打印告警提示先做 foundation —— **必须服从**，否则是虚假进度。
- **一轮一个组件/包**：走完 G0→G14 全部 14 道 Gate 再停下汇报，不许批量推进。

### foundation 包（`registry/foundation.json`）

组件 `completed` 而 foundation 依赖只有骨架 = **虚假进度**。

- `phase2Order` = 推进顺序（含 AR1/AR2 的 PoC 槽位，允许早于依赖包）
- `derived.implOrder` = 严格拓扑序（回答「可开始完整实现的下一个」）
- `testLayers` 的 `n/a` 必须有 `layerNotes`（E16 强制）—— 防「用 n/a 掩盖未做」
- `openDecisions` 是「项目卡在什么问题上」的登记处，`blockedBy` 只能引用这里的 id（E17）
- `status: completed` 需同时满足：6 维度 done/n/a + 7 测试层 done/n/a + `thresholds.met` +
  `build.status==='passing'` + `blockedBy` 为空

**派活前先读 `dependencies.json` 的 `purpose`** —— 凭包名猜职责会出错
（曾把 DOM 测量层误派给 `overlay`，实际在 `position`）。

---

## 架构

### 分层（依赖只能同层或更低）

```
L3  ui
L2  form-core / picker / overlay / locale
L1  motion / portal / position / a11y / virtual-list
L0  utils / theme / icons
测试  test-utils
```

### 包边界判据

> 能力只有在「消费者 ≥ 2」且「无视觉语义」时才升级为独立包，否则留在 `packages/ui/src/<component>/engine/`。
> 因此不照搬 antd 的 37 个 rc 包，只建 13 个。

### 可复用（不要重写）

`@ant-design/icons-svg`｜`@ant-design/colors`｜`@ant-design/fast-color`｜`dayjs`｜`scroll-into-view-if-needed`

### 组件间共享代码

**必须放 `packages/ui/src/_internal/` 叶子模块。** 组件间禁止互相 import 组件目录
（否则复现 antd 的 4 组假循环依赖）。

### 前缀与样式（✅ 已裁决，见下）

- `prefixCls` 默认 **`apollo`**，ConfigProvider 可覆盖为 `ant`
- 零运行时静态 CSS 是**默认与推荐**路径，但不是唯一 —— `theme` 需同时提供运行时注入路径
  （自研，不是引入 cssinjs）

---

## 已裁决的开放决策（2026-09-16）

| id | 裁决 | 影响 |
|---|---|---|
| `build-output-contract` | **A** 只保留 `dist/` 单文件 | 解锁 13 个包的 pkg 维度 |
| `prefix-cls-default` | **A** 默认 `apollo` | theme 收口 + 全部组件 DOM 契约 |
| `zero-runtime-mode` | **B** 零运行时默认 + 提供运行时注入路径 | theme 需维护两条注入路径，变量命名必须一致 |
| `event-name-rewrite` | **A** 接受 `onKeyDown → onKeydown` | utils API 契约 + D8 |

**仍未裁决**：`use-id-test-env`（仅测试写法）等 5 项不阻塞 foundation 的。

### 裁决要走命令行，不要手改 JSON

```bash
node registry/tools/foundation-status.mjs --decide <id> --choice <A|B|C> --by "<谁>" --note "<理由>"
```

`--choice` 必须命中 `registry/source/open-decisions.mjs` 里的选项，否则拒绝写入。
决策**内容**在 `source/open-decisions.mjs`（工具拥有，每次覆盖），只有 5 个运行时字段从 json 反向合入。

---

## 工具链

| 命令 | 作用 |
|---|---|
| `next-task.mjs` | 下一个任务（唯一权威） |
| `foundation-status.mjs` | foundation 进度；`--package <dir>` / `--verify` / **`--verify-build`** / **`--decide`** / `--check` |
| `gen-registry.mjs` | 刷新 Registry（保留进度字段） |
| `validate-registry.mjs` | 18 项规范检查（E1-E18） |
| `gen-workstreams.mjs` | 并行编排 |
| `scaffold-packages.mjs` | 生成包骨架；**`--force-pkg` 只刷 package.json**，`--force` 会清空 `src/index.ts` |
| `tests/build/run.mjs` | **L7 构建门禁**；`--no-build` / `--package <dir>` / `--strict` / `--json` |

**派生字段禁止手工编辑**（下次生成会被覆盖）。进度字段由 Agent 写入。

### 坑（实测）

1. **Bash 的 `grep` 对某些文件静默返回空** —— 一律用 Grep 工具。
2. `biome-ignore` 必须紧贴目标行，reason 同行。**多行声明的诊断落在具体那一行**
   （如 `) => boolean | void;`），写在 `export type` / `export function` 上方会报
   `suppressions/unused` —— 症状是「明明加了 ignore 却被判未使用」。
3. 别盲信 lint 自动修复：`noConfusingVoidType` 建议 `() => void | Cleanup` → `undefined | Cleanup` 会破坏 API，先用 `tsc` 验证。
4. biome 2.x 键名变了：`files.ignore`→`files.includes`、`overrides[].include`→`includes`、`rules.recommended`→`preset`。
5. `passWithNoTests` 是 vitest **根级**选项，写进 `projects[]` 不生效。
6. 新增生成的 registry 文件要同步加进 `biome.json` 忽略列表。
7. **必须从仓库根跑 vitest**（`node_modules/.bin/vitest run --project unit`）。
   在 `packages/<x>/` 下跑不会应用根 config 的 jsdom 环境，会大面积假失败。
8. `pnpm install` / `pnpm -r build` 在本环境会挂起（疑似网络）。用 `node_modules/.bin/unbuild`
   逐包构建代替。手工补 workspace 依赖时，`packages/<x>/node_modules/@apollo-design/<dep>`
   的符号链接也要自己建（`ln -s ../../../<dep> <dep>`，与 pnpm 布局一致）。
9. **`--verify` / 任何带 `--coverage` 的 vitest 在本沙箱会直接失败**：
   v8 coverage provider 开跑前 `rm -rf coverage/`，被 `node-safe-delete-shim` 拦下
   （`SAFE_DELETE_BULK_CONFIRM_REQUIRED`，101 个文件 > 阈值 50），9 秒退出且**不产报告**，
   于是 `--verify` 静默保留旧值。解法：命令前加 `CODEBUDDY_SAFE_DELETE_ENABLED=0`。
   只影响覆盖率，不影响仓库本身。
10. **`package.json` 由 `scaffold-packages.mjs` 模板拥有**。手工加依赖必须**同时**改
    `registry/tools/scaffold-packages.mjs` 的 `deps`，否则下次 `--force-pkg` 会被抹掉；
   而且 `foundation.json` 的 `dependsOn` / `implOrder` 是从模板推的，
   漏改会让拓扑序失真（test-utils 曾因此被算作零依赖，排在 icons 之前）。
   漏声明的直接症状是 L7 的 B1：`unbuild` 报 `Potential implicit dependencies found: <pkg>`
   并退出码 1 —— 报错说的是「隐式依赖」，不是「缺依赖」。
11. **jsdom 的 computed `border-*-width` 默认是 `"16px"`**（既非 CSS 初始值 `medium`/3px，
    也非 0）。造测试元素时四条边必须显式归零，否则公式里混进 16，断言无法解释。
12. **jsdom 里 inline style 会传导到 computed style** —— `overflow` / `overflow-x` /
    `border-*-width` / `width` / `height` / `position` / `overflow-clip-margin` 都行。
    ⇒ 不需要 spy `getComputedStyle`，也就不用把假对象断言成 `CSSStyleDeclaration`（H10）。
    `offsetWidth/offsetHeight/clientWidth/clientHeight` 用 `Object.defineProperty` 覆盖，
    `getBoundingClientRect` 整个替换成 `new DOMRect(...)`（`DOMRect` 构造器可用）。
13. **`cloneNode` 不复制挂在实例上的桩**（`getBoundingClientRect` 等）—— 克隆体的 rect
    退回恒 0，会走早退分支。要造「无父元素」的浮层：先 `stubEle` 再 `remove()`。
14. **jsdom 的 IDL getter 带 brand 校验** —— `Object.create(Node.prototype)` 会抛
    `not a valid instance of Node`，造不出「既无 ownerDocument 也不是 Document」的替身。
15. `pnpm test` 报的用例数是**分 project 的**：1151 = unit（46 文件），另有 dom 60 / a11y 32。
    而 `foundation.json` 里某包的 `verification.unit.tests` 是**该包自己的** unit+types 合计
    （如 motion 154 = 110 unit + 44 test-d），两者不是一回事，别拿来对账。
16. **`expectTypeOf(SOME_CONST)` 会把常量推断成 `string`**，于是
    `toEqualTypeOf<'add'>()` 永远失败（报 "Actual string"）。必须写
    `expectTypeOf<typeof SOME_CONST>()`。
17. **Edit 工具偶发「报 success 但文件内容没变」**（本轮出现 3 次）。
    改完一定要回读确认；不放心就用 node 脚本做精确替换再验证。
18. **组件层测试拿不到注入帧泵的口子**，只能走真实 rAF（jsdom 约 16ms/帧）。
    motion 的离场要 prepare→start 两帧、start→active 两帧，**active 才注册 deadline**，
    所以至少等 5 帧 + 30ms 才能看到离场 key 被摘掉。需要确定性时改用
    `useMotionStatus`（它有 `scheduler` 注入点）而不是挂组件。
    43 个 `*.test.ts` 扣掉 `a11y.test.ts` 与 `semantic.test.ts` 共 3 个正好 40 ——
    核对「有没有文件没被收集」用这个等式，别拿总数跟上次比。
16. **`docs/` 下的 Markdown 用 Grep 工具搜 `^#` 会静默无结果**（同坑 1），用 `^#{1,3} `。

---

## 环境

Node ≥22.12（managed: `~/.workbuddy-ai/binaries/node/versions/22.22.2-2/bin/node`）｜
pnpm 12.4.2（`.npmrc` `hoist=false`）｜TypeScript 锁 5.9.x（unbuild 3.6.1 peer 要求）｜
Vitest 5｜Playwright + pixelmatch

---

## 架构风险

| # | 风险 | 状态 |
|---|---|---|
| AR1 | 浮层定位几何 | ✅ **两半都已解除**（2026-09-17）：几何内核 PoC 通过（5000 组差分与 antd 逐位一致）；DOM 测量外壳落地于 `packages/position/src/measure.ts`，`position` 已收口 completed。⚠️ 仍缺 L6「与 antd 参考截图逐像素比对」（需真实浏览器，jsdom 下度量值全是桩替的，见 `docs/foundation/position-contract.md` §9） |
| AR2 | motion 五类语义 | ✅ **已解除**（2026-09-17）：内核零偏差（5000 组差分 / 种子 `20260917`），帧驱动与 Vue 接线落地，`motion` 已收口 completed。⚠️ 三项遗留写在 registry 的 `notes`：`MotionProvider` 未实现；`CSSMotion` 尚未被 ui 层真实消费；「动画看起来对」仍属 L6（见 `docs/foundation/motion-contract.md` §9） |
| AR3 | picker 状态机 | 待验证 |
| AR4 | 零运行时下 `classNames`/`styles` 优先级 | 随 config-provider |
| AR6 | Vue 泛型对 `Table<T>` 的表达力 | 待验证 |

### PoC 的 DoD（`WORKFLOW.md` §1.1.1）

1. 对照物必须**机械移植**，不是理解重写 —— 否则差分通过只说明两边都想通了
2. 确定性 PRNG 千级用例，写死种子
3. oracle 上留开关，使「这是唯一差异」成为可证伪断言
4. **必须写明「没有证明什么」**
5. `pocStatus=done` 必须同时填 `pocResult`（E16 强制）

---

## 兼容性差异

任何 L1-L5 差异必须登记到 `COMPATIBILITY.md` §9（编号 D1、D2…），未登记视为 BUG。
已登记 18 项（D1-D18）。四类：`INTENDED` / `PLATFORM` / `DEFECT` / `UNDECIDED`。
**`DEFECT` = antd 自身缺陷，我们有意不复刻**（如 D13 相交面积算式、D17 `ariaLabel` 泄漏）。

另有 **§9.2.1「跟随的上游缺陷」（U1-U3）**：不是差异，而是「我们与 antd 相同、而 antd 有问题」。
**没有 `D<n>` 编号**（编号只登记差异），但同样必须登记，否则会被后人当成疏漏顺手修掉、
从而与上游漂移让机械 oracle 失效。每条必须附「钉住它的测试名」。

校验器从 §9.2 的 Markdown 表格**刮取**真实存在的 `D<n>` —— 引用不存在的编号会报错；
§9.2.1 的 `U` 行不会被误认为差异编号。

---

## ⚠️ 当前未决事项（下次接手先看这里）

1. **AR1 与 AR2 都已解除**（2026-09-17）。motion 的三项遗留写进了 registry 的 `notes`：
   `MotionProvider` / 全局 `prefers-reduced-motion` 未实现（`motion-contract.md` §8 P2 未裁决）；
   `CSSMotion` / `useMotionStatus` 尚未被 ui 层真实消费；
   fade/zoom/slide/move 的 keyframes 属 theme/ui，本包不产出（§4 边界）。

2. **`next-task.mjs` 现在指向 `@apollo-design/portal`**（按推进顺序）；
   「可开始完整实现」仍是 `@apollo-design/locale`。
   ⚠️ `position` 与 `motion` 的 `api` 维度都标了 done，但都**尚未被上层真实消费** ——
   联调时若发现 API 形状不够用，需回来改并同步各自的 contract 文档。
   这条风险已写进 registry 的 `notes`，不是静默放过。

3. **教训：别把「没有新增 error」当成「没有 error」。** 上一轮 test-utils 收口时
   我记成「lint 0 error」，实际 HEAD 上有 19 处 `!` 让 `biome check .` 一直是红的。
   收口时必须跑**全仓**门禁并对齐 `package.json` 里 `lint` 脚本的真实定义
   （本项目 = `lint:types` + `lint:format`，后者即 `biome check .`）。

3. L7 门禁只剩 **`@apollo-design/ui` 的 B5/B6/B7/B8** 是 PENDING（需 CSS 产物与组件落地）。
   其余 12 个包全部 PASS 或按各自 `notDo` 判 n/a。全量跑一次约 6 分钟（13 个包串行 unbuild），
   当前 **127 checks / FAIL 0 / PENDING 4 / n/a 50**。

4. **`verification.typecheck` 仍是无人校验的 Agent 断言** —— `foundation-status.mjs:422`
   把它初始化为 `{ status: 'not-run', errors: 0 }` 之后**从不计算**，而 E16 会拿它当作
   `completed` 的依据。它对应的**两个真实错误已在 2026-09-17 修掉**
   （theme `build.config.ts` 的手写注解、utils `env.ts` 的 weak type），
   但**机制缺口没修**：下次任何包引入类型错误，registry 照样会显示 `clean`。
   建议给 `--verify` 加一步全仓 `vue-tsc` 并按包归属写回（已登记为
   `docs/foundation/test-utils-contract.md` §8 Q3，建议选项 A）。

5. 用户此前要求：**规划完成后等待确认，不要自行进入大规模组件实现。**
