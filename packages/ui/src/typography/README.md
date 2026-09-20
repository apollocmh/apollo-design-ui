# typography

> 文本展示与轻量交互的**复合组件**：`Typography` 本体 + `Text` / `Title` / `Paragraph` / `Link`
> 四个子组件，以及 `ellipsis` / `copyable` / `editable` 三大能力。
>
> 状态：`completed`（2026-09-20）。7 层测试全绿；L6 视觉 24 组里 **21 组 0.000% exact**，
> 剩 3 组的差异已定位到**组件之外**并分类登记（§7.3）。

契约来源：antd 6.6.4 的 `es/typography/`（38 个文件 / 1499 行）。
实现规模：22 个手写文件 / **4123 行**（不含 demo 与测试）。

---

## 1. 职责

Typography 不是一个「显示文字的组件」，它是**富文本容器 + 三种轻交互**的叠加：

| 能力 | 说明 | 最难的判据 |
|---|---|---|
| 语义化标签 | 5 个组件各自映射一个 HTML 标签，`component` 可覆盖 | 子组件的**显式覆盖**语义（§4.3） |
| 七个装饰 | `strong` / `u` / `del` / `code` / `mark` / `kbd` / `i` | **嵌套顺序**（§4.1）—— 反了看起来一样，但 DOM 契约会红 |
| `ellipsis` | CSS 路径（`text-overflow` / `-webkit-line-clamp`）+ JS 二分裁剪路径 | 两条路径的**切换判据**与测量时序（§4.5 / §5.3） |
| `copyable` | 复制到剪贴板 + `copied` 状态机 | `icon` / `tooltips` 的**数组形态**与 `aria-label` 兜底 |
| `editable` | 进入编辑态、Enter 保存、Esc 取消 | 按键门槛：`trim()` / IME 组合中 / 带修饰键（§4.4） |

⚠️ **它是本仓库第一个「有内部子组件 + 有真实测量 + 有状态机」的组件**，所以它同时是
「复合组件怎么拆文件」「测量类能力怎么测」两块基建的试金石。§6.4 与 §8 记录了代价。

---

## 2. 文件布局

```
typography/
├── Typography.vue            89  本体。映射 <article>，**不支持**三大能力（antd 亦如此）
├── InternalTypography.vue   114  本体的无样式基座（对应 antd 的 InternalTypography）
├── Text.vue                  84  覆盖 component='span'
├── Title.vue                 72  覆盖 component='h{n}'，非法 level 退回 h1
├── Paragraph.vue             45  覆盖 component='div'
├── Link.vue                  67  覆盖 component='a'，补 rel 兜底
├── Base.ts                  863  ★ 全部逻辑（对应 antd 的 Base）。四个子组件是薄包装
├── Ellipsis.ts              410  ★ 二分裁剪 + 四个隐藏测量容器（对应 antd 的 Base/Ellipsis）
├── EllipsisTooltip.ts        59  ellipsis.tooltip 的接线（Tooltip 未落地，见 §7.3）
├── CopyBtn.ts               113  复制按钮（.ts 渲染函数 —— 见 §2.2）
├── Editable.ts              218  编辑态（.ts 渲染函数 —— 见 §2.2）
├── interface.ts             357  类型面（逐字段对齐 antd，差异见 §7.1）
├── index.ts                  85  导出 + withInstall + 复合挂载
├── style/
│   ├── index.ts             635  静态 CSS 生成（零运行时）
│   └── token.ts             172  Component Token + 上游字面量（唯一真源）
├── hooks/
│   ├── use-copy-click.ts     92  剪贴板 + copied 状态机
│   ├── use-merged-config.ts  62  boolean | Config 的二态归一（对应 antd 的 useMergedConfig）
│   ├── use-tooltip-props.ts  55  ellipsis.tooltip 的四分支归一
│   └── use-typography-semantic.ts 136  classNames / styles 的四个槽位合并
└── _util/
    ├── nodes.ts             182  children 归一化（D-typography-13 的落点）
    ├── copy.ts              115  剪贴板实现（format / 降级）
    └── util.ts               98  isEleEllipsis / isValidText 等
```

### 2.1 为什么 `Typography` 本体独立实现

antd 的 `Typography` 走 `InternalTypography`，**不继承** `Base` —— 所以它没有
`ellipsis` / `copyable` / `editable` / `type` / `disabled` 与七个装饰。
传了它们只会作为未知属性落到根元素上，**不产生任何类名**。
`index.test.ts` 有一条用例专门钉住这个形状（否则后人很容易「顺手」让它继承 `Base`）。

### 2.2 三个 `.ts` 渲染函数文件（而不是 `.vue`）

`Base.ts` / `Ellipsis.ts` / `CopyBtn.ts` / `Editable.ts` 都是 `h()` 渲染函数。
依据 `COMPONENT-RULES.md` §2 的**唯一允许条件 1**（纯渲染函数型内部件）。三个具体理由：

