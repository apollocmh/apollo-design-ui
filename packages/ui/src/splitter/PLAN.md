> 规范范围：本文件保留实现说明与历史对照证据；上游同构、旧阶段与历史 Gate 要求不再生效。现行规则见 [项目规范](../../../../AGENTS.md)，公共行为以 Apollo 组件 API 文档与测试契约为准。

> 历史实施记录：原勾选、当时结果和缺口保留。2026-10-30 起，本文的 G0–G14 / 逐组件 G13 全仓收口与旧 Registry 进度规则由仓库 `WORKFLOW.md`、`TESTING.md` 两阶段流程替代；当前任务状态只读 `registry/vue-native-audit.json`，不据本文重复派发或重跑已有效验证。

# Splitter · G0-G14 执行计划

- G1-G3：docs/analysis/splitter.md（antd 898 行逐文件对拍 + SSR 探针确认契约）
- G4：无分叉决策；两处实现期修正（Panel children 三形态归一化、flexBasis 数字补 px）
- G5-G6：interface / hooks（sizeUtil/useSizes/useResizable/useResize）/ Panel/SplitBar/Splitter /
  style（4 常量 Token + 组件作用域 CSS 变量）
- G7-G14：L1 21 / L3 14 / L4 9 / L5 4 demo / L6 9 / L7 13 / fixtures 3 → registry → verify:full
