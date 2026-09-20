# Button 分析产物（G1）

> 阶段：Phase 2 · 组件 `button`（P0 / complexity M / unblocks 2）
> 目标：**只读 antd 6.6.4 的行为与契约**，不搬实现。本文先于任何实现代码存在（`AGENTS.md` §2）。

## 0. 事实来源（全部本地缓存，已读）

| 用途 | 路径 |
|---|---|
| 类型面 | `/tmp/antd-src/package/es/button/{Button.d.ts,buttonHelpers.d.ts,ButtonGroup.d.ts}` |
| 行为实现 | `/tmp/antd-repo/ant-design-master/components/button/{Button.tsx,buttonHelpers.tsx}` |
| Component Token | `/tmp/antd-src/package/es/button/style/token.d.ts` |
| 样式 | `/tmp/antd-src/package/es/button/style/{index,variant,group,compact}.js` |

---

## 1. 类型面（antd 的公开契约）

```ts
ButtonType      = 'default' | 'primary' | 'dashed' | 'link' | 'text'
ButtonShape     = 'default' | 'circle' | 'round' | 'square'
ButtonHTMLType  = 'submit' | 'button' | 'reset'
ButtonVariantType = 'outlined' | 'dashed' | 'solid' | 'filled' | 'text' | 'link'
ButtonColorType = 'default' | 'primary' | 'danger' |
                  'blue' | 'purple' | 'cyan' | 'green' | 'magenta' | 'pink' | 'red' |
                  'orange' | 'yellow' | 'volcano' | 'geekblue' | 'lime' | 'gold'
SizeType        = 'small' | 'middle' | 'large'
```

`BaseButtonProps`：`type / color / variant / icon / iconPosition(废弃) / iconPlacement /
shape / size / disabled / loading / prefixCls / className / rootClassName / ghost / danger /
block / children / classNames / styles / _skipSemantic`

`ButtonProps extends BaseButtonProps`：`href / htmlType / autoInsertSpace` + 合并后的
`HTMLAttributes & ButtonHTMLAttributes & AnchorHTMLAttributes`（**去掉 React 自带的 `type` 与 `color`**）。

⚠️ `icon` 在 v6 是 **VNode**，不是 v4 的字符串名（上游有 dev warning 兜底）。

### 语义化（semantic）

`classNames / styles` 各 3 个键：`root / icon / content`。
上游还支持**函数式变体**（`classNamesAndFn` / `stylesAndFn`）。
⚠️ 本仓库 `MEMORY.md` 的未决事项里 `empty-semantic-fn` 决策建议 **B（不支持函数式）** ——
即 `divider`/`spin` 走的 `useMergeSemantic` **没有函数分支**。⇒ **Button 也按 B 处理**，
只支持对象形态，把「不支持函数式」如实登记为差异。

---

## 2. Vue API 设计（本节是我们自己的设计，不是 antd 的）

| antd (React) | Vue 侧 | 说明 |
|---|---|---|
| `onClick` | emit `click` | 类型 `MouseEvent` |
| `children` | 默认插槽 `default` | |
| `icon` | 具名插槽 `icon` | 同时保留 `icon?: VNode` prop（与 divider/empty 一致） |
| `href` | prop `href` | 有值 ⇒ 渲染 `<a>` |
| `htmlType` | prop `htmlType` | 默认 `'button'` |
| `ref` | expose `{ nativeElement }` | 对齐 divider/empty 的 expose 形态 |
| 其余全部 prop 透传 | `v-bind="$attrs"` | |

⚠️ **`loading` 的两种形态**：`boolean | { delay?: number; icon?: VNode }`。

---

## 3. DOM 契约

上游 `Button.tsx:449-490`，两条互斥分支：

### 3.1 `href !== undefined` ⇒ `<a>`

```html
<a class="…" href={disabled ? undefined : href} style={styles.root}
   tabindex={disabled ? -1 : 0} aria-disabled={disabled}>
  {iconNode}{contentNode}
</a>
```

- ⚠️ **disabled 时 `href` 被移除**（不是加 `disabled` 属性 —— `<a>` 没有这个属性）
- ⚠️ `tabindex` 由 disabled 决定（`-1` / `0`）
- ⚠️ `aria-disabled` 恒为字符串（`"true"` / `"false"`）

### 3.2 否则 ⇒ `<button>`

