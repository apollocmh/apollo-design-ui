# 浮层静态面板的原生 style 落点

适用当前未发布开发版，依据用户裁决与 ADR 0007 直接修正，无兼容开关或弃用期。

PopoverPurePanel / PopconfirmPurePanel 原先沿用 React rc Popup 的 props 展开方式，把同一份原生 style 同时写到根与 container。`style="padding:20px"` 因此重复 padding，并覆盖调用方明确配置的 `styles.container.padding`。现原生 class/style 只落面板根；容器样式独立使用 styles.container，箭头使用 styles.arrow。主 Popover / Popconfirm 的原生 class/style 继续作用于浮层根。

```vue
<!-- 根间距与内容间距分别控制 -->
<PopconfirmPurePanel
  title="Confirm"
  style="padding: 20px; max-width: 360px"
  :styles="{ container: { padding: '6px' } }"
/>
```

需要让根与容器都具有某种样式时，明确分别设置，不再依靠隐式复制。字符串、对象、混合数组与 CSS 变量均按 Vue style 规则合并；原生 style 覆盖相同的语义根属性，移除后恢复语义值。

同批补齐 PopconfirmPurePanel 对 root/container/arrow classNames/styles 的转发及 PopoverPurePanel 的箭头语义消费。icon/title/content 仍属于确认正文。未增加公共属性，未删除数据或业务回调。

历史 React 对照、快照和视觉基线不改写为新契约；原生落点另有 CSR / SSR / 生产浏览器的正向断言。验证见 [专项报告](../audit/2026-10-25-overlay-native-styles-remediation.md)。
