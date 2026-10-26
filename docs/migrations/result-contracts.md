# Result开发期公共契约修正

当前版本0.0.0尚未发布。按用户授权、COMPATIBILITY及ADR0007直接修正影响Vue公共用法的形态，无兼容层、弃用期或二次迁移入口。

| 旧行为/写法 | 当前行为/写法 |
|---|---|
| 403/404/500强制插画，忽略#icon及false/null开关 | 任何状态均由存在的#icon优先；空槽不回退，无槽时false/null隐藏默认图形，true/未传恢复默认 |
| 非响应slots缓存，使条件添加/移除槽失效 | 每轮真实Vue渲染读取全部当前槽并各求值一次，完整内容保留；移除才恢复fallback |
| 空正文槽强制留空body | 空文本/注释/空Fragment不生成正文容器，0仍显示；槽被移除的内容按Vue卸载 |
| 根仅保留aria/data，对象展开style | 原生id/tabindex/事件及三种style均归根；普通事件一次触发，native style最终覆盖 |
| setup配置/语义Props快照 | 当前Provider、有效Props、方向和前缀响应替换/删除/恢复 |
| 语义函数运行可用但类型拒绝 | classNames/styles及Provider统一接受对象/当前Props工厂，六落点不改名 |
| 四Token仅静态CSS覆盖 | 当前theme.components.Result和Alias实际消费，原生CSS变量仍最后优先 |
| 默认异常SVG缺装饰语义，副标题浅色对比不足 | 默认异常SVG aria-hidden/focusable明确；自定义槽保持可访问；副标题使用当前colorTextSecondary |
| extra?:never仍生成无用运行时prop | 声明与实现均只保留已有#extra槽，未恢复extra内容函数 |

```vue
<Result :status="status" title="结果">
  <template #icon>
    <MyGraphic />
    <label>备注 <input v-model="draft" /></label>
    <strong>完整内容</strong>
  </template>
  <template #extra><button @click="retry">重试</button></template>
</Result>
```

默认status、数字/字符串异常代码、有效图标开关、静态导出组件身份、插画路径/颜色、CSS变量名称与六语义名称保留。未新增根className别名、业务模型/状态或自动焦点/公告。ConfigProvider配置对象的className/style继续有效，不能按名称删除。

完整源码盘点、失败复现和逐项验收见[本轮报告](../audit/2026-10-27-result-contract-audit.md)与[结构化证据](../audit/evidence/result-contract.json)。此记录不表示本轮或全库验收已经完成；以对应最终证据为准。
