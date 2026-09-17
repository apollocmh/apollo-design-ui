# 组件分析：Empty

| 项 | 值 |
|---|---|
| 组件名 | `empty` |
| 导出名 | `Empty` |
| antd 版本 | 6.6.4 |
| 分组 | 数据展示 |
| 优先级 | P0 |
| 复杂度 | S |
| 分析日期 | 2026-09-17 |

## 0. 参考来源

| 类型 | 路径 |
|---|---|
| antd 产物（ESM + 类型） | `/tmp/antd-src/package/es/empty/` |
| antd 源码 | `/tmp/antd-repo/ant-design-master/components/empty/` |
| antd 测试 | `components/empty/__tests__/`（6 个文件） |
| antd demo | `components/empty/demo/`（6 个：basic / simple / customize / description / config-provider / style-class） |

⚠️ **两个 `/tmp` 副本在本轮开始时已被系统清理**，已重新抽取：
产物用 `npm pack antd@6.6.4`，源码用 `codeload.github.com/ant-design/ant-design/tar.gz/refs/tags/6.6.4`。
这是**每个会话都要先做的一步**（见交接说明）。

**已阅读的文件**：

- [x] `es/empty/index.js`（96 行，主实现）
- [x] `es/empty/empty.js`（73 行，默认 SVG）
- [x] `es/empty/simple.js`（53 行，简洁 SVG）
- [x] `es/empty/utils.js`（6 行，`getAsSolidColor`）
- [x] `es/empty/index.d.ts`（类型）
- [x] `es/empty/style/index.js`（72 行，样式）
- [x] `components/empty/__tests__/index.test.tsx` + `image.test.ts` + `semantic.test.tsx`
- [x] `components/empty/__tests__/a11y.test.ts`

## 1. 规模评估

| 指标 | 值 |
|---|---|
| antd 构建产物行数 | 300（来自 `registry/components.json` 的 `derived.antdBuildLineCount`） |
| antd 文件数 | 10 |
| demo 数量 | 6 |
| 测试文件数 | 6 |
| rc 依赖 | `@rc-component/util`（只用 `isReactRenderable`）→ 由 `@apollo-design/utils` 替代 |
| 依赖的组件 | **无** |
| 依赖的 foundation | `locale` / `theme` / `utils`（**全部 completed**） |
| 叶子模块 | `config-provider/context`（`useComponentConfig('empty')`） |
| Component Token 数 | **0 个用户可覆盖的** —— 见 §7 |
| complexity 判定 | S（与 registry 一致） |

## 2. API 面

### 2.1 Props（`EmptyProps`，逐字段对齐 `index.d.ts`）

| 名称 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `prefixCls` | `string` | 从 ConfigProvider 取，兜底 `'apollo'` | |
| `className` | `string` | — | 落在根元素 |
| `rootClassName` | `string` | — | 也落在根元素（在 `className` **之后**） |
| `style` | `CSSProperties` | — | 根元素 |
| `imageStyle` | `CSSProperties` | — | ⚠️ **@deprecated** → `styles.image`，保留并告警 |
| `image` | `VNodeChild \| string` | `PRESENTED_IMAGE_DEFAULT` | 字符串时渲染成 `<img draggable={false} alt src>` |
| `description` | `VNodeChild` | `locale.description` | **可以是 `false`** ⇒ 不渲染 description 节点 |
| `children` | `VNodeChild` | — | 渲染成 `-footer` |
| `classNames` | `{root?,image?,description?,footer?}` | — | 语义化类名 |
| `styles` | `{root?,image?,description?,footer?}` | — | 语义化样式 |

### 2.2 Events

**无**。Empty 是纯展示组件。

### 2.3 Slots

| antd | 我们 |
|---|---|
| `children` | 默认插槽 |
| `image` / `description` 是 prop（可传节点） | 保持 prop（与 antd 一致，不改成插槽） |

### 2.4 方法（Expose）

```ts
interface EmptyRef { nativeElement: HTMLDivElement }
```

antd 用 `useImperativeHandle` 暴露 `nativeElement`。Vue 侧用 `expose({ nativeElement })`。

### 2.5 静态方法 / 子组件

```js
Empty.PRESENTED_IMAGE_DEFAULT = defaultEmptyImg;  // <DefaultEmptyImg />
Empty.PRESENTED_IMAGE_SIMPLE  = simpleEmptyImg;   // <SimpleEmptyImg />
```

⚠️ 这两个是**模块级单例 VNode**（`React.createElement` 的结果），不是组件本身。
`mergedImage === simpleEmptyImg` 这个**引用相等**判据驱动了 `-normal` 类名 ——
Vue 侧必须保留同样的语义（把「默认/简洁」两个节点做成模块级常量，用 `===` 比较）。

## 3. 类型面

### 3.1 泛型签名

无泛型。

### 3.2 关键类型

