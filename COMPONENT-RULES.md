# COMPONENT-RULES.md

> 组件开发的统一规范。所有 72 个组件必须遵守，不允许"这个组件特殊所以例外"。
> 如确实需要例外，必须先修改本文件。

---

## 1. 组件目录结构

```
packages/ui/src/<kebab-name>/
├── index.ts                      # 公共导出（组件、类型、子组件、静态方法）
├── <Component>.vue               # 主实现（默认形态，见 §2）
├── interface.ts                  # 类型定义
├── <Component>Context.ts         # 组件级 provide/inject（如需）
├── components/                   # 内部子组件（不对外导出）
│   └── <Sub>.vue
├── engine/                       # 组件私有引擎（当无第二个消费者时）
├── style/
│   ├── token.ts                  # Component Token 定义 + prepareComponentToken
│   ├── index.ts                  # 样式生成（Token → CSS）
│   ├── <part>.ts                 # 拆分的大型样式片段
│   └── compact.ts                # compact 模式补充样式
├── demo/                         # 示例：<name>.vue + <name>.md 成对出现
├── __tests__/                    # 见 TESTING.md
├── index.en-US.md                # 英文文档
├── index.zh-CN.md                # 中文文档
└── README.md                     # 实现说明（分析结论、偏离项、决策记录）
```

**规则 R1**：`README.md` 中必须记录该组件的：
1. 对应 antd 组件的版本与路径
2. 与 antd 的**行为差异清单**（同步到 `COMPATIBILITY.md` §9）
3. 若使用 `.tsx` 而非 `.vue`，说明理由
4. 该组件实现的 Component Token 清单

---

## 2. `.vue` 与 `.tsx` 的选择

**默认且首选：`.vue` SFC。** 它是 Vue 的表达方式，模板可读性、样式作用域、编译器优化都更好。

**允许 `.tsx` 的唯一条件**（满足其一，且必须在 `README.md` 记录理由）：
1. 组件是**纯渲染函数型**内部件（如虚拟列表行渲染器、`Table` 的单元格渲染）
2. 渲染树深度动态、由数据驱动的分支远超模板表达能力（如 `Table` 的 `renderCell` 组合）
3. 需要在渲染函数中做复杂的泛型推导（Vue 泛型 SFC 无法表达）

**禁止**：因为"antd 是 TSX 所以我们也用 TSX"。

---

## 3. 组件骨架规范

每个组件必须显式声明以下内容，**不允许依赖默认行为**：

```vue
<script setup lang="ts">
// 1. 组件名（供 devtools、递归引用、全局注册使用）
defineOptions({
  name: 'AButton',
  inheritAttrs: false,   // 必须显式声明，配合 $attrs 透传
});

// 2. Props：用 interface + withDefaults，不用运行时对象语法
const props = withDefaults(defineProps<ButtonProps>(), {
  type: 'default',
  size: undefined,
  htmlType: 'button',
  loading: false,
  danger: false,
  disabled: false,
  block: false,
  ghost: false,
});

// 3. Emits：显式声明，命名遵守 COMPATIBILITY.md §1.3
const emit = defineEmits<{
  click: [e: MouseEvent];
}>();

// 4. Slots：显式声明类型
defineSlots<{
  default?: () => any;
  icon?: () => any;
}>();

// 5. Expose：只暴露 antd 文档中列出的方法
defineExpose({ focus, blur, nativeElement });
</script>

<template>
  <button
    ref="buttonRef"
    :class="classNames"
    :data-loading="loading || undefined"
    v-bind="$attrs"   <!-- 必须放在最后，保证原生事件/属性透传 -->
  >
    <slot />
  </button>
</template>
```

**规则 R2**：`defineOptions({ name })` 必须使用带 `A` 前缀的 PascalCase 名（`AButton`），与全局注册名一致。

**规则 R3**：`inheritAttrs: false` + `v-bind="$attrs"` 是本项目的**标准形态**，除非组件有多个根节点（多根组件需显式决定 `$attrs` 落在哪个节点，并写测试）。

**规则 R4**：`withDefaults` 的默认值**必须与 antd 的默认值一致**。不允许"我觉得 8 更好"。

**规则 R5**：Props 类型定义在 `interface.ts`，命名为 `<Component>Props`，与 antd 一致。

