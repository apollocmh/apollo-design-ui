# Grid 实现说明（Row + Col）

## 1. 对应 antd 组件

- antd 6.6.4 · `es/grid/`（只读参照，H2）
- 分析产物：`docs/analysis/grid.md`（G1，先于实现存在）

## 2. 与 antd 的行为差异清单

（同步到 `COMPATIBILITY.md` §9；分类依据 AGENTS.md §4.3）

| # | 差异 | 分类 | 证据 |
|---|---|---|---|
| D6 | 前缀 `apollo-row`/`apollo-col` vs `ant-row`/`ant-col` | INTENDED（裁决 `prefix-cls-default` = A） | L4 `*:prefix-cls:no-props` |
| D5 | 无 CSS-in-JS hash 包裹类 | INTENDED（D5） | L4 全部用例 |
| D6-连带 | 响应式 flex 的 CSS 变量名 `--apollo-col-*` vs `--ant-col-*` | INTENDED（变量名含根前缀） | L4 `col:responsive-flex` |
| — | `calc(1rem / -2)` → CSSOM 化简 `calc(-0.5rem)`、`min-width:0` → `0px` | PLATFORM（序列化路径，语义等价；L4 allow） | L4 `row:gutter-string` 等 |
| — | Form 覆盖 Col `display` 的 CSS 变量机制缺失（antd 自身也无生产者，计算结果恒为 `display:block`） | 已知缺口（Form 落地时补） | docs/analysis/grid.md §3 |

无 BUG 类差异（L6 曾抓出 Row `style` prop 未合并的 BUG，已于收口前修复）。

## 3. .vue / .tsx 选择

- **`.vue` SFC ×2**（Row.vue / Col.vue）。布局容器，模板表达充分（COMPONENT-RULES.md §2）。
- `parseFlex` / `getMergedPropByScreen` 抽到 `utils.ts`（纯函数，L1 直测）。

## 4. Component Token 清单

- Row 与 Col 各 **0 个**（`prepareRowComponentToken` / `prepareColComponentToken` = `() => ({})`，与 antd 逐字一致）。
- 栅格常量 `gridColumns = 24` 非 token；media query 断点值取自 theme 默认 seed 的
  `screen*Min`（480/576/768/992/1200/1600/1920）——**主题覆盖 screen 断点不会改变
  已生成的 media query**（antd 的 cssinjs 会重算），登记为已知边界（analysis §5）。

## 5. 共享层

- 新增 `_internal/responsive-observer.ts`：responsiveArray / matchScreen /
  useResponsiveObserver（模块级单例 + matchMedia 订阅；测试重置导出
  `resetResponsiveObserverForTests`）。后续 Descriptions / Form 等复用。
- 复用 `@apollo-design/theme` 的 `useToken()`（断点值来源）。

## 6. 已知缺口

- antd demo 的 `Slider` / `Statistic`（playground）未落地：playground 用原生
  `<input type="range">` 等价替换。
- 响应式 gutter 的 L4 覆盖：React SSR（screens=null，兜底全命中）与我们 jsdom
  （真实挂载，screens=全 false）两条渲染路径语义不同，无法对称比对 —— 由 L1 的
  matchMedia mock 驱动用例覆盖（semantic.test.ts 文件头有完整说明）。
- `direction` 响应式边界：与 divider 同一取舍（快照，D27）。
