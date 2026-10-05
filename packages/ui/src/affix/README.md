# affix

> 固钉。契约来源：antd 6.6.4 的 `es/affix/`（`index.js` 204 行 + `utils.js` 3 个纯函数 + `style/index.js`）。
> 逐条对照见 `docs/analysis/affix.md`（**先于实现**写成的）。

## 1. 职责

把一块内容**钉在视口（或某个滚动容器）的顶部/底部**，原位置留一个等高占位，避免布局跳动。
它不渲染任何业务 DOM，只做「测量 → 定位」。

**不做**：不管理滚动状态、不监听业务事件、不渲染文本内容（全库最小的组件样式：一条规则 + 一个 token）。

## 2. 文件布局

```
affix/
├── Affix.vue        # 组件（测量 → 喂判据 → 应用结果 → 绑/解事件）
├── utils.ts         # 判据与 Vue style 比较：getTargetRect / getFixedTop / getFixedBottom / hasSameFixedPosition（**导出**供单测）
├── interface.ts     # 类型面（脚手架没预生成 affix ⇒ 本文件是源头）
├── index.ts         # 导出
├── style/token.ts   # zIndexPopup = zIndexBase + 10
├── style/index.ts   # 一条规则：.apollo-affix{position:fixed;z-index:10}
├── demo/            # 5 对（basic / offset-bottom / on-change / target / update-position）
└── __tests__/{utils.test.ts,type.test-d.ts,a11y.test.ts}
```

## 3. 公共 API

见 `index.zh-CN.md`。要点：`offsetTop` / `offsetBottom` / `target` / `@change` / `ref.updatePosition`。

根节点的 `class` / `style` 是 Vue 原生 attrs，由 `inheritAttrs: false` 后的显式 fallthrough 合并到外层占位测量节点；它们不属于 `AffixProps`。`AffixConfig.className` / `style` 则是 ConfigProvider 配置对象字段，形状不同、用途不同，仍保留。

## 4. 五条最容易写错的判据（都已被测试钉住）

### 4.1 `Math.round` 只参与**比较**，不参与**结果**

`getFixedTop` 先 `Math.round(targetRect.top) > Math.round(placeholderRect.top) - offsetTop` 判断，
满足后返回 `offsetTop + targetRect.top`（**原始值**）。单测钉了 `0.4` 的 case：结果是 `64.4` 不是 `64`。

### 4.2 `getFixedBottom` 用的是 `window.innerHeight`，不是 target 高度

`targetBottomOffset = window.innerHeight - targetRect.bottom` 是「target 底边到**视口**底边的距离」。
target 就是 window 时恒为 0（结果就是 `offsetBottom`）；target 是滚动容器时需要这个补偿。
⚠️ jsdom 的 `innerHeight` 默认 **768** 不是 800 —— 不 mock 结果整体偏移（单测第一版踩过）。

### 4.3 `offsetTop` / `offsetBottom` **互斥**（`index.js:38`）

`internalOffsetTop = 两者都未传 ? 0 : offsetTop`。但 `getFixedTop` 第一行要求
`offsetTop !== undefined` ⇒ **两者都传时只有 `offsetTop` 生效**。

### 4.4 类名**只在固钉时出现**（`index.js:181-183`）

`mergedCls = clsx({ [rootCls]: affixStyle })` —— 未固钉时内层**没有** `apollo-affix` 类名。
且占位层也只在固钉时渲染（带 `aria-hidden="true"`）。

### 4.5 占位零矩形直接跳过（`index.js:48-50`）

`top/left/width/height` 全为 0 ⇒ 视为「还没量到」，放弃本次测量（隐藏元素会命中）。

### 4.6 固钉位置的快速比较要遵循 Vue 的 style 值

Affix 把测量结果转换成 `"64px"` 写入 Vue 的 inline style；位置未变时的快路径必须将它与 `"64px"`（或数值）比较，不能拿 `"64px"` 直接和 `64` 比。调试探针不得留在组件测量/几何函数的生产路径中。

## 5. 样式

```css
.apollo-affix { position: fixed; z-index: 10; }
```