---

## 4. Props 规范

| 项 | 规则 |
|---|---|
| 命名 | 与 antd 完全一致（`COMPATIBILITY.md` 规则 C3） |
| 类型 | 使用具体类型，禁止 `any`；复杂联合类型从 `interface.ts` 引用 |
| 默认值 | 必须显式声明且与 antd 一致 |
| 可选性 | 与 antd 一致（antd 中可选的在 Vue 中也必须可选） |
| 枚举值 | 与 antd 一致，如 `size?: 'small' \| 'middle' \| 'large'`（**保留 `middle`，不改成 `medium`**） |
| 废弃 prop | 保留并输出 `warning`，与 antd 的废弃节奏一致 |
| `prefixCls` | 每个组件都必须支持，默认从 ConfigProvider 读取，兜底 `'apollo'` |
| 语义化 classNames/styles | 每个组件都必须支持 `classNames` / `styles`，键名与 antd 一致 |
| `rootClassName` / `rootStyle` | 必须支持 |
| `getPopupContainer` | 含浮层的组件必须支持 |

**规则 R6**：`prefixCls` 派生的类名结构必须与 antd 同构。例如 Button：`${prefixCls}-btn`、`${prefixCls}-btn-primary`、`${prefixCls}-btn-icon`。

---

## 5. Token 与样式规范

### 5.1 必须走 Token 的属性

以下属性**禁止硬编码**，必须来自 Token（`H9`）：

`颜色 / 背景色 / 边框色 / 圆角 / 高度 / 内边距 / 外边距 / 字号 / 行高 / 字重 / 阴影 / 边框宽度 / 动画时长 / 缓动函数 / z-index / 透明度`

### 5.2 Component Token 定义

每个组件必须在 `style/token.ts` 中定义自己的 Component Token：

```ts
// style/token.ts
export interface ComponentToken {
  /** @desc 文字字重 @descEN Font weight of text */
  fontWeight: CSSProperties['fontWeight'];
  // ... 与 antd 的同名 Component Token 一一对应
}

export const prepareComponentToken = (token: AliasToken): Partial<ComponentToken> => ({
  fontWeight: token.fontWeightStrong,
  // 默认值必须与 antd 的 prepareComponentToken 计算方式一致
});
```

**规则 R7**：Component Token 的**名称、数量、默认值计算方式**都必须与 antd 一致。这是"用户能无缝迁移自定义主题"的前提。

**规则 R8**：`registry/tokens.json` 中登记该组件的 Token 清单与覆盖状态，`tokenStatus` 才可置为 `done`。

### 5.3 CSS 规范

- 类名：`.${prefixCls}-<component>`（`prefixCls` 默认 `apollo`）
- 所有可变值：`var(--apollo-<token-kebab>)`
- 状态：用 `data-*` 属性选择器，不用类名堆叠
  ```css
  .apollo-btn[data-loading='true'] { ... }
  .apollo-btn[data-size='large'] { ... }
  ```
- 样式片段按 antd 的拆分方式组织（`index.ts` / `group.ts` / `variant.ts` / `compact.ts`），保证可对照
- 支持 RTL：使用逻辑属性（`margin-inline-start` 等），禁止 `margin-left` 硬编码方向

**规则 R9**：样式产物必须能在**无 JS 运行时**下正确显示默认主题（`css/base.css` 包含默认主题变量）。

---

## 6. DOM Contract 规范

**规则 R10**：DOM 结构必须与 antd 结构同构。开发时**必须**对照 antd 参考实现的真实 DOM（通过 compat fixture 采集），不得凭文档猜测。

**规则 R11**：必须输出的稳定契约：
- 根元素上的 `class`（含 `prefixCls` 派生类）
- `data-*` 语义属性（与 antd 一致）
- 内部结构性类名（`${prefixCls}-inner` / `-content` / `-icon` 等）

**规则 R12**：DOM Contract Test 必须锁定上述契约（见 `TESTING.md` §4）。

---

## 7. Accessibility 规范

