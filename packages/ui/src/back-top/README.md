# BackTop 实现说明

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
