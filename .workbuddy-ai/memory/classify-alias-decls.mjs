/**
 * 把「运行时 className/rootClassName/style 声明」分类：
 *   LIVE  —— 文件里有 props.<alias> 消费（可能是迁移漏网，也可能是内部契约）
 *   DEAD  —— 声明了但零消费（死代码，应删）
 *   type: null 的声明（table 引擎等）单独标注。
 */
import fs from 'node:fs';

const hits = `packages/ui/src/tabs/TabNavList.ts:112
packages/ui/src/tabs/TabPane.ts:24
packages/ui/src/tabs/OperationNode.ts:75
packages/ui/src/tree/TreeNode.ts:39
packages/ui/src/tree/MotionTreeNode.ts:32
packages/ui/src/dropdown/Dropdown.ts:92
packages/ui/src/drawer/PurePanel.ts:21
packages/ui/src/drawer/engine/DrawerSection.ts:25
packages/ui/src/drawer/engine/DrawerPopup.ts:96
packages/ui/src/drawer/engine/DrawerPopup.ts:99
packages/ui/src/form/FormItem/ItemHolder.ts:30
packages/ui/src/form/FormItem/ItemHolder.ts:31
packages/ui/src/calendar/components/CalendarHeader.ts:202
packages/ui/src/input-number/engine/StepHandler.ts:42
packages/ui/src/input/engine/Input.ts:43
packages/ui/src/input/engine/BaseInput.ts:42
packages/ui/src/input/engine/TextArea.ts:50
packages/ui/src/notification/PurePanel.ts:39
packages/ui/src/notification/engine/Progress.ts:14
packages/ui/src/notification/engine/Notifications.ts:56
packages/ui/src/notification/engine/NoticeListContent.ts:21
packages/ui/src/notification/engine/NoticeList.ts:58
packages/ui/src/notification/engine/Notice.ts:40
packages/ui/src/alert/Alert.ts:94
packages/ui/src/alert/Alert.ts:95
packages/ui/src/segmented/Segmented.ts:125
packages/ui/src/segmented/Segmented.ts:126
packages/ui/src/splitter/Panel.ts:18
packages/ui/src/splitter/Panel.ts:42
packages/ui/src/descriptions/DescriptionsItem.ts:24
packages/ui/src/message/PurePanel.ts:38
packages/ui/src/mentions/engine/Mentions.ts:70
packages/ui/src/mentions/engine/Mentions.ts:157
packages/ui/src/mentions/engine/Mentions.ts:680
packages/ui/src/collapse/Panel.ts:81
packages/ui/src/collapse/Panel.ts:295
packages/ui/src/spin/components/Looper.ts:25
packages/ui/src/spin/components/Indicator.ts:48
packages/ui/src/carousel/Carousel.ts:87
packages/ui/src/image/Progress.ts:41
packages/ui/src/image/Preview.ts:72
packages/ui/src/border-beam/BorderBeam.ts:105
packages/ui/src/steps/Rail.ts:10
packages/ui/src/steps/StepIcon.ts:43
packages/ui/src/table/hooks/use-filter.ts:310
packages/ui/src/table/engine/Table.ts:62
packages/ui/src/table/engine/Table.ts:311
packages/ui/src/table/engine/Footer.ts:19
packages/ui/src/table/engine/VirtualTable/BodyLine.ts:34
packages/ui/src/table/engine/VirtualTable/VirtualCell.ts:43
packages/ui/src/typography/CopyBtn.ts:73
packages/ui/src/typography/Editable.ts:81
packages/ui/src/anchor/AnchorLink.ts:51
packages/ui/src/select/Option.ts:20
packages/ui/src/select/engine/BaseSelect.ts:73
packages/ui/src/select/engine/Selector.ts:50
packages/ui/src/select/engine/TransBtn.ts:15
packages/ui/src/select/OptGroup.ts:16
packages/ui/src/statistic/Number.ts:38
packages/ui/src/breadcrumb/BreadcrumbItem.ts:215
packages/ui/src/modal/ConfirmDialog.ts:284
packages/ui/src/modal/engine/Panel.ts:53
packages/ui/src/modal/engine/Content.ts:38
packages/ui/src/modal/engine/Dialog.ts:72
packages/ui/src/modal/engine/Dialog.ts:96
packages/ui/src/modal/engine/DialogWrap.ts:62
packages/ui/src/modal/engine/DialogWrap.ts:82
packages/ui/src/modal/engine/Mask.ts:24
packages/ui/src/space/Item.ts:56
packages/ui/src/color-picker/components/ColorSlider.ts:108
packages/ui/src/color-picker/components/ColorSlider.ts:247
packages/ui/src/color-picker/engine/color-picker.ts:60
packages/ui/src/color-picker/engine/components/color-block.ts:29
packages/ui/src/upload/UploadList/ListItem.ts:62
packages/ui/src/upload/engine/AjaxUploader.ts:83
packages/ui/src/badge/ScrollNumber.ts:43`;

const files = [...new Set(hits.split('\n').map((l) => l.split(':')[0]))];
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  const live = [...s.matchAll(/props\.(className|rootClassName|style)\b/g)].map((m) => m[1]);
  const uniq = [...new Set(live)];
  const isInternal =
    /\/(engine|components|hooks)\//.test(f) ||
    /PurePanel|Item|Panel|Option|OptGroup|TreeNode|ListItem|CopyBtn|Editable|StepHandler|CalendarHeader|ConfirmDialog|ScrollNumber|Number|Rail|StepIcon|Progress|Looper|Indicator|TransBtn|BaseSelect|Selector|ItemHolder|DrawerSection|DrawerPopup|NoticeList|Notice|Mask|Dialog|Content|Panel|Notifications|BodyLine|VirtualCell|Footer|Table|AjaxUploader|BaseInput|TextArea|Input\.ts|Mentions|color-picker|ColorSlider|color-block|AnchorLink|BreadcrumbItem|TabNavList|TabPane|OperationNode|DescriptionsItem/.test(
      f,
    );
  console.log(
    `${isInternal ? 'INT' : 'TOP'} ${live.length ? 'LIVE' : 'DEAD'} ${f}` +
      (live.length ? `  consumes: ${uniq.join(',')}` : ''),
  );
}
