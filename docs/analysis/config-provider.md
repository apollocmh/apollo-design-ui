# 组件分析：ConfigProvider

| 项 | 值 |
|---|---|
| 组件名 | `config-provider` |
| 导出名 | `ConfigProvider` |
| antd 版本 | 6.6.4 |
| 分组 | 其他 |
| 优先级 | P0 |
| 复杂度 | L |
| 解锁下游 | **50 个组件**（`derived.unblocks`） |
| 分析日期 | 2026-09-19 |

## 0. 参考来源

| 类型 | 路径 |
|---|---|
| antd 产物（ESM + 类型） | `/tmp/antd-src/package/es/config-provider/` |
| antd 源码 | `/tmp/antd-repo/ant-design-master/components/config-provider/` |
| antd 测试 | `components/config-provider/__tests__/`（21 个文件，4692 行） |
| antd demo | `components/config-provider/demo/`（8 组：direction / holderRender / locale / prefixCls / size / theme / useConfig / wave / warning） |

**已阅读的文件**：

- [x] `es/config-provider/index.js` + `index.d.ts`（805 行 / 对外 API 面）
- [x] `components/config-provider/index.tsx`（805 行，主实现）
- [x] `components/config-provider/context.ts`（665 行，`ConfigConsumerProps` + 60 个 `XxxConfig`）
- [x] `components/config-provider/SizeContext.tsx`（20 行）
- [x] `components/config-provider/DisabledContext.tsx`（19 行）
- [x] `components/config-provider/MotionWrapper.tsx`（34 行）
- [x] `components/config-provider/PropWarning.tsx`（31 行）
- [x] `components/config-provider/defaultRenderEmpty.tsx`（51 行）
- [x] `components/config-provider/hooks/{useTheme,useSize,useConfig,useCSSVarCls}.ts`
- [x] `components/config-provider/__tests__/index.test.tsx`（251 行，主行为）
- [x] `components/config-provider/__tests__/{locale,memo,container,useConfig,useSize,renderEmpty}.test.tsx`
- [x] `components/locale/{index.js,context.js,useLocale.js}`（对照 `@apollo-design/locale`）
- [x] `components/form/validateMessagesContext.tsx`（叶子模块，对应 form-core 的 `FormProvider`）

## 1. 规模评估

| 指标 | 值 |
|---|---|
| antd 构建产物行数 | 732（`derived.antdBuildLineCount`） |
| antd 文件数 | 24 |
| 对外 props 数 | **约 90 个**（其中 **56 个是组件配置**） |
| demo 数量 | 9 |
| 测试文件数 | 21 |
| rc 依赖 | `@rc-component/motion`（MotionWrapper）、`@rc-component/util`（`merge`/`useMemo`）、`@rc-component/tabs`（仅类型） |
| antd 生态依赖 | `@ant-design/cssinjs`（`createTheme` / `StyleContext`）、`@ant-design/icons`（`IconContext`） |
| 依赖的组件 | `empty`（`defaultRenderEmpty`） |
| 依赖的 foundation | `theme` / `utils` / `icons` / `motion` / `form-core`（**全部 completed**） |
| 依赖的叶子模块 | `form/validateMessagesContext`、`tooltip/UniqueProvider` |
| Component Token 数 | **0**（`derived.tokenCount = 0`、`tokenGroup = null`） |
| complexity 判定 | L（与 registry 一致） |

## 2. 定位：它不是"一个组件"，是**运行时网关**

antd 的 `ConfigProvider` 只做一件事：**把一组配置注入 context，让整棵子树读到它**。

```
ConfigProvider
├── ConfigContext.Provider          ← 组件配置 / prefixCls / direction / locale / theme ...
│   └── DisabledContextProvider     ← componentDisabled（独立 context）
│       └── WarningContext.Provider ← warning
│           └── DesignTokenContext  ← theme（cssinjs）
│               └── UniqueProvider  ← tooltip.unique
│                   └── MotionWrapper
│                       └── SizeContextProvider   ← componentSize（独立 context）
│                           └── IconContext.Provider
│                               └── LocaleProvider      ← locale
│                                   └── ValidateMessagesContext ← form.validateMessages
│                                       └── children
```

本项目必须复现的是**这套注入顺序与合并语义**，不是这段 JSX。

⚠️ **它自己不渲染任何 DOM**（`children` 之外只有两个 `null` 组件：`IconStyle` / `PropWarning`）。
⇒ 本组件**没有 Component Token、没有组件样式**（`tokenStatus` / `styleStatus` 判 `n/a`，理由见 §9）。

