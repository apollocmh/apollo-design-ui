# Divider 实现说明

现行契约见双语 API、仓库六份规范与 [本轮审计](../../../../docs/audit/2026-10-29-divider-contract-audit.md)。本组件使用 Vue SFC、原生默认槽、当前 ConfigProvider 视图与 ThemeContext，单一 div 根保持原生 attrs 和实际 ref。

十二 props 保留；无业务 emits/v-model 或子组件。orientation/vertical/type 的优先级和未传 vertical 与 false 的区别保持，两个 deprecated props 仍工作。Orientation 类型仍仅描述轴，DividerProps.orientation 同时接受已经文档化的旧标题位置；medium/middle、left/right 均保留。

默认槽在 render 中读取，包含完整 Vue 内容。语义回调通过 computed 获取当前有效轴/位置/尺寸，Provider 整体替换与移除不冻结旧值。根样式顺序为当前主题变量、Provider/本地语义区域、原生 style；最后一项优先。

三个组件 Token 在静态 CSS 中声明局部默认值，useDividerTheme 消费当前有效来源并写入所属根。比例为有限的 0～1，数字长度补 px。无来源时保留 CSS 继承，显式空 ThemeProvider 复位；空 ConfigProvider theme 仍继承外层来源。共享主题包不反向依赖 UI，也不需要为 Divider 新建全局组件 Token 管线。自定义前缀继续由消费者预加载 CSS。

RTL 方向落在真实根，垂直 separator 声明轴；有标题的 dotted 与无标题 dotted 一致。默认外观和几何保留，不以旧上游的错误形态定义新行为。

九对 Demo 包含完整正文、原生滑块/选择框和条件标题输入。保留 53 个历史 DOM 场景及 24 张 React 参考 PNG；这些是有日期的证据，不能冒充本轮 Apollo 自有视觉批准。对应行为变化、类型影响和精确差异见 [迁移记录](../../../../docs/migrations/divider-contracts.md)。

源码实现与源码验证、发布产物、正式视觉及 Docs 验收分别报告；没有当前证据时不宣称全部通过。
