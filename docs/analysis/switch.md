# Switch —— antd 6.6.4 契约分析（G1）

> 材料：`.workbuddy-ai/antd-repo/ant-design-master/components/switch/`（index.tsx 198 行 /
> style/index.ts 445 行 / 7 个非 debug demo / index.test.tsx 124 行 + semantic.test.tsx 172 行）
> + `@rc-component/switch@1.0.3` 的 `es/index.js`（DOM 的真正生产者）
> + `/tmp/antd-src/package/es/switch/`（构建产物）。
> **Component Token 13 个**（与 registry 一致）。
> 真实 CSS 产物由 `@ant-design/cssinjs` 的 `extractStyle` 提取（cssVar 模式），见 §8。

## 1. API 面

### SwitchProps（antd 自己的接口，**没有**继承任何抽象 props）

| prop | 说明 |
|---|---|
| checked / defaultChecked | 受控 / 非受控 |
| value / defaultValue | ⚠️ **`checked` / `defaultChecked` 的别名**（`@since 5.12.0`）。合并判据：`useControlledState(defaultChecked ?? defaultValue ?? false, checked ?? value)` |
| onChange | `SwitchChangeEventHandler = (checked: boolean, event) => void` —— **两个参数**（与 Radio/Checkbox 的事件对象不同） |
| onClick | `SwitchClickEventHandler = (checked: boolean, event) => void` —— ⚠️ **收到的是「结果值」不是原生事件**（rc-switch 的 legacy 行为），且 disabled 时**仍会触发** |
| checkedChildren / unCheckedChildren | 选中 / 未选中的内容（ReactNode） |
| disabled | `mergedDisabled = (props.disabled ?? DisabledContext) \|\| loading` —— ⚠️ `\|\|` 不是 `??`，**loading 会强制 disabled** |
| loading | 加载中；同时加 `-loading` 类并显示 `LoadingOutlined` |
| size | `SwitchSize = Exclude<SizeType, 'large'> \| 'default'` ⇒ `'small' \| 'medium' \| 'middle' \| 'default'`；⚠️ `'default'` **已废弃**（告警提示改用 `'medium'`） |
| autoFocus / tabIndex / id / title / style / className / rootClassName | 透传到 `<button>`（`{...restProps}`） |
| classNames / styles | 语义槽 `{ root, content, indicator }`（对象或函数） |
| prefixCls | 默认 `apollo` |

### 键盘 / 指针行为（来自 rc-switch）

- `role="switch"`、`aria-checked={checked}`（布尔，React 渲染成 `"true"`/`"false"`）、`type="button"`、`disabled`。
- **左右方向键**：`ArrowLeft` ⇒ false、`ArrowRight` ⇒ true（判据是 `e.which`，rc-util 的 `KeyCode`）。
- 点击：`triggerChange(!checked, e)` ⇒ **disabled 时不改状态、不发 onChange**；但 `onClick` 无论如何都会调用。
- 变更后 `onKeyDown` / `onClick` 的原始回调**照常转发**。

### 静态属性

`Switch.__ANT_SWITCH = true`（上游 index.test 的「have static property for type detecting」）。

## 2. DOM 结构（`renderToStaticMarkup` 实测）

```html
<button type="button" role="switch" aria-checked="false"
        class="apollo-switch css-var-_R_0_">
  <div class="apollo-switch-handle">                     <!-- 恒存在 -->
    <!-- loading 时才有：<span class="apollo-icon apollo-switch-loading-icon">…</span> -->
  </div>
  <span class="apollo-switch-inner">
    <span class="apollo-switch-inner-checked">…</span>
    <span class="apollo-switch-inner-unchecked">…</span>
  </span>
</button>
```

⚠️ 三个容易看错的点：

1. **`-handle` 那个 div 恒存在**（antd 把它作为 `loadingIcon` prop 传给 rc-switch，内部只有图标是条件渲染）
   —— 不是「loading 时才出现」。
2. `-inner-checked` / `-inner-unchecked` **两个 span 恒同时存在**（靠负 margin 轮换显示），
   不是 `v-if` 二选一。语义槽 `content` 会**同时**加到这两个 span 上。
3. 根元素是 `<button>`，`{...restProps}` 全部落它（`title` / `id` / `tabIndex` / `autoFocus` / 事件）。

## 3. 样式要点（style/index.ts 445 行，5 个 style 函数）