## 3. API 面（antd 6.6.4）

### 3.1 非组件配置的 props（本次全部实现）

| 名称 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `getTargetContainer` | `() => HTMLElement \| Window \| ShadowRoot` | — | 浮层挂载目标 |
| `getPopupContainer` | `(triggerNode?) => HTMLElement \| ShadowRoot` | — | 单个浮层容器 |
| `prefixCls` | `string` | 继承父级，兜底 `ant`（我方 `apollo`） | |
| `iconPrefixCls` | `string` | `anticon`（我方 `apollo-icon`） | |
| `children` | `ReactNode` | — | Vue 侧是**默认插槽** |
| `renderEmpty` | `RenderEmptyHandler` | — | |
| `csp` | `{ nonce?: string }` | — | cssinjs 用途 |
| `autoInsertSpaceInButton` | `boolean` | — | **已废弃** → `button.autoInsertSpace` |
| `variant` | `'outlined' \| 'borderless' \| 'filled' \| 'underlined'` | — | |
| `locale` | `Locale` | — | |
| `componentSize` | `'small' \| 'medium' \| 'middle' \| 'large'` | — | 走 **SizeContext** |
| `componentDisabled` | `boolean` | — | 走 **DisabledContext** |
| `direction` | `'ltr' \| 'rtl'` | `ltr` | |
| `virtual` | `boolean` | `true` | |
| `dropdownMatchSelectWidth` | `boolean` | — | **已废弃** → `popupMatchSelectWidth` |
| `popupMatchSelectWidth` | `boolean` | — | |
| `popupOverflow` | `'viewport' \| 'scroll'` | — | |
| `theme` | `ThemeConfig` | — | |
| `warning` | `WarningContextProps` | — | 走 **WarningContext** |

### 3.2 组件配置 props（56 个）

`alert affix anchor app button calendar carousel cascader treeSelect collapse divider drawer
typography skeleton spin segmented statistic steps image layout list listy mentions modal
progress result slider breadcrumb masonry menu checkbox descriptions empty badge borderBeam
radio rate ribbon switch transfer avatar message tag table card cardMeta tabs timeline
timePicker upload notification tree colorPicker datePicker rangePicker flex wave tour
tooltip popover popconfirm watermark qrcode form input inputPassword inputSearch otp
inputNumber textArea select pagination space splitter floatButton floatButtonGroup`

其中**本仓已落地**的只有 3 个：`divider` / `empty` / `spin`。

### 3.3 静态方法

| 名称 | 形态 |
|---|---|
| `ConfigProvider.config({prefixCls, iconPrefixCls, theme, holderRender})` | 模块级全局配置 |
| `ConfigProvider.useConfig()` | `() => ({ componentDisabled, componentSize })` |
| `ConfigProvider.ConfigContext` | context 对象本体 |
| `ConfigProvider.SizeContext` | **已废弃**（getter 里告警） |
| `globalConfig()` | `() => ({ getPrefixCls, getIconPrefixCls, getRootPrefixCls, getTheme, holderRender })` |

## 4. 行为规格（逐条来自源码，附行号）

### 4.1 `getPrefixCls` 的三层继承（index.tsx:370-382）

```js
if (customizePrefixCls) return customizePrefixCls;          // ① 组件自己的 prefixCls prop 最高优先
const mergedPrefixCls = prefixCls || parentContext.getPrefixCls('');  // ② 本层 prop，否则问父级
return suffixCls ? `${mergedPrefixCls}-${suffixCls}` : mergedPrefixCls;
```

- 判据是 **`||`（真值）**，不是 `??` ⇒ 传空字符串会退回父级。
- `parentContext.getPrefixCls('')` 是「向父级要根前缀」的惯用法（antd 的 `nest prefixCls` 用例靠它）。

### 4.2 配置合并：`undefined` 不覆盖（index.tsx:588-594）

```js
const config = { ...parentContext };
Object.keys(baseConfig).forEach((key) => {
  if (baseConfig[key] !== undefined) config[key] = baseConfig[key];
});
```

⇒ **浅覆盖、逐键**。嵌套 `ConfigProvider` 只给一部分键时，**其余键继续继承父级**。
⭐ 这是本项目最需要钉住的一条：我们的 `components` 是**一个**字段（见 §6.1），
如果整体替换就会把父级的组件配置全丢掉 —— 必须**逐组件名**合并。

### 4.3 `memoedConfig`（index.tsx:620-632）

antd 用 `useMemo` + 自定义比较器（键数 + 逐键 `!==`）避免 context 抖动。
Vue 侧的对应物是 **提供一个稳定引用的响应式对象并原地打补丁**（§6.3）。

