# Checkbox 实现说明

## 1. 对应 antd 组件

- antd 6.6.4 · `es/checkbox/` + `@rc-component/checkbox@2.0.0`（只读参照，H2）
- 分析产物：`docs/analysis/checkbox.md`（G1，先于实现存在）
- 复合组件：`Checkbox`（注册名 `ACheckbox`）+ 静态属性 `Checkbox.Group`

## 2. 与 antd 的行为差异清单

| # | 差异 | 分类 | 证据 |
|---|---|---|---|
| D5 | 无 hash / css-var 包裹类；**Component Token 0 个**（antd 同 —— `genStyleHooks` 未传 prepareComponentToken） | INTENDED | L7「无变量契约」 |
| D6 | 前缀 `apollo-checkbox`；`ant-wave-target` 类保留（Wave 的固定常量类，不随前缀变，L4 产物逐字对齐；波纹动画本身不实现 —— button/skeleton 同判） | INTENDED | L4 |
| — | Wave 点击波纹动画不实现 | PLATFORM | L1/L6 |
| — | `FormItemInputContext`（`-wrapper-in-form-item`）依赖 form 未落地 ⇒ 恒 false | PLATFORM | interface 注释 |
| — | `useBubbleLock` 用 `@apollo-design/utils` 的 raf（可 cancel、jsdom 有 polyfill） | PLATFORM | L1 冒泡锁用例 |
| — | demo `disabled` 加了文字 children（axe 要求 label 有可访问名；上游空 label 放行） | PLATFORM | demo 文件头 |
| — | demo `custom-line-width` 用语义化 `styles.icon` 替代 `ConfigProvider theme.token.lineWidth` | PLATFORM | demo 文件头 |
| — | `useControlledState`（rc-util）→ `useControlledValue`（utils，受控/非受控二选一） | PLATFORM | L1 |

## 3. .vue / .tsx 选择

- `Checkbox.ts` / `Group.ts` 渲染函数（非 SFC）：DOM 分配跨 **label / span / input** 三层
  （rc-checkbox 语义：title 与语义 icon 落 span、id/name/required/tabIndex/事件落 input、
  hover 事件落 label），模板表达这种「同组 attrs 按目标拆分」反而更绕。

## 4. Component Token 清单（0 个）

无。样式全 alias token：`controlInteractiveSize`（尺寸）、`colorPrimary`（选中）、
`colorBgContainerDisabled` / `colorTextDisabled`（禁用）等。用户想改尺寸走
ConfigProvider 的全局 token。

## 5. 已知缺口

- Wave 波纹动画（将来做 wave 基建时补，类名已对齐）。
- `-wrapper-in-form-item`（form 落地后接 FormItemInputContext）。

## 6. 关键判据速查

- **checked 三源**：Group 内（非 skipGroup）⇒ `group.value.includes(value)`；
  否则受控 `checked` / 非受控 `defaultChecked`（useControlledValue）。
- **disabled 三级**：`props.disabled ?? group.disabled ?? DisabledContext`（?? 判据，
  `false` 能显式关闭）。
- **indeterminate 是副作用**：直接写 `input.indeterminate`；watchEffect（pre-flush）
  在首帧 ref 未赋值时跑完 ⇒ **onMounted 再补一次**（坑 #38）。
- **Group 的 onChange 值**：`newValue.filter(已注册).sort(options 顺序 → 注册顺序)`
  —— 空 options 时 antd 比较器恒 0 但测试期望按注册序（issue 17297），以测试为契约。
- **Group context 必须响应式**：`reactive({ value: computed })` 自动解包 ——
  provide 快照会让受控 value 用例红（坑 #39）。
- **Group 的 onChange 不能进 domProps**：否则 change 冒泡到根 div 的原生监听 ⇒
  onChange 被多调一次（坑 #40）。attrs 是 readonly proxy —— 不能 delete，
  在渲染时解构排除。
- **事件冒泡锁**：label click 设 raf 锁，锁期内 input click stopPropagation。
- **`value` 在组外发 usage 告警**（console.error，`Warning: [apollo Checkbox] …`）。
