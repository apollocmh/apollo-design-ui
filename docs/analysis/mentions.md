# Mentions · G1 分析产物

> 兼容目标 **antd 6.6.4**。参考实现：`/tmp/antd-repo/ant-design-master/components/mentions/`（源码）
> 与 `/tmp/antd-src/package/es/mentions/`（产物）；引擎参考 `@rc-component/mentions@1.12.0`（本机
> `node_modules/.pnpm/@rc-component+mentions@1.12.0/.../es/`）。
>
> **本文件里的每一处「实测」都来自两条可复现命令**：
> ① `node /tmp/probe-mentions-react.mjs` / `/tmp/probe-mentions-matrix.mjs`（jsdom + React 真渲染，dump DOM）
> ② `node tests/visual/debug/extract-mentions-css.mjs`（SSR + cssinjs `extractStyle`，dump 真实 CSS）

---

## 0. 结论摘要（五句话）

1. **antd 的 `Mentions` 是一层薄壳**（219 行），真正的引擎在 `@rc-component/mentions@1.12.0`
   （`Mentions` / `KeywordTrigger` / `DropdownMenu` / `util` / `useEffectState`，5 个文件），
   裁决为 **`in-ui`** ⇒ 落 `packages/ui/src/mentions/engine/`（`registry/dependencies.json:650`）。
2. 引擎的**输入控件直接复用 `@rc-component/input` 的 `BaseInput` + `TextArea`**
   ⇒ 本仓复用 **已完成的 `input/engine/BaseInput.ts` + `input/engine/TextArea.ts`**（本组件最大的省力点）。
3. 引擎的**浮层复用 `@rc-component/trigger`** ⇒ 复用本仓 `_internal/trigger.ts` 的 `Trigger`
   （`KeywordTrigger` 只贡献 4 个 `builtinPlacements` 与 placement 推导）。
4. 引擎的**候选列表用 `@rc-component/menu`**，但只用到「展示 + activeKey + hover 激活 + select」这一窄面
   ⇒ **自建 40 行的最小菜单**（理由见 §4.2），DOM 由实测钉死。
5. 🚨 **本组件有 3 条「照抄就错」的硬点**：① textarea 的类名是 rc-input 的默认前缀 `rc-textarea`
   （antd **不**给它传 prefixCls）；② 本仓 `RcTextArea` 缺 `${prefixCls}-disabled`（上游有）；
   ③ `onKeyUp` 在 Vue 里**必须声明成 prop**，否则会被 hyphenate 成 `key-up` 而永不触发。

---

## 1. 组件面

### 1.1 上游文件 → 本仓

| 上游 | 行数 | 本仓 | 说明 |
|---|---|---|---|
| `components/mentions/index.tsx` | 219 | `mentions/Mentions.ts` | antd 包装层（config/form/status/variant/语义槽/PurePanel） |
| `@rc-component/mentions/es/Mentions.js` | 296 | `mentions/engine/Mentions.ts` | 引擎：受控值、measure 状态机、键盘、focus/blur、Option 归一 |
| `@rc-component/mentions/es/KeywordTrigger.js` | 52 | `mentions/engine/KeywordTrigger.ts` | 4 个 builtinPlacements + placement 推导 + Trigger 接线 |
| `@rc-component/mentions/es/DropdownMenu.js` | 71 | `mentions/engine/DropdownMenu.ts` | 候选列表（activeKey / hover 激活 / 滚动入视口） |
| `@rc-component/mentions/es/util.js` | 78 | `mentions/engine/util.ts` | 6 个纯函数（**L1 钉死的主战场**） |
| `@rc-component/mentions/es/hooks/useEffectState.js` | 21 | `mentions/engine/use-effect-state.ts` | 「状态变更后跑一次回调」 |
| `@rc-component/mentions/es/Option.js` | 2 | 不落文件 | `const Option = () => null`（**不产 DOM**，见 §1.4） |
| `@rc-component/mentions/es/MentionsContext.js` | 3 | `mentions/engine/context.ts` | 候选列表 → 引擎的回调通道 |
| `@rc-component/mentions/es/context.js` | 2 | 同上（`UnstableContext`） | 语义预览用的「强制展开」开关 |
| `@rc-component/input` 的 `BaseInput` / `TextArea` | — | **复用** `input/engine/` | 已 completed |
| `@rc-component/trigger` | — | **复用** `_internal/trigger.ts` | 已 completed |
| `components/_util/PurePanel` | — | `mentions/PurePanel.ts` | 照 `select/PurePanel.ts` 的简化等价物 |
| `components/select/usePopupRender` | 15 | 内联进 `Mentions.ts` | 只是 `ContextIsolator` 包一层；本仓无 `ContextIsolator`（D36/D103） |
| `components/spin` | — | **复用** `spin` | `loading` 态的唯一消费者 |

### 1.2 对外面（`MentionsProps`）

