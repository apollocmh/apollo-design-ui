# COMPATIBILITY.md

> 定义 **React API → Vue API** 的映射规则。
> 目标：让熟悉 Ant Design 的开发者**零成本迁移心智**，同时写出地道的 Vue 代码。
> 原则：**Props / 语义 / 行为 尽量对齐 React；语法必须是 Vue-native。**

---

## 0. 兼容性的五个层级

我们不是"看起来像"，而是分层可度量的兼容。每个组件必须逐层达标：

| 层级 | 名称 | 内容 | 验证方式 |
|---|---|---|---|
| **L1** | API Shape | 组件名、Props 名、事件名、Slots 名、方法名 | `apiStatus` + 类型测试 |
| **L2** | Behavior | 交互行为、状态流转、受控/非受控、边界处理 | Interaction Test |
| **L3** | DOM Contract | 类名、DOM 层级、`data-*` 语义属性、`role` | DOM Contract Test |
| **L4** | Visual | 尺寸、颜色、间距、圆角、阴影、动效 | Visual Regression vs React 参考截图 |
| **L5** | Accessibility | `role` / `aria-*` / 键盘可达性 / 焦点管理 | a11y Test (axe) + 键盘测试 |

**L1 与 L2 必须完全对齐（除本文档登记的 INTENDED 差异）。**
**L3 / L4 允许受 Vue 平台特性影响的差异，但必须登记。**
**L5 不允许低于 Ant Design。**

---

## 1. 命名规则

### 1.1 组件名

| React | Vue | 说明 |
|---|---|---|
| `Button` | `AButton` / `<a-button>` | 全局注册时统一加 `A` 前缀，避免与 HTML 元素和用户组件冲突 |
| `Button.Group` | `AButtonGroup` / `<a-button-group>` | 子组件提升为独立组件，同时保留 `Button.Group` 静态别名以兼容 |
| `Typography.Title` | `ATypographyTitle` / `<a-typography-title>` | 同上 |
| `Grid.Row` / `Grid.Col` | `ARow` / `ACol` | antd 中 `Row`/`Col` 本就是顶层导出，Vue 侧同样顶层导出 |
| `Select.Option` | `ASelectOption` | |

**规则 C1**：同时提供两种用法
- 全局注册（推荐，antd 风格）：`app.use(ApolloUI)` → `<a-button>`
- 按需导入（推荐，tree-shaking）：`import { Button } from '@apollo-design/ui'` → `<Button />`

**规则 C2**：SFC 中使用 PascalCase 或 kebab-case 均可；**in-DOM 模板（CDN 场景）必须用 kebab-case**，因为 HTML 属性大小写不敏感。文档示例统一使用 kebab-case。

### 1.2 Props 名

**规则 C3**：**Props 名与 Ant Design 完全一致，不做任何重命名。**

| React prop | Vue prop | 说明 |
|---|---|---|
| `type` | `type` | 不改成 `variant` |
| `size` | `size` | |
| `danger` | `danger` | 布尔 prop 保持形容词原形，不改 `isDanger` |
| `loading` | `loading` | |
| `block` | `block` | |
| `disabled` | `disabled` | |
| `dataSource` | `dataSource` | 不改 `data` |
| `columns` | `columns` | |
| `items` | `items` | |
| `open` | `open` | v6 已用 `open` 取代 `visible` |
| `getPopupContainer` | `getPopupContainer` | |
| `defaultValue` | `defaultValue` | 非受控初始值语义保留 |

**规则 C4**：模板中使用 kebab-case（`:default-value`），JS/TS 中使用 camelCase（`defaultValue`）。这是 Vue 既有约定，不视为差异。

### 1.3 事件名

**规则 C5**：React 的 `onXxx` → Vue emit `xxx`（去掉 `on`，首字母小写）。

| React | Vue emit | 模板写法 |
|---|---|---|
| `onClick` | `click` | `@click` |
| `onChange` | `change` | `@change` |
| `onSelect` | `select` | `@select` |
| `onOpenChange` | `openChange` | `@open-change` |
| `onSearch` | `search` | `@search` |
| `onPanelChange` | `panelChange` | `@panel-change` |
| `onMouseEnter` | 原生 DOM 事件，透传 | `@mouseenter` |
| `onKeyDown` | 原生 DOM 事件，透传 | `@keydown` |

**规则 C6**：**原生 DOM 事件不通过 emit 声明**，而由组件通过 `$attrs` 透传到根元素（`inheritAttrs: false` + `v-bind="$attrs"`），保证 `@click` / `@focus` / `@mouseenter` 等行为与直接写在 DOM 上一致，且能参与事件冒泡。

**规则 C7**：事件 payload 与 React 回调参数顺序**完全一致**。例如 `Select.onChange(value, option)` → emit `change(value, option)`。

---

## 2. children / render / 插槽映射

| React 写法 | Vue 写法 | 备注 |
|---|---|---|
| `<Button>Submit</Button>` | `<a-button>Submit</a-button>` | `children` → 默认插槽 |
| `children: ReactNode` | `$slots.default` | |
| `icon={<SearchOutlined />}` | `<template #icon><SearchOutlined /></template>` | 也**同时支持** `icon` prop 传入 VNode，便于从 React 迁移 |
| `title="..."` | `<template #title>` 或 `:title="'...'"` | 字符串场景保留 prop 形式 |
| `extra={...}` | `<template #extra>` | |
| `footer={...}` | `<template #footer>` | |
| `renderItem={(item) => ...}` | `<template #item="{ item }">` | 见规则 C8 |
| `renderCell` / `renderOption` / `renderLabel` | `#cell` / `#option` / `#label` | |
| `dropdownRender` | `#dropdownRender` | |
| `renderEmpty` (ConfigProvider) | `#renderEmpty` | |
| `notFoundContent` | `#notFoundContent` 或 prop | |

