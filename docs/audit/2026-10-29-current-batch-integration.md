# 当前批次源码整合里程碑

本批范围为 Divider、Collapse/Panel、完整 Input 六族、ConfigProvider 与其实际 Theme/Locale/Icons/Form Core/通知消费链。所有子任务已冻结并暂停；Tree只读盘点保留，不开始实现。源码提交不等于完整整改单元验收，完整交付数暂为21/72；本批统一交付后暂停，不再派发任务。

实现沿各冻结清单集中整合，不保留妨碍Vue用法的React事件载荷、内容回调或DOM结构。破坏性变化分别见四个单元的迁移文档。根导出同步公开Slots/语义类型，发布SFC消费者验证实际声明，负例逐条在其契约行失败。

整合额外修复：Input/TextArea普通计数、超额值和自定义清除文字的默认对比度；12个现有Demo的当前主题文字颜色；最近显式ThemeProvider来源及空配置重置的局部CSS投影。前两组有实际浏览器axe红证，后者有19px实际显示29px的单测红证与正式视觉反证。未取消断言或降低阈值。Search expose与VNode配置测试改为真实Vue ref/shallowRef；关联格式修正不改行为。root增量SHA随整合证据记录，原owner冻结清单保留历史原义。

已实际执行：全仓严格类型0诊断，2309项类型测试，UI构建和严格L7；13包tarball的Vite/Webpack消费；Input发布浏览器249项、24 Demo四主题96项、发布声明与全部24 Demo正负消费；ConfigProvider相关496项与62项发布浏览器/Node SSR、8 Demo四主题、发布声明/八负例；Divider67项、Collapse134项及两单元公开声明/SFC八负例；Docs161项和首轮80项真实页面/交互。详细命令、文件SHA、原始回执与剩余项见[整合证据](evidence/current-batch-source-integration.json)。

本里程碑包含Divider48张、Collapse54张已审阅基线，当前批准1089/1875；Input84张和ConfigProvider42张仍需正式审阅与独立复验。原987批准和React参考图片保留。全库运行回归及最终生成/线上Docs仍执行，不把局部绿灯拼成最终同提交全库通过。最终全部72组件与13基础包整改结束后的全量门禁仍开放。

体积按实际功能成本评估并仅调整超出的条目；ConfigProvider真实FormProvider/变量所有权链和Input完整家族的模块图已记录。保留历史measuredKb、其余预算、全量30%占比和React/rc/CSS-in-JS禁入门禁，见[体积记录](evidence/current-batch-build-costs.json)。
