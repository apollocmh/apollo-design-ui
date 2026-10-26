# Statistic / Timer / Countdown契约迁移

适用于当前0.0.0开发版，依据ADR0006/0007直接修正内容与Vue事件/DOM契约；无旧内容函数兼容层、弃用期或双通道。已有有效的valueStyle/Countdown别名按既有兼容政策保留，不新增废弃替代路径。

## 内容与数值

旧formatter函数、无效的false/'number'/'countdown'枚举、#valueRender={node}及Timer的valueRender函数统一改为#value。Statistic作用域为{value,text}，Timer/Countdown另有duration/type，不提供内部VNode。

```vue
<Statistic :value="balance" :precision="2">
  <template #value="{ value, text }">
    <strong>{{ text }}</strong><small>{{ currency }}</small>
  </template>
</Statistic>
<StatisticTimer type="countdown" :value="deadline" @finish="finish">
  <template #value="{ text, duration }">
    <strong>{{ text }}</strong><input v-model="draft" aria-label="Clock draft" />
  </template>
</StatisticTimer>
```

默认格式保留数字字符串的小数、截取/补零与负精度行为；非有限precision忽略，分组符按字面插入。formatTimeStr负时长取0，非有限时长/formatCounter无效日期返回'-'。没有新增动画引擎，原数字动画调用者仍可更新响应式value并在模板格式化。

## 计时、槽与事件

Timer移除原来声明但被内部格式化覆盖的formatter，以及对计时文本无作用的precision/decimalSeparator/groupSeparator；使用format和#value。type现在实时响应；目标或方向变化开始新周期。change改为必需的非负毫秒number，通过Vue @change通知；SSR/无效日期不发出，挂载后立即通知，countdown到0先change(0)再finish一次并停止。format变化不会重启已结束周期。

三个文本槽均优先于同名prop，空槽不回退。Timer/Countdown完整转发所有槽；相邻槽、数值、方向和主题变化保持原生输入与焦点。loading仍卸载正文，恢复后由调用者控制的状态重建。

## Attrs、ref、Provider与类型

普通原生attrs（包括id/tabindex/监听器）归实际根，style支持字符串/数组/对象；不再按React白名单丢弃或展开成字符索引。三个组件均暴露可空nativeElement。当前components.statistic配置、两源Token、RTL和前缀即时生效，原生样式最后覆盖。

具名及Statistic.Timer/Countdown静态导出的类型同步；删除StatisticFormatter，新增StatisticSlots/StatisticValueSlotProps/StatisticTimerSlots/StatisticTimerValueSlotProps。SSR安全、原生槽与计时回归、类型正反例、真实SFC/发布声明和生产浏览器均列入[统一验收清单](../audit/2026-10-27-statistic-contract-audit.md)，具体已验结果以该记录为准。

默认标题从低对比度colorTextDescription改为colorTextSecondary；生产浏览器修前测得3.36:1。默认字号以当前Alias为准，实际fontSizeHeading3为24，准备函数不再另设30的硬编码后备。
