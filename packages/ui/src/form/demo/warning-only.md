---
order: 218
title:
  zh-CN: 仅警告校验
  en-US: Warning only
---

在规则上设置 `warningOnly: true` 后，校验失败只会进入 `meta.warnings` 并展示警告，不会阻止 `@finish`。示例把「用户名」设为普通必填规则、把「昵称」设为仅警告规则，提交后可观察到两者对提交结果的差异。
