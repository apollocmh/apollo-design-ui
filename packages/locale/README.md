> 规范范围：本文件保留实现说明与历史对照证据；上游同构、旧阶段与历史 Gate 要求不再生效。现行规则见 [项目规范](../../AGENTS.md)，公共行为以 Apollo 组件 API 文档与测试契约为准。

# @apollo-design/locale

> **层**：L2 ｜ **风险**：low
>
> 本文档声明本包的**职责边界**。边界之外的事情不做 —— 如果发现需要做，说明架构需要调整，
> 应当先修改 `ARCHITECTURE.md` 并记录 ADR。

---

## 职责

国际化数据包：73 个语言包 + Locale 类型 + 各组件 locale 分片。**由脚本从 antd 的 locale 源生成**（与 icons 同一套路），不手工维护；Apollo 扩展由 `registry/source/locale-apollo-overrides.json` 合入生成，原始上游快照保持独立。

## 替代的 Ant Design 依赖

- `antd/locale/*`

## 公开 API

- Locale 类型（与 antd 的 Locale 结构逐字段一致，含 17 个分片键）
- 73 个语言包：zh_CN / en_US / ja_JP / ...（导出名保留 antd 的下划线原名，便于只改包名迁移）
- 各组件 locale 分片：DatePicker / Pagination / Table / Form / Upload / ...
- useLocale(name, defaultLocale?) —— 取某组件的 locale，返回 `[ComputedRef<分片>, ComputedRef<string | undefined>]`（浅合并，context 侧赢）；脚本中读取 `.value`，动态语言同步更新。
- LocaleProvider（已废弃）+ ANT_MARK —— 上游用它做「官方导出」校验
- changeConfirmLocale / getConfirmLocale —— Modal confirm 的模块级 locale 栈；Provider 仅在客户端注册自身的 Modal 分片，深更新与卸载只清理自身来源。

## 明确不做（边界）

- 不管理应用选择的语言；通过 ConfigProvider / LocaleProvider 接收当前语言并响应更新。
- ❌ 不含任何组件实现
- ❌ 不手工编辑生成产物 —— 改源头或改生成脚本
- ❌ 不做子路径入口（antd 的 `antd/locale/zh_CN`）—— 本仓库裁决 A 是单文件产物，只能具名导入

## 必须遵守的契约

- Locale 保留已声明的组件分片；Apollo 扩展 `global.clear?: string` 作为输入清除按钮文案。en_US 为 `Clear input`，zh_CN 为 `清空输入`；其他语言缺省时由 useLocale 回退到英文。
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


`useLocaleReactive` 已移除，原有调用统一迁移至 `useLocale`。底层 localeContextKey 可接收响应式来源；SSR 不注册请求级 Modal 数据到模块状态。详见[本轮迁移](../../docs/migrations/config-provider-contracts.md)。本轮只验收此消费链，不代表 Locale 全包重新验收。
