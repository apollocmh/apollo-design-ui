# H03：Demo 当前统计与行列重排 · 2026-10-24

原 `demo-coverage-stage2.json` 历史证据未覆盖。刷新工具新增 --output，将本次快照独立写入 [demo-coverage-2026-10-24.json](evidence/demo-coverage-2026-10-24.json)。上游分母仍来自既有冻结清单，并非本日重新抓取上游。

当前 71 个可比较组件：990 个本地文件 / 1060 个参考文件，数量比 93.4%，30 个组件文件数较少；场景名称重合度仍为 83.8%。文档管线包括另 4 个不可直接比较的 QRCode Demo，共 994 个。以上只代表文件与名称，**不是能力或运行覆盖率**。

## 本批能力场景

| 场景 | 当前处理 | 证据 / 剩余行动 |
| --- | --- | --- |
| Badge 富 count/status 文本 | supported + demonstrated | content-slots 真实 SFC；F05 的数字/富内容分支、动态空内容、离场及窄屏浏览器通过 |
| Picker 实际 input 与格式 | supported + demonstrated | F01 input-attrs、既有 format；具体入口、label/键盘证据见 F01 报告，不把所有日期格式一并视为已验收 |
| Table 行拖放 | supported + demonstrated | 现有 onRow 透传 DOM 属性，消费端原生 drag/drop 更新 dataSource；生产浏览器真实 dragTo 通过 |
| Table 列重排 | supported + demonstrated | 现有 onHeaderCell 透传 DOM 属性，消费端更新 columns；表头重排后首行单元格仍匹配对应列，重置通过 |
| Table 无拖动替代 | supported + demonstrated | 行上/下、列左/右按钮与选择控件；真实键盘 Enter 操作通过 |
| Form.List 动态/嵌套 | existing-demo + needs-current-scenario-review | form-list、form-list-nested 已存在；本批未重新运行整套表单浏览器，不据文件存在关闭多表单等能力缺口 |
| List 拖放 | requires-design-review | 本批未确认内建拖拽 API；先评估现有 item attrs/slot 能否用原生交互组合，不把未核实支持的能力写成完成 |
| Splitter 重置/嵌套 Tabs | needs-current-scenario-review | control 示例存在；具体重置、嵌套状态保留另行实测，不以文件计数关账 |
| Collapse 自定义 icon | needs-current-scenario-review | custom 示例当前主要展示 items 富内容/extra；不据名称误判已覆盖 expandIcon 动态场景 |
| OSS、外部裁剪及 debug-only | individual-exception-review | 未批量补外部依赖示例，后续逐项记录是否可用本地 mock 或属设计范围之外 |

Table 新增成对 `demo/drag-reorder.vue/.md`，仅组合现有能力，没有向组件加入虚构 drag prop 或第三方运行时。原生拖动按行/列分别接收，提供等效键盘操作与 reset。示例按当前公开 Table 的 Record 数据契约编写，columns 使用 satisfies 保留具体 key 类型，没有用 any 或断言跳过严格检查。

## 已运行验证

- `node tests/browser/vue-reactivity.mjs`：真实原生行拖放、表头拖放、单元格对应关系、重置、等效键盘调整均通过，零页面错误；同时复验此前 F02/F04/F05/F07/F08/F09/F10 场景。
- Table Demo / axe 两文件 96 条通过，准确数量哨兵更新为 44；无新增豁免或阈值变更。
- 新增示例后的根严格类型、最终文档 994 个 Demo/84 路由、内容检查与文档最终 157 条测试通过；见 [共享交付门禁](2026-10-24-dom-attrs-remediation.md)。

H03 尚未完成全量能力矩阵；既有 72/72 completed 和文件数量均未当作新的运行验收。
