# BorderBeam · PLAN（G0–G14）

- [x] G0 CLAIM —— DAG 领取（P1/S，无组件依赖）
- [x] G1 ANALYZE —— docs/analysis/border-beam.md（先于实现）
- [x] G2 API DESIGN —— interface.ts 逐字段对齐 BorderBeam.d.ts
- [x] G3 TOKEN —— 0 个 Component Token（prepareComponentToken 未传，与 antd 逐字一致）
- [x] G4 IMPLEMENT —— BorderBeam.ts（render 函数；createVNode 重建宿主注入 Effect）
- [x] G5/G6 L1 —— 19 例（结构/CSS 变量/inset/count 错相/getBorderBeamGradient 直测）
- [x] G7 L3 类型 —— 3 例（含 2 负例）
- [x] G8 L5 a11y —— 8 demo axe 0 violation + Effect aria-hidden 断言
- [x] G9 L6 视觉 —— 6/6 全 exact（2 variant × 3 viewport；动画不在比对面）
- [x] G10 L4 DOM 契约 —— 3/3（SSR 形态；Effect portal 两侧平台一致）
- [x] G11 DOCS —— README + index.zh-CN/en-US
- [x] G12 REGISTRY —— 11 维度 done（13/72）
- [x] G13 BUILD —— registry validate 18 OK；lint:types 零错误；test:build 127 FAIL 0
