# Radio 实现说明

## 1. 对应 antd 组件

- antd 6.6.4 · `es/radio/` + `@rc-component/checkbox@2.0.0`（只读参照，H2）
- 分析产物：`docs/analysis/radio.md`（G1，先于实现存在；§8 是与 extractStyle 产物的逐条对照）
- 复合组件：`Radio`（注册名 `ARadio`）+ 静态属性 `Radio.Group` / `Radio.Button`
  + 具名别名 `RadioGroup` / `RadioButton` + `Radio.__ANT_RADIO`
- 样式：`genRadioStyle()` 与 antd `extractStyle` 产物**逐条对齐** —— 92 条规则、
  选择器集合**完全一致**、零属性差异（只多出 16 条 Component Token 声明，antd 把它们
  放在独立的 cssVar 块里）

## 2. 与 antd 的行为差异清单

同步到 `COMPATIBILITY.md` §9.2（D43–D48）与 §9.2.1（U7–U8）。

| # | 差异 | 分类 | 证据 |
|---|---|---|---|
| D43 | Wave 波纹不实现；`ant-wave-target` 类保留（**仅非 button 形态**） | PLATFORM | L1「非 button 形态带 ant-wave-target，button 形态不带」+ L4 |
| D44 | `-wrapper-in-form-item` 恒 `false`（form 未落地） | PLATFORM | interface 注释 |
| D45 | Group 的 `name` 默认走 `useId()`（值格式与 React 不同，语义相同） | PLATFORM | L1「未传 name ⇒ 自动生成且整组一致」 |
| D46 | Component Token 落 `var(--apollo-*)` 别名派生；`radioSize` / `dotSize` 按默认主题算成常量 | INTENDED | L7 `theme.test.ts` |
| D47 | `RadioButton` 与 `Radio` 共用同一份 props（antd 的类型更窄） | INTENDED | L3 `type.test-d.ts` |
| D48 | 额外发出 `update:checked` / `update:value`（规则 C11 的 v-model 映射） | INTENDED | L1「v-model（规则 C11）」三条 |
| — | demo `radiogroup-more` 用原生 `<input>` 替代 `Input variant="filled"`（Input 未落地） | PLATFORM | demo 文件头 |
| — | demo `component-token` / `wireframe` 用 CSS 变量覆盖替代 ConfigProvider 的 token 注入 | PLATFORM | demo 文件头 + 对应的 `.md` |
| — | demo `style-class` 用 demo 自带 `<style>` 替代 `antd-style` 的 `createStyles` | PLATFORM | demo 文件头 |
| U7/U8 | 上游两条**死选择器**逐字保留（`.apollo-button-wrapper`、`.apollo-radio-button-wrapper .apollo-radio`） | 跟随上游 | L7 + L6 15/15 exact |
| U9 | 上游的 `-wrapper-checked` 判据不含非受控内部态（`defaultChecked` 时 span 有 `-checked`、wrapper 没有）逐字保留 | 跟随上游 | L4 `radio:default-checked` + L1 |

## 3. .vue / .tsx 选择

- `Radio.ts` / `Group.ts` / `RadioButton.ts` 用渲染函数（非 SFC），与 `Checkbox.ts` 同判：
  DOM 分配跨 **label / span / input** 三层（`title` 落 label、语义 `icon` 落 span、
  `id/name/required/tabIndex/value/type` 与 focus/blur/key 事件落 input、
  hover 事件落 label），模板表达这种「同组 attrs 按目标拆分」反而更绕。
- 另有一处 `.vue` 无法表达的：button 形态下**整段 prefixCls 换名**
  （`${radioPrefixCls}-button`），四层类名同时变 —— 用 `computed` 算前缀最直观。

## 4. Component Token 清单（16 个）

与 antd 的 `ComponentToken` 接口**逐字段对齐**（规则 R7）：

| 分组 | Token |
|---|---|
| Radio（3） | `radioSize`、`dotSize`（两个都是 **unitless 常量**）、`dotColorDisabled` |
| Radio buttons（11） | `buttonSolidCheckedColor`、`buttonSolidCheckedBg`、`buttonSolidCheckedHoverBg`、`buttonSolidCheckedActiveBg`、`buttonBg`、`buttonCheckedBg`、`buttonColor`、`buttonCheckedBgDisabled`、`buttonCheckedColorDisabled`、`buttonPaddingInline`、`wrapperMarginInlineEnd` |
| internal（2） | `radioColor`、`radioBgColor`（wireframe 分支的两个，按 `wireframe=false` 取值） |