- `EmptyProps` / `EmptyRef` / `EmptySemanticType` / `EmptySemanticAllType`
- `TransferLocale { description: string }` —— ⚠️ 与 `locale` 包的 `EmptyLocale` 同名同义，
  但 antd 在 empty 里**又声明了一遍**。我们的 `EmptyLocale` 已在 `@apollo-design/locale` 里，
  empty 侧直接复用，**不再重复声明**（这是有意的结构差异，登记见 §9）。

### 3.3 类型测试要点（正例与负例）

- `description` 接受 `false`（负例：不接受 `undefined` 以外的非法值）
- `image` 接受 `string | VNodeChild`
- `classNames` / `styles` 只接受 4 个键（负例：`classNames={{ body: 'x' }}` 报错）
- `nativeElement` 是 `HTMLDivElement`

## 4. DOM 结构

```
div.${prefixCls}                       ← 根（含 hashId / cssVarCls / contextClassName /
  │                                       -normal? / -rtl? / className / rootClassName /
  │                                       mergedClassNames.root）
  ├── div.${prefixCls}-image           ← mergedClassNames.image；style = {...imageStyle, ...mergedStyles.image}
  │     └── imageNode                  ← <img> 或 VNode
  ├── div.${prefixCls}-description     ← 仅当 isRenderable(des)；mergedClassNames.description
  └── div.${prefixCls}-footer          ← 仅当 isRenderable(children)；mergedClassNames.footer
```

### 4.1 稳定契约（必须对齐）

- 根元素上的类：`${prefixCls}`、`${prefixCls}-normal`（当 image 是**简洁**图时）、`${prefixCls}-rtl`
- 三个子结构类：`${prefixCls}-image` / `-description` / `-footer`
- `-description` 与 `-footer` **按需存在**（`description={false}` / 无 children 时不渲染）
- `<img>` 上有 `draggable="false"` 与 `alt`

## 5. ARIA

- **没有显式 `aria-*`**（antd 的 `a11y.test.ts` 对 Empty 只做通用检查）。
- 唯一与无障碍相关的是默认 SVG 里的 `<title>{description || 'Empty'}</title>` ——
  给 SVG 一个可读名字。
- 传字符串 `image` 时 `<img alt>` 取 `description`（字符串时）或 `'empty'`。

⚠️ 结论：**L5 判 `done` 但内容很少** —— 断言 `<title>` 的文本回退与 `alt` 的计算规则。

## 6. 行为规格

| 输入 | 行为 |
|---|---|
| 不传 `description` | `des = locale.Empty.description`（`en_US` 是 `'No data'`） |
| `description={false}` | `isRenderable(false)` 为假 ⇒ **不渲染** `-description` |
| 不传 `image` | `image ?? contextImage ?? defaultEmptyImg` |
| `image` 是字符串 | 渲染 `<img draggable={false} alt={alt} src={image}>` |
| `image === PRESENTED_IMAGE_SIMPLE` | 根元素加 `${prefixCls}-normal` |
| ConfigProvider `direction='rtl'` | 根元素加 `${prefixCls}-rtl` |

### 6.1 边界条件

- `alt` 的计算：`typeof des === 'string' ? des : 'empty'` —— **注意是 `des` 不是 `description`**，
  所以不传 description 时 `alt` 是 locale 的文案（如 `'No data'`），不是 `'empty'`。
- `description` 传 `0` 或 `''`：`typeof description !== 'undefined'` ⇒ 用传入值；
  但 `isRenderable('')` 为假 ⇒ 不渲染。⚠️ 这两条判据不同，容易写错。
- `imageStyle` 与 `styles.image` **合并**（`{...imageStyle, ...mergedStyles.image}`），
  后者覆盖前者。

## 7. Component Token

**Empty 没有用户可覆盖的 Component Token。**

`style/index.js` 用的是 `mergeToken` 出来的**内部** token：

| 内部 token | 值 |
|---|---|
| `emptyImgHeight` | `controlHeightLG * 2.5` |
| `emptyImgHeightMD` | `controlHeightLG` |
| `emptyImgHeightSM` | `controlHeightLG * 0.875` |
| `emptyImgCls` | `${componentCls}-img` |

⚠️ 这三个**不在 antd 的 ComponentToken 里**（用户无法通过 `theme.components.Empty` 覆盖），
所以我们也不暴露。`registry/tokens.json` 里 `empty` 的 `tokenStatus` 应记 **`n/a`**（附依据），
而不是 `done` —— 因为「登记 0 个 token 并声称完成」和「确认它确实没有 token」是两件事。

## 8. 依赖面

| antd | 我们 |
|---|---|
| `@rc-component/util` 的 `isReactRenderable` | `@apollo-design/utils` 的等价物（**待确认是否存在**，见 §12） |
| `clsx` | 无需 —— 用 Vue 的 `class` 绑定 |
| `useLocale('Empty')` | `@apollo-design/locale` 的 `useLocale` ✓ |
| `useComponentConfig('empty')` | `config-provider/context` 的叶子模块（**本轮新建**） |
| `useToken()` | CSS 变量（`var(--apollo-*)`）+ `theme` 包的 token 读取 |
| `useStyle(prefixCls)` → hashId/cssVarCls | **不复刻** —— 我们用静态 CSS，没有 hashId（见 §9） |
| `@ant-design/fast-color` 的 `FastColor` | `theme` 包的色彩工具（`getAsSolidColor` 的等价物，**待确认**） |

