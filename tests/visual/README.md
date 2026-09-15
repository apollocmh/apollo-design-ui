# tests/visual — 视觉回归测试

> **Phase 1 交付设计；实现随 Phase 2 的 S8（Button）一起落地。**
>
> 设计细节见 [`TESTING.md`](../../TESTING.md) §9。

---

## 机制

```
React 参考（antd 6.6.4）              Vue 实现（@apollo-design/ui）
  渲染同一 fixture                        渲染同一 fixture
        │ Playwright 截图                     │
        ▼                                     ▼
  react/<id>.png                        vue/<id>.png
        └────────────────┬────────────────────┘
                         ▼
        sharp 归一化尺寸 → pixelmatch 逐像素比对
                         ▼
                差异率 + diff 图 + HTML 报告
```

## 与 `tests/compat` 的关系

| | `tests/compat` | `tests/visual` |
|---|---|---|
| 范围 | 5 层（API / DOM / ARIA / Behavior / Screenshot） | 只做 Screenshot（L4） |
| 运行器 | jsdom（快） | 真实浏览器 Playwright（慢） |
| 用途 | 每次提交都跑 | 组件完成时跑（G9 Gate） |
| 截图来源 | 复用本目录的截图产物 | 产出截图 |

**分工**：`tests/visual` 负责**产出**两侧截图与像素比对；`tests/compat` 的 `screenshot` 断言复用它的结果。

## 计划交付

| 文件 | 作用 |
|---|---|
| `run.mjs` | 入口：起本地页面 → Playwright 截图 → 比对 → 出报告 |
| `matrix.mjs` | 截图矩阵定义（状态 × 主题 × viewport） |
| `stabilize.mjs` | 稳定性处理：禁用动画、固定字体、隐藏 caret、固定随机值 |
| `compare.mjs` | `sharp` 归一化 + `pixelmatch` 比对 + 差异分类 |
| `report.mjs` | 生成 HTML 报告 |

## 截图矩阵（最低要求）

| 维度 | 取值 |
|---|---|
| 状态 | default / hover / active / focus / disabled / loading / dark / compact |
| 组件特性追加 | open / selected / checked / error / warning / success / expanded / dragging / empty / readonly |
| 主题 | light / dark / compact |
| viewport | 375×667 / 768×1024 / 1440×900 |

## 稳定性要求（缺一不可）

- 注入 `prefers-reduced-motion` + 关闭 motion 开关
- 打包测试字体（避免系统字体差异）
- 固定 viewport / devicePixelRatio / 时区 / locale
- 隐藏 caret
- 固定随机 ID 与时间戳
- 截图前 `await waitForFonts()` + 等一帧

## 阈值

| 差异率 | 判定 |
|---|---|
| 0% | ✅ 通过 |
| ≤ 0.1% 且为抗锯齿噪声（分散单像素） | ✅ 自动通过 |
| > 0.1% 或成块差异 | ❌ 必须人工确认并分类 |

**禁止**为提高阈值让测试通过（`TESTING.md` T17）。

## 待用户裁决

视觉回归的基线截图是否纳入 git（Q6）。1148 个 demo × 多状态 × 3 viewport × 3 主题体积可能很大。
建议：只对已实现组件生成基线，存 git-lfs 或 CI artifact，不全量纳入。
