# ADR 0002：包边界的唯一判据是「消费者数量 ≥ 2」

- **状态**：已接受
- **日期**：2026-09-15
- **相关**：`ARCHITECTURE.md` §2、`AGENTS.md` H11

---

## 背景

Ant Design 把内部引擎拆成了 **37 个 `@rc-component/*` 包**。直觉上，"Ant Design 怎么拆我们就怎么拆"是最省事的选择。

但分析实际依赖后发现，这个拆分方式**不能直接照搬**：

| rc 包 | 消费者数量 | 性质 |
|---|---|---|
| `@rc-component/util` | **61** | 真地基 |
| `@rc-component/motion` | 12 | 基础设施 |
| `@rc-component/trigger` | 3（实际服务全部浮层） | 基础设施 |
| `@rc-component/picker` | 3 | 领域引擎 |
| `@rc-component/select` | 3 | 但三者共享的其实是 trigger + virtual-list |
| `@rc-component/table` | **1** | 纯单组件引擎 |
| `@rc-component/tree` | 1（+tree-select 可复用 tree） | 单组件引擎 |
| `@rc-component/menu` | 2（menu + dropdown） | 但 dropdown 复用 menu 是层次关系 |
| `@rc-component/collapse` | **1** | 单组件引擎 |
| `@rc-component/slider` | 2（slider + color-picker） | |
| `@rc-component/switch` | **1** | 单组件引擎 |
| `@rc-component/rate` | **1** | 单组件引擎 |
| `@rc-component/upload` | **1** | 单组件引擎 |
| `@rc-component/progress` | 1 | 单组件引擎 |
| `@rc-component/listy` | **1** | 单组件引擎 |
| `@rc-component/image` | **1** | 单组件引擎 |
| `@rc-component/mentions` | **1** | 单组件引擎 |
| `@rc-component/input-number` | **1** | 单组件引擎 |
| `@rc-component/segmented` | **1** | 单组件引擎 |
| `@rc-component/drawer` | 1（modal 复用其能力） | |
| `@rc-component/tour` | **1** | 单组件引擎 |

**Ant Design 之所以拆得这么细，有它自己的历史原因**：这些包最初是独立的开源项目（`rc-*` 系列），被 antd 以依赖方式引入；它们同时服务于 antd 之外的消费者。这是"既成事实"，不是"最佳设计"。

我们是从零开始，没有这个历史包袱。

## 决策

> **一个能力只有在同时满足以下两个条件时，才升级为 `@apollo-design/xxx` 独立包：**
>
> 1. **消费者数量 ≥ 2**（≥2 个上层组件需要它）
> 2. **不绑定任何具体组件的视觉语义**（无颜色/圆角/阴影/尺寸定义，不产出 CSS）
>
> 否则它作为 `packages/ui/src/<component>/engine/` 内部模块存在，**等第二个消费者出现时再提取**。

## 结果

### 独立成包（10 个）

| 包 | 消费者 | 为什么够格 |
|---|---|---|
| `utils` | 全部 72 个组件 | 条件 1 极度满足 |
| `theme` | 全部 72 个组件 | 同上 |
| `icons` | 绝大多数组件 | 同上 |
| `motion` | 12 | 满足 |
| `portal` | Modal/Drawer/message/notification/image/tour/float-button/Tooltip 系 | 满足 |
| `trigger` | Tooltip/Popover/Popconfirm/Dropdown/Select/AutoComplete/Cascader/TreeSelect/Mentions/ColorPicker/Slider/Rate/Segmented/Steps/Progress/Tour/Menu/DatePicker 系 | 满足 |
| `virtual-list` | Select/Tree/Table/Cascader/TreeSelect/Transfer/Mentions/AutoComplete | 满足 |
| `form-core` | Form + 12 个消费其 context 的组件 | 满足 |
| `picker` | DatePicker/RangePicker/TimePicker/Calendar | 满足 |
| `test-utils` | 全部组件的测试 | 满足（测试基础设施，private） |

### 留在 `ui` 内部（27 个 rc 包的能力）

`select` / `table` / `tree` / `menu` / `tabs` / `steps` / `collapse` / `cascader` / `tree-select` / `checkbox` / `input` / `input-number` / `slider` / `switch` / `rate` / `segmented` / `pagination` / `upload` / `mentions` / `dropdown` / `dialog` / `drawer` / `notification` / `image` / `color-picker` / `progress` / `listy` / `tour`

**这是有意的决定，不是遗漏。** 判据写在 `ARCHITECTURE.md` §2，且 `registry/dependencies.json` 中每一条都记录了 `strategy: 'in-ui'` 与理由。

## 理由

1. **独立包的收益是"可被第三方复用"，成本是"版本管理 + 跨包调试 + 发布流程"**
   如果只有一个消费者，"可复用"是伪收益，成本却是真实的。`@rc-component/collapse` 存在的理由从来不是 antd 需要它，而是它自己是一个独立项目。

2. **单一消费者时，独立包会让重构成本成倍增加**
   改 Collapse 的展开逻辑要同时动两个仓库/两个包、跑两次构建、处理版本对齐。留在 `ui` 内只是一次重构。

3. **"等第二个消费者出现再提取"是低成本决策**
   从 `ui/src/x/engine/` 提取为独立包是一次机械的搬移（接口已经清晰）。反过来（先拆后并）则要处理版本与依赖的清理。

4. **依赖边界仍然可控**
   即使留在 `ui` 内，我们也通过"叶子模块 + `_internal/`"的规则控制内部耦合（见 ADR 0003 与 `ARCHITECTURE.md` §8.4），不会变成一坨。

## 后果

### 正面

- 包数量从 antd 的 37 个降到 10 个，管理成本大幅下降
- `packages/ui` 内部可以自由重构引擎，不受包版本约束
- 依赖图更简单（10 个包的 DAG 一目了然）

### 负面与代价

| 代价 | 缓解 |
|---|---|
| `packages/ui` 体量较大，构建时间较长 | 按组件拆分构建入口（`es/<component>`），增量构建 |
| 无法从外部单独安装某个引擎 | 目前无此需求；若出现，按判据提取 |
| 需要自律地维护 `engine/` 的接口边界 | `COMPONENT-RULES.md` 规定 `engine/` 只对外暴露接口；`validate-registry.mjs` 检查分层规则 |

### 需要重新评估的情形

以下情况出现时，应重新评估并可能提取独立包：

- `Table` 的引擎被第二个组件需要（如 ProTable、可编辑表格、虚拟表格）
- `Tree` 的引擎被 antd 之外的场景需要
- 项目引入多包发布策略（如把 `ui` 拆成 `ui-core` + `ui-pro`）
- 出现「某个引擎的独立版本演进需求」（如 picker 要支持非 dayjs 的日期库）

## 备选方案为何被否决

- **照搬 antd 的 37 个包**：把 antd 的历史包袱继承过来，增加 27 个只有一个消费者的包
- **全部内聚到 `ui`，不拆任何包**：`utils`/`theme`/`motion`/`trigger`/`portal` 被大量组件依赖，不拆会导致 `ui` 内部形成难以管理的中心化依赖，且无法单独测试与演进
- **按"代码量"拆分**：代码量不反映复用价值。`table` 引擎代码量最大但只有 1 个消费者

## 待验证

- [ ] `ui` 的构建时间是否可接受（若不可接受，考虑拆分 `table` 引擎）
- [ ] `virtual-list` 的接口契约是否能同时满足 Select / Tree / Table 三种差异较大的需求
