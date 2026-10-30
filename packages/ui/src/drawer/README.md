> 规范范围：本文件保留实现说明与历史对照证据；上游同构、旧阶段与历史 Gate 要求不再生效。现行规则见 [项目规范](../../../../AGENTS.md)，公共行为以 Apollo 组件 API 文档与测试契约为准。

> 历史实施记录：原勾选、当时结果和缺口保留。2026-10-30 起，本文的 G0–G14 / 逐组件 G13 全仓收口与旧 Registry 进度规则由仓库 `WORKFLOW.md`、`TESTING.md` 两阶段流程替代；当前任务状态只读 `registry/vue-native-audit.json`，不据本文重复派发或重跑已有效验证。

# drawer

> **层**：L3（`packages/ui`）｜ **优先级**：P3 ｜ **复杂度**：M ｜ **antd 版本**：6.6.4
>
> 契约来源：antd `components/drawer/`（Drawer 369 / DrawerPanel 249 / useFocusable 26 /
> style 357 + motion 80）+ `@rc-component/drawer@1.4.2`（449 行 / 7 文件）。
> 上游是历史实现参考；当前契约由 Apollo 的类型、组件文档与行为测试共同确定。

## 当前源码说明（2026-10-30）

保留 2026-10-24 的动态/空内容槽、单次标题快照、正文 DOM 与外部 ARIA 成果。关闭、动效完成与三个 resize 通知使用 Vue emits；`resizable` 是布尔开关，实际模板 ref 暴露外层 `nativeElement` 和 `focus()`。原生 class/style 与普通事件属于外层根，dialog 保留 id/role/ARIA；面板定制使用 section 语义字段。迁移写法见双语 API。

`useFocusable` 在真实根就绪或重新打开时同步记录所属文档的焦点，再由挂载/更新后的效果执行锁定与自动聚焦；离场完成或条件卸载时释放并归还。每个子抽屉独立持有推挤登记；拖拽读取当前配置，并在结束、关闭、禁用、换向或卸载时释放所属文档监听。

Drawer / PurePanel 消费当前 Provider 与四个组件 Token。PurePanel 只展示静态内容，不占用活动层或焦点锁。保留既有样式/尺寸/销毁别名；无消费的 panelRef、destroyInactivePanel 与纯回调 DrawerResizableConfig 已直接移除。完整冻结验收与原有历史数字分别解释，不将本段源码说明视为重新通过九维验收。

## 1. 职责

从屏幕边缘滑出的浮层面板：四向定位、尺寸预设与拖拽改尺寸、遮罩（可模糊/可点关）、
嵌套推挤、焦点陷阱、语义化槽位。

## 2. 文件布局与关键决策

```
drawer/
├── Drawer.ts       # antd 侧壳：尺寸/mask/zIndex/焦点/语义槽/9 条 deprecated
├── DrawerPanel.ts  # antd 侧面板：header(title/extra/close) / body / footer（loading ⇒ Skeleton）
├── PurePanel.ts    # _InternalPanelDoNotUseOrYouWillBeFired（{p}-pure + {p}-{placement}）
├── engine/         # ⭐ rc-drawer 的 Vue 自建
│   ├── Drawer.ts        # open 归一化（首帧不开门）+ 焦点还原 + Portal 包裹
│   ├── DrawerPopup.ts   # mask + 面板 + 动效 + push + resizable
│   ├── DrawerSection.ts # rc 的 panel（{p}-section div，role=dialog aria-modal）
│   ├── useDrag.ts / useFocusable.ts / context.ts / util.ts
├── interface.ts / index.ts
└── style/{token.ts,index.ts}
```

> ⚠️ `useMergedMask` 2026-09-26 已按三次法则（drawer 第二个、modal 第三个）从
> `drawer/hooks/` 提到 `packages/ui/src/_internal/use-merged-mask.ts`；drawer 从那里引用。

- **尺寸轴随方位**：`left/right` 用 width、`top/bottom` 用 height；rc 的 378 兜底只管水平，
  垂直靠 `defaultSize`（antd 默认传 378）。
- **push 只由子抽屉触发**：`pushed` 由子抽屉调 `context.push()` 置真；`push` prop 只给距离。
- **`getContainer === false` ⇒ 内联渲染**：根类加 `{p}-inline`（CSS 把 position 从 fixed
  改成 absolute）。⚠️ 这一条**是 L6 抓出来的**（漏传 `inline` 导致 9 张图全红）。
