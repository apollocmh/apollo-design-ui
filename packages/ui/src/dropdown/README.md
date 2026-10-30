> 规范范围：本文件保留实现说明与历史对照证据；上游同构、旧阶段与历史 Gate 要求不再生效。现行规则见 [项目规范](../../../../AGENTS.md)，公共行为以 Apollo 组件 API 文档与测试契约为准。

> 历史实施记录：原勾选、当时结果和缺口保留。2026-10-30 起，本文的 G0–G14 / 逐组件 G13 全仓收口与旧 Registry 进度规则由仓库 `WORKFLOW.md`、`TESTING.md` 两阶段流程替代；当前任务状态只读 `registry/vue-native-audit.json`，不据本文重复派发或重跑已有效验证。

# dropdown

## 当前实现（2026-10-30）

Dropdown/DropdownButton 的通知和模型由 Vue emits 发送；完成通知使用 `@after-open-change`，对应 `onAfterOpenChange`，旧 `afterOpenChange` 函数 prop 直接迁移。原 getter ref 方法保留并补公开类型，Tabs/Breadcrumb 的调用继续有效。DropdownButton 是 Apollo 当前支持的组件，不再因其他库弃用它而发出弃用告警；已不存在的 icon prop 从类型中移除，继续使用既有 `#icon`。

当前槽在 render 读取，图标完整保留，空图标槽不会恢复默认图标；`buttonsRender` 继续代表主钮、触发钮两个位置。native attrs 作用于触发元素，DropdownButton 的 native attrs 属于按钮组根；实际浮层根与 Menu 四个区域由各自语义字段拥有。PurePanel 使用同一 Menu 组合和主题投影，支持原生字符串/数组样式，并在文档流内展示。

Provider 配置、当前 Token、定位参数和数值层级使用同一当前来源。七个已有 CSS 字段包括 zIndexPopup/paddingBlock 及五个箭头派生字段，不新增 Token 名称。Menu 仍拥有选择、导航与子菜单；本次只验证真实组合所依赖的当前配置与资源边界。完整当前 API 见双语文档与类型。

以下编号章节保留 2026-09-25 的原始实施与验收含义；其中旧完成状态、上游弃用与当时缺口不是本轮状态或新验收结论。

> **层**：L3（`packages/ui`）｜ **优先级**：P3 ｜ **复杂度**：L ｜ **antd 版本**：6.6.4
>
> 契约来源：antd `components/dropdown/`（dropdown.tsx 404 行 / dropdown-button.tsx
> 153 行 / style 442 行）+ `@rc-component/dropdown@1.0.3`。
> 上游是**兼容性规格**，不是代码来源。

## 1. 职责

下拉菜单：触发元素 + 浮层 Menu。**Trigger 的第 4 个消费者**，并把
`menuOverrideKey`（rc OverrideProvider 对应物）反哺为 menu 的新基建通道。

## 2. 文件布局与关键决策

```
dropdown/
├── Dropdown.ts        # 主组件（Trigger 薄包装 + overlay=Menu+override）
├── DropdownButton.ts  # split 双钮（D91：组件整体 deprecated，同款告警保留）
├── PurePanel.ts       # 静态面板
├── interface.ts
└── style/{token.ts,index.ts}
```

- **overlay = Menu + override**：`{p}-menu` 前缀 / `mode=vertical` /
  `selectable=false` / `onMenuClick` 关闭（多选+可选择除外）/ expandIcon 注入。
- **stretch 协议**（Trigger 新增）：`minOverlayWidthMatchTrigger` 默认
  `!alignPoint` ⇒ 浮层 min-width = 目标宽；**用 getBoundingClientRect 不取整**
  （offsetWidth 整数化 ⇒ 浮层宽 1px、popup x 偏 1px，L6 实测红，D92）。

## 3. 与 antd 的差异

登记于 `COMPATIBILITY.md` §9.2 **D91–D93**：DropdownButton 同步废弃（UPSTREAM）、
stretch 取整口径（PLATFORM）、harness 的 motionDeadline 缺失补偿（PLATFORM）。

L6 视觉 6 张（2 variant × 3 viewport）**全部 0.000% exact**。

## 3.5 DropdownButton 的三条判据（Issue #21）

1. 🚨 **split 的两钮不能一起塞进 Dropdown 的默认插槽** —— Dropdown 按 rc 的
   `Children.only` 只消费一个 child（多个会被包成一个 `<span class="{p}-trigger">`）
   ⇒ 点主钮也会开下拉。antd `dropdown-button.js` 的结构是
   `[leftButton, <Dropdown>{rightButton}</Dropdown>]`：**主钮在 Dropdown 外面**；
   非 split 时则把主钮作为唯一的 trigger。
2. 🚨 **`popupRender` 不是 Dropdown 的 prop**（C8-R2 已改成 `#popupRender="{ originNode }"`
   作用域插槽）⇒ 从 DropdownButton 转发时必须在 `h(Dropdown, props, slots)` 的**第三参数**
   给，塞进 props 会被静默忽略。
3. 🚨 **子菜单箭头方向按 `direction`**（antd `dropdown.js:194-196`）：
   `rtl ? LeftOutlined : RightOutlined`，且必须在**渲染函数**里选（写进 setup 是快照）。

## 4. 已知缺口

| # | 缺口 | 说明 |
|---|---|---|
| P1 | `autoFocus` / `focus` | 键盘焦点环，随 menu 的 focus 精调回归 |
| P2 | 语义槽函数式形态 | D36 同判 |
| P3 | `direction=rtl` | placement 镜像（bottomRight）随 rtl 基建回归 |

## 5. 收口证据（G13）

- L1 13 / demo 19 / L4 5（基线 `dropdown.dom.json`）/ L5 22 / L7 11 / L3 6 /
  L6 **6/6 0.000% exact**
- registry 11 维 done，`status: completed`
