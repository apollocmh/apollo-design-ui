# Apollo Design Menu 专项故障审计与修复验收单

- 审计基线：`apollocmh/apollo-design-ui` / `master` / `827e957abc6642971785bc1ec7bb486461d6838c`（核对时间：2026-10-22）
- 输入证据：用户提供 `horizontal.png` 与 `api-fixed-trigger.png` 两张截图；本次读取 Menu、SubMenu、MenuItem、MenuItemGroup、Layout.Sider、Demo 配置源码，及 Ant Design / rc-menu 的上游公开源码。
- 证据等级：**A**＝截图与源码共同确认；**B**＝源码确认存在实现缺陷，实际症状需浏览器回归；**C**＝需要先复现验证。
- **特别说明**：本轮未实际运行本仓 Playwright 或发布构建，严禁把静态源码审计说成浏览器已验收通过。

## A. 故障定位矩阵

| 编号 | 等级 | 证据 | 现象 / 直接根因 | 修复目标 |
| --- | --- | --- | --- | --- |
| M-01 | P0/A | `menu/demo/sider-current.vue` + `layout/style/sider.ts` | API 表格上的深蓝色固定折叠条源于该 Demo 的 `Layout.Sider` 默认 `.apollo-layout-sider-trigger {position:fixed;bottom:0;width:200px}`；普通内联 Demo 不能隔离浏览器级定位 | 该 Demo 使用独立 iframe `preview.mode: viewport`；保留 Sider 原生 fixed 语义；父站任何滚动位置均不得出现示例触发器 |
| M-02 | P0/A | `menu/demo/horizontal.vue` + `MenuItemGroup.ts` | 在水平根级放置 `type:'group'`，其子 `ul` 直接参与页面布局，导致“Navigation Four”及 Item 9/10 排成第二行；上游 antd 的水平示例将 group 放在 SubMenu.children 中 | 修改 Demo 层级使水平顶栏只有同层导航项，群组在悬浮 SubMenu 内 |
| M-03 | P0/B | `menu/SubMenu.ts` ~240–269, ~456–461 | 同一个 `onTitleMouseEnter/Leave` 在 inline 也启动 hover 开/关定时器；挂在 title 和外层 li 两处；移动到内嵌子项时 title mouseleave 可能定时关闭，导致自动收起、点击不稳 | inline 只通过 click/keyboard 展开，hover 不修改 openKeys；popup 模式继续支持 hover/click；删除重复绑定并避免竞争 |
| M-04 | P1/B | `menu/MenuItem.ts` ~190–218；`menu/SubMenu.ts` ~320–380 | MenuItem 的 DOM 排列先 title 后 icon；SubMenu title 完全不渲染 `props.icon`，与 antd 与用户截图均不符 | 一级及嵌套菜单图标在文字前；缩进、collapsed、RTL、无图标退化正常 |
| M-05 | P1/B | `Menu.ts` 声明 `getPopupContainer` + `SubMenu.ts` ~383–395 固定 `Teleport to:body` | 公共 API 声明了可指定弹层容器，却没有被实现；在嵌套布局、滚动容器、Demo 内可能跨越边界 | 接通容器 API；默认 body / 自定义容器两路径几何正确 |
| M-06 | P1/B | `SubMenu.ts` ~150–226；`interface.ts` + `Menu.ts.renderNode` | 弹层位置只通过 `getBoundingClientRect` + page offset + 双 rAF；缺视口翻转与边界避让；`popupOffset/popupStyle` 被类型声明却没有传至 SubMenu | 复用项目已有 `_internal/trigger.ts`、position、portal、motion 机制；实现滚动/resize、翻转、offset、容器和生命周期 |
| M-07 | P1/B | `SubMenu.ts` ~382–434 | Popup 和 inline 子菜单依 `open.value` 直接 mount/unmount；没有退出动画生命周期；样式表存在 keyframes 但未被消费 | 使用 CSSMotion/Trigger 管理进出及延迟卸载；快速开关无闪烁残留 |
| M-08 | P1/B | `Menu.ts` ~535–603 | `const overflowIndex = ref(0)` 声明在组件 render 函数内部，每次渲染重置，引入横向 overflow 状态不一致风险 | 挪入 setup 或用稳定计算来源，验证 resize、展开关闭后的溢出项、无抖动 |
| M-09 | P1/A | `menu/demo/submenu-theme.vue` + 上游 `components/menu/demo/submenu-theme.tsx` | 本仓 demo 是 dark `inline`，没有 Switch、没有 `items[].theme`，也没有自定义 popup container；实际未演示“子菜单独立主题”，和 antd 原始用例不同 | 先检查 `SubMenuType.theme`、下传主题链路与 ConfigProvider；实现后恢复真实 vertical + Switch demo；不可支持则显式标记不支持，禁止假示例 |
| M-10 | P2/A | `menu/demo/*.md` | 大量 zh-CN 填英文标题、en-US 填中文描述；用户切换语言仍错位 | 双语完整正确且 Demo 可见文案有明确同步策略 |