- 除两个 unitless 量外全部落 `var(--apollo-*)`；声明在
  `.apollo-radio-group` / `.apollo-radio-wrapper` / `.apollo-radio-button-wrapper` 三处
  （对应 antd 把 `-css-var` 类同时挂在 Group 根 div 与 Radio wrapper label 上）。
- ⚠️ `radioSize` / `dotSize` **不随主题缩放**：antd 的 unitless 集合要求它们是裸数字，
  消费侧写 `calc(var(--apollo-radio-radio-size) * 1px)`；声明成 `16px` 会得到非法的
  `calc(16px * 1px)`，宽高整条失效。CSS 没有「长度去单位」的手段（D46）。
- ⚠️ `radioFocusShadow` / `radioButtonFocusShadow`（antd `RadioToken` 的 mergeToken 产物）
  在实测产物里**从未被 `var()` 消费** —— 焦点环走 `genFocusOutline`，所以不落变量
  （与 `spin` 的「声明但未消费」同判）。

## 5. 关键判据速查

- **checked 有两个来源，别合并**：
  - `mergedChecked` = Group 内 `props.value === groupContext.value`，否则 `props.checked`
    —— 驱动 **wrapper 的 `-wrapper-checked`** 与语义 `props.checked`；
  - `effectiveChecked` = 内部态（`useControlledValue`）—— 驱动 **span 的 `-checked`** 与
    input 的 `checked`。
  后果：`<Radio defaultChecked />` 时 **span 有 `-checked`、wrapper 没有**（上游不一致，
  逐字保留；`baselines/radio.dom.json` 的 `radio:default-checked` 是证据）。
- **`value` 是相等比较不是 includes**：Group 内 `props.value === groupContext.value`
  —— 与 checkbox 组的数组语义完全不同。
- **Group 的 `onChange` 只在值变了才发**（`val !== lastValue`）⇒ 点已选中的项不发事件，
  与 checkbox 组「点同一项会 toggle」正相反。
- **disabled 三级合并**：`props.disabled ?? group.disabled ?? DisabledContext`（`??` 判据，
  显式 `false` 能关闭）。
- **`title` 落 label**（不是 span —— 上游 issue 46739 的修复点，与 checkbox 的关键差异）。
- **button 形态换整段前缀**：`prefixCls = ${radioPrefixCls}-button`，label/span/input/
  label-span 四层类名全换；`ant-wave-target` 只在非 button 形态加。
- **options 渲染出的 Radio 没有 `-group-item` 类**（checkbox 有、radio 没有）。
- **`orientation` 压过 `vertical`**，两者都不透传到根 div；根 div 只收 `aria-*` / `data-*`。
- **`optionType` 直接传给 Radio 会发 usage 告警**（判据用 `!== undefined`，PITFALLS 13）。
- **事件冒泡锁复用 checkbox 的 `useBubbleLock`**（label click 设 raf 锁）。

## 6. 验证证据

| 层 | 结果 |
|---|---|
| L1/L2 | `__tests__/index.test.ts` 54 条通过 |
| L3 | `__tests__/type.test-d.ts` 10 条（含 5 条负例闭包） |
| L4 | `__tests__/semantic.test.ts` 31 条 —— 与机械基线 `tests/compat/baselines/radio.dom.json` 逐节点一致 |
| L5 | `__tests__/a11y.test.ts` 14 个 demo 0 violation |
| L6 | `tests/visual` 15 张**全部 0.000% exact**（React 基线已入库） |
| L7 | `__tests__/theme.test.ts` 14 条 + `demo.test.ts` 14 个 demo 冒烟 |
| 样式对照 | 与 antd extractStyle 产物 92/92 条规则选择器完全一致，零属性差异 |

## 7. 已知缺口

- **Wave 波纹动画**：将来做 wave 基建时补（类名已对齐）。
- **`-wrapper-in-form-item`**：form 落地后接 `FormItemInputContext`。
- **form 的 `name` 注入**：antd 的 `useId(toNamePathStr(formItemName))` 在 Form.Item 内会
  拿到表单字段名（`preference` / `0_preferences` 这类）。本仓 form 未落地 ⇒ 恒走
  `useId()` 生成。落点：`packages/ui/src/form` 的 `FormItemInputContext`（与 D44 同一处）。
- **v-model 通道是全仓统一缺口**（D48）：radio 已实现 `update:checked` / `update:value`，
  其余 21 个已收口组件都还没有 `update:*` ⇒ 在它们上 `v-model:xxx` 不生效。
  落点：各组件逐个补（纯增量，不改 DOM），建议在某个整合期统一做一遍。