上游 `MentionProps extends Omit<RcMentionsProps, 'suffix' | 'classNames' | 'styles'>`，再补
`rootClassName / loading / status / options / popupClassName / variant / classNames / styles / size`。
`RcMentionsProps` 又是 `Omit<TextAreaProps, 'prefix' | 'onChange' | 'onSelect' | 'showCount' | 'classNames'>`
+ 一堆自有字段。**完整字段表在 `mentions/interface.ts` 的注释里逐条对齐**，这里只列易错的：

| 字段 | 形态 | 备注 |
|---|---|---|
| `options` | `MentionsOptionProps[]`（`{value,label,disabled,className,style,key}`） | `Mentions.Option` 已 deprecated（走 `warning.deprecated`） |
| `prefix` | `string \| string[]`，默认 `'@'` | |
| `split` | `string`，默认 `' '` | 决定 `validateSearch` 与插入时的分隔 |
| `silent` | `boolean` | `loading` 时置真 ⇒ **Enter 不选中** |
| `filterOption` | `false \| ((input, option) => boolean)` | `loading` 时**整个替换**成恒真函数 |
| `validateSearch` | `(text, split) => boolean` | 默认「不含 split」 |
| `notFoundContent` | `VNodeChild` | 缺省 = `renderEmpty('Select') ?? <DefaultRenderEmpty componentName="Select" />` |
| `placement` | `'top' \| 'bottom'` | 默认 `bottom`（`undefined` ⇒ `bottomRight`） |
| `popupRender` | `(menu) => VNode` | 走 `usePopupRender`（本仓直接内联） |
| `onSearch / onSelect / onChange / onPopupScroll` | 回调 prop | 见 §2.5 的载荷 |
| `classNames` | `{root, textarea, popup, suffix}`（**4 个**） | 传给引擎时**多了** `mentions / variant / affixWrapper`（内部通道） |
| `styles` | `{root, textarea, popup, suffix}` | 同上 |

### 1.3 内部件与职责

```
Mentions.ts（antd 包装）
├── config-provider：getPrefixCls / direction / allowClear / className / style / classNames / styles
├── DisabledContext：mergedDisabled = props.disabled ?? contextDisabled
├── FormItemInputContext：status / hasFeedback / feedbackIcon
├── useSize：mergedSize（-sm / -lg）
├── useVariant('mentions', variant)：-outlined / -filled / -borderless / -underlined
├── useAllowClear({defaultAllowClear:false})：allowClear
├── useZIndex('SelectLike', styles.popup?.zIndex)
├── useMergeSemantic([ctxClassNames, classNames], [ctxStyles, styleRoot, styles, styleRoot])
└── engine/Mentions
    ├── engine/Mentions（外层）  ← BaseInput（affix 包裹 / suffix / clear）
    │   └── engine/Mentions（内层 InternalMentions）
    │       ├── RcTextArea（复用 input/engine/TextArea）
    │       ├── div.{p}-measure（测量层，仅 measuring 时渲染）
    │       └── engine/KeywordTrigger → _internal/Trigger → engine/DropdownMenu
```

### 1.4 依赖面核查（照 skill 的对照表逐项查过）

| antd / rc 用的 | 本仓对应物 | 结论 |
|---|---|---|
| `@rc-component/input` 的 `BaseInput` | `input/engine/BaseInput.ts` | ✅ 复用 |
| `@rc-component/input` 的 `TextArea` | `input/engine/TextArea.ts` | ✅ 复用（**但缺 `-disabled`，见 §2.7**） |
| `@rc-component/trigger` | `_internal/trigger.ts` 的 `Trigger` | ✅ 复用（props 名不同，见 §4.1） |
| `@rc-component/menu` 的 `Menu` + `MenuItem` | `menu/Menu.ts` | ⚠️ **不复用**，见 §4.2 |
| `@rc-component/util` 的 `composeRef` | Vue 的 `ref` 合并 | ✅ 不需要 |
| `@rc-component/util` 的 `KeyCode` | 字面量（`13/27/38/40`） | ✅ 直接写常量 |
| `@rc-component/util` 的 `useControlledState` | `@apollo-design/utils` 的 `useControlledValue` | ✅ 复用 |
| `@rc-component/util` 的 `useId` | 不需要（只用于 option key 去重，本仓用计数器） | ✅ |
| `_util/hooks` 的 `useAllowClear` / `useZIndex` | `_internal/use-allow-clear.ts` / `@apollo-design/portal` 的 `useZIndex` | ✅ 复用 |
| `_util/hooks/useMergeSemantic` + `useSemanticRootStyle` | `_internal/use-merge-semantic.ts`（后者叫 `semanticRootStyle`） | ✅ 复用 |
| `_util/statusUtils` 的 `getMergedStatus` / `getStatusClassNames` | `form/context` + `space/statusUtils` | ✅ 复用 |
| `config-provider/hooks/useCSSVarCls` | **无对应 hook** ⇒ 直接拼 `${prefixCls}-css-var` | ✅ rate/card 先例 |
| `genCssVar(antCls, 'cmp-mentions')` | **无对应物** ⇒ 手写 `--{p}-cmp-mentions-*` | ✅ splitter 先例 |
| `genStyleHooks` | `genMentionsStyle` + `COMPONENT_STYLES` 一行 | ✅ |
| `_util/ContextIsolator` | **本仓无** | ✅ D36/D103（popup 里没有读 Form status 的子件 ⇒ 行为等价） |
| `select/usePopupRender` | 内联（无 `ContextIsolator` 可包） | ✅ |
| `spin` | `packages/ui/src/spin` | ✅ 复用 |

