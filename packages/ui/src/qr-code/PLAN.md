> 规范范围：本文件保留实现说明与历史对照证据；上游同构、旧阶段与历史 Gate 要求不再生效。现行规则见 [项目规范](../../../../AGENTS.md)，公共行为以 Apollo 组件 API 文档与测试契约为准。

> 历史实施记录：原勾选、当时结果和缺口保留。2026-10-30 起，本文的 G0–G14 / 逐组件 G13 全仓收口与旧 Registry 进度规则由仓库 `WORKFLOW.md`、`TESTING.md` 两阶段流程替代；当前任务状态只读 `registry/vue-native-audit.json`，不据本文重复派发或重跑已有效验证。

# QRCode · G0-G14 执行计划

- G1-G3：docs/analysis/qr-code.md（薄壳 170 行 + rc 引擎 1476 行对拍；reuse 选型落定）
- G4：无用户分叉；strategy=reuse 落定为 vendor 同源 qrcodegen（候选 qrcode/qr-code-styling
  会破坏 byte 级 oracle）；U11 可访问性上游原样
- G5-G6：engine/（qrcodegen.js + .d.ts + utils.ts）/ QrCode.ts / style（1 Token）
- G7-G14：L1 15 / L3 12 / L4 8 / L5 4 demo（2 组）/ L6 9 / L7 9 / fixtures 3 → registry → verify:full
