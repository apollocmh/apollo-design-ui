# ColorPicker · G1 分析产物

> **先于实现存在**（`AGENTS.md` §2）。契约来源：antd **6.6.4**
> `components/color-picker/`（**2959 行 / 27 文件**，不含 `__tests__` 与 `demo`）+
> `es/color-picker/` 产物（27 个 `.js`）+ `demo/`（**16 个**用户可见 + 1 个内部 `_semantic`）。
>
> **可复现的实测**：`node tests/visual/debug/extract-color-picker-css.mjs [--tokens|--selectors]`
> —— 本轮新增。**实测数字**（antd 6.6.4 + `theme.cssVar: true`）：
>
> | 量 | 值 |
> |---|---|
> | 含 `.ant-color-picker` 的规则 | **95** 条（去重选择器也是 95） |
> | `--ant-color-picker-*` **声明** | **0** 条 ← ✅ 与空 `ComponentToken` 一致 |
> | dump 里的总规则数 | 210（含 `ant-popover` 213 处引用） |
>
> ⚠️ **SSR 下 Portal 不渲染**（实测告警：
> `Portal only work in client side. Please call 'useEffect' to show Portal instead default render in SSR.`）
> ⇒ **面板 DOM 拿不到**，但**规则全在**（`useStyle` 在 `ColorPicker` 自身调用，
> 95 条规则一次全生成）⇒ 抽 CSS 够用；要 DOM 必须走 `PurePanel` 或真浏览器。

---

## 0. 结论摘要（五句话）

1. **`ColorPicker` = `Popover` + `ColorTrigger`（触发器）+ `ColorPickerPanel`（面板内容）**。
   354 行的主文件里**没有颜色数学**，全是「状态编排 + 语义槽 + 浮层接线」。
2. 🚨 **真正的引擎是 `@rc-component/color-picker`**（**769 行**），而它的 `Color`
   又 **`extends @ant-design/fast-color` 的 `FastColor`**。registry 的裁决是
   **`in-ui`**：`packages/ui/src/color-picker/engine/`。
   ✅ **色值数学已经有现成的**：`@apollo-design/utils` 的 `Color`（fast-color 的移植）
   —— 但它**缺 4 个方法**（见 §1.4 与 §4.1），这是 G2/G3 的**第一个决策点**。
3. 🚨 **色相/透明度滑块不是 rc-slider，是 antd 自己的 `Slider`** ——
   `components/ColorSlider.tsx` 里 `import Slider from '../../slider'`，
   并读 `SliderInternalContext` + `UnstableContext`（`@rc-component/slider`）。
   本仓 `slider` 已 `completed`，且 `slider/context.ts` **已经**有
   `unstableSliderContextKey`（含 `onDragStart` / `onDragChange`）⇒ **可复用，不用重写**。
4. **`ComponentToken` 是空接口**（`export interface ComponentToken {}`）⇒ registry 的
   `tokenCount: 0` **是对的**；但有 **9 个 `mergeToken` 派生值**（用户**不可**覆盖），
   其中 8 个进 CSS 变量（§3.1）。
5. **语义槽是 5 + 6，且 `popup` 是嵌套的**（`popup: { root }`），
   走 `useMergeSemantic` 的 `{ popup: { _default: 'root' } }` —— 本仓
   `_internal/use-merge-semantic.ts` 需要确认支持这一档（§2.7）。

---

## 1. 组件面

### 1.1 上游文件 → 本仓

