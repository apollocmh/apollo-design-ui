# Collapse 开发版契约迁移（2026-10-29）

依据当前组件规范、ADR0006/0007与完整源码复现，本次直接同步开发版公开树、渲染通道和类型；不新增旧 renderer 兼容层。范围与红灯证据见 [整改单元](../audit/2026-10-29-collapse-contract-audit.md)。

## 模板迁移

原顶层 `:expand-icon="renderIcon"` 改为具名对象 scope 插槽：

```vue
<Collapse :items="items" :heading-level="2">
  <template #expandIcon="{ key, isActive, direction }">
    <span aria-hidden="true">{{ isActive ? '−' : '+' }}</span>
  </template>
</Collapse>
```

scope 为 `{ key: string, isActive: boolean, prefixCls: string, collapsible, direction }`。插槽存在即优先，包括空输出、0、Fragment。程序化默认配置 `components.collapse.expandIcon` 保留；其类型为 CollapseConfig，不与组件 props 混用。旧根 children prop 不消费且已从 CollapseProps 移除；默认 slot 和 items[].children VNode 数据继续支持。

声明式 CollapsePanel 是正式 Vue 组合通道，支持真实生命周期、原生 attrs / DOM 事件和 `@item-click.once`。优先级为 #header 存在 → header 文本 → label VNode 数据。extra 和正文分别使用 #extra / default；items 仍可通过 label、extra、children 提供 VNode 数据。

## 公开 DOM 与键盘

旧 header div 的 role/button 或 tab 结构迁为 header 容器 → heading → 原生 button。accordion 仅限制同时展开数，移除不完整的 tablist/tab/tabpanel 模型。原生 button 拥有 disabled、aria-expanded、aria-controls；稳定 region 的 aria-labelledby 回指按钮。header/title/body/icon 语义区域仍可配置，root 保持原生 attrs 与 ref。旧按 header[role] 查询的消费者应查询原生按钮，或使用语义类。

headingLevel 接受 1–6，默认 3，嵌套默认递增至 6；仅用于正确的文档层级，默认字号/边距已重置。标题内容使用文字、span 等 phrasing 内容，避免嵌套交互控件。独立操作放入 #extra；extra 现在是 heading/button 的兄弟节点，点击、Enter、Space 无需 stop 修饰符。图标置于标题按钮内部；默认/header 模式的 end 图标在标题按钮内部，位于标题后、extra 前；icon 模式的独立图标按钮位于 header 逻辑末端。

Tab、Enter 和真实 Space 由原生按钮负责。icon + showArrow=false 明确禁用并开发告警；不会擅自扩大点击区域。showArrow=true 时空自定义图标仍保留具名按钮。所有结构差异均在原 12 个参考用例的有限清单中列出；原参考 HTML、投影规则和 PNG 不更新。每个受子节点数差异影响的原生子树另有完整结构断言。

## 修复的既有行为

显式与省略 key 混合时，声明式 Panel 的默认编号仍统计全部初次挂载的面板，避免首个显式 key=0 与第二个省略 key 意外共享状态。动态增删、条件重挂或重排应提供稳定显式 key；items 的默认 key 继续为数据下标。

- 每次允许激活只发一次 update:activeKey / change / itemClick；原生 click 保留 MouseEvent，业务 itemClick 仍为 string key。
- defaultActiveKey 只在初始化时复制；受控请求不写入接受状态。解除受控使用最后实际收到的值，拒绝的请求不会重现。
- 默认已渲染正文在完整关闭后保留；destroyOnHidden 只在完成关闭后销毁正文。forceRender=true 始终保留，并优先于 destroyOnHidden。结构 region 保持稳定，正文仍懒挂载。
- 关闭的内容 hidden/inert；拥有正文焦点时移回所属触发器，外部焦点不被抢走。反复切换与快速反向均需组件自身覆盖。
- Panel.disabled 是有效旧禁用输入并告警，显式 collapsible 优先；旧 root destroyInactivePanel / expandIconPosition 别名继续工作。
- native Panel class/style/data/ARIA/DOM 事件、className/headerClass/id、item classNames/styles 均消费。局部语义与全局合并，item.root 只落该 item。
- componentSize、direction、prefix、Provider 对象替换和 motion 读取当前值。Panel.prefixCls 保留；静态 CSS 自身匹配该 Panel，通过变量别名继承所属 Collapse Token。任意前缀仍需预载 CSS。

## 主题与消费者

补充焦点复现：标题先禁用、父级再关闭其正文时，不能将焦点留在 hidden/inert 内容中。此时回退到所属 Collapse 根；默认容器只在持有该焦点期间临时使用 tabindex=-1，blur 时清理，不覆盖用户提供的原生 tabindex。已分别以 JSDOM 和真实浏览器覆盖。

全部十个 CSS 字符串组件 Token 从当前 theme.components.Collapse 投影；borderlessContentBg 从声明到实际背景均贯通。默认 padding/radius 跟随当前 Alias，默认 body 横向 16px 保留。native 根变量优先；显式空 ThemeProvider 恢复默认，sourceActive=false 保留 CSS-only 继承。ghost 保持透明视觉。

ColorPicker 的 ColorPresets 是直接消费者：其 label 包装需使用 span 以适应原生按钮标题；该关联修改由所属消费者 owner 合入，再运行实际消费者验证。Alert content-slots 的既有 #header / #extra / default 组合须保留原实现并回归。独立浏览器、SSR/水合、9 Demo 四主题三视口、严格类型与发布产物检查分别记录；源组通过不等于全库或发布检查通过。
