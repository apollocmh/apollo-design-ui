# tests/build — 构建产物校验（L7）

> **状态**：`run.mjs` 已实现（2026-09-16），B1/B2/B3/B4/B9/B10 实测生效并通过反向验证。
> B5/B6/B7/B8 为 **PENDING**（只对 `theme` / `ui`），不是"已通过"——详见下文 §状态。
>
> 设计细节见 [`TESTING.md`](../../TESTING.md) §10。

```bash
node tests/build/run.mjs                 # 构建全部包并校验
node tests/build/run.mjs --no-build      # 跳过构建，复用现有 dist
node tests/build/run.mjs --package utils # 只校验一个包
node tests/build/run.mjs --strict        # PENDING 也视为失败（等 B5-B8 落地后用于 CI）
node tests/build/run.mjs --json          # 机器可读
```

## 状态（2026-10-07 更新）

| 检查 | 状态 | 说明 |
|---|---|---|
| B1 全包构建 | ✅ 生效 | 跑**包自己声明的 `scripts.build`**（`/bin/sh -c`，并把仓库 `node_modules/.bin` 前置到 PATH）—— 🚨 2026-10-07 改：此前硬编码裸 `unbuild`、不带参数，于是包改用 `unbuild --config` 之后门禁**照样跑裸 unbuild 还全绿**（裁决 `ui-tree-shaking` 的 D 项踩到） |
| B2 `exports` 可解析 | ✅ 生效 | **双向**：`exports` 只声明构建后真实存在的路径（含通配符检测）**且**产出的 CSS 都有声明（反方向，2026-10-07 补） |
| B3 产物无 React | ✅ 生效 | 扫描 dist 的 ESM/CJS/`d.ts` 说明符 |
| B4 无 CSS-in-JS 运行时 | ✅ 生效 | 同上 |
| B9 Node 版本 | ✅ 生效 | 要求 ≥ 22.12 |
| B10 无 `@rc-component/*` | ✅ 生效 | 同上 |
| B5 / B7 | ✅ 生效 | 仅 `theme` / `ui`：需要 CSS 产物。其他包判为 n/a（不产 CSS） |
| B6 | ✅ 生效 | 仅 `ui`：73 个组件逐个比对 `tests/build/budget.json`（另加「≤ 全量 30%」第二条判据）。🚨 **2026-10-07 前它是 PENDING，而恰恰在它底下沉积了本仓库最严重的发布缺陷** —— 任一组件 = 1272.9 KB = 全量 63%。裁决 `ui-tree-shaking` = A+B+D 后 Divider 降到 **7.5 KB**（0.4%）。**教训：PENDING 不是免罚牌。** |
| B8 | ✅ 生效 | 仅 `ui`：`renderToString` 冒烟。其他包判为 n/a |

### 为什么 PENDING ≠ 通过

`--strict` 下 PENDING 视为失败并退出 1。这是**显式声明的未覆盖**，
不是放宽标准 —— 报告会把 PENDING 清单逐项打印出来。
一刀切把所有包都标 PENDING 会让零 CSS、零组件的包（如 `utils`）永远卡住 L7；
一刀切标 n/a 又等于用 n/a 掩盖未做（E16 要防的正是这个）。因此逐包按架构事实判定。

### 反向验证（证明它真的会失败）

实现时注入了 3 个故障，3/3 被捕获：

1. `exports` 加回 `./es/*` → B2 FAIL
2. `dist` 里写入 `import x from "react"` → B3 FAIL
3. `--strict` 遇到 PENDING → 退出码 1

修改本文件时请重做反向验证 —— 一个永绿的门禁比没有门禁更危险。

---

## 为什么需要独立的构建测试

组件测试全部通过，**不代表产物可用**。以下问题只有构建后才会暴露：

- `exports` 字段写错 → 消费者无法解析包
- 类型文件缺失或路径错误 → TS 用户无法获得类型
- 产物中混入 React → 违反 `AGENTS.md` H1/H5/H6
- 样式产物缺失 → 无 JS 时样式丢失
- 按需引入单组件却打包了全量 → tree-shaking 失效
- 访问 `window`/`document` → 无法 SSR

## 检查项

| # | 检查 | 方法 | 失败含义 |
|---|---|---|---|
| B1 | 全包构建成功 | `pnpm -r build` | — |
| B2 | `exports` / `types` 正确 | `publint` | 消费者无法正确解析包 |
| B3 | **产物无 React 依赖** | 扫描 `es/` `dist/` 的 import 说明符 | 违反 H1/H5/H6 |
| B4 | **产物无 CSS-in-JS 运行时** | 扫描是否存在运行时样式注入代码 | 违反零运行时架构（ADR 0001） |
| B5 | 零运行时 CSS 存在且非空 | 校验 `css/base.css` 与各组件 CSS | 无 JS 时样式丢失 |
| B6 | tree-shaking 有效 | 按需引入单组件后产物体积 ≤ 预算 | 引入即全量 |
| B7 | 默认主题可用 | 无 JS 环境下仅引入 CSS 渲染正确 | 主题变量未静态化 |
| B8 | SSR 兼容 | `renderToString` 无 `window`/`document` 访问报错 | 无法 SSR |
| B9 | Node 版本兼容 | Node 22 下构建与运行 | — |
| B10 | 无 `@rc-component/*` | 扫描依赖与产物 | 违反 H5 |

**B3 / B4 / B10 是硬 Gate**：一旦失败立即停止，不得提交。

## 与 `validate-registry.mjs` E11 的关系

| | `validate-registry.mjs` E11 | `tests/build` |
|---|---|---|
| 时机 | 快速本地检查 | 完整构建后 |
| 范围 | 扫描已有产物目录 | 构建 + 产物 + 消费侧验证 |
| 深度 | 只查 React 痕迹 | 10 项完整检查 |

E11 是轻量前置检查（CI 早期失败），`tests/build` 是完整验收。

## 计划交付

| 文件 | 作用 |
|---|---|
| `run.mjs` | 入口：构建 → 依次执行 B1-B10 → 汇总报告 |
| `checks/no-react.mjs` | B3/B4/B10 的扫描实现 |
| `checks/exports.mjs` | B2（publint 封装） |
| `checks/treeshake.mjs` | B6（体积预算比对） |
| `checks/ssr.mjs` | B8（`renderToString` 冒烟） |
| `budget.json` | 各组件的体积预算（人工设定，变更需说明理由） |

## 体积预算策略

| 包 | 预算 | 说明 |
|---|---|---|
| `@apollo-design/utils` | 待实测后设定 | |
| `@apollo-design/theme` | 待实测后设定 | |
| `@apollo-design/ui`（单组件按需） | 待实测后设定 | 例：只引入 Button 的产物 ≤ N KB |

**预算只能因技术原因调整，且必须在 commit message 说明理由。** 不允许为了让测试通过而放宽预算。
