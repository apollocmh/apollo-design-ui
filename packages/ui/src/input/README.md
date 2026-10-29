# Input 实现说明

当前整改单元包含 Input、TextArea、Password、Search、OTP、Group 六个系列。公共行为见中英文 API，迁移见 [Input contracts](../../../../docs/migrations/input-contracts.md)。历史分析及上游快照用于对照；不替代当前 Apollo 契约。

- Input/TextArea 使用 Vue 受控状态与共享 `use-input-value` 组合输入边界。草稿不截断，结束后提交一次；change 保留真实 DOM Event，clear 单独发出 MouseEvent。
- BaseInput 始终保持同一 Vue 节点路径。三个私有宿主在未启用对应布局时使用 display:contents；class/style/hidden 与 nativeElement 仍属于实际逻辑根。直接子代样式须按明确宿主路径路由，Mentions 已同步。
- 内容按存在性处理，保留零值与空插槽；插槽在 render 中读取。清空图标仅 undefined 继续回退。清空/显隐使用具名原生按钮和独立交互目标，不改变输入框自然行盒。
- Password 拥有 password/text 类型与可受控显隐，图标使用 icon 作用域插槽。Search 保留有效 type，公开 Compact 根，自定义按钮合并 disabled/loading 与语义根样式。
- OTP 的部分值同步 model，完整值变化才发 change；受控状态由父值决定。formatter 后按 Unicode 码点限制长度，分隔符使用静态内容或 separator 作用域插槽。
- TextArea 保留现有 autosize 量测签名和生命周期；resize 覆盖非 autosize 情况下的原生/外部尺寸变化，并清理 document 监听。
- 19 个既有 Component Token 消费当前主题/CSS 变量。尺寸优先级与自然下限不变，既有 1075 项浏览器矩阵用于回归；不增加新的尺寸矩阵。

测试分为真实事件/状态回归、语义与主题、原 oracle 的精确 DOM 差异及 Apollo 完整物理节点树、SFC 类型正负例、真实浏览器和发布消费。部分检查通过不代表全库或最终发布验收通过；最终同一提交的门禁记录见本批审计。
