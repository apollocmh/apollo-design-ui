# antd Cascader 分析（v6.6.4 产物实测）

> 契约来源：`/tmp/antd-src/package/es/cascader/*`（antd 6.6.4 npm 产物）+ `@rc-component/cascader@1.22.0` 的 `es/*`（node_modules 实测）。
> 本文件只记录**可执行的判据**，不复制源码。

## 1. 形态：antd 薄壳 + rc 内核，内核又站在 BaseSelect 上

```
antd/Cascader (527 行)
  └─ rc-cascader/Cascader (223 行)
       ├─ @rc-component/select 的 BaseSelect   ← 选择器外壳（开合/搜索输入/展示值/tag/清除）
       ├─ OptionList（List 216 + Column 198 + Checkbox 23 + useActive 23 + useKeyboard 164）
       ├─ hooks: useOptions / useValues / useSelect / useDisplayValues /
       │        useSearchConfig(34) / useSearchOptions(62) / useMissingValues / useEntities(34)
       ├─ utils: commonUtil(68) / treeUtil(34)
       └─ Panel（115，纯面板形态）
```

⚠️ **好消息**：本仓 `select/engine/BaseSelect.ts` 已落地 —— 选择器外壳（开合 / 输入 / 展示值 / 键盘 / 清除）**不必重写**，Cascader 只需提供 `OptionList` + `displayValues` + `searchValue` 三件事（与 rc 同构）。

## 2. 硬依赖缺口：`@rc-component/tree` 的两个算法

内核里两处 import（本仓**都没有**）：

| 算法 | 用在 | 规模 |
|---|---|---|
| `convertDataToEntities(options, {fieldNames, initWrapper, processEntity})` | `useEntities`：把 options 摊成 `pathKeyEntities`（key = 各层 value 用 `__RC_CASCADER_SPLIT__` 连接） | ~120 行 |
| `conductCheck(keys, checked, keyEntities)` | `useValues` / `useSelect`：勾选传导（父子联动 + 半选） | ~140 行 |

放置准则（`early-extract-table-core-tree-core` 决策 A）：**不提前抽独立包**，第一个消费者是 cascader → 落在 `packages/ui/src/cascader/engine/`；将来 tree 组件复用时再提升到 `_internal/`（与 ActionButton 的提升同一套做法）。

## 3. 关键判据（逐条，实现时对照）

### 3.1 值与路径（commonUtil）
- `VALUE_SPLIT = '__RC_CASCADER_SPLIT__'`；`toPathKey(value) = value.join(VALUE_SPLIT)`。
- `toRawValues(value)`：二维数组原样；一维包一层；空 → `[]`。
- `fillFieldNames`：默认 `{ label:'label', value:'value', key: value字段, children:'children' }`（**key 与 value 同字段**）。
- `isLeaf(option, fieldNames) = option.isLeaf ?? !option[children]?.length`。
- `getFullPathKeys`：搜索结果用 `SEARCH_MARK` 取完整路径。

### 3.2 两种策略常量
`SHOW_PARENT` / `SHOW_CHILD`（`formatStrategyValues` 决定多选回填时向上收还是保留叶子）。

### 3.3 多选（checkable）
- `multiple = !!checkable`；antd 用 `useCheckable(prefixCls, multiple)` 生成 checkable 节点。
- `useValues`：非多选或空值 → `[existValues, [], missingValues]`；多选走 `conductCheck(keys, true, entities)` 得到 checked/halfChecked。
- `useSelect(valuePath)`：单选直接 `triggerChange(valuePath)`；多选做勾选传导 + `formatStrategyValues` 去重 + 拼回 `[...missing, ...checked]`。
- `onChange(nextValues, selectedOptions)`：**多选传二维数组**，单选传一维 + 单个 options。

### 3.4 搜索
- `showSearch` 为对象时合进 `{ render: defaultSearchRender }`；`defaultSearchRender` 用 `/` 连接路径并对命中片段包 `-menu-item-keyword` span。
- `autoClearSearchValue` 默认 true；`onSearch` 在 `info.source !== 'blur'` 时触发。
- 搜索态下 `searchOptions` 替换 `options`；空则 `-menu-empty` + `notFoundContent`（antd 走 `renderEmpty('Cascader') || DefaultRenderEmpty`）。

