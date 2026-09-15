# @apollo-design/position

> **层**：L1 ｜ **风险**：high ｜ **Phase 2 实施顺序**：5
>
> 本文档声明本包的**职责边界**。边界之外的事情不做 —— 如果发现需要做，说明架构需要调整，
> 应当先修改 `ARCHITECTURE.md` 并记录 ADR。

---

## 职责

浮层定位几何。替代 @rc-component/trigger 与 rc-tooltip 的定位部分。**只做几何与尺寸测量**，触发时机与生命周期在 @apollo-design/overlay。

## 替代的 Ant Design 依赖

- `@rc-component/trigger（定位部分）`
- `@rc-component/tooltip（定位部分）`

## 公开 API

全部是**纯函数**：矩形 / 区域进，坐标出。不持有状态，不接触 DOM。

| 导出 | 作用 |
|---|---|
| `alignPopup(ctx, align, flip?)` | 一次对齐的全部计算，返回 `AlignResult`（`offsetX/offsetY/arrowX/arrowY/points/flip`） |
| `getPlacements(config)` | 由 `arrowWidth / offset / borderRadius / autoAdjustOverflow / arrowPointAtCenter / visibleFirst` 生成 12 个方位的 `AlignType` |
| `PLACEMENT_POINTS` `ARROW_CENTER_PLACEMENT_POINTS` | 12 个方位的对齐点常量（与 antd `PlacementAlignMap` 一致） |
| `getArrowOffsetToken(borderRadius)` | 箭头在内缩角上的补偿量 |
| `getOverflowOptions(placement, arrowWidth, offset, autoAdjustOverflow?)` | 单个方位的 flip / shift 配置 |
| `splitPoints` `getAlignPoint` `alignPointOf` `reversePoint` `flatPoint` | 对齐点解析与翻转 |
| `getUnitOffset` `getNumberOffset` | 数字 / 百分比偏移解析 |
| `getIntersectionArea` `clipArea` `rectToArea` | 区域相交与滚动容器裁剪 |

翻转记忆（`FlipMemory`）是**显式建模的输入 + 输出**：调用方保存上一次的 `flip`
并在下次对齐时传回。这样核心函数仍然是纯的 —— antd 用 `prevFlipRef` 闭包持有它。

**尚未实现**：DOM 测量外壳 —— `getBoundingClientRect` 采集、滚动容器逐级裁剪的
DOM 侧采集、CSS `scale` 测量、`getPopupContainer` 坐标系解析。
本包已提供裁剪的纯函数部分（`clipArea`），缺的是把 DOM 量成 `Rect` / `Area` 的那层。
这部分**在本包内**，不在 `overlay` —— `overlay` 只管触发时机与显隐生命周期。

## 明确不做（边界）

- ❌ 不实现触发时机与显隐延迟（那是 @apollo-design/overlay）
- ❌ 不实现挂载与 z-index（那是 @apollo-design/portal）
- ❌ 不实现任何视觉样式与 DOM 结构（只输出坐标数字）

## 必须遵守的契约

- ★ **定位几何必须与 antd 的计算结果逐位一致**（AR1，已由 PoC 验证，见下文）。
  注意是「几何逐位一致」而非「像素级一致」—— 几何层不渲染 DOM，不产生像素；
  像素级比对属于组件层的 L6 视觉回归。
- 纯几何部分必须可用无 DOM 的单测验证（坐标进 → 坐标出）；
  但**尺寸测量部分需要 jsdom** —— 所以本包不是"完全无 DOM"，而是"测量与计算分离"
- 必须支持翻转（flip）与自适应（shift）
- 箭头位置在 12 个方位下都正确
- 与 antd 的任何差异必须先登记进 `COMPATIBILITY.md` §9.2 才可合入（当前：D13）

## 依赖

### 运行时依赖

| `@apollo-design/utils` | `workspace:*` |

