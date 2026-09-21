# Flex 实现说明

## 1. 对应 antd 组件

- antd 6.6.4 · `es/flex/`（只读参照，H2）
- 分析产物：`docs/analysis/flex.md`（G1，先于实现存在）

## 2. 与 antd 的行为差异清单

（同步到 `COMPATIBILITY.md` §9；分类依据 AGENTS.md §4.3）

| # | 差异 | 分类 | 证据 |
|---|---|---|---|
| D6 | 默认前缀 `apollo-flex` vs antd 的 `ant-flex` | INTENDED（裁决 `prefix-cls-default` = A） | L4 `prefix-cls:no-props` |
| D5 | 无 CSS-in-JS hash 包裹类名 | INTENDED（零运行时管线的必然结果） | L4 全部用例 |
| — | `flex` / `gap` 数值的序列化差异（SSR 字符串 vs 真实 DOM CSSOM：`flex:1` → `flex: 1 1 0%`、`gap:0` → `gap: 0px`） | PLATFORM（CSSOM 规范化，语义等价；L4 allow 登记） | L4 `flex:number` / `gap:zero` |

无 BUG 类差异。

## 3. .vue / .tsx 选择

- 使用 **`.vue` SFC**。Flex 是简单布局容器，模板表达能力足够（COMPONENT-RULES.md §2）。
- 语义类名生成独立为 `utils.ts`（纯函数，对齐 antd 的 `es/flex/utils.js`，可被 L1 直接测试）。

## 4. Component Token 清单

- **0 个**（与 antd 逐字一致：`prepareComponentToken = () => ({})`）。
- gap 三档来自别名 token 派生（antd `flexToken`：`flexGapSM=paddingXS`、`flexGap=padding`、
  `flexGapLG=paddingLG`），以 `var(--apollo-padding-*)` 消费，B7 校验变量存在。

## 5. 共享层影响

- `useOrientation` 的第三个消费者 → 按 `space/useOrientation.ts` 的预定计划提升到
  `_internal/use-orientation.ts`（三次法则）；space 侧留 re-export 垫片，divider 的
  内联实现留待其自己的维护流处理。
- 复用 `space/gapSize.ts` 的 `isPresetSize`（antd 侧两者同源 `_util/gapSize.js`）。

## 6. 类型面的登记偏离

- `gap` 刻意不用 `LiteralUnion`：`(string & {})` 交叉类型会让 SFC 编译器把运行时
  prop 推成 `String | Object`，挂 Number 触发开发期告警。拍平为 `SizeType | string | number`。

## 7. 已知缺口

- antd 的 demo 依赖 `Radio.Group` / `Segmented` / `Card` / `Typography` / `Slider`，
  这些组件尚未落地。我们的 demo 用原生元素等价替换（保留被演示的 Flex 行为）；
  等对应组件落地后可回补 antd 同款交互控件。
- `direction` 的响应式边界：与 divider 同一取舍（快照读取，D27）；
  Flex 的 rtl 场景极少在运行中切换方向，登记不修。