**规则 R13**：无障碍要求**不得低于** antd。必须做到：
- 语义化标签优先（`<button>` 而非 `<div role="button">`）
- 所有交互元素键盘可达（Tab 顺序合理）
- 焦点可见（使用共享的 focus 样式，不各自实现）
- `aria-*` 属性与 antd 一致（`aria-disabled` / `aria-expanded` / `aria-selected` / `aria-label` ...）
- 浮层组件：焦点陷阱（Modal/Drawer）、`aria-modal`、`aria-labelledby`、Esc 关闭、焦点归还
- 状态变化有可感知反馈（`aria-live`）
- 颜色对比度达 WCAG AA

**规则 R14**：a11y 测试用 axe-core 自动扫描 + 键盘交互手工断言，两者缺一不可。

---

## 8. 状态机规范

**规则 R15**：任何有 ≥3 个状态或 ≥5 条转移的交互（如 Select 的 open/search/highlight/select、Form 的 validate/submit、Table 的 sort/filter/paginate），必须在组件 `README.md` 中用状态机描述，并让实现与之逐条对应。

**规则 R16**：状态机中的转移必须有对应测试用例。**不允许**有"实现里存在但测试没覆盖"的转移。

---

## 9. 子组件与静态方法

**规则 R17**：子组件（`Button.Group`）在 Vue 中：
- 独立实现为 `AButtonGroup`
- 同时在 `Button` 上挂静态别名：`Button.Group = ButtonGroup`
- 两种写法都必须有测试

**规则 R18**：静态方法（`message.success` / `Modal.confirm`）：
- 同时提供**静态调用**（`message.success()`）与 **composable 调用**（`useMessage()`）
- composable 形式必须返回 `[api, ContextHolder]`，与 antd 结构一致
- 静态调用在未包裹 `ConfigProvider` 时使用默认配置，与 antd 行为一致

---

## 10. 文档规范

每个组件必须有两份文档（`index.zh-CN.md` / `index.en-US.md`），结构固定：

```markdown
---
category: Components
group: 通用
title: Button
subtitle: 按钮
---

## 何时使用
（自写，不复制 antd 文案）

## 代码演示
（引用 demo/ 下的示例）

## API

### Props
| 属性 | 说明 | 类型 | 默认值 | 版本 |
（**只列 Props，children 移到 Slots**）

### Events
| 事件 | 说明 | 参数 |

### Slots
| 插槽 | 说明 | 参数 |

### Methods
| 方法 | 说明 | 参数 | 返回值 |

### Design Token
| Token | 说明 | 类型 | 默认值 |
（来自 registry/tokens.json）

## FAQ
```

**规则 R19**：文档必须由我们**重新撰写**（`H2`）。禁止复制 antd 文档正文。允许对齐的是：API 表结构、Prop 名、类型、默认值。

**规则 R20**：文档中的每个 demo 必须**可运行**，且被 demo 测试覆盖（`demoTest`）。

---

## 11. 组件完成前的自检清单

提交前逐项确认，任一项不通过则不得置为 `completed`：

- [ ] Props 名/类型/默认值与 antd 一致，无遗漏
- [ ] 事件名与 payload 顺序与 antd 一致
- [ ] 插槽覆盖了 antd 的所有 render prop
- [ ] `defineExpose` 方法名与 antd 文档一致
- [ ] Component Token 名称/默认值与 antd 一致
- [ ] 无任何硬编码颜色/尺寸/圆角/阴影
- [ ] DOM 结构与 antd 同构，`data-*` 属性一致
- [ ] a11y 不低于 antd，axe 无 violation
- [ ] 7 层测试全部通过（见 `TESTING.md`）
- [ ] 视觉回归与 React 参考截图比对通过或差异已登记
- [ ] dark / compact 两种主题下视觉正确
- [ ] 差异清单已登记到 `COMPATIBILITY.md` §9 与本组件 `README.md`
- [ ] 两份文档（zh-CN / en-US）完成
- [ ] `registry/components.json` 各维度状态更新
- [ ] `pnpm run test:build` 通过

---

## 12. Definition of Done：自检项 → Registry 字段的映射

自检清单是给人看的；**Registry 字段才是给工具看的**。下面是两者的一一对应 ——
清单里勾了但 registry 没置 `done`，进度等于不存在。

### 12.1 组件（11 个维度）

