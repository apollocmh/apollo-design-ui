---
order: 8
title:
  zh-CN: 平滑地卸载
  en-US: Smoothly unload
---

`@close` 通知原生关闭请求，`@after-close` 在内部关闭完成后通知父级。减少动画偏好或 `theme.token.motion=false` 时也会完成移除并发出一次完成事件。Alert 没有受控 open/visible 模型；通过父级 `v-if` 重新挂载可再次显示。