## B. 根因及改法（不要只改 CSS）

### B1. Inline hover 开合冲突（先改）

仓库的 `SubMenu.ts` 在 title 与外层 li 上同时绑定开关处理函数，而且只判断 `ctx.triggerSubMenuAction === 'hover'`，没有判断 mode。真实用户路径“展开 sub1 → 移动到 Option 1 → 点击”会先触发 title leave 的 100ms 关闭计时器：如果用户在计时器到期前没点中，子节点就被销毁。另有 li 的进入事件会重复开启，造成抖动。

建议核心判据：

```ts
const canHoverToggle = () => ctx.mode.value !== 'inline' && ctx.triggerSubMenuAction === 'hover';
// onTitleMouseEnter/Leave: 只在 canHoverToggle() 时设置 openTimer/closeTimer
// onPopupMouseLeave: 只在 popup 模式对 hover 触发关闭
// onInternalTitleClick: inline 模式必须点击切换；非 inline 遵从 click 策略
// title 与 li 的 enter/leave 语义分开：li 只维护 active/childrenActive，不重复设置开关计时器
```

Ant Design 上游 `@rc-component/menu` 的 `SubMenu/index.tsx` 明确：`onPopupVisibleChange` 仅在 `mode !== 'inline'` 时修改展开状态；`onInternalTitleClick` 仅 inline 时 toggle。以这些状态机判据为行为规格，不要求逐字移植 React 代码。

### B2. Horizontal Group 层级

`horizontal.vue` 顶级 `type: 'group'` 必须移到 `key:'sub'` 的 `children` 内。第四顶级项应恢复普通链接/菜单项。修复后截图第一行只有导航项，不存在 Item 9/10 第二行。不要为了掩盖错误把 `.item-group ul` 强制 `display:none`。

### B3. Sider 示例泄漏到文档 API

`Layout.Sider` 真实页面的 fixed 底部 trigger 是合理的；错在把 `sider-current` 作为 inline Demo 挂载。为 `packages/ui/src/menu/demo/sider-current.md` 添加 frontmatter：

```yaml
---
title:
  zh-CN: 与 Layout.Sider 联动
  en-US: With Layout.Sider
preview:
  mode: viewport
  viewportHeight: 340
  scrollable: true
---
```

注意按文档解析器真实 frontmatter 规范处理，不要双重 frontmatter；确认 iframe 基础样式、主题、语言正确，Sider trigger 限于 iframe 的 viewport；先不改核心 Sider fixed 定位。

### B4. 图标、定位与动效

- `MenuItem.ts` 的 `h('span', title...)` 出现在 `mergedItemIcon` 之前，顺序颠倒；`SubMenu.ts` 渲染标题时根本没有创建 `props.icon` 节点。先在相同 semantic CSS 下修 DOM 顺序和 icon，验证布局/RTL/collapsed。
- `Menu.ts` 的 `getPopupContainer` 未传递到 `SubMenu.ts`；后者写死 `Teleport` 到 `body`。`SubMenuType` 的 `popupOffset` / `popupStyle` 也未被 renderNode 正式转发。按上游契约打通。
- 当前定位策略没有翻转与碰撞，双 rAF 无法代替 ResizeObserver、滚动容器事件和放置引擎。先复用仓库现有的 `_internal/trigger.ts` + `@apollo-design/position` + `@apollo-design/motion` + portal，不要新写另一套简化版定位器。
- 退出动画要求关闭后节点保留至 leave 完成（或截止期限），之后卸载；不可在 `open=false` 同帧直接删除。

## C. 必须新增的 Chromium Playwright 场景

