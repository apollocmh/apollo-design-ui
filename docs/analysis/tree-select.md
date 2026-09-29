# TreeSelect 分析（antd 6.6.4）

> 分析日期：2026-09-29。来源：`/tmp/antd-src/package/es/tree-select/`（index.js 273 行薄壳 +
> style 62 行）、`@rc-component/tree-select@1.16.1`（内核 1283 行）、`@rc-component/select@1.10.1`（BaseSelect）。
> 本仓复用资产：`select/engine/BaseSelect`（optionListRenderer 插槽，Cascader 已验证）、`tree` 全组件。

## 1. 组件定位

TreeSelect = **Select 外壳 + 树型选项列表**。与 Cascader 同构：BaseSelect 负责开合/输入/
展示值/tag/清除，列表本体换成 Tree。数据通道是 `treeData`（v6 主通道），勾选走 rc-tree 的
`conductCheck` 级联。

```
antd TreeSelect (273 行薄壳)
  └─ rc TreeSelect (528 行) ─ BaseSelect(@rc-component/select)
                             └─ OptionList (347 行) ─ rc Tree（checkStrictly=true 受控勾选）
  hooks: useTreeData / useDataEntities / useCheckedKeys / useFilterTreeData
         / useSearchConfig / useCache
  utils: strategyUtil(SHOW_*) / valueUtil / legacyUtil / warningProps
```

## 2. 核心数据流（rc TreeSelect.js 528 行，10 段）

1. **值归一**：`useControlledState(defaultValue, value)`；单值 → `toArray` 包数组。
2. **fieldNames**：`fillFieldNames` → `{_title: ['title','label'], value, key, children}`；
   **key === value**（key 默认取 value 字段）——与 Tree 的 fieldNames 语义不同。
3. **数据转换**：`useTreeData`（treeData 直通 / simpleMode 平铺建树 / children 形态——
   本仓同 Tree：children 形态不实现）；`useDataEntities` 用 tree 的
   `convertDataToEntities` 建 keyEntities + valueEntities（value→entity 二次映射）。
4. **搜索**：`useSearchConfig`（showSearch 对象形态展开）；搜索时
   `useFilterTreeData` 过滤（命中节点的祖先保留，`isLeaf: undefined` 重置）。
5. **勾选补全**：`useCheckedKeys` —— treeConduction（checkable && !checkStrictly）时
   `conductCheck(checkedKeys, true, keyEntities)` 补全父子；缺失值（value 在树里不存在）
   保留透传。
6. **展示值**：`formatStrategyValues` 按 showCheckedStrategy（SHOW_ALL/SHOW_PARENT/
   SHOW_CHILD，默认 checkable ? SHOW_CHILD : SHOW_ALL）裁剪展示集合 → convert2LabelValues
   补 label（treeNodeLabelProp 或 `_title` 依次回退）→ useCache 缓存 label。
7. **triggerChange**：格式化 → maxCount 拦截 → autoClearSearchValue 清搜索 →
   onChange(mergedMultiple ? 数组 : 单值, labels, additionalInfo)。
   additionalInfo: `{preValue, triggerValue, selected|checked, triggerNode?/allCheckedNodes?(legacy getter)}`。
8. **onOptionSelect**：单选直接 triggerChange；多选 toggle + conductCheck 双向；
   `onSelect`/`onDeselect`（checkable 时是勾选语义）。
9. **onDisplayValuesChange**：tag 移除/清空 → 反向走 onOptionSelect(selected=false)。
10. **渲染**：BaseSelect(mode=multiple?) + OptionList。

## 3. OptionList（347 行）—— 内嵌 rc Tree 的判据

- **rc Tree 固定传**：`checkStrictly: true`（勾选级联由 TreeSelect 自己算，树只做受控
  显示）、`focusable: false`、`prefixCls: '{selectPrefix}-tree'`、`height=listHeight`、
  `itemHeight=listItemHeight`、`virtual: virtual !== false && popupMatchSelectWidth !== false`。
- **选中态**：checkable 时 `checkedKeys={checked, halfChecked}`；否则
  `selectedKeys=checkedKeys`（**checkedKeys 复用为选中 keys**）。
- **展开**：受控三分支 `treeExpandedKeys ?? (searchValue ? searchExpandedKeys : expandedKeys)`；
  搜索时展开全部 `getAllKeys`。
- **active**：打开时定位首个可选节点（搜索时首个命中）；单选定位当前选中。
  键盘 ↑↓←→ 代理给树，Enter 选中 active，Esc 关闭。`aria-live=assertive` 隐藏 span。
- **maxCount 禁用**：`leftMaxCount` 经 UnstableContext.nodeDisabled 注入；leafCountOnly
  （SHOW_CHILD 且非 strictly）时逐节点算剩余可勾配额（disabledCache Map）。
- **滚动**：单选打开时 `scrollTo({key: checkedKeys[0]})`。
- **空态**：`role="listbox"` + `-empty` + notFoundContent。

## 4. antd 薄壳判据（273 行）

- 三个 prefixCls：`select`（外壳复用）、`select-tree`（树）、`tree-select`（根/dropdown）。
- `treeCheckable` 传给 rc 前包成 `<span class="{selectPrefix}-tree-checkbox-inner">`。
- `listItemHeight` 默认 `controlHeightSM + paddingXXS`（24+4=28）。
- deprecated：dropdownMatchSelectWidth/dropdownStyle/dropdownClassName/popupClassName/
  dropdownRender/onDropdownVisibleChange/bordered/showArrow。
