# Image / Group 原生预览作用域槽（2026-10-25）

预览扩展审计已确认七条renderer调用均未发生（另两条通知已由独立transform事件迁移修复）。本批直接以Image/Group previewImage/previewActions及Group previewCount原生槽替换PreviewConfig的imageRender/actionsRender/countRender/toolbarRender，旧ActionsRender类型一并移除，无兼容层或弃用通道。迁移见 [记录](../migrations/image-preview-slots.md)。

正式首批13条修前11失败/2已有通过，修后全部通过，日志 `/tmp/apollo-image-preview-slots-{red,green}.log`。扩展两个真实SFC后，初版测试的宽泛.apollo-image选择到了同一fixture中用于类型负例的preview=false兄弟图片；根据DOM/事件证据改为目标图片的精确可访问名，未更改任何槽、身份或焦点断言。随后15条全部通过。

富内容进一步复现input/textarea/select方向键误切图，三条修前全失败，日志 `/tmp/apollo-image-preview-slots-editable-red.log`。复用KeyCode.isEditableTarget，仅让组内方向键保留原生编辑行为，Esc/Tab及preventDefault优先级保持。增加Progress CSR/SSR守卫后，局部19条通过，日志 `/tmp/apollo-image-preview-slots-final.log`。

新scope提供真实origin VNode、optional原始src/alt、当前transform快照及零基current/total。Toolbar提供明确typed callbacks与disabled状态，默认按钮共用同一动作对象。三层在render读取并按当前函数转发，空槽抑制默认、移除槽恢复；原图/ref/手势、编辑器身份/焦点/选区、Group归属、count与当前源、SSR/闭合及Progress急求值均覆盖。移除所触及原图ref和src展开的两处不必要断言，使用运行时元素窄化与已有类型。

## 检查

- Image/ConfigProvider四层23文件343条通过，类型14文件62条通过，无类型错误；根strict通过。日志 `/tmp/apollo-image-preview-slots-{runtime,types,strict-final}.log`。
- UI生产构建含公开声明与69CSS通过；发布消费端复制真实三槽Demo、browser fixture及精确SFC，vue-tsc通过，包含旧四renderer字段的明确负例。L7复用本次产物11项0FAIL/0PENDING。日志 `/tmp/apollo-image-preview-slots-{build,consumer-l7}.log`。
- Chrome150.0.7871.125完整新脚本通过，fixture与实际Demo均跑完整axe，无规则排除；实际source/scope更新、原img/编辑器/选区、输入与contenteditable键盘、原图双击手势、typed动作、计数导航、空/移除/恢复及Tab/关闭归还均覆盖。日志 `/tmp/apollo-image-preview-slots-browser-complete.log`。原transform/focus浏览器回归也全过，包括两种多层卸载，见 `/tmp/apollo-image-preview-slots-browser-regressions.log`。
- 新浏览器检查先暴露自定义工具按钮继承白字，以及说明文字在半透明mask上的对比度不足；实际Demo/fixture改用主题文字和容器背景Token。所有原axe规则保留，反例日志 `/tmp/apollo-image-preview-slots-browser-{contrast-red,caption-red}.log`。axe在真实入场opacity=1后检查，未模拟动画完成。
- 带编辑器时，真实DOM首个可聚焦元素是body中的input；新browser初版“末项Tab总到Close”断言不符合DOM顺序。根据实际活动元素和DOM顺序改为末项→input、input Shift+Tab→末项，保留精确身份与闭环断言，原失败见 `/tmp/apollo-image-preview-slots-browser-tab-expectation-red.log`，没有为该错误预期改组件Tab顺序。
- 文档84路由/1000Demo构建、14文件157测试、typecheck与content:check通过，见 `/tmp/apollo-image-preview-slots-docs.log`。最终仅Demo CSS修正后另重建站点并校验内容，日志 `/tmp/apollo-image-preview-slots-docs-styles-final.log`。
- Registry19项与内容清单生成/check通过，清单518行：data126/internal106，keep138/review202/skip159/verified19；其余分类数保持，见 `/tmp/apollo-image-preview-slots-metadata.log`。增加的行来自新scope/slot类型，不作为新增缺陷或自动验收数。
- `node tests/visual/apollo.mjs --check --component image`实际exit1，仍缺9张Apollo批准基线，见 `/tmp/apollo-image-preview-slots-visual.log`。未升级历史视觉/组件验收维度。其他预览配置继续独立跟踪。
