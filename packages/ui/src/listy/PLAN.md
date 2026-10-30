> 规范范围：本文件保留实现说明与历史对照证据；上游同构、旧阶段与历史 Gate 要求不再生效。现行规则见 [项目规范](../../../../AGENTS.md)，公共行为以 Apollo 组件 API 文档与测试契约为准。

> 历史实施记录：原勾选、当时结果和缺口保留。2026-10-30 起，本文的 G0–G14 / 逐组件 G13 全仓收口与旧 Registry 进度规则由仓库 `WORKFLOW.md`、`TESTING.md` 两阶段流程替代；当前任务状态只读 `registry/vue-native-audit.json`，不据本文重复派发或重跑已有效验证。

# Listy · G0-G14 执行计划

- G1-G3：docs/analysis/listy.md（antd 薄壳 87 行 + rc-listy@1.2.3 引擎 600 行逐文件对拍）
- G4：无分叉决策；判据修正一条（direction 被 antd Omit ⇒ 方向只走 ConfigProvider，L4 实测）
- G5-G6：interface / engine/（tagged 键 + 聚合 + 扁平化 + Raw 滚动 + 虚拟吸顶推算）/
  Listy.ts（Raw/Virtual 双分支）/ style（2 Token，var() 形态）
- G7-G14：L1 19 / L3 10 / L4 7 / L5 4 demo / L6 9 / L7 9 / fixtures 3 → registry → verify:full