1. **`Ellipsis` 要把同一份内容渲染进 4 个隐藏测量容器**（PREPARE / START / 二分中点 / 符号行），
   模板表达不了「同一插槽调用多次、且每次给不同内联样式」。
2. **`enterIcon` / `icon` / `symbol` 是 `VNodeChild` 变量** —— 模板里没有「渲染一个
   VNodeChild 变量」的语法（`<component :is>` 不是等价物：它会丢掉 `false` / `null` 的语义）。
3. **二分裁剪是一段命令式循环**，写在渲染函数里才能保证「测量容器与最终渲染在同一帧」。

⚠️ 代价：这三个文件里的 **VNodeChild 类型 prop 必须显式声明 `undefined` 默认值**
（PITFALLS 46 / D21），否则 Vue 会把「未传」转成 `false`。

---

## 3. 公共 API

### 3.1 导出

```ts
import { Typography } from '@apollo-design/ui';
const { Text, Title, Paragraph, Link } = Typography;   // 与 antd 同形
```

`Typography.Text` 与具名导出 `Text` 指向**同一个对象**（`withInstall` 的产物），
否则插件注册会出现两份。`index.test.ts` 有一条 `toBe` 断言钉住它。

### 3.2 Props 的四个层次

| 层 | 类型 | 谁有 |
|---|---|---|
| 基础 | `BaseTypographyProps` | 全部 5 个（含 `Typography` 本体） |
| 语义化 | `classNames` / `styles`（对象或函数） | 全部 5 个 |
| 三大能力 | `BlockProps`：`ellipsis` / `copyable` / `editable` / `type` / `disabled` / 七个装饰 | 仅 4 个子组件 |
| 子组件专有 | `Title.level` / `Link.rel` / `Link.target` / `Text.ellipsis` 收窄 | 各自的 |

⚠️ `classNames` / `styles` 的函数式收到的 `info.props` 类型是 **`BaseTypographyProps`**，
**不含** `disabled` / `type` 这些 `BlockProps` 独有字段 —— antd 亦如此
（`GenerateSemantic<TypographySemanticType, BaseTypographyProps>`）。
`demo/semantic.vue` 曾因此写出 `info.props.disabled`（`vue-tsc` 报 TS2339），已改成
用 `rootClassName` 做分支判据。**这不是我们的类型写窄了，是上游的真实形状。**

### 3.3 四个语义化槽位

`root` / `actions` / `action` / `textarea`。前三个在常态下就有；`textarea` 只在**编辑态**
落在 `<textarea>` 上。`classNames` 是**拼接**、`styles` 是**覆盖**，且 `style` prop
排在 `styles.root` **之后**（所以 `style` 覆盖 `styles.root`）。

---

## 4. 最容易写错的判据（都已被测试钉住）

### 4.1 七个装饰的嵌套顺序

```
strong → u → del → code → mark → kbd → i        最内层 → 最外层
```

`wrapperDecorations` 里就是 7 行 `wrap(tag, props.xxx)`，**顺序反了屏幕上看不出差别**，
但它决定了 `mark` 里的 `code` 到底有没有底色（`mark` 的底色会盖住 `code` 的）。
唯一的观察点是 L4 的逐节点比对：交换任意两行，`semantic.test.ts` 立刻报
`标签不同 <mark> vs <code>`。

> 这条是**变异验证**（§6.5 M6）确认过的：L1 里两种嵌套都能过。

### 4.2 `-link` 的判据是 `component === 'a'`，不是「有没有 `type`」

```ts
{ [`${prefixCls}-link`]: props.component === 'a' }
```

所以 `<Link type="danger">` 同时有 `-danger` 与 `-link`；而 `<Text component="a">`
**仍然是 `span`**（`Text` 显式覆盖 `component`）⇒ **没有** `-link`。
基线里 `text:component-a` 与 `link:type-danger` 两条用例分别钉住这两半。

### 4.3 子组件的「显式覆盖」语义

`Text` → `span`、`Paragraph` → `div`、`Link` → `a`、`Title` → `h{level}`。
四者都是**在 props 层写死**的，用户传 `component` 也不生效 —— 这是 antd 的形状
（`Text` 的 `component` 被它自己覆盖掉）。`Title` 的非法 `level`（`6` / `9` / `0`）
退回 `h1` 并告警，**不是**渲染 `h6`（`h6` 会让标题层级出现空洞，是 axe `heading-order` 的关注点）。

### 4.4 `editable` 的三道按键门槛

少任何一条，中文用户或 `Ctrl+Enter` 用户都会误提交：

1. `confirmChange` 会 **`trim()`**，而 `onChange` 不会 —— 所以「保存的值」与
   「输入框里的值」在有首尾空格时**不同**（上游的既定行为，别「顺手统一」）。
2. **IME 组合中不提交**（`isComposing`）。
3. **带修饰键的 Enter 不提交**（`Ctrl+Enter` 是换行意图）。

