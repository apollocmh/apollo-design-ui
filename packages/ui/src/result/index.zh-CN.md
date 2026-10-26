---
category: 反馈
title: Result
subtitle: 结果页
---

展示操作结果、异常说明及后续操作。标题内容需要业务语义时，可通过 `#title` 放置合适级别的标题。

## 何时使用

用于结果反馈较复杂、需要标题、说明、正文或操作区的页面。

## 代码演示

十个实际示例包括四种普通状态、403/404/500静态插画、完整自定义图标、六个语义落点和可开关组件主题。

## API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| status | 普通状态或异常代码；数字和字符串异常代码等价 | `'success' \| 'error' \| 'info' \| 'warning' \| 403 \| 404 \| 500 \| '403' \| '404' \| '500'` | `'info'` |
| icon | 默认图形开关，`false`/`null`隐藏，`true`/未传显示；存在`#icon`时插槽优先 | `boolean \| null` | — |
| title | 标题文本；存在`#title`时插槽优先 | `string` | — |
| subTitle | 副标题文本；存在`#subTitle`时插槽优先 | `string` | — |
| prefixCls | 当前类名前缀；任意前缀的静态CSS须由应用提供 | `string` | Provider前缀 |
| classNames | 六个语义落点的类或读取当前Props的工厂 | `ResultSemanticClassNames \| ((info: { props: ResultProps }) => ResultSemanticClassNames)` | — |
| styles | 六个语义落点的样式或读取当前Props的工厂 | `ResultSemanticStyles \| ((info: { props: ResultProps }) => ResultSemanticStyles)` | — |

### Slots

| 插槽 | 内容 |
|---|---|
| icon | 完整自定义图标内容，所有状态均覆盖默认图形；可含原生交互内容 |
| title / subTitle | 完整标题/副标题内容，优先于同名文本prop |
| extra | 操作区 |
| default | 正文 |

五个插槽均无参数，支持多节点、Fragment、注释与原生控件。存在但为空的插槽不回退默认内容，也不留下空容器；移除插槽才恢复默认。`0`为有效文本。状态/主题变化保留仍存在的业务节点；被条件移除的内容按Vue正常卸载。

### 原生属性、事件和实例

`class`、字符串/数组/对象`style`、id、aria/data、tabindex和原生监听作用于根div。类拼接，语义样式覆盖Provider配置，根原生style最后生效。没有业务Emits或v-model；例如`@click`接收根原生事件，触发一次。

`ResultRef.nativeElement: HTMLElement | null`指向根节点，卸载后为null。组件不自动聚焦、不声明alert/live区域；需要时由调用者提供原生role/aria属性。

### Provider、语义和主题

`components.result`支持当前`className/style/classNames/styles`，替换、删除和恢复均生效。`className/style`在配置对象中是有效根配置，不是组件根属性别名。最近Provider、direction与prefix响应更新。六个语义名称为`root/title/subTitle/body/extra/icon`。

四个组件Token通过`theme.components.Result`配置，也可由根CSS变量覆盖。源主题Alias、普通/暗色/紧凑及组合算法即时更新；局部配置不影响相邻实例。

| Token | 类型 | 默认值 | CSS变量 |
|---|---|---|---|
| titleFontSize | `number \| string` | `fontSizeHeading3` | `--apollo-result-title-font-size` |
| subtitleFontSize | `number \| string` | `fontSize` | `--apollo-result-subtitle-font-size` |
| iconFontSize | `number \| string` | `fontSizeHeading3 × 3` | `--apollo-result-icon-font-size` |
| extraMargin | `string` | `paddingLG 0 0 0` | `--apollo-result-extra-margin` |

数字字号按px，0有效；负数和非有限数字回退当前Alias。字符串支持有效CSS长度、变量或calc表达式；空串回退。extraMargin使用CSS margin简写。静态CSS入口为`@apollo-design/ui/style.css`或`@apollo-design/ui/result/style.css`。

### 静态导出与SSR

`PRESENTED_IMAGE_403/404/500`为可重复渲染的静态插画组件，与`ExceptionMap`对应项身份一致；`IconMap`包含四种普通状态。默认异常插画是装饰，普通状态图标保留其图像名称；真实自定义插槽不被隐藏。插画颜色和路径保持静态，直接使用插画组件时可自行提供原生SVG名称。

生产SSR不访问浏览器全局；水合使用相同配置与内容。根入口`@apollo-design/ui`提供具名Result、图标映射与类型；深入口`@apollo-design/ui/result`另提供默认Result导出。本轮开发期行为修正见[集中迁移记录](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/migrations/result-contracts.md)，无旧形态兼容层。
