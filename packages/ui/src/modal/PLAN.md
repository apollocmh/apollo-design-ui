# Modal · 开发计划（G0–G14）

> 由 gen-component.mjs 生成。每次开工先过一遍「开工避坑清单」，Gate 完成一个勾一个。

## 状态

- registry status: **analyzing（G1 第二遍完成 2026-09-26）** · priority P3 · complexity L
- 依赖组件: config-provider, skeleton
- foundation: @apollo-design/a11y, @apollo-design/icons, @apollo-design/locale, @apollo-design/motion, @apollo-design/portal, @apollo-design/theme, @apollo-design/utils
- antd 规模: 1596 行 / 36 文件 · token 6（⚠️ 实测 ComponentToken **24 键**，收口时修正）

## Gate 检查单

- [x] G0 CLAIM —— 本组件已由 next-task.mjs 授权开工
- [x] G1 ANALYZE（**第一遍 + 第二遍补读完成**：antd 10 文件 + rc-dialog 10 文件全文 + token 全默认值 + 渲染树 + confirm 命令式路径 + 焦点三条） —— docs/analysis/modal.md
- [x] G2 API DESIGN —— interface.ts 全量枚举（ModalProps / ModalFuncProps / 9 语义槽 / ModalInstance / ModalHookAPI / ModalPurePanelProps）；MaskType 与 ClosableType 复用 `_internal` 单一真源- [ ] G3 TOKEN —— style/token.ts 对齐 antd ComponentToken（名称/数量/默认值，规则 R7）
- [ ] G4 IMPLEMENT —— <Name>.vue + style/index.ts；选择器从 antd extractStyle 产物提取，不推演
- [ ] G5 L1 单元 + G6 L2 交互 —— __tests__/index.test.ts
- [ ] G7 L3 类型（含负例，负例包在永不调用的闭包里）
- [ ] G8 L5 a11y —— axe + role/键盘断言
- [ ] G9 L6 视觉 —— 先建基线再 compare；对比不过先怀疑实现（px 字符串！）
- [ ] G10 L4/L4 DOM 契约 + compat 比对
- [ ] G11 DOCS —— demo 与 antd 一一对应（demo.test.ts 的 expectCount 钉死数量）
- [ ] G12 REGISTRY —— 11 维度置 done（唯一让进度被承认的方式）
- [ ] G13 BUILD —— pnpm run registry:check && lint && test && test:build 四道全绿
- [ ] G14 COMMIT —— commit message 带 [COMP:modal]

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
