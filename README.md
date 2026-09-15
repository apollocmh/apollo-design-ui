# @apollo-design/ui

> 用 **Vue 3 + TypeScript** 重新实现一套 UI 组件库。
> **Ant Design React 是兼容性规格（Compatibility Specification），不是代码来源。**

```
Ant Design React  ──(规格 / 参考实现)──►  @apollo-design/ui
   antd 6.6.4                              Vue 3 Native Implementation
```

---

## 目标

尽可能兼容 Ant Design 的：

**Public API ｜ Props ｜ Events ｜ Types ｜ Slots / children ｜ Methods ｜ DOM 结构 ｜ Accessibility ｜ 交互行为 ｜ Design Token ｜ CSS / 视觉 ｜ 主题 ｜ 暗色模式 ｜ 紧凑模式 ｜ 文档**

但底层**必须**使用 Vue 3 的设计方式。

### 不做的事

- ❌ 机械翻译 React 代码
- ❌ 引入 React runtime
- ❌ 复制 Ant Design 的实现代码
- ❌ 为兼容 React 而模拟 React 生命周期
- ❌ 依赖 `@rc-component/*` / `rc-*`
- ❌ 使用 CSS-in-JS 运行时

---

## 当前状态

**Phase 1（项目侦察 + 架构设计 + 开发规范）已完成，Phase 2（基础设施）已规划完毕、尚未开工。**

已产出的是可持续开发的基础设施：

| 类别 | 产出 |
|---|---|
| 规范 | 7 份规范文件（Agent / 架构 / 流程 / 组件 / 兼容性 / 测试 / 路线图） |
| Registry | 72 个组件 × 11 维度 + 13 个基础设施包 × 6 维度 + 依赖 DAG + Token 清单 |
| 并行编排 | 92 个 Work Item / 15 条泳道 / 10 个波次 / 8 个冲突集 |
| 工具链 | 7 个可执行脚本（事实提取 / 生成 / 任务选择 / 进度 / 编排 / 校验 / 脚手架） |
| 兼容机制 | React ↔ Vue 双实现 fixture 系统 |
| 代码 | `@apollo-design/utils` 已完成（37 文件 / 3611 行 / 131 导出 / 643 测试 / 98% 覆盖） |
| 骨架 | 13 个 package（依赖关系已按分层规则校验） |

**先读 [`docs/PHASE-1-REPORT.md`](./docs/PHASE-1-REPORT.md)，再看 [`ROADMAP.md`](./ROADMAP.md)。**
前者是本阶段的完整报告，后者是长期开发路线。

---

## 目录导航

### 规范（先读这些）

| 文件 | 什么时候读 |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | **任何操作之前。** 12 条硬禁止 + 唯一合法开发循环 + 验收纪律 |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | 涉及包结构、依赖方向、Theme Runtime、样式方案时 |
| [`COMPONENT-RULES.md`](./COMPONENT-RULES.md) | 开发组件时 |
| [`COMPATIBILITY.md`](./COMPATIBILITY.md) | 涉及 React → Vue 的 API 映射时 |
| [`WORKFLOW.md`](./WORKFLOW.md) | 领取任务到提交的 15 道 Gate + DoD + 并行执行协议 |
| [`ROADMAP.md`](./ROADMAP.md) | 长期路线：4 个 Phase / 10 个波次 / 可并行任务 / 持续机制 |
| [`TESTING.md`](./TESTING.md) | 写测试时 |

### 机器可读状态

| 文件 | 内容 |
|---|---|
| [`registry/components.json`](./registry/components.json) | 72 个组件的状态、优先级、依赖、Token 数、11 个 DoD 维度 |
| [`registry/dependencies.json`](./registry/dependencies.json) | 依赖 DAG + 54 项依赖替代决策 + 环解决方式 |
| [`registry/foundation.json`](./registry/foundation.json) | 13 个基础设施包的 6 维进度 + 7 层测试 + 11 项开放决策 |
| [`registry/workstreams.json`](./registry/workstreams.json) | 92 个 Work Item / 15 条泳道 / 当前可并行批次 |
| [`registry/tokens.json`](./registry/tokens.json) | Token 清单（Seed 34 / Map 140 / Alias 82 / Component 70 组） |
| [`registry/README.md`](./registry/README.md) | Registry 使用说明 |

