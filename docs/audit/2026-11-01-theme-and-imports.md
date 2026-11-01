# 2026-11-01 · GitHub #79 / #80 交付记录

本记录对应 `0.1.8` 开发代码，不改变 `v0.1.7` 标签、历史九维验收结论或已批准视觉基线。核心实现见提交 `80d1d174`，文档构建初始化顺序修复见 `04d6c063`；本记录所在提交补齐文档站主题联动。

## 已实现

- `@apollo-design/ui-resolver` 提供 174 个公开组件名称映射，只引入对应 JS 和必要结构 CSS；主题仍通过独立公开入口选择。新增 TableSummaryRow / TableSummaryCell 命名导出。
- 在现有 Theme 包内提供 default / mono / material3 独立预设，支持 light / dark / system、用户 Token 覆盖、嵌套作用域和所属弹层。Material 3 是风格预设，不宣称实现整套 Material 交互规范。
- Header 分别选择风格与明暗，保存选择并同步整站、内联与独立 Demo；iframe 后续通过校验 origin/source/frameId 的消息同步，保留输入及展开状态。局部 Demo 覆盖继续生效。
- 修复实际 SSG 产物的初始化循环及保存英文后 `html.lang` 被 SEO 覆盖的问题。浏览器驱动等首次客户端接管后操作；菜单滚动回归要求确实发生滚动，并保留原跟随误差标准。

## 实际验证及复用范围

隔离产物来源：`/tmp/apollo-v018-final-producer`。主题、Docs 和 test-utils 对其实际改动重建；其余未改发布源码沿用上一干净生产者的同一份产物。所有消费者读取这些固定产物，未覆盖主工作区历史验收产物。

| 范围 | 结果及执行记录 |
| --- | --- |
| 实际 tarball 消费 | `packages/ui-resolver/tests/consumer.mjs --themes` 退出 0，81.830 秒；Node 无 DOM、Vite 自动/手工/复合组件、生成声明、SSR 与真实浏览器通过。14 包 dist 前后摘要一致。 |
| 联合主题矩阵 | 同一安装目录执行三种引入方式 × 四种预设/自定义 × 亮暗，共 24 场景通过，64.991 秒；16 张桌面/窄屏代表截图已逐张查看。 |
| 共享层消费者 | 13 个运行时包的 Vite / Webpack 消费通过；zIndex 发布浏览器复核通过，仍区分 15 个支持场景与 9 个已知表达式限制场景。 |
| UI L7 / B6 | L7 无失败、无 pending；73 个入口全部在现有预算内。全量 JS 2230.2 KiB；未提高预算。为未消费的 ThemeProvider 工厂标注 PURE，修复不必要的代码保留。 |
| Docs 六组 | smoke 40/40、stage2、V3 22/22、menu 28/28、notification-motion、motion-review 60/60 通过。前三组沿用同一产物首次运行结果，菜单驱动修正后只重跑菜单；未重复整套检查。 |
| SSG 保存偏好 | Mono dark、Mono system/系统暗、Mono system/系统亮及英文，共三组通过；实际首屏、客户端选择、语言及零页面错误核对通过。 |

命令原始记录：`/tmp/apollo-v018-final-canonical-consumer.log`、消费输出目录 `apollo-ui-resolver-consumer-rck7Sa/result.json` 与 `theme-matrix/result.json`、`/tmp/apollo-v018-final-ui-l7.json`、`/tmp/apollo-v018-docs-browser-canonical.log`、`/tmp/apollo-v018-docs-feedback-browser.log`、`/tmp/apollo-v018-docs-menu-canonical.log`、`/tmp/apollo-v018-docs-ssg-preferences-5ae1a72a-result.json`。

Docs 产物 SHA-256：`ccc12b9c05c84855ffca68e460557bc533e848ad51255d8139bb1814b9a058c9`。最后的菜单变更仅涉及测试驱动；源码与隔离生产者 `7f4196df` 相同，新增 SEO 测试也逐字一致，复用不跨越产物变化。

测试分层补查发现，resolver 的三个发布路径断言在没有 UI dist 的源码阶段会失败，现完整迁入同一安装目录的消费检查；源码阶段 27 项通过，发布阶段三个检查组覆盖全部 174 个映射。变更计划对这些包内消费脚本选择一次既有构建和一次消费检查，18 项工作流回归通过。另将原裸写类型断言注册为 Vitest 类型用例，保留三个负例；原命令的“无测试套件”失败已修正，真实 `--project types` 静态/运行时共六项通过。无测试被跳过，也未重跑未改变的主题矩阵。

## 剩余边界

- 上述是新能力的相关检查，不冒称 `0.1.8` 已执行全库九维验收；原冻结版本结果仍见 [zIndex 收口记录](2026-11-01-z-index-closeout.md)。
- 文档站线上已部署版本为 `v0.1.7`；本次开发代码提交不等于已部署 `0.1.8`，也没有创建或覆盖版本标签。
- 云端 CI 的最终结果独立跟进。旧运行的超时及跨系统滚动条/字体差异不通过接受截图或放宽阈值消除。
