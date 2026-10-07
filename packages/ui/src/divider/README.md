# divider

> **层**：L3（`packages/ui`）｜ **优先级**：P0 ｜ **复杂度**：S ｜ **antd 版本**：6.6.4
>
> 契约来源：antd `es/divider/index.js` + `es/divider/style/index.js` + `es/_util/hooks/useOrientation.js`。
> 上游是**兼容性规格**，不是代码来源。

---

## 1. 职责

区隔内容的分割线。水平 / 垂直两种方向、可带标题、三种线型（solid / dashed / dotted）、
三档间距、语义化 `classNames` / `styles` 覆盖。

它是全仓**最小**的 P0（326 行构建产物 / 4 个文件 / **0 个 rc 依赖**），
所以被选为「组件侧流水线的第二块试金石」：它不依赖任何组件，只依赖两个叶子模块。

## 2. 文件布局

```
divider/
├── Divider.vue                 # 主组件（唯一 .vue —— 它没有纯渲染函数型内部件）
├── interface.ts                # 全部类型（DividerProps / 语义类型 / DividerRef / DividerConfig）
├── index.ts                    # 公共导出 + genDividerStyle + prepareDividerComponentToken
├── style/
│   ├── token.ts                # Component Token 定义 + prepareComponentToken（G3）
│   └── index.ts                # (prefixCls) => CSS 文本（G4）
├── demo/                       # 9 个 demo，与 antd 的**用户可见** demo 一一对应
├── __tests__/                  # L1 / L3 / L4 / L5 + theme + demo 冒烟
└── index.zh-CN.md / index.en-US.md
```

### 2.1 它**不**依赖组件目录

`import` 全部指向叶子模块：`../config-provider/context`、`../_internal/use-merge-semantic`、
`../_internal/with-install`、`@apollo-design/utils`。没有任何 `import ... from '../button'` 这类边。

### 2.2 `config-provider/hooks/useSize` 是**未就绪**的依赖

`registry/components.json` 把 `config-provider/hooks/useSize` 记在 `leafModules`。
antd 的 `useSize(customSize)` 会先读 `SizeContext`（ConfigProvider 的 `componentSize`）、
再由 `size` prop 覆盖。ConfigProvider **组件**尚未落地，`SizeContext` 不存在，
所以 `sizeFullName` 当前**恒等于 `size` prop**。缺口见 §9。

---

## 3. 公共 API

与 antd 的 `DividerProps` 逐字段对齐。完整表格见 [`index.zh-CN.md`](./index.zh-CN.md)。

```ts
interface DividerProps {
  prefixCls?: string;
  /** @deprecated 用 orientation */
  type?: Orientation;
  orientation?: Orientation;                 // ⚠️ 见 §4.1：身兼方向与旧版标题位置两职
  vertical?: boolean;                        // ⚠️ 见 §4.2：未传 ≠ false
  titlePlacement?: TitlePlacement;
  /** @deprecated 用 styles.content.margin */
  orientationMargin?: string | number;
  dashed?: boolean;
  variant?: DividerVariant;                  // 默认 'solid'
  size?: DividerSize;
  plain?: boolean;
  classNames?: DividerSemanticValue<DividerSemanticClassNames>;
  styles?: DividerSemanticValue<DividerSemanticStyles>;
}
```

> 根节点的 `class` / `style` 是 **Vue 原生 attrs**（经 `mergeProps` 落到根元素），
> 不声明 `className` / `rootClassName` / `style` Props。ConfigProvider 的
> `divider.className/style` 是配置对象字段（`DividerConfig`），保留。

`children` **不在** Props 里（规则 C19）—— antd 的 `children?: React.ReactNode` 在 Vue 侧是
默认插槽 `DividerSlot`。

---

## 4. 五条最容易写错的判据（都已被 compat 用例钉住）

### 4.1 `orientation` 身兼两职，且优先级是 `orientation` > `vertical` > `type`

```
orientation 是 horizontal / vertical   → 用它（方向）
否则 vertical 是**布尔**（不是真值！） → vertical ? 'vertical' : 'horizontal'
否则 type 是 horizontal / vertical     → 用它（旧 API，并告警）
否则                                    → 'horizontal'
```

同时 `orientation` 取 `left` / `right` / `center` / `start` / `end` 时，
它被当作**旧版的标题位置**（并告警「请改用 titlePlacement」）。
`validTitlePlacement` 这个名字容易读反 —— 它是「orientation 取了一个标题位置的值」，
而告警判据是 `!validTitlePlacement` 作为 `warning()` 的 `valid` 参数传入，
即**真的取值时才告警**。