| 上游（`components/color-picker/`） | 行数 | 本仓落点 | 形态 |
|---|---|---|---|
| `ColorPicker.tsx` | 354 | `ColorPicker.vue` | `.vue`（无模板 + 渲染函数，照 `Calendar.vue`） |
| `ColorPickerPanel.tsx` | 126 | `components/ColorPickerPanel.ts` | `.ts` 渲染函数（两个 context + `panelRender`） |
| `color.ts` | 114 | `color.ts`（`AggregationColor`） | 纯类，**无框架耦合** |
| `util.ts` | 78 | `util.ts` | 纯函数 |
| `hooks/useModeColor.ts` | 96 | `hooks/use-mode-color.ts` | composable |
| `context.ts` | 51 | `context.ts` | 2 个 `InjectionKey` |
| `components/ColorTrigger.tsx` | 148 | `components/ColorTrigger.vue` | `.vue` |
| `components/PanelPicker/index.tsx` | 213 | `components/PanelPicker.vue` | `.vue` |
| `components/PanelPicker/GradientColorBar.tsx` | 149 | `components/GradientColorBar.vue` | `.vue` |
| `components/PanelPresets.tsx` | 14 | `components/PanelPresets.ts` | `.ts`（薄壳，只有 context 读值 + 渲染 `ColorPresets`） |
| `components/ColorPresets.tsx` | 105 | `components/ColorPresets.vue` | `.vue` |
| `components/ColorSlider.tsx` | 177 | `components/ColorSlider.vue` | `.vue`（**复用 `Slider`**） |
| `components/ColorInput.tsx` | 78 | `components/ColorInput.vue` | `.vue` |
| `components/ColorHexInput.tsx` | 50 | `components/ColorHexInput.vue` | `.vue` |
| `components/ColorRgbInput.tsx` | 63 | `components/ColorRgbInput.vue` | `.vue` |
| `components/ColorHsbInput.tsx` | 66 | `components/ColorHsbInput.vue` | `.vue` |
| `components/ColorAlphaInput.tsx` | 43 | `components/ColorAlphaInput.vue` | `.vue` |
| `components/ColorSteppers.tsx` | 49 | `components/ColorSteppers.vue` | `.vue` |
| `components/ColorClear.tsx` | 63 | `components/ColorClear.vue` | `.vue` |
| `style/index.ts` | 356 | `style/index.ts` + `style/token.ts` | 见 §3 |
| `style/slider.ts` | 125 | `style/slider.ts` | 见 §3.3 |
| `style/presets.ts` | 118 | `style/presets.ts` | 见 §3.3 |
| `style/input.ts` | 105 | `style/input.ts` | 见 §3.3 |
| `style/picker.ts` | 51 | `style/picker.ts` | 见 §3.3 |
| `style/color-block.ts` | 38 | `style/color-block.ts` | 见 §3.3 |
| `index.tsx` | 6 | `index.ts` | 导出 |

**引擎（新写，无上游对应文件）**：`engine/` —— rc 的 `ColorPicker.js`(154) +
`useColorDrag.js`(107) + `components/{Picker,Slider,Gradient,Handler,Palette,ColorBlock,Transform}.js`
+ `hooks/{useColorState,useComponent}.js`（**769 行**）。⚠️ **这是本组件最大的一块新代码**。

### 1.2 对外面（`ColorPickerProps`）

`ColorPickerProps = Omit<RcColorPickerProps, 7 个键> & {…25 个自有键} & Pick<PopoverProps, 4 个键>`

⚠️ 被 `Omit` 掉的 7 个键（**照抄类型后 props 里就没有它们**）：
`onChange` / `value` / `defaultValue` / `panelRender` / `disabledAlpha` / `onChangeComplete` / `components`。

| 来源 | 键 |
|---|---|
| rc（**没被 Omit 掉的**） | `prefixCls` · `disabled` |
| antd 自有 | `mode` · `value` · `defaultValue` · `children` · `open` · `disabled` · `placement` · `trigger` · `format` · `defaultFormat` · `allowClear` · `presets` · `arrow` · `panelRender` · `showText` · `size` · `classNames` · `styles` · `rootClassName` · `disabledAlpha` · `` [key: `data-${string}`] `` · `onOpenChange` · `onFormatChange` · `onChange` · `onClear` · `onChangeComplete` · `disabledFormat` |
| `PopoverProps` | `getPopupContainer` · `autoAdjustOverflow` · `destroyTooltipOnHide` · `destroyOnHidden` |

**关键签名**（三处**都要逐字对齐**）：
```ts
onChange?: (value: AggregationColor, css: string) => void;      // ⚠️ 第二个参数是 CSS 串
onChangeComplete?: (value: AggregationColor) => void;
onFormatChange?: (format?: ColorFormatType) => void;
panelRender?: (panel: ReactNode, extra: { components: { Picker: FC; Presets: FC } }) => ReactNode;
showText?: boolean | ((color: AggregationColor) => ReactNode);
```

**值类型**：
```ts
type SingleValueType = AggregationColor | string;
type LineGradientType = { color: SingleValueType; percent: number }[];
type ColorValueType  = SingleValueType | null | LineGradientType;
```

### 1.3 内部件与它们的职责

```
ColorPicker
├── Popover                       ← 复用（本仓 popover，completed）
│   ├── content: ColorPickerPanel
│   │   ├── PanelPickerContext.Provider + PanelPresetsContext.Provider
│   │   └── div.{p}-inner > div.{p}-inner-content
│   │        ├── PanelPicker          ← HSB 面板 + 色相/透明度滑块（+ 渐变条）
│   │        ├── <Divider/>           ← 仅当 presets 是数组
│   │        └── PanelPresets → ColorPresets
│   └── children: ColorTrigger        ← 触发器（色块 + 可选文本）
└── PurePanel（_InternalPanelDoNotUseOrYouWillBeFired）
```

⚠️ 面板内容是 `<ContextIsolator form>` 包起来的 —— **它屏蔽 Form 的 status 上下文**，
但触发器**不屏蔽**（触发器读 `FormItemInputContext` 拿 `status` 加类名）。
⇒ 本仓对应物 `ContextIsolator`（`modal/Modal.ts` / `space/Compact.ts` 已在用）。

