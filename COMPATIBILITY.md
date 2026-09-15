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
| D6 | 全局 | `prefixCls` 默认 `ant` | 默认 `apollo` | INTENDED | 品牌隔离，可通过 ConfigProvider 改回（待裁决：`prefix-cls-default`） |
| D7 | 全局 | `theme.zeroRuntime` 默认 `false` | 恒为 `true` | INTENDED | 本项目唯一模式（待裁决：`zero-runtime-mode`） |
| D8 | `utils` | `pickAttrs` 输出 React 合成事件键 `onKeyDown` | 输出 Vue 事件键 `onKeydown`（`toVueEventName()`） | PLATFORM | **实测结论**：Vue 的 `runtime-dom` 不规范化 React 合成事件名——绑定 `onKeyDown` 会走 `addEventListener('key-down')` 永不触发；绑原生 `onkeydown` 会走 DOM0 属性（每元素每事件单槽位，静默覆盖，SVG/自定义元素上退化为属性字符串）。正确形式是 `on` + 首字母大写的原生名。当前实现已按此落地，**待裁决追认**：`event-name-rewrite` |
| D9 | 全局 | `useId`（React 18） | Vue 3.5 `useId()` | PLATFORM | 值格式不同，但保证"稳定 + 唯一"。DOM 契约测试断言存在性与唯一性，不断言字面值（见 `use-id-test-env`） |
| D10 | `motion` | `@rc-component/motion` 手写 CSS class 序列 | Vue `<Transition>` + CSS 变量 | PLATFORM | 语义对齐（collapse/slide/zoom/fade/move 五类），实现走 Vue 原生。PoC 由 AR2 验证 |
| D11 | `overlay` | `@rc-component/portal` 的 Portal 组件 | Vue `<Teleport>` | PLATFORM | `<Teleport>` 是 Vue 原生能力，语义等价 |
| D12 | `theme` | 运行时改 token → 重新生成样式表 | 运行时改 token → 重写 `--apollo-*` CSS 变量 | INTENDED | 零运行时的必然结果；能力等价，实现路径不同 |

### 9.3 待裁决差异（`UNDECIDED`）

这些差异**事实已确定**（不是猜测），但"是否接受"需要用户裁决。
它们同时登记在 `registry/foundation.json → openDecisions`，由 `registry:validate` E17 追踪。

| 决策 id | 影响的差异项 | 问题 |
|---|---|---|
| `prefix-cls-default` | D6 | 前缀默认 `apollo` 还是 `ant` |
| `zero-runtime-mode` | D7 / D12 | 零运行时是否为唯一模式 |
| `event-name-rewrite` | D8 | 追认 `pickAttrs` 的事件名重写 |
| `use-id-test-env` | D9 | 是否在测试中固定 `useId` 输出 |

### 9.4 如何登记新差异

1. 在 §9.2 追加一行，编号顺延（D13、D14…）
2. 若分类是 `UNDECIDED`：
   - 在 `registry/source/open-decisions.mjs` 追加决策条目（含选项与代价）
   - 在受影响包的 `blockedBy` 中引用该 id
   - 在 §9.3 追加一行
3. 运行 `pnpm run registry:check` —— E17 会校验引用完整性
4. 在组件自己的 `README.md` 中复述该差异

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
