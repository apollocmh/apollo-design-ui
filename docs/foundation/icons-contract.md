# `@ant-design/icons` 契约提取（`@apollo-design/icons` 的实现依据）

> **状态**：Phase 2 / foundation `@apollo-design/icons`（`implOrder=3`）的前置产物
> **事实来源**：`@ant-design/icons@6.3.4` npm 产物（`es/` + `es/**/*.d.ts`）+ `@ant-design/icons-svg@4.6.0` 的 `es/asn/`
> **机械 oracle**：`tests/compat/baseline/icons.mjs` → `tests/compat/baselines/icons.dom.json`（34 用例 / 848 图标）
> **代码生成器**：`registry/tools/gen-icons.mjs` → `packages/icons/src/icons/`（849 个文件）
>
> 本文档只描述**契约**（签名 + 语义 + 边界行为 + 实测 DOM），不描述 antd 的实现代码。
> 实现必须由我们独立完成（`AGENTS.md` H1/H5/H6）。

---

## 1. 使用面

`@ant-design/icons` 的公开面分三类：

| 类别 | 内容 | 我们的处理 |
| --- | --- | --- |
| 848 个图标组件 | `HomeOutlined` / `AccountBookTwoTone` / … | **生成**（禁止手写 path） |
| 三个基组件 | `AntdIcon`（TwoTone）、`AntdIconLight`（其余）、`Icon`（默认导出，自定义 SVG） | 由**单一工厂** `createIcon` 统一产出，等价性见 §3.2 |
| 工具与类型 | `createFromIconfontCN` / `getTwoToneColor` / `setTwoToneColor` / `IconProvider`(Context) | 逐个重写（§4） |

### 1.1 图标构成（实测，非文档）

```
848 = Filled 251 + Outlined 447 + TwoTone 150
```

`@ant-design/icons-svg` 的 `es/asn/` 下正好 848 个文件，与 `@ant-design/icons` 导出的图标名集合
**双向零差异**（生成器自检，见 §5.1）。

### 1.2 分流依据（`function` vs `object`）

`IconDefinition.icon` 是联合类型：

```ts
((primaryColor: string, secondaryColor: string) => AbstractNode) | AbstractNode
```

- **函数形态**（150 个，恰好是 TwoTone）→ 需要 `twoToneColor` 参与求值
- **对象形态**（698 个）→ 直接渲染

实测 848/848 **零例外**，故 `typeof definition.icon === 'function'` 与上游的
「`AntdIcon` vs `AntdIconLight`」双基组件分流**恰好等价**。这是 §3.2 结论的前提。

---

## 2. 实测 DOM 契约

全部来自 `tests/compat/baselines/icons.dom.json`（`react-dom/server.renderToStaticMarkup`）。

### 2.1 生成物（848 个）

```html
<span role="img" aria-label="home" class="anticon anticon-home">
  <svg viewBox="64 64 896 896" focusable="false" data-icon="home"
       width="1em" height="1em" fill="currentColor" aria-hidden="true">
    <path d="…"></path>
  </svg>
</span>
```

要点：

- 根是 `<span>`，**不是** `<svg>`；`role="img"` + `aria-label=<kebab 名>` 承载可访问名
- 内层 `<svg>` 有 `aria-hidden="true"` 与 `focusable="false"` —— 不进可达树，也不进 Tab 序列
- `width`/`height` 是 `1em`（尺寸由字号驱动，不是像素）
- `fill="currentColor"`（颜色由消费方文字色驱动）

### 2.2 各 props 的 DOM 落点

| prop | DOM 影响 | 备注 |
| --- | --- | --- |
| `spin` | 根 span 追加 `<prefixCls>-spin` 类 | `LoadingOutlined` 隐式带 `spin` |
| `rotate` | 内层 svg 的 `style="transform:rotate(Ndeg)"` | **真值判断**：`rotate: 0` 不产生 `style` |
| `tabIndex` | 根 span 的 `tabindex` | 无 `onClick` 时**不产生**该属性 |
| `onClick` | 根 span 的 `tabindex="-1"` | 可编程聚焦，但不打断 Tab 顺序 |
| `twoToneColor` | TwoTone 图标各 path 的 `fill` | 非 TwoTone 图标上**不泄漏到 DOM** |
| `aria-label` | 覆盖根 span 的 `aria-label` | 消费方优先 |
| `role` | 覆盖根 span 的 `role` | 注意 `aria-label` 仍保留（见 §6.3） |
| `aria-hidden` | 落在根 span | 内层 svg 仍 `aria-hidden="true"` |

