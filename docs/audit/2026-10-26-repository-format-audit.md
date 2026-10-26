# H05：全仓格式门禁存量整改

盘点基线：`9862a979`。本单元只解决当前全仓Biome失败项，保留现有规则与阈值。已先完整读取结构化诊断，并核对全部21处导入块的模块类别、类型导入和副作用导入边界。

## 范围与验收

实际`biome check . --max-diagnostics=none --reporter=json`退出1：3527文件，66错误（45格式、21导入排序）、37警告、5信息，0遗漏诊断。66错误集中52个Vue/HTML文件，包含4个组件源文件、Demo和测试fixture；没有从静态命中推导API缺陷。

本轮必修：52文件的格式/导入排序。只启用formatter与organizeImports写入，不执行其他lint自动修复，不改Props、Slots、Emits、model、Expose、响应式、attrs、Provider、样式值或子组件传递/消费行为；导入模块与绑定集合保持，副作用导入边界保留。普通格式维护不扩大为这些组件的功能重审。

另案核查：23处测试非空断言、7处!important、6处未使用形参、1处CSS优先级警告，以及5条信息；本轮不把这些诊断当已确认产品缺陷，也不抑制或改级别。Docs样式/测试与历史memory工具质量须在各自单元核实。原H05对memory工具的笼统归因更正为：当前致命错误全部是以下Vue/HTML格式与排序；memory工具只有信息诊断。

统一验收标准：原66错误全部消失、完整root lint:format实际退出0，37警告/5信息仍单列；逐个审查差异仅在格式/导入排序，类型检查及受影响组件现有回归通过，Demo内容/文档检查通过。生产组件导入调整补构建及适用浏览器回归；不写镜像测试、不修改视觉基线。最终全库门禁属于全部整改结束后的独立步骤。

## 52文件完整清单

| 文件 | 当前错误 |
|---|---|
| `packages/ui/src/breadcrumb/demo/scoped-item.vue` | format ×1 |
| `packages/ui/src/image/__tests__/fixtures/ImagePreviewSlots.vue` | assist/source/organizeImports ×1, format ×1 |
| `packages/ui/src/image/__tests__/fixtures/ImageSlot.vue` | assist/source/organizeImports ×1, format ×1 |
| `packages/ui/src/image/__tests__/fixtures/ImageTransform.vue` | format ×1 |
| `packages/ui/src/image/demo/popup-provider.vue` | format ×1 |
| `packages/ui/src/image/demo/preview-close.vue` | format ×1 |
| `packages/ui/src/image/demo/preview-group-top-progress.vue` | format ×1 |
| `packages/ui/src/image/demo/preview-group-visible.vue` | format ×1 |
| `packages/ui/src/image/demo/style-class.vue` | assist/source/organizeImports ×1, format ×1 |
| `packages/ui/src/image/demo/transform-events.vue` | format ×1 |
| `packages/ui/src/list/List.vue` | format ×1 |
| `packages/ui/src/masonry/Masonry.vue` | format ×1 |
| `packages/ui/src/masonry/__tests__/fixtures/MasonrySlots.vue` | assist/source/organizeImports ×1 |
| `packages/ui/src/masonry/demo/dynamic.vue` | format ×1 |
| `packages/ui/src/masonry/demo/image.vue` | format ×1 |
| `packages/ui/src/mentions/__tests__/fixtures/CoreEvents.vue` | format ×1 |
| `packages/ui/src/mentions/__tests__/fixtures/EmptySlot.vue` | assist/source/organizeImports ×1 |
| `packages/ui/src/mentions/__tests__/fixtures/NativeEvents.vue` | assist/source/organizeImports ×1, format ×1 |
| `packages/ui/src/mentions/__tests__/fixtures/PopupSlot.vue` | format ×1 |
| `packages/ui/src/pagination/Pagination.vue` | assist/source/organizeImports ×1, format ×1 |
| `packages/ui/src/steps/__tests__/fixtures/StepsSlots.vue` | format ×1 |
| `packages/ui/src/steps/demo/native-slots.vue` | format ×1 |
| `packages/ui/src/tabs/Tabs.vue` | assist/source/organizeImports ×1 |
| `packages/ui/src/timeline/__tests__/fixtures/TimelineSlots.vue` | format ×1 |
| `packages/ui/src/timeline/demo/native-slots.vue` | format ×1 |
| `packages/ui/src/tooltip/__tests__/fixtures/OverlaySlots.vue` | assist/source/organizeImports ×1, format ×1 |
| `packages/ui/src/typography/demo/editable.vue` | assist/source/organizeImports ×1 |
| `packages/ui/src/typography/demo/semantic.vue` | assist/source/organizeImports ×1, format ×1 |
| `tests/browser/fixtures/ImageCounterContrast.vue` | format ×1 |
| `tests/browser/fixtures/ImageDirection.vue` | format ×1 |
| `tests/browser/fixtures/ImageOpenModel.vue` | format ×1 |
| `tests/browser/fixtures/ImagePopupProvider.vue` | format ×1 |
| `tests/browser/fixtures/ImagePrefix.vue` | format ×1 |
| `tests/browser/fixtures/ImagePreviewSlots.vue` | format ×1 |
| `tests/browser/fixtures/ImageProvider.vue` | assist/source/organizeImports ×1, format ×1 |
| `tests/browser/fixtures/ImageStyles.vue` | format ×1 |
| `tests/browser/fixtures/ImageTransform.vue` | format ×1 |
| `tests/browser/fixtures/MasonryNative.vue` | format ×1 |
| `tests/browser/fixtures/MentionsBindings.vue` | format ×1 |
| `tests/browser/fixtures/MentionsEvents.vue` | assist/source/organizeImports ×1, format ×1 |
| `tests/browser/fixtures/MentionsKeyboard.vue` | assist/source/organizeImports ×1, format ×1 |
| `tests/browser/fixtures/MentionsNativeEvents.vue` | assist/source/organizeImports ×1, format ×1 |
| `tests/browser/fixtures/OverlayAttrs.vue` | format ×1 |
| `tests/browser/fixtures/OverlayContent.vue` | format ×1 |
| `tests/browser/fixtures/PaginationContainers.vue` | assist/source/organizeImports ×1, format ×1 |
| `tests/browser/fixtures/TimelineNative.vue` | assist/source/organizeImports ×1, format ×1 |
| `tests/browser/fixtures/TypographyProvider.vue` | assist/source/organizeImports ×1, format ×1 |
| `tests/browser/fixtures/TypographySlots.vue` | format ×1 |
| `tests/browser/fixtures/TypographyStyles.vue` | format ×1 |
| `tests/browser/fixtures/image-theme-hydration.html` | assist/source/organizeImports ×1 |
| `tests/browser/fixtures/masonry-hydration.html` | assist/source/organizeImports ×1 |
| `tests/browser/fixtures/motion-hydration.html` | assist/source/organizeImports ×1 |

