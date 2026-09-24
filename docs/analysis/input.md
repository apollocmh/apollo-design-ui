# Input（输入框）· G1–G3 分析产物

> 步骤 3 的产物先于步骤 5 存在（AGENTS.md §2）。
> 事实来源：antd 6.6.4 `es/input/`（index 14 + Input 181 + TextArea 162 +
> Password 145 + Search 197 + Group 49 + OTP 331 + utils 2 + hooks 21 +
> style 1197）+ `@rc-component/input@1.3.1`（es/ 938 行：Input 203 +
> TextArea 190 + BaseInput 138 + ResizableTextArea 121 + calculateNodeHeight
> 119 + hooks 83 + commonUtils 70）+ 仓库源码 `components/input/`。
>
> 依赖替换（registry 已登记）：`@rc-component/input` strategy=in-ui ⇒
> `packages/ui/src/input/engine/`（消费者：input / typography）。
> ⚠️ registry 备注：**必须保留输入法组合态（IME）处理能力，不可简化**。

---

## 1. 组件一句话

输入框家族：`Input`（含 prefix/suffix/allowClear/addon/showCount）、
`TextArea`（autoSize 自适应高度 + count）、`Password`（可见性切换）、
`Search`（搜索按钮）、`Group`（紧凑组，deprecated）、`OTP`（验证码分格）。
底层是「受控值 + 输入法组合态 + 计数裁剪」的引擎。

## 2. 引擎状态机（rc-input 1.3.1 逐行）

```
useMergedValue(defaultValue, value) ⇒ formatValue（undefined/null ⇒ ''）
compositionRef（组合态闸门） + keyLockRef（Enter 去重）
triggerChange(e, currentValue, info):
  cutValue = getExceedValue(currentValue, compositionRef)   // 超长裁剪（组合态不裁）
  info.source === 'compositionEnd' && currentValue === cutValue ⇒ 跳过（issue 46587 去重）
  setValue(cutValue) → resolveOnChange(input, e, onChange, cutValue)
resolveOnChange：克隆事件（cloneNode），把 target/currentTarget.value 换成裁剪后的值
  ⇒ 用户拿到的 e.target.value 是**组件算出来的值**，不是 DOM 原值（issue 45737/46598）
Enter：!keyLockRef && !e.nativeEvent.isComposing ⇒ onPressEnter + 上锁（keyup 解锁）
clea r：handleReset ⇒ setValue('') + focus + resolveOnChange（click 事件 ⇒ value=''）
```

- **计数**：`countConfig = { show, showFormatter, strategy, max, exceedFormatter }`；
  `dataCount = show ? formatter?.({value,count,maxLength}) ?? \`${count} / ${max}\` : undefined`；
  `isOutOfRange ⇒ -out-of-range`；`exceedFormatter` 仅在**非组合态**生效，改动后恢复选区。
- **受控不落内部态**：`useControlledState` 语义（本仓 `useControlledValue`）。
- **DOM 结构**（BaseInput 的三层可选包裹，判据是 `hasPrefixSuffix` / `hasAddon`）：
  ```
  (hasAddon)  span.{p}-group-wrapper[-disabled] > span.{p}-wrapper.{p}-group
                > span.{p}-group-addon{addonBefore} + <内元素> + span.{p}-group-addon{addonAfter}
  (hasAffix)  span.{p}-affix-wrapper[-disabled|-focused|-readonly|-input-with-clear-btn]
                > span.{p}-prefix? + <input|textarea> + span.{p}-suffix{clearBtn? + suffix}
  (裸)        <input|textarea>.{p}[-{variant}][-sm|-lg|-rtl|-disabled|-out-of-range]
  ```
  - clear 按钮：`button.{p}-clear-icon[-hidden|-has-suffix]`，`onMouseDown` 防失焦
    （issue 31200），`type="button"`，默认图标是 `CloseCircleFilled`。
  - 根节点恒带 `className` / `style`（BaseInput 最后 cloneElement 合并）。
- **TextArea autoSize**：`calculateNodeHeight` 用隐藏 textarea 量测
  （padding/box-sizing/border 逐项计算，minRows/maxRows 收敛），
  `resize:both` 被用户拖动后 ⇒ `height:auto` 变脏（TextArea 侧的
  `-textarea-affix-wrapper-resize-dirty`）。

## 3. antd 包装层（每个子组件的合并链）

| 子组件 | prefixCls | 关键合并 |
|---|---|---|
| Input | `input` | variant/status/size/compact/语义；deprecated ×3；allowClear 经 `useAllowClear`；`useRemovePasswordTimeout`（防 Chrome 自动填充密码） |
| TextArea | `input` | 同上（variant 键 `'textArea'`）；showCount ⇒ `-textarea-show-count`；mouse-active/resize-dirty |
| Password | `input` | 包 Input：内部 `type=password` + 可见性 toggle（`EyeInvisibleOutlined`/`EyeOutlined`，`visibilityToggle`，`iconRender`），`action="password"` 隐藏自动填充 |
| Search | `input-search` + `input` | 结尾按钮：无 enterButton ⇒ 输入框内 suffix 图标；`enterButton` ⇒ Button（经 Compact 拼接）；onSearch(value, e, {source})；Enter 触发 |
| Group | `input` | `Input.Group`（deprecated ⇒ Space.Compact） |
| OTP | `input-otp`？ | 分格验证码（keyboard/paste/mask），独立样式 |

