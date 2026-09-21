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
| — | Effect 注入方式：antd createPortal / 我们重建宿主 children（DOM 结果一致） | PLATFORM（实现形态） | L1 |
| — | reduced-motion 双保险（genNoMotionRawStyle + display:none）逐字保留 | INTENDED | theme 测试 |

## 3. 实现形态

- `BorderBeam.ts`：render 函数 —— 宿主子元素用 `createVNode` 同型重建并**向 children
  追加 Effect**（Vue 等价 antd 的 createPortal；不依赖 Teleport 目标时机，SSR 首帧
  与 antd 一致只有宿主）。
- `useBorderSize`：读宿主 computed border 4 元组（500ms 轻量轮询跟随变化）。
- 运行时 CSS 变量 `--{root}-border-beam-*` 由 props 写在 Effect style 上，规则侧
  `var(…, fallback)` 消费（fallback 逐字对齐）。

## 4. Component Token

0 个（与 antd 逐字一致）。运行时调参：`duration` / `lineWidth` / `size` props。

## 5. 已知缺口

- 子节点为组件且其根 DOM 由异步渲染（如懒加载）时，hostDom 时序与 antd 的
  supportRef 判据等价；`<teleport>` 内使用未验证。
- reduced-motion 下流光隐藏（antd 同）；L6 截图时动画本身不在比对面。