### 8.1 叶子模块的处理

`config-provider/context` 是 empty 的 `leafModules` 依赖。ConfigProvider 本身尚未实现，
但 empty 只需要其中两件事：

1. `getPrefixCls('empty', customize)` + `direction` —— 从 context 读
2. `useComponentConfig('empty')` 返回的 `image` / `className` / `style` / `classNames` / `styles`

⇒ 本轮**先落一个最小可用的 `config-provider/context.ts`**（只含这两件事），
ConfigProvider 组件本身留到它的 G 流程。这是 registry 把 `config-provider/context`
标为 `leafModules` 而不是 `components` 依赖的原因。

## 9. 差异预判

| # | 差异 | 分类 | 理由 |
|---|---|---|---|
| D1 | 不复刻 `hashId` / `cssVarCls` | INTENDED | 我们走静态 CSS + CSS 变量（H6 禁止 cssinjs），没有运行时样式注入 ⇒ 没有 hash |
| D2 | `EmptyRef` 用 `expose` 而不是 `useImperativeHandle` | PLATFORM | Vue 的心智模型 |
| D3 | `TransferLocale` 不重复声明，复用 locale 包的 `EmptyLocale` | INTENDED | 避免同一形状两处定义 |
| D4 | `classNames` / `styles` 不做 antd 的「函数式」变体 | INTENDED | antd 的 `EmptySemanticAllType['classNamesAndFn']` 允许传函数；Empty 无状态，函数式没有意义。**待裁决**（见 §12） |
| D5 | 不支持 `Empty.PRESENTED_IMAGE_*` 作为**静态属性**挂载 | PLATFORM | Vue 组件可以挂静态属性，但我们用**具名导出** `PRESENTED_IMAGE_DEFAULT` / `PRESENTED_IMAGE_SIMPLE`（Vue 生态的惯例，且 `Empty.PRESENTED_IMAGE_SIMPLE` 也可用） |

## 10. 测试矩阵

| 层 | 内容 |
|---|---|
| L1 | `des` 的三条分支（undefined / false / 值）、`alt` 的计算、`imageStyle` 与 `styles.image` 的合并顺序 |
| L2 | 无交互 —— 判 `n/a`（附依据：Empty 没有任何事件/状态） |
| L3 | `*.test-d.ts`：4 条负例（`classNames` 的多余键、`description` 的非法值等） |
| L4 | DOM 契约：根类名、三个子结构类、`-normal` 的出现条件、`description={false}` 时节点不存在、`<img>` 的 `draggable`/`alt` |
| L5 | 默认 SVG 的 `<title>` 文本；`alt` 的回退 |
| L6 | 视觉：**阻塞** —— `tests/visual` 只有 README，基线未入库（开放决策 `visual-baseline-in-git`） |
| L7 | `tests/build/run.mjs`（**当前不覆盖 packages/ui**，见 §12） |

## 11. 实现决策

1. `.vue` SFC（COMPONENT-RULES §2 的默认选择）。
2. 两个 SVG 做成 `components/EmptyImage.vue` / `components/SimpleEmptyImage.vue`，
   在 `index.ts` 里实例化成**模块级常量**以保留 `===` 语义。
3. 颜色通过 `var(--apollo-*)` 交给 CSS；`getAsSolidColor` 的「CSS 变量时原样返回」
   这条判据在静态 CSS 下**不再需要**（我们本来就把颜色交给变量）—— 登记为 D6。
4. 样式输出成静态 CSS 文本（`style/index.ts` 导出 `genEmptyStyle(prefixCls)`），
   由 ui 包的 CSS 产物汇总。

## 12. 待验证问题

1. **`@apollo-design/utils` 有没有 `isRenderable` 的等价物？** 没有就要在本包内实现
   （Vue 侧判据：`value !== null && value !== undefined && value !== false && value !== ''`）。
2. **`@apollo-design/theme` 有没有 `getAsSolidColor` 的等价物？** 若没有，按 D6 不实现。
3. **`classNames` / `styles` 要不要支持函数式？**（D4）倾不支持，等 ConfigProvider 落地时统一裁决。
4. **`packages/ui` 的样式产物怎么汇总？** `packages/ui` 目前没有 `build.config.ts`，
   `tests/build/run.mjs` 也不覆盖它 ⇒ 组件 CSS 的落地方式待定。
5. **compat runner 不存在**：`package.json` 的 `test:compat` 指向
   `tests/compat/runner/index.mjs`，但该文件**不存在**（只有 `schema.json` 与 `fixtures/button/*.json`）
   ⇒ `compatStatus` 本轮无法完成。
