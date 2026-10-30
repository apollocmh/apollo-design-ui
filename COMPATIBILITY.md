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

Typography 的固定标签类型、Link 原生操作树、编辑/复制/测量、有效 Token 和关联 Table 主题变量修正见 [Typography 契约迁移](docs/migrations/typography-contracts.md)。

Badge / Ribbon 的原生根 style/ref、完整 text 内容/槽、当前配置与九 Token、数字/偏移及可读前景修正见 [Badge 契约迁移](docs/migrations/badge-contracts.md)；直接修正开发期错误落点，原二十六场景和参考证据保留。

## 上游参考与历史回归

List 当前配置、稳定内容结构、嵌套样式与分页修正，以及共享 `RenderEmptyHandler` 类型收窄，集中见 [List 契约迁移](docs/migrations/list-contracts.md)。

共享reset的原生控件颜色配对修正见 [颜色迁移](docs/migrations/native-control-colors.md)。Spin全屏模式保留正文文档流，root为内容外壳，mask为实际覆盖层；相关落点变更与验证也见List契约迁移。

Spin的完整Vue内容、显式indicator scope、稳定section/indicator、SSR确定进度（含0）与4个有效Token集中见 [Spin契约迁移](docs/migrations/spin-contracts.md)。这按ADR0007直接修正旧DOM/首帧形态，不恢复已移除indicator prop或增加兼容通道。

QRCode的statusRender直接替换为#status、稳定refresh事件操作、根/图像样式拥有关系、默认白色宿主与可访问名称、当前遮罩Token和语言，集中见 [QRCode契约迁移](docs/migrations/qrcode-contracts.md)。原编码引擎与合法输入的矩阵/路径保留。

`tests/compat`、Oracle 与 `tests/visual/baselines/react` 保留来源版本以便复现；版本固定只约束这组参考实验。上游对照默认不决定新组件完成或发布验收。现有 DOM 回归测试仍执行，必要差异必须根据 Apollo 契约审查，不允许无依据放宽。

## 9. 历史差异登记

`image-optional-alt-accessible-name`：Image省略alt时，实际img使用空替代文本；预览触发器使用“Preview image”，弹层使用“Image preview”作为通用名称，避免公开可选prop产生无名称控件。旧React对照缺少触发器名称的5个场景保留，精确断言仅此差异，并以Apollo原生回归及实际浏览器axe验证。集中迁移与当前验证边界见 [Image契约修正](docs/migrations/image-contracts.md)。

原 D 编号及逐组件迁移证据完整保存在 [2026-10 历史兼容记录](docs/history/compatibility-2026-10.md)。旧链接/脚本引用该表时按历史记录解释；其中的 Phase、逐字同构和强制对拍要求已被本文取代。不要删除已有问题复现或第三方来源说明。

Statistic/Timer/Countdown的原生#value业务作用域、当前计时方向/非负事件、SSR/清理、attrs/ref及两字号Token修正集中见[Statistic契约迁移](docs/migrations/statistic-contracts.md)；不新增旧内容函数兼容层。

Skeleton及五个子组件的原生根attrs/style、嵌套块配置、Image默认槽、当前八Token和装饰占位语义修正集中见[Skeleton契约迁移](docs/migrations/skeleton-contracts.md)；直接修正开发期错误形态，不新增兼容通道。

Result全部状态的完整图标槽/默认图形开关、条件内容、原生根attrs/style、当前Provider/四Token和装饰语义修正集中见[Result契约迁移](docs/migrations/result-contracts.md)；开发期直接修正，不为旧React图形分支增加兼容通道。

Button完整内容宿主、独立color/variant、加载请求与指示器分离、当前Provider/58 Token及合法发布工具入口修正见[Button契约迁移](docs/migrations/button-contracts.md)；内部Search/Dropdown/FloatButton链路同步调整。

Empty 的完整 image/description/footer 内容、当前 Provider/语言、自然布局、空宿主及默认文字对比度修正见 [Empty 契约迁移](docs/migrations/empty-contracts.md)；保留插画几何与原始参考证据。

Tag / CheckableTag / CheckableTagGroup 的完整内容、所属原生关闭按钮/链接、Vue 事件和强类型模型、当前 Provider/三个 Token 与两套真实语义，集中见 [Tag 契约迁移](docs/migrations/tag-contracts.md)；原始参考矩阵保留，开发期直接修正错误 DOM/回调形态。

Avatar / AvatarGroup 的原生事件与同步取消钩子、完整内容槽、当前尺寸/Token、业务key和溢出按钮，集中见 [Avatar契约迁移](docs/migrations/avatar-contracts.md)；直接移除四个分组旧别名，保留原始参考证据。

### D-typography-native-controls

开发阶段按 ADR0007 直接修正 Link 的 span/a 所属结构、text 编辑键盘入口与原生按钮内装饰图标语义。原 76 场景、参考 HTML 与参考 PNG 不变；19 个场景的精确差异存于 Typography contract-differences.ts，任何额外差异继续失败。详情与迁移见 Typography 契约迁移。

Descriptions 的稳定原生描述项、当前配置/十Token、所属attrs与label槽修正见[Descriptions契约迁移](docs/migrations/descriptions-contracts.md)。Timeline 的原生根事件、实际ref、完整标量内容、当前六Token与显式方向见[Timeline契约迁移](docs/migrations/timeline-contracts.md)。Breadcrumb 的所属内容/菜单按钮、参数、原生attrs、当前七Token与内容槽见[Breadcrumb契约迁移](docs/migrations/breadcrumb-contracts.md)；三单元已完成产物、正式视觉和Docs统一验收，见[四单元验收回执](docs/audit/evidence/four-unit-final-acceptance.json)。共享Menu Enter导航修复证据保留，完整Menu审计另行继续。

Space/Compact/Addon 的当前插槽、稳定内容身份、完整 separator 数据、紧凑上下文与主题作用域见[Space契约迁移](docs/migrations/space-contracts.md)；Grid/Row/Col 的原生样式、当前配置与响应式字段见[Grid契约迁移](docs/migrations/grid-contracts.md)。直接修正开发期错误行为，不新增内容回调兼容层；两单元已分别完成发布、视觉和Docs验收，Space关联Input窄链通过不代表完整Input API已验收。

Flex的完整内容、当前gap与原生样式见[Flex契约迁移](docs/migrations/flex-contracts.md)；Alert/ErrorBoundary的内容、关闭流程与Vue错误恢复见[Alert契约迁移](docs/migrations/alert-contracts.md)；Layout家族的原生根、当前配置与Sider受控/响应式链见[Layout契约迁移](docs/migrations/layout-contracts.md)。三者与Space已统一验收，证据及剩余边界见[本批最终回执](docs/audit/evidence/space-flex-alert-layout-final-acceptance.json)。

Theme的可写深响应式配置、同应用默认来源共享/跨应用与SSR隔离、mounted变量注入和可释放scope所有权，以及空算法/undefined覆盖、精确Alias类型和原生DOM引用target，集中见[Theme契约迁移](docs/migrations/theme-foundation-contracts.md)。开发期直接移除无消费的ThemeConfig.prefixCls；DOM类名沿用ConfigProvider顶层prefixCls，CSS变量名使用cssVarPrefix，不新增兼容通道。该源码里程碑不代表ConfigProvider/Tree完整单元或全库最终门禁已关闭。

共享 `useControlledValue` 的受控请求、撤控保留值与函数更新规则见[受控状态迁移](docs/migrations/controlled-value.md)。开发阶段直接修正 rc 内部状态语义，不提供旧行为开关。
