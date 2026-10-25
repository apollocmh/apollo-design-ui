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

独立的 ConfigProvider 按钮替换整个 `components` map：空配置 → 全新 Image 配置 A → 全新配置 B → 移除。配置使用既有 `ImageSemanticType` 数据对象。root、img、cover 的类名和额外 CSS 变量随配置更新，placeholder.progress 类名也保持当前值。既有浅合并规则下，本地 progress 样式整组覆盖 Provider 同组，因此该组的 Provider 变量不保留。局部语义与原生根样式保持优先，原有样式循环和输入草稿保持独立。

## en-US

Use `classNames` and `styles` to customize the root, image and preview cover. The first example retains its custom hover cover and preview behavior.

The native `class` / `style` example cycles a dynamic `StyleValue`: string, mixed array, object and removal. Native style controls only the actual outer root and overrides semantic root styles; the img's independent `styles.image` stays intact. Removal restores semantic root values while the rich image, input draft and focus remain.

The progress branch also retains native root id, data, accessible name/description and style while the component owns the progressbar role and values. The local data URI avoids external image requests.

An independent ConfigProvider control replaces the entire `components` map: empty, a fresh Image configuration A, a fresh configuration B, then removal. The factory produces `ImageSemanticType` data objects. Root, img and cover classes and extra CSS variables update with the configuration; placeholder.progress classes stay current too. Under the existing shallow merge, the local progress style group replaces the Provider group, so Provider-only variables inside that group are not retained. Local semantic styles and native root style keep their priority; the existing style cycle and input draft remain independent.
