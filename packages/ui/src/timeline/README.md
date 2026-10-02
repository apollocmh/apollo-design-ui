# Timeline 实现说明

> 规则 R1：本文件记录「仓库文档里没有的」—— 差异、选型理由、Token 落点、已知缺口。

## 1. 对应 antd 组件

- antd 6.6.4 · `es/timeline/`（只读参照，H2）
- 规模 **529 行产物 / 10 文件**；Component Token **6 个**（产物 css-var 块只有 **4 条**）
- 分析产物：`docs/analysis/timeline.md`（G1，先于实现存在）

| 上游文件 | 行数 | 本仓 | 形态 |
|---|---|---|---|
| `Timeline.tsx` | 303 | `Timeline.ts` | **`.ts` 渲染函数**（见 §3） |
| `useItems.tsx` | 99 | `use-items.ts` | 纯函数 |
| `index.tsx` | 5 | `index.ts` | 导出 + `Timeline.Item`（**空壳**） |
| `style/index.ts` | 275 | `style/index.ts` + `style/horizontal.ts` + `style/context.ts` | **38 条规则** |

**产物交叉验证**（可复现）：

```sh
node tests/visual/debug/extract-timeline-css.mjs > /tmp/timeline-antd.css   # 44 条含 ant-timeline
```

本仓产出 **38 条**；差掉的 6 条 = `resetComponent` 的 4 条 `box-sizing` 块
（`BASE_CSS` 已覆盖）+ 1 条 cssinjs 缓存标记 + 1 条**声明块**（本仓内联进根规则）。

### 🚨 本组件是 `Steps` 的**薄壳**（没有自己的 DOM）

`Timeline.tsx:270-294` 的渲染体只有一个 `<Steps type="dot" />` + 两个 Context +
一层 classNames 映射 ⇒ 「时间轴」的观感全部来自 **Steps 的 DOM + Timeline 的样式覆盖**。
所以：

- 产物里**同时**有 `-steps-*` 与 `-timeline-*` 两组类名（**这是真实契约**，不是噪音）；
- 根是 **`<ol>`**、项是 **`<li>`**（由 `InternalContext` 覆盖 Steps 的 `div`）；
- Timeline 的样式表大量**覆盖 Steps 的内部变量**（`--{p}-cmp-steps-*`）。

## 2. 与 antd 的行为差异清单

<!-- 同步到 COMPATIBILITY.md §9；分类只能是 BUG / INTENDED / PLATFORM / UPSTREAM（AGENTS.md §4.3） -->

| # | 差异 | 分类 |
|---|---|---|
| 1 | 🚨 **`children` 形态不支持**：上游是 `toArray(children).map(ele => ({...ele.props}))` —— 读的是 **React 元素的 props**。Vue 的插槽给的是 **vnode**，`vnode.props` 语义不同（class/style 被归一、事件名被转换）⇒ 本仓**只支持 `items`**。⚠️ 可见后果只有「`Timeline.Item` 的废弃告警仍会发」（它上游本就是**空壳** `(() => {})`，不渲染任何东西）。 | PLATFORM |
| 2 | `Timeline` 上游**没有 ref**（没有自己的根 DOM）。本仓按「可观测的根元素」定义：`ref.nativeElement` = **`Steps` 的根元素**，类型是 `HTMLElement \| null`（`ol` / `div` 都可能）—— **不是** `HTMLDivElement`。 | PLATFORM |
| 3 | 🚨 **`--{p}-cmp-steps-*` 这些内部变量的前缀是固定 `apollo`**，不随类前缀变。判据：`genStepsStyle(prefixCls)` **只重命名 `.apollo-steps` 选择器**（`cssText.split('.apollo-steps').join('.' + prefixCls + '-steps')`），**不重命名变量名** ⇒ 两个前缀的产物里它们都是 `--apollo-`。⚠️ 写成 `--${p}-cmp-steps-*` 会让 `ant` 变体引用到**不存在**的 `--ant-cmp-steps-*` ⇒ `var()` 全失效 + B7 报未声明变量（实测 3 个）。 | PLATFORM |
| 4 | 🚨 **`variant` 的默认值是 `'outlined'`**（上游解构默认），**不是** `Steps` 自己的 `'filled'` ⇒ 必须显式声明，否则整份 Steps 样式分叉。 | INTENDED（跟随上游） |
| 5 | **用户的 `style` 走 `styles.root` 语义槽**（上游 `useSemanticRootStyle(style)`），**不是** `style` prop —— 直接塞 `style` 会被 Steps 的 `rootStyle` 整条覆盖。 | PLATFORM |
| 6 | **语义化槽是 `Steps` 的十槽去掉 `itemSubtitle`**（上游 `Omit<StepsSemanticType, 'itemSubtitle'>`）；且 `classNames` 是**拼接**（`clsx`）不是替换。 | 与上游一致 |
| 7 | 🚨 **`classNames` / `styles` 的 prop 类型必须收 `[Object, Function]`** —— 两者都支持**函数形态**（`(info) => styles`）。只写 `Object` 会触发 `Invalid prop: type check failed` 的 Vue 告警（demo 冒烟抓到）。 | PLATFORM |
| 8 | `devUseWarning` 上游是**三参** `(valid, 'deprecated', msg)`，本仓是**两参** `(valid, message)` + `.deprecated(valid, oldProp, newProp, message?)` ⇒ 调用点做了映射。 | PLATFORM |
| 9 | 本仓无 `hashId`（D2）；`-css-var` 直接拼（D5 家族）。 | PLATFORM |
| 10 | **`Timeline.Item` 是空壳**（上游同判）—— 只为「用了就发废弃告警」而存在。 | 与上游一致 |

