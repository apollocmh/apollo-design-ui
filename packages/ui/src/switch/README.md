# Switch 实现说明

## 1. 对应 antd 组件

- antd 6.6.4 · `es/switch/` + `@rc-component/switch@1.0.3`（只读参照，H2）
- 分析产物：`docs/analysis/switch.md`（G1，先于实现存在；§8 是与 extractStyle 产物的逐条对照）
- **无子组件**（与 Radio/Checkbox 不同）；有静态标记 `Switch.__ANT_SWITCH`
- 样式：`genSwitchStyle()` 与 antd `extractStyle` 产物**逐条对齐** —— 选择器集合
  **完全一致**、零属性差异（只多 13 条 Component Token 声明，antd 把它们放在独立的
  cssVar 块里）

## 2. 与 antd 的行为差异清单

同步到 `COMPATIBILITY.md` §9.2（D49–D53）。

| # | 差异 | 分类 | 证据 |
|---|---|---|---|
| D49 | Wave 波纹不实现（Switch 的产物里**本来就没有** `ant-wave-target`） | PLATFORM | L4（20 用例与机械基线逐节点一致） |
| D50 | **13 个 Component Token 是构建期算好的解析值**（`22px` / `44px` / `#fff` / `rgba(0,35,11,0.2)` …），不随主题缩放 | INTENDED | L7 `theme.test.ts` + L6 15/15 exact |
| D51 | `ref` 暴露对象（`{ nativeElement, focus, blur }`）而非 `HTMLButtonElement` 本身 | PLATFORM | interface.ts 注释 |
| D52 | 额外发出 `update:checked` / `update:value`（规则 C11 的 v-model 映射） | INTENDED | L1「告警与 v-model」四条 |
| D53 | 两个 antd 字面量（`border-radius:100px`、loading 图标色 `rgba(0,0,0,opacityLoading)`）按 `CAPSULE_RADIUS_DECL` / `LOADING_ICON_COLOR_DECL` 收敛到 `token.ts` | INTENDED | L7「两个字面量声明」 |
| — | `loading-icon` 选择器用 `.apollo-icon`（antd 产物是 `.anticon`） | INTENDED | D14/D15 |
| — | demo `basic` / `disabled` / `loading` / `size` / `style-class` 加了 `aria-label`（axe 要求 `role="switch"` 有可访问名） | PLATFORM | demo 文件头 + L5 |
| — | demo `style-class` 用 demo 自带 `<style>` 替代 `antd-style`；`component-token` 用 CSS 变量覆盖替代 ConfigProvider 注入 | PLATFORM | demo 文件头 |

## 3. .vue / .tsx 选择

- `Switch.ts` 用渲染函数（非 SFC），与 `Checkbox.ts` / `Radio.ts` 同判：
  - DOM 是**三层固定结构**（`-handle` / `-inner` / 两个 `-inner-*` span），
    且 `-handle` 与两个 inner span **恒存在**（只有图标是条件渲染）—— 模板里写
    `v-if` 二选一反而会写错；
  - attrs 需要**按目标拆分**：`onKeyDown` / `onClick` 被 rc-switch 包装（不是直接绑定），
    其余才原样落到 `<button>`。

## 4. Component Token 清单（13 个）

与 antd 的 `ComponentToken` 接口**逐字段对齐**（规则 R7）。`padding = 2` 是固定值。

| Token | 计算方式 | 默认值 |
|---|---|---|
| `trackHeight` | `fontSize * lineHeight` | `22px` |
| `trackHeightSM` | `controlHeight / 2` | `16px` |
| `trackMinWidth` | `handleSize * 2 + padding * 4` | `44px` |
| `trackMinWidthSM` | `handleSizeSM * 2 + padding * 2` | `28px` |
| `trackPadding` | 固定值 2 | `2px` |
| `handleBg` | `colorWhite` | `#fff` |
| `handleShadow` | `0 2px 4px 0 rgba(0,35,11,0.2)`（antd 硬编码 `#00230b`） | 同左 |
| `handleSize` | `trackHeight - padding * 2` | `18px` |
| `handleSizeSM` | `trackHeightSM - padding * 2` | `12px` |
| `innerMinMargin` | `handleSize / 2` | `9px` |
| `innerMaxMargin` | `handleSize + padding * 3` | `24px` |
| `innerMinMarginSM` | `handleSizeSM / 2` | `6px` |
| `innerMaxMarginSM` | `handleSizeSM + padding * 3` | `18px` |

