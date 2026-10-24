---
title:
  zh-CN: 模板内容与数字计数
  en-US: Template content and numeric counts
order: 13
---

## zh-CN

`#count` 展示静态富内容，不执行数字封顶或数字位滚动；需要数字滚动时使用 `count` prop。`#text` 支持状态富文本。插槽存在则覆盖内容 prop，空插槽隐藏对应内容；移除插槽后恢复 prop。`dot` 仍优先于计数内容，离场保留上一帧内容，输入节点保持。

## en-US

`#count` renders static rich content without numeric overflow or digit rolling. Use the `count` prop for animated numbers. `#text` renders rich status text. A present slot overrides its prop, including empty content; removing the slot restores the prop. Dot mode takes display precedence. Leaving indicators retain their last visible content and the input stays mounted.
