# Empty 完整内容与当前配置修正

适用范围：当前未发布开发版 0.0.0。依据 ADR 0007 直接修正错误 DOM/内容行为，无兼容层或新增弃用期。既有 imageStyle 及其弃用提示继续有效。

- 新增原生 #image，与既有 #description/default 一起接受完整 Vue 内容。每槽当前 render 求值一次，存在即优先；空内容不回退也不创建带间距的空宿主。
- image 只有 undefined 回退到当前 Provider 或默认插画；null/false/true/空串/空数组明确隐藏。0、数组、Fragment、VNode 和响应式组件定义有效，保留调用者属性。
- 自定义内容具有 image-content 类并按自然高度布局；固定媒体尺寸/透明度与直接媒体选择器只约束内置插画、URL 图片，不再牵连业务子树。宽 URL 图片限制在可用宽度内。
- 默认说明改用 colorTextSecondary，修复浅色及紧凑主题对比度；normal/small 不再把弱文字颜色施加到整个业务区域。
- 当前 Provider 的五配置字段、方向、两个插画语言实时更新；命名 EmptyConfig 可直接传给真实 ConfigProvider，无开放索引签名。
- 非字符串 description 的 URL alt 从固定 empty 改为当前语言的空状态说明；显式字符串含空串保持。插画几何和来源不变，双透明主题合成输出有限透明色。

旧自定义 template-only 组件示例需要运行时编译器；现在直接写预编译模板插槽：

```vue
<Empty description="Nothing to show">
  <template #image>
    <BusinessDiagram />
    <DraftEditor v-model="draft" />
    <strong>Complete image content</strong>
  </template>
  <template #description><span>Description</span><a href="#create">Create one</a></template>
  <button type="button">Create</button><span>Footer tail</span>
</Empty>
```

原 six Props、四语义、静态插画身份、原生 attrs 与 nativeElement 保持。原机械 JSON/投影/参考图不修改；32 个旧 DOM 场景只登记 image-content 和空 footer 两个精确新增差异，额外变化仍失败。完整复现与验收见[本轮清单](../audit/2026-10-27-empty-contract-audit.md)。
