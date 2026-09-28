# tree 分析（G1）

> 契约来源：antd 6.6.4 `es/tree/`（Tree.js 148 / DirectoryTree.js 147 / utils 185 / style）。
> rc 侧：`@rc-component/tree` 1.4.0（class 组件，**3046 行** + utils **1051 行** —— 全仓最大的内核）。
> **产物是判据，不是代码来源**（H2/H3）。

## 1. 结构判定：rc-tree class 内核 + antd 薄壳 + DirectoryTree 变体

```
antd Tree (Tree.js 148 行)
  ├─ RcTree (@rc-component/tree, class, 1299 行)      ← 全部状态机 / 拖拽 / 键盘 / 虚拟滚动
  │    └─ NodeList (248)                              ← VirtualList + 展开 motion diff
  │         └─ MotionTreeNode (108) / Indent (24) / DropIndicator (35)
  └─ DirectoryTree (147)                              ← File/Folder 图标 + shift/ctrl 多选
Tree.TreeNode = rc TreeNode（v6 仍挂但 children 形态已 deprecated）
Tree.useTree   = rc useTree
```

⇒ 本仓要写：① rc-tree 内核的 Vue 等价物（状态机 + 工具函数 + NodeList/Motion/Indent）；
② antd 薄壳；③ DirectoryTree 变体。**纯函数层（treeUtil 350 + conductUtil 209 + util 280
+ diffUtil 37 ≈ 876 行）必须整体自研**（H5 禁 rc 依赖），它们是可独立 L1 直测的。

## 2. rc-tree 内核（Tree.js，class 组件）关键判据（行号对 1.4.0 产物）

### 2.1 defaultProps（:33-44）

`showLine=false / showIcon=true / selectable=true / multiple=false / checkable=false /
disabled=false / checkStrictly=false / draggable=false / defaultExpandParent=true /
autoExpandParent=false / defaultExpandAll=false / default*Keys=[] / allowDrop=()=>true /
expandAction=false`。

### 2.2 state（23 个槽，:42-88）

```
keyEntities / indent / selectedKeys / checkedKeys / halfCheckedKeys /
loadedKeys / loadingKeys / expandedKeys / treeData / flattenNodes / activeKey /
listChanging（motion 进行中 ⇒ onNodeExpand 直接 return）/ prevProps / fieldNames
── 拖拽 9 槽 ──
draggingNodeKey / dragChildrenKeys / dropTargetKey / dropPosition（inside 0, top -1, bottom 1）
/ dropContainerKey / dropLevelOffset / dropTargetPos / dropAllowed / dragOverNodeKey
```

### 2.3 gDSFP 主流程（:135-245）—— Vue 侧对应一组 computed/effect

1. `fieldNames`（fillFieldNames：title/key/children + `_title` 内部）
2. `treeData` 优先；`children` 形态已 **deprecated**（告警 + convertTreeToData）
3. `convertDataToEntities` → keyEntities（**额外注入 MOTION_KEY 哨兵实体**，供 motion 占位）
4. expandedKeys 三分支：受控（`autoExpandParent || 首挂 defaultExpandParent` ⇒
   `conductExpandParent` 补全祖先）/ `defaultExpandAll`（**只取有 children 的 key**）/ defaultExpandedKeys
5. `flattenNodes = flattenTreeData(treeData, expandedKeys, fieldNames)`
6. selectedKeys（selectable 时受控/default 走 calcSelectedKeys）
7. checkedKeys：`parseCheckedKeys`（对象 `{checked, halfChecked}` 或数组）→ 非 checkStrictly
   时 `conductCheck(checkedKeys, true, keyEntities)` 级联
8. loadedKeys 受控同步

### 2.4 事件

- **onNodeExpand**（:890-937）：`listChanging` 时 return；`arrAdd/arrDel` 翻转；
  `loadData` 返回 Promise —— 成功后重算 flattenNodes，**失败回滚 expandedKeys**（catch arrDel）；
  onExpand 回调 `{node, expanded, nativeEvent}`。
- **onNodeCheck**（:959+）：checkStrictly ⇒ `arrAdd/arrDel` + 返回 **对象**
  `{checked, halfChecked}`；非严格 ⇒ 「先 fill（`conductCheck([...ori, key], true)`）
  再 remove（`conductCheck(set, {checked:false, halfCheckedKeys})`）」两段式；
  [Legacy] `eventObj.checkedNodes / checkedNodesPositions / halfCheckedKeys`（tree-select 依赖）。
- **键盘**（:1014-1128，`disabled` 时整段 return）：
  `↑/↓` = offsetActiveKey(±1)；`Home/End` = 首/尾；`←` = 已展开则收起，否则 active→parent；
  `→` = 未展开则展开，否则 active→first child；`Enter` = 可展开则展开，否则（可勾选⇒勾选，
  可选中⇒选中）。activeKey 变化时 `scrollTo({key, offset: itemScrollOffset})`（onUpdated :96-104）。
