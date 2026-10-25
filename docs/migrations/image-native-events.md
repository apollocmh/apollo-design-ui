# Image 原生事件与根属性迁移

当前 `0.0.0` 开发版按ADR 0007直接修正，无函数prop兼容通道或弃用期。

Image的click/error现在由typed emits通知，补齐原先被覆盖的keydown；已有update:open通知声明为boolean。使用Vue事件绑定，修饰符、监听器数组和当前监听器替换按Vue处理。h()中的onClick/onError等是标准Vue监听器注册键，导出的ImageProps同名字段也是监听器类型。

```vue
<!-- 旧函数prop绑定 -->
<Image :on-click="handleClick" :on-error="handleError" />
<!-- 当前Vue事件 -->
<Image @click="handleClick" @error.once="handleError" @keydown="handleKey" />
```

click携带原MouseEvent，可预览时先执行内部打开请求，再通知监听器。error只来自原img的Event；Progress/纯占位不挂图片error。keydown携带原KeyboardEvent，监听器先于内置Enter/Space动作，preventDefault可阻止该键盘动作。Progress根只通知click/keydown，不打开潜在预览。

preview=false的原生role/tabindex/aria-label保留；可预览根拥有button/0，显式aria-label优先于alt默认名。内容插槽、原图ref和富节点身份保持。preview.onOpenChange等业务配置不属于此次DOM事件迁移；预览状态及文档所称v-model:open的契约冲突另行记录，不能据typed通知宣称状态绑定已修复。

未发现仓库内需要保留的Image kebab函数prop调用者。范围与实际验证见 [报告](../audit/2026-10-25-image-native-events-remediation.md)。
