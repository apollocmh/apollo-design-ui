# Card 实现说明

> 规则 R1：本文件必须记录（G11 前补齐）。

## 1. 对应 antd 组件

- antd 6.6.4 · `es/card/`（只读参照，H2）
- 规模 **1018 行源码 / 676 行产物 / 10 文件**；Component Token **13 个** + **4 个 `mergeToken` 派生**
- 复合组件：`Card.Grid`（`CardGrid`）/ `Card.Meta`（`CardMeta`），**两个都不是 deprecated**

| 上游文件 | 本仓 | 形态 |
|---|---|---|
| `Card.tsx`（319） | `Card.vue` | `.vue` SFC（见 §3） |
| `CardMeta.tsx`（136） | `CardMeta.vue` | `.vue` SFC |
| `CardGrid.tsx`（38） | `CardGrid.vue` | `.vue` SFC |
| `style/index.ts`（502） | `style/index.ts` | `genCardStyle` + `genTokenDecls`（**55 条规则**） |

**产物交叉验证**（可复现）：

```sh
node tests/visual/debug/extract-card-css.mjs > /tmp/card-antd.css   # 60 条 ant-card 规则
```

本仓产出 **55 条**，差掉的 5 条 = `resetComponent` 的 4 条 `box-sizing` 重复块（`BASE_CSS` 已覆盖）
+ 1 个 `.css-var-*` 声明块（其 13 条声明由 `genTokenDecls` 内联进根规则）。

## 2. 与 antd 的行为差异清单

<!-- 同步到 COMPATIBILITY.md §9；分类只能是 BUG / INTENDED / PLATFORM / UPSTREAM（AGENTS.md §4.3） -->

| # | 差异 | 分类 |
|---|---|---|
| 1 | `Card` 的 `ref` 形状：上游是 `forwardRef<HTMLDivElement>`（ref 就是 DOM 元素本身），本仓按 `badge/Ribbon` 的既有约定统一成 `{ nativeElement }`（可空）。`Card.Grid` / `Card.Meta` 上游本来就是 `{ nativeElement }`。 | PLATFORM |
| 2 | 上游 `prepareComponentToken` 里的 `token.bodyPadding` / `token.headerPadding` **不在** antd 6 的 `AliasToken` 里（v4 遗留）⇒ 运行时恒 `undefined`，实际取值是 `paddingLG`。本仓**不引入**这两个死键，直接写 `token.paddingLG`（产物交叉验证：都是 `24px`）。 | PLATFORM |
| 3 | `loading` 的 body 是 `<Skeleton loading active paragraph={{rows:4}} title={false}>`。上游把 `children` 也传给了这个 Skeleton，但 Skeleton 的 `loading` **写死为 `true`** ⇒ `children` **永远不会被渲染**（`Skeleton.tsx:177`）。本仓**不传** —— DOM 完全相同，且省掉一次插槽调用。 | PLATFORM |
| 4 | `deprecated` 的「传了才告警」判据：上游是 `deprecatedName in props`（传 `undefined` 也算「传了」）。Vue 没有「键存在」这个概念 ⇒ 本仓用 `!== undefined`。唯一差异：`<Card :bordered="undefined">` 本仓不告警。 | PLATFORM |
| 5 | 插槽函数**按渲染缓存**（`getChildNodes()` + `onBeforeUpdate` 重置）：`childNodes` 同时供「`-contain-grid` 判定」与「body 内容」两处消费。上游 `useMemo([children])` 天然按渲染求值；Vue 的插槽函数**不允许**在 render 之外调用。 | PLATFORM |
| 6 | `title` / `extra` / `cover` / `actions` / children 都经 **`NodeRenderer`** 渲染：`.vue` 模板没有「渲染一个 VNode 变量」的语法（见 `empty/components/NodeRenderer.ts` 的实测结论）。 | PLATFORM |
| 7 | 本仓无 `hashId`（D2）；`-css-var` 与上游 `useCSSVarCls` 同名（D5）。 | PLATFORM |
| 8 | **两条「死选择器」照抄**（UPSTREAM quirk，产物里就长这样）：`.{p}-head-title > .{p}-typography`（上游把 Typography 的前缀写成了 `${componentCls}-typography`，应为 `.{p}-typography`）与 `a:not(.{p}-btn)`（Card 里没有 `-btn`）。改掉会让「与产物逐条对拍」出现无法解释的差异。 | UPSTREAM |
| 9 | 透传 `tabProps` 到内部 `Tabs` 时有一次 **`as unknown as TabsRuntimeProps`** 断言。原因：`TabsProps`（公开类型）与 `Tabs.vue` 的**运行时 prop 声明**在**回调参数类型**上系统性不一致（`Tabs.vue` 一律声明成 `(_key: string, _event: unknown) => any`、`renderTabBar` 的参数是 `Record<string, unknown>`、`locale` 是 `Record<string, unknown>`；而 `TabsProps` 那边是 `TabsEditEvent` / `TabsRenderTabBarProps` / `TabsLocale`）。函数参数**逆变** ⇒ 两组函数类型**双向都不可赋值**。**运行时是逐字段原样透传**，没有任何字段被转换或丢弃。 | PLATFORM |
| 10 | `tabSize` 需要一次 `as TabsProps['size']`：上游的类型面是 `SizeType`，本仓 `TabsProps['size']` 收窄为 `'small' \| 'default' \| 'large'`（tabs 只认 `-large` / `-small` 两个类名）。运行时行为与上游一致（`'medium'` 不落任何尺寸类名）。 | PLATFORM |

