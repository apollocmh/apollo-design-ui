# Apollo Design · Message / Notification 入离场与堆叠动效专项审计

- 仓库：`apollocmh/apollo-design-ui`
- 检查基线：`master @ 827e957abc6642971785bc1ec7bb486461d6838c`（GitHub 分支读取时间：2026-10-22）
- 基准：Ant Design `6.6.4` 的通知样式源码及 rc-notification 的 List / Notice / Content 实现
- 方法：实际 GitHub 源码逐模块对照 + 现有单测覆盖核查；**未在本次独立启动线上 Chromium 复现**，因此严格区分确认的实现差异与需浏览器验证的症状。
- 目标：修正真实运行时的动画生命周期、堆叠展开与折叠，以及离场后其他消息的连续位置变化；不通过延长 setTimeout 或硬改 CSS 掩盖问题。

## 0. 结论

**优先修公共通知内核，不要把 Message、Notification 分头修。** 两者都使用 `packages/ui/src/notification/engine/NoticeList.ts`、`Notice.ts`、`@apollo-design/motion/MotionList`。两套 `style/index.ts` 有同构的动画规则；单纯修改局部 CSS 难以修复两侧共同存在的状态与时序问题。

最值得优先行动的两项确认差异：

1. `NoticeList.ts` 的 `onMouseenter/onMouseleave` 错绑在撑满浏览器视口的**外层 list** 上，而上游绑在真实高度的 **Content** 上。真实折叠范围不同。
2. `Notice.ts` 缺少上游在组件卸载前对「处于 hovering 状态」执行 mouseleave 清理的路径。关闭 hover 中的 notice、maxCount 替换、destroy 时状态生命周期不完整。

另有三个需要浏览器抓时间线的风险：尺寸 callback ref 每次渲染重新生成、MotionList 完整 motion 配置被截断，以及 `motionDeadline: 500` 兜底与 CSS 200ms 左右过渡不一致的可能后果。

**不能据此断言每个用户可见的跳动都是单一原因。** 必须通过实时 DOM / timeline / `getComputedStyle` 确认。

## 1. 实现差异与根因优先级

### MN-01 · P1 · 堆叠 hover 事件范围不对【已确认源码差异】

- 本地：`packages/ui/src/notification/engine/NoticeList.ts` 的渲染根 `<div class="...-list">`，在 `onMouseenter/onMouseleave` 中直接修改 `listHovering`。
- 样式：`packages/ui/src/message/style/index.ts` 与 `packages/ui/src/notification/style/index.ts` 的 `.apollo-*-list` 继承了根的 `height: 100vh`、滚动裁剪、`pointer-events: none`；通知卡片本身 `pointer-events: auto`。
- 上游：`react-component/notification/src/NotificationList/index.tsx` 将 `onMouseEnter/onMouseLeave` **传给 `<Content>`**，并不绑定到整个 fixed list。
- 影响：堆叠状态 `expanded = stackEnabled && (listHovering || count <= threshold)` 由错误的事件区域控制。离开通知后展开态可能滞留或触发/退出时机异常，连带影响 `stackPosition`、`--notification-y`、CSS transform 与通知的自动关闭暂停/恢复。

**修改方案**：删除外层 list 的两个事件监听，将同样的事件传给 `NoticeListContent`。本地 Content 组件会把 `$attrs` 传播到原生 `<div>`，应确认接线正常并避免重复监听。根上的 `className/style` 不变，`onMouseEnter` 不下沉到单个 notice。

**验收**：Notification 4 条，默认 `threshold=3`：折叠 → 鼠标悬停展开 → 鼠标移出实际内容区域而仍处于浏览器视口内部 → 自动恢复折叠。Message 要显式开启 `stack` 才测试折叠行为（Message 默认未启用堆叠）。

### MN-02 · P1 · Notice 在 hover 期间卸载没有清理【已确认源码差异】

- 本地：`packages/ui/src/notification/engine/Notice.ts` 用 `hovering.value` 记录 hover；有 `onInternalMouseLeave()`，但未注册与 hover 相关的卸载清理。
- 上游：`react-component/notification/src/Notification.tsx` `destroy()` 会在 `hovering` 时主动调用 `onInternalMouseLeave()`，并通过 effect cleanup 执行。
- 影响：hover 下关闭、destroy、maxCount 淘汰通知，不能完全复用正常的离开路径；配合 MN-01 可能表现为余下消息不收拢、状态卡住及计时异常。

