# 2026-10-22 Menu / Message / Notification 动效专项审计整改报告

- 审计基线：`master @ 827e957abc6642971785bc1ec7bb486461d6838c`
- 输入：`docs/issues/001-menu-master-专项故障审计.md`、`docs/issues/002-message-notification-动效专项审计.md`
- 参考实现：antd **6.6.4** 产物（`node_modules/antd`）与钉住的 `@rc-component/menu@1.5.0`、
  `@rc-component/notification@2.0.8`、`@rc-component/trigger@3.10.1`
- 真实浏览器：系统 Chrome（Playwright `channel: chrome`）+ 文档站 dev/preview；
  逐项截图由 `packages/docs/tests/{menu-browser,notification-motion-browser}.mjs` 复现
- 原则：先复现、再改底层；**没有用 Demo CSS、延长 timeout、隐藏节点或 `display:none` 掩盖问题**

---

## 1. 结论摘要

| 报告 | 条目 | 核实结论 | 处置 |
|---|---|---|---|
| Menu | M-01 Sider fixed trigger 泄漏到 API 表格 | ✅ 真缺陷（截图 + 浏览器 rect） | Demo 改 `preview.mode: viewport`；父页面 trigger 数 0 |
| Menu | M-02 水平顶层 group 排成第二行 | ✅ 真缺陷（Demo 数据与上游不一致） | 按 antd 6.6.4 demo 重排数据；group 只进 SubMenu popup |
| Menu | M-03 inline hover 计时器误关 | ✅ 真缺陷（浏览器复现） | inline 不参与 hover；title / li 事件语义分离 |
| Menu | M-04 图标顺序错误 / SubMenu 无 icon | ✅ 真缺陷（DOM 顺序） | icon 移到标题前；SubMenu 补 icon + itemIcon |
| Menu | M-05 `getPopupContainer` 未接通 | ✅ 真缺陷 | 接通 prop + ConfigProvider 回退 |
| Menu | M-06 手写定位、无翻转 / 滚动跟随 | ✅ 真缺陷（实测偏移 140px） | 复用 `_internal/trigger` + position；补 window scroll 与视口外跳过 |
| Menu | M-07 popup 无退出动画 | ✅ 真缺陷（50ms 内消失） | Trigger + CSSMotion；实测 `zoom-big-leave` → `-hidden` |
| Menu | M-08 `overflowIndex` 声明在 render 内 | ✅ 真缺陷（每次渲染重置） | 移到 setup；390/768/1440 往返无丢项 |
| Menu | M-09 submenu-theme Demo 名不副实 | ✅ 真缺陷 | 补 `SubMenuType.theme` + 上游同款 vertical/Switch/ getPopupContainer Demo |
| Menu | M-10 Demo 中英文错位 | ✅ 真缺陷（14 个 md） | 全部补双语 frontmatter + 描述 |
| Notification | MN-01 hover 事件绑在 list 根 | ❌ **对照钉住版本不成立** | 未改；见 §3 |
| Notification | MN-02 Notice 卸载无 hover 清理 | ❌ **对照钉住版本不成立** | 未改；见 §3 |
| Notification | MN-03 尺寸 ref 每轮重建 | ✅ 真缺陷（Vue 特有） | 按 key 稳定 ref + ResizeObserver 重测 |
| Notification | MN-04 motion 配置被截断 | ✅ 真缺陷 | 白名单完整透传 MotionList |
| Notification | MN-05 500ms deadline 与 transition 结束 | ✅ 已核实无异常（事件先到） | 保留兜底；浏览器门禁采样真实结束路径 |
| Notification | MN-06 缺少真实动效门禁 | ✅ 覆盖不足 | 新增 21 项 Chromium 门禁并接入 Docs CI |

---

## 2. Menu 修复细节

### M-03 inline hover（根因）

`SubMenu.ts` 原先在 title 的 `mouseenter/mouseleave` 上无条件启动 100ms 开/关计时器，
只看 `triggerSubMenuAction === 'hover'`，不看 mode；同时外层 `li` 也绑了同一组函数。
真实指针路径「展开 sub1 → 移到 Option 1」会触发 title `mouseleave`，100ms 后
`openKeys` 被移除 ⇒ 子项从 DOM 消失。浏览器实测：移动到子项 250ms 后
`aria-expanded=false`。

修复：`canHoverToggle()` 增加 `mode !== 'inline'` 与 `!overflowDisabled`；
title 只负责 active / hover 计时器，`li` 只负责 `childrenActive` 与用户回调。
回归：`menu/__tests__/audit-2026-10-22.test.ts` + 浏览器门禁 M-03。

### M-04 图标顺序