### 1.4 依赖面核查（照 skill 的对照表逐项查过）

| antd 用的 | 本仓对应 | 状态 |
|---|---|---|
| `@rc-component/color-picker`（引擎） | `packages/ui/src/color-picker/engine/` | 🚨 **新写**（registry 裁决 `in-ui`） |
| `@rc-component/color-picker` 的 `Color` | `@apollo-design/utils` 的 `Color` | ⚠️ **缺 4 个方法**（见下） |
| `@rc-component/slider` 的 `UnstableContext` | `slider/context.ts` 的 `unstableSliderContextKey` | ✅ **已核实**（`onDragStart`/`onDragChange`） |
| `antd` 的 `Slider`（`components/ColorSlider.tsx`） | `@apollo-design/ui` 的 `Slider` | ✅ `completed` + **内部 context 完全对得上**（§1.5） |
| `@rc-component/util` 的 `useControlledState` / `useEvent` | `@apollo-design/utils` | ✅ |
| `_util/hooks/useMergeSemantic` | `ui/src/_internal/use-merge-semantic.ts` | ✅ 存在（⚠️ 嵌套 `popup` 档待验证） |
| `_util/PurePanel` | `ui/src/dropdown/PurePanel.ts`（先例） | ✅ 模式可复用 |
| `_util/ContextIsolator` | `modal/Modal.ts` / `space/Compact.ts` 在用 | ✅ |
| `tooltip/hook/useMergedArrow` | `ui/src/tooltip/use-merged-arrow.ts` | ✅ |
| `config-provider/hooks/useSize` | `ui/src/config-provider/hooks/` | ✅ |
| `config-provider/hooks/useCSSVarCls` | 无 hook ⇒ **直接拼** `${prefixCls}-css-var`（rate 先例） | ✅ 惯例 |
| `space/Compact` 的 `useCompactItemContext` | `ui/src/space/Compact.ts` | ✅ |
| `form/context` 的 `FormItemInputContext` | `ui/src/form/context.ts` | ✅ |
| `_util/statusUtils` 的 `getStatusClassNames` | 本仓有同名 | ✅ |
| `divider` / `popover` / `tooltip` | 组件 | ✅ 三者都 `completed` |
| `@ant-design/cssinjs` 的 `unit` / `CSSObject` | 构建期，不进运行时 | ✅ |

#### 🚨 `Color` 的方法缺口（**实测**，扫描 antd + rc 全部调用点）

| 方法 | antd/rc 调用次数 | 本仓 `Color` |
|---|---|---|
| `toHsb` | **16** | ✗ **缺** |
| `toRgbString` | 13 | ✓ |
| `toHexString` | 10 | ✓ |
| `toRgb` | 8 | ✓ |
| `setA` | 4 | ✗（本仓叫 `setAlpha`） |
| `equals` | 3 | ✓ |
| `toHsbString` | 2 | ✗ **缺** |
| `toHsv` | 2 | ✓ |
| `getHue` | 2 | ✓ |
| `mix` | 1 | ✓ |
| `clone` | 1 | ✓ |
| `onBackground` | 1 | ⚠️ 在 `ui/src/_internal/color-composite.ts`（**不在 utils**） |
| `setHue` | 1 | ✗ **缺** |

**上游 `FastColor` 的完整 API**（供比对）：
`clone` `darken` `equals` `fromHexString` `fromHsl` `fromHslString` `fromHsv` `fromHsvString`
`fromRgbString` `getBrightness` `getHSLSaturation` `getHSVSaturation` `getHue` `getLightness`
`getLuminance` `getMax` `getMin` `getSaturation` `getValue` `isDark` `isLight` `lighten` `mix`
`onBackground` `setA` `setB` `setG` `setHue` `setR` `shade` `tint` `toHexString` `toHsl`
`toHslString` `toHsv` `toRgb` `toRgbString` `toString`
（rc 的 `Color` 再加 `toHsb` / `toHsbString`。）

### 1.5 ✅ **滑块复用已核实**（本组件最大的省力点）

`ColorSlider` 的渲染（`ColorSlider.tsx` 第 135–175 行）**逐字**：

```jsx
<SliderInternalContext.Provider value={{ direction: 'ltr', handleRender }}>
  <UnstableContext.Provider value={{ onDragStart, onDragChange }}>
    <Slider
      {...sliderProps}                                  // restProps + track: false
      className={clsx(className, `${prefixCls}-slider`)}
      tooltip={{ open: false }}
      range={{ editable: range, minCount: 2 }}
      styles={{ rail: { background: linearCss },
                handle: pointColor ? { background: pointColor } : {} }}
      classNames={{ rail: `${prefixCls}-slider-rail`,
                    handle: `${prefixCls}-slider-handle` }}
    />
  </UnstableContext.Provider>
</SliderInternalContext.Provider>
```

