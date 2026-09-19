# space

> **层**：L3（`packages/ui`）｜ **优先级**：P0 ｜ **复杂度**：S ｜ **antd 版本**：6.6.4
>
> 契约来源：antd `es/space/index.js`（233 行）+ `es/space/Compact.js`（165 行）+
> `es/space/Addon.js`（60 行）+ `es/space/Item.js`（47 行）+ `es/space/style/{index,compact,addon}.js` +
> `es/_util/hooks/useOrientation.js` + `es/_util/gapSize.js` + `es/_util/statusUtils.js`。
> 上游是**兼容性规格**，不是代码来源。

---

## 1. 职责

设置**组件之间的间距**，并提供三种形态：

| 导出 | 作用 | 契约来源 |
|---|---|---|
| `Space` | 给子节点之间插入间距（`gap` 或 `margin`），可选分隔符 | `es/space/index.js` |
| `Space.Compact` | 让表单组件**紧凑连接并合并边框** | `es/space/Compact.js` |
| `Space.Addon` | 紧凑布局里的自定义单元格（antd@5.29.0 起） | `es/space/Addon.js` |

本组件的复杂度**不在组件本身**（三个 `.vue` 合计 742 行，没有状态机、没有受控语义、
没有异步、没有事件），而在两处：

1. **`useOrientation` 的三级优先级** —— `orientation` > `vertical`（**布尔判据**）> `direction`。
2. **`Space.Compact` 的 item context 协议** —— 这是本组件真正的对外契约。

### 1.1 `useCompactItemContext` 被 10 个下游组件消费

`Space.Compact` 自己**几乎不做样式**。它只负责算出四个量
（`compactSize` / `compactDirection` / `isFirstItem` / `isLastItem`）并广播出去；
真正把 `-compact-item` / `-compact-first-item` / `-compact-last-item` 拼到元素上的
是**下游组件自己**，用它们**自己的** `prefixCls`：

```ts
// Button / Input / Select / DatePicker / … 侧
const { compactItemClassnames } = useCompactItemContext(prefixCls, direction);
// → 'apollo-btn-compact-item apollo-btn-compact-first-item'
```

消费方共 10 个：Button / Input / TextArea / Input.Search / InputNumber / Select /
TreeSelect / Cascader / DatePicker / Dropdown.Button / ColorPicker。

所以：
- 拼出来的类名是 `apollo-btn-compact-item`，**不是** `apollo-space-compact-item`；
- 路径必须是 `space/Compact`（与 antd 同路径），下游才能照抄 import；
- **Compact 必须与 Space 同轮落地** —— 它是 `button` 的阻塞性依赖。

### 1.2 文件布局

```
space/
├── Space.vue                   # 主组件（438 行）
├── Compact.vue                 # Space.Compact 组件（204 行）
├── Addon.vue                   # Space.Addon 组件（100 行）
├── Compact.ts                  # 跨组件协议：useCompactItemContext / NoCompactStyle / CompactItem
├── Item.ts                     # Space 的每个子节点外面那层包裹（多根 Fragment）
├── context.ts                  # SpaceContext：向 Item 广播 latestIndex
├── node.ts                     # VNode 归一化（cloneVNode）+ RenderableNode
├── interface.ts                # 全部类型
├── useOrientation.ts           # 方向合并（orientation > vertical > direction）
├── gapSize.ts                  # isPresetSize / isValidGapNumber
├── statusUtils.ts              # getStatusClassNames（Addon 用）
├── index.ts                    # 公共导出 + 静态别名 Space.Compact / Space.Addon
├── style/
│   ├── token.ts                # Component Token（**空**）+ SPACE_GAP_ALIASES
│   └── index.ts                # (prefixCls) => CSS 文本（53 条规则）
├── demo/                       # 15 个 demo，与 antd 的**用户可见** demo 一一对应
├── __tests__/                  # L1 / L3 / L4 / L5 + theme + demo 冒烟
└── index.zh-CN.md / index.en-US.md
```

### 1.3 它**不**依赖组件目录

`import` 全部指向叶子模块：`../config-provider/context`、`../config-provider/size-context`、
`../_internal/use-merge-semantic`、`../_internal/with-install`、`@apollo-design/utils`。
没有任何 `import ... from '../button'` 这类边 —— `registry` 里 space 的
`dependencies.components` 只有 `config-provider`，而那是**叶子模块**依赖，不是组件依赖。

---

## 2. 公共 API

完整表格见 [`index.zh-CN.md`](./index.zh-CN.md)。三处需要在这里点明的：

### 2.1 `SpaceCompact` / `SpaceAddon` 是**额外**导出的

antd 只导出 `Space`，`Compact` / `Addon` 通过静态属性访问。Vue 的模板里没有
`<Space.Compact>` 这种写法，所以：

```ts
export const SpaceCompact = withInstall(CompactComponent);   // 具名导出：模板里能用
export const SpaceAddon = withInstall(AddonComponent);
export const Space = Object.assign(withInstall(SpaceComponent), {
  Compact: SpaceCompact,                                     // 静态别名：render 函数 / JSX 能用
  Addon: SpaceAddon,
});
```

