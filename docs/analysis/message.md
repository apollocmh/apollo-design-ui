# message 分析（G1）

> 契约来源：antd 6.6.4 `components/message/`（index.tsx 346 / useMessage.tsx 308 /
> PurePanel.tsx 120 / PureList.tsx 68 / interface.ts 113 / util.ts 28 / style/index.ts 207
> ≈ 1190 行）+ `@rc-component/notification@2.0.8`（es ≈ 907 行 / 13 文件）
> + antd `components/notification/`（util 41 / hooks/useStackConfig 25 / style 883）。
>
> 上游是**兼容性规格**，不是代码来源。

## 0. 一句话结论（影响排期）

**message 不是「一个小组件」，它是「通知内核 + 一层薄壳」。**
antd 的 message 完全建立在 rc-notification 之上（`useRcNotification` + `NotificationList`），
样式也复用 notification 的共享 token 与列表项样式（`prepareNotificationToken` /
`sharedGenerateStyle` / `genListItemSharedStyle`）。而本仓 **notification 尚未落地**。

⇒ 实现 message = 顺带把 **notification 的引擎与共享样式层**建起来（notification 组件本体
届时只剩「壳 + 交互按钮 + placement」）。这是本轮的主要成本，也是本轮的主要收益。

## 1. 分层

```
antd message/index.tsx        命令式 API：模块级 holder + taskQueue + flushMessageQueue
  ├─ useMessage.tsx           Holder（把配置翻译成 rc-notification 的 props）+ wrapAPI
  │    ├─ rc useNotification  API(open/close/destroy) + 内部 taskQueue + container
  │    │    └─ rc Notifications    configList → 按 placement 分组 → portal → NotificationList
  │    │         └─ rc NotificationList  list 容器 + CSSMotionList + useStack + useListPosition
  │    │              └─ rc Notification  单条 notice（title/description/icon/actions/close/progress）
  │    ├─ notification/hooks/useStackConfig    stack 配置合并（默认 false）
  │    └─ notification/util                    getPlacementOffsetStyle / getMotion / getCloseIconConfig
  ├─ PurePanel.tsx            单条静态面板（`_InternalPanelDoNotUseOrYouWillBeFired`）
  ├─ PureList.tsx             静态列表（`_InternalListDoNotUseOrYouWillBeFired`）
  └─ style/index.ts           genMessageItemStyle + stack 占位 + PurePanel 子样式（复用 notification 样式层）
```

**关键映射（message → rc-notification）**：`content` ⇒ rc 的 **`title`**（不是 `description`）、
`icon` ⇒ 类型图标（`TypeIcon[type]`）、`placement` 恒 `'top'`、`closable: false`
（所以 message 的 notice **没有关闭按钮**，但仍保留 `-notice-closable` 的判据通道）、
`className` 叠加 `{p}-notice-{type}` 与 `{p}-{type}`。

## 2. API 面（G2 的目标）

### 2.1 命令式（`message` 默认导出 = 静态方法集合）

| 方法 | 签名 | 说明 |
|---|---|---|
| `success` / `info` / `warning` / `error` / `loading` | `(content: JointContent, duration?: number \| VoidFunction, onClose?: VoidFunction) => MessageType` | 第二参传函数时视为 `onClose` |
| `open` | `(config: ArgsProps) => MessageType` | 完整配置 |
| `destroy` | `(key?: React.Key) => void` | 不传 key 清空全部 |
| `config` | `(config: ConfigOptions) => void` | 全局默认值（合并语义，非替换） |
| `useMessage` | `(config?: ConfigOptions) => [MessageInstance, ReactElement]` | 即 `message.useMessage` |
| `_InternalPanelDoNotUseOrYouWillBeFired` | `PurePanel` | 私有，文档/调试用 |
| `_InternalListDoNotUseOrYouWillBeFired` | `PureList` | 私有，同上 |

`MessageType` 是**双形态**：可调用（`() => void` 关闭）且 `PromiseLike<boolean>`
（`then(fn)` 在关闭后 resolve `true`），另有 `.promise`。由 `wrapPromiseFn` 构造。

### 2.2 `ArgsProps`（单条消息）

`content`（必填）、`duration`、`type`、`onClose`、`icon`、`key`、`style`、`className`、
`classNames` / `styles`（语义槽，支持函数式）、`onClick`、`pauseOnHover`。

### 2.3 `ConfigOptions`（全局 / hooks 配置）

`top`（number \| string，默认 8）、`duration`（默认 3）、`prefixCls`、`getContainer`、
`transitionName`、`maxCount`、`rtl`、`stack`（`boolean \| { threshold }`，默认 false）、
`pauseOnHover`（默认 true）、`classNames` / `styles`。

### 2.4 语义槽（6 个）

`list` / `listContent` / `root` / `wrapper` / `icon` / `title`
（`MessageSemanticType`；`MessageSemanticAllType` = `GenerateSemantic<…, ArgsProps>`，
即支持 `(info: { props }) => 对象` 的函数式形态 —— 本仓 D36 同判：先对象式）。

