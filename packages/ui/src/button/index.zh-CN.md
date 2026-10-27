---
category: 通用
title: Button
subtitle: 按钮
---

按钮触发操作，或通过原生链接导航。

## 何时使用

用于提交表单、确认操作或触发当前页面中的动作。需要跳转时使用 `href`，由原生链接承载导航。

## 代码演示

保留全部 20 个原示例：`basic`, `block`, `chinese-chars-loading`, `chinese-space`, `color-variant`, `component-token`, `custom-disabled-bg`, `danger`, `disabled`, `ghost`, `href`, `icon`, `icon-placement`, `linear-gradient`, `loading`, `multiple`, `semantic`, `shape`, `size`, `style-class`.

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| type | 视觉类型糖，显式 color/variant 可分别覆盖 | `ButtonType` | 'default' |
| color | 独立生效的语义色或预设色 | `ButtonColorType` | — |
| variant | 独立生效的视觉变体 | `ButtonVariantType` | — |
| icon | 图标数据或 Vue 组件；#icon 优先 | `ButtonIcon` | — |
| iconPosition | 已有废弃别名，使用 iconPlacement | `ButtonIconPlacement` | — |
| iconPlacement | 图标位置，覆盖已有别名 | `ButtonIconPlacement` | 'start' |
| shape | 形状；square 为方角 | `ButtonShape` | 'default' |
| size | 尺寸，依次取局部、Compact、Provider | `ButtonSize` | — |
| disabled | 禁用；显式 false 覆盖父级 true | `boolean` | — |
| loading | 请求立即阻止点击，delay 只推迟指示器 | `ButtonLoading` | false |
| prefixCls | 根类名前缀 | `string` | apollo-btn |
| ghost | 透明背景；solid 映射为 outlined | `boolean` | false |
| danger | 危险颜色糖，低于显式 color | `boolean` | false |
| block | 撑满容器 | `boolean` | false |
| href | 定义时渲染 a，空字符串也是有效链接值 | `string` | — |
| htmlType | button 根的原生 type | `ButtonHTMLType` | 'button' |
| autoInsertSpace | 两个中文字的视觉字距，保留连续原文 | `boolean` | true |
| classNames | root/icon/content 对象式类名 | `ButtonSemanticClassNames` | — |
| styles | root/icon/content 对象式样式 | `ButtonSemanticStyles` | — |

`ButtonType`: default / primary / dashed / link / text. `ButtonShape`: default / circle / round / square.
`ButtonSize`: small / medium / middle / large. `ButtonVariantType`: outlined / dashed / solid / filled / text / link.
`ButtonColorType`: default / primary / danger / blue / purple / cyan / green / magenta / pink / red / orange / yellow / volcano / geekblue / lime / gold.
`ButtonHTMLType`: button / submit / reset. `ButtonIconPlacement`: start / end.
`ButtonIcon = VNodeChild | Component`; `ButtonLoading = boolean | { delay?: number; icon?: ButtonIcon }`.

### 当前配置与原生属性

color、variant 各自先取显式值，再取 type/danger 糖，最后取当前 Provider；没有颜色时 solid 用 primary，其他变体用 default。显式 color 优先于 danger。ghost 把 solid 映射为 outlined。Provider 替换、删除、恢复均使用当前配置。

Vue class、字符串/对象/数组 style 和其他原生 attrs 落在真实 button/anchor 根；原生 style 优先于语义根样式和源 Token。表单属性、原生事件正常消费。启用链接尊重调用者 tabindex；禁用时移除 href 并强制 tabindex=-1。自定义前缀需配套静态 CSS，例如 genButtonStyle('my-app') 对应 .my-app-btn。

### 插槽

| 名称 | 内容 |
|---|---|
| default | 完整 Vue 内容；注释和空 Fragment 不产生空宿主 |
| icon | 完整 Vue 图标内容，优先于 icon 数据；有意空槽隐藏回退 |

组件拥有的 .apollo-btn-content 接收 content 类和样式。业务子 VNode、文字、状态和 ref 保持原样；中文字距由 CSS 实现，DOM 和可访问名保留连续原文。语义样式仅接受对象，不包含函数式 API。

### Emits 与 ref

click 发出一次原生 MouseEvent。disabled 或加载请求阻止激活、默认提交和事件传播，延迟显示期间也不触发 click。加载保留焦点，通过 aria-busy/aria-disabled 表达状态。有限正 delay 只延迟指示器；取消或卸载清理，单独替换图标不重计时，SSR 不创建计时器。内置加载图形为装饰；仅图标按钮应通过 aria-label 提供操作名称。

唯一 expose 是 nativeElement: HTMLButtonElement | HTMLAnchorElement | null，挂载前及卸载后为 null。没有 v-model 或其他 focus/blur 服务。