### 4.4 SizeContext / DisabledContext（SizeContext.tsx:17 / DisabledContext.tsx:16）

```js
<SizeContext.Provider value={size || originSize}>            // 真值判据
<DisabledContext.Provider value={disabled ?? originDisabled}> // undefined 判据
```

⚠️ 两个判据**不同**，不能统一。且只在 `if (componentSize)` / `if (componentDisabled !== undefined)` 时才包。

### 4.5 `useSize`（hooks/useSize.ts）

```js
if (!customSize) return size;            // 没传 → 用 context
if (isString(customSize)) return customSize ?? size;
if (isFunction(customSize)) return customSize(size);
return size;
```
⇒ 组件侧写法是 `useSize(size)`（传自己的 prop）。

### 4.6 locale（index.tsx:352-363, 641-647）

1. ESM interop 归一化：若 `rawLocale` 是 plain object 且有 `default.locale`，取 `.default`。
2. 只在 `if (locale)` 时才包 `LocaleProvider`，并传 `_ANT_MARK__ = ANT_MARK`（否则触发废弃告警）。

### 4.7 validateMessages（index.tsx:655-670）

```js
merge(defaultLocale.Form?.defaultValidateMessages || {},
      memoedConfig.locale?.Form?.defaultValidateMessages || {},
      memoedConfig.form?.validateMessages || {},
      form?.validateMessages || {})
```
只在 `Object.keys(validateMessages).length > 0` 时才包 Provider。

### 4.8 theme（hooks/useTheme.ts）

- `theme` 为 `undefined` ⇒ **直接返回 `parentTheme`**（不新建对象）。
- `inherit === false` 或没有父主题 ⇒ 从 `defaultConfig` 起算（不继承）。
- 否则 `{...parentThemeConfig, ...themeConfig}`，`token` 深一层浅合并，`components` **逐组件名**浅合并。

### 4.9 废弃告警

| prop | 替代 | 判据 |
|---|---|---|
| `autoInsertSpaceInButton` | `button.autoInsertSpace` | `'autoInsertSpaceInButton' in props` |
| `dropdownMatchSelectWidth` | `popupMatchSelectWidth` | `dropdownMatchSelectWidth === undefined` |

⚠️ 第一条在 Vue 下**必须**改成 `!== undefined`（Vue 的 props 恒含全部声明键，见 PITFALLS 46 同源的 D21）。

### 4.10 `warnContext`（index.tsx:118-128）

模块级 `existThemeConfig` 一旦为真，静态方法类组件（`message.success`）会告警
「静态方法吃不到动态 theme」。本项目**暂不实现**（无 `App` 组件、无静态方法宿主），登记为缺口。

## 5. DOM 结构

**无。** `ConfigProvider` 的唯一渲染产物是 `children`（外加两个渲染 `null` 的内部组件）。

⇒ L4 DOM 契约对本组件**不适用本体**，改为锁「它对下游产生的 DOM 影响」：
`prefixCls` 派生、`-rtl` 后缀、组件配置里的 `className` / `style` 落点。判 `n/a` + `layerNotes`，
证据走 L1/L2 的行为断言与 L6 视觉。

## 6. 实现决策（本项目的偏离与理由）

### 6.1 ⭐ 渐进式类型形态（难点 1 的答案）

antd 的 `ConfigProviderProps` **import 全部 56 个组件的 config 类型**（`context.ts` 顶部 60 行 import）。
本仓只有 3 个组件落地 ⇒ 照搬会直接编译失败。

**决策：双通道。**

```ts
interface ConfigProviderProps {
  // (A) 已落地组件 —— 精确类型，逐字段与 antd 同名
  divider?: DividerConfig;
  empty?: EmptyConfig;
  spin?: SpinConfig;

  // (B) 未落地组件 —— 弱类型逃生口
  components?: Record<string, ComponentConfigLike>;
}
```

- 两条通道在 `ConfigProvider` 内部**汇成同一个 `components` map**：先铺 `(B)`，再用 `(A)` 覆盖同名键
  （显式 prop 更具体 ⇒ 优先）。消费侧只有一条读取路径（`useComponentConfig(name)`）。
- **(A) 会随组件落地而增长**：每落地一个组件就把它从 `(B)` 提升成精确 prop。
  `doneWhen`：56 个组件全部落地后 `(B)` 退化为兼容保留项。
- 理由写成 `COMPATIBILITY.md` 的差异条目 **D25**（见 §10）。