**规则 C8（render prop → 作用域插槽）**：
- **主推**作用域插槽，因为它是 Vue 的表达方式，且模板内可用 `v-if` / 局部变量，比函数更可读。
- **兼容保留**函数形式（`renderItem` prop）。当两者同时存在时，**prop 优先**（与 React 迁移代码的预期一致）。
- 类型上两者都要声明。

**规则 C9（Fragment / 多根）**：React 用 `<>{a}{b}</>` 的地方，Vue 组件直接用多根节点（`<template>` 内多个顶层元素）。**禁止**为了"看起来像 React"而引入包装 `<div>`——那会破坏 DOM Contract。

---

## 3. 受控 / 非受控 → v-model

React 的 `value` + `onChange` 受控模式，在 Vue 中映射为 `v-model`，**并且 v-model 的参数名沿用 React 的受控 prop 名**，从而保证 prop 名零差异。

| React 受控 | Vue v-model | Vue 等价展开 |
|---|---|---|
| `value` / `onChange` | `v-model:value` | `:value` + `@update:value` |
| `checked` / `onChange` | `v-model:checked` | `:checked` + `@update:checked` |
| `open` / `onOpenChange` | `v-model:open` | `:open` + `@update:open` |
| `activeKey` / `onChange` | `v-model:activeKey` | |
| `current` / `onChange`（Pagination） | `v-model:current` | |
| `selectedKeys` / `onSelect` | `v-model:selectedKeys` | |
| `expandedKeys` / `onExpand` | `v-model:expandedKeys` | |
| `visible` / `onVisibleChange`（v5 旧名） | `v-model:open` | 同时接受 `visible` prop 并输出 deprecation warning |
| `defaultValue` | `defaultValue`（不变） | 非受控初始值，**不**改为 `initialValue` |

**规则 C10**：受控与非受控**语义完全保留**。
- 传 `value` → 受控，组件内部不自行更新显示值，只 emit
- 只传 `defaultValue` → 非受控，组件内部维护状态
- 两者都不传 → 使用组件默认值
- 从受控切到非受控（或反向）时，行为与 antd 一致（必须写测试覆盖）

**规则 C11**：`update:xxx` 与语义事件**同时**发出。例如 `Select` 在选中时：
```ts
emit('update:value', val)   // 供 v-model
emit('change', val, option) // 供语义监听，参数与 React 完全一致
```

---

## 4. ref / 命令式方法

| React | Vue | 备注 |
|---|---|---|
| `ref={ref}` + `forwardRef` | 模板 `ref="x"` + `defineExpose` | |
| `ref.current.focus()` | `compRef.value?.focus()` | |
| `useImperativeHandle(ref, () => ({...}))` | `defineExpose({ ... })` | 暴露的方法名与 antd 文档一致 |
| `Button` 暴露 `blur/focus/nativeElement` | 同名暴露 | |
| `Form` 暴露 `validateFields/resetFields/...` | 同名暴露 | |
| `Table` 暴露 `nativeElement/scrollTo/...` | 同名暴露 | |

**规则 C12**：`defineExpose` 的方法名、参数、返回值、错误抛出方式**必须与 antd 文档一致**。异步方法返回 `Promise` 的语义（resolve/reject 内容）也必须一致。

**规则 C13（静态方法）**：antd 的静态调用 API 在 Vue 侧**同名导出**：

| React | Vue |
|---|---|
| `message.success('ok')` | `import { message } from '@apollo-design/ui'; message.success('ok')` |
| `Modal.confirm({...})` | `Modal.confirm({...})` |
| `notification.open({...})` | `notification.open({...})` |
| `App.useApp()` | `useApp()` composable |
| `Modal.useModal()` | `useModal()` composable |
| `message.useMessage()` | `useMessage()` composable |

**规则 C14**：composable 返回值**结构与 React hooks 一致**（`const [api, contextHolder] = message.useMessage()` → Vue `const [api, ContextHolder] = useMessage()`，`ContextHolder` 是需在模板中渲染的组件）。

---

## 5. Hooks → Composables

**规则 C15**：**禁止**创建 `useEffect` / `useState` / `useMemo` 的模拟层。使用 Vue 原生心智模型。

| React | Vue-native 对应 | 说明 |
|---|---|---|
| `useState` + `setState` | `ref` / `reactive` | |
| `useReducer` | `reactive` + 纯函数 action | 复杂状态机可用 `form-core` 等引擎内置 reducer |
| `useEffect(fn, [])` | `onMounted(fn)` | |
| `useEffect(fn)` | `watchEffect(fn)` / `watch(src, fn)` | |
| `useEffect(fn, [deps])` | `watch(deps, fn)` | |
| `useLayoutEffect` | `watch(src, fn, { flush: 'post' })` 或 `onMounted` + `nextTick` | |
| `useMemo(fn, deps)` | `computed(fn)` | |
| `useCallback(fn, deps)` | 普通函数 / `computed` | Vue 无引用稳定性问题，**不需要** `useCallback` |
| `useRef(init)` | `ref(init)` / `useTemplateRef` | 区分"响应式值"与"DOM 引用"两种用途 |
| `useContext` | `inject` + `provide` | |
| `useImperativeHandle` | `defineExpose` | |
| `useSyncExternalStore` | `shallowRef` + `onMounted` 订阅 / `onScopeDispose` 清理 | |
| `useId` | `useId()` (Vue 3.5+) | |
| 自定义 `useXxx` | `useXxx` composable | **命名保持 `use` 前缀**，保持 API 熟悉度 |
| `React.memo` | 不需要（Vue 细粒度响应式） | 禁止用 `shallowRef` 冒充 `memo` |
| `React.forwardRef` | 不需要 | |

**规则 C16**：React 侧的 `useXxx` 工具函数（如 `useToken` / `useZIndex` / `useBreakpoint`）在 Vue 侧**保留同名**的 composable，便于对照与迁移。

---

## 6. 类型映射

