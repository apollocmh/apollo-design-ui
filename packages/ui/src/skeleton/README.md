# skeleton

> 骨架屏。契约来源：antd 6.6.4 的 `es/skeleton/`（`Skeleton.js` / `Element.js` /
> `Title.js` / `Paragraph.js` / `Image.js` / `Node.js`）。
> 逐条行号见 `docs/analysis/skeleton.md`。

## 1. 职责

在需要等待加载内容的位置提供一个**占位图形组合**。它是本仓库第一个**复合组件**
（`Skeleton.Avatar` / `.Button` / `.Input` / `.Image` / `.Node` 同包导出），
也是第一个「**根元素可能根本不存在**」的组件（`loading === false` 时直接渲染 children）。

**不做**：不管理加载状态、不发请求、不做布局计算。它只是一个「按结构画灰块」的纯展示组件。

## 2. 文件布局

```
skeleton/
├── Skeleton.vue          # 主组件（分支 + 类名 + 三块互锁推导）
├── Element.vue           # Avatar/Button/Input/Image/Node 的公共底座（渲染 <span>）
├── Avatar.vue  Button.vue  Input.vue  Image.vue  Node.vue
├── Title.vue             # 渲染 <h3>
├── Paragraph.vue         # 渲染 <ul> + rows 个 <li>
├── interface.ts          # 类型面（导出名必须与 ui/src/index.ts 的清单逐字一致）
├── index.ts              # 导出
├── styleLength.ts        # 长度归一化（数值 → px）
├── style/{token.ts,index.ts}
└── __tests__/{index.test.ts,a11y.test.ts}
```

## 3. 公共 API

见 `index.zh-CN.md`。要点：
`loading` / `avatar` / `title` / `paragraph` / `round` / `active` +
6 个语义化槽位（`root` / `header` / `section` / `avatar` / `title` / `paragraph`）。

⚠️ **导出名必须与 `packages/ui/src/index.ts` 里脚手架预生成的清单逐字一致**（25 个类型）。
漏一个或改一个名，全仓 `vue-tsc` 就会红。

## 4. 四条最容易写错的判据（都已被测试钉住）

### 4.1 `loading` 的判据在 Vue 里**必须改写**（`Skeleton.js:105`）

上游是 `loading || !('loading' in props)` —— **看「键是否存在」**。
Vue 的 props 对象**恒**包含全部声明键 ⇒ `'loading' in props` 恒为 `true`，照抄会让
「未传 loading」永远走 children 分支。

等价语义：**未传与 `true` 都渲染骨架，只有 `false` 渲染 children** ⇒ `loading !== false`。

⚠️ 四态实测（见 `index.zh-CN.md`）：**唯一与上游不同的是「显式传 `loading={undefined}`」**
（上游渲染 children、我们渲染骨架），原因是 Vue 的 prop 没有「键存在」概念 ⇒ **PLATFORM 差异**。
基线生成器里有 `loading:unset` 与 `loading:explicit-undefined` **两条独立用例**把差异钉住 ——
只测前者会得出片面结论。

### 4.2 三块的基础 props 是**互锁推导**的（`:23-62`）

| 推导 | 规则 |
|---|---|
| avatar `shape` | `hasTitle && !hasParagraph` ⇒ `'square'`，否则 `'circle'`（`size` 恒 `'large'`） |
| title `width` | `!hasAvatar && hasParagraph` ⇒ `'38%'`；`hasAvatar && hasParagraph` ⇒ `'50%'`；否则不设 |
| paragraph `width` | `!hasAvatar \|\| !hasTitle` ⇒ `'61%'`；否则不设 |
| paragraph `rows` | `!hasAvatar && hasTitle` ⇒ `3`，否则 `2` |

三者**互相依赖**，只测单一组合发现不了推导错误 ⇒ L1 用 **8 种存在性组合的全矩阵**覆盖。

### 4.3 `-header` 与 `-section` 是**并列**的（`:157-161`）

不是嵌套。且 `-title` 是 `<h3>`、`-paragraph` 是 `<ul>` + `rows` 个 `<li>`。

⚠️ `paragraph.width` 是**数组**时逐行取；是**单值**时**只有最后一行**用（其余行无 `width`）——
这是上游真实行为，不是「每行都设」（`Paragraph.js:5-18`）。

### 4.4 `Element` 的 size/shape 后缀挂在**自己的 prefixCls** 上

实测渲染出来是 `apollo-skeleton-avatar` + `apollo-skeleton-avatar-lg` + `apollo-skeleton-avatar-square`
—— **不是** `-element-lg` / `-element-square`（`Element.vue` 用 `props.prefixCls` 当基准，
而 Skeleton 传进去的是 `${prefixCls}-avatar`）。
写测试时我按 `Element` 组件的名字想当然写成 `-element-*`，被探针纠正过一次。

## 5. 样式

零运行时架构：**别名派生的走 `var(--apollo-*)`**（随主题自适应、由构建门禁 B7 校验）；
**字面量的**由 `style/token.ts` 给出唯一真源，由 `style/index.ts` 内联消费。

⚠️⚠️ **本文件的注释里不要出现「圆角属性名 + 冒号 + 数字」**：
`validate-registry` 的 E10 扫描源码时**不剥注释**，注释里的这种片段会被判成硬编码圆角
（假阳性）。E19 那边早就要求 `stripComments()`，E10 没有。

## 6. 测试

