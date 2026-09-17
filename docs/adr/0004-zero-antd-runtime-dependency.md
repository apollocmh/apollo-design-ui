# ADR 0004：发布包零 Ant Design 运行时依赖

- **状态**：已接受
- **日期**：2026-09-18
- **相关**：`ARCHITECTURE.md` §3.1 R7、`registry/dependencies.json` 的 `strategyLegend`、
  `registry/tools/validate-registry.mjs` 的 **E19**、`registry/tools/scaffold-packages.mjs`、
  `pnpm-workspace.yaml` 的 catalog 分组、**ADR 0003**（本 ADR 收紧它的 `reuse` 策略）

---

## 背景

ADR 0003 把依赖替代分成四类，其中 `reuse`（直接复用）的判定条件是
「该包**框架无关**（纯数据 / 纯算法），`peerDependencies` 不含 React」，
并据此把 5 个包判为可直接复用，其中 3 个来自 Ant Design 生态：

| 包 | 当时的理由 |
|---|---|
| `@ant-design/icons-svg` | 纯数据（图标 path），零运行时依赖 |
| `@ant-design/colors` | 纯算法（10 阶色板生成），无框架耦合 |
| `@ant-design/fast-color` | 纯算法（颜色解析/转换），零依赖 |

这个判定在「框架耦合」这个维度上是对的 —— 它们确实不绑定 React。
但它漏掉了一个维度：**发行关系**。

三个包被写进了 `@apollo-design/icons` / `@apollo-design/theme` 的
`dependencies`，后果是：

```
用户 npm install @apollo-design/icons
  └── 连带安装 @ant-design/icons-svg
用户 npm install @apollo-design/theme
  └── 连带安装 @ant-design/colors + @ant-design/fast-color
```

也就是说，**一个宣称「Vue 3 原生重写 Ant Design」的库，其用户会被装上 antd 的包**。
`registry/tools/validate-registry.mjs` 的 E11 只拦 `react` / `react-dom` /
`@rc-component` / `@ant-design/cssinjs`（即「React 运行时」），
`@ant-design/icons-svg` / `colors` / `fast-color` 恰好不在名单里 ——
它们被有意放行了，所以没有任何门禁能发现这件事。

### 为什么不能继续「直接复用」

- **用户视角**：装 A 库却得到 B 库的依赖，是供应链上的意外。审计、许可证清单、
  体积预算都会因此失真。
- **定位视角**：本项目的卖点之一是「不依赖 antd」。传递依赖会把这个卖点变成半真半假。
- **升级视角**：`@ant-design/*` 的版本范围由 antd 的节奏决定，我们的用户被绑上了
  一个他们没选择的上游。

### 但「不依赖」不等于「不参考」

这三个包承载的是**视觉对齐的判据**：图标 path、色板梯度、颜色舍入。
重新发明它们等于把「与 antd 一致」变成不可证伪的假设。
所以本 ADR 不是要切断与它们的联系，而是要把联系**从运行时挪到构建期**。

## 决策

### 1. 规则：R7

> **发布包的 `dependencies` 不得包含任何 `@ant-design/*`（以及 `antd` / `react` /
> `@rc-component/*`）。**

Ant Design 生态包只允许出现在**三处**：

| # | 位置 | 用途 | 典型形态 |
|---|---|---|---|
| ① | `registry/tools/gen-*.mjs` | **构建期数据源** —— 求值后固化成字面量随包发布 | `gen-icons.mjs` |
| ② | `*.oracle.test.ts` / `tests/compat/` | **测试 Oracle** —— 对移植实现做差分验证 | `color.oracle.test.ts` |
| ③ | `devDependencies` | 上面两者的**声明位置**（①② 的包必须声明在这里） | `packages/*/package.json` |

### 2. 两种落地手段

| 手段 | 适用 | 做法 | 本次应用 |
|---|---|---|---|
| **`generate`** 构建期固化 | 上游是**数据** | 构建期求值 → 序列化成字面量写进生成物 | `@ant-design/icons-svg` → `packages/icons/src/icons/*.ts` |
| **`port`** 移植 + 差分验证 | 上游是**算法** | 算法移植进 `@apollo-design/*`，上游降级为 Oracle | `@ant-design/colors`、`@ant-design/fast-color` → `packages/utils/src/color/` |

