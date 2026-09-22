# Checkbox —— antd 6.6.4 契约分析（G1）

> 材料：`/tmp/antd-src/package/es/checkbox/` + antd v6.6.4 的 demo/测试
> （`/tmp/antd-demo/checkbox/`）+ cssinjs 实测 CSS。**Component Token 0 个**
>（样式全 alias token；checkboxSize = `controlInteractiveSize`）。

## 1. 文件与规模

| 文件 | 行 | 职责 |
|---|---|---|
| `Checkbox.js` | 156 | Checkbox 本体（RcCheckbox 包装：label + input + label 槽） |
| `Group.js` | 105 | CheckboxGroup（value 受控/非受控、options 归一化、registerValue） |
| `useBubbleLock.js` | 27 | label click → input click 防双触发（raf 锁） |
| `GroupContext.js` | 2 | toggleOption / value / disabled / name / registerValue / cancelValue |
| `style/index.js` | 215 | genCheckboxStyle（0 Component Token） |

## 2. API 面

### CheckboxProps（`AbstractCheckboxProps<CheckboxChangeEvent>`）

| prop | 说明 |
|---|---|
| checked / defaultChecked | 受控 / 非受控（`useControlledState(defaultChecked, checked)`） |
| indeterminate | 半选（**副作用**：直接设 `input.indeterminate`，非 attr） |
| disabled | 三级合并：`disabled ?? group.disabled ?? DisabledContext` |
| skipGroup | true ⇒ 脱离 Group 管理（不注册 value、不 toggle） |
| value | ⚠️ **不是有效 prop** —— 传了发 usage 告警「do you mean checked?」；但在 Group 内它是选项值 |
| onChange | `(e: CheckboxChangeEvent) => void`，e.target = `{...props, checked}` |
| onClick / onMouseEnter / onMouseLeave / onFocus / onBlur / onKeyDown / onKeyPress | 透传 |
| name / id / tabIndex / required / autoFocus / title | 透传给 input |
| classNames / styles | 语义槽 `{ root, icon, label }`（对象或函数） |

- `classString`（label）序：`-wrapper → {rtl, -wrapper-checked, -wrapper-disabled,
  -wrapper-in-form-item} → contextClassName → className → 语义 root → rootClassName`
- `checkboxClass`（span）序：`语义 icon → { -indeterminate } → ant-wave-target`
- 语义 styles：`mergedStyles.root` 落 label、`mergedStyles.icon` 落 span、
  `mergedStyles.label` 落文字 span。
- `children` 用 `isReactRenderable` 判据（非空 / 非 false / 非 ''）包 `-label` span。

### CheckboxChangeEvent

`{ target: { ...props, checked }, stopPropagation, preventDefault, nativeEvent }`。

### Group（`CheckboxGroupProps<T>`）

| prop | 说明 |
|---|---|
| options | `(string | number | CheckboxOptionType)[]`；字符串/数字 ⇒ `{label, value}`；过滤 null/undefined value |
| value / defaultValue | 受控数组（`value || []` 兜底） |
| onChange | `(checkedValue: T[]) => void` —— **按 registeredValues 过滤 + 按 options 顺序排序** |
| disabled | 整组禁用（`'disabled' in option` 时 option 优先） |
| name | 原生表单 name（透传给所有子 input） |
| role | 默认 `'group'` |
| className / rootClassName / style | 透传 |

- `toggleOption`：`mergedValue` 增删 → `setValue` → `onChange(newValue.filter(在注册表中).sort(按 options 顺序))`。
- `registerValue` / `cancelValue`：子 Checkbox mount/unmount 注册（onChange 过滤已移除的值 —— 上游 issue 16376）。
- 子 Checkbox 的 `name = checkboxGroup.name`（skipGroup 除外）。
- Group 根：`div role="group"`，类序 `checkbox-group → {rtl} → className → rootClassName`。
- `domProps = omit(restProps, ['value','disabled'])`。
- options 渲染的 Checkbox：`key = value.toString()`、`className = '-group-item' + option.className`、
  `style/title/id/required/onChange` 透传、`checked = mergedValue.includes(option.value)`。

### useBubbleLock

