# ColorPicker 实现说明

> 规则 R1：本文件必须记录（G11 前补齐）。**当前为 G4 未完成状态** ——
> 下面 §2 / §5 是「已落地」与「已知缺口」的**如实**记录，不是最终版。

## 1. 对应 antd 组件

- antd 6.6.4 · `es/color-picker/`（只读参照，H2）
- 契约全文：`docs/analysis/color-picker.md`（G1 + §7 第二轮实测）
- rc 内核：`@rc-component/color-picker@3.1.1` —— registry 判为 **`in-ui`**，
  落点 `packages/ui/src/color-picker/engine/`

### 已落地的文件（G2/G3 + 引擎纯逻辑）

```
color-picker/
├── interface.ts            # G2：props / emits / slots / expose 全量（H2 重新定义）
├── color.ts                # AggregationColor（渐变 + cleared 的公共值类型）
├── util.ts                 # generateColor / getColorAlpha / genAlphaColor / getGradientPercentColor
├── engine/
│   ├── interface.ts        # rc 的类型面 + ColorConstructorInput（见 PITFALLS 321）
│   ├── color.ts            # Color extends utils.Color（+ toHsb / toHsbString / setHue）
│   ├── util.ts             # 纯几何：calculateColor / calcOffset / HUE_COLORS / defaultColor
│   ├── use-color-drag.ts   # 拖拽内核（读矩形 + 挂/摘 document 监听）
│   ├── use-color-state.ts  # 受控/非受控归一
│   └── components/         # ColorBlock / Handler / Palette / Picker（.ts 纯渲染函数）
├── style/
│   ├── token.ts            # G3：9 个 mergeToken 派生（声明成 --{p}-color-picker-*）
│   └── index.ts            # G4：92 条规则，全部前缀参数化
└── __tests__/
    ├── color.test.ts       # L1 纯逻辑 25 条（含几何边界）
    ├── engine.test.ts      # L1/L2 引擎 15 条（拖拽链 + 渲染件 + 事件名哨兵）
    └── theme.test.ts       # L7 token/规则 21 条（含 B7 双向 + 前缀参数化 + 括号配平）
```

**尚未落地**（G4b）：`ColorPicker.vue` / `ColorPickerPanel` / `ColorTrigger` / `PanelPicker` /
`GradientColorBar` / `ColorSlider` / `ColorPresets` / `ColorInput` 家族 / `PurePanel`。

**有意不移植**（引擎里上游有、本仓不需要）：

| 上游 | 理由 |
|---|---|
| `engine/components/Slider.js`（rc 的滑块） | antd 的 `PanelPicker` **永远**传 `components={{ slider: ColorSlider }}` ⇒ 这条分支是死代码；本仓连 `ColorSlider` 都还没写，先不搬 |
| `engine/components/Gradient.js` | 只被上面那个死滑块用 |
| `engine/components/Transform.js` | **内联进 `Picker`** —— 它存在的唯一意义是承载 `forwardRef`，Vue 里模板 ref 直接挂 `div` 更简单（**DOM 产物逐字节相同**） |

## 2. 与 antd 的行为差异清单

<!-- 同步到 COMPATIBILITY.md §9；分类只能是 BUG / INTENDED / PLATFORM / UPSTREAM（AGENTS.md §4.3） -->

| # | 差异 | 分类 | 依据 |
|---|---|---|---|
| 1 | 9 个 `mergeToken` 派生值**声明成 CSS 变量**（上游内联字面量） | INTENDED | H9 + E10（`box-shadow:inset` 前缀）+ 主题自适应；计算值逐位相同，见 `style/token.ts` 文件头 |
| 2 | 引擎 `Color` 的构造器额外接受 `{h,s,v,a}` | PLATFORM | rc 的 `setHue` 把 `toHsv()` 结果直接回传构造器，上游靠 `FastColor` 的运行时分支兜底（PITFALLS 321） |
| 3 | **没有 `ContextIsolator` 等价物** | PLATFORM | 本仓无此物；面板侧无任何子件读 `useFormItemInputContext` ⇒ 行为等价（§7.3） |
| 4 | `ColorSlider` 走 `#handle` scoped slot 而非 `handleRender` context | PLATFORM（**待 G4 验证**） | 本仓 `Slider` 不消费 `sliderInternalContextKey`（PITFALLS 319） |
| 5 | `getGradientPercentColor` 对空数组返回 `''`（上游抛 `TypeError`） | PLATFORM | 防御性差异；空数组不是可达路径（见 `util.ts` 的注记） |
| 6 | **无 `expose`**（上游无 ref 转发） | — | `ColorPicker.d.ts` 是裸 `React.FC`，`ColorPicker.js` 里 `forwardRef` 出现 **0** 次 |

## 3. .vue / .tsx 选择

- 默认 `.vue`。引擎的 5 个**纯渲染函数型**内部件（`ColorBlock` / `Handler` / `Transform` /
  `Palette` / `Gradient`）计划用 `.ts` 渲染函数 —— 理由 = `COMPONENT-RULES.md` §2 条件 1
  （纯渲染函数型内部件）。**待 G4 落地时确认并在此写明**。

## 4. Component Token 清单

<!-- registry 数据：token 数 = 0 -->

**用户可覆盖的 Component Token：0 个**（上游 `export interface ComponentToken {}`，实测
产物里 `--ant-color-picker-*` 声明 **0** 条）。

但 **9 个 `mergeToken` 派生**（用户**不可**覆盖）在本仓声明成
`--apollo-color-picker-*`（有意差异，见 §2 第 1 条）：

| 变量 | 值 |
|---|---|
| `--apollo-color-picker-width` | `234px` |
| `--apollo-color-picker-handler-size` | `16px` |
| `--apollo-color-picker-handler-size-sm` | `12px` |
| `--apollo-color-picker-alpha-input-width` | `44px` |
| `--apollo-color-picker-input-number-handle-width` | `16px` |
| `--apollo-color-picker-preset-color-size` | `24px` |
| `--apollo-color-picker-inset-shadow` | `inset 0 0 1px 0 var(--apollo-color-text-quaternary)` |
| `--apollo-color-picker-slider-height` | `8px` |
| `--apollo-color-picker-preview-size` | `calc(var(--apollo-color-picker-slider-height) * 2 + var(--apollo-margin-sm))` |

实测：**9 条声明、9/9 全部被规则引用、无死变量**（`theme.test.ts` 钉住）。

## 5. 已知缺口

| # | 缺口 | 落点 / 状态 |
|---|---|---|
| 1 | **G4 未开始**（全部组件与引擎内部件） | 下一步；硬约束见 `PLAN.md` §「G4 的硬约束」 |
| 2 | `ColorSlider` 的 `#handle` 槽能否覆盖 `onFocus` / `onKeyDown` **未验证** | G4 必验；若不能则「键盘删点」与「focus 激活」需登记 INTENDED 并给等价路径 |
| 3 | 16 个 demo 未建（其中 3 个依赖 `PurePanel` / 面板直出） | G11 |
| 4 | 未加 `ANTD_LITERAL_COLOR_SKIP` 的 `rgba(0, 0, 0, 0.45)` 豁免 | ⚠️ **G4 前必须加**：`style/index.ts` 用了它（上游 `style/presets.ts` 的字面量）⇒ 否则 `registry:validate` 的 **E10 会红** |
