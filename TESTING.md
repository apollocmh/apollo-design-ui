# TESTING.md

> 七层测试架构。**不允许只测「组件能渲染」** —— 必须测真实行为。
> 每层有独立的运行入口、独立的 Gate，缺一层则组件不得标记 `completed`。

---

## 0. 七层总览

| # | 层级 | 运行入口 | 运行环境 | 验证什么 |
|---|---|---|---|---|
| L1 | Unit Test | `pnpm test:unit` | jsdom | 纯逻辑、工具函数、Token 计算、状态机转移 |
| L2 | Interaction Test | `pnpm test:unit` | jsdom | 真实用户交互（点击/输入/键盘/拖拽/焦点） |
| L3 | Type Test | `pnpm test:types` | vue-tsc | Props/Emits/Slots/Expose 的类型正确性与泛型推导 |
| L4 | DOM Contract Test | `pnpm test:dom` | jsdom | 类名结构、DOM 层级、`data-*` 属性 |
| L5 | Accessibility Test | `pnpm test:a11y` | jsdom + axe | `role` / `aria-*` / 键盘可达性 / 焦点管理 |
| L6 | Visual Regression | `pnpm test:visual` | Playwright | 像素级视觉，对比 React 参考实现 |
| L7 | Build Test | `pnpm test:build` | node | 构建产物、exports、无 React 依赖、体积预算 |

另有横切的 **Compatibility Harness**（`tests/compat/`），用同一份 fixture 驱动双实现比对 —— 见 §8。

---

## 1. 目录约定

```
packages/ui/src/button/__tests__/
├── index.test.ts            # L1+L2 单元与交互
├── keyboard.test.ts         # L2 键盘交互
├── semantic.test.ts         # L4 DOM Contract + 语义化 classNames/styles
├── a11y.test.ts             # L5 无障碍
├── type.test-d.ts           # L3 类型测试
├── demo.test.ts             # demo 冒烟（每个 demo 都能渲染不报错）
├── theme.test.ts            # 主题（light/dark/compact/token override）
└── __snapshots__/
    └── dom-contract.snap
```

**规则 T1**：文件名固定，不允许自创（如 `xxx.spec.ts`）。这样 CI 可以按名字分项目运行。

**规则 T2**：`tests/shared/` 提供共享测试契约（见 §7），组件测试必须复用，不允许各自重写。

---

## 2. L1 · Unit Test

**测什么**
- Token 计算的正确性（Seed → Map → Alias → Component 的每一跳）
- 状态机的每一条转移（含非法转移被拒绝）
- 工具函数（含边界：空值、超长、Unicode、中文/emoji）
- 受控 / 非受控的语义分支

**不测什么**
- 第三方库自身的行为（如 dayjs 的日期计算）
- 纯 CSS（由 L6 覆盖）

**关键要求**
- 状态机转移必须**逐条**对应测试用例（`COMPONENT-RULES.md` 规则 R16）
- 时间相关逻辑必须 `vi.useFakeTimers()`，禁止真实等待
- 禁止 `await sleep(100)` 这类不确定等待

---

## 3. L2 · Interaction Test

**测什么**：真实用户行为的完整路径。

**规则 T3**：交互必须通过**真实事件**触发，而不是直接调用内部方法。优先使用 `@vue/test-utils` 的 `trigger`，键盘交互使用真实的 `keydown`/`keyup` 序列。

**规则 T4**：每个交互组件必须覆盖：

| 维度 | 覆盖要求 |
|---|---|
| 鼠标 | click / dblclick / mouseenter / mouseleave / mousedown / mouseup / contextmenu |
| 键盘 | Tab 进入 / Tab 离开 / Enter / Space / Esc / ArrowUp / ArrowDown / Home / End |
| 焦点 | 获得焦点 / 失去焦点 / 焦点在子元素间移动 / 焦点归还 |
| 受控 | 受控时不自行更新 / emit 参数正确 |
| 非受控 | 内部状态正确更新 |
| 受控↔非受控切换 | 切换后行为与 antd 一致 |
| 禁用 | 禁用时所有交互均无效，且不 emit |
| 组合 | 多实例共存、嵌套使用、条件渲染后重挂载 |