- `treeMotion: null`（rc 固定关树动画）。
- `maxCount` 与 SHOW_ALL(非strictly)/SHOW_PARENT 组合时无效（warning + 置 undefined）。
- 语义合并 useMergeSemantic（root/prefix/input/suffix/content/placeholder/item/
  itemContent/itemRemove/popup.{root,item,itemTitle,itemSwitcher}）。
- `treeNodeFilterProp` 默认 `'value'`（注意：Tree 的同名 prop 默认 title）。

## 5. 样式（62 行）

- **0 自有 Component Token**：`prepareComponentToken = initComponentToken`（tree 的 9 个）。
- dropdown：`padding: paddingXS paddingXS/2`；内嵌树 `borderRadius: 0`、
  node-content-wrapper `flex: auto`；checkbox 样式复用 checkbox 组件的生成器；
  RTL 时 close switcher 图标 rotate(90deg)。外壳样式完全复用 select。

## 6. Vue API 设计（G4）

### Props（沿用 antd 命名；Vue-native 差异标 INTENDED）

值/表单：`value`（v-model:value，C11 同发 `change`——select 惯例是 update:value +
onChange；本仓 select emits `update:value`）、`defaultValue`、`labelInValue`、
`maxCount`、`disabled`、`size`、`status`、`variant`、`allowClear`。
树数据：`treeData`、`fieldNames`（{value,label,children}）、`treeDataSimpleMode`、
`loadData`、`treeLoadedKeys`（v-model:treeLoadedKeys）、`treeCheckable`、
`treeCheckStrictly`、`treeDefaultExpandAll`、`treeExpandedKeys`（v-model:treeExpandedKeys）、
`treeDefaultExpandedKeys`、`treeLine`、`treeIcon`、`showTreeIcon`、`switcherIcon`、
`treeTitleRender`、`treeExpandAction`、`treeNodeFilterProp`、`filterTreeNode`、
`treeNodeLabelProp`、`showCheckedStrategy`。
外壳：`multiple`、`showSearch`（bool|{searchValue?,onSearch?,autoClearSearchValue?,
filterTreeNode?,treeNodeFilterProp?}）、`searchValue`（v-model:searchValue）、
`autoClearSearchValue`、`placeholder`、`maxTagCount/TextLength/Placeholder`、
`listHeight`(256)/`listItemHeight`(28)、`virtual`、`popupMatchSelectWidth`、
`placement`、`getPopupContainer`、`suffixIcon`、`removeIcon`、`clearIcon`、
`tagRender`、`notFoundContent`、`popupRender`、`classNames`/`styles`（语义 10+4 槽）。

### Emits

`update:value` + `change`（C11 同发；多选数组/单选单值）、`update:open` + `openChange`
（deprecated onDropdownVisibleChange 归并）、`update:searchValue` + `search`、
`update:treeExpandedKeys` + `treeExpand`、`update:treeLoadedKeys` + `treeLoad`、
`select` / `deselect`、`clear`、`popupScroll`。

### Slots / Expose

slots: `notFoundContent`、`tagRender`、`suffixIcon` 等（程序化优先）。
expose: `scrollTo({key})`、`focus`/`blur`（BaseSelect 已有）。

### INTENDED 差异登记

1. `TreeSelect.TreeNode` children 形态不实现（同 Tree，v6 deprecated）。
2. `SHOW_ALL/SHOW_PARENT/SHOW_CHILD` 导出为独立常量 + `TreeSelect.SHOW_*` 静态。
3. legacy `triggerNode`/`allCheckedNodes` getter（React node 实例）→ 返回数据节点
   （非 VNode），warning 提示。
4. `onChange` 的 labels 参数（React 特有）→ `change` 事件 info 里带 `labels`。

## 7. 实现要点（容易写错的判据）

1. **key === value**：TreeSelect 的 fieldNames 默认 key 字段取 value（value||'value'），
   与 Tree 不同 —— convertDataToEntities 前需把节点的 value 字段视作 key。
2. **conductCheck 在 TreeSelect 层做**：传给内嵌树的永远是 `checkStrictly: true` +
   已算好的 {checked, halfChecked}；树不参与级联。
3. **checkedKeys 双语义**：checkable 时是勾选集合；非 checkable 时直接当 selectedKeys。
4. **展示值裁剪**：SHOW_CHILD 只保留「子未全勾/无子」的节点；SHOW_PARENT 只保留
   「父未勾/自身或父 disabled」的节点。
5. **缺失值透传**：value 里的值不在树中时保留在 checkedKeys（missingRawValues），
   tag 照常显示。
6. **搜索展开**：搜索词变化时展开全部父节点（getAllKeys），清空后回到用户展开态。
7. **listItemHeight 默认 28**（controlHeightSM+paddingXXS），非 rc 默认 20。
8. **itemScrollOffset** 透传给树的滚动跟随。
9. **单选打开滚动定位**：`scrollTo({key: checkedKeys[0]})`。
10. **maxCount 拦截**：超出时 triggerChange 直接 return（值不变）。

## 8. 风险与规模预估

- 内核 1283 行 + 薄壳 273 + 样式 62 ≈ 1600 行 React → Vue 约 1200–1500 行。
- 复用：BaseSelect 全套（开合/键盘/tag/清除/搜索框）、Tree 全套（勾选级联 conductCheck
  在 utils/treeUtil 已有）、zIndex/portal/position。
- 主要新写：值归一层（labelInValue/halfChecked/strategy 裁剪/缓存）、树型 OptionList、
  simpleMode 建树、搜索过滤。
- 测试重点：值形状（单/多/labelInValue/checkStrictly）、四种 strategy 组合、
  搜索过滤+展开、maxCount、键盘导航。