## 3. 渲染树（L4 的目标）

rc-notification 的真实产物（`NotificationList/index.js` + `Notification.js` 逐字）：

```html
<!-- 每个 placement 一个 list（message 恒 top） -->
<div class="{p} {p}-list {p}-top [{p}-stack] [{p}-stack-expanded] [{p}-list-hovered]">
  <div class="{p}-list-content" style="height:…">        <!-- Content：总高 + 顶条宽高 -->
    <!-- CSSMotionList 逐条 -->
    <div class="{p}-notice [{p}-notice-closable] [{p}-notice-stack-in-threshold]"
         role="alert" data-notification-index="N"
         style="--notification-index:N; --notification-y:…px">
      <div class="{p}-notice-wrapper">                    <!-- 有 icon 才包这层 -->
        <div class="{p}-notice-icon">{icon}</div>
        <div class="{p}-notice-title">{content}</div>       <!-- 有 description 时改为 -section 包 title+description -->
      </div>
      <div class="{p}-notice-actions">…</div>              <!-- 可选 -->
      <button class="{p}-notice-close" aria-label="Close">…</button>  <!-- closable=false ⇒ 不渲染 -->
      <div class="{p}-notice-progress">…</div>             <!-- showProgress && duration>0 ⇒ 才渲染 -->
    </div>
  </div>
</div>
```

⚠️ 命令式路径整体走 **portal**（`getContainer()` 默认 `document.body`）⇒ SSR 产物为空。
`PurePanel` / `PureList` 是**非 portal** 的静态形态，是 L4 可测的那一半。

## 4. 行为契约（L1/L2 的判据）

1. **全局 holder 生命周期**：模块级 `message` + `taskQueue`。首次调用时创建
   `DocumentFragment` 并 render（`act()` 包裹）；instance 未就绪时任务**留在队列**；
   就绪后回放队列并清空。`skipped` 标记用于「开了立刻关」的竞态（`immediately.test`）。
2. **`config()` 是合并**：`{...defaultGlobalConfig, ...config}`，并触发 `sync()` 让 holder
   重取 `getContainer/duration/rtl/maxCount/top/stack`。`getContainer` 在调用时**求值一次**
   （`getGlobalContext()` 的 `mergedContainer`）。
3. **promise 形态**：`then` 在 `onClose` 时 resolve `true`；调用返回值本身即「关闭」。
4. **key**：未传时自动生成 `antd-message-${++keyIndex}`；同 key 再 open ⇒ **复用同一 notice**
   （rc 侧 `times + 1`，用于「更新内容」语义，`update` demo / `index.test` 的
   「update message content with a unique key」）。
5. **duration**：`DEFAULT_DURATION = 3`；传函数 ⇒ 视为 `onClose`；`duration: 0` ⇒ 不自动关。
6. **`maxCount`**：超出时 `slice(-maxCount)`（保留**最后** N 条）。
7. **`stack`**：默认关。`threshold` 默认由 rc 的 `useStack` 决定；折叠态只显示最新一条，
   展开靠 hover（`-stack-expanded`）。样式侧用 `::before`/`::after` 两个占位条
   （`--top-notificiation-height/width`，注意上游变量名拼写就是 `notificiation`）。
8. **`pauseOnHover`**：默认 true；hover 暂停计时、离开恢复；stack 折叠时列表 hover 会
   **强制暂停所有条目**（`forcedHovering = stackEnabled && listHovering`）。
9. **`onClick`** 落在 notice 根（rc 直接透传 `onClick`）。
10. **`icon`**：`icon || (type && TypeIcon[type]) || null`；`type` 未传且未给 icon ⇒ 无图标
    （`should have no icon` 三条用例）。
11. **`rtl`**：holder 根加 `{p}-rtl`（`rtl ?? direction === 'rtl'`）。
12. **在 render 中调用** ⇒ 开发期 warning（`usage`：React 18 并发模式下会坏）。
13. **静态方法无法消费 context** ⇒ 开发期 `warnContext('message')`（`static-warning.test`）。
14. **`getContainer` 优先级**：`config.getContainer` → `ConfigProvider.getPopupContainer` → `document.body`。

## 5. Token / 样式

**Component Token 3 个**（`prepareComponentToken`）：

| token | 值 |
|---|---|
| `zIndexPopup` | `zIndexPopupBase + CONTAINER_MAX_OFFSET + 10`（注意是 **+10**，不是 notification 的算法） |
| `contentBg` | `colorBgElevated` |
| `contentPadding` | `` `${(controlHeightLG - fontSize * lineHeight) / 2}px ${paddingSM}px` `` |

⭐ `CONTAINER_MAX_OFFSET` **已实测**（`_util/hooks/useZIndex.ts`）：
`CONTAINER_OFFSET(100) × CONTAINER_OFFSET_MAX_COUNT(10)` = **1000**
⇒ 默认主题下 `zIndexPopup = 1000 + 1000 + 10 = 2010`。