### 2.3 基础 `Icon`（自定义 SVG）的 innerSvgProps

`Icon` 把 `component`/`children` 包成 `innerSvgProps`：

```
width, height, fill, aria-hidden, focusable, color, class, style, viewBox
```

实测（`icon:component`）：

```html
<span role="img" class="anticon">
  <svg width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false"
       color="red" class="" viewBox="0 0 8 8" data-custom="yes">…</svg>
</span>
```

**注意 `class=""`**：空字符串类名照样输出 —— 这是 antd 的行为，不是 bug，由 L4 钉住。

### 2.4 样式模板

`renderUtils.iconStyles`（897 字符）经 `replace(/anticon/g, prefixCls)` 注入。我们的对应物是
`getIconStyle(iconPrefixCls)`，输出与上游**逐字节相同**（L1 断言）。

`components/style/index.tsx` 里另有一个 `genIconStyle`，**少 `-webkit-` 前缀**，与 `renderUtils.iconStyles`
不是同一份。图标的实际视觉契约是后者 —— 别抄错那个。

---

## 3. 关键发现

### 3.1 ⚠️ F1：Vue 的 `h()` 不做属性名归一 —— 照抄 antd 会**把图标画错**

antd 的 `normalizeAttrs` 会把 icons-svg 的 `dash-case` 属性名转成 **camelCase**：

```
fill-rule → fillRule
```

这在 React 下是**正确的**，因为 React 渲染时会把 `fillRule` 转回规范的 `fill-rule`。

但 Vue 的 `h()` 拿到的键**就是最终 `setAttribute` 的属性名**（原样写入）。照抄这段转换会产出：

```html
<path fillrule="evenodd">   <!-- 浏览器不认识这个属性 -->
```

→ `fill-rule` 丢失 → **图标形状画错**。

**这个缺陷能过构建、能过类型检查、能过所有不看属性的测试。** 它是在 L4 逐属性比对时被
`AlipayCircleFilled` 等 5 个图标抓出来的（`我们缺少属性 fill-rule="evenodd" | 我们多出属性 fillrule="evenodd"`）。

实测 icons-svg 的**完整属性词表**（848 个定义）：

| 属性 | 出现次数 | 标签 | 出现次数 |
| --- | ---: | --- | ---: |
| `d` | 1200 | `path` | 1200 |
| `viewBox` | 848 | `svg` | 848 |
| `focusable` | 848 | `defs` | 2 |
| `fill` | 438 | `style` | 2 |
| `fill-rule` | 53 | `g` | 1 |
| `fill-opacity` | 1 | | |

**没有 `class`，没有任何 camelCase 形式。** 故我们的 `normalizeAttrs` 改为**透传**
（只把 React 侧的 `className` 折回 `class`）。这是 `AGENTS.md` H3 在最小尺度上的实例。

### 3.2 ✅ 单一工厂与上游双基组件等价

上游有 `IconBase` 与 `IconBaseTwoTone` 两个基组件。实测两者的 `rootProps` **顺序完全相同**：

```
className, onClick, style, data-icon, width, height, fill, aria-hidden, ...restProps
```

且分流依据（§1.2）与 848 个定义零例外。因此我们**不需要**两个基组件：
`createIcon` 一个工厂 + `typeof definition.icon === 'function'` 分流即可。

**这不是「简化」，是等价性证明的结果** —— 如果上游哪天给 `IconBaseTwoTone` 加一个 `IconBase` 没有的
属性，这个等价性就破了。故 L4 保留了 34 个用例的双侧比对，而不是只测几个代表。

### 3.3 ⚠️ F2：`ariaLabel` 是一个**声称提供可访问名却不提供**的 prop

`Icon` 声明了 `ariaLabel?: string`，但只在 `svgProps` 里透传 → 最终 DOM：

```html
<span role="img" ariaLabel="My home" class="anticon"></span>
```

`ariaLabel` 不是合法的 HTML 属性，浏览器不认，屏幕阅读器读不到名字。React 自己会警告：

```
Warning: Invalid ARIA attribute `ariaLabel`. Did you mean `aria-label`?
```

**这是 antd 自身的缺陷**（已登记 D17）。我们的处理：映射到 `aria-label`。

