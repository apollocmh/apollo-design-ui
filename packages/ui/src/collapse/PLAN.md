# Collapse · G0-G14 执行计划

- G1-G3：docs/analysis/collapse.md（antd 440 行 + rc-collapse 619 行逐行对拍）
- G4：无分叉决策；两处实现期修正（:focus-visible 误内联进基础规则；-arrow 需后代
  选择器——箭头 span 在 expand-icon div 里）
- G5-G6：interface / engine（activeKey 状态机 + buildPanelInfos）/ Panel（CSSMotion
  + PanelContent 惰性）/ Collapse.ts / style（10 Token 五段）
- G7-G14：L1 16 / L3 12 / L4 12 / L5 4 demo / L6 9 / L7 12 / fixtures 3 → registry → verify:full