**包装组件产不产 DOM（skill 要求实测的那一条）**：
- `Mentions.Option` = `() => null` ⇒ **不产任何节点**，只作为「取 children 的 props」的载体。
  本仓的 `MentionsOption` 同样必须**不产 DOM**（实测见 §2.3）。
- `KeywordTrigger` **产**一个节点：`Trigger` 的 `popup` 容器（在 Portal 里）。它 **不**包裹 textarea。

---

## 2. 行为契约（逐条）

### 2.1 状态（引擎内 7 个）

| 状态 | 初值 | 语义 |
|---|---|---|
| `measuring` | `false` | 是否处于「正在 @ 搜索」态 |
| `measureText` | `''` | `@` 之后的搜索串 |
| `measurePrefix` | `''` | 命中的前缀（`prefix` 数组里最靠右的那个） |
| `measureLocation` | `0` | 前缀在**光标前文本**里的下标 |
| `activeIndex` | `0` | 当前高亮候选（**索引进 `mergedOptions`**，不是 key） |
| `isFocus` | `false` | 焦点态（`-focused` 类） |
| `mergedValue` | `defaultValue ?? ''` | 受控值（`value` 传了即受控） |

另有 `UnstableContext.open`（**强制展开**，只给语义预览 demo 用）：为真时 `mergedMeasuring` 恒真，
且 `measureLocation = mergedValue.lastIndexOf(prefix)`。

### 2.2 `onInternalKeyUp` —— 开始/停止测量的唯一入口（**顺序即语义**）

```
1. getBeforeSelectionText(target)      ← input.value.slice(0, selectionStart)
2. getLastMeasureIndex(text, prefix[]) ← 取**最靠右**的前缀命中（严格 > lastMatch.location）
3. onKeyUp?.(event)                    ← 先调用户回调（在判定之前！）
4. which ∈ {ESC,UP,DOWN,ENTER} ⇒ return
5. measureIndex !== -1：
     nextMeasureText = text.slice(measureIndex + prefix.length)
     validateMeasure = validateSearch(nextMeasureText, split)
     matchOption     = getOptions(nextMeasureText).length > 0
     if (validateMeasure) {
       if (key === prefix || key === 'Shift' || which === ALT(18) || key === 'AltGraph'
           || mergedMeasuring || (nextMeasureText !== measureText && matchOption))
         startMeasure(...)
     } else if (mergedMeasuring) stopMeasure()
     if (onSearch && validateMeasure) onSearch(nextMeasureText, prefix)
   else if (mergedMeasuring) stopMeasure()
```

🚨 **两条容易改错的判据**：
- `onKeyUp` 的调用在**白名单 return 之前** ⇒ ESC/↑/↓/Enter 也会先调用户回调。
- 开始测量的条件里有 `nextMeasureText !== measureText && matchOption` 的**与**关系
  ⇒ 「打了字但没有候选」**不会**开面板（实测：`@zzz` + 3 个不匹配候选 ⇒ 面板不出现）。
  但 `key === prefix` 是**短路或** ⇒ 刚敲 `@`（搜索串为空、无候选）**也会**开面板。

### 2.3 `getOptions`（候选归一）

```
options?.length > 0 ⇒ 用 options；否则用 children（每个 child 取 props + label = props.children）
key = `${item.key ?? item.value}-${uniqueKey}`   ← 只用于 data-menu-id / React key
filterOption === false ⇒ 全保留；否则 filterOption(measureText, option)
```
默认 `filterOption(input, {value})` = `value.toLowerCase().includes(input.toLowerCase())`
⇒ **空搜索串恒命中**（这解释了「敲 `@` 就列出全部候选」）。

`Option`（`() => null`）实测**不产 DOM**；children 只被读 props。

### 2.4 `selectOption` 与「回填 + 光标恢复」

```
selectOption(option):
  if (!option || option.disabled) return
  {text, selectionLocation} = replaceWithMeasure(mergedValue, {measureLocation, targetText: value, prefix, selectionStart, split})
  triggerChange(text)                       ← setMergedValue + onChange?.(text)
  stopMeasure(() => setInputSelection(getTextArea(), selectionLocation))
  onSelect?.(option, measurePrefix)
```
`stopMeasure(cb)` 把 `cb` 交给 `useEffectState` ⇒ **在下一轮 effect 里执行**（那时 DOM 已是新值）。
`setInputSelection` = `setSelectionRange(loc, loc)` 然后 **`blur()` + `focus()`**（把光标带回视野）。