| 层 | 状态 | 覆盖 |
|---|---|---|
| L1 unit | ✅ 23 例 | loading 三态 / 8 种互锁组合 / DOM 契约 / 类名 / 用户覆盖 |
| L4 dom-contract | ⬜ 待补 | `tests/compat/baselines/skeleton.dom.json`（48 用例）已生成，消费侧断言未写 |
| L5 a11y | ✅ 15 例 | axe 扫描 + 「不凭空加 ARIA」对齐断言 + `Image` 的 `aria-hidden` |
| L6 visual | ⚠️ **9 / 24** | 见 §7.1 的根因 |
| L3 type | ⬜ 待补 | |
| L2 interaction | n/a | 组件无交互元素 |

### 6.1 L4 的基线来源

`tests/compat/baseline/skeleton.mjs` → `tests/compat/baselines/skeleton.dom.json`（48 用例）。
机械 oracle，**禁止手改**；重新生成：`node tests/compat/baseline/skeleton.mjs`。

## 7. 有意差异 / 已知缺口

### 7.1 ⚠️ L6 只有 9/24，根因在**共享层**（不在本组件）

`--mode compare` 实测 9/24，失败项**全是 `size-mismatch` 且我方一致偏高**。

**根因**：`packages/ui/src/style/index.ts` 的 `BASE_CSS` 缺 antd `reset.css` 的
**元素级 margin 重置**：

```css
h1..h6   { margin-top: 0; margin-bottom: 0.5em; }
ol,ul,dl { margin-top: 0; margin-bottom: 1em; }
```

antd 的 skeleton 样式**只设 `margin-block-start`**，end 方向完全依赖全局 reset。
我们缺了这段 ⇒ `<h3 class="-title">` 与 `<ul class="-paragraph">` **保留浏览器默认的
`margin-block-end: 1em`** ⇒ 每个骨架都偏高。

**为什么不在组件内自保**：antd reset 用的是 `0.5em` / `1em` 这类**非 token 值**，
硬写进组件会违反 H9，且将来补了 reset 会**重复计算**。
⇒ 登记为**共享层缺口**（与 typography 的 G7「`BASE_CSS` 缺 `getIconStyle`」同一家族）。
正解是补 `BASE_CSS`，但那会同时影响**所有**渲染 `h1~h6`/`ul`/`p` 的组件
⇒ 需单独评估 + **全量重跑所有视觉基线**。

⚠️ **不因为这项缺口就把 `visualStatus` 标 done 或调阈值** —— 阈值一行未改。

### 7.2 一处**我们比上游更严格**（有意，已登记）

`Skeleton.Image` 的 `<svg>` 上我们加了 `aria-hidden="true"` + `focusable="false"`，
**antd 的 `Image.js` 没有**。装饰性占位图对读屏器无意义，这是改进；
但它确实是**超出上游**的行为，由 `__tests__/a11y.test.ts` 钉住，避免将来被「对齐上游」时静默删掉。

### 7.3 上游观察（我们**没有**修）

- **antd 的 Skeleton 完全没有 ARIA**（实测 `aria-*` / `role` 出现次数为 **0**）：
  没有 `aria-busy` / `aria-live` / `role="status"`。屏幕阅读器不会播报「正在加载」。
  我们逐字对齐，不擅自补（否则 L4 的 DOM 契约会与机械基线不一致）。
- `Skeleton.Image` 里有一个 `<title>Image placeholder</title>` —— 与 `aria-hidden` 并存
  在语义上是矛盾的（hidden 之后 title 不会被读出）。

### 7.4 ⚠️ 语义化**支持函数式**，与 `empty-semantic-fn` 决策的建议 B 不一致

`empty-semantic-fn` 开放决策的建议是 **B（形态统一优先，不支持函数式 `classNames` / `styles`）**，
divider / button / typography 等已按 B 落地。

但本组件的 `interface.ts` 实现的是 **antd 的原始形状**（实测）：

| 类型 | 实际形状 |
|---|---|
| `SkeletonSemanticValue<T>` | `T \| ((info: { props: SkeletonProps }) => T)` —— **含函数分支** |
| `SkeletonSemanticAllType` | 要求 `classNamesAndFn` / `stylesAndFn` |
| `SkeletonProps.classNames` | 接受函数（`() => ({ root: 'x' })` 类型通过） |

⇒ **本组件的语义化面比其它组件宽**。`__tests__/type.test-d.ts` 如实钉住**实现**，
而不是按 B 去写断言 —— 差异本身留待决策方裁决（要么把 skeleton 收到 B，
要么把 B 改成 A 并回头补其它组件）。

### 7.5 其它缺口

- **`demo/` 目录未落地**（§6.1 要求）⇒ `a11yDemoTest` 目前走 `render` 工厂而非 `demos`。
- **按需样式子路径缺失**：`packages/ui/package.json` 的 `exports` 未声明
  `./skeleton/style.css` ⇒ 全库级基建议题，影响 `skeleton` / `divider` / `spin` 三家。
- **不支持函数式 `classNames` / `styles`**（依据 `empty-semantic-fn` 决策的建议 B）。
- L3 类型测试、L4 的消费侧断言待补。

## 8. 给后续组件的话

1. ⚠️ **往组件目录写文件前，先 `git log --oneline <base>..HEAD` + `ls`** ——
   被 429 打断的子会话**可能已经提交了**（本组件的实现就是 `e3b7238`，不是我写的）。
   `Write` 工具默认 overwrite，会静默覆盖别人的工作。
2. ⚠️ **脚手架预生成的 `packages/ui/src/index.ts` 导出清单就是契约** ——
   `interface.ts` 的导出名要与它逐字一致，否则全仓 `vue-tsc` 红 96 个错。
3. ⚠️ **`Write` 写的注释里出现 `*/`（例如写 `packages` + 星号 + `/src`）会提前闭合块注释** ——
   我在 `scripts/gen-tsconfig-refs.mjs` 上踩过一次。
