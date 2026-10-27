---
order: 4
title:
  zh-CN: 全局配置
  en-US: ConfigProvider
---

真实 ConfigProvider 通过 components.empty 提供 image、className、style、classNames 和 styles。勾选控件切换当前配置；示例保留 URL 图片输入，使用本地确定素材，支持离线访问。

组件的 image 优先于 Provider；只有 undefined 才回退。