## 3. `.vue` / `.ts` 选择

**`Timeline.ts` 是 `.ts` 渲染函数**（`use-items.ts` 是纯函数，其余是样式）。

理由（`COMPONENT-RULES.md` §2 **条件 1：纯渲染函数型内部件**）：
`Timeline` **没有自己的 DOM** ⇒ `.vue` 模板的价值为零；且「给组件传一个 classNames
映射对象 + 两个 Context」在模板里表达不了。与 `card` 的 `NodeRenderer`、`badge` 的
`ScrollNumber` 同判。

## 4. Component Token 清单

<!-- registry 数据：token 数 = 6 -->

**6 个**，但产物 css-var 块只有 **4 条**声明：

| token | 默认值来源 | 解析值 | 是否进 css-var 块 |
|---|---|---|---|
| `tailColor` | `colorSplit` | `rgba(5,5,5,0.06)` | ✅ |
| `tailWidth` | `lineWidthBold` | `2px` | ✅ |
| `dotBorderWidth` | `lineWidthBold` | `2px` | ✅ |
| `itemPaddingBottom` | `padding * 1.25` | `20px` | ✅ |
| `dotSize` | **`undefined`** | — | ❌ **刻意不声明** |
| `dotBg` | **`undefined`** | — | ❌ **刻意不声明** |

🚨 **`dotSize` / `dotBg` 为什么刻意不声明**：上游 `prepareComponentToken` 显式返回
`undefined`（注释是「should be `undefined` to create css var」）⇒ cssinjs 跳过这两个声明。
而规则里**确实引用**它们，靠的是**两层回退链**：

```css
.ant-timeline .ant-timeline-item{
  --ant-cmp-steps-icon-dot-size-custom:var(--ant-timeline-dot-size);
  --ant-cmp-steps-icon-size:var(--ant-cmp-steps-icon-dot-size-custom,
                               var(--ant-cmp-steps-icon-dot-size-origin));
}
```

未声明 ⇒ `-custom` 无效 ⇒ 回退到 Steps 的 `-origin`；用户覆盖后才生效。
**补一条声明会改变行为**（`-custom` 恒有效 ⇒ 永远盖掉 origin）。

⚠️ 这两个变量已登记进 `tests/build/run.mjs` 的 **`UPSTREAM_UNDECLARED_TOKEN_VARS`**
（B7 的第三类豁免，**可自证**：不许被声明 + 每次 `var()` 必须落在「`--某自定义属性:` 的右侧」）。

**3 个 `mergeToken` 派生**（用户**不可**覆盖）：`itemHeadSize: 10` /
`customHeadPaddingVertical: paddingXXS` / `paddingInlineEnd: 2`。

## 5. 已知缺口

<!-- 未支持的能力 + 落点（范本见 divider/README.md §7） -->

