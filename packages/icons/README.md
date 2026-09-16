# @apollo-design/icons

> **层**：L0 ｜ **风险**：low ｜ **Phase 2 实施顺序**：3
>
> 本文档声明本包的**职责边界**。边界之外的事情不做 —— 如果发现需要做，说明架构需要调整，
> 应当先修改 `ARCHITECTURE.md` 并记录 ADR。

---

## 职责

Vue 图标组件集。以 @ant-design/icons-svg 为数据源生成，保证与 antd 图标像素一致。

## 替代的 Ant Design 依赖

- `@ant-design/icons`

## 公开 API

- 全部图标组件（PascalCase 命名，与 @ant-design/icons 一致）
- 基础组件：Icon / createIcon / IconProvider
- 工具：setTwoToneColor / getTwoToneColor / createFromIconfontCN
- 样式：getIconStyle(iconPrefixCls) —— 供 ui 的静态样式层消费

## 明确不做（边界）

- ❌ 不手写 SVG path（必须从 @ant-design/icons-svg 生成）
- ❌ 不做运行时 <style> 注入（图标基础样式由 getIconStyle 交给 ui 的零运行时样式层）

## 必须遵守的契约

- 图标名与 @ant-design/icons 完全一致（Outlined / Filled / TwoTone 三种主题）
- 图标尺寸继承 font-size，颜色继承 currentColor
- TwoTone 图标支持双色定制；非 TwoTone 图标忽略 twoToneColor（与 antd 一致）
- DOM 契约以 tests/compat/baselines/icons.dom.json（机械 oracle）为准

## 依赖

### 运行时依赖

| `@ant-design/icons-svg` | `catalog:` |
| `@ant-design/colors` | `catalog:` |
| `@apollo-design/utils` | `workspace:*` |

### peer 依赖

| `vue` | `catalog:` |

## 依赖约束（ARCHITECTURE.md §3.1）

- **R1 单向**：只能依赖同层或更低层
- **R2 无环**：不得与其他包循环依赖
- **R3 地基纯净**（仅 L0）：不得包含任何组件视觉语义
- **R4 引擎无视觉**（仅 L2）：不得定义颜色/圆角/阴影，不得产出 CSS
- **R6 显式声明**：跨包导入必须在本文件的 `dependencies` 中声明（`.npmrc` 已设 `hoist=false`）

本包的依赖已通过 `registry/tools/scaffold-packages.mjs` 的分层校验。

## 构建说明

848 个图标组件由 `registry/tools/gen-icons.mjs` 从 `@ant-design/icons-svg` 生成到 `src/icons/`，**该目录是生成物、不入 review**（与 locale 的 `src/generated/` 同规）。

```bash
node registry/tools/gen-icons.mjs          # 生成/刷新
node registry/tools/gen-icons.mjs --check  # 只比对，不写入（门禁用）
```

要改图标行为，改 `src/create-icon.ts` / `src/render.ts`，**不要改 `src/icons/` 下的任何文件** —— 下次生成会被覆盖。

## 测试

```bash
pnpm --filter @apollo-design/icons test
pnpm --filter @apollo-design/icons lint
```

测试要求见 [`TESTING.md`](../../TESTING.md)。

**覆盖率口径**（2026-09-16 收口）：豁免的是**生成的数据模块**，不是整个包。
`packages/icons/src/icons/**`（849 个文件）在 `vitest.config.ts` 的 `coverage.exclude` 中排除
—— 对生成代码要求行覆盖率没有意义。但包内 **9 个手写文件**
（`render` / `create-icon` / `icon` / `icon-font` / `two-tone-color` / `context` /
`class-names` / `style` / `index`）**不豁免**，按 foundation 档位 95 / 90 / 95 要求，
实测 **100 / 100 / 100 / 100**。

⚠️ 只在 `coverage.thresholds` 里不列本包是**不够**的：`coverage.all` 默认为 `true`，
生成模块仍会被插桩并计入 `coverage-summary.json`，而 `foundation-status.mjs --verify`
按 `packages/icons/src/` 前缀聚合，会把它们算进本包（`functions` 会被拉到 91.18%）。
必须在**采集层**同时排除。依据 `ARCHITECTURE.md` §7，推导见
[`docs/foundation/icons-contract.md`](../../docs/foundation/icons-contract.md) §5.3。

