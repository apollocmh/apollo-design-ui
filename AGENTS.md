# AGENTS.md

> 本文件定义 AI Agent 在本仓库中的**行为契约**。
> 任何与本文件冲突的临时指令，除非用户明确覆盖，否则以本文件为准。
> 修改本文件必须由用户发起。

---

## 0. 项目一句话

把 **Ant Design React** 当作**兼容性规格（Compatibility Specification）**，用 **Vue 3 + TypeScript** 实现一套 Vue-native 组件库 `@apollo-design/ui`。

```
Ant Design React  ──(规格 / 参考实现)──►  @apollo-design/ui
                                          Vue 3 Native Implementation
```

**Ant Design 是"答案的判据"，不是"代码的来源"。**

---

## 1. 绝对禁止（Hard Prohibitions）

违反以下任一条即为任务失败，必须回滚：

| # | 禁止项 | 说明 |
|---|---|---|
| H1 | 禁止引入 React runtime | 不得依赖 `react` / `react-dom` / `react-is`，包括间接依赖 |
| H2 | 禁止复制 Ant Design 实现代码 | 可读、可分析、可对照行为，不得搬运实现 |
| H3 | 禁止机械翻译 | 不得逐行把 JSX/hooks 改写为 Vue。必须用 Vue 的心智模型重新设计 |
| H4 | 禁止模拟 React 生命周期 | 不得伪造 `useEffect`/`useLayoutEffect`/`useMemo`/`useState` 语义层 |
| H5 | 禁止依赖 `@rc-component/*` / `rc-*` | 全部绑定 React，必须替换（见 `registry/dependencies.json`） |
| H6 | 禁止依赖 `@ant-design/cssinjs` 家族 | CSS-in-JS 运行时与 React 耦合，本项目采用静态 CSS + CSS 变量 |
| H7 | 禁止为通过测试而修改测试预期 | 见 §4 |
| H8 | 禁止降低验收标准以换取进度 | 见 §4 |
| H9 | 禁止在组件内硬编码颜色/圆角/高度/间距/字体/阴影/border | 必须走 Token 系统 |
| H10 | 禁止 `any` / `as any` / `@ts-expect-error` 掩盖类型问题 | 类型必须真实正确 |
| H11 | 禁止跨层反向依赖 | 见 `ARCHITECTURE.md` §3 分层规则 |
| H12 | 禁止跳过 Registry 更新 | 组件状态变化必须落盘到 `registry/components.json` |

---

## 2. 唯一合法的开发循环

任何组件开发都必须走完这 10 步，不允许跳步，不允许"先写代码回头补"：

```
1.  READ REGISTRY   读取 registry/components.json，找下一个可执行项
2.  VERIFY DEPS     校验 dependency DAG：所有前置组件与 foundation 包是否 completed
3.  ANALYZE         分析 Ant Design 对应组件的 API / DOM / ARIA / 行为 / Token，产出分析产物
4.  DESIGN API      产出 Vue API 定义（Props / Emits / Slots / Expose / Types）
5.  IMPLEMENT       实现组件 + Token + 样式
6.  TEST            7 层测试（见 TESTING.md）
7.  VISUAL REVIEW   视觉回归对比 React 参考截图
8.  DOCS            生成 Vue API 文档
9.  REGISTRY UPDATE 更新 components.json 各维度状态
10. BUILD + COMMIT  构建校验 + 提交
```

**步骤 3 的产物必须先于步骤 5 存在。** 没有分析产物就开始写实现，视为违反流程。

---

## 3. 任务选择规则

当用户说「继续推进」时，Agent 必须：

```bash
node registry/tools/next-task.mjs
```

该命令的输出是**唯一权威**的下一步任务来源。选择逻辑（不得手动绕过）：

1. 过滤 `status !== 'completed'`
2. 过滤 `blockedBy` 中仍有未 `completed` 项的组件
3. 按 `priority` 升序（P0 → P3）
4. 同优先级按 `unblocks` 降序（能解锁更多下游的优先）
5. 同分按 `complexity` 升序（先做小的，快速验证流水线）

**禁止**：
- 重复开发已 `completed` 的组件
- 跳过 foundation 包去写上层组件
- 因为"某个组件更有意思"而调整优先级（优先级只能由用户或 Registry 数据决定）

---

## 4. 验收纪律

### 4.1 证据规则

声称"完成"必须附带**可复现的命令与真实输出**。禁止以下措辞作为完成依据：
- "应该可以工作"
- "逻辑上没问题"
- "测试通过"（必须贴出实际运行结果）

### 4.2 测试失败的处理顺序

测试失败时，按此顺序排查，**顺序不可颠倒**：

