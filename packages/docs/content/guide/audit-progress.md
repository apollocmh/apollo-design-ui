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

## Button / Result 完整清单已统一验收

Button 的完整 Vue 内容、当前 Provider、加载生命周期、原生根行为和 58 个既有 Token 已修复，保留全部 20 个原 Demo；Result 的五个完整槽、六个语义落点、四个 Token 与三种异常插画已验收，保留全部 10 个原 Demo。关联 Compact/Search、FloatButton 及异步/事件示例同步修正。

最终相关四层 2352 项、公开类型 398 项、Button 147 项生产浏览器与 51 项真实消费者检查通过；颜色矩阵 1168/1168，原 Demo 四算法分别 80/80 与 40/40，实际站点页面及交互分别 43/43 与 23/23。两组件各 39 张自有视觉已逐张审阅批准，连同 QRCode 共 114 张最终逐像素一致。全库其他审计继续进行。

- [加载请求、延迟指示器与恢复](/components/button/demo/loading)
- [当前 Button Token、原生变量与保留草稿](/components/button/demo/component-token)
- [完整自定义结果内容与状态切换](/components/result/demo/custom-icon)
- [Button 范围、迁移及验证证据](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-27-button-contract-audit.md)
- [Result 范围与验收边界](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-27-result-contract-audit.md)

## Empty完整清单已统一验收

Empty六Props、三个完整原生槽、四语义、当前Provider/方向/语言、合法图片内容与布局/对比度已集中修复，六原Demo全部保留。关联Trigger的Portal主题变量丢失同步修复，保留业务内容和显式样式优先级。

冻结实现12cf9fee的2856相关四层、434公开类型、54生产浏览器、40实际公共弹层、18 Empty消费者、24 Demo主题、8 SSR和6组水合检查通过；实际Docs17项通过。45张自有视觉逐张批准，连同List57张共102张最终零像素差异，原315批准记录与图片完全保留。全库其余审计继续。

- [完整自定义图片内容与业务草稿](/components/empty/demo/customize)
- [动态Provider配置](/components/empty/demo/config-provider)
- [条件描述槽](/components/empty/demo/description)
- [Empty完整清单](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-27-empty-contract-audit.md)

## Tag 三件套完整清单已统一验收

Tag / CheckableTag / CheckableTagGroup 的完整内容、当前配置/语言/方向、原生 attrs/style、独立关闭按钮与内部链接、Vue 事件和强类型模型、三个已有 Token 已修复，十二原 Demo 全部保留并修正真实操作。Select 内关闭键盘误选与压缩 CSS 丢失颜色同步修复。

冻结实现 `c49f300b`：Tag131项、相关不重复1088项运行回归，全库类型门禁2289项、真实发布SFC及严格L7通过；生产颜色296、关闭9、实际消费者50、原Demo57、SSR/水合17、实际Docs29项通过。45张自有视觉逐张审阅，原始RGBA复验全部一致；连同List共102项按既有门禁零差异。List三张加载图的SVG抗锯齿边界已记录，原360条批准记录及图片保持不变。其他组件和基础包继续审计。

- [强类型选择模型](/components/tag/demo/checkable)
- [真正可添加和关闭的标签](/components/tag/demo/control)
- [三个当前组件Token](/components/tag/demo/component-token)
- [Tag完整盘点与证据](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-27-tag-contract-audit.md)

## Avatar / AvatarGroup 成组整改与可复核结果

当前源码已修正完整内容槽、Vue原生事件和图片回退、数值/响应式尺寸继承、文字测量、当前Provider/12 Token、业务key、原生溢出按钮、RTL与局部前缀。九个原Demo保留，增加可切换Token演示；四个Group旧别名直接迁移。

核心实现 `9af2a24f`、共享修复 `ef832304`：Avatar143条四层、Avatar及Portal/Overlay共72项类型、真实发布SFC、42浏览器、46个原Demo主题/交互、17 SSR/水合与16实际消费场景通过；Portal/Overlay/UI重建及严格L7通过。List/Listy三处蓝底头像的暗色文字已明确配对。

共享链路修正动态前缀、销毁策略、换容器的草稿/焦点，以及受控接受关闭后的焦点归还；Portal所属文档10项、Image既有交互26项及叠层焦点回归通过。48张清洁Avatar自有图逐张审阅，原始RGBA全部一致；连同List共105张按既有门禁零差异，List三张加载图保留已登记的SVG抗锯齿边界。原405条批准记录和图片保持不变。关联组件整批、逐项验收和发布回执见完整证据；这不是全库完成声明。

- [当前Avatar Token演示](/components/avatar/demo/component-token)
- [Avatar完整盘点与证据](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-27-avatar-contract-audit.md)

## 还没有完成什么

全库其他组件与基础包的完整契约审计仍在继续。内容接口来源清单还有199项启发式候选待逐项复核，候选不等于缺陷。当前自有视觉矩阵1380项，已批准453项，其余927项随后续完整整改单元验收。Image已验收不表示其他组件通过；全部整改结束后还需要对最终同一提交执行全量门禁。触摸双指缩放、其他浏览器和未列出的跨文档组合没有在本轮声明验收。

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