共同：语义槽合并顺序 `[contextClassNames, classNames]` /
`[contextStyles, contextStyleRoot, styles, styleRoot]`（style 覆盖 styles.root）。

## 4. Props / Events / Ref（本轮范围：Input / TextArea / Password / Group）

- **Input**：`value/defaultValue`、受控 `onChange(e)`（e.target.value 是裁剪后的值）、
  `onPressEnter`、`prefix/suffix/allowClear({clearIcon,disabled})`、
  `addonBefore/addonAfter`（deprecated）、`size`、disabled/readOnly、
  `variant/bordered(deprecated)`、`status`、`showCount({formatter})`、
  `count({strategy,max,exceedFormatter,show})`、`maxLength`、`htmlSize`、
  语义槽 `{root,prefix,suffix,clear,input,count}`。
  **Ref**：`focus(option)`、`blur()`、`setSelectionRange`、`select`、`input`、`nativeElement`。
- **TextArea**：`autoSize({minRows,maxRows}|bool)`、`showCount`、`allowClear`、
  `onResize`、语义槽 `{root,textarea,clear,count}`；Ref：`focus/blur/resizableTextArea/nativeElement`。
- **Password**：`visibilityToggle(true)`、`iconRender`、其余透传 Input。
- **Group**：`compact`?（antd 的 Group 只是 `Space.Compact` 别名 + deprecated 告警）。

## 5. 样式契约

- registry 数据：Input 组 **0 个 Component Token**（antd 的 `genStyleHooks('Input')`
  没传 prepareComponentToken）；但 `es/input/style/token.js` 仍导出
  `initComponentToken`（InputNumber 的样式已经复用它）——本仓照抄这一事实：
  `style/token.ts` 只导出**共享的 input 族基础 token**（供 InputNumber 复用），
  Input 组件自身不声明 `--apollo-input-*` 组件 token（与 checkbox 的「无 Component Token」同判）。
- 产物规模：`style/index.js` 566 行（共享 + input + addon/affix wrapper + count +
  clear + compact-item）+ `variants.js` 344 行（四 variant × 状态/禁用/反馈）+
  `textarea.js` 110 + `search.js` 58 + `otp.js` 60。

## 6. Vue API 设计（INTENDED）

| # | 差异 | 分类 |
|---|---|---|
| I1 | `value+onChange` ⇒ `v-model:value` + `onChange` 双通道（C11）；`onChange` 的事件对象克隆体用 `Object.create` 构造（保留 target/currentTarget/value） | INTENDED |
| I2 | `onClear` / `onSearch` / `onPressEnter` / `onResize` ⇒ 同名 emit + props 回调双通道（C19/QRCode #68 经验：监听器存在性从 vnode.props 探测） | INTENDED |
| I3 | `ref` ⇒ `expose({ focus, blur, setSelectionRange, select, input, nativeElement })`（getter 形态） | INTENDED |
| I4 | IME：组合态期间不裁剪、不触发裁剪后的 change（rc 判据原样保留，registry 明令不可简化） | — |
| I5 | `ContextIsolator(form/space)` 不复刻（本仓 Compact 无对应注入） | INTENDED |
| I6 | 本轮范围：Input / TextArea / Password / Group；**Search 与 OTP 顺延**（各自独立样式 + Search 依赖 Button 内部 API）—— 登记 INTENDED 缺口，见 §7 | INTENDED |

## 7. 本轮不做什么（明确登记）

1. `Input.Search` —— 需要 Button 的语义拼接与 `input-search` 独立样式；
2. `Input.OTP` —— 分格验证码（331 行 + 60 行样式），与输入框主链路弱相关；
3. `autoSize` 的 ResizeObserver 版本（rc 用 `resizeObserver` + 隐藏 textarea；
   本仓先做 mount/输入时的同步量测，ResizeObserver 留给 `utils` 的既有实现）。

## 8. 测试策略

- L1：受控/非受控、IME 组合态（compositionstart/end 的 change 去重与裁剪）、
  allowClear（点击清空 + 事件 value=''）、showCount/count 裁剪与 out-of-range、
  addon/affix 三层 DOM、deprecated、Password 可见性、autoSize 量测（jsdom 桩）。
- L4：SSR 契约（basic/prefix/suffix/allowClear/addon/size/variant/status/disabled/
  textarea/password/group），基线 `tests/compat/baselines/input.dom.json`。
- L3：类型面 + 负例闭包。
- L5/L6/L7：demo 覆盖 + 视觉矩阵。