`replaceWithMeasure` 的四步（`util.ts`，L1 逐条钉）：① 前缀前若有 `split` 先削一个；
② 前缀前有内容就补一个 `split`；③ 用 `reduceText` 削掉与 `targetText` 重复的开头（大小写不敏感）；
④ 结果开头若多出 `split` 再削一个。返回的 `selectionLocation` = 已连接前缀文本的长度。

### 2.5 键盘（`onInternalKeyDown`）

```
onKeyDown?.(event)  ← 先调用户回调
if (!mergedMeasuring) return
UP/DOWN  ⇒ getEnabledActiveIndex(activeIndex ± 1, ±1)（跳过 disabled，环形）；preventDefault
ESC      ⇒ stopMeasure()
ENTER    ⇒ preventDefault；silent ⇒ return；无候选 ⇒ stopMeasure；targetIndex 兜底 ⇒ selectOption
```
`getEnabledActiveIndex(index, offset)`：从 `index` 起按 `offset` 环行 `len` 次找第一个非 disabled；
全 disabled 或空 ⇒ `-1`。

`mergedOptions` 变化后（effect）：当前 `activeIndex` 指向 disabled/不存在 ⇒ 重设为 `getEnabledActiveIndex(0)`。

### 2.6 focus / blur

- `onInternalFocus`：`clearTimeout(focusRef)`；**`!isFocus` 时才调 `onFocus`**；`setIsFocus(true)`。
- `onInternalBlur`：`setTimeout(0)` 里 `setIsFocus(false) + stopMeasure() + onBlur?.(event)`
  ⇒ **blur 有 0ms 延迟**（点候选时先 blur 再 focus 回，靠 `clearTimeout` 抵消）。
- 候选列表的 focus/blur 也走同两个函数（`onDropdownFocus` / `onDropdownBlur`）。

### 2.7 值 / 清空

- 引擎外层（有 `suffix` 或 `allowClear` 时）包一层 `BaseInput`，`hasWrapper=true`
  ⇒ **内层不再渲染 `div.{p}` 根**（见 §3.1 的 DOM 实测）。
- 清空按钮由 `BaseInput` 渲染；`-hidden` 类在「空值 / disabled / readOnly / allowClear.disabled」时挂上
  （**是挂类，不是不渲染**）。
- 🚨 **`rc-input` 的 `TextArea` 会给 textarea 加 `${prefixCls}-disabled`**（`ResizableTextArea.js`）——
  **本仓 `input/engine/TextArea.ts` 目前没有这一条**（实测见 §3.3）。这是 input 的既有缺口，
  本组件必须顺手补（否则 disabled 形态的 DOM 契约直接红）。

### 2.8 其它

- `loading`：`silent=true`、`filterOption` 换成恒真、`options` 换成
  `[{value:'ANTD_SEARCHING', disabled:true, label:<Spin size="small"/>}]`、children 换成 `<Option value="ANTD_SEARCHING" disabled><Spin/></Option>`。
- `notFoundContent`：`undefined` 时 `renderEmpty?.('Select') || <DefaultRenderEmpty componentName="Select"/>`。
- `popupRender`：`usePopupRender(popupRender)` ⇒ 包一层 `ContextIsolator space`（本仓无，直接透传）。
- `zIndex`：`useZIndex('SelectLike', mergedStyles.popup?.zIndex)` ⇒ 写进 `styles.popup.zIndex`。
- `getMentions(value, config)`：**纯函数静态方法**，`prefix` 可数组、`split` 默认 `' '`，
  只收集 `value` 非空的项。

---

## 3. 样式契约（**实测产物**，非源码推演）

### 3.1 实测 DOM（jsdom + React 真渲染，`/tmp/probe-mentions-matrix.mjs`）

**闭态 · 默认**（`prefixCls='apollo-mentions'`）：
```html
<div class="apollo-mentions css-dev-only-do-not-override-1v6lqee apollo-mentions-outlined apollo-mentions css-var-root apollo-mentions-css-var" style="width: 100%;">
  <textarea rows="1" class="rc-textarea"></textarea>
</div>
```
⇒ 类名顺序 = `[div 自身(clsx(prefixCls, classNames.mentions))]` + `[classNames.variant]` + `[BaseInput 的 className]`。
**`apollo-mentions` 出现两次**（一次是 rc-mentions 的 div 前缀，一次是 BaseInput 的 className 前缀）—— 逐字保留。