### 设计与决策

| 文件 | 内容 |
|---|---|
| [`docs/PHASE-1-REPORT.md`](./docs/PHASE-1-REPORT.md) | **Phase 1 完整报告（18 节）** |
| [`docs/adr/`](./docs/adr/) | 3 篇架构决策记录 |
| [`docs/templates/`](./docs/templates/) | 组件分析模板 / 组件文档模板 |
| [`tests/compat/README.md`](./tests/compat/README.md) | 双实现兼容性机制 |

---

## 快速开始

```bash
# 环境要求：Node >= 22.12，pnpm 12
pnpm install

# 查看该做什么（唯一权威，不要自己挑）
node registry/tools/next-task.mjs --parallel     # 当前**全部**可并行开工的任务
node registry/tools/next-task.mjs                # 下一个**一个**任务（单人串行）
node registry/tools/next-task.mjs --foundation   # 13 个基础设施包的就绪情况
node registry/tools/next-task.mjs --workstream WS-C  # 单条泳道

# 查看波次与批次
node registry/tools/gen-workstreams.mjs --wave W2

# 查看依赖 DAG
node registry/tools/gen-registry.mjs --print-dag

# 校验规范是否被遵守（E1–E18）
node registry/tools/validate-registry.mjs
```

---

## 工具链

| 脚本 | 作用 |
|---|---|
| `registry/tools/extract-antd-facts.mjs` | 从 antd 产物提取事实（组件清单、rc 依赖、内部 DAG、Token 数量） |
| `registry/tools/gen-registry.mjs` | 合成 components / dependencies / tokens（**保留进度字段**） |
| `registry/tools/foundation-status.mjs` | 13 个基础设施包的 6 维进度 + 实测覆盖率 |
| `registry/tools/gen-workstreams.mjs` | 推导 92 个 Work Item 的状态与**当前可并行批次** |
| `registry/tools/next-task.mjs` | 决定下一个（或下一批）任务 |
| `registry/tools/validate-registry.mjs` | 17 项规范检查（E1–E18） |
| `registry/tools/scaffold-packages.mjs` | 生成 package 骨架（含分层规则校验） |

**所有关于 Ant Design 的数字都来自实测提取，不是记忆。** 提取脚本可重跑、可审计 —— 这是"禁止凭记忆描述 antd 行为"这条规则的执行方式。

---

## 包结构

```
@apollo-design/
├── L0  utils          通用工具集（72/72 组件依赖）
├── L0  theme          Token Runtime + CSS 变量
├── L0  icons          Vue 图标组件（生成物）
├── L1  motion         五类动效语义                          ⚠AR2
├── L1  portal         Teleport 封装 + 容器管理 + 滚动锁
├── L1  position       纯几何：对齐点 / 翻转 / 偏移 / 箭头      ⚠AR1
├── L1  a11y           焦点陷阱 / 漫游焦点 / 活动后代 / 朗读区
├── L1  virtual-list   虚拟滚动
├── L2  overlay        触发动作 / 延迟 / 关闭行为 / 层级栈
├── L2  locale         75 个语言包（生成物）
├── L2  form-core      表单状态机 + 校验引擎
├── L2  picker         日期/时间面板引擎
├──     test-utils     共享测试契约（private）
└── L3  ui             组件库（72 个组件）
```

依赖方向**单向**，只能依赖更低层。13 个包只需 **3 个波次**即可全部完成 ——
W2 的 7 个包彼此完全独立，可同时推进。详见 [`ARCHITECTURE.md`](./ARCHITECTURE.md) §3
与 [`ROADMAP.md`](./ROADMAP.md) §3。

---

## 关键架构决策

| # | 决策 | 文档 |
|---|---|---|
| 1 | 零运行时 CSS 变量，放弃 CSS-in-JS | [ADR 0001](./docs/adr/0001-zero-runtime-css-variables.md) |
| 2 | 包边界的唯一判据是「消费者数量 ≥ 2」 | [ADR 0002](./docs/adr/0002-package-boundary-criterion.md) |
| 3 | 依赖替换采用「复用 / 独立包 / 内聚 / 丢弃」四分类 | [ADR 0003](./docs/adr/0003-dependency-replacement-strategy.md) |

---

## License

MIT