另外「退出编辑态后把焦点还给编辑图标」的 `watch` **必须** `flush: 'post'` ——
默认的 `'pre'` 在重渲染**之前**跑，那一刻图标还没 patch 出来，`focus()` 静默落空
（键盘用户退出编辑后焦点掉回 `body`，是真实的可访问性回归）。

### 4.5 `onEllipsis` 只在**变化时**上报

```ts
// antd：setIsJsEllipsis(jsEllipsis); if (isJsEllipsis !== jsEllipsis) onEllipsis?.(jsEllipsis);
const changed = isJsEllipsis.value !== jsEllipsis;   // ← 必须先比较
isJsEllipsis.value = jsEllipsis;                     // ← 后赋值
```

⚠️ antd 读的 `isJsEllipsis` 是**本次渲染闭包里的旧值**（`setState` 不会同步改闭包变量），
所以判据是「变了没有」。Vue 的 `ref.value` 是**立刻**更新的 —— 照抄 antd 的写法会变成
「永远相等 ⇒ 永远不上报」。**先比较、后赋值**才是等价物。
（变异 M8：把 `changed` 写成恒 `true` ⇒ 2 条用例红。）

### 4.6 `topAriaLabel` 的候选顺序

```
[editConfig.text, childrenText, title, tooltipProps.title]   取第一个字符串或数字
```

**顺序即契约**：换顺序不报错、不改结构、不影响任何像素 —— 只影响屏幕阅读器读什么。
且它只在 `!enableEllipsis || cssEllipsis` 为假（即「有省略号且走 JS 测量」）时才算。
`childrenText` 只在「整份孩子就是一段文字」时给出（`nodeList.length === 1 && isValidText`），
多节点场景下它必须是 `undefined` —— 否则会把 `[object Object]` 当成可用的可访问名。

### 4.7 `rel` 的判据是 `=== undefined`，不是真值

`target="_blank"` 且**未传** `rel` 时补 `noopener noreferrer`；显式传 `rel=""` **不补**。
`index.test.ts` 三条用例分别钉住补 / 不补 / 非 `_blank` 不补。

### 4.8 受控 `expanded` 与 `expandable` 的两种形态

- `expandable: true`：展开后**按钮整个消失**（不是变成「收起」）。
  链条：`expanded` ⇒ `mergedEnableEllipsis` 变假 ⇒ `Ellipsis` 的 `enableMeasure` 变假 ⇒
  `canEllipsis` 恒为 `false` ⇒ `renderOperations` 里短路。
- `expandable: 'collapsible'`：展开后测量**仍在跑**，按钮变成「收起」。
- `-ellipsis` 类名的判据是 **`enableEllipsis`**（「传了 `ellipsis`」），
  与 `mergedEnableEllipsis`（含 `expanded` 与 `collapsible` 的与）**不是一回事** ——
  所以展开后 `-ellipsis` **不会**消失。

---

## 5. 样式

零运行时静态 CSS + CSS 变量（D5 / D7）。产物是 `dist/typography/style/index.css`。

### 5.1 选择器特异性：`&` 前缀在 cssinjs 里是**复合**，不是后代

这是本组件被 L6 抓到的**第一个真实缺陷**。antd 的源码是：

```js
[`&${componentCls}-secondary, &${componentCls}-link${componentCls}-secondary`]: { color: ... }
```

展开后两条都带根类 ⇒ 特异性 **0,3,0**。我们第一版把第二个分支的 `&` 省了，
写成 `.apollo-typography-link.apollo-typography-secondary` ⇒ **0,2,0**，
于是它与 `getLinkStyles` 的 `.apollo-typography.ant-typography-link`（也是 0,2,0）
**打平**，而后者在文档里**更靠后** ⇒ type 配色被 link 配色盖掉。

表现：`<Link type="secondary">` 算出 `colorLink`（蓝）而不是 `colorTextDescription`（灰）。
**jsdom 看不到层叠，L1/L4 全绿** —— 只有 L6 的逐像素比对能发现（`link` variant 三个 viewport
全红，`block-diff` 0.902% / 0.440% / 0.235%）。

⇒ 修法：四个 type 配色 + danger 的三态，**每个**复合分支都补回 `${c('')}` 前缀。
`theme.test.ts` 有 3 条断言钉住它（含一条「每个含 `-link` 的选择器都以根类开头」的通用不变式）。

### 5.2 `a,b:hover` 陷阱：伪类只作用于列表的**最后一个**选择器

这是被 L6 抓到的**第二个真实缺陷**。操作区传进来的选择器是逗号列表：

```
.apollo-typography-expand,.apollo-typography-collapse,.apollo-typography-edit,.apollo-typography-copy
```

