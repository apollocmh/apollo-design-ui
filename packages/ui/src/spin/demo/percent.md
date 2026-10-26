---
order: 6
title:
  zh-CN: 进度
  en-US: Progress
---

## zh-CN

未提供percent时为不定加载；显式数字含0在首帧和SSR呈现有名称的进度环，数值及几何均钳制到0–100。auto每200ms估算，关闭或卸载时清理任务。

## en-US

Omitted percent is indeterminate. Explicit numbers including zero render a named ring in the first client/server render, with both geometry and value clamped to 0–100. Auto estimates every 200ms and stops on close or unmount.
