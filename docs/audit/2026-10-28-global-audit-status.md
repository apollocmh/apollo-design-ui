# 全库当前审计交付清单

2026-10-28快照。按当前源码完整盘点、成组修复和统一验收记录；Registry历史completed、局部绿灯及视觉图片数量均不代替本轮完整收口。组件主单元按registry/components.json的72项计，关联子组件随所属单元验收。

| 范围 | 数量 | 状态 |
| --- | --- | --- |
| 已完整验收并交付的组件 | 12 | 下表列明；保留各自提交、运行和发布证据 |
| Badge / Ribbon | 1 | 本地完整验收通过，最终Docs发布/线上回执待收口 |
| Descriptions / Breadcrumb / Timeline | 3 | 独立文件范围并行；完整清单和成组失败复现进行中 |
| Space/Compact、Grid/Row/Col | 2 | 已排队，空位自动接续 |
| 其余组件 | 54 | 尚未按本轮完整清单收口，既有局部修复保留 |
| 基础包 | 13 | 已有实现和共享链路专项证据；本轮逐包复核另列，不将旧完成状态当作当前全包验收 |

总组件72=12已交付+1待最终发布+3并行+2排队+54其他待审。用户已取消日期约束，按实际验收更新；数量不折算工时百分比。

## 当前组件单元

| 组件 | 本轮状态 | 证据/说明 |
| --- | --- | --- |
| Affix | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Alert | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Anchor | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| App | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| AutoComplete | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Avatar | 已完整验收并交付 | [2026-10-27-avatar-contract-audit.md](2026-10-27-avatar-contract-audit.md) |
| BackTop | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Badge | 本地完整验收；最终发布待收口 | [2026-10-28-badge-contract-audit.md](2026-10-28-badge-contract-audit.md) |
| BorderBeam | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Breadcrumb | 并行审计/复现 | 完整清单与红灯证据随所属单元提交交付 |
| Button | 已完整验收并交付 | [2026-10-27-button-contract-audit.md](2026-10-27-button-contract-audit.md) |
| Calendar | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Card | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Carousel | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Cascader | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Checkbox | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Collapse | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| ColorPicker | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| ConfigProvider | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| DatePicker | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Descriptions | 并行审计/复现 | 完整清单与红灯证据随所属单元提交交付 |
| Divider | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Drawer | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Dropdown | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Empty | 已完整验收并交付 | [2026-10-27-empty-contract-audit.md](2026-10-27-empty-contract-audit.md) |
| Flex | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| FloatButton | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Form | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Grid | 排队 | 既有局部整改保留；本轮完整证据待补 |
| Image | 已完整验收并交付 | [2026-10-25-image-contract-audit.md](2026-10-25-image-contract-audit.md) |
| Input | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| InputNumber | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Layout | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| List | 已完整验收并交付 | [2026-10-26-list-contract-audit.md](2026-10-26-list-contract-audit.md) |
| Listy | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Masonry | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Mentions | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Menu | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Message | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Modal | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Notification | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Pagination | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Popconfirm | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Popover | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Progress | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| QRCode | 已完整验收并交付 | [2026-10-26-qrcode-contract-audit.md](2026-10-26-qrcode-contract-audit.md) |
| Radio | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Rate | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Result | 已完整验收并交付 | [2026-10-27-result-contract-audit.md](2026-10-27-result-contract-audit.md) |
| Segmented | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Select | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Skeleton | 已完整验收并交付 | [2026-10-27-skeleton-contract-audit.md](2026-10-27-skeleton-contract-audit.md) |
| Slider | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Space | 排队 | 既有局部整改保留；本轮完整证据待补 |
| Spin | 已完整验收并交付 | [2026-10-26-spin-contract-audit.md](2026-10-26-spin-contract-audit.md) |
| Splitter | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Statistic | 已完整验收并交付 | [2026-10-27-statistic-contract-audit.md](2026-10-27-statistic-contract-audit.md) |
| Steps | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Switch | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Table | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Tabs | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Tag | 已完整验收并交付 | [2026-10-27-tag-contract-audit.md](2026-10-27-tag-contract-audit.md) |
| TimePicker | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Timeline | 并行审计/复现 | 完整清单与红灯证据随所属单元提交交付 |
| Tooltip | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Tour | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Transfer | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Tree | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| TreeSelect | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Typography | 已完整验收并交付 | [2026-10-27-typography-contract-audit.md](2026-10-27-typography-contract-audit.md) |
| Upload | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |
| Watermark | 待本轮完整盘点/统一验收 | 既有局部整改保留；本轮完整证据待补 |

## 基础包复核范围

逐包核对API/实现/类型/测试/文档/产物。Portal、overlay、motion等已有专项验证保留；本清单不把相关消费通过升级为整个基础包本轮收口。

- @apollo-design/utils
- @apollo-design/theme
- @apollo-design/icons
- @apollo-design/motion
- @apollo-design/portal
- @apollo-design/position
- @apollo-design/a11y
- @apollo-design/virtual-list
- @apollo-design/overlay
- @apollo-design/locale
- @apollo-design/form-core
- @apollo-design/picker
- @apollo-design/test-utils

## 验收与调度

各单元先完整清单与红灯，按根因集中修复；独占组件文件与专项测试/报告。共享导出、Registry、公共样式/基础层修改集中整合；冻结提交后统一构建并行消费验证，避免一方重建dist干扰另一方读产物。

完整单元验收包括适用运行时/类型/浏览器/SSR与水合/Demo/消费者/自有视觉及文档证据。最后在全库最终同一提交执行全量门禁。D04前缀策略、D05例外及已知文档告警等开放项按KNOWN-ISSUES单独裁决；已接受的动画与既有功能不重复重开。
