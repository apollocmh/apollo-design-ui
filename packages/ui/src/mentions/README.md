# Mentions 实现说明

> 规则 R1：本文件必须记录（G11 前补齐）。

## 1. 对应 antd 组件

- antd 6.6.4 · `es/mentions/`（只读参照，H2）
- 契约全文：`docs/analysis/mentions.md`（G1 产物，含**实测 DOM/CSS dump** 的复现命令）
- **依赖面：无 foundation 缺口**。7 个 foundation 包全部 `completed`；引擎的输入控件
  复用 `input/engine/{BaseInput,TextArea}.ts`、浮层复用 `_internal/trigger.ts`。
- **引擎裁决**：`@rc-component/mentions` = `in-ui` ⇒ `mentions/engine/`
  （`registry/dependencies.json` 的 `pkg: "@rc-component/mentions"` 一条）。

### 已落地的文件

```
mentions/
├── Mentions.ts              # antd 包装层（config/form/status/variant/语义槽/loading/notFound）
├── PurePanel.ts             # `Mentions._InternalPanelDoNotUseOrYouWillBeFired`
├── interface.ts             # G2 产物（逐字段对齐上游 Omit 链）
├── index.ts                 # 导出 + `Mentions.Option` / `Mentions.getMentions`
├── engine/
│   ├── Mentions.ts          # rc-mentions 的 `Mentions.js`（外层 BaseInput + 内层状态机）
│   ├── KeywordTrigger.ts    # `KeywordTrigger.js`（4 个 builtinPlacements + placement 推导）
│   ├── DropdownMenu.ts      # `DropdownMenu.js`（自建最小菜单，见 §3）
│   ├── util.ts              # `util.js`（6 个纯函数，L1 逐条钉死）
│   ├── use-effect-state.ts  # `hooks/useEffectState.js`
│   └── context.ts           # `MentionsContext` + `UnstableContext`
└── style/{token,index}.ts   # G3/G4 产物
```

## 2. 与 antd 的行为差异清单

<!-- 同步到 COMPATIBILITY.md §9；分类只能是 BUG / INTENDED / PLATFORM / UPSTREAM（AGENTS.md §4.3） -->

| # | 差异 | 分类 | 依据 |
|---|---|---|---|
| D1 | 默认前缀 `apollo-mentions`（antd `ant-mentions`） | INTENDED | 裁决 `prefix-cls-default` = A |
| D2 | 无 cssinjs 的 hash 类（`css-dev-only-do-not-override-*`） | INTENDED | 零运行时架构（D5 家族） |
| D3 | `genCssVar(antCls,'cmp-mentions')` 无对应物 ⇒ 手写 `--{p}-cmp-mentions-*` | PLATFORM | `splitter` 先例 |
| D4 | `useCSSVarCls` 无对应 hook ⇒ 根类名直接拼 `${prefixCls}-css-var` | PLATFORM | `rate` 先例 |
| D5 | `ContextIsolator`（`usePopupRender` 的包装）本仓无 ⇒ 直接透传 | PLATFORM | D36 / D103；popup 里没有读 Form status 的子件 |
| D6 | **textarea 的类名逐字保留 `rc-textarea`**（上游不给 TextArea 传 prefixCls，走 rc-input 的默认值） | UPSTREAM（跟随其默认） | 实测；D43 同判（固定常量，不随 prefixCls 变） |
| D7 | `suffix`/`allowClear` 存在时根 div 消失、`-disabled/-focused/-rtl` 三个类**不渲染** | UPSTREAM（怪癖，逐字保留） | 实测 DOM（analysis §3.1）；不要「修好」 |
| D8 | `DropdownMenu` **自建**（不复用本仓 `menu/Menu`） | PLATFORM | 三条硬证据见 `engine/DropdownMenu.ts` 文件头（`-light` / per-item hover / `findItem`） |
| D9 | `data-menu-id` 的 uuid 段用 `apollo-mentions-menu-{n}`（上游 `rc-menu-uuid-{useId}`） | PLATFORM | L4 的 dom-contract 归一为 `{iN}` token（对称） |
| D10 | 值同步走**原生 `input` 事件**（额外接 `onInput`），不只 `onChange` | PLATFORM | `docs/foundation/rc-util-contract.md` §6.1：React 的 `onChange` 在文本输入上等价 `input`，Vue 的是原生 `change` |
| D11 | `options` / `value` / `class` **显式**在两层之间传递（上游靠 `BaseInput` 的 `cloneElement` 注入） | PLATFORM | `engine/Mentions.ts` 内注释（本仓 `BaseInput` 只对原生元素子节点做合并） |
| D12 | `<Mentions.Option>` 的 children 在**外层 render** 里归一成 `options` 数据 | PLATFORM | Vue 的插槽只能在渲染期求值（在 `computed` 里读会告警） |
| D13 | 文本框没有可访问名（axe 的 `label` 规则） | UPSTREAM | antd 自测 `accessibilityDemoTest('mentions', { disabledRules: ['label'] })`；R13 |

## 3. `.vue` / `.ts` 选择

- **包装层 `Mentions.ts` / `PurePanel.ts`**：`.ts` + 渲染函数 —— 依据
  `COMPONENT-RULES.md` §2 的**条件 1（纯渲染函数型内部件）**的同类判据：
  包装层的全部工作是「按固定顺序合并 8 个来源的类名 + 把 props 重排后交给引擎」，
  模板表达不了「三源定序合并」，`v-bind` 无类型对象会丢掉绑定检查。上游也是 JSX。
- **引擎 5 个文件**：`.ts` + 渲染函数。`engine/Mentions.ts` 的渲染树里有
  「数组 + 条件节点 + Portal」三件事，模板写不出等价物；`DropdownMenu` 需要按
  `data-menu-id` 查 DOM 并 `scrollIntoView`。