直接拼 `${sel}:hover` 得到 `a,b,c,d:hover` —— 在 CSS 里那是**两个独立选择器**：
`a` / `b` / `c` 是**无条件**的、只有 `d` 带状态。于是前三个按钮**永远**拿到 `:hover` /
`:focus` / `:active` 的声明：表现为按钮一直显示 `colorLinkActive`、并且带一圈
`:focus-visible` 的焦点环。

表现：`ellipsis` / `semantic` / `copyable` 的 diff 图里，展开按钮周围是一圈红色矩形。
⇒ 修法：`operationUnitStates(sel)` 里的 `each(pseudo)` **逐个**给列表里每个选择器加伪类 ——
这正是 cssinjs 里 `&:hover` 的展开语义（`&` = 整个父选择器列表）。

### 5.3 测量容器的六条基础样式（`display:block` 是**功能性**的）

antd 的 `MeasureText` 硬编码了 6 条内联样式：

```ts
{ position: 'fixed', display: 'block', left: 0, top: 0, pointerEvents: 'none',
  backgroundColor: 'rgba(255,0,0,0.65)' }
```

我们第一版只带了「看起来必要」的那几条，漏了 `position:fixed` 与 `display:block`。
后果**不是**外观问题：`display:inline` 的元素**没有块级高度**，`clientHeight` 恒为 `0`。
二分中点那个容器只带 `measureStyle`（要量自然高度），于是
`midHeight > ellipsisHeight` **永远为假** ⇒ 二分一路收敛到 `maxIndex` ⇒
裁剪结果是**整段原文**（完全不裁剪）。

表现：`ellipsis` / `semantic` 六个 viewport 全部 `size-mismatch`
（Vue 294px vs React 184px）。⇒ 修法：`Ellipsis.ts` 的 `MEASURE_TEXT_STYLE` 常量，
四个测量容器全部展开它。
（变异 M4：删掉 `display:'block'` ⇒ 3 条用例红。）

### 5.4 两段零运行时补偿（`BASE_CSS` 的缺口）

antd 的浏览器行为依赖 `dist/reset.css`，而零运行时架构下我们没有等价物。
Typography 是第一个**必须**补它的组件，补了两段：

| 补偿 | 补什么 | 少了会怎样 |
|---|---|---|
| `getHeadingMarginReset(cls)` | `h1~h5.apollo-typography, p.apollo-typography { margin-top: 0 }` | UA 的 `margin-block-start` 生效，标题/段落顶部多出约 0.83em |
| `getActionButtonFontReset(actionList)` | 操作按钮 `font-family/font-size/line-height: inherit` | UA 的 `button{font:400 13.3333px Arial}` **shorthand** 把 `line-height` 重置成 `normal`（`font-size` 13.3333px vs 14px、行高 `normal` vs 22px） |

⚠️ 第二段的影响**超出外观**：`symbolRowEllipsisRef` 在测量容器里渲染
`children([], true)`，按钮字体变了 ⇒ 测量到的 `ellipsisHeight` 变了 ⇒
二分裁剪**差一个字符**（56 vs 57）。所以「按钮字体」在这条链上是一个**功能参数**。
（变异 M5：`getActionButtonFontReset` 返回 `[]` ⇒ 1 条用例红。）

⚠️ 两段都**故意不补** `margin:0` / `color:inherit` —— antd 的 `reset.css` 那条规则里
有，但补上会改变 `disabled` 等状态的颜色继承链。见 `style/index.ts` 的注释。

### 5.5 两个 Component Token 与「字面量」缺口

antd 的 Typography 只有 2 个 Component Token：`titleMarginTop`（`'1.2em'`）/
`titleMarginBottom`（`'0.5em'`）。两者都是**字面量**，且上游的
`prepareComponentToken` **不接收 token**（零参）—— 我们逐字对齐（含零参签名，
`theme.test.ts` 有一条 `prepareComponentToken.length === 0` 的断言防止后人「顺手」加参数）。

另有一批**上游自己也没做成 token** 的字面量（`code`/`kbd`/`pre` 的半透明灰底与灰边、
`mark` 的金色底、圆角 3px）。它们没有等值的 Alias token（`borderRadiusSM`=4、`XS`=2，
都不等于 3），换最近似的变量会让视觉偏离 antd。所以唯一真源收在 `style/token.ts`，
逐条标注出处与取舍理由；`theme.test.ts` 用 `toEqual` 断言产物里的字面值
**恰好**是这几个 —— 多一个少一个都红。

⚠️ **`validate-registry.mjs` 的 E10（无硬编码视觉值）是文本级扫描**，它只豁免
`var(` 与 `${v(` 两种形态，而 `token.ts` 是它唯一**整文件豁免**的真源处。
所以圆角以 `RESET_BORDER_RADIUS_DECL = 'border-radius:3px'`（连属性名一起）的形式
放在 `token.ts` —— 判据没有被放松，`theme.test.ts` 仍然钉住产物。

---

## 6. 测试

### 6.1 七层