⚠️ `Object.assign` 而不是「先声明再赋值」：`Object.assign` 的返回值是**交叉类型**，
于是 `Space.Compact` 在类型层可见。裸赋值（`Space.Compact = …`）不会更新 `Space` 的类型，
下游写 `Space.Compact` 会报 `TS2339`。

### 2.2 `Orientation` **不**从 barrel 导出

antd 从 `_util/hooks` 导出它而不是从 `space`。我们的 barrel 已经从 `./divider`
导出了同名类型，再导一次会冲突。所以 `interface.ts` 本地声明 + 不从 barrel 导出
（差异 D3）。

### 2.3 `children` 不在 Props 里（规则 C19）

antd 的 `children?: React.ReactNode` 在 Vue 侧是默认插槽 `SpaceSlot`。
`Item` / `CompactItem` 的内部件则**故意**用 `node` prop 而不是插槽 ——
插槽只能拿到数组，而 `isEmptyVNode([])` 为真（`[].every(...)` 恒真），
于是「插槽没内容」与「子节点是空占位」会被混成同一条分支。用 prop 传节点把
「每个 Item 恰好一个子节点」这条隐含前提写成了代码。详见 `Item.ts` 的文件头。

---

## 3. 十条最容易写错的判据（全部已被 compat 用例钉住）

### 3.1 `vertical` 未传 ≠ `false`（PITFALLS 46 / D21）

Vue 的 Boolean prop 转换：只要 prop 的**运行时类型**含 `Boolean` 且调用方没传、
也没有 `default`，Vue 就把它赋成 `false`。而 `useOrientation` 的判据是
`typeof vertical === 'boolean'` —— 它把「未传」与「显式传 false」当作两条**不同**的分支。

所以 `Space.vue` / `Compact.vue` 的 `withDefaults` 里 `vertical: undefined`
**不是冗余**：删掉它，`<Space direction="vertical" />` 会走「vertical 是布尔」那条分支
得到 `horizontal` —— **旧 API 静默失效，而组件照样能渲染**。

`split` / `separator` 同理：`VNodeChild` 经 SFC 编译器解析出的运行时类型是
`[Object, String, Number, Boolean, null, Array]`（**含 Boolean**）⇒ 被转成 `false` 后
`separator ?? split` 里的 `??` 只对 `null`/`undefined` 生效，`false` 会短路掉 `split`。

### 3.2 `size` 的取值用 `??`，判据用真值（两处判据不同）

```ts
sizeFullName = props.size ?? contextSize ?? 'small'      // 取值：0 是有效值
horizontalGap = !isPresetSize(size) && isValidGapNumber(size)   // 判据：0 为假
```

`isValidGapNumber` 的第一行是 `if (!size) return false` —— **真值**判断，所以
`0` / `''` / `NaN` 走同一条短路。于是 `size: 0` 会被**取用**，只是它两条判据都为假、
最终**不产生任何 gap**（上游注释：CSS 里 gap 的默认值就是 0）。

这是最容易「顺手统一成 `||`」的地方：那样 `size: 0` 会回落到 `'small'` 并加上
`-gap-row-small` 类名。上游用例：`index.test.tsx` 的
`should render width ConfigProvider support 0`。

### 3.3 数字 gap 必须自己补 `px`（PITFALLS 32）

React 的 `dangerousStyleValue` 把 `rowGap: 10` 输出成 `10px`；Vue 运行时的 `setStyle`
只做 `style[prop] = value`，**不做单位补全** ⇒ 裸 `10` 会被浏览器与 jsdom 的 cssstyle
**静默丢弃**（DOM 结构全对、类名全对，只有 gap 是空的）。

`Space.vue` 的 `toGapLength()` 负责这件事。这里**不需要**处理 `0` —— 与 Divider 的
`toCssLength` 不同，`isValidGapNumber(0)` 为假，根本走不到这条路径。

### 3.4 `align` 的判据是 `=== undefined`，且垂直时不折

```
align === undefined && !vertical  → 'center'
否则                              → align（可能是 undefined）
```

所以垂直时不传 `align` 会**保持 `undefined`**、不产生 `-align-*` 类名。
写成真值判断（`!align`）会让垂直布局凭空多出 `-align-center`。

### 3.5 `separator ?? split`，而 Item 里的渲染判据是**真值**

两处判据不同，这是**有意**的：

| 位置 | 判据 | `separator=''` 时 |
|---|---|---|
| `Space.vue` 的 `mergedSeparator` | `??`（只对 `null`/`undefined` 回落） | 不回落，取 `''` |
| `Item.ts` 的渲染 | 真值（`index < latestIndex && separator`） | **不渲染** span |

### 3.6 `latestIndex` 的 reduce 初值是 `0`，且只统计「有内容」的子节点

```ts
childNodes.reduce((latest, child, index) => (isEmptyVNode(child) ? latest : index), 0)
```

