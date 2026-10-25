---
order: 7
title:
  zh-CN: 自定义面板渲染
  en-US: Render panel
---

`PopconfirmPurePanel`（= `Popconfirm._InternalPanelDoNotUseOrYouWillBeFired`）只渲染浮层内容本身。

## zh-CN

使用原生标题、描述及按钮内容槽；切换、更新和清空后，只有移除槽才恢复 prop / locale。

## en-US

Native title, description and button slots support conditional presence, updates and empty content. Only removing a slot restores the prop or locale.

原生字符串 style 与语义样式在面板根合并。 / Native string styles merge with semantic panel styles.