**修改方案**：将内部离开逻辑整理为可接受可选事件的共享函数；在 `onBeforeUnmount` 中仅当本条确实 hovering 时执行对等清理。不得凭空触发业务 onClose、重复触发 onMouseLeave，亦不得在组件销毁后重启无意义计时器；参考上游清理顺序。对“关闭按钮上 hover → 点击关闭 → 鼠标不移动”的场景写浏览器测试。

**备注**：2026-09-28 的上游 Ant Design 6.6.5 问题 #59412 也报告了「hover 展开后关闭消息导致列表难以收起」。这说明该场景值得单列门禁；**不能把上游本身的 bug 当成应当保留的兼容行为**，以 6.6.4 的实际行为与预期交互为准。

### MN-03 · P1/P2 · Notice 尺寸 ref 生命周期与更新测量【高风险，待运行时证明】

- 本地：`NoticeList.ts` 的 `renderItem()` 内联创建匿名 `ref: (inst) => setNodeSize(key, instance.$el)`；`useSizes.ts` 内根据 ref 的节点测量 `offsetWidth/offsetHeight`，传 null 即删除 sizeMap 记录。
- 上游：`NotificationListItem` 用 `React.useCallback([setNodeSize, strKey])` 保持测量回调引用稳定，并与 Motion ref 合并。
- 需验证：Vue 每轮 patch 的函数 ref 注册/清空、更新时机与频率，是否造成同 key 的 `sizeMap` **先被清掉再测量**，从而将总高/偏移短暂变成 0，触发第一帧跳动；更新同 key 的文本长度是否及时测出新的尺寸。

**修改方案**：先仪表化 `setNodeSize`（key、null/non-null、实际尺寸、触发时刻），再修为稳定的按 key ref / 元素测量通道；有动态尺寸内容需求时结合 ResizeObserver 与统一调度帧批量读尺寸。不可在未有证据前大面积重写布局算法。验收动态高度、不同字数、换行、多条通知、同 key 更新与鼠标 hover。

### MN-04 · P2 · 完整 motion 配置未透传【已确认源码差异】

- 本地：`NoticeList.ts` 的 MotionList 仅收到 `motionName: placementMotion.value?.motionName`、固定 `motionAppear=true` 和 `motionDeadline=500`，没有将其他允许的 motion 字段完整传入。
- 上游：`NotificationList/index.tsx` 在 CSSMotionList 上传入 `motionAppear` 后使用 `{...placementMotion}`。
- 影响：默认的 `getMotion(prefixCls)` 恰好只返回 `motionName`，所以**不足以单独解释默认动画有偏差**；但自定义 motion 配置、hooks、enter/leave/appear 开关及配置透传存在明确契约缺失。

**修改方案**：按本项目 `MotionList` 支持的 prop schema 显式完整映射有效 motion 字段；不使用盲目对象 spread 覆盖 `keys/component/onAllRemoved` 等内核控制字段。加“自定义 motion 配置确实生效”的回归测试。

### MN-05 · P2 · 500ms 统一 motionDeadline 与浏览器 CSS transition 结束路径【风险，需验证】

- 本地：`NoticeList.ts` 写死 `motionDeadline: 500`，目的为丢失 CSS 事件时兜底；CSS 样式同时存在 `-fade-appear-start/active`、`-fade-leave-start/active` 和 `opacity/transform` 过渡。
- 上游：`NotificationList/index.tsx` 只传播 `placementMotion`；没有在这处无条件强制 500ms deadline。
- 可能后果：如 DOM 事件监听晚于实际 transition、动态改变 motion class 或 reduced-motion 环境未产生结束事件，离场节点可能额外保留到 500ms，影响余下消息的移位时序。

**修改方案**：记录每次 Notice 的状态 `appear / enter / leave`、step、CSS 动画计算时长、收到的 `transitionend` 属性，以及 `deadline` 实际触发率。若事件正常，请勿强行修改 CSS；若 fallback 频繁触发，优先修绑定/帧调度，随后再确定兜底策略。

### MN-06 · P2 · 缺少真实动效比较门禁【已确认覆盖不足】

当前主要测试能确认 Notice DOM 存在、key 更新、timer 到期与基础 stack class，但不能确认画面顺序和逐帧位置。文档站浏览器烟测和 V3 验收也没有覆盖 Message / Notification 堆叠完整交互。不能用 L6 的静态像素截图全绿替代事件流检验。

必须新增独立生产预览 Playwright 门禁，见第 4 节。