**闭态 · allowClear**（`hasWrapper=true` ⇒ **根 div 消失**，`BaseInput` 的 affix wrapper 成为根）：
```html
<span class="apollo-mentions-affix-wrapper css-dev-only-... apollo-mentions-outlined apollo-mentions css-var-root apollo-mentions-css-var apollo-mentions-has-suffix">
  <textarea rows="1" class="rc-textarea">a</textarea>
  <span class="apollo-mentions-suffix"><button type="button" class="apollo-mentions-clear-icon">…</button></span>
</span>
```

**开态（敲 `@`）**：
```html
<div class="apollo-mentions ..." style="width:100%">
  <textarea rows="1" class="rc-textarea">@</textarea>
  <div class="apollo-mentions-measure"><span>@</span></div>
</div>
<div>  <!-- Portal 容器 -->
  <div class="apollo-mentions-dropdown css-dev-only-... css-var-root apollo-mentions-css-var apollo-mentions-dropdown-placement-bottomRight"
       style="--arrow-x: 0px; --arrow-y: 0px; left: -1000vw; top: -1000vh; right: auto; bottom: auto; box-sizing: border-box;">
    <ul class="apollo-mentions-dropdown-menu apollo-mentions-dropdown-menu-root apollo-mentions-dropdown-menu-vertical"
        role="menu" tabindex="0" data-menu-list="true">
      <li class="apollo-mentions-dropdown-menu-item apollo-mentions-dropdown-menu-item-active"
          role="menuitem" tabindex="-1" data-menu-id="rc-menu-uuid-_r_14_-afc163-_r_11_">afc163</li>
      <li class="apollo-mentions-dropdown-menu-item" role="menuitem" tabindex="-1" data-menu-id="…">zombieJ</li>
      <li class="apollo-mentions-dropdown-menu-item" role="menuitem" tabindex="-1" data-menu-id="…">yesmeck</li>
    </ul>
    <div style="display: none;" aria-hidden="true"></div>   <!-- rc-menu 的隐藏测量层 -->
  </div>
</div>
```
⚠️ 三个易错点：
- `<ul>` **没有** `-light` 类 —— rc-mentions 调 rc-menu 时**不传 `theme`**（本仓 `menu/Menu.ts` 的
  `theme` 默认 `'light'` ⇒ **复用本仓 Menu 会多一个类**，这是 §4.2 不复用的直接证据之一）。
- `<li>` **没有** `-only-child`（antd 的 `Menu` 组件走 `items` 会加）—— 实测差异。
- disabled 的 `<li>` **没有 `tabindex`**，但**有** `data-menu-id` 与 `aria-disabled="true"`。

**其它实测（简表）**：

| 形态 | 根类名增量 |
|---|---|
| `disabled` | `apollo-mentions-disabled`（div）+ textarea `rc-textarea rc-textarea-disabled` + `disabled=""` |
| `readOnly` | 只有 textarea `readonly=""`（**无类名**） |
| `size:large` / `small` | `apollo-mentions-lg` / `apollo-mentions-sm` |
| `status:error` / `warning` | `apollo-mentions-status-error` / `-status-warning`（在 variant 槽） |
| `variant:filled/borderless/underlined` | 替换 `-outlined` |
| `className` / `rootClassName` | 插在第二个 `apollo-mentions` 之后：`extra rootx` |
| `rows:3` | textarea `rows="3"` |
| `options[].className` / `.style` | 落到 `<li>` 上 |
| 无候选 | 面板仍开（空搜索串），`<li>` 是 disabled 的 notFound 项，`data-menu-id` 用 `tmp_key` |

### 3.2 CSS 产物（`extractStyle`，98 条规则）

`node tests/visual/debug/extract-mentions-css.mjs` 产出 **98 条**与 `ant-mentions` 相关的规则
（含 `genBasicInputStyle` + 4 个 variant + `genPlaceholderStyle` + `resetComponent` 的展开）。
三段：

1. **根规则**（1 条）：`resetComponent` + `genBasicInputStyle` + `display:flex;padding:0;white-space:pre-wrap`
   + 3 个 `--ant-cmp-mentions-*` 声明。
2. **输入族 variant / size / status / rtl / placeholder**（约 65 条，`-outlined/-filled/-borderless/-underlined` 各一簇）。
3. **mentions 自有**（约 30 条）：`> textarea`、`-measure`、`-suffix`、`-clear-icon`、`-has-suffix`、
   `-disabled > textarea`、`-lg/-sm` 的 `--cmp-*` 覆写、`-dropdown` 与 `-dropdown-menu-item` 全套。