| React 类型 | Vue 类型 | 备注 |
|---|---|---|
| `React.ReactNode` | `ApolloNode`（本项目定义） | `= VNode \| string \| number \| boolean \| null \| undefined \| ApolloNode[]` |
| `React.ReactElement` | `VNode` | |
| `React.CSSProperties` | `CSSProperties`（from `vue`） | |
| `React.MouseEvent` | `MouseEvent` | |
| `React.KeyboardEvent` | `KeyboardEvent` | |
| `React.ChangeEvent<T>` | `Event` + 显式取 `target` | |
| `React.Ref<T>` | `Ref<T>` / `ShallowRef<T>` | |
| `React.RefObject<T>` | `Ref<T>` | |
| `React.ComponentType<P>` | `Component<P>` | |
| `React.FC<P>` | `FunctionalComponent<P>` | |
| `React.PropsWithChildren<P>` | `P & { children?: ... }` → 用插槽，**不再用 children 类型** | |
| `React.MutableRefObject<T>` | `Ref<T>` | |
| `AnyObject` | 同名保留 | |
| `RecordType extends AnyObject` | 同名保留 | 泛型组件需 Vue 泛型 SFC 支持 |

**规则 C17**：类型名（`ButtonProps` / `SelectProps` / `TableColumnsType` / `FormInstance`）**与 antd 一致**，以便迁移时替换 import 路径即可。

**规则 C18**：**禁止**从 `antd` 或 `@rc-component/*` 导入类型。所有类型必须在本仓库重新定义（可以**参照** antd 的类型设计，但不得复制实现文件）。

**规则 C19**：`children` 类型不出现在 Props 中（Vue 用插槽）。文档中 `children` 行改列为「Slots」。

---

## 7. 样式与主题 API

| React | Vue | 备注 |
|---|---|---|
| `className` | `class` | 原生属性，通过 `$attrs` 透传 |
| `style` | `style` | |
| `classNames={{ root, body }}` | `:classNames="{ root, body }"` | 语义化类名，结构一致 |
| `styles={{ root, body }}` | `:styles="{ root, body }"` | |
| `rootClassName` / `rootStyle` | 同名保留 | |
| `ConfigProvider theme={{ token, components, algorithm, cssVar, zeroRuntime }}` | 同名保留 | `cssVar.prefix` 默认改为 `apollo`；`zeroRuntime` 恒为 `true`（本项目唯一模式） |
| `ConfigProvider prefixCls="ant"` | `prefixCls` 默认 `apollo` | |
| `ConfigProvider locale={zhCN}` | 同名保留 | 语言包路径 `@apollo-design/ui/locale/zh-CN` |
| `ConfigProvider direction="rtl"` | 同名保留 | |
| `ConfigProvider getPopupContainer` | 同名保留 | |
| `ConfigProvider componentDisabled` | 同名保留 | |
| `ConfigProvider componentSize` | 同名保留 | |
| `ConfigProvider form={{ validateMessages }}` | 同名保留 | |
| `ConfigProvider renderEmpty` | 同名保留 | |

**规则 C20**：`prefixCls` 的**类名结构必须与 antd 同构**（`${prefixCls}-btn` 等），这样既能复用 antd 的 CSS 结构心智，也让 DOM Contract Test 可用同一套选择器。

**规则 C21**：`theme.algorithm` 的取值同名导出：`theme.defaultAlgorithm` / `theme.darkAlgorithm` / `theme.compactAlgorithm`。

---

## 8. DOM Contract 约定

**规则 C22**：DOM 结构必须与 antd 保持**结构同构**（标签层级、类名语义、`data-*` 属性）。允许的差异：

| 差异 | 原因 | 登记为 |
|---|---|---|
| 多一层 `<Teleport>` 包裹 | Vue 用 Teleport 实现 portal，不产生额外 DOM 节点 | PLATFORM（无影响） |
| `style` 内联样式值改为 CSS 变量 | 零运行时架构 | INTENDED |
| 类名 hash 后缀不存在 | 无 CSS-in-JS | INTENDED（我们不加 hash，用 `data-apollo-theme` 作用域） |
| 事件绑定不在 DOM 属性上 | Vue 用 addEventListener | PLATFORM |

**规则 C23**：`data-*` 语义属性（如 `data-loading` / `data-status` / `data-size`）**必须与 antd 一致**，因为它们是外部样式与测试的稳定契约。

---

## 9. 差异登记表

**规则 C24**：任何 L1~L5 层面的差异，必须在本节登记后才能合入。未登记的差异视为 BUG。

### 9.1 差异分类（必须先分类再登记）

| 分类 | 含义 | 处理方式 |
|---|---|---|
| `INTENDED` | 我们**主动选择**不同（更好的方案，或对齐 antd v6 的迁移方向） | 登记即可 |
| `PLATFORM` | Vue 与 React 的**固有差异**，无法也不应消除 | 登记并注明平台原因 |
| `DEFECT` | antd 自身的缺陷，我们**有意不复刻** | 登记并说明 antd 的问题是什么 |
| `UNDECIDED` | 差异事实已确定，但**是否接受仍需裁决** | 登记 + 关联 `openDecisions` 的 id，未裁决前不得置 `completed` |

### 9.2 已登记差异

