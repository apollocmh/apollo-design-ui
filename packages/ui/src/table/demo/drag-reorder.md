---
title:
  zh-CN: 行与列的顺序调整
  en-US: Reorder rows and columns
order: 44
---

## zh-CN

通过已有 `onRow`、列 `onHeaderCell` 接入浏览器原生拖放事件，拖动后更新受控 `dataSource` / `columns` 顺序，不依赖 React 或第三方拖拽运行时。行与列分别拖放；按钮提供可用键盘操作的同等调整方式，并支持重置。这是消费端组合示例，Table 没有新增内建拖拽 prop。

## en-US

Use existing `onRow` and column `onHeaderCell` hooks to bind native browser drag events, then update the controlled `dataSource` or `columns` order. Rows and columns have separate drop targets. Keyboard-accessible buttons provide equivalent moves and reset. This consumer example adds no built-in drag prop or third-party drag runtime to Table.
