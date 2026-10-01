# Masonry · 开发计划（G0–G14）

> 由 gen-component.mjs 生成。每次开工先过一遍「开工避坑清单」，Gate 完成一个勾一个。

## 状态

- registry status: **analyzing** · priority P5 · complexity M
- 依赖组件: 无
- foundation: @apollo-design/motion, @apollo-design/theme, @apollo-design/utils
- antd 规模: 349 行 / 14 文件 · token 0

## Gate 检查单

- [x] G0 CLAIM —— 已由 `next-task.mjs --component masonry` 授权开工；骨架由 `gen-component.mjs` 生成
- [x] G1 ANALYZE —— **`docs/analysis/masonry.md`**（先于实现）。
      核心结论：**无 foundation 缺口，全部可复用**（依赖面逐条列在 §0）；
      两处已实测的硬结论：① 上游根 div 的 `onLoad`/`onError` 是**死监听**（§6.1）；
      ② `mergedItems` 的**一拍延迟**必须复刻（§6.2）
- [x] G2 API DESIGN —— `interface.ts` 全量枚举 props / emits / expose。
      ⚠️ **没有 `v-model`**（上游无 value/onChange）· **没有默认插槽**（上游不读 children）·
      4 处平台映射（`React.Key`→`string|number` / `ReactNode`→`VNodeChild` /
      `CSSProperties`→`Record<string,string|number>` / 泛型 `any`→`unknown`）
- [x] G3 TOKEN —— `style/token.ts`：**该组件无 Component Token**（上游 `ComponentToken` 是空接口）。
      比 Flex 还干净 —— 连 `mergeToken` 派生值都没有，只消费全局 alias
      （`motionDurationSlow` / `motionDurationFast` / `motionEaseOut`）
- [x] G4 IMPLEMENT —— `Masonry.vue` + `components/MasonryItem.ts` + `hooks/{use-delay,positions,column-count}.ts`
      + `style/index.ts`；已注册进 `COMPONENT_STYLES` 与 `packages/ui/src/index.ts`。
      三处**实现期才暴露**的判据（都写在代码注释里）：
      ① 🚨 **不要加 `onMounted(collectItemSize)`** —— 它会跑在「`mergedItems` 刚赋值、
      DOM 还没重渲染」的位置 ⇒ 量到全 0 高度 ⇒ 先写一版全 0 列号 ⇒ **`layoutChange` 发两次**
      （L2 实测抓到）；`watch(…, {flush:'post'})` 已经覆盖首次量测。
      ② 🚨 **只 `emit('layoutChange')`**，不要再手写 `props.onLayoutChange?.(…)`（Vue 的 emit
      自己就会调同名 prop ⇒ 两次）。→ PITFALLS 267（splitter 的 5 个回调也是这个 bug，同批修掉）
      ③ `MasonryItem` 用 `.ts`（`COMPONENT-RULES.md` §2 **条件 1**：纯渲染函数型内部件）——
      理由同步登记 README §3。
- [x] G5 L1 单元 + G6 L2 交互 —— `__tests__/index.test.ts` **20 条**：
      L1 纯函数 12 条（排布算法用**上游同一组输入**：15 项 / 3 列 ⇒ 480px；平局取最左；
      显式列号夹取；总高减一个 gutter；空列表兜底；单列前缀和）+ 列数解析 6 条
      （默认 3 / `columns={0}` 也是 3 / 数字 / 从大到小 / `xs ?? 1` / 命中但值为 undefined）；
      L2 接线 8 条（根类名 · children 优先于 itemRender · 量测后的内联样式与根高 ·
      `layoutChange` 双通道各一次 · 不传回调则不发 · 空列表不崩 · rtl · fresh）。
      ⚠️ jsdom 无布局 ⇒ L2 用 `getBoundingClientRect` mock（判据照抄上游：
      读 `.bamboo` 的 `data-height`）；真布局归 **L6**。
- [ ] G7 L3 类型（含负例，负例包在永不调用的闭包里）
- [ ] G8 L5 a11y —— axe + role/键盘断言
- [ ] G9 L6 视觉 —— 先建基线再 compare；对比不过先怀疑实现（px 字符串！）
- [ ] G10 L4 DOM 契约 + compat 比对
- [ ] G11 DOCS —— demo 与 antd 一一对应（demo.test.ts 的 expectCount 钉死数量）
- [ ] G12 REGISTRY —— 11 维度置 done（唯一让进度被承认的方式）
- [ ] G13 BUILD —— pnpm run registry:check && lint && test && test:build 四道全绿
- [ ] G14 COMMIT —— commit message 带 [COMP:masonry]

## 开工避坑清单（全部真实踩过，详见 .workbuddy-ai/memory/PITFALLS.md）

1. **内联 style 的数字必须转 px 字符串** —— Vue patchStyle 不做转换（React 才有），裸数字被静默丢弃。
2. **L3 负例必须包在永不调用的闭包里** —— *.test-d.ts 会被 vitest 真执行。
3. **vitest 必须从仓库根跑** —— 在 packages/<x>/ 下跑不应用根 config，大面积假失败。
4. **demo 显式指定字体** —— 继承字体差异是平台差异，会让 L6 全红。
5. **Boolean prop 未传 ≠ false** —— withDefaults 里给 undefined，否则布尔语义静默失效。
6. **cssinjs 嵌套语义**：`&` 是复合选择器、普通键是后代 —— 搞反会让样式作用到所有形态。
7. **var(--apollo-*) 必须在 theme tokens.css 有声明** —— 写错不报错，由 test:build B7 兜底。
8. **凡是要断言「某决策/约定是这样」先跑 node registry/tools/ask.mjs**，不凭记忆。
9. **跑重型门禁前关 IDE** —— 实测 16 分钟 → 7 分 49 秒。
10. **改完文件回读** —— Edit 偶发报 success 但内容未变；biome 会重排 import。
