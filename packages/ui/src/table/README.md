# Table 实现说明（XL · 分片交付中）

## 1. 对应 antd 组件

- antd 6.6.4 `es/table/`（构建产物 3936 行 / 80 文件 —— 全仓最复杂组件）
- rc 内核：@rc-component/table@1.11.1（Table.js 692 + Body ~450 + Cell ~300 + Header ~200 + useColumns ~800）
- 分析产物：`docs/analysis/table.md`（T0–T7 八片计划；T0 引擎事实源已完成）
- 复用的本仓资产：pagination / spin / checkbox / radio / dropdown / menu / empty / tree conductCheck、`use-merge-semantic`、`color-composite`
- 样式：antd 真实产物 SSR 提取（`tests/visual/debug/extract-table-css.mjs`：**200 条规则 / 194 唯一选择器 / 37 条组件 token**）机械移植

## 2. 文件结构（两层，同 tree/cascader 范式）

```
table/
├── Table.ts            # antd 层主组件（杂项 hooks 合集 + 组装）
├── ExpandIcon.ts       # button 形态展开图标（aria-label/aria-expanded）
├── interface.ts        # antd 类型全量移植（ColumnsType/ExpandableConfig/...）
├── util.ts             # renderColumnTitle / safeColumnTitle / getPaginationSize（L1）
├── engine/             # rc-table 引擎（Vue 移植）
│   ├── Table.ts        # rc Table.js + FixedHolder + StickyScrollBar
│   ├── Body.ts         # Body/BodyRow/ExpandedRow/MeasureRow/MeasureCell
│   ├── Cell.ts         # rc Cell + useCellRender（rowSpan/ellipsis/fixed 全形态）
│   ├── Header.ts       # Header/HeaderRow（colSpan/rowSpan 分组表头解析）
│   ├── ColGroup.ts     # colgroup 宽度
│   ├── Footer.ts       # Summary/SummaryRow/SummaryCell + Panel
│   ├── context.ts      # TableContext / RowContext / SummaryContext
│   ├── hooks/          # use-columns / use-expand / use-table
│   └── utils/          # fixUtil / valueUtil / expandUtil / legacyUtil（T0 已有）
├── hooks/              # antd 层 hooks
│   ├── use-table-data.ts   # useLazyKVMap/usePagination/useFilledColumns/useTitleColumns/...
│   ├── use-sorter.ts       # useSorter（受控/非受控/多列）
│   ├── use-filter.ts       # useFilter + FilterDropdown
│   └── use-selection.ts    # useSelection（tree 联动/shift/invert/none）
└── style/index.ts      # genTableStyle / genTableTokenDecls（37 token 逐字）
```

## 3. 分片进度（docs/analysis/table.md §7 的 T0–T7）

- **T0 引擎事实源 ✅**：rc/antd 源码通读 + CSS 提取脚本 + util.ts L1
- **T1 骨架 ✅**：引擎五件套 + antd 壳 + 37 token 样式 + 21 条 L1/L2 用例全绿
- T2 展开（expandable 完整形态）/ T3 排序过滤 / T4 选择分页 / T5 固定汇总 / T6 虚拟 / T7 收口：见 registry

## 4. 与 antd 的行为差异（同步 COMPATIBILITY.md）

| # | 差异 | 分类 | 说明 |
| --- | --- | --- | --- |
| 1 | 泛型组件签名暂为 `Record<string, unknown>` 固定 | KNOWN | Vue 泛型组件表达力（AR6）验证点，T7 收口 |
| 2 | `update:*` 与语义事件同发（C11） | INTENDED | 同 radio/checkbox |
| 3 | 虚拟滚动未实现（T6） | 分片 | VirtualTable + virtual-list 契约补齐待做 |

## 5. 实现要点（最容易写错的判据）

1. **ctx getter 已解包 `.value`**：provide 对象用 `get expandableType() { return expandableType.value; }` —— 消费处**不能**再 `.value`（得 undefined，展开行静默消失；实测踩过）。
2. **哨兵引用判断必须 toRaw**：columns 数组经 ctx/props 链会被深层 reactive 代理，`SELECTION_COLUMN`/`EXPAND_COLUMN` 的引用相等判断全走 `toRaw(col)`（否则代理副本 ≠ 模块单例 ⇒ 选择列重复插入）。
3. **Dropdown 的 onMenuClick 只通知不改内部 open**：受控消费者按 `source: 'menu'` 决定是否关闭（Table 过滤菜单多选点击不关闭 —— antd `onDropdownOpenChange` 只处理 `source==='trigger'`）。
4. **Menu 的 selectable 合并是 props 优先**：`props.selectable ?? override?.selectable ?? true`（antd menu.js:85）—— Dropdown override 的 `selectable:false` 不能盖掉过滤菜单显式的 `selectable:true`。
5. **`getExpandableProps` 的 truthy 判断**：`'expandable' in props` 决定 legacy 键是否参与合并；`showExpandColumn === false ⇒ expandIconColumnIndex = -1`。
6. **测试里 Portal 内交互必须真实 Teleport**：test-utils 的 teleport stub 副本**不挂事件监听器** ⇒ `document.body.querySelector` 拿到的 DOM 点击永远无效；mount 需 `global: { stubs: { teleport: false } }`。
7. **样式 token 落点**：`--{p}-table-*` 落在根类 + `-css-var` 类（PITFALLS 342：过滤下拉走 Portal，不在 `.{p}-table` 子树 ⇒ 只有根块 var 全部静默回退）。
8. **阴影/圆角等固定几何值升级为派生 decl**（E10：规则侧硬编码值是 error 级）。

## 6. 已知缺口（分片待办，勿重复排查）

- 固定列/表头（FixedHolder 已移植，sticky offsets 联动的 L6 待 T5）
- 排序/过滤的完整 demo + 兼容登记（hooks 已实现）
- 虚拟滚动（T6）、泛型组件签名（T7）
