# 基线动效复现矩阵（阶段 0）

> 执行日期：2026-10-21
> 分支：`fix/docs-motion-demo-quality`
> 基线：`master` @ `7eeab16182f91b76bf0eb3e8ad09aa8688c33f7d`（与审计报告一致）
> 浏览器：本机 Playwright Chromium，1440×900，`prefers-reduced-motion: no-preference`
> 对照：仓库已安装的 **antd 6.6.4**（临时 Vite React playground，未提交产品代码）
> 说明：本阶段**只读**组件源码与真实浏览器行为，没有修改任何组件实现或 Token。

## 0. 结论先行

| 结论 | 证据级别 | 影响 |
|---|---|---|
| **共享 Trigger 在关闭时把浮层挪到 `-1000vw/-1000vh`**，导致 Select / DatePicker / Popconfirm 等所有 Trigger 系浮层的离场动画在屏幕外播放 | **C（已复现）** | P0，共性根因，优先修 `_internal/trigger.ts` |
| **Notification 关闭时整条通知立即卸载**，没有 `-fade-leave-*` 阶段 | **C（已复现）** | P0，独立于 Trigger，修 `NoticeList`/`MotionList` 的数据保留 |
| **Modal 入场/离场的 fade/zoom 曲线存在且与 antd 同形**；差异在 **zoom 的 `transform-origin`**：antd 从最近一次点击点展开，本仓固定在面板中心 | **C（已复现）+ S（源码证实）** | P0，Modal 专修 |
| **Tree 收起动效正常，但收起后的再次展开没有入场动效**（没有 `-treenode-motion` 包装） | **C（已复现）** | P0，需在 `NodeList` diff 分支定位 |
| Select / DatePicker / Popconfirm 在 **独立示例页与组件文档页行为一致** | **C** | 排除「docs Demo 容器导致」；根因在 runtime / Trigger |

**阶段 1 不应先改任何组件的 duration / keyframes。** 先修 Trigger 的 offset 生命周期，再分别处理 Notification、Modal、Tree。

## 1. 环境与脚本

- `packages/ui/dist` 已是当前源码的构建产物；docs 生产预览由
  `pnpm --filter @apollo-design/docs exec vite preview --host 127.0.0.1 --port 4477`
  启动（**不是** dev server；dev 无 SSR，不能用于本阶段的真实页面）。
- 复现脚本：`node docs/audit/tools/stage0-motion-probe.mjs`
  → `docs/audit/evidence/stage0-motion.json`。
- antd 对照：仓库 `node_modules/antd@6.6.4`，临时 Vite playground 使用
  `components/{modal,notification,select,date-picker,tree,popconfirm}` 的原生交互；
  原始采样见 `docs/audit/evidence/stage0-react*.log` 与
  `docs/audit/evidence/stage0-standalone.log`。
- 截图：
  - `select-close-apollo-80ms.png` / `select-close-antd-80ms.png`
  - `notification-close-apollo-20ms.png` / `notification-close-antd-60ms.png`
  - `modal-open-apollo-100ms.png` / `modal-open-antd-100ms.png`

## 2. 六类矩阵

| ID | 组件 | 操作 | 期望（antd 6.6.4） | 实际（本仓） | 判定 | 归因 |
|---|---|---|---|---|---|---|
| MOT-01 | Select | 打开 → Esc 关闭 | 浮层留在原位（antd `inset: 68px auto auto 32px`），播放 `antSlideUpOut` 后 `display:none` | 关闭首帧 `inset: -1000vh auto auto -1000vw`，rect `-14400,-9000`；`apollo-slide-up-out` 在屏外播放 | **已复现 BUG** | 共享 Trigger |
| MOT-02 | DatePicker | 打开 → Esc 关闭 | 浮层保持 `inset: 76px auto auto 192px`，原位置播放 `antSlideUpOut` | 关闭首帧 `inset: -1000vh auto auto -1000vw`，rect `-14400,-9000` | **已复现 BUG** | 共享 Trigger |
| MOT-03 | Popconfirm | 打开 → 点 No 关闭 | 浮层保持 `inset: 52px auto auto 0px`，播放 `antZoomBigOut` | 关闭首帧 `inset: -1000vh auto auto -1000vw`，rect `-14400,-9000` | **已复现 BUG** | 共享 Trigger |
| MOT-04 | Notification | 出现 → 点关闭 | 先加 `-fade-leave-start`（t≈103ms），再 `-fade-leave-active`（t≈130ms），约 353ms 移除 | 关闭后 **t≈35ms 整个 `.apollo-notification` 容器被移除**；没有 leave class / leave 阶段 | **已复现 BUG** | NoticeList + MotionList 数据通路 |
| MOT-05 | Tree | 展开 → 收起 → 再展开 | 收起有 collapse 高度过渡；再展开有 appear 过渡 | 收起正常（`-motion-collapse-leave-start/active`，高度 140→0）；**再展开 nodes 2→7 但没有 `-treenode-motion`** | **部分复现**（exit 正常、enter 缺失） | Tree motion 分支（H） |
| MOT-06 | Modal | 点击按钮打开/关闭 | fade + zoom；zoom 原点取最近 100ms 内的点击位置（本次 `-398px -76px`） | fade + zoom 存在，曲线同形；zoom 原点恒为面板中心（本次 `260px 106px`），没有点击捕获 | **已复现差异**（曲线 OK，原点错误） | `Modal.ts` 未实现 antd 的点击位置捕获 |

