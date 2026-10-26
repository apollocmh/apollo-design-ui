# 原生控件颜色（2026-10-26）

开发版的共享样式reset不再为原生`input`、`button`、`select`、`optgroup`、`textarea`设置`color: inherit`。旧规则会把暗色作用域的浅色文字放在浏览器浅色控件背景上，实际按钮只有1.09:1。未自定义的原生控件现在保留浏览器前景/背景配对及禁用颜色，字体、盒模型等归一化保留。

Apollo组件继续由各自的组件CSS声明主题色。消费者显式class/style优先；希望原生控件跟随父级颜色时，明确同时配置前景与背景，例如：

```vue
<button style="color: inherit; background: transparent">保存</button>
```

明暗作用域中的按钮、输入框、选择框、文本域、禁用按钮，与`all: revert`的浏览器参照逐项验证；Apollo Button/Input颜色、模型和多实例也有生产浏览器回归。全库其余组件的完整契约审计仍继续。