**逐项核对本仓 `Slider`（全部 ✅）**：

| `ColorSlider` 需要 | 本仓 `Slider` 提供 | 出处 |
|---|---|---|
| `SliderInternalContext.handleRender` | ✅ `handleRender?: (node: unknown, info: {index}) => unknown` | `slider/context.ts:77` |
| `SliderInternalContext.direction = 'ltr'` | ✅ `direction?: 'ltr' \| 'rtl'` | `slider/context.ts:78` |
| `UnstableContext.onDragStart/onDragChange` | ✅ `unstableSliderContextKey` | `slider/context.ts:66` |
| `range={{editable, minCount}}` | ✅ `editable?: boolean` / `minCount?: number` | `slider/interface.ts:45,49` |
| `classNames={{rail, handle}}` | ✅ `SliderSemanticClassNames.rail/handle` | `slider/interface.ts:88,89` |
| `styles={{rail, handle}}` | ✅ `SliderSemanticStyles.rail/handle` | `slider/interface.ts:96,97` |
| `tooltip={{open:false}}` | ✅ `tooltip` prop | `slider/interface.ts:108` |
| `track: false` | ✅ | `slider/interface.ts:183` 注释 |

⚠️ **一处必须小心**：antd 的 `handleRender(ori, info)` 里对 `ori` 做 **`cloneElement`**
（改 `style` / `className` / `onFocus` / `onKeyDown`）。Vue 没有 `cloneElement`，
本仓 `slider/Handles/Handle.ts` 的注释说明**扩展成「可包可换」**：
槽/context 额外给出 `nodeProps` / `className` / `style`。
⇒ 移植 `handleRender` 时用 **`cloneVNode(ori, {...})`** 或直接用给出的 `nodeProps`，
**两条路都行但行为要一致**（G4 要验：`onFocus` 触发 `onActive(index)` 这条必须生效）。

⚠️ **另一个必须知道的后果**：`ColorSlider` **不给 `Slider` 传 `prefixCls`**
⇒ 面板里的滑块带的是 **`apollo-slider` 的类名 + `apollo-color-picker-slider` 的附加类**
（`className` 与 `classNames.rail/handle` 都是附加的）。
⇒ **color-picker 的面板会引入整套 Slider 的 CSS**（跨组件视觉面）。
📌 本轮的 CSS dump 里 `ant-slider` 计数是 **0**，那是因为 SSR 下 Portal 不渲染 ⇒
`Slider` 组件根本没被渲染；**真浏览器里它会在** ⇒ L6 用例必须覆盖到。

---

## 2. 行为契约（逐条）

### 2.1 状态（6 个，其中 2 个受控）

| 状态 | 受控 prop | 初值 | 说明 |
|---|---|---|---|
| `internalPopupOpen` | `open` | `false` | ⚠️ **`popupOpen = !mergedDisabled && internalPopupOpen`**（禁用态恒关） |
| `formatValue` | `format` | `defaultFormat` | `'hex' \| 'rgb' \| 'hsb'` |
| `mergedColor` | `value` | `defaultValue` | 见 §2.4（`useModeColor` 里又包了一层） |
| `modeState` | —— | `'single'` | ⚠️ 有 `useEffect` 跟着颜色走（§2.3） |
| `cachedGradientColor` | —— | `null` | 渐变↔单色切换的缓存（§2.3） |
| `activeIndex` / `gradientDragging` | —— | `0` / `false` | 渐变条用 |

**`triggerOpenChange(open)`**：`if (!open || !mergedDisabled) { setPopupOpen(open); onOpenChange?.(open); }`
⇒ **禁用时「开」被吞掉，但「关」仍然放行**。

**`triggerFormatChange(newFormat)`**：先 `setFormatValue`，再 **`if (formatValue !== newFormat)`**
才发 `onFormatChange` ⇒ 同值不发。

### 2.2 `onInternalChange` 与 `changeFromPickerDrag`（**顺序即语义**）

```ts
onInternalChange(data, changeFromPickerDrag) {
  let color = generateColor(data);
  if (disabledAlpha && isAlphaColor) color = genAlphaColor(color);   // ① 先改写
  setColor(color);                                                    // ② 再写状态
  setCachedGradientColor(null);                                       // ③ 清缓存
  if (onChange) onChange(color, color.toCssString());                 // ④ 发 change
  if (!changeFromPickerDrag) onInternalChangeComplete(color);         // ⑤ 非拖拽才发 complete
}
```

