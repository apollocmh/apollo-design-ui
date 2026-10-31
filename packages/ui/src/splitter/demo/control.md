---
order: 101
title:
  zh-CN: 受控模式
  en-US: Control
---

通过 `size` 受控 + `resize` 事件同步面板尺寸，按钮可快速切换预设比例。

父级接受 `resize` 的尺寸提议才改变受控布局；撤回 `size` 后从最后接受的布局继续拖动，重置按钮重新设置明确比例。

The parent accepts size proposals through `resize`. Removing `size` continues from the last accepted layout; reset assigns an explicit ratio again.
