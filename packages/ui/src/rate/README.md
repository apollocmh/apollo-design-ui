# rate

> **层**：L3（`packages/ui`）｜ **优先级**：P4 ｜ **复杂度**：S ｜ **antd 版本**：6.6.4
>
> 契约来源：antd `components/rate/`（壳 102 + style 171 行）+
> `@rc-component/rate@1.0.1`（es **380 行**：Rate 193 / Star 80 / util 39）。
> 上游是**兼容性规格**，不是代码来源。

## 1. 职责

评分录入/展示：受控值（`v-model:value`）、半星（allowHalf + getOffsetLeft 偏移判定）、
allowClear 重置、键盘方向键（rtl 反向）、hover 展示值、tooltips 提示、
expose focus/blur、autoFocus。

## 2. 文件布局与关键决策

```
rate/
├── Rate.ts        # rc Rate 内核 + antd 壳（size/disabled 合并/tooltips 包装/方向）
├── Star.ts        # 内部星项（类名三态 + role=radio aria 面 + Enter 点击）
├── util.ts        # getOffsetLeft（rc util.js 逐字移植）
├── interface.ts   # 类型面（StarRenderInfo 是 #character 的 slot props）
└── style/{token.ts,index.ts}
```

### 实现判据

1. **Star 是内部组件**（C8-R2 豁免）：`character`/`characterRender` 以函数 prop 下发，
   函数闭合 Rate 侧读取用户 `#character` / `#characterRender` 插槽。
2. **cleanedValue**：allowClear 重置后记录被清的值；hover 更新判据
   `nextHoverValue !== cleanedValue`（rc 逐字）。
3. **tooltips × characterRender**：antd 里 JSX spread 顺序使用户 characterRender
   **覆盖** tooltip 包装；本仓 slot **组合**（INTENDED，见下）。
4. **onChange 等是 props 形态回调**（PITFALLS 35），emits 只 `update:value`（C11 两者同发）。
5. **li 元素注册**（getStarRef）走 mounted/unmount 生命周期回调，不走 Vue 函数 ref
   （vue-tsc 对 h() 的 ref 联合有误报，PITFALLS 137 同族）。

### 状态机（R15/R16）

无自有状态机；值 = `useControlledValue`（受控/非受控二选一），hover/focused/cleanedValue
是局部瞬时状态。

## 3. 与 antd 的差异

- **tooltips × characterRender**：antd 覆盖 → 本仓组合（INTENDED，登记 COMPATIBILITY.md）。
- 其余见 `COMPATIBILITY.md` D111 / D6（默认前缀）。

## 4. Component Token 清单

registry 数据：token 数 = **6**（`lineWidthFocus` 是别名派生值，在 DECLS 块里但不算
ComponentToken）。关键默认值（`prepareComponentToken` 构建期解析）：
`starColor = yellow6(#fadb14)`、`starSize = controlHeight×0.625(20)`、
`starSizeSM = controlHeightSM×0.625(15)`、`starSizeLG = controlHeightLG×0.625(25)`、
`starHoverScale = 'scale(1.1)'`、`starBg = colorFillContent`。

## 5. 已知缺口

| # | 缺口 | 说明 |
|---|---|---|
| P1 | ConfigProvider 组件级 classNames/styles | Rate 无语义面（antd 亦无），不适用 |
| P2 | wireframe 分支 | antd rate 样式无 wireframe 分支，不适用 |

## 6. 收口证据（G13）

- 四层 72 条全绿（L1/L2 26 + demo 11 + a11y 10 + theme 10 + L3 类型 16 中 8 属本组件
  —— 以 vitest 汇总为准）+ **L4 DOM 契约 15 条**（机械基线）
- L6 视觉 **9/9 全 0.000% exact**（basic/half/character × 3 viewport）
- lint 0 错误 · registry:check 18/18