初值 `0`（不是 `-1`）⇒ 全空时结果是 `0`，而 `0 < 0` 为假 ⇒ 不会有分隔符。
`Item` 的渲染判据也是「有内容」⇒ 不可渲染的子节点连 `-item` 包裹都没有。

⚠️ 与「渲染出空的 `-item`」区分：`<Null/>`（组件本身渲染 `null`）**是**可渲染的 ——
它的 vnode 是组件型，`isEmptyVNode` 为假 ⇒ 渲染出空的 `-item`，由 CSS
`:empty{display:none}` 隐藏。上游用例：`should render the hidden empty item wrapper`。

### 3.7 `toArray` 的 `keepEmpty` 在 Space 与 Compact 里**相反**

| 组件 | 调用 | `false` 子节点 | 为什么 |
|---|---|---|---|
| `Space` | `toArray(() => slot(), { keepEmpty: true })` | → `null`，**仍占一个下标** | React 的 `traverseAllChildren` 把 boolean 归一成 `null` 后**仍然回调一次**，所以下标要与 antd 逐一对齐 |
| `Compact` | `toArray(() => slot())` | 直接**丢弃** | antd 的 `toArray(children)` 就是这样 |

⚠️ `slots.default` 不存在时 `Space` 必须返回 `[]` 而不是把 `undefined` 交给 `toArray`：
`toArray(undefined, {keepEmpty: true})` 会补一个空占位（长度 1），而 React 的
`React.Children.forEach(undefined, …)` 是**提前返回**（`<Space />` 必须渲染出零个根节点）。

### 3.8 `Space.Compact` 的 `prefixCls` 后缀是 `'space-compact'`，Addon 是 `'space-addon'`

不传时兜底分别是 `apollo-space-compact` / `apollo-space-addon`。
⚠️ `getPrefixCls(suffix, customize)` 在 `customize` 为真时**直接返回它、不追加后缀** ——
所以传 `prefixCls="apollo"` 得到的就是 `apollo`，不是 `apollo-space-compact`。
这与 antd 的 `defaultGetPrefixCls` 一致，两侧同形。

### 3.9 `isFirstItem` / `isLastItem` 必须与**外层**上下文合取

```ts
isFirstItem = index === 0 && (!outerContext || !!outerContext.value?.isFirstItem)
```

嵌套 Compact 时，内层的首项只有在**外层也是首项**时才算首项 —— 否则内层第一项会被
削掉圆角、而它在视觉上明明在中间。`compact-nested` demo 覆盖这条。

### 3.10 开发期告警必须写在 `watchEffect` 里，且判据从 `in` 改成 `!== undefined`

antd 的告警写在**渲染体**里（每次渲染都求值一次），所以「挂载时合法、之后更新成非法」
也会告警。setup 期只求值一次会让这条差异静默。

⚠️ antd 的判据是 `!(deprecatedName in props)`；Vue 的 props 对象**恒**包含全部声明键
（未传时值为 `undefined`），`in` 恒为真 ⇒ 必须改成 `!== undefined`（D21）。

### 3.11 上游缺陷（DEFECT，D40）：`separator={0}` 会漏出一个裸文本节点

antd 的 `Item.tsx` 写的是：

```jsx
{index < latestIndex && separator && (<span className={`${prefix}-item-separator`}>…</span>)}
```

`separator === 0` 时整条 `&&` 链求值成数字 `0`，而 **JSX 会把 `0` 当作文本渲染出来** ——
机械基线里两个 `-item` 之间多了一个裸文本节点：

```html
<div class="apollo-item">a</div>0<div class="apollo-item">b</div>
```

上游的**意图**显然是「没有分隔符」（`separator=""` / `separator={null}` 都不渲染），
所以 `Item.ts` 用真 `if` 走假值分支 ⇒ `<div class="apollo-item">a</div><div class="apollo-item">b</div>`。

⚠️ **这条差异进不了 L4 的断言**：`packages/test-utils/src/dom-contract.ts:204` 的投影
只用 `template.content.children`（**只含元素节点**，注释与文本都不进契约）⇒ 两侧投影
完全相同。所以它**没有** `ALLOW` 条目 —— 不是差异不存在，是那条通道看不见它。
钉住它的是 L1 的 `index.test.ts`（断言无 span 且 `textContent === 'ab'`），
证据是机械基线 `tests/compat/baselines/space.dom.json` 的 `separator:zero`。
（这条「L4 看不见文本节点」的教训登记为 PITFALLS 120。）

---

## 4. 样式

`style/index.ts` 导出 `(prefixCls) => CSS 文本`。构建钩子
（`packages/ui/build.config.ts`）把它落成 `dist/space/style.css` 与 `dist/index.css`
（含 `apollo` / `ant` 两套前缀）。

### 4.1 规则条数（文件头声称的数目必须**可执行地**成立）

| 来源 | antd 实测 | 我们 | 差 |
|---|---|---|---|
| `Space`（`style/index.ts`） | 16 | 16 | 0 |
| `Compact`（`style/compact.ts`） | 4 | 4 | 0 |
| `Addon`（`style/addon.ts`） | 29 | **33** | **+4**（D38 展开） |
| **合计** | **49** | **53** | **+4** |