| # | 组件 | React 行为 | Vue 行为 | 分类 | 理由 |
|---|---|---|---|---|---|
| D1 | 全局 | `visible` prop | `open`（同时接受 `visible` 并告警） | INTENDED | 对齐 antd v6 自身的迁移方向 |
| D2 | 全局 | `onClick` 走 props | 原生事件经 `$attrs` 透传 | PLATFORM | Vue 事件模型 |
| D3 | 全局 | `children` prop | 默认插槽 | INTENDED | Vue 表达方式 |
| D4 | 全局 | `useCallback` 稳定引用 | 无对应物 | INTENDED | Vue 无引用稳定性问题 |
| D5 | 全局 | CSS-in-JS 内联 hash 类 | 静态 CSS + CSS 变量 | INTENDED | 零运行时架构（`ARCHITECTURE.md` §5.2） |
| D6 | 全局 | `prefixCls` 默认 `ant` | 默认 `apollo` | INTENDED | 品牌隔离，可通过 ConfigProvider 改回。**已裁决 A**（2026-09-16）：默认 `apollo`，允许覆盖为 `ant`。DOM 契约测试必须做前缀归一化，否则 `prefixCls` 这个 API 自身就测不了 |
| D7 | 全局 | `theme.zeroRuntime` 默认 `false` | 默认 `true`，但**不是唯一模式** | INTENDED | **已裁决 B**（2026-09-16）：零运行时静态 CSS 是默认与推荐路径，`theme` 包同时提供运行时注入路径以支持动态 token。注意这不是引入 `@ant-design/cssinjs`（H6 仍禁止），运行时注入自研 |
| D8 | `utils` | `pickAttrs` 输出 React 合成事件键 `onKeyDown` | 输出 Vue 事件键 `onKeydown`（`toVueEventName()`） | PLATFORM | **实测结论**：Vue 的 `runtime-dom` 不规范化 React 合成事件名——绑定 `onKeyDown` 会走 `addEventListener('key-down')` 永不触发；绑原生 `onkeydown` 会走 DOM0 属性（每元素每事件单槽位，静默覆盖，SVG/自定义元素上退化为属性字符串）。正确形式是 `on` + 首字母大写的原生名。当前实现已按此落地，**已裁决追认 A**（2026-09-16）：接受该偏差，B（保持 React 原名）会把已知缺陷外推给使用者 |
| D9 | 全局 | `useId`（React 18） | Vue 3.5 `useId()` | PLATFORM | 值格式不同，但保证"稳定 + 唯一"。DOM 契约测试断言存在性与唯一性，不断言字面值（见 `use-id-test-env`） |
| D10 | `motion` | `@rc-component/motion` 手写 CSS class 序列 | Vue `<Transition>` + CSS 变量 | PLATFORM | 语义对齐（collapse/slide/zoom/fade/move 五类），实现走 Vue 原生。PoC 由 AR2 验证 |
| D11 | `overlay` | `@rc-component/portal` 的 Portal 组件 | Vue `<Teleport>` | PLATFORM | `<Teleport>` 是 Vue 原生能力，语义等价 |
| D12 | `theme` | 运行时改 token → 重新生成样式表 | 运行时改 token → 重写 `--apollo-*` CSS 变量 | INTENDED | 零运行时的必然结果；能力等价，实现路径不同 |
| D13 | `position` | 相交面积 `Math.max(0, w * h)` | 逐轴先夹到 0 再相乘 `Math.max(0,w) * Math.max(0,h)` | **DEFECT** | antd 的算式在浮层**整体**位于区域外侧时，两个差值同为负数、乘积为正，`Math.max(0,·)` 兜不住 —— 「完全不可见」被算成巨大正面积（实测 17,600,000），翻转判定会据此接受明显更差的位置。部分相交时两式等价。已裁决：`intersection-area-clamp`。证据见 `packages/position/src/__tests__/align.test.ts`（断言「不开夹取分歧 > 0，开夹取分歧 = 0」） |
| D14 | `icons` | 图标前缀默认 `anticon` | 默认 `apollo-icon`（`IconProvider` 可覆盖为 `anticon`） | INTENDED | 与 D6 同一条理由（品牌隔离 + 可覆盖）。**注意 `iconPrefixCls` 是独立开关**：实测 `const iconPrefixCls = customIconPrefixCls \|\| parentContext.iconPrefixCls \|\| defaultIconPrefixCls`，**不**由 `prefixCls` 派生，所以 D6 不覆盖它，这是一条独立决策。**已裁决**（2026-09-16）：保持 `apollo-icon`；代价是存量 antd 的 `.anticon` CSS 需改或显式传 `iconPrefixCls="anticon"` |
| D15 | `icons` | 运行时把 `iconStyles` 注入 `<style>`，并全局 `replace(/anticon/g, prefixCls)` | 不注入任何 `<style>`；导出 `getIconStyle(iconPrefixCls)` 交静态样式层 | INTENDED | 零运行时架构（D7）。能力等价：`getIconStyle('anticon')` 与上游 `renderUtils.iconStyles` **逐字节相同**（L1 断言，897 字符）。注意别抄错源：`components/style/index.tsx` 的 `genIconStyle` 少了 `-webkit-` 前缀，不是图标的实际视觉契约 |
| D16 | `icons` | `rotate` 产生 `-ms-transform` + `transform` | 只产生 `transform` | PLATFORM | `-ms-` 是 IE9 前缀。React 的 `style` 对象会做厂商前缀补全，Vue 的 `h()` 原样写键、不补。现代目标环境不需要；`dom-contract.ts` 的 `normalizeStyle` 会剔除与无前缀项等价的厂商前缀（对称归一化，见该文件头注释） |
| D17 | `icons` | `Icon` 声明 `ariaLabel` 但只在 `svgProps` 里透传 → DOM 上是 `ariaLabel="…"` | 映射到 `aria-label` | **DEFECT** | `ariaLabel` 不是合法 HTML 属性，浏览器不认，屏幕阅读器读不到名字 —— 一个**声称提供可访问名却不提供**的 prop。antd 自己都警告 `Invalid ARIA attribute 'ariaLabel'. Did you mean 'aria-label'?`。证据：L4 基线 `props:ariaLabel-prop` 的产物 + L5 `a11y.test.ts` 的 D17 用例。分类为 DEFECT 而非 INTENDED：我们修的是**上游的错**，不是主动选择不同方案 |
| D18 | `icons` | 图标 SVG 属性名走 `dash-case → camelCase` 归一（`fill-rule` → `fillRule`） | 原样透传（只把 `className` 折成 `class`） | PLATFORM | React 渲染时会把 `fillRule` 转回规范的 `fill-rule`，所以上游的转换**为 React 服务**；Vue 的 `h()` 拿到的键就是最终 `setAttribute` 的属性名，照抄会产出 `fillrule="evenodd"` —— 浏览器不认，**图标形状画错**。实测 icons-svg 全部 848 个定义的属性词表只有 `d`/`viewBox`/`focusable`/`fill`/`fill-rule`/`fill-opacity`，无任何 camelCase 形式。该缺陷能过构建与类型检查，是 L4 逐属性比对抓出来的（`AlipayCircleFilled` 等 5 个图标），回归用例见 `icons.test.ts` |
| D19 | `empty` | 插画 `fill`/`stroke` 是 `getAsSolidColor(token, colorBgContainer)` 合成出的**实色 hex**（如 `#f5f5f5`） | 输出 `var(--apollo-color-fill-tertiary)` 这类 CSS 变量引用 | INTENDED | D5/D7（零运行时）在插画上的具体形态。**不是自行发明的一条路**：antd 的 `getAsSolidColor` 第一行就是「拿到 `var(` 时原样返回」，我们输出的正是那条分支的结果。副作用是 `fill` 属性不再逐字可比 —— 但 L4 的 `contract` 档本来就不投影 `fill`（插画不是「交付物本身」，与图标不同），所以差异不进断言。真正保证视觉一致的是 L6 |
| D20 | `empty` | 字符串 `image` 时 React 19 的 float 机制额外渲染一个 `<link rel="preload" as="image">` 在组件之前 | 无此节点 | PLATFORM | React 19 的 float 是框架能力，Vue 没有对应机制。**组件自身的根元素结构仍然逐字一致** —— 差异只是「多了一个兄弟节点」，所以在 L4 里表现为「根节点数 2 vs 1」。`image:string` / `config:image` 两条用例把它钉成断言 |
| D21 | `empty`（实为全局） | 未传的 `description` / `image` 是 `undefined` | 若 prop 的运行时类型含 `Boolean`，Vue 会把它转成 `false` | PLATFORM | **本项目最容易踩、最难查的一类坑。** `React.ReactNode` 在 Vue 侧的对应物是 `VNodeChild`，而 `VNodeChild` 含 `boolean` —— SFC 编译器把它解析成运行时类型 `[Object, String, Number, Boolean, null, Array]`，于是「未传」被转成 `false`：`description` 变成 `false` 让描述整块消失，`image` 变成 `false` 让插画渲染成一个注释节点。**修法**：`withDefaults` 里显式声明 `image: undefined` / `description: undefined`（有 `default` 就跳过转换）。**所有 `VNodeChild` 类型的 prop 都适用**，后续 71 个组件必须照做。同一根源还导致 antd 的 `!(deprecatedName in props)` 判据失效（Vue 的 props 恒含全部声明键），改成 `!== undefined` |
| D22 | `empty` | `EmptyRef.nativeElement: HTMLDivElement` | `HTMLDivElement \| null` | PLATFORM | antd 的类型没体现「首次渲染前是 null」（它内部就是 `useRef(null)`）。我们按真实情况声明 —— 类型比运行时更宽是安全的，反过来才是危险的 |
| D23 | `empty` | `image` 接受任意 `ReactNode`，惯例是传**元素**（`<MyImage />` 的求值结果） | 额外接受**组件**；`PRESENTED_IMAGE_*` 是组件对象而非元素 | PLATFORM | Vue 没有「元素」这个可复用的不可变描述符概念。若照搬「模块级常量 VNode」，同一个 VNode 被两个 Empty 实例渲染会踩到 Vue VNode 可变（patch 时写 `el`/`component`）的坑。用组件对象同时保住了 `===` 身份语义（`-normal` 类名靠它判定）与可重复渲染。两种写法都支持：具名导出 `PRESENTED_IMAGE_SIMPLE` 与静态属性 `Empty.PRESENTED_IMAGE_SIMPLE`（后者与 antd 逐字一致）。另：Vue 侧 props 可能被 `reactive()` 代理，导致 `===` 静默失效 —— 两个插画组件用 `markRaw` 钉住（实测 `@vue/test-utils` 的 `mount` 路径会触发） |
| D24 | `empty` | 切换 `ConfigProvider locale` → 组件重渲染，描述文案更新 | **不更新**：`useLocale()` 是 setup 期的快照 | PLATFORM（**待修**） | React 组件每次渲染都会重跑 `useLocale`，Vue 的 `inject` 只能在 setup 调用，`toValue` 取到的是当时的值。当前无 ConfigProvider，运行时改 locale 尚不可达，所以**今天没有可观测影响**；但它是一个真实缺口，落点在 `@apollo-design/locale` 的 API（需要新增一个返回 `ComputedRef` 的变体，不能改 `useLocale` 的签名 —— 那会破坏它已完成的契约）。已在 `packages/ui/src/empty/README.md` 与 registry 的 notes 里登记 |
| D34 | `space` | `useOrientation` 来自 `_util/hooks`（全库共享） | 落在 `space/useOrientation.ts`（本包内） | INTENDED | 我们没有 `_util/`；`divider` 当初把同一段逻辑**内联在自己的 `.vue` 里**，于是现在全仓有两份同构实现。按三次法则它还没到提升的时候：等第三个消费者（`Flex` / `Descriptions`）出现再抽到 `_internal/use-orientation.ts`，那时才有三个真实用例来约束抽象。判定细节：第二级判据是 `typeof vertical === 'boolean'`（**不是**真值判断），所以「未传」与「显式传 `false`」是两条不同分支 —— 与 D21 同源，是本组件最容易静默失效的一处 |
| D35 | `space` | `Orientation` 由 `_util/hooks` 导出（`space` 只是 re-export） | 本地声明，**不**从 barrel 导出 | PLATFORM | barrel（`packages/ui/src/index.ts`）**已经**从 `./divider` 导出了同名类型，`space` 再导一次会冲突。antd 也不从 `space` 导出它 —— 所以这不是「少实现」，而是同一份联合类型在本仓的两处同构声明。等 `_internal/use-orientation.ts` 落地时两份合并 |
| D36 | `space` | `SpaceSemanticAllType = GenerateSemantic<SpaceSemanticType, SpaceProps>`（条件类型） | 手写的 `SpaceSemanticAllType` 接口 | INTENDED | 条件类型无法被泛型函数体证明，最终必须写 `as unknown as` 双重断言 —— 用一个类型漏洞换一个 `?.`，不划算（与 `empty` / `divider` 同一裁决）。字段与 antd 展开后的结果逐条对应 |
| D37 | `space` | `SpaceContext` 是 `React.Context` + `Provider`，值是裸对象（Provider 更新时 React 重跑消费者函数体） | `spaceContextKey`（`InjectionKey<ComputedRef<SpaceContextType>>`）+ `useSpaceContext()` | PLATFORM | Vue 用 `provide`/`inject`，而 `inject` 只在 setup 期解析一次、裸对象是**快照**（D27 同一根源）⇒ 必须注入 `ComputedRef`，`Item` 在 render 里读 `.value` 才能被追踪。否则「子节点增删」不会传导到每个 `Item` 的分隔符判据上（`latestIndex` 会停在旧值） |
| D38 | `space` | `Space.Addon` 用组件级 CSS 自定义属性（`--ant-space-addon-*`）做中间变量；status 段只**改写变量**、不额外产规则 | 直接内联为 `border-color` / `background`，并把「status × variant」**展开成复合选择器**（Addon 因此是 33 条规则而不是 29 条） | INTENDED | B7 要求每个 `var(--apollo-*)` 都必须在 `packages/theme/dist/tokens.css` 的 `:root` 里有声明，而这些变量是**规则内局部声明**的，照抄会判 FAIL。展开之后特异性拉平（`.status-error.variant-filled` 与 `.variant-filled.disabled` 都是 0,2,0）⇒ 必须**重排选择器顺序**（决胜规则排在**所有** status 规则之后）才能保持层叠等价，否则「filled + error + disabled」的背景会变成 error 色。顺序契约由 `theme.test.ts` 的 `region` 数组显式断言（条数断言抓不住它），理由见 `packages/ui/src/space/README.md` §4.3 |
| D39 | `space` | `useCompactItemContext` 返回裸值（每次渲染重算） | 返回 `ComputedRef`（`compactSize` / `compactDirection` / `compactItemClassnames`） | PLATFORM | D27 同一根源：Vue 的 `inject` 是 setup 期快照，裸值不会随 `Compact` 的 props 变化更新。下游（Button / Input / Select / DatePicker / … 共 10 个组件）在 `computed` 里读 `.value` 即可，与 `size-context.ts` 同形 |
| D40 | `space` | `separator={0}` 时 `Item` 的 `{index < latestIndex && separator && <span/>}` 求值成数字 `0`，React 把它渲染成**裸文本节点** ⇒ DOM 是 `<div>a</div>0<div>b</div>` | 用真 `if` 走假值分支，不产生任何节点 ⇒ `<div>a</div><div>b</div>` | **DEFECT** | JSX 的经典陷阱：`0` 是「会渲染的假值」，而上游的意图显然是「没有分隔符」（`separator=""` / `separator={null}` 都不渲染）。我们按**意图**实现。⚠️ 这条差异**进不了 L4 的断言**：`packages/test-utils/src/dom-contract.ts:204` 的投影只用 `template.content.children`（**只含元素节点**，注释与文本都不进契约）⇒ 两侧投影完全相同，所以它没有 `ALLOW` 条目 —— 不是差异不存在，是那条通道看不见它。钉住它的是 L1 的 `index.test.ts`「`separator={0}` 不渲染分隔符且 `textContent === 'ab'`」，证据是机械基线 `tests/compat/baselines/space.dom.json` 的 `separator:zero` |

