# Timeline · G1 分析产物

> 契约来源：antd **6.6.4** 的 `components/timeline/`（`Timeline.tsx` 303 + `useItems.tsx` 99 +
> `style/index.ts` 275 + `style/horizontal.ts` 120）与 `es/timeline/` 产物。
> **先于实现存在**（`AGENTS.md` §2）。

---

## 0. 🚨 首要发现：**`Timeline` 是 `Steps` 的薄壳**

`Timeline.tsx:270-294` 的渲染体只有一个 `<Steps>`：

```jsx
<InternalContext.Provider value={{ rootComponent: 'ol', itemComponent: 'li' }}>
  <UnstableContext.Provider value={{ railFollowPrevStatus: reverse }}>
    <Steps
      {...restProps}
      className={clsx(prefixCls, contextClassName, className, hashId, cssVarCls, {
        [`${prefixCls}-${orientation}`]: orientation === 'horizontal',
        [`${prefixCls}-layout-alternate`]: layoutAlternate,
        [`${prefixCls}-rtl`]: direction === 'rtl',
      })}
      style={stepStyle}
      classNames={mergedClassNames}
      styles={mergedStyles}
      variant={variant}
      orientation={orientation}
      type="dot"
      items={mergedItems}
      current={mergedItems.length - 1}
    />
  </UnstableContext.Provider>
</InternalContext.Provider>
```

即：**`Timeline` 没有自己的 DOM**。它的「时间轴」观感全部来自
`Steps` + 一层 `classNames` 映射（把 `-item-title` / `-item-rail` … 换成 `timeline-*` 前缀）
+ `type="dot"` + 一份自己的样式表。

### 0.1 依赖面核查（**结论：两处 foundation 缺口，都在 `steps` 里**）

| antd 用的 | 本仓落点 | 状态 |
|---|---|---|
| `Steps`（antd 壳） | `packages/ui/src/steps`（**completed**） | ✅ 有 `type="dot"` / `orientation` / `variant` / `items` / `classNames` / `styles` |
| `steps/context` 的 **`InternalContext`**（`{rootComponent:'ol', itemComponent:'li'}`） | **不存在** | ❌ **缺口 1** |
| `@rc-component/steps` 的 **`UnstableContext`**（`{railFollowPrevStatus}`） | **不存在**（`Steps.ts` 把 `nextStatus` 硬编码传给 `Step`） | ❌ **缺口 2** |
| `@rc-component/util` 的 `isNonNullable` / `toArray` | `@apollo-design/utils` | ✅ |
| `_util/is` 的 `isNumber` | `@apollo-design/utils` | ✅ |
| `_util/hooks/useMergeSemantic` | `ui/src/_internal/use-merge-semantic.ts` | ✅ |
| `_util/warning` 的 `devUseWarning` | `@apollo-design/utils` | ✅（⚠️ 上游三参、本仓两参） |
| `genCssVar(root, 'timeline')` / `genCssVar(root, 'cmp-steps')` | **无对应物** ⇒ 手写 `--{root}-timeline-*` / `--{root}-cmp-steps-*` | ✅（splitter 先例） |
| `@ant-design/icons` 的 `LoadingOutlined` | `@apollo-design/icons` | ✅ |
| `useStyle` / `useCSSVarCls` | 无对应 hook ⇒ 直接拼 `${prefixCls}-css-var` | ✅（rate 先例） |

**两处缺口的性质**：

- **缺口 1（`InternalContext`）**：本仓 `Steps.ts:443-453` 的根元素**硬编码 `h('div', …)`**；
  `Step` 的项标签同理。`Timeline` 需要 `ol` / `li` ⇒ **必须让 `steps` 支持标签覆盖**。
- **缺口 2（`railFollowPrevStatus`）**：本仓 `Steps.ts:356` 取 `nextStatus = statuses.value[index + 1]`
  并**原样**传给 `Step`（`Step` 侧没有开关）。rc-steps 的判据是
  `status: railFollowPrevStatus ? status : nextStatus`（`Step.js:147`）——
  即「rail 的颜色跟**当前**项还是**下一**项」。`Timeline` 传 `railFollowPrevStatus: reverse`
  ⇒ **`reverse` 时 rail 跟当前项**。

🚨 **两者都是对「已 completed 的 `steps`」的改动** ⇒ 会牵动 steps 自己的 7 层门禁与视觉基线。

---

## 1. 组件面

