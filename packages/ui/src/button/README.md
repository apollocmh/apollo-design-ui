# button

> 契约来源：antd 6.6.4 的 `es/button/` 与 `components/button/`。
> 逐条行号记录在 [`docs/analysis/button.md`](../../../docs/analysis/button.md)。
> **Ant Design 是"答案的判据"，不是"代码的来源"**（`AGENTS.md` §0）。

## 1. 职责

按钮。引导用户点击以触发一个动作。

它是**第一个垂直切片**：无浮层、无引擎，但覆盖
Props / Events / Slots / Expose / Token / 样式 / 主题 / 波效（wave）全部机制，
是验证整条流水线成本最低的组件（选择理由见 `docs/PHASE-1-REPORT.md` §17）。

它也是全库第一个「有状态 + 有事件 + 有两条互斥 DOM 分支」的组件，所以第一次把
`TESTING.md` §3.1 的完整矩阵真正跑起来。

## 2. 文件布局

```
packages/ui/src/button/
├── Button.vue             # 主实现（<script setup> + <template>）
├── interface.ts           # 类型面（从 antd 类型"重新定义"，不复制）
├── index.ts               # 导出（含类型）
├── README.md              # 本文件
├── index.zh-CN.md         # 中文文档
├── index.en-US.md         # 英文文档
├── demo/                  # 12 个 demo（.vue + .md）
├── style/
│   ├── token.ts           # Component Token：接口 + prepareComponentToken
│   └── index.ts           # 样式生成（消费 Token → CSS 变量）
└── __tests__/             # 7 层测试
```

## 3. 公共 API

`Props`：`type / color / variant / icon / iconPosition(废弃) / iconPlacement / shape /
size / disabled / loading / prefixCls / className / rootClassName / ghost / danger /
block / href / htmlType / autoInsertSpace / classNames / styles / style`

`Emits`：`click` → `(event: MouseEvent)`

`Slots`：`default`（内容）、`icon`（图标；`icon` prop 优先）

`Expose`：`{ nativeElement }`（全库统一的形态，差异 D3）

类型导出：`ButtonProps` / `ButtonRef` / `ButtonConfig` / `ButtonType` / `ButtonShape` /
`ButtonSize` / `ButtonColorType` / `ButtonVariantType` / `ButtonHTMLType` /
`ButtonIconPlacement` / `ButtonLoading` / `ButtonSemantic{ClassNames,Styles,Type}` / `ButtonSlot`

工具导出：`genButtonStyle(prefixCls)`、`prepareComponentToken(token)`。

## 4. 七条最容易写错的判据（都已被测试钉住）

### 4.1 `color` / `variant` 的六层回退（`Button.tsx:181-211`）

```
1. color && variant            → [color, variant]
2. type || danger              → ButtonTypeMap[type]；danger 时 color 换成 'danger'
3. variant === 'solid'         → ['primary', 'solid']
4. contextColor && contextVariant → 用 context
5. contextVariant === 'solid'  → ['primary', 'solid']
6. 兜底                         → ['default', 'outlined']
```

⚠️ 第 1 层要 **两个都有**才成立。只给 `variant="filled"` 会一路落到第 6 层
（⇒ 不是无边框变体、也不参与 `ghost` 告警）。这条在
`__tests__/index.test.ts` 的「只有 `variant="link"` **不**告警」里钉住。

### 4.2 `ghost` 把 `solid` 退化成 `outlined`（`:213-218`）

不是「加个类了事」—— `mergedVariant` 本身变了。所以 `-variant-*` 类名会跟着变。

### 4.3 `-dangerous` 与 `-color-dangerous` 是两件事（`:220-221, :378, :380`）

- `-dangerous` 用**原始 `danger` prop**
- `-color-dangerous` 里 `danger` 被改写成 `dangerous`（`mergedColorText`）

`color="danger"` 而不传 `danger` prop ⇒ 只有 `-color-dangerous`，**没有** `-dangerous`。

### 4.4 `loading` 的 `delay` 语义（`:100-114, 234-236, 261-267`）

```
布尔形态：loading = !!loading, delay = 0
对象形态：delay = isNumber(delay) ? delay : 0;  loading = delay <= 0
```

- `delay > 0` ⇒ **到点才置 true**（防连点），且**不会自动复位**
  （变 false 只靠 `loading` prop 变回）。
- 中途把 `loading` 收回去 ⇒ 已挂的定时器必须清掉，否则会延迟点亮。

### 4.5 两个中文字必须 `onMounted` **和** `onUpdated` 都检测（D6）

