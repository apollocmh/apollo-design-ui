# Tooltip 分析（G1/G2 产物）—— antd 6.6.4

> 判据：`/tmp/antd-src/package/es/tooltip/`（构建产物）+
> `/tmp/ant-design-master/components/tooltip/`（源码 + 14 demo + 8 个测试文件）+
> `/tmp/rctooltip/package/es/`（@rc-component/tooltip@1.5.2，398 行）+
> `/tmp/rctrigger/package/es/`（@rc-component/trigger@3.10.1，2254 行）。
> 先于实现存在（AGENTS §2 步骤 3）。
>
> ⭐ 本组件是 **trigger 的第一个消费者**（registry 备注：验证 ARCHITECTURE.md AR1）。
> 交互语义已由 `@apollo-design/overlay`（useOverlay）承接、几何由 `@apollo-design/position`
> 承接、挂载由 portal 承接、动画由 motion 承接 —— tooltip 的实现主体是
> **把它们组装成 `_internal/trigger.ts`（Vue 版 rc-trigger 的最小核心）**，再在其上叠 Tooltip。

## 1. 组件结构与文件映射

| antd / rc | 本仓落点 | 说明 |
|---|---|---|
| `@rc-component/trigger`（index + Popup + hooks ×6） | `_internal/trigger.ts` | **新增共享基建**：15 个下游组件（popover/popconfirm/dropdown/select/cascader/date-picker…）共用，不放在 tooltip 目录里 |
| `@rc-component/tooltip` Tooltip.js | `tooltip/Tooltip.vue` | 薄包装：placements 记忆 + arrow 合并 + aria-describedby + 箭头 content |
| `@rc-component/tooltip` Popup.js | trigger 内部的 container 段 | `div.{p}-container[role=tooltip]` |
| antd `index.tsx`（436 行） | `tooltip/Tooltip.vue` | 语义合并 / 颜色 / zIndex / deprecated 告警 / noTitle 抑制 |
| antd `PurePanel.tsx` | `tooltip/PurePanel.vue` | `_InternalPanelDoNotUseOrYouWillBeFired` 静态面板 |
| antd `hook/useMergedArrow.ts` | `tooltip/use-merged-arrow.ts` | `arrow`（boolean/对象）与 ConfigProvider.arrow 的合并，`show` 默认 true |
| antd `util.ts`（parseColor） | `tooltip/util.ts` | 预设色 ⇒ `-blue` 等类名；自定义色 ⇒ 亮度 < 0.5 ⇒ 白字 + 箭头背景内联 |
| antd `style/index.ts` | `tooltip/style/` | token 2 个 + 静态 CSS |
| antd `UniqueProvider/`（unique 共容器优化） | **v1 不做** | overlay-contract §8 P4 已登记；antd 传 `unique: true` 是性能优化，语义等价，差异登记 |

## 2. 渲染树（SSR oracle 判据，antd 6.6.4）

```
span.{p}-root（ZIndexContext 由 Provider 提供，DOM 上是普通 span？ —— 以 SSR oracle 为准）
└─ (Teleport 到 getPopupContainer(target) 或 body)
   ├─ div.{p}                          ← trigger 根（CSSMotion 挂 className + {p}-hidden）
   │  ├─ （style: position:absolute; left/top 或 right/bottom=auto;
   │  │    --arrow-x/--arrow-y; zIndex; box-sizing:border-box; pointer-events:none 当关闭）
   │  ├─ div.{p}-arrow                 ← arrowPos 定位（top/bottom + left/right 二选一）
   │  │  └─ span.{p}-arrow-content     ← antd 传的 arrowContent
   │  └─ div.{p}-container[role=tooltip][id]  ← rc-tooltip Popup；children = title/overlay
   └─ （mask 仅 mobile/mask 场景，tooltip 无）
```

⚠️ 精确结构以 `tests/compat/baselines/tooltip.dom.json`（renderToStaticMarkup 机械
oracle）为准 —— 上面是读源码得出的预判，**写 L4 前先生成基线**（upload 教训 #82）。

## 3. 行为契约（判据清单）

1. **触发动作**：`trigger` 默认 `'hover'`（antd 默认单值；rc-tooltip 默认 `['hover','focus']`
   被 antd 覆盖）；`resolveActions` 语义同 overlay §3.1。延迟：antd 默认
   mouseEnter/Leave = **0.1s**（覆盖 rc 的 0/0.1）。
2. **noTitle 抑制**：`!title && !overlay && title !== 0` ⇒ 强制关闭且
   `onOpenChange` 不触发（index.tsx 的 `onInternalOpenChange`）。`title={0}` 是合法内容。