**规则 T5**：测试必须是**确定性的**。禁止依赖 `setTimeout` 的真实时长、禁止依赖元素顺序不确定的查询、禁止依赖系统时区/语言。

**规则 T6**：必须处理异步边界的确定性：
- 浮层动画：在测试环境统一禁用 motion（`motion: false` 或 CSS 层面禁用）
- `ResizeObserver` / `MutationObserver`：使用 `tests/shared/` 提供的 polyfill/mock
- 异步校验：`await flushPromises()` / `nextTick()` 明确等待

### 3.1 以 Button 为例的完整测试矩阵

这是所有组件的**覆盖度基准**。Button 必须覆盖：

| 维度 | 用例 |
|---|---|
| `type` | `primary` / `default` / `dashed` / `text` / `link` 各自的类名与语义 |
| `size` | `small` / `middle` / `large`（**含默认值等于 `middle` 的断言**） |
| `loading` | 图标出现 / 禁用交互 / 不 emit click / 与 `icon` 共存 / `loading` 与 `disabled` 组合 |
| `disabled` | 原生 `disabled` 属性 / 不 emit / 样式属性 / 子元素 `pointer-events` |
| `danger` | 类名与变体组合（`danger` + `type` 的所有组合） |
| `block` | 类名 / 宽度 |
| `ghost` | 类名 |
| `icon` | 作为 prop / 作为插槽 / 与文字的位置（`iconPosition`）/ 仅图标 |
| `htmlType` | `submit` / `reset` / `button` 的默认值与透传 |
| `click` | emit 参数（MouseEvent）/ 冒泡 / 阻止默认 |
| `keyboard` | Enter 触发 / Space 触发 / Tab 可达 |
| `focus` | `:focus-visible` 样式类 / `focus()` 方法 / `blur()` 方法 |
| `hover` | hover 类名（由 L6 覆盖视觉） |
| `active` | active 类名 |
| `wave` | 点击波纹效果的创建与清理（含卸载时不泄漏） |
| `theme` | 默认主题 Token 生效 |
| `dark` | dark 算法下 Token 变化 |
| `compact` | compact 算法下高度/间距变化 |
| `token override` | `ConfigProvider theme.components.Button` 覆盖生效 |
| `classNames/styles` | 语义化覆盖 + 优先级（ConfigProvider < 组件） |
| `ref` | `nativeElement` / `focus` / `blur` 暴露正确 |
| `ButtonGroup` | 子按钮的 group 类名 / 尺寸继承 / `compact` 合并边框 |

**其他组件按此模式类推**：把该组件的每个 prop × 每个状态 × 每个主题都展开成矩阵，写进组件的分析文档。

---

## 4. L3 · Type Test

**测什么**
- Props 类型是否正确（必填/可选、联合值、泛型）
- 错误用法是否报错（`@ts-expect-error` 断言，**这是允许使用它的唯一场景**）
- Emits 参数类型
- Slots 的 slot props 类型
- `defineExpose` 的方法类型
- 泛型推导（如 `Table<RecordType>` 的 `columns` 与 `dataSource` 联动）

**实现方式**：`type.test-d.ts` + `vue-tsc --noEmit`，配合 `expectTypeOf`。

**规则 T7**：类型测试必须包含**负例**（应当报错的用法）。只有正例的类型测试是没有价值的。

**规则 T8**：泛型组件必须有专门用例验证：传入 `columns` 后 `renderCell` 的 `record` 参数类型被正确推导。

---

## 5. L4 · DOM Contract Test

**测什么**：DOM 结构作为**对外契约**的稳定性。

