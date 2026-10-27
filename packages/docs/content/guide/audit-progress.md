---
title:
  zh-CN: 整改进展
  en-US: Audit Progress
order: 0
---

## zh-CN

## 2026-10-27：这一轮已经交付什么

当前为开发阶段快照。全库审计仍在进行，这里按已验收的单元记录进展。

| 范围 | 已完成与验证 | 可以看到的结果 |
| --- | --- | --- |
| Image / PreviewGroup | 完整契约审计已收口；381条组件回归、26个真实浏览器场景；24张自有视觉基线逐像素一致 | Vue原生插槽、可交互缩略图、预览关闭与焦点归还、分组动态删除、局部主题 |
| List / ListItem / ListItemMeta | 完整清单已收口；512条相关四层、152条类型、97项生产浏览器检查；57张自有视觉基线全部0像素差异，12个Demo逐页打开通过 | 根extra、稳定编辑器、当前分页与Provider、11个Token、嵌套隔离、默认/暗色/紧凑及组合主题、原生焦点 |
| 预览共享链路 | 已验证本轮相关的Portal所属文档、分层焦点、原生SVG控件与动态motion；其他基础包能力继续审计 | 弹层不再误锁其他窗口；输入与焦点在动态切换中保留 |
| H05 全仓格式门禁 | 66个错误已清零；52文件的脚本/渲染结构等价；相关1,246条回归、6组浏览器及文档构建通过 | 原有37个警告和5条信息保留，另案核查；规则未放宽 |

List验收还修复了关联的全屏加载正文错位、遮罩语义和文案对比度，以及暗色作用域中原生控件的颜色配对。共享消费者与既有Image场景已回归；List57张与Image24张最终同次像素复验全部exact。

**Spin完整清单已统一验收。** 原生多节点指示器、当前进度scope、稳定加载层、确定进度首帧和4个有效Token已修复。15条根因复现、32项生产浏览器、160条类型、生产SSR与发布声明通过；899条相关断言保留分批通过证据。最终98条单元、13条主题、7组水合验收通过；45张自有视觉基线经清洁提交审阅批准后全部0像素差异，相关List57张保持一致。10个实际Demo与3组交互已在线验证；全库其余审计仍在继续。

**QRCode完整清单已统一验收。** 状态函数改为原生槽，刷新采用稳定Vue事件，当前语言与遮罩Token生效，根样式不再复制到画布；默认白色背景和图像名称已补齐。75条四层、92条类型、44项真实浏览器、10项SSR、6组水合及全部5Demo通过；36张自有视觉经清洁提交逐张审阅批准后，全部0像素差异。实现与验收证据已提交，全库其余审计继续进行。

- [可编辑状态槽与重复刷新](/components/qr-code/demo/status)
- [QRCode动态遮罩Token](/components/qr-code/demo/component-token)
- [QRCode完整清单与证据](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-26-qrcode-contract-audit.md)

- [原生多节点与进度作用域](/components/spin/demo/custom-indicator)
- [Spin动态组件Token](/components/spin/demo/component-token)
- [Spin统一清单与阶段证据](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-26-spin-contract-audit.md)

- [List 当前 API 与示例](/components/list)
- [动态主题开关](/components/list/demo/component-token)
- [条目 extra、点赞与整表摘要](/components/list/demo/item-extra)
- [全屏加载与保留原生输入](/components/spin/demo/fullscreen)
- [List 完整盘点、统一验收与边界](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-26-list-contract-audit.md)

**Statistic / Timer / Countdown完整清单已统一验收。** 原生值槽、当前计时方向/非负事件、SSR与卸载清理、完整attrs/ref、当前Provider与两字号Token已修复。86条四层、94条相关类型、46项生产浏览器、5项SSR、6组水合及发布声明通过；原7Demo及两组实际交互、28组实际Demo主题通过。清洁实现的36张自有视觉逐张审阅批准后全部0像素差异；全库其余审计继续进行。

- [可重启计时与稳定输入](/components/statistic/demo/timer)
- [当前字号Token与原生覆盖](/components/statistic/demo/component-token)
- [Statistic完整清单](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-27-statistic-contract-audit.md)

**Skeleton及五个子组件完整清单已统一验收。** 根attrs/style使用Vue原生语义，当前Provider、块配置、完整Image/Node插槽、八个Token、实际RTL与减少动画均已修正。关联360条四层、128条类型、92项生产浏览器、18项SSR、6组水合及发布声明通过；全部九Demo亮暗及五组交互23项、四算法36组合通过。清洁实现的39张自有视觉已逐张审阅批准并全部0像素差异，关联Statistic36张保持一致。全库其余审计继续进行。