## Button / Result accepted

Button now consumes complete Vue content, current Provider values, native root behavior, loading state and all 58 existing tokens. All 20 original demos remain. Result's five complete slots, six semantic parts, four tokens and three exception illustrations are verified; all 10 original demos remain. Related Compact/Search, FloatButton and async/event demos are repaired.

The final related gate passes 2,352 runtime tests and 398 public type checks. Button passes 147 production browser checks, 51 actual consumer checks and 1,168 colour checks. Original demo theme matrices pass 80/80 and 40/40; actual site pages and interactions pass 43/43 and 23/23. All 39 images per component were individually reviewed and approved; the final 114-image comparison, including QRCode, has zero differing pixels. The wider library audit continues.

- [Loading and recovery](/components/button/demo/loading)
- [Current tokens and a preserved draft](/components/button/demo/component-token)
- [Complete custom Result content](/components/result/demo/custom-icon)
- [Button scope and evidence](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-27-button-contract-audit.md)
- [Result scope and boundaries](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-27-result-contract-audit.md)

## Remaining work

This snapshot has 453 approved Apollo visual cases out of 1,380; the remaining 927 await review within later audit units.

Other components and foundation packages still require their complete audits. The content inventory has 199 heuristic review candidates; candidates are not confirmed defects. Final whole-library gates remain required after all remediation finishes. Touch pinch, other browsers and unspecified cross-document combinations are outside this unit's verified scope.

[Image audit and evidence](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-25-image-contract-audit.md) · [H05 evidence](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-26-repository-format-audit.md) · [Ongoing issues](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/KNOWN-ISSUES.md) · [Build-time Git history](/changelog)


### Empty complete audit accepted

All six props, three complete native slots, four semantic regions, current Provider/direction/locale, valid image data, media layout/contrast, and all six original demos have been accepted. The shared Trigger now carries current source theme variables across native portals while preserving explicit popup styles and business state.

The frozen implementation 12cf9fee passed 2856 related runtime checks, 434 public type tests, 54 production browser checks, 40 actual popup checks, 18 Empty consumer checks, 24 demo/theme checks, eight Node SSR checks and six hydration groups. All 17 actual Docs checks passed. The 45 individually reviewed Empty visuals and 57 related List visuals are pixel-exact; all 315 earlier review records and PNGs remain unchanged. The library-wide audit continues.

## Tag complete audit accepted

Tag, CheckableTag and CheckableTagGroup now provide complete stable content, current configuration/locale/direction, native attrs/styles, an owned close button beside the inner link, Vue events and strongly typed models, and the three existing tokens. All twelve original demos remain functional. Select keyboard activation and compressed CSS colour consumption are corrected.

Frozen implementation c49f300b passes131 Tag runtime checks,1088 nonduplicated related checks,2289 tests in the public type gate, actual published SFC consumption and strict L7. Production colour296, close9, consumers50, original demos57, SSR/hydration17 and actual Docs29 checks pass. All45 individually reviewed Tag visuals are raw-RGBA exact; the102-image comparison including List passes unchanged settings. Three List loading captures have recorded SVG antialias differences; all360 prior review records/PNGs are preserved. Other components and foundations remain under audit.

- [Strong selection models](/components/tag/demo/checkable)
- [Working add and close controls](/components/tag/demo/control)
- [Current Tag component tokens](/components/tag/demo/component-token)
- [Complete Tag evidence](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-27-tag-contract-audit.md)


## Avatar grouped remediation and reviewable results

Avatar and AvatarGroup now implement complete native slots/events, explicit image fallback cancellation, inherited numeric/responsive sizes and measurement, current Provider/twelve tokens, keyed business children, an owned overflow button, RTL and local prefixes. Nine original demos remain, with an additional working token example. Four legacy Group aliases are removed directly.

Core implementation `9af2a24f` and shared repair `ef832304`:143 Avatar runtime checks,72 Avatar/Portal/Overlay type checks, actual published SFC consumption,42 browser checks,46 demo/theme interactions,17 SSR/hydration checks and16 actual consumer scenarios pass. Portal,Overlay and UI rebuilds and strict L7 pass. Three fixed blue consumer avatars now pair their foreground colour explicitly.

Shared repairs cover current prefixes, destruction policy, editor focus during container moves and focus returned after accepted controlled closing. Ten Portal owner-document checks,26 existing Image interactions and stacked focus regressions pass. All48 clean Avatar visual baselines were reviewed individually and match raw RGBA;105 Avatar/List comparisons pass with the existing thresholds. Three List loading images retain documented SVG anti-aliasing differences. All405 prior approval records and PNGs are unchanged. The complete evidence records the related runtime batch, itemised acceptance and deployment receipt; this does not declare the library complete.

- [Working Avatar tokens](/components/avatar/demo/component-token)
- [Complete inventory and evidence](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-27-avatar-contract-audit.md)