| D41 | `button` | 恰好两个汉字时，antd 把文本 `join(' ')` 成 `确 定`（**真实空格**，进 `textContent`）；我们用 `-two-chinese-chars` + `::first-letter{letter-spacing:0.34em}` + `> *{margin-inline-end:-0.34em}` 实现同样的视觉间距，`textContent` 保持 `确定` | INTENDED | L6 视觉上**只影响 `type` 这一个用例的第 6 个按钮**（antd 的 `确 定` 宽 63.797px vs 我们的 `确定` 64.781px，差 ~1px）。其余 24/27 张逐像素一致（21 张 0.000% exact + 3 张 antialias-noise ≤0.021%），`type` 三张里除该按钮外无任何差异。**选 CSS 的理由**：`textContent` 就是按钮的**可访问名**（`button.name`），antd 插空格后读屏会念成「确 空格 定」；保持无空格更干净，而视觉间距等效 —— 属 Vue-native 的主动选择，不是做不到 |

> ⚠️⚠️ **本条此前的登记（「PLATFORM：Chrome glyph hinting 抖动，27/27 全部 0.23%–2.33%」）已于 2026-09-20 复核证伪并撤销。** 当时的两条依据都不成立，是一次**把 BUG 归类成 PLATFORM** 的误判（`AGENTS.md` §4.3 明令禁止）：
>
> - 「React 侧跑两次也会得到不同截图」→ **假**。`node tests/visual/run.mjs --component button --mode baseline` 重生成 27 张基线后 `git status` **零变化**（逐字节一致）⇒ 截图是确定的，不存在抖动。
> - 「差异来自 Chrome 自身的 glyph 渲染抖动，与 mount 时序无关」→ **假**。真因是**我方实现缺两条声明**：
>   1. **`line-height`**：antd 的 Button **不**调用 `resetComponent`（`antd/es/button/style/index.js` 的 `genStyleHooks` 只拼 Shared / Size / Variant / Group），它靠 `antd/dist/reset.css` 的 `button{line-height:inherit}` 从环境继承（实测计算值 22px）。本仓 `BASE_CSS`（`packages/ui/src/style/index.ts:93`）没有这条表单控件归一化 —— 该文件自己就把「button 重置」列为未决缺口 —— 于是我们的 `<button>` 退回 UA `line-height:normal`：图标/文字 span 高 17px vs 22px、文字基线差 ~2.5px ⇒ **27 例全部 block-diff**。**修法**：在 `.apollo-btn` 基线上显式 `line-height:var(--apollo-line-height)`（与 divider / empty / space / spin 的既有做法一致）。
>   2. **图标基线**：`-icon` 未带 `display:inline-flex;align-items:center;line-height:0`。antd 的 `.anticon` 基线由 antd 在**运行时**注入，React 侧一定拿得到；本仓该基线在 `@apollo-design/icons` 的 `getIconStyle()` 里，但 ui 的静态样式层**尚未消费它**（icons 包 `exports` 只有 `"."`，也没有独立 `style.css` 出口）⇒ 图标 span 继承行高 22px，svg 比 antd 高 2px。**修法**：在按钮范围内补齐同样的基线（`.apollo-btn-icon .apollo-icon`）。
>
> 修复后差异率从 0.233%–2.326% 降到 0%–0.149%，`通过 0 / 27` → `通过 24 / 27`。教训（「基线确定性要实测」「视觉差异先怀疑实现再怀疑平台」「`<button>` 不继承 `line-height`」「图标基线未被消费」）记入 `.workbuddy-ai/memory/PITFALLS.md` **130–133**（另有 125/126 两条基建坑：单次 Bash 撑不住 unbuild、worktree 的 `index.lock` 反复残留）。