- ⚠️ **值是构建期算好的解析值**（`prepareComponentToken(getDesignToken())`），不是
  `calc()` 组合 —— 理由见 `style/token.ts` 文件头：`trackHeight` 的 JS 值恰好是 `22`，
  改写成 `calc(var(--apollo-font-size) * var(--apollo-line-height))` 会让浏览器算出
  `21.999999999999996` 这类浮点，L6 出现亚像素漂移。**代价**：不随主题缩放（D50）。
- ⚠️ **dark 主题下有两条已知分叉**（登记在 `tests/visual/matrix.mjs` 的 LIMITATIONS）：
  `handleBg`（= `colorWhite`）与 `handleShadow`（antd 硬编码色）在 dark 下 antd 会重新
  生成、我们不会。等 dark 并入 `THEMES` 时决定是否补分支。
- 零运行时下用 CSS 变量覆盖即可自定义：

```css
.my-scope .apollo-switch {
  --apollo-switch-track-height: 14px;
  --apollo-switch-handle-size: 20px;
}
```

## 5. 关键判据速查

- **受控 / 非受控是「双别名」**：`checked ?? value`（受控）、
  `defaultChecked ?? defaultValue ?? false`（非受控初值）—— `value` / `defaultValue`
  **不是**「选项值」（与 Radio/Checkbox 的 `value` 语义完全不同）。
- **`loading` 强制 disabled**：`(props.disabled ?? DisabledContext) || loading`
  —— `||` 判据，所以 loading 时 `-disabled` 类也出现、`disabled` 属性也为真。
- **`onChange` 是 `(checked, event)` 两个参数**（不是事件对象）；**disabled 时不发**。
- **`onClick` 收到「结果值」**（不是原生事件），且 **disabled 时仍会触发**
  （rc-switch 的 legacy 语义；⚠️ 浏览器会抑制 disabled 按钮的 click 派发，
  所以 L1 用 `dispatchEvent` 才能观测到）。
- **左右方向键**：`ArrowRight` ⇒ true、`ArrowLeft` ⇒ false；判据是 **`e.which`**
  （rc-util 的 `KeyCode`，不是 `e.key`）。
- **`size` 走 `useSize` 的「函数形态」**：`useSize((ctx) => props.size ?? ctx)`
  —— 写成 `useSize(props.size)` 只在 setup 期读一次，受控切换 size 会静默失效
  （PITFALLS 163，radio 同源已修）。
- **DOM 三层恒存在**：`-handle` 与 `-inner-checked` / `-inner-unchecked` 都无条件渲染。
- **`size="default"` 发 deprecation 告警**（提示改用 `"medium"`），视觉与 medium 相同。
- **5 处 `@media (prefers-reduced-motion: reduce)`**，且**没有** hover media query
  —— 与 radio 同侧、与 checkbox 相反。

## 6. 验证证据

| 层 | 结果 |
|---|---|
| L1/L2 | `__tests__/index.test.ts` 28 条通过 |
| L3 | `__tests__/type.test-d.ts` 10 条（含 3 条负例闭包） |
| L4 | `__tests__/semantic.test.ts` 20 条 —— 与机械基线 `tests/compat/baselines/switch.dom.json` 逐节点一致 |
| L5 | `__tests__/a11y.test.ts` 7 个 demo 0 violation |
| L6 | `tests/visual` 15 张全部 0.000% exact（React 基线已入库） |
| L7 | `__tests__/theme.test.ts` 10 条 + `demo.test.ts` 7 个 demo 冒烟 |
| 样式对照 | 与 antd extractStyle 产物选择器集合完全一致，零属性差异（只多 13 条 token 声明） |

## 7. 已知缺口

- **Wave 波纹动画**：将来做 wave 基建时补。
- **dark / compact 主题**：13 个 token 是构建期常量（D50），其中 `handleBg` /
  `handleShadow` 在 dark 下会与 antd 分叉 —— 落点是 `matrix.mjs` 的 LIMITATIONS
  条目 `switch·dark-compact`。
- **`@media (hover: hover)`**：antd 的 switch 没有这条包裹（与 radio 同），
  所以触屏设备的 hover 行为与桌面一致 —— 不是缺口，是**跟随上游**。
- **v-model 通道仍是全仓缺口**（D52 的姊妹项）：switch 与 radio 已实现 `update:*`，
  其余 20 个已收口组件还没有。
