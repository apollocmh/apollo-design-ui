# Transfer 穿梭框

> P5 XL · 数据录入 · 2026-10-04 收口（**第 72/72 个组件**，全量收口完成）。
> 契约来源：antd 6.6.4 `es/transfer/`（已内化，无 rc-transfer）。

## 1. 文件结构

```
transfer/
├── Transfer.ts            # 根组件：状态机 + 三段布局（Section/Actions/Section）
├── Section.ts             # 列表面板（= antd TransferSection；也作为 Transfer.List 暴露）
├── ListBody.ts            # 列表主体 + 内嵌 Pagination（expose items 供「当前页」菜单）
├── ListItem.ts            # 单行（双形态：勾选 / oneWay 删除按钮）
├── Search.ts              # 搜索框（Input + allowClear + SearchOutlined）
├── Actions.ts             # 操作按钮列（支持克隆自定义按钮元素）
├── use-data.ts            # useData：数据源按 targetKeys 拆分左右两列
├── use-selection.ts       # useSelection：勾选键受控/非受控 + 左右过滤 + 数据变化清洗
├── use-multiple-select.ts # useMultipleSelect：shift 区间多选（antd _util/hooks 机械移植）
├── interface.ts           # 类型契约（interface.d.ts + Section/ListBody 内部 props）
├── style/
│   ├── token.ts           # prepareComponentToken 逐条对齐（7 个，含 1 个派生）
│   └── index.ts           # genTokenDecls + 53 条静态规则（antd 产物机械移植）
├── demo/                  # 8 个 demo（对齐 antd 用户可见 demo）
└── __tests__/             # L2/L3/L4/L5 主题测试
```

## 2. 状态模型（与 antd 逐条对齐）

| 上游 | 本仓 | 关键判据 |
| --- | --- | --- |
| `useData` | `use-data.ts` | 右列按 targetKeys **下标**排序（不是 dataSource 顺序）；targetKeys 有而 dataSource 缺的 key 产生空洞，`filter(Boolean)` 兜底 |
| `useSelection` | `use-selection.ts` | 一份合并数组，左右各自按数据源 key 集合过滤；数据源变化时清洗不存在的键（依赖是键集合的**序列化**，不是数组引用） |
| `moveTo` | `Transfer.ts` | 过滤禁用项 → 右移 concat(targetKeys) / 左移 filter → 清对侧勾选 → onChange(newTargetKeys, direction, moveKeys) |
| `onItemSelectAll` | `Transfer.ts` | `checkAll === 'replace'` 整组替换；true 并集；false 差集 —— prevKeys 按**方向**取 |
| `useMultipleSelect` | `use-multiple-select.ts` | shift 点击对 `[prevIndex, currentIndex]` 区间做「以区间内第一个未选为准」的勾选/取消 |

⚠️ `onItemSelect` 的 shift 判据是 `e?.shiftKey`（上游从事件取 `multiple`）；受控
`selectedKeys` 时只发 `onSelectChange` 通知、**不回写**内部态。

## 3. 样式

- `tests/visual/debug/extract-transfer-css.mjs --emit-static`（React SSR dump，10 个 case 覆盖
  常规/oneWay/搜索/分页/status/自定义 actions/禁用/footer）→ 机械转换成 53 条静态规则；
- token 判定值 `--tokens`：`itemPaddingBlock = (controlHeight - fontSize*lineHeight)/2`、
  `transferHeaderVerticalPadding = ceil((controlHeightLG - lineWidth - fontHeight)/2)`；
- ⚠️ `--{p}-transfer-transfer-header-vertical-padding` 出现两次 `transfer` 是 antd 真实命名；
- genTransferStyle(rootPrefixCls) 带 `rename`（select 同款）：`ant` 前缀时仅换 transfer 自身
  的类名/变量名，跨组件引用（`.apollo-table-*` 等）不动。

## 4. 跨组件消费

Checkbox（勾选态 + oneWay 行）/ Dropdown（头部全选菜单）/ Pagination（分页模式）/ Input（搜索）/
Button（操作按钮）/ Empty（notFoundContent 走 DefaultRenderEmpty 'Transfer' 分支）。

⚠️ **Dropdown 的 `classNames.root` 才落浮层**：antd 的 `<Dropdown className>` 同样落浮层
（SSR DOM 里看不到 `header-dropdown` 类），不是触发器 —— 触发器类名是 `${prefixCls}-trigger`。
⚠️ **Checkbox/Input 的 `className` prop 落根**：传 `class` 会经 attrs 落到**内层 input**，
类名链必须走 `className`。

## 5. 收口要点（踩坑沉淀）

