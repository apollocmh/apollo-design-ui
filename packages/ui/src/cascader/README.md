# Cascader 实现说明

## 1. 契约来源
- 薄壳：antd 6.6.4 `es/cascader/index.js`（527 行）；内核 `@rc-component/cascader@1.22.0`（1379 行）
- 外壳：复用本仓 `select/engine/BaseSelect`（rc 同构：rc-cascader 也站在 BaseSelect 上）
- 硬依赖移植：`@rc-component/tree` 的 `convertDataToEntities` + `conductCheck`（`cascader/engine/tree.ts`，foundation 决策 A：第一消费者留在 engine/）
- 样式：`es/cascader/style/index.js` + `columns.js`（8 Component Token）

## 2. 分阶段（docs/analysis/cascader.md §5）
S1 树算法 → S2 值域/搜索 hooks → S3 OptionList/Panel → S4 薄壳 → S5 七层测试 → S6 收口。

## 3. 与 antd 的行为差异（同步 COMPATIBILITY §9）
| # | 差异 | 分类 |
|---|---|---|
| 1 | onChange/onSearch/onOpenChange 等走 attrs（PITFALLS 35）；open/value 支持 v-model | INTENDED |
| 2 | BaseSelect 的点击开合经 `openOnTriggerClick` 开关显式启用（select 既有行为不变） | INTENDED |
| 3 | checkbox 视觉为精简对齐版（antd 用完整 checkbox 样式），像素对齐由 L6 钉 | UPSTREAM-lite |
| 4 | genCompactItemStyle（Space Compact）未移植（space/Compact 与 select 联动未落地） | DEFERRED |
| 5 | 多个 deprecated props（dropdownClassName 等）不移植告警（Vue attrs 无法区分 in props） | INTENDED |

## 4. 实现要点（最容易写错的判据）
1. **context 严禁 setup 期解构**（Proxy 桥冻结初值）——OptionList 每次渲染/事件期 `getC()` 读取。
2. **watch 依赖 loadingKeys 又改它 = Vue 递归自触发**（React setState bail-out 无对应物）。
3. **toRawValues：一维值整体包一层**（`['a','b']` 是单个路径）。
4. **fillFieldNames 的 key 与 value 同字段**；**toPathKey 用 VALUE_SPLIT 连接**。
5. **loadData 只对非叶子触发**；搜索项 fullPath 来自 SEARCH_MARK。
6. **onConfirm 式包装回调不能吞返回值**（无此场景但同族教训）。
7. Vue 的 **provide 必须在 setup 同步阶段**（rc 在 render 里 Provider 每帧给值——用 Proxy 桥等价）。
8. **conductCheck clean 模式自底向上单遍**（delete 父影响更高层判定）。

## 5. Component Token（8 个）
controlWidth 184 / controlItemWidth 111 / dropdownHeight 180 / optionSelectedBg=controlItemBgActive /
optionSelectedFontWeight=fontWeightStrong（unitless）/ optionPadding='5px 12px'（构建期派生实值）/ menuPadding=paddingXXS / optionSelectedColor=colorText

## 6. 测试环境边界
- a11y：combobox 的 label 豁免（select 同判 R13）；**panel demo 无 combobox input**，豁免必须恰好命中 ⇒ panel 单独扫。
- DOM 基线（compat）与 visual 待补（S5 未完成项，见 analysis §5）。
