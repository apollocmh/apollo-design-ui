# Button 原生内容与配置整改

2026-10-27，完整范围及证据见[Button 审计](../audit/2026-10-27-button-contract-audit.md)。Button 与关联 Result 尚在统一验收，不因本迁移记录宣称完成。

- `color`、`variant` 可分别设置。每项先取局部显式值，再用 `type`/`danger` 糖（颜色中的 `danger` 低于显式 `color`），再取当前 Provider 配置；没有颜色时 solid 用 primary，其他用 default。ghost 继续把 solid 映射为 outlined。删除动态配置会恢复当前回退值。
- `#icon` 优先于 `icon` 数据；有意空槽不恢复数据回退。`iconPosition` 原有效别名和告警保留，优先使用已有 `iconPlacement`。有效文本图标不再收到 React v4 字符串命名告警。
- 默认槽完整保留，`classNames.content` / `styles.content` 作用于 Button 拥有的 `.apollo-btn-content`。组件不再把语义样式附加到每个业务子节点、不改写中文 children。中文 DOM/可访问名保持连续，视觉字距由 CSS 实现。依赖直接子节点的内部消费者同步迁移到新宿主，不提供旧 DOM 分支。
- 加载请求立即阻止 click 和默认提交，`delay` 只延迟显示。加载链接同时移除 href，保留 link 角色；显式原生 role 仍优先。加载时保留焦点，通过 `aria-busy`/`aria-disabled` 表达状态。SSR 不创建延迟计时器；换加载图标不重新计时；取消或卸载清理。`loading.icon` 的 0、false、null 保留各自内容/有意为空语义。
- `shape="square"` 现在确实显示方角。启用的链接保留原生 `tabindex`；禁用仍移除 href 并强制 -1。
- 现有 45 个显式 Token 及 13 个预设阴影字段接入当前 `theme.components.Button`，根 CSS 变量覆盖仍优先。`solidTextColor` 已有声明补齐准备函数默认值。文档中的 `@apollo-design/ui/button/style/token` 不是包导出；使用现已补齐的根/`button` 入口 `prepareButtonComponentToken` 和 `genButtonStyle`。
- 默认颜色修正包含各色、变体、交互态与四算法。支持相应原生 CSS 色值函数的浏览器提供自动实色前景与彩色文字明度修正；已有前景 Token/原生样式显式覆盖优先。渐变和透明背景按实际上下文配色。浏览器实测范围、回退边界与视觉证据按审计记录，不把函数支持等同全浏览器验证。

2026-10-29 用户反馈修正：primaryColor/dangerColor 的默认 colorTextLightSolid 必须真正消费，普通/悬停/按下保持白字，不能被自动黑白选择覆盖。默认及预设实心色保留自动前景，solidTextColor 不再作为主/危险按钮的隐式前景。相对线性 sRGB 在按钮局部限制主/危险实色背景过高亮度，维持既有 4.5:1 门禁，全局 Alias 不变。显式组件前景与原生变量优先，自定义配色仍需配对。完整范围、复现与本次证据见[前景回归修复](../audit/2026-10-29-button-foreground.md)。无新增 API 或兼容通道。

保留对象式语义 API、现有全部 Props/类型糖、default/icon 两槽、click MouseEvent 和唯一 nativeElement expose。没有新增函数式语义 API、业务加载服务、Button.Group 或新状态。

当前 Provider 方向通过根原生 dir 落地；原生 dir 覆盖及动态移除恢复当前上下文，未配置方向时继承环境。