**但样式本体在 notification 侧**：message 把自己的 token 映射到 `NotificationToken`
（`notificationBg` ← `contentBg`、`notificationPadding*` ← 由 `contentPadding` 与
`messagePaddingVertical = (controlHeightLG - fontSize*lineHeight)/2` 计算），
再调 `sharedGenerateStyle(messageToken, { stackVisibleCount: 1, itemStyle })`。
`genListItemSharedStyle` 的 message 覆盖：`width: max-content`、`iconFontSize = fontSizeLG`、
`titleFontSize = fontSize`、`titleLineHeight = lineHeight`、`contentStyle.alignItems = center`、
`gap = marginXS`、`noticeStyle.zIndex = 1`。

⇒ **message 的样式无法独立实现**：必须先有 `notification/style` 的
`prepareNotificationToken` / `sharedGenerateStyle` / `genListItemSharedStyle`（883 行）。

## 6. 依赖缺口（⭐ 本轮的真实工作量）

| # | 缺口 | 规模 | 说明 |
|---|---|---|---|
| P1 | **通知内核**（rc-notification 的 Vue 化） | ~907 行 / 13 文件 | `Notifications`（configList + placement 分组 + portal + `renderNotifications`）、`NotificationList`（list 容器 + `CSSMotionList` + gap 测量）、`Notification`（单条 notice）、`NotificationProvider`（`classNames.list` 上下文）、`hooks/{useNotification,useStack,useNoticeTimer,useListPosition,useClosable}`、`Progress`、`Content` |
| P2 | **notification 的共享模块** | 66 行 | `util.ts`（`getPlacementOffsetStyle` / `getMotion` / `getCloseIconConfig`）、`hooks/useStackConfig.ts` |
| P3 | **notification 的样式层** | 883 行 | `style/{index,notification,placement}.ts` —— 三块：共享 token + 列表项共享样式 + placement 定位 |
| P4 | `app/context` 的 `message` 配置 + `useApp()` 回填 | 小 | ✅ 本仓 `_internal/app-context.ts` 已有 `AppConfig.message`（沿树合并）与 `useApp()` 的 **stub**（app 的 PENDING-2 明写「message 落地后回填」）⇒ 本轮要把 `useApp().message` 换成真实例 |
| P5 | `ConfigProvider` 组件级 `classNames`/`styles` | staged | 与 image 的 P5 同判：当前来源只有 props |
| P6 | `globalConfig().holderRender` | 小 | 静态方法的容器渲染钩子（`config.test` 有 4 条用例） |

⚠️ **`@rc-component/notification` 的 `es/` 是 React 实现**：本仓 R7/E19 禁止运行时依赖，
必须**自建**（与 image 自建 rc-image 内核同判）。
✅ **已确认可复用**：`@apollo-design/motion` 已导出 **`MotionList`**（= `CSSMotionList` 的
Vue 等价物，见 `packages/motion/src/motion-list.ts`，四态 diff + allRemoved）与 `CSSMotion`
⇒ 内核的列表动效**不需要新写**。

## 7. 实现顺序（逐 Gate 可推送）

1. **notification 内核**（P1+P2）→ `packages/ui/src/notification/{engine,hooks,util}`（先不做 UI 壳）
2. **notification 样式层**（P3）→ `notification/style/*`（从 antd extractStyle 产物机械转换）
3. `message/interface.ts`（G2）
4. `message/util.ts`（`getMotion` / `wrapPromiseFn`）+ `PurePanel`（图标映射 `TypeIcon`）
5. `message/style/token.ts` + `style/index.ts`（G3/G4，复用 2）
6. `useMessage` 的 Holder（把 message 配置翻译成内核 props）+ `wrapAPI`
7. `message/index.ts`（命令式 API：holder + taskQueue + flushMessageQueue + 静态方法）
8. demo ×11 → L1/L2/L3/L4/L5/L7 → L6 → registry → 文档 → G14

## 8. 风险预登记

- **L6 的浮层形态**：命令式路径是 portal + 自动消失，静态截图拿不到 → 视觉用例必须走
  **受控静态帧**（`PurePanel` / `PureList`，或 `duration: 0` 的 open 帧），与
  tooltip/popover/image 的既有做法一致。
- **计时器**：`useNoticeTimer` 依赖真实时钟（`duration` + `percent`）。jsdom 里要
  `vi.useFakeTimers()`；L2 用例要覆盖「hover 暂停 / 离开恢复 / stack 折叠强制暂停」三条。
- **`--top-notificiation-height/width` 的拼写**：上游变量名就是 `notificiation`（少一个 `t`），
  逐字保留，否则样式对不上（且会掉进 E10/B7 的变量存在性检查）。
- **`CONTAINER_MAX_OFFSET`**：`zIndexPopup` 依赖它，必须从 antd 的 `_util/hooks` 取值
  （不能凭印象写 80 或 100）。
- **`times` 语义**：rc 用 `times` 计数实现「同 key 更新」，这是 `update` demo 的契约，
  容易在 Vue 化时被「直接替换」掉。