```html
<button type={htmlType} class="…" style={styles.root} disabled={disabled}>
  {iconNode}{contentNode}
</button>
```

- ⚠️ **`disabled` 用原生属性**（不是 `aria-disabled`）—— 与 `<a>` 分支不对称，是上游真实行为
- `type` 默认 `'button'`

### 3.3 内部结构

`iconNode` 在前、`contentNode` 在后；`iconPlacement='end'` 时靠 **CSS 类** `-icon-end` 翻转，
**不是**调换 DOM 顺序（`Button.tsx:390`）。

`contentNode`：`isReactRenderable(children)` 为真时走 `spaceChildren`（见 §4.3），否则 `null`。

`compactItemClassnames` 存在时，`<button>` 内还会插一个 `<Compact prefixCls>`（样式节点）。

---

## 4. 关键行为（逐条给上游行号）

### 4.1 color / variant 解析（`Button.tsx:181-221`）

```
if (color && variant)            → [color, variant]        // 显式优先
if (type || danger)              → ButtonTypeMap[type]，danger 时 color 换成 'danger'
if (variant === 'solid')         → ['primary', 'solid']
contextColor && contextVariant   → 用 context
contextVariant === 'solid'       → ['primary', 'solid']
兜底                              → ['default', 'outlined']

ButtonTypeMap:
  default → ['default','outlined']
  primary → ['primary','solid']
  dashed  → ['default','dashed']
  link    → ['link','link']        // 'link' 不是真颜色，只是为了兼容
  text    → ['default','text']

ghost && variant==='solid'        → variant 退化为 'outlined'
```

`mergedColorText = color === 'danger' ? 'dangerous' : color`（`-color-dangerous` 而非 `-color-danger`）。

### 4.2 loading（`Button.tsx:100-114, 234-236, 261-267`）

```
对象形态：delay = isNumber(delay) ? delay : 0;  loading = delay <= 0
布尔形态：loading = !!loading, delay = 0

delay > 0  → 延迟 delay ms 后才置 true（useLayoutEffect，非 useEffect —— 防连点）
delay <= 0 → 立即置为 loadingOrDelay.loading
```

⚠️ `useDelayState` 的语义：**只在 delay 到点后变 true，不会自动变 false**（变 false 靠 loading prop 变回）。

### 4.3 两个中文字自动插空格（`Button.tsx:244-245, 270-283` + `buttonHelpers.tsx:11`）

```
isTwoCNChar = /^[\u4E00-\u9FA5]{2}$/.test
needInserted = childNodes.length === 1 && !icon && !isUnBorderedButtonVariant(mergedVariant)
mergedInsertSpace = autoInsertSpace ?? contextAutoInsertSpace ?? true

命中 ⇒ 类名加 -two-chinese-chars，且字符串子节点被包成 <span> 并把两字用空格 join
```

⚠️ 判据是 **`textContent`** 恰好两个汉字（正则 `^…{2}$`），不是「≥2」。
⚠️ `link` / `text` 变体**不插**（`isUnBorderedButtonVariant`）。

### 4.4 disabled / size 的多级回退

```
mergedDisabled = props.disabled ?? DisabledContext          // :230
sizeFullName   = props.size ?? compactSize ?? groupSize ?? ctxSize  // :332
mergedShape    = props.shape ?? contextShape ?? 'default'   // :179
```

⚠️ 用 `??` 不是 `||` ⇒ **`false`/`''` 也会被当作显式值**（与 config-provider 的
`componentDisabled` 用 `??`、`componentSize` 用 `||` 的不对称一致）。

### 4.5 点击拦截（`Button.tsx:293-308`）

```
if (innerLoading || mergedDisabled) { e.preventDefault(); return; }   // 不触发 onClick
```

### 4.6 类名契约（`Button.tsx:369-397`）

| 类 | 条件 |
|---|---|
| `-{shape}` | shape 不是 `default` / `square` |
| `-{type}` | 恒加（兼容 5.21 之前） |
| `-dangerous` | `danger` prop 为真（注意：不是 mergedColor==='danger'） |
| `-color-{mergedColorText}` | 恒加 |
| `-variant-{mergedVariant}` | 恒加 |
| `-lg` / `-sm` | size 为 `large` / `small` |
| `-icon-only` | `!children && children !== 0 && !!iconType` |
| `-background-ghost` | `ghost && !isUnBorderedButtonVariant(variant)` |
| `-loading` | innerLoading |
| `-two-chinese-chars` | 见 §4.3 |
| `-block` | block |
| `-rtl` | direction === 'rtl' |
| `-icon-end` | iconPlacement === 'end' |

