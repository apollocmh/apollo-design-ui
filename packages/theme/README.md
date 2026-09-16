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

---

## 用法

```ts
import { getDesignToken, darkAlgorithm, compactAlgorithm } from '@apollo-design/theme';
import '@apollo-design/theme/dist/tokens.css'; // 零运行时路径：纯 CSS，无需 JS

getDesignToken();                                        // 默认（亮色）
getDesignToken({ algorithm: darkAlgorithm });            // 暗色
getDesignToken({ algorithm: [darkAlgorithm, compactAlgorithm] }); // 可组合
getDesignToken({ token: { colorPrimary: '#00b96b' } });  // 覆盖 seed
```

Vue 侧：

```vue
<script setup>
import { ThemeProvider, useToken } from '@apollo-design/theme';
const token = useToken();
</script>

<template>
  <!-- injectCssVar 打开时走运行时注入路径（zero-runtime-mode 裁决 B） -->
  <ThemeProvider :theme="{ token: { colorPrimary: '#00b96b' } }" :inject-css-var="true">
    <App />
  </ThemeProvider>
</template>
```

切换 `data-apollo-theme="dark" / "compact" / "dark-compact"`（在任意祖先元素上）
即可在**不加载 JS** 的前提下切换主题 —— 变量表由 `tokens.css` 静态提供。

CSS 变量命名与 antd 同构，仅前缀不同：`--apollo-color-primary`、`--apollo-border-radius-lg`。
前缀可通过 ConfigProvider 改为 `ant`（已裁决 `prefix-cls-default = A`）。

---

## 实现状态（2026-09-16）

| 层 | 状态 | 说明 |
|---|---|---|
| Seed | ✅ | 34 个 seed + 13 个预设色，逐字对齐 antd 6.6.4 |
| Map | ✅ | 140 个（colors 76 / font 17 / size 9 / height 3 / style 5 + 公共 4） |
| Alias | ✅ | 82 个 own（有效 222），`motion:false` 分支已覆盖 |
| 算法 | ✅ | default / dark / compact，可组合 |
| CSS 变量 | ✅ | 命名规则与 `@ant-design/cssinjs` 的 `token2CSSVar` 同构；unitless / ignore / preserve 三个清单逐字照抄 |
| 零运行时 CSS | ✅ | 构建期产出 `dist/tokens.css`（4 套主题） |
| 运行时注入 | ✅ | `createCSSVarScope` / `applyCSSVar` / `ThemeProvider`，与静态路径共用同一套变量名 |
| Vue 绑定 | ✅ | `ThemeProvider` / `useTheme` / `useToken` |
| Component Token | ⚠️ 仅类型 | 70 组的**默认值分散在各组件**（antd 亦如此），由 `packages/ui` 逐组件提供；本包只提供 `ComponentTokenMap` 类型与合并机制 |

### 判据从哪来

派生结果与 antd 的一致性由 `registry/tools/gen-theme-baseline.mjs` 保证：
它**直接执行 antd 6.6.4 的 `es/theme` 代码**（算法部分不依赖 React）产出 15 个用例的基准 JSON，
测试再逐字段比对（每个用例 536 个字段）。

```bash
node registry/tools/gen-theme-baseline.mjs          # 重新生成基准
node registry/tools/gen-theme-baseline.mjs --check  # CI：只比对不写入
```

**为什么不写第二份 antd 实现当 oracle**：那只会证明「两边都是我写的」，
连一起犯的错都测不出来。基准必须来自 antd 自己的代码。

**这个基准没有证明什么**：没证明视觉一致（L6）、没证明组件 token 一致（默认值在 ui 侧）、
没证明 CSS 变量被正确消费（那是组件样式的事）。