1. **1 个 antd demo 未移植**（`demo.test.ts` 的 `expectCount: 13` 钉住的是**已落地**的那批）：
   - `component-token`（`theme.components.Timeline` 调试）—— 零运行时架构下 token 是构建期
     产物，已由 `theme.test.ts` 覆盖。**全仓 10+ 组件同判**。
   - （`_semantic` / `_semantic_items` 是上游的**内部**演示件，不在用户文档侧栏。）
2. **`children` 形态不支持**（见 §2 第 1 条）—— 只支持 `items`。
3. **`ConfigProvider` 的 `TimelineConfig` 类型未提升**：上游走 (B) 通道
   （`components?: Record<string, ComponentConfigLike>`）—— **运行时可用，只是类型宽**。
   ⚠️ 与 anchor / masonry / card / avatar / list 一致。
4. **`Timeline` 没有自己的根 DOM** ⇒ `ref.nativeElement` 取的是 `Steps` 的根
   （见 §2 第 2 条）。若将来 Steps 换了根标签，这里会跟着变。
5. **样式表与 `Steps` 的内部变量强耦合**（`--apollo-cmp-steps-*`，见 §2 第 3 条）——
   `Steps` 改了那些变量的语义，Timeline 的观感会跟着变（**这是上游的架构，不是本仓的选择**）。
6. **`COMPATIBILITY.md` §9.2 的双轨漂移**：最近收口的 8 个组件
   （card / masonry / anchor / breadcrumb / date-picker / avatar / list / timeline）的差异
   都只写在各自的 `README §2`，未登记进 §9.2（最后一号停在 **D118**）。
   若要让 C24 名副其实，需要一次**统一补登记**（跨组件的独立工作）。

## 6. 本轮实测结果（G4–G10）

| 层 | 命令 | 结果 |
|---|---|---|
| L1/L2 | `vitest run --project unit …/timeline/__tests__/index.test.ts` | **19/19** |
| L3 | `--project types …/type.test-d.ts` | **24/24**，`Type Errors no errors` |
| L4 | `--project dom-contract …/semantic.test.ts` | **28/28**（2 类已登记豁免） |
| L5 | `--project a11y …/a11y.test.ts` | **15/15**（axe 10 组 0 violation） |
| L6 | `run.mjs --component timeline` | **36/36 `exact`（0.000%）**，基线自检 **0 组同哈希** |
| L7 | `--project theme …/theme.test.ts` | **21/21**（四态渲染 13 demo + token 契约；含「与 Steps 的跨包耦合面」） |
| demo | `--project unit …/demo.test.ts` | **15/15**（13 demo + 计数 + 告警豁免自证） |

L7 里值得单说的三条：① `dotSize` / `dotBg` **被引用但刻意不声明**（断言「不声明」本身是判据）；
② 引用的每个 `--apollo-cmp-steps-*` **都在 steps 产物里有落点**（否则 `var()` 全失效）；
③ `ant` 变体里 Steps 的变量引用**仍是 `--apollo-cmp-steps-*`**（前缀不跟前缀走，310 的防线）。

**本轮抓到的真 bug（5 个）**：

1. 🚨 **`class` 被 `Steps` 主动剥掉**（`const { class: _attrsClass, ...restAttrs } = attrs`）
   ⇒ 传 `class` **静默丢弃**，根上根本没有 `apollo-timeline` 类（PITFALLS 309）。
2. 🚨 **`--apollo-cmp-steps-*` 的前缀是固定 `apollo`**（见 §2 第 3 条，PITFALLS 310）。
3. 🚨 **`variant` 默认值漏了**（见 §2 第 4 条）⇒ 不传时落 `-filled`，整份 Steps 样式分叉。
4. 🚨 **`classNames` 用了替换而不是合并 + 用户 `style` 走错通道**（见 §2 第 5/6 条）
   ⇒ L4 一次抓出 9 条差异。
5. 🚨 **`classNames` / `styles` 的 prop 类型漏了 `Function`**（见 §2 第 7 条）。

**一处流程教训（本会话第三次）**：又一次带着 `lint:types` 红灯提交（PITFALLS 311）。
另有一次**跑 L6 前忘了重建 `ui`** ⇒ 0/36 全红 + 误导性的 `size-mismatch`（PITFALLS 312）。
