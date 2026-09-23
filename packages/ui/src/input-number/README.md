# InputNumber 实现说明

## 1. 对应 antd 组件

- antd 6.6.4 · `es/input-number/` + `@rc-component/input-number@1.6.2` +
  `@rc-component/mini-decimal@1.1.4`（只读参照，H2/H5）
- 分析产物：`docs/analysis/input-number.md`（G1，先于实现存在）
- **引擎自建**（`engine/`，registry 登记的 in-ui 替换落点）：
  - `engine/decimal.ts` —— BigIntDecimal / NumberDecimal（任意精度十进制，
    `0.1+0.2=0.3`）、`toFixedDecimal`（进位走字符串加法）
  - `engine/number-util.ts` —— trimNumber / num2str / getNumberPrecision /
    validateNumber / getDecupleSteps（shift ×10）
  - `engine/use-cursor.ts` —— formatter 改写文本后的光标恢复
  - `engine/StepHandler.ts` —— 步进按钮（600ms 延迟 + 200ms 连发，raf 防乱序）
- 样式：`genInputNumberStyle()` 与 antd `extractStyle` 产物**逐条对拍**（126 条规则）

## 2. 与 antd 的差异清单

| # | 差异 | 分类 |
|---|---|---|
| I1 | `value+onChange` ⇒ `v-model:value` + `onChange` 双通道（规则 C11） | INTENDED |
| I2 | `onInput` 不暴露（rc 内部通道，antd 文档未列） | INTENDED |
| I3 | `ref` ⇒ `expose({ focus, blur, nativeElement })`（proxyObject 语义） | INTENDED |
| I4 | `prefix` / `suffix` / `upIcon` / `downIcon` / addon ⇒ `VNodeChild`（组件对象按 D42 归一化） | PLATFORM |
| I7 | `ContextIsolator(form)` 不复刻（本仓 Compact 不含 form 上下文注入） | INTENDED |
| I9 | `_InternalPanelDoNotUseOrYouWillBeFired` 暂不导出（依赖 ConfigProvider 组件级 token 覆盖） | INTENDED |
| U12 | axe 的 `label` 规则豁免（input 无关联 label，与上游 a11y 测试同判） | UPSTREAM |

## 3. 两层组件（Vue 平台约束）

antd 的 legacy addon 分支把 Internal 升为 `Space.Compact` 的**子级**渲染；
`useCompactItemContext` 在 Vue 里是 **setup 期 inject 快照** —— 单层实现时
inject 发生在 Compact 的 provide 之前，紧凑项类名永远拿不到（L4 实测）。
所以拆成 `InputNumber`（wrapper：告警 / prefixCls / status 合并 / addon 分支）
+ `InputNumberInternal`（引擎 + 状态机 + 类名链），Internal 作为 Compact 的
子组件渲染。antd 源码本来就是两层（forwardRef ×2），结构同构。

## 4. 已知取舍

- `handleOpacity` / `handleVisibleWidth` / padding 系 / `filledHandleBg`
  为**构建期解析值**（collapse D46/D50 同判），用户主题覆盖这些 Component
  Token 在静态 CSS 下不生效。
- antd 产物的两条死规则（`:hover -handler-wrap`、`-textarea-rtl`）中，
  handler-wrap 按产物保留（对拍减少噪音），textarea 选择器丢弃（Input/Affix
  共享段，本组件 DOM 不可达）。
- `changeOnWheel` 在 `type="number"` 原生属性同用时行为冲突 —— antd 有 usage
  告警，本仓对齐（console.error 通道）。
