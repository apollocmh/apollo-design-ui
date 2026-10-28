---
order: 12
title:
  zh-CN: 错误边界
  en-US: Error boundary
---

以 Vue `onErrorCaptured` 捕获实际后代的渲染、setup、生命周期及所属事件错误；边界自身和脱离 Vue 调用链的错误不属于此边界。示例切换后代的渲染状态后抛错，以父级 key 重新挂载边界恢复内容，不新增 reset 方法。