**钉住它的测试**：`tests/visual/run.mjs --component button --mode compare`（9 variant × 3 viewport = 27 张，React 基线已入库 `tests/visual/baselines/react/button/`），把差异率、结构、强度写到 `tests/visual/report.html`。`type` 三张的 diff 图（`tests/visual/diff/button/type__light__*.png`）里红色**只落在第 6 个按钮**，是这条差异的直接证据；两字中文的类名判定由 L1 `index.test.ts` 的「两个中文字自动插空格」一节（11 条）钉住。 |

| D42 | `button`（实为全局，同 D23/D21） | `icon` 是 `React.ReactNode`，官方示例与 demo 都写 `icon={<SearchOutlined />}` —— React 里那是**已求值的元素** | 类型放宽为 `ButtonIcon = VNodeChild \| Component`，并在渲染前 `h()` 包一层 | PLATFORM | Vue 没有「元素」这一形态，对应物是**组件对象**，与 D23（`empty` 的 `image`）**同一裁决**。⚠️ 这条差异有一个**只有运行期才现形**的陷阱，必须两件事同时做：① **类型**放宽（否则 `vue-tsc` 报 `TS2322: DefineComponent is not assignable to VNodeChild`，button 的 `demo/{icon,shape,semantic}.vue` 共 6 处）；② **渲染归一化**（`NodeRenderer.normalizeNode()` 只做 `isVNode ? cloneVNode : 原样`，组件对象会被原样返回，模板再 `toDisplayString` 成字面量文本 **`[object Object]`**）。⚠️ 只做 ① 会让编译变绿而缺陷**一字未改** —— 实测复现：`<span class="apollo-btn-icon">[object Object]</span>`。**钉住它的测试**：L1 `index.test.ts` 的 3 条用例（`icon` 传组件 / `loading.icon` 传组件 / ConfigProvider 的 `loadingIcon` 传组件），每条都断言 `expect(w.text()).not.toContain('[object Object]')` —— 只断言「元素存在」会漏，文本节点也能匹配到父元素；L3 `type.test-d.ts` 另有一条 `toEqualTypeOf<ButtonIcon \| undefined>()` 与 1 条正例（组件对象可传）。教训记入 PITFALLS 135 |


