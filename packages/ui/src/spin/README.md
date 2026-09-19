# Spin（`packages/ui/src/spin/`）

## 1. 这个组件是什么

页面 / 区块的加载中状态。antd 6.6.4 的同名组件作为**兼容性规格**重写为 Vue 3 + TS 实现。

落地形式：

- **模板**：`Spin.vue`（主组件） + `components/{Indicator,Looper,Progress,NodeRenderer}.ts`（内部子组件） + `usePercent.ts`（auto 推进 hook） + `defaultIndicator.ts`（模块级单例）。
- **样式**：`style/index.ts` 的 `genSpinStyle(prefixCls)` 纯函数，按 `apollo` / `ant` 两个前缀各产一份。
- **类型**：`interface.ts` 是面向调用方的 API 面；`style/token.ts` 的 `ComponentToken` 是面向主题的 token 面。
- **文档**：`./README.md`（你在这里）+ `./index.en-US.md` + `./index.zh-CN.md`（antd-style 索引页）。

## 2. 11 个维度的落点（详见 `registry/components.json`）

| 维度 | 落点 |
|---|---|
| `antdApi` | `interface.ts` 与 antd `es/spin/index.d.ts` 逐字段对齐，差异登记在 §6 |
| `compat` | `tests/compat/baseline/spin.mjs` + `tests/compat/baselines/spin.dom.json`（47 条机械基线） |
| `token` | `style/token.ts` 的 4 个 Component Token，与 antd `prepareComponentToken` 逐字相同 |
| `style` | `style/index.ts`，选择器结构取自 antd 6.6.4 `extractStyle` 的真实产物 |
| `unit` | `__tests__/index.test.ts`（57 条）覆盖结构 / 指示器 / 语义化 / 废弃 API |
| `interaction` | `__tests__/index.test.ts` 的 `L2 · 交互` 一节——**本仓库首个有 L2 的组件**（见 §4） |
| `type` | `__tests__/type.test-d.ts`（正例 + 12 条 `@ts-expect-error` 负例） |
| `a11y` | `__tests__/a11y.test.ts`（19 条，含 live region 与 progressbar 双语义） |
| `theme` | `__tests__/theme.test.ts`（4 态渲染 + Component Token 逐字段断言） |
| `visual` | `tests/visual/render/cases/{react/spin.jsx,vue/spin.js}` 8 variant × 3 viewport = 24 张 |
| `docs` | 本文件 + `index.en-US.md` + `index.zh-CN.md` + 9 个 `demo/*.{vue,md}` |

## 3. 实现要点（与 antd 的逐字对齐契约）

逐字对齐 antd 6.6.4 的 `components/spin/index.tsx` + `Indicator/{index,Looper,Progress}.tsx` + `usePercent.ts`。具体：

- `Looper` 4 个 `<i>` 点、`-holder` 容器结构、`-spin` 旋转、`-progress` 进度环占位 —— 全部与 antd 同源 `Looper.tsx` 一致。
- `Progress`「首帧不渲染」通过 `watchEffect(..., { flush: 'post' })` 实现，与 React 的 `useLayoutEffect` 在用户视角等价（mount 后同步重渲）。`flush: 'post'` 的选择是**必须的**而不是随手挑的 —— 默认 `pre` flush 会在 setup 期同步执行，让 SSR / 首帧提前出现 `<svg>`，与 React SSR 不一致（L4 的 `percent:*` 用例会假绿）。
- `usePercent` 三条契约（auto 推进 / 钳制在 Progress / 停止只清定时器不重置）逐字复刻。
- 废弃告警：`size="default"` / `tip` / `wrapperClassName` / `classNames.tip` / `styles.tip` / `classNames.mask` / `styles.mask` —— 全部走 `useDevWarning('Spin').deprecated(...)`，**且同时看 props 与合并后的语义化值**（配置来自 ConfigProvider 的 `classNames.tip` 也要告警）。
- `Indicator` 的「克隆时注入 `class` / `style` / `percent`」—— 这三个声明成 prop 而不是依赖 `$attrs` 继承，因为 Fragment 根会断掉继承。
- `setDefaultIndicator` 用模块级单例（`defaultIndicator.ts`），因为 `<script setup>` 每实例执行一遍，写在里面就变成实例级变量 —— 见该文件头的 PITFALLS。