### 2.1 打开阶段是否正常

Select、DatePicker、Popconfirm、Notification、Modal 的**打开**阶段均有真实
CSS 动画：

- Select/DatePicker：`apollo-slide-up-appear-start → active`，`apollo-slide-up-in`，
  duration 0.2s；在真实浏览器中可观测到 opacity/scaleY 连续变化。
- Popconfirm：`apollo-zoom-big-appear-start → active`，`apollo-menu-zoom-big-in`
  实际生效（类名与 keyframe 名前缀不同，但 animation 已运行）。
- Notification：`apollo-notification-fade-appear-start → active`。
- Modal：mask `apollo-modal-fade-in`、panel `apollo-modal-zoom-in`，
  duration 0.2s。

**结论：问题集中在关闭/再次展开，而不是「完全没有动画」。**

## 3. 逐项证据与根因

### 3.1 MOT-01/02/03：共享 Trigger 关闭时把浮层移出视口

**实测时间线（Select，独立示例页）**

```
open +0ms   class="… apollo-slide-up-appear apollo-slide-up-appear-start …"
            rect=[24,102,0,0]  opacity=0
open +50ms  class="… appear-active …" rect=[24,102,120,109]
close +0ms  class="… apollo-slide-up-leave apollo-slide-up-leave-start …"
            style="inset: -1000vh auto auto -1000vw; …"
            rect=[-14400,-9000,120,136]
close +50ms  class="… leave-active …" animation=apollo-slide-up-out
            rect 仍在 [-14400,-9000]
close +350ms display:none
```

antd 同操作（真实交互）：

```
close +0ms  style="inset: 68px auto auto 32px" rect=[32,68,220,104]
close +50ms  animation=antSlideUpOut，rect 仍在 [32,68,220,104]
close +350ms display:none
```

**源码根因（S）**

1. `packages/ui/src/_internal/trigger.ts`：
   ```ts
   watch(mergedOpen, (open) => {
     if (!open) {
       offsetInfo.value = { ...offsetInfo.value, ready: false };
       flipMemory.value = {};
     }
   });
   ```
2. 同一文件 `offsetStyle`：
   ```ts
   if (!info.ready) {
     return { left: '-1000vw', top: '-1000vh', right: 'auto', bottom: 'auto' };
   }
   ```
3. 上游 `@rc-component/trigger` 的 `useOffsetStyle` 条件是
   **`if (!isMobile && (ready || !open))`**：关闭但未 ready 时**仍然使用上一次
   offset**，所以离场动画留在原位。

**影响面（S）**：所有把 `motion` 交给 `Trigger` 的组件 —— Select、DatePicker /
RangePicker、Popconfirm、Popover、Tooltip、Dropdown、Cascader、TreeSelect、
AutoComplete、Mentions 等。不是单个组件的 CSS 问题。

### 3.2 MOT-04：Notification 关闭直接卸载

**实测（独立示例页，MutationObserver）**

```
notification.close = [
  { t: 35, type: "removed",
    cls: "apollo-notification apollo-notification-list apollo-notification-topRight …" }
]
```

- 关闭前：1 条 `.apollo-notification-notice`；
- 点击关闭后：t≈35ms 整个 `.apollo-notification` 容器被移除；
- **没有** `apollo-notification-fade-leave-start` / `-active`，也没有 notice
  的 class 变更记录。
- antd：t≈103ms 进入 leave-start，t≈130ms leave-active，t≈353ms 移除。

**源码根因（S）**

`packages/ui/src/notification/engine/NoticeList.ts`：

```ts
h(MotionList, {
  keys: keys.value.map((item) => item.key),
  ...
}, {
  default: (slotProps) => {
    const itemKey = String(slotProps.itemKey);
    const item = keys.value.find((entry) => entry.key === itemKey);
    if (!item) return null;          // ← 被移除的 key 在这里拿不到 config
    return renderItem(item.config, …);
  },
})
```

`keys` 由**当前** `props.configList` 计算；`onNoticeClose` 先过滤掉该 key，
MotionList 虽然还保留 removed entity，但 slot 里 `keys.value.find()` 已经找不到
config，于是返回 `null`，CSSMotion 没有内容可渲染，整条通知/容器提前卸载。
`MotionList` 当前只把 **key 字符串** 传进 slot，没有把 `{ config }` 载荷带进
removed entity，是缺口的另一半。

### 3.3 MOT-05：Tree 收起正常、再次展开没有 appear

**实测（独立示例页）**

```
collapse +0ms   .apollo-tree-treenode-motion -leave -leave-start
collapse +30ms  -leave-active style="height:0;opacity:0" h=0
collapse +150ms opacity=0
collapse +300ms motion=0, nodes=2
reopen +300ms   nodes=7, motion=0   ← 没有 -treenode-motion 包装
```

