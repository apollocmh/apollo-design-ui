# tests/compat — React / Vue 双实现兼容性测试

> 本目录是 `@apollo-design/ui` **持续兼容 Ant Design** 的核心机制。
>
> 一份 fixture 同时驱动两个实现，自动比对五个层面。没有这套机制，兼容性只能靠人肉眼看，且随组件数量增长必然失守。

---

## 1. 为什么需要它

Ant Design 的组件行为规格**不在文档里**，而在它的源码与测试里。文档滞后、省略边界、不写清状态机。

把 antd 当作「兼容性规格」意味着：**规格必须是可执行的**。否则「兼容」就退化成主观判断。

因此我们建立一条单向流水线：

```
        一份 fixture (JSON)
               │
      ┌────────┴────────┐
      ▼                 ▼
 React 参考实现     Vue 实现
 (antd 6.6.4)      (@apollo-design/ui)
      │                 │
      ▼                 ▼
  归一化快照          归一化快照
 (DOM/ARIA/事件/像素)  (DOM/ARIA/事件/像素)
      └────────┬────────┘
               ▼
          逐层比对 → 差异报告
               ▼
     修实现 / 登记差异 / 加入白名单(需理由)
```

**关键点**：fixture 是**唯一事实来源**。两侧都不允许在 fixture 之外偷偷加断言或加例外。

---

## 2. 目录结构

```
tests/compat/
├── README.md                # 本文件
├── schema.json              # fixture 的 JSON Schema（权威格式定义）
├── fixtures/
│   └── <component>/
│       ├── basic.json
│       ├── loading.json
│       └── ...
├── baselines/               # 由 `baseline` 命令生成，不手写
│   └── <component>/
│       ├── <id>.dom.json    # 结构化 DOM 契约
│       ├── <id>.aria.json   # role / aria-* 快照
│       ├── <id>.events.json # 事件序列
│       └── <id>.png         # React 参考截图
├── report/                  # 差异报告（生成物）
│   └── <component>.md
├── runner/
│   ├── index.mjs            # 入口：读 fixture → 跑两侧 → 比对 → 出报告
│   ├── normalize.mjs        # DOM 归一化（去 prefixCls 差异、去 hash 类名）
│   ├── drivers/
│   │   ├── react.mjs        # React 侧 driver（@testing-library/react + antd）
│   │   └── vue.mjs          # Vue 侧 driver（@vue/test-utils + @apollo-design/ui）
│   └── compare.mjs          # 各层比对器
└── package.json             # private workspace package
```

---

## 3. Fixture 格式

完整格式定义见 [`schema.json`](./schema.json)。最小示例：

```json
{
  "$schema": "../schema.json",
  "id": "button/basic",
  "component": "button",
  "description": "最基础的 Button：默认 type、默认 size、有文字。",
  "antdVersion": "6.6.4",
  "props": { "type": "default" },
  "content": "Button",
  "assertions": { "api": true, "dom": true, "aria": true, "behavior": true, "screenshot": true }
}
```

### 3.1 五个比对层

| 层 | 字段 | 比对什么 |
|---|---|---|
| L1 API | `assertions.api` | props 最终落到 DOM 上的效果（class / `data-*` / 原生属性） |
| L2 Behavior | `assertions.behavior` | 交互过程中触发的事件序列与参数摘要 |
| L3 DOM | `assertions.dom` | 结构化 DOM 契约（标签 + 类名 + `data-*` + `role`/`aria-*`） |
| L4 Visual | `assertions.screenshot` | 像素截图 |
| L5 A11y | `assertions.aria` | `role` 与全部 `aria-*` |

### 3.2 交互指令

`interactions` 使用**语义化指令**，由两侧 driver 各自翻译成具体 API：

```json
"interactions": [
  { "type": "hover" },
  { "type": "focus" },
  { "type": "keyboard", "key": "Enter" },
  { "type": "click", "target": "icon" }
]
```

`target` 可以是 CSS 选择器，也可以是语义目标：`root` / `icon` / `input` / `trigger` / `popup`。

**为什么用语义指令而不是具体 API**：React 的 `fireEvent` 与 Vue Test Utils 的 `trigger` 语义不完全一致。若 fixture 写具体 API，就会偏向某一侧实现，失去「中立规格」的意义。

### 3.3 矩阵展开

`variants` 做笛卡尔积展开，把 `type × size` 这类矩阵压缩成一次比对：

```json
{
  "props": {},
  "variants": {
    "type": ["primary", "default", "dashed", "text", "link"],
    "size": ["small", "middle", "large"]
  }
}
```

展开后按网格排列，在同一张截图内比对。

### 3.4 白名单

```json
"allow": {
  "dom": ["class"],
  "reason": "Vue 侧无 CSS-in-JS hash 类名（架构差异）",
  "deviationId": "D5"
}
```

**规则**：
- `allow` 必须同时提供 `reason` 与 `deviationId`（对应 `COMPATIBILITY.md` §9 的差异登记）
- `deviationId` 指向的差异必须真实存在
- 无 `reason` 的 `allow` 会让 CI 失败
- **禁止**批量加白来「通过」验收（`AGENTS.md` H7/H8）

---

## 4. DOM 归一化（关键实现细节）

两侧的 DOM 不可能逐字相同（`prefixCls` 不同、Vue 无 hash 类名、属性顺序不同）。因此比对前必须归一化：

