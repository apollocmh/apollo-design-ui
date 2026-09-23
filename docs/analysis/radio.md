# Radio —— antd 6.6.4 契约分析（G1）

> 材料：`/tmp/antd-src/package/es/radio/`（radio.js 128 行 / group.js 130 行 /
> context.js 5 行 / radioButton.js 25 行 / style 519 行）+ 6.6.4 源码仓
> （本仓 exclude 路径 `.workbuddy-ai/antd-repo/ant-design-master/`，/tmp 会被并发清理）。
> **Component Token 16 个字段**（registry 组 Radio 记 14）。

## 1. API 面

### RadioProps（extends checkbox 的 AbstractCheckboxProps）

| prop | 说明 |
|---|---|
| checked / defaultChecked* | 受控 / 非受控（*defaultChecked 由 RcCheckbox 消费） |
| value | 在 Group 内与 group.value **相等比较**（`value === groupContext.value`，不是 includes） |
| disabled | 三级合并 `props.disabled ?? group.disabled ?? DisabledContext` |
| optionType | ⚠️ **Radio 上不是有效 prop** —— usage 告警 `` `optionType` is only support in Radio.Group. ``（组内经 Group 的 context 生效） |
| classNames / styles | 语义槽 `{ root, icon, label }`（对象或函数） |
| title | ⚠️ **落 label**（checkbox 落 icon span，Radio 不同！） |
| onChange | RcCheckbox 的事件（target={...props, checked}）；**同时**调 props.onChange 与 groupContext.onChange |
| onClick / onMouseEnter / onMouseLeave / onFocus / onBlur | onClick 走冒泡锁；hover 落 label；focus/blur 落 input |

- `isButtonType = (groupContext.optionType || radioOptionTypeContext) === 'button'`
  ⇒ `prefixCls = radio-button`（整个 label/span/input 的类名前缀都换）。
- `checked` 只在 `hasChecked || groupContext` 时传给 RcCheckbox。
- wrapper 类名序：`-wrapper → {-wrapper-checked, -wrapper-disabled, -wrapper-rtl,
  -wrapper-in-form-item, -wrapper-block} → contextClassName → className →
  rootClassName → 语义 root`（⚠️ 比 checkbox 多 `-wrapper-block`，rtl 位置不同）。
- `ant-wave-target` 只在**非 button**形态加（button 无波纹）。
- Wave 不实现（checkbox 同判，PLATFORM）。

### RadioGroupProps

| prop | 说明 |
|---|---|
| options | `(string \| number \| {label, value, disabled?, title?, style?, className?, id?, required?, onChange?})[]` |
| value / defaultValue | 受控标量（非数组！） |
| onChange | `(e: RadioChangeEvent) => void` —— **仅 `val !== lastValue` 时触发**（点同一个选项不触发，与 checkbox 组不同） |
| buttonStyle | `'outline' \| 'solid'`（默认 outline ⇒ `-group-outline` / `-group-solid` 类） |
| optionType | `'default' \| 'button'`（经 context 决定子 Radio 形态） |
| size | `useSize(customizeSize)` ⇒ `-group-large` / `-group-small` |
| orientation / vertical | `useOrientation(orientation, vertical)` ⇒ `-group-vertical` |
| block | `false` 默认 ⇒ `-group-block` + 子 `-wrapper-block` |
| name | 默认 `useId(toNamePathStr(formItemName))` —— form 未落地 ⇒ **恒 undefined**（PLATFORM：name = props.name） |
| role | 默认 `'radiogroup'` |
| id / onFocus / onBlur / onMouseEnter / onMouseLeave | 落根 div |
| buttonStyle/optionType/size/vertical 等**不透传**到根 div（解构排除） |

- options 渲染：string/number ⇒ `checked = value===option`；对象 ⇒
  `disabled: option.disabled || disabled`、title/style/className/id/required/onChange 逐项透传。
  ⚠️ **没有 `-group-item` 类**（checkbox 有，radio 没有）。
- 根 div 类名序：`-group → -group-{buttonStyle} → {-large,-small,-rtl,-block} →
  className → rootClassName`，另拼 `-group-vertical`。
- context：`{onChange: onRadioChange, value, disabled, name, optionType, block}`。

### RadioButton

`RadioOptionTypeContextProvider(value='button')` 包 `Radio`，强制 `type='radio'`（无 UI）。

## 2. DOM 结构

```html
<label class="apollo-radio-wrapper …">      <!-- button 形态: apollo-radio-button-wrapper -->
  <span class="apollo-radio …">             <!-- button 形态: apollo-radio-button；无 ant-wave-target -->
    <input type="radio" class="apollo-radio-input">
    <span class="apollo-radio-inner"></span>
  </span>
  <span class="apollo-radio-label">…</span>
</label>
```