⚠️ `-dangerous` 用的是**原始 `danger` prop**，不是解析后的 `mergedColor`。

### 4.7 Wave 涟漪（`Button.tsx:483-489`）

非 `text`/`link` 变体的 `<button>` 会被 `<Wave component="Button">` 包一层。
⇒ Vue 侧需要一个等价物（**不得引入 React**）。本仓库有 `@apollo-design/motion`，
但 Wave 是**点击涟漪**，属组件自身效果。⇒ 先用**纯 CSS + 类名**实现，
若 motion 层有对应能力再替换；差异登记为 INTENDED/PLATFORM。

### 4.8 开发期告警（`Button.tsx:311-327`）

- `icon` 是长度 > 2 的字符串 ⇒ breaking
- `ghost` 且变体为 `link`/`text` ⇒ usage
- `iconPosition` 已废弃 ⇒ deprecated

---

## 5. Token 面

Component Token（`style/token.d.ts`，节选）：
`fontWeight / iconGap / defaultShadow / primaryShadow / dangerShadow /
primaryColor / defaultColor / defaultBg / defaultBorderColor / dangerColor / defaultHoverBg / …`
（含各 color/variant 组合的 hover/active 色，以及 `paddingInline*`、`borderRadius*` 等）

⇒ 样式必须**全部走 Token → CSS 变量**（H9），不得硬编码颜色/圆角/间距/阴影。

---

## 6. 差异预判

| # | 差异 | 分类 | 说明 |
|---|---|---|---|
| D1 | `classNames`/`styles` **不支持函数式** | INTENDED | 跟 `empty-semantic-fn` 决策 B；已完成的组件一致 |
| D2 | Wave 用 CSS 实现而非 React 组件 | INTENDED | 不得引入 React；形态差异不影响 DOM 契约 |
| D3 | `ref` 暴露 `{ nativeElement }` 而非 DOM 节点 | INTENDED | 全库统一形态 |
| D4 | `icon` 支持 prop 与插槽两种 | INTENDED | 与 divider/empty 一致 |
| D5 | 无 `Button.Group`（已废弃）指向 `Space.Compact` | INTENDED | 上游自己标 deprecated；`Space.Compact` 已收口 |
| D6 | 两个中文字判定依赖 `textContent` | PLATFORM | Vue 的插槽渲染时序不同，需在 `onUpdated` 也检测（上游 `useEffect` **无依赖数组**，每次渲染都跑） |

⚠️ D6 是最容易漏的：上游那个 effect **故意不写依赖数组**（`Button.tsx:283` 注释），
等价于**每次渲染后都跑** ⇒ Vue 侧必须在 `onUpdated` 里同样处理，不能只在 `onMounted` 跑一次。

---

## 7. 测试矩阵（7 层）

| 层 | 覆盖点 |
|---|---|
| L1 unit | color/variant 解析表（含 ghost 退化、danger 改写）、loading 两种形态、size/shape 回退链、点击拦截、两字判定 |
| L2 interaction | 点击（含 loading/disabled 不触发）、href 分支的 tabIndex/aria-disabled、autoFocus |
| L3 type | 5 个类型联合、`loading` 对象形态、semantic 类型 |
| L4 dom-contract | `<button>` vs `<a>` 两类 DOM 结构、类名契约全表、disabled 时 href 移除 |
| L5 a11y | `disabled` 原生属性 vs `aria-disabled` 的不对称、tabIndex、icon-only 的可访问名 |
| L6 visual | type × color × variant × shape × size × ghost × danger × block × loading × iconPlacement 的代表组合 |
| L7 build | 已在全仓门禁内 |

⚠️ L6 的 React 基线必须 **`git add` 入库**（PITFALLS：上一轮 config-provider 曾 0 张基线冒充「3/9 exact」）。

---

## 8. 未决 / 待验证

- Wave 涟漪的最终形态（先 CSS，待 motion 层能力确认后再评估替换）。
- `compactSize` 来自 `space/Compact`（已收口），需确认其导出形态后再接。
- `filled` 变体在上游存在但 `ButtonTypeMap` 未映射 ⇒ 只能由 `variant` 显式传入，测试需覆盖。
