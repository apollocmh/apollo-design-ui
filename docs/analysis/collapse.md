# Collapse（折叠面板）· G1–G3 分析产物

> 步骤 3 的产物先于步骤 5 存在（AGENTS.md §2）。
> 事实来源：antd 6.6.4 `es/collapse/`（Collapse 90 + CollapsePanel 31 + style 289）
> + `@rc-component/collapse@1.2.0`（es/ 619 行：Collapse 55 + Panel 97 +
> PanelContent 33 + useItems 100）。
>
> 依赖替换（registry 已登记）：`@rc-component/collapse` strategy=in-ui ⇒
> `packages/ui/src/collapse/engine/`（单消费者）；动效复用 `@apollo-design/motion`
> 的 `CSSMotion` + `initCollapseMotion`（alert 同范式）。

---

## 1. 组件一句话

手风琴/多开折叠面板：`items`（首选）或 `Collapse.Panel` children（deprecated），
点击 header/箭头切换展开，CSSMotion 做高度过渡（`0 ↔ scrollHeight`）。

## 2. 架构与状态机

```
items | children ──useItems──> Panel 节点（key=String(key??index)、collapsible/destroyOnHidden 逐项覆盖）
activeKey（受控 rawActiveKey / 非受控 defaultActiveKey）⇒ getActiveKeysArray（统一 string[]）
onItemClick(key)：accordion ⇒ [key] 或 []；否则 toggle（filter / concat）
```

- **key 全部转 string**（上游注释：`String(rawKey ?? index)`）——activeKey 匹配、
  onChange 回调都是 string[]。
- **collapsible 覆盖链**：item.collapsible ?? Collapse.collapsible；
  `'disabled'` ⇒ 点击被吞（onItemClick 直接 return）。
- **onItemClick 双通道**：全局 onItemClick + item.onItemClick（rc 的 item 字段；
  antd 的 items 面板里不暴露，但 children 形态的 Panel 上有 onItemClick？——
  antd CollapsePanelProps 无 onItemClick，children 形态的 childOnItemClick 来自
  rc Panel props。保留通道）。

## 3. DOM 契约（rc Panel + PanelContent 逐行）

```
div.{p}-collapse [-icon-placement-start|end] [-borderless] [-rtl] [-ghost] [-large|-small]
                  role=accordion?'tablist':undefined        ← + pickAttrs({aria,data})
 └─ div.{p}-collapse-item [-active] [-disabled]  [+用户 className]
     ├─ div.{p}-collapse-header [-collapsible-{collapsible}] [+headerClass]
     │    ├─ (showArrow) div.{p}-collapse-expand-icon [+classNames.icon]
     │    │     [collapsible∈{header,icon} ⇒ 可交互: role/aria-expanded/aria-disabled/tabindex]
     │    │     > 展开图标（默认 RightOutlined，rotate: active?(rtl?-90:90):undefined，
     │    │       可交互时 aria-label=expanded|collapsed，否则 aria-hidden）
     │    ├─ span.{p}-collapse-title [collapsible==='header' ⇒ 可交互 props] > header
     │    └─ (extra) div.{p}-collapse-extra > extra
     └─ CSSMotion(visible=isActive, motionName={root}-motion-collapse, motionAppear=false,
                 leavedClassName={p}-collapse-panel-hidden, removeOnLeave=destroyOnHidden,
                 forceRender, hooks=initCollapseMotion(rootPrefixCls))
        └─ div.{p}-collapse-panel [-active|-inactive] [motion 类] role=accordion?'tabpanel'
            └─ div.{p}-collapse-body [+classNames.body, styles.body] > children
```

- **PanelContent 惰性渲染**：`rendered` 一经 `isActive||forceRender` 置 true 后
  **不再回收**（折叠后仍渲染，靠 motion 收起）——`destroyOnHidden` ⇒ leave 后卸载。
- **可交互位置**：`collapsible ∈ {header, icon}` ⇒ 可点击/键盘（Enter）区域分别在
  整个 header 或仅图标上；`undefined` ⇒ header 整体可点（collapsibleProps 落 header）；
  `'disabled'` ⇒ aria-disabled + tabindex -1 + 点击吞。
- **openMotion**：`initCollapseMotion(rootPrefixCls)`（motion 包 preset：
  motionName=`{root}-motion-collapse`，height/opacity hooks，motionDeadline 500）+
  `motionAppear:false` + `leavedClassName={p}-collapse-panel-hidden`。
- attrs：`pickAttrs(props, {aria, data})` 落根 div。

## 4. Props / Events

Collapse：`items`（首选）/ children(deprecated)、`activeKey`/`defaultActiveKey`、
`accordion`、`onChange(string[])`、`bordered(true)`、`ghost`、`size(middle)`、
`expandIcon(fn)`、`expandIconPlacement(start)|expandIconPosition(deprecated)`、
`collapsible`、`destroyOnHidden|destroyInactivePanel(deprecated)`、语义槽
`{root,header,title,body,icon}`。
Panel（Collapse.Panel / items 项）：`key、header|label、className/style、showArrow(true)、
forceRender、extra、collapsible、destroyOnHidden、itemClassNames/styles`。
deprecated：`destroyInactivePanel`、`expandIconPosition`、`disabled`（Panel）。

## 5. 样式契约（10 个 Component Token）

| Token | 值 |
|---|---|
| headerPadding | `paddingSM padding` |
| headerPaddingSM | `paddingXS paddingSM paddingXS paddingXS` |
| headerPaddingLG | `padding paddingLG padding padding` |
| headerBg | `colorFillAlter` |
| contentPadding | `padding 16px`（固定值 16） |
| contentPaddingSM | `paddingSM` |
| contentPaddingLG | `paddingLG` |
| contentBg | `colorBgContainer` |
| borderlessContentPadding | `paddingXXS 16px padding` |
| borderlessContentBg | `transparent` |

派生：`collapsePanelBorderRadius = borderRadiusLG`（mergeToken）。
五段：genBaseStyle / genBorderlessStyle / genGhostStyle / genArrowStyle（rtl 箭头
rotate180）/ **genCollapseMotion**（`{root}-motion-collapse`：overflow hidden +
height/opacity transition !important，挂在 `.{p}-collapse` 下 —— antd 用 `antCls`
前缀，本仓 `.{rootPrefixCls}-motion-collapse`）。
别名 token 走 var()；padding 组合串是**构建期解析值**（含固定 16px，D50 同判）。

## 6. Vue API 设计（INTENDED）

| # | 差异 | 分类 |
|---|---|---|
| I1 | `items` 首选；`Collapse.Panel` children 保留（deprecated 警告同 antd） | — |
| I2 | `onChange` ⇒ `change` emit；Panel 的 deprecated `disabled` ⇒ 告警 | INTENDED |
| I3 | `ref` ⇒ `expose({ nativeElement })` | INTENDED |
| I4 | expandIcon fn 返回 VNodeChild；默认 RightOutlined rotate | — |
| I5 | CSSMotion 函数插槽（alert 同范式）；supportMotion 在测试里显式传 | — |

## 7. 测试策略

- L4 oracle（SSR）：basic / items / accordion(role=tablist+tab+tabpanel) /
  borderless / ghost / size-small+large / icon-placement-end / rtl / semantic /
  destroyOnHidden(收起面板 removeOnLeave=false ⇒ -panel-hidden 残骸)。
- L1：activeKey 状态机（受控/非受控/accordion toggle/key string 化）、collapsible
  四态、PanelContent 惰性渲染、deprecated×3、onChange、expandIcon 定制、extra。
- L6：3 variant × 3 viewport。
