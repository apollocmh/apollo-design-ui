> 规范范围：本文件保留实现说明与历史对照证据；上游同构、旧阶段与历史 Gate 要求不再生效。现行规则见 [项目规范](../../../../AGENTS.md)，公共行为以 Apollo 组件 API 文档与测试契约为准。

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
| D7 | 原生 load/error 捕获触发量测，fresh=false 也能响应图片尺寸变化 | INTENDED | ADR0007；当前回归见 2026-10-24 native media 报告 |
| D8 | 初始 items 同步渲染，SSR 使用正常网格流；挂载后实测并切换最短列定位，不复制 React effect 空首屏 | INTENDED | ADR0007；SSR 专项回归 |
| D9 | `columnCount === 0`（`columns={0}`）时上游会写出 `top: undefined` / `NaN` 传播；本仓收敛成 `0` | INTENDED | `positions.ts` 文件头（未定义行为不复制） |
| D10 | 纵向间距非数字时上游退化成字符串拼接（`totalHeight` 变 `NaN`）；本仓收敛成「能转成有限数就用，否则 0」 | INTENDED | `Masonry.vue` 的 `verticalGutterPx` |
| D11 | 测量前使用自然高度，空列表高度 0；测量后使用实测容器高度，不按 React 序列化格式限制 Vue | INTENDED | SSR/尺寸回归 |
| D12 | 内部 prop `onResize` 用 `undefined` 而不是上游的 `null` | PLATFORM | 内部 prop，不可观测 |
| D13 | `items` **更新契约**：上游 `useEffect([items])` 是**引用比较** ⇒ 原地 `push`/`splice`/`swap`/改 `column` **完全不更新**。本仓用「依赖探针（逐条读 `length`/`key`/`column`）+ 赋值浅拷贝」把响应式数组（`ref`/`reactive` 持有）的**原地变更也变成完整更新路径**（量测 + 重排 + `onLayoutChange` 三条通道同步）。⚠️ 修复前本仓是「**DOM 更新了、布局没更新**」的半更新态（比上游更糟：新 item 无位置 ⇒ 堆在左上角，且 `collectLayout` 要求全部有位置 ⇒ 回调停在旧载荷）。保留边界：① **普通（非响应式）数组**没有数据源 ⇒ 物理上不可追踪（请给新数组）；② 组件更新重测量；持续过渡/独立后代尺寸变化使用 fresh 的逐项 ResizeObserver | INTENDED | L1 `s52-issue52`（Issue #52） |

## 3. `.vue` / `.ts` 选择

- **`Masonry.vue`**：SFC（默认且首选）。
- **`components/MasonryItem.ts`**：`.ts` + 渲染函数 —— 依据 `COMPONENT-RULES.md` §2 的
  **条件 1（纯渲染函数型内部件）**。理由：
  它的全部工作是把**三个来源**的 class / style 按**固定顺序**合成
  （`{...motionStyle, ...mergedStyles.item, ...itemStyle}` /
  `[itemCls, mergedClassNames.item, motionClassName]`），再渲染一个由外部传入的
  `content` vnode（内容由父组件按 `当前 #item 或 item.children 回退` 生成 —— 泛型在那边）。
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

2026-10-24：根原生attrs/当前class和style、非冒泡图片事件测量已修复，见 [专项报告](../../../../docs/audit/2026-10-24-masonry-native-media-remediation.md)。itemRender模板迁移与首帧/SSR事项另行推进，未宣称整组件重新验收。

2026-10-24：直接迁移为泛型原生 #item，修复同 key 数据替换、当前语义样式与插槽更新测量；见 [迁移说明](../../../../docs/migrations/masonry-slots.md) 与 [专项报告](../../../../docs/audit/2026-10-24-masonry-slots-remediation.md)。首帧/SSR仍继续整改，保留历史验收记录。

2026-10-24：SSR直接输出当前内容、测量前正常网格流、水合节点与输入值保留已修复，见 [SSR专项报告](../../../../docs/audit/2026-10-24-masonry-ssr-remediation.md)。以上先前阶段的待办由本条更新；Apollo视觉基线仍缺失。