3. **受控/非受控**：`open` + `defaultOpen`；受控时事件仍先改内部状态（C11 双通道：
   `v-model:open` + `onOpenChange`）。
4. **children 包装**：非元素 / fragment 的 children 包一层 `<span>`；开启时给 child
   追加 `openClassName || {p}-open`（受控 open 不加 `-open`，antd 判 `'open' in props`）。
5. **aria**：child 上 `aria-describedby={overlay && open ? mergedId : undefined}`
   （与已有 id 拼接）；容器 `role=tooltip` + 同 id。
6. **placement**：默认 `'top'`；12 个 placement + `arrowPointAtCenter`
   （points 换用 arrow-center 点表）+ `autoAdjustOverflow`（默认 true）。
   `getPlacements({ arrowPointAtCenter, autoAdjustOverflow, arrowWidth: showArrow ?
   sizePopupArrow : 0, borderRadius, offset: marginXXS, visibleFirst: true })`。
7. **motion**：`{p}-zoom-big-fast`（getTransitionName(rootPrefixCls)），
   `motionDeadline: 1000`；`destroyOnHidden`（旧名 `destroyTooltipOnHide`，deprecated 告警 ×4：
   overlayStyle→styles.root、overlayInnerStyle→styles.container、overlayClassName→classNames.root、
   destroyTooltipOnHide→destroyOnHidden）。
8. **箭头**：`arrow` 三形态（false / true / `{ pointAtCenter, className, style, content }`）；
   ConfigProvider.tooltip.arrow 参与合并（useMergedArrow：prop 优先、show 默认 true）。
   autoArrow 关闭箭头自动贴边。
9. **颜色**：`color` 预设色（isPresetColor）⇒ `.{p}-{color}` 类；自定义色 ⇒
   `overlayStyle.background` + `--{root}-tooltip-overlay-color`（亮度 < 0.5 ⇒ '#FFF' 否则 '#000'）+
   箭头 `--{root}-tooltip-arrow-background-color`。**color-picker/util 的 generateColor
   是依赖**（registry leafModules 已记 color-picker/util）。
10. **zIndex**：`useZIndex('Tooltip', zIndex)`（_util/hooks）—— 本仓 **缺口**：ui 尚无
    useZIndex；v1 直接透传用户 zIndex / 默认 1070（antd tooltip 的 zIndexPopupBase），
    差异登记（嵌套浮层层叠进阶留待 overlay P 系列）。
11. **TableMeasureRowContext**：在 table 测量行内强制不显示 —— 本仓 table 未落地，
    context 不存在 ⇒ 恒 false，登记 INTENDED。
12. **Popup 内部行为**（rc-trigger）：关闭时 `pointerEvents:none` + `keepDom`
    （removeOnLeave=false + `{p}-hidden`）；`fresh` 关掉内容缓存；ResizeObserver 触发
    re-align；getPopupContainer 需要参数时延一帧挂载。
13. **几何**（position 包承接）：flip（对称 placement）、overflow 调整
    （collectScroller + getVisibleArea）、箭头位置 `--arrow-x/y` 与 arrowPos 的
    top/bottom/left/right 选择（Arrow.js 的 autoArrow 分支）。
14. **事件名**：内部 `v-bind` 的键必须是 **Vue 小写约定**（`onMouseenter` 等，
    overlay-contract §6.1，实测踩过的坑）。

## 4. API 面（Vue 化）

- **v-model:open** + `onOpenChange` 双通道（C11）；其余回调 `onPopupClick` 等走 attrs。
- `title`：`VNodeChild | (() => VNodeChild)`（函数式 overlay 支持）；`overlay` deprecated？
  —— antd 6.6.4 未废弃 overlay，保留双 prop。
- 语义槽：`classNames/styles = { root, container, arrow }`（rc-tooltip 的三件套）+
  antd 的 `uniqueContainer`（unique 不做 ⇒ 忽略该槽）。
- Expose：`forceAlign()` / `nativeElement` / `popupElement`。
- `getPopupContainer` / `getTooltipContainer`（旧名，同物）；`autoDestroy`。
- `afterOpenChange(visible)` 经 motion 的 onVisibleChanged。

## 5. Token（registry：2 个）

组 Tooltip：`zIndexPopup = 1070`、`tooltipMaxWidth = 250`（以 style/index.js 的
componentToken 定义为准，G3 时逐字对拍）。派生：arrow 背景 = colorBgSpotlight、
容器 = colorBgElevated + boxShadowSecondary、圆角/字号走 alias。