| 函数 | 负责 |
|---|---|
| `genSwitchStyle` | 根：resetComponent + `position:relative` / `inline-block` / `min-width` / `height` / `line-height` / `vertical-align:middle` / `background:colorTextQuaternary` / `border:0` / **`border-radius:100px`** / `cursor:pointer` / `transition:all motionDurationMid` / `user-select:none`；`:hover:not(-disabled)` ⇒ `colorTextTertiary`；`genFocusStyle`（`:focus-visible` 焦点环）；`-checked` ⇒ `switchColor`（= colorPrimary）、`-checked:hover:not(-disabled)` ⇒ colorPrimaryHover；`-loading, -disabled` ⇒ `cursor:not-allowed` + `opacity:opacityLoading` + 后代 `box-shadow:none;cursor:not-allowed`；`-rtl` ⇒ `direction:rtl` |
| `genSwitchInnerStyle` | `-inner`：`display:block` / `overflow:hidden` / `border-radius:100px` / `height:100%` / 左右 padding（未选中 `[innerMaxMargin, innerMinMargin]`，选中反转）/ `transition:padding-inline-*`；两个 `-inner-{checked,unchecked}`：`display:flex` / 居中 / `color:colorTextLightSolid` / `font-size:fontSizeSM` / `pointer-events:none` / `min-height:trackHeight` / `transition:margin-inline-*`；`-inner-checked` 用负 margin 把未选中项推出可视区（`calc(-100% + (handleSize + padding*2) - innerMaxMargin*2)`），`-inner-unchecked` 用 `margin-top:calc(trackHeight * -1)` 叠在下面；`:active` 时两侧再各让 `trackPadding*2`（按压反馈） |
| `genSwitchHandleStyle` | `-handle`：`position:absolute` / `top`+`inset-inline-start:trackPadding` / `width`+`height:handleSize` / `transition:all switchDuration ease-in-out`；`::before`：铺满 + `background-color:handleBg` + `border-radius:calc(handleSize/2)` + `box-shadow:handleShadow` + `transition` + `content:""`；`-checked -handle` ⇒ `inset-inline-start:calc(100% - (handleSize + trackPadding))`；`:active` 时 `::before` 拉长（`switchHandleActiveInset` = `-30%`） |
| `genSwitchLoadingStyle` | `-loading-icon.anticon`：`position:relative` / `top:calc((handleSize - fontSize)/2)` / `color:switchLoadingIconColor`（= `rgba(0,0,0,opacityLoading)`）/ `vertical-align:top`；`-checked` 下 ⇒ `switchColor` |
| `genSwitchSmallStyle` | `-small` 的全部覆盖（尺寸/边距/handle 尺寸/loading 图标尺寸/按压反馈用 `marginXXS` 而非 `trackPadding*2`） |

- `genNoMotionStyle()` / `genNoMotionRawStyle()` ⇒ **5 处 `@media (prefers-reduced-motion: reduce)`**
  （根、inner、inner-checked/unchecked、handle、handle::before）。⚠️ 与 radio **相反**，switch **有**动效关闭段。
- ⚠️ 与 radio/checkbox 的差异：switch **没有** `@media (hover: hover)` 包裹（hover 规则是裸的）。

## 4. Component Token（`prepareComponentToken` 全 13 字段）

`fontSize` / `lineHeight` / `controlHeight` / `colorWhite` 是输入，`padding = 2` 是**固定值**：

```
height        = fontSize * lineHeight            → 14 × 1.5714285714285714 = 22
heightSM      = controlHeight / 2                → 32 / 2 = 16
handleSize    = height - padding * 2             → 18
handleSizeSM  = heightSM - padding * 2           → 12
trackHeight   = height                           → 22px
trackHeightSM = heightSM                         → 16px
trackMinWidth = handleSize * 2 + padding * 4     → 44px
trackMinWidthSM = handleSizeSM * 2 + padding * 2 → 28px
trackPadding  = padding                          → 2px
handleBg      = colorWhite                       → #fff
handleShadow  = 0 2px 4px 0 rgba(0,35,11,0.2)    （FastColor('#00230b').setA(0.2)）
innerMinMargin   = handleSize / 2                → 9px
innerMaxMargin   = handleSize + padding + padding * 2 → 24px
innerMinMarginSM = handleSizeSM / 2              → 6px
innerMaxMarginSM = handleSizeSM + padding + padding * 2 → 18px
```

⚠️ 其中 `trackHeight` / `trackMinWidth` / `handleSize` 等是**派生量**（由 `fontSize * lineHeight`
这类公式算出），本仓按 `var()` / `calc()` 组合落地（与 skeleton 的 `titleHeight` 同判）。

**内部 token（`mergeToken` 注入，不是 Component Token，用户不可覆盖）**：

| 名 | 值 | 来源 |
|---|---|---|
| `switchDuration` | `motionDurationMid` | alias |
| `switchColor` | `colorPrimary` | alias |
| `switchDisabledOpacity` | `opacityLoading` | alias |
| `switchLoadingIconSize` | `calc(fontSizeIcon).mul(0.75)` | 计算式 |
| `switchLoadingIconColor` | `` `rgba(0, 0, 0, ${opacityLoading})` `` | **字面量**（本仓按 token.ts 常量登记） |
| `switchHandleActiveInset` | `'-30%'` | **字面量** |

## 5. demo（7 个非 debug）

`basic` `disabled` `loading` `size` `text` `style-class` `component-token`
（debug：`_semantic`）。

## 6. 本仓实现取舍

