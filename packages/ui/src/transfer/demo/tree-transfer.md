---
order: 9
title:
  zh-CN: 树形穿梭框
  en-US: Tree Transfer
---

通过 `renderList` 把左右两列交给 `Tree` 渲染：父子节点联动勾选，勾选结果经
`onItemSelect` 逐个回写 `selectedKeys`（对齐 antd `tree-transfer.tsx`）。