## 6. 依赖缺口与替代（D 登记候选）

| # | 缺口 | 处置 | 分类 |
|---|---|---|---|
| P1 | `useZIndex`（_util/hooks 的面板层叠体系）未落地 | v1：`zIndex ?? 1070`，ContextProvider.zIndex 进阶留待 overlay | INTENDED（待补） |
| P2 | `UniqueProvider`（多 trigger 共享浮层容器） | v1 不做，每个 Trigger 自挂 portal；语义等价 | INTENDED（P4 已登记） |
| P3 | `TableMeasureRowContext`（table 测量行抑制） | 恒 false（table 未落地） | INTENDED |
| P4 | `color-picker/util.generateColor` | 已在 registry leafModules；实现色值解析的最小子集（hex/rgb → 亮度） | INTENDED |
| P5 | `isPresetColor`（_util/colors） | 随 tooltip 一并落到 `_internal/colors.ts`（popover/popconfirm/tag 复用） | INTENDED |

## 7. 实现顺序（后续会话直接照此执行）

1. `_internal/colors.ts`（isPresetColor + 色值亮度）—— 纯函数，先测。
2. `_internal/trigger.ts`：useOverlay + Teleport + getPlacements/alignPopup +
   CSSMotion(zoom-big-fast) + Arrow；expose forceAlign。
3. `tooltip/use-merged-arrow.ts` + `util.ts`（parseColor）。
4. `tooltip/Tooltip.vue` + `PurePanel.vue` + style/token。
5. 七层测试（L4 先生成 SSR oracle 基线再写断言；L6 基线用 `--mode baseline`）。

## 8. 几何对接细则（rc useAlign ↔ position 包的映射，实现时逐条照抄）

Trigger 的每次对齐 = `measureAlign()` + `alignPopup()` + 本地补齐 offsetR/B：

```
const result = measureAlign({ popupEle, target, htmlRegion: alignInfo.htmlRegion, scrollers });
// result: { target, popup, mirror, scaleX, scaleY, visible, check }
const outcome = alignPopup({ target: result.target, popup: result.popup, mirror: result.mirror,
  scaleX, scaleY, visible: result.visible, check: result.check }, alignInfo, flipMemory);
// outcome: { offsetX, offsetY, arrowX, arrowY, points, flip }（floor/scale 归一已内置）
```

**本地补齐 offsetR / offsetB**（rc useAlign 尾部公式，AlignOutcome 不含它们）：

```
offsetX4Right = mirror.x + mirror.width - popup.x - (offsetX * scaleX + popup.width)
offsetY4Bottom = mirror.y + mirror.height - popup.y - (offsetY * scaleY + popup.height)
// rc 用未 floor 的原始 offsetX 参与 offsetR/B 计算（floor 顺序在两者之后）——
// alignPopup 已 floor，scale≠1 时与 rc 有 <1px 差异（已知，登记 PLATFORM）
// 最终值：offsetX4Right / scaleX
```

**样式落点**（useOffsetStyle）：未 ready 或关闭前 `left:-1000vw; top:-1000vh`；
ready 后按 points[0]（popup 侧）写 `left: offsetX, right: auto`（dynamicInset+r 时反之）
与 `top: offsetY, bottom: auto`（dynamicInset+b 时反之）。根元素恒
`box-sizing:border-box; zIndex`，关闭时 `pointer-events:none`。

**箭头定位**（Arrow.js）：`alignStyle.top = (popupTB===targetTB || 非tb) ? y :
(popupTB==='t' ? 0 : 'bottom:0')`，LR 同理 —— 写进 `{p}-arrow` 的内联 style；
CSS 侧消费 `--arrow-x/--arrow-y`。autoArrow=false 时 x/y 直接用。

**对齐类名**（util.js getAlignPopupClassName）：按 points 反查 builtinPlacements
⇒ `.{p}-placement-{placement}`（key 顺序即 getPlacements 的键序）。

**re-align 时机**（useWatch）：滚动（collectScroller(popupEle) 的每个容器，capture）+
window resize；alignPoint+clickToHide 时滚动即关闭。Promise.resolve().then 合帧。
**ready 重置**：placement 变化、open→false。

**motion 契约**：CSSMotion `removeOnLeave=false` + `leavedClassName={p}-hidden` +
`motionAppear/Enter/Leave=true`；`onPrepare`（appear/enter prepare）返回 Promise，
在 resolve 前 `syncTargetSize + onAlign`（首帧定位先于动画）；`inMotion` 期间
冻结 re-align。关闭且动画结束 ⇒ autoDestroy 时卸载 portal。
