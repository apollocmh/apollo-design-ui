> 规范范围：本文件保留实现说明与历史对照证据；上游同构、旧阶段与历史 Gate 要求不再生效。现行规则见 [项目规范](../../../../AGENTS.md)，公共行为以 Apollo 组件 API 文档与测试契约为准。

> 历史实施记录：原勾选、当时结果和缺口保留。2026-10-30 起，本文的 G0–G14 / 逐组件 G13 全仓收口与旧 Registry 进度规则由仓库 `WORKFLOW.md`、`TESTING.md` 两阶段流程替代；当前任务状态只读 `registry/vue-native-audit.json`，不据本文重复派发或重跑已有效验证。

# Tag · PLAN（G0–G14）

- [x] G0 CLAIM —— DAG 领取（P1/S，dagLevel=2）
- [x] G1 ANALYZE —— docs/analysis/tag.md（先于实现）
- [x] G2 API DESIGN —— interface.ts 逐字段对齐 TagProps/CheckableTag/Group d.ts
- [x] G3 TOKEN —— 3 个 Component Token（defaultBg/solidTextColor seed 实色）
- [x] G4 IMPLEMENT —— Tag.ts + CheckableTag.ts + CheckableTagGroup.ts +
       hooks/use-color.ts + _internal/use-closable.ts（共享层）
- [x] G5/G6 L1/L2 —— 26 例（variant 判据链/关闭流程/键盘/Group 值语义）
- [x] G7 L3 类型 —— 8 例（含 2 负例）
- [x] G8 L5 a11y —— 11 demo axe 0 violation
- [x] G9 L6 视觉 —— 9/9 全 exact（3 variant × 3 viewport）
- [x] G10 L4 DOM 契约 —— 24/24（PLATFORM×2 CSSOM 序列化豁免）
- [x] G11 DOCS —— README + index.zh-CN/en-US
- [x] G12 REGISTRY —— 11 维度 done（16/72）
- [x] G13 BUILD —— registry validate 18 OK；lint:types 零错误；test:build FAIL 0
