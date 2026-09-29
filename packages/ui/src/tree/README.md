# Tree 实现说明

## 1. 对应 antd 组件

- antd 6.6.4 `es/tree/`（Tree.js 148 薄壳 + DirectoryTree.js 147 + utils 185 + style）
- 内核参照：@rc-component/tree 1.4.0（**class 组件 1299 行 + utils 1051 行** —— 全仓最大内核；缓存 node_modules）
- 分析产物：`docs/analysis/tree.md`（§2 23 state 槽 / §2.3 gDSFP 八步 / §8 R1–R8）
- 依赖的已收口能力：`@apollo-design/virtual-list`（NodeList）、`@apollo-design/motion`（展开动画）、`locale`、`icons`（CaretDownFilled 等 8 个）
- 样式：100 条规则机械提取（`tests/visual/debug/extract-tree-css.mjs`），9 个自有 Component Token

## 2. 与 antd 的行为差异清单（同步 COMPATIBILITY.md）

| # | 差异 | 分类 | 说明 |
| --- | --- | --- | --- |
| 1 | `checkedKeys` 等四键走 `v-model` + 语义事件（expand/check/select/load）同发 | INTENDED | C11 |
| 2 | `<TreeNode>` children 形态不实现 | 同上游 | v6 deprecated + 告警 |
| 3 | `title`：slot / fn / string 三通道（C8-R2）；`icon`/`switcherIcon` 保留 fn 与 VNode | INTENDED | D111 程序化上下文 |
| 4 | rc `Tree.useTree` 保留导出（getPath） | 同上游 | 公开 API |
| 5 | `scrollTo` 支持 `{key, autoExpand, offset, align}` | 同上游 | rc TreeScrollConfig |
| 6 | 键盘 `Space` 兼容 `'Space'` 键名 | PLATFORM | jsdom 规范化 key（浏览器只发 `' '`），真实行为不变 |
| 7 | `Tree.DirectoryTree` 拆为 `DirectoryTree` 独立导出 | INTENDED | Vue 命名空间惯例 |

## 3. .ts 选择

全部 `.ts`（defineComponent + h）：Tree/NodeList/TreeNode/MotionTreeNode 为 VNode 组装型，与 tooltip/drawer 同范式；utils 纯函数层可独立 L1 直测。

## 4. Component Token（9 个）

`titleHeight` / `switcherSize` / `indentSize`（= controlHeightSM 24）/ `nodeHoverBg`（controlItemBgHover）/ `nodeHoverColor`（colorText）/ `nodeSelectedBg`（controlItemBgActive）/ `nodeSelectedColor`（colorText）/ `directoryNodeSelectedColor`（colorTextLightSolid）/ `directoryNodeSelectedBg`（colorPrimary）。
⚠️ registry 旧值 `tokenCount: 2` 与产物不符，以 extract-tree-css.mjs 对拍为准。

## 5. 实现要点（最容易写错的判据）

1. **gDSFP 八步 → computed + 拆分 watch**：受控键 watch 的触发条件逐一对齐 rc needSync；`setUncontrolled` 按键判「props 有则跳过」。
2. **MOTION_KEY 哨兵**：随机串实体注入 keyEntities + flatten 挖洞插入 MotionFlattenData；NodeList 的 `onVisibleChange` 兜底收尾（虚拟下哨兵滚出窗口）。
3. **`isLeaf` prop 是 undefined 语义**（`isLeaf === false` 恒否决）—— Vue Boolean prop 必须 `default: undefined`。
4. **data 自有字段透传**（rc `{...restProps}`）：isLeaf/disabled/icon/selectable 等由 data 直接进 TreeNode props。
5. **switcher 类条件是 `!isLeaf`（prop）**：叶子也带 `-treenode-switcher-close`（基线逐字）。
6. **checkable 自定义 span**：antd 壳传 `<span class="{p}-checkbox-inner">`；checkbox 的 aria-disabled 是**值语义**（falsy 省略），treeitem 上是字符串（基线逐字）。
7. **语义合并**：classNames 拼接（mergeClassNames）、styles 逐键浅合并 —— 对象展开会丢 ctx。
8. **Wrapper 初值**：DirectoryTree 的 selectedKeysRef 初值必须含受控 `selectedKeys`（rc useControlledState 受控初值语义）。
9. **NodeList 返回 Fragment**（量测 div + VirtualList 平铺）—— 包 wrapper 会破坏根 div 子节点数契约。
10. **VirtualList slot 是 `{item,index,style,offsetX}` 包装对象**；事件键必须 DOM 小写（onKeydown 非 onKeyDown）；Wrapper 布尔 prop 用 `default: undefined`。

## 6. 已知缺口

- 拖拽的 window 级时序在 jsdom 受限（mousedown 派发）—— 拖拽断言在 calcDropPosition L1 + 视觉层覆盖。
- axe demo 扫描已接入（expectCount=18）；G9 视觉基线待跑。

## 7. demo 替换登记

- `search.vue`：antd 用 `Input.Search`（未落地）⇒ 原生 `input` 等价替换。
- `draggable.vue`/`big-data.vue`/`virtual-scroll.vue`：antd 的拖拽落点重排逻辑等价移植（API 面 1:1）。
- `customized-icon.vue`/`line.vue`/`switcher-icon.vue`：icon 用 fn 传法（D111），与上游 vnode 产物一致。