| 层 | 文件 / 命令 | 用例数 | 结果 |
|---|---|---|---|
| L1 + L2 | `__tests__/index.test.ts` | 105 | ✅ |
| L1（demo 冒烟） | `__tests__/demo.test.ts` | 9 | ✅ |
| L3（类型测试） | `__tests__/type.test-d.ts` | 29 | ✅ |
| L3（全仓类型） | `pnpm run lint:types`（`vue-tsc --noEmit`） | — | ✅ exit 0 |
| L4（DOM 契约） | `__tests__/semantic.test.ts` | 77 | ✅ |
| L5（a11y） | `__tests__/a11y.test.ts` | 19 | ✅ |
| L1/L2（主题矩阵） | `__tests__/theme.test.ts` | 21 | ✅ |
| L6（视觉回归） | `node tests/visual/run.mjs --component typography --mode compare` | 24 组 | ⚠️ 21/24 exact，3 组已分类（§7.3） |
| L7（构建门） | `node tests/build/run.mjs` | — | 见 §6.6 |
| registry | `pnpm run registry:check` | 18 项 | ✅ |

L4 的基线是 `tests/compat/baselines/typography.dom.json`（**76 条**用例，由
`tests/compat/baseline/typography.mjs` 用 antd 6.6.4 的 `renderToStaticMarkup` 生成，
机械 oracle、禁止手改）。compat fixture 在 `tests/compat/fixtures/typography/`（3 个）。

### 6.2 L3：为什么有两个 `types` 层

- `type.test-d.ts`（`vitest --project types`）跑的是**我们自己的**类型断言，含负例
  （`@ts-expect-error`），失败信息带用例名。
- `vue-tsc --noEmit` 跑的是**全仓**类型检查，能发现「测试文件里故意传非法值」
  「helper 的泛型收窄过头」这类**测试代码自己**的类型错误。

⚠️ **收口时实测到 21 处 `vue-tsc` 错误全在 typography 的测试文件与 demo 里**，
已全部修掉（`mountWithConfig` / `withText` / `noText` 的 `component` 参数收 `Component`；
故意越界的非法值改 `as never` 并注明理由；`demo/semantic.vue` 的 `info.props.disabled`）。
⇒ 只跑 `--project types` **会漏掉这一类**，两个都要跑。

⚠️ `pnpm run test:types` 在**全仓**范围下会因 `TypeCheckError: Cannot find module
'./Divider.vue'` 这类 `.vue` 解析失败而 exit 1（Vitest typecheck 模式不走 vue 插件）。
实测证据：报错文件包含 `Divider.vue` / `Empty.vue` / `Spin.vue` / `Form.vue` ——
**与 typography 无关**，是仓库级的工具链缺口（`packages/ui/src/index.ts` 已导入它们）。
按组件路径过滤（`vitest run --project types packages/ui/src/typography`）时全绿。

### 6.3 L4 的允许差异

`domContractTest` 的语义是 `expect(actualDiff).toEqual([...allowed])` —— 允许的差异必须
**恰好**出现，多一条都不行。typography 的允许项全部归并到 D5 / D6 / D-typography-13 三条
（无 hashId 类名、前缀 `apollo`、children 归一化），逐条写在 `semantic.test.ts` 里。

### 6.4 L1/L2 怎么测「jsdom 里没有的排版」

**jsdom 没有布局引擎**：`clientHeight` / `scrollHeight` 恒为 0。所以 JS 二分裁剪路径
必须靠**打桩布局**驱动（`installLayoutMock`）。桩里有一条**真实浏览器行为**，不是随手加的：

> **`display:inline` 的元素 `clientHeight` 恒为 0**（inline 盒子没有块级高度）。

没有这条，桩会把 §5.3 那个真实缺陷**放过去**（它正是这么发生的）。
另外 `installLayoutMock` 会**快照**每个被读过尺寸的测量容器的内联样式 ——
因为容器只存在一帧，用例结束时它们已经从 DOM 上摘掉了，事后 `querySelector` 什么也查不到，
**桩是唯一一个「容器还在 DOM 上时」的观察点**。有一条断言专门检查「所有测量容器都被回收」
（不留半透明红色方块）。

⚠️ 桩的局限：它只能证明「二分找到了最大的那个 n」（在**桩的规则下**），
**不能**证明真实排版结果。真实排版只由 L6 证明。

### 6.5 变异验证（8 条，全部已回滚）

| # | 变异 | 变红的层 | 用例数 |
|---|---|---|---|
| M1 | 交换 `wrap('code')` / `wrap('mark')` | L4 | 2 |
| M2 | 删掉 `-secondary` 分支的 `${c('')}` 前缀 | theme | 2 |
| M3 | `each = (pseudo) => \`${sel}${pseudo}\`` | theme | 1 |
| M4 | 删掉 `MEASURE_TEXT_STYLE.display` | L1/L2 | 3 |
| M5 | `getActionButtonFontReset` 返回 `[]` | theme | 1 |
| M6 | 交换 `wrap('code')` / `wrap('mark')`（重复确认） | L4 | 2 |
| M7 | `topAriaLabel` 把 `editConfig.text` 挪到末位 | L1/L2 | 1 |
| M8 | `onJsEllipsis` 的 `changed` 恒为 `true` | L1/L2 | 2 |