**规则 T9**：必须锁定的契约：
1. 根元素类名（含 `prefixCls` 派生）
2. 内部结构性类名（`-inner` / `-content` / `-icon` / `-group` ...）
3. `data-*` 语义属性（`data-loading` / `data-size` / `data-status` ...）
4. DOM 层级关系（父子结构，不锁定具体标签的属性顺序）
5. 多根组件中 `$attrs` 的落点

**规则 T10**：契约测试用**结构化快照**（只保留标签名 + 类名 + `data-*` + `role`/`aria-*`），而不是完整 DOM 快照。完整快照会因无关属性变化频繁失败，失去价值。

**规则 T11**：DOM 契约的**基准来自 React 参考实现的实测 DOM**，不是我们自己写的实现。生成方式：

```bash
pnpm run test:compat:baseline -- --component button
# 用 Playwright 渲染 antd 参考实现，提取结构化 DOM 契约 → tests/compat/baselines/button.dom.json
```

然后 Vue 侧的 DOM Contract Test 与该基线比对。

**规则 T12**：`prefixCls` 必须被测试（传 `prefixCls="custom"` 时所有类名正确替换）。

---

## 6. L5 · Accessibility Test

**两层，缺一不可**：

### 6.1 自动扫描（axe-core）

```ts
// __tests__/a11y.test.ts
import { axe } from 'vitest-axe';
import a11yDemoTest from '@apollo-design/test-utils/a11y';

a11yDemoTest('button');   // 对每个 demo 渲染后跑 axe，要求 0 violation
```

**要求**：所有 demo 渲染结果 **0 violation**（不允许 `disableRules` 来"通过"，除非是 axe 的已知误报，且必须写明理由）。

### 6.2 键盘与焦点（手工断言）

**规则 T13**：必须显式断言：

| 要求 | 断言内容 |
|---|---|
| 键盘可达 | Tab 能进入/离开，顺序合理 |
| 焦点可见 | `:focus-visible` 生效 |
| Esc 关闭 | 浮层组件 Esc 后关闭并归还焦点 |
| 焦点陷阱 | Modal/Drawer 内 Tab 循环不逃逸 |
| 焦点归还 | 关闭后焦点回到触发元素 |
| ARIA 状态 | `aria-expanded` / `aria-selected` / `aria-disabled` / `aria-checked` 随状态变化 |
| 浮层关联 | `aria-controls` / `aria-labelledby` / `aria-describedby` 指向正确 |
| 屏幕阅读器文本 | 图标按钮有可访问名；`loading` 状态有 `aria-live` 或等价反馈 |
| 颜色对比度 | 由 L6 + 设计 Token 保证，在 theme 测试中断言 Token 对比度 ≥ 4.5:1（正文）/ 3:1（大文本） |

---

## 7. 共享测试契约（`@apollo-design/test-utils`）

对应 antd 的 `tests/shared/`。**必须复用，禁止各组件自写。**

| 模块 | 作用 | 对应 antd |
|---|---|---|
| `mountTest` | 渲染 → 更新 → 卸载不报错，无内存泄漏警告 | `mountTest.tsx` |
| `demoTest` | 遍历组件所有 demo，渲染无报错、无 warning | `demoTest.tsx` |
| `a11yDemoTest` | 遍历所有 demo 跑 axe | `accessibilityTest.tsx` |
| `focusTest` | 焦点获取/丢失/归还的通用断言 | `focusTest.tsx` |
| `rtlTest` | 镜像渲染无布局异常 | `rtlTest.tsx` |
| `rootPropsTest` | 根 `class` / `style` / `prefixCls` 契约（**注入原生 attrs**，见 `COMPONENT-RULES.md` §4 的「根 class / style」行） | `rootPropsTest.tsx` |
| `domContractTest` | 与 React 基线比对结构化 DOM 契约 | 新增（本项目独有） |
| `themeTest` | light / dark / compact / token override 四态渲染 | 新增 |
| `resetWarned` | 重置 warning 计数，便于断言 | `excludeWarning.ts` |
| `waitFrames` | 确定性等待动画帧 | — |

