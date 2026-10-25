---
order: 200
title:
  zh-CN: 语义化样式
  en-US: Semantic styles
---

## zh-CN

通过 `classNames` 与 `styles` 自定义图片容器、图片本身与预览遮罩。第一个示例保留自定义遮罩，悬停可见并支持预览。

后面的原生 `class` / `style` 循环使用动态 `StyleValue`：字符串 → 混合数组 → 对象 → 移除。原生 style 只控制实际外根，优先于语义根样式；img 的独立 `styles.image` 不被根样式覆盖。移除时恢复语义根值，富内容的图片、输入草稿和焦点保持。

进度分支也保留根 id、data、可访问名称/描述与样式，同时由组件控制 progressbar 的角色和数值。示例使用本地 data URI，不依赖图片网络请求。

## en-US

Use `classNames` and `styles` to customize the root, image and preview cover. The first example retains its custom hover cover and preview behavior.

The native `class` / `style` example cycles a dynamic `StyleValue`: string, mixed array, object and removal. Native style controls only the actual outer root and overrides semantic root styles; the img's independent `styles.image` stays intact. Removal restores semantic root values while the rich image, input draft and focus remain.

The progress branch also retains native root id, data, accessible name/description and style while the component owns the progressbar role and values. The local data URI avoids external image requests.
