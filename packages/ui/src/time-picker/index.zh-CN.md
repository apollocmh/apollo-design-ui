---
category: 数据录入
title: TimePicker
subtitle: 时间选择框
---

输入或选择单个时间，使用 `TimeRangePicker` 选择时间区间。

> 2026-10-30 当前契约：两种入口均固定为时间轴。支持 `v-model:value`、`v-model:open`、`v-model:pickerValue`；移除无效的 `mode/defaultMode/update:mode` 声明。动态内容使用原生具名槽，通知使用 emits，DOM 句柄可为 null。

## 代码演示

见 [demo](./demo) 的 16 个实际场景。

## API

| 参数 | 说明 | 默认值 |
|---|---|---|
| value / defaultValue | Dayjs 时间值；单值可为 null，区间是两个端点 | — |
| open / defaultOpen | 当前开合 / 非受控初始开合 | — |
| pickerValue / defaultPickerValue | 面板浏览时间 / 初始浏览时间 | — |
| defaultOpenValue | 空值时的时间面板模板，不直接提交为值 | — |
| format | 格式串、格式函数或掩码格式；默认显示时、分、秒 | `HH:mm:ss` |
| use12Hours | 显示上下午列 | `false` |
| showHour / showMinute / showSecond / showMillisecond | 当前显示的时间列，未指定时结合 format 推导 | — |
| hourStep / minuteStep / secondStep / millisecondStep | 档位步长 | `1` |
| disabledTime | 当前时间的禁用档位；范围版另收 range 与 `{ from }` | — |
| hideDisabledOptions | 隐藏禁用档位 | `false` |
| needConfirm | 显式确认后提交；false 时离开面板提交 | `true` |
| changeOnScroll | 滚动停止 300ms 后选中最近的可用档位 | `false` |
| inputReadOnly | 禁止键入，保留面板鼠标与键盘选择 | `false` |
| allowClear | 清除按钮，支持 `{ clearIcon }` | `true` |
| disabled / size / status / variant | 禁用、尺寸、校验状态与变体 | variant 为 `outlined` |
| classNames / styles | 当前语义类名/样式，支持函数形态 | — |
| prefix / suffixIcon / clearIcon | 静态装饰内容，也可用同名槽 | 默认后缀为时钟 |
| placeholder / locale | 提示与当前语言配置 | `Select time` |
| presets | 预设时间；value 支持按交互时刻懒求值 | — |

`TimeRangePicker` 另支持 `separator`、`allowEmpty` 与两端的 disabled 配置。它不提供日期导航、多选标签或面板粒度切换。

`id/name/required/autoComplete/autoFocus/tabIndex` 和 `aria-*` 绑定实际输入框；`class/style/data-*` 绑定根。区间 id 字符串只绑定起点，`{ start, end }` 分别绑定两端。实例暴露 `nativeElement/focus/blur`，区间另有 `startInput/endInput`，元素在挂载前和卸载后为 null。

## 事件与插槽

`change/update:value`、`openChange/update:open`、`pickerValueChange/update:pickerValue` 同时通知语义变化与模型提案。受控父级拒绝提案后不会写入隐藏值，撤控保留最后接受值。还有 `calendarChange/ok/clear/focus/blur/invalid/panelChange`；单值另有 `select`。`keydown` 只收到一个原生 KeyboardEvent，`preventDefault()` 可取消内部行为。

单值支持 `prefix/suffixIcon/clearIcon/panelRender/extraFooter/cellRender/presetRender` 七个槽，范围版再加 `separator`。其中 cellRender 收 `{ current, info }`，panelRender 收 `{ originPanel }`，extraFooter 收 `{ mode }`；显式空槽保持为空，槽增删即时生效。旧渲染函数 props 和 addon 已移除。

只读输入按 ArrowDown 进入面板，方向键在可用档位间导航，Enter/Space 选值，Escape 返回原输入。默认确认制下可继续到 OK 按钮确认。

## 配置与样式

两种 Time 入口都读取当前 `components.timePicker` 的语义配置、root class/style、variant、图标与 separator。输入提示读取当前 `locale.TimePicker`，本地 placeholder 与 locale 中的明确值优先。`datePicker/rangePicker` 配置不会泄漏进来。普通 Date Range 仍读取 `rangePicker` 配置。

TimePicker 复用 DatePicker 的静态 CSS 和主题变量，没有独立 Component Token、样式表或 PurePanel。`popupClassName/popupStyle/bordered/dropdownClassName` 保留已声明的废弃入口，优先使用语义样式与 variant。

`TimePickerWithRange.RangePicker` 与具名 `TimeRangePicker` 指向同一组件。