1. **`useDisabled(props.disabled)` 传值丢响应性**（仓级 bug，本次修复）：旧签名收裸值在
   setup 期一次性解包，Button 的表现为「disabled 一旦为 true 就再也解不锁」（Action 按钮的
   可用态不随勾选更新）。修复：签名改 `MaybeRefOrGetter`（toValue），四个传值调用点
   （Button/TreeSelect/Form/Cascader）改传 getter `() => props.disabled`。
2. **`cloneEvent` 的 `type` 必须是自有属性**（input/engine/common-utils，本次修复）：
   `Object.create(event, {...})` 的派生对象在 jsdom 30 下读 `type` 抛
   `TypeError: 'get type' called on an object that is not a valid instance of Event`
   —— Transfer.Search 的 `e.type === 'click'`（allowClear 判据）整条 onChange 链会炸。
   克隆时从真事件取 `type` 落成自有属性。
3. **`-list-` 只是类名前缀**：没有 `.apollo-transfer-list` 元素本体，测试按 section 定位。
4. **antd 6 无 `render` 时条目 text span 为空**，文本由 `li[title]` 承载（SSR 逐字对拍）——
   别「顺手」把 title 塞进 text span。
5. **`showSelectAll` 默认 true**（上游解构默认值）；漏掉会让头部全选区整块消失，且行内
   checkbox 与头部 checkbox 同类名（`-list-checkbox`），测试选择器易误配。
6. **ListBody 渲染 fragment（根是数组）** ⇒ Vue attrs 无法继承 ⇒ 传未声明 props 会触发
   `Extraneous non-props attributes` warn（demoTest 对 warn 零容忍）—— 只传声明过的 props。
7. **Actions 空文案不给 slot**：React children=undefined ⇒ 无内容子节点 + `-icon-only`；
   Vue 侧 slot 函数恒存在会让 Button 的 childNodes 判定失效。
8. **图标类名平台差异**：`anticon anticon-{name}` vs `apollo-icon apollo-icon-{name}`（D23，
   rate/typography 同族）—— dom-contract 的 ALLOW 逐条列出（共 30 用例）。
9. **a11y 增强（超出 antd）**：header/条目 checkbox 的原生 input 经 attrs 透传 `aria-label`
   （全选文案/条目 title），否则 axe `label` 规则违规。
10. **rtl 未实现**：未消费 ConfigProvider 的 direction（根缺 `-rtl`、Actions 图标不翻转、
    Checkbox/Empty 缺 `-rtl`）—— 基线里没有 rtl 用例，登记 KNOWN-GAPS。

## 6. 测试矩阵

| 层 | 文件 | 用例 | 说明 |
| --- | --- | --- | --- |
| L2 | index.test.ts | 33 | 结构/勾选/移动/oneWay/搜索/filterOption/分页/受控/rowKey/render/footer |
| L3 | type.test-d.ts | 32 | 枚举/正例/负例（逆变、字面量收窄）/语义结构/运行时形态 |
| L4 | semantic.test.ts | 31 | 基线 30 用例 + CASES 覆盖对拍；ALLOW 逐条（图标命名 + aria-label） |
| L5 | a11y.test.ts | 19 | demo axe ×8 + 配置 axe ×8 + ARIA 契约 ×3 |
| 主题 | theme.test.ts | 11 | 四态/变量形态/前缀 rename/7 token 逐字/无字面颜色 |

基线再生成：`node tests/compat/baseline/transfer.mjs`；校验：`node tests/compat/runner/index.mjs --component transfer`。

## 7. 已知缺口

- ~~**rtl**：未消费 `direction`~~ ✅ 已闭合（2026-10-04）：Transfer 的 rtl 链本就完整
  （根 `-rtl` + Actions 按 direction 翻转 + Checkbox/Empty 各自消费 direction）；本次
  把 `config:direction-rtl` 基线用例加回（32 条），并顺手补上 Dropdown 触发器的
  `-rtl` 类与默认 placement 的 rtl 翻转（antd dropdown.js:108/140 逐字）；
- ~~**tree-transfer / table-transfer**~~ ✅ 已复刻（2026-10-04）：`demo/tree-transfer.vue`
  （Tree 列表体）与 `demo/table-transfer.vue`（Table 列表体），均走 `renderList` 通道，
  demoTest expectCount 8 → 10；
- ~~**semantic source/target 方向子结构**~~ ✅ 已实现（2026-10-04）：`classNames` /
  `styles` 的 `source` / `target` 子结构按 antd 逐字合并（index.js:250-265 —— 区块
  键 clsx 拼接 / 对象合并，左列吃 source、右列吃 target），L2 有两条用例钉住。
