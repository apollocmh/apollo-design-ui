> 规范范围：本文件保留实现说明与历史对照证据；上游同构、旧阶段与历史 Gate 要求不再生效。现行规则见 [项目规范](../../../../AGENTS.md)，公共行为以 Apollo 组件 API 文档与测试契约为准。

# config-provider

> **层**：L3（`packages/ui`）｜ **优先级**：P0 ｜ **复杂度**：L ｜ **antd 版本**：6.6.4
>
> 契约来源：antd `es/config-provider/index.js`（805 行）+ `components/config-provider/{context.ts,SizeContext.tsx,DisabledContext.tsx,hooks/}`。
> 上游是**兼容性规格**，不是代码来源。
>
> 解锁下游：**50 个组件**（一切读 `direction` / `theme` / `locale` / `size` / `disabled` / `prefixCls` 的组件）。

---

## 1. 职责

全库的**运行时网关**。向子树统一提供：

| 通道 | 注入键 | 用途 |
|---|---|---|
| `ConfigContext` | `configContextKey`（`reactive` patch） | `prefixCls` / `iconPrefixCls` / `theme` / `direction` / `renderEmpty` / `csp` / `variant` / `wave` / 组件配置 |
| `SizeContext` | `sizeContextKey`（`ComputedRef`） | `componentSize`（独立 context，避免牵动 ConfigContext） |
| `DisabledContext` | `disabledContextKey`（`ComputedRef`） | `componentDisabled`（独立 context，同上） |
| `WarningContext` | `warningContextKey`（`ComputedRef`，Issue #48） | 显式 `warning` 对象（utils 的 `useDevWarning` 默认 `{}`；消费者侧 `toValue` 现读） |
| `LocaleContext` | 经 `LocaleProvider` | 透传到 `@apollo-design/locale` |
| `FormContext` | 经 `FormProvider` | 透传 `validateMessages`（自动与 `defaultLocale.Form` 合并） |

并以**零运行时 CSS 变量**的方式注入主题（裁决 B，`ARCHITECTURE.md` §5.2）：
`theme` 给出时渲染一个 `display: contents` 的作用域元素承载 `--apollo-*`。

插槽内容通过同一份原生Teleport子树，在内联位置和主题作用域之间移动。theme晚出现、移除和恢复保留子组件、用户输入、选择区与焦点；未给theme时无额外包装元素。SSR先内联输出，水合后进入主题作用域。主题上下文继承外层ThemeProvider；当前cssVarPrefix替换时清除旧变量。证据见 [Image统一整改清单](../../../../docs/audit/2026-10-25-image-contract-audit.md)。

## 2. 文件布局

```
config-provider/
├── ConfigProvider.ts               # 主组件（.ts，非 .vue）
├── context.ts                      # configContextKey + ConfigContextValue + useConfigContext / useDirection / useThemeConfig / useComponentConfig
├── size-context.ts                 # SizeType + sizeContextKey + useSize
├── disabled-context.ts             # disabledContextKey + useDisabled
├── default-render-empty.ts         # DefaultRenderEmpty 组件 + defaultRenderEmpty()
├── global-config.ts                # setGlobalConfig / globalConfig / resetGlobalConfig（无 Provider 时的兜底）
├── hooks/use-theme.ts              # useTheme（父子 theme 合并，删除 cssinjs 三件套）
├── use-config.ts                   # useConfig() => { componentDisabled, componentSize }
├── interface.ts                    # ConfigProviderProps（渐进类型）+ FormConfig + GlobalConfigProps + UseConfigResult
├── index.ts                        # withInstall + ConfigContext / config / useConfig 静态
├── demo/                           # 5 个 demo：prefix-cls / locale / component-config / size-disabled / theme
├── __tests__/                      # L1 / L2 / L3 / L4 / L5 / theme + 变异验证（M1-M14 全杀死）
└── index.zh-CN.md / index.en-US.md
```

