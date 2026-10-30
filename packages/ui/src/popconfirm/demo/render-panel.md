---
order: 7
title:
  zh-CN: 自定义面板渲染
  en-US: Render panel
---

`PopconfirmPurePanel`（= `Popconfirm._InternalPanelDoNotUseOrYouWillBeFired`）只渲染浮层内容本身。

## zh-CN

使用原生标题、描述及按钮内容槽；切换、更新和清空后，只有移除槽才恢复 prop / locale。原生字符串 style 与语义根样式按 Vue 规则合并。主题按钮切换当前 `Popconfirm.zIndexPopup`，移除覆盖后恢复默认层级。

## en-US

Native title, description and button slots support conditional presence, updates and empty content. Only removing a slot restores the prop or locale. Native string styles merge with semantic root styles. The theme button changes the current `Popconfirm.zIndexPopup`; removing the override restores the default.
