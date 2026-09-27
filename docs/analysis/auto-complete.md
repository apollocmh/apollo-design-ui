# auto-complete · G1 分析产物

> 契约来源：antd 6.6.4 `components/auto-complete/`（AutoComplete.tsx 245 行 +
> index.tsx 33 行，样式复用 select）+ `@rc-component/select`（内部依赖）。
> 上游是**兼容性规格**，不是代码来源。

## 1. 结构判定

**Select 的薄包装**（无独立内核）——本仓 Select 已实现 combobox 内核分支
（`Select.ts` 的 `mode==='combobox'` 分支 + engine 的 SearchInput/OptionList），
AutoComplete.ts 单文件即可。无 engine/、无样式文件（Token = 0，完全复用 select 样式）。

## 2. antd 壳逐件（AutoComplete.tsx）

1. **prefixCls = getPrefixCls('select', custom)** —— 复用 select 前缀。
2. **mode = Select.SECRET_COMBOBOX_MODE_DO_NOT_USE** —— 本仓内部 `'combobox'`
   （公开 SelectProps 类型不含，边界 cast；内核分支已实现）。
3. **suffixIcon={null}** —— 无箭头。本仓：`#suffixIcon` 空 slot（用户插槽优先透传）。
4. **children 三分支**（toArray）：
   - 单个非 Option 元素 ⇒ `getInputElement`（自定义输入元素）—— **v1 未实现**
     （SearchInput 承载 ARIA/IME/宽度同步全套，替换需深度改造；usage 告警 + 缺口登记）。
   - 首个 child 是 SelectOption/OptGroup（`isSelectOption` 标志，本仓 `OPTION_MARK`）
     ⇒ optionChildren = children（本仓直接透传 default slot，Select 的
     convertChildrenToData 自动收数据）。
   - 否则（无 children）⇒ dataSource 映射：string ⇒ `{value}`；`{value,text}` ⇒
     `{value, label: text}`；VNode ⇒ 原样（本仓并入 default slot 渲染）。
5. **merge**：popupRender || dropdownRender（C8-R2：均为 `#popupRender` 插槽）、
   onOpenChange || onDropdownVisibleChange、popupMatchSelectWidth ?? dropdownMatchSelectWidth。
6. **deprecated 告警 ×7**：dropdownMatchSelectWidth→popupMatchSelectWidth、
   dropdownStyle→styles.popup.root、dropdownClassName/popupClassName→classNames.popup.root、
   dropdownRender→#popupRender 插槽、onDropdownVisibleChange→onOpenChange、
   dataSource→options；usage：customize input + size 同用。
7. **语义合并**：useMergeSemantic（popup._default='root'）—— 本仓 useMergeSemantic 同款；
   finalClassNames.root = `${prefixCls}-auto-complete` + className + rootClassName +
   merged.root + customize 标志；popup.root = popupClassName + dropdownClassName + merged。
   finalStyles.root = merged.root + style；popup.root = dropdownStyle + merged.popup.root。
8. **透传 Select**：omit(dataSource/dropdownClassName/popupClassName/onDropdownVisibleChange/
   onOpenChange) + prefixCls + classNames + styles + mode + merged 三项 + getInputElement。

## 3. C8-R2 映射

| antd prop | Vue 侧 |
|---|---|
| `popupRender(menu)` / deprecated `dropdownRender` | `#popupRender="{ menu }"` 作用域插槽（透传 Select 同名插槽） |
| `suffixIcon={null}` | `#suffixIcon` 空 slot（用户插槽优先） |
| `children`（SelectOption 列表） | default slot 透传（Select 已支持 children-as-data） |
| `children`（自定义输入元素） | v1 未实现（缺口，usage 告警） |
| `dataSource` / `tooltips` 等数据 prop | 数据 prop 保留（deprecated，映射 options） |
| `showSearch.searchIcon`（ReactNode） | `showSearch.searchIcon`（内部配置对象，VNode 豁免——与 Select 同判） |
| onChange/onSearch/onOpenChange 等回调 | props 形态 + emits 双通道（PITFALLS 35 / C11 同判） |

## 4. Token

**0 个** —— 完全复用 select 的样式与 Component Token（root 类
`.apollo-select-auto-complete` 只改布局类，构建产物确认无独立样式文件）。

## 5. 测试策略

- L1/L2：v-model:value、onSearch 触发 options 更新、SelectOption children 收数据、
  dataSource 映射（string/对象/VNode）、deprecated 告警 ×7、自定义输入元素 usage 告警、
  无箭头（suffix 不渲染）、root 类与 customize 类、popupClassName→popup.root 合并、
  #popupRender 透传、status 落类、expose focus/blur。
- L4：DOM 契约基线（plain/value/half 不适用——value:2/status/disabled/size/customize 类）。
- L6 视觉：basic / status / style-class 3 variant × 3 viewport。
- 缺口：自定义输入元素（getInputElement）、PurePanel 别名（debug-only，antd istanbul ignore）。