| 归一化步骤 | 原因 |
|---|---|
| 类名去 `prefixCls` 前缀（`ant-btn` / `apollo-btn` → `btn`） | 两侧默认 prefixCls 不同（`ant` vs `apollo`） |
| 移除 hash 类名（形如 `css-xxxx`） | 我们无 CSS-in-JS |
| 属性排序 | 属性顺序无语义 |
| 忽略 `style` 中的具体值，只保留 `style` 属性存在性 | 零运行时架构下 style 值表达方式不同（CSS 变量） |
| 忽略 `id` / 自动生成的 `aria-*` 引用 | 随机 ID 不可比；改为比对**引用关系是否自洽** |
| 保留标签、类名、`data-*`、`role`、`aria-*` | 这些是真正的对外契约 |

**归一化必须对称**：任何只作用于单侧的归一化都是作弊。归一化规则写在 `runner/normalize.mjs`，并有单测覆盖。

---

## 5. 命令

```bash
# 用 antd 生成/更新参考基线（React 侧）
pnpm run test:compat:baseline -- --component button
pnpm run test:compat:baseline -- --all

# 用 Vue 实现跑同一批 fixture 并与基线比对
pnpm run test:compat -- --component button
pnpm run test:compat -- --all

# 只跑指定层
pnpm run test:compat -- --component button --layers dom,aria

# 查看差异报告
pnpm run test:compat -- --component button --report
```

---

## 6. 差异报告格式

输出到 `report/<component>.md`：

```markdown
# button 兼容性比对报告

antd 6.6.4 vs @apollo-design/ui · 2026-09-15

| Fixture | Layer | React | Vue | 判定 |
| --- | --- | --- | --- | --- |
| button/basic | DOM | `button.apollo-btn` | `button.apollo-btn` | ✅ |
| button/basic | ARIA | `aria-disabled=false` | (缺失) | ❌ BUG |
| button/loading | Behavior | `click` 未触发 | `click` 未触发 | ✅ |
| button/loading | Screenshot | — | — | ⚠️ 0.23% 差异，待人工确认 |

## 汇总
- 通过 12 / 16
- ❌ BUG 1（必须修复）
- ⚠️ 待人工确认 1
- 🟡 已登记差异 2（D5、D6）
```

**规则**：报告中的每个 ❌ 都必须被处理（修实现 / 登记差异），不允许留待「以后再说」。

---

## 7. 与 React 的隔离（重要）

React 与 antd **只允许出现在 `baseline/*.mjs` 及其依赖中**（Phase 1 设想的 `runner/drivers/react.mjs` 未被采用，见 §8.1）。
`registry/tools/gen-empty-artwork.mjs` 是同类取数脚本（它渲染 antd 的插画来生成数据），归在同一条规则下。

- 这两个包是本 workspace 的 `devDependencies`，**绝不允许**进入 `packages/**` 的依赖
- `registry/tools/validate-registry.mjs` 的 E11 检查会扫描全部构建产物，发现 `react` / `@rc-component` / `@ant-design/cssinjs` 即失败
- 组件测试（`packages/*/tests/`）中 import `antd` 是明确禁止的（`TESTING.md` 反模式 A9），唯一例外是本目录

---

## 8. 当前状态

### 8.1 实际落地的形态（2026-09-17，随 icons / empty 落地）

Phase 1 设想的「`runner/drivers/react.mjs` + `drivers/vue.mjs` 双运行时进程」**没有采用**。
实际落地的是更简单也更强的一条路，图标（848 个）与 Empty 都用它：

| 环节 | 落点 |
|---|---|
| React 侧取数 | `baseline/<component>.mjs` —— 用 `renderToStaticMarkup` 在 Node 里渲染一次，把**原始 HTML** 落盘成 `baselines/<component>.dom.json` |
| 基线生成/校验 | `node tests/compat/runner/index.mjs [--baseline] [--component <name>]` |
| 归一化 | `@apollo-design/test-utils` 的 `parseFragment → projectElement`（**两侧同一条流水线**） |
| 比对 | 各组件的 `__tests__/semantic.test.ts` 调 `domContractTest`，跑在 vitest 的 `dom-contract` project |

为什么这样更好：

- 基线是**纯数据**，能进 git、能在 diff 里逐字看 —— §1「规格可执行」的要求由此满足；
- 比对跑在 vitest 里，于是有 `expect`、按用例名定位失败、能被 CI 分层跑；
- 不需要一个常驻的双运行时进程，也不需要「把 React 与 Vue 挂到同一棵树」这种脆弱做法。

代价：基线**不会**自动跟着 antd 版本更新 —— 所以 `runner/index.mjs` 的存在意义就是
把「重新生成」与「校验是否过期」变成一条命令。

### 8.2 各组件状态

| 组件 | 基线 | 用例数 | 比对落点 |
|---|---|---|---|
| `icons` | ✅ | 36（848 个图标） | `packages/icons/src/__tests__/semantic.test.ts` |
| `empty` | ✅ | 32 | `packages/ui/src/empty/__tests__/semantic.test.ts` |

### 8.3 仍然待办

| 项 | 状态 |
|---|---|
| `fixtures/*.json` 那套「手写用例 + `allow`」机制 | 未被 icons / empty 采用（机械 oracle 覆盖得更全）。保留设计，等出现「无法用 antd 产物表达」的用例再用 |
| 报告生成（§6 的 `report/`） | ⬜ 未实现 —— 失败信息由 vitest 直接给出，够用 |

**规则不变**：报告中的每个 ❌ 都必须被处理（修实现 / 登记差异），不允许留待「以后再说」。