### 3.4 ⚠️ F3：`iconPrefixCls` 与 `prefixCls` 是**两个独立**的开关

```js
const iconPrefixCls = customIconPrefixCls || parentContext.iconPrefixCls || defaultIconPrefixCls;
```

`iconPrefixCls` **不是**从 `prefixCls` 派生的 —— 设 `prefixCls='foo'` 后图标前缀仍是 `anticon`。
所以 D6（`prefixCls` 默认 `apollo`）**不覆盖**图标前缀，这是一个独立决策（见 D14 / §8 Q1）。

### 3.5 两处上游拼写/行为缺陷，我们**跟随**

| 项 | 上游行为 | 我们的处理 |
| --- | --- | --- |
| 告警正文 | `icon should be icon definiton, but got …`（`definiton` 少个 `i`，三处同错） | **照抄**（含错字），否则告警断言会与上游漂移 |
| 基础 `Icon` 无名字 | `children`/`component` 路径的 `<span role="img">` 没有 `aria-label`，违反 WCAG 4.1.2 | **跟随**：这里没有「名字」可推断，硬填假名比无名更糟。落点在消费方（`aria-label` / `ariaLabel`） |

---

## 4. 必须用 Vue 重设计的部分

| 上游符号 | React 语义 | Vue 侧设计 |
| --- | --- | --- |
| `Context.Provider` + `useContext` | 快照对象，靠 React 重渲染传播 | `provide` 注入**取值函数**（`() => IconContextProps`），消费侧用 `computed` 包裹 —— 否则 `prefixCls` 变更无法驱动重渲染 |
| `iconStyles` 运行时 `<style>` 注入 | `useInsertionEffect` + 全局替换 | **不注入**。导出 `getIconStyle(iconPrefixCls)` 交静态样式层（零运行时，D15） |
| `twoTonePrimaryColor` 模块级可变对象 | 全局单例 | 保留模块级单例（`twoToneColorPalette`），`getTwoToneColors()` 返回**拷贝** |
| `defaultIconPrefixCls` 全局可改 | `ConfigProvider` 写入模块级变量 | 通过 `IconProvider` 的 context 传入，不改模块级变量 |

### 4.1 `getTwoToneColor()` 的返回形态（基线钉住）

`calculated === false` 时返回**单值**（`string`），否则返回 `[主色, 副色]`。
这是上游的隐式行为，L1 用基线的 `twoToneProbe` 逐项比对，而不是自己写死常量。

---

## 5. 代码生成契约

### 5.1 生成器（`registry/tools/gen-icons.mjs`）

- **数据源**：`@ant-design/icons-svg` 的 `es/asn/<Name>.ts`
- **解析方式**：`createRequire(packages/icons/package.json)` —— 因为 `.npmrc` 设了 `hoist=false`，
  从仓库根解析不到
- **自检**：名字必须以 `Filled|Outlined|TwoTone` 结尾，未知后缀直接报错（防上游改名后静默产出垃圾）
- **tree-shaking**：每个组件带 `/*#__PURE__*/` 注解
- **幂等**：`--check` 模式比对内容 + 检出多余文件；写入模式会清理过期文件
- **实测**：`848 个图标（Filled 251 / Outlined 447 / TwoTone 150）`，写入 849 个文件；
  `--check` 幂等通过；名字集合与 oracle 双向零差异

### 5.2 生成物不入 code review

`biome.json` 的 `files.includes` 排除 `**/packages/icons/src/icons`。

### 5.3 覆盖率豁免（2026-09-16 落地，含一次踩坑）

`icons` 是生成物，`ARCHITECTURE.md` §7 已声明豁免。但「只在
`vitest.config.ts` 的 `coverage.thresholds` 里不列它」**并不够** —— 那只关掉了阈值校验，
没有关掉**采集**。`coverage.all` 默认为 `true`，849 个生成模块照样被插桩并写进
`coverage-summary.json`，而 `foundation-status.mjs --verify` 是按
`packages/icons/src/` 前缀聚合的，于是生成文件被算进 icons 的覆盖率。

实测后果（同一份测试，两种采集范围）：

| 采集范围 | statements | branches | functions | lines | `met` |
| --- | --- | --- | --- | --- | --- |
| 含 849 个生成模块 | 99.5 | 95.93 | **91.18** | 99.7 | ❌ false |
| 仅 9 个手写文件 | **100** | **100** | **100** | **100** | ✅ true |

