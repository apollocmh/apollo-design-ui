# dropdown

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