**变异验证抓到两条「空转断言」**，都已加固：

1. M2 时，「每个含 `-link` 的选择器都以根类开头」这条通用不变式**仍然绿** ——
   因为 `sel.startsWith('.' + P)` 被 `.apollo-typography-link…` 也满足。
   改成 `new RegExp(\`^\\.${P}(?![\\w-])\`)` 后才真正生效。
2. M7 之前，**没有任何用例**覆盖 `topAriaLabel` 的候选顺序（改顺序全绿）⇒
   补了一条四分支用例（`editable.text` > 正文 > `title` > `ellipsis.tooltip.title`）。

> ⇒ **变异验证的价值不是「确认测试有效」，而是「找出测试没测到的地方」。**

### 6.6 L6 与 L7

L6 的用例在 `tests/visual/render/cases/{react,vue}/typography.{jsx,js}`（8 variant × 3 viewport），
基线 PNG 在 `tests/visual/baselines/react/typography/`（**已 `git add`**，`snapshots/` 是 gitignore 的）。

⚠️ React 侧**必须**用复合形式 `Typography.Text` —— antd 只在顶层导出复合对象，
`import { Text } from 'antd'` 会拿到 `undefined`。
⚠️ 两侧都**不能**渲染 Typography 之外的文字：antd 的 `reset.css` 给 `html` 是泛型
`sans-serif`，我们的 `BASE_CSS` 给的是 `var(--apollo-font-family)`，两侧会继承到不同字体，
表现为「每个墨点都不同但换行一致」，很容易被误判成组件画错了。

L7 构建门校验：产物无 React 痕迹（E11）、CSS 里每个 `var(--apollo-*)` 都在
theme 的 `tokens.css` 有声明（B7）。

---

## 7. 有意差异与缺口登记

### 7.1 差异编号（`COMPATIBILITY.md` §9 的口径）

⚠️ **本组件的差异用 `D-typography-N` 前缀**，而不是 §9.2 的全局 `D<n>` 编号 ——
因为 §9.2 是共享表，而本组件的文件域不含 `COMPATIBILITY.md`（见 §9.5）。

| # | 一句话 | 分类 |
|---|---|---|
| D-typography-1 | `EditConfig` 在 antd 里未导出，我们**导出**它（Vue 使用者需要引用该类型） | INTENDED |
| D-typography-2 | `editable` 用**原生 `<textarea>`** 而非 `Input.TextArea`（无 autosize、无 `apollo-input*` 类名） | PLATFORM（待 Input 落地后收） |
| D-typography-4 | `ResizeObserver` 是组件形态，我们是 `useResizeObserver` composable | PLATFORM |
| D-typography-5 | antd 每次渲染重建 `mergedProps`，我们用 `computed` 缓存 | PLATFORM |
| D-typography-6 | `component?: keyof JSX.IntrinsicElements` → `component?: string` | PLATFORM |
| D-typography-7 | 开发期 `isEleEllipsis` 的临时 `<em>` 类名取 `prefixCls`（antd 写死 `ant`） | PLATFORM |
| D-typography-8 | `Tooltip` 未落地 ⇒ 编辑按钮与省略号提示**不包** `Tooltip` | PLATFORM（待 Tooltip 落地后收） |
| D-typography-9 | `onInput` 里显式把剥离换行后的值写回元素（Vue 里 `current` 未变则不重渲染） | PLATFORM |
| D-typography-10 | `enterIcon` 用 `undefined` 表示「用默认」、`null` 表示「不渲染」（PITFALLS 46） | PLATFORM |
| D-typography-11 | `ellipsis` 的测量时序（`flush: 'post'` vs antd 的 `useLayoutEffect`） | PLATFORM |
| D-typography-12 | `usePrevious` 不需要单独实现 —— `watch(cb)` 直接给 `oldValue` | PLATFORM |
| D-typography-13 | `children` 必须**归一化**（Vue 插槽恒返回 vnode 数组） | PLATFORM |
| D-typography-14 | `Ellipsis` 的测量依赖必须**显式下传**（`miscDeps`） | PLATFORM |
| D-typography-15 | `isReactRenderable(children)` → `hasContent`（`children === ''` 时判据不同） | PLATFORM |
| D5 | 无 CSS-in-JS 的 `hashId` / `cssVarCls` 类名 | INTENDED |
| D6 | 默认前缀 `apollo`（antd 是 `ant`） | INTENDED |
| D7 | 零运行时静态 CSS + CSS 变量 | INTENDED |
| D14 / D15 | 图标前缀 `apollo-icon`；`getIconStyle` 只导出、不注入 | INTENDED |