> ⚠️ **当前源码尚未使用这个依赖** —— 几何层完全自包含，零 import。
> 声明保留给待实现的尺寸测量层（`getScroll` / `isVisible` / `raf` 等）。
> 若测量层最终不需要它，应当移除而非留着 —— 幽灵依赖会让 `implOrder` 与
> 真实依赖关系脱节。

### peer 依赖

| `vue` | `catalog:` |

## 依赖约束（ARCHITECTURE.md §3.1）

- **R1 单向**：只能依赖同层或更低层
- **R2 无环**：不得与其他包循环依赖
- **R3 地基纯净**（仅 L0）：不得包含任何组件视觉语义
- **R4 引擎无视觉**（仅 L2）：不得定义颜色/圆角/阴影，不得产出 CSS
- **R6 显式声明**：跨包导入必须在本文件的 `dependencies` 中声明（`.npmrc` 已设 `hoist=false`）

本包的依赖已通过 `registry/tools/scaffold-packages.mjs` 的分层校验。

## ✅ PoC 结论（AR1，2026-09-16 通过）

**结论 `pass-with-deviations`：几何内核可用于生产，AR1 的几何部分已解除。**

验证方式不是「写几个用例看看像不像」，而是把 `@rc-component/trigger@3.10.1`
的 `es/hooks/useAlign.js` 第 228–502 行**机械移植**为 `src/__tests__/oracle.js`
（保留变量名、求值顺序、可变状态，不做任何优化），再用确定性 PRNG 生成
**5000 组**用例做差分：`offsetX / offsetY / arrowX / arrowY / points / flip` 六个量**逐位一致**。

| 指标 | 结果 |
|---|---|
| 差分用例 | 5000 组，逐位一致（seed 20260916，可复现） |
| 单元测试 | 51 个全通过 |
| 覆盖率 | 语句 99.09% / 分支 96.20% / 函数 96.88%（阈值 95 / 90 / 95）|

### 一处有意偏差：D13

antd 用 `Math.max(0, w * h)` 算相交面积。当浮层**整体**位于区域外侧时两个差值同为负、
乘积为正 —— 「完全不可见」被算成巨大正面积（实测 17,600,000），翻转判定会据此接受
明显更差的位置。本包改为逐轴先夹到 0 再相乘。部分相交时两式等价。
`oracle.js` 保留 `clampIntersection` 开关（`false` = 逐字 antd，`true` = 本项目写法），
使「这是唯一差异」本身成为断言。详见 `COMPATIBILITY.md` §9.2 D13 与决策 `intersection-area-clamp`。

### 没有证明什么（风险已转移，不是消失）

| 未覆盖 | 归属 |
|---|---|
| DOM 测量外壳（rect 采集 / 滚动链 / CSS scale / `getPopupContainer` 坐标系） | **本包内**，尚未实现 |
| 与 antd 参考截图逐像素比对 | 需真实 DOM 与渲染结果 → 组件层 L6 |
| 真实滚动 / resize 序列下翻转的稳定性 | 本包 L2 交互测试（jsdom） |

因此**依赖本包的组件开发可以开始，但浮层的真实 DOM 行为仍待本包的测量层收口**。

## 测试

```bash
# 单元（含与 antd 的 5000 组差分）
npx vitest run --project unit packages/position

# 覆盖率
npx vitest run --project unit --coverage --coverage.reporter=json-summary packages/position
```

覆盖率下限：语句 95% / 分支 90% / 函数 95%。

### 关于 `src/__tests__/oracle.js`

它是 `@rc-component/trigger@3.10.1` 的**机械移植**，只服务于差分测试，
不参与生产构建、不对外导出。存在的唯一目的是回答「我们与 antd 逐位一致吗」。

**不要优化它。** 任何"顺手改进"都会让差分结果无法归因 —— 通过时你会以为一致，
实际上只是两边都改了。若 antd 升级导致行为变化，应同步更新本文件，
并让差分测试先变红。