🚨 **两个易错点**：
1. `changeFromPickerDrag` 为真时 **不发 `onChangeComplete`** —— 拖拽期间只有 `onChange`。
2. **`disabledAlpha && isAlphaColor` 时颜色被 `genAlphaColor` 改写**（alpha 强制为 1），
   且 `onChange` / `onChangeComplete` 拿到的都是**改写后**的值。
   ⚠️ `isAlphaColor = getColorAlpha(mergedColor) < 100`（`< 100`，不是 `< 1`）。

**`onInternalChangeComplete(color)`**：**只在 `onChangeComplete` 存在时**才做
`generateColor` + `disabledAlpha` 改写 ⇒ 不存在时**完全空转**（连 `generateColor` 都不跑）。

### 2.3 模式切换的渐变缓存（**顺序即语义**）

```ts
onInternalModeChange(newMode) {
  setModeState(newMode);
  if (newMode === 'single' && mergedColor.isGradient()) {
    setActiveIndex(0);
    onInternalChange(new AggregationColor(mergedColor.getColors()[0].color));
    setCachedGradientColor(mergedColor);        // ⚠️ 必须在 onInternalChange 之后
  } else if (newMode === 'gradient' && !mergedColor.isGradient()) {
    const baseColor = isAlphaColor ? genAlphaColor(mergedColor) : mergedColor;
    onInternalChange(new AggregationColor(cachedGradientColor || [
      { percent: 0,   color: baseColor },
      { percent: 100, color: baseColor },
    ]));
  }
}
```
⚠️ **`setCachedGradientColor` 在 `onInternalChange` 之后**是有意的 ——
`onInternalChange` 里会 `setCachedGradientColor(null)`（注释原文：
"Should after `onInternalChange` since it will clear the cached color"）。
**Vue 里两个 `ref` 赋值顺序同样要紧**（但 Vue 是同步的，比 React 的批处理更直观）。

### 2.4 `useModeColor` 的「双缓存」结构（**最绕的一处**）

```
useControlledState(defaultValue, value)  →  mergedColor（受控/非受控归一）
setColor(next) = { setCacheColor(next); setMergedColor(next); }
postColor = generateColor(mergedColor || '').equals(cacheColor)
              ? cacheColor!            // ← 颜色被 cleared 时用缓存顶替
              : generateColor(mergedColor || '')
postMode  = modeSet.has(modeState) ? modeState : modeOptionList[0]?.value
useEffect(() => setModeState(postColor.isGradient() ? 'gradient' : 'single'), [postColor])
```
🚨 三条判据：
1. **`postColor` 与 `cacheColor` 相等时返回 `cacheColor` 本体**（保 `cleared` 标记，
   因为 `generateColor('')` 会丢掉它）。
2. **`postMode` 会被 `modeSet` 夹**：`modeState` 不在用户给的 `mode` 列表里时，
   回落到 `modeOptionList[0].value`。
3. **`useEffect` 会在每次 `postColor` 变化时覆盖 `modeState`** —— 即
   **颜色形态（是否渐变）是模式的事实来源**，用户点切换只是「请求」。
   ⇒ Vue 里这条要写成 `watch(postColor, ...)`，且**不能**用「写状态→立刻比较」的写法（PITFALLS 13/207）。

### 2.5 `AggregationColor`（**公共值类型**，114 行）

- 构造：接受 `AggregationColor`（克隆）/ 数组（渐变）/ 其它 `ColorGenInput`。
- 🚨 **空值 ⇒ `setA(0)` + `cleared = true`**：
  `if (!color || (isArray && !this.colors)) { this.metaColor = this.metaColor.setA(0); this.cleared = true; }`
  ⇒ **「清空」不是 null，是 alpha=0 的颜色**（这解释了 `allowClear` 的语义）。
- `isGradient() = !!this.colors && !this.cleared`
- `getColors() = this.colors || [{ color: this, percent: 0 }]`（**单色也返回数组**）
- `toHex() = getHex(this.toHexString(), this.metaColor.a < 1)` —— **alpha<1 时取 8 位**
- `toCssString()`：渐变 ⇒ `linear-gradient(90deg, …)`；单色 ⇒ `toRgbString()`
- `equals(other)`：**先比 `isGradient()`**，再比 hex / 逐段 percent+color

**两个纯函数**（`color.ts` 顶部）：
```ts
toHexFormat(value, alpha) = value?.replace(/[^0-9a-f]/gi,'').slice(0, alpha ? 8 : 6) || ''
getHex(value, alpha)      = value ? toHexFormat(value, alpha) : ''
```

### 2.6 `util.ts` 的三个函数

- `generateColor(color)`：已是 `AggregationColor` 就原样返回，否则 `new AggregationColor(color)`。
- `getColorAlpha(color) = Math.round(color.toHsb().a * 100)` —— 🚨 **走 `toHsb().a`**。
- `genAlphaColor(color, alpha?)`：🚨 **`rgb` 全 0 时改从 `hsb` 取**
  （注释原文："Color from hsb input may get `rgb` is (0/0/0) when `hsb.b` is 0"）。