- **`toCssSize`**：`wrapperStyle.width` 必须带 px 字符串，裸数字会被 Vue 静默丢弃
  （PITFALLS 170 / D94）。本包的实现在 `engine/util.ts`（与 `image/util.ts` 同实现，
  第三个消费者出现时提到 `_internal/`）。
- **C8-R2（VNode prop → slot）**：公开 `Drawer` / `DrawerPurePanel` 的 `footer` / `extra` /
  `closeIcon` 已删除改为同名 slot（`#footer` / `#extra` / `#closeIcon`，空 slot = 隐藏）；
  `title` 收窄为 `string`（富标题走 `#title` slot，slot 优先）。内部 `DrawerPanel` 仍保留
  VNode prop（由父组件透传，无模板上下文，VNode prop 合法）。

## 3. 与 antd 的差异

登记于 `COMPATIBILITY.md` §9.2：**D96**（命令式 holder 用游离 div —— 本组件不涉及，
但 `Portal` 的两个新能力同批）、**D99**（`useClosable` 的 closeLabel 注入点在 drawer 是
**button** 而不是图标 vnode —— 与 notification 的 D98 同族、注入点不同）。

L6 视觉 9 张（3 variant × 3 viewport，受控 `open` + 内联）**全部 0.000% exact**。

## 4. Component Token 清单

registry 数据：token 数 = 4。

| token | 来源 |
|---|---|
| `zIndexPopup` | `zIndexPopupBase` = **1000（不加偏移）** |
| `footerPaddingBlock` | `paddingXS` = 8 |
| `footerPaddingInline` | `padding` = 16 |
| `draggerSize` | 4 |

## 4.5 push 链路 / 焦点归还 / 标题 ARIA（Issue #20）

1. 🚨 **外层→引擎的 prop 必须逐个显式传**：`push` 是外层公开 prop，而引擎 `Drawer`（rc 层）
   没有声明它 —— 不显式传就进不了 `DrawerPopup`（那里才有 `distance ?? parent ?? 180`），
   自定义推挤距离会静默退化成 180。凡是「外层有、引擎没声明」的 prop 都要这么检查一遍。
2. 🚨 **焦点来源不能在渲染期清空**：rc 只在 `mergedOpen` **变真**那一帧记
   `document.activeElement`（`useLayoutEffect([mergedOpen])`），**从不**在关闭时清。
   本仓改成「渲染期 `!mergedOpen ⇒ null`」后，`afterOpenChange(false)`（离场动效之后）
   拿到 null ⇒ 焦点回不去。2026-10-30 改为实际根的同步 watch 记录，避免渲染期写状态；
   归还时用完即清，并保留 `isConnected` 判定。
3. 🚨 **标题 ARIA 要在渲染期判定**：`titleSlot`/`hasTitle`/`ariaId` 写进 setup 是快照 ⇒
   标题由「有」变「无」后 `aria-labelledby` 还指向已不存在的节点。用普通函数每渲染现读
   （不要用 computed —— slot 从「无」到「有」时 computed 不失效）。
4. 2026-10-30 纠正旧结论：此前不是 jsdom 无法推进，而是 `onVisibleChanged` 被放进错误的
   `hooks` 字段。现在连接 CSSMotion 顶层通知；`s20-issue20.test.ts` 与原生回归均驱动实际
   动效队列，不再手调完成回调。

## 5. 已知缺口

| # | 缺口 | 说明 |
|---|---|---|
| P1 | ConfigProvider 组件级 `classNames` / `styles` / token 覆盖 | 2026-10-30 已接通当前源码；最终验收仍由本轮状态记录 |
| P2 | 函数式语义槽 | D36 同判（只支持对象形态） |
| P3 | watermark 的 `usePanelRef` | antd 用它把面板根注册给水印；本仓未接 |
| P4 | `holderRender` / `warnContext` | D30 同源（不涉及本组件，但同一批决策） |

## 6. 收口证据（G13）

- L1+L2 20（内核 10 + antd 侧 10）/ L3 8 / L4 4（基线 `tests/compat/baselines/drawer.dom.json`）/
  L5 19 / L7(theme) 16 / demo 18（`expectCount` 钉死）/ L6 **9/9 0.000% exact**
- registry 11 维 done，`status: completed`