修法：在 `vitest.config.ts` 的 `coverage.exclude` 加入 `packages/icons/src/icons/**`。
**手写文件一个都不豁免**，仍按 95 / 90 / 95 要求 —— 这是收紧而不是放宽（H8）。
生成物由 `gen-icons.mjs --check` 与 L4 的 848 图标比对保证。

排除生成目录同时把覆盖率内存占用降到可跑（此前 `--coverage` 反复被 SIGKILL）。

---

## 6. 对测试体系的影响

| 层 | 做法 | 关键点 |
| --- | --- | --- |
| L1 unit | `icons.test.ts` | `normalizeAttrs` 的 **`fill-rule` 必须原样保留**是回归用例（F1） |
| L2 interaction | `icons.test.ts` | `IconProvider` 的响应性（改 `prefixCls` 后 `nextTick` 必须重渲染）钉住 §4 的设计决策 |
| L3 type | `api.test-d.ts` | 负例**只声明不调用** —— `*.test-d.ts` 会被真执行，真调用会把类型问题伪装成运行时失败 |
| L4 dom-contract | `semantic.test.ts` | **投影全部属性**（而非 `TESTING.md` T10 的 class+aria 子集）：对图标而言 `viewBox`/`d` 就是交付物本身。实现已**提取到 `@apollo-design/test-utils`**，本包传 `profile: 'full'` —— 见 §6.3 |
| L5 a11y | `a11y.test.ts` | axe **分块扫描**（每块 100）：axe 在 jsdom 下耗时对节点数二次方增长，一次扫 848 个跑不完 |
| L6 visual | **`n/a`**（用户裁决 2026-09-16） | 本包无视觉语义、无 `demo/`；登记为**项目级缺口**，见 §8 Q2 |
| L7 build | `tests/build/run.mjs` | 产物必须无 React / `@rc-component` / `@ant-design/cssinjs` |

### 6.1 L4 为什么给两侧传**同一个** `prefixCls`

`semantic.test.ts` 给 React 与 Vue 两侧都传 `prefixCls: 'anticon'`，从而类名可**逐字**比对。

替代方案是「先渲染成 `apollo-icon` 再替换成 `anticon`」—— 那会把「我们根本没读 `prefixCls`」
这个 bug 一起归一化掉。默认前缀（`apollo-icon`）由单独的一组用例覆盖。

### 6.2 L5 的 axe 耗时曲线（实测）

| 节点数 | 单次 `axe.run` |
| ---: | ---: |
| 1 | 214ms |
| 50 | 385ms |
| 100 | 672ms |
| 200 | 2 057ms |
| 400 | 11 941ms |
| 848 | 被 SIGTERM 杀掉（>500s / OOM） |

节点翻倍、耗时约 5.7 倍。分块后总耗时 ≈ 6s，且是**全量覆盖**，不是抽样 ——
图标相关的规则都是逐节点判定的。

### 6.3 L4 实现已提取到 `@apollo-design/test-utils`（2026-09-17）

原先 `packages/icons/src/__tests__/dom-contract.ts` 是一份**包内私有**的 L4 实现，
提取的理由写在它的文件头：「`ARCHITECTURE.md` 的包边界判据是『消费者 ≥ 2 且无视觉语义』，
目前消费者只有 icons 一个，等第二个包接入 L4 时再提取」。

现在提取发生了，但触发它的**不是**第二个消费者，而是 `TESTING.md` **T2**：

> `tests/shared/` 提供共享测试契约（见 §7），组件测试必须复用，**不允许各自重写**。

`dom-contract` 是「L4 怎么投影、怎么归一化、差异怎么报」这套规则的实现 ——
它属于共享契约层，而不是某个组件的测试辅助。所以它必须住在 `test-utils`，
否则每个组件都会长出一份自己的归一化实现，而「归一化必须对称」这条性质
会在第二份实现出现的那一刻失守（不对称的归一化看起来完全正常，只是把差异悄悄吃掉）。

**行为等价性**：本包从 `profile` 未参数化（隐式「全部属性」）改为显式 `profile: 'full'`。
两档的定义是：

| 档 | 保留 | 依据 |
| --- | --- | --- |
| `contract`（默认） | 标签 + 类名 + `data-*` + `role`/`aria-*`；`id` 归一化为 `{iN}` 引用 token | `TESTING.md` T10 |
| `full` | 全部属性；`id` **原样保留** | 本节（登记偏离） |

