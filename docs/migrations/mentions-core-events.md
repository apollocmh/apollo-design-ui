# Mentions 核心事件迁移

适用于当前 0.0.0 未发布开发版，按 ADR 0007 直接修正，无兼容层或弃用期。

`change`、`select`、`search` 从 Function prop 改为 typed emits。载荷分别仍是字符串、`(option, prefix)` 与 `(text, prefix)`，`v-model:value` 名称不变。原生 DOM change/select 不再误触发语义事件或耗尽 `.once`；移除重复 input 处理后，一次输入只发送一次 model/change。

```vue
<!-- 旧：函数 prop -->
<Mentions :on-change="handleChange" :on-search="handleSearch" :on-select="handleSelect" />
<!-- 新：Vue 事件 -->
<Mentions @change="handleChange" @search="handleSearch" @select="handleSelect" />
```

渲染函数 `h(Mentions, { onChange, onSearch, onSelect })` 仍是 Vue 标准监听器注册，支持监听器数组和替换；公开 MentionsProps 中这些 onXxx 字段描述监听器签名。不是额外保留的函数 prop 通道。异步搜索 Demo 和多前缀 Demo 已同步迁移。filterOption / validateSearch 是有返回值的业务函数，保留。

本批只处理这三个语义事件及重复 input；focus/blur、pressEnter、popupScroll、resize、clear 和键盘监听仍另行复审。回归与检查见 [专项报告](../audit/2026-10-25-mentions-core-events-remediation.md)。