- `getGradientPercentColor(colors, percent)`：在 `[0%, …用户点…, 100%]` 里插值，
  用 `RcColor.mix(endColor, ratio)` 再 `toRgbString()`。

### 2.7 语义槽（**5 个 classNames / 6 个 styles，`popup` 是嵌套的**）

```ts
classNames?: { root?, body?, content?, description?, popup?: { root? } }
styles?:     { root?, body?, content?, description?, popupOverlayInner?, popup?: { root? } }
```
⚠️ **`styles` 有 `popupOverlayInner` 而 `classNames` 没有**（不对称，别「统一」）。
⚠️ 调用形态：
```ts
useMergeSemantic([ctxClassNames, classNames], [ctxStyles, contextStyleRoot, styles, styleRoot],
                 { props: mergedProps }, { popup: { _default: 'root' } })
```
⇒ **`popup._default = 'root'`**：只给 `popup.root` 传值时，`root` 也吃到它。
⚠️ 传进 `Popover` 时：`classNames={{ root: mergedPopupCls }}`、
`styles={{ root: mergedStyles.popup?.root, container: styles?.popupOverlayInner }}`
—— **`popupOverlayInner` 映射到 Popover 的 `styles.container`**。
⚠️ `mergedClassNames` 整体透给 `ColorTrigger` ⇒ **`body`/`content`/`description` 三槽由触发器消费**
（G4 要读 `ColorTrigger.tsx` 确认归属，本分析未逐行验证）。

### 2.8 根类名与 size / status / compact

```ts
prefixCls = getPrefixCls('color-picker', customizePrefixCls)   // ⇒ apollo-color-picker
mergedCls = clsx(
  getStatusClassNames(prefixCls, contextStatus),          // -error / -warning
  { [`${prefixCls}-sm`]: size==='small', [`${prefixCls}-lg`]: size==='large' },
  compactItemClassnames,                                   // Space.Compact
  contextClassName, mergedRootCls, className, hashId,
)
mergedRootCls = clsx(rootClassName, cssVarCls, rootCls, { [`${prefixCls}-rtl`]: direction })
mergedPopupCls = clsx(prefixCls, mergedRootCls, mergedClassNames.popup?.root)
```
🚨 **`mergedRootCls` 同时进「触发器的类名」与「浮层根的类名」** —— 两处都要带上。

### 2.9 其它

- **`disabledAlpha` 的告警**：`!(disabledAlpha && isAlphaColor)` 时警告
  "`disabledAlpha` will make the alpha to be 100% when use alpha color."
- **`mergedSize`**：`useSize(ctx => customizeSize ?? compactSize ?? ctx)`。
- **`arrow`**：`useMergedArrow(arrow, contextArrow)`。
- **`destroyOnHidden`**：`destroyOnHidden ?? !!destroyTooltipOnHide`。
- **`PurePanel`**：`genPurePanel(ColorPicker, undefined, props => ({...props, placement:'bottom', autoAdjustOverflow:false}), 'color-picker', prefixCls => prefixCls)`。

---

## 3. 样式契约

### 3.1 Component Token：**0 个自有**（**实测确认**）

```ts
// biome-ignore lint/suspicious/noEmptyInterface: ComponentToken need to be empty by default
export interface ComponentToken {}
```
⇒ registry 的 `tokenCount: 0` **实测一致**。

🚨 **实测的另一半更重要**：产物里 `--ant-color-picker-*` 的**声明是 0 条**，
且 `.ant-color-picker-css-var` 块里**只有全局 reset**（`font-family` / `font-size` / `box-sizing`）——
**没有任何组件变量**。⇒ **下面 9 个 mergeToken 值不是 CSS 变量，是被内联进规则的 JS 字面量**
（例如 `width:234px`）。
📌 这与 calendar（27 条声明）**根本不同**：color-picker 的样式**零自有变量**。
⇒ `style/token.ts` 按 skill §3 的 `tokenCount = 0` 分支写
（`ComponentToken = Record<string, never>` + 空 `prepareComponentToken`）。
⚠️ 但 9 个派生值仍要在 `genTokenDecls` 里有落点（否则 H9「不许硬编码」过不去）——
**这是 G3 的决策点**：声明成 `--apollo-color-picker-*`（我们比 antd 多声明 9 条）
还是内联字面量。calendar 的先例是**固化表达式 + 声明**。

### 3.2 9 个 `mergeToken` 派生（用户**不可**覆盖）

