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
