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
| 预览共享链路 | 已验证本轮相关的Portal所属文档、分层焦点、原生SVG控件与动态motion；其他基础包能力继续审计 | 弹层不再误锁其他窗口；输入与焦点在动态切换中保留 |
| H05 全仓格式门禁 | 66个错误已清零；52文件的脚本/渲染结构等价；相关1,246条回归、6组浏览器及文档构建通过 | 原有37个警告和5条信息保留，另案核查；规则未放宽 |

当前正在验收 **List / ListItem / ListItemMeta**。主链路已修正，99文件1,788条关联回归、152条类型检查和55项生产浏览器检查通过；根 extra、动态主题、嵌套样式、分页状态及原生焦点已经有证据。自有视觉基线、暗色/紧凑矩阵和整单元最终收口仍开放，不计为全部完成。

- [List 当前 API 与示例](/components/list)
- [动态主题开关](/components/list/demo/component-token)
- [条目 extra、点赞与整表摘要](/components/list/demo/item-extra)
- [List 完整盘点、阶段证据与剩余范围](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-26-list-contract-audit.md)

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
| Shared preview behavior | Owning-document Portal effects, per-layer focus, native SVG controls and live motion verified for this scope | Modal effects follow the owning window; editors retain focus and state |
| H05 formatting gate | 66 errors resolved; equivalent script/render structures in 52 files; 1,246 regression tests, six browser scripts and Docs build passed | Existing 37 warnings and five information diagnostics remain recorded for separate review |

**List / ListItem / ListItemMeta are under acceptance.** Core fixes passed 1,788 affected regression tests in 99 files, 152 type tests and 55 production-browser checks. Root extra content, live themes, nested styles, pagination state and native focus are verified. Approved Apollo visuals, dark/compact coverage and final unit acceptance remain open.

[List API](/components/list) · [Live theme example](/components/list/demo/component-token) · [Extra content and live summary](/components/list/demo/item-extra) · [Full List checklist and evidence](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-26-list-contract-audit.md)

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