label click 设 raf 锁；锁存在时 input click `stopPropagation`（防 label→input→label
双触发）。**Vue 侧用 `@apollo-design/utils` 的 raf（utils/src/raf.ts，有 cancel）**。

## 3. DOM 结构（L4 契约核心）

RcCheckbox 的产物（`@rc-component/checkbox`）：

```html
<label class="ant-checkbox-wrapper …">
  <span class="ant-checkbox …">          <!-- checkboxClass 落这里 -->
    <input type="checkbox" class="ant-checkbox-input" …>
    <span class="ant-checkbox-inner"></span>
  </span>
  <span class="ant-checkbox-label">…</span>
</label>
```

⚠️ 待基线提取确认：`ant-wave-target` 类是否出现在 SSR（Wave 的 TARGET_CLS 是
固定常量 `ant-wave-target`，**不随 prefixCls 变**）；`-inner` span 的确切类名。

## 4. 样式要点（0 Component Token，全 alias token）

- wrapper：`inline-flex / align-items:baseline / cursor:pointer`；`:after` 撑基线
  （`content:'\a0'`）；`& + wrapper { margin-inline-start:0 }`。
- checkbox span：`checkboxSize = controlInteractiveSize`；`direction:ltr`（rtl 里
  勾的方向不变）；`border-radius: borderRadiusSM`；`:after` 是勾（旋转 45° 的
  边框三角），尺寸 = `calc(checkboxSize/14*5) × calc(checkboxSize/14*8)`。
- input：`position:absolute; inset:calc(-1*lineWidth); opacity:0; z-index:1`。
- focus：`:has(input:focus-visible)` ⇒ genFocusOutline。
- hover 全部包在 `@media (hover: hover) and (pointer: fine)` 里。
- checked：`backgroundColor/borderColor = colorPrimary`；hover ⇒ colorPrimaryHover
  + transparent。
- indeterminate：`-indeterminate` 类 ⇒ `:after` 变横条（`fontSizeLG/2` 宽高、
  `colorPrimary` 背景、无边框）。
- disabled：`colorBgContainerDisabled / colorBorder / colorTextDisabled`；
  input `pointer-events:none`。
- group：`inline-flex / flex-wrap / column-gap: marginXS`；`> ant-row { flex:1 }`。

## 5. demo（8 个非 debug）

`basic`、`check-all`（indeterminate 全选，依赖 Divider ✓）、`controller`（Button ✓）、
`disabled`（Flex ✓）、`group`、`layout`（Row/Col ✓ grid 已落地）、`style-class`、
`custom-line-width`（ConfigProvider theme token —— 见 §6）。
debug：`_semantic` / `debug-disable-popover` / `debug-group-width` / `debug-line`。

## 6. 本仓实现取舍（PLATFORM 差异预告）

| # | 差异 | 分类 |
|---|---|---|
| 1 | Wave 点击波纹不实现（button/skeleton 同），`ant-wave-target` 类按基线产物决定保留与否 | PLATFORM |
| 2 | `FormItemInputContext`（`-wrapper-in-form-item`）依赖 form 未落地 ⇒ 恒 false | PLATFORM |
| 3 | DisabledContext：用 config-provider 的 `disabled`（若已实现）；否则跳过 | 视现状 |
| 4 | `useBubbleLock` 用 utils 的 raf | PLATFORM |
| 5 | `custom-line-width` demo 依赖 `ConfigProvider theme.token.lineWidth` —— 我们无 theme token 注入 ⇒ demo 登记为等价替换或不做 | PLATFORM |

## 7. 上游测试要点（转断言）

- hover 事件落 **label**；focus/blur 落 **input**；indeterminate 直接改 `input.indeterminate`。
- `value` prop 告警（组外）。
- 事件冒泡锁：label click → onClick 1 次；input click 后每 click 1 次。
- Group：基本 toggle 序列、整组 disabled 不触发、option 级 disabled、
  name 透传、受控 value、`value=undefined` 用 defaultValue、
  onChange 过滤已移除的值 + 保持 options 顺序、skipGroup、number 选项、
  div ref、Group disabled=false 覆盖 contextDisabled。