### 测试分层落点

| 层 | 文件 | 要点 |
| --- | --- | --- |
| L1 unit | `__tests__/icons.test.ts` | 纯函数、模块级状态、TwoTone 调色板、样式模板逐字节比对 |
| L2 interaction | `__tests__/icons.test.ts` | `onClick` / `tabIndex` / `rotate` / `IconProvider` 响应性 |
| L3 type | `__tests__/api.test-d.ts` | 含负例。**负例只声明不调用** —— `*.test-d.ts` 会被真执行 |
| L4 dom-contract | `__tests__/semantic.test.ts` | 与 React 机械 oracle 逐属性比对，覆盖全部 848 个图标。投影实现复用 `@apollo-design/test-utils`（`profile: 'full'`），见 `docs/foundation/icons-contract.md` §6.3 |
| L5 a11y | `__tests__/a11y.test.ts` | axe **分块**扫描（每块 100）：axe 在 jsdom 下对节点数二次方增长 |
| L6 visual | — | **n/a**，见下 |
| L7 build | `tests/build/run.mjs --package icons` | FAIL 0 / PENDING 0 |

`L6 visual` 为 `n/a`，这是**项目级缺口**而非本包的独立判断：`tests/visual/run.mjs` 尚未实现
（`tests/visual/README.md` 声明随 Phase 2 的 S8/Button 落地），所有 foundation 包都缺这一层。
对本包而言视觉契约等价于 SVG 属性契约 —— 本包不产出组件级 CSS，且 L4 已对 848 个图标
逐属性（含 `viewBox` / `d` / `fill-rule`）与 React 产物比对，像素比对严格冗余
（一个 `d` 属性错了在 L4 必红，在像素比对里可能只是 0.3% 差异率被归为噪声）。
待视觉 harness 落地后应**统一补测**，而不是逐个包声称 `n/a`。

## 兼容性差异

本包登记在 [`COMPATIBILITY.md`](../../COMPATIBILITY.md) §9.2 的差异（`D14`–`D18`），
以及 §9.2.1 的「跟随的上游缺陷」（`U1`–`U3`）。**实现前必读**：

| # | 差异 | 分类 |
| --- | --- | --- |
| D14 | 图标前缀默认 `apollo-icon`（上游 `anticon`）。`iconPrefixCls` 是**独立开关**，不由 `prefixCls` 派生，所以 D6 不覆盖它 | INTENDED |
| D15 | 不做运行时 `<style>` 注入，导出 `getIconStyle()` 交静态样式层 | INTENDED |
| D16 | 不输出 `-ms-transform`（IE9 前缀） | PLATFORM |
| D17 | `ariaLabel` prop 映射到 `aria-label`（上游会泄漏成非法的 `ariaLabel` 属性） | DEFECT |
| D18 | SVG 属性名**原样透传**，不做 `dash-case → camelCase`。照抄上游会产出 `fillrule`，**图标会画错** | PLATFORM |

| # | 跟随的上游缺陷 | 钉住它的测试 |
| --- | --- | --- |
| U1 | `spin` 不产生 `aria-live` / `aria-busy`，屏幕阅读器感知不到 loading | `a11y.test.ts` |
| U2 | 自定义 SVG 路径的 `Icon` 没有可访问名（违反 WCAG 4.1.2），落点在消费方 | `a11y.test.ts` |
| U3 | 告警正文的错字 `definiton` 照抄，改对了会与上游漂移 | `icons.test.ts` |

**D18 是本包最容易踩的坑**：它不会让构建或类型检查失败，只会让图标静默画错。
若你在 `render.ts` 里看到「为什么不做 camelCase」的注释，那是刻意的，不是遗漏。

## 构建产物

```bash
cd packages/icons && ../../node_modules/.bin/unbuild
```

产出 `dist/index.mjs`（约 174 kB）+ `dist/index.d.ts` / `index.d.mts`（各约 960 kB，848 个图标
全部内联声明）。**不要用 `pnpm -r build`** —— 本环境会挂起，逐包跑 `unbuild` 代替。

