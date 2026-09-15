# @apollo-design/theme

> **层**：L0 ｜ **风险**：high ｜ **Phase 2 实施顺序**：2
>
> 本文档声明本包的**职责边界**。边界之外的事情不做 —— 如果发现需要做，说明架构需要调整，
> 应当先修改 `ARCHITECTURE.md` 并记录 ADR。

---

## 职责

Token Runtime：Seed → Map → Alias → Component 的完整派生链，以及 Token → CSS 变量的注入。

## 替代的 Ant Design 依赖

- `@ant-design/cssinjs（Token 计算部分）`
- `@ant-design/cssinjs-utils`
- `antd 的 components/theme/`

## 公开 API

- 类型：SeedToken / MapToken / AliasToken / ComponentTokenMap / MappingAlgorithm / ThemeConfig
- 算法：defaultAlgorithm / darkAlgorithm / compactAlgorithm
- 派生：genColorMapToken / genSizeMapToken / genFontMapToken / genRadius / genControlHeight
- 运行时：useToken() / useTheme() / ThemeProvider
- 注入：createCSSVarScope() / applyCSSVar() / tokenToCSSVarName()
- 纯函数：getDesignToken(config) —— 无 DOM 环境可用
- 常量：presetColors（13 色 × 10 阶）

## 明确不做（边界）

- ❌ 不做 CSS-in-JS（零运行时，见 ADR 0001）
- ❌ 不产出组件的具体样式（那是 ui 的职责）
- ❌ 不依赖任何组件

## 必须遵守的契约

- Token 名称必须与 antd 完全一致（Seed 34 / Map 140 / Alias 82 own / Component 70 组）
- CSS 变量命名与 antd 的 cssVar 命名同构，仅前缀不同（apollo vs ant）
- getDesignToken 的输出必须与 antd 的同名 API 逐字段一致
- 三个算法必须可组合（algorithm: [darkAlgorithm, compactAlgorithm]）

## 依赖

### 运行时依赖

| `@ant-design/colors` | `catalog:` |
| `@ant-design/fast-color` | `catalog:` |

### peer 依赖

| `vue` | `catalog:` |

## 依赖约束（ARCHITECTURE.md §3.1）

- **R1 单向**：只能依赖同层或更低层
- **R2 无环**：不得与其他包循环依赖
- **R3 地基纯净**（仅 L0）：不得包含任何组件视觉语义
- **R4 引擎无视觉**（仅 L2）：不得定义颜色/圆角/阴影，不得产出 CSS
- **R6 显式声明**：跨包导入必须在本文件的 `dependencies` 中声明（`.npmrc` 已设 `hoist=false`）

本包的依赖已通过 `registry/tools/scaffold-packages.mjs` 的分层校验。


## 测试

```bash
pnpm --filter @apollo-design/theme test
pnpm --filter @apollo-design/theme lint
```

测试要求见 [`TESTING.md`](../../TESTING.md)。
L0 包的覆盖率下限为 语句 95% / 分支 90% / 函数 95%。