上游 antd `MenuItem` 的 children 顺序是 **icon → title-content**（`cloneElement(icon)`
作为第一个 child）；`SubMenu` 的 title 是 **icon → title-content → arrow**。
本仓原先 title 在前、且 SubMenu 完全不渲染 `icon`，导致
`.apollo-menu-item-icon + span` 的 margin 规则永不命中。

修复：按上游顺序渲染；同时补 `itemIcon` 直通、`inheritAttrs: false` 防止
class 在根 li 上重复应用（语义 L4 用例抓到的重复类名）。

### M-05 / M-06 / M-07 弹层

- `SubMenu` 删除手写 `getBoundingClientRect + 双 rAF + style.visibility`，改用
  `_internal/trigger`：portal / position / flip / motion 全部复用。
- `getPopupContainer` 从 `Menu` context 下发（props 优先，回退
  `useComponentConfig('menu')` / ConfigProvider）。
- 修复 Trigger 的两个共享缺口：
  1. **window scroll 未注册**：上游 `useWatch.js` 的 `mergedList` 显式包含 `win`；
     本仓只挂了 `collectScroller()`，而 `html/body` 的 overflow 是 visible ⇒
     整页滚动不重新对齐。
  2. **视口外对齐污染翻转记忆**：页面加载时视口外的 trigger 也会跑 `alignPopup`，
     写入粘滞的 `flip.bt`；滚入视口后弹层永久偏移。实测偏移 **140px = popup 180 −
     title 40**。修复为「目标矩形完全在可视区外 ⇒ 不产生对齐结果」，滚入后再对齐。
- 回归：`_internal/__tests__/trigger.test.ts`（window scroll 注册/注销、
  `isTargetOutsideArea` 穷举）、浏览器门禁 M-06/M-07。

### M-08 / M-09 / M-10

- `overflowIndex` 移到 setup：横向 390 → 768 → 1440 往返，顶层四项无丢失/重复，
  「更多」弹层包含被省略项的原始顺序。
- `SubMenuType.theme` + popup wrapper 的 `{menuPrefix}-{theme}` 类；浏览器实测
  light ↔ dark 只切子菜单弹层，根菜单主题不变。
- 14 个 `menu/demo/*.md` 全部补 `title.zh-CN / title.en-US` 与双语描述；
  `sider-current` 增加 `preview.mode: viewport, viewportHeight: 340, scrollable: true`；
  两个 horizontal Demo 增加 `preview.size/span: full`。

---

## 3. Notification：MN-01 / MN-02 为何不修

报告引用的是 `react-component/notification` **master**，而本仓库钉住的是
antd 6.6.4 实际依赖的 **`@rc-component/notification@2.0.8`**。逐字核对：

| 报告主张 | 2.0.8 源码事实 |
|---|---|
| 上游把 `onMouseEnter/Leave` 传给 `<Content>` | `NotificationList/index.js` 把事件绑在**外层 list div**（与报告描述的「本地」一致） |
| 上游 `destroy()` 在 hovering 时调用 `onInternalMouseLeave` | `Notification.js` 只有计时器 effect，**没有** hover 卸载清理；`destroy` 位于 `useNotification.js` 的队列层 |

真实浏览器复现（5 条 → hover 展开 → 点击关闭最新一条 → 指针不动 → 移出）：
余 4 条、`stack-expanded` 在指针移出后正确移除、无 hover 卡死、无重复 index / 0 高度。
因此**不以「未来上游 master」为判据修改已钉住的 6.6.4 行为**；这条场景已固化进
`notification-motion-browser.mjs`，防止未来回归。

> 说明：列表根自身 `pointer-events: none`，通知卡片 `pointer-events: auto`；
> 因此 hover 的实际命中区就是真实卡片区域，并不存在报告担心的「撑满视口」。
> 这也是「把事件下沉到 Content」会改变现有等价行为的原因。

---

## 4. Notification 实际修复

### MN-03 尺寸测量通道

Vue 的函数 ref 在每次渲染重建时，patch 会先以 `null` 调用旧 ref、再以元素调用新 ref
⇒ `sizeMap` 被「先删后测」，过渡帧里总高/偏移瞬态归零。上游用
`useCallback([setNodeSize, strKey])` 保持引用稳定。

修复：
- 按 key 缓存函数 ref（`getNoticeRef`），重渲染不再触发 `null`；
- 增加 `ResizeObserver`，仅在元素 border-box 变化时重测（同 key 文案变高/换行时
  `--notification-y` 能跟上）。这是优于上游的 INTENDED 差异，登记为
  `COMPATIBILITY.md` D138。

回归：`notification/__tests__/audit-ref-stability.test.ts`（重渲染不得收到
`(key, null)` + RO 触发重测）。

### MN-04 motion 配置

原来只传 `motionName` + 固定 `motionDeadline: 500`。现在按 MotionList 的 prop schema
白名单透传 `motionAppear/Enter/Leave/LeaveImmediately/Deadline/removeOnLeave/
forceRender/leavedClassName/hooks/supportMotion`，内核控制字段
（`keys/component/onAllRemoved`）仍由 `NoticeList` 掌握。

