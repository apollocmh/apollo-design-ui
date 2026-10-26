---
title:
  zh-CN: 整改进展
  en-US: Audit Progress
order: 0
---

## zh-CN

## 2026-10-26：这一轮已经交付什么

当前为开发阶段快照。全库审计仍在进行，这里按已验收的单元记录进展。

| 范围 | 已完成与验证 | 可以看到的结果 |
| --- | --- | --- |
| Image / PreviewGroup | 完整契约审计已收口；381条组件回归、26个真实浏览器场景；24张自有视觉基线逐像素一致 | Vue原生插槽、可交互缩略图、预览关闭与焦点归还、分组动态删除、局部主题 |
| List / ListItem / ListItemMeta | 完整清单已收口；512条相关四层、152条类型、97项生产浏览器检查；57张自有视觉基线全部0像素差异，12个Demo逐页打开通过 | 根extra、稳定编辑器、当前分页与Provider、11个Token、嵌套隔离、默认/暗色/紧凑及组合主题、原生焦点 |
| 预览共享链路 | 已验证本轮相关的Portal所属文档、分层焦点、原生SVG控件与动态motion；其他基础包能力继续审计 | 弹层不再误锁其他窗口；输入与焦点在动态切换中保留 |
| H05 全仓格式门禁 | 66个错误已清零；52文件的脚本/渲染结构等价；相关1,246条回归、6组浏览器及文档构建通过 | 原有37个警告和5条信息保留，另案核查；规则未放宽 |

List验收还修复了关联的全屏加载正文错位、遮罩语义和文案对比度，以及暗色作用域中原生控件的颜色配对。共享消费者与既有Image场景已回归；List57张与Image24张最终同次像素复验全部exact。

**Spin已完成完整盘点与集中实现，整单元仍在验收。** 15条行为复现、32项生产浏览器、160条类型、生产SSR与发布声明消费已通过。Spin/ConfigProvider及List/Table/QRCode/Mentions的899条相关断言分批取得通过证据；原参考场景保留。完整原生指示器槽、当前进度scope、稳定加载层、确定进度首帧和4个有效Token已实现；自有视觉矩阵、独立水合及最终清单仍开放。

- [原生多节点与进度作用域](/components/spin/demo/custom-indicator)
- [Spin动态组件Token](/components/spin/demo/component-token)
- [Spin统一清单与阶段证据](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-26-spin-contract-audit.md)

- [List 当前 API 与示例](/components/list)
- [动态主题开关](/components/list/demo/component-token)
- [条目 extra、点赞与整表摘要](/components/list/demo/item-extra)
- [全屏加载与保留原生输入](/components/spin/demo/fullscreen)
- [List 完整盘点、统一验收与边界](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-26-list-contract-audit.md)

## 直接试这些示例

- [可编辑缩略图与原生预览按钮](/components/image/demo/image-render)：编辑文本、点击业务按钮，再打开预览。
- [分组删除与重置](/components/image/demo/preview-group)：打开第二张图片，在预览中删除缩略图，关闭后检查焦点，再重置。
- [关闭按钮与图标插槽](/components/image/demo/preview-close)：动态隐藏、替换或清空关闭图标。
- [局部主题与组件Token](/components/image/demo/component-token)：查看跨弹层的主题和组件变量。
- [Provider弹层配置](/components/image/demo/popup-provider)：切换当前配置，检查已打开的预览。
- [完整Image API与所有示例](/components/image)。

## API迁移要点

预览状态使用顶层`v-model:open`，分组当前项使用`v-model:current`；内容使用Vue具名插槽，变换通知使用`@transform`。失效的旧回调字段已直接移除。复制当前示例和API时请使用本次站点内容。

## 还没有完成什么

全库其他组件与基础包的完整契约审计仍在继续。内容接口来源清单还有202项候选待逐项复核，候选不等于缺陷。Image已验收不表示其他组件通过；全部整改结束后还需要对最终同一提交执行全量门禁。触摸双指缩放、其他浏览器和未列出的跨文档组合没有在本轮声明验收。