button 形态：`> apollo-radio-button { position:absolute; inset 0; z-index:-1; 100%×100% }`
+ button-wrapper 自身是按钮皮肤（`:has(:focus-visible)` 焦点环、input 宽高 0 隐藏）。

## 3. 样式要点（style/index.js 519 行，三段）

- **group 段**：inline-block / fontSize:0 / rtl / block⇒flex；vertical ⇒ flex column +
  rowGap marginXS，`:has(> button-wrapper, > badge > button-wrapper)` 时 rowGap 0；
  badge 伴随选择器（Badge 已收口，逐条保留）。
- **basic 段**：wrapper inline-flex/baseline/`::after '\a0'`；radio span
  `radioSize × radioSize` 圆形 + `::after` 点（`scale(0)` → checked `opacity:1
  translate(-50%,-50%)`，motionDurationSlow + motionEaseInOutCirc）；input
  `inset:0`；`:has(input:focus-visible)` 焦点环；hover 边框 colorPrimary /
  hover checked 背景 colorPrimaryHover；disabled 点 dotColorDisabled。
- **button 段**：wrapper 高 controlHeight、lineHeight `calc(controlHeight -
  lineWidth*2)`、`borderBlockStartWidth: calc(lineWidth + 0.02)`（chrome 对齐 hack，
  **逐字保留**）、`marginInlineEnd: -lineWidth` 相邻合并、first/last 圆角、
  large/small/vertical × first/last 全组合、checked `::before` 色条、solid 变体、
  disabled + checked-disabled 状态。

## 4. Component Token（prepareComponentToken 全 16 字段）

```
radioSize=fontSizeLG ｜ dotSize=wireframe? size-8 : size-(4+lineWidth)*2 ｜ dotColorDisabled=colorTextDisabled
buttonSolidCheckedColor=colorTextLightSolid ｜ buttonSolidCheckedBg=colorPrimary
buttonSolidCheckedHoverBg=colorPrimaryHover ｜ buttonSolidCheckedActiveBg=colorPrimaryActive
buttonBg=colorBgContainer ｜ buttonCheckedBg=colorBgContainer ｜ buttonColor=colorText
buttonCheckedBgDisabled=controlItemBgActiveDisabled ｜ buttonCheckedColorDisabled=colorTextDisabled
buttonPaddingInline=padding-lineWidth ｜ wrapperMarginInlineEnd=marginXS
radioColor=wireframe?colorPrimary:colorWhite ｜ radioBgColor=wireframe?colorBgContainer:colorPrimary
```
unitless: radioSize、dotSize。dotPadding=4 固定值。

## 5. demo（14 个非 debug）

`basic` `disabled` `radiogroup` `radiogroup-options` `radiogroup-more`
`radiogroup-with-name`（name="radiogroup" 直接传，✅）`radiogroup-block`
`radiobutton` `radiobutton-solid` `size`（buttonStyle+size，✅）`style-class`
`badge`（Badge ✓ 已收口，1:1）
`component-token` ⚠️ ConfigProvider components.Radio 注入 —— 本仓无 theme 注入 ⇒
等价替换（语义 styles 演示同视觉）｜`wireframe` ⚠️ theme.token.wireframe ⇒ 等价替换。
debug：`_semantic` / `debug-group-width` / `debug-upload`。

## 6. 本仓实现取舍（PLATFORM）

| # | 差异 | 分类 |
|---|---|---|
| 1 | Wave 不实现；`ant-wave-target` 仅非 button 形态保留 | PLATFORM |
| 2 | `isFormItemInput`（`-wrapper-in-form-item`）恒 false | PLATFORM |
| 3 | Group `name` 默认值：antd 是 `useId(toNamePathStr(formItemName))`（React 生成 `_R_xx_`）⇒ 本仓走 `useId()`（Vue 生成 `v-x`）。**字面值不同、语义相同**（整组唯一且一致）。⚠️ 实现期修正：本节初稿写成「恒 undefined」，实现时回读 `toNamePathStr(undefined)` 得到**空串**（`toArray(undefined).join('_') === ''`）⇒ `useId('')` 仍走生成分支，所以 antd **始终**有 name。已按真实行为实现（`useId()`），并登记 D45 | PLATFORM |
| 4 | wireframe / component-token demo 等价替换 | PLATFORM |
| 5 | 复用 checkbox 的 useBubbleLock / useControlledValue / 语义 merge | 复用 |
| 6 | 本仓额外实现 `update:checked` / `update:value`（规则 C11 的 v-model 映射） | INTENDED |

