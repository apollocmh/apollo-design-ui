---
category: 导航
title: Anchor
subtitle: 锚点
---

# Anchor 锚点

使用原生链接展示目录，并根据实际滚动容器中的小节位置更新高亮。支持 items 数据和 Vue 默认槽组合，两者共享同一滚动、指示条及 Affix 链。

```vue
<Anchor :get-container="() => scrollArea" :affix="false" @click="onClick" @change="onChange">
  <AnchorLink href="#intro">
    <template #title><strong>介绍</strong></template>
    <AnchorLink href="#details" title="详情" />
  </AnchorLink>
</Anchor>
```

## Anchor Props

| Prop | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| items | 递归链接数据；存在默认槽时由槽覆盖，空槽也会有意盖住数据 | AnchorLinkItemProps[] | — |
| direction | 导航排列方向 | vertical \| horizontal | vertical |
| offsetTop | Affix 顶部偏移及 wrapper 最大高度计算，也作为滚动偏移后备 | number | — |
| bounds | 当前位置命中容差 | number | 5 |
| targetOffset | 滚动落点及当前位置检测偏移，优先于 offsetTop | number | — |
| affix | 是否使用 Affix；对象配置保留动态 offsetBottom/prefixCls | boolean \| AnchorAffixConfig | true |
| showInkInFixed | 非 Affix 模式仍显示指示条 | boolean | false |
| getContainer | 当前实际滚动容器；未传依次取 Provider.getTargetContainer 和 window | () => HTMLElement \| Window \| null \| undefined | — |
| getCurrentAnchor | 纯高亮映射，接收原始 href，移除后恢复原始值；不改事件载荷 | (activeLink: string) => string | — |
| replace | 使用 replaceState；单条链接配置优先 | boolean | false |
| prefixCls | 当前组件前缀，也作为 Link 的默认前缀 | string | apollo-anchor |
| classNames | root/item/itemTitle/indicator 语义类名，或接收 { props } 的函数 | AnchorSemanticClassNames \| function | — |
| styles | 同名语义样式，使用 Vue CSSProperties，或接收 { props } 的函数 | AnchorSemanticStyles \| function | — |

getContainer 返回空值表示 pending，清除旧滚动监听和活动检测，不回退 window。响应式模板 ref、Provider 替换和偏移变化均重新同步当前链路。

## 所属事件

| 组件/事件 | 载荷 | 说明 |
| --- | --- | --- |
| Anchor change | currentActiveLink: string | 原始 href；映射仅影响高亮，不改该载荷 |
| Anchor click | event: MouseEvent, link: AnchorLinkInfo | 选择、滚动及历史记录操作前通知 |
| AnchorLink click | event: MouseEvent, link: AnchorLinkInfo | 当前链接的同一原生事件，先于 Anchor 汇总通知 |

`link` 包含 `{ href, title }`，title 保留完整内容。任意 click 监听器调用 `preventDefault()` 都会取消默认选择、滚动与历史操作。只通过 emits 通知，不重复手调同名监听器；模板用 `@click`/`@change`，程序调用仍使用自然的 onClick/onChange listener。

修饰键、非主按钮、download、新浏览上下文及真正外链保持浏览器原生路径。普通同页片段使用所属文档解析，支持鼠标和原生 Enter 激活；不会引入额外箭头键或焦点模型。显式 replace 对同页片段使用 replaceState，对普通外部 URL 保留 location.replace 行为。

## 数据项、Link 与插槽

| 数据字段 | 说明 |
| --- | --- |
| key | items 中必需的 string/number 业务 key |
| href | 必需的原生链接地址 |
| title | items 中必需的 VNodeChild，支持 0、空值、数组和组件节点 |
| target | 原生 a.target |
| className | 数据项及 Link 的既有 item 类名 |
| replace | 覆盖 Anchor 的历史替换配置 |
| targetOffset | 单条滚动与检测偏移，优先于组件偏移 |
| prefixCls | 单条 Link 的显式前缀 |
| children | 仅 items 数据使用的递归子项；水平导航不渲染嵌套项 |

AnchorLink（也可使用 Anchor.Link）的 href 必需，title 数据可选，以支持原生 #title。没有 children prop，子链接通过默认槽表达。

| 组件/槽 | 职责 |
| --- | --- |
| Anchor default | 合法 Vue 链接组合，存在即优先于 items；条件空槽不会退回数据 |
| AnchorLink title | 实际 a 的完整内容，存在即覆盖 title 数据，含空槽和 0 |
| AnchorLink default | 嵌套子链接，沿用垂直导航职责 |

Anchor 与 Link 没有公开实例控制 API，不新增 v-model。Affix 保留自己的 change 与 updatePosition 职责。

## 原生 attrs、Provider 与 Token

Anchor 原生 attrs/class/style 落实际 wrapper（不落外层 Affix），合并 Provider → 当前组件语义样式 → 原生 attrs。Link 的 class/style/data/id 等既有根 attrs 保留在 item wrapper；aria-*、tabindex、focus/keyboard 原生监听落可操作的 a。活跃链接默认带 `aria-current="location"`。条件内容、同 key 数据替换与配置变化保留原节点和焦点。

当前 Provider 的前缀、方向、组件配置与主题动态生效。Link 默认继承 Anchor 当前前缀，显式 Link 前缀仍优先；方向通过原生 dir 消费，逻辑 CSS 随之更新。两个组件 Token 是 linkPaddingBlock（默认 paddingXXS）和 linkPaddingInlineStart（默认 padding），投影到实际消费层；替换、撤除和显式 0 均可用，既有全局别名继续参与派生。

## 资源与迁移

监听只在挂载后存在；滚动动画在新目标、配置变更、换容器和卸载时取消。链接注册按实例归属，重复 href 的一个实例移除不会删除其它实例。指示条跟随当前方向、内容与真实尺寸更新，观察和帧在卸载释放；SSR 不启动浏览器副作用。没有新增无信号位置轮询、路由适配或受控高亮模型。

onClick/onChange 迁为 owned emits；删除关于“多参数不能 emits”的旧判断。默认槽不再因上游习惯发弃用告警；原 children 伪 prop 使用默认槽，内容使用 #title。自定义 Anchor 前缀现在同时控制 Link 默认类名，以保证指示条链一致。历史 DOM 参考保留，只精确登记这条前缀及原生 dir 差异。

## Demo

basic、horizontal、onChange、onClick、replace、target-offset、target-offset-per-link、customize-highlight、static、style-class、component-token、bounds。组件 Token Demo 使用真实 ConfigProvider.components.Anchor。