antd 同操作：收起同样有 leave；**再次展开时 `-treenode-motion` 存在**（motion=1）。

**初步归因（H）**：`NodeList` 的 expand diff 分支在“收起后再展开”路径没有
生成 MOTION_KEY 哨兵，或 `MotionTreeNode` 的新实例没有进入 appear 阶段；
需在阶段 1 用 `NodeList` 的 `prevExpandedKeys/prevData/transitionData` 逐帧探针
确认。**不能直接重写 Tree motion** —— 仓库已有 2026-10-17 的收起修复，
先定位精确回归点。

### 3.4 MOT-06：Modal 的 zoom 原点没有跟随点击位置

**实测（独立示例页，点击 Open Modal 打开）**

```
本仓 .apollo-modal:
  style="width: 520px;"
  computed transform-origin: 260px 106px   ← 面板中心
antd（临时 playground，同一操作）:
  style="width: 520px; transform-origin: -398px -76px;"  ← 点击点相对面板
```

**源码事实（S）**

- antd `es/modal/Modal.js` 末尾在 `document.documentElement` 上挂 **capture 阶段
  click** 监听，记录 `pageX/pageY`，100ms 内有效，并把
  `customizeMousePosition ?? mousePosition` 传给 Dialog（`Modal.js:24-41, 228`）。
- 本仓 `packages/ui/src/modal/Modal.ts:524` 只传 `props.mousePosition`：
  ```ts
  mousePosition: props.mousePosition,
  ```
  没有“最近一次点击”的捕获。`Content.ts` 的原点计算本身是对的
  （`mousePosition - offset(panel)`），缺的是上游的输入。

**结论**：Modal 的 fade/zoom 曲线不是主要差距；**zoom 从中心 vs 从点击点展开**
是肉眼可见的入场差异。阶段 1 应以 Vue 生命周期实现同样语义（document click
capture + 100ms 失效 + 卸载清理），不能照搬 React 模块级副作用。

## 4. docs 容器 vs runtime 的判定

| 组件 | 独立示例页 | 组件文档页 | 结论 |
|---|---|---|---|
| Select | 关闭跳到 -1000vw | 同样 | runtime / Trigger |
| DatePicker | 同样 | 同样 | runtime / Trigger |
| Popconfirm | 同样 | 同样 | runtime / Trigger |
| Notification | 关闭立即卸载 | 同样（额外有其它 demo 的 notice 干扰，需按文本定位） | runtime / NoticeList |
| Tree | 收起正常、再展开无 motion | 同样 | runtime / Tree |
| Modal | 原点为中心 | 同样 | runtime / Modal |

**Demo 容器（`.demo-preview overflow:hidden`、Grid、iframe）不是这六类动效的根因。**
但 DOC-01/11 的“fixed/portal 没有独立视口”仍是独立的文档基础设施问题，阶段 3 处理。

## 5. 阶段 1 修复优先级（建议）

| 顺序 | 工作包 | 改动层 | 关闭条件 |
|---|---|---|---|
| 1 | `MOT-CORE`：Trigger 关闭时保留最后一次 offset | `_internal/trigger.ts` | 单测 + 真实浏览器：Select/DatePicker/Popconfirm 关闭时 rect 保持在原位，动画结束后才 hidden；快速开合无残留 |
| 2 | `MOT-POPUP`：全 Trigger 消费者回归 | Select/DatePicker/Popover/Tooltip/Dropdown/Cascader/TreeSelect/Mentions | 每个至少 1 条关闭/复开浏览器用例，不能只测 Select |
| 3 | `MOT-LIST`：Notification 的 leave 数据保留 | `NoticeList` + `MotionList` | 关闭时先进入 leave-start/active，约 0.2s 后移除；超时移除同一路径；连续多条不闪现 |
| 4 | `MOT-MODAL`：点击位置捕获 + 原点 | `Modal.ts`（或 `_internal`） | 点击打开时 `transform-origin` 等于点击点相对面板；无点击/100ms 过期时回退中心；卸载清理监听 |
| 5 | `MOT-TREE`：再次展开 appear | `NodeList` / `MotionTreeNode` | 收起后立即/等完再展开，都有 `-treenode-motion`；连续开合不锁死 |

## 6. 未完成的阶段 0 项

- Tree **虚拟列表**、动画期间再次点击、拖拽期间收起：本轮只测了 basic 的
  收起/再展开，虚拟分支未测；阶段 1 需补。
- Notification **超时移除**：代码与点击关闭共用 `onNoticeClose`，本轮未单独
  等待 4.5s 计时；阶段 1 用 fake timer/可控 duration 覆盖。
- Popconfirm 的 **hover 触发**、外部点击、触发目标卸载：本轮验证 click + 取消；
  其余分支阶段 1 覆盖。
- Modal 的 `destroyOnHidden`、`afterClose`、mask 同步、快速开合：本轮只测
  basic 开/关；阶段 1 补齐。

> 本阶段未修改任何组件源码；`registry/*.json` 未变动。