1. Inline：首次鼠标移入不会改变 `openKeys`；点击父标题开启；鼠标以正常速度从 title 移至 Option 1，等待 > 150ms 后仍可点击；点击后 `selectedKeys=['1']` 且高亮持续；再次点击父标题才收起。
2. Inline 快速交互：200ms 内开关多次，最终 openKeys 与 `aria-expanded` 一致，无计时器逆转状态；通过 Enter / Space 展开与激活时行为符合约定。
3. submenu-theme：与 antd 的 vertical + Switch + 指定 popup 容器对照，证明只子菜单的主题切换；如未支持该 API，不能用普通 dark Menu 冒充通过。
4. Horizontal：所有顶层导航同一行；group 仅出现在 popup 内；菜单图标在标签前；指针从根级菜单移动至二级和三级 menu，无提前关闭，点击后 selected 状态正确。
5. Popup 定位：顶边/右边/滚动容器内/iframe 中，记录触发节点与 popup 的 boundingClientRect；打开后滚动和 resize 位置保持符合预期；多层 popup 相互不遮挡；验证 RTL 和自定义 getPopupContainer。
6. 退出动画：从 `open=true` 切到 false 后，在 leave 动画期间应存在退出节点，完成后移除；连续快速 hover 不留下残余节点，非 `display:none` 硬切。
7. 横向 overflow：把 viewport 改成 1440→390→768→1440，记录可见项、更多菜单项目与顺序；重渲染不会重置逻辑索引或丢失菜单项。
8. sider-current：滚动文档直到 API，父文档内 `.apollo-layout-sider-trigger` 数量为 0；iframe 内可找到、可点击；切换菜单折叠后无跨站点悬浮条。
9. 站点中英文：菜单的 Demo title、description、常用按钮可见文案与当前 locale 一致。

验收产物应含：**每个场景的录像/失败截图 + 错误前的可重复步骤 + 断言与实际结果 + 单独提交 SHA**。截图需固定 viewport、浏览器版本与页面缩放，避免环境差异掩盖异常。

## D. 分阶段交付（严格依赖）

- **M0（基线，不改实现）**：保存用户截图、当前 master SHA；浏览器运行完整 14 个 Menu Demo，逐项记录交互、position、openKeys/selectedKeys、控制台错误；新增“当前失败”的最小复现测试。
- **M1（P0）**：修 inline 计时器状态机、水平 Menu 演示数据、Sider Demo 隔离。每项独立提交；复验 3 个用户截图场景。
- **M2（P1）**：按上游 SubMenu DOM 补图标 + 复用 Trigger 和 Motion 解决 popup 几何与进出；不要只加 `z-index` 或另造绝对定位公式。
- **M3（P1）**：修 overflow render 内 ref、子菜单独立主题 API 与 Demo；审计通用 Menu 属性落实情况。
- **M4（验收）**：全部 14 个 Menu Demo 真实浏览器验证；将关键行为纳入 Docs CI 阻塞门禁；对照 Ant Design 6.6.x 的行为与视觉；发布前提供未解决差异表。

## E. 强制防止假完成

- 不准把“测试通过”替代“实际鼠标在网页里能操作”。
- 不准把 antd 示例名称/文件数量对应当成功能覆盖。
- 不准因为 `L6 0.000% exact` 就声称视觉对齐；静态快照未覆盖正在展开或离场的状态。
- 不准用 `overflow:hidden`、隐藏组子项、`display:none`、禁用 hover、禁用动画等方式伪装修复；模式下符合预期的 hover 仍须保留。
- 不准为了 Demo 单独修改 Menu 核心的 public API 语义；必要时把 Demo 改为 isolated iframe。
- 不准修改全部组件或大规模重构文档站；只修 Menu 及必要的基础设施。

源文件：
- https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/menu/Menu.ts
- https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/menu/SubMenu.ts
- https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/menu/MenuItem.ts
- https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/menu/demo/horizontal.vue
- https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/menu/demo/sider-current.vue
- https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/layout/style/sider.ts
- https://github.com/ant-design/ant-design/blob/master/components/menu/demo/horizontal.tsx
- https://github.com/ant-design/ant-design/blob/master/components/menu/demo/submenu-theme.tsx
- https://github.com/react-component/menu/blob/master/src/SubMenu/index.tsx
