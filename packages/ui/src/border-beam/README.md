> 规范范围：本文件保留实现说明与历史对照证据；上游同构、旧阶段与历史 Gate 要求不再生效。现行规则见 [项目规范](../../../../AGENTS.md)，公共行为以 Apollo 组件 API 文档与测试契约为准。

# BorderBeam 实现说明

## 1. 对应 antd 组件

- antd 6.6.4 · `es/border-beam/`（只读参照，H2）
- 分析产物：`docs/analysis/border-beam.md`（G1，先于实现存在）

## 2. 与 antd 的行为差异清单

| # | 差异 | 分类 | 证据 |
|---|---|---|---|
| D6 | 前缀 `apollo-border-beam` 与 CSS 变量 `--apollo-border-beam-*` | INTENDED | L4 |
| D5 | 无 hash 包裹；keyframes 名前缀派生 | INTENDED | L4 |
| — | `#ddd` → CSSOM 序列化 `rgb(221,221,221)` | PLATFORM | L4 allow ×3 |
| — | Effect 注入：`createPortal(effect, hostDom)` ⇄ 本仓 `<Teleport :to="hostDom">`；根同为 `Fragment(childNode + N×Effect)`；`isHTMLElement` 不可用 ⇒ `null` 的判据逐字 | **逐字等价**（Issue #56 后） | L1 `s56-issue56` + 上游 `BorderBeam.js` / `BorderBeamEffect.js` |
| — | reduced-motion 双保险（genNoMotionRawStyle + display:none）逐字保留 | INTENDED | theme 测试 |
| — | `useBorderSize` **轮询**宿主 `border-width`（上游只在 `domNode` 变化时读一次）—— 宿主 border 变化不触发 ResizeObserver / 无对应事件，本仓选择跟随运行时变化；改由**模块级共享定时器**调度且隐藏页整轮跳过（Issue #50） | INTENDED | L1 `s50-issue50` |
| — | 宿主 vnode 仍用 `createVNode` 同型重建（上游 `cloneElement`），但**只**用于透传 attrs 与注入 ref —— **children 原样回填、绝不注入 Effect**（Issue #56） | 逐字等价 | L1 `s56-issue56` |
| — | 根是 Fragment ⇒ 多根组件：`vm.$el` 是片段锚点（文本节点），宿主 DOM 要用 `ref` 或查询拿（React 侧 `<BorderBeam ref>` 同样拿不到 DOM） | PLATFORM（与上游同形态） | 上游 `BorderBeam.js` 返回 `React.Fragment` |

## 3. 实现形态

- `BorderBeam.ts`：render 函数 —— 宿主子元素用 `createVNode` 同型重建（**只**为透传
  attrs 与注入 ref，children 原样回填），Effect 交给 `<Teleport :to="hostDom">`
  （Vue 等价 antd 的 `createPortal(effect, hostDom)`，见 `BorderBeamEffect.js`）。
  ⚠️ 由此根为 Fragment、组件是**多根**的 —— 与上游 `React.Fragment(childNode, effects)`
  同形态；`hostDom` 非 `HTMLElement`（纯文本 / 多根组件）时 `resolveHostDom` 回落
  `null` ⇒ 不渲染 Effect（上游 `isHTMLElement` 判据）。
  ⚠️ 首帧（含 SSR）hostDom 未挂载 → 不渲染 Teleport（与 antd portal 时机一致）。
- `useBorderSize`：读宿主 computed border 4 元组。**共享调度**：多实例共用一个
  500ms 定时器（`border-sampler.ts`，0 实例即停表），`document.hidden` 时整轮跳过、
  回到可见补一次（Issue #50）。
- 运行时 CSS 变量 `--{root}-border-beam-*` 由 props 写在 Effect style 上，规则侧
  `var(…, fallback)` 消费（fallback 逐字对齐）。

## 4. Component Token

0 个（与 antd 逐字一致）。运行时调参：`duration` / `lineWidth` / `size` props。

## 5. 已知缺口

- 子节点为组件且其根 DOM 由异步渲染（如懒加载）时，hostDom 时序与 antd 的
  supportRef 判据等价；`<teleport>` 内使用未验证。
- 宿主是**多根组件**（Fragment 根）时 `$el` 是锚点文本节点 ⇒ 拿不到单一宿主 ⇒ 不画
  流光（上游 `isHTMLElement` 同判）。需要的话由调用方包一层单根元素。
- reduced-motion 下流光隐藏（antd 同）；L6 截图时动画本身不在比对面。