`index.test.ts` 的方向合并表**逐条镜像** antd 自己的 `testCases`（7 条），
那是上游对这条优先级的可执行规格。

### 4.2 `vertical` 未传 ≠ `false`（PITFALLS 46 / D21）

Vue 的 Boolean prop 转换：只要 prop 的**运行时类型**含 `Boolean` 且调用方没传、也没有
`default`，Vue 就把它赋成 `false`。而 `useOrientation()` 的判据是
`typeof vertical === 'boolean'` —— 它把「未传」与「显式传 false」当作两条**不同**的分支。

所以 `withDefaults` 里的 `vertical: undefined` **不是冗余**：删掉它，
`<Divider type="vertical" />` 会走「vertical 是布尔」那条分支得到 `horizontal` ——
**旧 API 静默失效，而组件照样能渲染**。

### 4.3 `titlePlacement` 的折算

```
placement = titlePlacement ?? (orientation 是合法位置 ? orientation : 'center')
placement === 'left'  → direction === 'rtl' ? 'end' : 'start'
placement === 'right' → direction === 'rtl' ? 'start' : 'end'
```

### 4.4 `rail` 的两个语义

| 量 | 无 children | 有 children |
|---|---|---|
| `-rail` 类名（`${prefixCls}-rail`） | 落在**根元素** | 落在两个 rail 子元素上 |
| 语义槽位 `classNames.rail` / `styles.rail` | 落在**根元素** | 落在两个 rail 子元素上 |
| 根元素的 `style` | `{...styles.root, ...styles.rail, ...调用方原生 style}` | `{...styles.root, ...调用方原生 style}` |

第三行是**最反直觉**的一条：无 children 时根元素会**额外**吃到 `styles.rail`。
`index.test.ts` 对「有/无 children」两侧各有一条用例。

### 4.5 `orientationMargin` 必须自己补 `px`（PITFALLS 32）

Vue 运行时的 `setStyle` 只做 `style[prop] = value`，**不做单位补全**
（React 的 `dangerousStyleValue` 会）。传裸数字 `20` 会被 jsdom 与浏览器**静默丢弃** ——
DOM 结构全对、类名全对，只有 margin 是空的。

`Divider.vue` 的 `toCssLength()` 负责这件事，规则与 React 逐条对齐：

| 输入 | React `dangerousStyleValue` | 我们 |
|---|---|---|
| `20` | `20px` | `20px` |
| `0` | `0`（**不补**单位） | `'0'` |
| `'10'` | `10px`（经 `/^\d+$/` 转数字） | `10px` |
| `'2em'` | `2em` | `2em` |

⚠️ `0` 那一行在 **DOM 里观测不到**：jsdom 的 cssstyle 会把无单位零规范成 `0px`
（实测 jsdom 30），所以 L4 的 `orientation-margin:zero+start` 用例登记了一条豁免
（理由见 `semantic.test.ts` 的 `ALLOW`）。它只对 **SSR 直出字符串**有影响 ——
那里我们与 React 逐字节相同。这条用例的价值是钉住「`0` 仍然产生声明」
（判据必须是 `!= null`，不能是真值判断）。

---

## 5. 样式

`style/index.ts` 导出 `(prefixCls) => CSS 文本`。构建钩子（`packages/ui/build.config.ts`）
把它落成 `dist/divider/style.css` 与 `dist/index.css`（含 `apollo` / `ant` 两套前缀）。

### 5.1 选择器结构是从 antd 的**真实产物**提取的

用 `@ant-design/cssinjs` 的 `extractStyle` 渲染 antd 6.6.4 的 Divider 并提取 CSS
（去掉 hash 包裹层后）得到的就是 `style/index.ts` 里的结构。最容易写错的是**嵌套层级**：

```css
.apollo-divider .apollo-divider-rail{...}          /* ← 后代，不是顶级 */
.apollo-divider-dashed .apollo-divider-rail{...}   /* ← 后代 */
.apollo-divider-horizontal.apollo-divider-sm{...}  /* ← & 复合 */
```

若图省事把 `-dashed` 的 rail 样式写成顶级选择器，虚线的 rail 样式会作用到**所有** divider 上。
这是 cssinjs 的嵌套语义（`&` 是复合、普通键是后代），不是风格问题。

