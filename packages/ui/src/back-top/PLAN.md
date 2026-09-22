# BackTop · PLAN（G0–G14）

- [x] G0 CLAIM —— DAG 领取（P1/S，dagLevel=2）
- [x] G1 ANALYZE —— docs/analysis/back-top.md（先于实现）
- [x] G2 API DESIGN —— interface.ts 逐字段对齐 BackTopProps.d.ts
- [x] G3 TOKEN —— 1 个 Component Token（zIndexPopup，calc 表达）
- [x] G4 IMPLEMENT —— BackTop.ts（render 函数；cloneVNode 注入 motionClassName）+
       _internal/scroll-to.ts（easeInOutCubic + scrollTo）
- [x] G5/G6 L1/L2 —— 26 例（双分支/监听时序/节流/scrollTo 参数/mock target）
- [x] G7 L3 类型 —— 3 例（含 2 负例）
- [x] G8 L5 a11y —— 1 demo axe 0 violation
- [x] G9 L6 视觉 —— 3/3 全 exact
- [x] G10 L4 DOM 契约 —— 4/4（visibilityHeight>0 空根形态平台一致不进基线）
- [x] G11 DOCS —— README + index.zh-CN/en-US
- [x] G12 REGISTRY —— 11 维度 done（15/72）
- [x] G13 BUILD —— registry validate 18 OK；lint:types 零错误；test:build FAIL 0
