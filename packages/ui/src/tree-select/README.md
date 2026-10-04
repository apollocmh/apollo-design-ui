# TreeSelect 实现说明

## 1. 对应 antd 组件

- antd 6.6.4 `es/tree-select/`（index.js 273 行薄壳 + style 62 行）
- rc 内核：@rc-component/tree-select@1.16.1（1283 行：TreeSelect 528 + OptionList 347 + hooks 193 + utils 200）
- 分析产物：`docs/analysis/tree-select.md`（§2 十段数据流 / §3 OptionList 判据 / §7 实现要点）
- 复用的本仓资产：`select/engine/BaseSelect`（**第二个 optionListRenderer 消费者**，Cascader 是第一个）、`tree` 全组件（conductCheck / convertDataToEntities / Tree 树组件）、`useZIndex`（portal）
- 样式：select 外壳规则改前缀 + tree 规则同前缀 + 62 行 dropdown 层；0 自有 Component Token

## 2. 与 antd 的行为差异清单（同步 COMPATIBILITY.md）

| # | 差异 | 分类 | 说明 |
| --- | --- | --- | --- |
| 1 | `TreeSelect.TreeNode` children 形态不实现 | 同上游 | v6 deprecated（同 Tree） |
| 2 | `SHOW_*` 同时具名导出 | INTENDED | Vue 惯例 |
| 3 | legacy `triggerNode`/`allCheckedNodes` 返回**数据节点**（rc 返回 React 元素） | INTENDED | 数据/视图解耦；getter 带废弃告警 |
| 4 | 单前缀直通（shell/tree/dropdown 三前缀合一） | INTENDED | customize 基线模式等价 |
| 5 | `update:value` 与 `change` 同发（C11） | INTENDED | rc 只有 onChange |
| 6 | `onChange` 的 labels 参数并入 change info（本仓保留三参签名） | 同上游 | 兼容迁移 |

## 3. 文件选择

全部 `.ts`（defineComponent + h）：与 select/cascader 同范式；值归一层是纯计算（computed 组合），OptionList 是 VNode 组装型。

## 4. Component Token（0 自有）

antd `prepareComponentToken = initComponentToken`（tree 的 9 个）。样式层直接复用 tree 的 token 变量（`--apollo-tree-*`，变量名硬编码不随前缀变——选择器替换、变量名不动）。

## 5. 实现要点（最容易写错的判据）

1. **key === value**：fillFieldNames 的 key 字段取 value（`value || 'value'`）——与 Tree 的 fieldNames 语义不同；convertDataToEntities 前按此映射。
2. **级联在本层算**：conductCheck 由 TreeSelect 调（useCheckedKeys + onOptionSelect 的 toggle 分支），内嵌树永远 `checkStrictly: true` + 受控 `{checked, halfChecked}`。
3. **展示值裁剪**：SHOW_CHILD 保留「无子/子未全勾/子有 disabled 未勾」；SHOW_PARENT 保留「无父/自身或父 disabled/父未勾」——走 `entity.parent`/`entity.children` 链接。
4. **缺失值透传**：value 不在树中（valueEntities.has 为 false）时保留在 checkedKeys，tag 照常显示（splitRawValues 语义）。
5. **内部值一律 LabeledValueType[]**（rc setInternalValue 语义）；对外 emit 才按 labelInValue / 单多选整形。
6. **BaseSelect 双参协议**：`onDisplayValuesChange(newValues, info)` —— clear 分支用**第一参数**（新值 = []），remove 分支用 `info.values[0]`（被移除的）。用反会导致清空把原值发回去。
7. **allowClear 保持布尔**：`allowClear===true` 时别包 `{clearIcon: true}` —— resolveAllowClear 的 fallback 链 `config.clearIcon ?? clearIcon ?? '×'`，布尔 true 会吞掉独立 clearIcon prop 的 VNode（按钮渲染空）。
8. **listItemHeight 默认 28**（controlHeightSM+paddingXXS 派生常量），非 rc 默认 20。
9. **maxCount 两层语义**：antd 薄壳在 SHOW_ALL(非 strictly)/SHOW_PARENT 下置 undefined + 告警；rc 层仅 SHOW_CHILD/strictly/非 checkable 生效；超额时 triggerChange 直接 return。
10. **treeMotion 恒 null**（antd 薄壳固定，树动画关闭）。
11. **搜索期间停用 loadData**（rc hasLoadDataFn）；搜索词出现时展开全部父节点（getAllKeys）。
12. **浮层渲染是异步的**：mount 后必须 nextTick 才有 `-open` 类 / 浮层 DOM（测试同步断言会全空——实测踩过，13 个用例连带挂）。
13. **内嵌 Tree 根类 = prefixCls 本身**（无 -tree 段）；样式生成必须以 genTreeStyle('apollo') 产物整体替换选择器（直接调 genTreeStyle(p) 会生成 `.${p}-tree` 双段落空）。变量名 `--apollo-tree-*` 硬编码保留。
14. **removeIcon 默认 CloseOutlined**（multiple 时，antd useIcons fallback 链）、**clearIcon 默认 CloseCircleFilled**。

## 6. 已知缺口

- ~~`Space.Compact` 下 TreeSelect 的 compact 类未接~~ ✅ 已接（2026-10-04）：根类
  `-compact-item` / `-compact-first-item` / `-compact-last-item` + `compactSize` 兜底
  （antd tree-select/index.js:120 逐字），compact.test.ts 钉住。
- form context 的 hasFeedback 图标（FeedbackIcon）未接 —— status 类已接（`-status-error/warning`）。
- OptionList 的 `aria-live` 播报 span 已实现；键盘方向键代理 Tree.onKeyDown（Tree expose 已补，rc ref API 同构）。

## 7. demo 替换登记

- 无替换依赖 —— 15 组 demo 全部只用已落地组件。
