# H04 · Demo order 元数据整改（2026-10-24）

## 范围与方法

文档构建已确认 303 个 Demo 缺少数字 order，原行为把它们放在有显式 order 的示例之后，再按文件名排序。本批只补这些 Markdown frontmatter；不修改 Vue 示例、正文、翻译、预览参数、内容生成器、告警阈值或日志。

以当前已生成的 72 组件 / 994 Demo 序列作为顺序基线。每个组件保留已有有效 order，为缺失项按原序列分配大于该组件现有最大 order 的连续整数；全缺失的组件从 0 开始。已有 frontmatter 仅插入 order，无 frontmatter 的文件增加该头部，保留 BOM/换行和解析后的正文。变更前预检数量必须恰好为 303；遇到无效但已存在的 order 键则拒绝自动覆盖。

逐文件解析比较：除新增 order 外的 metadata 与 body 必须相等。随后调用实际 buildManifest，对全部页面的序列、标题、描述/HTML、预览配置、源码、搜索索引与 manifest 比较，允许的差异只有 Demo order 数值和生成时间。异常时自动还原本次所有 Markdown 修改。

初次比较发现内存中的 undefined 字段与落盘 JSON 的差异，以及不同初始化状态下的代码高亮 token 标签差异。最终使用同一初始化完成的生成器作前后对比，并按实际 JSON 输出序列化；保留完整页面相等断言，没有删除正文/源码/高亮结果的校验。此处只调整实验条件，不修改产品高亮器。

## 结果与验证

303 个 Markdown（21 个组件）只增加 order，合计 883 行。72 组件 / 994 Demo 的排序、内容与索引前后比较通过，元数据 notes 为 0。来源提交及逐文件新值记录于 [机器证据](evidence/demo-order-2026-10-24.json)。

前后序列 SHA-256 均为 `9b488c93ad0bc8ae4187a59dc5eb4b5f3e54583d1f196486d800da82682ee332`。

最终检查均已真实执行（Node 22.22.2 / pnpm 12.4.2）：

| 检查 | 结果 |
|---|---|
| 同条件 buildManifest 前后比较 | 全部 72 组件页面除 order 外相等；顺序和搜索索引相等，notes=0 |
| 基准提交逐文件复核 | 303 个 metadata/body 等值；每个新 order 与机器证据一致 |
| 最终 .generated 序列哈希 | 与基准一致，72 组件 / 994 Demo |
| `pnpm --filter @apollo-design/docs run build` | client/server 与 SSG 84 路由通过，无 order 缺失/内容规范化提示 |
| `pnpm --filter @apollo-design/docs run test` | 14 文件 157 条通过，使用本次新生成数据 |
| `pnpm --filter @apollo-design/docs run typecheck` | 通过 |
| `pnpm --filter @apollo-design/docs run content:check` | 72 组件通过，零元数据提示 |
| `pnpm run test:tooling` | 8 条通过 |
| `pnpm run registry:check` | 19 项通过，vue-native 历史 24 fixed / 0 open |
| `pnpm run audit:content-slots:check` | 496 行清单无漂移，12 verified；无组件状态升级 |
| JSON 解析/变更路径与哈希校验、`git diff --check` | 全部通过；JSON 标准序列化与 303 个实际改动路径完全一致 |

JSON 证据位于 Biome 既有排除目录，因此未虚报该文件的 Biome 格式检查通过；使用显式 JSON 解析与结构/序列化校验替代。未修改 Biome 配置。本阶段只改元数据，没有重复运行无关 UI 运行时/全仓覆盖率门禁，也不据此宣称组件重新验收。

大 chunk 提示仍在，沿用原来的阈值与完整日志，未通过改配置消除警告。

## 边界

补齐 order 解决内容元数据缺失，不代表 H04 的大 app chunk 已优化完成。前一阶段的首屏请求、搜索索引和视口加载数据保持历史范围，不把数值补齐宣称为首屏提速。历史报告中 303 条提示描述的是对应提交时的观察，本批另行记录当前状态。


额外线索：在直接比较先前落盘 JSON 和一次新初始化生成结果时，观察到代码高亮 token 颜色/标签分段差异。未改动高亮器，未宣称这类跨状态输出的确定性已修复；本批的完整页面等值证明限定在相同初始化状态下。原始源码、MD body 和其他 frontmatter 另有独立逐文件等值检查，不依赖 token 高亮结果。