1. 实现错了 → 修实现
2. Token / 样式错了 → 修 Token
3. 测试本身写错了（断言与规格不符）→ **修正测试，并在 commit message 说明为什么原断言是错的**
4. Ant Design 本身行为特殊（非 bug）→ 在 `COMPATIBILITY.md` 记录该差异，并给测试加豁免注释

**绝不允许**：为了让红灯变绿灯，删除断言、放宽断言、`skip` 掉用例、调低阈值。若确实需要放宽标准，必须停下并向用户报告。

### 4.3 兼容性差异的判定

当 Vue 实现与 React 参考实现行为不一致时，Agent 必须分类：

| 分类 | 含义 | 处理 |
|---|---|---|
| **BUG** | 我方实现错误 | 修实现 |
| **INTENDED** | 有意差异（Vue-native 更合理，如 v-model 取代 value/onChange） | 记入 `COMPATIBILITY.md`，测试断言以 Vue 侧为准 |
| **PLATFORM** | 平台固有差异（如 DOM 事件顺序、Teleport 结构） | 记入 `COMPATIBILITY.md`，visual/DOM 测试加白名单 |
| **UPSTREAM** | Ant Design 的 bug 或未文档化行为 | 记录，不跟随，除非用户要求 1:1 |

**禁止**把 BUG 归类为 INTENDED 来蒙混过关。

---

## 5. 事实来源（Source of Truth）优先级

冲突时按此优先级裁决：

```
1. 用户当前指令
2. 本仓库的 AGENTS.md / ARCHITECTURE.md / COMPATIBILITY.md / COMPONENT-RULES.md / WORKFLOW.md
3. registry/*.json（机器可读事实）
4. Ant Design 固定版本的源码与产物（行为判据）
5. Ant Design 官方文档（说明判据，可能滞后）
6. Agent 的先验知识（最低，且必须标注"待验证"）
```

### 5.1 Ant Design 版本锁定

- 兼容目标版本：**antd 6.6.4**（记录在 `registry/components.json` 的 `antdVersion`）
- 参考产物路径（本地缓存，不提交）：`/tmp/antd-src/package/`（npm tarball 解包）
- 参考仓库路径（本地缓存，不提交）：`/tmp/antd-repo/ant-design-master/`（源码 + 测试 + 文档）
- 升级目标版本时，必须重跑 `node registry/tools/gen-registry.mjs` 并人工 review diff

**禁止**凭记忆描述 Ant Design 的 API 或行为。必须读产物或源码验证。

---

## 6. 交付物纪律

### 6.1 一个组件的完整交付物

```
packages/ui/src/<component>/
├── index.ts                 # 导出
├── <Component>.tsx          # 主实现（见 COMPONENT-RULES.md §2 关于 tsx/vue 的选型）
├── interface.ts             # 类型定义（从 Ant Design 类型"重新定义"，不复制）
├── <Component>Context.ts    # 组件级 context（如需）
├── components/              # 子组件
├── style/
│   ├── token.ts             # Component Token 定义 + 默认值
│   └── index.ts             # 样式生成（消费 Token → CSS 变量）
├── demo/                    # 示例（每个 demo 一个 .tsx + .md）
├── __tests__/               # 7 层测试
├── index.en-US.md           # 英文文档
└── index.zh-CN.md           # 中文文档
```

外加：
- `registry/components.json` 中该组件各维度状态更新
- `tests/compat/fixtures/<component>/*.json` 至少 1 个兼容性 fixture

### 6.2 未完成就不许标完成

`status: completed` 的**充分条件**（全部满足）：
- `apiStatus / typeStatus / tokenStatus / styleStatus / testStatus / visualStatus / docsStatus` 全部为 `done`
- 7 层测试全部绿灯
- 视觉回归与 React 参考截图比对通过（或差异已分类记录）
- 构建通过（`pnpm run test:build`）

任一不满足 → 保持 `in_progress`，并在 Registry 中记录阻塞原因。

---

## 7. 沟通纪律

- 汇报时先说**结论与阻塞**，再说细节
- 发现架构问题时**立即上报**，不要静默绕过
- 对不确定的 Ant Design 行为，标注「待验证」并说明验证方法，不要编造
- 不要问「要不要我继续」，除非遇到 §4.3 的兼容性裁决或架构决策分叉

---

## 8. 当前阶段

**Phase 1 — Foundation（进行中）**

本阶段**只做**：项目侦察、架构设计、Registry、Dependency DAG、测试体系、长期开发规范。

本阶段**不做**：批量实现组件。

Phase 1 的退出条件见 `docs/PHASE-1-REPORT.md` §15。
