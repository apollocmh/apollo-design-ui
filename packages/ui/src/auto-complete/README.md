> 规范范围：本文件保留实现说明与历史对照证据；上游同构、旧阶段与历史 Gate 要求不再生效。现行规则见 [项目规范](../../../../AGENTS.md)，公共行为以 Apollo 组件 API 文档与测试契约为准。

> 历史实施记录：原勾选、当时结果和缺口保留。2026-10-30 起，本文的 G0–G14 / 逐组件 G13 全仓收口与旧 Registry 进度规则由仓库 `WORKFLOW.md`、`TESTING.md` 两阶段流程替代；当前任务状态只读 `registry/vue-native-audit.json`，不据本文重复派发或重跑已有效验证。

# auto-complete

> **层**：L3（`packages/ui`）｜ **优先级**：P4 ｜ **复杂度**：M ｜ **antd 版本**：6.6.4
>
> 契约来源：antd `components/auto-complete/`（AutoComplete.tsx 245 + index.tsx 33 行）。
> 上游是**兼容性规格**，不是代码来源。

## 2026-10-23 当前整改

F02：选项分类与插槽读取移至当前 render，不再依靠始终转发 default 包装函数来间接使 computed 失效。支持条件插槽、分组及 VNode 数据源的已有行为。 验证见 `docs/audit/2026-10-23-vue-reactivity-remediation.md`。

## 1. 职责

输入自动完成：Select 的 combobox 薄包装。数据通道三选一（options /
deprecated dataSource / ASelectOption children）、搜索回调（showSearch.onSearch
config 通道）、语义面（root/input/placeholder/content/clear/popup）、
deprecated ×6 告警。

## 2. 文件布局与关键决策

```
auto-complete/
├── AutoComplete.ts   # 壳（children 三分支 / merge / 语义 / 透传 Select）
├── interface.ts      # 类型面（语义面无 item 系）
└── index.ts          # 导出 + compound AutoCompleteOption（=== SelectOption）
```

无 engine/、无 style/（Token = 0，完全复用 select 样式）。

### 实现判据

1. **prefixCls 复用 select**：root 类 `{prefix}-select-auto-complete`。
2. **mode 走内核 combobox 分支**（公开 SelectProps 类型不含，边界 cast —— 内核已实现）。
3. **suffixIcon={null}** ⇒ `#suffixIcon` 空 slot；Selector 对空 suffix **不渲染容器**
   （rc 的 `suffixNode && wrapper` 语义 —— 本次在 Selector 落地修复）。
4. **回调全 prop 形态**，与 Select 的 props 表逐字同形、1:1 转发；v-model:value 走
   `update:value` 中继（C11）。
5. **merge**：popupMatchSelectWidth ?? dropdownMatchSelectWidth；onOpenChange ??
   onDropdownVisibleChange；popupClassName/dropdownClassName → classNames.popup.root。

### 顺手修复的 Select 既有缺陷（本次 L4 抓出）

| # | 缺陷 | 修复 |
|---|---|---|
| 1 | `useMergeSemantic.mergeClassNames` 浅合并在嵌套语义对象（`popup.{root,list,listItem}`）上**丢数据** | 递归合并嵌套对象 |
| 2 | Select 根类把 `classNames.root` **拼两次**（mergedRootClassName 与 BaseSelect 各一次） | 从 mergedRootClassName 移除 |
| 3 | Select 不接受 `className` prop（attrs 通道丢弃，antd 根类含 className） | 声明 prop 并入根类 |
| 4 | `showSearch.onSearch`（config 通道）**未接入**搜索事件（只有平铺 onSearch 生效） | `props.onSearch ?? searchConfig.onSearch` |
| 5 | combobox 回填值不落 `-content-has-search-value`（Selector 收到原始 searchValue 而非 merged） | Selector 收 mergedSearchValue |

## 3. 与 antd 的差异

- **自定义输入元素（getInputElement）v1 未实现**：单个非 Option child 会 usage 告警
  并丢弃（antd 支持 `<AutoComplete><TextArea/></AutoComplete>`）。SearchInput 承载
  ARIA/IME/宽度同步全套，替换需深度改造 select engine（INTENDED 缺口，README §5）。
- **dataSource 映射逐字复刻 antd 的 `optionChildren` 分支**（AutoComplete.js:49-76）：
  children 首项是 Option/OptGroup ⇒ children 胜、dataSource 整条忽略；否则
  string/`{value,text}` ⇒ Option、VNode 项原样作为 option children。VNode 数据源
  与结构化项混合时整条走 children-as-data 通道（结构化项转 Option vnode）——
  Select 的 `childrenAsData = !options` 是全有全无开关，分两条路会丢选项（Issue #14.1）。
  同传 `options` prop 时 options 胜（与 antd 一致：`options` 堵死 children 通道）。
- 其余见 `COMPATIBILITY.md` D6 / D111。

## 4. Component Token 清单

registry 数据：token 数 = **0** —— 无独立样式，复用 select。

## 5. 已知缺口

| # | 缺口 | 说明 |
|---|---|---|
| P1 | 自定义输入元素 | getInputElement 内部 API（SearchInput 深改造）；demo `custom` 未对外 |
| P2 | PurePanel 别名 | antd `_InternalPanelDoNotUseOrYouWillBeFired`（debug-only，istanbul ignore） |

## 6. 收口证据（G13）

- L1/L2 13 + demo 12 / L3 类型 6 / L5 a11y 11 / **L4 DOM 契约 10**（机械基线）
- L6 视觉 **9/9 全 0.000% exact**（basic/status/style-class × 3 viewport）
- lint 0 错误 · registry:check 18/18