上游那个 effect **故意不写依赖数组**（`:283` 有注释），等价于每次渲染后都跑。
只在 `onMounted` 跑一次会漏掉「挂载时合法、之后更新成两字」的情形。

⚠️ 判据是 `textContent` **恰好**两个汉字（`/^[\u4E00-\u9FA5]{2}$/`），不是「≥2」；
`text`/`link` 变体不插（`isUnBorderedButtonVariant`）。

### 4.6 `<a>` 与 `<button>` 的 disabled 表达**不对称**（`:449-465` vs `:467-481`）

| 分支 | 表现 |
|---|---|
| `<button>`（无 `href`） | 原生 `disabled` 属性 |
| `<a>`（有 `href`） | 移除 `href` + `tabindex="-1"` + `aria-disabled` + `-disabled` 类名 |

`<a>` 没有原生 `disabled`，所以只能靠组合表达。这是上游真实行为，不是笔误。

### 4.7 点击拦截（`:293-308`）

`innerLoading || mergedDisabled` 时 `e.preventDefault()` 且**不**触发 `click`。
两个分支（`<button>` 与 `<a>`）都拦 —— `<a>` 分支没有原生 `disabled`，
拦截是它唯一的防线。

⚠️ `htmlType` 的默认值是 `'button'`。少了它，表单里的按钮会默认变成 submit，
点一下就提交整个表单 —— 这是 antd 显式处理过的（`:63` 的注释）。

## 5. 样式

零运行时（`H6`）。`style/index.ts` 是**表驱动生成**：color(16) × variant(6) + ghost(16×3)
的组合选择器靠手写必然出错，所以全部由表展开。

### 5.1 一处必须展开的东西：`genCssVar` 声明的组件级变量（PITFALLS 127）

antd 用 `genCssVar` 在规则内部声明 `--ant-btn-*` 做中间变量。**不能照抄**：
`tests/build/run.mjs` 的 B7 只认 `packages/theme/dist/tokens.css` 的 `:root` 块，
组件内局部声明的自定义属性它看不到 ⇒ 写错不会报错、只会静默失效。

展开成组合选择器后，**层叠变成"顺序即契约"**：

- 同特异性的两条只能靠声明顺序决胜 ⇒ `disabled` 必须排在 color×variant 之后；
- `ghost` 的 `bg-*` 覆盖**必须带进组合选择器**
  （`.btn-color-x.btn-variant-y.btn-background-ghost`）。写成单独的
  `.btn-background-ghost:hover`（0,4,0）会被组合的 hover 规则（0,5,0）压过，
  **幽灵按钮的背景会变回实色**。

### 5.2 Component Token

`prepareComponentToken` 返回 **61 个键**，与 antd 6.6.4 的
`button/style/token.js:20-82` **逐键一致**，只缺 `solidTextColor`（见 §7 缺口 1）。
`__tests__/theme.test.ts` 用一条 `toEqual(ANTD_TOKEN_KEYS)` 把它钉住 ——
多一个少一个都红。

### 5.3 ⚠️ 不能直接运行时覆盖 Component Token（全库缺口）

理由与 Divider 相同：零运行时管线里 `tokens.css` 只声明 Alias 层变量，
没有组件层变量可覆盖。等 `packages/theme` 把每个组件的
`prepareComponentToken(getDesignToken())` 结果也声明成变量后才可覆盖。
临时手段：`styles.root.*`。

## 6. 测试

| 层 | 文件 | 用例数 | 覆盖 |
|---|---|---|---|
| L1+L2 | `__tests__/index.test.ts` | 86 | 回退表、loading delay、两字中文、点击拦截、告警 |
| L3 | `__tests__/type.test-d.ts` | 13 | 5 个枚举 + Props + 语义化（含 14 条负例） |
| L4 | `__tests__/semantic.test.ts` | 66 | 与 React 基线逐节点比对（65 条 + 1 条 D6 豁免） |
| L5 | `__tests__/a11y.test.ts` | 27 | axe（12 个 demo）+ 两分支 disabled + 焦点 |
| L1/L2 主题 | `__tests__/theme.test.ts` | 17 | 四态渲染 + Component Token 逐键 |
| — | `__tests__/demo.test.ts` | 14 | 12 个 demo 渲染/更新/卸载无告警 |
| — | `__tests__/style.test.ts` | 5 | CSS 静态一致性（变量存在性 / 无 undefined / H9） |

### 6.1 L4 的基线来源

`tests/compat/baselines/button.dom.json`，由 `tests/compat/baseline/button.mjs`
用 `react-dom/server.renderToStaticMarkup` 渲染 antd 的 `Button` 产出 —— 机械 oracle。
生成脚本的文件头写明了**两处刻意不进基线**的东西及理由：