- [重复加载与真实内容](/components/skeleton/demo/children)
- [六种形态与当前Token](/components/skeleton/demo/component-token)
- [Skeleton完整清单与迁移](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-27-skeleton-contract-audit.md)

**文档示例的主题链路已修正。** 明暗CSS与Vue源主题同步，系统偏好实时更新，独立示例的theme参数只临时覆盖，水合首帧保持一致；切换内联主题保留输入值和焦点。五个Token消费者亮/暗及72组件代表页亮/暗共144次实际渲染通过，Docs161条测试通过。iframe地址变更仍会导航重载。[完整范围与证据](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-27-docs-demo-theme-audit.md)。

## 直接试这些示例

- [可编辑缩略图与原生预览按钮](/components/image/demo/image-render)：编辑文本、点击业务按钮，再打开预览。
- [分组删除与重置](/components/image/demo/preview-group)：打开第二张图片，在预览中删除缩略图，关闭后检查焦点，再重置。
- [关闭按钮与图标插槽](/components/image/demo/preview-close)：动态隐藏、替换或清空关闭图标。
- [局部主题与组件Token](/components/image/demo/component-token)：查看跨弹层的主题和组件变量。
- [Provider弹层配置](/components/image/demo/popup-provider)：切换当前配置，检查已打开的预览。
- [完整Image API与所有示例](/components/image)。

## API迁移要点

预览状态使用顶层`v-model:open`，分组当前项使用`v-model:current`；内容使用Vue具名插槽，变换通知使用`@transform`。失效的旧回调字段已直接移除。复制当前示例和API时请使用本次站点内容。

## 当前收口：Button / Result

本阶段已实现 Button 的完整 Vue 内容、当前 Provider、加载生命周期和 58 个既有 Token，保留全部 20 个原 Demo；同时修复 Compact/Search 的状态传递及关联示例。最终发布产物 147 项 Button 浏览器检查、51 项真实消费者检查及 1168 项颜色检查通过。Result 的共享按钮问题已修复，两个整改单元正在统一验收自有视觉、最终示例与站点；尚未标记完成。[完整范围、验证与剩余项](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-27-button-contract-audit.md)。

## 还没有完成什么

全库其他组件与基础包的完整契约审计仍在继续。内容接口来源清单还有199项候选待逐项复核，候选不等于缺陷。Image已验收不表示其他组件通过；全部整改结束后还需要对最终同一提交执行全量门禁。触摸双指缩放、其他浏览器和未列出的跨文档组合没有在本轮声明验收。

## 查看证据与后续进展

- [Image完整清单、提交与验收边界](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-25-image-contract-audit.md)
- [H05范围与验证记录](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-26-repository-format-audit.md)
- [持续整改入口](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/KNOWN-ISSUES.md)
- [站点更新日志](/changelog)：构建时从Git提交历史生成。

阶段结果会同步记录在本页、更新日志和对应验收清单中。

## en-US

## Delivered on 2026-10-27

This is a development snapshot. The library-wide audit is ongoing; results below belong to verified units.

| Scope | Verified result | Visible changes |
| --- | --- | --- |
| Image / PreviewGroup | Complete contract audit closed; 381 component tests, 26 browser scenarios, 24 exact Apollo visual baselines | Native Vue slots, editable thumbnails, close focus, dynamic group deletion and scoped themes |
| List / ListItem / ListItemMeta | Complete checklist closed; 512 related runtime/DOM/a11y/theme tests, 152 type tests, 97 browser checks; all 57 Apollo baselines exact and all 12 demos opened in the browser | Root extra content, stable editors, live pagination and Provider settings, 11 tokens, nested isolation, dark/compact/combined themes and native focus |
| Shared preview behavior | Owning-document Portal effects, per-layer focus, native SVG controls and live motion verified for this scope | Modal effects follow the owning window; editors retain focus and state |
| H05 formatting gate | 66 errors resolved; equivalent script/render structures in 52 files; 1,246 regression tests, six browser scripts and Docs build passed | Existing 37 warnings and five information diagnostics remain recorded for separate review |

List acceptance also fixed fullscreen loading flow, actual mask semantics, readable descriptions and native control foreground/background pairing in dark scopes. Named shared consumers and existing Image scenarios passed regression checks. All 57 List and 24 Image images matched exactly in the final run.

**The complete Spin checklist is verified.** Native multi-node indicators, current progress scope, stable loading hosts, immediate determinate progress and four effective tokens are fixed. Fifteen root-cause reproductions, 32 browser checks, 160 type tests, production SSR and published declarations passed; 899 related assertions retain passing evidence from split runs. Final acceptance includes 98 unit tests, 13 theme tests, seven hydration groups and 45 reviewed images from a clean commit, all with zero pixel differences; the 57 approved List images also remain exact. All ten real demos and three interaction groups passed online. Other library audits remain open.

