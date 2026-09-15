# tests/build — 构建产物校验（L7）

> **Phase 1 交付设计；实现随 Phase 2 的 S1 一起落地。**
>
> 设计细节见 [`TESTING.md`](../../TESTING.md) §10。

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
