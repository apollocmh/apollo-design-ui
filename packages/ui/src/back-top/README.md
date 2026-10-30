> 规范范围：本文件保留实现说明与历史对照证据；上游同构、旧阶段与历史 Gate 要求不再生效。现行规则见 [项目规范](../../../../AGENTS.md)，公共行为以 Apollo 组件 API 文档与测试契约为准。

# BackTop 实现说明

## 当前 Vue 契约（2026-10-30）

- 根为原生 `button`，通过 `click` emit 发送原始 `MouseEvent`；完整默认槽渲染到稳定宿主，空槽隐藏、缺省使用装饰图标。实例 `nativeElement` 为真实按钮。
- `target` getter 跟踪响应式/模板 ref（允许 `null`），当前容器监听与点击回顶使用同一容器；换容器、重复点击、卸载取消旧动画，卸载同时取消滚动节流帧。
- 根 attrs、当前 Provider 样式/方向及 `BackTop.zIndexPopup` 由本组件消费；用户根 style 优先。尊重系统减少动态效果和主题 motion 配置。
- 保留 Issue #55 同步阈值校准、滚动 rAF 节流和已有 SSR 动效修正。`FloatButton.BackTop` 独立实现，双方仅共享未改动的滚动工具与 CSSMotion。
- API 与开发期 DOM 迁移见 [中文文档](./index.zh-CN.md)。本轮定向验证不代表最终九维验收。

以下段落保留此前实现、上游对照和验收证据的原义；当前内容/按钮/事件契约以上述 Vue API 为准。

## 1. 对应 antd 组件

- antd 6.6.4 · `es/back-top/`（只读参照，H2）
- 分析产物：`docs/analysis/back-top.md`（G1，先于实现存在）
- ⚠️ **整个组件在 antd 6.x 已 `@deprecated`**（→ FloatButton.BackTop）——契约仍逐字实现，
  deprecated 告警照发（antd 逐字：`BackTop → FloatButton.BackTop`）。

## 2. 与 antd 的行为差异清单

| # | 差异 | 分类 | 证据 |
|---|---|---|---|
| D6 | 前缀 `apollo-back-top`（基线侧经 ConfigProvider iconPrefixCls 对齐图标类） | INTENDED | L4 |
| D5 | 无 hash/css-var 包裹类 | INTENDED | L4 |
| — | **fade 无 CSS**：antd 产物同样没有 `-fade` keyframes（initFadeMotion 只有 tooltip 等局部用）——motion 类挂 DOM 但无动画 | 平台一致 | L4 + theme 断言 |
| — | deprecated 告警：antd 每次 render 检查；我们 setup 期发一次（dev 层去重） | PLATFORM | — |
| — | `@media` 断点用**字面量** 768/480px（media feature 里 `var()` 非法，浏览器整条忽略——L6 实测） | PLATFORM（token 边界） | style/index.ts |
| D133 | `visibilityHeight` 的**生效时点**是「下一次 scroll」（`useEffect` 依赖只有 `[target]`，改阈值不重算；且监听器闭包来自挂载那一帧，阈值实际被冻住） | 改阈值**无需滚动事件**立即重算（补 `watch(visibilityHeight)`）；且始终**现读** `props.visibilityHeight` | INTENDED（**优于上游**：动态 props 应符合开发者预期） | COMPATIBILITY.md §9 `D133`；L1 `s55-issue55`（Issue #55） |
| — | 初始校准走 `handleScroll`（`throttleByAnimationFrame` ⇒ 第一次调用排到**下一帧**）⇒ 已滚过阈值的页面先渲染「不可见」再翻转（**闪烁**） | 校准分两条路径：滚动事件走**节流**的 `handleScroll`；初始挂载 / 换 target / 改阈值走**同步**的 `syncVisible` ⇒ 首帧即正确 | INTENDED（**优于上游**） | Issue #55；`s55-issue55` 的 `[D]`（挂载即已滚过阈值 ⇒ 只等 nextTick 就可见，不等 rAF） |

## 3. .vue / .tsx 选择

- `BackTop.ts`：render 函数 —— children 要 `cloneVNode` 注入 motionClassName
  （badge/ScrollNumber、border-beam 同范式）。
- `_internal/scroll-to.ts`：`easeInOutCubic` + `scrollTo`（antd `_util` 逐字；
  FloatButton.BackTop / ScrollList 将来复用）。`throttleByAnimationFrame` /
  `getScroll` / `raf` / `isWindow` 已在 utils，不重复定义。

## 4. Component Token

1 个：`zIndexPopup = zIndexBase + 10`（CSS 变量 `calc(var(--apollo-z-index-base) + 10)` 表达）。

## 5. 关键判据（G1 §2 的落地）

1. 初始 `visible = visibilityHeight === 0`（不是 false）。
2. `handleScroll` 是 raf 节流；卸载 `cancel()` + removeEventListener；target 变化重绑。
3. 点击：`scrollTo(0)` → `onClick`（antd 顺序）。
4. `resetComponent` 是**完整 reset**（margin/padding/color/line-height/list-style）——
   L6 实测缺 line-height 就差出按钮行高（16.1 vs 22）。

## 6. 已知缺口

- 响应式断点不随主题 token 缩放（media feature 不能用 CSS 变量，字面量钉
  screenMD/screenXS 默认值 768/480 —— 与 badge 派生常量同一条已知边界）。
- L4 基线不含 `visibilityHeight > 0` 的形态（SSR 空根 div，两侧平台一致；
  L2 时序断言覆盖）。
