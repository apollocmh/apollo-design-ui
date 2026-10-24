# Switch 原生事件迁移

2026-10-24，依据用户裁决及 ADR 0007 直接修正 D02，不保留旧回调载荷、适配层或弃用期。

旧 `@click="(checked, event) => ..."` / `onClick(checked, event)` 改为单个原生 `MouseEvent`。需要开关状态时改用 `@change="(checked, event) => ..."` 或 `v-model:checked`，不要从 click 的首参读取布尔值。

```vue
<Switch v-model:checked="checked" @click.stop.prevent="onClick" @change="onChange" />
```

`onClick(event: MouseEvent)` 可访问 `currentTarget`、阻止冒泡与默认行为。`SwitchClickEventHandler` 同步为这一签名，组件 click 为 typed emit；不再手调 attrs 回调。`.once`、监听器数组和替换遵循 Vue 事件行为。

左右方向键使用标准 `event.key`，设置状态并阻止滚动，不合成 click。Space/Enter 由原生 button 激活，不在 keydown 再手动切换。普通/受控模式均只发送一次状态变更。原生根 style 支持字符串、对象和数组，不再按对象展开字符串。

disabled/loading 的真实点击与按钮 `.click()` 由浏览器抑制。显式 `dispatchEvent` 仍派发原生 click 给监听器，但不改变禁用开关状态、不发送 change/update。这是 DOM 派发行为，不是旧结果值回调兼容。