## 证据状态

复现已验证；修复、差异审查和统一验收待执行。基线原始诊断：`/tmp/apollo-h05-format-baseline.json`。

## 实施与差异核对

仅对52文件运行 `biome check --write --linter-enabled=false`，执行formatter与organizeImports，不触及其余lint修复。TypeScript脚本AST/导入绑定集合及Vue模板编译后渲染AST逐文件等价，冗余括号和具名导入排序按语法含义归一；style原文和HTML非script部分保持。21个导入块另核对副作用边界；4个生产组件中仅有格式及Vue类型导入的排序。临时校验命令 `node /tmp/apollo-h05-format-equivalence.mjs` 退出0，日志 `/tmp/apollo-h05-equivalence-final.log`。

根 `lint:format` 现退出0：3527文件、0错误、37警告、5信息，没有改规则/忽略项或降低阈值。完整诊断对比确认原警告/信息的规则、文件和数量不变。根严格检查通过，61文件1246条相关四层回归通过，生产构建/L7 11项和6组Chrome通过；Docs内容及最终统一验收仍在执行，未据局部结果提前提交完成。

来源清单刷新补记8d99baae已实现的Group Demo引用，并将KNOWN-ISSUES当前统计纠正为519行：154内容候选、67渲染候选、137数据/配置、161内部/废弃，19 verified/202 review。分类和验收决策未因格式修改提升。

## 统一验收结论

本单元已完成：15项串行检查全部退出0，包含根格式、严格、61文件1246条四层回归、UI构建/L7 11项、List/Masonry/Pagination/Tabs/Image Provider及关闭Demo六组Chrome、Docs内容生成/检查、14文件157条测试与SSG实际构建进程。完整命令、基线/最终诊断、52文件前后SHA-256和剩余诊断保存在[证据](evidence/repository-format.json)。Registry19检查0warning及519行来源快照检查通过；git diff --check通过。

已实现且已验证：原66错误清零；未验证/另案：37警告与5信息对应工具/Docs质量问题尚未功能裁决，其他组件完整契约与最终全库门禁继续开放。本次为格式与导入排序验收，不宣称所有组件重新通过功能审计。原Image验收及视觉来源仍对应各自提交。