**Component Token 声明块**（antd 挂在 `.css-var-root.ant-mentions`，实测值）：
```
--ant-mentions-line-width-focus:1px        --ant-mentions-padding-block:4px
--ant-mentions-padding-block-sm:0px        --ant-mentions-padding-block-lg:7px
--ant-mentions-padding-inline:11px         --ant-mentions-padding-inline-sm:7px
--ant-mentions-padding-inline-lg:11px      --ant-mentions-addon-bg:rgba(0,0,0,0.02)
--ant-mentions-active-border-color:#1677ff --ant-mentions-hover-border-color:#4096ff
--ant-mentions-active-shadow:0 0 0 2px rgba(5,145,255,0.1)
--ant-mentions-error-active-shadow:0 0 0 2px rgba(255,38,5,0.06)
--ant-mentions-warning-active-shadow:0 0 0 2px rgba(255,215,5,0.1)
--ant-mentions-hover-bg:#ffffff            --ant-mentions-active-bg:#ffffff
--ant-mentions-input-font-size:14px        --ant-mentions-input-font-size-lg:16px
--ant-mentions-input-font-size-sm:14px     --ant-mentions-dropdown-height:250px
--ant-mentions-control-item-width:100px    --ant-mentions-z-index-popup:1050
--ant-mentions-item-padding-vertical:5px
```
⇒ `prepareComponentToken = {...initComponentToken(token), dropdownHeight:250, controlItemWidth:100,
zIndexPopup: zIndexPopupBase+50, itemPaddingVertical: (controlHeight - fontHeight)/2}`。
**前 18 项与 `input/style/token.ts` 同式**（antd 上游就是各组件各调一次 `initComponentToken`）
⇒ 本仓按组件隔离同构复刻（**不做跨组件 import**，input 的 token.ts 文件头已写明这条约定）。

**结构性差异（本仓 vs antd 产物）**：
1. 无 hash / `-css-var` 包裹层（D5）：`:where(.css-dev-only-…)` 全部剥掉。
2. 全部 `--ant-*` → `--apollo-*`；`--ant-mentions-*` → `--apollo-mentions-*`；
   `--ant-cmp-mentions-*` → `--apollo-cmp-mentions-*`。
3. 组件 token 声明块从 `.css-var-root.ant-mentions` 改挂 **`.{p}-mentions` 根规则**。
   ⚠️ affix 形态下**根就是 affix wrapper**，但它**同时带 `{p}-mentions` 类**（实测 §3.1）
   ⇒ 一条声明块即可覆盖两种根形态。
4. `.data-ant-cssinjs-cache-path` 标记块丢弃。

### 3.3 顺带发现的 input 引擎缺口（**本组件必须一起修**）

`@rc-component/input/es/ResizableTextArea.js`：
```js
className: clsx(prefixCls, className, { [`${prefixCls}-disabled`]: disabled })
```
本仓 `input/engine/TextArea.ts` 只写 `class: [props.prefixCls, props.classNames?.textarea]` ⇒ **缺 `-disabled`**。
实测证据：`Mentions disabled` 的 React 产物是 `class="rc-textarea rc-textarea-disabled"`；
本仓 `input.dom.json` 的 33 个用例里**没有** disabled 的 textarea 用例 ⇒ 该缺口此前无人踩到。
修法：给 `RcTextArea` 的 textarea 补 `${prefixCls}-disabled`（**并补一条 input 侧的回归哨兵**）。

---

## 4. Vue 对应（平台差异与关键设计）

### 4.1 `Trigger` 的 prop 名映射（rc → 本仓）

| rc-trigger | 本仓 `_internal/trigger.ts` |
|---|---|
| `popupVisible` | `open` |
| `popupPlacement` | `placement` |
| `popupMotion` | `motion: { motionName }` |
| `popup` | `popup`（函数形态每次渲染求值 —— **与 rc 一致**） |
| `popupStyle` / `popupClassName` | 同名 |
| `builtinPlacements` | **required**（KeywordTrigger 必须显式传） |
| `afterOpenChange` | `afterOpenChange` |
| `getPopupContainer` | 本仓签名是 `(triggerNode) => HTMLElement`，而 `MentionsProps.getPopupContainer` 是 `() => HTMLElement` ⇒ **适配一层** |

本仓 `Trigger` 的浮层 div 类名由 `getAlignPopupClassName` 产出
⇒ `bottomRight` ⇒ `{p}-dropdown-placement-bottomRight`（**与实测一致**）。
⚠️ 本仓 `Trigger` 不渲染 rc-trigger 的 `<Mask>`；rc-mentions 也没开 mask ⇒ 无差异。

### 4.2 🚨 为什么**不**复用 `menu/Menu.ts`（三条硬证据）

1. **DOM 不一致**：本仓 `Menu` 的 `theme` 默认 `'light'` ⇒ 会多 `{p}-dropdown-menu-light`；
   而 rc-mentions 不传 `theme`（实测无 `-light`）。
2. **per-item 事件无通道**：rc-mentions 给每个 `MenuItem` 挂 `onMouseEnter` 来更新 `activeIndex`；
   本仓 `Menu` 的 `items` 类型不支持逐项事件。
3. **缺 `findItem` 暴露**：rc-mentions 用 `menuRef.current.findItem({key}).scrollIntoView(...)`；
   本仓 `Menu` 没有这个 imperative 句柄。要加就得改**另一个组件**的公开面（仓库规则：不擅自改别的组件）。