主组件写成 `.ts` 渲染函数而非 `.vue` SFC：渲染树是**数据驱动的动态嵌套**，按 `locale` / `form.validateMessages` / `theme` 三个条件决定要不要包三层 Provider，模板表达不了这种条件包裹。

## 3. 三条最容易写错、且都已被测试钉住的判据

1. **`components` 必须逐组件名合并**（不能整体替换）。antd 的 `config` 是 `{...parentContext}` 后**逐键**覆盖（`index.tsx:588-594`），我们把 56 个组件配置收进一个 `map` 字段，整体替换会把父级的组件配置全丢 —— 嵌套 provider 只给一部分配置时静默丢配置，影响 50 个组件。
2. **`undefined` 不覆盖**（同上）。本层 prop 为 `undefined` 时回落父级值；且「本层曾经设过、现在改回 `undefined`」也要回落 —— 所以每次都「从父级重算全量」再打补丁，不是增量改（`ConfigProvider.ts:265-269` 的清理循环为此而存在）。
3. **`componentSize` 用 ||、`componentDisabled` 用 ??**（`SizeContext.tsx:17` / `DisabledContext.tsx:16`）。`componentDisabled={false}` 必须能显式关闭父级的 `true`，用 || 失效。两个判据不能统一。
4. **`virtual` 的 prop 缺省只能是 `undefined`（Issue #39）**：写成 `default: true` 会让
   `props.virtual` **恒为 boolean**，而「本层 `!== undefined` 就覆盖父级」⇒ 内层
   Provider 没写 `virtual` 也会把父级的 `false` 顶成 `true`。正确写法是三段式
   `props.virtual ?? parentContext.virtual ?? true`（本层 → 父级 → antd 文档 `@default true`）。
   ⚠️ 上游实测：无 Provider ⇒ false、父 false + 子不传 ⇒ false、父 true + 子不传 ⇒ true
   —— 本仓「无父级兜底 `true`」是既有裁决（`index.test.ts` 已钉）。（`SizeContext.tsx:17` / `DisabledContext.tsx:16`）。`componentDisabled={false}` 必须能显式关闭父级的 `true`，用 || 失效。两个判据不能统一。

## 4. 与 antd 的有意差异

详见 `docs/analysis/config-provider.md` §9（D25-D33）。摘要：

- **D25** 渐进类型：56 个组件配置 prop 退化为「3 个精确 prop（`divider` / `empty` / `spin`）+ `components` 弱类型 map」逃生口（未落地组件走逃生口）。
- **D26** `theme` 给出时插入 `display: contents` 作用域元素 —— `theme-token` 视觉用例在 Chromium `#stage` 容器里因此产生 1px 假盒子（D32，已记录）。
- **D27** `inject` 只在 setup 期解析一次，`const { direction } = ...` 拿到的是快照 → 下游读 `direction` 必须走 `useDirection()` 这个 `ComputedRef`。
- **D29** 不提供 `tooltip` / `popover` / `popconfirm` prop（`UniqueProvider` 未实现）。

## 5. 未实现能力（明确登记）

- `holderRender` / `warnContext` / 静态 `ConfigProvider.SizeContext` / 全局 `MotionWrapper` / 全局 `IconContext` —— 见 D30。
- `tooltip` / `popover` / `popconfirm` prop —— 见 D29。

## 6. 变异验证

14 个变异（M1-M14）全部被现有用例 + 补增的 4 条用例钉住。详见 commit `6869c5d`。

| 变异 | 落点 | 初跑结果 | 处理 |
|---|---|---|---|
| M4 | 删「键回落」清理循环 | 存活 | 根级 provider `variant` 回落用例补上 → 杀死 |
| M5 | `componentSize` 的 || → ?? | 存活（SizeType 域内等价） | 空串越界值用例补上 → 杀死 |
| M13 | `useSize` 真值判据 → undefined | 存活 | 空串越界值用例补上 → 杀死 |
| M14 | 组件 token 不与父级合并 | 存活（只合了不同组件名） | 同名组件逐键合并用例补上 → 杀死 |
| 其他 10 个 | — | 直接杀死 | — |