1. 布尔 `loading` 的内置加载图标本体（图标 DOM 由 `icons.dom.json` 的 848 个用例钉住）
2. 两个中文字的整条链路（SSR 不跑 effect，基线里永远没有 `-two-chinese-chars`）

### 6.2 一条夹具差异（不是组件差异）

`prefix-cls:no-props`：antd 默认 `ant`、我们默认 `apollo`（裁决 `prefix-cls-default` = A）。
在 `allow` 里登记为 D6，且用 `toEqual` 断言差异**恰好只有这一条**。

## 7. 有意差异 / 已知缺口

| # | 差异 | 分类 | 说明 |
|---|---|---|---|
| D1 | 语义化 `classNames` / `styles` **不支持函数式** | INTENDED | 裁决 `empty-semantic-fn` = B；与 divider/empty/space/spin 一致。类型层有负例钉住 |
| D2 | Wave 涟漪用 CSS 而非 React 组件 | INTENDED | 不得引入 React（H1）；形态差异不影响 DOM 契约 |
| D3 | `ref` 暴露 `{ nativeElement }` | INTENDED | 全库统一形态 |
| D4 | `icon` 支持 prop 与插槽两种 | INTENDED | 与 divider/empty 一致 |
| D5 | 无 `Button.Group`（上游已废弃） | INTENDED | 指向 `Space.Compact`；`groupSize` 因此不参与 size 回退 |
| D6 | 默认 prefixCls 是 `apollo` 而非 `ant` | INTENDED | 允许 ConfigProvider 覆盖 |
| D7 | 两个中文字用 `::first-letter` 的 letter-spacing，不是拼空格 | INTENDED | 视觉等价；DOM 文本不同（`确 定` vs `确定`）。由 L6 判定像素 |

### 7.1 缺口（没有偷偷补）

1. **`solidTextColor` 缺失**。antd 用 color-picker 的
   `isBright(new AggregationColor(token.colorBgSolid), '#fff')` 算它
   （`button/style/token.js:28`），本仓库没有等价能力。
   亮色主题下两者相同，**暗色主题会分叉**。`theme.test.ts` 有一条断言钉住「就是缺」。
2. **13 个预设阴影色不随 dark 主题自适应**。它们由 `getAlphaColor` 迭代求解，
   CSS 里没有等价写法 ⇒ 构建期算出并内联成 `rgba(...)`。
3. **`loading` 没有 `aria-busy` / `aria-live`**（上游同样没有）。
   屏幕阅读器不会播报「正在加载」。我们逐字对齐 —— 单方面加属性会让 L4 契约红。
4. **icon-only 按钮没有默认可访问名**。使用方必须自己传 `aria-label`；
   在组件里猜一个（比如读图标名）会产出与界面语言不一致的播报，比不给更糟。

### 7.2 上游观察（我们**没有**修）

- `<a>` 分支恒输出 `tabindex`（`0` / `-1`）。原生 `<a href>` 本就可聚焦，
  显式写 `0` 是上游行为。

## 8. 给后续组件的话

1. **`useSize` 的回调必须接住 `ctxSize`**。`useSize(() => props.size ?? compactSize)`
   会让 ConfigProvider 的 `componentSize` **静默失效** —— DOM 全对，只是尺寸永远默认。
   正确写法：`useSize((ctxSize) => props.size ?? compactSize ?? ctxSize)`。
2. **模板里没有「渲染一个 `VNodeChild` 变量」的语法**。`{{ vnode }}` 走 `toDisplayString`
   会把节点变成 `[object Object]`；`<component :is>` 只接受组件或标签名。
   用 `NodeRenderer`（目前在 `empty/components/NodeRenderer.ts`，是平台原语，应上移到 `_internal/`）。
3. **不要在渲染函数之外调用插槽**。`computed(() => slots.default())` 若在渲染期
   没被读过就求值，会触发 `[Vue warn]: Slot "default" invoked outside of the render function`。
   让模板里的某个表达式（如 `v-if`）先读一遍即可靠 `computed` 缓存避开。
4. **Boolean prop 的 `undefined` 默认值不是冗余的**。`disabled` / `ghost` / `danger` /
   `block` 的合并判据是 `??`，若被 Vue 转成 `false`，ConfigProvider 的对应配置永久失效
   （PITFALLS 46）。

## 9. 已知缺口

见 §7.1。另：`compactSize`（来自 `space/Compact`）虽已接入，但没有专门的用例覆盖
（由 space 的测试覆盖），`registry` 的 `layerNotes` 里登记了这一点。
