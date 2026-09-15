# 组件分析模板

> 复制本文件为 `docs/analysis/<component>.md` 并填写。
>
> **这是 WORKFLOW.md G1 的交付物，必须先于任何实现代码存在。**
> 所有内容必须来自**实测**（读 antd 产物、源码、测试、demo），不得凭记忆。

---

# 组件分析：<ComponentName>

| 项 | 值 |
|---|---|
| 组件名 | `<kebab-name>` |
| 导出名 | `<PascalName>` |
| antd 版本 | 6.6.4 |
| 分组 | 通用 / 布局 / 导航 / 数据录入 / 数据展示 / 反馈 / 其他 |
| 优先级 | P0-P5 |
| 复杂度 | S / M / L / XL |
| 分析日期 | YYYY-MM-DD |

## 0. 参考来源

| 类型 | 路径 |
|---|---|
| antd 产物（类型） | `/tmp/antd-src/package/es/<name>/` |
| antd 源码 | `/tmp/antd-repo/ant-design-master/components/<name>/` |
| antd 测试 | `components/<name>/__tests__/`（**行为规格的最准确来源**） |
| antd 文档 | `index.zh-CN.md` / `index.en-US.md` |
| antd demo | `components/<name>/demo/` |

**已阅读的文件**（逐项列出，证明分析不是凭记忆）：

- [ ] `index.d.ts` / `<Name>.d.ts`
- [ ] `<Name>.tsx`
- [ ] `style/index.ts` / `style/token.ts`
- [ ] `__tests__/index.test.tsx`
- [ ] `__tests__/a11y.test.ts`
- [ ] `index.zh-CN.md`

## 1. 规模评估

| 指标 | 值 |
|---|---|
| antd 构建产物行数 | （来自 `registry/components.json` 的 `derived.antdBuildLineCount`） |
| antd 文件数 | |
| demo 数量 | |
| 测试文件数 | |
| rc 依赖 | |
| 依赖的组件 | |
| Component Token 数 | |
| complexity 判定 | S / M / L / XL（与 registry 一致） |

## 2. API 面

### 2.1 Props

| Prop | 类型 | 默认值 | 说明 | Vue 映射 |
|---|---|---|---|---|
| | | | | 直接同名 / v-model / 插槽 / 移除并登记 |

### 2.2 Events（React 的 onXxx 回调）

| React | 参数 | Vue emit | 备注 |
|---|---|---|---|
| | | | |

### 2.3 Slots（React 的 children 与 render prop）

| React | Vue 插槽 | slot props | 备注 |
|---|---|---|---|
| `children` | `default` | — | |
| `renderX` | `#x` | | 同时兼容函数 prop |

### 2.4 方法（Expose）

| 方法 | 参数 | 返回值 | 说明 |
|---|---|---|---|
| | | | |

### 2.5 静态方法 / 子组件

| React | Vue |
|---|---|
| `X.Sub` | `XSub` + `X.Sub` 别名 |
| `X.staticMethod()` | 同名导出 + `useX()` composable |

## 3. 类型面

### 3.1 泛型签名

```ts
// antd 的原始签名（抄写类型签名是允许的；抄实现代码是禁止的）
```

### 3.2 关键类型

| antd 类型 | Vue 侧类型 | 备注 |
|---|---|---|
| | | |

### 3.3 类型测试要点（正例与负例）

- 正例：
- 负例（应当报错）：

## 4. DOM 结构

**采集方式**：`node tests/compat/runner --component <name> --dump-dom`（或 antd 的 `__snapshots__`）

```html
<!-- antd 真实渲染出的 DOM（节选，标注关键结构） -->
```

### 4.1 稳定契约（必须对齐）

| 项 | 值 |
|---|---|
| 根元素 | |
| 根类名 | `${prefixCls}-...` |
| 内部结构类名 | |
| `data-*` 语义属性 | |
| 多根 / 单根 | |

## 5. ARIA

| 元素 | role | aria-* |
|---|---|---|
| | | |

**键盘交互**：

| 按键 | 行为 |
|---|---|
| Tab | |
| Enter | |
| Space | |
| Escape | |
| Arrow* | |

**焦点管理**：
- 焦点进入：
- 焦点陷阱：
- 焦点归还：
- `:focus-visible` 样式：

## 6. 行为规格（状态机）

```
（用文字或 Mermaid 描述状态与转移）
```

| 状态 | 触发 | 目标状态 | 副作用 |
|---|---|---|---|
| | | | |

### 6.1 边界条件

| 场景 | antd 的行为 | 依据（测试文件 + 行号） |
|---|---|---|
| 受控但只传 value 不传 onChange | | |
| 非受控 + defaultValue | | |
| 受控 ↔ 非受控切换 | | |
| disabled 时的交互 | | |
| loading 时的交互 | | |
| 空值 / null / undefined | | |
| 极长内容 | | |

## 7. Component Token

| Token | 类型 | antd 的默认值推导 | 说明 |
|---|---|---|---|
| | | | |

**来源**：`components/<name>/style/token.ts` 或 `style/index.ts` 的 `ComponentToken` 接口与 `prepareComponentToken`。

## 8. 依赖面

| 类型 | 内容 |
|---|---|
| rc 包 | |
| antd 生态包 | |
| 依赖的组件（运行时） | |
| 依赖的组件（仅类型） | |
| 依赖的叶子模块 | |
| 需要的 @apollo-design 包 | |

### 8.1 叶子模块的处理

antd 从哪些叶子模块导入？（如 `config-provider/context`、`form/context`）
在我们的架构中对应 `packages/ui/src/_internal/` 的哪些模块？

| antd 叶子模块 | 我们的位置 |
|---|---|
| | |

## 9. 差异预判

| # | React 行为 | 预计 Vue 行为 | 分类 | 理由 |
|---|---|---|---|---|
| | | | INTENDED / PLATFORM / UPSTREAM / BUG | |

**分类定义**（`AGENTS.md` §4.3）：
- `BUG`：我方实现错误（不应出现在预判中，出现在这里说明预期自己会写错）
- `INTENDED`：有意差异（Vue-native 更合理）
- `PLATFORM`：平台固有差异
- `UPSTREAM`：antd 的 bug 或未文档化行为

## 10. 测试矩阵

把每个 prop × 每个状态 × 每个主题展开：

| 维度 | 取值 | 用例数 |
|---|---|---|
| | | |

**7 层测试的覆盖计划**：

| 层 | 文件 | 计划用例数 | 关键断言 |
|---|---|---|---|
| L1 Unit | `index.test.ts` | | |
| L2 Interaction | `index.test.ts` / `keyboard.test.ts` | | |
| L3 Type | `type.test-d.ts` | | |
| L4 DOM Contract | `semantic.test.ts` | | |
| L5 A11y | `a11y.test.ts` | | |
| L6 Visual | `tests/visual/` | | 状态 × 主题 × viewport |
| L7 Build | — | | |

## 11. 实现决策

| 决策 | 选择 | 理由 |
|---|---|---|
| `.vue` 还是 `.tsx` | | 若用 `.tsx` 必须论证（`COMPONENT-RULES.md` §2） |
| 内部引擎的边界 | | |
| 是否需要 `_internal/` 叶子模块 | | |
| 是否复用第三方能力 | | |

## 12. 待验证问题

- [ ]
- [ ]

---

**分析完成标志**：以上全部字段填写完毕，且 API 面与 DOM 结构来自实测。
填写完毕后，将 `registry/components.json` 中该组件的 `status` 置为 `implementing`，`apiStatus` 置为 `done`（G2 通过后）。