**The complete QRCode checklist is verified.** Native status slots, stable Vue refresh events, live locale/cover tokens, correct root/graphic sizing, neutral contrast and image names are implemented. Validation includes 75 runtime/DOM/accessibility/theme tests, 92 type tests, 44 browser checks, 10 SSR checks, six hydration groups and all five demos. All 36 owned images were individually reviewed from a clean commit and match exactly. Implementation and acceptance evidence are committed; other library audits remain open.

[Native status and repeated refresh](/components/qr-code/demo/status) · [Live cover token](/components/qr-code/demo/component-token) · [QRCode checklist](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-26-qrcode-contract-audit.md)

[Native indicator scope](/components/spin/demo/custom-indicator) · [Live Spin tokens](/components/spin/demo/component-token) · [Spin inventory and evidence](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-26-spin-contract-audit.md)

[List API](/components/list) · [Live theme example](/components/list/demo/component-token) · [Extra content and live summary](/components/list/demo/item-extra) · [Fullscreen with a native editor](/components/spin/demo/fullscreen) · [Full List checklist and evidence](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-26-list-contract-audit.md)

**The complete Statistic / Timer / Countdown checklist is verified.** Native value slots, live direction/nonnegative events, safe SSR/cleanup, complete attrs/refs, current Provider and both font tokens are fixed. Passing evidence includes 86 runtime/DOM/accessibility/theme tests, 94 related type tests, 46 browser checks, five SSR checks, six hydration groups and published declarations. All seven actual demos, both interaction groups and 28 demo/theme combinations pass. All 36 owned images from a clean commit were individually reviewed and match with zero pixel differences. Other library audits remain open.

[Restartable clocks and native editors](/components/statistic/demo/timer) · [Current font tokens](/components/statistic/demo/component-token) · [Statistic checklist](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-27-statistic-contract-audit.md)

**The complete Skeleton checklist, including all five children, is verified.** Native root attrs/styles, live Provider and block configuration, complete Image/Node slots, eight tokens, actual RTL and reduced motion are fixed. Passing evidence includes 360 related runtime/DOM/accessibility/theme tests, 128 type tests, 92 browser checks, 18 SSR checks, six hydration groups and published declarations. All nine demos in light/dark plus five interaction groups pass 23 checks; all 36 demo/theme combinations pass. All 39 owned images from a clean implementation commit were individually reviewed and match with zero pixel differences; all 36 related Statistic images remain exact. Other library audits remain open.

[Repeated loading and real content](/components/skeleton/demo/children) · [Six forms and live tokens](/components/skeleton/demo/component-token) · [Skeleton checklist and migration](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-27-skeleton-contract-audit.md)

**The Docs demo theme pipeline is fixed.** CSS and Vue source themes stay synchronized, system preferences update live, standalone theme queries remain temporary, and hydration starts consistently. Inline theme changes preserve native editor values and focus. Five named token consumers pass in light/dark; representative pages from all 72 components pass 144 light/dark render checks. All 161 Docs tests pass. Iframe URL changes retain their existing navigation/reload boundary. [Scope and evidence](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-27-docs-demo-theme-audit.md).

## Try the changes

- [Editable thumbnails and native preview actions](/components/image/demo/image-render)
- [Remove a group thumbnail and reset](/components/image/demo/preview-group)
- [Live close controls and icon slots](/components/image/demo/preview-close)
- [Scoped themes and component tokens](/components/image/demo/component-token)
- [Reactive Provider popup configuration](/components/image/demo/popup-provider)
- [Complete Image API and examples](/components/image)

Use top-level `v-model:open`, group `v-model:current`, named content slots and `@transform`. Obsolete callback fields have been removed directly.

## Current acceptance: Button / Result

Button now consumes complete Vue content, current Provider values, loading state and all 58 existing tokens. All 20 original demos remain. The final published build passes 147 Button browser checks, 51 actual consumer checks and 1,168 colour checks. Compact/Search state propagation and related demos are repaired. Button and Result still await unified visual, final-demo and site acceptance; neither unit is marked complete. [Scope, evidence and remaining work](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-27-button-contract-audit.md).

## Remaining work

Other components and foundation packages still require their complete audits. The content inventory has 199 candidates awaiting review; candidates are not confirmed defects. Final whole-library gates remain required after all remediation finishes. Touch pinch, other browsers and unspecified cross-document combinations are outside this unit's verified scope.

[Image audit and evidence](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-25-image-contract-audit.md) · [H05 evidence](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-26-repository-format-audit.md) · [Ongoing issues](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/KNOWN-ISSUES.md) · [Build-time Git history](/changelog)
