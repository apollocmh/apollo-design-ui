---
category: 布局
title: Divider
subtitle: 分割线
---

区隔章节正文或行内操作。支持水平/垂直方向、完整 Vue 标题内容、线型、间距及当前主题。

## 代码演示

九对 Demo 见 [demo](./demo)：horizontal、with-text、size、plain、vertical、customize-style、component-token、variant、style-class。条件标题、三个真实 Token 和函数式样式提供可操作控件。

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| prefixCls | 完整组件类名前缀 | string | 当前 ConfigProvider，兜底 apollo-divider |
| orientation | 方向；旧标题位置值仍接受并告警 | Orientation \| TitlePlacement | 生效方向 horizontal |
| vertical | 是否垂直；明确 false 会压过 type | boolean | 未传为 undefined |
| titlePlacement | 逻辑 start/end、center 或物理 left/right | 'start' \| 'end' \| 'center' \| 'left' \| 'right' | center |
| plain | 标题使用正文样式 | boolean | false |
| variant | 线型；dotted 优先于 dashed 布尔项 | 'solid' \| 'dashed' \| 'dotted' | solid |
| dashed | 虚线开关；保留与 variant 组合 | boolean | false |
| size | 水平间距；medium/middle 等价，垂直模式忽略 | 'small' \| 'medium' \| 'middle' \| 'large' | 继承 componentSize |
| classNames | 三语义区域的类名或函数 | DividerSemanticValue<DividerSemanticClassNames> | — |
| styles | 三语义区域的样式或函数 | DividerSemanticValue<DividerSemanticStyles> | — |
| ~~type~~ | 旧方向配置，改用 orientation | Orientation | — |
| ~~orientationMargin~~ | start/end 标题距近边的长度，建议新代码用 styles.content.margin | string \| number | — |

`Orientation` 为 horizontal / vertical；`TitlePlacement` 为五种标题位置。方向优先级为 orientation（有效方向）→ 显式 vertical → type → horizontal。orientation 的旧位置值不承担方向，并输出迁移告警。

标题的 left/right 按当前方向折算为 start/end。Provider direction 与根原生 dir 更新生效；原生 ltr/rtl dir 优先。size=small 使用 marginXS，medium/middle 使用 margin；large 保留基础间距（普通线 marginLG，标题 margin）。

orientationMargin 的数值和十进制数字字符串（含符号/小数）按 px 处理；CSS 单位串原样使用，0 有效，center 不使用该字段。注意它是像素/长度配置；同名组件 Token 则是 0～1 的比例。

### 原生 attrs、事件和 ref

单一根为 div。无标题/垂直根使用 separator；有水平标题时根使用 group，空 start rail 承担 separator，另一段 rail 是隐藏的装饰，完整标题控件不被交互角色包裹。class、style、id、ARIA 和原生监听到达当前根；class 可为字符串、数组或对象，style 可为字符串、对象或数组，原生 style 优先。垂直根声明 aria-orientation=vertical；水平使用 separator 默认轴。role 按上述实际内容结构派生。

无业务 emits、v-model 或内部键盘操作。槽中的输入、链接、按钮保持原生事件和焦点行为。`nativeElement` 暴露实际 div，挂载前/卸载后为空，不暴露内部实例。

### 插槽与语义区域

默认槽为 `() => VNodeChild`，支持文本、0、数组/Fragment 和元素。条件插入/移除槽立即更新标题；存在但有意为空的槽仍是标题槽。垂直模式不渲染标题并告警。

classNames / styles 的区域为 root、rail、content。无标题时 rail 到根；有水平标题时到两侧 rail。类名按来源拼接；样式优先级为 Provider styles → Provider style(root) → 本地 styles → 原生根 style。语义函数收到 `{ props }`，其中 orientation、titlePlacement、size 是当前有效值。

ConfigProvider 支持 `divider` / `components.divider` 的 className、style、classNames、styles 默认值；组件 size 优先于当前 componentSize。配置替换与清除不需要重新挂载。

### 组件 Token 与主题

| Token | 默认值 | 说明 |
|---|---|---|
| textPaddingInline | 1em | 标题水平内间距；数值按 px |
| orientationMargin | 0.05 | 标题靠边 rail 占比，有限数 0～1 |
| verticalMarginInline | 当前 marginXS | 垂直分割线横向外间距；数值按 px |

```vue
<ConfigProvider :theme="{ components: { Divider: { textPaddingInline: 12, orientationMargin: 0.2, verticalMarginInline: 16 } } }">
  <Divider title-placement="start">Section</Divider>
  <Divider orientation="vertical" />
</ConfigProvider>
```

三个值均可动态更新和复位；空/非有限值使用各自默认值，padding 不接受负数值，margin 支持负长度。读取最近有效 ThemeProvider/ConfigProvider；ThemeProvider 不全局注入 CSS 也能生效，显式空 ThemeProvider 复位默认值。空 ConfigProvider theme 继承外层来源，使用 inherit: false 复位。无主题来源时保留用户 CSS 变量继承。支持默认、暗色、紧凑与嵌套作用域。

### 导出和样式

根入口导出 Divider、DividerProps、DividerRef、DividerConfig、DividerSize、DividerVariant、Orientation、TitlePlacement、语义类型及 DividerSlot。`@apollo-design/ui/divider` 另提供 default、DividerComponentToken、genDividerStyle、prepareDividerComponentToken。注册名为 ADivider。

```ts
import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/divider/style.css';
// 汇总入口：@apollo-design/ui/style.css
```

静态 CSS 默认覆盖 apollo。自定义命名空间须预生成/加载 CSS，例如 `genDividerStyle('my-app')` 对应 ConfigProvider prefixCls=my-app 或 Divider prefixCls=my-app-divider。函数入参是命名空间，组件 prop 是完整前缀；不会运行时生成任意选择器。
