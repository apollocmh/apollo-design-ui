# Steps 原生作用域槽与内联提示修正

2026-10-25，按 ADR0006/0007 完整连接现有四个原生槽的组件声明与渲染链。iconRender/itemRender/itemWrapperRender/progressDot继续使用单个具名对象，载荷字段见公开API；StepsSlots函数返回值由unknown明确为Vue VNodeChild，无函数prop兼容层或弃用期。

```vue
<Steps :items="items" type="inline">
  <template #iconRender="{ index, active }"><b>{{ index + 1 }} · {{ active }}</b></template>
  <template #itemWrapperRender="{ itemNode }"><div><component :is="itemNode" /></div></template>
  <template #itemRender="{ itemNode }"><component :is="itemNode" /></template>
</Steps>
<Steps :items="items" type="dot">
  <template #progressDot="{ index, status }"><span>{{ index + 1 }} · {{ status }}</span></template>
</Steps>
```

明确移除从未被消费的StepsSlots.default类型成员；用items数据与上述具名槽替代无效默认内容声明。没有保留空声明或增加兼容层。空原生槽覆盖默认节点，移除恢复默认；自定义wrapper负责其额外结构的样式。

内联模式的正文现在默认通过Tooltip的原生title槽显示，不再依赖用户额外提供itemRender才能启用。传了itemRender时，itemNode中的Tooltip默认槽捕获真正的原节点，避免闭包返回Tooltip自身造成递归挂载。正文VNode数据、数字与已有description数据别名沿同一路径进入title槽，不以强制断言传给仅接受字符串的title prop。

新增原生模板示例；既有自定义点示例改为直接span模板，不要求h函数。旧桥接中的never/unknown断言由真实槽类型、可渲染节点变量与类型化provide/inject替代，原生scope可由vue-tsc验证。
