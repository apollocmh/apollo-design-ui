---
title: 表格行/列合并
order: 17
---

单元格合并靠列的 `onCell`：返回 `{ colSpan }` 跨列、`{ rowSpan }` 跨行。
⚠️ 被跨掉的格子必须显式返回 `0`，否则后面的列会整体错位 —— 合并是「按格算」而不是「按列算」。

第二行的 Age 跨两列，覆盖返回 `colSpan: 0` 的 Home phone；Name 分别跨前三行和后两行，后两行的 Home phone 也纵向合并。
