# Input 六系列契约迁移

本轮以当前源码完整盘点 Input、TextArea、Password、Search、OTP、Group 的 142 个原有 Props 和 60 条关联轴。按 ADR0006/0007 直接修复无效接口、事件及内容渲染链；19 个已有尺寸 token 和自然行盒契约继续有效。

## 需要迁移的用法

| 原用法 | 当前用法 | 原因 |
| --- | --- | --- |
| Password 的 iconRender(visible) | `<template #icon="{ visible }">…</template>` | 顶层内容渲染函数迁移为具名作用域插槽，保留 visible 状态 |
| OTP 的 separator(index) 函数 | `<template #separator="{ index }">…</template>` | 静态 separator 仍接受 VNode 数据和零值；动态内容由 Vue 模板声明 |
| Password 的 type | 移除该字段，由 visibilityToggle/visible 控制 password 或 text | 原接口已声明但被覆盖，无法产生有效行为 |
| change.type === 'click' 判断清空 | 监听 clear(MouseEvent) | change 使用实际编辑器派发的真实事件；不再伪造 detached target/currentTarget |
| 依赖 OTP 仅在填满时更新 model | 用 change 处理完整验证码，model 保存部分输入 | input(cells) 与部分 model 每次编辑同步，完整 change 继续去重 |
| 依赖 Search.nativeElement 指向编辑器 | 编辑器使用 input，容器使用 nativeElement | nativeElement 指向实际 Compact 根，root 样式、hidden 和 data attrs 与其一致 |
| 用 $el/第一个子节点定位 Input 编辑器 | 使用公开 input / resizableTextArea.textArea / nativeElement | 稳定宿主使动态插槽、clear、count、addon 开关保留编辑器身份、选区和焦点 |

普通输入的 model/change 在每次有效输入时同步；IME 保留草稿，在组合结束后提交一次，紧随的原生 input 不重复提交。原生 input 监听器仍能收到组合期间事件。事件支持 Vue 监听器数组与 once；键盘和组合监听器指向实际 DOM。

清空先写实际 DOM 和 model，再发 clear，随后在实际编辑器派发 input 并触发 change。disabled、readOnly、空值及 allowClear.disabled 使用真实按钮禁用与处理守卫。图标回退只跳过 undefined，null/false/0 是显式内容；对象未给图标时仍能使用独立 clearIcon 或 Provider 图标。默认名称来自当前 global.clear，未提供或空文本时回到现有默认语言数据。Password 名称继续使用 global.show/hide。

Search 的 type 可继续使用，默认 search。自定义 native Button 保留自身 disabled，并受 loading/disabled 搜索守卫约束；普通 VNode、数组和零值由可键盘操作的按钮承载。自定义组件需转发收到的 attrs、disabled、loading 状态。前后缀插槽传递给 Input，空插槽覆盖 prop。

嵌套 count/showCount formatter 属于既有配置接口，本轮继续支持 VNode 与零值。count.max=0 是显式上限；count.show=undefined 不覆盖显式 showCount。TextArea 的 maxLength、方向和原生鼠标监听实际生效，非 autoSize 的原生/外部 resize 返回编辑器外框尺寸。

## 物理 DOM 与关联样式

BaseInput 的私有宿主路径为 group → wrapper → affix → editor。宿主以 data-apollo-input-host 标识，未启用相应布局时为 display:contents；启用时原 group/affix 类、样式及逻辑根职责保留。原生按钮有至少 24px 的独立交互区域；负向块轴 margin 保留已接受的输入框自然尺寸。

Mentions 同时消费 BaseInput 和 RcTextArea。新增宿主曾使其直系 textarea 选择器失效，真实浏览器复现为 260px 外层中的 169px 编辑区、原生边框和 resize。InternalMentions 也保留固定的私有 div，裸输入时承担原逻辑根，有清空/反馈时使用 display:contents，避免从 div 切到 Fragment 导致 textarea 重挂。选择器精确覆盖这两条实际路径及三个 Input 宿主，包含 pseudo/disabled/suffix，恢复编辑区填满 258px 内框、零边框、禁止 resize；suffix 为至少 24px 的清空按钮留位。没有保留不可达的旧直系路径作为兼容。键盘清空后焦点返回实际 textarea。

父 SFC 的 scope ID 沿 Vue 实际根 VNode 链转发至逻辑根，在非根边界停止；Mentions 将这些属性路由至自己的根，从 textarea attrs 中摘除。实际 SFC 的 peer 隔离、非根祖先隔离、SSR 首屏属性/样式与 hydration、反复开关 clear/反馈均保留原编辑器和 ref。

FormItem 使用 cloneVNode 保留 ref 的原始 owner、指令、key 与 scope 信息，并保留完整的动态 props 更新。监听器由 Vue mergeProps 合成，数组和 once 各执行一次。同一次输入的 model/change 通知只收集和校验一次，getValueFromEvent 接收实际 change Event；只发 model 的控件在微任务中收集，同步多次更新保留各次通知和最后值，Field 卸载取消未执行的收集。

原 React oracle 不改写。Input 40、Mentions 20、Transfer 搜索 2、Form 20 个场景逐条记录物理差异；原 exact diff 断言仍执行。由于树形差异比较在子节点数量不同处会停止递归，另以完整 Apollo 物理节点树检查所有后代、属性和 class，按各场景原有的 keepStyle 策略检查 style。Form 的原策略不保留 style，其实际宽度、错误色、feedback 和 label/value/clear/校验链另有浏览器覆盖。没有 unwrap 或通用忽略包装节点。已有 Button 内容宿主也保留完整覆盖。

## 验收边界

完整清单、原始失败及当前源码检查由本批审计记录。局部源码/浏览器通过不等于最终发布门禁通过；最终同一提交的严格构建、发布正负例、双 CSS 模式尺寸、文档及全库检查由本批统一验收。


2026-10-29 整合视觉验收补充：Input 与 TextArea 的计数字样使用当前 `colorTextSecondary`，清除按钮默认也使用该可读前景；显式语义样式仍覆盖默认值。解决原默认白底上计数和自定义文字清除图标对比度不足，不改变事件、模型或 DOM。保留原生按钮焦点与点击区域，亮/暗/紧凑视觉场景继续执行完整 axe。

超额输入的文字前景同时保留当前错误色，并与当前正文色混合以保证默认亮/暗主题可读；边框、状态语义和超额值均保留。24 个现有 Demo 的说明文字改用当前可读 Token，显式 TextArea 语义样式示例也随当前主题取色。四主题实际浏览器对普通值和超额值继续执行同一 axe 检查。