### 3.5 渲染结构（OptionList）
```
div.{prefix}-menus [ .-menu-empty? .-rtl? ]
  └─ ul.{prefix}-menu (Column，每级一列)
       └─ li.{prefix}-menu-item [ .-menu-item-expand .-menu-item-active .-menu-item-disabled .-menu-item-loading ]
            data-path-key={pathKey}
```
- 列由 `activeValueCells` 逐级下钻；`onPathOpen`（hover/click，看 `expandTrigger`）推进 active 并触发 `loadData`。
- `isSelectable = !disabled && (isLeaf || changeOnSelect || multiple)`。
- `onPathSelect`：单选且（叶子 或 changeOnSelect 且 hover/键盘）→ 关闭浮层。

### 3.6 antd 薄壳的默认值与合并
- `placement` 默认 `isRtl ? 'bottomRight' : 'bottomLeft'`；`allowClear` 默认 true；`bordered` 默认 true（→ `variant`）。
- classNames 顺序：`!customizePrefixCls && cascaderPrefixCls` → 尺寸/RTL/variant/in-form-item → status → compact → context → className → rootClassName → `mergedClassNames.root`。
- popup 类名：`popupClassName || dropdownClassName` → `-dropdown` → `-dropdown-rtl` → rootClassName → `mergedClassNames.popup.root`。
- `mergedAllowClear = allowClear === true ? { clearIcon: mergedClearIcon } : allowClear`。
- zIndex 走 `useZIndex('SelectLike', ...)`。
- 静态属性：`SHOW_PARENT` / `SHOW_CHILD` / `Panel` / `_InternalPanelDoNotUseOrYouWillBeFired`。

## 4. Component Token（8 个，组 Cascader）

`menuBg`（colorBgElevated）、`menuPadding`（0）、`optionSelectedBg`（colorPrimaryBg，后被 controlItemBgActive 覆盖）、`optionSelectedFontWeight`（fontWeightStrong）、`optionSelectedColor`（colorText）、`menuBorderStyle`、以及（实测补充）与 select 同源的几个。实现时以 `es/cascader/style/index.js` 的 `prepareComponentToken` 为准。

## 5. 分阶段计划（本文件是后续继续的依据）

| 阶段 | 内容 | 状态 |
|---|---|---|
| S1 | `cascader/engine/tree.ts`：`convertDataToEntities` + `conductCheck`（含单测 9 条，全绿） | ✅ 完成（commit 待填） |
| S2 | `utils.ts`（commonUtil/treeUtil）+ hooks（useEntities/useOptions/useValues/useSelect/useDisplayValues/useSearch*） | 待做 |
| S3 | OptionList（List / Column / Checkbox / useActive / useKeyboard）+ Panel | 待做 |
| S4 | 薄壳 `Cascader.ts`（复用 select BaseSelect）+ 语义合并 + 8 token 样式 | 待做 |
| S5 | demo + a11y/theme/L1/L2（✅ 107 条全绿）| ✅ 完成 |
| S5b | L4 DOM 基线 ✅（3 例触发元素全绿，getRawInputElement 已实现）；L6 视觉 ⏸：antd 的 Panel 是**完整外壳形态**（readonly input + combobox + 列），本仓 CascaderPanel 是纯列 —— 尺寸差 8px（React 300 vs Vue 292）与外壳条差异待补「CascaderPanel 完整外壳形态」（复用 BaseSelect 静态形态）——原被 BaseSelect 的 getRawInputElement 缺口挡住：React SSR 时 Cascader 只渲染裸 children（raw trigger），本仓 BaseSelect 无该协议（渲染完整 Selector）。⚠️ 基线脚本与 fixture 已实现过一版又撤下（compat runner 要求「脚本存在 = 基线必须最新」），补齐 getRawInputElement 后按本提交历史重写（popconfirm.mjs 同构，9 例设计已验证） | ⏸ 阻塞 |
| S6 | registry 收口 + 沉淀 + 推送 | 待做 |
