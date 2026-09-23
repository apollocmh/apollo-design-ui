# Listy · G0-G14 执行计划

- G1-G3：docs/analysis/listy.md（antd 薄壳 87 行 + rc-listy@1.2.3 引擎 600 行逐文件对拍）
- G4：无分叉决策；判据修正一条（direction 被 antd Omit ⇒ 方向只走 ConfigProvider，L4 实测）
- G5-G6：interface / engine/（tagged 键 + 聚合 + 扁平化 + Raw 滚动 + 虚拟吸顶推算）/
  Listy.ts（Raw/Virtual 双分支）/ style（2 Token，var() 形态）
- G7-G14：L1 19 / L3 10 / L4 7 / L5 4 demo / L6 9 / L7 9 / fixtures 3 → registry → verify:full