### 9.2.1 跟随的上游缺陷（**无差异**，但必须知悉）

这些不是「我们与 antd 不同」，而是「我们与 antd 相同，而 antd 在这里有问题」。
它们不进 `D<n>` 编号（编号只登记差异），但必须有登记处 —— 否则会被后人当成疏漏「顺手修掉」，
从而与上游漂移、让机械 oracle 的比对失效。

| # | 位置 | 上游行为 | 我们为何跟随 | 钉住它的测试 |
|---|---|---|---|---|
| U1 | `LoadingOutlined` / `spin` | 只加 `<prefixCls>-spin` 类，**没有** `aria-live` / `aria-busy` / `role="status"` | 图标的语义应由消费方决定：`Button` 的 loading 该给按钮自己挂 `aria-busy`，`Table` 的 loading 该挂 `aria-live` 区域。图标层擅自加 `role="status"` 会让「一页 20 个 loading 图标」变成 20 个 live region，反而更糟。`TESTING.md` §6.2 的该行在图标层**不可满足**，须由 ui 层承担 | `a11y.test.ts` 的「已知缺口：spin 对屏幕阅读器无反馈」 |
| U2 | `Icon`（自定义 SVG 路径） | `children`/`component` 形态的 `<span role="img">` **没有** `aria-label`，违反 WCAG 4.1.2 | 这里没有「名字」可推断：生成物（848 个）的名字来自 `IconDefinition.name`，而自定义 SVG 是一坨任意 path。硬填 `aria-label="icon"` 是比无名更糟的**假信息**。落点在消费方（`aria-label` 或 `ariaLabel` prop），L5 有正向用例证明补名后 0 violation | `a11y.test.ts` 的「已知缺口：自定义 SVG 的 Icon 无可访问名」+ 基线 `icon:children` 的证据断言 |
| U3 | 告警正文 | ``icon should be icon definiton, but got …``（`definiton` 少一个 `i`；`AntdIcon.js`/`IconBase.js`/`IconBaseTwoTone.js` 三处同错） | 照抄错字。改对了会让告警断言与上游漂移，而告警文案是**可被消费方匹配**的契约 | `icons.test.ts` 的 `warning` 用例（断言含 `icon should be icon definiton`） |
| U4 | `Space.Addon` | `disabled` 只加 `-disabled` 类改**颜色**，**不设** `disabled` 属性、不设 `aria-disabled`、不拦截交互 | 它只是一个**视觉容器**，真正承载交互的是插槽里的子组件；由它单方面加 `aria-disabled` 会与子组件的真实可交互性矛盾，而 `Space.Addon` 的内容是任意插槽、没有可推断的「被禁用了什么」。⚠️ 代价：它对辅助技术**完全不可见** —— 这是一条真实的 a11y 缺口，不是「已满足」 | `a11y.test.ts` 的「Addon 的 `disabled` 不加 `aria-disabled`」+ 机械基线 `addon:disabled` 的产物断言 |
| U5 | `Space` / `Space.Compact` | 根元素是**裸 `<div>`**：没有 `role`、没有任何 `aria-*`；`-item` 上也没有 `role="listitem"` | Space 是**纯布局容器**（视觉分组），不是列表语义。给它挂 `role="list"` 会凭空声明一个列表结构，对屏幕阅读器反而有害。`TESTING.md` §6.2 的该行在布局容器上不可满足，语义应由消费方决定（该分组是列表就由外层挂 `role="list"`） | `a11y.test.ts` 的三条「断言**不存在**」用例：根元素是裸 `div` / `-item` 无 `role` / 全树无 `aria-*` |
| U6 | `Space`（分隔符） | `-item-separator` 的 `<span>` 是**纯装饰**：没有 `aria-hidden` | 我们逐字对齐、也不加。分隔符（`|` / `/`）对屏幕阅读器是噪音，加 `aria-hidden` 在语义上是对的 —— 但那是**上游可改进项**，单方面加会让 L4 的逐节点比对红（`role`/`aria-*` 进 `contract` 档投影） | `a11y.test.ts` 的「分隔符是纯装饰（无 `aria-hidden`）」+ 机械基线 `separator:string` 的产物断言 |