**规则 T14**：任何被 `mountTest` 覆盖的组件，测试文件里只需一行调用；但**不允许**用 `mountTest` 替代行为测试。

---

## 8. Compatibility Harness（`tests/compat/`）—— 项目核心机制

**目的**：用**同一份 fixture** 驱动两个实现，自动比对差异。这是"持续兼容 Ant Design"的长期保障。

### 8.1 Fixture 格式

```jsonc
{
  "$schema": "../schema.json",
  "component": "Button",
  "antdVersion": "6.6.4",
  "id": "button/basic",
  "props": { "type": "primary", "size": "large", "loading": false },
  "content": "Submit",
  "theme": { "algorithm": "default" },
  "interactions": [
    { "type": "hover" },
    { "type": "focus" },
    { "type": "click" },
    { "type": "keyboard", "key": "Enter" }
  ],
  "assertions": {
    "api": true,        // 比对 props 解析结果与最终 DOM 属性
    "dom": true,        // 比对结构化 DOM 契约
    "aria": true,       // 比对 role / aria-*
    "behavior": true,   // 比对事件触发序列与 emit 参数
    "screenshot": true  // 比对像素
  },
  "allow": {
    "dom":   ["class"],        // 允许不同的字段
    "aria":  [],
    "behavior": ["eventOrder"] // 允许的顺序差异
  }
}
```

### 8.2 运行方式

```bash
pnpm run test:compat:baseline -- --component button   # 用 antd 生成参考基线
pnpm run test:compat          -- --component button   # 用 Vue 实现跑同一 fixture 并比对
pnpm run test:compat          -- --all                # 全量
```

**实现要点**：
- **React 侧**：`@testing-library/react` + `antd`（**仅测试环境依赖，绝不进入产物**）
- **Vue 侧**：`@vue/test-utils` + `@apollo-design/ui`
- **DOM 契约**：两侧都把 DOM 归一化为「标签 + 类名（去 prefixCls 差异） + data-* + role/aria-*」的结构化 JSON，再比对
- **行为**：两侧都监听事件，记录「事件名 + 参数摘要」序列，再比对
- **截图**：见 §9

### 8.3 差异报告

输出到 `tests/compat/report/<component>.md`：

```markdown
| Fixture | Layer | React | Vue | 判定 |
|---|---|---|---|---|
| button/basic | DOM | `button.apollo-btn` | `button.apollo-btn` | ✅ |
| button/basic | ARIA | `aria-disabled=false` | (缺失) | ❌ BUG |
```

**规则 T15**：报告中的每个 ❌ 必须被处理（修实现 / 登记差异），不允许留待"以后再说"。

**规则 T16**：`allow` 白名单必须写明理由。禁止无理由批量加白。

---

## 9. L6 · Visual Regression

### 9.1 截图矩阵

每个组件按特性选择状态，**最低要求**：

| 必选 | default / hover / active / focus / disabled / loading / dark / compact |
|---|---|
| 按组件追加 | `open` / `selected` / `checked` / `error` / `warning` / `success` / `expanded` / `dragging` / `empty` / `readonly` |

**尺寸要求**：每个状态至少覆盖 3 个 viewport：`375×667`（mobile）/ `768×1024`（tablet）/ `1440×900`（desktop）。

### 9.2 对比机制

```
┌──────────────────────────┐        ┌──────────────────────────┐
│ React 参考（antd 6.6.4）  │        │ Vue 实现（@apollo-design）│
│ 渲染同一 fixture          │        │ 渲染同一 fixture          │
└───────────┬──────────────┘        └───────────┬──────────────┘
            │ Playwright 截图                   │
            ▼                                   ▼
     react/<id>.png                       vue/<id>.png
            └───────────────┬───────────────────┘
                            ▼
              pixelmatch + sharp 对齐尺寸后逐像素比对
                            ▼
                   差异率 + diff 图 + HTML 报告
```

