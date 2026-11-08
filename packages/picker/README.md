# @apollo-design/picker

日期与时间面板引擎，提供日期适配、面板网格、键盘偏移、范围规则和 Vue 面板组件。DatePicker、TimePicker 与 Calendar 的共享日期行为由此包承载。

## 安装

```bash
npm install @apollo-design/picker dayjs vue
```

普通应用使用 `@apollo-design/ui` 中的日期组件。本包面向自定义面板与组件作者，不包含输入框、弹出容器或主题 CSS。

## 日期适配

```ts
import dayjs from 'dayjs';
import { dayjsGenerateConfig } from '@apollo-design/picker';

const date = dayjs('2026-01-15');
const next = dayjsGenerateConfig.addMonth(date, 1);
console.log(dayjsGenerateConfig.locale.format('en_US', next, 'YYYY-MM-DD'));
// 2026-02-15
```

`GenerateConfig<DateType>` 描述取值、运算、比较和格式化接口；内置 `dayjsGenerateConfig` 使用 Day.js。日期库语言资源按应用所需加载。

## 面板与算法

| 类别 | 入口示例 |
| --- | --- |
| 组合面板 | `PickerPanel`、`DateTimePanel` |
| 日期粒度 | `DatePanel`、`WeekPanel`、`MonthPanel`、`QuarterPanel`、`YearPanel`、`DecadePanel` |
| 时间 | `TimePanel`、`TimePanelBody`、`TimeColumn` |
| 日期与区间 | `isSameDate`、`isInRange`、`orderDates`、`validateRangeSubmit` |
| 网格与键盘 | `buildPanelCells`、`getPanelGeometry`、`offsetCellValue` |
| 时间禁用规则 | `getTimeInfo`、`findValidateTime` |

面板通过 Vue props、插槽与 provide/inject 协作，输出结构和 ARIA；自定义单元格应保留导航、选择与可访问语义。使用 `PanelSlots`、`SharedPanelProps` 等公开类型对接完整面板契约。

本包不自动提供输入解析交互、输入掩码、浮层定位、动画或视觉规则。需要成品体验时由 UI 日期组件组合这些能力。

## 文档与维护

[公开导出](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/picker/src/index.ts) · [项目规范](https://github.com/apollocmh/apollo-design-ui/blob/master/AGENTS.md) · [测试要求](https://github.com/apollocmh/apollo-design-ui/blob/master/TESTING.md)
