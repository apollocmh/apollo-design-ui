# @apollo-design/position

> **层**：L1 ｜ **风险**：high ｜ **Phase 2 实施顺序**：5
>
> 本文档声明本包的**职责边界**。边界之外的事情不做 —— 如果发现需要做，说明架构需要调整，
> 应当先修改 `ARCHITECTURE.md` 并记录 ADR。

---

## 职责

浮层定位几何。替代 @rc-component/trigger 与 rc-tooltip 的定位部分。**只做几何与尺寸测量**，触发时机与生命周期在 @apollo-design/overlay。

## 替代的 Ant Design 依赖

- `@rc-component/trigger（定位部分）`
- `@rc-component/tooltip（定位部分）`

## 公开 API

- placements：12 个方位（topLeft / top / topRight / bottomLeft / ...）
- 对齐计算：getAlignResult / getAlignOffset / getArrowOffset
- 边界处理：flip（翻转）/ shift（收缩）/ 滚动容器跟随（含祖先滚动链）
- 坐标解析：getPopupContainer / getDocument / 可视区与滚动区计算
- usePosition —— 把上述能力接到响应式目标与浮层元素上

## 明确不做（边界）

- ❌ 不实现触发时机与显隐延迟（那是 @apollo-design/overlay）
- ❌ 不实现挂载与 z-index（那是 @apollo-design/portal）
- ❌ 不实现任何视觉样式与 DOM 结构（只输出坐标数字）

## 必须遵守的契约

- ★ 定位结果必须与 antd 像素级一致（这是 AR1，本项目最大风险点）
- 纯几何部分必须可用无 DOM 的单测验证（坐标进 → 坐标出），只有尺寸测量需要 jsdom
- 必须支持翻转（flip）与自适应（shift）
- 箭头位置在 12 个方位下都正确

## 依赖

### 运行时依赖

| `@apollo-design/utils` | `workspace:*` |

### peer 依赖

| `vue` | `catalog:` |

### 构建期 / 测试依赖（devDependencies，**不会**进入用户的依赖树）

（无）

## 依赖约束（ARCHITECTURE.md §3.1）

- **R1 单向**：只能依赖同层或更低层
- **R2 无环**：不得与其他包循环依赖
- **R3 地基纯净**（仅 L0）：不得包含任何组件视觉语义
- **R4 引擎无视觉**（仅 L2）：不得定义颜色/圆角/阴影，不得产出 CSS
- **R6 显式声明**：跨包导入必须在本文件的 `dependencies` 中声明（`.npmrc` 已设 `hoist=false`）
- **R7 零 Ant Design 运行时依赖**：发布包的 `dependencies` 不得出现任何 `@ant-design/*`。
  Ant Design 生态包只允许出现在三处 —— ① 构建期数据源（`registry/tools/gen-*.mjs`）
  ② 测试 Oracle（`*.oracle.test.ts`）③ `devDependencies`。由 `registry:validate` 的 **E19** 强制。

本包的依赖已通过 `registry/tools/scaffold-packages.mjs` 的分层校验。

## ⚠️ 必须先做 PoC

AR1 —— 必须先做 PoC：topLeft/topRight/center/bottomLeft/bottomRight + 翻转 + 箭头，与 antd 参考截图逐像素比对

在 PoC 通过之前，不得开始依赖本包的组件开发。

## 测试

```bash
pnpm --filter @apollo-design/position test
pnpm --filter @apollo-design/position lint
```

测试要求见 [`TESTING.md`](../../TESTING.md)。
覆盖率下限为 语句 95% / 分支 90% / 函数 95%（L1 档位，见 `vitest.config.ts` 的 `coverage.thresholds`）。