**技术选型**：Playwright 截图 → `sharp` 归一化尺寸 → `pixelmatch` 逐像素比对 → 生成 HTML 报告。

**稳定性要求**（必须全部满足，否则视觉测试会成为噪声源）：
- 禁用动画（注入 `prefers-reduced-motion` + 关闭 motion 开关）
- 固定字体（打包测试字体，避免系统字体差异）
- 固定 viewport、devicePixelRatio、时区、locale
- 禁用光标闪烁（隐藏 caret）
- 固定随机 ID / 时间戳（通过注入固定 seed）
- 组件截图前 `await waitForFonts()` + 等待一帧

### 9.3 阈值策略

| 差异率 | 判定 |
|---|---|
| 0% | ✅ 通过 |
| ≤ 0.1% 且差异为抗锯齿噪声（分布分散、单像素） | ✅ 通过（自动） |
| > 0.1% 或差异成块 | ❌ 必须人工确认并分类 |

**规则 T17**：**禁止**为了提高阈值让测试通过。阈值只能因技术原因（如新增平台抗锯齿差异）由用户批准后调整。

---

## 10. L7 · Build Test

| 检查项 | 方法 | 失败含义 |
|---|---|---|
| 全包构建成功 | `pnpm -r build` | — |
| `exports` / `types` 正确 | `publint` | 消费者无法正确解析包 |
| **产物无 React 依赖** | 扫描 `es/` `dist/` 是否出现 `react` / `react-dom` / `@rc-component` / `@ant-design/cssinjs` | 违反 H1 / H5 / H6 |
| **产物无 CSS-in-JS 运行时** | 扫描是否存在运行时样式注入代码 | 违反零运行时架构 |
| 零运行时 CSS 存在 | 校验 `css/base.css` 与各组件 CSS 产物存在且非空 | 无 JS 时样式丢失 |
| tree-shaking 有效 | 按需引入单组件后产物体积 ≤ 预算 | 引入即全量 |
| 默认主题可用 | 无 JS 环境下仅引入 CSS 渲染正确 | 主题变量未静态化 |
| SSR 兼容 | `renderToString` 无 `window`/`document` 访问报错 | 无法 SSR |
| Node 版本兼容 | 在 Node 22 下构建与运行 | — |

**规则 T18**：产物依赖扫描是**硬 Gate**。一旦发现 React 痕迹，立即停止并修复，不得提交。

---

## 11. 覆盖率策略

| 范围 | 语句 | 分支 | 函数 |
|---|---|---|---|
| 组件主实现 | ≥ 90% | ≥ 85% | ≥ 90% |
| foundation 包（utils/theme/motion/portal/trigger） | ≥ 95% | ≥ 90% | ≥ 95% |
| 状态机关键路径 | **100%** | 100% | — |
| Token 计算 | 100% | 100% | — |

**规则 T19**：覆盖率是**下限**而非目标。禁止写"为了覆盖率"的无意义断言。覆盖率达标但行为未覆盖，仍视为不合格。

---

## 12. 反模式清单（禁止出现）

| # | 反模式 | 为什么禁止 |
|---|---|---|
| A1 | 只断言 `expect(wrapper.exists()).toBe(true)` | 没测任何行为 |
| A2 | 直接调用内部方法而非模拟用户操作 | 测的是实现不是行为 |
| A3 | `await sleep(n)` 等待 | 不确定、慢、易 flaky |
| A4 | 修改测试预期让红灯变绿 | 违反 H7 |
| A5 | 无理由 `skip` / `todo` 测试 | 掩盖问题 |
| A6 | 批量给视觉差异加白名单 | 违反 T17 |
| A7 | 用完整 DOM 快照替代契约测试 | 噪声大、无契约价值 |
| A8 | 只测 happy path | 边界才是 bug 所在 |
| A9 | 在组件测试中 import `antd` | 违反 H1（唯一例外是 `tests/compat/`） |
| A10 | 用 `any` 绕过类型测试 | 违反 H10 |
