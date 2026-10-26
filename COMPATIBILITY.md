# Apollo Design · 兼容与迁移政策

## 兼容对象

Apollo 对自身公开 API、文档化行为、类型、语义样式接口和实际用户负责。Ant Design 不是唯一规格，不绑定 Apollo 的发布版本，也不要求组件/API/Token/DOM 数量相同。默认保留已有合理行为与视觉。

## 保留的边界

- 已有组件导出、props、事件 payload、`v-model` 名称、expose、令牌和样式入口默认保持兼容；开发阶段模板扩展 API 按 ADR 0006 直接迁移；为保留 React 回调/DOM 形态而妨碍 Vue 公共用法的行为按 ADR 0007 直接修正。
- 根节点使用 Vue `class` / `style`；先前已经完成的根别名迁移不回滚。非根 `classNames.*` / `styles.*` 和现存 deprecated alias 保留各组件已文档化行为。
- 同名 ConfigProvider 配置字段、数据项字段和组件 attrs 不等同，不因名称类似 React 而删除。
- 现有 VNode 数据和命令式服务按职责保留。组件顶层内容渲染函数 prop 直接替换为具名/作用域插槽，不保留函数兼容层或弃用期（用户裁决、ADR 0006）；逐组件同步实现、类型、调用者、文档与测试。数据项渲染字段另行按实际契约评估。迁移不得破坏数字动画、缓存或业务 payload。
- `prefixCls` 的 DOM 响应性需要保证，但现有静态 CSS 不自动支持任意前缀。完整前缀样式策略继续追踪 KNOWN-ISSUES 的 D04。
- `middle` 等既有值、子组件别名和已验收视觉不为独立化重新命名。

## 变更分类与迁移

错误实现 → 用场景与契约证明后修复；有意设计改变 → 记录理由、影响、类型、示例和回归；环境差异 → 记录平台与复现条件；上游差异 → 可作参考，不自动构成缺陷或豁免。

破坏性公共 API 必须单独记录：旧/新写法、受影响版本、替代方案、弃用期、运行时及类型兼容层、移除条件、验证命令。当前 `0.0.0` 未发布开发阶段，用户已授权模板扩展 API 直接迁移；这类变更记录旧/新写法与测试证据，兼容层和弃用期明确为无，无需逐组件重复申请批准。用户另已授权按 ADR 0007 直接修正牺牲 Vue 公共用法的 React 回调/DOM 兼容：不保留错误载荷或树形态的兼容层/弃用期；逐组件记录影响与验证。其他破坏性变更仍单独评审。

Vue 公共语义与 React 回调/DOM 冲突的直接修正规则见 [ADR 0007](docs/adr/0007-vue-public-contracts-over-react-shapes.md)。已批准的模板扩展迁移见 [ADR 0006](docs/adr/0006-development-template-slots.md)，Transfer 首批变化见 [迁移记录](docs/migrations/transfer-slots.md)。Alert / Collapse 已有内容插槽的优先级调整另见 [行为迁移记录](docs/migrations/content-slot-precedence.md)。List 的 `renderItem` → 泛型 `#item`、内容插槽及废弃告警调整见 [List 迁移记录](docs/migrations/list-slots.md)。其他待评估事项见 [独立化记录](docs/migrations/independence.md)，未裁决事项不算已批准。

## 上游参考与历史回归

List 当前配置、稳定内容结构、嵌套样式与分页修正，以及共享 `RenderEmptyHandler` 类型收窄，集中见 [List 契约迁移](docs/migrations/list-contracts.md)。

`tests/compat`、Oracle 与 `tests/visual/baselines/react` 保留来源版本以便复现；版本固定只约束这组参考实验。上游对照默认不决定新组件完成或发布验收。现有 DOM 回归测试仍执行，必要差异必须根据 Apollo 契约审查，不允许无依据放宽。

## 9. 历史差异登记

`image-optional-alt-accessible-name`：Image省略alt时，实际img使用空替代文本；预览触发器使用“Preview image”，弹层使用“Image preview”作为通用名称，避免公开可选prop产生无名称控件。旧React对照缺少触发器名称的5个场景保留，精确断言仅此差异，并以Apollo原生回归及实际浏览器axe验证。集中迁移与当前验证边界见 [Image契约修正](docs/migrations/image-contracts.md)。

原 D 编号及逐组件迁移证据完整保存在 [2026-10 历史兼容记录](docs/history/compatibility-2026-10.md)。旧链接/脚本引用该表时按历史记录解释；其中的 Phase、逐字同构和强制对拍要求已被本文取代。不要删除已有问题复现或第三方来源说明。