**本包必须用 `full`**，两个理由缺一不可：
1. `viewBox` / `d` / `fill` 是交付物本身，不是「无关属性」
2. 基线里的 `props:passthrough` 用例专门断言 `id="my-icon"` 的透传 ——
   `contract` 档会把 `id` 归一化掉，那条用例会**静默**失去意义

迁移后的验证：L4 层 43 个用例（含 848 图标全量比对）逐条通过，与提取前**逐位一致**。

---

## 7. 对 `@apollo-design/icons` 公开 API 的最终决定

```
# 与上游对齐
HomeOutlined …（848 个）        createFromIconfontCN(options)
Icon / default                  getTwoToneColor() / setTwoToneColor()
IconProvider

# 本项目增量
createIcon(definition, name?)   getIconStyle(iconPrefixCls?)
DEFAULT_ICON_PREFIX_CLS         DEFAULT_TWOTONE_COLOR
useIconContext()                getSecondaryColor(primary)
getTwoToneColors() / setTwoToneColors(palette)
isIconDefinition(value)
```

不导出 `AntdIcon` / `AntdIconLight`（上游的内部基组件，见 §3.2 的等价性结论）。

---

## 8. 待裁决 → 已裁决（2026-09-16）

| # | 问题 | 裁决 | 落点 |
| --- | --- | --- | --- |
| **Q1** | 图标前缀默认值：`apollo-icon`（现实现）还是保持 `anticon`？ | **`apollo-icon`**（保持现实现） | `COMPATIBILITY.md` D14（INTENDED）；`DEFAULT_ICON_PREFIX_CLS`；L4 的「默认前缀」一组用例 |
| **Q2** | L6 视觉回归对 `icons` 是否必须做？ | **标 `n/a`，但登记为项目级缺口** | `registry/foundation.json` 的 `testLayers.L6-visual` + `layerNotes`；下表 |
| Q3 | `tests/visual/README.md` 的 Q6（基线截图是否入 git） | **仍未裁决** | `registry/source/open-decisions.mjs` 的 `visual-baseline-in-git`（不阻塞 foundation） |

### 8.1 Q1 的完整理由（为什么不是 `anticon`）

`iconPrefixCls` 与 `prefixCls` 是**两个独立开关**（§3.4），所以 D6「品牌隔离」的论证
不自动覆盖它 —— 这正是当初必须单独裁决的原因。选 `apollo-icon` 的代价是明确的：

- **代价**：存量 antd 项目里直接写死 `.anticon { … }` 的 CSS（典型是
  `vertical-align: -0.125em`）不会自动生效，迁移时需要改选择器或经 `IconProvider` 覆盖。
- **收益**：默认产物不冒用 `anticon` 这个上游类名，避免与同页面的 antd 实例互相命中；
  且与全库 `apollo-*` 前缀策略一致。
- **缓解**：`IconProvider` 可一行覆盖回 `anticon`（L4 已有「自定义 prefixCls」用例钉住）。
  即：默认品牌隔离，需要 1:1 迁移时显式声明。

### 8.2 Q2 的完整理由（为什么 `n/a` 是诚实的，而不是掩盖）

`registry/foundation.json` 的 `layerNotes` 原本写着「aria 契约与视觉一致性契约，两层都必须做」。
实际裁决为 `n/a` 的依据：

1. 本包**不产出 CSS**（`scaffold` 的 `notDo`；L7 的 B5/B7 因此是 `n/a` 而非 PENDING）。
2. 图标没有「视觉」这一层可变项 —— 它的全部视觉产出就是 SVG 属性，而
   `viewBox` / `d` / `fill` / `fill-rule` / `transform` 已经由 **L4 对 848 个图标逐属性**覆盖。
   像素比对在这里是**严格冗余**：任何能改变像素的改动都会先让 L4 变红。
3. `tests/visual/run.mjs` **尚未实现**（按 `tests/visual/README.md`，随 S8/Button 落地）。
   现在标 `done` 会是谎报。

**登记为项目级缺口**（而非「本包无需」）的含义：一旦 `tests/visual/` 落地，
需要回头评估「是否给 L0 无 CSS 包建立一条『产物即契约』的等价豁免规则」，
把这条口径从「本包特例」升级为「架构规则」。E16 要求 `n/a` 必须有 `layerNotes`，
就是为了让这个欠账可见。
