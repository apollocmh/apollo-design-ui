# Mentions 原生监听器迁移

当前 0.0.0 未发布开发版，按 ADR 0007 直接修正，无兼容层、弃用期或废弃函数通道。

公开 `input`、`focus`、`blur`、`keydown`、`keyup`、`pressEnter`、`popupScroll`、`resize`、`clear` 使用 typed emits。前五种监听器不再被内部绑定覆盖或手调 attrs；后三个旧 Function prop 不再声明。载荷保持真实 Event/FocusEvent/KeyboardEvent、尺寸对象和无参 clear。blur 保留浮层焦点协调的延迟，卸载取消待处理回调；内部无事件焦点协调不再向用户发送 undefined 或伪造事件。候选态 Enter 不额外触发 pressEnter。

```vue
<!-- 旧函数 prop -->
<Mentions :on-press-enter="enter" :on-popup-scroll="scroll" :on-resize="resize" />
<!-- 新 Vue 事件 -->
<Mentions @press-enter="enter" @popup-scroll="scroll" @resize="resize"
  @keydown.stop.prevent="keydown" @focus.once="focus" @clear.once="clear" />
```

标准渲染函数 onXxx 注册和 Vue v-on 对象监听器数组支持当前替换及.once；不额外手调回调。原生键盘名称使用 `@keydown` / `@keyup`；MentionsProps 的对应字段是 Vue `onKeydown` / `onKeyup`。候选状态机的标准 key / 旧 which 判定仍需独立复审，本批保证监听器转发，不由此宣称所有键盘交互完成。

另修复带清空/反馈包装时已有根状态类漏传；focused 状态现在落到实际外层根，未添加额外包装DOM。证据见 [专项报告](../audit/2026-10-25-mentions-native-events-remediation.md)。

后续候选状态机的标准 key 与 IME 控制键修正见 [标准键盘记录](mentions-keyboard.md)，完整组合输入与其他内容仍需继续验证。
