---
title: 远程加载数据
order: 21
---

服务端分页的标准形态：`pagination` 受控（`current / pageSize / total` 都来自响应），
翻页在 `change` 里重新拉数据，`loading` 覆盖请求期。
示例用一个本地假接口代替真实请求 —— 保持离线可跑、结果确定。
