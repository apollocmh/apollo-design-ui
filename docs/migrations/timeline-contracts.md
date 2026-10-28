# Timeline 当前原生契约修正

适用：未发布开发版 `0.0.0`，2026-10-28。本轮保留 Timeline、ATimeline 注册名、items、三个原生条目槽、合理数据别名和六 Token。错误原生事件/DOM 按 ADR0007 直接修正，无兼容层、无弃用期；不恢复已移除的 Timeline.Item 或 React 内容函数通道。

## 原生事件、方向与 ref

以前 `@change` 经 attrs 传给 Steps 后，被其业务 `onChange(index)` 吞并；条目因而带 button 角色和 tabindex，输入冒泡 change 无法到达原生根监听器。现在 attrs 经私有 `rootAttrs` 通道直达 `<ol>`，`@change` 得到 DOM Event，`@click`、动态监听器替换/移除和 `.once` 遵循 Vue DOM 规则。Timeline 仍为被动列表，无 emits/v-model；公开 Steps 的 `onChange(current)` 不变。

```vue
<Timeline :items="items" @change="onNativeChange">
  <template #itemContent="{ item }"><input :name="String(item.key)" /></template>
</Timeline>
```

以前横向 Timeline 在 xs 断点会被内部 Steps 自动改为纵向，同时保留 horizontal 样式类。现在 `orientation="horizontal"` 在所有视口宽度下保持显式方向。需要自适应方向的业务可绑定自己的响应式 orientation。

以前 `nativeElement` 解析整个 Steps 实例时先命中其数字 current prop，得到 null。现在直接解析 Steps 的实际根元素，挂载后得到 `<ol>`，数据/主题/方向更新保持根身份，卸载清空父 ref，重挂得到新根。

## 数据与空内容

旧 `position: 'left'/'right'` 以前生成没有配套 CSS 的 placement-left/right；现在分别归一为 start/end。显式 placement 继续优先。所有 label/children/dot 数据别名仍保留，仅在新字段 nullish 时回退。

以前 loading 以真值判断 icon，0/false/空字符串被替换为 spinner；现在这些都是显式内容。`icon: 0` 显示数字零，false/空字符串抑制默认加载图标；未提供/null 的 icon 和 dot 才使用 spinner。空 itemIcon 槽继续覆盖数据与默认图标。

以前 pending=0 丢条目。现在 false/null/undefined 关闭；0/空字符串创建合成 pending 项，true 只显示指示器。合成项 key 避让显式业务 key，反转和反复开关不再与数字 key 冲突；没有伪造源 item 槽作用域。

项级 classNames/styles 的 subtitle 类型入口从未有渲染落点，现从类型中移除；组件级 itemSubtitle 原本已不支持。需要额外标题内容时放在 `#itemTitle` 中；现有 root/wrapper/header/title/section/content/icon/rail 落点保留。

## 当前主题与六 Token

以前只有静态默认 CSS，ConfigProvider 的 `theme.components.Timeline` 不生效。现在当前 default/dark/compact/组合算法、嵌套配置与六 Token 响应式生效，尺寸数字转为 px，零有效，非法负数/非有限值回退。dotSize/dotBg 未设置时保持原有内部回退，删除覆盖后恢复。多实例隔离。

同时修正三条实际 CSS 消费链：dotBorderWidth 连接 Steps 实际读取的 icon-border-width；dotSize 的局部覆盖优先级包含 active 末项；itemPaddingBottom 应用于全部纵向条目。普通无标题纵向列表以前沿用 Steps 的 12px padding 和最小高度，现在使用已声明的默认 20px 间距及内容自然高度；有标题的两栏布局保留原有规则。最终自有视觉需审阅这一有依据的差异，不修改历史参考图或放宽阈值。

```vue
<ConfigProvider :theme="{ components: { Timeline: {
  tailColor: '#91caff', tailWidth: 3, dotBorderWidth: 3,
  dotSize: 14, dotBg: '#e6f4ff', itemPaddingBottom: 28,
} } }">
  <Timeline :items="items" />
</ConfigProvider>
```

根样式按当前主题 → Provider/组件语义 root → 原生 style 合并；已有 CSS 变量入口保留。任意自定义 prefixCls 配套静态 CSS 仍属于共享 D04，本轮不宣称解决。

## 验证

成组红灯、完整清单及本轮实际命令见[审计](../audit/2026-10-28-timeline-contract-audit.md)。源码单元/DOM/axe/主题/类型及 source-browser 先局部验证；发布产物、Docs 和最终 Apollo 视觉由主线程在同一最终提交统一验收，不能将本页当作已完成这些门禁。