还有一处**上游的不对称**必须逐字保留：`dashed` 的 with-text 边框走 `rail` 子元素，
而 `dotted` 走 `::before, ::after` 伪元素。

### 5.2 三个 Component Token

| Token | 默认值 | 落点 | 运行时可否覆盖 |
|---|---|---|---|
| `verticalMarginInline` | `token.marginXS` | `var(--apollo-margin-xs)` | ✅ 覆盖变量 |
| `textPaddingInline` | `'1em'` | 常量内联 | ❌ 见 §5.3 |
| `orientationMargin` | `0.05` | 常量内联 | ❌ 见 §5.3 |

`orientationMargin` 在 antd 里标了 `unitless: true` —— 它参与 `calc(0.05 * 100%)` 这类算式，
一旦被补成 `0.05px` 算式就全错。`theme.test.ts` 有一条专门断言它没有单位。

### 5.3 ⚠️ 字面量 Component Token 不可运行时覆盖（全库缺口）

antd 在 cssVar 模式下会给**每个**组件 Token 生成 CSS 变量
（`--ant-divider-text-padding-inline` 等），所以 `theme.components.Divider.textPaddingInline`
是生效的。我们这边**不生效**，原因是：

`packages/theme` 的 `tokens.css` 由 `getCSSVarDeclarations(getDesignToken())` 生成，
而 `getDesignToken()` 的返回类型是 **`AliasToken`** —— 它只覆盖 Seed→Map→Alias 三层，
**不含**组件层。所以组件 Token 里「派生自 Alias」的那个（`verticalMarginInline`）能借
`--apollo-margin-xs` 变相覆盖，而两个字面量 Token 没有变量可覆盖。

这是**全库的管线缺口**，不是 Divider 独有：任何有字面量 Component Token 的组件都会遇到。
修复位置在 `packages/theme` 的 `tokens.css` 生成处（把每个组件的
`prepareComponentToken(getDesignToken())` 结果也声明成变量）—— 属 foundation 侧工作，
不在本组件的文件域内。已登记在 §9 与 `registry/components.json` 的 `layerNotes.token`，
并在 `demo/component-token.md` 里给出了等价的临时手段（`styles.content.*`）。

⚠️ 在缺口修好之前，**不能**把 `textPaddingInline` 写成 `var(--apollo-text-padding-inline)`：
那个变量在 `tokens.css` 里不存在，`tests/build/run.mjs` 的 B7 会直接判 FAIL，
而且线上会静默失效（`padding-inline` 变成空值）。

### 5.4 三条架构性质，各由一条测试钉住

1. **字面值恰好 4 个且有出处**：`1em` / `0.05`（两个 Component Token）+ `0.06em` / `0.9em`
   （antd 源码里 `top` / `height` 的字面量，逐字镜像）。`theme.test.ts` 用 `toEqual` 断言
   **恰好**是这四个 —— 多一个少一个都红。颜色一律不许硬编码。
2. **变量真的存在**：`tests/build/run.mjs` 的 B7 校验每个 `var(--apollo-*)` 都能在
   `packages/theme/dist/tokens.css` 里找到声明。
3. **前缀参数化**：`gen(p)` 必须对**入参** `p` 产出对应前缀的选择器（`.apollo-*` 不许写死）。
   静态产物只覆盖 `STATIC_PREFIX_CLS` 里列出的前缀 —— 2026-10-07 起**只有 `apollo`**
   （裁决 `css-ant-prefix-cost` = B）。该不变量由
   `packages/ui/src/__tests__/style-prefix.test.ts` 用**探针前缀**守着。

---

## 6. 测试

| 层 | 文件 | 用例数 | 状态 |
|---|---|---|---|
| L1 单元 | `__tests__/index.test.ts` | 61 | ✅ |
| L2 交互 | —— | —— | **n/a** |
| L3 类型 | `__tests__/type.test-d.ts`（含 10 条负例） | 16 | ✅ |
| L4 DOM 契约 | `__tests__/semantic.test.ts`（53 条基线与 antd 实测产物逐节点比对） | 54 | ✅ |
| L5 无障碍 | `__tests__/a11y.test.ts`（含 9 个 demo 的 axe 扫描） | 14 | ✅ |
| L6 视觉回归 | `tests/visual`（8 个视觉用例 × 3 viewport） | 24 | ✅ |
| L7 构建 | `tests/build/run.mjs` | —— | ✅ |
| 主题矩阵 | `__tests__/theme.test.ts`（四态 + Component Token） | 12 | ✅ |
| demo 冒烟 | `__tests__/demo.test.ts`（9 个） | 11 | ✅ |

