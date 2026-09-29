# Pagination · 开发计划（G0–G14）

> 由 gen-component.mjs 生成。每次开工先过一遍「开工避坑清单」，Gate 完成一个勾一个。

## 状态

- registry status: **todo** · priority P5 · complexity M
- 依赖组件: select
- foundation: @apollo-design/a11y, @apollo-design/form-core, @apollo-design/icons, @apollo-design/locale, @apollo-design/theme, @apollo-design/utils
- antd 规模: 915 行 / 10 文件 · token 12

## Gate 检查单

- [x] G0 CLAIM —— 本组件已由 next-task.mjs 授权开工
- [x] G1 ANALYZE —— docs/analysis/pagination.md（2026-09-29：结构判定 + 页码列表算法判据 + 12 token + 8 风险 + Vue 化决策）
- [x] G2 API DESIGN —— interface.ts 全量类型面（18 个类型）+ 根 barrel 块；**无 expose**（上游是 React.FC）
- [x] G3 TOKEN —— style/token.ts **12 个**自有 token 与产物逐字对拍（2026-09-29）+ 输入框族 19 个**本地复刻**（不跨组件 import，与 input-number 先例一致）+ 3 个派生 token
- [x] G4 IMPLEMENT —— Pagination.vue + Pager/Options/getPagerList（纯函数）/useShowSizeChanger；样式 108 条规则 + 32 条 token 声明从 extract-pagination-css.mjs --emit-static 机械移植（2026-09-29）
- [x] G5 L1 单元 + G6 L2 交互 —— __tests__/{pagers,index}.test.ts（**274 用例**：L1 227 = 224 行页码判定表对拍 antd 产物 + calculatePage + useShowSizeChanger；L2 47 = 结构/值变化/showTotal/itemRender/简化模式/快速跳转/尺寸切换/ConfigProvider 合并）
- [x] G7 L3 类型（**28 用例**（11 正 + 4 负），Type Errors: no errors）
- [x] G8 L5 a11y —— axe 扫 10 种真实配置 + role/ARIA 8 + 键盘可达 6 = **24 用例**
- [x] G9 L6 视觉 —— **30/30 逐像素 exact**（10 variant × 3 viewport，一次通过，2026-09-29）
- [x] G10 L4/L4 DOM 契约 + compat 比对
- [x] G11 DOCS —— 12 个 demo（expectCount 钉死）+ zh/en 文档 + README；theme/a11y 的 demo 维度扫描已接
- [x] G12 REGISTRY —— 11 维度置 done（唯一让进度被承认的方式）
- [x] G13 BUILD —— pnpm run registry:check && lint && test && test:build 四道全绿
- [x] G14 COMMIT —— commit message 带 [COMP:pagination]

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
