# image 分析（G1）

> 契约来源：antd 6.6.4 `components/image/`（index.tsx 325 / PreviewGroup.tsx 160 /
> Progress.tsx 147 / hooks ×3 / style 508 + progressAnimation 37）
> + `@rc-component/image@1.10.0`（es 合计 ~1480 行：Image 190 / Preview 360 /
> Footer 152 / useTouchEvent 169 / useImageTransform 116 / useMouseEvent 115 /
> PreviewGroup 110 / …）。
>
> 上游是**兼容性规格**，不是代码来源。

## 1. 分层

```
antd index.tsx（壳）          语义槽合并 + preview 配置合并 + Progress 叠加 + deprecated 告警
  └─ rc-image Image.js        本体：div.{p} > img.{p}-img [+ placeholder] [+ cover]；Preview 挂在后面
       ├─ hooks/useStatus     src 加载状态机（loading / loaded / error → fallback）
       └─ Preview/index.js    portal 预览浮层（mask/body/img/footer/close/prevnext）
            ├─ useImageTransform   transform { rotate, scale, flipX, flipY, x, y }
            ├─ useMouseEvent       拖拽 + 滚轮缩放
            ├─ useTouchEvent       双指缩放/拖拽
            ├─ Footer.js          工具栏（zoomIn/out、rotate、flip、1:1）
            └─ PrevNext.js        组内上一张/下一张
antd PreviewGroup.tsx         壳：icons + preview 配置合并 → RcImage.PreviewGroup
antd Progress.tsx             占位进度（percent / 水彩墨层 ink-1/ink-2 / rail+indicator）
```

## 2. 渲染树（可 SSR 部分，L4 的目标）

```html
<!-- Image 本体（preview=false 时无 Preview） -->
<div class="{p} {p}-error?" role="button" tabindex="0" aria-label=alt style="width;height">
  <img class="{p}-img [{p}-img-placeholder]" src alt width height style="height" />
  <!-- status==='loading' -->
  <div aria-hidden="true" class="{p}-placeholder">{placeholder}</div>
  <!-- cover !== false && canPreview -->
  <div class="{p}-cover {p}-cover-{center|top|bottom}">{cover}</div>
</div>
<!-- Preview 走 portal：SSR 不可见 —— 与 tooltip/popover 同判（D 登记） -->
```

Preview 的 DOM（浏览器态，L1/L5/L6 承担）：

```html
<div class="{p}-preview {p}-preview-root">          <!-- portal 根，zIndex -->
  <div class="{p}-preview-mask" />                   <!-- 遮罩，mask=false ⇒ -mask-hidden -->
  <div class="{p}-preview-body">
    <div class="{p}-preview-img-wrapper" style="transform: translate(...)">
      <img class="{p}-preview-img" style="transform: scaleX(...) rotate(...) scale(...)" />
    </div>
  </div>
  <div class="{p}-preview-footer">
    <div class="{p}-preview-actions">
      <button class="{p}-preview-actions-action" />  <!-- ×7：zoomOut/zoomIn/rotateRight/rotateLeft/flipX/flipY/1:1 -->
    </div>
    <div class="{p}-preview-progress">1 / 3</div>     <!-- 组内计数（count>=1 才显示） -->
  </div>
  <button class="{p}-preview-close" />                <!-- closeIcon -->
  <div class="{p}-preview-switch-prev" />             <!-- 组 + count>1 -->
  <div class="{p}-preview-switch-next" />
</div>
```

## 3. 行为契约（L1/L2 的判据）

1. **状态机**（rc useStatus）：`src` 空 ⇒ `loading` 不发请求；`loaded` / `error`；
   error 且给了 `fallback` ⇒ 换 fallback src；占位 `${p}-placeholder` 在
   `loading` 时渲染（`aria-hidden=true`）。
2. **可预览**：`preview !== false` ⇒ 根 `role=button`、`tabindex=0`、
   `aria-label = aria-label ?? alt`；点击 / Enter / Space 打开预览
   （`mousePosition` = 目标中心）。
3. **cover**：`cover !== false && canPreview` 才渲染；`cover.placement` ∈
   center/top/bottom（默认 center）；`style.display === 'none'` 时 cover 也隐藏。
