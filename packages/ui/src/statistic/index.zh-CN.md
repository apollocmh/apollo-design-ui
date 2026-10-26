---
category: 数据展示
title: Statistic
subtitle: 统计数值
---

展示统计数值；Timer按目标时间计时。内容通过Vue插槽表达，数值与计时由调用者传入，没有v-model或内置数字动画。

## 代码演示

原7个示例包含基本值/骨架、单位、卡片布局、原生值格式化、可重启/切换方向的计时、语义样式和当前组件Token。`animated`保留原链接，实际演示自定义数值格式；不声称内置动画。

## Statistic Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| prefixCls | 当前类名前缀；任意自定义前缀需自行提供对应静态CSS | `string` | Provider前缀+`-statistic` |
| value | 原始数值；非数字文本原样显示 | `number \| string` | `0` |
| title / prefix / suffix | 文本后备；同名槽存在时优先，空槽也压制后备 | `string` | — |
| precision | 截取/补零的小数位，负数取0，小数向零取整，非有限数忽略；不执行四舍五入 | `number` | 保留原小数 |
| decimalSeparator | 小数点文本 | `string` | `'.'` |
| groupSeparator | 字面分组文本（包括`$`），不解释替换转义 | `string` | `','` |
| loading | 骨架代替数值正文；正文卸载，恢复时重建 | `boolean` | `false` |
| valueStyle | 既有废弃别名；`styles.content`优先，初始化传入时保留既有开发警告 | `CSSProperties` | — |
| classNames / styles | 七语义落点的对象或`({ props }) => 对象`；读取当前props与Provider | 见导出类型 | — |
| onMouseenter / onMouseleave | 根元素原生鼠标监听，也可写`@mouseenter`/`@mouseleave` | `(event: MouseEvent) => void` | — |

### Slots

| 插槽 | 作用域 | 说明 |
|---|---|---|
| title / prefix / suffix | 无 | 完整Vue内容；有意为空不会回退文本prop |
| value | `{ value: number \| string, text: string }` | 原始值和按当前精度/分隔符格式化的文本；直接使用模板/原生控件，不传内部VNode |

```vue
<Statistic :value="balance" :precision="2">
  <template #value="{ value, text }">
    <strong>{{ text }}</strong><small>{{ currency }}</small>
  </template>
</Statistic>
```

数值槽保留`value`语义容器及其class/style；空槽得到空容器。变化的value、格式和相邻槽不替换槽内原生输入；切换loading会卸载正文。

## Statistic.Timer / StatisticTimer

共用上述展示字段、三个文本槽和七语义落点；不接受数值专属的precision/decimalSeparator/groupSeparator。计时文本使用format，自定义内容使用`#value`。

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| type | 必填方向，可动态切换 | `'countdown' \| 'countup'` | — |
| value | 目标时间戳或Date可解析字符串；倒计时传未来、正计时传过去 | `number \| string` | `0` |
| format | Y/M/D/H/m/s/S单位、重复字母补零、`[字面文本]`转义；年/月按固定365/30天计算 | `string` | `'HH:mm:ss'` |

| 事件 | 载荷 | 时机 |
|---|---|---|
| change | 非负毫秒`number` | 挂载后立即及每帧（约1000/60ms）更新；无效目标和SSR不触发 |
| finish | 无 | countdown到0时每周期一次，在change(0)之后停止；修改目标或方向开启新周期 |

Timer的`#value`作用域为`{ value, text, duration, type }`。value为目标原值，duration为当前非负毫秒；挂载前或日期无效时为null，text为`'-'`。其它三个槽直接转发。

SSR与客户端水合首帧均为`'-'`，挂载后使用当前Date.now启动定时器；无效日期不调度，恢复有效目标后重新启动，卸载清理。format变化不重新触发已结束周期。后台标签页可能降低回调频率，每次读实际时间，不累计帧误差。

### Statistic.Countdown / StatisticCountdown

既有固定倒计时导出，支持相同的展示字段、format、槽、事件及ref；无需传type。保留既有开发废弃提示，不新增兼容函数通道。具名导出和静态子组件引用相同实现，均有真实类型。

## Attrs、Ref、Provider与主题

三个组件的class/style、id/tabindex、ARIA/data及普通原生监听均落实际根div；style支持字符串、数组和对象。Timer的change/finish是业务事件，内部原生输入的change不会冒充时长通知。`nativeElement: HTMLDivElement | null`返回实际根，卸载后为null。

七落点为root/header/title/content/value/prefix/suffix。Provider使用`components.statistic`的className/style/classNames/styles；当前配置替换或删除即时生效，局部语义配置优先，原生attrs样式最后覆盖。源主题使用`theme.components.Statistic`；最近Provider、RTL与相邻实例保持隔离。

| Component Token | 默认值 | CSS变量 |
|---|---|---|
| titleFontSize | 当前fontSize（默认14） | `--apollo-statistic-title-font-size` |
| contentFontSize | 当前fontSizeHeading3（默认24） | `--apollo-statistic-content-font-size` |

两Token接受非负有限数字，动态删除后恢复当前Alias。原生CSS变量优先，源主题变化不替换编辑器。自定义色值的对比度由调用者负责；没有默认60Hz aria-live播报，调用者可按业务选择通知方式。