## 4. L2 交互（**本仓库首个真实 L2**）

`divider` / `empty` 的 `interactionStatus` 一直是 `n/a`，意味着**组件侧的 L2 交互层从来没有被验证过**。Spin 是第一个有真实交互语义的：

- `spinning` 是受控的 prop，但**有内部延迟态**——「prop 变了 DOM 同步变」在这里不成立。
- `delay` 有三条独立语义（开要等 / 关不等 / 重新计时），加上卸载要 cancel —— 由 `__tests__/index.test.ts` 的 `L2 · 交互 · delay` 一节逐条钉住。
- `percent="auto"` 是时间驱动的状态机，渐近逼近 100 —— 用 `vi.useFakeTimers()` + `advance(ms)` 推进。
- `setDefaultIndicator` 是非响应式模块单例 —— 「已挂载实例不会变，新挂载才生效」这条契约也是 L2。

详见 `__tests__/index.test.ts` 文件头的「为什么这个文件必须有 L2」一段。

## 5. 与 antd 的有意差异（D 编号见 `COMPATIBILITY.md`）

| # | 差异 | 原因 |
|---|---|---|
| D6 | prefixCls 测试时 7 处类名差异（`prefix-cls:no-props` ALLOW 条目） | 我们没有 CSS-in-JS hash 包裹层（`.css-dev-only-do-not-override-*` / `.css-var-root` 等） |
| D19 | `children` 不在 `SpinProps` 里 | 规则 C19：Vue 侧是默认插槽 |
| D22 | 组件型 indicator 收到 `class: [apollo-dot, 自己的 className]`（React 不会） | Vue 的 `class` 是组件根继承属性，React 的 `className` 是 plain prop — 仅组件型 indicator 受影响，原生元素行为一致 |
| — | `contentHeight` token 声明但**不产 CSS** | antd 6.6.4 自身如此（`--ant-spin-content-height` 被声明但从未 `var()` 消费），由 `@ant-design/cssinjs` 的 `extractStyle` 实测确认 |

## 6. 类型面的四处登记差异（详见 `interface.ts` 文件头）

1. `children` 不在 Props（默认插槽，C19）
2. `size` 类型名 `SpinSize`（antd `SizeType`，避免与 config-provider 重名）
3. `React.ReactNode` → `VNodeChild`、`React.CSSProperties` → Vue `CSSProperties`
4. `SpinIndicator` 从 `React.ReactElement<HTMLElement>` 改成 `VNode`

## 7. 未覆盖 / 待跟进（缺口登记）

| 缺口 | 依赖 | 何时解锁 |
|---|---|---|
| `size` 不读 ConfigProvider 的 `componentSize` | `config-provider/hooks/useSize` 叶子模块未落地 | 该叶子模块落地时补 |
| 三个 dot 尺寸不能通过 `theme.components.Spin` 覆盖 | `tokens.css` 只声明 Alias 层 | theme 把 `prepareComponentToken(getDesignToken())` 也落成 CSS 变量时 |
| `aria-live="polite"` 在嵌套用法下会播报 children 更新 | antd 行为，逐字保留 | 不复刻；用户可用 `aria-live="off"` 逃生（已在 L5 钉住） |
| 装饰性四点未挂 `aria-hidden` | antd 6.6.4 也未挂，逐字保留 | 不复刻；与 `style-class` 那条「复用 antd 选择器」同源 |
| `NodeRenderer` 在 `spin/components/` 里有**本地副本** | 架构规则禁止组件互相 import `empty/components/` | `empty/components/NodeRenderer.ts` 迁到 `_internal/` 后合并 |