## 7. 上游测试要点（转断言）

- radio.test：basic 受控/非受控、hover 落 label、disabled 合并链、group 内
  checked=相等比较、name 透传、`optionType` 告警、语义槽。
- group.test：options 各形态、受控 value、**同值点击不触发 onChange**、
  buttonStyle/size/vertical/block 类名、role=radiogroup、id/onFocus/onBlur 落根、
  optionType='button' 渲染 button。
- radio-button.test：RadioButton 形态切换、solid 样式类。
- 事件冒泡锁与 checkbox 同（label click → input click 不双触发）。

---

## 8. 附录：与 extractStyle 真实产物的逐条对照（G4 取证）

**采集方式**：`@ant-design/cssinjs@2.1.2` 的 `extractStyle(cache, { types: ['style','cssVar'] })`
渲染 antd 6.6.4 的 Radio 全部形态（基础 / Group 各形态 / button 三档尺寸 / vertical /
block / badge 伴随），`ConfigProvider { prefixCls: 'apollo', theme: { cssVar: true, hashed: false } }`。
产物 34 KB，radio 段 92 条规则。

**对照方式**：把 `genRadioStyle('apollo')` 与产物都切成 `selector{props}`，比较
① 选择器集合、② 同名选择器的声明属性名集合。

**结果**：

```
antd 规则数: 92 ｜ 我们规则数: 92
只在 antd 里（我们缺）: 0
只在我们里（多出）: 0
属性有差异的规则数: 3   ← 全部是 Component Token 声明（antd 放在独立的 cssVar 块里）
```

即 **92/92 条选择器完全一致、零属性差异**（多出的只有 16 条 `--apollo-radio-*` 声明）。

**过程中修掉的一处「顺手修好」**：初次实现把 `.apollo-radio-button-wrapper .apollo-radio`
（`${componentCls}`，button 形态下恒不命中 —— 内层 span 此时叫 `.apollo-radio-button`）
「修正」成了 `.apollo-radio-button`。对照脚本把它报成**唯一**一处选择器差异 ⇒ 改回逐字保留
（登记 §9.2.1 的 U8）。同段的 `.apollo-button-wrapper`（`${antCls}` 拼错）同理（U7）。

**两处实测确认的产物特征**（写进 `style/index.ts` 的注释）：

1. **radio 的 hover 规则没有 `@media (hover: hover) and (pointer: fine)` 包裹**
   —— checkbox 有、radio 没有（两边 style 源码的真实差异，产物确认）。
   同样地 radio **没有** `prefers-reduced-motion` 段。⇒ `theme.test.ts` 断言
   `expect(css).not.toContain('@media')`。
2. **16 个 Component Token 的 cssVar 产物值**（实现按本仓约定改成 var() 派生，
   两个 unitless 量保持裸数字）：

```
--apollo-radio-radio-size:16          --apollo-radio-dot-size:6
--apollo-radio-dot-color-disabled:rgba(0,0,0,0.25)
--apollo-radio-button-solid-checked-color:#fff
--apollo-radio-button-solid-checked-bg:#1677ff
--apollo-radio-button-solid-checked-hover-bg:#4096ff
--apollo-radio-button-solid-checked-active-bg:#0958d9
--apollo-radio-button-bg:#ffffff       --apollo-radio-button-checked-bg:#ffffff
--apollo-radio-button-color:rgba(0,0,0,0.88)
--apollo-radio-button-checked-bg-disabled:rgba(0,0,0,0.15)
--apollo-radio-button-checked-color-disabled:rgba(0,0,0,0.25)
--apollo-radio-button-padding-inline:15px
--apollo-radio-wrapper-margin-inline-end:8px
--apollo-radio-radio-color:#fff        --apollo-radio-radio-bg-color:#1677ff
```

**另一处实现期修正（判据级）**：产物确认 `<Radio defaultChecked />` 时
**span 有 `-checked`、wrapper 没有 `-wrapper-checked`** —— wrapper 的类名读
`mergedChecked`（= `checked` prop / Group 值），不含非受控内部态。这是上游的不一致，
**逐字保留**（`Radio.ts` 的 `mergedChecked` / `effectiveChecked` 两个 computed）。
L4 基线 `radio:default-checked` 是它的机械证据。

**采集脚本**（一次性，未入库）：渲染 → `extractStyle` → 与 `genRadioStyle` 对拍。
`/tmp` 会被清，所以关键结论（上面的 token 值表与两处产物特征）已落到本节。