`Addon` 的 29 条 = `genCommonStyle` 的 4 条重置 + `genSpaceAddonStyle` 的 20 条 +
`genCompactItemStyle({focus:false})` 的 5 条。

⚠️ **这条表格本身踩过一次坑**：初稿写的是「Addon 34 条」，实测 antd 是 **29** 条 ——
声称的数目没有可执行判据就会随实现漂移成一句谎话。所以 `theme.test.ts` 把
**16 / 4 / 33 / 53** 四个数全部钉死（见 PITFALLS 115）。

### 4.2 +4 的来源（不是「多抄了 4 条」）

antd 的 status 段只**改写中间变量**、不额外产规则：

```css
.addon-status-error  { --addon-border-color-outlined: …; --addon-background-filled: …; }
```

我们零运行时、没有组件级 CSS 变量的可覆盖点（见 §4.4），所以把「status × variant」
**展开成复合选择器**，每种组合各占一条：

```
.addon-status-error.addon-variant-outlined
.addon-status-warning.addon-variant-outlined
.addon-status-error.addon-variant-filled
.addon-status-warning.addon-variant-filled
```

4 = 2 个 status × 2 个「消费被 status 改写的那个变量的 variant」。
`outlined` 消费 `--addon-border-color-outlined`，`filled` 消费 `--addon-background-filled`；
`borderless` / `underlined` 直接写 `border:none;background:transparent`，
**不**消费中间变量 ⇒ 不参与展开。

### 4.3 ⚠️ Addon 的「顺序即契约」（变异验证逼出来的用例）

展开成复合选择器之后，**特异性拉平了**：

| 规则 | 特异性 |
|---|---|
| `.addon-status-error.addon-variant-filled` | 0,2,0 |
| `.addon-variant-filled.addon-disabled` | 0,2,0 |

在 antd 那边两者靠的是**不同的中间变量**（一个改 `--bg-filled`、一个直接写 `background`），
展开之后只能靠**声明顺序**决胜。顺序写反 ⇒ 「filled + error + disabled」的 Addon
背景会变成 error 色而不是 disabled 色。

⚠️ 这条契约最初**没有任何断言**：把那条规则挪到 status 之前，22 条主题断言**全绿**。
顺序类契约必须显式断言「谁在谁前面」，**断言条数是抓不住它的**。
现在 `theme.test.ts` 有一条 `region` 数组逐条钉死相对顺序，还有一条断言
决胜规则的**声明内容**必须回到 `colorBorder` / `colorBgContainerDisabled`
（而不是 `colorErrorBg`）。

### 4.4 Component Token 是**空的**，而且这是契约本身

```ts
// antd：components/space/style/index.ts:7-8
// biome-ignore lint/suspicious/noEmptyInterface: ComponentToken need to be empty by default
export interface ComponentToken {}
export const prepareComponentToken: GetDefaultToken<'Space'> = () => ({});
```

`Compact`（`style/compact.ts`）与 `Addon`（`style/addon.ts`）的 `ComponentToken`
同样是空接口。所以**用户无法**通过 `theme.components.Space` 覆盖任何东西 ——
这不是我们没做，是上游本来就没有。

按「登记 0 个 token 并声称完成」与「确认它确实没有 token」是两件事的原则，
`registry/components.json` 里 space 的 `derived.tokenCount` 是 `0`，
且**不**往 `registry/tokens.json` 里加条目；`style/token.ts` 用
`prepareComponentToken` 返回 `{}` 把「空」写成代码，而不是靠「没人写」。

### 4.5 三个**内部** gap token

`genStyleHooks` 的回调里用 `mergeToken` 造了三个仅供 CSS 使用的 token：

| 别名 | 来源 | 落点 |
|---|---|---|
| `spaceGapSmallSize` | `token.paddingXS` | `var(--apollo-padding-xs)` |
| `spaceGapMiddleSize` | `token.padding` | `var(--apollo-padding)` |
| `spaceGapLargeSize` | `token.paddingLG` | `var(--apollo-padding-lg)` |

它们**不在** `ComponentToken` 里（用户覆盖不了），但是六条 gap 规则的取值来源。
三条都派生自**别名 token**，所以零运行时下可以直接落成变量引用（B7 可校验、随主题自适应）。
`SPACE_GAP_ALIASES` 是它们的唯一真源，`theme.test.ts` 逐条断言。

⚠️ `-gap-row-medium` 与 `-gap-row-middle` 是**同一条规则的两个选择器**，不是两条
（`middle` 是新名字、`medium` 是存量名字）。若有人「顺手拆成两条」，总条数会变成 55 ——
`theme.test.ts` 有一条专门的哨兵断言。

### 4.6 Space / Compact **没有** `genCommonStyle` 的重置规则

上游是 `genStyleHooks(['Space','Compact'], …, { resetStyle: false })`
（Space 的注释：*'Space component don't apply extra font style'*）。
`Addon` 走默认值，所以**有**那四条 `[class^="…"]{box-sizing:…}`。

