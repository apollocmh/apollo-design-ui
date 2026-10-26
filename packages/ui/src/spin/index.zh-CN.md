---
category: 反馈
title: Spin
subtitle: 加载中
description: 用于页面和区块的加载中状态。
cover: https://mdn.alipayobjects.com/huamei_7uahnr/afts/img/A*5mC5TomY4B0AAAAAAAAAAAAADrJ8AQ/original
coverDark: https://mdn.alipayobjects.com/huamei_7uahnr/afts/img/A*i43_ToFrL8YAAAAAAAAAAAAADrJ8AQ/original
demo:
  cols: 2
---

## 何时使用 {#when-to-use}

显示异步操作的加载状态。spinning由调用者提供，正delay用于延迟出现以减少闪烁；关闭立即生效。

## 代码演示 {#examples}

<code src="./demo/basic.vue">基本用法</code>
<code src="./demo/size.vue">各种大小</code>
<code src="./demo/nested.vue">区块加载</code>
<code src="./demo/description.vue">加载文案</code>
<code src="./demo/delay-and-debounce.vue">延迟显示</code>
<code src="./demo/custom-indicator.vue">原生指示器插槽</code>
<code src="./demo/percent.vue">确定与估算进度</code>
<code src="./demo/style-class.vue">语义化样式</code>
<code src="./demo/fullscreen.vue">全屏与原生输入</code>
<code src="./demo/component-token.vue">动态组件Token</code>

## API

原生class、style、DOM事件和ARIA属性落在正文根元素，支持当前更新；本组件不声明业务emits或v-model。

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| spinning | 当前目标加载状态 | boolean | true |
| delay | 正且有限的毫秒数延迟显示；0、负数和非有限数不延迟 | number | 0 |
| size | 图标大小；middle/default按中号处理，default保留既有告警 | 'small' \| 'medium' \| 'middle' \| 'large' \| 'default' | 'medium' |
| description | 文案；#description存在时优先，数字0可见 | VNodeChild | - |
| fullscreen | 固定全屏覆盖层，正文保持文档流；切换不重挂内容 | boolean | false |
| percent | 未提供为不定进度；显式数字含0显示圆环并钳制到0–100；auto每200ms估算，非有限数为不定进度 | number \| 'auto' | - |
| prefixCls | 当前类名前缀，自定义CSS需预生成/加载 | string | 'apollo-spin' |
| classNames | 语义类名；Provider与本地逐槽拼接 | `SpinSemanticValue<SpinSemanticClassNames>` | - |
| styles | 语义样式；逐槽浅合并，本地优先；函数收到当前合并props | `SpinSemanticValue<SpinSemanticStyles>` | - |
| tip | 既有废弃文案别名，使用description | VNodeChild | - |
| wrapperClassName | 既有废弃包装类名；默认槽存在或全屏时作用于root | string | - |

### 插槽

| 插槽 | 作用域 | 说明 |
|---|---|---|
| default | - | 正文；条件槽新增/移除时使用当前状态 |
| indicator | { percent: number \| undefined } | 完整Vue内容，支持多节点、Fragment和原生控件；显式绑定子组件的percent，不克隆或注入用户VNode |
| description | - | 文案内容；空槽抑制prop且不创建空包装 |

具名槽按存在性优先，有意为空时抑制Provider和默认值。加载关闭时不消费指示器/文案槽。indicator的scope提供当前数值，auto为估算值，undefined表示不定进度。

### Expose与程序化配置

nativeElement为HTMLDivElement或null，指向稳定正文外壳。可通过ConfigProvider的spin配置当前className/style/classNames/styles/indicator；indicator为程序化VNode，保持其原生属性。

Spin.setDefaultIndicator(indicator: VNodeChild)与具名setDefaultIndicator设置模块默认内容；null/undefined重置为内置图标。它不主动调度更新，已挂载实例在下次实际render读取当前默认值。getDefaultIndicator返回当前配置。实例插槽优先于Provider，再使用模块默认值。

## Semantic DOM

| 槽位 | 实际落点 |
|---|---|
| root | 始终承载正文和原生attrs的根div |
| section | 始终为独立加载层；普通、嵌套、全屏切换保持同一节点 |
| indicator | 完整指示器容器，样式同时覆盖自定义内容与可见圆环 |
| description | 非空文案div |
| container | 默认槽正文容器 |
| tip | 既有废弃文案语义别名，使用description |
| mask | 全屏的实际覆盖层，与section为同一元素；关闭时隐藏且inert |

root与section样式各自独立；需要定制遮罩时用styles.mask。普通文案使用正文色，全屏文案有可读背景。内置动画遵守theme.token.motion=false和系统减少动画偏好；自定义内容的动画由调用者配置。

## 主题变量（Design Token）{#design-token}

4个Token从当前theme.components.Spin读取，动态配置、移除和恢复均生效，原生根CSS变量优先。contentHeight限制嵌套加载层最大高度，默认400，不强制正文高度且不限制全屏遮罩。

<ComponentTokenTable component="Spin"></ComponentTokenTable>
