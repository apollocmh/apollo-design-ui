# @apollo-design/position

浮层定位与 DOM 测量工具。输入目标矩形、浮层矩形、可见区域及对齐规则，输出偏移、箭头坐标和翻转结果。

## 安装

```bash
npm install @apollo-design/position vue
```

公开包保留已声明的 Vue peer 依赖；几何计算本身可在无 DOM 环境使用。

## 纯几何对齐

```ts
import { alignPopup } from '@apollo-design/position';

const area = { left: 0, top: 0, right: 800, bottom: 600 };
const result = alignPopup(
  {
    target: { x: 100, y: 100, width: 120, height: 32 },
    popup: { x: 0, y: 0, width: 200, height: 80 },
    visible: area,
    scroll: area,
  },
  { points: ['tl', 'bl'], offset: [0, 8], overflow: { adjustX: true, adjustY: true } },
);
console.log(result.offsetX, result.offsetY);
```

`offsetX` / `offsetY` 是相对浮层当前位置的位移，不是脱离坐标系的绝对 CSS 值。`points` 返回实际生效的对齐点；连续计算时保留并传回 `flip` 记忆。

## 主要入口

- `alignPopup`、`toAlignResult`：计算与归一化对齐结果。
- `measureAlign`、`measureRect`、`measureScale`：实际 DOM 矩形、缩放与容器坐标系测量。
- `collectScroller`、`getVisibleArea`、`getViewportArea`：滚动祖先和裁剪区域。
- `getPlacements`：生成包含箭头偏移与溢出策略的 12 方位配置。
- `Rect`、`Area`、`AlignContext`、`AlignType`、`AlignResult`：公开几何类型。

测量函数在客户端实际元素上使用。调用方负责安排滚动/尺寸变化后的重新测量，以及把结果写入元素样式。显隐事件属于 overlay，挂载容器属于 portal；本包没有 `usePosition` 组合函数或可视组件。

## 文档与维护

[公开导出](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/position/src/index.ts) · [项目规范](https://github.com/apollocmh/apollo-design-ui/blob/master/AGENTS.md) · [测试要求](https://github.com/apollocmh/apollo-design-ui/blob/master/TESTING.md)
