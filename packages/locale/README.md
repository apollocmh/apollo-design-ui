# @apollo-design/locale

> **层**：L2 ｜ **风险**：low ｜ **Phase 2 实施顺序**：10
>
> 本文档声明本包的**职责边界**。边界之外的事情不做 —— 如果发现需要做，说明架构需要调整，
> 应当先修改 `ARCHITECTURE.md` 并记录 ADR。

---

## 职责

国际化数据包：75 个语言包 + Locale 类型 + 各组件 locale 分片。**由脚本从 antd 的 locale 源生成**（与 icons 同一套路），不手工维护。

## 替代的 Ant Design 依赖

- `antd/locale/*`

## 公开 API

> ⚠️ 数量是 **73 个语言包**，不是早期文档写的 75 —— 实测 antd 6.6.4 的源码与产物都是 73。
> ⚠️ **没有子路径入口**（本仓库裁决 A 是单文件产物）⇒ 只能具名导入，
> 不能像 antd 那样 `import zhCN from 'antd/locale/zh_CN'`。

### 数据

- **73 个语言包**：`zh_CN` / `en_US` / `ja_JP` / …（导出名**保留 antd 的下划线原名**，
  把迁移成本压到「只改包名」）
- 各组件 locale 分片：DatePicker / Pagination / Table / Form / Upload / …

### 类型

- `Locale`（17 个分片键，只有 `locale` 必填）
- `LocaleComponentName`（`Exclude<keyof Locale, 'locale'>`）
- 各分片的类型：`TableLocale` / `ModalLocale` / `PaginationLocale` / `PickerLocale` / …

### 取 locale

- `useLocale(name, defaultLocale?)` —— 返回 `[locale, localeCode]`
  （**浅合并，context 侧赢**；嵌套对象只能整体给出）
- `localeContextKey` —— 注入键；`LocaleProvider`（**已废弃**）+ `ANT_MARK`
- `changeConfirmLocale` / `getConfirmLocale` —— Modal confirm 的模块级 locale 栈

## 明确不做（边界）

- ❌ 不做运行时语言切换（那是 ConfigProvider 的 locale prop）
- ❌ 不含任何组件实现
- ❌ 不手工编辑生成产物 —— 改源头或改生成脚本
- ❌ 不做子路径入口（`antd/locale/zh_CN` 那种）—— 单文件产物，只能具名导入

## 必须遵守的契约

- Locale 类型的字段名与 antd 完全一致（用户迁移时 locale 对象可直接沿用）
- 生成管线必须可重跑且幂等（`node registry/tools/gen-locale.mjs --check` 返回 0）
- 至少 zh_CN 与 en_US 必须完整覆盖全部组件分片

## 依赖

### 运行时依赖

| `dayjs` | `catalog:` |

### peer 依赖

（无）

## 依赖约束（ARCHITECTURE.md §3.1）

- **R1 单向**：只能依赖同层或更低层
- **R2 无环**：不得与其他包循环依赖
- **R3 地基纯净**（仅 L0）：不得包含任何组件视觉语义
- **R4 引擎无视觉**（仅 L2）：不得定义颜色/圆角/阴影，不得产出 CSS
- **R6 显式声明**：跨包导入必须在本文件的 `dependencies` 中声明（`.npmrc` 已设 `hoist=false`）

本包的依赖已通过 `registry/tools/scaffold-packages.mjs` 的分层校验。

## 构建说明

本包由 `registry/tools/gen-locale.mjs` 从 antd 源码的 `components/locale/*.ts(x)` 生成到 `src/generated/`。生成目录不入 review（同 icons）。

## 测试

```bash
pnpm --filter @apollo-design/locale test
pnpm --filter @apollo-design/locale lint
```

测试要求见 [`TESTING.md`](../../TESTING.md)。
L0 包的覆盖率下限为 语句 95% / 分支 90% / 函数 95%。
