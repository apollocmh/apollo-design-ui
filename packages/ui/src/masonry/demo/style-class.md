---
order: 5
title:
  zh-CN: 自定义样式
  en-US: Custom Style
---

`classNames` / `styles` 两个语义槽都支持**对象**与**函数**两种形态；
函数形态的入参 `props.columns` 是**解析后的列数**（不是原始 prop）。

`styles` 使用原生 CSS 值：`height`、`padding`、`borderRadius` 等非零长度需显式单位，
如 `'260px'`、`'20px'`、`'12px'`；`opacity` 等无单位属性仍可用数字。
这与 `gutter` 等组件尺寸参数的数字像素约定不同。显式根高度会覆盖测量高度，须能容纳所有卡片。

`styles` uses native CSS values. Give nonzero lengths such as height, padding and border radius explicit units;
unitless properties such as opacity may remain numeric. An explicit root height overrides the measured height and must contain every tile.

⚠️ 与 antd 的 demo 的差异：上游用 `antd-style` 的 `createStaticStyles` 生成类名，
本仓没有这个依赖 ⇒ 用普通类名替换；`Flex` / `Divider` / `Typography` 换成原生元素。
**缺口登记在 `README.md` §7。**
