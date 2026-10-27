---
category: 数据展示
title: Avatar
subtitle: 头像
---

以图片、图标或字符代表用户或事物。静态头像不进入 Tab 顺序；有操作时由外层原生链接或按钮提供交互。

## 代码演示

十个示例覆盖尺寸/形状、类型、动态字符与留白、徽标、分组、溢出计数、图片失败、隐藏后显示、响应式尺寸及当前组件 Token。`max-count` 的开关控制可见名额是否包含溢出指示器，Group 的 `max.count` 本身始终只计算可见子项。

## Avatar Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| prefixCls | 本组件类名前缀 | `string` | 当前 ConfigProvider |
| shape | 本地形状优先于 Group | `'circle' \| 'square'` | Group → `'circle'` |
| size | 本地尺寸优先于 Group 和全局尺寸；响应式表取当前匹配且已配置的最大断点 | `SizeType \| 'default' \| number \| ScreenSizeMap` | Group → `componentSize` → `'medium'` |
| gap | 默认内容缩放时预留的左右空间，像素 | `number` | `4` |
| src | 字符串图片地址或完整 VNode 数据；图片失败后显示 icon/default | `VNodeChild` | — |
| srcSet | 原生图片 srcset，变化后会重试图片 | `string` | — |
| draggable | 原生图片拖拽属性 | `boolean \| 'true' \| 'false'` | — |
| icon | 图标 VNode 数据 | `VNodeChild` | — |
| alt | 原生图片替代文本；默认装饰图像，需表达身份时填写名称 | `string` | `''` |
| crossOrigin | 原生图片 crossorigin | `'' \| 'anonymous' \| 'use-credentials'` | — |
| beforeFallback | error 事件后同步调用；返回 false 保留失败图片 | `(event: Event) => boolean \| void` | — |

`class`、`style`、`id`、data/ARIA 和其他原生监听器落在稳定的 span 根；style 支持字符串、数组和对象，优先于尺寸、主题和 Provider 样式。文字内容在 SSR 即可见，挂载后随根和内容尺寸变化测量缩放。

## Slots / Events

| 插槽 | 内容 |
|---|---|
| image | 完整图片内容，存在时覆盖 src，包括有意为空的槽 |
| icon | 无图片时的完整图标内容，存在时覆盖 icon 数据，包括空槽 |
| default | 无图片/图标时的字符或完整业务内容 |

| 事件 | 载荷 | 说明 |
|---|---|---|
| click | 原生 `MouseEvent` | 根点击一次发出一次；支持 `.once` 和合并监听器 |
| error | 原生图片 `Event` | 加载失败时一次发出；监听器返回值不控制回退，取消使用 beforeFallback |

## AvatarGroup / Avatar.Group

两个入口指向同一个可安装组件。

| 参数 | 说明 | 类型 |
|---|---|---|
| prefixCls | 组类名前缀 | `string` |
| size | 经当前上下文传给子头像，支持数字、0和响应式表；子头像可覆盖 | `AvatarSize` |
| shape | 经当前上下文传给子头像 | `'circle' \| 'square'` |
| max | `{count?, style?, popover?}`：可见项数、指示器样式和 Popover 配置 | `AvatarGroupMax` |

`max.count` 不包含 `+N` 指示器，0/未设置/负数/非有限数不限量，正小数向下取整。默认槽的直接子项（含展开的 Fragment、忽略注释）参与计数；需要多头像时直接使用 `v-for`。不读取业务组件内部渲染结果。

溢出指示器拥有原生 button。默认保留 hover，同时支持点击和 Enter/Space；Escape 关闭并保留按钮焦点。显式 `focus` 和受控 `max.popover.open` 仍由 Popover 配置控制。`max.popover.content` 可覆盖浮层内容；`classNames` 对象/函数、styles、容器、触发方式和开关回调继续转发，`rootClassName` 是浮层配置类名。默认关闭销毁隐藏内容，可用 `destroyOnHidden:false` 保留内容状态。

组根原生 class/style/attrs 落在 div；两组件只暴露 `nativeElement`（span/div，可空）。没有头像业务 v-model 或额外实例方法。

## Component Token

通过 `ConfigProvider :theme="{components:{Avatar:{…}}}"` 设置当前组件 Token，支持源替换与移除、嵌套 Provider 和四种算法。每个实例与溢出内容读取所属主题；本地 style CSS 变量可覆盖对应根。

| Token | 类型 | 默认来源 |
|---|---|---|
| containerSize / containerSizeLG / containerSizeSM | `number` | controlHeight / controlHeightLG / controlHeightSM |
| textFontSize / textFontSizeLG / textFontSizeSM | `number` | fontSize |
| iconFontSize / iconFontSizeSM | `number` | 平均字号 / fontSize |
| iconFontSizeLG | `number \| string` | fontSizeHeading3 |
| groupSpace | `number` | marginXXS |
| groupOverlapping | `number`，允许负数 | -marginXS |
| groupBorderColor | `string` | colorBorderBg |

开发版事件与 Group 旧别名的直接迁移见 [Avatar 迁移说明](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/migrations/avatar-contracts.md)。
