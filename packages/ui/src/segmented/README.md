# Segmented 实现说明

当前公共契约见 [中文 API](./index.zh-CN.md) / [English API](./index.en-US.md)。保留原 23 场景 DOM 基线和既有键盘、Demo、无障碍、主题测试；历史上游对照是证据，不再决定 Vue 的回调或 DOM 形态。

- 选项是数据驱动的原生 label/radio，label 和 icon 使用完整 VNodeChild；不存在顶层内容回调或不消费的插槽。
- value 的受控接受/拒绝/撤控复用 useControlledValue。初始化与之后的动态 options 分开；原生 change 后同步实际 checked，防止被拒绝的提议留在 DOM。
- update:value / change / keydown 由 Vue emits 拥有。原生 attrs 落实际根，完整 style 最后合并；没有 attrs 回调副通道。
- 每组自动 name 独立，radio 提交实际字符串值。唯一 Tab 入口在可用 radio，方向键处理当前 RTL、禁用、原生取消、输入法和被接受的焦点。
- 语义输入通过真实 SegmentedProps 求值，样式使用 CSSProperties；Provider 的禁用、尺寸、方向和语义配置读取当前值。
- 原有八个 Component Token 按当前主题投影到根，trackPadding 支持数字或长度字符串；不增加 Token 或运行时样式表。
- MotionThumb 保持“测量 → 新 appear → 收尾”的职责，使用 post-flush watch、owned motionStart/motionEnd、每次动画的新身份及过期结束隔离。选项/布局变动取消旧几何；卸载释放由现有 Motion 管理的帧与监听，不重写共享帧算法。

开发期直接修正：onChange 从手调 attrs 迁到 change emits；根 tabindex=0 迁为单一原生 radio 入口；旧 unknown 内容与 Record 样式类型改为实际 Vue 内容与 CSSProperties。没有兼容通道。原参考树保留；新增原生行为、真实 SFC 正负类型例和真实浏览器回归覆盖这些差额。

架构阶段使用相关核心、类型和必要浏览器检查；最终九维仍在同一冻结整库版本执行，不以局部通过冒充全库验收。
