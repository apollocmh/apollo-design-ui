> 规范范围：本文件保留实现说明与历史对照证据；上游同构、旧阶段与历史 Gate 要求不再生效。现行规则见 [项目规范](../../../../AGENTS.md)，公共行为以 Apollo 组件 API 文档与测试契约为准。

# Descriptions 实现说明

## 1. 对应 antd 组件

- antd 6.6.4 · `es/descriptions/`（index 141 + Row 143 + Cell 87 + hooks 93 + style 205 行，只读参照，H2）
- 分析产物：`docs/analysis/descriptions.md`（G1，先于实现存在；SSR 探针钉死 DOM）
- 复合组件：`Descriptions.Item`（antd 的 JSX 语法糖 `props => props.children`，永不真正渲染）
- 复用基建：`useBreakpoint`（grid/hooks）+ `matchScreen`（_internal/responsive-observer）
  + `use-merge-semantic`；items.ts 是 useItems/getCalcRows 的逐行移植
- 样式：`genDescriptionsStyle()` 移植 `genDescriptionStyles` + `genBorderedStyle`

## 2. 与 antd 的行为差异清单

同步到 `COMPATIBILITY.md` §9.1 / §9.2。

| # | 差异 | 分类 | 证据 |
|---|---|---|---|
| D58 | ref 形状 `{ nativeElement }`（与 antd 一致，无 PLATFORM 差异） | — | interface.ts |
| D59 | **bordered label 文字色**：antd 实际渲染产物是 `colorTextSecondary`（0.65），与缓存 es 源码写的 `labelColor`（=colorTextTertiary，0.45）**不一致** —— 以产物为准（「产物 > 源码」，§5 优先级）；主段 `-item-label` 的 color 仍是 labelColor | UPSTREAM（源码-产物漂移） | L6（差异被像素比对揪出）+ 浏览器 computed style 实测两侧规则 |
| — | children 形态（`Descriptions.Item`）antd 已 deprecated 但保留（transChildren2Items 原样移植） | INTENDED | L1「children 形态」三条 |
| — | demo `size` 用 medium 标注默认档；deprecation 告警由 dev-warning 层发（size default / labelStyle / contentStyle 三条） | INTENDED | L1 |

## 3. 渲染函数选型（无 .vue）

`Descriptions.ts` 用渲染函数：三形态 cell 结构（plain / bordered / vertical）由
Row.js/Cell.js 的机械规则决定，模板写分支只会更绕；cell 的 style/class 组合
（4 级合并、语义槽落点）在渲染函数里最清晰。

## 3.5 Issue #31 的两条判据（都在 `items.ts`）

1. **`transChildren2Items` 必须读默认插槽**（#31.1）：
   React 的 `Descriptions.Item` 是 `props => props.children`（JSX children 落在
   `props.children`）⇒ 移植时只读 `vnode.props` 就够。但 **Vue 的语法糖正文写在
   默认插槽里**，落在 `vnode.children` 的 **`{ default: fn }` 插槽对象**上
   ⇒ 只复制 props 会出现「标签在、正文丢」。现在补 `readDefaultSlotChildren()`：
   - 只对**组件 vnode** 读（元素 vnode 的 `children` 是子节点 string/数组，不是插槽对象）；
   - 优先级：显式 `children` prop > 默认插槽（`items` 数据源仍整体优先于 children）。
2. **`span: 'filled'` 归一化后必须带 `filled: true`**（#31.2）：
   `normalizeItems` 的 filled 分支只 `return rest`（既去掉 `span` 又**没设 filled**）
   ⇒ `getCalcRows` 收不到「推入当前行后立刻收行」的标记，filled 退化成普通
   `span=1` ⇒ 跨行语义丢失。改为 `{ ...rest, filled: true }`。
   ⚠️ 两条目的旧用例会因为「行尾自动补齐」而碰巧通过 ⇒ 要用**三条目**测
   （column=3 / A(1) B(filled) C(1) ⇒ 必须是 **2 行**）。
   ⚠️ colspan 口径：**非 bordered** 是「一格一 td」；**bordered** 才是
   `label th(colSpan=1) + content td(colSpan=span*2-1)`。

## 4. Component Token 清单（10 个）

与 antd 的 `ComponentToken` 接口**逐字段对齐**（规则 R7）。

| Token | 计算方式 | 落地形态 |
|---|---|---|
| `labelBg` | `colorFillAlter` | `var(--apollo-color-fill-alter)` |
| `labelColor` | `colorTextTertiary` | `var(--apollo-color-text-tertiary)` |
| `titleColor` | `colorText` | `var(--apollo-color-text)` |
| `titleMarginBottom` | `fontSizeSM * lineHeightSM` | **构建期解析值**（浮点 hazard，switch D50 同判） |
| `itemPaddingBottom` | `padding` | `var(--apollo-padding)` |
| `itemPaddingEnd` | `padding` | `var(--apollo-padding)` |
| `colonMarginRight` | `marginXS` | `var(--apollo-margin-xs)` |
| `colonMarginLeft` | `marginXXS / 2` | `calc(var(--apollo-margin-xxs) / 2)` |
| `contentColor` | `colorText` | `var(--apollo-color-text)` |
| `extraColor` | `colorText` | `var(--apollo-color-text)` |

## 5. 测试矩阵

| 层 | 文件 | 条数 | 钉什么 |
|---|---|---|---|
| L1/L2 | `__tests__/index.test.ts` | 19 | 行切分/补齐/filled/超出压格、children 形态、4 级样式合并、函数式语义、deprecation、size 类名、attrs、ref |
| L3 | `__tests__/type.test-d.ts` | 12 | column/span 字面量、六语义槽、ref 形状、复合组件 |
| L4 | `__tests__/semantic.test.ts` | 18 | 三形态 + 补齐 + 语义化 + labelStyle（与机械基线逐节点一致） |
| L5 | `__tests__/a11y.test.ts` | 6 demo | axe 0 violation |
| L6 | `tests/visual/render/cases/{react,vue}/descriptions.*` | 4×3 | basic / bordered / vertical / size |
| L7 | `__tests__/theme.test.ts` | 11 | Token 落地形态 + 三形态样式 |
| — | `tests/compat/fixtures/descriptions/*.json` | 4 | basic / bordered / vertical / span-filled |

## 6. 已知边界

- `column` 的响应式映射在无 matchMedia 的环境（jsdom/SSR）恒「无激活断点」⇒
  落 DEFAULT_COLUMN_MAP 的兜底再兜底 = 3（与 antd 的 useBreakpoint 语义一致）。
- `span` 的响应式映射同理；未激活 ⇒ undefined ⇒ getCalcRows 按 1 处理（antd 同）。
- 超出 column 的 span：压成 restSpan + dev 告警（antd 原样）。
