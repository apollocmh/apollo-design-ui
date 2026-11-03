---
order: 2
title:
  zh-CN: 固定在底部
  en-US: Offset bottom
preview:
  mode: viewport
  viewportHeight: 320
  scrollable: true
---

`offsetBottom` 与 `offsetTop` **互斥**：两者都传时只有 `offsetTop` 生效
（antd 的 `internalOffsetTop` 互锁推导，见 `docs/analysis/affix.md` §3）。