## 查看证据与后续进展

- [Image完整清单、提交与验收边界](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-25-image-contract-audit.md)
- [H05范围与验证记录](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-26-repository-format-audit.md)
- [持续整改入口](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/KNOWN-ISSUES.md)
- [站点更新日志](/changelog)：构建时从Git提交历史生成。

阶段结果会同步记录在本页、更新日志和对应验收清单中。

## en-US

## Delivered on 2026-10-26

This is a development snapshot. The library-wide audit is ongoing; results below belong to verified units.

| Scope | Verified result | Visible changes |
| --- | --- | --- |
| Image / PreviewGroup | Complete contract audit closed; 381 component tests, 26 browser scenarios, 24 exact Apollo visual baselines | Native Vue slots, editable thumbnails, close focus, dynamic group deletion and scoped themes |
| List / ListItem / ListItemMeta | Complete checklist closed; 512 related runtime/DOM/a11y/theme tests, 152 type tests, 97 browser checks; all 57 Apollo baselines exact and all 12 demos opened in the browser | Root extra content, stable editors, live pagination and Provider settings, 11 tokens, nested isolation, dark/compact/combined themes and native focus |
| Shared preview behavior | Owning-document Portal effects, per-layer focus, native SVG controls and live motion verified for this scope | Modal effects follow the owning window; editors retain focus and state |
| H05 formatting gate | 66 errors resolved; equivalent script/render structures in 52 files; 1,246 regression tests, six browser scripts and Docs build passed | Existing 37 warnings and five information diagnostics remain recorded for separate review |

List acceptance also fixed fullscreen loading flow, actual mask semantics, readable descriptions and native control foreground/background pairing in dark scopes. Named shared consumers and existing Image scenarios passed regression checks. All 57 List and 24 Image images matched exactly in the final run.

**Spin inventory and grouped implementation are complete; unit acceptance is ongoing.** Fifteen behavior reproductions, 32 browser checks, 160 type tests, production SSR and published declarations passed. All 899 related assertions across Spin/ConfigProvider/List/Table/QRCode/Mentions have passing evidence from split runs, with original reference scenarios retained. Native multi-node indicator slots, current progress scope, stable loading hosts, immediate determinate progress and four effective tokens are implemented. Owned visuals, standalone hydration and final checklist acceptance remain open.

[Native indicator scope](/components/spin/demo/custom-indicator) · [Live Spin tokens](/components/spin/demo/component-token) · [Spin inventory and evidence](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-26-spin-contract-audit.md)

[List API](/components/list) · [Live theme example](/components/list/demo/component-token) · [Extra content and live summary](/components/list/demo/item-extra) · [Fullscreen with a native editor](/components/spin/demo/fullscreen) · [Full List checklist and evidence](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-26-list-contract-audit.md)

## Try the changes

- [Editable thumbnails and native preview actions](/components/image/demo/image-render)
- [Remove a group thumbnail and reset](/components/image/demo/preview-group)
- [Live close controls and icon slots](/components/image/demo/preview-close)
- [Scoped themes and component tokens](/components/image/demo/component-token)
- [Reactive Provider popup configuration](/components/image/demo/popup-provider)
- [Complete Image API and examples](/components/image)

Use top-level `v-model:open`, group `v-model:current`, named content slots and `@transform`. Obsolete callback fields have been removed directly.

## Remaining work

Other components and foundation packages still require their complete audits. The content inventory has 202 candidates awaiting review; candidates are not confirmed defects. Final whole-library gates remain required after all remediation finishes. Touch pinch, other browsers and unspecified cross-document combinations are outside this unit's verified scope.

[Image audit and evidence](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-25-image-contract-audit.md) · [H05 evidence](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-26-repository-format-audit.md) · [Ongoing issues](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/KNOWN-ISSUES.md) · [Build-time Git history](/changelog)
