# Progress · 开发计划（G0–G14）

> 由 gen-component.mjs 生成。每次开工先过一遍「开工避坑清单」，Gate 完成一个勾一个。

## 状态

- registry status: **todo** · priority P4 · complexity M
- 依赖组件: tooltip
- foundation: @apollo-design/icons, @apollo-design/motion, @apollo-design/theme, @apollo-design/utils
- antd 规模: 873 行 / 14 文件 · token 6

## Gate 检查单

- [x] G0 CLAIM —— 本组件已由 next-task.mjs 授权开工
- [x] G1 ANALYZE —— 读 /tmp/antd-src/package/es/progress/ 的 .d.ts + demo + 测试，产出 **docs/analysis/progress.md**（先于实现！）
- [x] G2 API DESIGN —— interface.ts 枚举 props/emits/slots/expose；v-model 取代 value+onChange
- [x] G3 TOKEN —— style/token.ts 对齐 antd ComponentToken（名称/数量/默认值，规则 R7）
- [x] G4 IMPLEMENT —— <Name>.vue + style/index.ts；选择器从 antd extractStyle 产物提取，不推演
- [x] G5 L1 单元 + G6 L2 交互 —— __tests__/index.test.ts
- [x] G7 L3 类型（含负例，负例包在永不调用的闭包里）
- [x] G8 L5 a11y —— axe + role/键盘断言
- [x] G9 L6 视觉 —— 先建基线再 compare；对比不过先怀疑实现（px 字符串！）
- [x] G10 L4/L4 DOM 契约 + compat 比对
- [x] G11 DOCS —— demo 与 antd 一一对应（demo.test.ts 的 expectCount 钉死数量）
- [x] G12 REGISTRY —— 11 维度置 done（唯一让进度被承认的方式）
- [x] G13 BUILD —— pnpm run registry:check && lint && test && test:build 四道全绿
- [ ] G14 COMMIT —— commit message 带 [COMP:progress]

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
