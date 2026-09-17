# @apollo-design/locale

> **层**：L2 ｜ **风险**：low ｜ **Phase 2 实施顺序**：10
>
> 本文档声明本包的**职责边界**。边界之外的事情不做 —— 如果发现需要做，说明架构需要调整，
> 应当先修改 `ARCHITECTURE.md` 并记录 ADR。

---

## 职责

国际化数据包：73 个语言包 + Locale 类型 + 各组件 locale 分片。**由脚本从 antd 的 locale 源生成**（与 icons 同一套路），不手工维护。

## 替代的 Ant Design 依赖

- `antd/locale/*`

## 公开 API

- Locale 类型（与 antd 的 Locale 结构逐字段一致，含 17 个分片键）
- 73 个语言包：zh_CN / en_US / ja_JP / ...（导出名保留 antd 的下划线原名，便于只改包名迁移）
- 各组件 locale 分片：DatePicker / Pagination / Table / Form / Upload / ...
- useLocale(name, defaultLocale?) —— 取某组件的 locale（**浅合并，context 侧赢**）
- LocaleProvider（已废弃）+ ANT_MARK —— 上游用它做「官方导出」校验
- changeConfirmLocale / getConfirmLocale —— Modal confirm 的模块级 locale 栈

## 明确不做（边界）

- ❌ 不做运行时语言切换（那是 ConfigProvider 的 locale prop）
- ❌ 不含任何组件实现
- ❌ 不手工编辑生成产物 —— 改源头或改生成脚本
- ❌ 不做子路径入口（antd 的 `antd/locale/zh_CN`）—— 本仓库裁决 A 是单文件产物，只能具名导入

## 必须遵守的契约

- Locale 类型的字段名与 antd 完全一致（用户迁移时 locale 对象可直接沿用）
- 生成管线必须可重跑且幂等
- 至少 zh_CN 与 en_US 必须完整覆盖全部组件分片

## 依赖

### 运行时依赖

（无）

### peer 依赖

| `vue` | `catalog:` |

### 构建期 / 测试依赖（devDependencies，**不会**进入用户的依赖树）

（无）

## 依赖约束（ARCHITECTURE.md §3.1）

- **R1 单向**：只能依赖同层或更低层
- **R2 无环**：不得与其他包循环依赖
- **R3 地基纯净**（仅 L0）：不得包含任何组件视觉语义
- **R4 引擎无视觉**（仅 L2）：不得定义颜色/圆角/阴影，不得产出 CSS
- **R6 显式声明**：跨包导入必须在本文件的 `dependencies` 中声明（`.npmrc` 已设 `hoist=false`）
- **R7 零 Ant Design 运行时依赖**：发布包的 `dependencies` 不得出现任何 `@ant-design/*`。
  Ant Design 生态包只允许出现在三处 —— ① 构建期数据源（`registry/tools/gen-*.mjs`）
  ② 测试 Oracle（`*.oracle.test.ts`）③ `devDependencies`。由 `registry:validate` 的 **E19** 强制。

本包的依赖已通过 `registry/tools/scaffold-packages.mjs` 的分层校验。

## 构建说明

本包由 `registry/tools/gen-locale.mjs` 从 antd 6.6.4 的 **ESM 产物**（`es/locale/*.js`）求值后生成到 `src/locales/`。生成目录不入 review（同 icons）。rc 的 locale 数据固化在 `registry/source/locale-rc/`（带 provenance + sha256）。

## 测试

```bash
pnpm --filter @apollo-design/locale test
pnpm --filter @apollo-design/locale lint
```

测试要求见 [`TESTING.md`](../../TESTING.md)。
覆盖率下限为 语句 95% / 分支 90% / 函数 95%（L2 档位，见 `vitest.config.ts` 的 `coverage.thresholds`）。