**为什么算法走「移植」而不是「换一个第三方颜色库」**：
色板梯度与颜色舍入是 Token 的**像素级判据**。换成 `colord` / `tinycolor2`
意味着两个可能的舍入来源，而差异只在个别色值上体现 —— 最难发现的一类回归。
移植 + 逐位差分验证（`color.oracle.test.ts`，对上游 90+ 组样本比对）
既保住了「只有一个实现来源」，又保住了「与 antd 逐位一致」。

### 3. 三个包的最终归属

| 包 | 策略 | 落点 | 运行时归属 |
|---|---|---|---|
| `@ant-design/icons-svg` | `generate` | `gen-icons.mjs` → 848 个图标定义字面量 | `packages/icons/src/icons/` |
| `@ant-design/colors` | `port` | `generatePalette()`（10 阶色板） | `packages/utils/src/color/` |
| `@ant-design/fast-color` | `port` | `Color` 类（解析 / 转换 / 混合） | `packages/utils/src/color/` |

颜色数学放在 `utils` 而不是新开包，依据 `ARCHITECTURE.md` §3.1 R2 的例外条款：
`utils` 是 L0 的公共底座（`icons` / `motion` / `portal` … 都已依赖它），
新开第 14 个包会把「只建必要数量」的约束往坏的方向推。
`utils/src/color/` **只放算法**，不得出现色值字面量（R3）—— 预设色板归 `theme`。

### 4. 门禁：E19

`registry:validate` 新增 **E19**，双扫描：

1. `packages/*/package.json` 的 `dependencies`（`private: true` 的包豁免）
2. `packages/*/{dist,es}` 产物的 import 说明符

两道缺一不可：只删 import 不改 `dependencies`，用户照样被装上；
只改 `dependencies` 不改代码，产物会在用户环境里 `MODULE_NOT_FOUND`。

`scaffold-packages.mjs` 另有一道**更早**的校验：模板里 `deps` 出现
antd 生态包直接报错 —— 在「声明」层面就拦住，而不是等代码写完。

## 后果

### 正面

- `npm install @apollo-design/*` **不再**连带安装任何 antd 包。三个 L0 包的运行时
  依赖只剩 `vue`（peer）与彼此。
- 视觉对齐的判据没有被削弱：848 图标 L4 DOM 契约仍全绿；
  theme 的 antd token 基准（`antd-token-baseline.json`）仍逐字段全绿。
- 上游升级的影响面从「用户运行时」缩小到「一次重新生成 + 差分测试」。

### 代价（必须记住的部分）

1. **`packages/icons/src` 由 ~0.3 MB 增到 1.24 MB**，`dist/index.mjs` 由 174 kB 增到 878 kB。
   这是把原本由用户另行安装的同一份 path 数据挪进本包 —— **用户侧总安装量不变**，
   但本包自身的体积数字会显著变大，别把它误读成回归。
2. **移植代码需要跟随上游**。`packages/utils/src/color/` 是上游的移植，
   上游改算法时我们必须同步 —— 这正是 `color.oracle.test.ts` 存在的意义：
   它把「上游变了」变成一条红灯，而不是一次静默漂移。
3. **`utils` 新增了一条 L0→L0 的边**（`theme → utils`）。R2 的措辞已同步修正为
   「L0 之间互不依赖，唯一例外是 `utils`」，因为这条边在本次改动前就已存在
   （`icons → utils` / `motion → utils` …），只是当时没写进规则。
4. **不支持 CSS 颜色名**（`red` / `aliceblue` …）。上游的 `FastColor` 内置 148 个名字的
   查表，那是一份色值数据，放进 L0 通用工具包违反 R3。本库的色值只可能来自 Token，
   而 Token 全是 hex / `rgb()` 记法。这是一处**有意**的差异，已在
   `packages/utils/src/color/types.ts` 与 `color.oracle.test.ts` 中标注并断言。