- **`DropdownMenu` 为什么自建**（三条硬证据，实测）：
  1. 本仓 `menu/Menu` 的 `theme` 默认 `'light'`，而 rc-mentions **不传 `theme`**
     ⇒ 复用会多一个 `-light` 类，DOM 契约直接偏；
  2. rc-mentions 给**每个** `MenuItem` 挂 `onMouseEnter` 更新 `activeIndex`，
     本仓 `Menu` 的 `items` 不支持逐项事件；
  3. rc-mentions 用 `menuRef.current.findItem({key}).scrollIntoView(...)`，
     本仓 `Menu` 没有这个 imperative 句柄 —— 要加就得改**另一个组件**的公开面。

## 4. Component Token 清单

registry 数据：`tokenCount = 3`（`zIndexPopup` / `dropdownHeight` / `controlItemWidth`）。
实际声明 **22 条**（`style/token.ts` 的 `prepareComponentToken`）：

- **3 个新增常量**：`dropdownHeight: 250px` / `controlItemWidth: 100px` / `zIndexPopup: 1050`（= `zIndexPopupBase + 50`）；
- **1 个算式派生（用户不可覆盖）**：`itemPaddingVertical = (controlHeight - fontHeight) / 2` = `5px`；
- **18 个继承面**（antd 上游是各组件各调一次 `initComponentToken` ⇒ 本仓按组件隔离同构复刻）：
  `lineWidthFocus` / `paddingBlock{,SM,LG}` / `paddingInline{,SM,LG}` / `addonBg` /
  `activeBorderColor` / `hoverBorderColor` / `activeShadow` / `errorActiveShadow` /
  `warningActiveShadow` / `hoverBg` / `activeBg` / `inputFontSize{,LG,SM}`。

⚠️ `initInputToken` 的 `inputAffixPadding` **不在**声明块里（antd 在 style 函数里用
`mergeToken` 注入，不进 component token），且 mentions 的规则一条都不引用它。

## 5. 已知缺口

1. **文本框没有可访问名**（与 antd 逐字一致）。给名字是使用方的责任：
   `placeholder` / `aria-label` / `Form.Item` 的 label 三者任一。
   `__tests__/a11y.test.ts` 对 9 个没有名字的 demo 逐条豁免 `label` 并**断言豁免真的命中**。
2. **`Mentions.Option` 已 deprecated**（上游同样）：`children` 非空时打
   `Warning: [apollo: Mentions] 'Mentions.Option' is deprecated. Please use 'options' instead.`。
3. **`getPopupContainer` 的签名**：上游是 `() => HTMLElement`（**不收触发元素**），
   本仓 `Trigger` 收一个参数 ⇒ 引擎层做一层适配（`engine/KeywordTrigger.ts`）。
4. **`.vue` 的 demo 是「等价替换」**（见下表），不产生告警仍是硬约束（`demo.test.ts` 钉住）。

### 5.1 demo 级替换（G11）

| demo | antd 用的东西 | 本仓替换 | 理由 |
|---|---|---|---|
| `allowClear` | `@ant-design/icons` 的 `CloseSquareFilled` | 等价的字符 `'✖'` | 图标包在视觉层用例里解析不到（用例只链接 theme+ui） |
| `async` | `antd-style` 的 `createStyles` | 内联 `style` 对象 | 本仓无 `antd-style` |
| `async` | `lodash/debounce` | `setTimeout`（120ms） | 本仓无 `lodash` |
| `async` | GitHub 真实头像（外网图片） | 本地 `data:image/svg+xml` | 外网图片会污染视觉基线 |
| `async` | JSX fragment 作 `label` | 渲染函数 `h(...)` | `label` 收 `VNodeChild`，对象不渲染 |
| `popupRender` | `theme.useToken()` | 等值字面量（`8px 12px` / `600` / `rgba(0,0,0,0.45)`） | 与默认主题的解析值一致 |
| `style-class` | `antd-style` 的 `createStyles` | 静态类名 + `<style scoped>` | 同上 |
| `form` | `Form.useForm()` | `useForm()` + `:form` | 本仓 Form 的既有 API（`form/demo/basic.vue`） |
| `size` / `variant` | `Flex vertical gap` | 同（本仓 Flex 支持） | — |
| `_semantic` | `UnstableContext` + `SemanticPreview` | **不落 demo** | 文档站预览件；本仓按惯例不搬（`UnstableContext` 仍导出，供需要时用） |

## 6. 收口时补记的三个真 bug（都**只有实测**才抓得到）

1. 🚨 **`RcTextArea` 没声明 `onKeyUp`** ⇒ Vue 把 `onKeyUp` hyphenate 成 `key-up`
   ⇒ 监听器挂在一个永不触发的事件上 ⇒ **候选面板永远不出现，且没有任何报错**。
   （`input/engine/TextArea.ts` 已补 prop + `onKeyup` 接线；analysis §4.3 有判据。）
2. 🚨 **`input/engine/BaseInput.ts` 的 clone 丢掉了子节点的 `children`**
   ⇒ `InternalMentions` 的 `slots.default` 为空 ⇒ `Mentions.Option` 形式的候选项
   全部消失。rc 的 `cloneElement` 保留 children；本仓补 `h(type, props, inner.children)`。
3. 🚨 **`input/engine/TextArea.ts` 缺 `${prefixCls}-disabled`**
   （rc `ResizableTextArea.js` 有）—— `input.dom.json` 里没有 disabled 的 textarea 用例，
   此前无人踩到。mentions 的 disabled 形态首次暴露。
