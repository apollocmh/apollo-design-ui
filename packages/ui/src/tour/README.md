# Tour 实现说明

当前规范见 [AGENTS.md](../../../../AGENTS.md)，公开契约见 [API](./index.zh-CN.md)。早期 rc-tour / antd 参考与 s53 证据保留其来源，不作为当前 Vue 契约的上级规则。

- Tour 的 open/current 保留单一控制来源、接受快照和真实重开规则。列表合法性控制可见性，不污染步骤模型。
- 原生 attrs 经 Trigger 的现有 popupAttrs 接入实际 popup；placeholder 仅承载几何。Mask 使用当前 placeholder 的容器服务，不把带节点参数的函数强转成无参 getter。
- Panel 与 PurePanel 原生转发全部具名槽；默认动作提供稳定组件，支持完整 VNodeChild，普通更新保留子树。每步按钮回调属于数据动作，接收原生事件并支持取消。
- 只在打开期间绑定当前所属文档的 resize/捕获 scroll 和目标/祖先 ResizeObserver；保留 s53 合帧、位置去重及 gap/旋转之外的原有定位服务。关闭和卸载取消帧并注销资源。
- 面板聚焦与关闭恢复复用既有焦点服务，保留目标洞交互，不引入只锁面板的假模态。Esc 尊重 Portal 的 top，方向键归属面板。
- useTourTheme 投影现有组件字段与实际消费的 alias；静态默认 CSS 不变。普通/PurePanel 同时响应 Provider、语言和 Token 替换。
- SVG 洞外矩形使用原生 pointer-events 属性；非模态不锁滚动、不拦截页面。

仍不为无尺寸/滚动信号的纯位置重排添加 DOM 观察器或轮询。Tour 没有公开实例控制 API，静态 PurePanel 不持有导览状态。最终冻结九维、覆盖率与发布消费者验收由仓库统一进行。