⚠️ **已知的编号漂移**：`docs/analysis/typography.md` §9.1 是**设计期**的编号
（那时 `D-typography-2` = Tooltip、`-3` = textarea、`-4` = ResizeObserver…），
实现期把 Tooltip 挪到了 `-8`、`-2` 复用给了 textarea。**代码里的编号是权威**，
`docs/analysis/` 是历史文档。收口时未回改它（该文件不在本组件的文件域内），
在此登记以免后人被误导。

### 7.2 跟随的上游行为（我们**没有**修）

- **`mark` 的底色不随 dark 变化**：antd 写死 `gold[2]` 并留了 `// FIXME hardcode in v4`。
  我们如实照搬取值，**不**换成会随算法变化的 `--apollo-color-warning-border`
  （默认值恰好也是同一个色，但 dark 下会变）—— 用变量反而更不忠实。
- **`disabled` 没有 `aria-disabled`**：antd 只加 `-disabled` 类名，不加 ARIA 属性。
  我们逐字对齐（L5 的 axe 扫描 0 violation，但「禁用语义对屏幕阅读器不可见」是上游可改进项）。
- **`-ellipsis` 的 CSS 截断由浏览器负责可访问名**：所以走 CSS 路径时 `topAriaLabel`
  恒为 `undefined`（根元素**没有** `aria-label`）。这是上游行为，不是我们漏了。

### 7.3 缺口登记（不是差异，是我们没做）

| # | 缺口 | 根因 | 落点 | 影响 |
|---|---|---|---|---|
| G1 | `Tooltip` 未落地 ⇒ `copyable.tooltips` / `ellipsis.tooltip` / `editable.tooltip` 的**悬浮气泡**没有 | Tooltip 组件未实现 | Tooltip 收口后接线（`EllipsisTooltip.ts` 已留好接口） | 未展开时 DOM 逐字一致（rc-tooltip 只 clone 子元素），所以 L4/L6 不受影响；缺的是「悬浮后出现气泡」那一半，需要交互式截图 |
| G2 | `editable` 的 **autosize** 与 `apollo-input*` 类名 | Input / TextArea 未落地 | Input 收口后换掉原生 `<textarea>` | L4 里 textarea 的类名与 antd 不同（已登记 D-typography-2） |
| G3 | `EllipsisConfig.tooltip` 的类型收窄为 `{ title?: VNodeChild }` | 同上 | Tooltip 收口后补全为 `TooltipProps` | 类型面比 antd 窄；运行时其余字段仍被原样展开 |
| G4 | `theme.components.Typography` **无法在运行时覆盖** `titleMarginTop/Bottom` | 零运行时管线没有「Component Token → CSS 变量」这一段 | `packages/theme` 的 `tokens.css` 生成处 | **全库缺口**（divider / spin 同源）。临时手段：`styles.*` |
| G5 | `BASE_CSS` 缺 `h1~h6` / `p` 的 margin reset | 全局 reset 未落地 | 已用 `getHeadingMarginReset` 在组件内补偿 | 补偿是**组件级**的；其他渲染原生标题的组件仍需自己补 |
| G6 | `BASE_CSS` 缺表单控件的字体 reset | 同上 | 已用 `getActionButtonFontReset` 补偿 | 同上；且它还影响 ellipsis 的测量结果（§5.4） |
| G7 | **`@apollo-design/icons` 的 `getIconStyle` 没有消费者 ⇒ 图标没有基础样式** | D15 规定「只导出、不注入」，而接线没人做 | `packages/ui/src/style/index.ts` 的 `BASE_CSS` | **这是 L6 `copyable` 三组红的根因**，见下 |
| G8 | `TypographyRef.nativeElement` 声明为可空 | antd 声明为 `HTMLElement`（但首渲染前同样是 `null`） | — | 与 `EmptyRef` / `DividerRef` 同源，类型比运行时宽是安全的 |
| G9 | L6 的 dark / compact 未覆盖 | 零运行时下 `tokens.css` 是**构建期**产物，运行时切算法依赖 ConfigProvider（组件尚未实现） | `tests/visual/matrix.mjs` 的 `LIMITATIONS` | 已登记，不阻塞 |
| G10 | `COMPATIBILITY.md` §9 尚未新增 typography 的行 | 它需要改**共享文件**，不在本组件的文件域内 | 该文件的 owner | 与 divider §9.5 同源（见 §9.5） |
| G11 | 按需引入样式与自定义前缀都**没有**公开入口 | `packages/ui/package.json` 的 `exports` 只登记了 `./style.css` 与 `./empty/style.css`；`genTypographyStyle` 未从包根再导出 | `packages/ui/package.json` / `packages/ui/src/index.ts`（均不在本组件文件域） | 实测 `@apollo-design/ui/typography/style.css` 抛 `ERR_PACKAGE_PATH_NOT_EXPORTED`，而产物 `dist/typography/style.css` 是存在的。⚠️ 更麻烦的是 `genAllStyles()` 生成的 CSS 头部**写着**「按需引入请用 `@apollo-design/ui/<component>/style.css`」—— 文档与 `exports` 相互矛盾。`divider` / `spin` 同样如此 |

