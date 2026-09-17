# tests/visual — L6 视觉回归

> **已在 2026-09-18 由 Empty 落地时同步建立**（`registry/components.json` 的
> `empty.visualStatus` 由 `blocked` 改为 `done`，21 组全部 `0.000% exact`）。
> 设计细节见 [`TESTING.md`](../../TESTING.md) §9。

---

## 机制

```
React 参考（antd 6.6.4）              Vue 实现（@apollo-design/ui）
  渲染同一 fixture                        渲染同一 fixture
        │ Playwright 截图                     │
        ▼                                     ▼
  react/<id>.png                        vue/<id>.png
        └────────────────┬────────────────────┘
                         ▼
        sharp 归一化尺寸 → pixelmatch 逐像素比对
                         ▼
                差异率 + diff 图 + HTML 报告
```

## 与 `tests/compat` 的关系

| | `tests/compat` | `tests/visual` |
|---|---|---|
| 范围 | 5 层（API / DOM / ARIA / Behavior / Screenshot） | 只做 Screenshot（L4） |
| 运行器 | jsdom（快） | 真实浏览器 Playwright（慢） |
| 用途 | 每次提交都跑 | 组件完成时跑（G9 Gate） |
| 截图来源 | 复用本目录的截图产物 | 产出截图 |

**分工**：`tests/visual` 负责**产出**两侧截图与像素比对；`tests/compat` 的 `screenshot` 断言复用它的结果。

## 计划交付

| 文件 | 作用 |
|---|---|
| `run.mjs` | 入口：起本地页面 → Playwright 截图 → 比对 → 出报告 |
| `matrix.mjs` | 截图矩阵定义（状态 × 主题 × viewport） |
| `stabilize.mjs` | 稳定性处理：禁用动画、固定字体、隐藏 caret、固定随机值 |
| `compare.mjs` | `sharp` 归一化 + `pixelmatch` 比对 + 差异分类 |
| `report.mjs` | 生成 HTML 报告 |

## 截图矩阵（最低要求）

| 维度 | 取值 |
|---|---|
| 状态 | default / hover / active / focus / disabled / loading / dark / compact |
| 组件特性追加 | open / selected / checked / error / warning / success / expanded / dragging / empty / readonly |
| 主题 | light / dark / compact |
| viewport | 375×667 / 768×1024 / 1440×900 |

## 稳定性要求（缺一不可）

- 注入 `prefers-reduced-motion` + 关闭 motion 开关
- 打包测试字体（避免系统字体差异）
- 固定 viewport / devicePixelRatio / 时区 / locale
- 隐藏 caret
- 固定随机 ID 与时间戳
- 截图前 `await waitForFonts()` + 等一帧

## 阈值

| 差异率 | 判定 |
|---|---|
| 0% | ✅ 通过 |
| ≤ 0.1% 且为抗锯齿噪声（分散单像素） | ✅ 自动通过 |
| > 0.1% 或成块差异 | ❌ 必须人工确认并分类 |

**禁止**为提高阈值让测试通过（`TESTING.md` T17）。

## 待用户裁决

无 —— `visual-baseline-in-git`（已裁决 = A：基线 `tests/visual/baselines/react/<component>/<id>.png`
**直接入库**）、dark / compact（被 ConfigProvider 未实现阻塞，不影响本阶段）等开放决策已落地或显式登记在
`matrix.mjs` 的 `LIMITATIONS`。

---

## 关键技术决策（落地过程中暴露并修正）

### macOS 12 + Playwright 1.63

Playwright 1.63 不再为 macOS 12 提供 Chromium 构建（`playwright install chromium` 直接报
`does not support chromium on mac12`）。`stabilize.mjs` 自动降级：先试系统 Chrome
（`channel: 'chrome'`），失败再退回自带 Chromium。macOS 13+ 仍走自带 Chromium。

### 占位 favicon

`render/{react,vue}.html` 都有 `<link rel="icon" href="data:," />` —— 否则浏览器自动请求
`/favicon.ico` 并记一条 404 `console.error`，被 `run.mjs` 的「渲染错误」捕获成假失败。

### 必须防的假绿

两侧都渲染失败（白屏 / JS 报错）→ 两张空白图逐像素**完全一致** → 差异率 0% → 按阈值 PASS。
`run.mjs` 强制捕获 `pageerror` / `console.error`，任一侧出错直接判 `FAIL / render-error`，
**不比像素**。

### SVG 颜色直接 hex，不走 token

Empty 插画的 `fill` 是 hex 字面量（`#f0f0f0` 等），不是 `var(--apollo-*)`。antd 在 SSR 阶段
用 `getAsSolidColor(token, colorBgContainer)` 把半透明 token 在白底上合成为实色再写进 SVG；
我们的 token 是 rgba 透明色，直接 `var()` 会得 `rgba(0,0,0,0.06)` → 视觉差异。

主题切换不影响插画本身（切 dark 时插画颜色不变，靠外层主题背景接管）—— 与 antd **完全一致**，
不是退让。`registry/tools/gen-empty-artwork.mjs` 用 `ROLE_TOKENS` 反查表作自检：新增颜色会
立刻让生成器抛错。

### 必须修的 cssinjs vs 静态 CSS 差异

`packages/ui/src/empty/style/index.ts` 原 `const cls = `.${prefixCls}`` 漏了 `-empty` 后缀，
CSS 写出来是 `.apollo { ... }` 而**根节点**的 class 是 `apollo-empty` → 选不中 → 默认左对齐。
L6 在 antd 居中 vs 我们左对齐里立刻抓到，已修。同时把 `前缀 后代` 改成 antd 的顶级选择器写法。

### theme 包缺 `./tokens.css` 导出（被仓库文档错引）

`packages/ui/src/index.ts` 与 `empty/index.{zh-CN,en-US}.md` 都写
`@apollo-design/theme/dist/tokens.css`，但 theme 包的 `exports` 只暴露 `.` —— 消费者按文档
import 直接解析失败。已在 `scaffold-packages.mjs` 的 theme 定义里补 `extraExports:
{ './tokens.css': './dist/tokens.css' }`（命名与 ui 的 `./style.css` 同构：不含 dist 前缀）。

### 必须防的 base CSS 缺失

`tokens.css` 声明了 `--apollo-font-family` 但没人把它应用到 `body` / `html` → 浏览器退回默认字体
（macOS Chrome = **Times**），所有含描述文字的组件都被判 block-diff（0.03% ~ 0.75% 散点）。
已在 `genAllStyles` 与 `genComponentStyleSheet` 头部注入 `BASE_CSS`（antd reset.css 的最小版：
box-sizing + body font-family），同时嵌进汇总 CSS 与每个组件 CSS——不然只引单个组件 CSS 也会退回 Times。