⇒ 自建 `engine/DropdownMenu.ts`（约 45 行），DOM 逐条对齐实测产物（含那个 `display:none` 的隐藏层）。

### 4.3 🚨 `onKeyUp` 必须声明成 prop（**PITFALLS 338 的同族**）

`rc-input` 的 `TextArea` 把 `onKeyUp` 留在 `...rest` 里摊给 `ResizableTextArea` ⇒ 落到 `<textarea>` 上，
React 里是合法的 DOM 属性。本仓的 `RcTextArea` **没有声明 `onKeyUp`** ⇒ 若直接传：
Vue 把它放进 `attrs` → `h('textarea', {...attrs})` → `parseName('onKeyUp')` → `hyphenate('KeyUp')` → **`key-up`**
⇒ **监听器挂在一个永不触发的事件上**（实测：`vue/dist/runtime-dom.cjs.js` 的 `parseName` 就是
`hyphenate(name.slice(2))`）。
⇒ **修法**：给 `RcTextArea` 声明 `onKeyUp` prop 并在 textarea 上写 `onKeyup`（与已有的 `onKeyDown`/`onKeydown` 同款）。
⚠️ 这是**静默失效**类：dev 无告警、`lint:types` 无感、jsdom 里靠 `fireEvent.keyUp` 也测不出来
（事件名不匹配 ⇒ 什么都不发生）。必须由「敲 `@` 后面板是否出现」这类**效果**断言抓。

### 4.4 平台差异预判（**照抄就错**）

| # | 上游（React） | 本仓（Vue） | 分类 |
|---|---|---|---|
| 1 | `TextArea` 不传 `prefixCls` ⇒ 默认 `rc-textarea` | 显式传 `prefixCls: 'rc-textarea'` | **逐字保留**（D43 同判：固定常量，不随 prefixCls 变） |
| 2 | `children` 是 ReactNode，`toArray(children)` 取 props | 用 `slots.default()` + `isVNode` 过滤 `Comment`/`Text` | PLATFORM |
| 3 | `useImperativeHandle` 暴露 `focus/blur/textarea/nativeElement` | `expose` 同形（getter 形态，`textarea` 是 deprecated 字段） | INTENDED |
| 4 | `useEffectState` 的「下一轮 effect 跑回调」 | `watch` + `nextTick`（语义等价：都在 DOM 更新后） | PLATFORM |
| 5 | `onChange` 收**字符串**（不是事件） | 同（`triggerChange(nextValue)`），prop 名 `onChange` | 一致 |
| 6 | `composeRef(ref, innerRef)` | 本仓不需要（没有 `forwardRef`） | PLATFORM |
| 7 | `useId` 生成的 option key | 单调计数器（`data-menu-id` 会被 L4 归一化） | PLATFORM |

---

## 5. 预判的最大风险（按概率排序）

1. **`onKeyUp` 静默失效**（§4.3）—— 症状是「面板永远不出现」，且没有任何报错。
   ⇒ 落地时**第一条** L1 用例就是「敲 `@` 后 measure 层与面板出现」。
2. **`RcTextArea` 的 `-disabled` 缺口**（§3.3）—— 会让 disabled 用例的 L4 直接红；
   修它要**单独过 input 的门禁**（跨组件影响）。
3. **measure 层与面板的渲染时机**：`startMeasure` 触发的重渲染必须在同一 tick 内产出
   `div.{p}-measure` 与面板；Vue 的 `watch` 是异步的 ⇒ 需要用 `nextTick` 在用例里等待，
   但**不能**因此放宽断言。
4. **面板定位**：jsdom 无布局 ⇒ `-1000vw/-1000vh` 的占位值会一直存在；L6 才验证真实几何。
   `getPopupContainer` 指向容器内时（语义 demo）必须仍然渲染出面板。
5. **`hasWrapper` 时根 div 消失** ⇒ `-focused` / `-disabled` / `-rtl` 三个类（挂在 `classNames.mentions` 上）
   **在 affix 形态下不渲染**（上游行为，实测）。这是 UPSTREAM 的怪癖，**逐字保留**，不要「修好」。

---

## 6. 本分析**已经证明**什么 / **没有**证明什么

### ✅ 已证明（可复现，附命令）

- `node /tmp/probe-mentions-matrix.mjs`：16 个闭态形态 + 10 个开态形态的**真实 React DOM**（§3.1）。
- `node tests/visual/debug/extract-mentions-css.mjs`：**98 条** CSS 规则 + 22 条 component token 声明（§3.2）。
- `@rc-component/input/es/ResizableTextArea.js` 的 `-disabled` 类存在，而本仓 `RcTextArea` 没有（§3.3）。
- `vue/dist/runtime-dom.cjs.js` 的 `parseName` = `hyphenate(name.slice(2))` ⇒ `onKeyUp` → `key-up`（§4.3）。
- rc-mentions 的 `KeywordTrigger` **不传** `theme` 给 rc-menu（§3.1 的 `<ul>` 无 `-light`）。

