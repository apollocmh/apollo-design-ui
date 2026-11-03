---
title: 选择和操作
order: 5
---

勾选列 + 操作列的组合：`getCheckboxProps` 按行禁用勾选，工具栏按钮读 `selectedRowKeys` 做批量操作；
选中行随数据删除同步清理，避免出现指向已删行的残留 key。

窄屏使用 `scroll.x` 保留完整列宽，横向滚动可访问操作列；键盘聚焦 Delete 时也会将按钮滚入视口。