## 3. `.vue` / `.tsx` 选择

**`Card` / `CardMeta` / `CardGrid` 三个都是 `.vue` SFC。**

理由：三者的**渲染树形状是静态的**（head / cover / body / actions 四段 + 各自的固定层序），
动态的只是「每段渲不渲染」与「内容是什么」—— 那是 `v-if` 与 `NodeRenderer` 能直接表达的，
不属于 `COMPONENT-RULES.md` §2 的任何一条例外条件（`.ts` 渲染函数）。

对照：`breadcrumb` / `anchor` / `splitter` 用 `.ts` 是因为「根的孩子是异构的、由数据驱动混排」
（模板里渲染一个 `VNodeChild` 只能靠 `<component :is="() => vnode" />`，那会每次换组件类型 ⇒ 卸载重挂）。
Card 的**段**是固定的，不涉及这个问题。

## 4. Component Token 清单

<!-- registry 数据：token 数 = 13 -->

**13 个**，顺序与产物的 css-var 声明块**逐条一致**（`theme.test.ts` 逐键断言）：

| token | 默认值来源 | 消费点 |
|---|---|---|
| `headerBg` | 字面量 `'transparent'` | `.{p}-head` 的 `background` |
| `headerFontSize` | `fontSizeLG`（16） | `.{p}-head` 的 `font-size` |
| `headerFontSizeSM` | `fontSize`（14） | `.{p}-small > .{p}-head` |
| `headerHeight` | `fontSizeLG * lineHeightLG + padding * 2`（56） | `.{p}-head` 的 `min-height` |
| `headerHeightSM` | `fontSize * lineHeight + paddingXS * 2`（38） | `.{p}-small > .{p}-head` |
| `actionsBg` | `colorBgContainer` | `.{p}-actions` 的 `background` |
| `actionsLiMargin` | `` `${paddingSM}px 0` ``（`12px 0`） | `.{p}-actions > li` 的 `margin` |
| `tabsMarginBottom` | `-padding - lineWidth`（-17） | `.{p}-head .{p}-tabs-top` 的 `margin-bottom` |
| `extraColor` | `colorText` | `.{p}-extra` 的 `color` |
| `bodyPaddingSM` | 字面量 `12` | `.{p}-small > .{p}-body` 的 `padding` |
| `headerPaddingSM` | 字面量 `12` | `.{p}-small > .{p}-head` 的 `padding` |
| `bodyPadding` | `paddingLG`（24，见 §2 第 2 条） | `.{p}-body` / `-type-inner` 的 `padding` |
| `headerPadding` | `paddingLG`（24，同上） | `.{p}-head` / `-type-inner` 的 `padding` |

另有 **4 个 `mergeToken` 派生**（用户**不可**覆盖）—— 它们**不进** `ComponentToken`，产物里直接
展开成**全局** token 引用：