### 6.1 L2 为什么是 n/a

Divider 是纯展示组件：无事件、无状态、无受控/非受控语义、无键盘交互、无禁用态。
`TESTING.md` 的 L2 要求覆盖「鼠标 / 键盘 / 焦点 / 受控 / 禁用」六类，这里**一类都不适用**。
写几个 `expect(exists()).toBe(true)` 把格子填上属于反模式 A1。

### 6.2 L4 的两条**夹具**差异（不是组件差异）

比对夹具的两条通道**不对称**：React 侧是 `renderToStaticMarkup` 的**直出字符串**，
Vue 侧要经 jsdom 的 `CSSStyleDeclaration` **序列化**。于是有两类纯夹具产物：

| 现象 | 实测（jsdom 30） | 处置 |
|---|---|---|
| 无单位零被规范成 `0px` | `style.marginInlineStart = '0'` → `margin-inline-start: 0px;` | `orientation-margin:zero+start` 登记豁免 |
| 非法值被静默丢弃 | `style.color = 'apollo'` → `getAttribute('style') === null` | 改用例：函数式 `styles` 不再拿 `info.props.prefixCls` 当颜色 |

同一个实验还确认了 PITFALLS 32 的另一半：`20` 与 `'20'` 会被**静默丢弃**（长度必须带单位），
只有 `0` 例外。**写 compat 用例时不能用非法的 CSS 值当探针** —— 那会让差异来自夹具而不是组件。

### 6.3 L6 的上下文样式必须钉死（含一处**字体**陷阱）

两侧的全局 reset 不同：antd 的 `reset.css` 有 `p { margin-top: 0; margin-bottom: 1em }`，
我们的 `BASE_CSS` 目前只覆盖 box-sizing 与字体，`<p>` 会退回 UA 的 `margin: 1em 0`。
所以 `tests/visual/render/cases/shared.mjs` 的 `DIVIDER_PARAGRAPH_STYLE` 把段落的
margin / fontSize / lineHeight / color 全部显式写死 —— 否则比出来的是「reset 不同」而不是
「Divider 不同」。

⚠️ **`font-family` 也必须写死成同一个具体值，不能写 `inherit`。** 这是本轮实测抓到的
最隐蔽的一处（首轮 24 组全部 `block-diff` 3.8% ~ 9.1%）：

| 侧 | 页面加载的全局 CSS | `html` 的 font-family |
|---|---|---|
| React | `antd/dist/reset.css` | `sans-serif`（**泛型**） |
| Vue | `@apollo-design/ui/style.css` 的 `BASE_CSS` | `var(--apollo-font-family)`（token 字体栈） |

夹具的 `<p>` 用 `inherit`，于是两侧继承到**不同字体**：泛型 `sans-serif` 由浏览器解析成一个
系统回退字体，token 字体栈以 `-apple-system` 开头。两者**度量接近、字形不同** ⇒ 换行位置
一致、每个墨点都不同，肉眼几乎看不出，但像素比对判 block-diff。

**定位过程**（可复现）：差异像素的包围盒只落在段落文字带（`horizontal` 的 9 个带 = 3 段 × 3 行），
**分割线所在行零差异**；最优平移搜索（dx/dy ∈ [-3,3]）最好的 dx=1 仍有 7.7% 差异 ⇒ 不是纯偏移，
是字形本身不同 ⇒ 字体。

**为什么这是夹具问题而不是组件问题**：antd 的 `resetComponent` 与我们的
`style/index.ts:80` 都把 token 字体**显式写在组件根上**，所以 `.ant-divider` 与 `.apollo-divider`
的字体是同一个栈 —— Divider 自己的标题文字（`Text` / `Left Text`）逐像素一致。
差异只可能来自组件**外面**的段落。

**反证**：把 `DIVIDER_CONTEXT_FONT = 'sans-serif'` 显式写进夹具后重生成 React 基线，
基线 PNG 的 sha256 **完全不变** —— 证明 React 侧段落本来就是 `sans-serif`，
新值只是把 Vue 侧对齐过去，没有改动参照物。

同理，视觉用例里所有 `style` 值都写成**字符串**：React 会给裸数字补 px、Vue 不会，
用字符串把这条平台差异从用例里排除掉。

> 结果：24 组（8 用例 × 1 主题 × 3 viewport）全部 `0.000% exact`。