- **拖拽**：onNodeDragStart/Enter/Over/Leave/End/Drop + window mouseup/dragend 兜底清态；
  `calcDropPosition`（上 1/3=-1、中 0、下 1/3=+1 的 levelOffset 计算）；拖挂起时跳过 motion
  （dragging ⇒ onMotionEnd）。

### 2.5 NodeList（:248 行）

- `VirtualList`（itemKey = `key|pos`）+ 高度 `height` / `itemHeight` / `virtual` / `scrollWidth`
- **motion diff**：`findExpandedKeys(prev, next)` 找到「刚展开/收起」的那个 key →
  `getExpandRange` 取可见子树范围（虚拟下只取 `ceil(height/itemHeight)+1` 条）→
  在 transitionData 里插入 **MotionFlattenData 哨兵**（MOTION_KEY，随机每次 module load）→
  MotionTreeNode 用 CSSMotion 播放 show/hide；`listChanging` 在 start/end 间翻转。
- 隐藏的 indent 量测 div（`aria-hidden` + position:absolute + height:0）。

### 2.6 ARIA / 焦点

rc 自述「TODO: Fully accessibility support」（:2）—— 现状：根 `tabIndex=0`（focusable）、
键盘全套、`activeKey`；`domProps = pickAttrs(...)` 透传。**没有 role=tree/treeitem**（上游就这么少，
L5 以「键盘可达 + active 滚动跟随」为契约，不虚构 role）。

## 3. antd 薄壳（Tree.js 148 行）六件事

1. 默认值覆盖：`showIcon = false`（**与 rc 相反**）、`blockNode = false`、`checkable = false`、
   `selectable = true`；`disabled ?? DisabledContext`
2. motion：`customMotion ?? { ...initCollapseMotion(rootPrefixCls), motionAppear: false }`
   （动效名 `{rootPrefixCls}-motion-collapse`，即 `apollo-motion-collapse`）
3. `itemHeight = token.paddingXS / 2 + (token.Tree?.titleHeight || token.controlHeightSM)`
4. draggableConfig（:62-79）：false ⇒ false；fn ⇒ `{nodeDraggable}`；object ⇒ spread；
   **`icon` 非 `false` 时默认 `HolderOutlined`**
5. checkable ⇒ 渲染 `<span class="{p}-checkbox-inner">`（勾选框是**自定义样式**，非原生 checkbox）
6. 语义化 5 槽（root / item / itemIcon / itemTitle / itemSwitcher，**支持函数形态**）+
   `rootStyle` deprecated → `styles.root`；类名：`-icon-hide`(!showIcon) / `-block-node` /
   `-unselectable`(!selectable) / `-rtl` / `-disabled`；`switcherIcon` 经
   `utils/iconUtil.js`（loading→LoadingOutlined；叶子：showLine.showLeafIcon（vnode|fn|bool）
   / FileOutlined / `-switcher-leaf-line`；switcher prop（vnode|fn）；showLine→Minus/PlusSquare；
   默认 CaretDownFilled）

## 4. DirectoryTree（147 行）

- `defaultExpandParent = true`（显式默认）、`showIcon = true`、`expandAction = 'click'`、`blockNode: true`
- `icon = getIcon`：isLeaf→FileOutlined；expanded→FolderOpenOutlined / FolderOutlined
- **shift/ctrl 多选**：受控包装 expandedKeys/selectedKeys；ctrl(meta) ⇒ keys 直取；
  shift ⇒ `calcRangeKeys({treeData, expandedKeys, startKey, endKey})`（dictUtil 72 行）展开范围；
  `cachedSelectedKeys / lastSelectedKey` 两个 ref；`newEvent.selected = true` 恒真
- `convertDirectoryKeysToNodes` 反查 selectedNodes

## 5. ComponentToken（9 个）

`initComponentToken`（style/index.js :369-385）：`titleHeight = controlHeightSM`、
`switcherSize = titleHeight`、`indentSize = titleHeight`、`nodeHoverBg = controlItemBgHover`、
`nodeHoverColor = colorText`、`nodeSelectedBg = controlItemBgActive`、`nodeSelectedColor = colorText`；
`prepareComponentToken` 追加 `directoryNodeSelectedColor = colorTextLightSolid`、
`directoryNodeSelectedBg = colorPrimary`。
⚠️ registry 的 `tokenCount: 2` 与实际 9 个不符 —— G3 以 `extract-tree-css.mjs` 的
css-var 产物为准（G3 产物级对拍，同 tour G3 流程）。
antd shell 另消费 `token.paddingXS / 2 + titleHeight` 算 itemHeight。

## 6. Vue 化决策（按 COMPATIBILITY.md 映射；G2 定稿）

