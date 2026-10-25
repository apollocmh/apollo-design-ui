# Mentions 浮层内容迁移

适用当前未发布开发版，按 ADR 0006 / 0007 直接移除 popupRender 函数 prop，无运行时兼容层或弃用期。

旧写法通过 `:popup-render="menu => h(...)"` 传递渲染函数。新写法使用单个具名对象作用域，默认菜单为真实 VNode：

```vue
<Mentions v-model:value="value" :options="options" aria-label="Mention editor">
  <template v-if="customize" #popupRender="{ originNode }">
    <section>
      <header>{{ header }}</header>
      <component :is="originNode" />
    </section>
  </template>
</Mentions>
```

导出 MentionsSlots / MentionsPopupRenderSlotProps。作用域仅有 originNode，不使用位置参数；插槽返回 VNodeChild，允许显式空内容。槽存在时采用其结果，移除槽才恢复默认菜单；标题与候选数据更新都从当前 render 进入菜单。默认菜单的键盘导航、选择与编辑器焦点保留。

Mentions → 包装层 → InternalMentions → KeywordTrigger 均按当前函数转发。最后一层在 render 中创建菜单并求值槽，向共享Trigger传VNode数据，避免它的缓存watch在render外调用Vue插槽。三个旧函数prop声明与通道移除。filterOption、validateSearch与业务回调保留；未改变候选数据或旧default选项协议。

现有popupRender示例改为原生模板，采用Apollo CSS变量并提供textarea可访问名，因此删除该示例旧label豁免；未放宽无障碍断言或改参考基线。范围与命令见 [专项报告](../audit/2026-10-25-mentions-popup-slot-remediation.md)。
