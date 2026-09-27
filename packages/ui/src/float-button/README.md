# float-button

> **层**：L3（`packages/ui`）｜ **优先级**：P4 ｜ **复杂度**：M ｜ **antd 版本**：6.6.4
>
> 契约来源：antd `components/float-button/`（FloatButton 228 + Group 344 + BackTop 121
> + PurePanel 69 + style 378 = 1079 行）。上游是**兼容性规格**，不是代码来源。

## 1. 职责

浮动操作按钮：FloatButton（Button 薄壳 + badge/tooltip）+ Group（列表与 menu 模式）
+ BackTop（滚动可见性 + showProgress 进度环）+ PurePanel（debug）。

## 2. 文件布局与关键决策

```
float-button/
├── FloatButton.ts        # Button 薄壳（prefixCls='float-btn'，类链/语义/tooltip/badge）
├── FloatButtonGroup.ts   # 列表（Flex/Space.Compact）+ menu 模式（CSSMotion）
├── BackTop.ts            # useScroll + scrollTo + fade motion + progress 环
├── PurePanel.ts          # debug 面板（items ⇒ Group）
├── context.ts            # GroupContext（shape/individual/语义注入）
├── hooks/useScroll.ts    # antd useScroll 的 Vue 移植
└── style/index.ts        # 机械转换（Token = 0）
```

### 实现判据

1. **prefixCls = 'float-btn'**（antd 逐字），root 类与 Button 的 `-btn` 类共存。
2. **icon-only**：内容不可渲染 ⇒ 默认 FileTextOutlined；⚠️ antd 的 Button 根**不落**
   `-icon-only` 类（React 空子节点计数怪癖，D113 UPSTREAM）—— FloatButton 层正常落。
3. **badge**：`'badge' in props` 判据；omit title/children/status/text 防透传。
4. **Group 双 context**：list（item 系）/ trigger（trigger 系）；⚠️ Vue provide 只能
   setup 期 ⇒ trigger 按钮以 listContext 承担（INTENDED，README §3）。
5. **click 模式外部点击**：document **capture 级**监听（rc 逐字）。
6. **BackTop**：滚动基建复用 back-top（getScroll/throttle/scrollTo/CSSMotion）；
   showProgress 经 CSS 变量 `${x}turn` 喂 conic-gradient。

## 3. 与 antd 的差异

- **D113（UPSTREAM）**：Button 根的 icon-only 类（见上）。
- **Group triggerContext**：trigger 按钮的 trigger 系语义由 listContext 承担
  （Vue provide 时机限制，INTENDED）。
- **Badge 嵌入 Button children 的结构差异**（wrapper 层/sup 标签）——badge 集成
  不在 L4 基线（由 L1 + Badge 自身 L4 覆盖），视觉无差异（L6 exact 验证）。
- 其余见 `COMPATIBILITY.md` D6 / D111。

## 4. Component Token 清单

registry 数据：token 数 = **0**（ComponentToken = object）。

## 5. 已知缺口

| # | 缺口 | 说明 |
|---|---|---|
| P1 | Group triggerContext 语义 | Vue provide 时机（见 §3） |
| P2 | draggable demo | 用户级 dnd-kit 组合，非组件能力 |

## 6. 收口证据（G13）

- 四层：L1/L2 23 + demo 13 / L3 类型 6 / L5 a11y 13 / **L4 DOM 契约 11**
- L6 视觉 **9/9 全 0.000% exact**（basic/shape-content/badge-tooltip × 3 viewport）
- lint 0 错误 · registry:check 18/18