#### G7 展开：L6 `copyable` 三组红的根因（唯一未闭合项）

```
✗ typography/copyable__light__mobile    0.3211%  block-diff
✗ typography/copyable__light__tablet    0.1568%  block-diff
✗ typography/copyable__light__desktop   0.0836%  block-diff
```

- **差异是成块的**（散点占比 1.7%，阈值 90%）⇒ 不是抗锯齿噪声。
- **diff 图显示红色只落在复制图标上**（`tests/visual/diff/typography/copyable__light__*.png`），
  文字部分逐像素一致。
- **根因**：`getIconStyle(iconPrefixCls)` 在 `@apollo-design/icons` 里**导出了但没有任何消费者**，
  于是 `.apollo-icon` 没有 `display:inline-flex`、没有 `vertical-align:-0.125em`，
  SVG 退化成 `display:inline`，字形基线与 antd 差一点点。
- **为什么不在本组件的收口里修**：修法是在全局 `BASE_CSS` 里接上 `getIconStyle`，
  那会改变**所有**渲染图标的组件的像素输出（`spin` 的 `LoadingOutlined` 等），
  属于 foundation 层的接线工作，超出本组件的改动面。
- **已登记处**：本节 + `tests/visual/matrix.mjs` 的 `LIMITATIONS`
  （`typography·visual-residual`）+ registry 的 `layerNotes.visual`。

---

## 8. 给后续组件的话

1. **复合组件先决定「谁承载逻辑」**。antd 的 `Typography` 本体**不继承** `Base` ——
   这种「看起来该共用但上游没共用」的地方，别自作主张合并（§2.1）。
2. **`VNodeChild` 类型的 prop 一律显式写 `undefined` 默认值**（§2.2 / PITFALLS 46）。
3. **jsdom 看不到 CSS 层叠，也看不到 `display:inline` 的高度**。任何依赖
   「特异性 / 布局 / 真实排版」的判据，**只能**靠 L6。本组件的三个真实缺陷
   （§5.1 / §5.2 / §5.3）**没有一个是 jsdom 层能抓到的**。
4. **打桩布局时要把「真实浏览器行为」打进去**，不能只让测试好过（§6.4）。
   桩里少一条 `display:inline ⇒ clientHeight:0`，就会放过一个真缺陷。
5. **`ref.value` 是立刻更新的**。凡是「与上一轮比较」的逻辑，照抄 React 的
   「先 setState、再比较闭包旧值」会变成恒等（§4.5）。**先比较、后赋值。**
6. **`operationUnit` 这类逗号选择器列表，伪类必须逐个加**（§5.2）。
7. **`BASE_CSS` 的缺口要在组件内显式补偿并注明**（§5.4），不要静默依赖浏览器默认值 ——
   浏览器默认值里 `button` 的 `font` shorthand 会重置 `line-height`，
   而它可能是一个**功能参数**（影响测量结果）。
8. **L6 用例里组件外的上下文文字要写死字体**（§6.6）。
9. **`E10` 是文本级扫描**：连注释里的 `#hex` / `rgb(` / `border-radius:` 都算命中。
   字面量的**声明**（连属性名一起）要放 `style/token.ts`。
10. **收口时两个类型层都要跑**（§6.2）：`--project types` 只覆盖 `*.test-d.ts`，
    `vue-tsc` 才能发现测试代码自己的类型错误。

---

## 9. 已知缺口（汇总）

§7.3 的 G1–G10 是权威清单。其中**阻塞 `completed` 的只有一条**：

- **G7（图标基础样式未接线）** —— 它是 L6 唯一未闭合的 3 组差异。
  已按 `TESTING.md` §4.3 的要求**分类**（`PLATFORM`/foundation 缺口，非组件缺陷）并
  在三处登记。**不是**「降低阈值 / 跳过用例」：`compare.mjs` 的判据（差异率 ≤ 0.1%
  **且**散点占比 ≥ 90%）一行未改。

其余 G1–G6、G8–G10 都是「上游组件未落地」或「全库管线缺口」，有明确的落点与解锁条件。

### 9.5 为什么 `COMPATIBILITY.md` §9.2 里没有 typography 的行

`COMPATIBILITY.md` 是**共享文件**，不在本组件的文件域内（与 divider §9.5 同源）。
按项目约定，组件把差异登记在**自己的 README**（本节 + §7.1）并把「往共享表追加行」
留给该文件的 owner。⚠️ 规则 C24 说「未登记的差异视为 BUG」—— 所以这是一个
**流程上的待办**，不是「我们没登记」。