| 上游文件 | 行数 | 本仓预判 | 形态 |
|---|---|---|---|
| `Timeline.tsx` | 303 | `Timeline.ts` | `.ts` 渲染函数（见 §4） |
| `useItems.tsx` | 99 | `use-items.ts` | 纯函数 / composable |
| `index.tsx` | 5 | `index.ts` | 导出 + `Timeline.Item`（**空壳**） |
| `style/index.ts` | 275 | `style/index.ts` | `genTimelineStyle` + `genTokenDecls` |
| `style/horizontal.ts` | 120 | `style/horizontal.ts` | 横向变体 |

⚠️ **`Timeline.Item` 是空壳**（`Timeline.tsx:297`：`Timeline.Item = (() => {}) as React.FC<…>`）
—— 它**不渲染任何东西**，只为「用了就发废弃告警」而存在。本仓照做。

## 2. 行为契约（逐条）

1. **`mergedMode`**（`Timeline.tsx:161-174`）：`'left' → 'start'`、`'right' → 'end'`；
   否则 `['alternate','start','end'].includes(mode) ? mode : 'start'`（**默认 `'start'`**）。
2. **`useItems`**（`useItems.tsx:30-96`）：
   - `parseItems`：`Array.isArray(items) ? items : toArray(children).map(ele => ({...ele.props}))`
     —— ⚠️ **children 形态是把每个元素的 props 摊出来**（React 专有；Vue 侧 `children` 是插槽，
     拿不到「props」⇒ **必须登记为 PLATFORM 差异**）。
   - 逐项转换：`title ?? label`、`content ?? children`、`icon ?? dot`、
     `placement ?? position ?? (mode === 'alternate' ? (index%2===0?'start':'end') : mode)`。
   - 🚨 **`color` 的两条分支**：命中 `['blue','red','green','gray']` ⇒ 加类
     `${itemCls}-color-${color}`；**否则**把颜色写进内联 CSS 变量
     `${varName('item-icon-dot-color')}`（⚠️ 用的是 **`cmp-steps`** 前缀的变量：
     `genCssVar(rootPrefixCls, 'cmp-steps')`）。
   - `status: loading ? 'process' : 'finish'`（⚠️ **每项恒有 status**）。
   - `loading` 且无 icon/dot ⇒ `icon = <LoadingOutlined />`。
   - `pending` 存在 ⇒ **push** 一项 `{ icon: pendingDot ?? <LoadingOutlined/>, content: pending, status: 'process' }`
     （⚠️ 这一项**没有 className / placement**）。
3. **`reverse`** ⇒ `[...rawItems].reverse()`（在 `useItems` **之后**）。
4. **`layoutAlternate`** = `mergedMode === 'alternate' || (orientation === 'vertical' && items.some(i => i.title))`
   ⇒ 根类 `-layout-alternate`。🚨 **注意 `some(i => i.title)`** —— 只要**有任一**项带 title。
5. **`titleSpan`**（`Timeline.tsx:260-268`）：`isNonNullable(titleSpan) && mergedMode !== 'alternate'` 时，
   数字 ⇒ `--{root}-timeline-head-span`；字符串 ⇒ `--{root}-timeline-head-span-ptg`。
   ⚠️ 挂在 **`Steps` 的 `style`** 上（不是 Timeline 自己的根 —— Timeline 没有自己的根）。
6. **`stepContext = { railFollowPrevStatus: reverse }`**（见 §0.1 缺口 2）。
7. **`current = mergedItems.length - 1`**（最后一项是 active）。
8. **废弃告警**（`Timeline.tsx:226-257`，**非生产环境**）：
   - `warning.deprecated(!children, 'Timeline.Item', 'items')`
   - `pending` / `pendingDot` → `items`（附加消息 `You can create a \`item\` as pending node directly.`）
   - `mode !== 'left' && mode !== 'right'` ⇒ `mode=left|right` → `mode=start|end`
   - 🚨 **逐项四项**：`label→title` / `children→content` / `dot→icon` / `position→placement`，
     判据是 **`warnItems.every(item => !item[oldProp])`** —— 只要**有任一项**用了旧 prop 就**不**告警。
9. **`classNames` 映射**（`Timeline.tsx:146-158`）：八个键
   `item` / `itemTitle` / `itemIcon` / `itemContent` / `itemRail` / `itemWrapper` / `itemSection` / `itemHeader`
   全部映射到 `${prefixCls}-*`（`timeline` 前缀）。
10. **`useMergeSemantic`** 的三路合并：`[stepsClassNames, contextClassNames, classNames]` +
    `[contextStyles, contextStyleRoot, styles, styleRoot]`。
11. **`restProps` 全量透传给 `Steps`**（`{...restProps}`）—— 即 `Timeline` 接受并转发
    `Steps` 的其余 props（`onChange` / `percent` / `size` / `responsive`…）。

## 3. 样式契约（`style/index.ts` 275 + `style/horizontal.ts` 120）

