# Apollo Design · 技术架构

## 定位与原则

独立的 Vue 3 + TypeScript 组件库，以公开契约、真实使用场景和一致的设计语言演进。现有 API 和视觉不会仅为制造差异而改变；不要求与任何上游组件、Token、DOM 或版本同构。

## 包与依赖方向

| 层 | 包 | 职责 |
|---|---|---|
| L0 | utils、theme、icons | 通用工具、设计令牌与主题、图标 |
| L1 | motion、portal、position、a11y、virtual-list | 动效、传送与容器、定位、焦点与键盘、虚拟化 |
| L2 | overlay、locale、form-core、picker | 浮层编排、本地化、表单状态、日期时间引擎 |
| L3 | ui | 有视觉语义的公共组件与内部组合 |
| 开发工具 | test-utils、docs | 测试辅助、文档站，不进入发布运行时依赖图 |

运行时依赖只能指向更低层；同层如有必要依赖必须说明职责并验证无环。具体依赖以 package.json、源码导入和 Registry 的实际图为准。类型引用与运行时引用应区分。禁止基础包反向引用 UI。

通用焦点原语、焦点陷阱和对话框层级管理由 utils/a11y 提供。Portal 在搬迁自己已挂载的 DOM 时保持所属编辑器的焦点、选择和状态；Overlay 在实际接受关闭且焦点仍属于自身浮层时归还触发元素。受控拒绝关闭、外部控件和非活动文档的焦点保持其当前归属。

多组件共享是提取包的信号，不是唯一标准。独立职责、生命周期、测试成本、API 稳定性和打包边界也需评估；默认先在组件内部共置，避免提前抽象。不要照搬上游拆包结构。

第三方依赖按框架耦合、体积、维护、安全、许可与 SSR 适用性评估。当前发布图保持零 React、零 antd/rc 运行时引擎、零运行时 CSS-in-JS。上游算法 Oracle、图标/locale 数据生成器和参考渲染器只可在开发依赖中使用。是否新增纯算法依赖须有独立 ADR 与产物验证，不能凭包名前缀自动许可或否决。

## Vue Native

优先 SFC；复杂数据渲染可用 Vue 的 `h()` / TSX。共享状态通过 composable 与类型化 InjectionKey 表达，实例状态不得成为模块单例。不得在 setup 中冻结动态 props，也不得在 computed 中缓存动态插槽的存在性。SSR、卸载清理、受控更新、Teleport 容器切换是组件契约的一部分。

## Zero Runtime 样式与主题

组件样式在构建期生成静态 CSS，运行时消费 `--apollo-*` 变量。Seed → Map → Alias → Component 是主题派生模型；名称、数量和默认值由 Apollo API 决定。Token 的公开类型及 `packages/theme/src` 是实现来源，Registry 是清单，不以旧上游统计作为新增 Token 的限制。

Zero Runtime 不等于零 JavaScript：令牌派生、变量作用域写入和动态几何仍是运行时能力。保持静态样式与动态变量命名一致；组件视觉值走令牌，纯几何常数或装饰素材例外需说明用途。默认、暗色、紧凑、嵌套作用域、SSR/水合与禁用状态必须有适用覆盖。

根样式使用 Vue `class` / `style`；内部语义区域使用现有 `classNames` / `styles`。`prefixCls` 改变 DOM 命名，但不会在运行时生成对应选择器；自定义前缀的 CSS 策略见兼容政策。

## 产物契约

包的 `dist/` 是发布入口；ESM、`.d.ts`、exports 子路径和 CSS sideEffects 必须一致。全局样式先加载 `@apollo-design/theme/tokens.css`，再加载 `@apollo-design/ui/style.css`，按需 CSS 走各包声明的 exports。

构建不得依赖 `/tmp/antd-*` 等个人缓存。正常生成 Registry 与文档不读取上游安装产物。来源素材生成器是显式维护命令，更新时审查许可、数据和产物差异。

产物必须通过 `test:build` 的 exports、类型、依赖扫描和体积检查，以及消费端验证。任何预算未定、SSR 风险或未覆盖环境必须记录，不借独立化降低既有阈值。

## 决策与历史

[ADR 0005](docs/adr/0005-independent-apollo-contracts.md) 说明本次治理迁移。ADR 0001 的静态 CSS、0002 的克制拆包、0003 的依赖分类、0004 的运行时隔离仍保留其有价值原则；上游同构和绝对消费者数限制由 0005 取代。旧 PoC、版权来源和算法差分证据继续可追溯。