### ❌ 没有证明（G4–G9 必须先做）

- **没有**证明 measure 层的**几何**正确（`position:absolute;inset:0;z-index:-1`）—— jsdom 无布局。
- **没有**证明面板在真实浏览器里的定位/尺寸（L6 的活）。
- **没有**证明 `DropdownMenu` 的 `scrollIntoView` 在真实滚动容器里的行为（L6/L2 的活）。
- **没有**证明 `loading` 态下 `Spin` 的尺寸与面板高度（`dropdownHeight` 只有有候选时才生效）。
- **没有**验证 axe（L5）：`role="menu"` + `role="menuitem"` 的组合是否满足 `aria-required-children`。
- **没有**验证 `getMentions` 与 antd 的**逐字**一致（L1 的活；本文件只写了它的语义）。

---

## 7. G4–G9 期间补做的实测（2026-10-03）

§1–§6 是 G1 的产物。下面是**动手后才暴露**的四件事，逐条附判据与修法
（全文见 `PITFALLS.md` 339–344）。

### 7.1 🚨 `RcTextArea` 没声明 `onKeyUp` ⇒ 候选面板**永远不出现**

- **判据**：`node -e` 渲染 `h('textarea', { onKeyUp, onKeyup })` 并派发 `keyup`
  ⇒ **只有 `onKeyup` 触发**（Vue 的 `parseName('onKeyUp')` = `hyphenate('KeyUp')` = `key-up`）。
- **为什么难发现**：dev 无告警、`lint:types` 全绿、L4 全绿（DOM 是闭态）。
  `event-name-casing.test.ts` 也看不见 —— 它只扫 `h('<原生标签>', props)`，
  而这里是「组件 prop → attrs → 原生标签」的**两跳**路径。
- **修法**：`input/engine/TextArea.ts` 声明 `onKeyUp` prop + textarea 上 `onKeyup` 接线。

### 7.2 🚨 `BaseInput` 的 clone **丢掉子节点的 `children`**（插槽）

- **判据**：`<Mentions><Mentions.Option value="afc163">Afc163</…></Mentions>`
  ⇒ 候选项全丢（面板只剩 notFound 项），**不报错**。
- **根因**：rc 是 `cloneElement(child, {value, className})`（**保留** children）；
  本仓 `h(inner.type, props)` 没传第三参。
- **修法**：`h(inner.type, props, inner.children)`。`input` 家族此前没暴露 —— 它的子节点都是原生元素。

### 7.3 🚨 `BaseInput` 的 clone **覆盖**子节点 `style`（rc 是**合并**）

- **判据**：L6 `mentions/basic__light__*` 全红（0.147% / 0.186% / 0.099%），
  dump 后可见 Vue 侧根 div **没有 `style="width: 320px"`**。
- **根因**：rc 末尾还有一次 `cloneElement(element, {style: {...element.props.style, ...style}})`。
- **修法**：bare 形态 `{...child.style, ...own}`；affix/group 形态原样保留子节点 style。
  ⚠️ 同一条也影响 `input/TextArea` 的 textarea 内联 `resize` / `autoSize`。

### 7.4 🚨 组件 token 的声明块**没覆盖 Portal 出去的浮层**

- **判据**：L6 `mentions/panel__light__*` 1.326% / 0.647% / 0.345%，
  差异率**随视口反比下降** = 固定尺寸区域（候选行高少 10px）。
- **根因**：浮层不是 `.mentions` 的后代，`var(--{p}-mentions-item-padding-vertical)` **未定义**
  ⇒ `padding: var(…) var(…)` 整条失效。antd 靠 `.css-var-root.ant-mentions` 命中浮层
  （浮层自带 `ant-mentions-css-var`）；本仓的声明块只挂在 `.mentions` 上。
- **修法**：`genTokenDecls` 同时产出 `.{p}-mentions{…}` 与 `.{p}-mentions-css-var{…}`；
  并把 `classNames.popup` 真正传进 `KeywordTrigger.popupClassName`
  （上游 `clsx(popupClassName, mentionClassNames?.popup)`）—— 漏了连 `-css-var` 类都不会出现。

### 7.5 收口数字（可复现）

| 层 | 命令 | 结果 |
|---|---|---|
| L1/L2/L3 | `npx vitest run --project unit src/mentions` | 45 条全绿 |
| L4 | `npx vitest run --project dom-contract src/mentions` | **20/20** |
| L5 | `npx vitest run --project a11y src/mentions` | **17/17** |
| L6 | `node tests/visual/run.mjs --mode compare --component mentions` | **24/24 exact（0.000%）** |
| L7 | `npx vitest run --project theme src/mentions` | **11/11** |
| 跨组件回归 | `--mode compare --component input` / `input-number` | 全绿 |