**6 个 Component Token**（registry 数据一致）。产物提取脚本待建（G4 时按
`extract-*-css.mjs` 的范式写 `extract-timeline-css.mjs`）。

⚠️ 因为 `Timeline` **没有自己的 DOM**，它的样式表大量是**覆盖 Steps 的类名**
（`.apollo-timeline-item-*` 对应 Steps 的 `-item-*`）⇒ **选择器与 Steps 高度耦合**。
这一点决定了 §4 的选型。

## 4. Vue 对应（平台差异）

- **`Timeline` 本体用 `.ts` 渲染函数**（不是 `.vue`）：它的「渲染树」就是
  `h(Steps, {...})` 加两个 Provider —— `.vue` 模板表达不了「给组件传一个 classNames 映射对象」，
  且它**没有自己的 DOM**，模板的价值为零。命中 `COMPONENT-RULES.md` §2 的条件 1
  （纯渲染函数型内部件）。⚠️ 需在 `README.md` 记理由。
- **`useItems` 用 `.ts`**（纯函数）。
- 🚨 **`children` 形态无法复刻**：上游 `toArray(children).map(ele => ({...ele.props}))`
  读的是 **React 元素的 props**。Vue 的插槽给的是 **vnode**，`vnode.props` 语义不同
  （class/style 被归一、事件名被转换）⇒ 本仓**只能支持 `items` 形态**，
  `children` 形态登记为 **PLATFORM 差异**（`Timeline.Item` 是空壳，本就不渲染）。
- **`InternalContext` / `UnstableContext`** ⇒ 见 §0.1（**需要扩展 `steps`**）。
- **`genCssVar`** ⇒ 手写 `--{rootPrefixCls}-timeline-head-span` 等。

## 5. 预判差异

| # | 差异 | 分类 |
|---|---|---|
| 1 | `Timeline` 没有自己的根 DOM（与上游一致，**不是**差异） | — |
| 2 | `children` 形态（`Timeline.Item` 子元素）不支持 —— 上游读 `element.props`，Vue 插槽没有这个语义 | PLATFORM |
| 3 | `ref` 形状：本仓统一 `{ nativeElement }`（⚠️ 但 Timeline 没有自己的根 ⇒ `nativeElement` 只能取 Steps 的根） | PLATFORM |
| 4 | `devUseWarning` 三参 → 两参 | PLATFORM |
| 5 | 无 `hashId`（D2）；`-css-var` 直接拼（D5 家族） | PLATFORM |
| 6 | 语义化槽 `classNames` / `styles` 的八键映射（⚠️ 本仓的 `Steps` 必须有对应的 `classNames` 通道） | 待核 |

## 6. 本分析**没有证明**什么

- **没有提取过产物 CSS** —— §3 的 token 数与结构来自 registry 与源码，**产物对拍是 G4 的事**。
- **没有验证 `Steps` 的 `classNames` 通道能承接这八个键** —— 这是 §0.1 之外**第三个**
  待核实的接口（`Timeline` 把八键映射塞给 `Steps` 的 `classNames`，本仓 `Steps` 是否支持
  这八个语义槽名需在 G4 逐条核对）。
- **没有裁决两处 `steps` 缺口怎么补** —— 见 §7。

## 7. 🚨 待裁决：两处 `steps` 缺口怎么补

`steps` 是 **completed** 组件。`Timeline` 需要它多两个能力：

| 方案 | 内容 | 代价 |
|---|---|---|
| **A. 扩展 `steps`**（加 `InternalContext` + `railFollowPrevStatus`） | 按上游结构，给 `Steps` 加两个内部 context / prop | 改**已 completed** 组件 ⇒ 必须重跑 steps 的 7 层 + L6 基线；但这是**与上游同构**的做法，且两个能力对 `Steps` 自身也有意义（`railFollowPrevStatus` 是 rc-steps 的既有开关） |
| **B. `Timeline` 自带 DOM** | 不复用 `Steps`，自己渲染 `ol/li` + 自己的样式 | 与上游**架构分叉**（上游是薄壳）⇒ DOM 契约要**独立对拍**（不能再借 Steps 的）；工作量最大；但**不碰** completed 的 steps |
| **C. 先做 `Timeline` 的独立部分**（`useItems` + 样式 + token + 类型 + 文档骨架），把依赖 `Steps` 的部分挂起 | 保留 registry 的 `in_progress` + `blockers` | 进度不承认；但把「不需要裁决的部分」先固化 |

⚠️ 本仓的既有约定（`ARCHITECTURE.md` §3 / AGENTS.md §4.2）要求：**跨组件的影响要单独过
它的门禁与回归**。方案 A 会动 `steps`，属「跨组件」⇒ **需要用户裁决**。
