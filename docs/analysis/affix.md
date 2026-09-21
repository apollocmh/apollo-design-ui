# Affix · G1 分析产物

> 依据：`/tmp/antd-src/package/es/affix/{index.js,utils.js,style/index.js}`（antd 6.6.4）。
> **本文件先于实现**（WORKFLOW 收口流程要求）。行号指 antd 源文件。

## 1. 它是什么

「固钉」：把一块内容**钉在视口（或某个滚动容器）的顶部/底部**，原来的位置留一个等高占位，
避免布局跳动。它**不渲染任何业务 DOM**，只做「测量 → 定位」。

## 2. 结构（`index.js:186-203`）

```html
<!-- 外层：占位测量节点（ref=placeholderNode），restProps 落在这里 -->
<div style="{...contextStyle, ...style}" class="clsx(className, contextClassName)">
  <!-- ① 占位：只有 affixStyle 存在时才渲染，aria-hidden -->
  <div style="{width, height}" aria-hidden="true"></div>
  <!-- ② 固定层：affixStyle 在时才有 apollo-affix 类名 -->
  <div class="apollo-affix?" style="{position:fixed, top|bottom, width, height}">
    <ResizeObserver>{children}</ResizeObserver>
  </div>
</div>
```

关键点：
- **两层**。外层始终在文档流里（负责占位测量）；内层在固钉时 `position: fixed`。
- **类名只在固钉时出现**：`mergedCls = clsx({ [rootCls]: affixStyle })`（`:181-183`）——
  未固钉时内层**没有** `apollo-affix` 类名。这是 L4 最容易写错的一条。
- 占位层 `aria-hidden="true"`（`:186`）。
- `ResizeObserver` 包了**两处**：外层整体、以及 `children`（`:175` / `:200`）。
  任何一侧尺寸变化都要重新测量。

## 3. 定位判据（`utils.js`，**纯函数，必须单测**）

```js
getTargetRect(target)  // window → {top:0, bottom:innerHeight}；否则 getBoundingClientRect()
getFixedTop(placeholderRect, targetRect, offsetTop)
  // offsetTop !== undefined && round(targetRect.top) > round(placeholderRect.top) - offsetTop
  //   ⇒ offsetTop + targetRect.top；否则 undefined
getFixedBottom(placeholderRect, targetRect, offsetBottom)
  // offsetBottom !== undefined && round(targetRect.bottom) < round(placeholderRect.bottom) + offsetBottom
  //   ⇒ offsetBottom + (window.innerHeight - targetRect.bottom)；否则 undefined
```

⚠️ **`Math.round` 参与比较但不参与结果** —— 返回值用原始值算。单测要钉住这一条。

⚠️ **`internalOffsetTop` 的互锁**（`:38`）：
`offsetBottom === undefined && offsetTop === undefined ? 0 : offsetTop`
⇒ **只传 `offsetBottom` 时，`offsetTop` 分支的判据用的是 `0`**（不是 `undefined`）。
但 `getFixedTop` 第一行要求 `offsetTop !== undefined` ⇒ **依然不触发**。
这条互锁的存在意义是「两者都没传时默认 0」，单测要覆盖「只传 offsetBottom」。

⚠️ **占位节点零矩形直接跳过**（`:48-50`）：`top===0 && left===0 && width===0 && height===0`
⇒ 视为「还没量到」，直接 return（不更新状态）。隐藏元素（`display:none`）会命中。

## 4. 状态机

```
AFFIX_STATUS_NONE = 0, AFFIX_STATUS_PREPARE = 1
measure():        只有 status === PREPARE 才执行；执行完回 NONE
prepareMeasure(): status = PREPARE; measure()
updatePosition(): throttleByAnimationFrame(prepareMeasure)   ← 对外（ref.updatePosition）
lazyUpdatePosition(): throttleByAnimationFrame(              ← 绑在滚动/resize 上
    如果已固钉且算出的 fixedTop/bottom 与当前 affixStyle 相同 ⇒ 直接 return（省一次重排）
    否则 prepareMeasure())
```

⚠️ `lazyUpdatePosition` 的「短路」是**性能契约**（`:58-70` 注释写明「make Safari smooth」），
单测要覆盖「已固钉且位置没变 ⇒ 不重算」。

## 5. 事件与生命周期