| React | Vue | 依据 |
|---|---|---|
| `checkedKeys` / `expandedKeys` / `selectedKeys` / `loadedKeys` + onCheck/onExpand/onSelect/onLoad | `v-model:checkedKeys` 等 + `update:*` + `check/expand/select/load` 语义事件同发 | C11（四个受控键全走 v-model 双发） |
| `treeData` 优先，`children` 形态 deprecated | 同构：`treeData` prop；`<TreeNode>` children 形态**不实现**（v6 已 deprecated + 告警）—— 直接对齐上游 deprecated 语义：传 children 时 dev 告警 | UPSTREAM（v6 弃用中） |
| `titleRender` / `title`（fn）| scoped slot `#title="{ node, data }"` 优先；`titleRender` prop 保留 fn | C8-R2 |
| `icon` / `switcherIcon` / `switcherLoadingIcon`（vnode\|fn） | 保留 fn 与 VNode prop（D111 程序化上下文例外；iconUtil 需要按节点态分支） | D111 |
| `draggable.icon`（vnode） | 保留 VNode | D111 |
| DirectoryTree 的 `icon=getIcon` | 本仓 DirectoryTree 同构实现（icon fn） | 同上游 |
| `Tree.TreeNode` / `Tree.useTree` | `TreeNode` 组件形态不公开（deprecated）；`useTree` **保留导出**（公开 API） | 同上游 |
| class ref（scrollTo/focus 等 10 个方法） | expose 同名方法：`scrollTo({key, autoExpand?, offset?})` / `focus` / `focusable`… | 同上游 |
| `virtual`（ConfigProvider 注入） | 读 ConfigProvider 的 virtual 配置 | 同上游 |
| `filterAntTreeNode`（:filterAntTreeNode prop 名） | 保留（rc 的 filterTreeNode 在 antd 面被改名透传） | 同上游 |

## 7. 实现顺序

1. `utils/`（**纯函数先行，L1 直测**）：treeUtil（convertDataToEntities / flattenTreeData /
   getTreeNodeProps / fillFieldNames / isLeafNode / warningWithoutKey）、conductUtil
   （conductCheck / conductExpandParent）、util（arrAdd/arrDel/parseCheckedKeys/calcSelectedKeys/
   calcDropPosition/posToArr/getDragChildrenKeys）、dictUtil（calcRangeKeys）
2. `interface.ts`（G2）—— TreeProps / TreeStepProps 无；EventDataNode / TreeSemantic ×5 槽
3. `style/token.ts`（G3）—— 9 token + extract-tree-css.mjs 对拍
4. `Tree.ts`（G4 ①）：状态机（flatten/computed + 受控四键）+ 键盘 + 勾选 + 拖拽 + scrollTo
5. `NodeList.ts`（②）：VirtualList（复用 @apollo-design/virtual-list）+ indent 量测 + motion diff
6. `TreeNode.ts`（③）/ `MotionTreeNode` / `Indent` / `DropIndicator`
7. `DirectoryTree.ts`（④）+ iconUtil
8. style/index.ts（G4 ⑤，机械提取）→ 七层测试 → docs → registry → build

## 8. 风险预登记

| # | 风险 | 核实结论 |
|---|---|---|
| R1 | VirtualList 参数面（itemKey/height/itemHeight/virtual/scrollWidth/scrollTo 协议）本仓 virtual-list 是否齐备 | ⏳ G4 前对拍 `@apollo-design/virtual-list` 的 index.d.ts（tree-select 之前 tree 是第一个消费者） |
| R2 | `conductCheck` 的 remove 两段式语义（fill 后按 halfCheckedKeys 反向回算）| rc conductUtil 209 行，逐字移植 + L1 直测；无外部依赖 |
| R3 | motion：展开动画的 diff 算法（findExpandedKeys/getExpandRange）+ MOTION_KEY 哨兵 | diffUtil 37 行可直译；哨兵 key 用随机串 + 不参与 defaultExpandAll（gDSFP 已排除） |
| R4 | 拖拽的 window 级事件与 7 个拖拽 state 槽 | 事件语义纯逻辑；`calcDropPosition` 逐字移植；拖拽测试 jsdom 受限（mousedown 派发问题，CHECKLIST segmented 期 #3），拖拽断言留 L6/交互层手动验证 |
| R5 | `expandAction` 的接线 | ✅ **已核实**（rc Tree.js :561-577）：消费点在 **Tree 的 onNodeClick / onNodeDoubleClick**（`'click'` / `'doubleClick'` ⇒ triggerExpandActionExpand），TreeNode 不参与分流 |
| R6 | `checkable` 传入的是 **自定义元素**（`<span class="{p}-checkbox-inner">`）而非 boolean —— TreeNode 判断 `checkable !== false && checkable` 时要兼容 vnode 形态 | antd Tree.js :139-141 已核实 |
| R7 | `fieldNames`（title/key/children + `_title` 内部）与 tree-select 的耦合 | `_title` 仅 tree-select 用，本仓实现 fillFieldNames 保留字段但不公开 |
| R8 | 键盘 `Space` 键行为 | ✅ **已核实**（rc Tree.js :1120-1129）：`Space` = canCheck ⇒ onNodeCheck(翻转) ，否则 canSelect ⇒ onNodeSelect；与 `Enter`（可展开⇒展开优先）对称 |
