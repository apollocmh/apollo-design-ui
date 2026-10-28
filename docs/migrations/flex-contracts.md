# Flex 当前 Vue 契约修正（0.0.0 开发阶段）

本轮保留九个 props、Flex/default/AFlex、零组件 Token、四个预设 gap 名和无业务 emits/v-model 的 API。按现行组件规范及 ADR0007 修正错误的状态/DOM 所有权，不新增旧形态兼容层或弃用期。

| 旧行为 | 当前行为与迁移 |
|---|---|
| Provider 替换 class/style/vertical/direction/getPrefixCls 后可能停在初始值 | 当前配置生效；移除后回落。无需重挂 Flex |
| 显式 align=stretch 被默认逻辑清除；横向实际 stretch 与公开顶部对齐承诺冲突 | 全部 align 值有效；横向默认 flex-start，纵向默认 stretch。需要横向拉伸的调用方明确写 `align="stretch"` |
| 原生 dir 与 Provider RTL 类冲突 | 显式 dir 优先；移除后回落当前 Provider。保留 RTL 类并增加有实际语义的 dir |
| component 是 Vue 组件时 nativeElement 返回组件实例 | 返回其实际单一 HTMLElement。不要再用 Flex ref 访问子组件方法；Fragment/文本/非 HTML 宿主返回 null |
| :empty 隐藏带原生属性、尺寸或可访问名称的根 | 空根保持 display:flex；需隐藏时使用调用方的 v-if、v-show 或 native style，不根据插槽内容真假偷偷隐藏宿主 |
| ThemeProvider 没有全局注入 CSS 时预设 gap 忽略当前 tokens | 所属 Flex 根解析三个 gap alias，含 SSR/动态与嵌套复位。全局 document 不写变量 |
| FlexSlot 返回 unknown，掩盖无效普通对象 | 类型收窄到完整 VNodeChild；普通对象应改为真实 VNode、文本或模板 |
| Demo 共享 radio 标签、条件滑块无名称、固定宽/外链素材 | 六例保留，有独立标签、响应式本地业务示例和实际原生键盘操作 |

原生根 style 仍接受字符串/对象/数组，合并顺序为 Theme aliases → Provider style → native style → 派生 flex/gap；外观变化不更换宿主或业务子项。动态切 component 按 Vue 正常创建其新宿主，不承诺在不同标签间保留同一个 DOM。

原始 DOM/React PNG 参考不改。新增源码回归、真实浏览器/水合、严格 consumer 预备与 Apollo 视觉状态输入交主线程执行发布和最终同提交验收；局部验证不等于全库通过。实际命令和计数持续记录于对应 [审计](../audit/2026-10-29-flex-contract-audit.md)。
