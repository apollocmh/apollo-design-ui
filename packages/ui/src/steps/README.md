# steps

> **层**：L3（`packages/ui`）｜ **优先级**：P4 ｜ **复杂度**：M ｜ **antd 版本**：6.6.4
>
> 契约来源：antd `components/steps/`（壳 493 + useDisplaySteps 151 + ProgressIcon 47 +
> PanelArrow 27 + style 18 文件 1458 行）+ `@rc-component/steps@1.2.3`（es **394 行**）。
> 上游是**兼容性规格**，不是代码来源。

## 1. 职责

流程导航：状态推导（current/status/items.status）、五种类型
（default/navigation/inline/panel/dot）、maxCount 折叠、percent 进度环、
可点击步（role=button + 键盘）、responsive 断点。

## 2. 文件布局与关键决策

```
steps/
├── Steps.ts            # rc Steps（状态推导/类名）+ antd 壳 12 件事
├── Step.ts             # rc Step（item DOM/点击/键盘/render fn 注入）
├── StepIcon.ts         # 图标外壳（三层类名合并：组件级 + item 级 + 使用者）
├── Rail.ts             # 连线（status = nextStatus）
├── ProgressIcon.ts     # percent 进度环（SVG dasharray）
├── PanelArrow.ts       # panel 类型箭头
├── useDisplaySteps.ts  # maxCount 折叠纯算法（可单测）
├── interface.ts        # 类型面（含 4 个 scoped slot 的 slot props）
└── style/{token.ts,index.ts}
```

### 实现判据

1. **内核轻（394 行）不需要 engine/**——直接融进 Steps.ts（壳）+ Step.ts（item）。
2. **rail status = nextStatus**（railFollowPrevStatus 默认 false）——写成本步 status
   时 dot 模式连线全错（L6 视觉抓出）。
3. **本仓 clsx 是简化版**（filter(string).join(' ')）——**不支持对象参数**，
   条件类必须展开成字符串（L6 抓出：-active/-dot/-max-count 全丢）。
4. **items 是数据 API**：title/content/icon 的 VNodeChild 合法（C8-R2 豁免）；
   render fn（iconRender/itemRender/itemWrapperRender/progressDot fn）→ scoped slot。

### 状态机（R15/R16）

无自有状态机（受控 current）；每步的展示状态为纯推导：
`item.status ?? (index===current ? props.status : index<current ? 'finish' : 'wait')`。

## 3. 与 antd 的差异

- **Wave 点击波纹**未实现（本仓无 wave 基建，button 同缺）——波纹动画缺失，
  `classNames.itemIcon` 的 TARGET_CLS 注入同步不做（INTENDED，范围裁剪）。
- **`components` 注入**（app 壳的 root/item 组件替换）未接（INTENDED，v1 裁剪）。
- 其余见 `COMPATIBILITY.md` D111。

## 4. Component Token 清单

registry 数据：token 数 = **13**。关键默认值（`prepareStepsComponentToken` 构建期解析）：
`iconSize = controlHeight`、`iconTop = -0.5`、`dotSize = controlHeight/4`、
`dotCurrentSize = controlHeightLG/4`、`customIconFontSize = controlHeightSM`、
`iconSizeSM = fontSizeHeading3`、`navArrowColor = colorTextDisabled`。

## 5. 已知缺口

| # | 缺口 | 说明 |
|---|---|---|
| P1 | Wave 波纹 | 待 wave 基建（button 同等待办） |
| P2 | `components` 注入 | app 壳（`InternalContext`）回填项 |
| P3 | ConfigProvider 组件级 classNames/styles | staged（同 image/message） |
| P4 | `railFollowPrevStatus`（UnstableContext） | rc 内部协议，无 antd 公共面 |

## 6. 收口证据（G13）

- L1/L2 20 + demo 22 / L7(theme) 11；L6 **9/9 全 0.000% exact**
- lint 0 错误 · registry:check 18/18