| 名 | 值 | 进 CSS？ |
|---|---|---|
| `colorPickerWidth` | `234` | ✓ |
| `colorPickerHandlerSize` | `16` | ✓ |
| `colorPickerHandlerSizeSM` | `12` | ✓ |
| `colorPickerAlphaInputWidth` | `44` | ✓ |
| `colorPickerInputNumberHandleWidth` | `16` | ✓ |
| `colorPickerPresetColorSize` | `24` | ✓ |
| `colorPickerInsetShadow` | `` `inset 0 0 1px 0 ${colorTextQuaternary}` `` | ✓（**引用全局 token**） |
| `colorPickerSliderHeight` | `8`（**先作为局部常量**） | ✓ |
| `colorPickerPreviewSize` | `token.calc(sliderHeight).mul(2).add(marginSM).equal()` | ✓（**构建期算式**） |

⚠️ `colorPickerPreviewSize` 是 `calc()` 算出来的 —— 与 calendar 的 `CALENDAR_DERIVED`
同判：产物里是**表达式**，要固化成表达式而不是解析值。

### 3.3 样式文件拆分（6 个）

| 文件 | 行数 | 作用域 |
|---|---|---|
| `style/index.ts` | 356 | 主规则 + 组装 |
| `style/slider.ts` | 125 | 面板内的滑块（**覆盖 slider 的内部变量**） |
| `style/presets.ts` | 118 | 预设色板 |
| `style/input.ts` | 105 | 面板内的数字输入 |
| `style/picker.ts` | 51 | HSB 取色面板（渐变底 + 手柄） |
| `style/color-block.ts` | 38 | 色块（触发器 + 预览） |

⚠️ 还有 `genCompactItemStyle(token, { focusElCls: `${componentCls}-trigger-active` })` ——
与 `space/Compact` 联动，**焦点类名是 `-trigger-active`**。

---

## 4. Vue 对应（平台差异与关键设计）

### 4.1 🚨 第一个决策点：`Color` 的 4 个缺口放哪

| 方案 | 代价 | 风险 |
|---|---|---|
| **A. 扩 `@apollo-design/utils` 的 `Color`** | 改 L0 foundation ⇒ **必须单独重建**（PITFALLS 176/249）+ 补 `color.oracle.test.ts` 的差分用例 | 加方法**向后兼容**；但 `toHsb`/`toHsbString` 是 **rc 的扩展**（FastColor 本身没有）⇒ 属「apollo 扩展」而非「移植」，要在文件头写明 |
| **B. 在 `ui/src/color-picker/` 里做局部扩展** | 不动 foundation | 违反「颜色数学单一真源」；`onBackground` 已经在 `ui/_internal` 就是这个坏味道的先例 |

📌 **倾向 A**（理由：`color.ts` 的文件头明说「移植范围只含本仓库真实用到的部分」，
color-picker 让「真实用到」变多了；且 `setHue` 是 FastColor 的**原生**方法，属于移植缺口）。
**待用户确认后落 G2/G3。**

### 4.2 `onChange` / `onChangeComplete` / `onFormatChange` / `onOpenChange` / `onClear` 都是**回调 prop**

⚠️ 上游 `ColorPickerProps` 里它们是 **prop**（不是事件）。
本仓按 C11 的判据：**状态型**（`value` / `open` / `format`）走 `v-model` + 语义事件双发；
**纯通知型**（`onClear`）按本仓惯例仍可用 `@clear`。
⇒ **G2 要逐条判**，不能一律改成 emits（`onChange` 的第二个参数 `css` 就是 `toCssString()`，
不是状态）。

### 4.3 `panelRender` 是**函数 prop**（返回 vnode），不是插槽

`panelRender(panel, { components: { Picker, Presets } })` —— 第二个参数给了**两个组件引用**。
⇒ 本仓按 C8：函数 prop + scoped slot 双通道；`.vue` 里要用 `h()` 渲染返回值
（模板没有「渲染一个 VNode 变量」的语法，见 `empty/components/NodeRenderer.ts`）。

### 4.4 `children` 覆盖触发器

`{children || <ColorTrigger … />}` ⇒ **传了 children 就完全不要 `ColorTrigger`**
（`rest` 也只传给 `ColorTrigger`，不传 children 时 `rest` 落空）。

### 4.5 平台差异预判（**照抄就错**）

| # | 差异 | 处理 |
|---|---|---|
| 1 | `useControlledState` → 本仓的受控/非受控归一 | 记 INTENDED |
| 2 | `useEvent`（稳定引用）→ Vue 无对应，用 `onXxx` prop 直读 | PLATFORM |
| 3 | `useMergeSemantic` 的**函数形态** `classNames`/`styles` | 运行时类型必须 `[Object, Function]`（PITFALLS 21/305） |
| 4 | `ref` → `expose` | ⚠️ **上游 `ColorPicker` 是 `ForwardRefExoticComponent`，ref 指向内部 `div`** ⇒ 本仓 expose `nativeElement`（**待 G4 核实 ref 落点**） |
| 5 | `_InternalPanelDoNotUseOrYouWillBeFired` | 照抄（`dropdown/PurePanel.ts` 有先例），名字别改 |
| 6 | 无 `hashId` | 直接拼 `${prefixCls}-css-var`（D5 家族） |
| 7 | `classNames.popup` 是**嵌套对象** | 语义槽结构比 calendar 复杂；`use-merge-semantic.ts` 的嵌套档**待验证** |