⚠️ 这条差别的后果比看起来大：**Space 的产物里没有任何文字样式**，
所以它的字体、字号、行高**100% 继承自上下文**。写 L6 用例时必须把上下文样式钉死，
否则比出来的差异 100% 是「页面全局样式不同」而不是「Space 不同」（见 §6.3）。

### 4.7 产物里**一个字面视觉值都没有**

`theme.test.ts` 的判据是 `expect(literals).toEqual([])` —— 加一个 `#f00` 或 `4px`
都会立刻红。

这比 Divider 更强：Divider 的产物里**确实**有 4 个字面值（两个 Component Token +
antd 自己写死的 `0.06em` / `0.9em`），只能说「每个字面值都有出处」；
Space 没有字面量 Component Token，antd 也没写死任何视觉值 ⇒ 可以断言「一个都不许有」。

颜色一律走 `var(--apollo-*)`。「变量真的存在」由 `tests/build/run.mjs` 的 B7 校验
（CSS 里引用的每个 `--apollo-*` 都必须在 theme 的 `tokens.css` 里有声明）。

---

## 5. 测试

| 层 | 文件 | 用例数 | 状态 |
|---|---|---|---|
| L1 单元 | `__tests__/index.test.ts` | 123 | ✅ |
| L2 交互 | —— | —— | **n/a**（见 §5.1） |
| L3 类型 | `__tests__/type.test-d.ts`（含 20 条负例） | 44 | ✅ |
| L4 DOM 契约 | `__tests__/semantic.test.ts`（127 条，与 antd 实测产物逐节点比对） | 127 | ✅ |
| L5 无障碍 | `__tests__/a11y.test.ts`（含 15 个 demo 的 axe 扫描） | 28 | ✅ |
| L6 视觉回归 | `tests/visual`（9 个视觉用例 × 3 viewport） | 27 | ✅ |
| L7 构建 | `tests/build/run.mjs` | —— | ✅ |
| 主题矩阵 | `__tests__/theme.test.ts`（四态 + 规则条数 + 顺序契约 + Component Token） | 26 | ✅ |
| demo 冒烟 | `__tests__/demo.test.ts`（15 个） | 17 | ✅ |

实测命令与结果（全部前台跑完）：

```
vitest run --project unit        packages/ui/src/space  →  退出码 0   Tests 140 passed (140)
vitest run --project dom-contract packages/ui/src/space  →  退出码 0   Tests 127 passed (127)
vitest run --project a11y         packages/ui/src/space  →  退出码 0   Tests  28 passed  (28)
vitest run --project theme        packages/ui/src/space  →  退出码 0   Tests  26 passed  (26)
vitest run --project types        packages/ui/src/space  →  退出码 1   Tests  44 passed  (44)   ⚠️ 见 §5.2
node tests/visual/run.mjs --component space --mode compare --no-build  →  通过 27 / 27（全部 0.000% exact）
CODEBUDDY_SAFE_DELETE_ENABLED=0 node tests/build/run.mjs               →  FAIL 0（127 项，PENDING 1 = ui B6 体积预算）
pnpm run registry:check                                                →  18 checks passed, 0 warnings
```

覆盖率（`vitest run --project unit --project theme packages/ui/src/space --coverage`，
退出码 0；⚠️ 组件**不要求**覆盖率，这是主动实测的旁证，不是验收项）：

```
All files   | % Stmts 99.59 | % Branch 98.87 | % Funcs 98.79 | % Lines 100
 space      |        99.56 |         98.87 |        98.75 |       100
 space/style|          100 |           100 |          100 |       100
```

⚠️ 单跑 `--project unit` 时 `style/index.ts` 只有 10% —— 因为它是**纯 CSS 文本生成器**，
真正的执行者是 `theme` project 的 `theme.test.ts`。两个 project 合跑才是它的真实覆盖率。
`interface.ts` 是纯类型模块（零运行时代码），覆盖率显示 0% 属预期。

### 5.1 L2 为什么是 n/a

Space / Compact / Addon 都是**纯布局容器**：无事件、无状态、无受控/非受控语义、
无键盘交互、无禁用态（`Addon` 的 `disabled` 只影响**颜色**，不设 `disabled` 属性、
不拦截交互）。`TESTING.md` 的 L2 要求覆盖「鼠标 / 键盘 / 焦点 / 受控 / 禁用」六类，
这里一类都不适用。写几个 `expect(exists()).toBe(true)` 把格子填上属于反模式 A1。

⚠️ `Space.Compact` 会**改变子元素的 hover 层级**（`genCompactItemStyle` 给
`-compact-item:hover` 设 `z-index: 4`），但那是作用在**子组件自己的类名**上的，
而且截图是静态的、不会触发 hover ⇒ L6 也观测不到。它的语义由 `theme.test.ts`
钉住**选择器与顺序**（可判定），层叠结果等真实子组件落地后再补。

### 5.2 ⚠️ `--project types` 的退出码 1 是**预存在**的（PITFALLS 73）

```
TypeCheckError: Cannot find module './Addon.vue' or its corresponding type declarations.
 ❯ packages/ui/src/space/index.ts:23:28
```