**为什么不用 `[key: string]: unknown` 索引签名**：它会让 `keyof` 退化成 `string`、
让所有拼错的 prop 静默通过，类型测试的负例也写不出来 —— 那是把「渐进」做成「放弃」。

### 6.2 叶子模块缺口（难点 2 的答案）

| antd 叶子模块 | 本仓对应物 | 处置 |
|---|---|---|
| `form/validateMessagesContext` | `@apollo-design/form-core` 的 `FormProvider`（提供 `formContextKey`，带 `validateMessages` getter 且**自动与父级合并**） | ✅ **已接线**：`form.validateMessages` 非空时包 `FormProvider`。语义与 antd 的 `ValidateMessagesContext.Provider` 等价（它也是只带 messages 的 context）。 |
| `tooltip/UniqueProvider` | **不存在**（`tooltip` 未开工，不是本轮域） | ⛔ **登记为缺口**：不声明 `tooltip` / `popover` / `popconfirm` prop。理由：声明了却不实现 `unique` 等于给一个静默 no-op 的开关。走 §6.1 的 `(B)` 逃生口可以传配置，但 `unique` 无效这一点写进 README。 |

### 6.3 ⭐ 响应式：为什么提供的是**原地打补丁的 reactive 对象**（难点 3 的答案）

React 的 `useContext` 在 Provider 更新时**重跑消费者函数体** ⇒ `useComponentConfig()` 重新求值。
Vue 的 `inject` **只在 setup 期解析一次**，且现有消费者（`empty` / `divider` / `spin`）都是
`const { getPrefixCls, direction } = useComponentConfig(...)` —— **解构即快照**。

不改变域外组件的前提下，能做到的最强保证是：

| 通道 | 做法 | 是否随配置变化更新 |
|---|---|---|
| `getPrefixCls` | **稳定闭包**，内部读 `computed`（`props.prefixCls ?? 父级根前缀`）。消费者在 `computed` 里调它 ⇒ 被追踪 | ✅ 更新（对齐 antd 的 `dynamic prefixCls` 用例） |
| `classNames` / `styles` | 提供的是 `reactive` 对象 ⇒ 取出来的是 **proxy**，在 `computed` 里读 `.root` 仍被追踪 | ✅ 更新 |
| 组件配置里的对象/函数值 | 同上（proxy） | ✅ 更新 |
| `direction` 等**原始值** | 解构即快照 | ❌ **已知缺口** ⇒ 新增 `useDirection()`（返回 `ComputedRef`）作为**未来 50 个组件的正确读取姿势**，并在 README §7 写明「不要把 `direction` 解构成常量」 |

⇒ `provide` 的值是**同一个 `reactive` 对象**，配置变化时用 `Object.assign` **原地打补丁**，
而不是换一个对象。这样已注入的引用永远有效，也不破坏 antd §4.3 那条「避免 context 抖动」的意图。

### 6.4 theme：零运行时下的落地点（`ARCHITECTURE.md` §5.2）

- `theme` 包已经有 `getDesignToken()`（纯函数）与 `createCSSVarScope(el, prefix)`（运行时注入路径，
  即裁决 B 要求的「动态 token 通道」）。本组件是它的**第一个消费者**（memory 未决事项 4）。
- 合并语义照搬 `hooks/useTheme.ts`（`inherit === false` 不继承、`token` 浅合并、`components` 逐组件合并）。
- **注入需要一个 DOM 元素**。ConfigProvider 本体不产 DOM ⇒
  **只在「本层确实提供了 `theme`」时**渲染一个 `display:contents` 的作用域元素承载
  `--apollo-*`，其余情况原样渲染 `children`（与 antd 的 DOM 完全一致）。
  代价与理由登记为差异 **D26**。
- `theme.components`（Component Token）**只进 context、不产出 CSS 变量** ——
  PITFALLS 92：`tokens.css` 目前只声明 Alias 层。登记为缺口。

### 6.5 不实现的 antd 能力（逐条给理由）

| 能力 | 理由 |
|---|---|
| `@ant-design/cssinjs` 的 `createTheme` / `StyleContext` / `hashed` / `cssVar` | H6 硬禁止；零运行时无运行时样式表。`cssVar.prefix` 由 `theme.cssVarPrefix` 承担 |
| `IconContext`(`@ant-design/icons`) | icons 包目前无 context 消费者；`iconPrefixCls` 已进 ConfigContext |
| `MotionWrapper` | `motion` 包无「全局 motion 开关」的 context；`APOLLO_MOTION` 环境变量已承担。登记缺口 |
| `PropWarning` 的 React.memo 语义 | 用 `watchEffect` 里的 `devUseWarning` 替代，判据一致 |
| `warnContext` / `existThemeConfig` | 无静态方法宿主（`App` / `message`） |
| `holderRender` | React 特有的「把 children 再包一层」；Vue 用插槽包裹即可，不需要 API |
| `ConfigProvider.SizeContext` | 已废弃，不复制废弃 API |
| `PASSED_PROPS`（8 个 prop 的二次赋值） | React 的 `useContext` 直读优化，Vue 无对应物 |

