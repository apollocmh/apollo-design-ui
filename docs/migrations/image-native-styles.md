# Image 原生根样式修正

当前 `0.0.0` 开发版按 ADR 0007 直接修正，无错误 DOM 行为兼容层或弃用期。

Image 的原生 `class` / `style` 属于当前根元素。旧实现把原生 style 当对象展开，字符串会抛出 CSSStyleDeclaration 错误；还把同一份根样式复制到 img，覆盖 `styles.image`。根样式现按 Vue 的字符串、对象、数组规则合并，优先于 `styles.root`，移除后恢复当前语义样式。需要修改图片自身时使用 `styles.image`。

```vue
<Image
  src="/photo.png"
  style="padding: 20px; --photo-frame: navy"
  :styles="{ root: { borderRadius: '8px' }, image: { padding: '6px' } }"
/>
```

示例中20px只作用于根，img保留6px。不要依赖旧实现意外把根样式复制给图片；改用 `styles.image` 明确落点。原生属性不增加为同名组件props。

进度和纯占位提前返回时，其现有Progress根也接收当前class/style/id/data及名称/描述ARIA；保留Image根语义与 `placeholder.progress` 的嵌套语义。role、范围及busy状态由真实进度状态控制，不能通过根attrs伪造。移除显式aria-label（undefined）后恢复百分比默认名称。根click只通知一次，不打开不存在的图片预览；图片error不改挂到占位根。

本批范围和实际检查见 [报告](../audit/2026-10-25-image-native-styles-remediation.md)。全局配置与前缀动态替换、预览扩展仍按独立问题推进。
