# Mentions 标准键盘事件

当前未发布开发版直接修正候选状态机：使用原生 `KeyboardEvent.key`，移除 `which` 数字控制路径。标准箭头、Enter、Escape 在浏览器、测试和脚本合成事件中保持一致；旧数字与key矛盾时以key为准，不保留数字适配层或弃用期。

```ts
// 旧的人工测试事件
new KeyboardEvent('keydown', { which: 13 });
// 标准事件
new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
```

旧6处只传which的方向键/关闭/loading/选中/当前值测试已逐项核对，改用标准key，保留原断言；新增key-only、冲突which和IME回归。已有同时提供key/which的调用仍按标准key执行，无需适配。

`isComposing` 为真时，候选状态机不处理方向键或Enter，不阻止默认动作；公开keydown仍收到原事件。没有改变原生input期间的值更新或组合文本搜索策略，也未由此宣称完整IME验收。见 [专项报告](../audit/2026-10-25-mentions-keyboard-remediation.md)。