| Registry 字段（`registry/components.json`） | 对应 Gate | 自检项 | 证据 |
|---|---|---|---|
| `antdApiStatus` | G1 | antd 6.6.4 的 API 面已完整枚举 | API 面清单（props/events/slots/methods/ref/token） |
| `apiStatus` | G2 | Props/事件/插槽与 antd 对齐 | `*.test-d.ts` + `vue-tsc` |
| `compatStatus` | G10 | DOM 契约 + 双实现比对通过，差异已登记 | `tests/compat` 比对结果 + `COMPATIBILITY.md` §9 行号 |
| `tokenStatus` | G3 | Component Token 已定义并接入派生链 | `packages/theme` 中该组件的 Token 组 |
| `styleStatus` | G4 | 样式完成且无硬编码视觉值 | E10 扫描通过 |
| `unitStatus` | G5 | L1 单元测试通过 | vitest 输出 |
| `interactionStatus` | G6 | L2 交互测试通过 | vitest 输出 |
| `typeStatus` | G7 | L3 类型测试（含负例）通过 | vitest + `vue-tsc` |
| `a11yStatus` | G8 | L5 无障碍通过 | axe 无 violation + 键盘测试 |
| `visualStatus` | G9 | L6 基线建立且通过 | `tests/visual` 基线与比对结果 |
| `docsStatus` | G11 | 文档 + demo 与 antd 一一对应 | `index.zh-CN.md` / `index.en-US.md` + `demo/` |

字段取值：`todo` → `analyzing` → `implementing` → `testing` → `verifying` → `done`，
旁路状态 `blocked` / `n/a`（`n/a` 必须说明架构依据）。

### 12.2 基础设施包（6 个维度）

对应 `registry/foundation.json` 的 `dimensions`：`api` / `impl` / `types` / `tests` / `docs` / `pkg`，
外加 `testLayers`（7 层的 done/n/a）、`verification`（实测的测试数/覆盖率/构建状态）、
`blockedBy`（指向 `openDecisions`）。

见 `WORKFLOW.md` §1.1 与 `registry/README.md`。

### 12.3 Registry 条目长什么样

一个组件条目（已去除派生字段）大致是：

```jsonc
{
  "name": "button",
  "exportName": "Button",
  "group": "通用",
  "priority": "P0",
  "complexity": "S",
  "status": "todo",                 // 由 11 个维度推导，不要手改
  "dependencies": {
    "components": ["config-provider"],  // 运行时依赖（E4 检查无环）
    "foundation": ["@apollo-design/theme", "@apollo-design/utils"],
    "rcPackages": ["@rc-component/util"]
  },
  "blockedBy": [],                  // 只允许填「组件名」；包级阻塞填在 foundation.json
  "blockers": [],                   // { type, reason, blockedBy, unblockCondition, since }
  "antdApiStatus": "todo",
  "apiStatus": "todo",
  "compatStatus": "todo",
  "tokenStatus": "todo",
  "styleStatus": "todo",
  "unitStatus": "todo",
  "interactionStatus": "todo",
  "typeStatus": "todo",
  "a11yStatus": "todo",
  "visualStatus": "todo",
  "docsStatus": "todo"
}
```

**生成 vs 保留**：`name` / `exportName` / `group` / `priority` / `complexity` / `derived` /
`dependencies` 由 `gen-registry.mjs` 从 antd 事实生成；11 个维度 / `status` / `blockers` /
`notes` 跨运行保留，人工维护。**所以可以反复运行生成脚本，不会抹掉进度。**

### 12.4 常见错误

| 错误 | 后果 | 正确做法 |
|---|---|---|
| 手改 `components.json` 的 `status` | 下次生成被覆盖，或与维度矛盾被 E3 拦下 | 改 11 个维度，`status` 由工具推导 |
| `blockedBy` 里填包名 | E6/E8 报错 | 组件级阻塞填组件名；包级阻塞去 `foundation.json` |
| 差异不登记就合入 | 违反 C24，日后无法判断是有意还是 bug | 先登记 `COMPATIBILITY.md` §9 |
| 用 `n/a` 掩盖未做 | E16 要求 `layerNotes` 说明架构依据 | 要么做，要么写清为什么架构上不适用 |
| 跳过 L6 视觉 | `visualStatus` 永远 todo，组件无法 completed | 建立基线；策略见 `visual-baseline-in-git` |
