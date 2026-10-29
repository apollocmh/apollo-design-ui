# Divider 契约修正

适用当前未发布开发版。保留十二 props、默认槽、实际根 ref、安装名、medium/middle、left/right 和 type/orientationMargin deprecated 通道；不增加兼容分支或弃用期。

修正当前槽与 Provider 读取：条件标题插拔、Provider direction/className/style/classNames/styles 的替换/移除立即生效。仍应存在的输入、草稿、焦点和选择不重新挂载。原生 attrs 和 style 的最终优先级保持。

三个 `theme.components.Divider` Token 均生效，不再依赖手动改别名模拟组件覆盖。最近有效 ThemeProvider 不全局注入也可用，显式空 ThemeProvider 复位；空 ConfigProvider theme 仍继承外层来源，使用 inherit: false 复位；没有来源时继续继承用户 CSS。局部组件变量与 11 个别名写在所属根，不修改共享 theme/ConfigProvider。

RTL 在根上反映真实方向；垂直根新增 `aria-orientation="vertical"`，水平根继续使用默认轴。有水平标题时，根保留同一个 div 并使用 group；start rail 是空 separator，end rail 为 aria-hidden 装饰，完整业务输入不再被 separator 包裹（DIV-08 的 nested-interactive 红灯）。无标题/垂直根仍是 separator。历史 DOM JSON 和 React PNG 保留，五个垂直场景仅增加轴属性，24 个标题场景仅改变上述三项语义；零边距样式既有的序列化差异继续精确保留，其它结构/样式差异仍失败。由 ADR 0007 直接修正无障碍错误，不以旧快照要求删除该属性。

`Orientation` 类型仍为 horizontal/vertical。`DividerProps.orientation` 增补已在 API 文档和运行时接受的旧标题位置，继续告警；这是类型通道补齐。原 center 类型负例改为真正非法的 diagonal，并增加旧值正例，保留其它有原因负例。

`dashed=true` 与 `variant=dotted` 组合保留已有类名，但两种有/无标题形态的实际线型统一由 dotted 决定。`orientationMargin` 的无单位十进制字符串（符号/小数亦可）按文档转换为 px；0、单位串、start/end 限制保持。非有限数字不序列化为无效长度。

无需改已有合法写法。新代码优先使用 orientation 设置轴、titlePlacement 设置标题、styles.content.margin 设置精确长度。`genDividerStyle(namespace)` 的参数是 CSS 命名空间，例如 my-app；组件 prefixCls 是完整前缀，例如 my-app-divider。自定义 CSS 仍需预生成和预加载。

实现/测试/九对 Demo/API 的源码验收见 [审计记录](../audit/2026-10-29-divider-contract-audit.md)。发布产物、正式 Apollo 视觉与 Docs 由统一门禁另行记录，不以源码局部通过代替。