## 2. 不应误判为 bug 的差异

- `message` 默认 `stack: false`；`notification` 默认 `stack: { offset: 8 }`，这是有意行为差异，不应强制统一成相同的默认视觉。
- `notification` 在默认阈值为 3 时，**第 4 条**出现才应转入堆叠折叠；小于等于 3 条时 `stack-expanded` 是预期。
- `NoticeListContent` 的高度增减 class 不对称（减少才做 height transition），上游有相同逻辑，不要为了“看起来一致”直接给增加也加动画。
- CSS 的 `--top-notificiation-*` 拼写确实多了 `i`，但这是上游采用的变量名；随意拼写修正会破坏占位条。
- `motionDeadline=500` 是兜底值，不等于动画必定播放 500ms。应先测真实 `transitionend`。
- Ant Design 官方 2023 年介绍堆叠设计：折叠状态限制后台通知高度，展开态还原高度，旧通知按偏移层叠；用户体验重点是几何位置连续变化而不仅是淡入淡出。

## 3. 修改顺序与阶段门禁

| 阶段 | 主要工作 | 验收结果 |
|---|---|---|
| A0：证据 | 同一 Chromium、同一视口，对 6.6.4 Ant / Apollo 录屏与采集 DOM 时间线；至少 10 个场景 | 缺陷矩阵和可重现步骤，不以主观印象替代 |
| A1：事件 | MN-01、MN-02，列表 Content 的 hover 绑定与卸载清理 | 悬停展开、移出收起；hover 关闭剩余态正确，计时能恢复 |
| A2：位置 | MN-03，测量/ref/重排，保留 `--notification-y` 计算公式 | 不出现 y=0 突跳，同 key 高度变化后平滑更新 |
| A3：生命周期 | MN-04、MN-05，motion 配置与结束事件 | 每条确有 appear/enter/leave；不依赖固定超时掩饰缺失事件 |
| A4：文档/测试 | stack Demo、6 placement、message type、销毁/更新、移动端复核 | CI Chromium 阻塞门禁通过，截图/trace 入库 |

**每阶段独立提交**，不得在 A0 之前一口气重构 `@apollo-design/motion`。不要降低现有 L1/L4/L5/L6/L7 门禁。

## 4. Playwright 必验的行为矩阵

| 场景 | 观测重点 |
|---|---|
| Notification 1 条进入，再自动关闭 | 动画类从 appear/enter 到 leave；opacity/transform 轨迹；最终 DOM 被摘 |
| Notification 同时创建 4 条，不同高度 | 第 4 条触发折叠；后排卡片 y/scale 连续；无遮挡或离谱抖动 |
| 4 条折叠 → hover 展开 → 鼠标移出内容区域 | listHovering 从 true→false；`-stack-expanded` 移除；继续收拢 |
| hover 展开后直接关闭最新一条，指针不动 | 余下 3 条正确显示，不会 hover 卡死；自动关闭倒计时恢复 |
| hover 展开后关闭中间一条 / destroy | 离场正确完成；其他条位置连续；没有残留 ghost 元素 |
| Notification 四角 + top/bottom 共六种 placement | 进入方向、离开方向和位置正确；边缘不裁剪 |
| maxCount 溢出淘汰最旧消息 | 旧 Notice 真实离场；最新消息入场、总高平滑重排 |
| 同 key 文字从短到长、含多行换行 | `offsetWidth/Height` 更新，`--notification-y` 与总高跟进，无冲突 |
| Message 默认为 stack=false | 多条按非堆叠规则进入/移除，不强制应用 Notification 折叠 |
| Message 显式 stack=true，4 条 | 折叠层级、鼠标展开/移出、自动关闭、destroy |
| 快速 open→close→open 同 key | 不出现漏帧、离场后迟到的 `onVisibleChanged(false)` 误删新条 |
| 主题切换、语言切换、prefers-reduced-motion | 不闪屏、不停留 500ms 虚影、关闭事件执行一次 |

### 浏览器必须采集的字段

在每次 open / close 后约 0、32、80、160、250、520ms 采样：

- `performance.now()`；每条 Notice 的 `data-notification-index`、`className`、`getBoundingClientRect()`、`offsetHeight`/`offsetWidth`。
- `getComputedStyle()` 的 `opacity`、`transform`、`top/bottom`、`transitionDuration`、`transitionProperty`、`clipPath`。
- `--notification-y`、`--notification-index`、`--notification-scale`、`--top-notificiation-height`、`--top-notificiation-width`。
- list 根/Content 的 `mouseenter/mouseleave`、`-stack-expanded` class 变化、Content 高度、滚动位置。
- CSSMotion 的 `status/step`，`transitionend` 是否收到、是否超时兜底；Notice 的 mount/unmount 与 onClose 调用顺序。