### 组件 Token 与导出

下列 45 个显式字段及 13 个已有预设阴影字段均消费当前 theme.components.Button。原生根变量（如 --apollo-btn-content-font-size）优先。数字长度转 px，字重/行高为无单位；有限非负尺寸保留 0，无效数字尺寸回退。移除源配置恢复继承/静态默认值。

| Token | 职责 |
|---|---|
| fontWeight | 字重 |
| iconGap | 图标与内容间距 |
| defaultShadow | 阴影 |
| primaryShadow | 阴影 |
| dangerShadow | 阴影 |
| primaryColor | 对应颜色及状态的文字、背景或边框 |
| defaultColor | 对应颜色及状态的文字、背景或边框 |
| defaultBg | 对应颜色及状态的文字、背景或边框 |
| defaultBorderColor | 对应颜色及状态的文字、背景或边框 |
| dangerColor | 对应颜色及状态的文字、背景或边框 |
| defaultHoverBg | 对应颜色及状态的文字、背景或边框 |
| defaultHoverColor | 对应颜色及状态的文字、背景或边框 |
| defaultHoverBorderColor | 对应颜色及状态的文字、背景或边框 |
| defaultActiveBg | 对应颜色及状态的文字、背景或边框 |
| defaultActiveColor | 对应颜色及状态的文字、背景或边框 |
| defaultActiveBorderColor | 对应颜色及状态的文字、背景或边框 |
| borderColorDisabled | 对应颜色及状态的文字、背景或边框 |
| defaultBorderColorDisabled | 对应颜色及状态的文字、背景或边框 |
| groupBorderColor | 组及 Compact 接缝 |
| defaultGhostColor | 对应颜色及状态的文字、背景或边框 |
| ghostBg | 对应颜色及状态的文字、背景或边框 |
| defaultGhostBorderColor | 对应颜色及状态的文字、背景或边框 |
| solidTextColor | 对应颜色及状态的文字、背景或边框 |
| textTextColor | 对应颜色及状态的文字、背景或边框 |
| textTextHoverColor | 对应颜色及状态的文字、背景或边框 |
| textTextActiveColor | 对应颜色及状态的文字、背景或边框 |
| paddingInline | 对应尺寸内边距 |
| paddingInlineLG | 对应尺寸内边距 |
| paddingInlineSM | 对应尺寸内边距 |
| paddingBlock | 对应尺寸内边距 |
| paddingBlockLG | 对应尺寸内边距 |
| paddingBlockSM | 对应尺寸内边距 |
| onlyIconSize | 仅图标尺寸 |
| onlyIconSizeLG | 仅图标尺寸 |
| onlyIconSizeSM | 仅图标尺寸 |
| linkHoverBg | 对应颜色及状态的文字、背景或边框 |
| textHoverBg | 对应颜色及状态的文字、背景或边框 |
| contentFontSize | 对应尺寸字号 |
| contentFontSizeLG | 对应尺寸字号 |
| contentFontSizeSM | 对应尺寸字号 |
| contentLineHeight | 对应尺寸行高 |
| contentLineHeightLG | 对应尺寸行高 |
| contentLineHeightSM | 对应尺寸行高 |
| defaultBgDisabled | 对应颜色及状态的文字、背景或边框 |
| dashedBgDisabled | 对应颜色及状态的文字、背景或边框 |

预设阴影：`blueShadowColor`, `purpleShadowColor`, `cyanShadowColor`, `greenShadowColor`, `magentaShadowColor`, `pinkShadowColor`, `redShadowColor`, `orangeShadowColor`, `yellowShadowColor`, `volcanoShadowColor`, `geekblueShadowColor`, `limeShadowColor`, `goldShadowColor`.

```vue
<ConfigProvider :theme="{components:{Button:{contentFontSize:18,paddingInline:24}}}">
  <Button type="primary">Save</Button>
</ConfigProvider>
```

默认实色前景和彩色文字在 @supports 内使用原生 CSS 颜色能力，已有前景 Token 和原生样式保留显式控制；不支持的色值函数保留回退。透明及渐变表面须按实际背景配对。审计记录实际浏览器和主题范围，不宣称其他浏览器均已实测。

Button、genButtonStyle、prepareButtonComponentToken 从 @apollo-design/ui 和 @apollo-design/ui/button 导出。类型含 ButtonProps、ButtonRef、ButtonSlots、ButtonSlot、ButtonConfig、上述枚举/语义类型、ButtonComponentToken、ButtonTokenInput。旧文档中的 button/style/token 不是包导出路径。

```ts
import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/button/style.css';
// Or import '@apollo-design/ui/style.css';
```

[契约迁移](../../../../docs/migrations/button-contracts.md)。
