# Listy 实现说明

## 1. 对应 antd 组件

- antd 6.6.4 · `es/listy/`（87 行薄壳 + style 73 行，只读参照，H2）；
  引擎判据 `@rc-component/listy@1.2.3`（es/ 600 行）——H5 禁 rc，按 carousel-engine
  同判**自建引擎**：`packages/ui/src/listy/engine/`（registry dependencies.json 登记的
  替换落点，strategy=in-ui）
- 分析产物：`docs/analysis/listy.md`（G1–G3，先于实现存在；rc 源码逐文件对拍）
- 虚拟滚动复用 foundation：`@apollo-design/virtual-list`（completed；契约
  `docs/foundation/virtual-list-contract.md`；extra 槽做虚拟吸顶、函数式 offset
  做吸顶让位）

## 2. 与 antd 的行为差异清单

同步到 `COMPATIBILITY.md` §9.1 / §9.2。

| # | 差异 | 分类 | 证据 |
|---|---|---|---|
| D60 | ⚠️ **`direction` 不是公开 prop**：antd 的 `ListyProps` Omit 了它，方向只来自 ConfigProvider（实测：传入被上下文值覆盖） | — | L4 rtl 用例 + antd 类型 Omit |
| D61 | **虚拟模式 DOM 与 rc-virtual-list 不同**：本仓 foundation 原生滚动、无自绘滚动条（`-scrollbar` 样式段保留为无害死规则对齐产物） | PLATFORM | foundation 契约 §5.1（已登记）；L1 行为测试覆盖 |
| D62 | **`itemHeight` 是默认主题的构建期解析值**（`fontHeight + (itemPaddingBlock ?? paddingSM) * 2`）。antd 用 `useToken()` 主题响应式；本仓 token 消费静态（D50 同判）⇒ 主题覆盖 `Listy.itemPaddingBlock` 不反映到估算行高 | INTENDED | Listy.ts 文件头差异 4 |
| — | 吸顶克隆头渲染在 Filler 内层（inner 坐标 `top = scrollTop + push`），与 rc 的 Portal-to-holder（holder 坐标 `top = push`）视觉等价 | INTENDED（坐标换算等价） | engine/index.ts 注释 |

## 3. 渲染函数选型（无 .vue）

Raw / Virtual 两分支 + 吸顶克隆头由上游机械规则决定（RawList/VirtualList 的
DOM 契约），分支 + tagged data-key 的组合在渲染函数里最清晰。

## 4. Component Token 清单（2 个）

与 antd 的 `prepareComponentToken` **逐字段对齐**（规则 R7）。

| Token | 默认 | 落地形态 |
|---|---|---|
| `itemPaddingBlock` | `paddingSM` | `var(--apollo-padding-sm)`（纯别名引用 ⇒ var()，radio D46 同判） |
| `itemPaddingInline` | `padding` | `var(--apollo-padding)` |

## 5. 测试矩阵

| 层 | 文件 | 条数 | 钉什么 |
|---|---|---|---|
| L1/L2 | `__tests__/index.test.ts` | 19 | 引擎纯函数（tagged 键/聚合/扁平化/二分吸顶/push）+ Raw（data-key/分组/height/onScroll/scrollTo 三形态）+ Virtual（窗口渲染/迭代定位/组头行） |
| L3 | `__tests__/type.test-d.ts` | 10 | rowKey 双形态、group 契约、三语义槽、scrollTo 联合、ref |
| L4 | `__tests__/semantic.test.ts` | 7 | Raw 路径 byte 级（basic/group/sticky/rtl/height/semantic） |
| L5 | `__tests__/a11y.test.ts` | 4 demo | axe 0 violation |
| L6 | `tests/visual/render/cases/{react,vue}/listy.*` | 3×3 | basic / groupSticky / height |
| L7 | `__tests__/theme.test.ts` | 9 | Token var() 形态 + 样式段全量 |
| — | `tests/compat/fixtures/listy/*.json` | 3 | basic / group-sticky / virtual |

## 6. 已知边界

- 虚拟模式的吸顶克隆头依赖 `getSize` 的**实测**组头高度；行未测量前（首帧）估算
  可能抖动一次（rc 同）。
- jsdom 无布局：虚拟路径测试需桩 `clientHeight` / `offsetHeight`（virtual-list 同范）。
- `-scrollbar` 样式段在本仓是无消费者的死规则（foundation 原生滚动），保留以对齐
  antd 产物选择器集合。