- `TRIGGER_EVENTS = ['resize','scroll','touchstart','touchmove','touchend','pageshow','load']`
  绑在 **target**（默认 `window`）上，handler 是 `lazyUpdatePosition`（`:74-88`）。
- mount：**先 `setTimeout(addListeners)`**（`:97-99`，注释写明是 legacy——等父组件 ref 就绪）。
  ⚠️ 这意味着**首帧不监听**；对 Vue 侧等价物是 `onMounted` 里 `setTimeout`。
- `addListeners` 的实现是「先把上一次的移除，再加新的」，且**移除时用的是旧 target**（`:76-79`）
  —— 换 `target` 时必须同时从旧 target 解绑。
- 依赖变化 `[target, affixStyle, lastAffix, offsetTop, offsetBottom]` ⇒ 重新 add/remove（`:104-107`）。
  ⚠️ 意味着**每次固钉状态翻转都会重新绑事件**。Vue 侧用 `watch` 对等实现。
- 卸载时 `updatePosition.cancel()` / `lazyUpdatePosition.cancel()`（`:89-92`）——
  **必须防「卸载后 still fire」**。

## 6. 样式（`style/index.js`）

```css
.apollo-affix { position: fixed; z-index: var(--zIndexPopup); }
/* prepareComponentToken: zIndexPopup = zIndexBase + 10 */
```

⚠️ **这是全库第一个有组件 Token 的「非视觉」组件**：Token 只有一个 `zIndexPopup`。
⚠️ 脚手架**没有**预注册 affix（`packages/ui/src/index.ts` 与 `style/index.ts` 里搜不到
`Affix`/`affix`）⇒ 两个共享文件都要加我自己的块（按字母序）。
⚠️ antd 的 z-index 是**字面量派生**（`zIndexBase + 10`）——`zIndexBase` 在 antd 里是 token；
我们这边用 `var(--apollo-z-index-base)` 若存在则引用，否则用 `calc` + 字面量，
**必须走 Token**（H9），并在 `token.ts` 里写清来源。

## 7. 与 React 的平台差异（预期，先登记）

| # | 差异 | 分类 |
|---|---|---|
| 1 | 无 CSS-in-JS 的 hashId / cssVarCls（D5） | PLATFORM |
| 2 | `children` 是默认插槽而非 prop（C19） | INTENDED |
| 3 | `onTestUpdatePosition` 只在 `NODE_ENV==='test'` 下被调用（`:55`）——**不移植**（测试钩子，Vue 侧用别的办法暴露） | INTENDED |
| 4 | `rc-resize-observer` → `utils/src/observers/use-resize-observer`（已存在 ✓） | PLATFORM |
| 5 | `throttleByAnimationFrame` → `utils/src/throttle-by-animation-frame.ts`（已存在 ✓） | PLATFORM |

## 8. jsdom 下测不了的（**如实登记，不编造**）

- **真实滚动**：jsdom 不触发真实滚动事件、没有真实布局 ⇒ `getBoundingClientRect()` 恒 0。
  ⇒ 定位判据只能**用假的 rect 直接喂 `getFixedTop/Bottom` 单测**；
  组件级的「滚动后固钉」测不到。
- **`ResizeObserver`**：jsdom 没有原生实现（需要 polyfill/mock）⇒ 组件级「子内容尺寸变化
  触发重测」测不到，只能断言「监听器已注册」。
- **`window.innerHeight`**：jsdom 是 0 ⇒ `getFixedBottom` 的结果会错。
  ⇒ 单测里 **mock `window.innerHeight`**。
- ⇒ **L6 视觉回归只能覆盖「未固钉」的静态形态**；固钉态（`position:fixed`）在 jsdom+Playwright
  的静态渲染里不成立，除非用真实滚动 —— 登记为缺口。

## 9. 验收要点（写测试前先立在这）

1. `getFixedTop` / `getFixedBottom` / `getTargetRect` 的**边界**（round、undefined、互锁）。
2. **类名只在固钉时出现**。
3. 占位层的 `aria-hidden` 与宽高。
4. `onChange` 只在状态**翻转**时触发（连续固钉不重复发）。
5. 事件**解绑**（卸载后滚动不得再触发）。
6. 默认 target 是 `window`；`target` 换绑时旧 target 也要解绑。
