# Masonry 实现说明

> 规则 R1：本文件必须记录（G11 前补齐）。

## 1. 对应 antd 组件

- antd 6.6.4 · `es/masonry/`（只读参照，H2）
- 契约全文：`docs/analysis/masonry.md`（G1 产物）；Gate 清单：`PLAN.md`
- **依赖面：无 foundation 缺口**（14 处外部依赖全部可复用，对照表见分析文档 §0）

## 2. 与 antd 的行为差异清单

<!-- 同步到 COMPATIBILITY.md §9；分类只能是 BUG / INTENDED / PLATFORM / UPSTREAM（AGENTS.md §4.3） -->

| # | 差异 | 分类 | 依据 |
|---|---|---|---|
| D1 | 默认前缀 `apollo-masonry`（antd `ant-masonry`） | INTENDED | 裁决 `prefix-cls-default` = A |
| D2 | 无 cssinjs 的 hash 类（`css-dev-only-do-not-override-*`） | INTENDED | 零运行时架构（D5 家族） |
| D3 | `genCssVar(root,'masonry')` 无对应物 ⇒ 手写 `--{rootPrefixCls}-masonry-item-width` | PLATFORM | `splitter` 先例 |
| D4 | `useCSSVarCls` 无对应 hook ⇒ 根类名直接拼 `${prefixCls}-css-var` | PLATFORM | `rate` 先例 |
| D5 | `CSSMotionList` 的 render-prop ⇒ `MotionList` 的默认插槽（载荷多一个 `itemKey`/`index`） | PLATFORM | `motion-list.ts` 的文件头 |
| D6 | `useLayoutEffect` ⇒ `onMounted` + `watch(flush:'post')` | PLATFORM | PITFALLS 211 |
| D7 | 根 div 的 `onLoad` / `onError` 是**死监听**（上游同样无效）—— 本仓**照抄同样的绑定** | **UPSTREAM** | 分析文档 §6.1（React 的 `load` 是非委托事件 + 冒泡阶段） |
| D8 | `mergedItems` 的「一拍延迟」用 `onMounted` + `watch(flush:'post')` 精确复刻 | PLATFORM | 分析文档 §6.2 |
| D9 | `columnCount === 0`（`columns={0}`）时上游会写出 `top: undefined` / `NaN` 传播；本仓收敛成 `0` | INTENDED | `positions.ts` 文件头（未定义行为不复制） |
| D10 | 纵向间距非数字时上游退化成字符串拼接（`totalHeight` 变 `NaN`）；本仓收敛成「能转成有限数就用，否则 0」 | INTENDED | `Masonry.vue` 的 `verticalGutterPx` |
| D11 | 根高为 0 时输出 `height:0`（**与 React 的 `dangerousStyleValue` 一致**，不补 `px`） | 一致 | `Masonry.vue` 的 `rootHeight` |
| D12 | 内部 prop `onResize` 用 `undefined` 而不是上游的 `null` | PLATFORM | 内部 prop，不可观测 |

## 3. `.vue` / `.ts` 选择

- **`Masonry.vue`**：SFC（默认且首选）。
- **`components/MasonryItem.ts`**：`.ts` + 渲染函数 —— 依据 `COMPONENT-RULES.md` §2 的
  **条件 1（纯渲染函数型内部件）**。理由：
  它的全部工作是把**三个来源**的 class / style 按**固定顺序**合成
  （`{...motionStyle, ...mergedStyles.item, ...itemStyle}` /
  `[itemCls, mergedClassNames.item, motionClassName]`），再渲染一个由外部传入的
  `content` vnode（内容由父组件按 `item.children ?? itemRender(...)` 生成 —— 泛型在那边）。
  模板表达不了「三源定序合并 + 按 key 查表」，而 `v-bind` 一个无类型对象会丢掉绑定检查。
  上游 `MasonryItem.tsx` 也是同一形态。

## 4. Component Token 清单

**本组件没有 Component Token**（registry 数据：token 数 = 0）。

上游 `es/masonry/style/index.js` 的 `ComponentToken` 是**空接口**，且 `genStyleHooks`
没传 `prepareComponentToken`（走默认的空实现）。`genMasonryStyle` 只消费全局 alias：
`motionDurationSlow` / `motionDurationFast` / `motionEaseOut`。

⚠️ 与 Flex 的差别：Flex 至少还有三个 `mergeToken` 派生值（`flexGapSM` / `flexGap` / `flexGapLG`），
**Masonry 连派生值都没有**。

## 5. 已知缺口

1. **demo 用原生元素替换了未落地的组件**：antd 的 masonry demo 用
   `Card` / `Flex` / `Divider` / `Typography` / `antd-style` 的 `createStaticStyles`。
   本仓 `Card` 尚未落地、也没有 `antd-style` ⇒ 用**原生 div + 等价内联样式**替换
   （`basic` / `dynamic` / `responsive` / `fresh` / `style-class` 都有注释标明）。
   替换后「不产生告警」仍是硬约束（`demo.test.ts` 钉住）。
2. **demo 的随机值改成确定值**：antd 的 `dynamic` / `fresh` demo 用 `Math.random()`
   取高度 —— 那会让每次渲染不同、demo 冒烟测试不可复现。本仓改用确定值并在 `.md` 里注明。
3. **`item.height` 从不被读**（上游也如此）：高度一律**实测**
   （`getBoundingClientRect`）。类型上保留该字段只为对齐上游的对外面。
