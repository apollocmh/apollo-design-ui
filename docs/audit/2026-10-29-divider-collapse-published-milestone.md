# Divider / Collapse 发布专项里程碑（2026-10-29）

本记录对应已完成完整盘点的 Divider 和 Collapse / Panel，尚未声明两个整改单元全部完成。全库完整交付仍为21/72。当前用户要求本批结束后暂停；不继续派发下一批任务。

## 本轮实现与可复核范围

Divider 同时修正当前内容槽、Provider替换/撤回、RTL与方向语义、三个Component Token、11个Alias和九对Demo。带交互标题采用group与所属separator，原生业务输入、根和内容身份保持。十二props、slot、attrs/ref、Provider、主题和全部关联链见[完整盘点](2026-10-29-divider-contract-audit.md)及[迁移](../migrations/divider-contracts.md)。

Collapse 与 Panel 改为真实Vue组件和provide/inject链：一次typed模型/事件、原生heading/button/region、默认保留正文与destroy/forceRender、键盘/焦点、当前配置、十Token和九对Demo一起收口。顶层expandIcon renderer直接迁为作用域槽，不保留兼容层；Panel生命周期及业务key真实生效。见[完整清单](2026-10-29-collapse-contract-audit.md)及[迁移](../migrations/collapse-contracts.md)。

## 已执行的检查

隔离工作树以617ae554 Theme源码里程碑为运行基准，合入两份源码冻结；原始冻结不改写，根集成差异另记：两项消费测试基础设施、严格索引的两面板fixture守卫，以及等价CSS变量拼写。根导出只加入Collapse对应的真实公开类型；ColorPicker presets标题使用phrasing span，避免原生标题按钮嵌套块元素。

| 检查 | 实际结果 |
|---|---|
| 完整根严格类型 | exit0；无忽略诊断 |
| 两单元与Alert/ColorPicker联合运行 | 667/669；两条旧ConfigProvider根身份断言仍失败，保留等待当前生产者整合 |
| Divider发布浏览器、原生SSR/水合和九Demo | 67/67；errors0；发布图无源码fallback |
| Collapse发布浏览器、九Demo四主题三视口、真实消费者与原参考图 | 134/134；errors0；原参考图不变 |
| 公开根/子路径真实SFC消费 | 发布positive exit0；negative exit2，8条实际诊断；零源码fallback |
| 当前单元源码SFC | 精确复制实际四段根导出后，positive0 / negative2及8诊断；无stub；完整根类型另验 |
| 新鲜UI构建与严格L7 | 实际构建exit0；预算按真实功能成本仅改Divider17→30KiB、Collapse50→52KiB；最终L7零失败/待定，71其它预算与30%占比保持 |
| 正式Apollo视觉 | Divider48与Collapse54张全部实际审阅批准；独立重拍102/102原始RGBA精确相同 |
| 本地Docs | 内容生成、严格类型、15文件161测试及SSG构建通过；本两单元实际路由验收仍待收尾 |
| Registry | 19检查通过、零警告；两个组件保持testing，不按局部验收标completed |

候选工作树现有1089/1773张批准、684张未验；这是本两单元源码尚未交付前的隔离数据。正式已提交线上仍21/72完整单元、987/1704批准图，另见[已上线进展回执](evidence/current-batch-docs-publication.json)。不能混同两个范围。

## 根因、失败与边界

Divider引入真实Theme派生、当前Alias及组件Token，按需图新增合理的主题/颜色依赖；模块图确认未引入其它UI组件。Collapse增加真实Panel生命周期、正文保留/焦点及motion消费。体积门禁保留，按实测仅重定两项，不为少量体积无限打磨。

首次发布Divider测试未让Vite预构建完整根入口的dayjs CommonJS，修的是消费测试基础设施；源码模式不变。首批新增视觉fixture中，Divider误用受控constant value，Collapse使用旧内容类名；分别改为原生defaultValue和真实panel/body路径，原身份/行为断言保留后通过。早期类型负例数量预期未校准，当前按实际声明的默认槽scope验证，8条错误均来自负例。

额外把strictTemplates用于全UI源码时，BadgeIndicator的data-show、ColorHexInput/PanelPicker的onChange、CheckableTagGroup的aria-label出现四条现有内部诊断。没有忽略或修改它们；本次SFC检查限定实际两单元根导出，原完整根strict检查仍执行。这四条不属于本批新公开能力，留作最终模板检查的明确线索，不声称全库strictTemplates通过。

Registry静态E10只识别特定helper拼写，把已生成CSS var误判为硬编码radius。实现改为显式同一var；apollo、fixture、custom-prefix三种CSS工厂输出逐字相同，没有扩大例外或修改guard。当前dist生成早于这项等价源码拼写，最终统一构建仍须执行。

当前ConfigProvider、Input及locale/form-core/icons关联链仍在收尾。合并冻结后，必须解决上述两条关联测试、复验受影响类型/运行/发布/CSS，完成两单元实际文档路由及整批验收，才能更新完整交付数。最终同提交全库门禁依旧开放，不能拿本批局部绿灯替代。

逐文件SHA、原冻结差异、命令对应日志/JSON哈希及所有未验项见[结构化证据](evidence/divider-collapse-published-milestone.json)。