## 7. Component Token

**0 个。** `registry/components.json` 的 `derived.tokenCount = 0`、`tokenGroup = null`，
antd 的 `config-provider/style/` 只给 `IconStyle`（图标的 cssinjs 样式），本体无 Component Token。

⇒ `tokenStatus` 判 **`n/a`**（架构依据：本组件不产任何视觉，无 Component Token 可定义）。
`styleStatus` 同判 **`n/a`**（本体零 DOM、零样式；E10 扫描对它无输入）。

## 8. 依赖面

| 依赖 | 本仓对应 | 状态 |
|---|---|---|
| `@rc-component/util` 的 `merge` / `useMemo` | `@apollo-design/utils` 的 `merge`；`useMemo` 由 `computed` 承担 | ✅ |
| `@ant-design/cssinjs` | **不引入**（H6）；`theme.getDesignToken` + `createCSSVarScope` | ✅ |
| `@apollo-design/theme` | `ThemeConfig` / `getDesignToken` / `createCSSVarScope` | ✅ completed |
| `@apollo-design/locale` | `LocaleProvider` / `ANT_MARK` / `defaultLocale` / `ValidateMessages` | ✅ completed |
| `@apollo-design/form-core` | `FormProvider`（validateMessages 通道） | ✅ completed |
| `@apollo-design/utils` | `warningContextKey` / `devUseWarning` / `isPlainObject` / `merge` | ✅ completed |
| `empty` 组件 | `defaultRenderEmpty` | ✅ completed |
| `tooltip` | **不存在** | ⛔ 缺口（§6.2） |

## 9. 差异预判

| # | 分类 | 差异 |
|---|---|---|
| D25 | INTENDED | 56 个组件配置 prop 退化为「3 个精确 prop + `components` 弱类型 map」（§6.1） |
| D26 | INTENDED | `theme` 生效时插入一个 `display:contents` 的作用域元素承载 CSS 变量（§6.4） |
| D27 | PLATFORM | 解构即快照：`direction` 等原始值不随配置更新；改用 `useDirection()`（§6.3） |
| D28 | PLATFORM | 废弃告警判据 `in props` → `!== undefined`（Vue 的 props 恒含全部键，与 D21 同源） |
| D29 | INTENDED | 不提供 `tooltip` / `popover` / `popconfirm` prop（`UniqueProvider` 未实现） |
| D30 | INTENDED | 不实现 `holderRender` / `warnContext` / `ConfigProvider.SizeContext` |
| D31 | INTENDED | `defaultPrefixCls` 是 `apollo` 不是 `ant`（既有裁决 `prefix-cls-default` = A） |

## 10. 测试矩阵

| 层 | 覆盖点 |
|---|---|
| L1 | `getPrefixCls` 三层继承；`undefined` 不覆盖；嵌套逐键合并；`iconPrefixCls`；`useSize` 四种入参；`useDisabled`；`useTheme` 的 inherit / 不继承 / 逐组件合并；`globalConfig` |
| L2 | 嵌套 provider 的继承与覆盖；`componentSize` / `componentDisabled` 对下游生效；`locale` 切换；动态 `prefixCls`；卸载清理（CSS 变量 remove） |
| L3 | props 类型正负例；`components` map 的弱类型；`useSize<T>` 泛型 |
| L4 | 本体无 DOM ⇒ 改为锁「对下游 DOM 的影响」（prefixCls / -rtl / 组件配置 className·style 落点） |
| L5 | 本体无可聚焦/可交互元素 ⇒ 判 `n/a` + 对 demo 跑 axe（0 violation） |
| L6 | 3 个 variant × 3 viewport × 1 theme：locale / direction / 组件配置透传 |
| L7 | 构建门禁（B1-B7）+ E11/E19 无 React 痕迹 |

## 11. 待验证问题

1. `theme.components` → CSS 变量：等 `packages/theme` 把 `prepareComponentToken` 也落成 `:root`（PITFALLS 92）。
2. MotionWrapper：等 `motion` 包给出「全局 motion 开关」的 context 形态。
3. `csp.nonce`：零运行时无样式注入 ⇒ 暂无消费者。
