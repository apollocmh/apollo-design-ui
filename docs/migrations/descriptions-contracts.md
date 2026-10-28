# Descriptions / DescriptionsItem 契约迁移

适用版本：未发布的 `0.0.0` 开发阶段。依据 COMPONENT-RULES、COMPATIBILITY、ADR0006/0007 直接修正无效内容通道和妨碍 Vue 内容身份的 DOM；没有旧错误树形态/函数 prop 兼容层，也没有弃用期。既有 `size="default"`、labelStyle/contentStyle 和 Item.className 别名仍保留。

## 模板内容和原生归属

旧 Demo 的 `<Descriptions extra="操作" />` 没有实际内容消费。改用：

```vue
<Descriptions title="订单详情">
  <template #extra><button type="button">操作</button></template>
  <DescriptionsItem id="account" class="account" :style="[{ padding: '4px' }, 'width:100%']">
    <template #label><strong>账户</strong><span>名称</span></template>
    <input aria-label="账户名称" value="Apollo" />
  </DescriptionsItem>
</Descriptions>
```

Item 的 class/style/id/data/ARIA/tabindex/原生监听器现在落在所属项 div，`#label` 和默认槽完整消费多节点/注释/Fragment/0。槽存在则优先，刻意空槽抑制后备。根标题空字符串和空额外槽不再产生空壳。数据记录 `items[].label/children` 的 VNodeChild 能力保留；`items`（包括 `[]`）始终优先且跳过默认槽。

DescriptionsProps 中从未有运行时声明/消费的 children 删除；模板使用默认槽。extra 已迁移为具名槽，删除残留 never 类型占位。不新增旧 prop 通道。Item 文本 label prop 保留，富内容可以直接用 #label，无须改为程序化数据。

## 稳定内容树与样式落点

旧横向普通/边框/垂直的 table/tr/th/td 分支会在换列、业务项跨行以及布局切换时重挂内容，销毁控件草稿和焦点。现在使用单一 `dl > div > dt/dd`。CSS Grid/Subgrid 只改变排版；每项 DOM 读取顺序始终为标签后跟内容，垂直模式也不把所有标签放在内容之前。

根 div、现有 label/content/header/title/extra 语义类名和六区域 API 保留。label/content 在所有布局中固定落在 dt/dd，Item 的 classNames 现在实际消费。依赖 table/tr/th/td 或旧 item-container 的选择器改用语义类名或 `classNames/styles`；不提供 table 兼容分支。内部 data-row/data-span 与几何 CSS 变量是测试证据，不作为新增公共 API。

给动态数据/Item 提供稳定业务 key，换列、span、重排、bordered/layout 切换会保留 Vue 实例、原生节点和未受控值；原地重排后仅在焦点仍归属于同一内容时恢复它，不夺取外部控件焦点。移除的项正常卸载，重新出现是新实例。

分组规则保持：每行最后一项填满剩余列位；filled 填满当前行剩余列位并结束这一行，不另起一行。4 项/3 列为 `[1,1,1]` / `[3]`，A(1)、B(filled)、C(1) 为 `[1,2]` / `[3]`。数字列数/跨度向下取整；非有限值/小于 1 分别回退到 3/1，避免非法几何。响应式映射在 SSR 未激活断点时采用原有 3/1 回退，挂载后更新。

## 配置、类型和 Token

语义回调运行时一直传 `{ props }`；原声明却写成裸 DescriptionsProps 并用强制断言绕过。类型现统一为：

```ts
const classNames: DescriptionsProps['classNames'] = ({ props }) => ({
  label: props.size === 'small' ? 'small-label' : 'label',
});
```

回调读取当前有效 size/column。Provider 样式优先级现为 Provider → 组件 → Item，修正此前 Provider 覆盖显式组件样式的反向顺序。Provider 根 style 现在消费；根原生 Vue style 最后覆盖。Item 局部旧样式 alias 在父组件新样式之后、Item 新 styles 之前，既有四级覆盖顺序保留。

新增导出类型 DescriptionsConfig / DescriptionsSlots / DescriptionsItemProps / DescriptionsItemSlots / DescriptionsSemanticInfo；它们描述现有/修复后的 Vue API，不引入业务 emits、v-model 或额外 expose。DescriptionsRef 仍只有 nativeElement，指向实际根并在卸载后清空。

10 个 Component Token 现在全部接通当前 theme.components.Descriptions，支持动态覆盖/移除、暗色、紧凑与嵌套。bordered 的颜色和内边距也实际消费同一组 Token。默认 labelColor 使用可读的 colorTextSecondary；bordered 的默认横向 padding 使用声明的 itemPaddingEnd（padding），修正旧实现绕过它使用 paddingLG。titleMarginBottom 跟随当前 fontSizeSM × lineHeightSM，不再固定在构建期默认值。显式 Token 优先于 medium/small 的默认尺寸间距。模板原生 style 支持字符串、对象和数组。

自定义 prefixCls 继续改变 DOM 命名；任意前缀的 CSS 由使用方提供（已有共享 D04），本轮不新增运行时 CSS。Grid/Subgrid 需要现代浏览器。

## 验证与边界

失败证据 `/tmp/apollo-descriptions-red.log`（新增 7 组全部红灯）先于实现。当前复验命令与结果见 [整改报告](../audit/2026-10-28-descriptions-contract-audit.md)。F08、#31 和全部 18 个参考场景保留；参考 DOM/HTML/PNG 未修改，精确差异在 `packages/ui/src/descriptions/__tests__/contract-differences.ts`，另有每个场景的原生成对语义断言和真实 Chrome 焦点/选区/主题/axe 覆盖。

发布产物、消费端类型/SSR、Docs 与 Apollo 自有视觉候选由主线程在集成后的同一提交统一验证；本单元不写 dist，不把源码通过宣称为全库或已发布产物通过。

接续验收保留全部 13 个原 Demo；custom-label 的问号改为有名称的原生按钮，hover 和键盘聚焦都能打开同一 Tooltip，图标为装饰。它不改变 Descriptions 公共 API。原 Demo 的四主题与实际交互见 `tests/browser/descriptions-demo-themes.mjs`。

源码检查默认采用源码 JS/CSS；主线程构建就绪后，将 `DESCRIPTIONS_SOURCE=0` 同时用于 `tests/browser/descriptions-contracts.mjs`、`descriptions-hydration.mjs`、`descriptions-demo-themes.mjs` 和 `descriptions-visual.mjs`。发布模式加载公开的 theme/tokens.css、ui/style.css 和 dist JS，构建时拒绝组件/样式源码，浏览器断言不存在源码 CSS 注入。`descriptions-visual.mjs` 是 17 状态三宽度的功能预检；正式 Apollo 候选与批准仍走共享视觉流程。