| 派生 | 来源 | 落点 |
|---|---|---|
| `cardShadow` | `boxShadowCard` | `var(--apollo-box-shadow-card)` |
| `cardHeadPadding` | `padding` | `var(--apollo-padding)` |
| `cardPaddingBase` | `paddingLG` | `var(--apollo-padding-lg)` |
| `cardActionsIconSize` | `fontSize` | `var(--apollo-font-size)` |

⚠️ 变量名与顺序见 `style/index.ts` 的 `genTokenDecls`；颜色是**构建期解析值**
（如 `rgba(0,0,0,0.88)`），不是 `var(--apollo-color-*)` —— 与 antd 的产物逐字一致。

## 5. 已知缺口

<!-- 未支持的能力 + 落点（范本见 divider/README.md §7） -->

1. **4 个 antd demo 未移植**（`demo.test.ts` 的 `expectCount: 10` 钉住的是**已落地**的那批）：
   - `style-class`（`antd-style` 的 `createStaticStyles`）—— 本仓没有 `antd-style`，
     语义化能力已由 L4 的 `class-names` / `styles` 用例与 L6 的 `semantic` 变体覆盖；
   - `component-token`（`theme.components.Card` 调试）—— 零运行时架构下 token 是构建期产物，
     已由 `theme.test.ts` 的「判定值逐条对拍 + 声明↔引用双向检查」覆盖；
   - `no-body-debug` / `button-alignment-debug`（上游标了 `debug`，不在文档正文里）；
   - `_semantic` / `_semantic_meta`（文档的「语义化 DOM」示意，`simplify` 专用）。
2. **`Avatar` 尚未落地**（registry `status: todo`）⇒ `loading` / `meta` 两个 demo 里的头像用
   **原生等价物**（`<span>` + 圆形色块 + 文字）。`Avatar` 落地后应替换回去。
3. **上游 demo 的外网图片换成了本地等价物**：`flexible-content` / `meta` 的封面用 **data URI**、
   头像用色块（外网图片会污染 L6 基线，与 `image` / `avatar` 的 demo 同判）。
4. **`ConfigProvider` 的 `CardConfig` / `CardMetaConfig` 类型未提升**：上游有
   `CardConfig = ComponentStyleConfig & Pick<CardProps,'classNames'|'styles'>`，
   本仓走 (B) 通道（`components?: Record<string, ComponentConfigLike>`）
   —— **运行时可用，只是类型宽**。⚠️ 与 `anchor` / `masonry` / `breadcrumb` 一致。
   🚨 注意**同一组件族有两个配置键**（`card` 与 `cardMeta`）—— `Card.Meta` 自己读后者。
5. **`NodeRenderer` 的落点**：目前住在 `empty/components/NodeRenderer.ts`（`button` / `result` 也这样
   import）。它是**平台原语**，应上移到 `ui/src/_internal/`；`spin/components/` 里的本地副本同理。
   本仓未做这次搬迁（会牵动 `empty` / `spin` / `button` / `result` 四个组件的门禁）。
6. **`TabsProps` 与 `Tabs.vue` 运行时声明的类型不一致**（见 §2 第 9 条）：
   建议后续把 `Tabs.vue` 的 `locale` / `renderTabBar` / `onTabClick` 等声明与 `TabsProps` 对齐，
   然后删掉 Card 里的 `as unknown as TabsRuntimeProps`。
7. **`Card.Grid` 的 vnode 身份是 `-contain-grid` 的唯一判据**：`Card.vue` 比的是
   `child.type === CardGrid`（`index.ts` 里 `withInstall` 包装的**同一个对象**）。
   用户自己包一层组件再传进来会**静默**失去 `-contain-grid` —— 与上游 `child.type === CardGrid` 同判。

8. **`TabsProps['size']` 比 antd 窄**：antd 的 Tabs 是 `size?: SizeType`（含 `'medium'` / `'middle'`），
   本仓收窄为 `'small' | 'default' | 'large'`（`tabs/__tests__/type.test-d.ts` 明确断言了这一点）。
   影响：antd 的 `tabs` demo 里的 `tabProps={{ size: 'medium' }}` **无法表达** ⇒ 本仓 demo 用
   `size: 'default'` —— 在本仓 Tabs 里它与 `'medium'` **渲染完全相同**（Tabs 只加 `-large` /
   `-small` 两个类名）。建议后续把 tabs 的 `size` 放宽到 `SizeType`。