4. **previewSrc 优先**：预览图用 `preview.src ?? src`。
5. **受控预览**：`preview.open` 受控 ⇒ `onOpenChange(next)`；点击遮罩
   （`maskClosable` 默认 true）关闭；ESC 关闭。
6. **变换**：`scale ∈ [minScale=1, maxScale=50]`、`scaleStep=0.5`；双击
   `scale !== 1` ⇒ 复位，`scale === 1` ⇒ 放大；滚轮按 `BASE_SCALE_RATIO`
   （0.1 步进的指数式）；`resetTransform('close')` 关闭时复位。
7. **键盘**（Preview）：ESC 关闭；组内 ←/→ 切换；`focusTrap` 锁焦点。
8. **Progress**：`placeholder = { progress: true | { percent, render } }` ⇒
   只渲染 Progress 层（带 width/height）；无 percent ⇒ `aria-busy=true` +
   `role=status` 的 "Loading"；有 percent ⇒ `role=progressbar` +
   aria-valuenow（clamp 0–100 四舍五入）。
9. **placeholder 为 ReactNode 且无 src** ⇒ 作为 overlay 渲染
   （rc 会因空 src 置 error）。
10. **deprecated ×5**：`wrapperStyle`（→styles.root）、`preview.visible`
    （→open）、`preview.rootClassName`（→classNames.root）、
    `preview.maskClassName`（→classNames.cover）、`preview.toolbarRender`
    （→actionsRender）；`forceRender`/`destroyOnClose` 已移除（不告警，忽略）。
11. **PreviewGroup**：注册式收集（`useRegisterImage` 返回自增 id；
    `usePreviewItems` 维护 items 与 current），切换时把 `mousePosition`
    传给新 Preview；rtl 时 left/right 图标互换。
12. **zIndex**：`useZIndex('ImagePreview', preview.zIndex)`。

## 4. Token / 样式

- ComponentToken 6 个（registry）：`zIndexPopup`、`colorTextDescription`、
  `previewBg`（= colorBgMask）、`previewMaskBg`、`previewOperationColor`、
  `previewOperationColorDisabled`（+ `previewOperationSize` 等派生，以实际
  prepareComponentToken 为准）。
- 样式 508 行：root / img / placeholder / cover（+placement）/ preview 族。
- 提取走 SSR 管线（`extract-image.mjs`，括号配平）。

## 5. 依赖缺口

| # | 缺口 | 说明 |
|---|---|---|
| P1 | preview 的 portal 浮层 | 复用 `portal.Portal` + `motion.CSSMotion`（已有） |
| P2 | `useZIndex('ImagePreview')` | portal 的 zIndex 层叠体系（已有） |
| P3 | 触摸/鼠标手势 | rc 的 useTouchEvent/useMouseEvent 需 Vue 化（~280 行） |
| P4 | focusTrap | rc 的 useLockFocus；v1 简化为 ESC + 初始聚焦（PENDING） |
| P5 | 语义槽函数式形态 | D36 同判 |

## 6. 实现顺序（逐 Gate 可推送）

1. `extract-image.mjs` → `style/index.ts` + `style/token.ts`（机械转换）
2. `interface.ts`（ImageProps / PreviewConfig / 语义槽 5 组）
3. `Progress.ts`（占位进度，纯结构 + L6 可见）
4. `Image.ts`（本体：状态机 + cover + 键盘 + Preview 挂载点）
5. `Preview.ts`（portal 浮层：结构 + 变换 + 键盘）
6. `PreviewGroup.ts`（注册 + 切换 + rtl 图标）
7. demo ×14 → L1/L4/L5/L7/L3 → L6 → registry → 文档 → G14

## 7. 风险预登记

- Preview 的像素比对：与 tooltip/popover 同模式（open 受控静态帧 +
  `screenshotElement` 的 motion 相位剥离）；图片来自外网 URL ⇒
  L6 用例改用 **data URI / 本地 assets**，否则网络抖动会污染基线。
- 手势（拖拽/双指/滚轮）属 L2 交互层；jsdom 不可测 ⇒ 由 L6 + 最小
  transform 计算单测（useImageTransform 纯函数）覆盖。