`types` project 的 typecheck（`ignoreSourceErrors: false`）**不认 SFC 后缀**。
同一次运行里还有 `./Divider.vue` / `./Empty.vue` / `./Spin.vue` / `./Form.vue` /
`./FormItem.vue` / `./FormList.vue` —— 全是**基线文件**，所以这不是本组件引入的。

判据：

- `vue-tsc --noEmit -p tsconfig.json`（也就是 `lint:types`）**是 0 错误**的；
- `Types Errors: no errors`、`Tests 44 passed`；
- 退出码 1 来自 `Errors 9 errors`（Unhandled Source Error **不算** assertion failure）。

修它要动 `vitest.config.ts`（不在任何单包的 file domain 里），属**基建**议题。

### 5.3 L6 的上下文样式必须钉死（Space 的版本比 Divider 更极端）

Space **没有自己的文字样式**（§4.6，`resetStyle: false`）⇒ 它的字体、字号、行高
100% 继承自上下文。所以 `tests/visual/render/cases/shared.mjs` 里：

- `SPACE_CONTEXT_STYLE` 把 `Stage` 容器的 `font-family` **写死成具体值**
  （`sans-serif`），不能用 `inherit` —— 两侧的全局 reset 不同
  （antd 的 `reset.css` 给 `html` 的是泛型 `sans-serif`，我们的 `BASE_CSS` 给的是
  `var(--apollo-font-family)`），写 `inherit` 会让两侧继承到**不同字体**，
  表现为「每个墨点都不同但换行一致」，很容易被误判成组件画错了。
- `SPACE_LINK_STYLE` 钉住 `<a>` 的样式 —— antd 的页面 reset 会全局改链接，
  我们不会，不钉死就会把这条平台差异算进 Space 的账上。
- 所有 `style` 值都写成**字符串**：React 会给裸数字补 px、Vue 不会（PITFALLS 32），
  用字符串把这条平台差异从用例里排除掉。

> 结果：27 组（9 用例 × 1 主题 × 3 viewport）全部 `0.000% exact`。

### 5.4 视觉用例的替身（已登记为 `LIMITATIONS`）

antd 的 Space demo 依赖 Button / Input / Select / Card，但它们在本仓库**尚未实现**
（Space 在 DAG 上先于它们）。若 React 侧用 antd 的 Button、Vue 侧用原生 `button`，
比出来的差异会是「Button 的实现差异」—— 那是假阳性。

所以 9 个用例全部改用**两侧同一份**原生 `<button>` / `<input>` 替身
（`render/cases/shared.mjs` 的 `SPACE_*_STYLE`，取值是 antd 6.6.4 的默认
Button / Input 的实测值）。代价：`Space.Compact` 的**边框合并**只验证到替身上，
没验证到真实 Button / Input 的类名拼接上 —— 而后者才是 `useCompactItemContext`
真正的消费方。已登记在 `tests/visual/matrix.mjs` 的 `LIMITATIONS`
（`space·standins` / `space·state`）。

### 5.5 变异验证：8 个变异全部被捕获

| # | 变异 | 结果 |
|---|---|---|
| M1 | `useOrientation`：`typeof rawVertical === 'boolean'` → `=== true` | `unit: 2 failed \| 138 passed` |
| M2 | `separator ?? split` → `\|\|` | `unit: 1 failed \| 139 passed` |
| M3 | 删掉 `if (!size) return false` | `unit: 3 failed \| 137 passed` |
| M4 | 删掉 `toGapLength` 的 `px` 后缀 | `unit: 5 failed \| 135 passed` |
| M5 | Compact 的 `isFirstItem` 去掉外层合取 | `unit: 1 failed \| 139 passed` |
| M6 | 删掉 `toArray` 的 `keepEmpty: true` | `unit: 1 failed \| 139 passed` |
| M7 | `align` 的折叠去掉 `?? 'center'` | `unit: 3 failed \| 137 passed` |
| M8 | 把 Addon 的决胜规则挪到 status 之前 | `theme: 2 failed \| 24 passed`（补断言后） |

⚠️ **M8 首轮存活** —— 那次「22 条主题断言全绿」说明文件头声称的顺序契约当时
**没有任何断言**。补的 4 条断言见 §4.3。这是本组件唯一一个「变异验证改动了实现之外
的产物」的地方，也是它最有价值的地方。

⚠️ 变异脚本本身踩过两个坑（见 PITFALLS 117 / 118）：统计行必须能被**可靠解析**
（首版用 `startswith('Tests ')`，而 vitest 输出带 ANSI 前缀 ⇒ 每个变异都假「被捕获」）；
被 SIGKILL 会留下**已变异的工作区**（`finally` 不执行）⇒ 必须 `.mutbak` + 启动时恢复。

---

## 6. 有意差异

编号是 **`COMPATIBILITY.md` §9 的全局编号**（不是本组件的局部编号）。
其中 D5 / D6 / D21 / D22 / D27 是全库既有行，本组件只是**命中**它们；
D34–D40 是本组件新增的行。

