# steps（Steps 步骤条）—— G1 分析

> 事实来源：antd 6.6.4 `components/steps/`（壳 index.tsx 493 行 + useDisplaySteps 151 +
> ProgressIcon 47 + PanelArrow 27）+ `@rc-component/steps@1.2.3`（es **394 行**，直接
> `npm pack` 解包 `/tmp/rc-steps-src/`）+ style 18 文件（**1458 行**）。
> 上游是**兼容性规格**，不是代码来源。

## 0. 结论：内核轻，壳重

rc-steps 内核只有 **394 行 / 5 文件**（Steps 119 + Step 166 + StepIcon 33 + Rail 16 +
Context 1），**不需要 engine/ 目录**——直接融进 `Steps.ts` / `Step.ts` 两层自建。
重量在 antd 壳：type 推导（progressDot→dot）、responsive 断点、`useDisplaySteps`
（maxCount 折叠算法 151 行）、internalIconRender（status→图标/序号/进度环）、Wave、
inline 的 Tooltip、panel 的 PanelArrow。

## 1. rc-steps 内核结构（逐层）

```
Steps（布局/状态推导）
├── classString: {p} + {p}-{orientation} + {p}-title-{titlePlacement}
├── statuses: item.status ?? (stepNumber===current ? status : stepNumber<current ? 'finish' : 'wait')
├── onStepClick: onChange && current!==next ⇒ onChange(next)
├── components: { root, item }（内部 InjectContext 用；本仓 v1 不接 app 组件壳）
└── StepsContext.Provider → items.map(renderStep)

Step（item DOM/事件）
├── itemCls = {p}-item
├── clickable = !!(onChange || item.onClick) && !disabled
│   ⇒ role=button + tabIndex=0 + onKeyDown(Enter/Space)
├── mergedContent = content ?? description（deprecated 合流）
├── classString: {itemCls}-{status} + -custom(icon) + -active + -disabled + -empty-header
├── wrapper: -wrapper > (StepIcon + -section > (-header > (-title + -subtitle + Rail) + -content))
│   ⚠️ Rail 在 -header 内、title/subtitle 之后；rail status = nextStatus
│     （UnstableContext.railFollowPrevStatus 默认 false）
└── itemRender / itemWrapperRender / iconRender 三个 render fn 注入点
```

## 2. antd 壳的 12 件事

1. `useComponentConfig('steps')` + InternalContext（app 壳，v1 裁剪——登记）
2. size：`useSize`；`size="default"` deprecated ⇒ medium 告警
3. mergedType：`type ?? (progressDot ? 'dot' : 'default')`；isDot = dot|inline
4. mergedOrientation：panel 恒 horizontal；(responsive && xs) || vertical ⇒ vertical
5. mergedTitlePlacement：isDot/vertical ⇒ 由 orientation 推；navigation ⇒ horizontal；
   其余 titlePlacement || labelPlacement || horizontal
6. `useDisplaySteps`：maxCount≥3 且超量 ⇒ 折叠（首/末/当前恒保留，按
   current 左、右、首右、末左优先补位），非连续下标间插入 **ellipsis 步**
   （icon=EllipsisOutlined、disabled、status=区段内有无 error ? error : 已完成 ? finish : wait，
   originIndex=-1）；onChange 映射回 originIndex
7. internalIconRender：dot|item.icon ⇒ icon；finish ⇒ CheckOutlined；error ⇒ CloseOutlined；
   默认序号 span（process 且 percent≠undefined ⇒ 包 ProgressIcon 进度环）
8. itemRender：inline 且有 content ⇒ 包 Tooltip；外层包 **Wave**（disabled 或无 onChange）
9. itemWrapperRender：panel ⇒ 追加 PanelArrow（SVG 箭头）
10. deprecated 告警 ×4：labelPlacement/progressDot/direction/items.description +
    usage 告警 maxCount<3
11. waveEffectClassNames：classNames.itemIcon 预置 TARGET_CLS（wave 落点）
12. cssVar：`--{rootPrefix}-cmp-steps-items-offset`（inline 的 offset）+ ProgressIcon 的
    `progress-radius`

## 3. C8-R2 映射（强制）

- `iconRender` / `itemRender` / `itemWrapperRender`（render fn）→ **scoped slot**
  `#iconRender="{ iconNode, index, active, item }"`、`#itemRender="{ itemNode, index, active, item }"`、
  `#itemWrapperRender="{ itemNode }"`（prop 不保留）
- `progressDot` 函数形态 → scoped slot `#progressDot="{ iconNode, index, status, title, content }"`；
  布尔形态保留（→ type="dot"）
- `items` 数组字段（title/content/icon/subTitle VNodeChild）是**数据 API**（同 select options），
  程序化上下文，VNode 合法——保留
- `Wave`：本仓无 wave 基建（button 也未实现）⇒ v1 降级不加波纹，
  登记 D 差异（PLATFORM/范围裁剪），classNames.itemIcon 的 TARGET_CLS 同步不注入

## 4. DOM/类名契约（rc 产物 + antd 快照判据，待 L4 基线对拍）

```
<div class="{p} {p}-horizontal {p}-title-horizontal {p}-filled {p}-default|{type} ...">
  <div class="{p}-item {p}-item-process" role="button"?  tabindex="0"?
    style="--{rootPrefix}-cmp-steps-items-offset:0">
    <div class="{p}-item-wrapper">
      <div class="{p}-item-icon">…number/check/close/自定义…</div>
      <div class="{p}-item-section">
        <div class="{p}-item-header">
          <div class="{p}-item-title">…</div>
          <div class="{p}-item-subtitle">…</div>
          <div class="{p}-item-rail {p}-item-rail-{nextStatus}"></div>
        </div>
        <div class="{p}-item-content">…</div>
      </div>
    </div>
  </div>…
</div>
```
⚠️ 无 `<li>`/`<ol>`（v6 用 div）；`-item-rail` 是 **header 的子节点**（不是 item 直接子级）。

## 5. Token（13 个 ComponentToken）与硬编码

公开：descriptionMaxWidth(deprecated)/customIconSize/customIconTop/customIconFontSize/
iconSize/iconTop/iconFontSize/dotSize/dotCurrentSize/dotTop(?)…以 `prepareComponentToken`
提取产物为准（L7 theme 测试对拍默认值）。
硬编码白名单：panel 箭头 path、rail 高度相关字面量（提取脚本产物逐条核对）。

## 6. 风险预登记

1. **useDisplaySteps 是纯算法** —— 直接移植 + 单测（折叠优先级序列）。
2. **responsive**：`useBreakpoint(responsive)` —— 本仓 `_internal/responsive-observer.ts`
   提供 matchScreen；SSR/测试环境 xs=false ⇒ 不强制 vertical（与 antd 断点行为对拍）。
3. **Wave 缺失**（D 登记）。
4. **components 注入**（app 壳的 root/item 组件替换）v1 裁剪（登记）。
5. **inline 的 Tooltip**：本仓 tooltip 刚完成（#title slot 通道）——inline content ⇒
   `<Tooltip :title="content">`。
6. iconRender 的 `components.Icon` 入参：slot 形态下由 slot props 提供
   `components: { Icon: StepIcon }`。
7. 动效：steps 无自有 motion（wave 除外）⇒ 样式提取不含 keyframes。
8. **TestEnvironment**：antd demo 24 个 + `_semantic.tsx`；L4 基线 React SSR oracle。
