# Segmented 实现说明

## 1. 契约来源

- 薄壳：antd 6.6.4 `components/segmented/index.tsx`（60 行）与 `es/segmented/index.js`（产物实测）
- 内核：`@rc-component/segmented@1.4.0` `es/index.js` + `es/MotionThumb.js`（H5 替代目标，全部重写为 Vue）
- 样式：antd `es/segmented/style/index.js`（genSegmentedStyle + prepareComponentToken 逐条对照）
- DOM 基线：`tests/compat/baselines/segmented.dom.json`（23 用例，机械 oracle，由 `tests/compat/baseline/segmented.mjs` 生成）

## 2. 与 antd 的行为差异清单（同步 COMPATIBILITY.md §9）

| # | 差异 | 分类 | 说明 |
| --- | --- | --- | --- |
| D6 | 默认 prefixCls `apollo` vs `ant` | INTENDED | 裁决 `prefix-cls-default` = A，semantic.test allow 登记逐条 diff |
| 1 | `onChange` 走 attrs 不走 emits | INTENDED | PITFALLS 35（Vue 会把 props 回调摘进 emits），与 `update:value` 同发（C11） |
| 2 | `classNames` / `styles` 的函数式输入在 props 层声明为 `[Object, Function]` | INTENDED | Vue 的运行时 prop 校验需要显式放行函数式 |
| 3 | 受控值不在 options 里时不自动切换 | 同上游 | rc 判据「single source of truth」，测试钉住 |
| 4 | `-vertical` 类在根元素出现两次 | UPSTREAM | antd 薄壳加一次 + rc 内核加一次；逐字保留（semantic 基线可见） |

## 3. 为什么主实现是 `.ts`（defineComponent + h）而非 `.vue`

满足 COMPONENT-RULES.md §2 的条件 1/2：options 是**数据驱动**的动态渲染树（原始值 / 对象 / icon / tooltip 四种形态混合），itemRender 与 Tooltip 的组合包装在渲染函数中表达最自然；与 radio/Group 同范式。

## 4. 实现要点（最容易写错的判据）

1. **初始值**：`defaultValue ?? options[0]?.value`（rc `useControlledState` 首参）—— 没给 defaultValue 自动选第一项。
2. **thumb 动画 = 卸载/挂载/appear**：`prevStyle && nextStyle` 缺一不渲染 thumb；动画期间 `-item-selected` 让位给 thumb（只留 `-item-selected-text` 文字色），结束恢复。Vue 侧 watch + nextTick 测量等价 React useLayoutEffect。
3. **键盘导航集合**：有效集合 = 非 disabled 项 + 当前项（即使当前项 disabled 也保留）；环绕取模；handler 挂在 input 上（disabled input 不派发事件 → 该分支防御性不可达，测试有说明）。
4. **焦点样式**：`-item-focused` = isFocused && isKeyboard && 选中项；isKeyboard 靠 Tab keyup 置真、mousedown 置假。
5. **闭包变量陷阱**：`node = h(Tooltip, …, { default: () => node })` 会无限递归（slot 求值时捕获的是重新赋值后的变量），必须用不变的局部变量承载 label 元素。
6. **title 判据**：显式 title 用之；否则对非对象 label 取 `label.toString()`；对象 label 无 title。
7. **token 声明嵌入根块**：Component Token 的 8 个 `--apollo-segmented-*` 声明嵌在根选择器块内（与 radio 同范式），`genSegmentedStyle` 输出自包含。

## 5. Component Token（8 个，全部 var() 派生）

trackPadding=lineWidthBold、trackBg=colorBgLayout、itemColor=colorTextLabel、itemHoverColor=colorText、itemHoverBg=colorFillSecondary、itemSelectedBg=colorBgElevated、itemActiveBg=colorFill、itemSelectedColor=colorText。
派生量（非 Component Token）：segmentedPaddingHorizontal = controlPaddingHorizontal − lineWidth（SM 同式）；labelHeight = controlHeight − trackPadding×2。

## 6. 测试环境已知边界

- ✅ **2026-10-03 更正（原记法是误诊）**：原写「jsdom 下 Vue 的 mousedown/mouseup listener 不被派发调用
  （裸 `h('div', {onMouseDown})` 即可复现）」—— **根因不是 jsdom，是事件名大小写**：
  Vue 的 `parseName` 会对 `on` 之后的部分做 `hyphenate` ⇒ `onMouseDown` 解析成 **`mouse-down`**
  （**永不触发、且不报错**）；而原记录里说「正常」的 `click`/`keydown`/`mouseenter` 恰好都是
  **单段名**，不受影响。`Segmented.ts` 已改为 **`onMousedown`**（同日），该行为现在由 L1 可测。
  判据与反向哨兵见 `PITFALLS.md` **323** 与 `color-picker/__tests__/engine.test.ts` 末节。
- SSR/基线下 MotionThumb 不渲染（无几何）——React 的 useLayoutEffect 与 Vue 的 watch 均不在静态渲染期执行，两侧天然一致。