| # | 一句话 |
|---|---|
| D5 | 我们**没有** CSS-in-JS 注入的 hash 类名（`dom-contract.ts` 做对称剔除）。本组件的 `css-dev-only-do-not-override-*` / `css-var-*` 由它覆盖 |
| D6 | 默认前缀是 `apollo`（antd 是 `ant`）⇒ `prefix-cls:no-props` / `compact:no-props` / `addon:no-props` 三条用例的差异是**有意的** |
| D21 | **Boolean prop 转换**：`VNodeChild` 类型的未传 prop 会被 Vue 转成 `false`（见 §3.1）；同一根源让 antd 的 `!(name in props)` 判据失效（见 §3.10） |
| D22 | `SpaceRef` / `SpaceCompactRef` / `SpaceAddonRef` 的 `nativeElement` 声明为可空（antd 声明为 `HTMLDivElement`，但首渲染前同样是 `null`） |
| D27 | **解构即快照**：context 值改用 `ComputedRef`。本组件的两处具体形态是 D37 / D39 |
| D34 | `useOrientation` 从 `_util/hooks`（全库共享）落到 `space/useOrientation.ts`；`divider` 已内联了自己的副本（现在两份），第三次出现时提升到 `_internal/` |
| D35 | `Orientation` 本地声明、**不**从 barrel 导出（barrel 已从 `./divider` 导出了同名类型） |
| D36 | `GenerateSemantic<SpaceSemanticType, SpaceProps>` 条件类型 → 手写的 `SpaceSemanticAllType` 接口（与 empty / divider 同形） |
| D37 | `SpaceContext` 是 `React.Context` + `Provider`（裸对象）→ `spaceContextKey`（`InjectionKey<ComputedRef<…>>`）+ `useSpaceContext()`。不这样做的话 `latestIndex` 的变化不会传导到 `Item` |
| D38 | Addon 的组件级 CSS 自定义属性 → 内联为 `border-color` / `background`，并把「status × variant」展开成复合选择器；**必须重排选择器顺序**（见 §4.3），Addon 因此是 33 条而不是 29 条 |
| D39 | `useCompactItemContext` 返回 `ComputedRef` 而不是裸值（下游 10 个组件在 `computed` 里读 `.value`） |
| D40 | **DEFECT**：`separator={0}` 时 antd 会把数字 `0` 漏成一个**裸文本节点**，我们按上游**意图**实现、不复刻（见 §3.11） |

### 6.1 跟随的上游缺陷（`COMPATIBILITY.md` §9.2.1 的 U4–U6）

这些不是「我们与 antd 不同」，而是「我们与 antd **相同**，而 antd 在这里有问题」。
它们没有 `D<n>` 编号（编号只登记差异），但必须有登记处 —— 否则会被后人当成疏漏「顺手修掉」，
从而与上游漂移、让机械 oracle 的比对失效。

| # | 位置 | 上游行为 | 我们为何跟随 | 钉住它的测试 |
|---|---|---|---|---|
| U4 | `Space.Addon` | `disabled` 只加 `-disabled` 类改颜色，**不设** `disabled` 属性、不设 `aria-disabled` | 它只是**视觉容器**，真正承载交互的是插槽里的子组件；单方面加 `aria-disabled` 会与子组件的真实可交互性矛盾。⚠️ 代价是它对辅助技术**完全不可见** —— 这是真实缺口，不是「已满足」 | `a11y.test.ts` 的「Addon 的根是裸 div，无 role / aria-*（`disabled` 也不加 `aria-disabled`）」 |
| U5 | `Space` / `Space.Compact` | 根元素是**裸 `<div>`**：无 `role`、无 `aria-*`；`-item` 上也没有 `role="listitem"` | Space 是**纯布局容器**（视觉分组），不是列表语义。挂 `role="list"` 会凭空声明一个列表结构，对屏幕阅读器反而有害。`TESTING.md` §6.2 的该行在布局容器上不可满足，语义应由消费方决定 | `a11y.test.ts` 的三条「断言**不存在**」用例 |
| U6 | `Space`（分隔符） | `-item-separator` 是裸 `<span>`，**没有** `aria-hidden` | 分隔符（`\|` / `/`）对读屏是噪音，加 `aria-hidden` 在语义上是对的 —— 但那是上游可改进项，单方面加会让 L4 的逐节点比对红 | `a11y.test.ts` 的「分隔符是**纯装饰**：不输出 `role` / `aria-hidden`」 |

其余上游观察（不构成缺陷、只是「上游这么做」）：`direction` / `split` 已是废弃 API
但仍保留并告警；`isValidGapNumber` 的真值短路刻意排除 `0`；`size` 的 `middle` 已废弃
但保留且与 `medium` 落到同一个 `-md` 类名。

---

## 7. 给后续组件的话

1. **`withDefaults` 里给 Boolean prop 写 `undefined` 默认值**（§3.1 / D21）。
   判据：任何「未传」与「显式传 false」语义不同的布尔 prop 都要照做。
   本条在本组件里有 **3 个**受影响的 prop（`vertical` / `split` / `separator`）。