在同一 Chromium 版本与同一窗口宽度下，分别执行 Ant Design 和 Apollo 并录屏。**不要简单做 0% 像素误差判断：文字、字体与系统字体渲染可不同；重点比较轨迹、相对位置、过渡时序和交互状态。**

## 5. 最小复现与修复要点（伪代码，非未经运行就能合并的补丁）

### A1：NoticeList 事件绑定

```ts
// 外层 list：移除 onMouseenter / onMouseleave
return h('div', { class: listClasses, style: listStyle }, [
  h(NoticeListContent, {
    onMouseenter: () => { listHovering.value = true; },
    onMouseleave: () => { listHovering.value = false; },
    // 其他现有属性与子节点保持不变
  }, { default: ... }),
]);
```

### A1：Notice 卸载时清理

```ts
// 整理原有 onInternalMouseLeave，使其能够处理无 MouseEvent 的卸载清理。
// onBeforeUnmount 仅 hovering=true 时执行等价离开逻辑。
// 检查：计时器停止顺序、onMouseLeave 至多一次、onClose 不重复执行。
```

### A2：尺寸事件

```ts
// 在 setNodeSize 中记录：key、null/non-null、offsetWidth、offsetHeight、timestamp。
// 若发现更新期间同 key 反复 null → 0 → width/height，改用按 key 稳定 ref。
// 再判断动态内容 ResizeObserver 是否必要，不先改上游的定位公式。
```

### A3：MotionList

```ts
// 现有：只有 motionName 与 deadline。
// 改为白名单显式传递 MotionList 接受的 placementMotion 字段，
// 包括可自定义 enter / leave / appear / hooks；保留 keys/component/onAllRemoved 的主控权。
```

## 6. 可直接交给 DeepSeek / Claude 的总任务

> 阅读 `docs/audit/Message-Notification-motion-audit.md`（可把本文件复制到此路径）。当前主分支以实际 HEAD 为准，和本报告的基线做一次差异检查。
>
> 这是组件库公共动效内核的 P1 质量问题，重点不是“微调 CSS”，而是 Message / Notification 共享的 NotificationList / MotionList / Notice 状态链路。
>
> **首先执行 A0**：对 Ant Design 6.6.4 与 Apollo 同环境复现「4 条 → 折叠 → hover 展开 → 点击关闭 → 鼠标移出 → 余条折叠」。采集列表 root/Content 鼠标事件、每条 Notice 生命周期、`--notification-y`、位移、透明度和 transitionend。没有测试证据不得声称已经完全修复。
>
> 然后按 A1–A4 顺序执行：修复 hover 绑定目标、Notice hover 清理、尺寸回调测量、motion 配置传递与异常收尾；逐项独立提交并补 Playwright 门禁。对正常工作行为保持兼容，不得通过 `transition:none`、加大关闭延迟、隐藏旧条、缩短测试等待或替换虚假 Demo 来掩盖问题。
>
> 交付：缺陷复现矩阵、根因和对照源码链接、修改文件与提交 SHA、前后录屏/Trace、真实浏览器门禁结果，以及尚未解决的差异。提交前运行既有全部必要门禁。

## 7. 源码参照

- Apollo：[NoticeList.ts](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/notification/engine/NoticeList.ts) · [Notice.ts](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/notification/engine/Notice.ts) · [useSizes.ts](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/notification/engine/hooks/useSizes.ts) · [MotionList](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/motion/src/motion-list.ts)
- Apollo 样式：[Message](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/message/style/index.ts) · [Notification](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/notification/style/index.ts)
- 上游：[rc-notification List](https://github.com/react-component/notification/blob/master/src/NotificationList/index.tsx) · [rc-notification Notice](https://github.com/react-component/notification/blob/master/src/Notification.tsx) · [antd 6.6.4 通知动效样式](https://github.com/ant-design/ant-design/blob/6.6.4/components/notification/style/placement.ts)
- 设计机制：[Ant Design 灵动的 Notification](https://ant.design/docs/blog/notification-stack-cn/) · [近期上游 hover 关闭问题 #59412](https://github.com/ant-design/ant-design/issues/59412)