回归：`notification/__tests__/audit-motion-config.test.ts`。

### MN-05 结束路径

浏览器实测离场收到真实的 `transitionend`，移除发生在 **277ms**（< 450ms），
不是 500ms deadline 兜底；因此保留 500ms 仅作为「样式表未加载 / 事件丢失」兜底，
不修改 CSS 时长。门禁会持续断言「离场 class 出现 + <450ms 移除 + 收到 transitionend」。

---

## 5. 验证记录（真实输出摘要）

| 门禁 | 结果 |
|---|---|
| `menu-browser.mjs`（生产 preview） | **28/28**（水平一行/图标顺序/group 只在 popup/ inline 不误关/弹层几何/滚动跟随/离场动画/getPopupContainer/主题/iframe/overflow/中英文） |
| `notification-motion-browser.mjs`（生产 preview） | **21/21**（appear/leave 时间线/transitionend/4 条折叠/hover 展开/移出收起/hover 关闭/同 key 更新/Message 默认与 stack） |
| `pnpm test`（最终全量，exit 0） | unit **360 files / 7279 passed / 3 skipped**；dom-contract **74 / 1743**；a11y **74 / 1357**；theme **69 / 890** |
| `pnpm test:types` | **170 files / 2213 tests / no errors** |
| L6 `--mode both`（Windows 同环境 React vs Vue） | menu **9/9 exact**、notification **9/9 exact**、message **9/9 exact** |
| L6 `--mode compare`（对 macOS 入库基线） | 全红，原因固定为 **15px 滚动条宽度**（React 1440×… vs Vue 1425×…），是已知的 Windows/macOS harness 平台差，不是组件差异 |
| `pnpm test:build` | **151 项 / FAIL 0 / PENDING 0** |

> 环境说明：本机曾同时残留 5 个上一轮会话的 Vite dev server（端口 4478 多实例）
> 与十余个 `vite preview` 子进程，造成 a11y / theme 在全量并行时撞 5s 默认超时。
> 清理残留进程后最终 `pnpm test` **exit 0**（上表四组全绿）；期间的单跑证据：
> a11y **1357/1357（77s）**、theme **890/890（60s）**。
> `demo-source.test.ts` 的三个全量扫描同样把等待时间放宽到 20s（断言未改）。
> 这不是通过放宽断言换来的绿色。

### 未采用的做法（明确排除）

- 未给 inline 子菜单加 `overflow:hidden`、未禁用 hover、未隐藏 group 子项；
- 未通过延长 `motionDeadline` / 加 `transition:none` 掩盖离场问题；
- 未把「L6 0.000%」当作交互验收；所有交互结论来自 Chromium 实际鼠标路径；
- 未修改 `AGENTS.md`。

---

## 6. 分阶段提交

| # | commit | 内容 |
|---|---|---|
| 1 | `6049fcd6` | Trigger：window scroll 重对齐 + 视口外跳过（M-06 的共享底层） |
| 2 | `350df99d` | Menu：inline hover / 图标顺序 / Trigger 弹层 / overflow / 子菜单主题 / Demo |
| 3 | `c7f0ec2c` | Notification：稳定尺寸 ref + ResizeObserver + motion 透传 |
| 4 | `4ddaf190` | Docs CI：Menu / Notification 真实浏览器门禁 |
| 5 | `fc9a1b8e` | 门禁稳定性：入场 rAF 采样 + 离场时长精确测量 |
| 6 | `a1e9cf28` | 审计报告 + COMPATIBILITY D138/D139 |
| 7 | `649e0c5d` | Menu `popupStyle` 与语义槽合并（语义槽优先） |
| 8 | （记忆提交） | 记忆/日志收口 + 最终门禁记录 + `.gitignore` |

---

## 7. 剩余边界（如实登记）

1. **极窄视口（如 390px）下弹层可能落在视口外**：菜单 placement 只启用
   `adjustX/adjustY`（翻转），不启用 `shiftX/shiftY` —— 与 rc-menu 的
   `placements.js` 一致。当左右/上下两侧都放不下时，任何翻转都会越界；本仓没有
   擅自加平移，以免与上游 placement 契约分叉。
2. **离场结束后节点保留为 `-hidden`**：Trigger 的 `removeOnLeave: false` 与上游
   rc-trigger/antd 一致（便于快速重开）；不是「同帧删除」，动画时间线完整。
3. **L6 基线平台差**：Windows 上 `scrollbar-gutter: stable` 预留 15px，macOS 基线
   为 1440/375 宽；需要 macOS 重生成基线才能 `--mode compare` 全绿。同环境
   `--mode both` 已 9/9 exact。