2. **同一个量若有两处判据（取值 vs 落地），要确认它们**不同**是上游的原意**（§3.2）。
   「统一成 `??` 或统一成 `||`」都会破坏一条上游用例。
3. **内联样式里的长度值自己补单位**（§3.3 / PITFALLS 32），并注意 `0` 是唯一不补的例外
   —— 但 `Space` 的 `0` 走不到补单位那条路径（§3.3 末尾）。
4. **CSS 的选择器层级与顺序要用 `extractStyle` 对着 antd 的真实产物写**，
   不要靠读源码推演（§4.2 / §4.3）。
5. **声称的规则条数必须有一条可执行断言**（§4.1 / PITFALLS 115）。
   否则它会在某次「顺手重构」之后变成一句谎话，而没人会发现。
6. **顺序类契约不能靠条数断言**（§4.3 / PITFALLS 116）。
   必须显式断言「谁在谁前面」——条数不变、顺序写反，是条数断言看不见的。
7. **`VNodeChild` 传给 `h()` 之前先 `isEmptyVNode` 收窄，再用
   `Exclude<VNodeChild, null | undefined | void>` 断言**（`node.ts`）。
   ⚠️ **不能**写成 `NonNullable<VNodeChild>` —— `void & {}` 不是 `never`，
   结果里仍留着 `void`，`h()` 照样报 TS2769（PITFALLS 114）。
8. **L6 用例里凡是「组件外」的上下文文字，`font-family` 要写死**（§5.3）。
   Space 比 Divider 更依赖这条 —— 它连自己的文字样式都没有。

---

## 8. 已知缺口

1. **`Space` 的 `size` 不读 ConfigProvider 的 `space.size` 之外的尺寸来源**：
   `Space` 自己走 `props.size ?? contextSize ?? 'small'`，其中 `contextSize` 来自
   `useComponentConfig<SpaceConfig>('space')`。`Compact` 侧走 `useSize()`，
   读的是 `ConfigProvider.componentSize`。两条路径都是 antd 的原样
   （Space 用 `space.size`、Compact 用 `componentSize`），**不是缺口** ——
   在这里列出是为了让「为什么两个组件的尺寸来源不同」有处可查。
2. **`useCompactItemContext` 的消费方（10 个组件）尚未落地** ⇒ 协议只有
   `Space.Addon` 一个真实消费者。等 Button 落地后应补一条「Button 在 Compact 里
   拼出的类名」的跨组件用例（目前 `a11y.test.ts` 只断言了 Compact **不包裹**子节点）。
3. **L6 的 dark / compact 主题未覆盖**：零运行时下 `tokens.css` 是构建期产物，
   运行时切算法依赖 ConfigProvider。已登记在 `tests/visual/matrix.mjs` 的 `LIMITATIONS`。
4. **L6 的边框合并只验证到替身**（§5.4）。
5. **`@apollo-design/ui/space/style.css` 不在 `exports` 里**：`dist/space/style.css`
   确实被构建出来了，但 `packages/ui/package.json` 的 `exports` 只暴露
   `.` / `./style.css` / `./empty/style.css`。所以按需引入只能走
   `@apollo-design/ui/style.css`（汇总）。`divider` / `spin` 同样受影响 ——
   属**基建**议题（`packages/ui/package.json` 不在本组件的 file domain 里），
   ⚠️ `divider` 的 `index.zh-CN.md` 目前写的是 `@apollo-design/ui/divider/style.css`，
   那条 import 实测 `ERR_PACKAGE_PATH_NOT_EXPORTED`。
6. **`COMPATIBILITY.md` §9.2 / §9.2.1 的追加行有撞号风险**：本组件追加的是
   `D34–D40` 与 `U4–U6`（纯追加，未改动任何既有行）。若并行流也追加了 `D34+`，
   合入时按合入顺序顺延编号即可 —— 差异的**内容**才是契约，编号只是索引。
7. **修了 `registry/tools/validate-registry.mjs` 的 E10 一处假阳性**（跨出本组件的
   file domain，见 §4.2 与 PITFALLS 119）：E10 的「硬编码圆角」正则
   `\bborder-radius:\s*(?!var\(|\$\{v\()/` 会把 `border-radius:0` 判成硬编码 ——
   而 `0` 是**结构性的方形重置**（`genCompactItemStyle` 的「中间项不要圆角」），
   上游自己就写 `borderRadius: 0`（`components/style/compact-item.ts`），
   且不存在「0 圆角」的 token 可走。
   处置：把字面量 `0` 加入豁免，**同时**修掉一处潜伏的假阳性（`\s*` 能匹配零字符 ⇒
   `border-radius: var(--x)`（冒号后有空格）也会被误判）。⚠️ 这是**收紧了正确性**、
   不是放宽标准：`0.5em` / `6px` / `50%` 仍然全部命中（12 条正则用例逐条验证）。
   之所以值得修而不是让组件绕开：`genCompactItemStyle` 会被 Button / Input / Select /
   DatePicker / … 共 10 个 Compact 消费方复用，每一个都会撞上这条假阳性。
