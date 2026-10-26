# Spin原生内容、进度和主题（开发版直接修正）

Spin的3个槽在render中读取。`#indicator`保留所有Vue节点，按存在性优先；有意为空时不回退到Provider或默认图。旧indicator prop已在此前移除，本次修正文档和失效Demo，不恢复该字段。

作用域为单对象，进度通过模板显式传给子组件；不再克隆首个VNode并注入隐藏class/style/percent：

```vue
<Spin :percent="42">
  <template #indicator="{ percent }">
    <MySpinner :percent="percent" />
    <span>{{ percent }}%</span>
  </template>
</Spin>
```

`classNames.indicator/styles.indicator`现在落在完整指示器容器，可同时作用于自定义内容和内置圆环。用户子节点的原生属性保持原样。`section`始终是独立加载层，`styles.section`不再与普通模式的root混在一起；根外壳使用`classNames.root/styles.root`或原生class/style。普通、嵌套、全屏切换不改变section和其原生内容的父级；`mask`仍为实际全屏覆盖层。

进度未提供时显示不定加载。显式数字包含0，首个客户端/SSR render即输出确定进度与可访问名称；圆环值钳制到0–100，非有限数回到不定进度。`auto`从0开始估算。需要不定四点图时省略percent。无正delay时Vue更新即呈现，不再额外等待一个模拟React effect的宏任务；正delay防闪、关闭立即取消及卸载清理保留。

已有4个Token现在真实消费当前`theme.components.Spin`。`dotSize/dotSizeSM/dotSizeLG`控制对应尺寸；`contentHeight`明确为嵌套加载层最大高度，默认400，不限制正文高度或全屏遮罩。最近Spin拥有自己的尺寸与busy容器，嵌套实例不再吃外层尺寸。内置动画遵守`motion: false`与系统减少动画偏好。

程序化Provider指示器及`setDefaultIndicator(VNodeChild)`同样使用原生内容；字符串和0有效，null/undefined恢复内置图。setter不主动调度更新，已挂载实例在下一次实际render读取新值。模板中需要逐实例进度时使用`#indicator`。