---

## 5. 预判的最大风险（按概率排序）

1. 🚨 **引擎（769 行）是全新代码**，且它**有浮层 + 拖拽 + canvas-free 几何**
   ⇒ 本仓「jsdom 无布局」的老问题会集中爆发。**必须把几何算法抽成纯函数**
   （`useColorDrag` 的 `getColor`/`getAlpha` 映射）在 L1 钉死。
2. 🚨 **`toHsb` 缺 4 个方法** ⇒ 不补就写不出 `AggregationColor`。见 §4.1。
3. ✅ **已排除**：`ColorSlider` 复用本仓 `Slider` 的**硬前提已核实**（§1.5）——
   本仓 `sliderInternalContextKey` 有 `handleRender` + `direction`，
   `unstableSliderContextKey` 有 `onDragStart`/`onDragChange`，逐项对得上。
   ⚠️ 剩下的唯一风险是 **`handleRender` 的 `cloneElement` → `cloneVNode` 语义等价性**。
4. ⚠️ **`styles.popupOverlayInner` → Popover 的 `styles.container`** —— 本仓 Popover 是否
   暴露 `styles.container` 这一档，待验。
5. ⚠️ **16 个 demo** 里有 3 个依赖 `PurePanel` / 面板直出 ⇒ demo 的 `expectCount` 会很大。

---

## 6. 本分析**已经证明**什么 / **没有**证明什么

### ✅ 已证明（可复现，附命令）

- **`--ant-color-picker-*` 声明 = 0 条**，`.ant-color-picker-css-var` 块只有全局 reset
  ⇒ `ComponentToken` 空 + 9 个派生值是**内联字面量**（§3.1）。
  命令：`node tests/visual/debug/extract-color-picker-css.mjs --tokens`
- **含 `.ant-color-picker` 的规则 = 95 条**（去重选择器 95）。
  命令：`... --selectors`
- **SSR 下 Portal 不渲染**（告警原文见文件头）⇒ 面板 DOM 拿不到、规则全在。
- **本仓 `Slider` 的内部 context 与 `ColorSlider` 的需求逐项对得上**（§1.5 的 8 行表，
  每行都有 `文件:行号`）。
- **`Color` 的方法缺口是 4 个**：`toHsb`(16 次) / `toHsbString`(2) / `setA`(4) / `setHue`(1)
  —— 由扫描 antd + rc 的**全部调用点**得到，不是凭印象。

### ❌ 没有证明（G2/G3/G4 必须先做）

- ❌ **`Color` 缺口的落点（§4.1 A/B）未裁决** ⇒ **G2/G3 的第一个动作就是定它**。
- ❌ **没有逐行读 `PanelPicker/index.tsx`(213) / `GradientColorBar.tsx`(149) /
  `ColorTrigger.tsx`(148)`** —— §1.3 的职责描述是从主文件的调用点**推断**的。
  ⚠️ 特别是 **`body` / `content` / `description` 三个语义槽归谁消费**，本分析只到
  「透给了 `ColorTrigger`」这一步。
- ❌ **没有确认 `use-merge-semantic.ts` 支持 `popup: { _default: 'root' }` 这一档**。
- ❌ **没有确认本仓 `Popover` 暴露 `styles.container`**（`popupOverlayInner` 要映射到它）。
- ❌ **没有读 antd 自己的 `__tests__/`** —— 行为契约的边界值（尤其是
  **`changeFromPickerDrag` 何时为真**、`activeIndex` 的语义）只有读测试或跑上游才能钉死。
- ❌ **没有核对 16 个 demo 里哪些依赖本仓没有的东西**
  （重点怀疑 `presets-line-gradient` / `pure-panel` / `_semantic`）。
- ❌ **引擎（769 行）的几何算法没有细读** —— `useColorDrag`(107) 的
  「鼠标位置 → hsb / alpha」映射是 L1 纯函数化的对象，**G4 前必须读**。
- ❌ **没有验证 `handleRender` 用 `cloneVNode` 移植后的行为与 `cloneElement` 一致**
  （§1.5 末尾那条 ⚠️）。
- ❌ **`ColorPicker` 的 `ref` 落点未核实**（上游是 `ForwardRefExoticComponent`，
  ref 指向内部哪个 `div`）⇒ `expose` 面待定。