## 6. 本轮实测结果（G5–G11）

| 层 | 命令 | 结果 |
|---|---|---|
| L1/L2 | `pnpm vitest run --project unit packages/ui/src/card/__tests__/index.test.ts` | **46/46** |
| L3 | `pnpm vitest run --project types packages/ui/src/card/__tests__/type.test-d.ts` | **28/28**，`Type Errors no errors` |
| L4 | `pnpm vitest run --project dom-contract packages/ui/src/card/__tests__/semantic.test.ts` | **51/51**（2 条已登记豁免：D1 / D114；8 个 tabs 用例继承 Tabs 的 U15） |
| L5 | `pnpm vitest run --project a11y packages/ui/src/card/__tests__/a11y.test.ts` | **15/15**（0 axe violation） |
| L6 | `node tests/visual/run.mjs --mode compare --component card` | **33/33 `exact`（0.000%）** |
| L7 | `pnpm vitest run --project theme packages/ui/src/card/__tests__/theme.test.ts` | **19/19** |
| demo | `pnpm vitest run --project unit packages/ui/src/card/__tests__/demo.test.ts` | **12/12**（10 demo + 计数 + 无告警） |

**全量 L6（`node tests/visual/run.mjs`，`--mode both`）**：**894/900**。
6 个失败全在 `menu/vertical__light__*`（3）与 `upload/basic__light__*`（3），**card 0 失败**。

⚠️ **已用证据排除「本轮改动导致」**：对这两个组件单独跑 `--mode compare`
（Vue vs **入库的 React 基线**）都是 **9/9 `exact`（0.000%）** ⇒ 当前 Vue 渲染与入库基线
**逐字节一致**，即本轮改动没有改变它们的输出；`both` 模式的差异出在**新渲染的 React 侧**
（环境漂移：Chrome / 字体），与 Card 无关。

⚠️ 本轮改动的共享文件只有 `ui/src/index.ts`（加 card 导出）、`ui/src/style/index.ts`
（`COMPONENT_STYLES` 加一行）、`tests/visual/matrix.mjs`（加 card 条目）、
`tests/visual/render/cases/shared.mjs`（**末尾追加** card 常量）—— 都动不到 menu / upload。
且 card 的 CSS 选择器**全部**以 `.apollo-card*` 开头（无裸选择器）⇒ 不可能泄漏到别的组件。

**本轮抓到的真 bug（2 个）**：

1. 🚨 **`tabsBind` 的键名写错**：受控分支写成 `{ defaultActiveTabKey: props.defaultActiveTabKey }`
   —— `defaultActiveTabKey` 是 **Card 的** prop 名，而 **Tabs 的** prop 名是 `defaultActiveKey`。
   后果：该键不是 Tabs 声明的 prop ⇒ 落进 `attrs`（Tabs 又把它 spread 到根元素）⇒
   **非受控页签静默失效**（永远停在第一个页签），DOM 上还多一个
   `defaultactivetabkey="b"` 属性。被 L1 的「非受控：`defaultActiveTabKey` 生效」用例抓到。
   ⚠️ 这类「名字长得像但属于不同组件」的错**不会**被类型检查发现（两个名字都合法）。
2. 🚨 **biome 把 `import Tabs` 改写成了 `import type Tabs`**（`lint/style/useImportType`）：
   biome **看不到模板里的用法**，而本组件里 `Tabs` 只出现在**类型位置**
   （`InstanceType<typeof Tabs>['$props']`）⇒ 它判定为 type-only import 并改写。
   后果：模板解析不到组件，**静默渲染成原生 `<tabs>` 标签**，只有 dev 一条
   `Failed to resolve component: Tabs` 的 warn（生产构建连 warn 都没有）。
   对策：`// biome-ignore lint/style/useImportType: ...`（已写进 `Card.vue`，附理由）。