- ⚠️ **没有 `resetComponent`**：antd 的 Affix 样式不调用它 ⇒ 我们也不加（加了反而 block-diff）。
- `zIndexPopup = zIndexBase + 10`。`zIndexBase` 虽是 AliasToken（`seed.ts:95`，值 0），
  但 `tokens.css` **没有** `--apollo-z-index-*` 变量 ⇒ 按 divider 的既定模式
  在 `token.ts` 里算出定值、CSS 内联（真源在 token.ts，B7 可过）。
- ⚠️ 已知缺口：没有「Component Token → CSS 变量」管线，用户无法覆盖 `zIndexPopup`。

## 6. 测试

| 层 | 状态 | 覆盖 |
|---|---|---|
| L1 判据 | ✅ 18 例 | 3 个几何判据 + Vue 像素字符串位置比较 + 无诊断日志 |
| L3 types | ✅ 14 例 | Props 可选性 / target 工厂 / Ref 形状 / AffixRect 可选字段 |
| L5 a11y | ✅ 11 例 | 不凭空加 ARIA / 未固钉不渲染占位层 / 无 tabindex |
| L4 dom-contract | ⬜ 待补 | |
| L6 visual | ⬜ 待补 | **只覆盖未固钉的静态形态**（见 §7） |
| L2 interaction | n/a | 组件自身无交互元素 |

## 7. 有意差异 / 已知缺口

### 7.1 ⚠️ jsdom / 静态渲染测不了的（**如实登记，不编造**）

1. **真实滚动**：jsdom 不触发真实滚动、没有布局 ⇒ 「滚动后固钉」测不到。
   ⇒ 定位判据用假 rect 直接喂纯函数单测（L1）。
2. **`ResizeObserver`**：jsdom 无原生实现 ⇒ 「子内容尺寸变化触发重测」测不到。
3. **固钉态（`position:fixed`）**：静态渲染下不成立 ⇒ L6 只覆盖未固钉形态。
4. **`window.innerHeight`**：jsdom 默认 768 ⇒ `getFixedBottom` 单测必须 mock。

### 7.2 上游缺口（我们**没有**修）

- **固钉状态变化对读屏器不可见**：没有 `aria-live` / `role="status"` / `aria-busy`。
  antd 亦然 ⇒ 逐字对齐，不擅自补。
- 整个组件只有占位层一处 ARIA（`aria-hidden="true"`）。

### 7.3 与 React 的平台差异（分类）

| # | 差异 | 分类 |
|---|---|---|
| 1 | 无 CSS-in-JS 的 hashId / cssVarCls | PLATFORM（D5） |
| 2 | `children` 是默认插槽（C19）；`onChange` 是 `emit('change')`（C19） | INTENDED |
| 3 | `onTestUpdatePosition`（`NODE_ENV==='test'` 的测试钩子）不移植 | INTENDED |
| 4 | `rc-resize-observer` → `utils` 的 `useResizeObserver`（单例 observer） | PLATFORM |
| 5 | `throttleByAnimationFrame` → `utils` 的同名实现 | PLATFORM |

### 7.4 其它缺口

- `onTestUpdatePosition` 的等价物未提供（Vue 侧调试用 `ref.updatePosition()`）。
- `AffixTarget` 的返回类型比 ConfigProvider 的 `getTargetContainer` 窄
  （后者还允许 `ShadowRoot`）—— `Affix.vue` 的 `targetFunc` 已收窄并注释原因。

## 8. 给后续组件的话

1. ⚠️ **`Math.round` 只比较不进结果** —— 这类「比较用 round、结果用原始值」的细节，
   单测必须同时钉两条。
2. ⚠️ **依赖 `window.innerHeight` 的判据必须 mock**（jsdom 是 768）。
3. ⚠️ **回调 prop 不要留在 Props 类型里**（C19）：`onChange` 留着没人读，
   会造成「Props 传回调」与「模板绑事件」两条通道并存的假象。
4. ⚠️ **新 worktree 开工先构建 foundation 包**（本 worktree 的 13 个都没构建过，
   ui 构建报 `ERR_PACKAGE_PATH_NOT_EXPORTED` 的根因不是路径，是产物缺失）。