---

## 7. 有意差异

本组件相关的（编号见 `COMPATIBILITY.md` §9）：

| # | 一句话 |
|---|---|
| D5 | 我们**没有** CSS-in-JS 注入的 hash 类名（`dom-contract.ts` 做对称剔除） |
| D6 | 默认前缀是 `apollo`（antd 是 `ant`），所以 `prefix-cls:no-props` 那条用例的差异是**有意的** |
| D7 | 零运行时静态 CSS + CSS 变量；由此带来 §5.3 的组件 Token 缺口 |
| D21 | **Boolean prop 转换**：未传的 `vertical` 会被 Vue 转成 `false`（见 §4.2） |
| D22 家族 | `DividerRef.nativeElement` 声明为可空（antd 声明为 `HTMLDivElement`，但首渲染前同样是 `null`） |

### 7.1 上游观察（我们**没有**修）

- **垂直分割线缺 `aria-orientation`**：按 ARIA 规范 `role="separator"` 默认是 horizontal，
  垂直的宜显式带 `aria-orientation="vertical"`。antd 6.6.4 没有输出，我们逐字对齐、也不输出 ——
  因为 L4 的 DOM 契约是与 antd 的机械基线逐字比对，单方面加属性会让契约红。
  这是「上游可改进项」，不是我们的差异。
- **`size` 的 `middle` 已废弃**：antd 计划在 v7 移除，但存量代码在传，我们保留且与 `medium`
  落到同一个 `-md` 类名。

---

## 8. 给后续组件的话

1. **`withDefaults` 里给 Boolean prop 写 `undefined` 默认值**（§4.2 / D21）。
   判据：任何「未传」与「显式传 false」语义不同的布尔 prop 都要照做。
2. **内联样式里的长度值自己补单位**（§4.5 / PITFALLS 32），并注意 `0` 是唯一不补的例外。
3. **CSS 的选择器层级要用 `extractStyle` 对着 antd 的真实产物写**，不要靠读源码推演 ——
   cssinjs 的 `&` 是复合、普通键是后代，读源码很容易把后代写成顶级。
4. **写 compat 用例时别用非法 CSS 值当探针**（§6.2）：`color: apollo` 会被 jsdom 丢弃，
   差异会来自夹具。要探「函数式 `classNames` / `styles` 收到了什么」，用**类名**承载探针值。
5. **告警要写在 `watchEffect` 里**，不能只在 setup 期求值一次。antd 的告警在**每次渲染**
   都求值，所以「挂载时合法、之后更新成非法」也会告警；setup 期只求值一次会让这条差异静默。
6. **`classNames` 是拼接、`styles` 是覆盖**，且调用方原生 `style` attrs 排在 `styles.root`
   **之后**（所以原生 `style` 覆盖 `styles.root`）。这条最容易「顺手改成更合理的顺序」。
7. **L6 用例里凡是「组件外」的上下文文字，`font-family` 要写死**（§6.3）。
   antd 的 `reset.css` 给 `html` 的是泛型 `sans-serif`，我们的 `BASE_CSS` 给的是
   `var(--apollo-font-family)` —— 写 `inherit` 会让两侧继承到不同字体，
   表现为「每个墨点都不同但换行一致」，很容易被误判成组件画错了。

---

## 9. 已知缺口

1. **字面量 Component Token 不可运行时覆盖**（§5.3）。全库缺口，修复位置在
   `packages/theme` 的 `tokens.css` 生成处，属 foundation 侧工作。
2. **`size` 不读 ConfigProvider 的 `componentSize`**（§2.2）。`useSize` 叶子模块尚未落地；
   antd 的 `should apply the componentSize of ConfigProvider` 与 `support vertical size`
   两条上游用例因此**无法移植**。落点：`config-provider/hooks/useSize` + SizeContext。
3. **`orientationMargin` 的 `-no-default-orientation-margin-*` 变体只覆盖 `start` / `end`**。
   与 antd 一致（`center` 时两个 `hasMargin*` 都是 false，不产生类名）。
4. **L6 的 dark / compact 未覆盖**：零运行时下 `tokens.css` 是构建期产物，
   运行时切算法依赖 ConfigProvider。已登记在 `tests/visual/matrix.mjs` 的 `LIMITATIONS`。
5. **`COMPATIBILITY.md` §9 尚未新增「字面量组件 Token 无变量」这一行** ——
   它需要改共享文件，不在本组件的文件域内，留给该文件的 owner。