### 9.3 待裁决差异（`UNDECIDED`）

这些差异**事实已确定**（不是猜测），但"是否接受"需要用户裁决。
它们同时登记在 `registry/foundation.json → openDecisions`，由 `registry:validate` E17 追踪。

| 决策 id | 影响的差异项 | 问题 | 状态 |
|---|---|---|---|
| ~~`prefix-cls-default`~~ | D6 | 前缀默认 `apollo` 还是 `ant` | ✅ 2026-09-16 裁决 A —— 默认 `apollo`，允许覆盖 |
| ~~`zero-runtime-mode`~~ | D7 / D12 | 零运行时是否为唯一模式 | ✅ 2026-09-16 裁决 B —— 默认零运行时，同时提供运行时注入路径 |
| ~~`event-name-rewrite`~~ | D8 | 追认 `pickAttrs` 的事件名重写 | ✅ 2026-09-16 裁决 A —— 接受偏差 |
| `use-id-test-env` | D9 | 是否在测试中固定 `useId` 输出 | ⏳ 待裁决（仅影响测试写法，不阻塞实现） |

裁决走命令行（不要手改 JSON）：

```bash
node registry/tools/foundation-status.mjs --decide <id> --choice <A|B|C> --by "<谁>" --note "<理由>"
```

`--choice` 必须命中 `registry/source/open-decisions.mjs` 里该决策的某个选项，否则拒绝写入 ——
防止 `decision` 变成与选项无关的自由文本。

### 9.4 如何登记新差异

1. 在 §9.2 追加一行，编号顺延（D13、D14…）
2. 若分类是 `UNDECIDED`：
   - 在 `registry/source/open-decisions.mjs` 追加决策条目（含选项与代价）
   - 在受影响包的 `blockedBy` 中引用该 id
   - 在 §9.3 追加一行
3. 运行 `pnpm run registry:check` —— E17 会校验引用完整性
4. 在组件自己的 `README.md` 中复述该差异

**若你发现的是「我们跟随了上游的缺陷」而不是差异**：不要编号，登记到 §9.2.1。
那里记的是「与 antd 相同，而 antd 有问题」—— 它没有 `D<n>` 编号（编号只登记差异），
但同样必须有登记处，否则会被后人当成疏漏「顺手修掉」，从而与上游漂移、
让机械 oracle 的比对失效。登记时**必须**附上钉住它的测试名，让「这是有意的」可被证伪。

> 后续每个组件开发时，在此表追加该组件的差异项。**该表是"我们有意不兼容什么"的权威清单。**

---

## 10. 迁移对照示例

### Button

```tsx
// Ant Design React
<Button
  type="primary"
  size="large"
  loading={loading}
  danger
  onClick={handleClick}
>
  Submit
</Button>
```

```vue
<!-- @apollo-design/ui -->
<a-button
  type="primary"
  size="large"
  :loading="loading"
  danger
  @click="handleClick"
>
  Submit
</a-button>
```

### Select（受控 + render prop）

```tsx
// Ant Design React
<Select
  value={value}
  onChange={setValue}
  options={options}
  optionRender={(opt) => <b>{opt.label}</b>}
  notFoundContent={<Empty />}
/>
```

```vue
<!-- @apollo-design/ui -->
<a-select
  v-model:value="value"
  :options="options"
  :option-render="(opt) => h('b', opt.label)"
>
  <template #notFoundContent><a-empty /></template>
</a-select>
```

```vue
<!-- 更 Vue-native 的写法（等价） -->
<a-select v-model:value="value" :options="options">
  <template #optionRender="{ option }"><b>{{ option.label }}</b></template>
  <template #notFoundContent><a-empty /></template>
</a-select>
```

### Form（命令式 + composable）

```tsx
// Ant Design React
const [form] = Form.useForm();
form.validateFields().then(values => ...);
<Form form={form} onFinish={onFinish} />;
```

```vue
<!-- @apollo-design/ui -->
<script setup lang="ts">
const [form] = useForm();
await form.validateFields();
</script>
<template>
  <a-form :form="form" @finish="onFinish" />
</template>
```

### message（静态调用 + ContextHolder）

```tsx
// Ant Design React
const [api, contextHolder] = message.useMessage();
return <>{contextHolder}<button onClick={() => api.success('ok')} /></>;
```

```vue
<!-- @apollo-design/ui -->
<script setup lang="ts">
const [api, ContextHolder] = useMessage();
</script>
<template>
  <ContextHolder />
  <button @click="api.success('ok')" />
</template>
```