| # | 差异 | 分类 |
|---|---|---|
| 1 | Wave 不实现（`ant-wave-target` 也不加 —— antd 的 Switch 产物里**本来就没有**这个类） | PLATFORM |
| 2 | `size="default"` 的 deprecation 告警按 antd 原样发出 | 跟随上游 |
| 3 | `component-token` demo 用 CSS 变量覆盖替代 `ConfigProvider theme.components.Switch` | PLATFORM |
| 4 | `style-class` demo 用 demo 自带 `<style>` 替代 `antd-style` 的 `createStyles` | PLATFORM |
| 5 | `loading-icon` 选择器用 `.apollo-icon`（iconPrefixCls 对齐），antd 产物是 `.anticon` | INTENDED（D14/D15） |
| 6 | `border-radius:100px` / `rgba(0,0,0,var(--apollo-opacity-loading))` 两个**字面量**按 skeleton 的 `CAPSULE_RADIUS_DECL` 范式收敛到 `style/token.ts` | INTENDED |
| 7 | `update:checked` / `update:value` 与 `onChange` 同时发出（规则 C11 的 v-model 映射） | INTENDED |

## 7. 上游测试要点（转断言）

- `index.test.tsx`：受控（`value` 别名 + 点击后**保持选中**）、非受控（`defaultValue` + 点击后变 false）、
  `__ANT_SWITCH`、`-inner-unchecked` 的 `min-height` 随 size 变、语义化 classNames/styles、
  focusTest（`refFocus`）/ mountTest / rtlTest、wave（不实现）。
- `semantic.test.tsx`：语义槽三键（root / content / indicator）的落点与函数形态。
- 自建补充（rc-switch 层）：左/右方向键、disabled 时点击不发 onChange 但 onClick 仍触发、
  `loading` 强制 disabled、`onChange` 的两个参数、`checkedChildren` 的假值判据。

## 8. 附录：与 extractStyle 真实产物的对照

**采集方式**：`@ant-design/cssinjs@2.1.2` 的 `extractStyle(cache, { types: ['style','cssVar'] })`
渲染 16 种形态（默认/选中/禁用/loading×3/size×3/children×4/语义化），
`ConfigProvider { prefixCls: 'apollo', theme: { cssVar: true, hashed: false } }`。

**产物特征**：

1. **token 声明块**：`.css-var-_R_0_.apollo-switch{ --apollo-switch-*: … }`（13 个），
   实现落到 `.apollo-switch{…}`。
2. **5 处 `@media (prefers-reduced-motion: reduce)`** —— 与 radio（0 处）相反。
3. **无 `@media (hover: hover)`** —— hover 是裸规则。
4. 两个 `border-radius:100px`（根 + `-inner`）与一处 `rgba(0, 0, 0, var(--apollo-opacity-loading))`
   —— 都是 antd 的字面量，按 §6-6 收敛到 `token.ts`。
5. 13 个 token 的**解析值**（用于 L7 断言）：
   `track-height:22px` / `track-height-sm:16px` / `track-min-width:44px` / `track-min-width-sm:28px` /
   `track-padding:2px` / `handle-bg:#fff` / `handle-size:18px` / `handle-size-sm:12px` /
   `handle-shadow:0 2px 4px 0 rgba(0,35,11,0.2)` / `inner-min-margin:9px` / `inner-max-margin:24px` /
   `inner-min-margin-sm:6px` / `inner-max-margin-sm:18px`。

**采集脚本**（一次性，未入库）：`extract-switch.cjs` —— 渲染 → `extractStyle` → 与
`genSwitchStyle` 对拍（选择器集合 + 声明属性名集合）。

**对拍结果**（实测）：

```
antd 规则数: 43 ｜ 我们规则数: 42
只在 antd 里（我们缺）: 0
只在我们里（多出）: 0
属性有差异的规则数: 1   ← 全部是 13 条 Component Token 声明（antd 放在独立 cssVar 块里）
```

即**选择器集合完全一致、零属性差异**。（两侧「规则数」差 1 是因为 antd 有两条
同选择器的规则被 Map 去重，计数不同但键集合相同。）

**过程中修掉的两处实现缺陷**（都由对拍/测试抓出，登记 PITFALLS 165）：

1. `genNoMotionStyle()` 的伪元素**必须逐个展开**：cssinjs 的 `&` 指代整个父选择器列表，
   `a,b` 的 `&::before` 展开成 `a::before,b::before`。我第一版拼成 `a,b::before`
   —— 伪元素只作用于最后一项（PITFALLS 141 的 `a,b:hover` 陷阱的姊妹）。
   同时 `handle::before` 要区分 **raw** 变体（`genNoMotionRawStyle`，不展开，
   否则出现非法的 `::before::before`）。
2. **`useSize(props.size)` 是非响应式的**（只在 setup 期读一次）⇒ 受控切换 `size`
   静默失效。改用函数形态 `useSize((ctx) => props.size ?? ctx)`。
   ⚠️ 这个坑**同源地在 radio 的 Group 上也存在**，已一并修复并补回归用例（PITFALLS 163）。

